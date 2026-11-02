import { useState, useRef } from "react";
import { exportData, parseImport, applyImport, resetAllData } from "../utils/storage.js";

const ACCENT_PRESETS = [
  { label: "Indigo", value: "#6978FF" },
  { label: "Purple", value: "#A78BFA" },
  { label: "Cyan", value: "#22D3EE" },
  { label: "Emerald", value: "#34D399" },
  { label: "Rose", value: "#FB7185" },
  { label: "Amber", value: "#FBBF24" },
  { label: "Orange", value: "#FB923C" },
  { label: "Sky", value: "#38BDF8" },
];

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function ToggleSwitch({ id, checked, onChange, label, description }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <label htmlFor={id} className="settings-row-label">{label}</label>
        {description && <div className="settings-row-desc">{description}</div>}
      </div>
      <label className="toggle-switch">
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-track"><span className="toggle-thumb" /></span>
      </label>
    </div>
  );
}

function SelectRow({ label, description, value, onChange, options }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <div className="settings-row-label">{label}</div>
        {description && <div className="settings-row-desc">{description}</div>}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: 160 }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function SliderRow({ label, description, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div className="settings-row-label">{label}</div>
          {description && <div className="settings-row-desc">{description}</div>}
        </div>
        <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.9rem" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--faint)" }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SettingsPage({ settings, onUpdateSettings, onReloadApp }) {
  const [importStatus, setImportStatus] = useState(null); // null | { type: "preview"|"success"|"error", ... }
  const [importRaw, setImportRaw] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef(null);

  const upd = (patch) => onUpdateSettings(prev => ({ ...prev, ...patch }));
  const updNotif = (patch) => onUpdateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, ...patch } }));
  const updDash = (patch) => onUpdateSettings(prev => ({ ...prev, dashboard: { ...prev.dashboard, ...patch } }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { raw, stats, warnings, exportedAt } = parseImport(ev.target.result);
        setImportRaw(raw);
        setImportStatus({ type: "preview", stats, warnings, exportedAt });
      } catch (err) {
        setImportStatus({ type: "error", message: err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleApplyImport = () => {
    if (!importRaw) return;
    applyImport(importRaw);
    setImportStatus({ type: "success" });
    setImportRaw(null);
    setTimeout(() => { window.location.reload(); }, 1200);
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    setTimeout(() => { window.location.reload(); }, 300);
  };

  return (
    <div className="settings-page">
      <div className="section-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-subtitle">Customize your planner experience.</p>
        </div>
      </div>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <SelectRow
          label="Theme"
          description="Choose your preferred color scheme."
          value={settings.theme || "dark"}
          onChange={v => upd({ theme: v })}
          options={[["dark", "Dark"], ["light", "Light"], ["system", "System"]]}
        />
        <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <div className="settings-row-label">Accent color</div>
          <div className="settings-row-desc">Sets the primary highlight color across the app.</div>
          <div className="color-swatches" style={{ flexWrap: "wrap" }}>
            {ACCENT_PRESETS.map(({ label, value }) => (
              <button key={value} type="button"
                className={`color-swatch${settings.accentColor === value ? " active" : ""}`}
                style={{ background: value }}
                title={label}
                onClick={() => upd({ accentColor: value })} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
              <input type="color" value={settings.accentColor || "#6978FF"}
                onChange={e => upd({ accentColor: e.target.value })}
                style={{ width: 36, height: 36, borderRadius: 8, border: "2px solid var(--line)", background: "transparent", cursor: "pointer", padding: 2 }}
                title="Custom color" />
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Custom</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Time & Date ── */}
      <Section title="Time &amp; Date">
        <SelectRow
          label="Time format"
          value={settings.timeFormat || "12h"}
          onChange={v => upd({ timeFormat: v })}
          options={[["12h", "12-hour (3:30 PM)"], ["24h", "24-hour (15:30)"]]}
        />
        <SelectRow
          label="First day of week"
          value={String(settings.weekStart ?? 0)}
          onChange={v => upd({ weekStart: Number(v) })}
          options={[["0", "Sunday"], ["1", "Monday"]]}
        />
      </Section>

      {/* ── Focus Timer ── */}
      <Section title="Focus Timer">
        <SliderRow
          label="Focus duration"
          description="Length of each focus session."
          value={settings.focusDuration || 25}
          onChange={v => upd({ focusDuration: v })}
          min={5} max={90} unit=" min"
        />
        <SliderRow
          label="Short break"
          value={settings.shortBreak || 5}
          onChange={v => upd({ shortBreak: v })}
          min={1} max={30} unit=" min"
        />
        <SliderRow
          label="Long break"
          value={settings.longBreak || 15}
          onChange={v => upd({ longBreak: v })}
          min={5} max={60} unit=" min"
        />
        <SliderRow
          label="Daily session goal"
          description="How many focus sessions you aim for each day."
          value={settings.dailyGoal || 4}
          onChange={v => upd({ dailyGoal: v })}
          min={1} max={12} unit=" sessions"
        />
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications">
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 12 }}>
          Notifications will only appear if you grant browser permission. Reminders are checked when the app is open.
        </p>
        <ToggleSwitch
          id="notif-overdue"
          checked={!!settings.notifications?.overdue}
          onChange={v => updNotif({ overdue: v })}
          label="Overdue task reminders"
          description="Get alerted about tasks past their due date."
        />
        {settings.notifications?.overdue && (
          <div className="settings-row" style={{ paddingLeft: 16 }}>
            <div className="settings-row-label" style={{ fontSize: "0.82rem" }}>Remind time</div>
            <input type="time" value={settings.notifications?.overdueTime || "09:00"}
              onChange={e => updNotif({ overdueTime: e.target.value })} style={{ width: 120 }} />
          </div>
        )}
        <ToggleSwitch
          id="notif-exams"
          checked={!!settings.notifications?.exams}
          onChange={v => updNotif({ exams: v })}
          label="Exam reminders"
          description="Get alerted when exams are approaching."
        />
        {settings.notifications?.exams && (
          <div className="settings-row" style={{ paddingLeft: 16 }}>
            <div className="settings-row-label" style={{ fontSize: "0.82rem" }}>Days before</div>
            <input type="number" min={1} max={30} value={settings.notifications?.examDaysBefore || 3}
              onChange={e => updNotif({ examDaysBefore: Number(e.target.value) })} style={{ width: 80 }} />
          </div>
        )}
        <ToggleSwitch
          id="notif-plan"
          checked={!!settings.notifications?.dailyPlan}
          onChange={v => updNotif({ dailyPlan: v })}
          label="Daily planning reminder"
          description="A morning nudge to plan your day."
        />
        {settings.notifications?.dailyPlan && (
          <div className="settings-row" style={{ paddingLeft: 16 }}>
            <div className="settings-row-label" style={{ fontSize: "0.82rem" }}>Remind at</div>
            <input type="time" value={settings.notifications?.dailyPlanTime || "08:00"}
              onChange={e => updNotif({ dailyPlanTime: e.target.value })} style={{ width: 120 }} />
          </div>
        )}
      </Section>

      {/* ── Dashboard ── */}
      <Section title="Dashboard Widgets">
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 12 }}>
          Choose which sections appear on your Dashboard.
        </p>
        {[
          ["stats", "Stat cards (tasks, focus, etc.)"],
          ["progress", "Daily progress bar"],
          ["focusPanel", "Daily focus panel"],
          ["schedulePanel", "Upcoming schedule panel"],
          ["quickNote", "Quick note input"],
          ["bottomSections", "Task / Activity / Notes lists"],
        ].map(([key, label]) => (
          <ToggleSwitch key={key} id={`dash-${key}`}
            checked={settings.dashboard?.[key] !== false}
            onChange={v => updDash({ [key]: v })}
            label={label}
          />
        ))}
      </Section>

      {/* ── Data Management ── */}
      <Section title="Data Management">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Export data</div>
            <div className="settings-row-desc">Download all your planner data as a JSON backup.</div>
          </div>
          <button className="btn sm primary" onClick={exportData}>Export JSON</button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Import data</div>
            <div className="settings-row-desc">Restore from a previous JSON backup. Existing data will be replaced.</div>
          </div>
          <button className="btn sm" onClick={() => fileRef.current?.click()}>Choose file…</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {/* Import status */}
        {importStatus?.type === "preview" && (
          <div className="import-preview card" style={{ margin: "12px 0" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📦 Backup preview</div>
            {importStatus.exportedAt && (
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 8 }}>
                Exported: {new Date(importStatus.exportedAt).toLocaleString()}
              </div>
            )}
            <div className="import-stats">
              {Object.entries(importStatus.stats)
                .filter(([, count]) => count > 0)
                .map(([key, count]) => (
                  <div key={key} className="import-stat-row">
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{key.replace("planner:", "")}</span>
                    <span style={{ fontWeight: 700, color: "var(--accent)" }}>{count}</span>
                  </div>
                ))}
            </div>
            {importStatus.warnings?.length > 0 && (
              <div style={{ marginTop: 10, color: "var(--warning)", fontSize: "0.78rem" }}>
                ⚠️ {importStatus.warnings.join("; ")}
              </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="btn sm ghost" onClick={() => { setImportStatus(null); setImportRaw(null); }}>Cancel</button>
              <button className="btn sm primary" onClick={handleApplyImport}>Apply &amp; reload</button>
            </div>
          </div>
        )}
        {importStatus?.type === "success" && (
          <div style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: 8 }}>
            ✓ Import applied. Reloading…
          </div>
        )}
        {importStatus?.type === "error" && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: 8 }}>
            ✗ {importStatus.message}
          </div>
        )}

        {/* Danger zone */}
        <div className="danger-zone">
          <div className="danger-zone-header">⚠️ Danger zone</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Reset all data</div>
              <div className="settings-row-desc">Permanently delete all tasks, notes, habits, and settings. This cannot be undone.</div>
            </div>
            <button className="btn sm danger" onClick={() => setShowResetConfirm(true)}>Reset all</button>
          </div>
        </div>
      </Section>

      {/* ── Reset confirm modal ── */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-box sm" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reset all data?</h3>
            <p style={{ color: "var(--muted)", margin: "12px 0 20px", lineHeight: 1.6 }}>
              This will permanently erase <strong>all tasks, notes, habits, reflections, focus sessions, exams, settings</strong> and everything else.
              <br /><br />
              <strong style={{ color: "var(--danger)" }}>This action cannot be undone.</strong> Consider exporting a backup first.
            </p>
            <div className="form-actions">
              <button className="btn sm ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn sm danger" onClick={handleReset}>Yes, delete everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

