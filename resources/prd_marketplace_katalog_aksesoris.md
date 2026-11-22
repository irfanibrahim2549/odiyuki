# Product Requirements Document (PRD)
## Web Katalog Aksesoris — Halaman Marketplace (Customer Facing)

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | Web Katalog Aksesoris & Order Notes Generator |
| **Versi** | 1.0 (MVP) |
| **Platform** | Mobile-First Web App (Responsive Desktop) |
| **Tech Stack** | Next.js (App Router), Tailwind CSS, Supabase, Zustand/Context, `html-to-image` |
| **Fokus Dokumen** | UI/UX Design System, User Flow, State Management, & Spesifikasi Fungsional Halaman Customer |

---

## 1. Latar Belakang & Tujuan Produk
Pemilik toko aksesoris membutuhkan katalog digital yang ringan, cepat diakses melalui smartphone, dan memudahkan pelanggan memilih produk tanpa perlu membuat akun. Alih-alih menggunakan sistem *payment gateway* yang kompleks, proses pemesanan diarahkan langsung ke WhatsApp Owner dengan melampirkan **gambar struk pesanan (Order Notes)** yang berisi foto thumbnail produk, kode SKU, detail item, dan data pembeli, disertai teks ringkasan.

### Tujuan Utama (Goals)
1. Memberikan pengalaman eksplorasi katalog yang bersih, modern, dan cepat bagi pembeli.
2. Menyederhanakan proses pemilihan produk hingga pembuatan pesanan dalam waktu kurang dari 2 menit.
3. Mengotomatisasi pembuatan gambar Order Notes + teks ringkasan untuk dikirim ke WhatsApp Owner melalui Web Share API (`navigator.share`) dengan fallback otomatis untuk browser desktop.
4. Menyimpan riwayat pesanan yang telah dibuat pada perangkat pengguna (`localStorage`) agar dapat dilihat atau dikirim ulang sewaktu-waktu.

---

## 2. Design System & Visual Guidelines

Mengadaptasi gaya desain minimalis modern dengan sudut membulat (*rounded corners*), permukaan kartu yang lembut (*soft surface*), serta kontras warna gelap dan aksen **Primary Pink**.

### 2.1 Palet Warna (Color Palette)
* **Primary Pink (Accent & Active State):** `#EC4899` (Pink-500) / `#F43F5E` (Rose-500)
* **Primary Pink Soft (Hover / Badge BG):** `#FCE7F3` (Pink-100)
* **Dark Charcoal (Primary CTA & High Contrast):** `#222222` / `#333333`
* **Background Canvas:** `#FFFFFF` (Pure White)
* **Surface Card / Input:** `#F6F6F6` / `#F9FAFB` (Soft Light Gray)
* **Text Primary:** `#1F2937`
* **Text Secondary / Muted:** `#9CA3AF`
* **Border / Divider:** `#E5E7EB`

### 2.2 Tipografi (Typography)
* **Font Family:** `Manrope` atau `Plus Jakarta Sans` (Geometric Sans-Serif yang bersih dan modern).
* **Skala Ukuran:**
  * *Header / Brand Title:* `18px` – `20px` (Bold)
  * *Page / Product Detail Title:* `20px` – `22px` (Bold)
  * *Product Card Title:* `14px` (SemiBold, maksimal 2 baris *line-clamp*)
  * *Price Tag:* `14px` (Bold, di detail produk `20px` Bold)
  * *Category / SKU Badge:* `11px` – `12px` (Medium)

### 2.3 Gaya Komponen (Component Styling)
* **Border Radius:**
  * Kartu Produk & Container Gambar: `16px` – `20px` (`rounded-2xl`)
  * Filter Chips / Pills: `9999px` (`rounded-full`)
  * Tombol Utama (CTA) & Input Field: `14px` – `16px` (`rounded-2xl`)
* **Elevation & Shadow:** Minimalis. Menggunakan perbedaan warna permukaan (`#F6F6F6` di atas `#FFFFFF`) dibanding *drop-shadow* tebal, kecuali pada *Floating Bottom Bar* (`shadow-lg`).

---

## 3. Arsitektur Informasi & User Flow

### 3.1 Alur Pengguna End-to-End (User Flow)

