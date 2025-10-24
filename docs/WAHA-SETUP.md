# WAHA (WhatsApp HTTP API) Setup Guide

## Apa itu WAHA?

WAHA (WhatsApp HTTP API) adalah REST API untuk WhatsApp yang memungkinkan Anda mengirim dan menerima pesan WhatsApp melalui HTTP requests. WAHA menggunakan WhatsApp Web sebagai backend.

Repository: https://github.com/devlikeapro/waha

## Prerequisites

- Docker terinstall di sistem Anda
- Port 3000 tersedia (atau gunakan port lain)

## Cara Install WAHA

### Opsi 1: Docker Run (Recommended untuk Development)

```bash
# Download image WAHA
docker pull devlikeapro/waha

# Jalankan WAHA
docker run -it --rm \
  -p 3000:3000 \
  --name waha \
  devlikeapro/waha
```

### Opsi 2: Docker Compose (Recommended untuk Production)

Buat file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha
    container_name: waha
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - WHATSAPP_HOOK_URL=
      - WHATSAPP_HOOK_EVENTS=message,session.status
    volumes:
      - waha_data:/app/.sessions

volumes:
  waha_data:
```

Jalankan dengan:

```bash
docker-compose up -d
```

### Opsi 3: Docker dengan Persistent Storage

```bash
docker run -d \
  --name waha \
  -p 3000:3000 \
  -v waha_sessions:/app/.sessions \
  --restart unless-stopped \
  devlikeapro/waha
```

## Verifikasi WAHA Berjalan

1. **Cek Health Status:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Buka Swagger Documentation:**
   ```
   http://localhost:3000/
   ```

3. **Cek di API VRO Dashboard:**
   - Buka halaman Devices
   - Jika WAHA berjalan, tidak akan ada warning kuning
   - Jika WAHA tidak berjalan, akan muncul warning "WAHA Server Not Available"

## Konfigurasi di API VRO

File `.env` sudah dikonfigurasi dengan default WAHA URL:

```env
VITE_WAHA_URL=http://localhost:3000
```

Jika WAHA berjalan di server/port lain, update nilai ini.

## Cara Menggunakan

### 1. Tambah Device Baru

1. Login ke API VRO Dashboard
2. Klik menu **Devices**
3. Klik tombol **Add Device**
4. Masukkan nama device (contoh: "My WhatsApp Business")
5. (Opsional) Masukkan webhook URL untuk integrasi
6. Klik **Create**

### 2. Connect Device ke WhatsApp

1. Pada device card, klik tombol **Connect Device**
2. Tunggu beberapa detik hingga QR code muncul
3. Buka WhatsApp di HP Anda
4. Pergi ke: **Settings → Linked Devices → Link a Device**
5. Scan QR code yang muncul di dashboard
6. Status device akan berubah menjadi **Connected** ✅

### 3. Device Terhubung!

Setelah terhubung, Anda bisa:
- ✅ Kirim pesan via API
- ✅ Terima pesan via webhook
- ✅ Kirim media (gambar, dokumen)
- ✅ Cek status device

## Troubleshooting

### WAHA Server Not Available

**Problem:** Warning kuning muncul di dashboard

**Solusi:**
1. Pastikan Docker berjalan: `docker ps`
2. Cek container WAHA: `docker ps | grep waha`
3. Jika tidak ada, jalankan WAHA: `docker run -it -p 3000:3000 devlikeapro/waha`
4. Refresh halaman Devices

### QR Code Tidak Muncul

**Problem:** Status "scanning" tapi QR code tidak tampil

**Solusi:**
1. Tunggu 5-10 detik
2. Refresh halaman
3. Cek logs WAHA: `docker logs waha`
4. Restart WAHA container: `docker restart waha`

### Device Disconnect Sendiri

**Problem:** Device status berubah jadi "disconnected" tiba-tiba

**Solusi:**
1. Cek koneksi internet
2. Pastikan WhatsApp di HP masih aktif
3. Cek di WhatsApp HP: Settings → Linked Devices
4. Jika device hilang dari list, connect ulang dengan scan QR code baru

### Port 3000 Sudah Digunakan

**Problem:** Error "port 3000 already in use"

**Solusi:**
```bash
# Gunakan port lain, misalnya 3001
docker run -it -p 3001:3000 devlikeapro/waha

