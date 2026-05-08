# F-01: 사용자 스펙 입력 및 포트폴리오 생성

## 개요
사용자의 희망 직무, 지역, 기술 스택, 프로젝트 경험 등을 입력받아
구조화된 포트폴리오 JSON을 생성하는 기능입니다.

## 주요 기능
- 사용자 스펙 입력 처리
- 포트폴리오 요약 생성
- 기술 태그 및 NCS 태그 생성
- F-02로 전달할 JSON 구조 생성

## API

### POST /f01/generate

#### Request
```json
{
  "target": {
    "job": "백엔드 개발자",
    "industry": "IT 서비스",
    "region": "충청권"
  },
  "profile": {
    "skills": ["Python", "SQL"],
    "certificates": [],
    "projects": []
  }
}
