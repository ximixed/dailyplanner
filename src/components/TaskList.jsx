import { useState } from "react";

const PRI = { high: "High priority", med: "Medium priority", low: "Low priority" };
const ORDER = { high: 0, med: 1, low: 2 };

export default function TaskList({ tasks, onAdd, onUpdate, onToggle, onDelete, onMove, onClear }) {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("med");
  const [category, setCategory] = useState("School");
  const [duration, setDuration] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskText, setSubtaskText] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("med");
  const [editCategory, setEditCategory] = useState("School");
  const [editDuration, setEditDuration] = useState(30);
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [editSubtaskText, setEditSubtaskText] = useState("");

  const sorted = [...tasks].sort((a, b) => {
    const pa = a.done ? 1 : 0;
    const pb = b.done ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return (ORDER[a.priority || a.pri || "med"] ?? 1) - (ORDER[b.priority || b.pri || "med"] ?? 1);
  });
  const done = tasks.filter((t) => t.done).length;
  const visible = sorted.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const resetForm = () => {
    setText("");
    setDescription("");
    setPriority("med");
    setCategory("School");
    setDuration(30);
    setDueDate("");
    setSubtasks([]);
    setSubtaskText("");
  };

  const resetEditForm = () => {
    setEditingId(null);
    setEditText("");
    setEditDescription("");
    setEditPriority("med");
    setEditCategory("School");
    setEditDuration(30);
    setEditDueDate("");
    setEditSubtasks([]);
    setEditSubtaskText("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      title: text.trim(),
      description: description.trim(),
      priority,
      category,
      duration: Number(duration) || 0,
      dueDate: dueDate || "",
      subtasks: subtasks.filter(Boolean),
    });
    resetForm();
  };

  const addSubtask = () => {
    const next = subtaskText.trim();
    if (!next) return;
    setSubtasks((prev) => [...prev, next]);
    setSubtaskText("");
  };

  const addEditSubtask = () => {
    const next = editSubtaskText.trim();
    if (!next) return;
    setEditSubtasks((prev) => [...prev, next]);
    setEditSubtaskText("");
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.title || task.text || "");
    setEditDescription(task.description || "");
    setEditPriority(task.priority || task.pri || "med");
    setEditCategory(task.category || "School");
    setEditDuration(task.duration || 0);
    setEditDueDate(task.dueDate || "");
    setEditSubtasks(task.subtasks || []);
    setEditSubtaskText("");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editText.trim()) return;
    onUpdate?.(editingId, {
      title: editText.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      category: editCategory,
      duration: Number(editDuration) || 0,
      dueDate: editDueDate || "",
      subtasks: editSubtasks.filter(Boolean),
    });
    resetEditForm();
  };

  return (
    <section aria-labelledby="h-tasks">
      <h2 id="h-tasks"><span className="section-icon task-icon">✓</span>Tasks{tasks.length > 0 && <span>{done}/{tasks.length} done</span>}</h2>
      <div className="tools compact-tools" style={{ marginBottom: 12 }}>
        <button type="button" className={filter === "all" ? "btn primary" : "btn"} onClick={() => setFilter("all")}>All</button>
        <button type="button" className={filter === "active" ? "btn primary" : "btn"} onClick={() => setFilter("active")}>Active</button>
        <button type="button" className={filter === "done" ? "btn primary" : "btn"} onClick={() => setFilter("done")}>Done</button>
      </div>
      <form onSubmit={submit} className="task-form">
        <div className="task-input-row">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="What needs doing?" aria-label="Task" required />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="high">High</option>
            <option value="med">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="task-input-row compact">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description" aria-label="Description" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        </div>
        <div className="task-input-row compact">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="School">School</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Errands">Errands</option>
          </select>
          <input type="number" min="0" step="15" value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration in minutes" />
          <button className="btn primary" type="submit">Add task</button>
        </div>
        <div className="task-input-row compact checklist-row">
          <input type="text" value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} placeholder="Add checklist item" aria-label="Checklist" />
          <button className="btn" type="button" onClick={addSubtask}>+ item</button>
        </div>
        {subtasks.length > 0 && (
          <ul className="mini-checklist">
            {subtasks.map((item, index) => (
              <li key={`${item}-${index}`}>
                <span>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </form>
      <ul>
        {visible.length === 0 && <li className="empty">No tasks in this view.</li>}
        {visible.map((t) => {
          const title = t.title || t.text || "Untitled task";
          const priorityKey = t.priority || t.pri || "med";
          if (editingId === t.id) {
            return (
              <li key={t.id} className="task-editor-wrap">
                <form onSubmit={saveEdit} className="task-form" style={{ width: "100%" }}>
                  <div className="task-input-row">
                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} aria-label="Edit task title" required />
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} aria-label="Edit priority">
                      <option value="high">High</option>
                      <option value="med">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="task-input-row compact">
                    <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Edit description" aria-label="Edit description" />
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} aria-label="Edit due date" />
                  </div>
                  <div className="task-input-row compact">
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} aria-label="Edit category">
                      <option value="School">School</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Errands">Errands</option>
                    </select>
                    <input type="number" min="0" step="15" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} aria-label="Edit duration" />
                  </div>
                  <div className="task-input-row compact checklist-row">
                    <input type="text" value={editSubtaskText} onChange={(e) => setEditSubtaskText(e.target.value)} placeholder="Add checklist item" aria-label="Edit checklist" />
                    <button className="btn" type="button" onClick={addEditSubtask}>+ item</button>
                  </div>
                  {editSubtasks.length > 0 && (
                    <ul className="mini-checklist">
                      {editSubtasks.map((item, index) => (
                        <li key={`${item}-${index}`}>
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="task-actions" style={{ marginLeft: 0, width: "100%", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn primary small">Save</button>
                    <button type="button" className="btn small" onClick={resetEditForm}>Cancel</button>
                  </div>
                </form>
              </li>
            );
          }

          return (
            <li key={t.id} className={`p-${priorityKey}${t.done ? " done" : ""}`}>
              <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} aria-label={`Mark done: ${title}`} />
              <div className="txt">
                {title}
                <span className="meta">
                  {PRI[priorityKey] || PRI.med}
                  {t.duration ? ` • ${t.duration} min` : ""}
                  {t.category ? ` • ${t.category}` : ""}
                  {t.dueDate ? ` • due ${t.dueDate}` : ""}
                </span>
                {t.description && <span className="meta muted-line">{t.description}</span>}
                {t.subtasks?.length > 0 && (
                  <span className="meta muted-line">
                    Checklist: {t.subtasks.length} item{t.subtasks.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <div className="task-actions">
                <button type="button" className="btn small" onClick={() => startEdit(t)}>Edit</button>
                <button type="button" className="btn small" aria-label="Move task to tomorrow" onClick={() => onMove?.(t.id)}>Move</button>
                <button type="button" className="x" aria-label="Delete task" onClick={() => onDelete(t.id)}>×</button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="tools">
        <button className="btn" type="button" onClick={() => tasks.filter((t) => !t.done).forEach((t) => onMove?.(t.id))}>Move unfinished to tomorrow</button>
        <button className="btn" type="button" onClick={onClear}>Clear completed</button>
      </div>
    </section>
  );
}
