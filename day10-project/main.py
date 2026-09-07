import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from groq import Groq
from pydantic import BaseModel, Field, field_validator

from models import Candidate


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Laksh AI Backend",
    version="2.0.0",
    description="AI Candidate Representative and Deterministic Job Matching API",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    @field_validator("question")
    @classmethod
    def validate_question_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty or whitespace only.")
        return v


class MatchRequest(BaseModel):
    job_description: str = Field(
        ...,
        min_length=20,
        max_length=10000,
    )

    @field_validator("job_description")
    @classmethod
    def validate_job_description_not_whitespace(cls, v: str) -> str:
        if not v.strip() or len(v.strip()) < 20:
            raise ValueError(
                "Job description must contain at least 20 non-whitespace characters."
            )
        return v


class MatchResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    matched_skills_count: int = Field(..., ge=0)
    required_skills_count: int = Field(..., ge=0)

    # Backward-compatible fields used by the current frontend.
    strengths: list[str]
    missing_skills: list[str]

    required_skills: list[str]
    optional_skills: list[str]
    matched_required_skills: list[str]
    missing_required_skills: list[str]
    matched_optional_skills: list[str]
    missing_optional_skills: list[str]

    recommendation: str


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "GROQ_API_KEY .env file mein nahi mila."
    )

client = Groq(api_key=api_key)

model = "openai/gpt-oss-120b"


# ============================================================
# LOAD CANDIDATE DATA
# ============================================================

candidate_path = Path("candidate.json")

if not candidate_path.exists():
    raise FileNotFoundError(
        "candidate.json file nahi mila."
    )

with open(candidate_path, "r", encoding="utf-8") as file:
    candidate_data = json.load(file)

candidate = Candidate(**candidate_data)


# ============================================================
# CONVERSATION MEMORY
# ============================================================

conversation_history = []

MAX_HISTORY_MESSAGES = 20


# ============================================================
# SKILL NORMALIZATION
# ============================================================

SKILL_ALIASES = {
    "python": "Python",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "java": "Java",

    "node.js": "Node.js",
    "nodejs": "Node.js",

    "express.js": "Express.js",
    "express": "Express.js",

    "fastapi": "FastAPI",

    "rest api": "REST API Design",
    "rest apis": "REST API Design",
    "rest api design": "REST API Design",

    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",

    "mongodb": "MongoDB",
    "mongo": "MongoDB",

    "sql": "SQL",

    "numpy": "NumPy",
    "pandas": "Pandas",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",

    "jwt": "JWT",

    "rbac": "Role-Based Access Control (RBAC)",
    "role based access control": "Role-Based Access Control (RBAC)",
    "role-based access control": "Role-Based Access Control (RBAC)",

    "bcrypt": "bcrypt",

    "git": "Git",
    "github": "GitHub",

    "vs code": "VS Code",
    "visual studio code": "VS Code",

    "render": "Render",
    "vercel": "Vercel",
    "vite": "Vite",

    "tailwind": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",

    "framer motion": "Framer Motion",

    "manual test-case design": "Manual Test-Case Design",
    "manual testing": "Manual Test-Case Design",

    "input validation": "Input Validation",

    "security checks": "Security Checks",

    "docker": "Docker",
    "aws": "AWS",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",

    "react": "React",
    "react.js": "React",

    "html": "HTML",
    "css": "CSS",

    "typescript": "TypeScript",
    "next.js": "Next.js",
    "nextjs": "Next.js",

    "redis": "Redis",
    "mysql": "MySQL",

    "linux": "Linux",
}


# ============================================================
# CANDIDATE SKILLS
# ============================================================

candidate_skills = {
    skill.strip().lower(): skill.strip()
    for skill in candidate.skills
}


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text: str) -> str:
    """
    Normalize text so skill matching becomes
    case-insensitive and punctuation-independent.
    """

    text = text.lower()

    text = text.replace("-", " ")
    text = text.replace("_", " ")
    text = text.replace("/", " ")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# JD SECTION DETECTION
