# Product Requirements Document (PRD)
## Web Katalog Aksesoris — Fullstack Development (Visitor & Admin)

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | Web Katalog Aksesoris & Order Notes Generator |
| **Versi** | 2.0 (Fullstack Development Spec) |
| **Platform** | Mobile-First Web App (Max-width frame `480px` terpusat di layar desktop) |
| **Tech Stack** | Next.js (App Router), Tailwind CSS, Supabase (Auth, Postgres, Storage), Zustand, `html-to-image`, `browser-image-compression` |
| **Fokus Dokumen** | Spesifikasi End-to-End (Visitor & Admin), Database Schema & RLS, UI/UX Mobile Frame, & State Management |

---

## 1. Latar Belakang & Tujuan Produk
Pemilik toko aksesoris membutuhkan platform katalog digital berbasis *mobile-first* yang ringan dan cepat tanpa memerlukan registrasi akun bagi pembeli. Seluruh pemesanan diarahkan ke WhatsApp Owner dengan melampirkan **gambar struk pesanan (Order Notes)** yang berisi foto thumbnail produk, kode SKU, detail item, dan data pembeli, disertai teks ringkasan. Di sisi pengelola, admin membutuhkan dashboard *mobile-friendly* untuk menambah kategori secara dinamis, mengelola produk (multi-foto), serta mengatur ketersediaan stok dengan cepat langsung dari HP.

### Tujuan Utama (Goals)
1. **Visitor Experience:** Eksplorasi produk cepat, carousel foto di halaman detail, keranjang persisten, dan pembuatan gambar Order Notes otomatis ke WhatsApp dalam 1 klik (`Buat Pesanan`).
2. **Admin Experience:** Manajemen kategori dinamis, *auto-generate* SKU berbasis kategori, kompresi foto otomatis sebelum upload, dan *quick toggle* stok langsung dari layar HP.
3. **Mobile-First Layout:** Antarmuka didesain khusus untuk kenyamanan navigasi satu tangan (*thumb-friendly*) pada frame HP (`max-w-[480px]`).

---

## 2. Design System & Mobile Frame Guidelines

### 2.1 Mobile Frame Container
Untuk menjaga konsistensi proporsi visual baik saat diakses lewat HP maupun browser desktop:
* Seluruh aplikasi dibungkus dalam *root container* dengan lebar maksimal **`480px`** (`max-w-[480px] mx-auto min-h-screen bg-white shadow-sm relative`).
* Elemen *Sticky Header* dan *Floating Bottom Bar* mengikuti batas lebar `max-w-[480px]`.

### 2.2 Palet Warna (Color Palette)
* **Primary Pink (Accent & Active State):** `#EC4899` (Pink-500) / `#DB2777` (Pink-600 hover)
* **Primary Pink Soft (Badge / Tint Surface):** `#FCE7F3` (Pink-100)
* **Dark Charcoal (Secondary CTA & High Contrast):** `#222222`
* **Background Canvas:** `#FFFFFF`
* **Surface Card / Input:** `#F6F6F6` / `#F9FAFB`
* **Text Primary:** `#1F2937`
* **Text Secondary / Muted:** `#9CA3AF`
* **Status Ready / Habis:** Emerald `#10B981` (Ready) & Rose `#EF4444` (Habis)

### 2.3 Tipografi & Komponen
* **Font Family:** `Manrope` atau `Plus Jakarta Sans`.
* **Radius:** Kartu Produk & Modal Sheet (`rounded-2xl` / `rounded-3xl`), Filter Pills (`rounded-full`), Input & Button (`rounded-2xl`).
* **Bottom Sheet / Drawer:** Untuk form tambah/edit di halaman Admin maupun modal informasi di halaman Visitor, gunakan pola *Bottom Sheet* (muncul dari bawah layar) agar mudah dijangkau jempol.

---

## 3. Arsitektur Database & Storage (Supabase)

### 3.1 Skema SQL & Auto-Generate SKU Trigger