```
[1. Halaman Katalog (Home)]
       │
       ├──► Filter Kategori (All / Keychain / Phone Holder / dll.)
       ├──► Tap Kartu Produk ──► [2. Halaman / Sheet Detail Produk]
       │                                │
       │                                ├──► Geser Carousel Foto Produk
       │                                └──► Klik "Tambah ke Keranjang"
       │
       ├──► Tap Icon "Pesanan / Saved (n)" di Header ──► [4. Halaman Riwayat Order Notes]
       │                                                        │
       │                                                        └──► Preview Struk & Kirim Ulang ke WA
       │
       └──► Klik Floating Bottom Bar ("Lihat Keranjang • Rp XX.XXX")
                   │
                   ▼
         [3. Halaman Checkout]
                   │
                   ├──► Atur Qty (+/-) atau Hapus Item
                   ├──► Isi Form Info Pembeli (Nama, No. WA, Catatan/Alamat)
                   └──► Klik CTA Utama: "Buat Pesanan"
                               │
                               ▼
              [Proses Generate Gambar & Share]
                   │
                   ├──► 1. Simpan data order ke `localStorage` (masuk ke list "Pesanan")
                   ├──► 2. Render komponen Struk HTML -> Convert ke PNG (`html-to-image`)
                   ├──► 3. Cek dukungan `navigator.share({ files, text })`:
                   │         ├──► [Support (Mobile)]: Buka Native Share Sheet -> Pilih WA -> Kirim Gambar + Teks
                   │         └──► [Tidak Support (Desktop)]: Auto-download PNG + Copy Teks + Redirect `wa.me`
                   └──► 4. Tampilkan Modal Konfirmasi & Instruksi (termasuk tombol Copy Nomor WA Owner)
```

---

## 4. Spesifikasi Detail Halaman & Komponen UI

### 4.1 Halaman 1: Marketplace / Katalog Utama (`/`)
Mengikuti struktur wireframe dengan sentuhan visual *modern rounded*:

1. **Top Header Bar (Sticky Top):**
   * **Kiri:** Logo toko + Nama Brand (`Logoipsum` / Nama Toko).
   * **Kanan:** Tombol pil/ikon menuju halaman Riwayat Pesanan dengan label **`Pesanan (n)`** (atau **`Saved (n)`**) dan ikon struk (*receipt*). Angka `n` dinamis mengikuti jumlah pesanan yang tersimpan di `localStorage`.
2. **Category Filter Bar (Horizontal Scrollable Pills):**
   * Deretan tombol *pill* (`rounded-full`) berisi: `✓ All`, `Keychain`, `Phone Holder`, dst. (kategori diambil dinamis dari data produk yang tersedia).
   * **State Aktif:** Background **Primary Pink (`#EC4899`)** dengan teks putih dan ikon centang (`✓`).
   * **State Non-aktif:** Background abu-abu lembut (`#F3F4F6`) dengan teks gelap.
3. **Product Grid (2 Kolom):**
   * *Layout:* CSS Grid 2 kolom (`grid-cols-2 gap-3.5`).
   * **Kartu Produk (Product Card):**
     * **Thumbnail Gambar:** Rasio `1:1` (Square), `rounded-2xl`, background `#F6F6F6`. Jika produk sudah ada di keranjang, tampilkan *badge* jumlah di pojok kanan atas foto (misal: `2x` berwarna Primary Pink).
     * **Nama Produk:** Maksimal 2 baris (`line-clamp-2`), warna teks gelap.
     * **Kategori / SKU:** Teks kecil warna abu-abu (`#9CA3AF`), misal: `Keychain • KC-001`.
     * **Harga:** Format Rupiah (`Rp 8.000`), font *Bold*.
     * **Status Sold Out (Jika `is_available === false`):** Overlay semi-transparan dengan label `"Habis"` dan kartu tidak bisa ditambahkan ke keranjang.
4. **Floating Bottom Action Bar (Sticky Bottom):**
   * Muncul otomatis saat `cart.length > 0` (atau tetap tampil dalam state *disabled* jika keranjang kosong sesuai wireframe).
   * **Kiri:** Tombol ikon keranjang berbentuk lingkaran (`rounded-full`) warna gelap (`#222222`) dengan *badge* angka total kuantitas item berwarna **Primary Pink (`#EC4899`)**.
   * **Kanan:** Tombol CTA memanjang (`rounded-2xl`), warna gelap (`#222222`) atau **Primary Pink (`#EC4899`)**, menampilkan label dinamis: **`Checkout • Rp 24.000`**.

