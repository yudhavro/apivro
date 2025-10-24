# 📊 Message Limits - Implementation Guide

**Last Updated:** October 22, 2025

---

## 🎯 **Overview**

API VRO menggunakan sistem **quota-based message limits** dengan auto-reset bulanan untuk mengontrol penggunaan API.

---

## ✅ **Features Implemented**

### **1. Track Outbound Messages** ✅

Setiap pesan yang berhasil terkirim akan di-track di database:

```typescript
// Increment counter setelah pesan terkirim
await supabase
  .from('subscriptions')
  .update({ messages_used: messagesUsed + 1 })
  .eq('id', subscription.id);
```

**Database Schema:**
```sql
CREATE TABLE subscriptions (
  messages_used integer DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  ...
);
```

---

### **2. Hard Limit Enforcement** ✅

API akan **block request** jika quota habis:

```typescript
if (messagesUsed >= messageLimit) {
  return res.status(429).json({
    success: false,
    error: 'MESSAGE_LIMIT_REACHED',
    message: 'Monthly message limit reached. Please upgrade your plan.',
    quota_used: messagesUsed,
    quota_limit: messageLimit
  });
}
```

**Response Example:**
```json
{
  "success": false,
  "error": "MESSAGE_LIMIT_REACHED",
  "message": "Monthly message limit reached. Please upgrade your plan.",
  "quota_used": 50,
  "quota_limit": 50
}
```

---

### **3. Auto-Reset Tiap Bulan** ✅

Menggunakan **Lazy Reset** - reset otomatis saat user kirim pesan di bulan baru:

```typescript
// Check if need reset
const lastReset = new Date(subscription.last_reset_at);
const now = new Date();
const needReset = lastReset.getMonth() !== now.getMonth() || 
                  lastReset.getFullYear() !== now.getFullYear();

if (needReset) {
  // Reset counter
  await supabase
    .from('subscriptions')
    .update({ 
      messages_used: 0, 
      last_reset_at: now.toISOString() 
    })
    .eq('id', subscription.id);
}
```

**Keuntungan Lazy Reset:**
- ✅ Tidak perlu cron job
- ✅ Tidak perlu Supabase extension
- ✅ Simple & reliable
- ✅ Reset otomatis saat user aktif

---

### **4. Block API Jika Limit Tercapai** ✅

Request akan ditolak dengan HTTP 429 (Too Many Requests):

```bash
# Test limit reached
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"6285361405924","message":"Test"}'

# Response (jika limit tercapai):
# HTTP/1.1 429 Too Many Requests
# {
#   "success": false,
#   "error": "MESSAGE_LIMIT_REACHED",
#   "message": "Monthly message limit reached. Please upgrade your plan.",
#   "quota_used": 50,
#   "quota_limit": 50
# }
```

---

## 📊 **Quota by Plan**

| Plan | Messages/Month | Price |
|------|----------------|-------|
| **Free** | 50 | $0 |
| **Basic** | 1,000 | $9/mo |
| **Pro** | 10,000 | $29/mo |
| **Enterprise** | 100,000 | $99/mo |

---

## 🔄 **Reset Schedule**

**Lazy Reset Logic:**
- Reset terjadi saat user **pertama kali** kirim pesan di bulan baru
- Tidak perlu tunggu tanggal 1 jam 00:00
- Lebih flexible untuk timezone yang berbeda

**Example:**
```
Last reset: 2025-10-15 10:30:00
Current:    2025-11-02 14:20:00

→ Bulan berbeda (Oct vs Nov)
→ Auto-reset messages_used = 0
→ Update last_reset_at = 2025-11-02 14:20:00
```

---

## 🧪 **Testing**

### **Test 1: Normal Send (Within Limit)**
```bash
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"6285361405924","message":"Test message"}'

# Expected: 200 OK
# {
#   "success": true,
#   "quota_remaining": 49,
#   "quota_used": 1,
#   "quota_limit": 50
# }
```

### **Test 2: Limit Reached**
```sql
-- Manually set to limit
UPDATE subscriptions 
SET messages_used = 50 
WHERE user_id = 'YOUR_USER_ID';
```

```bash
# Try to send
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"6285361405924","message":"Test"}'

# Expected: 429 Too Many Requests
```

### **Test 3: Auto-Reset**
```sql
-- Simulate last month
UPDATE subscriptions 
SET last_reset_at = '2025-09-15 10:00:00',
    messages_used = 50
WHERE user_id = 'YOUR_USER_ID';
```

```bash
# Send message (should auto-reset)
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"6285361405924","message":"Test after reset"}'

# Expected: 200 OK (counter reset to 1)
# Check logs for: "🔄 Resetting monthly message counter"
```

---

## 📝 **Database Queries**

### **Check User Quota**
```sql
SELECT 
  u.email,
  sp.name as plan,
  s.messages_used,
  sp.message_limit,
  (sp.message_limit - s.messages_used) as remaining,
  s.last_reset_at,
  CASE 
    WHEN s.messages_used >= sp.message_limit THEN '❌ LIMIT REACHED'
    WHEN s.messages_used >= sp.message_limit * 0.8 THEN '⚠️ WARNING (80%)'
    ELSE '✅ OK'
  END as status
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active'
ORDER BY s.messages_used DESC;
```

### **Manual Reset (if needed)**
```sql
UPDATE subscriptions
SET messages_used = 0,
    last_reset_at = now()
WHERE user_id = 'USER_ID_HERE';
```

---

## 🚀 **Future Enhancements**

### **Option: Upgrade to pg_cron**

Jika ingin reset tepat tanggal 1 jam 00:00 UTC:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly reset
SELECT cron.schedule(
  'reset-monthly-messages',
  '0 0 1 * *',  -- Every 1st day of month at 00:00
  $$
  UPDATE subscriptions
  SET messages_used = 0,
      last_reset_at = now()
  WHERE status = 'active';
  $$
);
```

**Pros:**
- ✅ Reset tepat waktu
- ✅ Tidak perlu tunggu user aktif

**Cons:**
- ❌ Perlu Supabase Pro plan (pg_cron)
- ❌ Lebih complex setup

---

## ✅ **Summary**

| Feature | Status | Implementation |
|---------|--------|----------------|
| Track messages | ✅ DONE | Increment `messages_used` |
| Hard limit | ✅ DONE | Check before send |
| Auto-reset | ✅ DONE | Lazy reset (on-demand) |
| Block API | ✅ DONE | HTTP 429 response |

**All message limit features are PRODUCTION READY!** 🎉
