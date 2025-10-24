# Setup Guide - API VRO SaaS Platform

This guide will walk you through setting up the API VRO WhatsApp API SaaS platform from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Authentication Configuration](#authentication-configuration)
4. [Local Development](#local-development)
5. [Tripay Payment Setup](#tripay-payment-setup)
6. [WhatsApp Integration](#whatsapp-integration)
7. [Production Deployment](#production-deployment)

## Prerequisites

Before starting, ensure you have:

- Node.js 18 or higher installed
- A Supabase account (free tier is fine for development)
- A Tripay.co.id account (sandbox for testing, verified account for production)
- Git installed on your machine

## Database Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project details:
   - Name: `api-vro` (or your preferred name)
   - Database Password: (generate a secure password)
   - Region: Choose closest to your users
   - Pricing Plan: Free (or Pro for production)
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

### Step 2: Run Database Migration

1. In your Supabase project dashboard, click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase-migration.sql` from this project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **RUN** button (bottom right)
7. You should see "Success. No rows returned" message

### Step 3: Verify Database Setup

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - `profiles`
   - `subscription_plans`
   - `subscriptions`
   - `devices`
   - `api_keys`
   - `messages`
   - `payments`
   - `invoices`
   - `notifications`

3. Click on `subscription_plans` table
4. You should see 3 rows: Free, Basic, and Enterprise plans

### Step 4: Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API**
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long JWT token)

4. Update your `.env` file:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Authentication Configuration

### Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: API VRO
   - Support email: your email
   - Developer contact: your email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: API VRO
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**

8. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Find **Google**
   - Toggle **Enable**
   - Paste your Client ID and Client Secret
   - Click **Save**

### Setup GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in details:
   - Application name: API VRO
   - Homepage URL: `http://localhost:5173` (for dev)
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret**
7. Copy **Client Secret**

8. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Find **GitHub**
   - Toggle **Enable**
   - Paste your Client ID and Client Secret
   - Click **Save**

## Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 3: Test Authentication

1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Click "Continue with Google" or "Continue with GitHub"
4. Complete the OAuth flow
5. You should be redirected to the dashboard

### Step 4: Verify User Creation

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. You should see your user listed
3. Go to **Table Editor** → **profiles**
4. You should see a profile row with your user ID
5. Go to **subscriptions** table
6. You should see an active Free plan subscription

## Tripay Payment Setup

### Sandbox Testing (Development)

The project is pre-configured with Tripay sandbox credentials:

```
Merchant Code: T17192
API Key: DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93
Private Key: LSUYl-OQie2-iVO1I-34a7R-xUUZY
```

These credentials are for testing only and use fake payment channels.

### Production Setup

1. Go to [https://tripay.co.id](https://tripay.co.id)
2. Register and complete KYC verification
3. Once verified, go to **Settings** → **API Keys**
4. Copy your Production credentials:
   - Merchant Code
   - API Key
   - Private Key

5. Store these in environment variables (never commit to git):
```env
TRIPAY_MERCHANT_CODE=your-merchant-code
TRIPAY_API_KEY=your-api-key
TRIPAY_PRIVATE_KEY=your-private-key
```

### Configure Payment Channels

1. In Tripay Dashboard, go to **Payment Channels**
2. Enable desired channels:
   - QRIS (recommended)
   - Virtual Accounts (BCA, Mandiri, BRI, BNI)
   - E-Wallet (optional)
3. Set fee structure:
   - Customer bears fee (recommended)
   - Merchant bears fee
   - Split fee

## WhatsApp Integration

### Option 1: Using WAHA (Recommended)

WAHA is a production-ready WhatsApp HTTP API built on Baileys.

1. **Deploy WAHA Server**

```bash
docker run -it -p 3000:3000/tcp devlikeapro/waha
```

Or use Docker Compose:

```yaml
version: '3'
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WHATSAPP_HOOK_URL=https://your-api-vro.com/webhooks/whatsapp
    volumes:
      - ./waha-sessions:/app/.wwebjs_auth
```

2. **Start a Session**

```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'
```

3. **Get QR Code**

```bash
curl http://localhost:3000/api/sessions/default/qr
```

### Option 2: Using Baileys Directly

1. Create a new Node.js server
2. Install Baileys:

```bash
npm install @whiskeysockets/baileys
```

3. Implement session management
4. Expose HTTP endpoints for sending messages
5. Handle webhooks for incoming messages

### Integration with API VRO

1. Create Supabase Edge Function to proxy requests:

```typescript
// supabase/functions/whatsapp-send/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Validate API key
  // Check message limits
  // Forward to WAHA/Baileys server
  // Track message in database
})
```

2. Deploy edge function:
```bash
supabase functions deploy whatsapp-send
```

## Production Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Using Vercel:**

```bash
npm install -g vercel
vercel
```

2. **Using Netlify:**

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables

Set these in your deployment platform:

```
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Database Migration to Production

1. Create a new Supabase project for production
2. Run the same migration SQL
3. Update OAuth redirect URLs to production domain
4. Update environment variables

### Post-Deployment Checklist

- [ ] Test Google OAuth login
- [ ] Test GitHub OAuth login
- [ ] Create test device
- [ ] Generate test API key
- [ ] Test subscription upgrade (with sandbox Tripay)
- [ ] Verify email notifications work
- [ ] Test message limit enforcement
- [ ] Review security policies
- [ ] Set up monitoring (Sentry/LogRocket)
- [ ] Configure CDN for assets
- [ ] Set up backup strategy
- [ ] Enable SSL certificate
- [ ] Configure custom domain
- [ ] Test on mobile devices

## Common Issues & Solutions

### Issue: OAuth redirect not working

**Solution:**
- Verify redirect URLs match exactly in OAuth provider settings
- Check that URLs include protocol (https://)
- Ensure no trailing slashes

### Issue: Database RLS errors

**Solution:**
- Verify user is authenticated
- Check RLS policies are enabled
- Review policy conditions match your user_id

### Issue: "User already registered" error

**Solution:**
- This is expected if email is already in use
- Check Supabase Authentication → Users
- Delete test users if needed

### Issue: Payment callback not received

**Solution:**
- Ensure callback URL is publicly accessible (use ngrok for local testing)
- Check Tripay dashboard for callback logs
- Verify callback signature validation

### Issue: WhatsApp QR code not generating

**Solution:**
- Check WAHA/Baileys server is running
- Verify session_id is unique
- Check server logs for errors

## Security Best Practices

1. **Never commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Use environment variables
   - Rotate keys regularly

2. **Enable Row Level Security:**
   - All tables should have RLS enabled
   - Test policies thoroughly
   - Use service role only for admin operations

3. **API Key Security:**
   - Hash keys before storing
   - Show full key only once
   - Allow users to revoke keys

4. **Rate Limiting:**
   - Implement rate limits on API endpoints
   - Use Supabase's built-in rate limiting
   - Monitor for abuse

5. **Input Validation:**
   - Validate all user inputs
   - Sanitize data before storage
   - Use TypeScript for type safety

## Monitoring & Maintenance

### Set up monitoring:

1. **Supabase Dashboard:**
   - Monitor database usage
   - Check API logs
   - Review auth logs

2. **Error Tracking (Optional):**
   - Sentry for error tracking
   - LogRocket for session replay
   - PostHog for analytics

3. **Uptime Monitoring:**
   - UptimeRobot
   - Pingdom
   - StatusCake

### Regular maintenance tasks:

- Weekly: Review error logs
- Monthly: Check database performance
- Monthly: Review and optimize queries
- Quarterly: Security audit
- Quarterly: Dependency updates

## Support

For technical support:
- GitHub Issues: [Your repo URL]
- Email: [Your support email]
- Documentation: [Your docs URL]

## Next Steps

After completing setup:

1. Test all features thoroughly
2. Customize branding and content
3. Set up production OAuth credentials
4. Deploy WhatsApp API server
5. Configure production payment gateway
6. Set up custom domain
7. Launch to users!

---

Good luck with your API VRO deployment! 🚀
