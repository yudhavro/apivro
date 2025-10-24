import { useState } from 'react';
import { Send, Code, Copy, Check } from 'lucide-react';

export function APIPlaygroundPage() {
  const [apiKey, setApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSendMessage() {
    if (!apiKey || !phoneNumber || !message) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('http://localhost:3001/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message
        })
      });

      const data = await res.json();
      setResponse({ status: res.status, data });
    } catch (error: any) {
      setResponse({ 
        status: 500, 
        data: { success: false, error: error.message } 
      });
    } finally {
      setLoading(false);
    }
  }

  function generateCurlCommand() {
    return `curl -X POST http://localhost:3001/api/v1/messages/send \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${phoneNumber || '628123456789'}",
    "message": "${message || 'Your message here'}"
  }'`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">API Playground</h1>
        <p className="text-slate-600 mt-1">
          Test your API endpoints directly from the dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Send Test Message
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="apivroXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from the API Keys page
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="628123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                International format without + (e.g., 628123456789)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={loading || !apiKey || !phoneNumber || !message}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          {/* cURL Command */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                cURL Command
              </h3>
              <button
                onClick={() => copyToClipboard(generateCurlCommand())}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              {generateCurlCommand()}
            </pre>
          </div>
        </div>

        {/* Right: Response */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Response
          </h2>

          {!response ? (
            <div className="text-center py-12 text-gray-500">
              <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>Send a message to see the response</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Code
                </label>
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    response.status === 200
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {response.status}
                </div>
              </div>

              {/* Response Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Body
                </label>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>

              {/* Success Info */}
              {response.data.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-900 mb-2">
                    ✅ Message Sent Successfully!
                  </h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>
                      <strong>Message ID:</strong>{' '}
                      {typeof response.data.message_id === 'object' 
                        ? response.data.message_id?.id || JSON.stringify(response.data.message_id)
                        : response.data.message_id}
                    </p>
                    <p>
                      <strong>Recipient:</strong> {response.data.recipient}
                    </p>
                    <p>
                      <strong>Quota Remaining:</strong>{' '}
                      {response.data.quota_remaining} / {response.data.quota_limit}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Info */}
              {!response.data.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-900 mb-2">
                    ❌ Error
                  </h3>
                  <p className="text-sm text-red-800">
                    <strong>Code:</strong> {response.data.error}
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    <strong>Message:</strong> {response.data.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Code Examples
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* JavaScript */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              JavaScript
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`const response = await fetch(
  'http://localhost:3001/api/v1/messages/send',
  {
    method: 'POST',
    headers: {
      'X-API-Key': '${apiKey || 'YOUR_API_KEY'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: '${phoneNumber || '628123456789'}',
      message: '${message || 'Your message'}'
    })
  }
);

const data = await response.json();
console.log(data);`}
            </pre>
          </div>

          {/* Python */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Python</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`import requests

headers = {
    'X-API-Key': '${apiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
}

data = {
    'to': '${phoneNumber || '628123456789'}',
    'message': '${message || 'Your message'}'
}

response = requests.post(
    'http://localhost:3001/api/v1/messages/send',
    headers=headers,
    json=data
)

print(response.json())`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
