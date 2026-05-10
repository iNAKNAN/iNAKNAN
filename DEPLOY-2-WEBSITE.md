# Deploy 2 Website di Railway

Panduan deploy Admin Website dan Tracking Website sebagai 2 service terpisah.

## 📁 Struktur File

```
PROJECT/
├── admin-server.js          ← Server untuk Admin Website
├── railway.admin.toml       ← Config Railway untuk Admin
├── railway.api.toml         ← Config Railway untuk API
├── backend/
│   ├── server.js            ← API Server (Tracking)
│   └── public/
│       ├── admin.html       ← Admin Website
│       └── tracking_online.html  ← Tracking Website
└── ...
```

## 🚀 Langkah Deploy

### Step 1: Deploy API Service (Tracking Website)

1. Buka Railway Dashboard
2. Buat **New Project** atau gunakan project existing
3. Pilih **Deploy from GitHub repo**
4. Pilih repository Anda
5. Di Settings → Service:
   - **Start Command**: `cd backend && npm start`
   - Atau gunakan `railway.api.toml`
6. Deploy!

Catat URL-nya: `https://inaknan-production.up.railway.app`

### Step 2: Update Admin HTML

Edit `backend/public/admin.html` baris 927:

```javascript
const API_SERVICE_URL = 'https://inaknan-production.up.railway.app'; // ← URL dari Step 1
```

Commit dan push:
```bash
git add .
git commit -m "Update API URL untuk 2-service setup"
git push
```

### Step 3: Deploy Admin Service

1. Di Railway Dashboard, klik **New Service** → **GitHub Repo** (repo yang sama)
2. Settings → Service:
   - **Start Command**: `node admin-server.js`
3. Deploy!

URL Admin: `https://inaknan-production.up.railway.app/admin`

## 🔗 Hasil Akhir

| Website | URL | Fungsi |
|---------|-----|--------|
| **Admin** | `https://admin-xxx.railway.app` | Panel admin untuk operator |
| **Tracking** | `https://inaknan-production.up.railway.app` | Public tracking + API |

## 💰 Biaya

- **Free Tier**: 2 service = $0 (tapi ada limit usage)
- **Starter Plan**: ~$5/bulan per service
- Jika ingin hemat, gunakan **1 service dengan 2 path** (sudah jalan sekarang)

## 🔄 Alternatif: Custom Domain

Jika ingin domain sendiri:
1. Beli domain (contoh: `ihandpump.com`)
2. Di Railway Settings → Domains:
   - Admin Service: `admin.ihandpump.com`
   - API Service: `ihandpump.com`
3. Update DNS di domain provider

## ⚠️ Catatan Penting

1. **CORS**: Pastikan service API mengizinkan origin dari Admin service
2. **Environment Variable**: Bisa gunakan `process.env.API_URL` untuk lebih fleksibel
3. **Database**: Kedua service bisa pakai database yang sama
