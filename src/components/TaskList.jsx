import { useState, useCallback } from "react";
import { toISO, fmtCountdown, fmtDuration } from "../utils/dates.js";

const PRI_ORDER = { urgent: 0, high: 1, med: 2, low: 3 };
const PRI_LABELS = { urgent: "Urgent", high: "High", med: "Medium", low: "Low" };
const CATEGORIES = ["School", "Work", "Personal", "Errands", "Health", "Finance", "Other"];
const today = toISO(new Date());

function PriBadge({ pri }) {
  const cls = { urgent: "badge-urgent", high: "badge-high", med: "badge-med", low: "badge-low" }[pri] || "badge-med";
  return <span className={`badge ${cls}`}>{PRI_LABELS[pri] || "Medium"}</span>;
}

const VIEWS = [
  { id: "all",       label: "All" },
  { id: "today",     label: "Today" },
  { id: "upcoming",  label: "Upcoming" },
  { id: "overdue",   label: "Overdue" },
  { id: "active",    label: "Active" },
  { id: "completed", label: "Done" },
  { id: "important", label: "Important" },
];

export default function TaskList({ tasks, onAdd, onUpdate, onToggle, onDelete, onMove, onClear, currentDate }) {
  // ── Form state ──
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("med");
  const [category, setCategory] = useState("School");
  const [duration, setDuration] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskText, setSubtaskText] = useState("");
  const [tags, setTags] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── Edit state ──
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editSubtaskText, setEditSubtaskText] = useState("");

  // ── UI state ──
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("priority");
  const [showKanban, setShowKanban] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // ── Derived ──
  const done = tasks.filter(t => t.done).length;

  const filtered = tasks.filter(t => {
    const tl = (t.title || "").toLowerCase();
    const dl = (t.description || "").toLowerCase();
    const q = search.toLowerCase();
    if (search && !tl.includes(q) && !dl.includes(q)) return false;
    if (view === "today")     return t.date === today && !t.done;
    if (view === "upcoming")  return t.dueDate > today && !t.done;
    if (view === "overdue")   return t.dueDate && t.dueDate < today && !t.done;
    if (view === "active")    return !t.done;
    if (view === "completed") return t.done;
    if (view === "important") return (t.priority === "urgent" || t.priority === "high") && !t.done;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") {
      const da = a.done ? 1 : 0, db = b.done ? 1 : 0;
      if (da !== db) return da - db;
      return (PRI_ORDER[a.priority] ?? 2) - (PRI_ORDER[b.priority] ?? 2);
    }
    if (sort === "dueDate") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    if (sort === "title") return (a.title || "").localeCompare(b.title || "");
    if (sort === "created") return (b.id || "").localeCompare(a.id || "");
    return 0;
  });

  // ── Form helpers ──
  const resetForm = () => {
    setText(""); setDescription(""); setPriority("med"); setCategory("School");
    setDuration(30); setDueDate(""); setStartDate(""); setSubtasks([]); setSubtaskText(""); setTags("");
    setShowForm(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      title: text.trim(), description: description.trim(),
      priority, category,
      duration: Number(duration) || 0,
      dueDate: dueDate || currentDate || today,
      startDate: startDate || "",
      subtasks: subtasks.map(s => typeof s === "string" ? { text: s, done: false } : s).filter(s => s.text),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    resetForm();
  };

  const addSubtask = () => {
    const next = subtaskText.trim();
    if (!next) return;
    setSubtasks(p => [...p, { text: next, done: false }]);
    setSubtaskText("");
  };

  // ── Edit helpers ──
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditFields({
      title: task.title || "", description: task.description || "",
      priority: task.priority || "med", category: task.category || "School",
      duration: task.duration || 0, dueDate: task.dueDate || "",
      startDate: task.startDate || "",
      subtasks: Array.isArray(task.subtasks) ? task.subtasks.map(s => typeof s === "string" ? { text: s, done: false } : s) : [],
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
    });
    setEditSubtaskText("");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editFields.title?.trim()) return;
    onUpdate?.(editingId, {
      title: editFields.title.trim(),
      description: editFields.description?.trim() || "",
      priority: editFields.priority,
      category: editFields.category,
      duration: Number(editFields.duration) || 0,
      dueDate: editFields.dueDate || "",
      startDate: editFields.startDate || "",
      subtasks: editFields.subtasks || [],
      tags: (editFields.tags || "").split(",").map(t => t.trim()).filter(Boolean),
    });
    setEditingId(null);
  };

  const addEditSubtask = () => {
    const next = editSubtaskText.trim();
    if (!next) return;
    setEditFields(p => ({ ...p, subtasks: [...(p.subtasks || []), { text: next, done: false }] }));
    setEditSubtaskText("");
  };

  const toggleSubtask = (taskId, idx) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subs = [...(task.subtasks || [])].map((s, i) =>
      i === idx ? { ...(typeof s === "string" ? { text: s } : s), done: !((typeof s === "string" ? { done: false } : s).done) } : s
    );
    onUpdate?.(taskId, { subtasks: subs });
  };

  const duplicateTask = (task) => {
    onAdd({ ...task, id: undefined, title: task.title + " (copy)", done: false });
  };

  // ── Drag & Drop ──
  const handleDragStart = (id) => setDragId(id);
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOver(id); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOver(null); return; }
    // simple reorder via moving task "above" target — just swap dates/positions
    // For real reorder we'd need an order field; for now just indicate drop worked
    setDragId(null); setDragOver(null);
  };

  // ── Kanban ──
  const kanbanCols = {
    todo:        tasks.filter(t => !t.done && t.status !== "progress"),
    "in-progress": tasks.filter(t => t.status === "progress"),
    done:        tasks.filter(t => t.done),
  };

  const moveKanban = (taskId, col) => {
    if (col === "done") onUpdate?.(taskId, { done: true, status: "done" });
    else if (col === "in-progress") onUpdate?.(taskId, { done: false, status: "progress" });
    else onUpdate?.(taskId, { done: false, status: "todo" });
  };

  if (showKanban) {
    return (
      <div className="tasks-page">
        <div className="tasks-toolbar">
          <h2 style={{ margin: 0, flex: 1 }}>
            <span className="section-icon task-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:"100%",height:"100%"}}>
                <path d="M8 7.5h10"/><path d="M8 12h10"/><path d="M8 16.5h10"/><path d="M5 7.5h.01"/><path d="M5 12h.01"/><path d="M5 16.5h.01"/>
              </svg>
            </span>
            Kanban Board
          </h2>
          <button className="btn sm" onClick={() => setShowKanban(false)}>List view</button>
        </div>
        <div className="kanban-board">
          {[
            { id: "todo", label: "To Do", color: "var(--muted)" },
            { id: "in-progress", label: "In Progress", color: "var(--warning)" },
            { id: "done", label: "Completed", color: "var(--success)" },
          ].map(col => (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title" style={{ color: col.color }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block" }} />
                  {col.label}
                </span>
                <span className="kanban-col-count">{kanbanCols[col.id]?.length || 0}</span>
              </div>
              {(kanbanCols[col.id] || []).length === 0 && (
                <div className="empty-box" style={{ minHeight: 60 }}>Drop tasks here</div>
              )}
              {(kanbanCols[col.id] || []).map(t => (
                <div key={t.id} className={`kanban-card p-${t.priority || "med"}`} draggable>
                  <div className="kanban-card-title">{t.title}</div>
                  <div className="kanban-card-meta">
                    <PriBadge pri={t.priority || "med"} />
                    {t.category && <span className="tag tag-gray">{t.category}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {col.id !== "todo" && <button className="btn sm ghost" onClick={() => moveKanban(t.id, "todo")}>← To Do</button>}
                    {col.id !== "in-progress" && <button className="btn sm ghost" onClick={() => moveKanban(t.id, "in-progress")}>In Progress</button>}
                    {col.id !== "done" && <button className="btn sm ghost" onClick={() => moveKanban(t.id, "done")}>✓ Done</button>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, flex: 1 }}>
          <span className="section-icon task-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:"100%",height:"100%"}}>
              <path d="M8 7.5h10"/><path d="M8 12h10"/><path d="M8 16.5h10"/><path d="M5 7.5h.01"/><path d="M5 12h.01"/><path d="M5 16.5h.01"/>
            </svg>
          </span>
          Tasks
          {tasks.length > 0 && <span className="count">{done}/{tasks.length} done</span>}
        </h2>
        <button className="btn sm" onClick={() => setShowKanban(true)}>Kanban</button>
        <button className="btn sm primary" onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ New task"}</button>
      </div>

      {/* Filters / Views */}
      <div className="pill-group">
        {VIEWS.map(v => (
          <button key={v.id} className={`pill${view === v.id ? " active" : ""}`} onClick={() => setView(v.id)}>
            {v.label}
            {v.id === "overdue" && tasks.filter(t => t.dueDate && t.dueDate < today && !t.done).length > 0 && (
              <span style={{ marginLeft: 4, color: "var(--danger)" }}>
                {tasks.filter(t => t.dueDate && t.dueDate < today && !t.done).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="search-wrap" style={{ position: "relative", flex: 1, minWidth: 140, maxWidth: 280 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--faint)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" style={{ paddingLeft: 32 }} aria-label="Search tasks" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort tasks" style={{ flex: "0 0 auto" }}>
          <option value="priority">Sort: Priority</option>
          <option value="dueDate">Sort: Due date</option>
          <option value="title">Sort: Title</option>
          <option value="created">Sort: Newest</option>
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="task-form-card">
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="task-field-row">
              <div className="field" style={{ flex: 2 }}>
                <label>Task title *</label>
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="What needs doing?" required autoFocus />
              </div>
              <div className="field" style={{ flex: "0 0 auto" }}>
                <label>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} aria-label="Priority">
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟡 High</option>
                  <option value="med">🔵 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>
            <div className="task-field-row">
              <div className="field">
                <label>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a brief description…" />
              </div>
            </div>
            <div className="task-field-row">
              <div className="field">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Due date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Start date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Est. duration (min)</label>
                <input type="number" min="0" step="15" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="task-field-row">
              <div className="field">
                <label>Tags (comma separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. homework, math" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Checklist item</label>
                <input type="text" value={subtaskText} onChange={e => setSubtaskText(e.target.value)} placeholder="Add checklist item…" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} />
              </div>
              <button className="btn sm" type="button" onClick={addSubtask} style={{ marginBottom: 0 }}>+ Add</button>
            </div>
            {subtasks.length > 0 && (
              <ul className="mini-checklist">
                {subtasks.map((s, i) => (
                  <li key={i}>
                    <span>•</span>
                    <span style={{ flex: 1 }}>{s.text || s}</span>
                    <button type="button" className="x" onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))}>×</button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" className="btn sm" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn sm primary">Add task</button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h4>{view === "completed" ? "No completed tasks yet" : view === "overdue" ? "No overdue tasks" : "No tasks here"}</h4>
          <p>{view === "all" || view === "today" ? "Add a task above to get started." : `Switch to a different view or add a new task.`}</p>
          {(view === "all" || view === "today") && !showForm && (
            <button className="btn sm primary" onClick={() => setShowForm(true)}>+ Add first task</button>
          )}
        </div>
      ) : (
        <ul className="task-list-ul">
          {sorted.map(t => {
            const priorityKey = t.priority || "med";
            const isOverdue = t.dueDate && t.dueDate < today && !t.done;
            const subs = Array.isArray(t.subtasks) ? t.subtasks.map(s => typeof s === "string" ? { text: s, done: false } : s) : [];
            const subsDone = subs.filter(s => s.done).length;

            if (editingId === t.id) {
              return (
                <li key={t.id} className={`task-item p-${priorityKey}`} style={{ flexDirection: "column", gap: 10, cursor: "default" }}>
                  <form onSubmit={saveEdit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="task-field-row">
                      <input type="text" value={editFields.title || ""} onChange={e => setEditFields(p => ({ ...p, title: e.target.value }))} required autoFocus />
                      <select value={editFields.priority || "med"} onChange={e => setEditFields(p => ({ ...p, priority: e.target.value }))}>
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟡 High</option>
                        <option value="med">🔵 Medium</option>
                        <option value="low">🟢 Low</option>
                      </select>
                    </div>
                    <div className="task-field-row">
                      <input type="text" value={editFields.description || ""} onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
                      <select value={editFields.category || "School"} onChange={e => setEditFields(p => ({ ...p, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="task-field-row">
                      <input type="date" value={editFields.dueDate || ""} onChange={e => setEditFields(p => ({ ...p, dueDate: e.target.value }))} />
                      <input type="number" min="0" step="15" value={editFields.duration || 0} onChange={e => setEditFields(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (min)" />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <input style={{ flex: 1 }} type="text" value={editSubtaskText} onChange={e => setEditSubtaskText(e.target.value)} placeholder="Add checklist item" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEditSubtask(); } }} />
                      <button type="button" className="btn sm" onClick={addEditSubtask}>+ Add</button>
                    </div>
                    {editFields.subtasks?.length > 0 && (
                      <ul className="mini-checklist">
                        {editFields.subtasks.map((s, i) => (
                          <li key={i}>
                            <span>•</span>
                            <span style={{ flex: 1 }}>{s.text || s}</span>
                            <button type="button" className="x" onClick={() => setEditFields(p => ({ ...p, subtasks: p.subtasks.filter((_, j) => j !== i) }))}>×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button type="button" className="btn sm" onClick={() => setEditingId(null)}>Cancel</button>
                      <button type="submit" className="btn sm primary">Save changes</button>
                    </div>
                  </form>
                </li>
              );
            }

            return (
              <li
                key={t.id}
                className={`task-item p-${priorityKey}${t.done ? " done" : ""}${dragOver === t.id ? " drag-over" : ""}`}
                draggable
                onDragStart={() => handleDragStart(t.id)}
                onDragOver={e => handleDragOver(e, t.id)}
                onDrop={e => handleDrop(e, t.id)}
                onDragEnd={() => { setDragId(null); setDragOver(null); }}
              >
                <input
                  type="checkbox"
                  checked={!!t.done}
                  onChange={() => onToggle(t.id)}
                  className="task-check"
                  aria-label={`Mark done: ${t.title}`}
                />
                <div className="task-body">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <PriBadge pri={priorityKey} />
                    {t.category && <span className="tag tag-gray">{t.category}</span>}
                    {t.dueDate && (
                      <span className={`task-meta-item${isOverdue ? " text-danger" : ""}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4"/><path d="M16.5 3.5v4"/><path d="M3.5 9.5h17"/></svg>
                        {isOverdue ? `Overdue · ${fmtCountdown(t.dueDate)}` : fmtCountdown(t.dueDate)}
                      </span>
                    )}
                    {t.duration > 0 && (
                      <span className="task-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></svg>
                        {fmtDuration(t.duration)}
                      </span>
                    )}
                    {Array.isArray(t.tags) && t.tags.map(tag => (
                      <span key={tag} className="tag tag-blue" style={{ fontSize: "0.65rem" }}>#{tag}</span>
                    ))}
                    {subs.length > 0 && (
                      <span className="task-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7.5h10"/><path d="M8 12h10"/><path d="M5 7.5h.01"/><path d="M5 12h.01"/></svg>
                        {subsDone}/{subs.length}
                      </span>
                    )}
                  </div>
                  {t.description && <div className="task-desc">{t.description}</div>}
                  {subs.length > 0 && (
                    <div className="subtask-list">
                      {subs.map((s, i) => (
                        <div key={i} className={`subtask-item${s.done ? " done" : ""}`}>
                          <input type="checkbox" checked={!!s.done} onChange={() => toggleSubtask(t.id, i)} />
                          <span>{s.text || s}</span>
                        </div>
                      ))}
                      {subs.length > 0 && (
                        <div className="progress-bar" style={{ margin: "4px 0" }}>
                          <div className="progress-fill success" style={{ width: `${Math.round((subsDone / subs.length) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="task-actions">
                  <button type="button" className="btn sm ghost" onClick={() => startEdit(t)}>Edit</button>
                  <button type="button" className="btn sm ghost" onClick={() => duplicateTask(t)}>Copy</button>
                  <button type="button" className="btn sm ghost" aria-label="Move to tomorrow" onClick={() => onMove?.(t.id)}>→ Tmrw</button>
                  <button type="button" className="x-btn" aria-label="Delete task" onClick={() => onDelete(t.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bottom tools */}
      {tasks.length > 0 && (
        <div className="tools">
          <button className="btn sm" type="button" onClick={() => tasks.filter(t => !t.done).forEach(t => onMove?.(t.id))}>
            Move unfinished → Tomorrow
          </button>
          <button className="btn sm" type="button" onClick={onClear}>Clear completed</button>
        </div>
      )}
    </div>
  );
}
