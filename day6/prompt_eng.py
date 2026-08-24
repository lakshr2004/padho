import os
import json
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
import pymupdf
from docx import Document


# =========================
# 1. LOAD API KEY
# =========================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY .env file mein nahi mila.")

client = Groq(api_key=api_key)

model = "openai/gpt-oss-120b"


def llm_ans(prompt):
    message={
        "role" : "user",
        "content" : prompt
    }
    messages = [message]
    response = client.chat.completions.create(model = model,messages=messages)
    ans = response.choices[0].message.content
    return ans

bad_prompt="""
#ROLE: 
you are a support assistant at mobile/laptop company

#TASK : 
you have to classify the issue in a category

#CONSTRAINT
you have to classify the issue in one of the three categories namely billing,technical,return

#OUTPUT FORMAT
your answer should be in one word only.the one word word should be one of the categories given in constraints

#EXAMPLE
for instance if a user complain says he want a refund then category is return

#FALLBACK
if the issue is unreleated to any of the categories mentioned in constraints,then the answer should be OTHERS

this is a user complaint:
i am from ranchi
"""
print(llm_ans(bad_prompt))