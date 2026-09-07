import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app, calculate_score, get_recommendation

client = TestClient(app)


# ============================================================
# 1. EMPTY JOB DESCRIPTION
# ============================================================
def test_match_empty_job_description():
    response = client.post("/match", json={"job_description": ""})
    assert response.status_code == 422


# ============================================================
# 2. EXTREMELY SHORT JOB DESCRIPTION
# ============================================================
def test_match_extremely_short_description():
    response = client.post("/match", json={"job_description": "Python"})
    assert response.status_code == 422

    response_19 = client.post("/match", json={"job_description": "Python FastAPI Dev!"})
    assert len("Python FastAPI Dev!") < 20
    assert response_19.status_code == 422


# ============================================================
# 3. WHITESPACE-ONLY DESCRIPTION
# ============================================================
def test_match_whitespace_only_description():
    # Short whitespace
    response = client.post("/match", json={"job_description": "   \n\t   "})
    assert response.status_code == 422

    # Long whitespace (> 20 chars)
    response_long = client.post("/match", json={"job_description": " " * 50})
    assert response_long.status_code == 422


# ============================================================
# 4. NORMAL REQUIRED SKILLS (EXACT MATCHING)
# ============================================================
def test_match_normal_required_skills():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Required Skills:
            Python
            FastAPI
            PostgreSQL
            MongoDB
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data["matched_required_skills"]) == {"Python", "FastAPI", "PostgreSQL", "MongoDB"}
    assert data["missing_required_skills"] == []
    assert data["score"] == 100


# ============================================================
# 5. ALL REQUIRED SKILLS MATCHED
# ============================================================
def test_match_all_required_skills_matched():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Looking for a developer with:
            Python, FastAPI, Node.js, Express.js, MongoDB, PostgreSQL, Git, GitHub
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100
    assert data["missing_required_skills"] == []
    assert data["missing_skills"] == []
    assert data["matched_skills_count"] == data["required_skills_count"]
    assert data["recommendation"] == "Interview Recommended"


# ============================================================
# 6. NO REQUIRED SKILLS MATCHED
# ============================================================
def test_match_no_required_skills_matched():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Must have skills:
            AWS
            Docker
            Kubernetes
            Terraform
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 0
    assert data["matched_required_skills"] == []
    assert data["strengths"] == []
    assert set(data["missing_required_skills"]) == {"AWS", "Docker", "Kubernetes", "Terraform"}
    assert data["recommendation"] == "Interview Not Recommended"


# ============================================================
# 7. PARTIAL REQUIRED SKILL MATCH (DETERMINISTIC FORMULA)
# ============================================================
def test_match_partial_required_skills():
    # 2 matched (Python, FastAPI), 2 missing (AWS, Docker) -> 2/4 = 50%
    response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI
            AWS
            Docker
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    expected_score = round((2 / 4) * 100)  # 50
    assert data["score"] == expected_score
    assert set(data["matched_required_skills"]) == {"Python", "FastAPI"}
    assert set(data["missing_required_skills"]) == {"AWS", "Docker"}
    assert data["matched_skills_count"] == 2
    assert data["required_skills_count"] == 4
    assert data["recommendation"] == "Interview Not Recommended"  # 50 < 60


# ============================================================
# 8. OPTIONAL SKILLS DO NOT REDUCE REQUIRED SCORE
# ============================================================
def test_match_optional_skills_do_not_reduce_score():
    # JD with 2 matched required (Python, FastAPI)
    base_response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI
            """
        },
    )
    base_data = base_response.json()
    assert base_data["score"] == 100

    # Same JD + optional missing skills (AWS, Docker, Kubernetes)
    with_optional_response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI

            Nice to have:
            AWS
            Docker
            Kubernetes
            """
        },
    )
    with_optional_data = with_optional_response.json()
    # Score should still be 100 based strictly on required skills
    assert with_optional_data["score"] == 100
    assert set(with_optional_data["matched_required_skills"]) == {"Python", "FastAPI"}
    assert set(with_optional_data["missing_optional_skills"]) == {"AWS", "Docker", "Kubernetes"}


