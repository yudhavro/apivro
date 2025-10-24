# 📧 Email Subjects & Content

Dokumentasi lengkap untuk semua email notifications dengan subject dan konten dalam Bahasa Indonesia.

---

## 1. 💳 Payment Success Email

### Subject:
```
🎉 Pembayaran Berhasil - Subscription {PLAN_NAME} Aktif!
```

### Konten:
- **Header:** "Payment Successful! 🎉" (gradient purple)
- **Greeting:** Hi {CUSTOMER_NAME}
- **Body:**
  - Terima kasih atas pembayaran
  - Subscription berhasil di-upgrade ke {PLAN_NAME}
  - Dapat menggunakan API dengan limit lebih besar
  - Invoice tersedia untuk diunduh
- **Payment Details Box:**
  - Plan: {PLAN_NAME}
  - Amount Paid: Rp {AMOUNT}
  - Invoice Number: {INVOICE_NUMBER}
- **CTA Button:** "Download Invoice" → Link ke invoice PDF
- **Footer:**
  - Contact support: support@yudhavro.com
  - Dashboard link: api.yudhavro.com

### Trigger:
- Setelah payment callback dari Tripay dengan status PAID
- Setelah invoice berhasil di-generate
- Check user preferences: `payment_success = true`

### Example:
```
Subject: 🎉 Pembayaran Berhasil - Subscription Basic Aktif!

Hi yudhavro,

Terima kasih atas pembayaran Anda! Subscription Anda telah berhasil 
di-upgrade ke Basic.

Anda sekarang dapat menggunakan API VRO dengan limit pesan yang lebih besar...
```

---

## 2. ⏰ Subscription Expiry Reminder

### Subject:
```
⏰ Subscription Anda Akan Berakhir dalam {DAYS} Hari
```

### Konten:
- **Header:** "Subscription Expiring Soon ⏰" (gradient orange)
- **Greeting:** Hi {CUSTOMER_NAME}
- **Body:**
  - Subscription {PLAN_NAME} akan berakhir dalam {DAYS_LEFT} hari
  - Tanggal expired: {EXPIRY_DATE}
  - Perpanjang sebelum berakhir untuk layanan tanpa gangguan
  - Setelah expired, otomatis downgrade ke Free (50 pesan/bulan)
- **CTA Button:** "Renew Subscription" → Link ke subscription page
- **Footer:**
  - Contact support: support@yudhavro.com

### Trigger:
- Cron job runs daily
- Send reminder 7 hari sebelum expired
- Send reminder 3 hari sebelum expired
- Check user preferences: `subscription_reminder = true`

### Example:
```
Subject: ⏰ Subscription Anda Akan Berakhir dalam 7 Hari

Hi yudhavro,

Subscription Basic Anda akan berakhir dalam 7 hari pada tanggal 
30 Oktober 2025.

Untuk terus menikmati layanan tanpa gangguan, silakan perpanjang 
subscription Anda...
```

---

## 3. ⚠️ Device Disconnect Alert

### Subject:
```
⚠️ Device WhatsApp Anda Terputus - {DEVICE_NAME}
```

### Konten:
- **Header:** "Device Disconnected ⚠️" (gradient red)
- **Greeting:** Hi {CUSTOMER_NAME}
- **Body:**
  - Device {DEVICE_NAME} ({PHONE_NUMBER}) telah terputus
  - Reconnect untuk melanjutkan pengiriman pesan
  - API tidak berfungsi sampai device terhubung kembali
- **Warning Box (red):**
  - Penyebab umum disconnect:
    - WhatsApp logout dari device
    - Koneksi internet terputus
    - Device mati atau restart
- **CTA Button:** "Reconnect Device" → Link ke devices page
- **Footer:**
  - Contact support: support@yudhavro.com

### Trigger:
- Saat device status berubah dari 'connected' → 'disconnected'
- Check user preferences: `device_disconnect = true`

### Example:
```
Subject: ⚠️ Device WhatsApp Anda Terputus - Device Utama

Hi yudhavro,

Device WhatsApp Anda Device Utama (628123456789) telah terputus 
dari server.

Silakan reconnect device Anda untuk melanjutkan pengiriman pesan...
```

---

## 4. 📊 Message Limit Reached

### Subject:
```
📊 Limit Pesan Tercapai - Upgrade untuk Lanjut Kirim
```

