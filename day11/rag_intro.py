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

knowledge_base={
    "age" : " The age of pratyush is 25 years",
    "net worth" : "The net worth of pratyush is 2000"
}

# step 2 retreieval
def retrieve_info(question):
    question=question.lower()
    if "age" in question:
        return knowledge_base["age"]
    elif "net worth" in question:
        return knowledge_base["net worth"]
    else:
        return None
def ask_llm(question):
    context=retrieve_info(question)

    sys_prompt=f"""answer in one line only. Answer only based on this context. do not hallucinate. Context: {context}"""
    system_message={
        "role": "system",
        "content": sys_prompt

    }
    message={
        "role": "user",
        "content": question
    }
    messages=[system_message, message]
    response=client.chat.completions.create(model=model, messages=messages)
    answer=response.choices[0].message.content
    return answer


question="what is pratyush's net worth?"
print(ask_llm(question))