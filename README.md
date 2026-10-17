# OpsInventory — IT Asset Management & Application Monitoring System

OpsInventory adalah aplikasi web *full-stack* internal perusahaan yang dirancang untuk mengelola inventaris aset IT, memantau kesehatan layanan secara *real-time*, mencatat log operasional, dan menangani insiden teknis. 

Proyek ini dibangun sebagai portofolio untuk menunjukkan kemampuan dalam pengembangan *Full-Stack Developer* dan *Application Support*.

## 🚀 Fitur Utama

- **Authentication & RBAC**: Login berbasis *session* dengan *password hashing* (Argon2). Tiga level akses: `ADMIN`, `SUPPORT_ENGINEER`, dan `VIEWER`.
- **IT Asset Inventory**: CRUD aset lengkap dengan pencarian, filter, *sorting*, pagination, serta penugasan aset (*assignments*) dan riwayat perbaikan (*maintenance*).
- **Application Monitoring**: Pengecekan *endpoint* otomatis via Cron Job (`node-cron`). Dilengkapi grafik *response time* (Chart.js) dan *failure/recovery thresholds*.
- **Incident Management**: Pembuatan tiket insiden otomatis jika layanan DOWN, beserta pencatatan investigasi (*timeline*).
- **Observability & Logging**: HTTP logger (Morgan) dan *Application logger* (Winston) dengan rotasi file harian, serta integrasi error 500 ke database.
- **Reporting**: Ekspor laporan inventaris aset ke format CSV.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js, Fetch API.
- **Backend**: Node.js, Express.js (REST API), Winston, Morgan, node-cron, Axios.
- **Database**: MySQL (via XAMPP/phpMyAdmin), `mysql2` (Prepared Statements), Transaksi Database.
- **Keamanan**: `express-session`, `argon2`, Helmet (CSP), `express-rate-limit`, `express-validator`.

## ⚙️ Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js (v20 LTS atau lebih baru)
- XAMPP (MySQL & Apache)
- Git

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone https://github.com/username/opsinventory.git
   cd opsinventory
Install Dependensi

bash
npm install
Konfigurasi Environment

Salin file .env.example menjadi .env.

Sesuaikan kredensial database Anda (bawaan XAMPP: user root, password kosong).

Generate SESSION_SECRET baru:

bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
Setup Database

Buka phpMyAdmin, buat database baru bernama opsinventory_db.

Import file database/schema.sql ke dalam database tersebut.

Import file database/seed.sql untuk data kategori awal.

Buat Akun Admin Pertama

bash
npm run bootstrap:admin
Ikuti instruksi di terminal untuk membuat username dan password admin.

Jalankan Aplikasi

bash
npm run dev
Buka browser dan akses: http://localhost:3000

## 📁 Struktur Proyek

```text
opsinventory/
├── database/       # Skema SQL & Seed data
├── logs/           # File log Winston (dibuat otomatis)
├── public/         # Frontend (HTML, CSS, JS)
│   ├── js/         # Logika Frontend (API fetch, UI DOM)
│   └── css/        # Styling (Design System)
├── scripts/        # Script Bootstrap Admin
├── src/            # Backend (Express)
│   ├── config/     # Konfigurasi DB, Session, Logger
│   ├── controllers/# Handler HTTP Request
│   ├── jobs/       # Cron Job (Monitoring)
│   ├── middleware/ # Auth, RBAC, Error Handler
│   ├── repositories/# Query Database (SQL)
│   ├── routes/     # Definisi Endpoint API
│   ├── services/   # Business Logic & Transaksi
│   └── validators/ # Validasi Input (express-validator)
├── .env.example
├── package.json
└── README.md
🔒 Catatan Keamanan
Password di-hash menggunakan Argon2id.

Middleware Helmet diterapkan untuk mencegah serangan XSS dan memblokir inline scripts.

Rate Limiter membatasi percobaan login (mencegah brute-force).

Prepared Statements (mysql2) digunakan di seluruh query untuk mencegah SQL Injection.

Semua otorisasi (RBAC) divalidasi di sisi server (backend), tidak hanya di UI.

Dibuat untuk tujuan pembelajaran dan portofolio.