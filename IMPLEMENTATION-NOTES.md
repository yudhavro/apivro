# Implementation Notes - API VRO

Technical notes and important considerations for implementing the remaining features.

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   React App     │ ← User Interface
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Supabase      │ ← Authentication, Database, Edge Functions
│   - Auth        │
│   - PostgreSQL  │
│   - Edge Funcs  │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌─────────┐ ┌───────────┐ ┌────────────┐
│  WAHA   │ │  Tripay   │ │   Email    │
│ Server  │ │  Gateway  │ │  Service   │
└─────────┘ └───────────┘ └────────────┘
```

## 🔑 Critical Implementation Details

### 1. API Key Security

**Current Implementation:**
```typescript
// Generation (in APIKeysPage.tsx)
const fullKey = `vro_${generateRandomKey(32)}`;
const keyHash = await hashKey(fullKey); // SHA-256
const keyPrefix = fullKey.substring(0, 12);

// Storage
await supabase.from('api_keys').insert({
  key_hash: keyHash,      // Store only hash
  key_prefix: keyPrefix   // Store prefix for display
});
```

**Edge Function Validation (TO DO):**
```typescript
// In edge function
async function validateApiKey(providedKey: string) {
  const keyHash = await hashKey(providedKey);

  const { data } = await supabase
    .from('api_keys')
    .select('id, user_id, device_id, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    throw new Error('Invalid or revoked API key');
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}
```

### 2. Message Limit Enforcement

**Critical Flow:**
```typescript
// Edge function: whatsapp-send
async function sendMessage(req: Request) {
  // 1. Validate API key
  const apiKey = validateApiKey(req);

  // 2. Get active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', apiKey.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!subscription) {
    return error(403, 'No active subscription');
  }

  // 3. Check limit
  const { messages_used, subscription_plans } = subscription;
  const { message_limit } = subscription_plans;

  if (messages_used >= message_limit) {
    return error(429, 'Message limit exceeded', {
      limit: message_limit,
      used: messages_used,
      reset_date: getNextMonthFirst()
    });
  }

  // 4. Send message to WAHA
  const result = await sendToWaha(apiKey.device_id, body);

  // 5. Track message
  await supabase.from('messages').insert({
    user_id: apiKey.user_id,
    device_id: apiKey.device_id,
    subscription_id: subscription.id,
    api_key_id: apiKey.id,
    recipient: body.phone,
    status: 'sent'
  });

  // 6. Increment counter (ATOMIC!)
  await supabase
    .from('subscriptions')
    .update({
      messages_used: messages_used + 1
    })
    .eq('id', subscription.id);

  return success(result);
}
```

**Important:** Use atomic operations to prevent race conditions!

### 3. WAHA Integration

**Server Setup (Docker Compose):**
```yaml
version: '3'
services:
  waha:
    image: devlikeapro/waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      - WHATSAPP_HOOK_URL=https://your-project.supabase.co/functions/v1/whatsapp-webhook
      - WHATSAPP_HOOK_EVENTS=message,message.any,state.change
    volumes:
      - ./waha-sessions:/app/.wwebjs_auth
      - ./waha-files:/app/files
