# 🧪 Testing Guide - API VRO

## 📋 **Ringkasan Jawaban Pertanyaan**

### **1. Tempat Testing API** ✅

Anda punya **3 opsi** untuk testing:

| Opsi | Use Case | Pros | Cons |
|------|----------|------|------|
| **Terminal (cURL)** | Quick testing, debugging | ✅ Cepat, no install | ❌ No UI |
| **Postman** | Comprehensive testing | ✅ Save collections, UI bagus | ❌ Perlu install |
| **API Playground** | User-friendly testing | ✅ Built-in, personalized | ❌ Perlu implement |

**Rekomendasi:**
- **Development:** Terminal + Postman
- **User:** API Playground (built-in dashboard)

### **2. Halaman Dokumentasi** ✅

**Hybrid Approach - Best of Both Worlds:**

| Type | Platform | Purpose |
|------|----------|---------|
| **Built-in Docs** | `/documentation` page | Quick reference, personalized |
| **API Playground** | `/api-playground` page | Interactive testing |
| **External Docs** | GitBook/ReadMe (optional) | Public documentation, SEO |

**Rekomendasi:**
- **MVP:** Built-in docs saja (sudah cukup!)
- **Future:** Tambah GitBook untuk public docs

---

# 🧪 Testing Guide - WAHA Integration

## ✅ Implementasi Selesai

Integrasi WAHA (WhatsApp HTTP API) sudah berhasil diimplementasikan! Berikut yang sudah dibuat:

### 📁 File Baru

1. **`src/lib/waha.ts`** - WAHA API client service
2. **`docs/WAHA-SETUP.md`** - Dokumentasi lengkap setup WAHA
3. **`docs/PANDUAN-CEPAT.md`** - Panduan cepat bahasa Indonesia
4. **`docker-compose.waha.yml`** - Docker compose untuk WAHA
5. **`start-waha.sh`** - Script quick start WAHA
6. **`TESTING-GUIDE.md`** - File ini

### 🔄 File yang Diupdate

1. **`src/pages/DevicesPage.tsx`** - Integrasi penuh dengan WAHA
2. **`.env`** - Tambah konfigurasi WAHA_URL
3. **`README.md`** - Update dokumentasi WhatsApp integration
4. **`PROJECT-STATUS.md`** - Update status implementasi

## 🚀 Cara Testing

### Step 1: Start WAHA Server

**Terminal 1 - Start WAHA:**
```bash
# Opsi 1: Menggunakan script
./start-waha.sh

# Opsi 2: Docker run langsung
docker run -it -p 3000:3000 devlikeapro/waha

# Opsi 3: Docker compose
docker-compose -f docker-compose.waha.yml up
```

**Verifikasi WAHA berjalan:**
```bash
# Cek health
curl http://localhost:3000/health

# Buka Swagger UI
open http://localhost:3000
```

### Step 2: Start API VRO Application

**Terminal 2 - Start Dev Server:**
```bash
npm run dev
```

**Buka aplikasi:**
```
http://localhost:5173
```

### Step 3: Login & Test

1. **Login:**
   - Klik "Sign in with Google" atau "Sign in with GitHub"
   - Authorize aplikasi

2. **Cek WAHA Status:**
   - Setelah login, klik menu "Devices"
   - **Jika WAHA berjalan:** Tidak ada warning
   - **Jika WAHA tidak berjalan:** Muncul warning kuning

3. **Tambah Device:**
   - Klik tombol "Add Device"
   - Masukkan nama: "Test WhatsApp"
   - (Opsional) Webhook URL
   - Klik "Create"

4. **Connect Device:**
   - Pada card device, klik "Connect Device"
   - Tunggu 3-5 detik
   - QR code akan muncul

5. **Scan QR Code:**
   - Buka WhatsApp di HP
   - Settings → Linked Devices → Link a Device
   - Scan QR code di dashboard
   - Status akan berubah jadi "Connected" ✅

## 🧪 Test Cases

### Test Case 1: WAHA Health Check
```bash
# Expected: true
curl http://localhost:3000/health
```

### Test Case 2: Start Session via WAHA
```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"name": "test_session"}'
```

### Test Case 3: Get QR Code
```bash
curl http://localhost:3000/api/test_session/auth/qr
```

### Test Case 4: Check Session Status
```bash
curl http://localhost:3000/api/sessions/test_session
```

### Test Case 5: Send Test Message (After Connected)
```bash
curl -X POST http://localhost:3000/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "session": "test_session",
    "chatId": "628123456789@c.us",
    "text": "Test message from WAHA"
  }'
```

## 🔍 Debugging

### Cek Logs WAHA
```bash
docker logs -f waha
```

### Cek Browser Console
1. Buka DevTools (F12)
2. Tab Console
3. Lihat error messages

