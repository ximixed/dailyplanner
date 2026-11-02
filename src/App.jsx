import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import useLocalStorage from "./utils/useLocalStorage.js";
import { addDays, fromISO, toISO, uid, greeting, fmtCountdown, diffDays } from "./utils/dates.js";
import { exportData } from "./utils/storage.js";
import WeekStrip from "./components/WeekStrip.jsx";
import TaskList from "./components/TaskList.jsx";
import ActivityList from "./components/ActivityList.jsx";
import NoteList from "./components/NoteList.jsx";
import FocusTimer from "./components/FocusTimer.jsx";
import CalendarView from "./components/CalendarView.jsx";
import Analytics from "./components/Analytics.jsx";
import StudentHub from "./components/StudentHub.jsx";
import GoalsStreaks from "./components/GoalsStreaks.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import NotificationCenter from "./components/NotificationCenter.jsx";
import HabitTracker from "./components/HabitTracker.jsx";
import DailyReflection from "./components/DailyReflection.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import DailyPlanner from "./components/DailyPlanner.jsx";

/* ─────────────────────────────────────────
   Icon component
───────────────────────────────────────── */
const SVG = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...props} />
);

const ICONS = {
  overview:   <SVG><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 9.5V19h11v-9.5"/><path d="M10 19v-6h4v6"/></SVG>,
  tasks:      <SVG><path d="M8 7.5h10"/><path d="M8 12h10"/><path d="M8 16.5h10"/><path d="M5 7.5h.01"/><path d="M5 12h.01"/><path d="M5 16.5h.01"/></SVG>,
  activities: <SVG><path d="M5 18V8"/><path d="M10 18V5"/><path d="M15 18v-9"/><path d="M20 18v-6"/></SVG>,
  notes:      <SVG><path d="M7 4.5h8l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M15 4.5v4h4"/><path d="M8 12h8"/><path d="M8 16h8"/></SVG>,
  focus:      <SVG><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 3.5"/></SVG>,
  calendar:   <SVG><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4"/><path d="M16.5 3.5v4"/><path d="M3.5 9.5h17"/></SVG>,
  analytics:  <SVG><path d="M3 17l5-6 4 3 5-7 4 3"/></SVG>,
  student:    <SVG><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></SVG>,
  goals:      <SVG><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v1M12 20v1M3 12h1M20 12h1"/></SVG>,
  bell:       <SVG><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></SVG>,
  search:     <SVG><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></SVG>,
  plus:       <SVG><path d="M12 5v14M5 12h14"/></SVG>,
  sun:        <SVG><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></SVG>,
  moon:       <SVG><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></SVG>,
  settings:   <SVG><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></SVG>,
  clock:      <SVG><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></SVG>,
  check:      <SVG><path d="M5 12.5 9.5 17 19 7.5"/></SVG>,
  x:          <SVG strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></SVG>,
  menu:       <SVG><path d="M4 6h16M4 12h16M4 18h16"/></SVG>,
  habits:     <SVG><path d="M12 2a10 10 0 0 1 0 20" strokeDasharray="5 2"/><path d="M12 22a10 10 0 0 1 0-20" strokeDasharray="5 2"/><circle cx="12" cy="12" r="3"/></SVG>,
  reflection: <SVG><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SVG>,
  planner:    <SVG><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/><circle cx="17" cy="18" r="3" fill="currentColor" stroke="none"/><path d="M15.5 18l1 1 2-2" stroke="#fff" strokeWidth="1.5"/></SVG>,
};

const Icon = ({ name, style, className = "" }) => (
  <span className={`nav-icon ${className}`} style={style}>{ICONS[name] || ICONS.tasks}</span>
);

/* ─────────────────────────────────────────
   Default settings
───────────────────────────────────────── */
const DEFAULT_SETTINGS = {
  theme: "dark",
  accentColor: "#6978FF",
  timeFormat: "12h",
  weekStart: 0,
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  dailyGoal: 4,
  notifications: {
    overdue: true,
    overdueTime: "09:00",
    exams: true,
    examDaysBefore: 3,
    dailyPlan: false,
    dailyPlanTime: "08:00",
  },
  dashboard: {
    stats: true,
    progress: true,
    focusPanel: true,
    schedulePanel: true,
    quickNote: true,
    bottomSections: true,
  },
};

/* ─────────────────────────────────────────
   Normalizers
───────────────────────────────────────── */
const today = toISO(new Date());

const normalizeTask = (raw, fallbackDate = today) => {
  const p = typeof raw === "string" ? { title: raw } : (raw || {});
  return {
    id: p.id || uid(),
    date: p.date || fallbackDate,
    done: !!p.done,
    title: String(p.title || p.text || "New task").trim() || "New task",
    description: p.description || "",
    priority: p.priority || p.pri || "med",
    category: p.category || "School",
    duration: Number(p.duration) || 0,
    dueDate: p.dueDate || fallbackDate,
    dueTime: p.dueTime || p.time || "",
    startDate: p.startDate || "",
    reminder: p.reminder || "",
    subtasks: Array.isArray(p.subtasks) ? p.subtasks : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    status: p.status || (p.done ? "done" : "todo"),
    archived: !!p.archived,
    actualTime: Number(p.actualTime) || 0,
    createdAt: p.createdAt || new Date().toISOString(),
  };
};

