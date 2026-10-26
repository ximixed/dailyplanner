import { useState } from "react";

export default function NoteList({ notes, onAdd, onUpdate, onDelete }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim() });
    setText("");
  };

  const beginEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text || "");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editText.trim()) return;
    onUpdate?.(editingId, { text: editText.trim() });
    setEditingId(null);
    setEditText("");
  };

  return (
    <section aria-labelledby="h-notes">
      <h2 id="h-notes">Notes{notes.length > 0 && <span>{notes.length}</span>}</h2>
      <form onSubmit={submit}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Write a note for this day" aria-label="Note" required />
        <button className="btn primary" type="submit">Save note</button>
      </form>
      <ul>
        {notes.length === 0 && <li className="empty">No notes for this day.</li>}
        {notes.map((n) => (
          <li key={n.id} className="note">
            {editingId === n.id ? (
              <form onSubmit={saveEdit} style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} aria-label="Edit note" required style={{ flex: 1 }} />
                <div className="task-actions" style={{ marginLeft: 0 }}>
                  <button type="submit" className="btn primary small">Save</button>
                  <button type="button" className="btn small" onClick={() => { setEditingId(null); setEditText(""); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="txt">{n.text}</div>
                <div className="task-actions">
                  <button type="button" className="btn small" onClick={() => beginEdit(n)}>Edit</button>
                  <button type="button" className="x" aria-label="Delete note" onClick={() => onDelete(n.id)}>×</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
