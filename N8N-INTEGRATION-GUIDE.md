# 🤖 Panduan Chatbot AI Customer Service WhatsApp

## 🎯 Quick Start

**Buat chatbot AI untuk customer service WhatsApp dengan:**

✅ **AI Response** - Jawab pertanyaan customer otomatis
✅ **Knowledge Base** - Materi company yang sudah ditentukan
✅ **Multi AI** - Pilih DeepSeek atau Gemini
✅ **Production Ready** - Langsung deployable

**Prerequisites:**
- ✅ API VRO running di `https://api.yudhavro.com`
- ✅ n8n online di `https://flow.yudhavro.com`
- ✅ WhatsApp device connected

---

## 1️⃣ Setup Webhook

### **Langkah 1: Buka API VRO**
```
https://api.yudhavro.com
```

### **Langkah 2: Login & Setup Device**
- Login dengan Google/GitHub
- Pergi ke **Devices**
- Pastikan device **Connected** (scan QR jika perlu)

### **Langkah 3: Buat Webhook di n8n**
1. **Buka:** https://flow.yudhavro.com
2. **Buat workflow baru**
3. **Tambah node "Webhook"**
4. **Setup:**
   - ✅ **HTTP Method:** POST
   - ✅ **Path:** `customer-service`
   - ✅ **Response Mode:** When Last Node Finishes
5. **Copy webhook URL** yang muncul

### **Langkah 4: Setup Webhook di API VRO**
1. **Edit device** di API VRO
2. **Paste webhook URL** dari n8n
3. **Save Changes**
4. **Test Webhook** - seharusnya berhasil ✅

---

## 2️⃣ Setup AI API Keys

### **DeepSeek API Key**
1. **Daftar:** https://platform.deepseek.com
2. **API Keys** → **Generate**
3. **Copy API key** (simpan baik-baik!)

### **Gemini API Key**
1. **Buka:** https://makersuite.google.com/app/apikey
2. **Create API Key**
3. **Copy API key** (simpan baik-baik!)

**💡 Tips:** Simpan API keys di password manager atau notes yang aman.

---

## 3️⃣ Buat Workflow Chatbot

### **🎯 Template Workflow Lengkap**

**Copy-paste JSON ini ke n8n:**

```json
{
  "name": "Customer Service AI Chatbot",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "customer-service",
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
        "jsCode": "const webhookData = $input.all()[0].json;\nconst messageText = webhookData.data?.body || '';\nconst fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';\nconst deviceId = webhookData.device_id;\n\nif (webhookData.data?.type !== 'text') {\n  return [{ json: { skip: true, reason: 'Not a text message' } }];\n}\n\nif (!messageText.trim()) {\n  return [{ json: { skip: true, reason: 'Empty message' } }];\n}\n\nreturn [{\n  json: {\n    skip: false,\n    message: messageText,\n    from: fromNumber,\n    device_id: deviceId,\n    customer_service: true\n  }\n}];"
      },
      "name": "Process Message",
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
      "name": "Should Respond?",
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
            "node": "Process Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Message": {
      "main": [
        [
          {
            "node": "Should Respond?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Should Respond?": {
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

### **📋 Manual Setup (Step-by-Step)**

#### **Step 1: Webhook Node**
1. **Klik "+"** → **Webhook**
2. **Setup:**
   - ✅ **HTTP Method:** POST
   - ✅ **Path:** `customer-service`
   - ✅ **Response Mode:** When Last Node Finishes
3. **Copy webhook URL**

#### **Step 2: Code Node (Process Message)**
1. **Klik "+"** di bawah Webhook
2. **Cari "Code"**
3. **Paste code ini:**

```javascript
// Process customer message
const webhookData = $input.all()[0].json;
const messageText = webhookData.data?.body || '';
const fromNumber = webhookData.data?.from?.replace('@c.us', '') || '';
const deviceId = webhookData.device_id;

// Skip non-text messages
if (webhookData.data?.type !== 'text') {
  return [{ json: { skip: true, reason: 'Not a text message' } }];
}

// Skip empty messages
if (!messageText.trim()) {
  return [{ json: { skip: true, reason: 'Empty message' } }];
}

// Process customer service query
return [{
  json: {
    skip: false,
    message: messageText,
    from: fromNumber,
    device_id: deviceId,
    customer_service: true
  }
}];
```

#### **Step 3: IF Node (Filter)**
1. **Klik "+"** di bawah Code
2. **Cari "IF"**
3. **Setup:**
   - ✅ **Condition:** `{{ $json.skip }}` equals `false`

#### **Step 4: Switch Node (Choose AI)**
1. **Klik "+"** di output TRUE dari IF
2. **Cari "Switch"**
3. **Setup:**
   - ✅ **Mode:** Rules
   - ✅ **Rule 1:** `{{ $json.message }}` contains `@deepseek` → Output 1
   - ✅ **Rule 2:** `{{ $json.message }}` contains `@gemini` → Output 2
   - ✅ **Fallback:** Output 0 (default DeepSeek)

---

## 4️⃣ Setup AI Knowledge Base

### **🎯 DeepSeek Node (Output 0 - Default)**

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
           "content": "Kamu adalah customer service AI untuk [NAMA COMPANY]. Jawab pertanyaan customer dengan ramah, helpful, dan informatif dalam bahasa Indonesia. Gunakan knowledge base: [PASTE KNOWLEDGE BASE COMPANY ANDA DI SINI - produk, layanan, FAQ, dll]"
         },
         {
           "role": "user",
           "content": "={{ $json.message.replace('@deepseek', '').trim() }}"
         }
       ],
       "temperature": 0.7,
       "max_tokens": 800
     }
     ```

