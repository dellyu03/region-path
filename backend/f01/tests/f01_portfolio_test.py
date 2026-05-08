import json

sample_input = {
    "user_id": "demo_user_01",
    "target": {
        "job": "백엔드 개발자",
        "industry": "IT 서비스",
        "region": "충청권"
    },
    "profile": {
        "education": "소프트웨어학과 재학",
        "skills": ["Python", "SQL", "FastAPI"],
        "certificates": ["정보처리기사 필기 합격"],
        "projects": [
            {
                "name": "AI 포트폴리오 추천 서비스",
                "description": "공공데이터와 AI를 활용한 취업 지원 서비스",
                "tech_stack": ["Python", "Streamlit", "FastAPI"]
            }
        ],
        "activities": ["BDAI LLM/RAG 조별활동"],
        "training_history": []
    }
}


def create_portfolio(data):
    target = data["target"]
    profile = data["profile"]

    job = target["job"]
    industry = target["industry"]
    region = target["region"]
    skills = profile["skills"]
    certificates = profile["certificates"]
    projects = profile["projects"]

    portfolio_summary = f"{region} {industry} 분야의 {job}를 희망하는 구직자입니다."

    strength_tags = []

    if "Python" in skills:
        strength_tags.append("Python 기초")

    if "SQL" in skills:
        strength_tags.append("SQL 기초")

    if len(projects) > 0:
        strength_tags.append("프로젝트 경험")

    ncs_tag_candidates = ["응용SW엔지니어링", "데이터베이스", "서버프로그램구현"]

    f02_projects = []
    for project in projects:
        f02_projects.append({
            "name": project["name"],
            "tech_stack": project["tech_stack"]
        })

    result = {
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

    return result


portfolio_result = create_portfolio(sample_input)

print(json.dumps(portfolio_result, ensure_ascii=False, indent=2))
