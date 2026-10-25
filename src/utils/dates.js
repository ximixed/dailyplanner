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
