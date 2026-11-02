/* ─────────────────────────────────────────
   Data export / import utility
───────────────────────────────────────── */

const VERSION = "1.0";

const LS_KEYS = [
  "planner:tasks",
  "planner:acts",
  "planner:notes",
  "planner:events",
  "planner:focus-sessions",
  "planner:exams",
  "planner:assignments",
  "planner:subjects",
  "planner:goals",
  "planner:habits",
  "planner:habit-logs",
  "planner:reflections",
  "planner:streak",
  "planner:settings",
];

/** Collect all planner data from localStorage and download as JSON */
export function exportData() {
  const payload = {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: {},
  };
  LS_KEYS.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      payload.data[key] = raw ? JSON.parse(raw) : null;
    } catch {
      payload.data[key] = null;
    }
  });

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Parse and validate a JSON backup string.
 *  Returns { data, stats, warnings } or throws an Error with a human-readable message.
 */
export function parseImport(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON file. Please select a valid backup file.");
  }

  // Support both wrapped { version, data } format and bare object
  const raw = parsed.data ?? parsed;

  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Unrecognised backup format.");
  }

  const stats = {};
  const warnings = [];

  LS_KEYS.forEach(key => {
    const val = raw[key];
    if (val === undefined || val === null) {
      stats[key] = 0;
      return;
    }
    if (Array.isArray(val)) {
      stats[key] = val.length;
    } else if (typeof val === "object") {
      stats[key] = 1;
    } else {
      warnings.push(`Skipping "${key}": unexpected type`);
    }
  });

  return { raw, stats, warnings, exportedAt: parsed.exportedAt || null };
}

/** Apply validated import data to localStorage.
 *  Pass the `raw` object returned by parseImport.
 */
export function applyImport(raw) {
  LS_KEYS.forEach(key => {
    const val = raw[key];
    if (val !== undefined && val !== null) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  });
}

/** Wipe all planner data from localStorage */
export function resetAllData() {
  LS_KEYS.forEach(key => localStorage.removeItem(key));
  // Also remove theme key
  localStorage.removeItem("planner:theme");
  localStorage.removeItem("planner:notifications");
}