```sql
-- 1. Tabel Kategori (Admin bisa tambah kategori sendiri)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- Contoh: 'Keychain', 'Phone Holder'
  prefix TEXT UNIQUE NOT NULL,      -- Contoh: 'KC', 'PH' (2-4 huruf kapital untuk SKU)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Produk
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,         -- Ter-generate otomatis (misal: 'KC-001')
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}', -- Array URL foto untuk carousel detail produk
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Function & Trigger Auto-Generate SKU saat Insert Produk Baru
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  cat_prefix TEXT;
  next_num INTEGER;
BEGIN
  -- Ambil prefix dari kategori yang dipilih
  SELECT prefix INTO cat_prefix FROM categories WHERE id = NEW.category_id;
  
  -- Hitung urutan berikutnya berdasarkan prefix tersebut
  SELECT COALESCE(MAX(CAST(SPLIT_PART(sku, '-', 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM products
  WHERE sku LIKE cat_prefix || '-%';

  -- Format menjadi PREFIX-001 (3 digit padding)
  NEW.sku := cat_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_sku
BEFORE INSERT ON products
FOR EACH ROW
WHEN (NEW.sku IS NULL OR NEW.sku = '')
EXECUTE FUNCTION generate_product_sku();
```

### 3.2 Supabase Storage & Row Level Security (RLS)
* **Bucket Storage:** `product-images` (Status: **Public** agar gambar bisa dirender oleh `html-to-image` tanpa blokir CORS).
* **RLS Policies:**
  * `categories` & `products`: `SELECT` terbuka untuk `anon` (Public). `INSERT`, `UPDATE`, `DELETE` hanya untuk `authenticated` (Admin).
  * `storage.objects`: `SELECT` terbuka untuk `public`. `INSERT` & `DELETE` hanya untuk `authenticated`.

---

## 4. Spesifikasi Fitur — Sisi Visitor (Customer)

### 4.1 User Flow Visitor
```
[Halaman Katalog (/)]
   ├──► Filter Kategori (All + Kategori Dinamis dari DB)
   ├──► Tap Produk ──► [Detail Produk (/product/[id])]
   │                      ├──► Geser Carousel Foto + Thumbnail Selector
   │                      └──► Klik "+ Tambah ke Keranjang"
   ├──► Tap "Pesanan (n)" di Header ──► [Riwayat Order (/orders)] (Preview & Kirim Ulang WA)
   └──► Tap Floating Bottom Bar ──► [Checkout (/checkout)]
                                       ├──► Atur Qty (+/-) & Isi Data Pembeli
                                       └──► Klik CTA "Buat Pesanan"
                                              ├──► Simpan ke localStorage
                                              ├──► Render Struk PNG (html-to-image)
                                              └──► Share WA (navigator.share / Fallback wa.me)
```

### 4.2 Detail Halaman Visitor
1. **Halaman Katalog Utama (`/`):**
   * **Top Header:** Logo + Nama Brand di kiri; Tombol `Pesanan (n)` + ikon struk di kanan.
   * **Category Filter Pills:** Scroll horizontal (`✓ All` + daftar `categories` dari Supabase). Pil aktif berwarna **Primary Pink (`#EC4899`)**.
   * **Product Grid (2 Kolom):** Menampilkan foto `images[0]` (rasio `1:1`, `rounded-2xl`), *badge* jumlah di pojok foto jika sudah masuk keranjang, Nama Produk (maks 2 baris), `Kategori • SKU`, dan Harga. Produk dengan `is_available = false` menampilkan overlay `"Habis"`.
   * **Floating Bottom Bar:** Ikon keranjang gelap + badge pink di kiri, tombol CTA **`Checkout • Rp XX.XXX`** di kanan.
