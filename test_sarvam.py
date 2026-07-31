import urllib.request
import json
import ssl
import base64

def get_sarvam_key():
    with open("inter-ai-backend/.env") as f:
        for line in f:
            if line.startswith("SARVAM_API_KEY="):
                return line.strip().split("=", 1)[1]
    return ""

sarvam_key = get_sarvam_key()
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_api(payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request("https://api.sarvam.ai/text-to-speech", data=data)
    req.add_header("api-subscription-key", sarvam_key)
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, context=ctx)
        print("Success:", resp.status)
        resp_data = json.loads(resp.read().decode('utf-8'))
        b64 = resp_data.get("audios", [""])[0]
        print("Audio length:", len(b64))
        if b64:
            print("Starts with:", b64[:20])
    except urllib.error.HTTPError as e:
        print("Error:", e.code, e.read().decode('utf-8'))

print("Testing v3 with ritu...")
test_api({
    "inputs": ["hello world"],
    "target_language_code": "en-IN",
    "speaker": "ritu",
    "pace": 1.0,
    "speech_sample_rate": 22050,
    "enable_preprocessing": True,
    "model": "bulbul:v3"
})

print("Testing v3 with aditya...")
test_api({
    "inputs": ["hello world"],
    "target_language_code": "en-IN",
    "speaker": "aditya",
    "pace": 1.0,
    "speech_sample_rate": 22050,
    "enable_preprocessing": True,
    "model": "bulbul:v3"
})
