# 📧 Email Notifications

Email notification system untuk API VRO menggunakan SMTP Brevo dengan Nodemailer.

## 🎯 Features

### ✅ Implemented Notifications

1. **Payment Success** 💳
   - Dikirim setelah payment berhasil
   - Include invoice PDF link
   - Detail plan dan amount

2. **Subscription Expiry Reminder** ⏰
   - Reminder 7 hari sebelum expired
   - Reminder 3 hari sebelum expired
   - Link untuk renew subscription

3. **Device Disconnect Alert** ⚠️
   - Notifikasi saat device WhatsApp disconnect
   - Include device name dan phone number
   - Link untuk reconnect

4. **Message Limit Reached** 📊
   - Alert saat mencapai limit pesan
   - Suggest upgrade plan
   - Link ke subscription page

---

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Environment Variables

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

**SMTP Brevo sudah aktif dan siap digunakan!** ✅

Credentials sudah dikonfigurasi dari akun Brevo yang ada.

### 3. Database Migration

Run SQL di Supabase SQL Editor:

```sql
-- File: database/notification-preferences.sql
-- Sudah dibuat dan di-run
```

---

## 📝 Notification Preferences

User bisa mengatur preferensi notifikasi di halaman **Settings** (`/settings`):

- ✅ Payment Success Notifications
- ✅ Subscription Reminder Notifications  
- ✅ Device Disconnect Alerts
- ✅ Message Limit Alerts

Preferences disimpan di tabel `notification_preferences`.

---

## 🎨 Email Templates

### Payment Success Email

**Trigger:** Setelah payment callback dari Tripay dengan status PAID

**Template:** `getPaymentSuccessEmail()`

**Data:**
- Customer name
- Plan name
- Amount paid
- Invoice URL
- Invoice number

**Preview:**
- Header: Gradient purple background
- Content: Payment details dalam box
- CTA: "Download Invoice" button
- Footer: Copyright info

---

### Subscription Expiry Reminder

**Trigger:** Cron job (7 & 3 hari sebelum expired)

**Template:** `getExpiryReminderEmail()`

**Data:**
- Customer name
- Plan name
- Days left
- Expiry date
- Renew URL

**Preview:**
- Header: Gradient orange background
- Content: Expiry warning
- CTA: "Renew Subscription" button

---

### Device Disconnect Alert

**Trigger:** Saat device status berubah jadi 'disconnected'

**Template:** `getDeviceDisconnectEmail()`

**Data:**
- Customer name
- Device name
- Phone number (optional)

**Preview:**
- Header: Gradient red background
- Content: Disconnect warning
- CTA: "Reconnect Device" button

---

### Message Limit Reached

**Trigger:** Saat messages_used >= message_limit

**Template:** `getLimitReachedEmail()`

**Data:**
- Customer name
- Plan name
- Message limit
- Upgrade URL

**Preview:**
- Header: Gradient purple background
- Content: Limit info
- CTA: "Upgrade Plan" button

---

## 🔌 Integration Points

### 1. Payment Callback

File: `server/routes/payments.ts`

```typescript
// After invoice generated
if (invoiceResult.success) {
  // Check notification preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('payment_success')
    .eq('user_id', payment.user_id)
    .single();

  if (!prefs || prefs.payment_success !== false) {
    // Send email
    const emailHtml = getPaymentSuccessEmail({...});
    await sendEmail({
      to: user.email,
      subject: '✅ Payment Successful',
      html: emailHtml,
    });
  }
}
```

### 2. Device Status Change

File: `server/routes/devices.ts` (TODO)

```typescript
// When device disconnects
if (newStatus === 'disconnected' && oldStatus === 'connected') {
  // Check preferences
  // Send disconnect alert email
}
```

### 3. Message Limit Check

File: `server/routes/messages.ts` (TODO)

```typescript
// After sending message
if (subscription.messages_used >= plan.message_limit) {
  // Check preferences
  // Send limit reached email
}
```

### 4. Subscription Expiry Reminder

File: `server/jobs/reminder-emails.ts` (TODO)

```typescript
// Cron job runs daily
// Find subscriptions expiring in 7 or 3 days
// Send reminder emails
```

---

## 🧪 Testing

### Test Payment Success Email

1. Buat payment baru di `/subscription`
2. Bayar di Tripay sandbox
3. Ubah status jadi PAID
4. Check email inbox
5. Verify invoice link works

### Test Notification Preferences

1. Go to `/settings`
2. Toggle notification checkboxes
3. Click "Save Notification Preferences"
4. Verify saved in database:
   ```sql
   SELECT * FROM notification_preferences WHERE user_id = 'your-user-id';
   ```

### Test Email Service

Run manual test:

```typescript
import { sendEmail, getPaymentSuccessEmail } from './server/lib/email';

const html = getPaymentSuccessEmail({
  customerName: 'Test User',
  planName: 'Basic',
  amount: 10000,
  invoiceUrl: 'https://example.com/invoice.pdf',
  invoiceNumber: 'INV-123',
});

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: html,
});
```

---

## 📊 Database Schema

### notification_preferences

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  payment_success BOOLEAN DEFAULT true,
  subscription_reminder BOOLEAN DEFAULT true,
  device_disconnect BOOLEAN DEFAULT true,
  limit_reached BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### notifications (history)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('expiry_reminder', 'device_disconnected', 'payment_success', 'payment_failed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 Next Steps

### TODO: Implement Remaining Triggers

1. **Device Disconnect Alert**
   - Hook ke device status change
   - Send email saat disconnect

2. **Message Limit Alert**
   - Check limit setelah send message
   - Send email saat reach limit

3. **Subscription Expiry Reminder**
   - Buat cron job
   - Run daily untuk check expiring subscriptions
   - Send reminder 7 & 3 hari sebelum expired

### TODO: Enhancements

1. **Email Queue**
   - Implement queue system (Bull/BullMQ)
   - Retry failed emails
   - Rate limiting

2. **Email Analytics**
   - Track open rate
   - Track click rate
   - A/B testing templates

3. **More Templates**
   - Welcome email
   - Password reset
   - API key created
   - Monthly usage report

---

## 📚 Resources

- [Brevo SMTP Documentation](https://developers.brevo.com/docs/send-a-transactional-email)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [HTML Email Templates](https://github.com/leemunroe/responsive-html-email-template)

---

## ✅ Status

- ✅ Email service setup
- ✅ Payment success email
- ✅ Email templates (4 types)
- ✅ Notification preferences UI
- ✅ Database schema
- ⏳ Device disconnect trigger
- ⏳ Message limit trigger
- ⏳ Expiry reminder cron job