```

**Session Management:**
```typescript
// Start session
async function startSession(deviceId: string) {
  const response = await fetch(`${WAHA_URL}/api/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: deviceId
    })
  });

  return response.json();
}

// Get QR Code
async function getQRCode(deviceId: string) {
  const response = await fetch(`${WAHA_URL}/api/${deviceId}/auth/qr`);
  const data = await response.json();

  // Store QR in database
  await supabase
    .from('devices')
    .update({
      qr_code: data.qr,
      status: 'scanning'
    })
    .eq('session_id', deviceId);

  return data.qr;
}

// Send message
async function sendToWaha(deviceId: string, message: any) {
  const response = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: deviceId,
      chatId: `${message.phone}@c.us`,
      text: message.message
    })
  });

  return response.json();
}
```

### 4. Tripay Payment Integration

**Create Payment Transaction:**
```typescript
// Edge function: tripay-create-payment
async function createPayment(userId: string, planId: string, billingCycle: 'monthly' | 'yearly') {
  const plan = await getPlan(planId);
  const amount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

  // 1. Create signature
  const merchantCode = Deno.env.get('TRIPAY_MERCHANT_CODE');
  const apiKey = Deno.env.get('TRIPAY_API_KEY');
  const privateKey = Deno.env.get('TRIPAY_PRIVATE_KEY');

  const merchantRef = `VRO-${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(merchantCode + merchantRef + amount)
    .digest('hex');

  // 2. Request to Tripay
  const response = await fetch('https://tripay.co.id/api/transaction/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'QRIS', // or other payment method
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: user.full_name,
      customer_email: user.email,
      order_items: [{
        name: `${plan.name} Plan - ${billingCycle}`,
        price: amount,
        quantity: 1
      }],
      callback_url: `https://your-project.supabase.co/functions/v1/tripay-callback`,
      return_url: `https://your-domain.com/payments/success`,
      signature: signature
    })
  });

  const data = await response.json();

  // 3. Store in database
  await supabase.from('payments').insert({
    user_id: userId,
    tripay_reference: data.data.reference,
    amount: amount,
    total_amount: data.data.total_fee,
    fee: data.data.total_fee - amount,
    payment_method: data.data.payment_method,
    payment_name: data.data.payment_name,
    checkout_url: data.data.checkout_url,
    expired_at: data.data.expired_time
  });

  return data;
}
```

**Handle Payment Callback:**
```typescript
// Edge function: tripay-callback
async function handleCallback(req: Request) {
  const body = await req.json();

  // 1. Verify signature
  const callbackSignature = req.headers.get('X-Callback-Signature');
  const privateKey = Deno.env.get('TRIPAY_PRIVATE_KEY');

  const calculatedSignature = crypto
    .createHmac('sha256', privateKey)
    .update(JSON.stringify(body))
    .digest('hex');

  if (callbackSignature !== calculatedSignature) {
    return error(403, 'Invalid signature');
  }

  // 2. Update payment status
  const { reference, status } = body;

  await supabase
    .from('payments')
    .update({
      status: status === 'PAID' ? 'paid' : 'failed',
      paid_at: status === 'PAID' ? new Date().toISOString() : null
    })
    .eq('tripay_reference', reference);

  // 3. If paid, upgrade subscription
  if (status === 'PAID') {
    const payment = await getPayment(reference);

    // Create new subscription or extend existing
    await upgradeSubscription(payment);

    // Generate invoice
    await generateInvoice(payment);

    // Send notification
    await sendPaymentSuccessEmail(payment);
  }

  return success({ message: 'Callback processed' });
}
```

### 5. Monthly Counter Reset

**Scheduled Function (Cron Job):**
```typescript
// Edge function: reset-monthly-counters
// Schedule: Run on 1st of every month at 00:00 UTC
async function resetCounters() {
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('status', 'active');

  const updates = subscriptions.map(sub =>
    supabase
      .from('subscriptions')
      .update({
        messages_used: 0,
        last_reset_at: new Date().toISOString()
      })
      .eq('id', sub.id)
  );

  await Promise.all(updates);

  console.log(`Reset ${subscriptions.length} subscriptions`);
}
```

**Alternative: Database Function (Recommended):**
```sql
-- Create a scheduled function in PostgreSQL
CREATE OR REPLACE FUNCTION reset_monthly_message_counters()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET
    messages_used = 0,
    last_reset_at = now()
  WHERE status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron extension
SELECT cron.schedule(
  'reset-monthly-counters',
  '0 0 1 * *', -- Every 1st of month at midnight
  $$SELECT reset_monthly_message_counters()$$
);
```

### 6. Email Notifications

**SendGrid Integration:**
```typescript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendExpiryReminder(user: User, daysUntilExpiry: number) {
  const msg = {
    to: user.email,
    from: 'noreply@apivro.com',
    templateId: 'd-xxx', // SendGrid template ID
    dynamicTemplateData: {
      name: user.full_name,
      days: daysUntilExpiry,
      renewal_url: 'https://apivro.com/subscription'
    }
  };

  await sgMail.send(msg);
}

export async function sendDeviceDisconnectedAlert(user: User, device: Device) {
  const msg = {
    to: user.email,
    from: 'noreply@apivro.com',
    subject: `Device "${device.name}" has been disconnected`,
    html: `
      <h2>Device Disconnected</h2>
      <p>Your WhatsApp device "${device.name}" has been disconnected.</p>
      <p>Please reconnect your device to continue sending messages.</p>
      <a href="https://apivro.com/devices">Reconnect Device</a>
    `
  };

  await sgMail.send(msg);
}
```

**Expiry Reminder Cron:**
```typescript
// Edge function: send-expiry-reminders
async function sendReminders() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 7-day reminders
  const { data: expiringSoon } = await supabase
    .from('subscriptions')
    .select('*, profiles(*)')
    .eq('status', 'active')
    .gte('end_date', now.toISOString())
    .lte('end_date', in7Days.toISOString());

  for (const sub of expiringSoon) {
    await sendExpiryReminder(sub.profiles, 7);
    await createNotification(sub.user_id, 'expiry_reminder', 7);
  }

  // Similar for 3-day reminders
}
```

### 7. Invoice Generation

**PDF Generation with PDFKit:**
```typescript
import PDFDocument from 'pdfkit';

