# 🗺️ API VRO - Development Roadmap

**Last Updated:** October 21, 2025  
**Status:** Core Features Completed ✅

---

## ✅ **Completed Features**

### **1. WAHA Plus Integration** ✅
- ✅ Docker setup dengan subscription key
- ✅ Chromium (WEBJS) engine
- ✅ Unlimited sessions support
- ✅ Multi-user ready
- ✅ Production-ready configuration

### **2. QR Code System** ✅
- ✅ Auto-show QR setelah create device
- ✅ QR muncul 0-1.5 detik (2-4x lebih cepat)
- ✅ QR timeout 60 detik (seperti WhatsApp Web)
- ✅ Auto-cleanup expired sessions
- ✅ Base64 image display (no external service)
- ✅ Real-time QR updates

### **3. Device Management** ✅
- ✅ Add device (auto-connect)
- ✅ Connect device (QR scan)
- ✅ Disconnect device (logout + stop)
- ✅ Delete device (cleanup session)
- ✅ Real-time status updates
- ✅ Session isolation per user

### **4. UI/UX Improvements** ✅
- ✅ Nama device sebagai judul
- ✅ Nomor WA di bawah (clean format: +628xxx)
- ✅ Disconnect button subtle (tidak mencolok)
- ✅ Session ID hidden (tidak perlu user lihat)
- ✅ Modern gradient icons
- ✅ Informative card display
- ✅ Responsive design

### **5. Performance Optimizations** ✅
- ✅ Polling interval 1.5s (faster updates)
- ✅ Immediate first poll (no delay)
- ✅ Efficient session cleanup
- ✅ Optimized database queries
- ✅ Triple cleanup (logout + stop + delete)

### **6. Documentation** ✅
- ✅ WAHA Plus setup guide
- ✅ Docker commands reference
- ✅ QR behavior explanation
- ✅ Production best practices
- ✅ Troubleshooting guides

---

## 🎯 **MVP Streamlined Roadmap**

> **Goal:** Launch MVP dalam 5 minggu dengan core features yang benar-benar dibutuhkan user.

### **Phase 1: Core API Features** 🔐
**Priority:** CRITICAL  
**Timeline:** Week 1-2 (10-14 hari)  
**Status:** In Progress

#### **1.1 Authentication (Supabase)** (Day 1-2) ✅ (DONE)
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Session management
- [ ] Protected routes
- [ ] User profile page

#### **1.2 API Key Management** (Day 3-4)
- [ ] Generate API key (apivro_live_xxx)
- [ ] Store hashed keys (bcrypt)
- [ ] List API keys
- [ ] Revoke API key
- [ ] Copy to clipboard
- [ ] Last used timestamp
- [ ] API key authentication middleware

#### **1.3 Send Message API** (Day 5-8)
- [ ] `POST /api/v1/messages/send` (text)
- [ ] Send media (image, document, video, audio)
- [ ] S3 upload integration (is3.cloudhost.id)
- [ ] Phone number validation
- [ ] API Key authentication
- [ ] Rate limiting (10 req/min per key)
- [ ] Error handling

#### **1.4 Message Limits & Counter** (Day 9-10)
- [ ] Track outbound messages per user
- [ ] Check limit before send (CRITICAL!)
- [ ] Return 429 when limit reached
- [ ] Block API calls when limit exceeded
- [ ] Auto-reset counter (tanggal 1 tiap bulan)
- [ ] Display usage in dashboard

**API Response Examples:**
```typescript
// Success Response
POST /api/v1/messages/send
{
  "success": true,
  "message_id": "wamid.xxx",
  "quota_remaining": 1499
}

// Error: Limit Reached
{
  "success": false,
  "error": "MESSAGE_LIMIT_REACHED",
  "message": "Monthly limit reached. Please upgrade your plan.",
  "quota_used": 1500,
  "quota_limit": 1500
}
```

**Plan Structure:**
```
Free:       50 messages/month    - Rp 0 (1 Device)
Basic:      1,500 messages/month - Rp 10,000/bulan (1 Device)
Enterprise: 15,000 messages/month - Rp 25,000/bulan (5 Devices)
```

---

### **Phase 2: Payment & Notifications** 💳
**Priority:** CRITICAL  
**Timeline:** Week 3 (7 hari)  
**Status:** Not Started

#### **2.1 Payment Integration (Tripay)** (Day 1-3)
- [ ] Tripay API integration
- [ ] Payment channels:
  - [ ] QRIS (Rp 750 + 0.70%)
  - [ ] Mandiri VA (Rp 4,250)
  - [ ] BRI VA (Rp 4,250)
  - [ ] BNI VA (Rp 4,250)
  - [ ] BSI VA (Rp 4,250)
