import { useEffect, useMemo, useRef, useState } from "react";
import useLocalStorage from "./utils/useLocalStorage.js";
import { addDays, fromISO, toISO, uid } from "./utils/dates.js";
import WeekStrip from "./components/WeekStrip.jsx";
import TaskList from "./components/TaskList.jsx";
import ActivityList from "./components/ActivityList.jsx";
import NoteList from "./components/NoteList.jsx";

const Icon = ({ name, className = "" }) => {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

  const icons = {
    overview: (
      <svg {...common}><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 9.5V19h11v-9.5" /><path d="M10 19v-6h4v6" /></svg>
    ),
    tasks: (
      <svg {...common}><path d="M8 7.5h10" /><path d="M8 12h10" /><path d="M8 16.5h10" /><path d="M5 7.5h.01" /><path d="M5 12h.01" /><path d="M5 16.5h.01" /></svg>
    ),
    activities: (
      <svg {...common}><path d="M5 18V8" /><path d="M10 18V5" /><path d="M15 18v-9" /><path d="M20 18v-6" /></svg>
    ),
    notes: (
      <svg {...common}><path d="M7 4.5h8l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M15 4.5v4h4" /><path d="M8 12h8" /><path d="M8 16h8" /></svg>
    ),
    check: (
      <svg {...common}><path d="M5 12.5 9.5 17 19 7.5" /></svg>
    ),
    calendar: (
      <svg {...common}><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3.5v4" /><path d="M16.5 3.5v4" /><path d="M3.5 9.5h17" /></svg>
    ),
    focus: (
      <svg {...common}><path d="M10 4.5h4" /><path d="M12 4.5v6" /><path d="M6.5 18.5a5.5 5.5 0 0 1 11 0" /><path d="M8 15.5h8" /></svg>
    ),
    spark: (
      <svg {...common}><path d="M12 2.5v5" /><path d="M12 16.5v5" /><path d="M2.5 12h5" /><path d="M16.5 12h5" /><path d="M5.5 5.5l3.5 3.5" /><path d="M15 15l3.5 3.5" /><path d="M5.5 18.5l3.5-3.5" /><path d="M15 9l3.5-3.5" /></svg>
    ),
    clock: (
      <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3 2" /></svg>
    ),
    file: (
      <svg {...common}><path d="M7 4.5h7l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 4.5v4h4" /></svg>
    )
  };

  return icons[name] || icons.tasks;
};