---

### 4.2 Halaman 2: Detail Produk (`/product/[id]` atau Slide-up Modal/Drawer)
Didesain minimalis sesuai kebutuhan: **hanya menampilkan carousel foto, nama, harga, dan tombol aksi**.

1. **Top Navigation Bar:**
   * Tombol `Back` (ikon panah kiri dalam lingkaran lembut) di kiri atas.
   * Badge kode SKU (misal: `KC-001`) di kanan atas.
2. **Product Image Carousel:**
   * **Main Image Display:** Container besar (`rounded-3xl`, rasio `1:1`, background `#F6F6F6`) yang mendukung *swipe* horizontal untuk melihat seluruh foto produk (`images[]`).
   * **Thumbnail Selector (Gaya Referensi UI):** Barisan thumbnail kotak kecil ber sudut membulat (`48x48px`, `rounded-xl`) di bagian atas atau bawah gambar utama. Thumbnail yang aktif memiliki border **Primary Pink (`2px solid #EC4899`)**.
3. **Product Info Section:**
   * **Label Kategori:** Teks kecil berwarna **Primary Pink** (misal: `Keychain`).
   * **Nama Produk:** Ukuran `22px` Bold, warna gelap.
   * **Harga Produk:** Ukuran `20px` Bold, format `Rp 8.000`.
4. **Sticky Bottom Action Bar:**
   * Tombol penuh **`+ Tambah ke Keranjang`** (warna Primary Pink `#EC4899`, teks putih) untuk menambahkan produk ke keranjang (atau menambah kuantitas `+1` jika sudah ada di keranjang). Proses menuju Checkout dilakukan langsung melalui Floating Bottom Action Bar di Halaman Katalog Utama.

---

### 4.3 Halaman 3: Checkout (`/checkout`)
Halaman ringkas untuk meninjau keranjang, mengisi data pembeli, dan men-generate Order Notes ke WhatsApp.

1. **Top Header:** Tombol Kembali (`←`) + Judul `"Checkout"`.
2. **Daftar Item Pesanan (Order Summary List):**
   * Menampilkan daftar produk yang dipilih: Thumbnail kecil (`56x56px`, `rounded-xl`), Nama Produk, Kode SKU, Harga satuan, serta kontrol `- qty +` (jika `qty` dikurangi hingga 0, item terhapus dari keranjang).
3. **Form Informasi Pembeli (Buyer Info):**
   * **Nama Lengkap** *(Wajib / Required)* — Placeholder: `"Contoh: Budi Santoso"`
   * **Nomor WhatsApp Pembeli** *(Wajib / Required)* — Placeholder: `"Contoh: 08123456789"`
   * **Catatan Tambahan / Alamat Pengiriman** *(Opsional)* — Textarea ringkas.
   * *Catatan UX:* Data form ini disimpan sementara ke `localStorage` (`buyer_profile`) sehingga jika user melakukan pemesanan kedua, nama dan nomor WA-nya sudah terisi otomatis.
4. **Rincian Pembayaran:**
   * Total Item (misal: `3 pcs`)
   * **Total Pembayaran** (Bold, ukuran besar, warna Primary Pink).
5. **Banner Info Nomor WA Owner:**
   * Kotak informasi kecil berlatar `#FCE7F3` berisi nomor WhatsApp Owner + tombol **`Salin Nomor`** agar user mudah mencari kontak owner saat *share sheet* terbuka.
6. **Sticky Bottom CTA:**
   * Tombol penuh berwarna **Primary Pink (`#EC4899`)** (dengan indikator *loading spinner* saat proses *generate* gambar berlangsung).
   * Label CTA: **`Buat Pesanan`**.

---

### 4.4 Halaman 4: Riwayat Pesanan / Saved (`/orders`)
Halaman untuk melihat kembali daftar Order Notes yang pernah dibuat oleh pengguna di browser tersebut.

1. **List Kartu Riwayat:**
   * Menampilkan Nomor Order (misal: `#ORD-261122-01`), Tanggal & Waktu pemesanan, Nama Pembeli, Jumlah Item, dan Total Harga.
