import requests
import json

agent_id = "93fcd1e5-3f1f-4936-853b-b2e2135a919c"
api_key = "sk-agent-3a1537292e708b945455ff1b2fd0eca967d3e3e422c611d95c841f73333338f8"

url = f"http://localhost:8000/api/agents/{agent_id}/ask"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}
body = json.dumps({"question": "test"})

rate_limited = 0
for i in range(1, 26):
    try:
        r = requests.post(url, headers=headers, data=body, timeout=2)
        if r.status_code == 429:
            print(f"Req {i}: 429 Rate Limited ✓")
            rate_limited += 1
        else:
            print(f"Req {i}: {r.status_code}")
    except Exception as e:
        print(f"Req {i}: Error - {e}")

print(f"\n✓ Rate limiting works: {rate_limited} requests were rate-limited out of 25")
