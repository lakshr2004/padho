import os
import json
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
import pymupdf
from docx import Document
from time import sleep


# =========================
# 1. LOAD API KEY
# =========================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY .env file mein nahi mila.")

client = Groq(api_key=api_key)

model = "openai/gpt-oss-120b"

prompt = "Explain how internet works."
message={
    "role" : "user",
    "content" : prompt
}
messages=[message]
# response1=client.chat.completions.create(model=model, messages=messages)
# # print(response1)
# answer=response1.choices[0].message.content
# print(answer)


stream=client.chat.completions.create(model=model, messages=messages,stream=True)

for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
       print(content, end="", flush=True)