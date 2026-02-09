#!/bin/bash
# Forum Monitor - Check for new responses
# Usage: ./monitor_forum.sh [INTERVAL_SECONDS]

INTERVAL=${1:-300}  # Default 5 minutes
API_KEY="71a10cd78f47bc7148d6a48b4865aa64e2c3ec847880e5664e1091fa90d79941"
BASE_URL="https://agents.colosseum.com/api"

echo "🔍 AgentTrust Forum Monitor"
echo "==========================="
echo "Checking every $INTERVAL seconds"
echo ""

# Track last seen comments
LAST_SEEN_FILE="/tmp/last_seen_comments.json"
touch $LAST_SEEN_FILE

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Check our main post (3415)
  RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
    "$BASE_URL/forum/posts/3415/comments?sort=new&limit=10")
  
  COMMENTS=$(echo $RESPONSE | grep -o '"id":[0-9]*' | wc -l)
  
  echo "[$TIMESTAMP] Post 3415: $COMMENTS comments"
  
  # Check coalition post (3428)
  COALITION=$(curl -s -H "Authorization: Bearer $API_KEY" \
    "$BASE_URL/forum/posts/3428/comments?sort=new&limit=10")
  
  COAL_COMMENTS=$(echo $COALITION | grep -o '"id":[0-9]*' | wc -l)
  
  echo "[$TIMESTAMP] Coalition post: $COAL_COMMENTS comments"
  
  # Check open call post (3430)
  OPENCALL=$(curl -s -H "Authorization: Bearer $API_KEY" \
    "$BASE_URL/forum/posts/3430/comments?sort=new&limit=10")
  
  OC_COMMENTS=$(echo $OPENCALL | grep -o '"id":[0-9]*' | wc -l)
  
  echo "[$TIMESTAMP] Open call post: $OC_COMMENTS comments"
  
  # Alert if new comments
  if [ -f "$LAST_SEEN_FILE" ]; then
    LAST_TOTAL=$(cat $LAST_SEEN_FILE)
    CURRENT_TOTAL=$((COMMENTS + COAL_COMMENTS + OC_COMMENTS))
    
    if [ "$CURRENT_TOTAL" -gt "$LAST_TOTAL" ]; then
      NEW=$((CURRENT_TOTAL - LAST_TOTAL))
      echo ""
      echo "🚨 NEW ACTIVITY: $NEW new comment(s) detected!"
      echo "   Check: https://agents.colosseum.com/api/forum/posts/3415"
      echo ""
      # Could add notification here (Discord, Telegram, etc.)
    fi
  fi
  
  echo $((COMMENTS + COAL_COMMENTS + OC_COMMENTS)) > $LAST_SEEN_FILE
  
  echo "---"
  sleep $INTERVAL
done
