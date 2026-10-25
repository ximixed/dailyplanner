import { useState } from "react";
import { fmtTime } from "../utils/dates.js";

const KINDS = { class: "Class", exam: "Exam", due: "Assignment due", club: "Club or event" };

export default function ActivityList({ acts, onAdd, onDelete }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("class");
  const [time, setTime] = useState("");
  const sorted = [...acts].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), kind, time);
    setTitle("");
    setTime("");
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
        {sorted.map((a) => (
          <li key={a.id} className={`k-${a.kind}`}>
            <div className="txt">{a.title}
              <span className="meta">{KINDS[a.kind]}{a.time ? `, ${fmtTime(a.time)}` : ""}</span>
            </div>
            <button type="button" className="x" aria-label="Delete activity" onClick={() => onDelete(a.id)}>×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