# ============================================================
# 9. REQUIRED + OPTIONAL SKILLS SEPARATED CORRECTLY
# ============================================================
def test_match_required_and_optional_separation():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI
            PostgreSQL

            Bonus Skills:
            MongoDB
            AWS
            Docker
            """
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert set(data["required_skills"]) == {"Python", "FastAPI", "PostgreSQL"}
    assert set(data["optional_skills"]) == {"MongoDB", "AWS", "Docker"}
    assert set(data["matched_required_skills"]) == {"Python", "FastAPI", "PostgreSQL"}
    assert set(data["matched_optional_skills"]) == {"MongoDB"}
    assert set(data["missing_optional_skills"]) == {"AWS", "Docker"}


# ============================================================
# 10. DUPLICATE SKILLS DO NOT ARTIFICIALLY INFLATE SCORE
# ============================================================
def test_match_duplicate_skills():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Python Python Python
            FastAPI FastAPI
            AWS AWS AWS
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    # 2 matched (Python, FastAPI), 1 missing (AWS) -> 2/3 = 67%
    assert data["score"] == round((2 / 3) * 100)
    assert data["matched_required_skills"].count("Python") == 1
    assert data["matched_required_skills"].count("FastAPI") == 1
    assert data["missing_required_skills"].count("AWS") == 1


# ============================================================
# 11. CASE VARIATIONS RESOLVE CONSISTENTLY
# ============================================================
def test_match_case_variations():
    resp_lower = client.post("/match", json={"job_description": "we need python, fastapi, postgresql developers"})
    resp_upper = client.post("/match", json={"job_description": "WE NEED PYTHON, FASTAPI, POSTGRESQL DEVELOPERS"})
    resp_mixed = client.post("/match", json={"job_description": "We need Python, FastAPI, PostgreSQL developers"})

    assert resp_lower.status_code == 200
    assert resp_upper.status_code == 200
    assert resp_mixed.status_code == 200

    data_lower = resp_lower.json()
    data_upper = resp_upper.json()
    data_mixed = resp_mixed.json()

    assert data_lower["score"] == data_upper["score"] == data_mixed["score"] == 100
    assert data_lower["matched_required_skills"] == data_upper["matched_required_skills"] == data_mixed["matched_required_skills"]


# ============================================================
# 12. EXTRA PUNCTUATION
# ============================================================
def test_match_extra_punctuation():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements: (Python), [FastAPI], {PostgreSQL}!; 'JWT' & "Git" / "GitHub"...
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "Python" in data["matched_required_skills"]
    assert "FastAPI" in data["matched_required_skills"]
    assert "PostgreSQL" in data["matched_required_skills"]
    assert "JWT" in data["matched_required_skills"]
    assert "Git" in data["matched_required_skills"]
    assert "GitHub" in data["matched_required_skills"]


# ============================================================
# 13. SKILL SUBSTRING PROBLEMS
# ============================================================
def test_match_skill_substring_isolation():
    # "pythonic", "expressive", "git-annex", etc. should not accidentally false-match
    response = client.post(
        "/match",
        json={
            "job_description": """
            Candidate must demonstrate pythonic syntax habits and expressive documentation skills.
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "Python" not in data["matched_required_skills"]
    assert "Express.js" not in data["matched_required_skills"]


# ============================================================
# 14. UNKNOWN TECHNOLOGIES
# ============================================================
def test_match_unknown_technologies():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI
            Kubernetes
            Terraform
            Rust
            Zig
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    # Known missing in alias list
    assert "Kubernetes" in data["missing_required_skills"]
    assert "Terraform" in data["missing_required_skills"]
    # Unmapped technologies do not cause 500 error
    assert "Python" in data["matched_required_skills"]
    assert "FastAPI" in data["matched_required_skills"]


