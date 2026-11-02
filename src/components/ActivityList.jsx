import { useState } from "react";
import { fmtTime } from "../utils/dates.js";

const KINDS = { class: "Class", exam: "Exam", due: "Assignment due", club: "Club / Event", other: "Other" };
const KIND_COLORS = { class: "tag-blue", exam: "tag-red", due: "tag-amber", club: "tag-green", other: "tag-gray" };

export default function ActivityList({ acts, onAdd, onUpdate, onDelete }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("class");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editKind, setEditKind] = useState("class");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const sorted = [...acts].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const resetForm = () => { setTitle(""); setKind("class"); setTime(""); setLocation(""); setShowForm(false); };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), kind, time: time || "", location: location.trim() });
    resetForm();
  };

  const beginEdit = (a) => {
    setEditingId(a.id);
    setEditTitle(a.title || "");
    setEditKind(a.kind || "class");
    setEditTime(a.time || a.startTime || "");
    setEditLocation(a.location || "");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    onUpdate?.(editingId, { title: editTitle.trim(), kind: editKind, time: editTime || "", location: editLocation.trim() });
    setEditingId(null);
  };

  return (
    <section aria-labelledby="h-acts">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 id="h-acts" style={{ margin: 0, flex: 1 }}>
          <span className="section-icon activity-icon">▣</span>
          Activities
          {acts.length > 0 && <span className="count">{acts.length}</span>}
        </h2>
        <button className="btn sm primary" onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ Add"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, background: "var(--elevated)", padding: "14px", borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Math quiz, Chess club" aria-label="Activity title" required autoFocus />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={kind} onChange={e => setKind(e.target.value)} aria-label="Type" style={{ flex: "1 1 120px" }}>
              {Object.entries(KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Time" style={{ flex: "0 1 130px" }} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" style={{ flex: "1 1 120px" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn sm" onClick={resetForm}>Cancel</button>
            <button className="btn sm primary" type="submit">Add activity</button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h4>No activities scheduled</h4>
          <p>Add classes, exams, deadlines or clubs for this day.</p>
          {!showForm && <button className="btn sm primary" onClick={() => setShowForm(true)}>+ Schedule activity</button>}
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(a => {
            if (editingId === a.id) {
              return (
                <li key={a.id} className={`task-item act-item k-${a.kind}`} style={{ flexDirection: "column", cursor: "default" }}>
                  <form onSubmit={saveEdit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required autoFocus />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <select value={editKind} onChange={e => setEditKind(e.target.value)} style={{ flex: "1 1 120px" }}>
                        {Object.entries(KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                      <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} style={{ flex: "0 1 130px" }} />
                      <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Location" style={{ flex: "1 1 120px" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button type="button" className="btn sm" onClick={() => setEditingId(null)}>Cancel</button>
                      <button type="submit" className="btn sm primary">Save</button>
                    </div>
                  </form>
                </li>
              );
            }

            return (
              <li key={a.id} className={`task-item act-item k-${a.kind}`}>
                <div className="task-body">
                  <div className="task-title">{a.title}</div>
                  <div className="task-meta">
                    <span className={`tag ${KIND_COLORS[a.kind] || "tag-gray"}`}>{KINDS[a.kind] || a.kind}</span>
                    {a.time && (
                      <span className="task-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></svg>
                        {fmtTime(a.time)}
                      </span>
                    )}
                    {a.location && <span className="task-meta-item">📍 {a.location}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button type="button" className="btn sm ghost" onClick={() => beginEdit(a)}>Edit</button>
                  <button type="button" className="x-btn" aria-label="Delete activity" onClick={() => onDelete(a.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
