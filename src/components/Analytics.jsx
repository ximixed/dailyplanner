import { useMemo, useState } from "react";
import { toISO, addDays, fromISO } from "../utils/dates.js";

const today = toISO(new Date());
const COLORS = ["#6978FF","#42C99A","#F4B860","#F16D7A","#A855F7","#06B6D4","#EC4899","#84CC16"];

function BarChart({ data, label, color = "var(--accent)" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} className="chart-bar-row">
          <div className="chart-bar-label" title={d.label}>{d.label}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <div className="chart-bar-val">{d.value}</div>
        </div>
      ))}
      {data.length === 0 && <div className="empty-box">No data yet</div>}
    </div>
  );
}

function DonutChart({ value, total, color = "var(--accent)" }) {
  const r = 52, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  const offset = circ * (1 - pct);
  return (
    <div className="donut-wrap" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--elevated)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.6s" }} />
      </svg>
      <div className="donut-center">
        <strong>{total > 0 ? Math.round(pct * 100) : 0}%</strong>
        <small>{value}/{total}</small>
      </div>
    </div>
  );
}

export default function Analytics({ tasks, acts, sessions }) {
  const [range, setRange] = useState("week");

  const days = range === "day" ? 1 : range === "week" ? 7 : 30;
  const startDate = addDays(today, -(days - 1));

  const periodTasks = useMemo(() =>
    tasks.filter(t => t.date >= startDate && t.date <= today), [tasks, startDate]);

  const periodSessions = useMemo(() =>
    sessions.filter(s => s.date >= startDate && s.date <= today && s.mode === "focus"), [sessions, startDate]);

  // ── Core stats ──
  const completed = periodTasks.filter(t => t.done).length;
  const total = periodTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && !t.done).length;
  const totalFocusMin = Math.round(periodSessions.reduce((a, s) => a + (s.duration || 0), 0) / 60);

  // ── Daily completions ──
  const dailyCompletions = useMemo(() => {
    return Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const d = addDays(today, -(Math.min(days, 14) - 1 - i));
      const dayTasks = tasks.filter(t => t.date === d);
      const label = fromISO(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return { label, value: dayTasks.filter(t => t.done).length };
    });
  }, [tasks, days]);

  // ── By category ──
  const byCategory = useMemo(() => {
    const map = {};
    periodTasks.forEach(t => {
      const cat = t.category || "Other";
      if (!map[cat]) map[cat] = { total: 0, done: 0 };
      map[cat].total++;
      if (t.done) map[cat].done++;
    });
    return Object.entries(map).map(([label, v]) => ({ label, value: v.done, total: v.total })).sort((a, b) => b.value - a.value);
  }, [periodTasks]);

  // ── Focus by day ──
  const focusByDay = useMemo(() => {
    return Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const d = addDays(today, -(Math.min(days, 14) - 1 - i));
      const min = Math.round(sessions.filter(s => s.date === d && s.mode === "focus").reduce((a, s) => a + (s.duration || 0), 0) / 60);
      const label = fromISO(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return { label, value: min };
    });
  }, [sessions, days]);

  // ── Most productive day ──
  const mostProductiveDay = useMemo(() => {
    if (!dailyCompletions.length) return null;
    return dailyCompletions.reduce((best, d) => d.value > (best?.value || 0) ? d : best, null);
  }, [dailyCompletions]);

  // ── Priority breakdown ──
  const byPriority = useMemo(() => {
    const map = { urgent: 0, high: 0, med: 0, low: 0 };
    periodTasks.filter(t => t.done).forEach(t => { map[t.priority || "med"]++; });
    return [
      { label: "Urgent", value: map.urgent, color: "var(--danger)" },
      { label: "High",   value: map.high,   color: "var(--warning)" },
      { label: "Medium", value: map.med,    color: "var(--accent)" },
      { label: "Low",    value: map.low,    color: "var(--success)" },
    ];
  }, [periodTasks]);

  const statCards = [
    { label: "Tasks completed", value: completed, sub: `of ${total} total`, accent: "accent-1" },
    { label: "Completion rate", value: `${completionRate}%`, sub: "for the period", accent: "accent-2" },
    { label: "Focus time", value: `${totalFocusMin}m`, sub: `${periodSessions.length} sessions`, accent: "accent-3" },
    { label: "Overdue tasks", value: overdue, sub: "need attention", accent: "accent-4" },
  ];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: "1.2rem" }}>📊 Productivity Analytics</h2>
        <div className="pill-group">
          {[["day", "Today"], ["week", "This week"], ["month", "This month"]].map(([k, l]) => (
            <button key={k} className={`pill${range === k ? " active" : ""}`} onClick={() => setRange(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.accent}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Most productive day */}
      {mostProductiveDay && mostProductiveDay.value > 0 && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(105,120,255,0.12), rgba(17,29,45,0.4))", borderColor: "rgba(105,120,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>🏆</span>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Most productive day</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{mostProductiveDay.label} — {mostProductiveDay.value} tasks completed</div>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        {/* Completion rate donut */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Overall completion</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart value={completed} total={total} color="var(--accent)" />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 3 }}>Completed</div>
                <div className="progress-bar"><div className="progress-fill success" style={{ width: `${completionRate}%` }} /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--success)" }}>✓ Done</span>
                  <span>{completed}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--muted)" }}>◦ Remaining</span>
                  <span>{total - completed}</span>
                </div>
                {overdue > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--danger)" }}>⚠ Overdue</span>
                    <span>{overdue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Tasks by priority</h3>
          {byPriority.every(p => p.value === 0) ? (
            <div className="empty-box">No completed tasks yet</div>
          ) : (
            byPriority.filter(p => p.value > 0).map((p, i) => (
              <div key={i} className="chart-bar-row">
                <div className="chart-bar-label">{p.label}</div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${(p.value / Math.max(...byPriority.map(x => x.value), 1)) * 100}%`, background: p.color }} />
                </div>
                <div className="chart-bar-val">{p.value}</div>
              </div>
            ))
          )}
        </div>

        {/* Daily completions */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Daily task completions</h3>
          <BarChart data={dailyCompletions.slice(-7)} color="var(--accent)" />
        </div>

        {/* Focus time */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Daily focus time (min)</h3>
          <BarChart data={focusByDay.slice(-7)} color="var(--success)" />
        </div>
      </div>

      {/* By category */}
      {byCategory.length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem" }}>Completed tasks by category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byCategory.map((cat, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: COLORS[i % COLORS.length] }}>{cat.label}</span>
                  <span style={{ color: "var(--muted)" }}>{cat.value}/{cat.total} done</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${cat.total > 0 ? Math.round((cat.value / cat.total) * 100) : 0}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

