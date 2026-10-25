import { useState } from "react";

export default function NoteList({ notes, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
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
            <div className="txt">{n.text}</div>
            <button type="button" className="x" aria-label="Delete note" onClick={() => onDelete(n.id)}>×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
