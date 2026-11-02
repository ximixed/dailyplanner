import { useState, useMemo, useCallback } from "react";
import { toISO, uid, fromISO, addDays } from "../utils/dates.js";

const today = toISO(new Date());

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const MOOD_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

function getMonthDays(year, month) {
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(toISO(new Date(year, month, d)));
  }
  return { days, startDow: new Date(year, month, 1).getDay() };
}

const DAY_NAMES_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function ReflectionCalendar({ reflections, selectedDate, onSelect }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { days, startDow } = getMonthDays(year, month);
  const reflDates = new Set(reflections.map(r => r.date));

  const prevM = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextM = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const label = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="refl-cal">
      <div className="cal-nav-row">
        <button className="btn sm ghost" onClick={prevM}>‹</button>
        <span className="cal-month-label">{label}</span>
        <button className="btn sm ghost" onClick={nextM}>›</button>
      </div>
      <div className="refl-cal-grid">
        {DAY_NAMES_SHORT.map(d => <div key={d} className="refl-cal-header">{d}</div>)}
        {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(date => {
          const hasEntry = reflDates.has(date);
          const isSel = selectedDate === date;
          const isFuture = date > today;
          return (
            <button key={date}
              className={`refl-cal-day${hasEntry ? " has-entry" : ""}${isSel ? " selected" : ""}${date === today ? " is-today" : ""}`}
              disabled={isFuture}
              onClick={() => onSelect(date)}>
              {new Date(date + "T00:00").getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyReflection({ reflections, onAddReflection, onUpdateReflection }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchQ, setSearchQ] = useState("");
  const [view, setView] = useState("write"); // write | history

  const todayRefl = reflections.find(r => r.date === today);
  const selectedRefl = reflections.find(r => r.date === selectedDate);

  // Form state — initialized from existing reflection for the selected date
  const [accomplished, setAccomplished] = useState(todayRefl?.accomplished || "");
  const [improve, setImprove] = useState(todayRefl?.improve || "");
  const [challenge, setChallenge] = useState(todayRefl?.challenge || "");
  const [grateful, setGrateful] = useState(todayRefl?.grateful || "");
  const [mood, setMood] = useState(todayRefl?.mood ?? 2);
  const [saved, setSaved] = useState(false);

  const loadDate = (date) => {
    const r = reflections.find(x => x.date === date);
    setAccomplished(r?.accomplished || "");
    setImprove(r?.improve || "");
    setChallenge(r?.challenge || "");
    setGrateful(r?.grateful || "");
    setMood(r?.mood ?? 2);
    setSelectedDate(date);
    setSaved(false);
  };

  const saveReflection = () => {
    const payload = {
      date: today,
      accomplished, improve, challenge, grateful, mood,
      createdAt: new Date().toISOString(),
    };
    const existing = reflections.find(r => r.date === today);
    if (existing) {
      onUpdateReflection(existing.id, payload);
    } else {
      onAddReflection({ id: uid(), ...payload });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const filteredHistory = useMemo(() => {
    const q = searchQ.toLowerCase();
    return [...reflections]
      .filter(r => !q || [r.accomplished, r.improve, r.challenge, r.grateful].some(s => s?.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reflections, searchQ]);

  const totalEntries = reflections.length;
  const thisMonthEntries = reflections.filter(r => r.date.startsWith(today.slice(0, 7))).length;

  return (
    <div className="reflection-page">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Daily Reflection</h2>
          <p className="section-subtitle">Review your day, track growth, and stay mindful.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="tag tag-blue">{totalEntries} entries</span>
          <span className="tag" style={{ background: "rgba(66,201,154,0.12)", color: "var(--success)" }}>{thisMonthEntries} this month</span>
        </div>
      </div>

      <div className="view-tabs" style={{ marginBottom: 20 }}>
        <button className={`view-tab${view === "write" ? " active" : ""}`} onClick={() => { setView("write"); loadDate(today); }}>
          ✍️ Today's Reflection
        </button>
        <button className={`view-tab${view === "history" ? " active" : ""}`} onClick={() => setView("history")}>
          📖 History
        </button>
      </div>

      {/* WRITE VIEW */}
      {view === "write" && (
        <div className="reflection-layout">
          <div className="reflection-form-col">
            <div className="card">
              {todayRefl ? (
                <div className="refl-existing-badge">
                  ✓ Reflection saved for today · {new Date(todayRefl.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              ) : (
                <div className="refl-empty-badge">No reflection yet for today</div>
              )}

              <div className="refl-mood-row">
                <label>How was your day?</label>
                <div className="mood-picker">
                  {MOOD_EMOJIS.map((emoji, i) => (
                    <button key={i} type="button"
                      className={`mood-btn${mood === i ? " active" : ""}`}
                      onClick={() => setMood(i)}
                      title={MOOD_LABELS[i]}>
                      <span className="mood-emoji">{emoji}</span>
                      <span className="mood-label">{MOOD_LABELS[i]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="refl-questions">
                {[
                  ["accomplished", "🏆 What did I accomplish today?", accomplished, setAccomplished, "Describe what you achieved, big or small…"],
                  ["improve", "🔄 What could I improve tomorrow?", improve, setImprove, "What would you do differently?"],
                  ["challenge", "⚡ What was my biggest challenge?", challenge, setChallenge, "What was difficult today?"],
                  ["grateful", "🙏 What am I grateful for today?", grateful, setGrateful, "Something you appreciated today…"],
                ].map(([key, label, val, setter, placeholder]) => (
                  <div key={key} className="refl-question">
                    <label className="refl-q-label">{label}</label>
                    <textarea
                      className="refl-textarea"
                      value={val}
                      onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      rows={3}
                    />
                  </div>
                ))}
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                {saved && <span style={{ color: "var(--success)", fontSize: "0.85rem" }}>✓ Saved!</span>}
                <button className="btn primary" onClick={saveReflection}
                  disabled={!accomplished && !improve && !challenge && !grateful}>
                  {todayRefl ? "Update reflection" : "Save reflection"}
                </button>
              </div>
            </div>
          </div>

          <div className="reflection-cal-col">
            <div className="card">
              <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>Entry calendar</h3>
              <ReflectionCalendar
                reflections={reflections}
                selectedDate={selectedDate}
                onSelect={(d) => { if (reflections.find(r => r.date === d)) { setSelectedDate(d); setView("history"); } }}
              />
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === "history" && (
        <div className="reflection-history">
          <div className="reflection-history-top">
            <input
              className="search-input"
              placeholder="Search reflections…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <div className="reflection-cal-col card" style={{ minWidth: 240 }}>
              <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>Navigate by date</h3>
              <ReflectionCalendar
                reflections={reflections}
                selectedDate={selectedDate}
                onSelect={(d) => { setSelectedDate(d); }}
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <h3>{searchQ ? "No matching entries" : "No reflections yet"}</h3>
              <p>{searchQ ? "Try a different search term." : "Start writing your first daily reflection."}</p>
              {!searchQ && <button className="btn primary" onClick={() => setView("write")}>Write today's reflection</button>}
            </div>
          ) : (
            <div className="refl-history-list">
              {filteredHistory.map(r => (
                <div key={r.id}
                  className={`refl-entry-card${selectedDate === r.date ? " selected" : ""}`}
                  onClick={() => setSelectedDate(selectedDate === r.date ? null : r.date)}>
                  <div className="refl-entry-header">
                    <div>
                      <span className="refl-entry-date">
                        {fromISO(r.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                      </span>
                      {r.date === today && <span className="tag tag-blue" style={{ marginLeft: 8 }}>Today</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="refl-mood-display" title={MOOD_LABELS[r.mood]}>
                        {MOOD_EMOJIS[r.mood ?? 2]}
                      </span>
                    </div>
                  </div>
                  {selectedDate === r.date && (
                    <div className="refl-entry-body">
                      {r.accomplished && (
                        <div className="refl-entry-section">
                          <div className="refl-entry-q">🏆 Accomplished</div>
                          <div className="refl-entry-a">{r.accomplished}</div>
                        </div>
                      )}
                      {r.improve && (
                        <div className="refl-entry-section">
                          <div className="refl-entry-q">🔄 Improve</div>
                          <div className="refl-entry-a">{r.improve}</div>
                        </div>
                      )}
                      {r.challenge && (
                        <div className="refl-entry-section">
                          <div className="refl-entry-q">⚡ Challenge</div>
                          <div className="refl-entry-a">{r.challenge}</div>
                        </div>
                      )}
                      {r.grateful && (
                        <div className="refl-entry-section">
                          <div className="refl-entry-q">🙏 Grateful</div>
                          <div className="refl-entry-a">{r.grateful}</div>
                        </div>
                      )}
                      {r.date === today && (
                        <div style={{ marginTop: 12 }}>
                          <button className="btn sm primary" onClick={(e) => { e.stopPropagation(); setView("write"); loadDate(today); }}>
                            Edit today's reflection
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

