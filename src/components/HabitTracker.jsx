import { useState, useMemo, useCallback, useEffect } from "react";
import { toISO, uid, addDays, fromISO } from "../utils/dates.js";

const today = toISO(new Date());

const FREQ_LABELS = { daily: "Daily", weekly: "Weekly", custom: "Custom" };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

const COLORS = [
  "#6978FF", "#42C99A", "#F4B860", "#F16D7A", "#A78BFA",
  "#34D399", "#FB923C", "#60A5FA", "#E879F9", "#F87171",
];

function normalizeHabit(raw) {
  return {
    id: raw.id || uid(),
    name: String(raw.name || "New habit").trim(),
    frequency: raw.frequency || "daily",
    days: Array.isArray(raw.days) ? raw.days : [0, 1, 2, 3, 4, 5, 6],
    color: raw.color || COLORS[0],
    archived: !!raw.archived,
    createdAt: raw.createdAt || new Date().toISOString(),
    remindAt: raw.remindAt || "",
    description: raw.description || "",
  };
}

function computeStreak(logs, habitId) {
  const doneDates = logs
    .filter(l => l.habitId === habitId && l.done)
    .map(l => l.date)
    .sort()
    .reverse();
  if (!doneDates.length) return 0;
  let streak = 0;
  let cursor = today;
  for (const date of doneDates) {
    if (date === cursor) { streak++; cursor = addDays(cursor, -1); }
    else if (date < cursor) break;
  }
  return streak;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(toISO(new Date(year, month, d)));
  }
  return { days, startDow: first.getDay() };
}

function isDueOnDate(habit, dateStr) {
  if (habit.archived) return false;
  const d = fromISO(dateStr);
  const dow = d.getDay();
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekly" || habit.frequency === "custom") {
    return (habit.days || []).includes(dow);
  }
  return false;
}

