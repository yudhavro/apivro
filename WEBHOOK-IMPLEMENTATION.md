# 🔗 Simple Webhook - Implementation Complete

## ✅ **Implementation Status: READY FOR TESTING**

All features have been implemented and ready for end-to-end testing.

---

## 📋 **Features Implemented**

### **1. Database Migration** ✅
**File:** `database/webhook-logs.sql`

**Tables:**
- `webhook_logs` - Store webhook call metadata (NO message content)

**Columns:**
- `id`, `device_id`, `user_id`
- `webhook_url`, `event_type`
- `status_code`, `response_time_ms`
- `success`, `error_message`
- `created_at`

**Functions:**
- `get_recent_webhook_logs(device_id, limit)` - Get last N logs
- `get_webhook_stats(device_id, hours)` - Get webhook statistics
- `cleanup_old_webhook_logs()` - Auto-delete logs older than 7 days

**RLS Policies:**
- Users can only view/insert/delete their own logs

---

### **2. Edit Device Feature** ✅
**File:** `src/pages/DevicesPage.tsx`

**Features:**
- Edit button on device card
- Edit dialog for device name & webhook URL
- Update webhook URL without recreating device
- Validation for required fields

**UI:**
- Edit icon button (blue)
- Modal dialog with form
- Save/Cancel buttons

---

### **3. Webhook Forwarding Backend** ✅
**File:** `server/routes/webhooks.ts`

**Endpoints:**

#### **POST /api/v1/webhooks/incoming**
Receive from WAHA and forward to user's webhook

**Flow:**
1. Receive webhook from WAHA
2. Find device by session_id
3. Check if webhook_url configured
4. Forward to user's webhook URL
5. Log result (success/failure)

**Logging:**
- Status code
- Response time (ms)
- Success/failure
- Error message (if failed)

#### **POST /api/v1/webhooks/test/:deviceId**
Test webhook endpoint

**Features:**
- Authentication required (Bearer token)
- Send test payload
- Return response time & status
- Log test results

**Test Payload:**
```json
{
  "event": "webhook.test",
  "timestamp": "2025-10-22T13:05:00Z",
  "device_id": "uuid",
  "device_name": "Device Name",
  "message": "This is a test webhook from API VRO",
  "test": true
}
```

---

### **4. Webhook Logs UI** ✅
**File:** `src/pages/DevicesPage.tsx`

**Features:**
- Test Webhook button (purple)
- Webhook Activity toggle (expandable)
- Display last 15 logs
- Color-coded success/failure
- Show timestamp, status, response time
- Show error message if failed

**UI Components:**
```
Device Card
  └─ Webhook URL (if configured)
      ├─ Test Webhook Button
      ├─ Webhook Activity Toggle (▶/▼)
      └─ Logs Display (expandable)
          └─ Log Items (last 15)
              ├─ ✅/❌ Event Type
              ├─ Timestamp
              ├─ Status Code
              ├─ Response Time
              └─ Error Message (if failed)
```

---

## 🧪 **Testing Guide**

### **Prerequisites:**

1. **Run SQL Migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy & paste: database/webhook-logs.sql
   ```

2. **Server Running:**
   ```bash
   npm run dev:server
   # or
   npx tsx --env-file=.env server/index.ts
   ```

3. **Frontend Running:**
   ```bash
   npm run dev
   ```

---

### **Test 1: Edit Device Webhook URL**

**Steps:**
1. Go to `/devices`
2. Click Edit button (blue icon) on a device
3. Update webhook URL: `https://webhook.site/your-unique-url`
4. Click "Save Changes"
5. **Expected:** Device updated, webhook URL shown

**Verify:**
```sql
SELECT id, name, webhook_url FROM devices WHERE user_id = 'your-user-id';
```

---

### **Test 2: Test Webhook Button**

**Steps:**
1. Go to `/devices`
2. Find device with webhook URL
3. Click "Test Webhook" button (purple)
4. **Expected:** 
   - Button shows "Testing..." with spinner
   - Alert shows success/failure with status & response time
   - Webhook Activity count increases

**Verify:**
- Check webhook.site for received payload
- Check browser console for logs
- Check server logs: `tail -f server.log | grep webhook`

**Expected Payload at webhook.site:**
```json
{
  "event": "webhook.test",
  "timestamp": "2025-10-22T...",
  "device_id": "uuid",
  "device_name": "Device Name",
  "message": "This is a test webhook from API VRO",
  "test": true
}
```

---

### **Test 3: View Webhook Logs**

**Steps:**
1. After testing webhook
2. Click "Webhook Activity" toggle
3. **Expected:** 
   - Logs expand
   - Show test webhook log
   - Green background for success
   - Show status code, response time

**Verify:**
```sql
SELECT * FROM webhook_logs 
WHERE device_id = 'your-device-id' 
ORDER BY created_at DESC 
LIMIT 15;
```

