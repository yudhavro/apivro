# 💳 Payment Integration - Complete Guide

**Last Updated:** October 22, 2025

---

## 🎯 **Overview**

API VRO menggunakan **Tripay Payment Gateway** untuk memproses pembayaran subscription dengan 5 metode pembayaran yang tersedia.

---

## ✅ **Features Implemented**

### **1. Tripay Integration** ✅
- ✅ Sandbox & Production mode support
- ✅ 5 Payment channels (QRIS, VA Mandiri, BRI, BNI, BSI)
- ✅ Automatic fee calculation
- ✅ Secure signature verification
- ✅ Webhook callback handling

### **2. Payment Flow** ✅
- ✅ Create payment transaction
- ✅ Redirect to Tripay checkout
- ✅ Receive payment callback
- ✅ Auto-upgrade subscription
- ✅ Generate & upload invoice to S3

### **3. Invoice Generation** ✅
- ✅ PDF invoice auto-generated
- ✅ Upload to S3 storage (is3.cloudhost.id)
- ✅ Public URL for download
- ✅ Professional invoice template

---

## 📊 **Payment Channels**

| Channel | Name | Fee Type | Fee |
|---------|------|----------|-----|
| **QRIS** | QRIS | Customer | Rp 750 + 0.7% |
| **MANDIRIVA** | Mandiri Virtual Account | Customer | Rp 4.250 |
| **BRIVA** | BRI Virtual Account | Customer | Rp 4.250 |
| **BNIVA** | BNI Virtual Account | Customer | Rp 4.250 |
| **BSIVA** | BSI Virtual Account | Customer | Rp 4.250 |

---

## 🔄 **Payment Flow Diagram**

```
1. User clicks "Upgrade Plan" di /subscription
   ↓
2. Frontend calls POST /api/v1/payments/create
   {
     "plan_id": "uuid",
     "payment_method": "QRIS"
   }
   ↓
3. Backend creates payment via Tripay API
   ↓
4. Backend saves payment to database (status: pending)
   ↓
5. Backend returns checkout_url
   ↓
6. Frontend redirects user to Tripay checkout page
   ↓
7. User completes payment (QRIS scan, VA transfer, etc)
   ↓
8. Tripay sends callback to POST /api/v1/payments/tripay/callback
   ↓
9. Backend verifies signature
   ↓
10. Backend updates payment status to "paid"
    ↓
11. Backend upgrades subscription
    ↓
12. Backend generates PDF invoice
    ↓
13. Backend uploads invoice to S3
    ↓
14. Backend updates payment with invoice_url
    ↓
15. User can download invoice from /subscription/history
```

---

## 📝 **Database Schema**

### **Payments Table**

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  plan_id uuid REFERENCES subscription_plans(id),
  
  -- Tripay fields
  tripay_reference varchar(50) UNIQUE,
  tripay_merchant_ref varchar(100),
  tripay_payment_method varchar(50),
  payment_name text,
  payment_code varchar(50),
  
  -- Amount fields
  amount bigint,
  fee_merchant bigint,
  fee_customer bigint,
  total_amount bigint,
  
  -- Payment details
  status text CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refund')),
  payment_url text,
  checkout_url text,
  qr_url text,
  pay_code text,
  pay_url text,
  
  -- Invoice
  invoice_url text,
  invoice_number varchar(100),
  
  -- Timestamps
  created_at timestamptz,
  paid_at timestamptz,
  expired_at timestamptz,
  updated_at timestamptz,
  
  -- Metadata
  metadata jsonb
);
```

---

## 🚀 **API Endpoints**

### **1. Get Payment Channels**

```http
GET /api/v1/payments/channels
```

**Response:**
```json
{
  "success": true,
  "channels": [
    {
      "code": "QRIS",
      "name": "QRIS",
      "fee_type": "customer",
      "fee": 750,
      "fee_percent": 0.7
    },
    ...
  ]
}
```

---

### **2. Create Payment**

```http
POST /api/v1/payments/create
Headers:
  X-API-Key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "plan_id": "uuid-of-plan",
  "payment_method": "QRIS"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "reference": "T123456789",
    "amount": 10750,
    "status": "pending",
    "payment_method": "QRIS",
    "checkout_url": "https://tripay.co.id/checkout/T123456789",
    "qr_url": "https://tripay.co.id/qr/T123456789",
    "expired_at": "2025-10-23T00:00:00Z"
  }
}
```

---

### **3. Tripay Callback (Webhook)**

```http
POST /api/v1/payments/tripay/callback
Headers:
  X-Callback-Signature: signature-from-tripay
  Content-Type: application/json

