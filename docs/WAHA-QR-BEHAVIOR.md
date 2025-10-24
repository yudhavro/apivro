# 🔍 WAHA QR Code Behavior

## ❓ Pertanyaan: Kenapa WAHA Terus Print QR di Logs?

### **Jawaban:**

Ya, **ini adalah behavior normal dari WAHA**. Berikut penjelasannya:

---

## 📊 **WAHA QR Generation Behavior**

### **1. QR Code Lifecycle**

```
Session Start
    ↓
Generate QR (baru)
    ↓
Print QR di console (ASCII art)
    ↓
Tunggu 20-30 detik
    ↓
QR expired (dari WhatsApp server)
    ↓
Generate QR baru lagi
    ↓
Print QR baru di console
    ↓
Loop... (sampai di-scan atau session stopped)
```

### **2. Kenapa QR Terus Muncul?**

**WhatsApp Server Behavior:**
- QR code dari WhatsApp server **expire setiap 20-30 detik**
- Ini adalah security feature dari WhatsApp
- WAHA harus generate QR baru setiap kali QR lama expired
- Ini **bukan bug**, tapi **by design**

**WAHA Behavior:**
- WAHA listen ke WhatsApp server
- Setiap kali dapat QR baru, WAHA print ke console
- Environment variable `WAHA_PRINT_QR=true` (default)
- Ini berguna untuk debugging

---

## 🎯 **Solusi yang Sudah Diimplementasikan**

### **1. Frontend Timeout (60 detik)**

```tsx
// Setelah 60 detik, frontend:
1. Stop polling
2. Logout session
3. Stop session
4. DELETE session (cleanup)
5. Update status → disconnected
6. Alert user
```

### **2. Session Cleanup**

```tsx
// Triple cleanup untuk ensure session benar-benar stopped:
await wahaClient.logout(device.session_id);      // Logout
await wahaClient.stopSession(device.session_id); // Stop
await wahaClient.deleteSession(device.session_id); // Delete
```

### **3. Logs Behavior**

**Before Timeout (0-60 detik):**
```
[14:27:21] QR code generated (ASCII art)
[14:27:41] QR code generated (ASCII art) ← QR baru (20 detik kemudian)
[14:28:01] QR code generated (ASCII art) ← QR baru (20 detik kemudian)
...
```

**After Timeout (60+ detik):**
```
[14:28:21] Session stopped
[14:28:21] Session deleted
(no more QR logs) ✅
```

---

## 🔧 **Cara Disable QR di Console**

Jika Anda tidak ingin melihat QR di logs:

### **Option 1: Environment Variable**

```bash
docker run -d \
  --name waha-plus \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -e WAHA_PRINT_QR=false \  # ← Disable QR print
  -v waha_sessions:/app/.sessions \
  devlikeapro/waha-plus:latest
```

### **Option 2: Docker Compose**

```yaml
services:
  waha-plus:
    image: devlikeapro/waha-plus:latest
    environment:
      - WAHA_API_KEY=mysecretkey123
      - WHATSAPP_DEFAULT_ENGINE=WEBJS
      - WAHA_PRINT_QR=false  # ← Disable QR print
```

### **Option 3: Update Running Container**

```bash
# Stop container
docker stop waha-plus && docker rm waha-plus

# Run dengan WAHA_PRINT_QR=false
docker run -d \
  --name waha-plus \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -e WAHA_PRINT_QR=false \
  -v waha_sessions:/app/.sessions \
  devlikeapro/waha-plus:latest
```

---

## 📈 **Performance Impact**

### **QR Generation:**
- **CPU:** Minimal (< 1%)
- **Memory:** Negligible
- **Network:** Minimal (hanya ke WhatsApp server)
- **Logs:** Bisa besar jika banyak session

### **Recommendations:**

1. **Development:** Keep `WAHA_PRINT_QR=true` (untuk debugging)
2. **Production:** Set `WAHA_PRINT_QR=false` (untuk clean logs)
3. **Log Rotation:** Configure Docker log rotation

---

## 🎯 **Best Practices**

### **1. Log Rotation (Production)**

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### **2. Monitor Logs**

```bash
# Lihat logs tanpa QR noise
docker logs waha-plus 2>&1 | grep -v "QR code"

# Atau filter hanya errors
docker logs waha-plus 2>&1 | grep -i error
```

### **3. Frontend Timeout**

```tsx
// Sudah diimplementasikan:
- QR timeout: 60 detik
- Auto cleanup session
- User-friendly alert
```

---

## 📊 **Summary**

| Aspect | Behavior |
|--------|----------|
| **QR Generation** | Setiap 20-30 detik (WhatsApp server) |
| **WAHA Print** | Default: true (bisa di-disable) |
| **Frontend Timeout** | 60 detik (sudah implemented) |
| **Session Cleanup** | Logout → Stop → Delete |
| **Production** | Set `WAHA_PRINT_QR=false` |

---

## ✅ **Kesimpulan**

1. ✅ **QR terus muncul di logs adalah normal** (WhatsApp behavior)
2. ✅ **Frontend sudah handle timeout** (60 detik)
3. ✅ **Session cleanup sudah proper** (logout + stop + delete)
4. ✅ **Untuk production:** Set `WAHA_PRINT_QR=false`
5. ✅ **Log rotation:** Configure untuk manage log size

**Tidak ada bug, semua by design!** 🎉
