from pydantic import BaseModel


class Education(BaseModel):
    degree: str
    college: str
    cgpa: str
    graduation_year: str


class Project(BaseModel):
    name: str
    description: str
    technologies: list[str]
    details: list[str]


class Certification(BaseModel):
    name: str
    provider: str
    date: str
    details: str


class SocialLinks(BaseModel):
    github: str
    linkedin: str
    portfolio: str


class Candidate(BaseModel):
    name: str
    education: Education
    skills: list[str]
    projects: list[Project]
    experience: list[str]
    achievements: list[str]
    certifications: list[Certification]
    social_links: SocialLinks