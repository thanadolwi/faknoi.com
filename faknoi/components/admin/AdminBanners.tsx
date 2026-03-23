"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon, Trash2, Upload, X, AlertTriangle, Link as LinkIcon } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024;

interface Banner {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  created_at: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((d) => { setBanners(d.banners || []); setLoading(false); });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > MAX_SIZE) { setFileError("ไฟล์ต้องไม่เกิน 5MB"); return; }
    if (!f.type.startsWith("image/")) { setFileError("กรุณาเลือกไฟล์รูปภาพ"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setFileError("");
    setCaption("");
    setLinkUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (caption.trim()) formData.append("caption", caption.trim());
    if (linkUrl.trim()) formData.append("linkUrl", linkUrl.trim());

    const res = await fetch("/api/admin/banners", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) { setFileError("อัปโหลดไม่สำเร็จ: " + data.error); setUploading(false); return; }
    if (data.banner) setBanners((prev) => [...prev, data.banner]);
    clearFile();
    setUploading(false);
  }

  async function handleDelete(banner: Banner) {
    setDeleting(banner.id);
    const url = new URL(banner.image_url);
    const parts = url.pathname.split("/banners/");
    const imagePath = parts[1] ? `banners/${parts[1]}` : undefined;
    await fetch("/api/admin/banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, imagePath }),
    });
    setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    setDeleting(null);
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-black text-brand-navy text-sm flex items-center gap-2">
        🖼️ โฆษณา / Banner
      </h2>

      {/* Current banners */}
      <div>
        <p className="text-xs font-black text-gray-500 mb-2">โฆษณาที่กำลังแสดงอยู่ ({banners.length})</p>
        {loading ? (
          <div className="flex justify-center py-4">
            <span className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีโฆษณา</p>
        ) : (
          <div className="space-y-2">
            {banners.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2">
                <img src={b.image_url} alt={`banner-${i + 1}`}
                  className="w-20 h-11 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-navy">Banner {i + 1}</p>
                  {b.caption && <p className="text-[10px] text-gray-600 truncate">{b.caption}</p>}
                  {b.link_url && (
                    <p className="text-[10px] text-brand-blue truncate flex items-center gap-0.5">
                      <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />{b.link_url}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {new Date(b.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <button onClick={() => handleDelete(b)} disabled={deleting === b.id}
                  className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                  {deleting === b.id
                    ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload new */}
      <div className="space-y-3">
        <p className="text-xs font-black text-gray-500">เพิ่ม/ลบโฆษณา</p>

        {/* Image picker */}
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors">
          {preview ? (
            <div className="relative w-full">
              <img src={preview} alt="preview" className="w-full rounded-xl object-cover" style={{ aspectRatio: "2160/900" }} />
              <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-400 font-medium text-center">
                แตะเพื่อเลือกรูป<br />
                <span className="text-[10px]">2160×900px · ≤5MB</span>
              </p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">ข้อความใต้ภาพ (ไม่บังคับ)</label>
          <input type="text" className="input-field text-sm" placeholder="เช่น โปรโมชั่นพิเศษ ลด 20%"
            value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>

        {/* Link URL */}
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">ลิงก์ (ไม่บังคับ)</label>
          <input type="url" className="input-field text-sm" placeholder="https://..."
            value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>

        {fileError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />{fileError}
          </p>
        )}

        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {uploading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Upload className="w-4 h-4" /> อัปโหลดโฆษณา</>}
          </button>
        )}
      </div>
    </div>
  );
}
