import { useState } from "react";
import { uid, toISO, fmtCountdown, fmtShortDate } from "../utils/dates.js";

const today = toISO(new Date());

const SUBJECT_COLORS = ["#6978FF","#42C99A","#F4B860","#F16D7A","#A855F7","#06B6D4","#EC4899","#84CC16","#F97316","#14B8A6"];

export default function StudentHub({ exams, onAddExam, onUpdateExam, onDeleteExam,
  assignments, onAddAssignment, onUpdateAssignment, onDeleteAssignment,
  subjects, onAddSubject, onUpdateSubject, onDeleteSubject }) {

  const [tab, setTab] = useState("exams");

  // Exam form
  const [examName, setExamName] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examNotes, setExamNotes] = useState("");
  const [showExamForm, setShowExamForm] = useState(false);

  // Assignment form
  const [asnTitle, setAsnTitle] = useState("");
  const [asnSubject, setAsnSubject] = useState("");
  const [asnDeadline, setAsnDeadline] = useState("");
  const [asnPriority, setAsnPriority] = useState("med");
  const [asnEstTime, setAsnEstTime] = useState(60);
  const [showAsnForm, setShowAsnForm] = useState(false);

  // Subject form
  const [subjName, setSubjName] = useState("");
  const [subjColor, setSubjColor] = useState(SUBJECT_COLORS[0]);
  const [showSubjForm, setShowSubjForm] = useState(false);

  const resetExamForm = () => { setExamName(""); setExamSubject(""); setExamDate(""); setExamNotes(""); setShowExamForm(false); };
  const resetAsnForm  = () => { setAsnTitle(""); setAsnSubject(""); setAsnDeadline(""); setAsnPriority("med"); setAsnEstTime(60); setShowAsnForm(false); };
  const resetSubjForm = () => { setSubjName(""); setSubjColor(SUBJECT_COLORS[0]); setShowSubjForm(false); };

  const submitExam = (e) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;
    onAddExam({ id: uid(), name: examName.trim(), subject: examSubject, date: examDate, notes: examNotes.trim(), checklist: [], studyProgress: 0 });
    resetExamForm();
  };

  const submitAsn = (e) => {
    e.preventDefault();
    if (!asnTitle.trim() || !asnDeadline) return;
    onAddAssignment({ id: uid(), title: asnTitle.trim(), subject: asnSubject, deadline: asnDeadline, priority: asnPriority, estimatedTime: Number(asnEstTime), done: false, createdAt: new Date().toISOString() });
    resetAsnForm();
  };

  const submitSubj = (e) => {
    e.preventDefault();
    if (!subjName.trim()) return;
    onAddSubject({ id: uid(), name: subjName.trim(), color: subjColor, createdAt: new Date().toISOString() });
    resetSubjForm();
  };

  const getCountdownClass = (dateStr) => {
    const diff = Math.round((new Date(dateStr) - new Date()) / 86400000);
    if (diff < 0) return "";
    if (diff <= 3) return "exam-countdown";
    if (diff <= 7) return "exam-countdown soon";
    return "exam-countdown ok";
  };

  const sortedExams = [...exams].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const sortedAsn = [...assignments].sort((a, b) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    return (a.deadline || "").localeCompare(b.deadline || "");
  });

  return (
    <div className="student-page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>🎓 Student Hub</h2>
      </div>

      {/* Tabs */}
      <div className="student-tabs">
        {[["exams","📋 Exams"], ["assignments","📝 Assignments"], ["subjects","📚 Subjects"]].map(([k, l]) => (
          <button key={k} className={`student-tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── Exams ── */}
      {tab === "exams" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn sm primary" onClick={() => setShowExamForm(s => !s)}>{showExamForm ? "Cancel" : "+ Add exam"}</button>
          </div>

          {showExamForm && (
            <form onSubmit={submitExam} style={{ background: "var(--elevated)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field-row">
                <div className="field">
                  <label>Exam name *</label>
                  <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Final Exam" required autoFocus />
                </div>
                <div className="field">
                  <label>Subject</label>
                  <select value={examSubject} onChange={e => setExamSubject(e.target.value)}>
                    <option value="">— Select —</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Exam date *</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={examNotes} onChange={e => setExamNotes(e.target.value)} placeholder="Topics to cover, preparation notes…" style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn sm" onClick={resetExamForm}>Cancel</button>
                <button type="submit" className="btn sm primary">Add exam</button>
              </div>
            </form>
          )}

          {sortedExams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h4>No exams tracked</h4>
              <p>Add upcoming exams to track your preparation progress.</p>
              {!showExamForm && <button className="btn sm primary" onClick={() => setShowExamForm(true)}>+ Add first exam</button>}
            </div>
          ) : (
            sortedExams.map(exam => {
              const isPast = exam.date < today;
              const subj = subjects.find(s => s.name === exam.subject);
              return (
                <div key={exam.id} className="exam-card" style={isPast ? { opacity: 0.6 } : {}}>
                  <div className="exam-header">
                    <div>
                      <div className="exam-title">{exam.name}</div>
                      {exam.subject && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          {subj && <span style={{ width: 8, height: 8, borderRadius: "50%", background: subj.color, display: "inline-block" }} />}
                          <span className="exam-subject">{exam.subject}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span className={getCountdownClass(exam.date)}>
                        {isPast ? "Past" : fmtCountdown(exam.date)}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{fmtShortDate(exam.date)}</span>
                    </div>
                  </div>
                  {exam.notes && <div style={{ fontSize: "0.82rem", color: "var(--muted)", padding: "8px 0 0" }}>{exam.notes}</div>}
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn sm ghost" onClick={() => onDeleteExam?.(exam.id)}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Assignments ── */}
      {tab === "assignments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn sm primary" onClick={() => setShowAsnForm(s => !s)}>{showAsnForm ? "Cancel" : "+ Add assignment"}</button>
          </div>

          {showAsnForm && (
            <form onSubmit={submitAsn} style={{ background: "var(--elevated)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field-row">
                <div className="field">
                  <label>Assignment title *</label>
                  <input type="text" value={asnTitle} onChange={e => setAsnTitle(e.target.value)} placeholder="e.g. Essay on Climate Change" required autoFocus />
                </div>
                <div className="field">
                  <label>Subject</label>
                  <select value={asnSubject} onChange={e => setAsnSubject(e.target.value)}>
                    <option value="">— Select —</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Deadline *</label>
                  <input type="date" value={asnDeadline} onChange={e => setAsnDeadline(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select value={asnPriority} onChange={e => setAsnPriority(e.target.value)}>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="med">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div className="field">
                  <label>Est. time (min)</label>
                  <input type="number" min="0" step="30" value={asnEstTime} onChange={e => setAsnEstTime(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn sm" onClick={resetAsnForm}>Cancel</button>
                <button type="submit" className="btn sm primary">Add assignment</button>
              </div>
            </form>
          )}

          {sortedAsn.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h4>No assignments tracked</h4>
              <p>Track your assignments and deadlines here.</p>
              {!showAsnForm && <button className="btn sm primary" onClick={() => setShowAsnForm(true)}>+ Add first assignment</button>}
            </div>
          ) : (
            sortedAsn.map(a => {
              const isOverdue = a.deadline < today && !a.done;
              const subj = subjects.find(s => s.name === a.subject);
              const PRI_COLOR = { urgent: "var(--danger)", high: "var(--warning)", med: "var(--accent)", low: "var(--success)" };
              return (
                <div key={a.id} className="task-item" style={{ borderLeftColor: PRI_COLOR[a.priority || "med"], opacity: a.done ? 0.6 : 1 }}>
                  <input type="checkbox" className="task-check" checked={!!a.done} onChange={() => onUpdateAssignment?.(a.id, { done: !a.done })} />
                  <div className="task-body">
                    <div className="task-title" style={a.done ? { textDecoration: "line-through" } : {}}>{a.title}</div>
                    <div className="task-meta">
                      {a.subject && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {subj && <span style={{ width: 6, height: 6, borderRadius: "50%", background: subj.color, display: "inline-block" }} />}
                          <span className="tag tag-blue">{a.subject}</span>
                        </span>
                      )}
                      {a.deadline && (
                        <span className={`task-meta-item${isOverdue ? " text-danger" : ""}`}>
                          📅 {isOverdue ? "Overdue · " : ""}{fmtCountdown(a.deadline)}
                        </span>
                      )}
                      {a.estimatedTime > 0 && <span className="task-meta-item">⏱ ~{Math.round(a.estimatedTime / 60 * 10) / 10}h</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="x-btn" onClick={() => onDeleteAssignment?.(a.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Subjects ── */}
      {tab === "subjects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn sm primary" onClick={() => setShowSubjForm(s => !s)}>{showSubjForm ? "Cancel" : "+ Add subject"}</button>
          </div>

          {showSubjForm && (
            <form onSubmit={submitSubj} style={{ background: "var(--elevated)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="field">
                <label>Subject name *</label>
                <input type="text" value={subjName} onChange={e => setSubjName(e.target.value)} placeholder="e.g. Mathematics, Science…" required autoFocus />
              </div>
              <div className="field">
                <label>Color</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {SUBJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setSubjColor(c)}
                      style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: subjColor === c ? "3px solid var(--ink)" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn sm" onClick={resetSubjForm}>Cancel</button>
                <button type="submit" className="btn sm primary">Add subject</button>
              </div>
            </form>
          )}

          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h4>No subjects yet</h4>
              <p>Add your subjects to organize your study plan.</p>
              {!showSubjForm && <button className="btn sm primary" onClick={() => setShowSubjForm(true)}>+ Add first subject</button>}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {subjects.map(s => {
                const subjectTasks = assignments.filter(a => a.subject === s.name);
                const doneTasks = subjectTasks.filter(a => a.done).length;
                return (
                  <div key={s.id} className="subject-card">
                    <div className="subject-dot" style={{ background: s.color, width: 14, height: 14 }} />
                    <div className="subject-info">
                      <div className="subject-name">{s.name}</div>
                      <div className="subject-stats">
                        {subjectTasks.length} assignment{subjectTasks.length !== 1 ? "s" : ""} · {doneTasks} completed
                      </div>
                      {subjectTasks.length > 0 && (
                        <div className="progress-bar" style={{ margin: "6px 0 0" }}>
                          <div className="progress-fill" style={{ width: `${Math.round((doneTasks / subjectTasks.length) * 100)}%`, background: s.color }} />
                        </div>
                      )}
                    </div>
                    <button className="x-btn" onClick={() => onDeleteSubject?.(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

