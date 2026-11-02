import { useState, useEffect, useRef, useMemo } from "react";
import { toISO } from "../utils/dates.js";

const today = toISO(new Date());

const SVG = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...props} />
);

const ICONS = {
  search: <SVG><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></SVG>,
  task:   <SVG><path d="M8 7.5h10M8 12h10M8 16.5h10M5 7.5h.01M5 12h.01M5 16.5h.01" /></SVG>,
  note:   <SVG><path d="M7 4.5h8l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M15 4.5v4h4M8 12h8M8 16h8" /></SVG>,
  act:    <SVG><path d="M5 18V8M10 18V5M15 18v-9M20 18v-6" /></SVG>,
  focus:  <SVG><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 3.5" /></SVG>,
  cal:    <SVG><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" /></SVG>,
  habit:  <SVG><path d="M4 12a8 8 0 0 1 8-8" strokeDasharray="4 2" /><path d="M20 12a8 8 0 0 1-8 8" strokeDasharray="4 2" /><path d="M12 4v4M12 16v4" /></SVG>,
  exam:   <SVG><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></SVG>,
  nav:    <SVG><path d="M5 12h14M12 5l7 7-7 7" /></SVG>,
  plus:   <SVG><path d="M12 5v14M5 12h14" /></SVG>,
  export: <SVG><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SVG>,
};

const QUICK_ACTIONS = (onNavigate, onAddTask, onExport) => [
  { id: "qa-task",    label: "Create a task",       icon: "plus",   action: onAddTask,            hint: "Opens quick add" },
  { id: "qa-focus",   label: "Open Focus Timer",    icon: "focus",  action: () => onNavigate("focus"),    hint: "Navigate" },
  { id: "qa-cal",     label: "Open Calendar",       icon: "cal",    action: () => onNavigate("calendar"), hint: "Navigate" },
  { id: "qa-plan",    label: "Open Daily Planner",  icon: "nav",    action: () => onNavigate("planner"),  hint: "Navigate" },
  { id: "qa-habits",  label: "Open Habit Tracker",  icon: "habit",  action: () => onNavigate("habits"),   hint: "Navigate" },
  { id: "qa-refl",    label: "Open Reflection",     icon: "note",   action: () => onNavigate("reflection"), hint: "Navigate" },
  { id: "qa-export",  label: "Export data",         icon: "export", action: onExport,             hint: "Download backup" },
];

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark style={{ background: "var(--accent)", color: "#fff", borderRadius: 2, padding: "0 2px" }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
}

export default function CommandPalette({
  tasks = [], notes = [], acts = [], events = [], subjects = [],
  exams = [], habits = [],
  onClose, onNavigate, onAddTask, onExport,
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();

  const quickActions = useMemo(() =>
    QUICK_ACTIONS(onNavigate, onAddTask, onExport), [onNavigate, onAddTask, onExport]);

  const results = useMemo(() => {
    if (!q) return [];
    const hits = [];

    tasks.filter(t => !t.archived).forEach(t => {
      if (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        hits.push({
          id: `task-${t.id}`, type: "task", icon: "task", label: t.title,
          meta: [t.priority, t.dueDate].filter(Boolean).join(" · "),
          action: () => onNavigate("tasks"),
        });
      }
    });

    notes.forEach(n => {
      if (n.text?.toLowerCase().includes(q)) {
        hits.push({
          id: `note-${n.id}`, type: "note", icon: "note", label: n.text.slice(0, 60),
          meta: n.category,
          action: () => onNavigate("notes"),
        });
      }
    });

    acts.forEach(a => {
      if (a.title?.toLowerCase().includes(q)) {
        hits.push({
          id: `act-${a.id}`, type: "activity", icon: "act", label: a.title,
          meta: [a.date, a.startTime].filter(Boolean).join(" · "),
          action: () => onNavigate("activities"),
        });
      }
    });

    exams.forEach(e => {
      if (e.name?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q)) {
        hits.push({
          id: `exam-${e.id}`, type: "exam", icon: "exam", label: e.name,
          meta: e.date,
          action: () => onNavigate("student"),
        });
      }
    });

    subjects.forEach(s => {
      if (s.name?.toLowerCase().includes(q)) {
        hits.push({
          id: `sub-${s.id}`, type: "subject", icon: "nav", label: s.name,
          meta: "Subject",
          action: () => onNavigate("student"),
        });
      }
    });

    habits.forEach(h => {
      if (h.name?.toLowerCase().includes(q)) {
        hits.push({
          id: `habit-${h.id}`, type: "habit", icon: "habit", label: h.name,
          meta: h.frequency,
          action: () => onNavigate("habits"),
        });
      }
    });

    events.forEach(ev => {
      if (ev.title?.toLowerCase().includes(q)) {
        hits.push({
          id: `ev-${ev.id}`, type: "event", icon: "cal", label: ev.title,
          meta: ev.date,
          action: () => onNavigate("calendar"),
        });
      }
    });

    return hits.slice(0, 20);
  }, [q, tasks, notes, acts, exams, subjects, habits, events]);

  const displayItems = q ? results : quickActions;

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, displayItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = displayItems[cursor];
      if (item) { item.action(); onClose(); }
    }
    if (e.key === "Escape") onClose();
  };

  const TYPE_LABELS = {
    task: "Tasks", note: "Notes", activity: "Activities", exam: "Exams",
    subject: "Subjects", habit: "Habits", event: "Events",
  };

  // Group results by type
  const grouped = useMemo(() => {
    if (!q) return null;
    const groups = {};
    results.forEach(r => {
      const g = TYPE_LABELS[r.type] || r.type;
      if (!groups[g]) groups[g] = [];
      groups[g].push(r);
    });
    return groups;
  }, [results, q]);

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette">
        {/* Search input */}
        <div className="cmd-input-row">
          <span className="cmd-search-icon">{ICONS.search}</span>
          <input
            ref={inputRef}
            className="cmd-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tasks, notes, habits, exams… or try a command"
            aria-label="Search"
          />
          <kbd className="cmd-esc-hint" onClick={onClose}>Esc</kbd>
        </div>

        {/* Results list */}
        <div className="cmd-results" ref={listRef}>
          {!q && (
            <div className="cmd-section-label">Quick actions</div>
          )}

          {!q && quickActions.map((item, i) => (
            <div key={item.id}
              className={`cmd-item${cursor === i ? " focused" : ""}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => { item.action(); onClose(); }}>
              <span className="cmd-item-icon">{ICONS[item.icon] || ICONS.nav}</span>
              <span className="cmd-item-label">{item.label}</span>
              <span className="cmd-item-hint">{item.hint}</span>
            </div>
          ))}

          {q && results.length === 0 && (
            <div className="cmd-empty">
              <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🔍</div>
              No results for "<strong>{query}</strong>"
            </div>
          )}

          {q && grouped && Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="cmd-section-label">{group}</div>
              {items.map(item => {
                const globalIdx = results.indexOf(item);
                return (
                  <div key={item.id}
                    className={`cmd-item${cursor === globalIdx ? " focused" : ""}`}
                    onMouseEnter={() => setCursor(globalIdx)}
                    onClick={() => { item.action(); onClose(); }}>
                    <span className="cmd-item-icon">{ICONS[item.icon] || ICONS.nav}</span>
                    <div className="cmd-item-content">
                      <span className="cmd-item-label">{highlight(item.label, query)}</span>
                      {item.meta && <span className="cmd-item-meta">{item.meta}</span>}
                    </div>
                    <span className="cmd-item-type-badge">{item.type}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
