import requests
import json
import time

BASE_URL = "http://localhost:8000"

if __name__ == "__main__":
    # Unique email to avoid unique constraint violation if run multiple times
    email = f"test_{int(time.time())}@example.com"
    password = "password123"

    print(f"1. Registering user {email}...")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password
    })
    if r.status_code not in (200, 201):
        print("Registration failed:", r.text)
        exit(1)

    print("2. Logging in...")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    token = r.json()["jwt_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("3. Creating chat...")
    r = requests.post(f"{BASE_URL}/chats", json={"name": "Test AI Chat"}, headers=headers)
    if r.status_code not in (200, 201):
        print("Chat creation failed:", r.status_code, r.text)
        exit(1)
    chat_id = r.json()["id"]
    print(f"Chat created: {chat_id}")

    print("4. Sending prompt to AI...")
    prompt_payload = {
        "prompt": "Привет! Напиши простейший SQL запрос SELECT 1; и ничего больше."
    }
    r = requests.post(f"{BASE_URL}/chats/{chat_id}/prompt", json=prompt_payload, headers=headers)

    print("--- AI RESPONSE ---")
    print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    print("-------------------")