# ============================================================
# 15. EMPTY SKILL EXTRACTION STABILITY
# ============================================================
def test_match_empty_skill_extraction():
    response = client.post(
        "/match",
        json={
            "job_description": """
            We are looking for an ambitious leader who will conduct client syncs and weekly meetings.
            """
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 0
    assert data["matched_skills_count"] == 0
    assert data["required_skills_count"] == 0
    assert data["required_skills"] == []
    assert data["recommendation"] == "Interview Not Recommended"


# ============================================================
# 16. MALFORMED REQUEST BODY
# ============================================================
def test_match_malformed_body():
    # Invalid JSON structure (non-string type)
    response = client.post("/match", json={"job_description": 12345})
    assert response.status_code == 422

    # Unexpected data type
    response_list = client.post("/match", json=["invalid", "array"])
    assert response_list.status_code == 422


# ============================================================
# 17. MISSING JOB_DESCRIPTION FIELD
# ============================================================
def test_match_missing_job_description_field():
    response = client.post("/match", json={"other_field": "some content here"})
    assert response.status_code == 422


# ============================================================
# 18. VERY LARGE JOB DESCRIPTION
# ============================================================
def test_match_very_large_job_description():
    # Beyond max_length (10000)
    oversized = "Python " * 1500  # ~10500 chars
    response_over = client.post("/match", json={"job_description": oversized})
    assert response_over.status_code == 422

    # Exactly within safe limit (~5000 chars)
    valid_large = ("Python FastAPI PostgreSQL Docker AWS \n" * 120)  # ~4500 chars
    response_valid = client.post("/match", json={"job_description": valid_large})
    assert response_valid.status_code == 200
    assert response_valid.json()["score"] == round((3 / 5) * 100)  # 60


# ============================================================
# 19 & 20. REPEATED REQUESTS & DETERMINISM
# ============================================================
def test_match_determinism_multiple_calls():
    payload = {
        "job_description": """
        Backend Engineer Position
        Required:
        Python
        FastAPI
        AWS
        Docker
        PostgreSQL

        Nice to have:
        MongoDB
        Terraform
        """
    }

    first_response = client.post("/match", json=payload).json()

    for _ in range(5):
        subsequent_response = client.post("/match", json=payload).json()
        assert subsequent_response == first_response
        assert subsequent_response["score"] == first_response["score"]
        assert subsequent_response["matched_required_skills"] == first_response["matched_required_skills"]
        assert subsequent_response["missing_required_skills"] == first_response["missing_required_skills"]
        assert subsequent_response["recommendation"] == first_response["recommendation"]


# ============================================================
# 21. RECOMMENDATION THRESHOLDS (>= 60 vs < 60)
# ============================================================
def test_match_recommendation_thresholds():
    # 1. Below threshold: 2 of 4 = 50% -> "Interview Not Recommended"
    resp_50 = client.post(
        "/match",
        json={"job_description": "Requirements: Python, FastAPI, AWS, Docker"},
    )
    assert resp_50.json()["score"] == 50
    assert resp_50.json()["recommendation"] == "Interview Not Recommended"

    # 2. Exactly at threshold: 3 of 5 = 60% -> "Interview Recommended"
    resp_60 = client.post(
        "/match",
        json={"job_description": "Requirements: Python, FastAPI, PostgreSQL, AWS, Docker"},
    )
    assert resp_60.json()["score"] == 60
    assert resp_60.json()["recommendation"] == "Interview Recommended"

    # 3. Just below threshold: 5 of 9 = 56% -> "Interview Not Recommended"
    # Matched (5): Python, FastAPI, PostgreSQL, MongoDB, Git
    # Missing (4): Docker, AWS, Kubernetes, Terraform
    resp_56 = client.post(
        "/match",
        json={
            "job_description": "Requirements: Python, FastAPI, PostgreSQL, MongoDB, Git, Docker, AWS, Kubernetes, Terraform"
        },
    )
    assert resp_56.json()["score"] == round((5 / 9) * 100)  # 56
    assert resp_56.json()["recommendation"] == "Interview Not Recommended"

    # 4. Zero score -> "Interview Not Recommended"
    resp_0 = client.post("/match", json={"job_description": "Requirements: Docker, AWS, Kubernetes"})
    assert resp_0.json()["score"] == 0
    assert resp_0.json()["recommendation"] == "Interview Not Recommended"

    # 5. Perfect score 100% -> "Interview Recommended"
    resp_100 = client.post("/match", json={"job_description": "Requirements: Python, FastAPI"})
    assert resp_100.json()["score"] == 100
    assert resp_100.json()["recommendation"] == "Interview Recommended"


# ============================================================
# 22. RESPONSE SCHEMA COMPLETENESS
# ============================================================
def test_match_response_schema_completeness():
    response = client.post(
        "/match",
        json={
            "job_description": """
            Requirements:
            Python
            FastAPI
            Docker

            Nice to have:
            PostgreSQL
            AWS
            """
        },
    )
    assert response.status_code == 200
    data = response.json()

    required_keys = [
        "score",
        "matched_skills_count",
        "required_skills_count",
        "strengths",
        "missing_skills",
        "required_skills",
        "optional_skills",
        "matched_required_skills",
        "missing_required_skills",
        "matched_optional_skills",
        "missing_optional_skills",
        "recommendation",
    ]

    for key in required_keys:
        assert key in data, f"Missing expected key: {key}"

    assert isinstance(data["score"], int)
    assert 0 <= data["score"] <= 100
    assert isinstance(data["matched_skills_count"], int)
    assert isinstance(data["required_skills_count"], int)
    assert isinstance(data["strengths"], list)
    assert isinstance(data["missing_skills"], list)
    assert isinstance(data["required_skills"], list)
    assert isinstance(data["optional_skills"], list)
    assert isinstance(data["matched_required_skills"], list)
    assert isinstance(data["missing_required_skills"], list)
    assert isinstance(data["matched_optional_skills"], list)
    assert isinstance(data["missing_optional_skills"], list)
    assert isinstance(data["recommendation"], str)