---

### **Test 4: Webhook Forwarding (Real Message)**

**Setup:**
1. Device must be connected
2. Webhook URL configured
3. WAHA configured to send webhooks to API VRO

**WAHA Webhook Config:**
```
Webhook URL: http://localhost:3001/api/v1/webhooks/incoming
```

**Steps:**
1. Send WhatsApp message to connected device
2. **Expected:**
   - Message forwarded to user's webhook URL
   - Log created in webhook_logs
   - Visible in Webhook Activity

**Verify:**
- Check webhook.site for message payload
- Check webhook_logs table
- Check server logs

**Expected Payload:**
```json
{
  "event": "message.received",
  "timestamp": "2025-10-22T...",
  "device_id": "uuid",
  "device_name": "Device Name",
  "phone_number": "+628123456789",
  "data": {
    "id": "message-id",
    "from": "628987654321@c.us",
    "body": "Hello",
    "type": "text",
    ...
  }
}
```

---

### **Test 5: Failed Webhook**

**Steps:**
1. Edit device webhook URL to invalid URL: `https://invalid-url-that-does-not-exist.com`
2. Click "Test Webhook"
3. **Expected:**
   - Alert shows failure
   - Red background in logs
   - Error message shown

**Verify:**
```sql
SELECT * FROM webhook_logs 
WHERE success = false 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### **Test 6: Webhook Logs Retention (7 Days)**

**Manual Test:**
```sql
-- Insert old log (8 days ago)
INSERT INTO webhook_logs (device_id, user_id, webhook_url, event_type, status_code, response_time_ms, success, created_at)
VALUES (
  'your-device-id',
  'your-user-id',
  'https://test.com',
  'webhook.test',
  200,
  100,
  true,
  NOW() - INTERVAL '8 days'
);

-- Run cleanup
SELECT cleanup_old_webhook_logs();

-- Verify deleted
SELECT COUNT(*) FROM webhook_logs WHERE created_at < NOW() - INTERVAL '7 days';
-- Should return 0
```

---

## 📊 **Database Queries for Monitoring**

### **Get Recent Logs:**
```sql
SELECT * FROM get_recent_webhook_logs('device-uuid', 15);
```

### **Get Webhook Stats:**
```sql
SELECT * FROM get_webhook_stats('device-uuid', 24);
```

### **Manual Cleanup:**
```sql
SELECT cleanup_old_webhook_logs();
```

### **Check All Logs:**
```sql
SELECT 
  wl.*,
  d.name as device_name,
  p.email as user_email
FROM webhook_logs wl
JOIN devices d ON d.id = wl.device_id
JOIN profiles p ON p.id = wl.user_id
ORDER BY wl.created_at DESC
LIMIT 50;
```

---

## 🔍 **Debugging**

### **Server Logs:**
```bash
tail -f server.log | grep -i webhook
```

**Look for:**
- `✅ Webhook delivered to ...`
- `❌ Webhook failed to ...`
- `✅ Test webhook successful`

### **Browser Console:**
```javascript
// Check webhook logs state
console.log(webhookLogs);

// Check if logs loaded
console.log(webhookLogs['device-id']);
```

### **Network Tab:**
- Check POST to `/api/v1/webhooks/test/:deviceId`
- Check response status & body
- Check request headers (Authorization)

---

## 📝 **API Endpoints Summary**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/webhooks/incoming` | POST | No | Receive from WAHA |
| `/api/v1/webhooks/test/:deviceId` | POST | Yes | Test webhook |

---

## ✅ **Checklist Before Production**

- [ ] Run SQL migration in Supabase
- [ ] Test webhook forwarding with real messages
- [ ] Test webhook test button
- [ ] Verify logs display correctly
- [ ] Test edit device webhook URL
- [ ] Verify RLS policies work
- [ ] Test with multiple devices
- [ ] Test with invalid webhook URLs
- [ ] Verify 7-day retention works
- [ ] Check server logs for errors
- [ ] Test on mobile/tablet (responsive)
- [ ] Update MVP-PLAN.md status

---

## 🎯 **Next Steps**

1. **Run SQL Migration** in Supabase SQL Editor
2. **Test all features** using testing guide above
3. **Fix any bugs** found during testing
4. **Update MVP-PLAN.md** to mark as DONE
5. **Deploy to production** (if all tests pass)

---

## 📚 **Documentation Links**

- Database Schema: `database/webhook-logs.sql`
- Backend Routes: `server/routes/webhooks.ts`
- Frontend UI: `src/pages/DevicesPage.tsx`
- MVP Plan: `MVP-PLAN.md`

---

## 🚀 **Ready for Testing!**

All features implemented and ready. Please run through the testing guide to verify everything works as expected.
