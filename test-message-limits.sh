#!/bin/bash

echo "🧪 Testing Message Limits Feature"
echo "=================================="
echo ""

API_KEY="apivroePuz7j6viCOZSsC0YaICTrTtsoyYcqJD"
PHONE="6285361405924"

# Test 1: Normal send
echo "1️⃣ Test: Normal send (within limit)"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$PHONE\",\"message\":\"Test message limits\"}")

echo "$RESPONSE" | jq '{success, quota_used, quota_remaining, quota_limit}'
echo ""

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    echo "✅ Message sent successfully!"
    QUOTA_USED=$(echo "$RESPONSE" | jq -r '.quota_used')
    QUOTA_LIMIT=$(echo "$RESPONSE" | jq -r '.quota_limit')
    echo "📊 Quota: $QUOTA_USED / $QUOTA_LIMIT"
else
    echo "❌ Failed to send message"
    echo "$RESPONSE" | jq '{error, message}'
fi

echo ""
echo "=================================="
echo "🏁 Test completed"
echo ""
echo "📝 Next steps:"
echo "1. Check backend logs for reset message"
echo "2. Verify quota in dashboard"
echo "3. Test limit reached (set messages_used = 50 in DB)"
