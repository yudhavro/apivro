# API VRO - API Documentation

Complete API documentation for integrating with the API VRO WhatsApp API platform.

## Base URL

```
Production: https://api.apivro.com/v1
Sandbox: https://sandbox-api.apivro.com/v1
```

## Authentication

All API requests require authentication using an API key in the `X-API-Key` header:

```
X-API-Key: apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Getting Your API Key

1. Log in to your API VRO dashboard
2. Navigate to **API Keys**
3. Click **Create API Key**
4. Select a device
5. Copy your API key (you won't see it again!)

## Rate Limits

Rate limits are based on your subscription plan:

- **Free Plan**: 50 messages/month
- **Basic Plan**: 1,500 messages/month
- **Enterprise Plan**: 15,000 messages/month

When you exceed your limit, you'll receive a `429 Too Many Requests` response.

## Common Responses

### Success Response

```json
{
  "success": true,
  "data": {
    "message_id": "msg_123456789",
    "status": "sent",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "Monthly message limit exceeded. Please upgrade your plan.",
    "details": {
      "limit": 50,
      "used": 50,
      "reset_date": "2024-02-01T00:00:00Z"
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or revoked |
| `DEVICE_NOT_CONNECTED` | WhatsApp device is not connected |
| `LIMIT_EXCEEDED` | Monthly message limit reached |
| `INVALID_PHONE_NUMBER` | Phone number format is invalid |
| `INVALID_REQUEST` | Request body is malformed |
| `RATE_LIMIT_EXCEEDED` | Too many requests in short time |
| `INTERNAL_ERROR` | Server error, try again later |

## Endpoints

### 1. Send Text Message

Send a text message to a WhatsApp number.

**Endpoint:** `POST /messages/send`

**Request Body:**
```json
{
  "phone": "628123456789",
  "message": "Hello! This is a test message from API VRO."
}
```

**Parameters:**
- `phone` (string, required): Recipient phone number in international format (without + or 00)
- `message` (string, required): Text message to send (max 4096 characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_1234567890",
    "phone": "628123456789",
    "status": "sent",
    "timestamp": "2024-01-15T10:30:00Z",
    "remaining_quota": 49
  }
}
```

**Example (cURL):**
```bash
curl -X POST https://api.apivro.com/v1/messages/send \
  -H "Authorization: Bearer vro_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "628123456789",
    "message": "Hello from API VRO!"
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('https://api.apivro.com/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer vro_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '628123456789',
    message: 'Hello from API VRO!'
  })
});

const data = await response.json();
console.log(data);
```

**Example (PHP):**
```php
<?php
$apiKey = 'vro_your_api_key';
$url = 'https://api.apivro.com/v1/messages/send';

$data = [
    'phone' => '628123456789',
    'message' => 'Hello from API VRO!'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);
?>
```

### 2. Send Image

Send an image with optional caption.

**Endpoint:** `POST /messages/send-image`

**Request Body:**
```json
{
  "phone": "628123456789",
  "image_url": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
```

**Parameters:**
- `phone` (string, required): Recipient phone number
- `image_url` (string, required): Public URL of the image
- `caption` (string, optional): Image caption

**Example:**
```bash
curl -X POST https://api.apivro.com/v1/messages/send-image \
  -H "Authorization: Bearer vro_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "628123456789",
    "image_url": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'
```

### 3. Send Document

Send a document file (PDF, DOC, XLS, etc.).

**Endpoint:** `POST /messages/send-document`

**Request Body:**
```json
{
  "phone": "628123456789",
  "document_url": "https://example.com/document.pdf",
  "filename": "invoice.pdf"
}
```

**Parameters:**
- `phone` (string, required): Recipient phone number
- `document_url` (string, required): Public URL of the document
- `filename` (string, optional): Custom filename

### 4. Get Device Status

Check if your WhatsApp device is connected.

**Endpoint:** `GET /devices/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "device_id": "dev_123456",
    "status": "connected",
    "phone_number": "628123456789",
    "battery": 85,
    "last_seen": "2024-01-15T10:30:00Z"
  }
}
```

**Example:**
```bash
curl https://api.apivro.com/v1/devices/status \
  -H "Authorization: Bearer vro_your_api_key"
```

### 5. Get Message History

Retrieve sent message history.

**Endpoint:** `GET /messages/history`

**Query Parameters:**
- `limit` (integer, optional): Number of messages to return (default: 50, max: 100)
- `offset` (integer, optional): Pagination offset
- `status` (string, optional): Filter by status (sent, failed, pending)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "message_id": "msg_123",
        "phone": "628123456789",
        "message": "Hello!",
        "status": "sent",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0
    }
  }
}
```

### 6. Get Usage Statistics

Get your current usage and limits.