- [ ] Checkout page (redirect to Tripay)
- [ ] Payment callback handler
- [ ] Payment verification
- [ ] Auto-upgrade plan after payment
- [ ] Payment status tracking

#### **2.2 Plan Management** (Day 3-4)
- [ ] Database schema for plans & subscriptions
- [ ] Plan upgrade/downgrade logic
- [ ] Auto-upgrade after payment
- [ ] Device limit enforcement (1 for Free/Basic, 5 for Enterprise)
- [ ] Expiry date tracking
- [ ] Auto-downgrade to Free after expiry

#### **2.3 Invoice System** (Day 4-5)
- [ ] Generate invoice PDF
- [ ] Invoice number (INV-YYYYMMDD-XXX)
- [ ] Invoice history page
- [ ] Download invoice button
- [ ] Invoice template design (simple)

#### **2.4 Email Notifications (Brevo SMTP)** (Day 6-7)
- [ ] Welcome email (after signup)
- [ ] Payment success email (with invoice)
- [ ] Payment failed email
- [ ] Reminder 7 hari sebelum expired
- [ ] Reminder 3 hari sebelum expired
- [ ] Device disconnect notification
- [ ] Limit reached notification
- [ ] Email template design

**Tripay Integration:**
```typescript
// Create Payment
POST https://tripay.co.id/api/transaction/create
Headers:
  Authorization: Bearer DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93

Body:
{
  "method": "QRIS",
  "merchant_ref": "INV-20251021-001",
  "amount": 10000,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "order_items": [{
    "name": "API VRO - Basic Plan (Monthly)",
    "price": 10000,
    "quantity": 1
  }],
  "callback_url": "https://api.apivro.com/api/payments/tripay/callback",
  "return_url": "https://app.apivro.com/dashboard"
}

// Callback Handler
POST /api/payments/tripay/callback
{
  "reference": "T123456789",
  "merchant_ref": "INV-20251021-001",
  "status": "PAID",
  "amount": 10000
}
```

---

### **Phase 3: Simple Webhook & Dashboard** 🔗
**Priority:** HIGH  
**Timeline:** Week 4 (7 hari)  
**Status:** Not Started

> **Simplified:** User hanya butuh webhook berfungsi, tidak perlu UI management yang kompleks.

#### **3.1 Basic Webhook** (Day 1-3)
- [ ] Webhook URL input per device
- [ ] Receive incoming messages from WAHA
- [ ] Forward to user webhook URL
- [ ] Basic retry (1x jika gagal)
- [ ] Test webhook button
- [ ] Show last 10 webhook calls (simple table)
- [ ] Success/failed indicator

**Simple Webhook Config UI:**
```
Device: My WhatsApp
Webhook URL: [https://your-webhook.com/endpoint]
[Test Webhook] [Save]

Recent Webhook Calls:
| Time  | Event            | Status     |
|-------|------------------|------------|
| 10:00 | message.received | ✅ Success |
| 09:55 | message.received | ❌ Failed  |
```

**Webhook Payload (Simple):**
```json
{
  "event": "message.received",
  "from": "628987654321",
  "message": "Hello!",
  "timestamp": "2025-10-21T10:00:00Z"
}
```

#### **3.2 Simple Dashboard** (Day 4-5)
- [ ] Total messages sent (accumulated)
- [ ] Current month usage vs limit
- [ ] Device status cards
- [ ] Recent activity (last 20 messages)
- [ ] Plan info & upgrade button
- [ ] Simple usage chart (bar chart per month)

#### **3.3 Integration Guides** (Day 6-7)
- [ ] Quick start guide
- [ ] n8n workflow example (screenshot + JSON)
- [ ] Make.com scenario example
- [ ] Google Apps Script example
- [ ] cURL examples

---

### **Phase 4: Polish & Launch** 🚀
**Priority:** HIGH  
**Timeline:** Week 5 (7 hari)  
**Status:** Not Started

#### **4.1 Multi-language (i18n)** (Day 1-2)
- [ ] Install react-i18next
- [ ] Setup language files (id.json, en.json)
- [ ] Language switcher (ID/EN)
- [ ] Translate dashboard UI
- [ ] Translate email templates
- [ ] Translate error messages

#### **4.2 API Documentation** (Day 3-4)
- [ ] OpenAPI/Swagger spec
- [ ] Interactive API explorer
- [ ] Authentication guide
- [ ] Code examples (cURL, JavaScript, Python)
- [ ] Error codes reference
- [ ] Rate limiting guide

