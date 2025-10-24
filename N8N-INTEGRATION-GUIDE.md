# 🔗 Panduan Integrasi API VRO dengan n8n

## 🚀 Quick Start Checklist

**Untuk Anda yang sudah punya n8n online (flow.yudhavro.com):**

- [ ] **1. Paste Webhook URL dari n8n ke API VRO**
  - Copy webhook URL dari n8n
  - Edit device di API VRO → Paste webhook URL
  - Test webhook
  
- [ ] **2. Buat API Key di API VRO**
  - Pergi ke API Keys page
  - Create new key untuk n8n
  - Copy & simpan API key
  
- [ ] **3. Setup ngrok (untuk send message dari n8n)**
  - Install ngrok: `sudo snap install ngrok`
  - Run: `ngrok http 3001`
  - Copy ngrok URL untuk n8n
  
- [ ] **4. Setup AI API Keys**
  - DeepSeek: https://platform.deepseek.com
  - Gemini: https://makersuite.google.com/app/apikey
  
- [ ] **5. Buat Workflow Chatbot di n8n**
  - Ikuti panduan lengkap di section [Chatbot AI](#chatbot-ai-dengan-deepseek--gemini)
  
- [ ] **6. Test Chatbot**
  - Kirim: `@deepseek Halo`
  - Kirim: `@gemini Halo`

**Lanjut ke panduan lengkap di bawah** ⬇️

---

## 📋 Daftar Isi
- [Quick Start Checklist](#quick-start-checklist)
- [Pengenalan](#pengenalan)
- [Apakah Bisa Testing di Localhost?](#apakah-bisa-testing-di-localhost)
- [Setup n8n](#setup-n8n-online-flowyudhavrocom)
- [Integrasi dengan API VRO](#integrasi-api-vro-dengan-n8n-online)
- [Chatbot AI dengan DeepSeek & Gemini](#chatbot-ai-dengan-deepseek--gemini)
- [Workflow Examples](#workflow-examples-lainnya)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Pengenalan

**API VRO** adalah platform SaaS WhatsApp API yang memungkinkan Anda mengirim dan menerima pesan WhatsApp melalui API. Dengan integrasi n8n, Anda dapat membuat automasi powerful seperti:

- 📨 Auto-reply pesan WhatsApp
- 🤖 Chatbot dengan AI
- 📊 Kirim notifikasi dari database/CRM
- 🔄 Sinkronisasi data antar platform
- 📧 Forward pesan WhatsApp ke email/Telegram/Discord

---

## ✅ Apakah Bisa Testing di Localhost?

### **JAWABAN: YA, BISA! 🎉**

Anda **BISA** menggunakan n8n online (cloud) dengan API VRO yang masih di localhost. Ada 2 skenario:

### **Skenario 1: n8n Online + API VRO Localhost** ⭐ (RECOMMENDED)

```
WhatsApp Message
    ↓
WAHA Plus (localhost:3000)
    ↓
API VRO Backend (localhost:3001)
    ↓
n8n Webhook (flow.yudhavro.com) ← ONLINE
    ↓
Your Automation Workflow
```

**Cara Kerja:**
- API VRO di localhost **BISA** kirim webhook ke n8n online
- n8n online **BISA** kirim balik ke API VRO localhost
- Menggunakan **ngrok/cloudflare tunnel** TIDAK diperlukan untuk webhook keluar
- Hanya perlu expose API VRO jika n8n perlu call balik (opsional)

**Keuntungan:**
- ✅ n8n selalu online 24/7
- ✅ Webhook tidak hilang saat komputer sleep
- ✅ Bisa akses workflow dari mana saja
- ✅ Cocok untuk development & production

### **Skenario 2: Semua di Localhost**

```
WhatsApp Message
    ↓
WAHA Plus (localhost:3000)
    ↓
API VRO Backend (localhost:3001)
    ↓
n8n Webhook (localhost:5678)
    ↓
Your Automation Workflow
```

**Syarat:**
- Semua service berjalan di komputer yang sama
- Webhook URL: `http://localhost:5678/webhook/...`

**Untuk panduan ini, kita fokus ke Skenario 1 (n8n Online)** ⭐

---

## 🚀 Setup n8n Online (flow.yudhavro.com)

### **✅ Anda Sudah Punya n8n Online**

Karena n8n Anda sudah berjalan di **flow.yudhavro.com**, Anda bisa langsung skip ke bagian integrasi.

**Akses n8n Anda:**
- URL: **https://flow.yudhavro.com**
- Login dengan akun Anda

---

## 🚀 Setup n8n Localhost (Opsional)

Jika ingin install n8n di localhost juga:

### **Opsi 1: Docker**

```bash
docker pull n8nio/n8n
docker run -d --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

### **Opsi 2: NPM**

```bash
npm install -g n8n
n8n start
```

**Akses:** http://localhost:5678

---

## 🔧 Integrasi API VRO dengan n8n Online

### **📋 Checklist Persiapan**

Sebelum mulai, pastikan:
- ✅ API VRO sudah running di localhost (port 5173 & 3001)
- ✅ WAHA Plus sudah running (port 3000)
- ✅ Device WhatsApp sudah terkoneksi
- ✅ Sudah punya akses ke n8n online (flow.yudhavro.com)
- ✅ Sudah punya webhook URL dari n8n

---

## 🎯 Setup Step-by-Step (n8n Online)

### **Langkah 1: Paste Webhook URL dari n8n ke API VRO**

Anda sudah punya webhook URL dari n8n, sekarang tinggal paste ke API VRO:

**1.1. Buka API VRO Dashboard**
```
http://localhost:5173
```

**1.2. Login dengan Google/GitHub**

**1.3. Pergi ke halaman Devices**

**1.4. Pastikan device sudah Connected**
- Jika belum ada device, klik **Add Device**
- Scan QR code dengan WhatsApp
- Tunggu status **Connected**

**1.5. Edit Device untuk Set Webhook URL**
- Klik tombol **Edit** (ikon pensil biru) pada device Anda
- Di field **Webhook URL**, paste URL dari n8n:
  ```
  https://flow.yudhavro.com/webhook/your-webhook-path
  ```
- Klik **Save Changes**

**1.6. Test Webhook**
- Klik tombol **Test Webhook** (tombol ungu)
- Cek di n8n apakah webhook diterima
- Jika berhasil, akan muncul alert sukses dengan response time

---

### **Langkah 2: Buat API Key untuk Send Message**

n8n perlu API key untuk kirim balik pesan ke WhatsApp:

**2.1. Pergi ke halaman API Keys**
```
http://localhost:5173/api-keys
```

**2.2. Klik Create API Key**

**2.3. Isi form:**
- **Name**: `n8n Chatbot`
- **Device**: Pilih device yang sudah terkoneksi

**2.4. Copy API Key**
- API key hanya ditampilkan sekali!
- Format: `apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Simpan di tempat aman (notes/password manager)

---

### **Langkah 3: Test Koneksi**

**3.1. Test Webhook dari API VRO ke n8n**
- Di halaman Devices, klik **Test Webhook**
- Cek di n8n execution history
- Payload yang diterima:
  ```json
  {
    "event": "webhook.test",
    "timestamp": "2025-10-24T...",
    "device_id": "uuid",
    "device_name": "My Device",
    "message": "This is a test webhook from API VRO",
    "test": true
  }
  ```

**3.2. Test Send Message dari n8n ke API VRO**

Di n8n, buat HTTP Request node:
- **Method**: POST
- **URL**: `http://YOUR_IP:3001/api/v1/messages/send`
  - Ganti `YOUR_IP` dengan IP public/ngrok (lihat Langkah 4)
- **Headers**:
  ```json
  {
    "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "to": "628123456789",
    "message": "Test dari n8n!"
  }
  ```

---

### **Langkah 4: Expose API VRO untuk n8n (Jika Perlu)**

Karena n8n online perlu akses ke API VRO localhost untuk send message, ada 2 opsi:

#### **Opsi A: Menggunakan ngrok (Recommended untuk Testing)** ⭐

```bash
# Install ngrok
# Download dari: https://ngrok.com/download

# Expose port 3001
ngrok http 3001
```

Anda akan dapat URL seperti:
```
https://abc123.ngrok.io
```

Gunakan URL ini di n8n untuk send message:
```
https://abc123.ngrok.io/api/v1/messages/send
```

#### **Opsi B: Menggunakan IP Public + Port Forwarding**

1. Cek IP public Anda: https://whatismyipaddress.com
2. Setup port forwarding di router untuk port 3001
3. Gunakan IP public di n8n:
   ```
   http://YOUR_PUBLIC_IP:3001/api/v1/messages/send
   ```

#### **Opsi C: Deploy API VRO ke Cloud (Production)**

Jika untuk production, deploy ke:
- Railway.app
- Render.com
- Vercel (frontend) + Railway (backend)

---

### **Langkah 5: Test dengan Pesan WhatsApp Real**

**5.1. Kirim pesan WhatsApp**
- Kirim pesan ke nomor yang terkoneksi
- Contoh: "Halo bot"

**5.2. Cek di n8n**
- Buka n8n execution history
- Lihat webhook yang masuk dengan payload:
  ```json
  {
    "event": "message.received",
    "timestamp": "2025-10-24T...",
    "device_id": "uuid",
    "device_name": "My Device",
    "phone_number": "+628123456789",
    "data": {
      "id": "message-id",
      "from": "628987654321@c.us",
      "body": "Halo bot",
      "type": "text"
    }
  }
  ```

**5.3. Verifikasi bot reply**
- Jika workflow sudah setup, bot akan auto-reply
- Cek WhatsApp untuk balasan dari bot

---

---

## 🤖 Chatbot AI dengan DeepSeek & Gemini

### **Setup Chatbot AI Multi-Model**

Workflow ini akan membuat chatbot WhatsApp yang bisa menggunakan 2 AI:
- **DeepSeek** - AI model yang powerful dan cost-effective
- **Gemini** - Google AI dengan kemampuan multimodal

---

### **📋 TODO: Setup Chatbot AI Step-by-Step**

#### **✅ 1. Paste Webhook URL dari n8n**

**1.1. Di n8n (flow.yudhavro.com):**
- Buka workflow baru atau yang sudah ada
- Tambah node **Webhook**
- Set **HTTP Method**: `POST`
- Set **Path**: `whatsapp-ai-bot` (atau nama lain)
- **Copy Webhook URL** yang muncul

**1.2. Di API VRO (localhost:5173):**
- Pergi ke **Devices** page
- Klik **Edit** pada device Anda
- Paste webhook URL di field **Webhook URL**:
  ```
  https://flow.yudhavro.com/webhook/whatsapp-ai-bot
  ```
- Klik **Save Changes**
- Klik **Test Webhook** untuk verifikasi

---

#### **✅ 2. Setup DeepSeek API**

**2.1. Dapatkan API Key DeepSeek:**
- Daftar di: https://platform.deepseek.com
- Pergi ke API Keys section
- Generate new API key
- Copy API key

**2.2. Di n8n, tambah Credential:**
- Pergi ke **Settings** → **Credentials**
- Klik **Add Credential**
- Pilih **HTTP Request** atau **OpenAI** (DeepSeek compatible dengan OpenAI API)
- Nama: `DeepSeek API`
- API Key: paste API key Anda

---

#### **✅ 3. Setup Gemini API**

**3.1. Dapatkan API Key Gemini:**
- Pergi ke: https://makersuite.google.com/app/apikey
- Klik **Create API Key**
- Copy API key

**3.2. Di n8n, tambah Credential:**
- Pergi ke **Settings** → **Credentials**
- Klik **Add Credential**
- Pilih **Google AI** atau **HTTP Request**
- Nama: `Gemini API`
- API Key: paste API key Anda

---

#### **✅ 4. Buat Workflow Chatbot AI**

**4.1. Node 1: Webhook (Receive WhatsApp Message)**

Setup:
- **HTTP Method**: POST
- **Path**: `whatsapp-ai-bot`
- **Response Mode**: When Last Node Finishes

**4.2. Node 2: Code (Extract Message Data)**

Tambah **Code** node untuk extract data:

```javascript
// Extract message data
const webhookData = $input.all()[0].json;

// Get message text
const messageText = webhookData.data?.body || '';
const fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';
const deviceId = webhookData.device_id;

// Check if it's a text message
if (webhookData.data?.type !== 'text') {
  return [{
    json: {
      skip: true,
      reason: 'Not a text message'
    }
  }];
}

// Check if message is empty
if (!messageText.trim()) {
  return [{
    json: {
      skip: true,
      reason: 'Empty message'
    }
  }];
}

return [{
  json: {
    skip: false,
    message: messageText,
    from: fromNumber,
    device_id: deviceId,
    original_data: webhookData
  }
}];
```

**4.3. Node 3: IF (Check if Should Process)**

Setup:
- **Condition**: `{{ $json.skip }}` equals `false`

**4.4. Node 4: Switch (Pilih AI Model)**

Setup switch berdasarkan keyword:
- **Mode**: Rules
- **Rules**:
  - Rule 1: `{{ $json.message }}` contains `@deepseek` → Output 1
  - Rule 2: `{{ $json.message }}` contains `@gemini` → Output 2
  - Fallback: Output 0 (Default ke DeepSeek)

**4.5. Node 5a: HTTP Request (DeepSeek AI)**

Setup untuk DeepSeek:
- **Method**: POST
- **URL**: `https://api.deepseek.com/v1/chat/completions`
- **Authentication**: Generic Credential Type
  - Credential: `DeepSeek API`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_DEEPSEEK_API_KEY"
  }
  ```
- **Body**:
  ```json
  {
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "system",
        "content": "Kamu adalah asisten AI yang ramah dan helpful. Jawab dalam bahasa Indonesia dengan natural dan informatif."
      },
      {
        "role": "user",
        "content": "={{ $json.message.replace('@deepseek', '').trim() }}"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }
  ```

**4.6. Node 5b: HTTP Request (Gemini AI)**

Setup untuk Gemini:
- **Method**: POST
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "contents": [{
      "parts": [{
        "text": "={{ $json.message.replace('@gemini', '').trim() }}"
      }]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 500
    },
    "safetySettings": [
      {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  }
  ```

**4.7. Node 6: Code (Format AI Response)**

Tambah **Code** node untuk format response dari kedua AI:

```javascript
const items = $input.all();
let aiResponse = '';
let aiModel = 'Unknown';

// Check which AI was used
if (items[0].json.choices) {
  // DeepSeek response
  aiResponse = items[0].json.choices[0].message.content;
  aiModel = 'DeepSeek';
} else if (items[0].json.candidates) {
  // Gemini response
  aiResponse = items[0].json.candidates[0].content.parts[0].text;
  aiModel = 'Gemini';
}

// Get original data from previous nodes
const originalData = $('Code').item.json;

return [{
  json: {
    ai_response: aiResponse,
    ai_model: aiModel,
    from: originalData.from,
    device_id: originalData.device_id,
    original_message: originalData.message
  }
}];
```

**4.8. Node 7: HTTP Request (Send Reply via API VRO)**

Setup untuk kirim balasan:
- **Method**: POST
- **URL**: `http://YOUR_NGROK_URL/api/v1/messages/send`
  - Atau: `https://abc123.ngrok.io/api/v1/messages/send`
- **Headers**:
  ```json
  {
    "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "to": "={{ $json.from }}",
    "message": "🤖 *{{ $json.ai_model }} AI*\n\n{{ $json.ai_response }}"
  }
  ```

**4.9. Node 8: Code (Log Success)**

Tambah logging untuk monitoring:

```javascript
const result = $input.all()[0].json;

console.log('✅ AI Response sent successfully');
console.log('To:', $('Code1').item.json.from);
console.log('AI Model:', $('Code1').item.json.ai_model);
console.log('Response:', $('Code1').item.json.ai_response.substring(0, 100) + '...');

return [{
  json: {
    success: true,
    timestamp: new Date().toISOString(),
    ...result
  }
}];
```

---

#### **✅ 5. Setup ngrok untuk Expose API VRO**

Karena n8n online perlu kirim balik ke API VRO localhost:

**5.1. Install ngrok:**
```bash
# Download dari: https://ngrok.com/download
# Atau dengan snap:
sudo snap install ngrok
```

**5.2. Authenticate ngrok:**
```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

**5.3. Expose port 3001:**
```bash
ngrok http 3001
```

**5.4. Copy ngrok URL:**
- Akan muncul URL seperti: `https://abc123.ngrok.io`
- Copy URL ini
- Paste di n8n Node 7 (HTTP Request Send Reply)

---

#### **✅ 6. Test Chatbot**

**6.1. Test dengan DeepSeek:**
- Kirim pesan WhatsApp: `@deepseek Apa itu AI?`
- Bot akan reply dengan jawaban dari DeepSeek

**6.2. Test dengan Gemini:**
- Kirim pesan WhatsApp: `@gemini Jelaskan tentang machine learning`
- Bot akan reply dengan jawaban dari Gemini

**6.3. Test default (tanpa mention):**
- Kirim pesan WhatsApp: `Halo, siapa kamu?`
- Bot akan reply dengan DeepSeek (default)

---

#### **✅ 7. Monitor & Debug**

**7.1. Di n8n:**
- Buka **Executions** tab
- Lihat history semua webhook
- Klik execution untuk detail

**7.2. Di API VRO:**
- Pergi ke **Devices** → **Webhook Activity**
- Lihat logs webhook calls
- Check success/failure rate

**7.3. Di Terminal (ngrok):**
- Lihat request logs real-time
- Monitor traffic

---

### **🎨 Workflow Diagram**

```
WhatsApp Message
    ↓
Webhook (Receive)
    ↓
Code (Extract Data)
    ↓
IF (Should Process?)
    ↓
Switch (Choose AI)
    ├─ @deepseek → DeepSeek API
    ├─ @gemini → Gemini API
    └─ default → DeepSeek API
    ↓
Code (Format Response)
    ↓
HTTP Request (Send Reply)
    ↓
Code (Log Success)
```

---

### **💡 Tips & Enhancements**

**1. Tambah Context/Memory:**
```javascript
// Simpan conversation history di database
// Gunakan Supabase/PostgreSQL node
```

**2. Tambah Rate Limiting:**
```javascript
// Limit user to 10 messages per hour
// Check di database sebelum process
```

**3. Tambah Command System:**
```javascript
// /help - Show commands
// /reset - Clear conversation
// /model deepseek - Switch to DeepSeek
// /model gemini - Switch to Gemini
```

**4. Tambah Image Support (Gemini):**
```javascript
// Gemini bisa process images
// Detect media messages
// Send image URL to Gemini Vision API
```

**5. Tambah Fallback:**
```javascript
// Jika AI error, reply dengan pesan default
// "Maaf, sedang ada gangguan. Coba lagi nanti."
```

---

## 🎨 Workflow Examples (Lainnya)

### **Example 1: Auto-Reply Sederhana**

**Workflow:**
```
Webhook (Receive Message)
    ↓
IF (Message contains "halo")
    ↓
HTTP Request (Send Reply via API VRO)
```

**Setup:**

1. **Node 1: Webhook**
   - Method: POST
   - Path: `apivro-webhook`

2. **Node 2: IF**
   - Condition: `{{ $json.data.body }}` contains `halo`

3. **Node 3: HTTP Request**
   - Method: POST
   - URL: `http://localhost:3001/api/v1/messages/send`
   - Headers:
     ```json
     {
       "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "to": "{{ $json.data.from.replace('@c.us', '') }}",
       "message": "Halo juga! Ada yang bisa saya bantu?"
     }
     ```

---

### **Example 2: Forward ke Telegram**

**Workflow:**
```
Webhook (Receive WhatsApp Message)
    ↓
Telegram (Send Message)
```

**Setup:**

1. **Node 1: Webhook** (sama seperti sebelumnya)

2. **Node 2: Telegram**
   - Operation: Send Message
   - Chat ID: `your-telegram-chat-id`
   - Text:
     ```
     📱 WhatsApp Message Received:
     
     From: {{ $json.data.from }}
     Message: {{ $json.data.body }}
     Time: {{ $json.timestamp }}
     ```

---

### **Example 3: Chatbot dengan AI (OpenAI)**

**Workflow:**
```
Webhook (Receive Message)
    ↓
OpenAI (Generate Response)
    ↓
HTTP Request (Send Reply)
```

**Setup:**

1. **Node 1: Webhook** (sama seperti sebelumnya)

2. **Node 2: OpenAI**
   - Operation: Message a Model
   - Model: `gpt-3.5-turbo`
   - Prompt:
     ```
     User: {{ $json.data.body }}
     
     Jawab dengan ramah dan helpful.
     ```

3. **Node 3: HTTP Request**
   - Method: POST
   - URL: `http://localhost:3001/api/v1/messages/send`
   - Headers: (sama seperti Example 1)
   - Body:
     ```json
     {
       "to": "{{ $('Webhook').item.json.data.from.replace('@c.us', '') }}",
       "message": "{{ $json.choices[0].message.content }}"
     }
     ```

---

### **Example 4: Save to Google Sheets**

**Workflow:**
```
Webhook (Receive Message)
    ↓
Google Sheets (Append Row)
```

**Setup:**

1. **Node 1: Webhook** (sama seperti sebelumnya)

2. **Node 2: Google Sheets**
   - Operation: Append Row
   - Spreadsheet: `WhatsApp Messages Log`
   - Sheet: `Sheet1`
   - Columns:
     - Timestamp: `{{ $json.timestamp }}`
     - From: `{{ $json.data.from }}`
     - Message: `{{ $json.data.body }}`
     - Device: `{{ $json.device_name }}`

---

### **Example 5: Kirim Notifikasi dari Database**

**Workflow:**
```
Schedule Trigger (Every 5 minutes)
    ↓
PostgreSQL (Get Pending Notifications)
    ↓
Loop (For Each Row)
    ↓
HTTP Request (Send WhatsApp via API VRO)
    ↓
PostgreSQL (Mark as Sent)
```

**Setup:**

1. **Node 1: Schedule Trigger**
   - Interval: Every 5 minutes

2. **Node 2: PostgreSQL**
   - Operation: Execute Query
   - Query:
     ```sql
     SELECT id, phone, message 
     FROM notifications 
     WHERE sent = false 
     LIMIT 10
     ```

3. **Node 3: Loop**
   - Mode: Run Once for Each Item

4. **Node 4: HTTP Request**
   - Method: POST
   - URL: `http://localhost:3001/api/v1/messages/send`
   - Headers: (sama seperti Example 1)
   - Body:
     ```json
     {
       "to": "{{ $json.phone }}",
       "message": "{{ $json.message }}"
     }
     ```

5. **Node 5: PostgreSQL**
   - Operation: Execute Query
   - Query:
     ```sql
     UPDATE notifications 
     SET sent = true, sent_at = NOW() 
     WHERE id = {{ $json.id }}
     ```

---

## 🔑 Mendapatkan API Key

### **Langkah-langkah:**

1. Login ke **API VRO** (http://localhost:5173)
2. Pergi ke halaman **API Keys**
3. Klik **Create API Key**
4. Masukkan nama: `n8n Integration`
5. Pilih device yang sudah terkoneksi
6. Klik **Create**
7. **COPY API KEY** (hanya ditampilkan sekali!)
   - Format: `apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### **Gunakan API Key di n8n:**

Setiap HTTP Request ke API VRO harus include header:

```json
{
  "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

---

## 📊 Monitoring Webhook

### **Di API VRO Dashboard:**

1. Pergi ke halaman **Devices**
2. Cari device Anda
3. Klik **Webhook Activity** untuk expand logs
4. Lihat:
   - ✅ Successful webhooks (hijau)
   - ❌ Failed webhooks (merah)
   - Response time (ms)
   - Error messages

### **Di n8n:**

1. Buka workflow Anda
2. Klik **Executions** (tab atas)
3. Lihat history semua webhook yang diterima
4. Klik execution untuk detail payload

---

## 🐛 Troubleshooting

### **Problem 1: Webhook tidak diterima di n8n**

**Solusi:**

1. **Cek n8n berjalan:**
   ```bash
   curl http://localhost:5678
   ```

2. **Cek webhook URL benar:**
   - Format harus: `http://localhost:5678/webhook/your-path`
   - Pastikan tidak ada typo

3. **Cek workflow aktif:**
   - Di n8n, pastikan workflow dalam status **Active** (toggle ON)

4. **Test manual:**
   ```bash
   curl -X POST http://localhost:5678/webhook/apivro-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

---

### **Problem 2: API VRO tidak bisa kirim ke webhook**

**Cek di API VRO Dashboard:**

1. Pergi ke **Devices** → **Webhook Activity**
2. Lihat error message
3. Common errors:
   - `ECONNREFUSED` → n8n tidak berjalan
   - `ETIMEDOUT` → Webhook URL salah
   - `404 Not Found` → Webhook path tidak ada

**Solusi:**

```bash
# Cek n8n running
docker ps | grep n8n

# Restart n8n jika perlu
docker restart n8n

# Cek logs
docker logs n8n
```

---

### **Problem 3: API Key Invalid**

**Error:**
```json
{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "Invalid or inactive API key."
}
```

**Solusi:**

1. Cek API key format: harus dimulai dengan `apivro`
2. Cek API key masih aktif (tidak di-revoke)
3. Buat API key baru jika perlu

---

### **Problem 4: Message Limit Reached**

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

**Solusi:**

1. Upgrade plan di dashboard
2. Atau tunggu reset tanggal 1 bulan depan

---

### **Problem 5: Device Not Connected**

**Error:**
```json
{
  "success": false,
  "error": "DEVICE_NOT_CONNECTED",
  "message": "Device is not connected."
}
```

**Solusi:**

1. Pergi ke **Devices** page
2. Cek status device
3. Jika **Disconnected**, scan QR code lagi
4. Pastikan WhatsApp di HP masih aktif

---

## 📝 Best Practices

### **1. Error Handling di n8n**

Selalu tambahkan error handling:

```
HTTP Request (Send Message)
    ↓
IF (Success)
    ├─ Yes → Log Success
    └─ No → Send Alert to Admin
```

### **2. Rate Limiting**

Jangan spam API VRO:

- Max 10 messages per second
- Gunakan **Wait** node jika kirim bulk
- Monitor quota usage

### **3. Logging**

Simpan log untuk debugging:

- Save webhook payload ke database
- Log setiap API call
- Track success/failure rate

### **4. Security**

**Untuk Production:**

- Gunakan HTTPS untuk webhook URL
- Enable authentication di n8n webhook
- Jangan hardcode API key (gunakan credentials)
- Rotate API key secara berkala

---

## 🚀 Deploy ke Production

### **Ketika Siap Production:**

1. **Deploy n8n ke Cloud:**
   - Railway.app
   - DigitalOcean
   - AWS/GCP
   - Heroku

2. **Deploy API VRO ke Cloud:**
   - Vercel (frontend)
   - Railway/Render (backend)
   - Supabase (database)

3. **Update Webhook URL:**
   - Ganti `localhost` dengan domain production
   - Format: `https://n8n.yourdomain.com/webhook/apivro`

4. **Enable HTTPS:**
   - Wajib untuk production
   - Gunakan SSL certificate (Let's Encrypt)

5. **Setup Authentication:**
   - Enable webhook authentication di n8n
   - Tambah secret token di header

---

## 📚 Resources

### **API VRO Documentation:**
- API Docs: `API-DOCUMENTATION.md`
- Quick Start: `QUICK-START.md`
- Webhook Implementation: `WEBHOOK-IMPLEMENTATION.md`

### **n8n Documentation:**
- Official Docs: https://docs.n8n.io
- Webhook Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Community: https://community.n8n.io

### **WAHA Plus:**
- Docs: https://waha.devlike.pro/docs
- Webhook Events: https://waha.devlike.pro/docs/how-to/webhooks

---

## 🎯 Quick Start Checklist

- [ ] Install n8n (Docker/NPM)
- [ ] Jalankan n8n di `http://localhost:5678`
- [ ] Buat webhook node di n8n
- [ ] Copy webhook URL
- [ ] Set webhook URL di API VRO device
- [ ] Test webhook dengan tombol "Test Webhook"
- [ ] Buat workflow pertama (auto-reply)
- [ ] Test dengan pesan WhatsApp real
- [ ] Monitor di Webhook Activity
- [ ] Buat API key untuk send message
- [ ] Test send message dari n8n

---

## 💡 Tips & Tricks

### **1. Debug Webhook Payload**

Tambahkan node **Set** untuk inspect data:

```
Webhook
    ↓
Set (Debug)
    ↓
Your Logic
```

### **2. Filter Messages**

Hanya proses pesan tertentu:

```
Webhook
    ↓
IF (data.type === 'text' AND data.body.startsWith('/'))
    ↓
Process Command
```

### **3. Batch Processing**

Kirim multiple messages sekaligus:

```
Schedule Trigger
    ↓
Get Data (Array)
    ↓
Split In Batches (10 items)
    ↓
HTTP Request (Send Message)
    ↓
Wait (1 second)
```

### **4. Webhook Retry**

Jika webhook fail, retry otomatis:

```
HTTP Request
    ↓
IF (Failed)
    ↓
Wait (5 seconds)
    ↓
HTTP Request (Retry)
```

---

## 🎉 Selamat!

Anda sekarang bisa:

✅ Menerima webhook WhatsApp di n8n (localhost)  
✅ Membuat auto-reply bot  
✅ Kirim pesan WhatsApp dari n8n  
✅ Integrasi dengan service lain (Telegram, Sheets, AI)  
✅ Monitor webhook activity  
✅ Debug dan troubleshoot  

**Happy Automating! 🚀**

---

## 📞 Support

Butuh bantuan? Check:

- 📖 Documentation di folder `/docs`
- 🐛 Troubleshooting section di atas
- 💬 n8n Community Forum
- 📧 Contact support

---

**Built with ❤️ for automation enthusiasts**
