# 🚀 Panduan Cepat - Menghubungkan WhatsApp ke API VRO

Panduan ini akan membantu Anda menghubungkan WhatsApp ke platform API VRO dalam 5 menit!

## 📋 Yang Anda Butuhkan

1. ✅ Docker terinstall di komputer
2. ✅ Akun API VRO (sudah login)
3. ✅ HP dengan WhatsApp terinstall
4. ✅ Koneksi internet stabil

## 🎯 Langkah-Langkah

### Langkah 1: Start WAHA Server

Buka terminal dan jalankan:

```bash
./start-waha.sh
```

Atau jika script tidak bisa dijalankan:

```bash
docker run -it -p 3000:3000 devlikeapro/waha
```

**Tunggu sampai muncul:**
```
✅ WAHA is running successfully!
🌐 Swagger UI: http://localhost:3000
```

### Langkah 2: Buka Dashboard API VRO

1. Buka browser: `http://localhost:5173`
2. Login dengan Google/GitHub
3. Klik menu **"Devices"** di sidebar

### Langkah 3: Tambah Device Baru

1. Klik tombol **"Add Device"** (biru, pojok kanan atas)
2. Masukkan nama device, contoh: **"WhatsApp Bisnis Saya"**
3. (Opsional) Masukkan webhook URL jika punya
4. Klik **"Create"**

✅ Device baru akan muncul dengan status **"Disconnected"** (merah)

### Langkah 4: Connect Device

1. Pada card device yang baru dibuat, klik tombol **"Connect Device"**
2. Tunggu 3-5 detik
3. QR Code akan muncul di card device

### Langkah 5: Scan QR Code

**Di HP Anda:**

1. Buka aplikasi **WhatsApp**
2. Tap **Menu** (3 titik) → **Settings** / **Pengaturan**
3. Tap **Linked Devices** / **Perangkat Tertaut**
4. Tap **Link a Device** / **Tautkan Perangkat**
5. **Scan QR Code** yang muncul di dashboard

### Langkah 6: Selesai! 🎉

Setelah scan QR code:
- Status device berubah jadi **"Connected"** (hijau) ✅
- Nomor WhatsApp muncul di card
- Siap kirim pesan via API!

## 🎬 Demo Visual

```
┌─────────────────────────────────────┐
│  📱 My WhatsApp Business            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  Status: 🟢 Connected               │
│  Phone: +62 812-3456-7890          │
│                                     │
│  [Disconnect]                       │
│                                     │
│  Session ID: session_1234...        │
│  Last Connected: 2 minutes ago      │
└─────────────────────────────────────┘
```

## ❓ Troubleshooting

### Problem: Warning "WAHA Server Not Available"

**Solusi:**
```bash
# Cek apakah WAHA berjalan
docker ps | grep waha

# Jika tidak ada, jalankan WAHA
./start-waha.sh
```

### Problem: QR Code Tidak Muncul

**Solusi:**
1. Tunggu 10 detik
2. Refresh halaman (F5)
3. Cek logs WAHA: `docker logs -f waha`

### Problem: Device Disconnect Sendiri

**Solusi:**
1. Pastikan WhatsApp di HP tetap aktif
2. Cek koneksi internet
3. Connect ulang dengan scan QR code baru

### Problem: Port 3000 Sudah Digunakan

**Solusi:**
```bash
# Gunakan port lain
docker run -it -p 3001:3000 devlikeapro/waha

# Update .env
VITE_WAHA_URL=http://localhost:3001

# Restart aplikasi
npm run dev
```

## 🔧 Perintah Berguna

### Lihat Logs WAHA
```bash
docker logs -f waha
```

### Stop WAHA
```bash
docker stop waha
```

### Restart WAHA
```bash
docker restart waha
```

### Hapus WAHA
```bash
docker rm -f waha
```

## 📚 Dokumentasi Lengkap

- **Setup WAHA Detail:** [`WAHA-SETUP.md`](WAHA-SETUP.md)
- **API Documentation:** [`../API-DOCUMENTATION.md`](../API-DOCUMENTATION.md)
- **README:** [`../README.md`](../README.md)

## 🎯 Langkah Selanjutnya

Setelah device terhubung, Anda bisa:

### 1. Generate API Key
1. Klik menu **"API Keys"**
2. Klik **"Create API Key"**
3. Pilih device yang sudah terhubung
4. Copy API key (hanya muncul sekali!)

### 2. Test Kirim Pesan
```bash
curl -X POST http://localhost:3000/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "session": "session_1234...",
    "chatId": "628123456789@c.us",
    "text": "Hello from API VRO!"
  }'
```

### 3. Integrasi dengan Aplikasi
```javascript
const response = await fetch('http://localhost:3000/api/sendText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    session: 'session_1234...',
    chatId: '628123456789@c.us',
    text: 'Hello from my app!'
  })
});
```

## 💡 Tips & Tricks

### Tip 1: Multiple Devices
Anda bisa menghubungkan banyak WhatsApp devices:
- WhatsApp Personal
- WhatsApp Business
- WhatsApp untuk tim

### Tip 2: Webhook Integration
Gunakan webhook untuk:
- Terima pesan masuk
- Integrasi dengan n8n/Make
- Auto-reply bot

### Tip 3: Monitoring
Cek status device secara berkala:
- Dashboard menampilkan status real-time
- Last connected timestamp
- Phone number info

## 🆘 Butuh Bantuan?

### Cek Dokumentasi
- WAHA Docs: https://waha.devlike.pro/docs
- WAHA GitHub: https://github.com/devlikeapro/waha

### Cek Logs
```bash
# Logs WAHA
docker logs -f waha

# Logs API VRO (di terminal dev server)
npm run dev
```

### Common Issues
1. **WAHA tidak start**: Pastikan Docker berjalan
2. **QR tidak muncul**: Tunggu atau refresh
3. **Device disconnect**: Cek koneksi internet

## ✅ Checklist

Pastikan semua langkah sudah dilakukan:

- [ ] Docker terinstall dan berjalan
- [ ] WAHA server running di port 3000
- [ ] Login ke API VRO dashboard
- [ ] Device baru sudah dibuat
- [ ] QR code sudah di-scan
- [ ] Status device "Connected" ✅
- [ ] Nomor WhatsApp muncul di card

Jika semua checklist ✅, selamat! WhatsApp Anda sudah terhubung! 🎉

---

**Selamat menggunakan API VRO! 🚀📱**

Jika ada pertanyaan, silakan buka issue di GitHub atau hubungi support.
