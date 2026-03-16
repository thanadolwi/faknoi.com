import Image from "next/image";

const roleLabel: Record<string, string> = {
  buyer:   "👤 ผู้สั่ง",
  shopper: "🛵 ผู้รับหิ้ว",
};

export default function AdminReports({ reports }: { reports: any[] }) {
  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">🛡️ รายงานปัญหาทั้งหมด</h1>
        <p className="text-sm text-gray-400 mt-0.5">{reports.length} รายการ</p>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-400 font-medium">ยังไม่มีรายงาน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="card space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="pill bg-brand-blue/10 text-brand-blue">{roleLabel[r.role] || r.role}</span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="font-black text-brand-navy">{r.subject}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    โดย <span className="font-black text-brand-blue">{r.reporter_username || "ไม่ระบุ"}</span>
                  </p>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 font-medium">
                {r.body}
              </p>

              {/* Image */}
              {r.image_url && (
                <a href={r.image_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={r.image_url}
                    alt="report image"
                    className="max-h-48 rounded-2xl object-contain border border-gray-100 hover:opacity-90 transition-opacity"
                  />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
