#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

try:
    import pymysql
    from config import settings

    conn = pymysql.connect(
        host='localhost',
        port=3307,
        user='root',
        password='',
        database='ai_agents_studio'
    )

    cursor = conn.cursor()
    cursor.execute("SELECT agent_id, api_key, is_active FROM agent_deployments ORDER BY created_at DESC LIMIT 1;")
    result = cursor.fetchone()

    if result:
        agent_id, api_key_value, is_active = result
        is_hex = len(api_key_value) == 64 and all(c in '0123456789abcdef' for c in api_key_value.lower())
        print(f"✓ Last deployment in DB:")
        print(f"  Agent ID: {agent_id}")
        print(f"  API Key stored: {api_key_value[:16]}... (length: {len(api_key_value)})")
        print(f"  Is SHA256 hex format: {'YES ✓' if is_hex else 'NO ✗'}")
        print(f"  Is Active: {is_active}")
    else:
        print("❌ No deployments found in database")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