# ============================================================

OPTIONAL_SECTION_MARKERS = (
    "nice to have",
    "nice-to-have",
    "preferred",
    "optional",
    "bonus",
    "good to have",
    "good-to-have",
    "preferred skills",
    "optional skills",
)

REQUIRED_SECTION_MARKERS = (
    "requirements",
    "required",
    "required skills",
    "must have",
    "must-have",
    "core skills",
    "essential skills",
    "qualifications",
)

NEUTRAL_SECTION_MARKERS = (
    "responsibilities",
    "responsibility",
    "what you will do",
    "what you'll do",
    "education",
    "benefits",
    "about the role",
    "about us",
)


def _section_marker(line: str) -> str | None:
    """
    Return the section type for a JD heading.

    Only explicit section wording changes the required/optional
    classification. This keeps the matcher deterministic.
    """

    normalized = normalize_text(line).strip(" :.-")

    if not normalized:
        return None

    if any(
        normalized == marker
        or normalized.startswith(marker + " ")
        for marker in OPTIONAL_SECTION_MARKERS
    ):
        return "optional"

    if any(
        normalized == marker
        or normalized.startswith(marker + " ")
        for marker in REQUIRED_SECTION_MARKERS
    ):
        return "required"

    if any(
        normalized == marker
        or normalized.startswith(marker + " ")
        for marker in NEUTRAL_SECTION_MARKERS
    ):
        return "neutral"

    return None


def _skills_in_text(text: str) -> list[str]:
    """Detect known skills from a text fragment deterministically."""

    normalized_text = normalize_text(text)
    detected_skills = []

    # Longest aliases first prevents shorter aliases from winning
    # before more specific phrases such as "REST API Design".
    aliases = sorted(
        SKILL_ALIASES.items(),
        key=lambda item: len(normalize_text(item[0])),
        reverse=True,
    )

    for alias, canonical_name in aliases:
        normalized_alias = normalize_text(alias)
        pattern = rf"\b{re.escape(normalized_alias)}\b"

        if re.search(pattern, normalized_text):
            if canonical_name not in detected_skills:
                detected_skills.append(canonical_name)

    return detected_skills


def extract_job_skill_sections(
    job_description: str,
) -> tuple[list[str], list[str]]:
    """
    Extract required and optional skills from a JD.

    Classification is deterministic:
    - Skills under an explicit optional/preferred section are optional.
    - Skills under an explicit required/requirements section are required.
    - If no optional section is present, all detected skills are required.
    """

    lines = job_description.splitlines()

    required_skills = []
    optional_skills = []

    # Default to required so existing JDs keep their previous behavior.
    current_section = "required"
    optional_section_seen = False

    for raw_line in lines:
        line = raw_line.strip()

        marker = _section_marker(line)

        if marker:
            current_section = marker

            if marker == "optional":
                optional_section_seen = True

            continue

        if not line:
            continue

        skills = _skills_in_text(line)

        for skill in skills:
            if current_section == "optional":
                if skill not in optional_skills:
                    optional_skills.append(skill)
            elif current_section != "neutral":
                if skill not in required_skills:
                    required_skills.append(skill)

    # Preserve deterministic ordering and prevent overlap.
    optional_skills = [
        skill
        for skill in optional_skills
        if skill not in required_skills
    ]

    # If no explicit optional section exists, all detected skills are required.
    if not optional_section_seen:
        all_skills = _skills_in_text(job_description)
        required_skills = all_skills
        optional_skills = []

    return required_skills, optional_skills


# ============================================================
# MATCH SKILLS
# ============================================================

