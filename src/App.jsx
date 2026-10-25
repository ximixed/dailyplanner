import { useState } from "react";
import useLocalStorage from "./utils/useLocalStorage.js";
import { addDays, fromISO, toISO, uid } from "./utils/dates.js";
import WeekStrip from "./components/WeekStrip.jsx";
import TaskList from "./components/TaskList.jsx";
import ActivityList from "./components/ActivityList.jsx";
import NoteList from "./components/NoteList.jsx";

export default function App() {
  const today = toISO(new Date());
  const [current, setCurrent] = useState(today);
  const [tasks, setTasks] = useLocalStorage("planner:tasks", []);
  const [acts, setActs] = useLocalStorage("planner:acts", []);
  const [notes, setNotes] = useLocalStorage("planner:notes", []);
  const [theme, setTheme] = useState(null); // null = follow system

  const dayTasks = tasks.filter((t) => t.date === current);
  const done = dayTasks.filter((t) => t.done).length;
  const pct = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
  const d = fromISO(current);
  const title =
    current === today ? "Today"
    : current === addDays(today, 1) ? "Tomorrow"
    : current === addDays(today, -1) ? "Yesterday"
    : d.toLocaleDateString(undefined, { weekday: "long" });

  const toggleTheme = () => {
    const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>{title}</h1>
          <div className="sub">
            {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div className="nav">
          <button className="btn" aria-label="Previous day" onClick={() => setCurrent(addDays(current, -1))}>‹</button>
          <button className="btn primary" onClick={() => setCurrent(today)}>Today</button>
          <button className="btn" aria-label="Next day" onClick={() => setCurrent(addDays(current, 1))}>›</button>
          <button className="btn" aria-label="Toggle dark mode" onClick={toggleTheme}>◐</button>
        </div>
      </header>

      <WeekStrip current={current} onSelect={setCurrent} tasks={tasks} acts={acts} />

      <div className="prog" aria-hidden="true"><div style={{ width: pct + "%" }} /></div>
      <div className="sub">
        {dayTasks.length === 0 ? "No tasks planned for this day."
          : done === dayTasks.length ? `All ${dayTasks.length} tasks done.`
          : `${dayTasks.length - done} of ${dayTasks.length} tasks left.`}
      </div>

      <div className="cols">
        <TaskList
          tasks={dayTasks}
          onAdd={(text, pri) => setTasks([...tasks, { id: uid(), date: current, text, pri, done: false }])}
          onToggle={(id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))}
          onDelete={(id) => setTasks(tasks.filter((t) => t.id !== id))}
          onMove={() => setTasks(tasks.map((t) => (t.date === current && !t.done ? { ...t, date: addDays(current, 1) } : t)))}
          onClear={() => setTasks(tasks.filter((t) => !(t.date === current && t.done)))}
        />
        <ActivityList
          acts={acts.filter((a) => a.date === current)}
          onAdd={(title, kind, time) => setActs([...acts, { id: uid(), date: current, title, kind, time }])}
          onDelete={(id) => setActs(acts.filter((a) => a.id !== id))}
        />
        <NoteList
          notes={notes.filter((n) => n.date === current)}
          onAdd={(text) => setNotes([...notes, { id: uid(), date: current, text }])}
          onDelete={(id) => setNotes(notes.filter((n) => n.id !== id))}
        />
      </div>
    </div>
  );
}