### Konten:
- **Header:** "Message Limit Reached 📊" (gradient purple)
- **Greeting:** Hi {CUSTOMER_NAME}
- **Body:**
  - Telah mencapai limit {MESSAGE_LIMIT} pesan pada plan {PLAN_NAME}
  - API tidak dapat kirim pesan sampai bulan depan atau upgrade
- **Info Box (purple):**
  - Pilihan untuk Anda:
    - Tunggu reset otomatis (awal bulan depan)
    - Upgrade sekarang (langsung bisa kirim)
- **CTA Button:** "Upgrade Plan Sekarang" → Link ke subscription page
- **Footer:**
  - Link ke Dashboard untuk lihat usage detail

### Trigger:
- Saat messages_used >= message_limit
- Check user preferences: `limit_reached = true`

### Example:
```
Subject: 📊 Limit Pesan Tercapai - Upgrade untuk Lanjut Kirim

Hi yudhavro,

Anda telah mencapai limit pengiriman pesan bulanan sebesar 1.500 pesan 
pada plan Basic.

API Anda tidak dapat mengirim pesan lagi sampai bulan depan...
```

---

## 🎨 Email Design Guidelines

### Colors:
- **Payment Success:** Purple gradient (#667eea → #764ba2)
- **Expiry Reminder:** Orange gradient (#f59e0b → #d97706)
- **Device Disconnect:** Red gradient (#ef4444 → #dc2626)
- **Limit Reached:** Purple gradient (#8b5cf6 → #7c3aed)

### Typography:
- **Header:** 28px, Bold, White
- **Body:** 16px, Regular, #374151
- **Small text:** 14px, Regular, #6b7280

### Buttons:
- Padding: 14px 32px
- Border radius: 6px
- Font: 16px, Semi-bold
- Color: White on brand color background

### Layout:
- Max width: 600px
- Padding: 40px
- Background: #f3f4f6
- Card: White with border-radius 8px

---

## 🔗 Links yang Digunakan

Base URL: `https://api.yudhavro.com`

### Email Links:
1. **Dashboard:** `${APP_URL}/dashboard`
2. **Devices:** `${APP_URL}/devices`
3. **Subscription:** `${APP_URL}/subscription`
4. **Invoice:** Direct S3 link dari invoice generation
5. **Support:** `mailto:support@yudhavro.com`

---

## 📝 Variables Reference

### Payment Success:
```typescript
{
  customerName: string;    // From email or user profile
  planName: string;        // "Free" | "Basic" | "Enterprise"
  amount: number;          // Payment amount (without fee)
  invoiceUrl: string;      // S3 URL to PDF
  invoiceNumber: string;   // INV-{timestamp}-{userId}
}
```

### Expiry Reminder:
```typescript
{
  customerName: string;
  planName: string;
  daysLeft: number;        // 7 or 3
  expiryDate: string;      // Formatted date
  renewUrl: string;        // Link to subscription page
}
```

### Device Disconnect:
```typescript
{
  customerName: string;
  deviceName: string;      // User-defined device name
  phoneNumber?: string;    // Optional phone number
}
```

### Limit Reached:
```typescript
{
  customerName: string;
  planName: string;
  messageLimit: number;    // 50, 1500, or 15000
  upgradeUrl: string;      // Link to subscription page
}
```

---

## ✅ Checklist Email Content

- [x] Subject dalam Bahasa Indonesia
- [x] Body dalam Bahasa Indonesia
- [x] Emoji di subject untuk attention
- [x] Clear CTA button
- [x] Contact support info
- [x] Link ke dashboard/devices
- [x] Warning/info boxes untuk context
- [x] Professional footer
- [x] Responsive design
- [x] Brand colors consistent

---

## 🧪 Testing

### Test Email Manually:

```typescript
// Test Payment Success
const html = getPaymentSuccessEmail({
  customerName: 'Yudha',
  planName: 'Basic',
  amount: 10000,
  invoiceUrl: 'https://example.com/invoice.pdf',
  invoiceNumber: 'INV-123',
});

await sendEmail({
  to: 'test@example.com',
  subject: '🎉 Pembayaran Berhasil - Subscription Basic Aktif!',
  html: html,
});
```

### Preview in Browser:

Save HTML to file dan buka di browser untuk preview design.

---

## 📊 Email Analytics (Future)

Track metrics:
- Open rate
- Click rate (CTA buttons)
- Conversion rate (upgrade/renew)
- Bounce rate
- Unsubscribe rate

Integration dengan Brevo dashboard untuk analytics.
