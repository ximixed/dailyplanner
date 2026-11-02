import { useState, useMemo } from "react";
import { toISO, fromISO, addDays, fmtCountdown } from "../utils/dates.js";

const today = toISO(new Date());

const PRIORITY_ORDER = { urgent: 0, high: 1, med: 2, low: 3 };

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fmtTime12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function generateSuggestions(tasks) {
  // Filter: today's tasks that are not done and not archived
  const eligible = tasks.filter(t =>
    !t.done && !t.archived &&
    (t.date === today || (t.dueDate && t.dueDate <= today))
  );

  if (eligible.length === 0) return { suggestions: [], totalMin: 0, overloaded: false };

  // Sort: overdue first, then priority, then nearest due date, then duration shortest-first
  const sorted = [...eligible].sort((a, b) => {
    const aOver = a.dueDate && a.dueDate < today ? -1 : 0;
    const bOver = b.dueDate && b.dueDate < today ? -1 : 0;
    if (aOver !== bOver) return aOver - bOver;
    const priDiff = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (priDiff !== 0) return priDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (a.duration || 30) - (b.duration || 30);
  });

  const totalMin = sorted.reduce((sum, t) => sum + (t.duration || 30), 0);
  const overloaded = totalMin > 480;

  // Generate time slots starting at 09:00 with 10-min breaks + 30-min lunch
  let cursor = "09:00";
  const BREAK = 10;
  const LUNCH_AT = "12:00";
  const LUNCH_DUR = 30;
  let lunchAdded = false;

  const suggestions = sorted.map((task, i) => {
    const dur = task.duration || 30;
    // Add lunch break if we cross noon
    if (!lunchAdded && cursor >= LUNCH_AT) {
      cursor = addMinutes(cursor, LUNCH_DUR);
      lunchAdded = true;
    }
    const suggestedTime = cursor;
    cursor = addMinutes(cursor, dur + BREAK);

    const isOverdue = task.dueDate && task.dueDate < today;
    const reason = isOverdue
      ? `Overdue — was due ${fmtCountdown(task.dueDate)}`
      : i === 0
      ? "Highest priority task"
      : task.priority === "urgent" || task.priority === "high"
      ? `${task.priority} priority`
      : task.dueDate
      ? `Due ${fmtCountdown(task.dueDate)}`
      : `Task ${i + 1} in your queue`;

    return { taskId: task.id, task, suggestedTime, reason, accepted: false, skipped: false };
  });

  // Insert lunch break suggestion
  if (!lunchAdded && totalMin > 60) {
    suggestions.splice(
      suggestions.findIndex(s => s.suggestedTime >= LUNCH_AT),
      0,
      { type: "break", label: "Lunch break", suggestedTime: LUNCH_AT, duration: 30 }
    );
  }

  return { suggestions, totalMin, overloaded };
}

