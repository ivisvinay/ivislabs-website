// Options for the intern registration form.
// Keep DEGREES / SPECIALIZATIONS / DURATIONS in sync with cloudflare/interns.js,
// which validates them server-side.

export const DEGREES = [
  "Diploma",
  "B.C.A",
  "B.Sc",
  "B.B.A",
  "B.Com",
  "B.A",
  "M.Sc",
  "M.C.A",
  "M.B.A",
  "M.Com",
  "B.E",
  "B.Tech",
];

export const SPECIALIZATIONS = [
  "Computer Science (All CS Branches)",
  "HR",
  "Finance",
  "Marketing",
  "Others",
];

export const DURATIONS = [
  { value: "1m", label: "1 Month", months: 1 },
  { value: "2m", label: "2 Months", months: 2 },
  { value: "3m", label: "3 Months", months: 3 },
  { value: "4m", label: "4 Months", months: 4 },
  { value: "6m", label: "6 Months", months: 6 },
  { value: "12m", label: "1 Year", months: 12 },
];

export const durationMonths = (v) => (DURATIONS.find((d) => d.value === v) || {}).months || 1;
export const durationLabel = (v) => (DURATIONS.find((d) => d.value === v) || {}).label || v;

export const YEARS_OF_STUDY = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Graduated"];

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export const specLabel = (i) =>
  i.specialization === "Others" ? i.specialization_other || "Others" : i.specialization;