2. **Detail & Re-share Order Notes:**
   * Saat salah satu riwayat diklik, tampilkan **Preview Gambar Struk Order Notes** secara utuh beserta dua tombol aksi:
     * **`Kirim Ulang ke WhatsApp`** (memicu kembali `navigator.share` / fallback `wa.me`).
     * **`Download Gambar Struk`** (menyimpan PNG ke galeri).

---

### 4.5 Komponen Khusus: Hidden Receipt Template (Untuk Generate Gambar)
Komponen React khusus dengan lebar tetap (`width: 420px`) yang dirender di luar layar (*off-screen* / tersembunyi) untuk dikonversi menjadi gambar PNG menggunakan `html-to-image`.

* **Header Struk:** Logo Toko, Nama Toko, Tanggal & Jam Order, Nomor Referensi Order.
* **Info Pembeli:** Nama Pembeli, No. WA, Catatan.
* **Tabel Item:**
  * Foto Thumbnail Produk (`40x40px`, dengan atribut `crossOrigin="anonymous"` wajib agar tidak blank saat di-render canvas).
  * Nama Produk + Badge SKU (`[KC-001]`).
  * Kuantitas (`x2`) & Subtotal (`Rp 16.000`).
* **Footer Struk:** Garis pemisah putus-putus (*dashed*), Total Item, **TOTAL PEMBAYARAN** (tebal & menonjol), dan catatan kecil *"Mohon tunggu konfirmasi ketersediaan stok & ongkir dari admin"*.

---

## 5. Manajemen State (State Management Architecture)

Aplikasi menggunakan kombinasi **Client Global State (Zustand + `persist` middleware ke `localStorage`)** untuk data yang harus bertahan saat *refresh*, serta **Local Component State (`useState`)** untuk interaksi UI sementara.

### 5.1 Global Persistent State (`useStore` -> `localStorage`)

| Nama State | Tipe Data | Deskripsi & Fungsi |
| :--- | :--- | :--- |
| `cart` | `CartItem[]` | Menyimpan daftar produk yang sedang dipilih user di keranjang belanja.<br>Struktur `CartItem`: `{ productId, sku, name, price, imageUrl, qty }` |
| `savedOrders` | `OrderNote[]` | Menyimpan riwayat pesanan yang sudah dibuat user (ditampilkan pada badge `Pesanan (n)` di header).<br>Struktur `OrderNote`: `{ orderId, createdAt, buyerInfo, items: CartItem[], totalAmount, totalQty }` |
| `buyerProfile` | `BuyerInfo` | Menyimpan isian form terakhir pembeli agar tidak perlu mengetik ulang pada order berikutnya.<br>Struktur: `{ name, phone, notes }` |

**Actions pada Global Store:**
* `addToCart(product)` — Menambah produk baru atau menaikkan `qty` jika sudah ada.
* `updateQty(productId, delta)` — Menambah/mengurangi `qty` item; otomatis menghapus item jika `qty <= 0`.
* `clearCart()` — Mengosongkan keranjang setelah tombol *"Buat Pesanan"* berhasil diproses.
* `saveOrderNote(orderData)` — Menambahkan pesanan baru ke urutan paling atas array `savedOrders`.

### 5.2 Server / Catalog State (Halaman Katalog)

| Nama State | Tipe Data | Deskripsi & Fungsi |
| :--- | :--- | :--- |
| `products` | `Product[]` | Daftar produk yang di-fetch dari tabel `products` Supabase (diurutkan berdasarkan `created_at` terbaru).<br>Struktur `Product`: `{ id, sku, name, price, category, images: string[], is_available }` |
| `selectedCategory` | `string` | Menyimpan filter kategori aktif (default: `'All'`). |
| `isLoadingProducts` | `boolean` | Menampilkan *skeleton loader* kartu produk saat data sedang diambil dari Supabase. |

### 5.3 Local UI & Checkout State

| Nama State | Tipe Data | Lokasi Komponen | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- |
| `activeImageIndex` | `number` | Detail Produk | Menentukan foto keberapa yang sedang aktif di carousel (default: `0`). |
| `isGeneratingReceipt` | `boolean` | Halaman Checkout | Mengatur status *loading* pada tombol `"Buat Pesanan"` saat HTML struk sedang dikonversi menjadi file PNG. |
| `generatedImageBlob` | `Blob \| null` | Checkout / Riwayat | Menyimpan sementara hasil generate PNG untuk dikirim via Web Share API atau didownload manual. |
| `showShareFallbackModal` | `boolean` | Halaman Checkout | Menampilkan modal instruksi apabila browser user (misal Desktop Chrome) tidak mendukung `navigator.share` untuk file gambar. |