export default function DailyPlanner({ tasks, onUpdateTask }) {
  const [analysed, setAnalysed] = useState(false);
  const [items, setItems] = useState([]); // suggestion items with per-item state
  const [totalMin, setTotalMin] = useState(0);
  const [overloaded, setOverloaded] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(0);

  const handleAnalyse = () => {
    const { suggestions, totalMin: tm, overloaded: ov } = generateSuggestions(tasks);
    setItems(suggestions.map(s => ({ ...s, accepted: false, skipped: false })));
    setTotalMin(tm);
    setOverloaded(ov);
    setAnalysed(true);
    setAcceptedCount(0);
  };

  const handleAccept = (idx) => {
    const item = items[idx];
    if (!item || item.type === "break") return;
    onUpdateTask(item.taskId, { dueTime: item.suggestedTime });
    setItems(prev => prev.map((s, i) => i === idx ? { ...s, accepted: true } : s));
    setAcceptedCount(c => c + 1);
  };

  const handleSkip = (idx) => {
    setItems(prev => prev.map((s, i) => i === idx ? { ...s, skipped: true } : s));
  };

  const handleAcceptAll = () => {
    items.forEach((item, idx) => {
      if (!item.type && !item.accepted && !item.skipped) handleAccept(idx);
    });
  };

  const handleReset = () => {
    setAnalysed(false);
    setItems([]);
    setAcceptedCount(0);
  };

  const activeSuggestions = items.filter(s => !s.type && !s.accepted && !s.skipped);
  const todayTasks = tasks.filter(t => !t.done && !t.archived && (t.date === today || (t.dueDate && t.dueDate <= today)));

  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const totalLabel = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;

  return (
    <div className="planning-page">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Daily Planner</h2>
          <p className="section-subtitle">Get smart suggestions for organizing your day — accept or skip each one.</p>
        </div>
        {!analysed && (
          <button className="btn primary" onClick={handleAnalyse} disabled={todayTasks.length === 0}>
            ✨ Suggest my day
          </button>
        )}
        {analysed && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={handleReset}>↺ Reset</button>
            {activeSuggestions.length > 0 && (
              <button className="btn primary" onClick={handleAcceptAll}>Accept all</button>
            )}
          </div>
        )}
      </div>

      {!analysed && (
        <div className="card planning-intro">
          {todayTasks.length === 0 ? (
            <div className="empty-state" style={{ border: "none" }}>
              <div className="empty-state-icon">✅</div>
              <h3>All caught up!</h3>
              <p>You have no pending tasks for today. Add tasks to use the daily planner.</p>
            </div>
          ) : (
            <>
              <div className="planning-intro-icon">🗓️</div>
              <h3>Ready to plan your day?</h3>
              <p>
                You have <strong>{todayTasks.length}</strong> pending task{todayTasks.length !== 1 ? "s" : ""}.
                Click <strong>Suggest my day</strong> to get a personalized schedule with time slots.
              </p>
              <ul className="planning-how-list">
                <li>📊 Tasks are sorted by priority and deadlines</li>
                <li>⏱️ Time slots are estimated from task duration</li>
                <li>☕ Breaks are automatically included</li>
                <li>✅ Accept suggestions individually or all at once</li>
                <li>🚫 Nothing changes until you accept</li>
              </ul>
              <button className="btn primary" style={{ marginTop: 8 }} onClick={handleAnalyse}>✨ Suggest my day</button>
            </>
          )}
        </div>
      )}

      {analysed && (
        <div>
          {/* Summary cards */}
          <div className="planning-summary">
            <div className="planning-stat-card">
              <div className="planning-stat-value">{todayTasks.length}</div>
              <div className="planning-stat-label">Tasks to schedule</div>
            </div>
            <div className="planning-stat-card">
              <div className="planning-stat-value">{totalLabel}</div>
              <div className="planning-stat-label">Estimated time</div>
            </div>
            <div className="planning-stat-card">
              <div className="planning-stat-value" style={{ color: "var(--success)" }}>{acceptedCount}</div>
              <div className="planning-stat-label">Accepted</div>
            </div>
            <div className="planning-stat-card">
              <div className="planning-stat-value" style={{ color: "var(--muted)" }}>{activeSuggestions.length}</div>
              <div className="planning-stat-label">Remaining</div>
            </div>
          </div>

          {overloaded && (
            <div className="overload-warning">
              ⚠️ <strong>Heavy schedule detected</strong> — you have over 8 hours of tasks today. Consider moving some to tomorrow or reducing scope.
            </div>
          )}

          {/* Suggestion list */}
          <div className="suggestion-list">
            {items.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">✨</div>
                <h3>No suggestions available</h3>
                <p>All tasks already have scheduled times, or no eligible tasks were found.</p>
              </div>
            )}

            {items.map((item, idx) => {
              if (item.type === "break") {
                return (
                  <div key={`break-${idx}`} className="suggestion-break">
                    <span className="time-slot-badge">{fmtTime12(item.suggestedTime)}</span>
                    <span>☕ {item.label} ({item.duration} min)</span>
                  </div>
                );
              }

              const { task, suggestedTime, reason, accepted, skipped } = item;
              const PRI_COLORS = { urgent: "var(--danger)", high: "var(--warning)", med: "var(--accent)", low: "var(--success)" };

              return (
                <div key={task.id} className={`suggestion-card${accepted ? " accepted" : ""}${skipped ? " skipped" : ""}`}>
                  <div className="suggestion-card-left">
                    <span className="time-slot-badge">{fmtTime12(suggestedTime)}</span>
                    <div className="suggestion-info">
                      <div className="suggestion-title">{task.title}</div>
                      <div className="suggestion-meta">
                        <span style={{ color: PRI_COLORS[task.priority] || "var(--accent)" }}>
                          {task.priority || "med"}
                        </span>
                        {task.duration > 0 && <span>{task.duration} min</span>}
                        <span style={{ color: "var(--muted)" }}>{reason}</span>
                      </div>
                    </div>
                  </div>
                  <div className="suggestion-actions">
                    {accepted && <span className="suggestion-accepted-badge">✓ Accepted</span>}
                    {skipped && <span className="suggestion-skipped-badge">Skipped</span>}
                    {!accepted && !skipped && (
                      <>
                        <button className="btn sm ghost" onClick={() => handleSkip(idx)}>Skip</button>
                        <button className="btn sm primary suggestion-accept-btn" onClick={() => handleAccept(idx)}>
                          Accept
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 0 && items.every(s => s.type || s.accepted || s.skipped) && (
            <div className="card" style={{ textAlign: "center", padding: 32, marginTop: 8 }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎯</div>
              <h3>Planning complete!</h3>
              <p style={{ color: "var(--muted)", marginTop: 4 }}>
                {acceptedCount > 0
                  ? `${acceptedCount} task${acceptedCount !== 1 ? "s" : ""} scheduled. Head to Tasks or Calendar to see your plan.`
                  : "All suggestions skipped. You can re-run suggestions anytime."}
              </p>
              <button className="btn primary" style={{ marginTop: 16 }} onClick={handleReset}>↺ Re-run suggestions</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

