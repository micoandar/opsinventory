# OpsInventory

IT Asset Management & Application Monitoring System.

## Status
Phase 1 — inisialisasi proyek, koneksi database, health endpoint.

## Menjalankan

1. Jalankan Apache dan MySQL di XAMPP Control Panel.
2. Buat database `opsinventory_db` di phpMyAdmin.
3. Copy `.env.example` menjadi `.env`, sesuaikan kredensial jika perlu.
4. `npm install`
5. `npm run dev`
6. Buka http://localhost:3000/api/v1/health

## Endpoint tersedia

- `GET /api/v1/health` — status server dan konektivitas database