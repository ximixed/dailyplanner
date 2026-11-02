import { useState, useRef, useEffect } from "react";

const COLORS = ["default", "yellow", "green", "red", "blue"];
const CATEGORIES = ["General", "School", "Work", "Personal", "Ideas"];
const COLOR_STYLES = {
  default: {},
  yellow: { borderLeftColor: "var(--warning)" },
  green:  { borderLeftColor: "var(--success)" },
  red:    { borderLeftColor: "var(--danger)" },
  blue:   { borderLeftColor: "var(--accent)" },
};

export default function NoteList({ notes, onAdd, onUpdate, onDelete }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("default");
  const [isChecklist, setIsChecklist] = useState(false);
  const [checkItems, setCheckItems] = useState([""]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editColor, setEditColor] = useState("default");

  const textRef = useRef(null);

  // Auto-save draft to sessionStorage
  useEffect(() => {
    if (text) sessionStorage.setItem("note-draft", text);
  }, [text]);
  useEffect(() => {
    const draft = sessionStorage.getItem("note-draft");
    if (draft) setText(draft);
  }, []);

  const resetForm = () => {
    setText(""); setCategory("General"); setColor("default");
    setIsChecklist(false); setCheckItems([""]); setShowForm(false);
    sessionStorage.removeItem("note-draft");
  };

  const submit = (e) => {
    e.preventDefault();
    if (isChecklist) {
      const items = checkItems.filter(i => i.trim());
      if (!items.length) return;
      onAdd({ text: items.join("\n"), category, color, isChecklist: true, checkItems: items.map(t => ({ text: t, done: false })) });
    } else {
      if (!text.trim()) return;
      onAdd({ text: text.trim(), category, color, isChecklist: false });
    }
    resetForm();
  };

  const beginEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text || "");
    setEditCategory(note.category || "General");
    setEditColor(note.color || "default");
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingId || !editText.trim()) return;
    onUpdate?.(editingId, { text: editText.trim(), category: editCategory, color: editColor });
    setEditingId(null);
  };

  const togglePin = (note) => onUpdate?.(note.id, { pinned: !note.pinned });
  const toggleNoteCheck = (note, idx) => {
    const items = [...(note.checkItems || [])];
    items[idx] = { ...items[idx], done: !items[idx].done };
    const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
    onUpdate?.(note.id, { checkItems: items, progress: pct });
  };

  const filtered = notes.filter(n => {
    if (search && !((n.text || "").toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterCat !== "all" && n.category !== filterCat) return false;
    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  return (
    <section aria-labelledby="h-notes">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 id="h-notes" style={{ margin: 0, flex: 1 }}>
          <span className="section-icon note-icon">✎</span>
          Notes
          {notes.length > 0 && <span className="count">{notes.length}</span>}
        </h2>
        <button className="btn sm primary" onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ Add note"}</button>
      </div>

      {/* Search & filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" style={{ flex: 1, minWidth: 120 }} aria-label="Search notes" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} aria-label="Filter by category" style={{ flex: "0 0 auto" }}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, background: "var(--elevated)", padding: 14, borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, cursor: "pointer" }}>
              <input type="checkbox" checked={isChecklist} onChange={e => setIsChecklist(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--accent)" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Checklist</span>
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex: "0 0 auto" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {COLORS.map(c => (
                <button key={c} type="button" title={c}
                  onClick={() => setColor(c)}
                  style={{ width: 18, height: 18, borderRadius: "50%", border: color === c ? "2px solid var(--ink)" : "1px solid var(--line)", cursor: "pointer",
                    background: c === "default" ? "var(--muted)" : c === "yellow" ? "var(--warning)" : c === "green" ? "var(--success)" : c === "red" ? "var(--danger)" : "var(--accent)"
                  }}
                />
              ))}
            </div>
          </div>

          {isChecklist ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {checkItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <input type="text" value={item} onChange={e => setCheckItems(p => p.map((it, j) => j === i ? e.target.value : it))}
                    placeholder={`Item ${i + 1}`} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setCheckItems(p => [...p, ""]); } }} autoFocus={i === checkItems.length - 1} />
                  {checkItems.length > 1 && <button type="button" className="x-btn" onClick={() => setCheckItems(p => p.filter((_, j) => j !== i))}>×</button>}
                </div>
              ))}
              <button type="button" className="btn sm ghost" onClick={() => setCheckItems(p => [...p, ""])}>+ Add item</button>
            </div>
          ) : (
            <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
              placeholder="Write a note…" aria-label="Note content" required autoFocus style={{ minHeight: 80 }} />
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn sm" onClick={resetForm}>Cancel</button>
            <button className="btn sm primary" type="submit">Save note</button>
          </div>
        </form>
      )}

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h4>{search ? "No notes match your search" : "No notes yet"}</h4>
          <p>{search ? "Try a different search term." : "Capture your thoughts, ideas, and reminders."}</p>
          {!showForm && !search && <button className="btn sm primary" onClick={() => setShowForm(true)}>+ Write first note</button>}
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(n => (
            <li key={n.id} className={`task-item note-item${n.pinned ? " pinned" : ""}${n.color ? ` color-${n.color}` : ""}`}
              style={{ ...COLOR_STYLES[n.color || "default"], flexDirection: "column", cursor: "default", gap: 8 }}>
              {editingId === n.id ? (
                <form onSubmit={saveEdit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} required style={{ minHeight: 80 }} autoFocus />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ flex: 1 }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditColor(c)}
                        style={{ width: 16, height: 16, borderRadius: "50%", border: editColor === c ? "2px solid var(--ink)" : "1px solid var(--line)", cursor: "pointer",
                          background: c === "default" ? "var(--muted)" : c === "yellow" ? "var(--warning)" : c === "green" ? "var(--success)" : c === "red" ? "var(--danger)" : "var(--accent)"
                        }}
                      />
                    ))}
                    <button type="button" className="btn sm" onClick={() => setEditingId(null)}>Cancel</button>
                    <button type="submit" className="btn sm primary">Save</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    {n.pinned && <span style={{ color: "var(--accent)", fontSize: "0.9rem", flexShrink: 0 }}>📌</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {n.isChecklist && Array.isArray(n.checkItems) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {n.checkItems.map((item, i) => (
                            <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer" }}>
                              <input type="checkbox" checked={!!item.done} onChange={() => toggleNoteCheck(n, i)} style={{ width: 14, height: 14, accentColor: "var(--accent)" }} />
                              <span style={item.done ? { textDecoration: "line-through", color: "var(--muted)" } : {}}>{item.text}</span>
                            </label>
                          ))}
                          {n.checkItems.length > 0 && (
                            <div className="progress-bar" style={{ margin: "4px 0" }}>
                              <div className="progress-fill success" style={{ width: `${Math.round((n.checkItems.filter(i => i.done).length / n.checkItems.length) * 100)}%` }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{n.text}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {n.category && <span style={{ fontSize: "0.7rem", color: "var(--muted)", background: "var(--elevated)", padding: "2px 7px", borderRadius: 999 }}>{n.category}</span>}
                    {n.createdAt && <span style={{ fontSize: "0.72rem", color: "var(--faint)" }}>{new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <button type="button" className="btn sm ghost" onClick={() => togglePin(n)}>{n.pinned ? "📌 Unpin" : "Pin"}</button>
                      <button type="button" className="btn sm ghost" onClick={() => beginEdit(n)}>Edit</button>
                      <button type="button" className="x-btn" aria-label="Delete note" onClick={() => onDelete(n.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