const normalizeActivity = (raw, fallbackDate = today) => {
  const p = typeof raw === "string" ? { title: raw, kind: "class" } : (raw || {});
  return {
    id: p.id || uid(),
    date: p.date || fallbackDate,
    title: String(p.title || p.text || "New activity").trim() || "New activity",
    kind: p.kind || "class",
    time: p.time || p.startTime || "",
    startTime: p.startTime || p.time || "",
    location: p.location || "",
  };
};

const normalizeNote = (raw, fallbackDate = today) => {
  const p = typeof raw === "string" ? { text: raw } : (raw || {});
  return {
    id: p.id || uid(),
    date: p.date || fallbackDate,
    text: String(p.text || p.title || "New note").trim() || "New note",
    createdAt: p.createdAt || new Date().toISOString(),
    category: p.category || "General",
    color: p.color || "default",
    pinned: !!p.pinned,
    isChecklist: !!p.isChecklist,
    checkItems: Array.isArray(p.checkItems) ? p.checkItems : [],
  };
};

/* ─────────────────────────────────────────
   Quick Add Modal
───────────────────────────────────────── */
function QuickAddModal({ onClose, onAddTask, onAddNote, onAddActivity, currentDate }) {
  const [tab, setTab] = useState("task");
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, [tab]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (tab === "task") onAddTask({ title: title.trim(), priority: "med", date: currentDate });
    else if (tab === "note") onAddNote({ text: title.trim(), date: currentDate });
    else if (tab === "activity") onAddActivity({ title: title.trim(), kind: "class", date: currentDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Quick add</h3>
          <button className="x-btn" onClick={onClose}>{ICONS.x}</button>
        </div>
        <div className="modal-tabs">
          {[["task","Task"], ["note","Note"], ["activity","Activity"]].map(([k,l]) => (
            <button key={k} className={`modal-tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={tab === "task" ? "Task title…" : tab === "note" ? "Quick note…" : "Activity title…"}
            required style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn sm primary">Add {tab}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Undo Toast
───────────────────────────────────────── */
function UndoToast({ message, onUndo, onDismiss }) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button className="btn sm ghost" style={{ padding: "2px 10px" }} onClick={onUndo}>Undo</button>
      <button className="x-btn" style={{ width: 24, height: 24, marginLeft: 4 }} onClick={onDismiss}>{ICONS.x}</button>
    </div>
  );
}

/* ─────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "overview",    label: "Dashboard",      icon: "overview" },
      { id: "planner",     label: "Daily Planner",  icon: "planner" },
      { id: "tasks",       label: "Tasks",          icon: "tasks" },
      { id: "focus",       label: "Focus Timer",    icon: "focus" },
      { id: "calendar",    label: "Calendar",       icon: "calendar" },
    ],
  },
  {
    label: "School",
    items: [
      { id: "student",     label: "Student Hub",   icon: "student" },
      { id: "activities",  label: "Activities",    icon: "activities" },
    ],
  },
  {
    label: "Personal",
    items: [
      { id: "notes",       label: "Notes",          icon: "notes" },
      { id: "habits",      label: "Habits",         icon: "habits" },
      { id: "reflection",  label: "Reflection",     icon: "reflection" },
      { id: "goals",       label: "Goals & Streaks",icon: "goals" },
      { id: "analytics",   label: "Analytics",      icon: "analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings",    label: "Settings",       icon: "settings" },
    ],
  },
];

/* ─────────────────────────────────────────
   APP
───────────────────────────────────────── */
export default function App() {
  const [current, setCurrent] = useState(today);
  const [now, setNow] = useState(new Date());
  const [selectedView, setSelectedView] = useState("overview");
  const [theme, setTheme] = useLocalStorage("planner:theme", "dark");
  const [status, setStatus] = useState("");
  const contentRef = useRef(null);

  // ── Data ──
  const [tasks, setTasks] = useLocalStorage("planner:tasks", []);
  const [acts, setActs] = useLocalStorage("planner:acts", []);
  const [notes, setNotes] = useLocalStorage("planner:notes", []);
  const [events, setEvents] = useLocalStorage("planner:events", []);
  const [sessions, setSessions] = useLocalStorage("planner:focus-sessions", []);
  const [exams, setExams] = useLocalStorage("planner:exams", []);
  const [assignments, setAssignments] = useLocalStorage("planner:assignments", []);
  const [subjects, setSubjects] = useLocalStorage("planner:subjects", []);
  const [goals, setGoals] = useLocalStorage("planner:goals", []);
  const [notifications, setNotifications] = useLocalStorage("planner:notifications", []);
  const [streak, setStreak] = useLocalStorage("planner:streak", { current: 0, best: 0, lastDate: "" });
  const [habits, setHabits] = useLocalStorage("planner:habits", []);
  const [habitLogs, setHabitLogs] = useLocalStorage("planner:habit-logs", []);
  const [reflections, setReflections] = useLocalStorage("planner:reflections", []);
  const [settings, setSettings] = useLocalStorage("planner:settings", DEFAULT_SETTINGS);

  // ── Undo ──
  const [undoItem, setUndoItem] = useState(null); // { type, item, message }
  const undoTimerRef = useRef(null);

  // ── UI ──
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Derived ──
  const dayTasks = useMemo(() => tasks.filter(t => t.date === current && !t.archived), [tasks, current]);
  const dayActs = useMemo(() => acts.filter(a => a.date === current), [acts, current]);
  const dayNotes = useMemo(() => notes.filter(n => n.date === current), [notes, current]);
  const doneTasks = dayTasks.filter(t => t.done).length;
  const totalDayTasks = dayTasks.length;
  const pct = totalDayTasks ? Math.round((doneTasks / totalDayTasks) * 100) : 0;

  const allTodayTasks = useMemo(() => tasks.filter(t => t.date === today && !t.archived), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(t => t.dueDate && t.dueDate < today && !t.done && !t.archived), [tasks]);

  const upcomingActs = useMemo(() => [...acts]
    .filter(a => a.date >= today)
    .sort((a, b) => `${a.date} ${a.startTime || "00:00"}`.localeCompare(`${b.date} ${b.startTime || "00:00"}`))
    .slice(0, 4), [acts]);

  const topTasks = useMemo(() => [...dayTasks]
    .filter(t => !t.done)
    .sort((a, b) => (["urgent","high","med","low"].indexOf(a.priority || "med") - ["urgent","high","med","low"].indexOf(b.priority || "med")))
    .slice(0, 4), [dayTasks]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const todayFocusSessions = useMemo(() => sessions.filter(s => s.date === today && s.mode === "focus"), [sessions]);
  const todayFocusMin = Math.round(todayFocusSessions.reduce((a, s) => a + (s.duration || 0), 0) / 60);

  const d = fromISO(current);
  const pageTitle = current === today ? "Today"
    : current === addDays(today, 1) ? "Tomorrow"
    : current === addDays(today, -1) ? "Yesterday"
    : d.toLocaleDateString(undefined, { weekday: "long" });

  // ── Apply accent color ──
  useEffect(() => {
    const color = settings.accentColor || "#6978FF";
    document.documentElement.style.setProperty("--accent", color);
    // Derive accent-2 (lighter)
    document.documentElement.style.setProperty("--accent-2", color + "CC");
  }, [settings.accentColor]);

  // ── Apply theme ──
  useEffect(() => {
    const t = settings.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : (settings.theme || theme || "dark");
    document.documentElement.setAttribute("data-theme", t);
  }, [settings.theme, theme]);

  // ── Streak tracking ──
  useEffect(() => {
    const todayDoneCount = allTodayTasks.filter(t => t.done).length;
    if (todayDoneCount > 0 && streak.lastDate !== today) {
      const yesterday = addDays(today, -1);
      const newCurrent = streak.lastDate === yesterday ? streak.current + 1 : 1;
      const newBest = Math.max(newCurrent, streak.best || 0);
      setStreak({ current: newCurrent, best: newBest, lastDate: today });
    }
  }, [allTodayTasks]);

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Scroll on mobile nav change ──
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const activeBtn = document.querySelector(".side-nav .nav-item.active");
      activeBtn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedView]);

  // ── Status auto-clear ──
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 2000);
    return () => clearTimeout(t);
  }, [status]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowCmdPalette(s => !s); }
      if (e.key === "Escape") {
        setShowCmdPalette(false);
        setShowQuickAdd(false);
        setShowNotifs(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Auto-close mobile menu on desktop resize ──
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Body lock when mobile menu is open ──
  useEffect(() => {
    if (mobileMenuOpen && window.innerWidth <= 900) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // ── Exam notifications ──
  useEffect(() => {
    const daysBefore = settings.notifications?.examDaysBefore ?? 3;
    exams.forEach(exam => {
      const diff = diffDays(today, exam.date);
      if (diff >= 0 && diff <= daysBefore) {
        setNotifications(prev => {
          const exists = prev.find(n => n.refId === exam.id && n.date === today);
          if (exists) return prev;
          return [...prev, {
            id: uid(), date: today, read: false, createdAt: new Date().toISOString(),
            title: `Exam coming up: ${exam.name}`,
            body: `${exam.date} — ${fmtCountdown(exam.date)}`,
            type: "exam",
            refId: exam.id,
          }];
        });
      }
    });
  }, [exams, settings.notifications?.examDaysBefore]);

  // ── Undo timer ──
  const scheduleUndoClear = () => {
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000);
  };

  const announce = (msg) => setStatus(msg);

  // ── Notifications ──
  const addNotification = useCallback((payload) => {
    setNotifications(prev => [...prev, {
      id: uid(), date: today, read: false, createdAt: new Date().toISOString(), ...payload
    }]);
  }, []);
  const markNotifRead = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
  const clearNotifs = useCallback(() => setNotifications([]), []);

  // ── Task operations ──
  const addTask = useCallback((raw) => {
    setTasks(prev => [...prev, normalizeTask(raw, current)]);
    announce("Task added");
  }, [current]);

  const updateTask = useCallback((id, patch) =>
    setTasks(prev => prev.map(t => t.id === id ? normalizeTask({ ...t, ...patch }, t.date) : t)), []);

  const deleteTask = useCallback((id) => {
    setTasks(prev => {
      const item = prev.find(t => t.id === id);
      if (item) {
        setUndoItem({ type: "task", item, message: `Task "${item.title}" deleted` });
        scheduleUndoClear();
      }
      return prev.filter(t => t.id !== id);
    });
    announce("Task deleted");
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const done = !t.done;
      if (done) {
        setStatus("Task completed ✓");
        setNotifications(ns => [...ns, {
          id: uid(), date: today, read: false, createdAt: new Date().toISOString(),
          title: "Task completed!", body: t.title, type: "task"
        }]);
      }
      return normalizeTask({ ...t, done, status: done ? "done" : "todo" }, t.date);
    }));
  }, []);

  const moveTask = useCallback((taskId, nextDate = addDays(current, 1)) => {
    setTasks(prev => prev.map(t => t.id === taskId ? normalizeTask({ ...t, date: nextDate, dueDate: nextDate }, nextDate) : t));
    announce("Task moved");
  }, [current]);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => !(t.date === current && t.done)));
    announce("Completed tasks cleared");
  }, [current]);

  // ── Activity operations ──
  const addActivity = useCallback((raw) => {
    setActs(prev => [...prev, normalizeActivity(raw, current)]);
    announce("Activity added");
  }, [current]);

  const updateActivity = useCallback((id, patch) =>
    setActs(prev => prev.map(a => a.id === id ? normalizeActivity({ ...a, ...patch }, a.date) : a)), []);

  const deleteActivity = useCallback((id) => {
    setActs(prev => {
      const item = prev.find(a => a.id === id);
      if (item) {
        setUndoItem({ type: "activity", item, message: `Activity "${item.title}" deleted` });
        scheduleUndoClear();
      }
      return prev.filter(a => a.id !== id);
    });
    announce("Activity deleted");
  }, []);

  // ── Note operations ──
  const addNote = useCallback((raw) => {
    setNotes(prev => [...prev, normalizeNote(raw, current)]);
    announce("Note saved");
  }, [current]);

  const updateNote = useCallback((id, patch) =>
    setNotes(prev => prev.map(n => n.id === id ? normalizeNote({ ...n, ...patch }, n.date) : n)), []);

  const deleteNote = useCallback((id) => {
    setNotes(prev => {
      const item = prev.find(n => n.id === id);
      if (item) {
        setUndoItem({ type: "note", item, message: `Note deleted` });
        scheduleUndoClear();
      }
      return prev.filter(n => n.id !== id);
    });
    announce("Note deleted");
  }, []);

  // ── Undo ──
  const handleUndo = useCallback(() => {
    if (!undoItem) return;
    const { type, item } = undoItem;
    if (type === "task") setTasks(prev => [...prev, item]);
    else if (type === "note") setNotes(prev => [...prev, item]);
    else if (type === "activity") setActs(prev => [...prev, item]);
    else if (type === "habit") setHabits(prev => [...prev, item]);
    setUndoItem(null);
    clearTimeout(undoTimerRef.current);
    announce("Restored!");
  }, [undoItem]);

  // ── Calendar event operations ──
  const addEvent = useCallback((ev) => { setEvents(prev => [...prev, { id: uid(), ...ev }]); announce("Event added"); }, []);
  const updateEvent = useCallback((id, patch) => setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e)), []);
  const deleteEvent = useCallback((id) => { setEvents(prev => prev.filter(e => e.id !== id)); announce("Event deleted"); }, []);

  // ── Focus session ──
  const addSession = useCallback((s) => {
    setSessions(prev => [...prev, s]);
    if (s.mode === "focus") {
      announce(`Focus session complete! 🎯`);
      addNotification({ title: "Focus session complete!", body: `${Math.round(s.duration / 60)} min session`, type: "focus" });
    }
  }, [addNotification]);

  // ── Student operations ──
  const addExam = useCallback((e) => { setExams(prev => [...prev, e]); announce("Exam added"); }, []);
  const updateExam = useCallback((id, patch) => setExams(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e)), []);
  const deleteExam = useCallback((id) => { setExams(prev => prev.filter(e => e.id !== id)); announce("Exam removed"); }, []);

  const addAssignment = useCallback((a) => { setAssignments(prev => [...prev, a]); announce("Assignment added"); }, []);
  const updateAssignment = useCallback((id, patch) => setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a)), []);
  const deleteAssignment = useCallback((id) => { setAssignments(prev => prev.filter(a => a.id !== id)); announce("Assignment removed"); }, []);

  const addSubject = useCallback((s) => { setSubjects(prev => [...prev, s]); announce("Subject added"); }, []);
  const updateSubject = useCallback((id, patch) => setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)), []);
  const deleteSubject = useCallback((id) => { setSubjects(prev => prev.filter(s => s.id !== id)); announce("Subject removed"); }, []);

  // ── Goals ──
  const addGoal = useCallback((g) => { setGoals(prev => [...prev, g]); announce("Goal set!"); }, []);
  const updateGoal = useCallback((id, patch) => setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g)), []);
  const deleteGoal = useCallback((id) => { setGoals(prev => prev.filter(g => g.id !== id)); }, []);

  // ── Habits ──
  const addHabit = useCallback((h) => { setHabits(prev => [...prev, h]); announce("Habit added!"); }, []);
  const updateHabit = useCallback((id, patch) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h)), []);
  const deleteHabit = useCallback((id) => {
    setHabits(prev => {
      const item = prev.find(h => h.id === id);
      if (item) {
        setUndoItem({ type: "habit", item, message: `Habit "${item.name}" deleted` });
        scheduleUndoClear();
      }
      return prev.filter(h => h.id !== id);
    });
    setHabitLogs(prev => prev.filter(l => l.habitId !== id));
    announce("Habit deleted");
  }, []);

  const toggleHabitLog = useCallback((habitId, date, done) => {
    setHabitLogs(prev => {
      const exists = prev.find(l => l.habitId === habitId && l.date === date);
      if (exists) return prev.map(l => l.habitId === habitId && l.date === date ? { ...l, done } : l);
      return [...prev, { id: uid(), habitId, date, done, createdAt: new Date().toISOString() }];
    });
  }, []);

  // ── Reflections ──
  const addReflection = useCallback((r) => { setReflections(prev => [...prev, r]); announce("Reflection saved!"); }, []);
  const updateReflection = useCallback((id, patch) => {
    setReflections(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    announce("Reflection updated!");
  }, []);

  // ── Settings ──
  const updateSettings = useCallback((updater) => {
    setSettings(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    updateSettings(prev => ({ ...prev, theme: next }));
    announce(`${next === "dark" ? "Dark" : "Light"} mode`);
  };

  const navigateTo = (view) => {
    setSelectedView(view);
    setMobileMenuOpen(false);
  };

  // ── Quick note in dashboard ──
  const [quickNote, setQuickNote] = useState("");
  const saveQuickNote = () => {
    if (!quickNote.trim()) return;
    addNote({ text: quickNote.trim(), date: current });
    setQuickNote("");
  };

  const dash = settings.dashboard || DEFAULT_SETTINGS.dashboard;

  /* ─────────────────────────────────────────
     OVERVIEW / DASHBOARD
  ───────────────────────────────────────── */
  const renderOverview = () => (
    <div className="overview-shell">
      {/* Stat cards */}
      {dash.stats !== false && (
        <div className="stat-grid">
          <div className="stat-card accent-1" onClick={() => setSelectedView("tasks")} style={{ cursor: "pointer" }}>
            <div className="stat-icon"><Icon name="tasks" /></div>
            <div className="stat-label">Total tasks</div>
            <div className="stat-value">{totalDayTasks}</div>
            <div className="stat-sub">{doneTasks} completed</div>
          </div>
          <div className="stat-card accent-2">
            <div className="stat-icon" style={{ background: "rgba(66,201,154,0.12)", color: "var(--success)" }}><Icon name="check" /></div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{doneTasks}</div>
            <div className="stat-sub">{pct}% of today</div>
          </div>
          <div className="stat-card accent-3">
            <div className="stat-icon" style={{ background: "rgba(244,184,96,0.12)", color: "var(--warning)" }}><Icon name="activities" /></div>
            <div className="stat-label">Activities</div>
            <div className="stat-value">{dayActs.length}</div>
            <div className="stat-sub">scheduled today</div>
          </div>
          <div className="stat-card accent-4" onClick={() => setSelectedView("focus")} style={{ cursor: "pointer" }}>
            <div className="stat-icon" style={{ background: "rgba(105,120,255,0.12)", color: "var(--accent)" }}><Icon name="focus" /></div>
            <div className="stat-label">Focus today</div>
            <div className="stat-value">{todayFocusMin}<span style={{ fontSize: "1rem", fontWeight: 600 }}>m</span></div>
            <div className="stat-sub">{todayFocusSessions.length} sessions</div>
          </div>
        </div>
      )}

      {/* Daily progress bar */}
      {dash.progress !== false && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Daily completion</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: pct >= 100 ? "var(--success)" : "var(--accent-2)" }}>{pct}%</span>
          </div>
          <div className="prod-bar">
            <div className="prod-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? "linear-gradient(90deg, var(--success), #5CEBB3)" : undefined }} />
          </div>
          {overdueTasks.length > 0 && (
            <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
              ⚠️ {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""}
              <button className="btn sm ghost" style={{ padding: "2px 8px", fontSize: "0.72rem" }} onClick={() => setSelectedView("tasks")}>View</button>
            </div>
          )}
        </div>
      )}

      {/* Focus + Upcoming panels */}
      {(dash.focusPanel !== false || dash.schedulePanel !== false) && (
        <div className="focus-grid">
          {dash.focusPanel !== false && (
            <div className="panel-block">
              <div className="panel-header">
                <span className="panel-icon accent"><Icon name="focus" /></span>
                <h3>Daily focus</h3>
              </div>
              {topTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 16px", border: "none" }}>
                  <div className="empty-state-icon">✓</div>
                  <h4>No pending tasks</h4>
                  <p>You're all caught up! Add a task to get started.</p>
                  <button className="btn sm primary" onClick={() => setSelectedView("tasks")}>+ Add task</button>
                </div>
              ) : (
                <ul className="focus-list">
                  {topTasks.map((task, i) => {
                    const PRI_COLORS = { urgent: "var(--danger)", high: "var(--warning)", med: "var(--accent)", low: "var(--success)" };
                    return (
                      <li key={task.id}>
                        <span className="focus-index">{i + 1}</span>
                        <div>
                          <strong>{task.title}</strong>
                          <small style={{ color: PRI_COLORS[task.priority || "med"] }}>{task.priority || "med"} priority</small>
                        </div>
                        {task.dueDate && <small style={{ marginLeft: "auto", color: task.dueDate < today ? "var(--danger)" : "var(--muted)", fontSize: "0.72rem" }}>{fmtCountdown(task.dueDate)}</small>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {dash.schedulePanel !== false && (
            <div className="panel-block">
              <div className="panel-header">
                <span className="panel-icon warning"><Icon name="calendar" /></span>
                <h3>Upcoming schedule</h3>
              </div>
              {upcomingActs.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 16px", border: "none" }}>
                  <div className="empty-state-icon">📅</div>
                  <h4>Nothing scheduled</h4>
                  <p>Add activities to see your upcoming schedule.</p>
                  <button className="btn sm primary" onClick={() => setSelectedView("activities")}>+ Add activity</button>
                </div>
              ) : (
                <ul className="mini-list">
                  {upcomingActs.map(a => {
                    const KIND_TAG = { class: "tag-blue", exam: "tag-red", due: "tag-amber", club: "tag-green" };
                    return (
                      <li key={a.id}>
                        <span className={`tag ${KIND_TAG[a.kind] || "tag-gray"}`}>{a.kind}</span>
                        <div>
                          <strong>{a.title}</strong>
                          <small>{a.date}{a.startTime ? ` · ${a.startTime}` : ""}</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick note */}
      {dash.quickNote !== false && (
        <div className="quick-notes-area">
          <div className="panel-header" style={{ marginBottom: 10 }}>
            <span className="panel-icon" style={{ color: "var(--warning)" }}><Icon name="notes" /></span>
            <h3>Quick note</h3>
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)" }}>{dayNotes.length} note{dayNotes.length !== 1 ? "s" : ""} today</span>
          </div>
          <textarea className="quick-notes-input" value={quickNote} onChange={e => setQuickNote(e.target.value)}
            placeholder="Jot down a quick thought…"
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveQuickNote(); } }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: "0.72rem", color: "var(--faint)" }}>Ctrl+Enter to save</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn sm ghost" onClick={() => setSelectedView("notes")}>See all notes</button>
              <button className="btn sm primary" onClick={saveQuickNote} disabled={!quickNote.trim()}>Save note</button>
            </div>
          </div>
        </div>
      )}

      {/* Customize dashboard shortcut */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button className="btn sm ghost" style={{ fontSize: "0.75rem" }} onClick={() => setSelectedView("settings")}>
          ⚙ Customize dashboard
        </button>
      </div>

      {/* Bottom: Tasks, Activities, Notes */}
      {dash.bottomSections !== false && (
        <div className="dashboard-bottom">
          <TaskList
            tasks={dayTasks} currentDate={current}
            onAdd={addTask} onUpdate={updateTask} onToggle={toggleTask}
            onDelete={deleteTask} onMove={(id) => moveTask(id, addDays(current, 1))} onClear={clearCompleted}
          />
          <ActivityList acts={dayActs} onAdd={addActivity} onUpdate={updateActivity} onDelete={deleteActivity} />
          <NoteList notes={dayNotes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />
        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────
     RENDER VIEW
  ───────────────────────────────────────── */
  const renderView = () => {
    switch (selectedView) {
      case "overview": return renderOverview();
      case "planner": return (
        <DailyPlanner tasks={tasks} onUpdateTask={updateTask} />
      );
      case "tasks": return (
        <TaskList tasks={tasks.filter(t => !t.archived)} currentDate={current}
          onAdd={addTask} onUpdate={updateTask} onToggle={toggleTask}
          onDelete={deleteTask} onMove={(id) => moveTask(id, addDays(current, 1))} onClear={clearCompleted} />
      );
      case "activities": return (
        <ActivityList acts={dayActs} onAdd={addActivity} onUpdate={updateActivity} onDelete={deleteActivity} />
      );
      case "notes": return (
        <NoteList notes={notes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />
      );
      case "focus": return (
        <FocusTimer
          tasks={tasks.filter(t => !t.done)}
          sessions={sessions}
          onSessionComplete={addSession}
          focusDuration={settings.focusDuration}
          shortBreak={settings.shortBreak}
          longBreak={settings.longBreak}
          dailyGoal={settings.dailyGoal}
        />
      );
      case "calendar": return (
        <CalendarView tasks={tasks} acts={acts} events={events}
          onAddEvent={addEvent} onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent}
          onSelectDate={(d) => setCurrent(d)} />
      );
      case "analytics": return (
        <Analytics tasks={tasks} acts={acts} sessions={sessions} />
      );
      case "student": return (
        <StudentHub
          exams={exams} onAddExam={addExam} onUpdateExam={updateExam} onDeleteExam={deleteExam}
          assignments={assignments} onAddAssignment={addAssignment} onUpdateAssignment={updateAssignment} onDeleteAssignment={deleteAssignment}
          subjects={subjects} onAddSubject={addSubject} onUpdateSubject={updateSubject} onDeleteSubject={deleteSubject} />
      );
      case "goals": return (
        <GoalsStreaks goals={goals} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal}
          streak={streak} tasks={tasks} sessions={sessions} />
      );
      case "habits": return (
        <HabitTracker
          habits={habits} habitLogs={habitLogs}
          onAddHabit={addHabit} onUpdateHabit={updateHabit} onDeleteHabit={deleteHabit}
          onToggleLog={toggleHabitLog}
        />
      );
      case "reflection": return (
        <DailyReflection
          reflections={reflections}
          onAddReflection={addReflection}
          onUpdateReflection={updateReflection}
        />
      );
      case "settings": return (
        <SettingsPage settings={settings} onUpdateSettings={updateSettings} />
      );
      default: return renderOverview();
    }
  };

  const timeLabel = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const isOverviewOrDay = ["overview", "tasks", "activities", "notes"].includes(selectedView);

  const VIEW_TITLES = {
    overview: pageTitle, planner: "Daily Planner", tasks: "Tasks", focus: "Focus Timer",
    calendar: "Calendar", analytics: "Analytics", student: "Student Hub",
    goals: "Goals & Streaks", notes: "Notes", activities: "Activities",
    habits: "Habits", reflection: "Daily Reflection", settings: "Settings",
  };

  return (
    <div className="wrap">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="Daily Planner" className="brand-logo" />
          <div className="brand-text">
            <strong>Daily Planner</strong>
            <small>Focus board</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item${selectedView === item.id ? " active" : ""}`}
                  type="button"
                  onClick={() => setSelectedView(item.id)}
                  aria-current={selectedView === item.id ? "page" : undefined}
                >
                  <span className="nav-icon">{ICONS[item.icon]}</span>
                  {item.label}
                  {item.id === "tasks" && overdueTasks.length > 0 && (
                    <span className="nav-badge">{overdueTasks.length}</span>
                  )}
                  {item.id === "focus" && todayFocusSessions.length > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--success)", fontWeight: 700 }}>{todayFocusSessions.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar stats */}
        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <div className="stat-label">Today</div>
            <div className="stat-val">{allTodayTasks.filter(t => t.done).length}/{allTodayTasks.length}</div>
            <div className="stat-sub">tasks completed</div>
            <div className="progress-bar" style={{ margin: "6px 0 0" }}>
              <div className="progress-fill" style={{ width: `${allTodayTasks.length ? Math.round((allTodayTasks.filter(t => t.done).length / allTodayTasks.length) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="sidebar-stat" style={{ background: "rgba(105,120,255,0.06)" }}>
            <div className="stat-label">Streak</div>
            <div className="stat-val">🔥 {streak.current}</div>
            <div className="stat-sub">day{streak.current !== 1 ? "s" : ""} in a row</div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="icon-btn" type="button" aria-label="Command palette (Ctrl+K)" onClick={() => setShowCmdPalette(true)} title="Ctrl+K">
            {ICONS.search}
          </button>
          <button className={`icon-btn notif-trigger${showNotifs ? " active" : ""}`} type="button" aria-label="Notifications" onClick={() => setShowNotifs(s => !s)} title="Notifications">
            {ICONS.bell}
            {unreadNotifCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </button>
          <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? ICONS.sun : ICONS.moon}
          </button>
          <button className="icon-btn" type="button" aria-label="Settings" onClick={() => setSelectedView("settings")} title="Settings">
            {ICONS.settings}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-panel">
        {/* Mobile top bar — compact header with quick actions */}
        <div className="mobile-topbar">
          <div className="mobile-topbar-left">
            <button
              className="mobile-menu-trigger"
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              {ICONS.menu}
            </button>
            <div className="mobile-brand">
              <img src="/logo.png" alt="" className="brand-logo" />
              <div className="mobile-brand-text">
                <strong>Daily Planner</strong>
                <small>{VIEW_TITLES[selectedView] || pageTitle}</small>
              </div>
            </div>
          </div>
          <div className="mobile-topbar-actions">
            <button className="icon-btn" onClick={() => setShowCmdPalette(true)} aria-label="Search (Ctrl+K)" title="Search">
              {ICONS.search}
            </button>
            <button className={`icon-btn notif-trigger${showNotifs ? " active" : ""}`} onClick={() => setShowNotifs(s => !s)} aria-label="Notifications" style={{ position: "relative" }}>
              {ICONS.bell}
              {unreadNotifCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, background: "var(--danger)", color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: "0.55rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              )}
            </button>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? ICONS.sun : ICONS.moon}
            </button>
          </div>
        </div>

        {/* Page header */}
        <div className="page-header">
          <div className="page-header-left">
            {selectedView === "overview" && (
              <div className="greeting-line">{greeting()}</div>
            )}
            <h1 className="page-title">{VIEW_TITLES[selectedView] || pageTitle}</h1>
            {isOverviewOrDay && (
              <div className="page-subtitle">
                {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
          <div className="page-header-right">
            <div className="clock-box">
              <span className="clock-icon">{ICONS.clock}</span>
              <strong>{timeLabel}</strong>
            </div>
            {isOverviewOrDay && (
              <>
                <button className="btn sm" aria-label="Previous day"
                  onClick={() => { const n = addDays(current, -1); setCurrent(n); announce(`Moved to ${fromISO(n).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`); }}>
                  ‹
                </button>
                <button className="btn sm primary" onClick={() => { setCurrent(today); announce("Today selected"); }}>Today</button>
                <button className="btn sm" aria-label="Next day"
                  onClick={() => { const n = addDays(current, 1); setCurrent(n); announce(`Moved to ${fromISO(n).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`); }}>
                  ›
                </button>
              </>
            )}
            <button className="btn sm" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </div>

        {/* Status banner */}
        {status && (
          <div className="status-banner" role="status" aria-live="polite">{status}</div>
        )}

        {/* Week strip (for day-based views) */}
        {isOverviewOrDay && (
          <WeekStrip current={current} onSelect={(d) => { setCurrent(d); }} tasks={tasks} acts={acts} />
        )}

        {/* Day summary line */}
        {isOverviewOrDay && (
          <div className="page-subtitle" style={{ marginBottom: 16, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            {totalDayTasks === 0 ? "No tasks planned for this day — add one to get started."
              : doneTasks === totalDayTasks ? `All ${totalDayTasks} task${totalDayTasks !== 1 ? "s" : ""} complete! 🎉`
              : `${totalDayTasks - doneTasks} of ${totalDayTasks} task${totalDayTasks !== 1 ? "s" : ""} remaining`}
          </div>
        )}

        {/* Content */}
        <div ref={contentRef}>{renderView()}</div>
      </main>

      {/* ── Mobile Navigation Drawer ── */}
      <div
        className={`mobile-menu-backdrop${mobileMenuOpen ? " open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <aside
        className={`mobile-menu-drawer${mobileMenuOpen ? " open" : ""}`}
        aria-label="Mobile Navigation Menu"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-brand">
            <img src="/logo.png" alt="" className="brand-logo" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <div className="brand-text">
              <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>Daily Planner</strong>
              <small style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Focus board</small>
            </div>
          </div>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            {ICONS.x}
          </button>
        </div>

        <nav className="mobile-menu-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="mobile-menu-section">
              <div className="mobile-menu-section-title">{section.label}</div>
              <div className="mobile-menu-items">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-menu-item${selectedView === item.id ? " active" : ""}`}
                    onClick={() => navigateTo(item.id)}
                    aria-current={selectedView === item.id ? "page" : undefined}
                  >
                    <span className="mobile-menu-icon">{ICONS[item.icon]}</span>
                    <span className="mobile-menu-label">{item.label}</span>
                    {item.id === "tasks" && overdueTasks.length > 0 && (
                      <span className="nav-badge">{overdueTasks.length}</span>
                    )}
                    {item.id === "focus" && todayFocusSessions.length > 0 && (
                      <span className="mobile-menu-sub">{todayFocusSessions.length} done</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mobile-menu-footer">
          <div className="mobile-menu-stat">
            <span className="mobile-menu-stat-label">Streak</span>
            <span className="mobile-menu-stat-val">🔥 {streak.current}d</span>
          </div>
          <div className="mobile-menu-stat">
            <span className="mobile-menu-stat-label">Tasks</span>
            <span className="mobile-menu-stat-val">{allTodayTasks.filter(t => t.done).length}/{allTodayTasks.length}</span>
          </div>
          <button
            type="button"
            className="mobile-menu-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar (clean quick tabs) ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <button
          type="button"
          className={`mobile-tab-btn${selectedView === "overview" && !mobileMenuOpen ? " active" : ""}`}
          onClick={() => navigateTo("overview")}
        >
          <span className="mobile-tab-icon">{ICONS.overview}</span>
          <span className="mobile-tab-label">Dashboard</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn${selectedView === "tasks" && !mobileMenuOpen ? " active" : ""}`}
          onClick={() => navigateTo("tasks")}
        >
          <span className="mobile-tab-icon" style={{ position: "relative" }}>
            {ICONS.tasks}
            {overdueTasks.length > 0 && (
              <span className="tab-badge">{overdueTasks.length}</span>
            )}
          </span>
          <span className="mobile-tab-label">Tasks</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn${selectedView === "focus" && !mobileMenuOpen ? " active" : ""}`}
          onClick={() => navigateTo("focus")}
        >
          <span className="mobile-tab-icon">{ICONS.focus}</span>
          <span className="mobile-tab-label">Focus</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn${selectedView === "calendar" && !mobileMenuOpen ? " active" : ""}`}
          onClick={() => navigateTo("calendar")}
        >
          <span className="mobile-tab-icon">{ICONS.calendar}</span>
          <span className="mobile-tab-label">Calendar</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn${mobileMenuOpen || !["overview", "tasks", "focus", "calendar"].includes(selectedView) ? " active" : ""}`}
          onClick={() => setMobileMenuOpen(s => !s)}
          aria-expanded={mobileMenuOpen}
          aria-label="All menus"
        >
          <span className="mobile-tab-icon">{mobileMenuOpen ? ICONS.x : ICONS.menu}</span>
          <span className="mobile-tab-label">Menu</span>
        </button>
      </nav>

      {/* ── Overlays ── */}

      {/* Command palette */}
      {showCmdPalette && (
        <CommandPalette
          tasks={tasks} notes={notes} acts={acts} events={events}
          subjects={subjects} exams={exams} habits={habits}
          onClose={() => setShowCmdPalette(false)}
          onNavigate={(view) => { setSelectedView(view); setShowCmdPalette(false); }}
          onAddTask={() => { setShowCmdPalette(false); setShowQuickAdd(true); }}
          onExport={exportData}
        />
      )}

      {/* Notification center */}
      {showNotifs && (
        <NotificationCenter
          notifications={notifications}
          onMarkRead={markNotifRead}
          onMarkAllRead={markAllRead}
          onClose={() => setShowNotifs(false)}
          onClear={clearNotifs}
        />
      )}

      {/* Quick add modal */}
      {showQuickAdd && (
        <QuickAddModal
          currentDate={current}
          onClose={() => setShowQuickAdd(false)}
          onAddTask={addTask}
          onAddNote={addNote}
          onAddActivity={addActivity}
        />
      )}

      {/* Quick add FAB */}
      <button className="quick-add-fab" aria-label="Quick add" title="Quick add (task, note, activity)" onClick={() => setShowQuickAdd(true)}>
        {ICONS.plus}
      </button>

      {/* Undo toast */}
      {undoItem && (
        <UndoToast
          message={undoItem.message}
          onUndo={handleUndo}
          onDismiss={() => { setUndoItem(null); clearTimeout(undoTimerRef.current); }}
        />
      )}
    </div>
  );
}
