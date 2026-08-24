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


# =========================
# 2. READ PDF
# =========================

def extract_pdf_text(file_path):

    document = pymupdf.open(file_path)

    text = ""

    for page in document:
        text += page.get_text() + "\n"

    document.close()

    return text


# =========================
# 3. READ DOCX
# =========================

def extract_docx_text(file_path):

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


# =========================
# 4. READ RESUME
# =========================

def extract_resume_text(file_path):

    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)

    elif extension == ".docx":
        return extract_docx_text(file_path)

    else:
        raise ValueError(
            "Only PDF and DOCX files are supported."
        )


# =========================
# 5. GET RESUME INFORMATION
# =========================

def analyze_resume(resume_text):

    prompt = f"""
You are an expert resume analyzer.

Analyze the following resume and extract:

1. Skills
2. Total years of professional work experience
3. Projects
4. Education

Important:
- Calculate experience from actual internship/job dates.
- Do not count college duration as work experience.
- Do not invent skills, experience or projects.
- If experience is less than 1 year, return the actual decimal value.
- Return ONLY valid JSON.
- Do not use markdown code fences.

Return exactly this structure:

{{
    "skills": [],
    "experience_years": 0,
    "projects": [],
    "education": []
}}

Resume:

{resume_text}
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume analyzer."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        max_tokens=2000
    )

    answer = response.choices[0].message.content.strip()

    # Remove markdown JSON fences if model adds them
    if answer.startswith("```"):
        answer = answer.replace("```json", "")
        answer = answer.replace("```", "")
        answer = answer.strip()

    return json.loads(answer)


# =========================
# 6. MATCH RESUME WITH HR
# =========================

def match_resume(resume_data, hr_requirements):

    prompt = f"""
You are an expert technical recruiter.

Compare the candidate resume information with the HR requirements.

Candidate Resume Information:

{json.dumps(resume_data, indent=2)}

HR Requirements:

{json.dumps(hr_requirements, indent=2)}

Rules:

1. Match skills intelligently.
   Example:
   ReactJS should match React.
   REST API can match API-related requirements.

2. Do NOT consider similar but different technologies as a match.
   Example:
   C++ should NOT match Python.

3. Experience must satisfy:
   candidate experience >= required experience.

4. Match projects based on the actual project description.
   Example:
   A food delivery website can match a Web Development project requirement.

5. Do not invent missing projects.

6. Return ONLY valid JSON.
7. Do not use markdown code fences.

Return exactly:

{{
    "matched_skills": [],
    "missing_skills": [],
    "experience_match": true,
    "experience_reason": "",
    "matched_projects": [],
    "missing_projects": []
}}
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical recruiter."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        max_tokens=2000
    )

    answer = response.choices[0].message.content.strip()

    # Remove markdown JSON fences
    if answer.startswith("```"):
        answer = answer.replace("```json", "")
        answer = answer.replace("```", "")
        answer = answer.strip()

    return json.loads(answer)


# =========================
# 7. CALCULATE MATCH SCORE
# =========================

def calculate_score(match_data, hr_requirements):

    total_requirements = 0
    matched_requirements = 0

    # -------------------------
    # Skills
    # -------------------------

    required_skills = hr_requirements["skills"]

    total_requirements += len(required_skills)

    matched_requirements += len(
        match_data["matched_skills"]
    )

    # -------------------------
    # Experience
    # -------------------------

    total_requirements += 1

    if match_data["experience_match"]:
        matched_requirements += 1

    # -------------------------
    # Projects
    # -------------------------

    required_projects = hr_requirements["projects"]

    total_requirements += len(required_projects)

    matched_requirements += len(
        match_data["matched_projects"]
    )

    # -------------------------
    # Final score
    # -------------------------

    if total_requirements == 0:
        return 0

    score = (
        matched_requirements / total_requirements
    ) * 100

    return round(score, 2)


# =========================
# 8. MAIN PROGRAM
# =========================

def main():

    print("===================================")
    print("       AI RESUME MATCHER")
    print("===================================")

    # =========================
    # Resume Path
    # =========================

    resume_path = input(
        "\nEnter resume path (.pdf/.docx): "
    ).strip()

    if not os.path.exists(resume_path):

        print("\nResume file nahi mila.")

        return

    # =========================
    # HR Requirements
    # =========================

    print("\nEnter HR requirements:")

    skills_input = input(
        "Required skills (comma separated): "
    )

    experience_input = input(
        "Required experience in years: "
    )

    projects_input = input(
        "Required projects (comma separated): "
    )

    # =========================
    # Create HR Requirements
    # =========================

    hr_requirements = {

        "skills": [
            skill.strip()
            for skill in skills_input.split(",")
            if skill.strip()
        ],

        "experience_years": float(
            experience_input
        ),

        "projects": [
            project.strip()
            for project in projects_input.split(",")
            if project.strip()
        ]
    }

    # =========================
    # Extract Resume
    # =========================

    print("\nReading resume...")

    try:

        resume_text = extract_resume_text(
            resume_path
        )

    except Exception as error:

        print("\nResume read karne mein error:")
        print(error)

        return

    if not resume_text.strip():

        print(
            "\nResume se text extract nahi ho paya."
        )

        return

    print("Resume successfully read.")

    # =========================
    # Analyze Resume
    # =========================

    print("\nAnalyzing resume with AI...")

    try:

        resume_data = analyze_resume(
            resume_text
        )

    except Exception as error:

        print("\nAI resume analysis failed:")
        print(error)

        return

    print("\nResume Information:")

    print(
        json.dumps(
            resume_data,
            indent=2
        )
    )

    # =========================
    # Match Resume
    # =========================

    print(
        "\nMatching resume with HR requirements..."
    )

    try:

        match_data = match_resume(
            resume_data,
            hr_requirements
        )

    except Exception as error:

        print("\nResume matching failed:")
        print(error)

        return

    # =========================
    # Calculate Score
    # =========================

    score = calculate_score(
        match_data,
        hr_requirements
    )

    # =========================
    # FINAL RESULT
    # =========================

    print("\n===================================")
    print("           FINAL RESULT")
    print("===================================")

    print(f"\nMatch Score: {score}%")

    # =========================
    # Matched Skills
    # =========================

    print("\nMatched Skills:")

    if match_data["matched_skills"]:

        for skill in match_data["matched_skills"]:

            print(f"  ✅ {skill}")

    else:

        print("  None")

    # =========================
    # Missing Skills
    # =========================

    print("\nMissing Skills:")

    if match_data["missing_skills"]:

        for skill in match_data["missing_skills"]:

            print(f"  ❌ {skill}")

    else:

        print("  None")

    # =========================
    # Experience
    # =========================

    print("\nExperience:")

    if match_data["experience_match"]:

        print(
            "  ✅ Experience requirement satisfied"
        )

    else:

        print(
            "  ❌ Experience requirement not satisfied"
        )

    print(
        f"\nReason: "
        f"{match_data['experience_reason']}"
    )

    # =========================
    # Matched Projects
    # =========================

    print("\nMatched Projects:")

    if match_data["matched_projects"]:

        for project in match_data["matched_projects"]:

            print(f"  ✅ {project}")

    else:

        print("  None")

    # =========================
    # Missing Projects
    # =========================

    print("\nMissing Projects:")

    if match_data["missing_projects"]:

        for project in match_data["missing_projects"]:

            print(f"  ❌ {project}")

    else:

        print("  None")

    print("\n===================================")


# =========================
# RUN PROGRAM
# =========================

if __name__ == "__main__":

    main()