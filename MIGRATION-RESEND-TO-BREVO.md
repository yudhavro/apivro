# 🔄 Migration: Resend → Brevo SMTP

Dokumentasi migrasi dari Resend ke Brevo SMTP untuk email notifications.

## 📋 Alasan Migrasi

- ✅ Sudah memiliki akun SMTP Brevo yang aktif
- ✅ Credentials sudah tersedia dan terverifikasi
- ✅ Tidak perlu setup akun baru
- ✅ Hemat biaya (menggunakan resource yang sudah ada)

---

## 🔧 Perubahan yang Dilakukan

### 1. Dependencies

**Sebelum:**
```json
{
  "dependencies": {
    "resend": "^x.x.x"
  }
}
```

**Sesudah:**
```json
{
  "dependencies": {
    "nodemailer": "^6.9.x"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.x"
  }
}
```

### 2. Email Service (`server/lib/email.ts`)

**Sebelum:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: EmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  // ...
}
```

**Sesudah:**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(params: EmailParams) {
  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  // ...
}
```

### 3. Environment Variables

**Sebelum (`.env.example`):**
```env
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

**Sesudah (`.env.example`):**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=support@yudhavro.com
SMTP_PASS=your_smtp_password
FROM_EMAIL=support@yudhavro.com
FROM_NAME=Yudha dari APIVRO
```

### 4. Dokumentasi

- ✅ Update `EMAIL-NOTIFICATIONS.md`
- ✅ Update setup instructions
- ✅ Update resources links

---

## ✅ Verifikasi

### Checklist Cleanup

- [x] Uninstall resend package
- [x] Install nodemailer
- [x] Update email service code
- [x] Update environment variables
- [x] Update dokumentasi
- [x] Remove resend dari package.json
- [x] Remove resend dari node_modules
- [x] Test server startup
- [x] Verify no resend references in code

### Test Commands

```bash
# 1. Check package.json
grep -i "resend" package.json
# Expected: No output

# 2. Check node_modules
ls node_modules/ | grep -i resend
# Expected: No output

# 3. Check code
grep -r "resend" server/ src/ --include="*.ts" --include="*.tsx"
# Expected: No output (except node_modules internal)

# 4. Test server
npx tsx --env-file=.env server/index.ts
# Expected: Server starts without errors
```

---

## 🚀 Setup Baru

### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Configure Environment

Tambahkan ke `.env`:

```env
# SMTP (Brevo Email Service)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=support@yudhavro.com
SMTP_PASS=5P96jsFOp7byZTdR
FROM_EMAIL=support@yudhavro.com
FROM_NAME=Yudha dari APIVRO
```

### 3. Test Email

Email akan otomatis terkirim saat:
- Payment berhasil (callback dari Tripay)
- User preferences `payment_success = true`

---

## 📊 Comparison

| Feature | Resend | Brevo SMTP |
|---------|--------|------------|
| Setup | Perlu daftar & verify domain | ✅ Sudah ready |
| Cost | Paid (after free tier) | ✅ Sudah bayar |
| API | Modern REST API | SMTP Protocol |
| Integration | Simple SDK | Nodemailer |
| Delivery | Excellent | Excellent |
| Templates | Built-in | Custom HTML |

---

## ✅ Status

- ✅ Migration completed
- ✅ All resend references removed
- ✅ Nodemailer configured
- ✅ SMTP Brevo active
- ✅ Server running successfully
- ✅ Ready for testing

---

## 📝 Notes

- Email templates tetap sama (HTML templates)
- Notification preferences tetap berfungsi
- Database schema tidak berubah
- Frontend tidak terpengaruh
- Hanya backend email service yang berubah

---

## 🎯 Next Steps

1. Test payment success email dengan transaksi real
2. Monitor email delivery di Brevo dashboard
3. Setup email tracking (optional)
4. Implement remaining email triggers (device disconnect, limit reached, expiry reminder)
