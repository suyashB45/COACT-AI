import urllib.request
import json
import base64

data = json.dumps({"text": "Hello world", "voice": "fable"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/speak", data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        content = response.read()
        print(f"Status: {response.status}")
        print(f"Length: {len(content)}")
        print(f"Content Type: {response.getheader('Content-Type')}")
        if len(content) > 100:
            print("Audio seems to be returned successfully.")
            with open("test_audio.wav", "wb") as f:
                f.write(content)
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, "read"):
        print(e.read().decode())
