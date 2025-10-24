# 🔗 Panduan Integrasi API VRO dengan n8n

## 🚀 Quick Start

**Prerequisites:**
- ✅ API VRO sudah running di production (`https://api.yudhavro.com`)
- ✅ n8n instance sudah online (`https://flow.yudhavro.com`)
- ✅ WhatsApp device sudah connected

**Langkah Cepat:**

1. **Setup Webhook** - Paste webhook URL dari n8n ke device API VRO
2. **Buat API Key** - Generate API key di API VRO untuk n8n
3. **Buat Workflow** - Setup automation di n8n
4. **Test** - Kirim pesan WhatsApp untuk trigger workflow

---

## 📋 Daftar Isi
- [Setup Webhook](#1-setup-webhook-dari-n8n)
- [Buat API Key](#2-buat-api-key-di-api-vro)
- [Chatbot AI dengan DeepSeek & Gemini](#3-chatbot-ai-dengan-deepseek--gemini)
- [Workflow Examples](#4-workflow-examples-lainnya)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Apa yang Bisa Dibuat?

Dengan integrasi n8n, Anda dapat membuat automasi seperti:

- 🤖 **Chatbot AI** - Auto-reply dengan DeepSeek/Gemini
- 📨 **Auto-reply** - Balas otomatis berdasarkan keyword
- 📊 **Notifikasi** - Kirim alert dari database/CRM
- 🔄 **Sinkronisasi** - Sync data antar platform
- 📧 **Forward** - Teruskan pesan ke email/Telegram/Discord

---

## 📐 Arsitektur Production

```
WhatsApp Message
    ↓
WAHA Plus (api.yudhavro.com:3000)
    ↓
API VRO Backend (api.yudhavro.com:3001)
    ↓
n8n Webhook (flow.yudhavro.com)
    ↓
Your Automation Workflow
    ↓
n8n HTTP Request
    ↓
API VRO Send Message (api.yudhavro.com/api/v1/messages/send)
    ↓
WhatsApp Reply
```

**Semua service sudah production, tidak perlu ngrok!** ✅

---

## 1️⃣ Setup Webhook dari n8n

### **Langkah 1: Buka API VRO Dashboard**

```
https://api.yudhavro.com
```

### **Langkah 2: Login dengan Google/GitHub**

### **Langkah 3: Pergi ke halaman Devices**

### **Langkah 4: Pastikan device sudah Connected**
- Jika belum ada device, klik **Add Device**
- Scan QR code dengan WhatsApp
- Tunggu status **Connected**

### **Langkah 5: Edit Device untuk Set Webhook URL**
- Klik tombol **Edit** (ikon pensil biru) pada device Anda
- Di field **Webhook URL**, paste URL dari n8n:
  ```
  https://flow.yudhavro.com/webhook/your-webhook-path
  ```
- Klik **Save Changes**

### **Langkah 6: Test Webhook**
- Klik tombol **Test Webhook** (tombol ungu)
- Cek di n8n apakah webhook diterima
- Jika berhasil, akan muncul alert sukses dengan response time

---

## 2️⃣ Buat API Key di API VRO

n8n perlu API key untuk kirim balik pesan ke WhatsApp:

### **Langkah 1: Pergi ke halaman API Keys**
```
https://api.yudhavro.com/api-keys
```

### **Langkah 2: Klik Create API Key**

**2.3. Isi form:**
- **Name**: `n8n Chatbot`
- **Device**: Pilih device yang sudah terkoneksi

**2.4. Copy API Key**
- API key hanya ditampilkan sekali!
- Format: `apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Simpan di tempat aman (notes/password manager)

### **Langkah 3: Simpan API Key untuk n8n**

API key ini akan digunakan di n8n untuk send message. Format:
```
X-API-Key: apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 3️⃣ Chatbot AI dengan DeepSeek & Gemini

Buat chatbot WhatsApp yang bisa menggunakan 2 AI:
- **DeepSeek** - AI model yang powerful dan cost-effective  
- **Gemini** - Google AI dengan kemampuan multimodal

### **Langkah 1: Setup AI API Keys**

#### **1.1. DeepSeek API Key**
- Daftar di: https://platform.deepseek.com
- Pergi ke API Keys section
- Generate new API key
- Copy API key

#### **1.2. Gemini API Key**
- Pergi ke: https://makersuite.google.com/app/apikey
- Klik **Create API Key**
- Copy API key

---

### **Langkah 2: Buat Workflow di n8n**

#### **2.1. Di n8n (flow.yudhavro.com):**
- Buka workflow baru
- Tambah node **Webhook**
- Set **HTTP Method**: `POST`
- Set **Path**: `whatsapp-ai-bot`
- **Copy Webhook URL** yang muncul

#### **2.2. Di API VRO (api.yudhavro.com):**
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

## 3️⃣ Chatbot AI dengan DeepSeek & Gemini

### **🎯 Template Workflow Mudah**

**Copy-paste JSON ini ke n8n untuk langsung bisa pakai:**

```json
{
  "name": "API VRO AI Chatbot",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-ai-bot",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const webhookData = $input.all()[0].json;\nconst messageText = webhookData.data?.body || '';\nconst fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';\nconst deviceId = webhookData.device_id;\n\nif (webhookData.data?.type !== 'text') {\n  return [{ json: { skip: true, reason: 'Not a text message' } }];\n}\n\nreturn [{ json: { skip: false, message: messageText, from: fromNumber, device_id: deviceId } }];"
      },
      "name": "Extract Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            [
              {
                "value1": "={{ $json.skip }}",
                "value2": "false"
              }
            ]
          ]
        }
      },
      "name": "Process Message?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "rules": {
          "rules": [
            {
              "value": "={{ $json.message }}",
              "condition": "contains",
              "output": "1",
              "value2": "@deepseek"
            },
            {
              "value": "={{ $json.message }}",
              "condition": "contains",
              "output": "2",
              "value2": "@gemini"
            }
          ]
        },
        "fallbackOutput": "0"
      },
      "name": "Choose AI",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Extract Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Message": {
      "main": [
        [
          {
            "node": "Process Message?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Message?": {
      "main": [
        [
          {
            "node": "Choose AI",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Cara Import:**
1. **Buka n8n:** https://flow.yudhavro.com
2. **Klik "Import"** di menu kiri
3. **Paste JSON di atas**
4. **Klik "Import"**

**Setelah import, tambah AI nodes dan Send Message node secara manual (panduan di bawah).**

---

### **📋 Manual Setup (Step-by-Step Visual)**

#### **Step 1: Buat Webhook**
1. **Klik tanda "+"** untuk tambah node
2. **Cari "Webhook"**
3. **Pilih "Webhook"**
4. **Setup:**
   - ✅ **HTTP Method:** POST
   - ✅ **Path:** `whatsapp-ai-bot`
   - ✅ **Response Mode:** When Last Node Finishes
5. **Copy URL** yang muncul

#### **Step 2: Setup di API VRO**
1. **Buka:** https://api.yudhavro.com
2. **Login** Google/GitHub
3. **Devices** → **Edit Device**
4. **Paste webhook URL** → **Save**
5. **Test Webhook** ✅

#### **Step 3: Tambah Code Node**
1. **Klik "+"** di bawah Webhook
2. **Cari "Code"**
3. **Paste code ini:**

```javascript
// Extract message data
const webhookData = $input.all()[0].json;
const messageText = webhookData.data?.body || '';
const fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';

if (webhookData.data?.type !== 'text') {
  return [{ json: { skip: true } }];
}

return [{
  json: {
    skip: false,
    message: messageText,
    from: fromNumber,
    device_id: webhookData.device_id
  }
}];
```

#### **Step 4: Tambah Filter (IF)**
1. **Klik "+"** di bawah Code
2. **Cari "IF"**
3. **Setup:**
   - ✅ **Condition:** `{{ $json.skip }}` equals `false`

#### **Step 5: Tambah AI Switch**
1. **Klik "+"** di output TRUE dari IF
2. **Cari "Switch"**
3. **Setup:**
   - ✅ **Mode:** Rules
   - ✅ **Rule 1:** `{{ $json.message }}` contains `@deepseek` → Output 1
   - ✅ **Rule 2:** `{{ $json.message }}` contains `@gemini` → Output 2
   - ✅ **Fallback:** Output 0 (default DeepSeek)

---

### **🔑 Setup AI API Keys**

#### **DeepSeek:**
1. **Daftar:** https://platform.deepseek.com
2. **API Keys** → **Generate**
3. **Copy API key**

#### **Gemini:**
1. **Buka:** https://makersuite.google.com/app/apikey
2. **Create API Key**
3. **Copy API key**

---

### **🤖 Tambah AI Nodes**

#### **DeepSeek Node (Output 0):**
1. **Klik "+"** di Output 0 dari Switch
2. **Cari "HTTP Request"**
3. **Setup:**
   - ✅ **Method:** POST
   - ✅ **URL:** `https://api.deepseek.com/v1/chat/completions`
   - ✅ **Headers:**
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_DEEPSEEK_API_KEY"
     }
     ```
   - ✅ **Body:**
     ```json
     {
       "model": "deepseek-chat",
       "messages": [
         {
           "role": "system",
           "content": "Jawab dalam bahasa Indonesia yang ramah dan helpful."
         },
         {
           "role": "user",
           "content": "={{ $json.message.replace('@deepseek', '').trim() }}"
         }
       ],
       "temperature": 0.7
     }
     ```

#### **Gemini Node (Output 2):**
1. **Klik "+"** di Output 2 dari Switch
2. **Cari "HTTP Request"**
3. **Setup:**
   - ✅ **Method:** POST
   - ✅ **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY`
   - ✅ **Headers:**
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - ✅ **Body:**
     ```json
     {
       "contents": [{
         "parts": [{
           "text": "={{ $json.message.replace('@gemini', '').trim() }}"
         }]
       }],
       "generationConfig": {
         "temperature": 0.7
       }
     }
     ```

---

### **📤 Tambah Send Reply Node**

1. **Klik "+"** di bawah AI nodes
2. **Cari "HTTP Request"**
3. **Setup:**
   - ✅ **Method:** POST
   - ✅ **URL:** `https://api.yudhavro.com/api/v1/messages/send`
   - ✅ **Headers:**
     ```json
     {
       "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
       "Content-Type": "application/json"
     }
     ```
   - ✅ **Body:**
     ```json
     {
       "to": "={{ $json.from }}",
       "message": "🤖 *{{ $json.ai_model }} AI*\n\n{{ $json.ai_response }}"
     }
     ```

---

### **✅ Test Chatbot**

1. **Aktifkan workflow** (toggle ON)
2. **Kirim pesan WhatsApp:**
   - `@deepseek Apa itu AI?`
   - `@gemini Jelaskan machine learning`
   - `Halo, siapa kamu?` (default DeepSeek)

3. **Cek Executions tab** untuk monitor

---

## 4️⃣ Auto-Reply Sederhana

### **🎯 Template Workflow**

**Copy-paste JSON ini:**

```json
{
  "name": "API VRO Auto-Reply",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "auto-reply",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const webhookData = $input.all()[0].json;\nconst messageText = webhookData.data?.body || '';\nconst fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';\n\nif (webhookData.data?.type !== 'text') {\n  return [{ json: { skip: true } }];\n}\n\nreturn [{ json: { skip: false, message: messageText, from: fromNumber } }];"
      },
      "name": "Process",
      "type": "n8n-nodes-base.code",
      "position": [460, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Process",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Setup Send Reply:**
1. **Klik "+"** di bawah Process
2. **Cari "HTTP Request"**
3. **Setup:**
   - ✅ **Method:** POST
   - ✅ **URL:** `https://api.yudhavro.com/api/v1/messages/send`
   - ✅ **Headers:**
     ```json
     {
       "X-API-Key": "apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
       "Content-Type": "application/json"
     }
     ```
   - ✅ **Body:**
     ```json
     {
       "to": "={{ $json.from }}",
       "message": "Halo! Terima kasih atas pesan Anda."
     }
     ```

---

### **✅ Test Auto-Reply**

1. **Aktifkan workflow**
2. **Kirim pesan WhatsApp:** `Halo`
3. **Bot auto-reply!** 🎉

---

## 5️⃣ Forward ke Telegram

### **🎯 Template Workflow**

```json
{
  "name": "API VRO to Telegram",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "telegram-forward",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "sendMessage",
        "chatId": "YOUR_TELEGRAM_CHAT_ID",
        "text": "📱 WhatsApp Message Received:\n\nFrom: {{ $json.data.from }}\nMessage: {{ $json.data.body }}\nTime: {{ $json.timestamp }}",
        "additionalFields": {}
      },
      "name": "Telegram",
      "type": "n8n-nodes-base.telegram",
      "position": [460, 300],
      "credentials": {
        "telegramApi": "YOUR_TELEGRAM_BOT_TOKEN"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Telegram",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Setup:**
1. **Ganti `YOUR_TELEGRAM_CHAT_ID`** dengan chat ID Anda
2. **Ganti `YOUR_TELEGRAM_BOT_TOKEN`** dengan bot token Anda

---

### **📋 Setup Telegram Bot**

#### **Step 1: Buat Bot**
1. **Chat @BotFather** di Telegram
2. **Ketik:** `/newbot`
3. **Ikuti instruksi**
4. **Copy Bot Token**

#### **Step 2: Get Chat ID**
1. **Chat dengan bot** Anda
2. **Kirim pesan apa saja**
3. **Buka:** https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
4. **Copy "chat"."id"**

#### **Step 3: Setup Webhook**
1. **Copy webhook URL** dari Telegram node
2. **Paste di API VRO device**
3. **Test**

---

### **✅ Test Forward**

1. **Aktifkan workflow**
2. **Kirim pesan WhatsApp**
3. **Cek Telegram** - notifikasi muncul! 🎉

---

## 🐛 Troubleshooting

### **Problem: Webhook Error 404**
**Solusi:**
- ✅ Pastikan HTTP Method: **POST** (bukan GET)
- ✅ Check webhook URL benar
- ✅ Test webhook di API VRO

### **Problem: API Key Invalid**
**Solusi:**
- ✅ Cek format: `apivro...`
- ✅ Pastikan API key aktif
- ✅ Buat API key baru jika perlu

### **Problem: Message Tidak Terkirim**
**Solusi:**
- ✅ Cek quota message
- ✅ Pastikan device connected
- ✅ Check logs di API VRO

---

## 🎉 Selamat!

Anda sekarang bisa:

✅ **Setup webhook** dari n8n ke API VRO  
✅ **Buat chatbot AI** dengan DeepSeek & Gemini  
✅ **Auto-reply** pesan WhatsApp  
✅ **Forward** ke Telegram  
✅ **Monitor** di dashboard  

**Langkah selanjutnya:**
1. **Test semua workflow**
2. **Monitor di Executions tab**
3. **Debug jika ada error**
4. **Buat workflow custom** sesuai kebutuhan

**Happy Automating! 🚀**

---

## 📞 Butuh Bantuan?

- **Cek troubleshooting** di atas
- **Lihat Executions** di n8n untuk debug
- **Monitor Webhook Activity** di API VRO
- **Join n8n Community** untuk tips

**Semua sudah production ready! 🎊**
