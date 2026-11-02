import { useState } from "react";
import { toISO, uid } from "../utils/dates.js";

const today = toISO(new Date());

export default function GoalsStreaks({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, streak, tasks, sessions }) {
  const [showForm, setShowForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState("daily-tasks");
  const [goalTarget, setGoalTarget] = useState(5);

  const todayTasks = tasks.filter(t => t.date === today);
  const todayDone = todayTasks.filter(t => t.done).length;
  const todayFocusSessions = sessions.filter(s => s.date === today && s.mode === "focus").length;
  const totalFocusMin = Math.round(sessions.filter(s => s.date === today && s.mode === "focus").reduce((a, s) => a + (s.duration || 0), 0) / 60);

  const GOAL_TYPES = {
    "daily-tasks":    { label: "Daily tasks completed", current: todayDone, unit: "tasks" },
    "focus-sessions": { label: "Focus sessions today",  current: todayFocusSessions, unit: "sessions" },
    "focus-minutes":  { label: "Focus time today",      current: totalFocusMin, unit: "minutes" },
  };

  const ACHIEVEMENTS = [
    { id: "first-task",   icon: "🌟", name: "First Task",    desc: "Complete your first task",              earned: tasks.some(t => t.done) },
    { id: "streak-3",     icon: "🔥", name: "On Fire",       desc: "3-day streak",                         earned: (streak?.current || 0) >= 3 },
    { id: "streak-7",     icon: "💎", name: "Diamond Week",  desc: "7-day streak",                         earned: (streak?.current || 0) >= 7 },
    { id: "focus-master", icon: "🎯", name: "Focus Master",  desc: "Complete 10 focus sessions",           earned: sessions.filter(s => s.mode === "focus").length >= 10 },
    { id: "task-100",     icon: "💯", name: "Century",       desc: "Complete 100 tasks",                   earned: tasks.filter(t => t.done).length >= 100 },
    { id: "task-10",      icon: "🏅", name: "Getting Started", desc: "Complete 10 tasks",                  earned: tasks.filter(t => t.done).length >= 10 },
    { id: "early-bird",   icon: "🌅", name: "Early Bird",    desc: "Add a task before 8am",                earned: false },
    { id: "planner",      icon: "📋", name: "Planner",       desc: "Have 5+ tasks on one day",             earned: false },
  ];

  const submitGoal = (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    onAddGoal({ id: uid(), title: goalTitle.trim(), type: goalType, target: Number(goalTarget), createdAt: new Date().toISOString() });
    setGoalTitle(""); setGoalType("daily-tasks"); setGoalTarget(5); setShowForm(false);
  };

  const getGoalProgress = (goal) => {
    const typeData = GOAL_TYPES[goal.type];
    const current = typeData?.current || 0;
    const pct = Math.min(100, Math.round((current / (goal.target || 1)) * 100));
    return { current, pct };
  };

  return (
    <div className="goals-page">
      {/* Streak banner */}
      <div className="streak-banner">
        <span className="streak-flame">🔥</span>
        <div className="streak-info">
          <h3>{streak?.current || 0} day streak</h3>
          <p>
            {streak?.current >= 1 ? `Keep it up! You've been productive for ${streak.current} day${streak.current !== 1 ? "s" : ""} in a row.` : "Complete tasks today to start your streak!"}
          </p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Best streak</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{streak?.best || 0}</div>
        </div>
      </div>

      {/* Today's progress */}
      <div className="card">
        <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Today's progress</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ textAlign: "center", padding: 12, background: "var(--elevated)", borderRadius: "var(--r-md)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{todayDone}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Tasks done</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: "var(--elevated)", borderRadius: "var(--r-md)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{todayFocusSessions}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Focus sessions</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: "var(--elevated)", borderRadius: "var(--r-md)" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{totalFocusMin}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Focus minutes</div>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🎯 Goals</h3>
          <button className="btn sm primary" onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ New goal"}</button>
        </div>

        {showForm && (
          <form onSubmit={submitGoal} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, background: "var(--elevated)", padding: 14, borderRadius: "var(--r-md)", border: "1px solid var(--line)" }}>
            <div className="field">
              <label>Goal name</label>
              <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Complete 5 tasks today" required autoFocus />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Type</label>
                <select value={goalType} onChange={e => setGoalType(e.target.value)}>
                  {Object.entries(GOAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Target</label>
                <input type="number" min="1" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn sm primary">Add goal</button>
            </div>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="empty-state" style={{ borderStyle: "dashed", padding: 20 }}>
            <div className="empty-state-icon">🎯</div>
            <h4>No goals set</h4>
            <p>Set daily and weekly goals to stay on track.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map(goal => {
              const { current, pct } = getGoalProgress(goal);
              const typeData = GOAL_TYPES[goal.type];
              return (
                <div key={goal.id} className="goal-item">
                  <div className="goal-header">
                    <span className="goal-title">{goal.title}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="goal-pct" style={{ color: pct >= 100 ? "var(--success)" : "var(--accent-2)" }}>
                        {pct >= 100 ? "✓ " : ""}{pct}%
                      </span>
                      <button className="x-btn" onClick={() => onDeleteGoal?.(goal.id)}>×</button>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill${pct >= 100 ? " success" : ""}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {current} / {goal.target} {typeData?.unit || ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>🏆 Achievements</h3>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} className={`achievement-card${a.earned ? " earned" : ""}`} title={a.desc}>
              <div className="achievement-icon" style={{ filter: a.earned ? "none" : "grayscale(100%) opacity(0.4)" }}>{a.icon}</div>
              <div className="achievement-name">{a.name}</div>
              {a.earned && <span className="tag tag-amber" style={{ fontSize: "0.6rem" }}>Earned</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