export default function App() {
  const today = toISO(new Date());
  const [current, setCurrent] = useState(today);
  const [now, setNow] = useState(new Date());
  const [tasks, setTasks] = useLocalStorage("planner:tasks", []);
  const [acts, setActs] = useLocalStorage("planner:acts", []);
  const [notes, setNotes] = useLocalStorage("planner:notes", []);
  const [selectedView, setSelectedView] = useState("overview");
  const [theme, setTheme] = useLocalStorage("planner:theme", "dark");
  const contentRef = useRef(null);

  const dayTasks = tasks.filter((t) => t.date === current);
  const dayActs = acts.filter((a) => a.date === current);
  const dayNotes = notes.filter((n) => n.date === current);
  const done = dayTasks.filter((t) => t.done).length;
  const pct = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
  const d = fromISO(current);
  const title =
    current === today ? "Today"
    : current === addDays(today, 1) ? "Tomorrow"
    : current === addDays(today, -1) ? "Yesterday"
    : d.toLocaleDateString(undefined, { weekday: "long" });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLabel = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const upcomingActs = useMemo(() =>
    [...acts]
      .filter((a) => a.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime || "00:00"}`.localeCompare(`${b.date} ${b.startTime || "00:00"}`))
      .slice(0, 4), [acts, today]);

  const topTasks = useMemo(() =>
    [...dayTasks]
      .filter((t) => !t.done)
      .sort((a, b) => (a.pri || "med").localeCompare(b.pri || "med"))
      .slice(0, 3), [dayTasks]);

  const todaySummary = {
    totalTasks: dayTasks.length,
    completedTasks: done,
    upcomingActivities: dayActs.length,
    notesCount: dayNotes.length,
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 900 && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedView]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const themeGlyph = theme === "dark" ? "☀" : "☾";

  const normalizeTask = (raw, fallbackDate = current) => {
    const payload = typeof raw === "string" ? { title: raw, priority: "med", category: "School" } : raw || {};
    return {
      id: payload.id || uid(),
      date: payload.date || fallbackDate,
      done: !!payload.done,
      title: String(payload.title || payload.text || "New task").trim() || "New task",
      description: payload.description || "",
      priority: payload.priority || payload.pri || "med",
      category: payload.category || "School",
      duration: Number(payload.duration) || 0,
      dueDate: payload.dueDate || fallbackDate,
      dueTime: payload.dueTime || payload.time || "",
      reminder: payload.reminder || "",
      subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
    };
  };

  const normalizeActivity = (raw, fallbackDate = current) => {
    const payload = typeof raw === "string" ? { title: raw, kind: "class" } : raw || {};
    return {
      id: payload.id || uid(),
      date: payload.date || fallbackDate,
      title: String(payload.title || payload.text || "New activity").trim() || "New activity",
      kind: payload.kind || "class",
      time: payload.time || payload.startTime || "",
      startTime: payload.startTime || payload.time || "",
    };
  };

  const normalizeNote = (raw, fallbackDate = current) => {
    const payload = typeof raw === "string" ? { text: raw } : raw || {};
    return {
      id: payload.id || uid(),
      date: payload.date || fallbackDate,
      text: String(payload.text || payload.title || "New note").trim() || "New note",
      createdAt: payload.createdAt || new Date().toISOString(),
    };
  };

  const addTask = (task) => {
    setTasks((prev) => [...prev, normalizeTask(task, current)]);
  };

  const updateTask = (id, patch) => setTasks((prev) => prev.map((t) => (t.id === id ? normalizeTask({ ...t, ...patch }, t.date) : t)));
  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const moveTask = (taskId, nextDate = addDays(current, 1)) => setTasks((prev) => prev.map((t) => (t.id === taskId ? normalizeTask({ ...t, date: nextDate, dueDate: nextDate }, nextDate) : t)));
  const addActivity = (activity) => setActs((prev) => [...prev, normalizeActivity(activity, current)]);
  const deleteActivity = (id) => setActs((prev) => prev.filter((a) => a.id !== id));

  const addNote = (note) => setNotes((prev) => [...prev, normalizeNote(note, current)]);
  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const renderOverview = () => (
    <div className="overview-shell">
      <div className="overview-cards">
        <div className="summary-card accent">
          <div className="summary-icon"><Icon name="tasks" /></div>
          <span>Total tasks</span>
          <strong>{todaySummary.totalTasks}</strong>
          <small>{todaySummary.completedTasks} completed</small>
        </div>
        <div className="summary-card">
          <div className="summary-icon green"><Icon name="check" /></div>
          <span>Completed</span>
          <strong>{todaySummary.completedTasks}</strong>
          <small>{pct}% of day</small>
        </div>
        <div className="summary-card">
          <div className="summary-icon purple"><Icon name="calendar" /></div>
          <span>Activities</span>
          <strong>{todaySummary.upcomingActivities}</strong>
          <small>scheduled</small>
        </div>
        <div className="summary-card">
          <div className="summary-icon amber"><Icon name="file" /></div>
          <span>Notes</span>
          <strong>{todaySummary.notesCount}</strong>
          <small>saved today</small>
        </div>
      </div>

      <div className="focus-grid">
        <div className="panel-block">
          <div className="panel-header">
            <span className="panel-icon"><Icon name="focus" /></span>
            <h3>Daily focus</h3>
          </div>
          {topTasks.length === 0 ? (
            <div className="empty-box">No active priorities yet. Add a task to get started.</div>
          ) : (
            <ul className="focus-list">
              {topTasks.map((task, index) => (
                <li key={task.id}>
                  <span className="focus-index">{index + 1}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.priority || "med"} priority</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-block">
          <div className="panel-header">
            <span className="panel-icon spark"><Icon name="spark" /></span>
            <h3>Upcoming schedule</h3>
          </div>
          {upcomingActs.length === 0 ? (
            <div className="empty-box">No upcoming activities.</div>
          ) : (
            <ul className="mini-list">
              {upcomingActs.map((activity) => (
                <li key={activity.id}>
                  <span className="tag tag-blue">{activity.kind}</span>
                  <div>
                    <strong>{activity.title}</strong>
                    <small>{activity.date} {activity.startTime ? `• ${activity.startTime}` : ""}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dashboard-bottom">
        <TaskList
          tasks={dayTasks}
          onAdd={(task) => addTask(task)}
          onUpdate={updateTask}
          onToggle={(id) => updateTask(id, { done: !dayTasks.find((t) => t.id === id)?.done })}
          onDelete={deleteTask}
          onMove={(taskId) => moveTask(taskId, addDays(current, 1))}
          onClear={() => setTasks((prev) => prev.filter((t) => !(t.date === current && t.done)))}
        />
        <ActivityList
          acts={dayActs}
          onAdd={addActivity}
          onUpdate={(id, patch) => setActs((prev) => prev.map((a) => (a.id === id ? normalizeActivity({ ...a, ...patch }, a.date) : a)))}
          onDelete={deleteActivity}
        />
        <NoteList
          notes={dayNotes}
          onAdd={addNote}
          onUpdate={(id, patch) => setNotes((prev) => prev.map((n) => (n.id === id ? normalizeNote({ ...n, ...patch }, n.date) : n)))}
          onDelete={deleteNote}
        />
      </div>
    </div>
  );

  const renderSelectedSection = () => {
    if (selectedView === "overview") return renderOverview();
    if (selectedView === "tasks") {
      return (
        <TaskList
          tasks={dayTasks}
          onAdd={(task) => addTask(task)}
          onUpdate={updateTask}
          onToggle={(id) => updateTask(id, { done: !dayTasks.find((t) => t.id === id)?.done })}
          onDelete={deleteTask}
          onMove={(taskId) => moveTask(taskId, addDays(current, 1))}
          onClear={() => setTasks((prev) => prev.filter((t) => !(t.date === current && t.done)))}
        />
      );
    }
    if (selectedView === "activities") {
      return <ActivityList acts={dayActs} onAdd={addActivity} onUpdate={(id, patch) => setActs((prev) => prev.map((a) => (a.id === id ? normalizeActivity({ ...a, ...patch }, a.date) : a)))} onDelete={deleteActivity} />;
    }
    if (selectedView === "notes") {
      return <NoteList notes={dayNotes} onAdd={addNote} onUpdate={(id, patch) => setNotes((prev) => prev.map((n) => (n.id === id ? normalizeNote({ ...n, ...patch }, n.date) : n)))} onDelete={deleteNote} />;
    }
    return renderOverview();
  };

  return (
    <div className="wrap">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="Daily Planner logo" className="brand-logo" />
          <div className="brand-text">
            <strong>Daily Planner</strong>
            <small>Focus board</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Sidebar navigation">
          {[
            { id: "overview", label: "Overview", icon: "overview" },
            { id: "tasks", label: "Tasks", icon: "tasks" },
            { id: "activities", label: "Activities", icon: "activities" },
            { id: "notes", label: "Notes", icon: "notes" },
          ].map((item) => (
            <button
              key={item.id}
              className={selectedView === item.id ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => setSelectedView(item.id)}
            >
              <span className="nav-icon"><Icon name={item.icon} /></span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-panel">
          <span className="panel-label">Today</span>
          <strong>{dayTasks.length}</strong>
          <small>tasks planned</small>
        </div>

        <div className="side-panel muted">
          <span className="panel-label">Progress</span>
          <strong>{pct}%</strong>
          <small>{done} completed</small>
        </div>

        <div className="sidebar-footer">
          <button className="icon-btn" type="button" aria-label="Settings">⚙</button>
          <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={toggleTheme}>{themeGlyph}</button>
          <button className="icon-btn" type="button" aria-label="Open today view" onClick={() => setCurrent(today)}>↩</button>
        </div>
      </aside>

      <main className="main-panel">
        <header>
          <div className="header-main">
            <h1>{title}</h1>
            <div className="sub">
              {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="header-tools">
            <div className="nav top-controls">
              <div className="clock-box" aria-live="polite">
                <span className="clock-icon"><Icon name="clock" /></span>
                <strong>{timeLabel}</strong>
              </div>
              <button className="btn" aria-label="Previous day" onClick={() => setCurrent(addDays(current, -1))}>‹</button>
              <button className="btn primary" onClick={() => setCurrent(today)}>Today</button>
              <button className="btn" aria-label="Next day" onClick={() => setCurrent(addDays(current, 1))}>›</button>
              <button className="btn" aria-label="Toggle dark mode" onClick={toggleTheme}>{themeGlyph}</button>
            </div>
          </div>
        </header>

        <WeekStrip current={current} onSelect={setCurrent} tasks={tasks} acts={acts} />

        <div className="sub subtle-line">
          {dayTasks.length === 0 ? "No tasks planned for this day."
            : done === dayTasks.length ? `All ${dayTasks.length} tasks done.`
            : `${dayTasks.length - done} of ${dayTasks.length} tasks left.`}
        </div>

        <div ref={contentRef} className={selectedView === "overview" ? "overview-layout" : "single-panel"}>{renderSelectedSection()}</div>
      </main>
    </div>
  );
}
