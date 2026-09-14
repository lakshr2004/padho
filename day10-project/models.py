from pydantic import BaseModel


class BachelorsEducation(BaseModel):
    degree: str
    college: str
    gpa: str
    start_year: int
    graduation_year: int


class SchoolEducation(BaseModel):
    level: str
    school: str
    board: str
    start_year: int
    completion_year: int


class Education(BaseModel):
    bachelors: BachelorsEducation
    higher_secondary: SchoolEducation
    secondary: SchoolEducation


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