import { useState } from 'react';
import { Book, Code, Webhook, Zap, ExternalLink } from 'lucide-react';

export function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Book },
    { id: 'api-reference', label: 'API Reference', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'integrations', label: 'Integrations', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documentation</h1>
        <p className="text-slate-600 mt-1">
          Complete guide to integrate WhatsApp API into your application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href="/api-playground"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Code className="w-4 h-4" />
                Try API Playground
              </a>
            </div>

            <div className="mt-4">
              <a
                href="https://github.com/yourusername/api-vro"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            {activeTab === 'getting-started' && <GettingStartedContent />}
            {activeTab === 'api-reference' && <APIReferenceContent />}
            {activeTab === 'webhooks' && <WebhooksContent />}
            {activeTab === 'integrations' && <IntegrationsContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GettingStartedContent() {
  return (
    <div className="prose max-w-none">
      <h2>Getting Started</h2>
      <p>
        Welcome to API VRO! This guide will help you send your first WhatsApp message in
        under 5 minutes.
      </p>

      <h3>1. Create an Account</h3>
      <p>Sign up using Google or GitHub OAuth. You'll get a free plan with 50 messages/month.</p>

      <h3>2. Connect Your Device</h3>
      <ol>
        <li>Go to the <strong>Devices</strong> page</li>
        <li>Click <strong>Add Device</strong></li>
        <li>Scan the QR code with WhatsApp</li>
        <li>Wait for "Connected" status</li>
      </ol>

      <h3>3. Generate API Key</h3>
      <ol>
        <li>Go to the <strong>API Keys</strong> page</li>
        <li>Click <strong>Create API Key</strong></li>
        <li>Select your connected device</li>
        <li>Copy your API key (shown only once!)</li>
      </ol>

      <h3>4. Send Your First Message</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`curl -X POST http://localhost:3001/api/v1/messages/send \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "628123456789",
    "message": "Hello from API VRO!"
  }'`}
      </pre>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="text-blue-900 font-medium mb-2">💡 Quick Tip</h4>
        <p className="text-blue-800 text-sm">
          Use the <a href="/api-playground" className="underline">API Playground</a> to test
          your API without writing code!
        </p>
      </div>
    </div>
  );
}

function APIReferenceContent() {
  return (
    <div className="prose max-w-none">
      <h2>API Reference</h2>

      <h3>Authentication</h3>
      <p>All API requests require an API key in the <code>X-API-Key</code> header:</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
        X-API-Key: apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX
      </pre>

      <h3>Send Message</h3>
      <p><strong>Endpoint:</strong> <code>POST /api/v1/messages/send</code></p>

      <h4>Request Body</h4>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "to": "628123456789",
  "message": "Your message here",
  "media": {  // Optional
    "url": "https://example.com/image.jpg",
    "mimetype": "image/jpeg",
    "filename": "image.jpg"
  }
}`}
      </pre>

      <h4>Response</h4>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "success": true,
  "message_id": "wamid.xxx",
  "recipient": "628123456789",
  "quota_remaining": 49,
  "quota_used": 1,
  "quota_limit": 50,
  "timestamp": "2025-10-21T16:00:00Z"
}`}
      </pre>

      <h3>Get Quota</h3>
      <p><strong>Endpoint:</strong> <code>GET /api/v1/messages/quota</code></p>

      <h4>Response</h4>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "success": true,
  "quota_used": 1,
  "quota_limit": 50,
  "quota_remaining": 49,
  "plan": "Free",
  "reset_date": "2025-11-01T00:00:00Z"
}`}
      </pre>

      <h3>Error Codes</h3>
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>INVALID_API_KEY</code></td>
            <td>API key is invalid or revoked</td>
          </tr>
          <tr>
            <td><code>DEVICE_NOT_CONNECTED</code></td>
            <td>WhatsApp device is not connected</td>
          </tr>
          <tr>
            <td><code>MESSAGE_LIMIT_REACHED</code></td>
            <td>Monthly message limit reached</td>
          </tr>
          <tr>
            <td><code>MISSING_RECIPIENT</code></td>
            <td>Phone number is required</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function WebhooksContent() {
  return (
    <div className="prose max-w-none">
      <h2>Webhooks</h2>
      <p>
        Receive real-time notifications when you get incoming messages or when message
        status changes.
      </p>

      <h3>Setup</h3>
      <ol>
        <li>Go to <strong>Devices</strong> page</li>
        <li>Edit your device</li>
        <li>Enter your webhook URL</li>
        <li>Save</li>
      </ol>

      <h3>Incoming Message Event</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "event": "message.received",
  "timestamp": "2025-10-21T16:00:00Z",
  "device_id": "uuid",
  "device_name": "My WhatsApp",
  "phone_number": "628123456789",
  "data": {
    "from": "628987654321",
    "message": "Hello!",
    "type": "text"
  }
}`}
      </pre>

      <h3>Testing Your Webhook</h3>
      <p>Use tools like:</p>
      <ul>
        <li><a href="https://webhook.site" target="_blank" rel="noopener noreferrer">webhook.site</a> - Free webhook testing</li>
        <li><a href="https://ngrok.com" target="_blank" rel="noopener noreferrer">ngrok</a> - Expose localhost to internet</li>
      </ul>
    </div>
  );
}

function IntegrationsContent() {
  return (
    <div className="prose max-w-none">
      <h2>Integrations</h2>

      <h3>n8n</h3>
      <p>Automate workflows with n8n:</p>
      <ol>
        <li>Create new workflow</li>
        <li>Add <strong>HTTP Request</strong> node</li>
        <li>Configure:
          <ul>
            <li>Method: POST</li>
            <li>URL: <code>http://localhost:3001/api/v1/messages/send</code></li>
            <li>Headers: <code>X-API-Key: YOUR_KEY</code></li>
          </ul>
        </li>
      </ol>

      <h3>Make.com</h3>
      <p>Connect with 1000+ apps:</p>
      <ol>
        <li>Create new scenario</li>
        <li>Add <strong>HTTP</strong> module</li>
        <li>Configure API endpoint</li>
      </ol>

      <h3>Google Apps Script</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`function sendWhatsApp() {
  const apiKey = 'YOUR_API_KEY';
  const url = 'http://localhost:3001/api/v1/messages/send';
  
  const options = {
    method: 'post',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      to: '628123456789',
      message: 'Hello from Google Sheets!'
    })
  };
  
  UrlFetchApp.fetch(url, options);
}`}
      </pre>
    </div>
  );
}