### **🎯 Gemini Node (Output 2 - Alternative)**

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
           "text": "Kamu adalah customer service AI untuk [NAMA COMPANY]. Jawab pertanyaan customer dengan ramah dan helpful dalam bahasa Indonesia. Knowledge base: [PASTE KNOWLEDGE BASE COMPANY ANDA DI SINI]\n\nPertanyaan customer: {{ $json.message.replace('@gemini', '').trim() }}"
         }]
       }],
       "generationConfig": {
         "temperature": 0.7,
         "maxOutputTokens": 800
       }
     }
     ```

### **📝 Tips untuk Knowledge Base:**

**Ganti `[PASTE KNOWLEDGE BASE COMPANY ANDA DI SINI]` dengan:**

```
PRODUK & LAYANAN:
- Product A: Deskripsi, harga, fitur
- Product B: Deskripsi, harga, fitur
- Service X: Cara kerja, benefit

FAQ UMUM:
- Cara order: Step by step
- Cara pembayaran: Metode yang tersedia
- Cara return: Kebijakan dan proses
- Jam operasional: Senin-Jumat 09:00-17:00

KONTAK:
- WhatsApp: [NOMOR WA]
- Email: support@company.com
- Website: www.company.com
```

---

## 5️⃣ Setup Send Reply

### **🎯 Send Reply Node**

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
       "message": "🤖 Customer Service\n\n{{ $json.ai_response }}\n\n---\nKetik @deepseek atau @gemini untuk ganti AI model"
     }
     ```

---

## 6️⃣ Setup API Key

### **Langkah 1: Buat API Key di API VRO**
1. **Buka:** https://api.yudhavro.com
2. **Pergi ke API Keys**
3. **Create API Key**
4. **Setup:**
   - ✅ **Name:** `Customer Service AI`
   - ✅ **Device:** Pilih device yang connected
5. **Copy API key** (simpan aman!)

### **Langkah 2: Setup di Workflow**
1. **Ganti `apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX`** dengan API key asli
2. **Ganti `YOUR_DEEPSEEK_API_KEY`** dengan DeepSeek API key
3. **Ganti `YOUR_GEMINI_API_KEY`** dengan Gemini API key

---

## 7️⃣ Test & Deploy

### **✅ Test Chatbot**

1. **Aktifkan workflow** (toggle ON di kanan atas)
2. **Kirim pesan WhatsApp:**
   - `Halo, ada promo apa sekarang?`
   - `@deepseek Jelaskan produk A`
   - `@gemini Cara order Product B`
   - `Jam berapa customer service buka?`

3. **Cek Executions tab** untuk monitor response

### **🎯 Expected Results:**
- ✅ **Auto-reply** setiap pesan customer
- ✅ **AI-powered** responses dengan knowledge base
- ✅ **Multi-model** support (DeepSeek/Gemini)
- ✅ **Professional** customer service format

### **📊 Monitor Performance:**
- **Executions tab** - Lihat semua conversations
- **API VRO Dashboard** - Monitor webhook activity
- **Test regularly** - Pastikan knowledge base up-to-date

---

## 🐛 Troubleshooting

### **Problem: AI Response Tidak Muncul**
**Solusi:**
- ✅ Cek API keys sudah diganti dengan yang asli
- ✅ Test webhook berhasil di API VRO
- ✅ Workflow dalam status **Active**

### **Problem: Message Tidak Terkirim**
**Solusi:**
- ✅ Cek API key format: `apivro...`
- ✅ Pastikan device connected
- ✅ Check quota message

### **Problem: AI Jawaban Tidak Relevan**
**Solusi:**
- ✅ Update knowledge base dengan informasi terbaru
- ✅ Test dengan pertanyaan spesifik
- ✅ Adjust system prompt jika perlu

---

## 🎉 Customer Service AI Ready!

**Setup selesai!** Customer Anda sekarang bisa:

✅ **Chat 24/7** dengan AI customer service
✅ **Dapat informasi** produk & layanan otomatis
✅ **Pilih AI model** sesuai kebutuhan
✅ **Professional responses** dengan company branding

**Langkah selanjutnya:**
1. **Test dengan customer real**
2. **Update knowledge base** regularly
3. **Monitor conversations** di Executions
4. **Improve responses** berdasarkan feedback

**Happy Customer Servicing! 🚀**
