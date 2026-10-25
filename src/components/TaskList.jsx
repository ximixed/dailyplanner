import { useState } from "react";

const PRI = { high: "High priority", med: "Medium priority", low: "Low priority" };
const ORDER = { high: 0, med: 1, low: 2 };

export default function TaskList({ tasks, onAdd, onToggle, onDelete, onMove, onClear }) {
  const [text, setText] = useState("");
  const [pri, setPri] = useState("med");
  const sorted = [...tasks].sort((a, b) => a.done - b.done || ORDER[a.pri] - ORDER[b.pri]);
  const done = tasks.filter((t) => t.done).length;

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim(), pri);
    setText("");
  };

  return (
    <section aria-labelledby="h-tasks">
      <h2 id="h-tasks">Tasks{tasks.length > 0 && <span>{done}/{tasks.length} done</span>}</h2>
      <form onSubmit={submit}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing?" aria-label="Task" required />
        <select value={pri} onChange={(e) => setPri(e.target.value)} aria-label="Priority">
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="btn primary" type="submit">Add task</button>
      </form>
      <ul>
        {sorted.length === 0 && <li className="empty">No tasks yet. Add the first thing you need to do.</li>}
        {sorted.map((t) => (
          <li key={t.id} className={`p-${t.pri}${t.done ? " done" : ""}`}>
            <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)}
              aria-label={`Mark done: ${t.text}`} />
            <div className="txt">{t.text}<span className="meta">{PRI[t.pri]}</span></div>
            <button type="button" className="x" aria-label="Delete task" onClick={() => onDelete(t.id)}>×</button>
          </li>
        ))}
      </ul>
      <div className="tools">
        <button className="btn" onClick={onMove}>Move unfinished to tomorrow</button>
        <button className="btn" onClick={onClear}>Clear completed</button>
      </div>
    </section>
  );
}
