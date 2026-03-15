# FakNoi 🛍️

แพลตฟอร์มรับหิ้วอาหารในมหาวิทยาลัย — Trip-Based Matching PWA

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (email/password)

## การติดตั้ง

### 1. ติดตั้ง Node.js
ดาวน์โหลดจาก https://nodejs.org (LTS version)

### 2. ติดตั้ง dependencies
```bash
cd faknoi
npm install
```

### 3. ตั้งค่า Supabase
1. สร้างโปรเจกต์ที่ https://supabase.com
2. ไปที่ SQL Editor แล้ว run ไฟล์ `supabase/schema.sql`
3. คัดลอก Project URL และ anon key จาก Settings > API

### 4. ตั้งค่า Environment Variables
แก้ไขไฟล์ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. รัน Development Server
```bash
npm run dev
```
เปิด http://localhost:3000

## โครงสร้างหน้า
- `/` — Landing page
- `/register` — สมัครสมาชิก
- `/login` — เข้าสู่ระบบ
- `/dashboard` — หน้าหลัก
- `/trips` — ดูทริปทั้งหมด
- `/trips/create` — เปิดทริปใหม่
- `/trips/[id]` — รายละเอียดทริป
- `/orders` — ออเดอร์ของฉัน
- `/orders/create` — สั่งออเดอร์
- `/orders/[id]` — รายละเอียดออเดอร์