Body: (dari Tripay)
{
  "reference": "T123456789",
  "merchant_ref": "APIVRO-1234567890-abc123",
  "status": "PAID",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "message": "Callback processed"
}
```

---

### **4. Get Payment Detail**

```http
GET /api/v1/payments/:reference
Headers:
  X-API-Key: YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "tripay_reference": "T123456789",
    "amount": 10000,
    "total_amount": 10750,
    "status": "paid",
    "invoice_url": "https://is3.cloudhost.id/ngirimwa/invoices/2025/INV-123.pdf",
    ...
  }
}
```

---

## 🔧 **Configuration**

### **Environment Variables**

```env
# Tripay Payment Gateway
TRIPAY_API_KEY=DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93
TRIPAY_PRIVATE_KEY=LSUYl-OQie2-iVO1I-34a7R-xUUZY
TRIPAY_MERCHANT_CODE=T17192
TRIPAY_MODE=sandbox  # or 'production'

# S3 Storage (is3.cloudhost.id)
S3_ENDPOINT=https://is3.cloudhost.id
S3_REGION=jakarta
S3_BUCKET=ngirimwa
S3_ACCESS_KEY=YVJ0DH7JOABV38WPY07J
S3_SECRET_KEY=pH2kA2bdLSlmGCZHfIyejyTLR0AnaUwbbyyjBwXx
```

---

## 📄 **Invoice Generation**

### **PDF Invoice Template**

Invoice PDF includes:
- ✅ Invoice number & date
- ✅ Customer details
- ✅ Plan details
- ✅ Amount breakdown (subtotal + fee)
- ✅ Payment method
- ✅ Payment status (PAID)
- ✅ Company branding

### **S3 Storage Structure**

```
ngirimwa/
├── invoices/
│   ├── 2025/
│   │   ├── INV-1729612345-abc123.pdf
│   │   ├── INV-1729612346-def456.pdf
│   │   └── ...
│   └── 2026/
│       └── ...
└── media/
    └── ...
```

---

## 🧪 **Testing**

### **Test 1: Create Payment (Sandbox)**

```bash
curl -X POST http://localhost:3001/api/v1/payments/create \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PLAN_UUID",
    "payment_method": "QRIS"
  }'
```

### **Test 2: Simulate Callback**

```bash
# Get signature from Tripay dashboard
curl -X POST http://localhost:3001/api/v1/payments/tripay/callback \
  -H "X-Callback-Signature: SIGNATURE_FROM_TRIPAY" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "T123456789",
    "status": "PAID",
    ...
  }'
```

### **Test 3: Check Invoice**

```bash
# After payment success, check invoice URL
curl http://localhost:3001/api/v1/payments/T123456789 \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 📊 **Monitoring**

### **Check Payment Status**

```sql
SELECT 
  p.tripay_reference,
  p.status,
  p.total_amount,
  p.payment_name,
  p.invoice_url,
  p.created_at,
  p.paid_at,
  u.email
FROM payments p
JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### **Check Failed Payments**

```sql
SELECT 
  tripay_reference,
  status,
  total_amount,
  payment_name,
  created_at,
  expired_at
FROM payments
WHERE status IN ('failed', 'expired')
ORDER BY created_at DESC;
```

---

## 🔒 **Security**

### **Signature Verification**

Semua callback dari Tripay diverifikasi dengan HMAC SHA256:

```typescript
function verifyCallbackSignature(json: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(json)
    .digest('hex');
  return hash === signature;
}
```

### **API Key Authentication**

Semua payment endpoints (kecuali callback) memerlukan API key:

```typescript
Headers: {
  'X-API-Key': 'apivro_live_xxx'
}
```

---

## 🚨 **Error Handling**

### **Common Errors**

| Error Code | Message | Solution |
|------------|---------|----------|
| `MISSING_FIELDS` | plan_id and payment_method required | Provide both fields |
| `PLAN_NOT_FOUND` | Subscription plan not found | Check plan_id |
| `PAYMENT_CREATION_FAILED` | Failed to create payment | Check Tripay credentials |
| `INVALID_SIGNATURE` | Invalid callback signature | Verify TRIPAY_PRIVATE_KEY |
| `PAYMENT_NOT_FOUND` | Payment not found | Check reference |

---

## 📚 **References**

- **Tripay Documentation:** https://tripay.co.id/developer
- **Tripay Dashboard:** https://tripay.co.id/member
- **S3 Documentation:** https://is3.cloudhost.id/docs

---

## ✅ **Summary**

| Feature | Status | Notes |
|---------|--------|-------|
| Tripay Integration | ✅ DONE | Sandbox & Production ready |
| Payment Channels | ✅ DONE | 5 channels available |
| Payment Callback | ✅ DONE | Webhook verified |
| Auto-upgrade | ✅ DONE | Subscription upgraded on payment |
| Invoice Generation | ✅ DONE | PDF auto-generated |
| S3 Upload | ✅ DONE | Invoice stored in S3 |
| Payment History | ✅ DONE | UI at /subscription/history |

**Payment Integration is PRODUCTION READY!** 🎉
