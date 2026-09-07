import os
import json
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

import pymupdf
from docx import Document
from time import sleep

from models import Candidate


# =========================
# 1. LOAD API KEY
# =========================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY .env file mein nahi mila.")

client = Groq(api_key=api_key)

model = "openai/gpt-oss-120b"


# =========================
# 2. LOAD CANDIDATE DATA
# =========================

candidate_path = Path("candidate.json")

with open(candidate_path, "r") as file:
    candidate_data = json.load(file)

candidate = Candidate(**candidate_data)
print(candidate)

conversation_history = []


def ask_ai(question):

    system_prompt = f"""
    You are the AI representative of {candidate.name}.

    Answer questions about the candidate using ONLY the
    information provided below.

    Candidate Information:
    {candidate.model_dump_json(indent=2)}

    Rules:
    1. Never invent information.
    2. Never assume information that is not provided.
    3. If the requested information is missing, clearly say
       that you don't have that information.
    4. Be honest and professional.
    5. Do not claim that the candidate has experience,
       skills, achievements, or qualifications that are not
       present in the candidate information.
    """

    conversation_history.append({
        "role": "user",
        "content": question
    })

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    messages.extend(conversation_history)

    response = client.chat.completions.create(
        model=model,
        messages=messages
    )

    answer = response.choices[0].message.content

    conversation_history.append({
        "role": "assistant",
        "content": answer
    })

    return answer

while True:

    question = input("\nAsk something about Laksh: ")

    if question.lower() == "exit":
        break

    answer = ask_ai(question)

    print("\nAI:", answer)