# Update .env
VITE_WAHA_URL=http://localhost:3001
```

## WAHA API Endpoints

WAHA menyediakan REST API lengkap:

### Session Management
- `POST /api/sessions/start` - Start new session
- `POST /api/sessions/{session}/stop` - Stop session
- `GET /api/sessions/{session}` - Get session status
- `GET /api/{session}/auth/qr` - Get QR code

### Messaging
- `POST /api/sendText` - Send text message
- `POST /api/sendImage` - Send image
- `POST /api/sendFile` - Send document
- `POST /api/sendLocation` - Send location

### Status & Info
- `GET /api/screenshot` - Get screenshot
- `GET /health` - Health check

Dokumentasi lengkap: http://localhost:3000/

## Production Deployment

### Deploy WAHA di VPS

1. **Install Docker di VPS:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Jalankan WAHA:**
   ```bash
   docker run -d \
     --name waha \
     -p 3000:3000 \
     -v /opt/waha/sessions:/app/.sessions \
     --restart unless-stopped \
     devlikeapro/waha
   ```

3. **Setup Firewall:**
   ```bash
   sudo ufw allow 3000/tcp
   ```

4. **Update .env di API VRO:**
   ```env
   VITE_WAHA_URL=https://your-vps-ip:3000
   ```

### Gunakan Nginx Reverse Proxy (Recommended)

1. **Install Nginx:**
   ```bash
   sudo apt install nginx
   ```

2. **Konfigurasi Nginx:**
   ```nginx
   server {
       listen 80;
       server_name waha.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable SSL dengan Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d waha.yourdomain.com
   ```

4. **Update .env:**
   ```env
   VITE_WAHA_URL=https://waha.yourdomain.com
   ```

## Monitoring & Maintenance

### Cek Logs WAHA
```bash
docker logs -f waha
```

### Restart WAHA
```bash
docker restart waha
```

### Update WAHA ke Versi Terbaru
```bash
docker pull devlikeapro/waha
docker stop waha
docker rm waha
docker run -d --name waha -p 3000:3000 -v waha_sessions:/app/.sessions devlikeapro/waha
```

### Backup Sessions
```bash
docker cp waha:/app/.sessions ./backup-sessions
```

### Restore Sessions
```bash
docker cp ./backup-sessions waha:/app/.sessions
docker restart waha
```

## Resource Requirements

### Minimum
- CPU: 1 core
- RAM: 512 MB
- Storage: 1 GB

### Recommended
- CPU: 2 cores
- RAM: 1 GB
- Storage: 5 GB

### Per Device
Setiap WhatsApp session membutuhkan:
- RAM: ~100-200 MB
- Storage: ~50-100 MB

## Security Best Practices

1. **Jangan Expose WAHA ke Public Internet**
   - Gunakan VPN atau private network
   - Atau gunakan API VRO sebagai proxy

2. **Gunakan HTTPS**
   - Setup SSL certificate
   - Gunakan reverse proxy (Nginx/Caddy)

3. **Limit Access**
   - Gunakan firewall rules
   - Whitelist IP addresses

4. **Regular Backups**
   - Backup sessions folder
   - Backup database API VRO

## Support & Resources

- **WAHA Documentation:** https://waha.devlike.pro/docs
- **WAHA GitHub:** https://github.com/devlikeapro/waha
- **WAHA Discord:** https://discord.gg/waha
- **API VRO Docs:** `/docs/readme.md`

## FAQ

**Q: Apakah WAHA gratis?**
A: Ya, versi open-source WAHA gratis. Ada juga WAHA Plus dengan fitur tambahan.

**Q: Berapa banyak device yang bisa dijalankan?**
A: Tergantung resource server. 1 container WAHA bisa handle multiple sessions.

**Q: Apakah aman?**
A: Ya, WAHA menggunakan WhatsApp Web official. Namun pastikan deploy dengan secure.

**Q: Bisa kirim bulk message?**
A: Ya, tapi perhatikan rate limiting WhatsApp untuk menghindari banned.

**Q: Device disconnect terus?**
A: Pastikan koneksi internet stabil dan WhatsApp di HP tetap aktif.

---

**Happy Messaging! 🚀📱**