2. **Halaman Detail Produk (`/product/[id]`):**
   * **Header:** Tombol `Back` di kiri, badge `SKU` di kanan.
   * **Carousel Foto:** Gambar utama `1:1` (`rounded-3xl`, mendukung *swipe*) + deretan thumbnail kotak kecil (`48x48px`) di bawah/atas gambar utama dengan border **Primary Pink** pada foto aktif.
   * **Info Produk:** Nama Kategori (pink), Nama Produk, dan Harga.
   * **Sticky Bottom CTA:** Tombol penuh **`+ Tambah ke Keranjang`** (Primary Pink).
3. **Halaman Checkout (`/checkout`):**
   * **Daftar Item:** Thumbnail, Nama, SKU, Harga satuan, kontrol `- qty +`.
   * **Form Info Pembeli:** Nama Lengkap *(wajib)*, No. WhatsApp *(wajib)*, Catatan/Alamat *(opsional)*. Tersimpan otomatis di `localStorage` untuk order berikutnya.
   * **Banner Info WA Owner:** Nomor WA Owner + tombol **`Salin Nomor`**.
   * **Sticky Bottom CTA:** Tombol penuh **`Buat Pesanan`** (Primary Pink) yang menjalankan proses penyimpanan riwayat, konversi komponen `HiddenReceiptTemplate` menjadi PNG (`pixelRatio: 2`), dan pengiriman via `navigator.share({ files, text })` (atau auto-download + redirect `wa.me` di desktop).
4. **Halaman Riwayat Pesanan (`/orders`):**
   * Menampilkan daftar order dari `localStorage`. Saat diklik, menampilkan preview gambar struk dan tombol **`Kirim Ulang ke WhatsApp`** serta **`Download Gambar`**.

---

## 5. Spesifikasi Fitur — Sisi Admin (Mobile-First Dashboard)

Dirancang agar owner/admin bisa mengelola toko langsung dari HP dengan navigasi yang simpel, tanpa tabel rumit yang terpotong ke samping.

### 5.1 User Flow Admin
```
[Login Admin (/admin/login)] (Email & Password Supabase Auth)
       │
       ▼
[Dashboard Produk (/admin)]
   ├──► Search Bar (Cari Nama / SKU) & Filter Kategori
   ├──► Kelola Kategori (Bottom Sheet) ──► Tambah / Hapus Kategori + Prefix SKU
   ├──► Quick Toggle Status Stok (Switch Ready / Habis langsung di list)
   ├──► Tap Produk ──► [Edit Produk (Bottom Sheet / Halaman)]
   └──► Tap Floating Button "+ Produk" ──► [Tambah Produk Baru]
                                                ├──► Pilih Kategori (Preview SKU otomatis muncul)
                                                ├──► Upload 1–5 Foto (Auto-compress di browser)
                                                ├──► Isi Nama & Harga
                                                └──► Klik "Simpan Produk"
```

### 5.2 Detail Halaman & UX Admin
1. **Halaman Login Admin (`/admin/login`):**
   * Form minimalis di tengah frame HP: Input Email, Input Password, dan tombol **`Masuk ke Admin`** (Dark Charcoal / Primary Pink).
   * Dilindungi oleh Next.js Middleware agar rute `/admin/*` tidak bisa diakses tanpa sesi login valid.
2. **Dashboard Utama Admin (`/admin`):**
   * **Top Header:** Judul `"Kelola Katalog"`, tombol ikon **Kelola Kategori** (ikon folder/tag), dan tombol **Logout**.
   * **Search & Filter Bar:**
     * Input pencarian cepat berdasarkan **Nama Produk** atau **Kode SKU** (misal ketik `"KC-004"`).
     * Horizontal *filter pills* kategori.
   * **List Produk (Mobile Card List):**
     * Menggunakan tampilan kartu vertikal (*list card*) alih-alih tabel desktop agar mudah dibaca di HP.
     * Setiap kartu menampilkan: Thumbnail foto (`60x60px`, `rounded-xl`), Badge SKU (`KC-001`), Nama Produk, Harga, **Toggle Switch (`Ready` / `Habis`)** di sisi kanan untuk update stok instan tanpa perlu masuk ke halaman edit, serta tombol ikon Edit & Hapus.
   * **Floating Action Button (FAB):** Tombol pil melayang di pojok kanan bawah: **`+ Tambah Produk`** berwarna **Primary Pink (`#EC4899`)**.