### Common Issues

#### Issue 1: "WAHA Server Not Available"
**Penyebab:** WAHA tidak berjalan
**Solusi:**
```bash
docker ps | grep waha
./start-waha.sh
```

#### Issue 2: QR Code Tidak Muncul
**Penyebab:** Polling belum dapat QR dari WAHA
**Solusi:**
- Tunggu 10 detik
- Refresh halaman
- Cek logs: `docker logs waha`

#### Issue 3: TypeScript Error di DevicesPage
**Penyebab:** Supabase types belum sync
**Solusi:**
```bash
# Generate types dari Supabase
npx supabase gen types typescript --project-id qcakpmnmnytrrlhkkski > src/lib/database.types.ts
```

#### Issue 4: Device Disconnect Otomatis
**Penyebab:** WhatsApp di HP logout atau internet terputus
**Solusi:**
- Connect ulang dengan scan QR baru
- Pastikan WhatsApp di HP tetap aktif

## 📊 Expected Behavior

### Device Status Flow
```
disconnected → (Click Connect) → scanning → (Scan QR) → connected
     ⬇                                                        ⬇
     ⬅────────────────── (Click Disconnect) ─────────────────⬅
```

### UI States

**Disconnected:**
- Status badge: Red "Disconnected"
- Button: Blue "Connect Device"

**Scanning:**
- Status badge: Yellow "Scanning"
- QR Code displayed
- Auto-refresh every 3 seconds

**Connected:**
- Status badge: Green "Connected"
- Phone number displayed
- Button: Red "Disconnect"

## 🎯 Success Criteria

Implementasi berhasil jika:

- ✅ WAHA server bisa start tanpa error
- ✅ Dashboard mendeteksi WAHA availability
- ✅ Device bisa dibuat dengan session ID unik
- ✅ Tombol "Connect Device" berfungsi
- ✅ QR code muncul dalam 5 detik
- ✅ QR code bisa di-scan dengan WhatsApp
- ✅ Status berubah jadi "Connected" setelah scan
- ✅ Phone number muncul di card
- ✅ Tombol "Disconnect" berfungsi
- ✅ Device bisa dihapus

## 📝 Testing Checklist

### Pre-Testing
- [ ] Docker terinstall
- [ ] Node.js & npm terinstall
- [ ] Dependencies terinstall (`npm install`)
- [ ] Supabase database sudah di-migrate
- [ ] OAuth providers sudah dikonfigurasi

### WAHA Testing
- [ ] WAHA container bisa start
- [ ] Health check return 200
- [ ] Swagger UI bisa diakses
- [ ] Session bisa dibuat via API

### Frontend Testing
- [ ] Dev server berjalan tanpa error
- [ ] Login berhasil
- [ ] Devices page load tanpa error
- [ ] WAHA status terdeteksi
- [ ] Device bisa dibuat
- [ ] Connect button muncul
- [ ] QR code generation works
- [ ] Status updates real-time
- [ ] Disconnect works
- [ ] Delete device works

### Integration Testing
- [ ] End-to-end flow: Create → Connect → Scan → Connected
- [ ] Multiple devices bisa dibuat
- [ ] Polling stops setelah connected
- [ ] Error handling works
- [ ] Browser console clean (no errors)

## 🐛 Known Issues

### TypeScript Lint Error
**Error:** `No overload matches this call` di line 70 DevicesPage.tsx

**Status:** Non-blocking, tidak mempengaruhi functionality

**Workaround:** Ignore untuk sementara atau regenerate Supabase types

## 📚 Dokumentasi

Untuk informasi lebih detail:

- **Setup WAHA:** [`docs/WAHA-SETUP.md`](docs/WAHA-SETUP.md)
- **Panduan Cepat:** [`docs/PANDUAN-CEPAT.md`](docs/PANDUAN-CEPAT.md)
- **API Docs:** [`API-DOCUMENTATION.md`](API-DOCUMENTATION.md)
- **README:** [`README.md`](README.md)

## 🎉 Next Steps

Setelah testing berhasil:

1. **Implement Message Sending:**
   - Create API endpoint untuk send message
   - Integrate dengan message limits
   - Track messages di database

2. **Webhook Integration:**
   - Handle incoming messages
   - Forward to user webhook URL
   - Store webhook events

3. **Production Deployment:**
   - Deploy WAHA ke VPS
   - Setup reverse proxy (Nginx)
   - Configure SSL certificate
   - Update WAHA_URL di .env production

## 💬 Feedback

Jika menemukan bug atau ada saran:
1. Catat error message
2. Screenshot jika perlu
3. Cek logs (WAHA & browser console)
4. Buat issue di GitHub

---

**Happy Testing! 🚀**
