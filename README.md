# 🚀 Deal & Sales Pipeline Tracker (ระบบจัดการไปป์ไลน์และดีลการขาย)

เว็บแอปพลิเคชันบริหารและติดตามกระบวนการขาย (Sales Pipeline Tracker) ขนาดกะทัดรัด เหมาะสำหรับทีมงาน 1-2 คน ออกแบบด้วยดีไซน์ Clean, Minimal & Modern SaaS พร้อมระบบคำนวณมูลค่าถ่วงน้ำหนักอัตโนมัติ และรองรับ 2 ภาษา (ไทย / English)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Lucide React, shadcn/ui design patterns
- **Backend / Database:** SQLite ผ่าน Prisma ORM (`@prisma/client`)
- **ภาษา:** TypeScript 100%

---

## 📊 ฟีเจอร์หลัก (Core Features)

### 1. Dashboard Overview & KPI Metrics
- **Total Pipeline Value:** ผลรวม Deal Value ของดีลที่ยัง Active (ไม่รวม Closed Won และ Closed Lost)
- **Weighted Forecast:** ผลรวม Weighted Value ของ Active Deals ตามโอกาสปิดดีลจริง
- **Closed Won YTD:** มูลค่ารวมของดีลที่ปิดการขายสำเร็จทั้งหมด
- **Win Rate %:** อัตราส่วนความสำเร็จ คำนวณจากสูตร: `(Won / (Won + Lost)) * 100`
- **Deal Breakdown by Stage:** การ์ดสรุปจำนวนดีล มูลค่ารวม และสัดส่วน % ในแต่ละ Stage สามารถคลิกเพื่อกรองดีลได้ทันที

### 2. Dual Views (สลับมุมมองได้ทันที)
- **Kanban Board View:**
  - 6 คอลัมน์ตาม Sales Stage
  - ระบบ **Drag & Drop** ลากการ์ดข้ามขั้นตอนได้สะดวกรวดเร็ว
  - เมนู Quick Move ย้ายขั้นตอนได้เพียงคลิกเดียว (เหมาะกับการใช้งานบน Tablet/Mobile)
  - ป้ายแจ้งเตือน Overdue เมื่อเลยวันที่คาดว่าจะปิดดีล
- **Table / List View:**
  - ตารางแสดงรายการดีลทั้งหมด
  - ช่องค้นหา (Search) ครอบคลุมชื่อดีล, บริษัท, ผู้ติดต่อ, ID และโน้ต
  - คัดกรองตาม Stage และ Owner
  - จัดเรียง (Sort) ตามวันที่สร้าง (ใหม่-เก่า), มูลค่าดีล (มาก-น้อย), หรือวันคาดว่าจะปิด
  - ปุ่ม **Export CSV** ส่งออกไฟล์ CSV รองรับภาษาไทยสมบูรณ์ (UTF-8 BOM)

### 3. Deal CRUD & Form Modal
- **สร้าง / แก้ไขดีล:**
  - กำหนด Stage แล้วระบบคำนวณ `win_probability` และ `weighted_value` ให้โดยอัตโนมัติ (สามารถปรับแต่ง % เพิ่มเติมได้)
  - เมื่อเลือก Stage เป็น **"6. Closed Lost"** จะแสดงช่อง **Lost Reason** ให้ระบุเหตุผล (ราคาแพงเกินไป, สเปกไม่ตรง, ลูกค้ายกเลิกงบ, เลือกคู่แข่ง, อื่นๆ)
  - เมื่อเปลี่ยนสถานะเป็น **"5. Closed Won"** หรือ **"6. Closed Lost"** ระบบจะบันทึก `actual_close_date` ให้อัตโนมัติ
  - สูตรคำนวณ Weighted Value: `deal_value * (win_probability / 100)`
- **ยืนยันการลบ:** มี Confirmation Dialog ป้องกันการลบข้อมูลโดยไม่ตั้งใจ

### 4. รองรับ 2 ภาษา (Bilingual Support: TH / EN)
- สลับภาษาได้ทันทีผ่านปุ่มบน Header พร้อมจำสถานะภาษาล่าสุดในเครื่องผู้ใช้

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

