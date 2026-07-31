import os
from dotenv import load_dotenv

load_dotenv()
from langchain_openai import ChatOpenAI

try:
    chat = ChatOpenAI(
        model=os.getenv("CHAT_MODEL") or "llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    res = chat.invoke("Hello, who are you?")
    print("ChatOpenAI SUCCESS:", res.content)
except Exception as e:
    print("ChatOpenAI FAILED:", e)
