import { useState } from "react";

export default function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClose, onClear }) {
  const [filter, setFilter] = useState("all");

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    return true;
  }).slice().reverse();

  const unreadCount = notifications.filter(n => !n.read).length;

  const TYPE_ICON = { task: "✓", exam: "📋", focus: "🎯", reminder: "🔔", info: "ℹ️" };
  const TYPE_DOT  = { task: "task", exam: "exam", focus: "focus", reminder: "task", info: "task" };

  return (
    <div className="notif-panel" role="dialog" aria-label="Notification center">
      <div className="notif-header">
        <h3>Notifications {unreadCount > 0 && <span style={{ fontSize: "0.72rem", background: "var(--danger)", color: "#fff", borderRadius: 999, padding: "1px 6px", marginLeft: 4 }}>{unreadCount}</span>}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {unreadCount > 0 && <button className="btn sm ghost" onClick={onMarkAllRead}>Mark all read</button>}
          {notifications.length > 0 && <button className="btn sm ghost" onClick={onClear}>Clear</button>}
          <button className="x-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>
        {[["all", "All"], ["unread", "Unread"]].map(([k, l]) => (
          <button key={k} className={`pill${filter === k ? " active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div className="notif-body">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            {filter === "unread" ? "No unread notifications" : "All caught up! 🎉"}
          </div>
        ) : (
          filtered.map(n => (
            <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`} onClick={() => onMarkRead?.(n.id)} style={{ cursor: "pointer" }}>
              {!n.read && <div className="notif-dot" />}
              <div className="notif-content" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="notif-title">{n.title}</div>
                </div>
                {n.body && <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{n.body}</div>}
                <div className="notif-time">{n.createdAt ? new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

