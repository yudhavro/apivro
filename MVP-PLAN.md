# 🚀 API VRO - MVP Plan (5 Weeks)

**Last Updated:** October 21, 2025  
**Goal:** Launch MVP dengan core features yang benar-benar dibutuhkan user

---

## 🎯 **MVP Scope**

### **✅ MUST HAVE (Core Features)**

1. **Device Management** ✅ (DONE)
   - Add/connect/disconnect device
   - Multi-device (1 untuk Free/Basic, 5 untuk Enterprise)
   - QR scan

2. **Authentication** ✅ (DONE)
   - Google OAuth
   - GitHub OAuth
   - Supabase Auth

3. **API Key Management** ✅ (DONE)
   - Generate/revoke API keys
   - List API keys
   - Last used tracking
   - Delete API keys

4. **Send Message API** ✅ (DONE)
   - Text messages
   - Media messages (image, doc, video, audio)
   - WAHA integration
   - Message counter
   - Quota tracking

5. **Message Limits** ✅ (DONE)
   - Track outbound messages
   - Hard limit enforcement
   - Auto-reset tiap bulan (Lazy Reset)
   - Block API jika limit tercapai

6. **Payment Integration** ✅ (DONE)
   - Tripay integration
   - 5 payment channels (QRIS, VA Mandiri, BRI, BNI, BSI)
   - Auto-upgrade setelah payment
   - Invoice PDF auto-generated & uploaded to S3

7. **Email Notifications** ✅ (DONE)
   - Payment success + invoice ✅
   - Reminder 7 & 3 hari sebelum expired (template ready)
   - Device disconnect alert (template ready)
   - Limit reached notification (template ready)
   - Notification preferences UI ✅

8. **Simple Webhook** ✅ (DONE)
   - Input webhook URL ✅
   - Forward incoming messages ✅
   - Test button ✅
   - Webhook logs page (15 per page with pagination) ✅
   - Stats & filters ✅
   - 7-day retention ✅

9. **Multi-language** 🟡
    - Indonesia & English
---

## ❌ **NOT IN MVP (Over-Engineering)**

1. ❌ Webhook Management Center (terlalu kompleks)
2. ❌ Real-time Monitoring (tidak perlu)
3. ❌ Microservices Architecture (monolith dulu)
4. ❌ Advanced Analytics (simplified version cukup)
5. ❌ Scheduled Messages (user pakai n8n/Make)
6. ❌ Contact/Group Management (API-only)
7. ❌ IP Whitelist (tidak perlu MVP)
8. ❌ 2FA for users (implement nanti)
9. ❌ Webhook replay/retry UI (n8n/Make handle)
10. ❌ Custom date range reports (simple dulu)

---

### **Week 4: Webhook & Dashboard** 🔗
**Days:** 7 hari  
**Status:** Not Started

#### **Day 1-3: Simple Webhook**
- [ ] Webhook URL input per device
- [ ] Receive incoming messages from WAHA
- [ ] Forward to user webhook URL
- [ ] Basic retry (1x)
- [ ] Test webhook button
- [ ] Last 10 calls (simple table)

**Simple UI:**
```
Device: My WhatsApp
Webhook URL: [https://your-webhook.com/endpoint]
[Test Webhook] [Save]

Recent Calls:
| Time  | Event            | Status     |
|-------|------------------|------------|
| 10:00 | message.received | ✅ Success |
```

#### **Day 4-5: Basic Dashboard**
- [ ] Total messages sent (accumulated)
- [ ] Current month usage vs limit
- [ ] Device status cards
- [ ] Recent activity (last 20)
- [ ] Plan info & upgrade button
- [ ] Simple usage chart

#### **Day 6-7: Integration Guides**
- [ ] Quick start guide
- [ ] n8n workflow example (JSON)
- [ ] Make.com scenario example
- [ ] Google Apps Script example
- [ ] cURL examples

**Deliverable:** ✅ User bisa integrate dengan n8n/Make untuk chatbot

---

#### **Day 5-6: Production Deployment**
- [ ] Deploy to Nevacloud VPS
- [ ] Nginx + SSL (Let's Encrypt)
- [ ] Configure domains
- [ ] Environment variables
- [ ] Database migration
- [ ] WAHA Plus deployment

#### **Day 7: Testing & Bug Fixes**
- [ ] End-to-end testing
- [ ] Payment flow testing
- [ ] Webhook testing (n8n/Make)
- [ ] Email testing
- [ ] Bug fixes
- [ ] Performance optimization

**Deliverable:** ✅ MVP ready untuk beta users!

---

## 📊 **Plan Structure**

```
Free Plan:
- 50 messages/month
- 1 device
- Rp 0/bulan (Free Forever)

Basic Plan:
- 1,500 messages/month
- 1 device
- Rp 10,000/bulan atau Rp 100,000/tahun

Enterprise Plan:
- 15,000 messages/month
- 5 devices
- Rp 25,000/bulan atau Rp 250,000/tahun

Auto-reset: Setiap tanggal 1 bulan berikutnya
```

---

## 💰 **Revenue Projection**

### **Month 1 (Conservative)**
- 500 users total
- 60% Free (300 users) = Rp 0
- 30% Basic (150 users) = Rp 1,500,000
- 10% Enterprise (50 users) = Rp 1,250,000
- **Revenue:** Rp 2,750,000 (~$180)
- **Cost:** Rp 1,200,000 (~$80 WAHA Plus)
- **Profit:** Rp 1,550,000 (~$100)

### **Month 3-6 (Optimistic)**
- 2,000 users total
- 50% Free (1,000 users) = Rp 0
- 35% Basic (700 users) = Rp 7,000,000
- 15% Enterprise (300 users) = Rp 7,500,000
- **Revenue:** Rp 14,500,000 (~$950)
- **Cost:** Rp 2,000,000 (~$130)
- **Profit:** Rp 12,500,000 (~$820)

---

## 🎯 **Success Metrics**

### **Technical**
- [ ] 99.9% uptime
- [ ] < 2s QR generation ✅
- [ ] < 1s message delivery
- [ ] Support 500+ concurrent users

### **Business**
- [ ] 500 users by Month 1
- [ ] 40% conversion rate
- [ ] Rp 2,750,000/month revenue
- [ ] < 5% churn rate

---

## 🚀 **Post-Launch (Month 2+)**

**Implement setelah MVP stable:**

1. **Basic Admin Portal** (Week 6-7)
   - Admin login
   - User list & search
   - Manual limit adjustment
   - System stats

2. **Simple Analytics** (Week 8)
   - API call logs
   - Error rate tracking
   - Simple charts
   - Export CSV

3. **Audit Trail** (Week 9)
   - Log important activities
   - Login history
   - Plan changes
   - Payment history

---

## 📚 **Tech Stack**

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express (or existing)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google + GitHub)
- **WhatsApp:** WAHA Plus
- **Payment:** Tripay
- **Email:** Brevo SMTP
- **Storage:** is3.cloudhost.id (S3)
- **Deployment:** Nevacloud VPS + Docker + Nginx

---

## 🎯 **Next Steps**

**Minggu ini:**
1. Setup Authentication (Google + GitHub)
2. Implement API Key Management
3. Start Send Message API

**Minggu depan:**
1. Complete Send Message API
2. Implement Message Limits
3. Start Tripay Integration

---

**Last Updated:** October 21, 2025  
**Version:** 1.0 - MVP Streamlined  
**Status:** Ready to Execute! 🚀
