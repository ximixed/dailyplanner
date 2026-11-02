import { addDays, fromISO, toISO } from "../utils/dates.js";

export default function WeekStrip({ current, onSelect, tasks, acts }) {
  const today = toISO(new Date());
  const start = addDays(current, -fromISO(current).getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="week" role="tablist" aria-label="This week">
      {days.map((s) => {
        const d = fromISO(s);
        const dayTasks = tasks.filter(t => t.date === s);
        const hasTask = dayTasks.some(t => !t.done);
        const hasExam = acts.some(a => a.date === s && (a.kind === "exam" || a.kind === "due"));
        const isDone = dayTasks.length > 0 && dayTasks.every(t => t.done);

        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === current}
            className={"wd" + (s === current ? " sel" : "") + (s === today ? " today" : "")}
            onClick={() => onSelect(s)}
            title={d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          >
            <small>{d.toLocaleDateString(undefined, { weekday: "short" })}</small>
            <b>{d.getDate()}</b>
            <div className="dot-row">
              {hasTask && !isDone && <span style={{ background: "var(--danger)" }} />}
              {isDone && dayTasks.length > 0 && <span style={{ background: "var(--success)" }} />}
              {hasExam && <span style={{ background: "var(--warning)" }} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
