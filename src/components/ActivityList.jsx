import { useState } from "react";
import { fmtTime } from "../utils/dates.js";

const KINDS = { class: "Class", exam: "Exam", due: "Assignment due", club: "Club or event" };

export default function ActivityList({ acts, onAdd, onUpdate, onDelete }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("class");
  const [time, setTime] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editKind, setEditKind] = useState("class");
  const [editTime, setEditTime] = useState("");
  const sorted = [...acts].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const resetForm = () => {
    setTitle("");
    setKind("class");
    setTime("");
  };

  const resetEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditKind("class");
    setEditTime("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), kind, time: time || "" });
    resetForm();
  };

  const beginEdit = (activity) => {
    setEditingId(activity.id);
    setEditTitle(activity.title || "");
    setEditKind(activity.kind || "class");
    setEditTime(activity.time || activity.startTime || "");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    onUpdate?.(editingId, { title: editTitle.trim(), kind: editKind, time: editTime || "" });
    resetEdit();
  };

  return (
    <section aria-labelledby="h-acts">
      <h2 id="h-acts">School activities{acts.length > 0 && <span>{acts.length}</span>}</h2>
      <form onSubmit={submit}>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Math quiz, Chess club" aria-label="Activity" required />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          {Object.entries(KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
        <button className="btn primary" type="submit">Add activity</button>
      </form>
      <ul>
        {sorted.length === 0 && <li className="empty">Nothing scheduled. Add classes, exams, deadlines or clubs.</li>}
        {sorted.map((a) => {
          if (editingId === a.id) {
            return (
              <li key={a.id} className={`k-${a.kind}`}>
                <form onSubmit={saveEdit} style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Edit activity title" required />
                  <select value={editKind} onChange={(e) => setEditKind(e.target.value)} aria-label="Edit activity type">
                    {Object.entries(KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} aria-label="Edit activity time" />
                  <div className="task-actions" style={{ marginLeft: 0 }}>
                    <button type="submit" className="btn primary small">Save</button>
                    <button type="button" className="btn small" onClick={resetEdit}>Cancel</button>
                  </div>
                </form>
              </li>
            );
          }

          return (
            <li key={a.id} className={`k-${a.kind}`}>
              <div className="txt">{a.title}
                <span className="meta">{KINDS[a.kind]}{a.time ? `, ${fmtTime(a.time)}` : ""}</span>
              </div>
              <div className="task-actions">
                <button type="button" className="btn small" onClick={() => beginEdit(a)}>Edit</button>
                <button type="button" className="x" aria-label="Delete activity" onClick={() => onDelete(a.id)}>×</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