---

## 6. Spesifikasi Fungsional: Mekanisme "Buat Pesanan" ke WhatsApp

Saat pengguna menekan tombol **`Buat Pesanan`** di halaman Checkout, sistem menjalankan urutan logika berikut:

1. **Validasi Input:** Pastikan `Nama` dan `Nomor WA` tidak kosong. Jika kosong, tampilkan pesan error inline dan fokuskan ke input terkait.
2. **Generate Order ID & Simpan Riwayat:**
   * Buat ID unik berbasis waktu (contoh: `ORD-261122-849`).
   * Simpan objek pesanan ke `savedOrders` di `localStorage`.
3. **Konversi Struk ke File Gambar:**
   * Targetkan `ref` dari komponen `HiddenReceiptTemplate`.
   * Panggil `toBlob(receiptRef.current, { pixelRatio: 2, cacheBust: true })` menggunakan library `html-to-image`.
   * Bungkus hasilnya menjadi objek `File`: `new File([blob], 'Order-Notes-${orderId}.png', { type: 'image/png' })`.
4. **Format Teks Ringkasan:**
   ```text
   Halo Kak, saya mau order aksesoris berikut:
   No. Order: #ORD-261122-849

   1. [KC-001] Moonlight Sonata Winter Edition (x2) - Rp 16.000
   2. [PH-002] Acrylic Phone Holder Pink (x1) - Rp 15.000

   Total Item: 3 pcs
   Total Pembayaran: Rp 31.000

   Data Pembeli:
   Nama: Budi Santoso
   No. WA: 08123456789
   Catatan: -
   ```
5. **Eksekusi Pengiriman (Dual-Mode):**
   * **Mode 1 — Mobile / Supported Browser (`navigator.canShare && navigator.canShare({ files: [file] })`):**
     * Panggil `await navigator.share({ files: [file], title: 'Order Notes', text: summaryText })`.
     * Kosongkan `cart` (`clearCart()`), lalu arahkan user ke halaman konfirmasi/riwayat order.
   * **Mode 2 — Desktop / Unsupported Browser (Fallback):**
     * Trigger download otomatis file `Order-Notes-${orderId}.png` ke perangkat pengguna.
     * Salin `summaryText` ke *clipboard* (`navigator.clipboard.writeText(summaryText)`).
     * Buka tab baru ke `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(summaryText)}`.
     * Tampilkan modal informasi kepada pengguna: *"Gambar Order Notes telah terunduh otomatis. Silakan tempel/lampirkan gambar tersebut di chat WhatsApp yang terbuka."*

---

## 7. Kebutuhan Non-Fungsional & Edge Cases
* **CORS Gambar Supabase:** Bucket `product-images` wajib berstatus *Public* dan setiap tag `<img>` di dalam komponen struk wajib memiliki atribut `crossOrigin="anonymous"` agar gambar produk tidak hilang saat dirender ke Canvas.
* **Multiple Images pada Produk:** Kolom gambar di tabel `products` menggunakan tipe `text[]` (array of URLs) agar mendukung fitur *carousel* di halaman detail produk, sementara kartu katalog di halaman utama cukup menampilkan `images[0]`.
* **Performa Gambar:** Seluruh gambar yang ditampilkan di katalog menggunakan optimasi ukuran/kompresi agar waktu muat di jaringan seluler tetap di bawah 2 detik.
```

Dokumen PRD di atas sudah mencakup keseluruhan gaya UI referensi dengan aksen warna *primary pink*, wireframe katalogmu, detail produk dengan carousel foto, halaman checkout dengan CTA **"Buat Pesanan"**, arsitektur *state* (`localStorage`), hingga spesifikasi teknis generator gambar struk ke WhatsApp. 

Jika ada penyesuaian pada struktur datanya (misalnya untuk mendukung multi-foto pada carousel di tabel Supabase), beri tahu saja agar bisa langsung kita sesuaikan.