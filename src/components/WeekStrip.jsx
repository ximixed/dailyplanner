import { addDays, fromISO } from "../utils/dates.js";

export default function WeekStrip({ current, onSelect, tasks, acts }) {
  const start = addDays(current, -fromISO(current).getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="week" role="tablist" aria-label="This week">
      {days.map((s) => {
        const d = fromISO(s);
        const busy =
          tasks.some((t) => t.date === s && !t.done) ||
          acts.some((a) => a.date === s && (a.kind === "exam" || a.kind === "due"));
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === current}
            className={"wd" + (s === current ? " sel" : "")}
            onClick={() => onSelect(s)}
          >
            <small>{d.toLocaleDateString(undefined, { weekday: "short" })}</small>
            <b>{d.getDate()}</b>
            {busy && <i />}
          </button>
        );
      })}
    </div>
  );
}
