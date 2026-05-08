from fastapi import FastAPI

app = FastAPI()


@app.post("/f01/generate")
def generate_portfolio(data: dict):
    target = data["target"]
    profile = data["profile"]

    job = target["job"]
    industry = target["industry"]
    region = target["region"]

    skills = profile.get("skills", [])
    certificates = profile.get("certificates", [])
    projects = profile.get("projects", [])
    activities = profile.get("activities", [])
    training_history = profile.get("training_history", [])

    portfolio_summary = f"{region} {industry} 분야의 {job}를 희망하는 구직자입니다."

    strength_tags = []

    if "Python" in skills:
        strength_tags.append("Python 기초")

    if "SQL" in skills:
        strength_tags.append("SQL 기초")

    if "FastAPI" in skills:
        strength_tags.append("백엔드 API 개발 기초")

    if len(projects) > 0:
        strength_tags.append("프로젝트 경험")

    if len(activities) > 0:
        strength_tags.append("대외활동 경험")

    ncs_tag_candidates = ["응용SW엔지니어링", "데이터베이스", "서버프로그램구현"]

    f02_projects = []
    for project in projects:
        f02_projects.append({
            "name": project.get("name", ""),
            "tech_stack": project.get("tech_stack", [])
        })

    return {
        "portfolio_summary": portfolio_summary,
        "strength_tags": strength_tags,
        "skill_tags": skills,
        "ncs_tag_candidates": ncs_tag_candidates,
        "next_step_for_f02": {
            "target_job": job,
            "target_region": region,
            "skills": skills,
            "certificates": certificates,
            "projects": f02_projects,
            "ncs_tag_candidates": ncs_tag_candidates
        }
    }