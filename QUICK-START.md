# 🚀 Quick Start Guide - API VRO

## 📋 Prerequisites

1. Node.js 18+ installed
2. Supabase account & project
3. WAHA Plus subscription key

---

## ⚙️ Setup

### **1. Clone & Install**

```bash
git clone <your-repo>
cd waapivro
npm install
```

### **2. Environment Variables**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WAHA Plus
WAHA_URL=http://localhost:3000

# Server
PORT=3001
```

### **3. Database Setup**

Run migrations in Supabase SQL Editor:

```bash
# 1. Main schema
database/supabase-migration.sql

# 2. Increment function
database/increment-messages-function.sql
```

### **4. Start WAHA Plus**

```bash
docker login -u devlikeapro -p <your-subscription-key> cr.waha.devlike.pro

docker run -d \
  --name waha-plus \
  -p 3000:3000 \
  -e WAHA_PRINT_QR=false \
  -v ~/.waha:/app/.sessions \
  --restart unless-stopped \
  cr.waha.devlike.pro/waha-plus
```

### **5. Start Development Servers**

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend API:**
```bash
npm run dev:server
```

**Or run both:**
```bash
npm run dev:all
```

---

## 🎯 Usage

### **1. Register & Login**

1. Open `http://localhost:5173`
2. Click "Sign in with Google" or "Sign in with GitHub"
3. Complete OAuth flow

### **2. Connect Device**

1. Go to **Devices** page
2. Click **Add Device**
3. Scan QR code with WhatsApp
4. Wait for "Connected" status

### **3. Create API Key**

1. Go to **API Keys** page
2. Click **Create API Key**
3. Enter name (e.g., "Production Key")
4. Select your connected device
5. **Copy the key** (shown only once!)

### **4. Send Your First Message**

```bash
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "628123456789",
    "message": "Hello from API VRO! 🚀"
  }'
```

**Response:**
```json
{
  "success": true,
  "message_id": "wamid.xxx",
  "recipient": "628123456789",
  "quota_remaining": 49,
  "quota_used": 1,
  "quota_limit": 50,
  "timestamp": "2025-10-21T16:00:00Z"
}
```

### **5. Check Quota**

```bash
curl http://localhost:3001/api/v1/messages/quota \
  -H "X-API-Key: apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Response:**
```json
{
  "success": true,
  "quota_used": 1,
  "quota_limit": 50,
  "quota_remaining": 49,
  "plan": "Free",
  "reset_date": "2025-11-01T00:00:00Z"
}
```

---

## 📡 API Endpoints

### **Send Text Message**

```bash
POST /api/v1/messages/send
Headers: X-API-Key: your_api_key

Body:
{
  "to": "628123456789",
  "message": "Your message here"
}
```

### **Send Media Message**

```bash
POST /api/v1/messages/send
Headers: X-API-Key: your_api_key

Body:
{
  "to": "628123456789",
  "message": "Check this image!",
  "media": {
    "url": "https://example.com/image.jpg",
    "mimetype": "image/jpeg",
    "filename": "image.jpg"
  }
}
```

### **Get Quota**

```bash
GET /api/v1/messages/quota
Headers: X-API-Key: your_api_key
```

---

## 🔗 Integration Examples

### **JavaScript/Node.js**

```javascript
const apiKey = 'apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

async function sendMessage(to, message) {
  const response = await fetch('http://localhost:3001/api/v1/messages/send', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, message })
  });
  
  return response.json();
}

// Usage
const result = await sendMessage('628123456789', 'Hello!');
console.log(result);
```

### **Python**

```python
import requests

API_KEY = 'apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
API_URL = 'http://localhost:3001/api/v1/messages/send'

def send_message(to, message):
    headers = {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
    data = {
        'to': to,
        'message': message
    }
    response = requests.post(API_URL, headers=headers, json=data)
    return response.json()

# Usage
result = send_message('628123456789', 'Hello from Python!')
print(result)
```

### **PHP**

```php
<?php
$apiKey = 'apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
$apiUrl = 'http://localhost:3001/api/v1/messages/send';

function sendMessage($to, $message) {
    global $apiKey, $apiUrl;
    
    $data = [
        'to' => $to,
        'message' => $message
    ];
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$result = sendMessage('628123456789', 'Hello from PHP!');
print_r($result);
?>
```

---

## 🐛 Troubleshooting

### **Device Not Connected**

**Error:**
```json
{
  "success": false,
  "error": "DEVICE_NOT_CONNECTED",
  "message": "Device is not connected."
}
```

**Solution:**
1. Go to Devices page
2. Check device status
3. Reconnect if needed

### **Message Limit Reached**

**Error:**
```json
{
  "success": false,
  "error": "MESSAGE_LIMIT_REACHED",
  "message": "Monthly message limit reached.",
  "quota_used": 50,
  "quota_limit": 50
}
```

**Solution:**
1. Upgrade your plan
2. Or wait until next month (auto-reset tanggal 1)

### **Invalid API Key**

**Error:**
```json
{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "Invalid or inactive API key."
}
```

**Solution:**
1. Check API key format (must start with `apivro`)
2. Verify key is active (not revoked)
3. Create new API key if needed

---

## 📚 Next Steps

1. ✅ Read full [API Documentation](./API-DOCUMENTATION.md)
2. ✅ Setup [Webhooks](./API-DOCUMENTATION.md#webhooks) for incoming messages
3. ✅ Integrate with [n8n](./API-DOCUMENTATION.md#n8n-workflow) or [Make.com](./API-DOCUMENTATION.md#makecom-integration)
4. ✅ Implement [error handling](./API-DOCUMENTATION.md#error-handling)
5. ✅ Monitor [usage](./API-DOCUMENTATION.md#monitoring-usage)

---

## 🆘 Need Help?

- 📖 Documentation: [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)
- 🗺️ Roadmap: [ROADMAP.md](./ROADMAP.md)
- 📋 MVP Plan: [MVP-PLAN.md](./MVP-PLAN.md)
- 🐳 Docker Commands: [DOCKER-COMMANDS.md](./DOCKER-COMMANDS.md)

---

**Happy coding! 🚀**