/* ── Form ── */
function HabitForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [frequency, setFrequency] = useState(initial?.frequency || "daily");
  const [days, setDays] = useState(initial?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [remindAt, setRemindAt] = useState(initial?.remindAt || "");
  const [description, setDescription] = useState(initial?.description || "");

  const toggleDay = (d) => setDays(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  );

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(normalizeHabit({ ...initial, name, frequency, days, color, remindAt, description }));
  };

  return (
    <form className="habit-form" onSubmit={submit}>
      <div className="form-row">
        <label>Habit name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning run" required autoFocus />
      </div>
      <div className="form-row">
        <label>Description (optional)</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description…" />
      </div>
      <div className="form-row">
        <label>Frequency</label>
        <select value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly (select days)</option>
          <option value="custom">Custom days</option>
        </select>
      </div>
      {(frequency === "weekly" || frequency === "custom") && (
        <div className="form-row">
          <label>Active days</label>
          <div className="day-picker">
            {DAY_NAMES.map((dn, i) => (
              <button key={i} type="button"
                className={`day-btn${days.includes(i) ? " active" : ""}`}
                onClick={() => toggleDay(i)}>{dn}</button>
            ))}
          </div>
        </div>
      )}
      <div className="form-row">
        <label>Color</label>
        <div className="color-swatches">
          {COLORS.map(c => (
            <button key={c} type="button"
              className={`color-swatch${color === c ? " active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <div className="form-row">
        <label>Reminder time (optional)</label>
        <input type="time" value={remindAt} onChange={e => setRemindAt(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn sm ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn sm primary">{initial?.id ? "Save changes" : "Add habit"}</button>
      </div>
    </form>
  );
}

/* ── Month calendar for a single habit ── */
function HabitMonthCal({ habit, logs }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { days, startDow } = getMonthDays(year, month);
  const doneDates = new Set(logs.filter(l => l.habitId === habit.id && l.done).map(l => l.date));

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="habit-month-cal">
      <div className="cal-nav-row">
        <button className="btn sm ghost" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{monthLabel}</span>
        <button className="btn sm ghost" onClick={nextMonth}>›</button>
      </div>
      <div className="habit-cal-grid">
        {DAY_NAMES.map(d => <div key={d} className="habit-cal-header">{d}</div>)}
        {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(date => {
          const due = isDueOnDate(habit, date);
          const done = doneDates.has(date);
          const isFuture = date > today;
          return (
            <div key={date}
              className={`habit-cal-day${done ? " done" : ""}${due && !done && !isFuture ? " missed" : ""}${!due ? " no-due" : ""}${date === today ? " is-today" : ""}`}
              title={date}
              style={done ? { background: habit.color + "33", borderColor: habit.color } : undefined}>
              {new Date(date + "T00:00").getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function HabitTracker({ habits, habitLogs, onAddHabit, onUpdateHabit, onDeleteHabit, onToggleLog }) {
  const [tab, setTab] = useState("today"); // today | all | calendar
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [expandedHabit, setExpandedHabit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const todayHabits = useMemo(() =>
    habits.filter(h => !h.archived && isDueOnDate(h, today)), [habits]);

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);

  const isLoggedToday = (habitId) =>
    habitLogs.some(l => l.habitId === habitId && l.date === today && l.done);

  const todayDone = todayHabits.filter(h => isLoggedToday(h.id)).length;
  const todayTotal = todayHabits.length;
  const todayPct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;

  const handleSaveHabit = (habit) => {
    if (habit.id && habits.find(h => h.id === habit.id)) {
      onUpdateHabit(habit.id, habit);
    } else {
      onAddHabit(habit);
    }
    setShowForm(false);
    setEditHabit(null);
  };

  const handleEdit = (h) => { setEditHabit(h); setShowForm(true); };

  const handleArchive = (id) => {
    const h = habits.find(x => x.id === id);
    if (h) onUpdateHabit(id, { ...h, archived: !h.archived });
  };

  const handleDelete = (id) => {
    onDeleteHabit(id);
    setConfirmDelete(null);
  };

  const last7 = getLast7Days();

  return (
    <div className="habit-page">
      {/* Header */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Habit Tracker</h2>
          <p className="section-subtitle">Build consistent habits one day at a time.</p>
        </div>
        <button className="btn primary" onClick={() => { setEditHabit(null); setShowForm(true); }}>
          + New habit
        </button>
      </div>

      {/* Summary bar */}
      {todayTotal > 0 && (
        <div className="card habit-summary-card">
          <div className="habit-summary-row">
            <div>
              <div className="habit-summary-label">Today's progress</div>
              <div className="habit-summary-count">{todayDone} / {todayTotal} habits</div>
            </div>
            <div className="habit-summary-pct" style={{ color: todayPct >= 100 ? "var(--success)" : "var(--accent)" }}>
              {todayPct}%
            </div>
          </div>
          <div className="prod-bar" style={{ marginTop: 8 }}>
            <div className="prod-bar-fill" style={{ width: `${todayPct}%`, background: todayPct >= 100 ? "var(--success)" : undefined }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="view-tabs" style={{ marginBottom: 20 }}>
        {[["today", "Today"], ["all", "All Habits"], ["calendar", "Calendar"]].map(([k, l]) => (
          <button key={k} className={`view-tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* New/Edit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "1rem" }}>{editHabit ? "Edit habit" : "New habit"}</h3>
          <HabitForm
            initial={editHabit}
            onSave={handleSaveHabit}
            onCancel={() => { setShowForm(false); setEditHabit(null); }}
          />
        </div>
      )}

      {/* TODAY TAB */}
      {tab === "today" && (
        <div>
          {todayHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <h3>No habits for today</h3>
              <p>Create your first habit to start building consistency.</p>
              <button className="btn primary" onClick={() => setShowForm(true)}>+ Add habit</button>
            </div>
          ) : (
            <div className="habit-list">
              {todayHabits.map(h => {
                const done = isLoggedToday(h.id);
                const streak = computeStreak(habitLogs, h.id);
                return (
                  <div key={h.id} className={`habit-item${done ? " habit-done" : ""}`}>
                    <button
                      className="habit-check"
                      style={{ borderColor: h.color, background: done ? h.color : "transparent" }}
                      onClick={() => onToggleLog(h.id, today, !done)}
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                    >
                      {done && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M5 12.5 9.5 17 19 7.5" /></svg>}
                    </button>
                    <div className="habit-info">
                      <div className="habit-name" style={{ color: done ? "var(--muted)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>
                        {h.name}
                      </div>
                      {h.description && <div className="habit-desc">{h.description}</div>}
                    </div>
                    <div className="habit-meta">
                      {streak > 0 && <span className="habit-streak-pill">🔥 {streak}</span>}
                      <span className="tag" style={{ background: h.color + "22", color: h.color, borderColor: h.color + "44" }}>
                        {FREQ_LABELS[h.frequency]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 7-day mini grid */}
          {activeHabits.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: "0.9rem", marginBottom: 14, color: "var(--muted)" }}>Last 7 days</h3>
              <div className="habit-week-grid">
                <div className="habit-week-row habit-week-header">
                  <div className="habit-week-name" />
                  {last7.map(d => (
                    <div key={d} className="habit-week-day-label">
                      {DAY_NAMES[fromISO(d).getDay()]}
                    </div>
                  ))}
                </div>
                {activeHabits.map(h => {
                  const doneDates = new Set(habitLogs.filter(l => l.habitId === h.id && l.done).map(l => l.date));
                  return (
                    <div key={h.id} className="habit-week-row">
                      <div className="habit-week-name" title={h.name}>{h.name}</div>
                      {last7.map(d => {
                        const due = isDueOnDate(h, d);
                        const done = doneDates.has(d);
                        const future = d > today;
                        return (
                          <div key={d} className="habit-week-cell"
                            title={`${h.name} — ${d}`}>
                            {due && !future && (
                              <div className="habit-week-dot"
                                style={{ background: done ? h.color : "var(--elevated)", border: `1px solid ${done ? h.color : "var(--line)"}` }} />
                            )}
                            {(!due || future) && <div className="habit-week-dot" style={{ opacity: 0.15, background: "var(--line)" }} />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL HABITS TAB */}
      {tab === "all" && (
        <div>
          {activeHabits.length === 0 && archivedHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No habits yet</h3>
              <p>Create a habit to start tracking your progress.</p>
              <button className="btn primary" onClick={() => setShowForm(true)}>+ Add habit</button>
            </div>
          ) : (
            <>
              {activeHabits.length > 0 && (
                <div className="habit-list">
                  {activeHabits.map(h => {
                    const streak = computeStreak(habitLogs, h.id);
                    const totalDone = habitLogs.filter(l => l.habitId === h.id && l.done).length;
                    const isExp = expandedHabit === h.id;
                    return (
                      <div key={h.id} className="habit-card">
                        <div className="habit-card-top" onClick={() => setExpandedHabit(isExp ? null : h.id)}>
                          <div className="habit-color-bar" style={{ background: h.color }} />
                          <div className="habit-card-info">
                            <div className="habit-name">{h.name}</div>
                            <div className="habit-card-meta">
                              <span>{FREQ_LABELS[h.frequency]}</span>
                              {streak > 0 && <span className="habit-streak-pill">🔥 {streak} day streak</span>}
                              <span>{totalDone} completions</span>
                            </div>
                          </div>
                          <div className="habit-card-actions" onClick={e => e.stopPropagation()}>
                            <button className="btn sm ghost" onClick={() => handleEdit(h)}>Edit</button>
                            <button className="btn sm ghost" onClick={() => handleArchive(h.id)}>Archive</button>
                            <button className="btn sm ghost danger" onClick={() => setConfirmDelete(h.id)}>Delete</button>
                          </div>
                        </div>
                        {isExp && (
                          <div style={{ padding: "0 16px 16px" }}>
                            <HabitMonthCal habit={h} logs={habitLogs} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {archivedHabits.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>Archived</h3>
                  <div className="habit-list">
                    {archivedHabits.map(h => (
                      <div key={h.id} className="habit-card" style={{ opacity: 0.6 }}>
                        <div className="habit-card-top">
                          <div className="habit-color-bar" style={{ background: h.color }} />
                          <div className="habit-card-info">
                            <div className="habit-name">{h.name}</div>
                          </div>
                          <div className="habit-card-actions">
                            <button className="btn sm ghost" onClick={() => handleArchive(h.id)}>Restore</button>
                            <button className="btn sm ghost danger" onClick={() => setConfirmDelete(h.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CALENDAR TAB */}
      {tab === "calendar" && (
        <div>
          {activeHabits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>No habits to display</h3>
              <p>Add habits to see them on the calendar.</p>
              <button className="btn primary" onClick={() => setShowForm(true)}>+ Add habit</button>
            </div>
          ) : (
            <div className="habit-cal-list">
              {activeHabits.map(h => (
                <div key={h.id} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                    <strong>{h.name}</strong>
                    <span className="tag" style={{ marginLeft: "auto" }}>{FREQ_LABELS[h.frequency]}</span>
                  </div>
                  <HabitMonthCal habit={h} logs={habitLogs} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box sm" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Delete habit?</h3>
            <p style={{ color: "var(--muted)", margin: "10px 0 20px" }}>
              This will permanently delete the habit and all its logs. This cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn sm ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn sm danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

