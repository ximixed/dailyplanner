import { useState, useEffect, useRef } from "react";
import { toISO, uid } from "../utils/dates.js";

const MODES = {
  focus:      { label: "Focus",       duration: 25, color: "var(--accent)" },
  short:      { label: "Short break", duration: 5,  color: "var(--success)" },
  long:       { label: "Long break",  duration: 15, color: "var(--warning)" },
};

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const CIRCUMFERENCE = 2 * Math.PI * 110; // radius 110

export default function FocusTimer({ tasks, sessions, onSessionComplete, settings, onSettingsChange }) {
  const [mode, setMode] = useState("focus");
  const [custom, setCustom] = useState({ focus: 25, short: 5, long: 15 });
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((settings?.focusMins || 25) * 60);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [todaySessions, setTodaySessions] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(settings?.dailyGoal || 4);
  const intervalRef = useRef(null);
  const today = toISO(new Date());

  const totalDuration = (custom[mode] || MODES[mode].duration) * 60;
  const progress = 1 - secondsLeft / totalDuration;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const todayFocus = sessions.filter(s => s.date === today && s.mode === "focus");
  const totalFocusMin = Math.round(todayFocus.reduce((acc, s) => acc + (s.duration || 0), 0) / 60);
  const completedFocusSessions = todayFocus.length;

  useEffect(() => {
    const mins = custom[mode] || MODES[mode].duration;
    setSecondsLeft(mins * 60);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleSessionComplete = () => {
    const dur = (custom[mode] || MODES[mode].duration) * 60;
    const task = tasks.find(t => t.id === selectedTaskId);
    onSessionComplete?.({
      id: uid(),
      date: today,
      mode,
      duration: dur,
      taskId: selectedTaskId,
      taskTitle: task?.title || "",
      completedAt: new Date().toISOString(),
    });
    // browser notification
    if (Notification.permission === "granted") {
      new Notification(mode === "focus" ? "🎯 Focus session complete!" : "⏰ Break time over!", {
        body: mode === "focus" ? "Great work! Take a well-deserved break." : "Ready to focus again?",
        icon: "/logo.png",
      });
    }
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft((custom[mode] || MODES[mode].duration) * 60);
  };

  const requestNotifPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const activeTasks = tasks.filter(t => !t.done);
  const strokeColor = mode === "focus" ? "var(--accent)" : mode === "short" ? "var(--success)" : "var(--warning)";
  const ringClass = mode === "focus" ? "focus-ring-fg" : mode === "short" ? "focus-ring-fg break" : "focus-ring-fg long-break";

  return (
    <div className="focus-page">
      {/* Mode tabs */}
      <div className="mode-tabs" style={{ width: "100%", maxWidth: 360 }}>
        {Object.entries(MODES).map(([key, m]) => (
          <button key={key} className={`mode-tab${mode === key ? " active" : ""}`} onClick={() => setMode(key)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="focus-ring-wrap">
        <svg className="focus-ring-svg" viewBox="0 0 240 240">
          <circle className="focus-ring-bg" cx="120" cy="120" r="110" />
          <circle
            className={ringClass}
            cx="120" cy="120" r="110"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ stroke: strokeColor }}
          />
        </svg>
        <div className="focus-center">
          <div className="focus-time" style={{ color: secondsLeft === 0 ? "var(--success)" : "var(--ink)" }}>
            {fmt(secondsLeft)}
          </div>
          <div className="focus-mode-label" style={{ color: strokeColor }}>
            {secondsLeft === 0 ? "Complete! 🎉" : running ? "In progress" : "Ready"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
            {MODES[mode].label} · {custom[mode] || MODES[mode].duration} min
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="focus-controls">
        {!running ? (
          <button className="btn lg primary" onClick={() => { requestNotifPermission(); setRunning(true); }}>
            {secondsLeft === totalDuration ? "▶ Start" : "▶ Resume"}
          </button>
        ) : (
          <button className="btn lg" onClick={() => setRunning(false)}>⏸ Pause</button>
        )}
        <button className="btn lg" onClick={reset}>↺ Reset</button>
        {secondsLeft === 0 && (
          <button className="btn lg success" onClick={() => { setMode(mode === "focus" ? "short" : "focus"); }}>
            {mode === "focus" ? "Take break →" : "Start focus →"}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="focus-stats-row">
        <div className="focus-stat">
          <span className="fs-label">Today's sessions</span>
          <span className="fs-val">{completedFocusSessions}</span>
        </div>
        <div className="focus-stat">
          <span className="fs-label">Focus time today</span>
          <span className="fs-val">{totalFocusMin}<span style={{ fontSize: "1rem", fontWeight: 600 }}>m</span></span>
        </div>
        <div className="focus-stat">
          <span className="fs-label">Daily goal</span>
          <span className="fs-val">{Math.min(completedFocusSessions, dailyGoal)}/{dailyGoal}</span>
        </div>
        <div className="focus-stat" style={{ flex: 2 }}>
          <span className="fs-label">Goal progress</span>
          <div className="progress-bar" style={{ margin: "8px 0" }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((completedFocusSessions / dailyGoal) * 100))}%` }} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{Math.min(100, Math.round((completedFocusSessions / dailyGoal) * 100))}% of daily goal</span>
        </div>
      </div>

      {/* Task selector */}
      <div className="focus-task-select">
        <label style={{ marginBottom: 8, display: "block" }}>Focus on a task</label>
        <select
          value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
          style={{ width: "100%" }}
          aria-label="Select task to focus on"
        >
          <option value="">— Select a task (optional) —</option>
          {activeTasks.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        {selectedTaskId && (
          <div style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--muted)" }}>
            Focusing on: <strong style={{ color: "var(--ink)" }}>{tasks.find(t => t.id === selectedTaskId)?.title}</strong>
          </div>
        )}
      </div>

      {/* Custom durations */}
      <div className="panel-block" style={{ width: "100%" }}>
        <div className="panel-header">
          <span className="panel-icon accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/></svg>
          </span>
          <h3>Timer settings</h3>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries({ focus: "Focus (min)", short: "Short break (min)", long: "Long break (min)" }).map(([key, label]) => (
            <div className="field" key={key} style={{ flex: "1 1 120px" }}>
              <label>{label}</label>
              <input type="number" min="1" max="120" value={custom[key] || MODES[key].duration}
                onChange={e => setCustom(p => ({ ...p, [key]: Number(e.target.value) || MODES[key].duration }))} />
            </div>
          ))}
          <div className="field" style={{ flex: "1 1 120px" }}>
            <label>Daily session goal</label>
            <input type="number" min="1" max="20" value={dailyGoal} onChange={e => setDailyGoal(Number(e.target.value) || 4)} />
          </div>
        </div>
        {Notification.permission !== "granted" && "Notification" in window && (
          <button className="btn sm" style={{ marginTop: 10 }} onClick={requestNotifPermission}>
            🔔 Enable notifications
          </button>
        )}
        {Notification.permission === "granted" && (
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "var(--success)" }}>✓ Notifications enabled</p>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="session-history">
          <div className="panel-header">
            <span className="panel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}><path d="M12 2v10l4.5 4.5"/><circle cx="12" cy="12" r="10"/></svg>
            </span>
            <h3>Session history</h3>
          </div>
          {sessions.slice(-10).reverse().map(s => (
            <div key={s.id} className="session-item">
              <div className={`session-dot${s.mode !== "focus" ? " break" : ""}`} />
              <div className="session-item-info">
                <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{s.mode === "focus" ? "🎯 Focus" : s.mode === "short" ? "☕ Short break" : "🌟 Long break"}</div>
                {s.taskTitle && <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Task: {s.taskTitle}</div>}
              </div>
              <div className="session-item-time">{Math.round((s.duration || 0) / 60)}m · {s.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

