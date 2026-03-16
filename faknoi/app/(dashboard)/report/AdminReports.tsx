"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const statusMeta: Record<string, { labelKey: string; color: string; emoji: string }> = {
  pending:   { labelKey: "rs_pending",   color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
  reviewing: { labelKey: "rs_reviewing", color: "bg-blue-100 text-blue-700",     emoji: "🔍" },
  resolved:  { labelKey: "rs_resolved",  color: "bg-green-100 text-green-700",   emoji: "✅" },
};

function ReportCard({ report }: { report: any }) {
  const { lang } = useLang();
  const [status, setStatus] = useState(report.report_status || "pending");
  const [saving, setSaving] = useState(false);
  const s = statusMeta[status] || statusMeta.pending;

  const roleLabel: Record<string, string> = {
    buyer:   t(lang, "ar_role_buyer"),
    shopper: t(lang, "ar_role_shopper"),
  };

  async function updateStatus(newStatus: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("reports").update({ report_status: newStatus }).eq("id", report.id);
    if (error) {
      alert(t(lang, "ar_update_fail") + ": " + error.message);
    } else {
      setStatus(newStatus);
    }
    setSaving(false);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="pill bg-brand-blue/10 text-brand-blue">{roleLabel[report.role] || report.role}</span>
            <span className={`pill ${s.color}`}>{s.emoji} {t(lang, s.labelKey)}</span>
            <span className="text-xs text-gray-400 font-medium">
              {new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <p className="font-black text-brand-navy">{report.subject}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {t(lang, "ar_by")} <span className="font-black text-brand-blue">{report.reporter_username || t(lang, "ar_unknown")}</span>
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 font-medium">{report.body}</p>

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

      {report.image_url && (
        <a href={report.image_url} target="_blank" rel="noopener noreferrer">
          <img src={report.image_url} alt="report"
            className="max-h-48 rounded-2xl object-contain border border-gray-100 hover:opacity-90 transition-opacity" />
        </a>
      )}

      <div className="flex gap-2 pt-1">
        {Object.entries(statusMeta).map(([val, { labelKey, emoji }]) => (
          <button key={val} onClick={() => updateStatus(val)} disabled={saving || status === val}
            className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              status === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50 hover:border-brand-blue/30"
            }`}
            style={status === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {emoji} {t(lang, labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminReports({ reports: initial }: { reports: any[] }) {
  const { lang } = useLang();
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? initial : initial.filter((r) => r.report_status === filter);

  const filterOptions = [
    { val: "all",       labelKey: "ar_all",        emoji: "" },
    { val: "pending",   labelKey: "rs_pending",    emoji: "⏳" },
    { val: "reviewing", labelKey: "rs_reviewing",  emoji: "🔍" },
    { val: "resolved",  labelKey: "rs_resolved",   emoji: "✅" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">{t(lang, "ar_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{initial.length} {t(lang, "ar_items")}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterOptions.map(({ val, labelKey, emoji }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              filter === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"
            }`}
            style={filter === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {emoji} {t(lang, labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-400 font-medium">{t(lang, "ar_no_items")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}