**Endpoint:** `GET /usage`

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "Basic",
    "limit": 1500,
    "used": 847,
    "remaining": 653,
    "reset_date": "2024-02-01T00:00:00Z",
    "percentage_used": 56.47
  }
}
```

## Webhooks

Configure webhooks to receive real-time events from WhatsApp.

### Setup

1. Go to **Devices** in your dashboard
2. Edit a device
3. Enter your webhook URL
4. Save

### Webhook Events

#### Incoming Message

Triggered when you receive a message.

```json
{
  "event": "message.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "message_id": "msg_incoming_123",
    "from": "628123456789",
    "message": "Hello, I need help!",
    "type": "text"
  }
}
```

#### Message Status Update

Triggered when message delivery status changes.

```json
{
  "event": "message.status",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "message_id": "msg_123",
    "status": "delivered",
    "phone": "628123456789"
  }
}
```

#### Device Disconnected

Triggered when device loses connection.

```json
{
  "event": "device.disconnected",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "device_id": "dev_123",
    "phone_number": "628123456789"
  }
}
```

### Webhook Security

All webhooks include a signature header for verification:

```
X-API-VRO-Signature: sha256=abc123...
```

**Verify signature (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return signature === digest;
}
```

## Integration Examples

### Google Forms Integration

Use Google Apps Script to send WhatsApp notifications on form submission:

```javascript
function onFormSubmit(e) {
  const apiKey = 'vro_your_api_key';
  const phone = '628123456789';
  const name = e.values[1]; // Adjust based on your form
  const email = e.values[2];

  const message = `New form submission!\nName: ${name}\nEmail: ${email}`;

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      phone: phone,
      message: message
    })
  };

  UrlFetchApp.fetch('https://api.apivro.com/v1/messages/send', options);
}
```

### WooCommerce Integration

PHP snippet for WooCommerce order notifications:

```php
add_action('woocommerce_order_status_completed', 'send_whatsapp_notification');

function send_whatsapp_notification($order_id) {
    $order = wc_get_order($order_id);
    $phone = get_post_meta($order_id, '_billing_phone', true);

    // Convert to international format
    $phone = preg_replace('/^0/', '62', $phone);

    $message = sprintf(
        "Terima kasih atas pesanan Anda #%s! Pesanan Anda sedang diproses.",
        $order->get_order_number()
    );

    $api_key = 'vro_your_api_key';
    $url = 'https://api.apivro.com/v1/messages/send';

    $data = array(
        'phone' => $phone,
        'message' => $message
    );

    $args = array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode($data)
    );

    wp_remote_post($url, $args);
}
```

### n8n Workflow

1. Create a new workflow in n8n
2. Add **Webhook** trigger node
3. Configure your API VRO webhook URL
4. Add **HTTP Request** node to send messages:
   - Method: POST
   - URL: `https://api.apivro.com/v1/messages/send`
   - Authentication: Generic Credential Type → Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer vro_your_api_key`
   - Body:
     ```json
     {
       "phone": "{{$json.phone}}",
       "message": "{{$json.message}}"
     }
     ```

### Make.com Integration

1. Create a new scenario
2. Add **Webhooks** module as trigger
3. Add **HTTP** module:
   - URL: `https://api.apivro.com/v1/messages/send`
   - Method: POST
   - Headers:
     - `Authorization`: `Bearer vro_your_api_key`
     - `Content-Type`: `application/json`
   - Body:
     ```json
     {
       "phone": "628123456789",
       "message": "Your message here"
     }
     ```

## Best Practices

### 1. Phone Number Formatting

Always use international format without + or 00:
- ✅ Correct: `628123456789` (Indonesia)
- ✅ Correct: `14155551234` (USA)
- ❌ Wrong: `+628123456789`
- ❌ Wrong: `0812-3456-789`

### 2. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!data.success) {
    // Handle API error
    console.error('API Error:', data.error.message);

    if (data.error.code === 'LIMIT_EXCEEDED') {
      // Show upgrade prompt
    }
  }
} catch (error) {
  // Handle network error
  console.error('Network Error:', error);
}
```

### 3. Rate Limiting

Implement client-side rate limiting:

```javascript
const rateLimit = {
  requests: [],
  maxRequests: 10,
  windowMs: 60000, // 1 minute

  check() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return this.requests.length < this.maxRequests;
  },

  add() {
    this.requests.push(Date.now());
  }
};

if (rateLimit.check()) {
  await sendMessage();
  rateLimit.add();
} else {
  console.log('Rate limit exceeded, please wait');
}
```

### 4. Message Queue

For bulk messages, use a queue:

```javascript
async function sendBulkMessages(messages) {
  const queue = [...messages];
  const results = [];

  while (queue.length > 0) {
    const batch = queue.splice(0, 10); // 10 at a time

    const promises = batch.map(msg => sendMessage(msg));
    const batchResults = await Promise.allSettled(promises);

    results.push(...batchResults);

    // Wait 1 second between batches
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### 5. Monitoring Usage

Check usage regularly to avoid hitting limits:

```javascript
async function checkUsage() {
  const response = await fetch('https://api.apivro.com/v1/usage', {
    headers: {
      'Authorization': 'Bearer vro_your_api_key'
    }
  });

  const data = await response.json();
  const { used, limit, percentage_used } = data.data;

  if (percentage_used > 90) {
    console.warn('Warning: 90% of monthly limit used!');
    // Send notification to admin
  }

  return data.data;
}
```

## Support

### Documentation
- API Reference: https://docs.apivro.com
- Integration Guides: https://docs.apivro.com/guides
- FAQ: https://docs.apivro.com/faq

### Community
- Discord: https://discord.gg/apivro
- Forum: https://community.apivro.com

### Technical Support
- Email: support@apivro.com
- Response time: 24-48 hours (Free), 4-8 hours (Paid plans)

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Text message sending
- Image and document support
- Webhook events
- Usage tracking

---

Happy integrating! 🚀
