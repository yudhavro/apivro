#!/bin/bash

echo "🔍 Testing API VRO - Debug Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check backend health
echo "1️⃣ Checking backend health..."
HEALTH=$(curl -s http://localhost:3001/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    exit 1
fi
echo ""

# 2. Check WAHA health
echo "2️⃣ Checking WAHA health..."
WAHA_HEALTH=$(curl -s -H "X-Api-Key: mysecretkey123" http://localhost:3000/api/sessions)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ WAHA is running${NC}"
    echo "   Sessions found:"
    echo "$WAHA_HEALTH" | jq -r '.[] | "   - \(.name) [\(.status)]"'
else
    echo -e "${RED}❌ WAHA is not running${NC}"
    exit 1
fi
echo ""

# 3. Get working session
echo "3️⃣ Finding WORKING session..."
WORKING_SESSION=$(echo "$WAHA_HEALTH" | jq -r '.[] | select(.status=="WORKING") | .name' | head -1)
if [ -n "$WORKING_SESSION" ]; then
    echo -e "${GREEN}✅ Found WORKING session: $WORKING_SESSION${NC}"
else
    echo -e "${RED}❌ No WORKING session found${NC}"
    echo -e "${YELLOW}⚠️  Please connect a device first${NC}"
    exit 1
fi
echo ""

# 4. Check database for device with this session
echo "4️⃣ Checking database for device..."
echo -e "${YELLOW}ℹ️  Please manually check Supabase:${NC}"
echo "   SELECT id, name, session_id, status FROM devices WHERE session_id = '$WORKING_SESSION';"
echo ""

# 5. Test with API key from user
echo "5️⃣ Testing API endpoint..."
API_KEY="apivroudbVZ1Ny6hv1Fos9YRzjIys6zxpz7Nyn"
PHONE="6285172420505"
MESSAGE="Test dari script - $(date +%H:%M:%S)"

echo "   API Key: $API_KEY"
echo "   Phone: $PHONE"
echo "   Message: $MESSAGE"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/v1/messages/send \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$PHONE\",
    \"message\": \"$MESSAGE\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "   HTTP Status: $HTTP_CODE"
echo "   Response:"
echo "$BODY" | jq '.'

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Message sent successfully!${NC}"
else
    echo -e "${RED}❌ Failed to send message${NC}"
    
    # Parse error
    ERROR=$(echo "$BODY" | jq -r '.error // "UNKNOWN"')
    MESSAGE=$(echo "$BODY" | jq -r '.message // "Unknown error"')
    
    echo ""
    echo "🔍 Troubleshooting:"
    case "$ERROR" in
        "INVALID_API_KEY")
            echo -e "${YELLOW}   → API key is invalid or not in database${NC}"
            echo "   → Go to /api-keys page and create a new one"
            ;;
        "DEVICE_NOT_CONNECTED")
            echo -e "${YELLOW}   → Device status is not 'connected'${NC}"
            echo "   → Check device status in database"
            ;;
        "WAHA_ERROR")
            echo -e "${YELLOW}   → WAHA returned an error${NC}"
            echo "   → Check if session_id in database matches WAHA session"
            echo "   → Current WORKING session: $WORKING_SESSION"
            ;;
        *)
            echo -e "${YELLOW}   → $MESSAGE${NC}"
            ;;
    esac
fi

echo ""
echo "=================================="
echo "🏁 Test completed"
