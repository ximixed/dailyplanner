import { useState, useMemo } from "react";
import { toISO, fromISO, addDays, fmtTime, fmtMonthYear, daysInMonth, startOfMonth, uid, diffDays, fmtCountdown } from "../utils/dates.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = toISO(new Date());

const EVENT_COLORS = {
  task:     { bg: "rgba(105,120,255,0.2)", color: "var(--accent-2)" },
  activity: { bg: "rgba(66,201,154,0.2)",  color: "var(--success)" },
  exam:     { bg: "rgba(241,109,122,0.2)", color: "var(--danger)" },
  due:      { bg: "rgba(244,184,96,0.2)",  color: "var(--warning)" },
  event:    { bg: "rgba(139,154,255,0.2)", color: "var(--accent-2)" },
};

export default function CalendarView({ tasks, acts, events, onAddEvent, onUpdateEvent, onDeleteEvent, onSelectDate }) {
  const [view, setView] = useState("month");
  const [pivot, setPivot] = useState(today);
  const [selected, setSelected] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(today);
  const [editEvent, setEditEvent] = useState(null);

  // Modal form state
  const [evTitle, setEvTitle] = useState("");
  const [evKind, setEvKind] = useState("event");
  const [evTime, setEvTime] = useState("");
  const [evEndTime, setEvEndTime] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evDate, setEvDate] = useState(today);
  const [evColor, setEvColor] = useState("event");

  // ── Month navigation ──
  const pivotDate = fromISO(pivot);
  const monthStart = toISO(new Date(pivotDate.getFullYear(), pivotDate.getMonth(), 1));
  const monthStartDate = fromISO(monthStart);
  const totalDays = daysInMonth(pivot);
  const startWeekday = monthStartDate.getDay();
  const prevMonthDays = Array.from({ length: startWeekday }, (_, i) => addDays(monthStart, -(startWeekday - i)));
  const thisDays = Array.from({ length: totalDays }, (_, i) => addDays(monthStart, i));
  const remaining = (7 - ((startWeekday + totalDays) % 7)) % 7;
  const nextMonthDays = Array.from({ length: remaining }, (_, i) => addDays(addDays(monthStart, totalDays), i));
  const allDays = [...prevMonthDays, ...thisDays, ...nextMonthDays];

  // ── Events per day ──
  const getDayItems = (dateStr) => {
    const items = [];
    tasks.filter(t => t.dueDate === dateStr).forEach(t => items.push({ id: t.id, title: t.title, type: "task", done: t.done }));
    acts.filter(a => a.date === dateStr).forEach(a => items.push({ id: a.id, title: a.title, type: a.kind === "exam" ? "exam" : a.kind === "due" ? "due" : "activity", time: a.time }));
    (events || []).filter(e => e.date === dateStr).forEach(e => items.push({ id: e.id, title: e.title, type: e.kind || "event", time: e.time }));
    return items;
  };

  // ── Week view helpers ──
  const weekStart = addDays(pivot, -fromISO(pivot).getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

  const openModal = (date, ev = null) => {
    setModalDate(date);
    if (ev) {
      setEditEvent(ev);
      setEvTitle(ev.title || "");
      setEvKind(ev.kind || "event");
      setEvTime(ev.time || "");
      setEvEndTime(ev.endTime || "");
      setEvDesc(ev.description || "");
      setEvDate(ev.date || date);
      setEvColor(ev.kind || "event");
    } else {
      setEditEvent(null);
      setEvTitle(""); setEvKind("event"); setEvTime(""); setEvEndTime(""); setEvDesc("");
      setEvDate(date); setEvColor("event");
    }
    setShowModal(true);
  };

  const saveEvent = (e) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    const payload = {
      id: editEvent?.id || uid(),
      title: evTitle.trim(),
      date: evDate,
      kind: evKind,
      time: evTime,
      endTime: evEndTime,
      description: evDesc.trim(),
    };
    if (editEvent) {
      onUpdateEvent?.(editEvent.id, payload);
    } else {
      onAddEvent?.(payload);
    }
    setShowModal(false);
  };

  const navPrev = () => {
    if (view === "month") {
      const d = fromISO(pivot);
      setPivot(toISO(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
    } else if (view === "week") {
      setPivot(addDays(pivot, -7));
    } else {
      setPivot(addDays(pivot, -1));
    }
  };
  const navNext = () => {
    if (view === "month") {
      const d = fromISO(pivot);
      setPivot(toISO(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
    } else if (view === "week") {
      setPivot(addDays(pivot, 7));
    } else {
      setPivot(addDays(pivot, 1));
    }
  };

  return (
    <div className="calendar-page">
      {/* Header */}
      <div className="calendar-nav">
        <button className="btn sm" onClick={navPrev}>‹</button>
        <h2 style={{ margin: 0, flex: 1, fontSize: "1.1rem" }}>
          {view === "month" ? fmtMonthYear(monthStart) :
           view === "week" ? `${fromISO(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${fromISO(weekDays[6]).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` :
           fromISO(pivot).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
          }
        </h2>
        <button className="btn sm" onClick={() => setPivot(today)}>Today</button>
        <button className="btn sm" onClick={navNext}>›</button>
        <div className="cal-view-tabs">
          {["month", "week", "day"].map(v => (
            <button key={v} className={`cal-view-tab${view === v ? " active" : ""}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn sm primary" onClick={() => openModal(selected)}>+ Event</button>
      </div>

      {/* Month view */}
      {view === "month" && (
        <div>
          <div className="calendar-grid">
            {DAYS.map(d => (
              <div key={d} className="cal-header-day">{d}</div>
            ))}
            {allDays.map((dateStr) => {
              const isThisMonth = fromISO(dateStr).getMonth() === pivotDate.getMonth();
              const isToday = dateStr === today;
              const isSel = dateStr === selected;
              const items = getDayItems(dateStr);
              const MAX_VISIBLE = 3;

              return (
                <div
                  key={dateStr}
                  className={`cal-day${!isThisMonth ? " other-month" : ""}${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
                  onClick={() => { setSelected(dateStr); onSelectDate?.(dateStr); }}
                  onDoubleClick={() => openModal(dateStr)}
                  title={`${dateStr} — click to select, double-click to add event`}
                >
                  <div className="cal-day-num">{fromISO(dateStr).getDate()}</div>
                  {items.slice(0, MAX_VISIBLE).map((item, i) => {
                    const c = EVENT_COLORS[item.type] || EVENT_COLORS.event;
                    return (
                      <div key={i} className={`cal-event ${item.type}`}
                        style={{ background: c.bg, color: c.color, opacity: item.done ? 0.5 : 1 }}
                        title={item.title}
                      >
                        {item.time && `${fmtTime(item.time)} `}{item.title}
                      </div>
                    );
                  })}
                  {items.length > MAX_VISIBLE && (
                    <div className="cal-more">+{items.length - MAX_VISIBLE} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selected && (() => {
            const items = getDayItems(selected);
            const selDate = fromISO(selected);
            return (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    {selDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    {selected === today && <span className="tag tag-blue" style={{ marginLeft: 8 }}>Today</span>}
                  </h3>
                  <button className="btn sm primary" onClick={() => openModal(selected)}>+ Add event</button>
                </div>
                {items.length === 0 ? (
                  <div className="empty-box">Nothing scheduled. Double-click a date or click + Add event.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item, i) => {
                      const c = EVENT_COLORS[item.type] || EVENT_COLORS.event;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: "var(--r-md)", background: c.bg, border: `1px solid ${c.color}33` }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem", textDecoration: item.done ? "line-through" : "none" }}>{item.title}</div>
                            {item.time && <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{fmtTime(item.time)}</div>}
                          </div>
                          <span className={`tag tag-${item.type === "task" ? "blue" : item.type === "exam" ? "red" : item.type === "due" ? "amber" : "green"}`}>{item.type}</span>
                          {item.type === "event" && (
                            <button className="x-btn" onClick={() => onDeleteEvent?.(item.id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Week view */}
      {view === "week" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "50px repeat(7, minmax(80px, 1fr))", minWidth: 600 }}>
            <div style={{ background: "var(--elevated)" }} />
            {weekDays.map(d => {
              const isToday = d === today;
              return (
                <div key={d} style={{ background: "var(--elevated)", padding: "8px 4px", textAlign: "center", borderLeft: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>{fromISO(d).toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: isToday ? "var(--accent)" : "var(--ink)", width: 26, height: 26, borderRadius: "50%", background: isToday ? "rgba(105,120,255,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0" }}>
                    {fromISO(d).getDate()}
                  </div>
                </div>
              );
            })}
            {HOURS.map(h => (
              <>
                <div key={`t${h}`} style={{ background: "var(--elevated)", fontSize: "0.62rem", color: "var(--faint)", padding: "4px 6px 0", textAlign: "right", borderTop: "1px solid var(--line)", lineHeight: 1 }}>
                  {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
                </div>
                {weekDays.map(d => {
                  const items = getDayItems(d).filter(item => item.time && parseInt(item.time) === h);
                  return (
                    <div key={`${d}-${h}`} style={{ background: "var(--card-bg)", borderLeft: "1px solid var(--line)", borderTop: "1px solid var(--line)", minHeight: 48, padding: 2, cursor: "pointer" }}
                      onClick={() => { setPivot(d); setView("day"); }}>
                      {items.map((item, i) => {
                        const c = EVENT_COLORS[item.type] || EVENT_COLORS.event;
                        return (
                          <div key={i} style={{ background: c.bg, color: c.color, borderRadius: 4, padding: "1px 4px", fontSize: "0.65rem", fontWeight: 600, marginBottom: 2 }}>
                            {item.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === "day" && (() => {
        const items = getDayItems(pivot);
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{fromISO(pivot).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
              <button className="btn sm primary" onClick={() => openModal(pivot)}>+ Add event</button>
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h4>Nothing scheduled</h4>
                <p>Click + Add event to schedule something.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")).map((item, i) => {
                  const c = EVENT_COLORS[item.type] || EVENT_COLORS.event;
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: "var(--r-md)", background: c.bg, border: `1px solid ${c.color}33` }}>
                      <div style={{ width: 40, textAlign: "right", flexShrink: 0 }}>
                        {item.time ? <span style={{ fontSize: "0.75rem", fontWeight: 700, color: c.color }}>{fmtTime(item.time)}</span> : <span style={{ fontSize: "0.72rem", color: "var(--faint)" }}>—</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <span className="tag tag-gray" style={{ fontSize: "0.65rem", marginTop: 4, display: "inline-block" }}>{item.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Add/Edit event modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editEvent ? "Edit event" : "New event"}</h3>
              <button className="x-btn" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={saveEvent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field">
                <label>Event title *</label>
                <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Event title" required autoFocus />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={evKind} onChange={e => setEvKind(e.target.value)}>
                    <option value="event">General</option>
                    <option value="exam">Exam</option>
                    <option value="due">Assignment due</option>
                    <option value="activity">Activity</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Start time</label>
                  <input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} />
                </div>
                <div className="field">
                  <label>End time</label>
                  <input type="time" value={evEndTime} onChange={e => setEvEndTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Optional notes" style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                {editEvent && (
                  <button type="button" className="btn danger sm" onClick={() => { onDeleteEvent?.(editEvent.id); setShowModal(false); }}>Delete</button>
                )}
                <button type="button" className="btn sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn sm primary">{editEvent ? "Save changes" : "Add event"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