def match_skills(job_skills: list[str]):
    """
    Compare detected JD skills against candidate skills.
    """

    strengths = []
    missing_skills = []

    normalized_candidate_skills = {
        normalize_text(skill): skill
        for skill in candidate.skills
    }

    for skill in job_skills:
        normalized_skill = normalize_text(skill)

        if normalized_skill in normalized_candidate_skills:
            strengths.append(
                normalized_candidate_skills[normalized_skill]
            )
        else:
            missing_skills.append(skill)

    return strengths, missing_skills


# ============================================================
# DETERMINISTIC SCORE
# ============================================================

def calculate_score(
    strengths: list[str],
    missing_skills: list[str],
) -> int:
    """
    Calculate score using REQUIRED skills only.

    Score = matched required skills / total required skills * 100.
    """

    total_required = len(strengths) + len(missing_skills)

    if total_required == 0:
        return 0

    return round(
        (len(strengths) / total_required) * 100
    )


# ============================================================
# DETERMINISTIC RECOMMENDATION
# ============================================================

def get_recommendation(score: int) -> str:
    """
    Recommendation is based only on deterministic score.
    """

    if score >= 60:
        return "Interview Recommended"

    return "Interview Not Recommended"


# ============================================================
# AI FUNCTION - CHAT STREAMING
# ============================================================

def ask_ai(question: str):

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
6. Use Markdown for formatting.
7. Prefer headings and bullet points instead of tables.
8. Keep answers clear and concise.
9. Do not use HTML tags such as <br>.
10. Do not create information that is not explicitly
    present in the candidate data.
"""

    conversation_history.append(
        {
            "role": "user",
            "content": question,
        }
    )

    # Prevent unlimited memory growth
    if len(conversation_history) > MAX_HISTORY_MESSAGES:
        del conversation_history[
            :-MAX_HISTORY_MESSAGES
        ]

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        }
    ]

    messages.extend(conversation_history)

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )

    full_answer = ""

    for chunk in response:

        if not chunk.choices:
            continue

        content = chunk.choices[0].delta.content

        if content:

            full_answer += content

            yield content

    conversation_history.append(
        {
            "role": "assistant",
            "content": full_answer,
        }
    )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Laksh AI Backend is running",
        "version": "2.0.0",
    }


# ============================================================
# CHAT ENDPOINT
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    return StreamingResponse(
        ask_ai(request.question),
        media_type="text/plain",
    )


# ============================================================
# JOB MATCHING
# ============================================================

@app.post(
    "/match",
    response_model=MatchResponse,
)
def match(request: MatchRequest):

    job_description = request.job_description.strip()

    if not job_description:
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty.",
        )

    # --------------------------------------------------------
    # 1. Detect required and optional skills from JD
    # --------------------------------------------------------

    required_skills, optional_skills = extract_job_skill_sections(
        job_description
    )

    # --------------------------------------------------------
    # 2. Match required skills
    # --------------------------------------------------------

    matched_required_skills, missing_required_skills = match_skills(
        required_skills
    )

    # --------------------------------------------------------
    # 3. Match optional skills
    # --------------------------------------------------------

    matched_optional_skills, missing_optional_skills = match_skills(
        optional_skills
    )

    # --------------------------------------------------------
    # 4. Calculate score from REQUIRED skills only
    # --------------------------------------------------------

    score = calculate_score(
        matched_required_skills,
        missing_required_skills,
    )

    # --------------------------------------------------------
    # 5. Deterministic recommendation
    # --------------------------------------------------------

    recommendation = get_recommendation(score)

    return MatchResponse(
        score=score,
        matched_skills_count=len(matched_required_skills),
        required_skills_count=len(required_skills),

        # Backward-compatible fields for the existing frontend.
        strengths=matched_required_skills,
        missing_skills=missing_required_skills,

        required_skills=required_skills,
        optional_skills=optional_skills,
        matched_required_skills=matched_required_skills,
        missing_required_skills=missing_required_skills,
        matched_optional_skills=matched_optional_skills,
        missing_optional_skills=missing_optional_skills,

        recommendation=recommendation,
    )
