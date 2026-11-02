export const toISO = (d) => {
  const m = d.getMonth() + 1, day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? "0" : ""}${m}-${day < 10 ? "0" : ""}${day}`;
};
export const fromISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = Number(h);
  return `${hh % 12 || 12}:${m} ${hh < 12 ? "AM" : "PM"}`;
};
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const startOfWeek = (iso) => {
  const d = fromISO(iso);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toISO(d);
};

export const startOfMonth = (iso) => {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};

export const endOfMonth = (iso) => {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

export const daysInMonth = (iso) => {
  const d = fromISO(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

export const isBefore = (a, b) => a < b;
export const isAfter = (a, b) => a > b;
export const isSameDay = (a, b) => a === b;

export const fmtDateLabel = (iso) => {
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const fmtShortDate = (iso) => {
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const fmtMonthYear = (iso) => {
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export const diffDays = (a, b) => {
  const da = fromISO(a), db = fromISO(b);
  return Math.round((db - da) / 86400000);
};

export const getWeekNumber = (iso) => {
  const d = fromISO(iso);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const elapsed = d - startOfYear;
  return Math.ceil((elapsed / 86400000 + startOfYear.getDay() + 1) / 7);
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export const fmtDuration = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const fmtCountdown = (iso) => {
  const today = toISO(new Date());
  const diff = diffDays(today, iso);
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  if (diff < 30) return `In ${Math.floor(diff / 7)}w`;
  return `In ${Math.floor(diff / 30)}mo`;
};