3. **Bottom Sheet: Kelola Kategori (`/admin` -> Modal Sheet):**
   * Admin dapat melihat daftar kategori yang ada beserta jumlah produknya.
   * **Form Tambah Kategori Baru:**
     * **Nama Kategori:** Input teks (contoh: `Hairpin`).
     * **Kode Awalan SKU (Prefix):** Input 2–4 huruf kapital (otomatis terisi saran dari singkatan nama kategori, misal ketik `Hairpin` otomatis menyarankan `HP`, namun tetap bisa diedit admin).
     * Tombol **`+ Tambah Kategori`**.
   * Kategori hanya bisa dihapus jika tidak memiliki produk aktif (atau tampilkan peringatan).
4. **Halaman / Sheet Form Tambah & Edit Produk (`/admin/product/new` & `/admin/product/[id]`):**
   * **Upload Multi-Foto (Maksimal 5 Foto untuk Carousel):**
     * Area *tap-to-upload* ramah layar sentuh (`+ Tambah Foto`).
     * Menggunakan `browser-image-compression` sebelum upload ke Supabase Storage (maks lebar `1000px`, kualitas `0.8`, format WebP/JPEG) agar upload via jaringan seluler cepat dan hemat kuota.
     * Admin dapat menggeser/menghapus foto yang dipilih, dengan foto pertama otomatis menjadi foto utama (*cover*).
   * **Pilih Kategori:** Dropdown / Pil pilihan kategori. Begitu kategori dipilih, muncul *badge info* preview SKU berikutnya (contoh: `SKU otomatis: HP-001`).
   * **Nama Produk & Harga:** Input teks dan input angka format Rupiah.
   * **Status Ketersediaan:** Toggle `Tersedia (Ready)` / `Habis (Sold Out)`.
   * **Sticky Bottom CTA:** Tombol penuh **`Simpan Produk`** (Primary Pink).

---

## 6. Manajemen State (State Management Architecture)

### 6.1 Global Persistent State Visitor (`useVisitorStore` -> `localStorage`)
* `cart: CartItem[]` — Item di keranjang (`{ productId, sku, name, price, imageUrl, qty }`).
* `savedOrders: OrderNote[]` — Riwayat order notes yang sudah di-generate (`{ orderId, createdAt, buyerInfo, items, totalAmount, totalQty }`).
* `buyerProfile: BuyerInfo` — Data autofill form pembeli (`{ name, phone, notes }`).

### 6.2 Client State Halaman Admin
* `adminProducts: Product[]` — Data produk beserta relasi nama kategorinya.
* `categories: Category[]` — Daftar kategori dinamis dari tabel `categories`.
* `searchQuery: string` — Filter pencarian real-time nama/SKU.
* `isUploadingImages: boolean` — Indikator progress saat kompresi & upload foto ke Supabase Storage.
* `isCategorySheetOpen: boolean` — Kontrol buka/tutup *bottom sheet* manajemen kategori.

---

## 7. Checklist Kebutuhan Teknis & Edge Cases
1. **CORS & Render Struk PNG:** Semua tag `<img>` pada komponen `HiddenReceiptTemplate` wajib memiliki `crossOrigin="anonymous"` dan gambar diambil dari URL publik Supabase Storage agar tidak blank saat di-convert menggunakan `html-to-image`.
2. **Cleanup Storage saat Hapus Produk:** Saat admin menghapus produk atau menghapus foto tertentu pada mode edit, file gambar terkait di bucket `product-images` juga ikut dihapus (`supabase.storage.from('product-images').remove(...)`) agar penyimpanan tidak penuh oleh file sampah.
3. **Validasi Prefix SKU Unik:** Pada form tambah kategori admin, ubah input `prefix` menjadi `UPPERCASE` secara otomatis dan validasi agar tidak bentrok dengan kode prefix kategori lain.