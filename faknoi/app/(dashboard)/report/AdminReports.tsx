"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const statusLabel: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: "รอดำเนินการ",  color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
  reviewing: { label: "กำลังตรวจสอบ", color: "bg-blue-100 text-blue-700",    emoji: "🔍" },
  resolved:  { label: "แก้ไขแล้ว",    color: "bg-green-100 text-green-700",   emoji: "✅" },
};

const roleLabel: Record<string, string> = {
  buyer:   "👤 ผู้สั่ง",
  shopper: "🛵 ผู้รับหิ้ว",
};

function ReportCard({ report }: { report: any }) {
  const [status, setStatus] = useState(report.report_status || "pending");
  const [saving, setSaving] = useState(false);
  const s = statusLabel[status] || statusLabel.pending;

  async function updateStatus(newStatus: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("reports").update({ report_status: newStatus }).eq("id", report.id);
    setStatus(newStatus);
    setSaving(false);
  }

  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="pill bg-brand-blue/10 text-brand-blue">{roleLabel[report.role] || report.role}</span>
            <span className={`pill ${s.color}`}>{s.emoji} {s.label}</span>
            <span className="text-xs text-gray-400 font-medium">
              {new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <p className="font-black text-brand-navy">{report.subject}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            โดย <span className="font-black text-brand-blue">{report.reporter_username || "ไม่ระบุ"}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 font-medium">
        {report.body}
      </p>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-2 text-xs font-medium">
        {report.phone && (
          <div className="bg-brand-blue/5 rounded-xl px-3 py-2">
            <span className="text-gray-400">📞 </span>
            <span className="text-brand-navy font-black">{report.phone}</span>
          </div>
        )}
        {report.gmail && (
          <div className="bg-brand-blue/5 rounded-xl px-3 py-2">
            <span className="text-gray-400">📧 </span>
            <span className="text-brand-navy font-black">{report.gmail}</span>
          </div>
        )}
      </div>

      {/* Image */}
      {report.image_url && (
        <a href={report.image_url} target="_blank" rel="noopener noreferrer">
          <img src={report.image_url} alt="report" className="max-h-48 rounded-2xl object-contain border border-gray-100 hover:opacity-90 transition-opacity" />
        </a>
      )}

      {/* Status changer */}
      <div className="flex gap-2 pt-1">
        {Object.entries(statusLabel).map(([val, { label, emoji }]) => (
          <button key={val} onClick={() => updateStatus(val)} disabled={saving || status === val}
            className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              status === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50 hover:border-brand-blue/30"
            }`}
            style={status === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminReports({ reports: initial }: { reports: any[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? initial : initial.filter((r) => r.report_status === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">🛡️ รายงานปัญหาทั้งหมด</h1>
        <p className="text-sm text-gray-400 mt-0.5">{initial.length} รายการ</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: "all",       label: "ทั้งหมด" },
          { val: "pending",   label: "⏳ รอดำเนินการ" },
          { val: "reviewing", label: "🔍 กำลังตรวจสอบ" },
          { val: "resolved",  label: "✅ แก้ไขแล้ว" },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              filter === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"
            }`}
            style={filter === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-400 font-medium">ไม่มีรายการ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}