async function generateInvoice(payment: Payment) {
  const doc = new PDFDocument();
  const invoiceNumber = `INV-${Date.now()}`;

  // Header
  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();

  // Invoice details
  doc.fontSize(12);
  doc.text(`Invoice Number: ${invoiceNumber}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Customer: ${payment.user.full_name}`);
  doc.moveDown();

  // Items
  doc.text('Items:');
  doc.text(`${payment.plan.name} Plan - ${payment.billing_cycle}`);
  doc.text(`Amount: ${formatPrice(payment.amount)}`);
  doc.text(`Fee: ${formatPrice(payment.fee)}`);
  doc.text(`Total: ${formatPrice(payment.total_amount)}`, { bold: true });

  // Convert to buffer
  const buffer = await new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    doc.on('data', chunks.push.bind(chunks));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
  });

  // Upload to Supabase Storage
  const { data } = await supabase.storage
    .from('invoices')
    .upload(`${invoiceNumber}.pdf`, buffer, {
      contentType: 'application/pdf'
    });

  // Store invoice record
  await supabase.from('invoices').insert({
    user_id: payment.user_id,
    payment_id: payment.id,
    invoice_number: invoiceNumber,
    amount: payment.total_amount
  });

  return data.path;
}
```

## 🔒 Security Considerations

### 1. API Rate Limiting
```typescript
// Implement rate limiting per API key
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(apiKeyId: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(apiKeyId);

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(apiKeyId, {
      count: 1,
      resetAt: now + 60000 // 1 minute
    });
    return true;
  }

  if (limit.count >= 60) { // 60 requests per minute
    return false;
  }

  limit.count++;
  return true;
}
```

### 2. Input Validation
```typescript
import { z } from 'zod';

const SendMessageSchema = z.object({
  phone: z.string()
    .regex(/^[1-9][0-9]{7,14}$/, 'Invalid phone number format'),
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message too long')
});

function validateRequest(body: any) {
  return SendMessageSchema.parse(body);
}
```

### 3. CORS Configuration
```typescript
// In Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

## 📊 Monitoring & Logging

### Essential Metrics to Track:
```typescript
// Track these in your monitoring system
interface Metrics {
  api_requests_total: Counter;
  api_request_duration: Histogram;
  api_errors_total: Counter;
  messages_sent_total: Counter;
  message_send_failures: Counter;
  subscription_upgrades: Counter;
  payment_success_rate: Gauge;
  device_connection_rate: Gauge;
  active_users: Gauge;
}
```

### Logging Best Practices:
```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'Message sent successfully',
  userId: apiKey.user_id,
  deviceId: apiKey.device_id,
  recipient: body.phone,
  timestamp: new Date().toISOString()
}));
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test API key validation
describe('API Key Validation', () => {
  it('should validate correct API key', async () => {
    const result = await validateApiKey('vro_valid_key');
    expect(result).toBeDefined();
  });

  it('should reject invalid API key', async () => {
    await expect(validateApiKey('invalid_key')).rejects.toThrow();
  });
});
```

### Integration Tests
```typescript
// Test complete message flow
describe('Send Message Flow', () => {
  it('should send message and track usage', async () => {
    const response = await sendMessage(validApiKey, {
      phone: '628123456789',
      message: 'Test'
    });

    expect(response.status).toBe('sent');

    const usage = await getUsage(userId);
    expect(usage.used).toBe(1);
  });
});
```

## 🚀 Deployment

### Environment Variables Checklist
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Tripay
TRIPAY_MERCHANT_CODE=
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=

# Email
SENDGRID_API_KEY=

# WAHA
WAHA_SERVER_URL=
WAHA_API_KEY=

# App
APP_URL=
```

### Edge Function Deployment
```bash
# Deploy all functions
supabase functions deploy whatsapp-send
supabase functions deploy tripay-create-payment
supabase functions deploy tripay-callback
supabase functions deploy reset-monthly-counters
supabase functions deploy send-expiry-reminders

# Set secrets
supabase secrets set TRIPAY_MERCHANT_CODE=xxx
supabase secrets set TRIPAY_API_KEY=xxx
supabase secrets set TRIPAY_PRIVATE_KEY=xxx
```

---

## 📝 Final Notes

1. **Always test in sandbox first** - Use Tripay sandbox and test phone numbers
2. **Monitor limits closely** - Set up alerts when approaching limits
3. **Backup regularly** - Automated daily backups of database
4. **Document changes** - Keep API docs updated
5. **Security first** - Regular security audits
6. **Performance matters** - Optimize queries and cache when possible
7. **User feedback** - Listen to users and iterate

Good luck with implementation! 🎉