```prisma
model Deal {
  id                String    @id // เช่น "D-1001", "D-1002"
  deal_name         String
  company           String
  contact_person    String
  stage             String    // 1. Lead / Qualification .. 6. Closed Lost
  deal_value        Float     // THB
  win_probability   Float     // 10%, 30%, 60%, 80%, 100%, 0%
  weighted_value    Float     // deal_value * (win_probability / 100)
  owner             String    // "สมชาย", "วิภา", "อภิรักษ์"
  created_date      DateTime  @default(now())
  expected_close    DateTime
  actual_close_date DateTime?
  lost_reason       String?   // "ราคาแพงเกินไป", "สเปกไม่ตรง", etc.
  next_step_notes   String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### ค่าความน่าจะเป็นเริ่มต้นตามแต่ละขั้นตอน (Default Win Probability):
| ขั้นตอน (Stage) | Win Probability (%) | ความหมาย |
|---|---|---|
| **1. Lead / Qualification** | 10% | ลีดใหม่ / คัดกรองเบื้องต้น |
| **2. Meeting / Needs Analysis** | 30% | ประชุมพบลูกค้า / วิเคราะห์ความต้องการ |
| **3. Proposal / Quote Sent** | 60% | ส่งใบเสนอราคา / แผนงาน |
| **4. Negotiation / Contract** | 80% | เจรจาต่อรอง / รอเซ็นสัญญา |
| **5. Closed Won** | 100% | ปิดการขายสำเร็จ (บันทึกรายได้จริง) |
| **6. Closed Lost** | 0% | ปิดการขายไม่สำเร็จ (ระบุเหตุผล) |

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ซิงค์ฐานข้อมูล SQLite
```bash
npx prisma db push
```

### 3. รัน Seed ข้อมูลตัวอย่าง (Mock Data 6 รายการครอบคลุมทุก Stage)
```bash
npm run seed
```
*(หรือกดปุ่ม **"โหลดข้อมูลตัวอย่าง"** บนเมนูด้านบนของหน้าเว็บ)*

### 4. เริ่มต้น Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ที่: [http://localhost:3000](http://localhost:3000)

### 5. Build สำหรับ Production
```bash
npm run build
npm start
```

---

## 🌐 วิธีการ Deploy ขึ้น Netlify + Cloud Database (ฟรี 100%)

ระบบได้รับการปรับแต่งให้พร้อม Deploy ขึ้น **Netlify** อัตโนมัติเรียบร้อยแล้ว ผ่านไฟล์ `netlify.toml` และ `@netlify/plugin-nextjs`

### ขั้นตอนที่ 1: สมัคร Cloud Database ฟรี (แนะนำ Neon.tech หรือ Supabase)
1. เข้าไปที่ [Neon.tech](https://neon.tech) (หรือ [Supabase.com](https://supabase.com)) สมัครใช้งานฟรีด้วย Google / GitHub
2. กด **Create Project** (ตั้งชื่อโปรเจกต์ เช่น `pipelinedeal`)
3. คัดลอก **Connection string** (เลือกแบบ `Pooled connection` หรือ URI ปกติ) ตัวอย่างเช่น:
   ```
   postgresql://neondb_owner:xxxxxx@ep-cool-snowflake-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### ขั้นตอนที่ 2: ตั้งค่าบน Netlify
1. นำโค้ดโปรเจกต์ขึ้น **GitHub / GitLab**
2. เข้าสู่ระบบ [Netlify.com](https://netlify.com) แล้วกด **Add new site** > **Import an existing project**
3. เลือก Repository ของคุณ
4. ไปที่หัวข้อ **Environment variables** แล้วเพิ่มค่า:
   - **Key:** `DATABASE_URL`
   - **Value:** *(วาง Connection string ที่ได้จาก Neon หรือ Supabase)*
5. กดปุ่ม **Deploy site**

> 💡 **หมายเหตุ:** ระบบจะทำการสร้างตารางฐานข้อมูล (`prisma db push`) และโหลดข้อมูลตัวอย่าง 6 รายการให้อัตโนมัติทันทีเมื่อเปิดเข้าใช้งานครั้งแรก!

