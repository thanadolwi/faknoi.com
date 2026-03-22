"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  action_type: string;
  note: string | null;
  created_at: string;
}

export default function AdminNotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []));
  }, []);

  async function dismiss(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-red-700">แจ้งเตือนจากแอดมิน</p>
            {n.note && <p className="text-sm text-red-600 mt-0.5">{n.note}</p>}
            <p className="text-xs text-red-400 mt-1">{new Date(n.created_at).toLocaleString("th-TH")}</p>
          </div>
          <button onClick={() => dismiss(n.id)} className="p-1 rounded-lg hover:bg-red-100 flex-shrink-0">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
