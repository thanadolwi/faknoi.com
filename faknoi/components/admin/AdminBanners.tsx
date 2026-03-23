"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon, Trash2, Upload, X, AlertTriangle } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024;

interface Banner {
  id: string;
  image_url: string;
  created_at: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: false });
    if (upErr) { setFileError("อัปโหลดไม่สำเร็จ: " + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);

    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: publicUrl }),
    });
    const data = await res.json();
    if (data.banner) setBanners((prev) => [...prev, data.banner]);
    clearFile();
    setUploading(false);
  }

  async function handleDelete(banner: Banner) {
    setDeleting(banner.id);
    // extract path from URL
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
      <div>
        <p className="text-xs font-black text-gray-500 mb-2">เพิ่ม/ลบโฆษณา</p>
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
        {fileError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />{fileError}
          </p>
        )}
        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className="btn-primary w-full mt-3 py-2.5 text-sm flex items-center justify-center gap-2">
            {uploading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Upload className="w-4 h-4" /> อัปโหลดโฆษณา</>}
          </button>
        )}
      </div>
    </div>
  );
}
