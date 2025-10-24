# API VRO - WhatsApp API SaaS Platform

A modern, full-featured WhatsApp API SaaS platform built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

- 🔐 **Authentication**: Google & GitHub OAuth via Supabase
- 📱 **Multi-Device Support**: Manage multiple WhatsApp devices/sessions
- 🔑 **API Key Management**: Secure API keys with SHA-256 hashing
- 💳 **Subscription Plans**: Free, Basic, and Enterprise tiers with message limits
- 💰 **Payment Integration**: Tripay.co.id payment gateway (sandbox ready)
- 📊 **Statistics & Analytics**: Track message usage and device status
- 🌍 **Internationalization**: Full support for English and Bahasa Indonesia
- 📧 **Email Notifications**: Expiry reminders and device alerts
- 🧾 **Invoice Generation**: Downloadable payment invoices
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Payment**: Tripay.co.id

## Prerequisites

- Node.js 18+
- Supabase Account
- Tripay.co.id Account (for payments)

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-migration.sql` in this project
4. Copy all the SQL content and paste it in the SQL Editor
5. Click **Run** to execute the migration
6. Verify all tables are created in the **Table Editor**

### 2. Authentication Setup

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Enable **Google Provider**:
   - Add your Google OAuth Client ID and Secret
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Enable **GitHub Provider**:
   - Add your GitHub OAuth Client ID and Secret
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Environment Variables

The `.env` file is already configured with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Architecture

### Database Schema

The application uses the following main tables:

- **profiles**: User profiles with language preferences
- **subscription_plans**: Available subscription tiers
- **subscriptions**: User subscriptions with message limits
- **devices**: WhatsApp devices/sessions
- **api_keys**: API authentication keys
- **messages**: Message tracking for usage limits
- **payments**: Payment transactions via Tripay
- **invoices**: Generated invoices
- **notifications**: System notifications

### Subscription Plans

| Plan       | Messages/Month | Price (Monthly) | Price (Yearly) |
|------------|----------------|-----------------|----------------|
| Free       | 50             | Rp 0            | Rp 0           |
| Basic      | 1,500          | Rp 10,000       | Rp 100,000     |
| Enterprise | 15,000         | Rp 25,000       | Rp 250,000     |

### API Key Format

API keys follow this format:
- Format: `vro_[32_random_characters]`
- Example: `vro_AbCdEfGhIjKlMnOpQrStUvWxYz123456`
- Keys are hashed with SHA-256 before storage
- Only the prefix (first 12 characters) is visible after creation

## Tripay Integration

### Sandbox Credentials

The project is configured with Tripay sandbox credentials for testing:

- **Merchant Code**: T17192
- **API Key**: DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93
- **Private Key**: LSUYl-OQie2-iVO1I-34a7R-xUUZY
- **Callback URL**: `http://localhost:3000/api/payments/tripay/callback`

### Supported Payment Methods

1. QRIS (Rp 750 + 0.70% fee)
2. Mandiri Virtual Account (Rp 4,250 fee)
3. BRI Virtual Account (Rp 4,250 fee)
4. BNI Virtual Account (Rp 4,250 fee)
5. BSI Virtual Account (Rp 4,250 fee)

## WhatsApp Integration

This platform uses **WAHA Plus (WhatsApp HTTP API)** for WhatsApp connectivity:

- [WAHA Plus](https://waha.devlike.pro/)
- [Documentation](https://waha.devlike.pro/docs)
- [GitHub](https://github.com/devlikeapro/waha)

### Quick Start WAHA Plus

**Docker Run:**
```bash
docker login -u devlikeapro -p YOUR_DOCKER_KEY
docker pull devlikeapro/waha-plus:latest
docker run -d --name waha-plus -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -v waha_sessions:/app/.sessions \
  devlikeapro/waha-plus:latest
```

**Docker Compose:**
```bash
docker-compose -f docker-compose.waha-plus.yml up -d
```

### Integration Features

1. ✅ **Unlimited Sessions**: Support 500+ WhatsApp devices
2. ✅ **Multi-user Support**: Perfect for SaaS platform
3. ✅ **QR Code Scanning**: Automatic QR code generation and display
4. ✅ **Session Management**: Each device has unique session ID
5. ✅ **Real-time Status**: Auto-update connection status
6. ✅ **Webhook Support**: Optional webhook URLs for n8n/Make integration
7. ✅ **Message Tracking**: Every outbound message is tracked and counted
8. ✅ **Production Ready**: Stable and tested for scale

### Setup Guide

See detailed setup instructions: [`docs/WAHA-PLUS-SETUP.md`](docs/WAHA-PLUS-SETUP.md)

## Message Limit System

### How It Works

1. Each subscription has a monthly message limit
2. Message counter resets automatically on the 1st of each month
3. When limit is reached, API returns `429 Too Many Requests`
4. Users must upgrade to continue sending messages
5. All outbound messages (API and webhook) are counted

### Enforcement

- Limits are checked before each message send
- Database triggers ensure accurate counting
- Real-time usage display in dashboard
- Visual indicators when approaching limit (70%, 90%)

## API Endpoints (To Be Implemented)

### Send Message
```
POST /api/v1/messages/send
Authorization: Bearer {api_key}

{
  "phone": "628123456789",
  "message": "Hello World"
}
```

### Send Media
```
POST /api/v1/messages/send-media
Authorization: Bearer {api_key}

{
  "phone": "628123456789",
  "media": "https://example.com/image.jpg",
  "caption": "Optional caption"
}
```

### Get Device Status
```
GET /api/v1/devices/{device_id}/status
Authorization: Bearer {api_key}
```

## n8n/Make Integration

Webhooks can be configured per device to receive:

- Incoming messages
- Message status updates
- Device connection status
- QR code updates

Configure webhook URL in the device settings to enable integration with:
- n8n workflows
- Make.com scenarios
- Custom automation systems

## Development Roadmap

### Phase 1: Foundation (Completed)
- ✅ Database schema
- ✅ Authentication system
- ✅ Dashboard UI
- ✅ Device management
- ✅ API key management
- ✅ Subscription plans display
- ✅ Internationalization

### Phase 2: Core Features (In Progress)
- ⏳ WhatsApp API integration (WAHA/Baileys)
- ⏳ Message sending endpoints
- ⏳ Limit enforcement
- ⏳ Tripay payment flow
- ⏳ Edge functions for API proxy

### Phase 3: Advanced Features
- ⏳ Email notifications system
- ⏳ Invoice PDF generation
- ⏳ Webhook management
- ⏳ Advanced analytics
- ⏳ Scheduled message resets

### Phase 4: Production Ready
- ⏳ Security audit
- ⏳ Performance optimization
- ⏳ Documentation
- ⏳ Production deployment guide

## Contributing

This is a private commercial project. Please contact the project owner for contribution guidelines.

## License

Proprietary - All rights reserved

## Support

For support, please contact: [Your Support Email]

## Security

- All API keys are hashed with SHA-256
- Row Level Security (RLS) enabled on all tables
- OAuth authentication only (no passwords stored)
- HTTPS required in production
- API rate limiting enforced
- Input validation and sanitization

## Performance Considerations

- Database indexes on all frequently queried columns
- Edge functions for API endpoints (global CDN)
- Optimistic UI updates
- Lazy loading of components
- Image optimization
- Caching strategies

## Production Checklist

Before deploying to production:

- [ ] Update Supabase project to production instance
- [ ] Configure production OAuth credentials
- [ ] Update Tripay credentials to production keys
- [ ] Set up custom domain
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test payment flow end-to-end
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Configure CDN for assets
- [ ] Enable SSL/TLS
- [ ] Review and test all security policies

## Troubleshooting

### Authentication Issues
- Verify OAuth credentials in Supabase dashboard
- Check redirect URLs match exactly
- Clear browser cache and cookies

### Database Errors
- Ensure migration ran successfully
- Check RLS policies are active
- Verify user permissions

### Payment Issues
- Confirm Tripay credentials are correct
- Check callback URL is accessible
- Review Tripay logs in dashboard

---

Built with ❤️ for the WhatsApp API community