#### **4.3 Production Deployment** (Day 5-6)
- [ ] Deploy to Nevacloud VPS
- [ ] Configure Nginx reverse proxy
- [ ] Setup SSL (Let's Encrypt)
- [ ] Configure domains (api.apivro.com, app.apivro.com)
- [ ] Environment variables setup
- [ ] Database migration
- [ ] WAHA Plus deployment

#### **4.4 Testing & Bug Fixes** (Day 7)
- [ ] End-to-end testing
- [ ] Payment flow testing
- [ ] Webhook testing (n8n/Make)
- [ ] Email notifications testing
- [ ] Bug fixes
- [ ] Performance optimization

---

### **Phase 5: Post-Launch (Month 2+)** 📈
**Priority:** MEDIUM  
**Timeline:** After MVP Launch  
**Status:** Future

> **Note:** Implement setelah MVP stable dan ada user feedback.

#### **5.1 Basic Admin Portal** (Week 6-7)
- [ ] Admin login (separate)
- [ ] User list & search
- [ ] Manual limit adjustment
- [ ] Manual plan upgrade
- [ ] View user details
- [ ] System stats (total users, messages, revenue)

#### **5.2 Simple Analytics** (Week 8)
- [ ] API call logs (last 100)
- [ ] Error rate tracking
- [ ] Simple usage charts
- [ ] Export data (CSV)

#### **5.3 Audit Trail** (Week 9)
- [ ] Log important activities
- [ ] Login history
- [ ] Plan changes
- [ ] API key changes
- [ ] Payment history

---

### **❌ REMOVED: Over-Engineering Features**

**Tidak diimplementasikan karena tidak essential untuk MVP:**

1. ❌ **Webhook Management Center** - Terlalu kompleks, cukup simple config
2. ❌ **Real-time Monitoring** - Tidak perlu, simple refresh cukup
3. ❌ **Microservices Architecture** - Over-engineering, monolith dulu
4. ❌ **Advanced Analytics** - Simplified version cukup
5. ❌ **Scheduled Messages** - User bisa pakai n8n/Make
6. ❌ **Contact/Group Management** - API-only service
7. ❌ **IP Whitelist** - Tidak perlu untuk MVP
8. ❌ **2FA for users** - Implement nanti jika perlu
9. ❌ **Custom date range reports** - Simple version dulu
10. ❌ **Webhook replay/retry UI** - n8n/Make handle sendiri


---

## 📋 **MVP Timeline (5 Weeks)**

### **Week 1-2: Core API Features** 🔐
**Status:** In Progress
- ✅ Device management (DONE)
- ⏳ Authentication (Google + GitHub)
- ⏳ API Key Management
- ⏳ Send Message API (text + media)
- ⏳ Message Limits & Counter

**Deliverable:** Working API untuk send messages dengan limit enforcement

### **Week 3: Payment & Notifications** 💳
**Status:** Not Started
- ⏳ Tripay payment integration
- ⏳ Plan management (Free, Basic, Enterprise)
- ⏳ Invoice system (PDF)
- ⏳ Email notifications (Brevo)

**Deliverable:** User bisa subscribe & bayar, auto-upgrade plan

### **Week 4: Webhook & Dashboard** 🔗
**Status:** Not Started
- ⏳ Simple webhook (input URL + test)
- ⏳ Basic dashboard (usage stats)
- ⏳ Integration guides (n8n, Make, Google Apps Script)

**Deliverable:** User bisa integrate dengan n8n/Make untuk chatbot

### **Week 5: Polish & Launch** 🚀
**Status:** Not Started
- ⏳ Multi-language (ID/EN)
- ⏳ API documentation (Swagger)
- ⏳ Production deployment (Nevacloud)
- ⏳ Testing & bug fixes

**Deliverable:** MVP ready untuk beta users!

### **Post-Launch (Month 2+)** 📈
- ⏳ Basic admin portal
- ⏳ Simple analytics
- ⏳ Audit trail
- ⏳ User feedback implementation

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- [ ] 99.9% uptime
- [ ] < 2s QR generation time ✅
- [ ] < 1s message delivery time
- [ ] Support 500+ concurrent users
- [ ] < 100MB memory per session

### **Business Metrics**
- [ ] 500 users by Month 1
- [ ] 40% conversion rate (200 paying users)
- [ ] Rp 2,750,000/month revenue (~$180)
- [ ] Rp 1,200,000/month infrastructure cost (~$80)
- [ ] Rp 1,550,000/month net profit (~$100)
- [ ] 2,000 users by Month 3
- [ ] Rp 14,500,000/month revenue (~$950)

### **User Satisfaction**
- [ ] < 5% churn rate
- [ ] > 4.5/5 user rating
- [ ] < 24h support response time
- [ ] > 80% feature adoption rate

---

## 💰 **Cost Breakdown**

### **Infrastructure (Monthly)**
| Service | Specs | Cost | Status |
|---------|-------|------|--------|
| **VPS** | Nevacloud Enterprise | Rp 0 | ✅ Owned |
| **Database** | Supabase Free (500MB) | Rp 0 | ✅ Active |
| **S3 Storage** | is3.cloudhost.id | Rp 0 | ✅ Owned |
| **SMTP** | Brevo (300 emails/day) | Rp 0 | ✅ Active |
| **Payment Gateway** | Tripay (per transaction) | 0% | ✅ Active |
| **Domain** | Subdomain | Rp 0 | ✅ Owned |
| **SSL** | Let's Encrypt | Rp 0 | Free |
| **WAHA Plus** | Subscription | ~Rp 1,200,000 | 💰 $80/month |
| **Monitoring** | Uptime Kuma (self-hosted) | Rp 0 | Free |
| **Total** | | **~Rp 1,200,000/month** | **~$80/month** |

**Note:** Semua infrastructure sudah dimiliki kecuali WAHA Plus subscription!

### **Revenue Projection (Month 1)**

**Conservative Estimate:**
- 500 users total
- 60% stay on Free plan (300 users) = Rp 0
- 30% upgrade to Basic (150 users) = 150 × Rp 10,000 = Rp 1,500,000
- 10% upgrade to Enterprise (50 users) = 50 × Rp 25,000 = Rp 1,250,000
- **Total Revenue:** Rp 2,750,000/month (~$180/month)
- **Infrastructure Cost:** ~Rp 1,500,000/month (~$100/month)
- **Net Profit:** Rp 1,250,000/month (~$80/month)

**Optimistic Estimate (Month 3-6):**
- 2,000 users total
- 50% stay on Free plan (1,000 users) = Rp 0
- 35% on Basic (700 users) = 700 × Rp 10,000 = Rp 7,000,000
- 15% on Enterprise (300 users) = 300 × Rp 25,000 = Rp 7,500,000
- **Total Revenue:** Rp 14,500,000/month (~$950/month)
- **Infrastructure Cost:** ~Rp 2,000,000/month (~$130/month)
- **Net Profit:** Rp 12,500,000/month (~$820/month)

---

## 📚 **Documentation Status**

### **Completed** ✅
- [x] WAHA Plus Setup Guide
- [x] Docker Commands Reference
- [x] QR Behavior Explanation
- [x] Development Roadmap (this file)

### **Pending** ⏳
- [ ] API Documentation
- [ ] User Guide
- [ ] Admin Guide
- [ ] Deployment Guide
- [ ] Troubleshooting Guide
- [ ] FAQ

---

## 🤝 **Decision Points**

### **Need to Decide:**
1. **Messaging Priority:**
   - Option A: Text only first (faster MVP)
   - Option B: Text + Media together (better UX)
   - **Recommendation:** Option A

2. **Webhook Implementation:**
   - Option A: Basic webhook (receive only)
   - Option B: Full webhook (receive + status updates)
   - **Recommendation:** Option B

3. **Deployment Strategy:**
   - Option A: Single VPS (simpler)
   - Option B: Separate VPS for WAHA & API (scalable)
   - **Recommendation:** Option B

4. **Payment Gateway:**
   - Option A: Xendit (Indonesia focus)
   - Option B: Stripe (global)
   - **Recommendation:** Xendit (target market Indonesia)

---

## 📞 **Support & Resources**

### **WAHA Plus**
- Documentation: https://waha.devlike.pro/docs
- Discord: https://discord.gg/waha
- GitHub: https://github.com/devlikeapro/waha

### **Tech Stack**
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express (or existing stack)
- Database: Supabase (PostgreSQL)
- WhatsApp: WAHA Plus
- Deployment: Docker + Nginx

---

## 🔄 **Update Log**

### **2025-10-21**
- ✅ WAHA Plus integration complete
- ✅ QR code system optimized
- ✅ Device management complete
- ✅ UI/UX improvements done
- ✅ Disconnect feature fixed
- ✅ Documentation created
- 📝 Roadmap created

### **Next Update:** TBD
- [ ] Message sending implementation
- [ ] Production deployment
- [ ] Beta testing results

---

**Last Updated:** October 21, 2025  
**Version:** 1.0  
**Status:** Active Development 🚀
