// Date helpers for the intern portal. Dates are plain "YYYY-MM-DD" strings in
// India Standard Time, matching the Worker.

export const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

const toDate = (iso) => new Date(iso + "T00:00:00Z");
const toISO = (d) => d.toISOString().slice(0, 10);

export function addDays(iso, n) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

/** Inclusive end date — same rule as the Worker (Jan 31 + 3 months → Apr 30). */
export function endDateFor(startIso, months) {
  if (!startIso) return "";
  const d = toDate(startIso);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return toISO(d);
}

export const isSunday = (iso) => toDate(iso).getUTCDay() === 0;

/** Days a report is expected: start..min(end, upTo), Sundays excluded. */
export function expectedReportDays(start, end, upTo) {
  if (!start) return [];
  const last = end && end < upTo ? end : upTo;
  const days = [];
  for (let d = start; d <= last; d = addDays(d, 1)) if (!isSunday(d)) days.push(d);
  return days;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function fmtDate(iso) {
  if (!iso) return "";
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtDay(iso) {
  const d = toDate(iso);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]}, ${fmtDate(iso)}`;
}

/** 6×7 grid (Sun-first) of ISO dates covering the given month; null = padding. */
export function monthGrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < first.getUTCDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(Date.UTC(year, month, d))));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Human time for chat timestamps. */
export function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtChatDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
