# 🗺️ RegionPath

> 비수도권 청년이 지역 강세 산업을 탐색하고, AI 역량 갭 분석으로 맞춤 훈련·정책을 추천받는 지역 기반 취업 내비게이션 플랫폼

![Status](https://img.shields.io/badge/status-in--development-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)

---

## 💡 개요

비수도권 청년 구직자는 같은 스펙이라도 **정보·기회·공신력** 세 가지가 동시에 부족한 구조적 불평등에 처해 있다.

- 어떤 지역에 어떤 산업 기반이 있는지 한눈에 볼 수 있는 서비스가 없다
- 지방 일자리는 존재하지만 '그 지역에서 살 수 있는가'에 대한 정보가 없다
- 역량을 증명할 포트폴리오 작성 지원이 수도권에 집중돼 있다

RegionPath는 **SGIS 사업체통계 × 고용행정통계 교차 분석**으로 지역별 진짜 유망 산업을 도출하고, **AI 인터뷰**로 내 스펙을 구조화한 뒤 필요 역량과 비교해 갭을 수치로 보여준다.

---

## 🚀 주요 기능

| 우선순위 | 기능 | 설명 |
|---|---|---|
| 🔴 P0 | AI 포트폴리오 자동 생성 | Claude API 대화형 인터뷰 → NCS 역량 태깅 → 구조화 포트폴리오 JSON |
| 🔴 P0 | 지역별 유망 산업 지도 | SGIS LQ × 고용행정통계 구인/구직 비율 교차 → choropleth 시각화 |
| 🔴 P0 | 유망 직종 추천 + 갭 분석 | LLM 직종 추천 + NCS 필요 스펙 vs 내 포트폴리오 항목별 비교 |
| 🟡 P1 | 지역 인프라 매칭 | 희망 직업 + SGIS 생활인프라 선호 이중 축 → 지역 TOP3 추천 |
| 🟡 P1 | 훈련·정책 추천 | 갭 분석 기반 HRD-Net 국비과정 자동 연결 + 국민취업지원제도 자격 판단 |

---

## 📦 아키텍처

```
┌─────────────────────────────────┐
│         Next.js 14 (Frontend)   │
│  /map  /portfolio  /gap         │
│  /region  /training             │
└──────────────┬──────────────────┘
               │ REST API
┌──────────────▼──────────────────┐
│         FastAPI (Backend)       │
│                                 │
│  /map/score   /map/tech         │
│  /portfolio   /gap              │
│  /region      /training         │
│  /jobs/recommend                │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐  ┌────▼──────────────────┐
│  Claude API │  │  Public APIs          │
│  LangChain  │  │  SGIS / 고용행정통계  │
│  RAG        │  │  HRD-Net / NCS        │
└─────────────┘  └───────────────────────┘
```

---

## 🛠 기술 스택

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?logo=react&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?logo=react&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3dotjs&logoColor=white)

**Backend**

![Python](https://img.shields.io/badge/Python_3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?logo=langchain&logoColor=white)

**AI / Data**

![Claude](https://img.shields.io/badge/Claude_API-D97757?logo=anthropic&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_Embeddings-412991?logo=openai&logoColor=white)

**Public APIs**

![SGIS](https://img.shields.io/badge/SGIS-통계청-0078D4)
![고용행정통계](https://img.shields.io/badge/고용행정통계-고용노동부-00A651)
![HRD-Net](https://img.shields.io/badge/HRD--Net-고용노동부-00A651)
![NCS](https://img.shields.io/badge/NCS-한국고용정보원-FF6B35)

---

## 📁 프로젝트 구조

```
regionpath/
├── frontend/                   # Next.js 14
│   ├── app/
│   │   ├── map/                # 지역 유망 산업 지도
│   │   ├── portfolio/          # AI 포트폴리오 생성
│   │   ├── gap/                # 역량 갭 분석 대시보드
│   │   ├── region/             # 지역 인프라 매칭
│   │   └── training/           # 훈련·정책 추천
│   ├── components/
│   │   ├── KoreaMap.tsx        # choropleth 지도 (React Simple Maps + D3)
│   │   ├── GapRadarChart.tsx   # 역량 갭 레이더 차트
│   │   └── ChatBot.tsx         # AI 인터뷰 챗봇
│   ├── lib/
│   │   └── api.ts              # FastAPI 호출 클라이언트
│   └── store/                  # Zustand 상태 관리
│
├── backend/                    # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── map.py              # 지역 유망 산업 스코어링
│   │   ├── portfolio.py        # 포트폴리오 구조화
│   │   ├── gap.py              # 역량 갭 분석
│   │   ├── region.py           # 지역 인프라 매칭
│   │   └── training.py         # 훈련·정책 추천
│   ├── services/
│   │   ├── lq_calculator.py    # 입지계수(LQ) 계산
│   │   ├── employment_api.py   # 고용행정통계 API 연동
│   │   ├── sgis_api.py         # SGIS API 연동
│   │   └── rag/                # LangChain RAG 파이프라인
│   │       ├── ncs_rag.py
│   │       ├── hrdnet_rag.py
│   │       └── policy_rag.py
│   └── cache/                  # 인메모리 캐싱 (dict)
│
└── docs/                       # 기획서, API 스펙
```

---

## 🔧 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- API 키: Claude API, OpenAI (임베딩), SGIS, 고용노동부(고용행정통계 · HRD-Net), NCS

### 환경 변수 설정

```bash
# backend/.env
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
SGIS_SERVICE_KEY=your_key
EMPLOYMENT_API_KEY=your_key       # 고용행정통계
HRDNET_API_KEY=your_key
NCS_API_KEY=your_key
```

### 로컬 실행

```bash
# 레포 클론
git clone https://github.com/your-org/regionpath.git
cd regionpath

# 백엔드
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 프론트엔드 (별도 터미널)
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📊 데이터 흐름

### 유망 산업 스코어링 로직

```
입지계수(LQ) = (지역 A업종 사업체 비율) ÷ (전국 A업종 사업체 비율)
구인/구직 비율 = newJoNmpr ÷ newJhntNmpr   # 고용행정통계 API
취업률 = empmCt ÷ newJhntNmpr

유망 산업 스코어 = LQ × 구인/구직 비율 × 취업률 가중치
```

| 유형 | LQ | 구인/구직 비율 | 해석 |
|---|---|---|---|
| 진짜 유망 ★★★ | ≥ 1.2 | ≥ 1.0 | 산업 기반 탄탄 + 일자리 공급 우위 |
| 포화 시장 ★★ | ≥ 1.2 | < 1.0 | 산업은 강하지만 경쟁 치열 |
| 신흥 수요 ★ | < 1.2 | ≥ 1.0 | 아직 작은 산업이지만 기회 있음 |

---

## 🌿 브랜칭 전략

```
main
└── develop
    ├── feature/frontend-*
    ├── feature/backend-map
    ├── feature/backend-portfolio
    ├── feature/backend-gap
    └── feature/backend-region
```

- `main` : 배포 브랜치 — 직접 push 금지
- `develop` : 통합 브랜치
- `feature/*` : 기능 단위 개발 → PR → develop 머지

---

## 👥 팀 역할

| 이름 | 담당 | 주요 작업 |
|---|---|---|
| 팀원 A | 백엔드 — 데이터·AI | 고용행정통계 API, SGIS LQ 계산, NCS RAG, LLM 직종 추천, 갭 분석 |
| 팀원 B | 백엔드 — 지역·정책 | SGIS 인프라 매칭, HRD-Net 추천, 국민취업지원제도 정책 안내 |
| 팀원 C | 프론트엔드 + 통합 | Next.js UI, choropleth 지도, 레이더 차트, FastAPI 연동, 발표 자료 |

---

## 📅 개발 일정

| 주차 | 기간 | 목표 |
|---|---|---|
| Week 1 | 5/14 ~ 5/21 | API 연동 기반 구축, choropleth 지도 프로토타입 |
| Week 2 | 5/22 ~ 5/28 | F-01 완성 (포트폴리오), F-02 착수 (유망 산업 지도) |
| Week 3 | 5/29 ~ 6/4  | F-02 완성 (갭 분석), F-03 착수 (인프라 매칭) |
| Week 4 | 6/5  ~ 6/11 | 전체 파이프라인 통합 + UI 완성 |
| Week 5 | 6/12 ~ 6/17 | 데모 완성, 발표 자료 제출 |

---

## ⚠️ 제약 사항

- **채용공고 크롤링 불가** — 개별 채용공고 수집 대신 고용행정통계 집계 API 사용. 갭 분석 기준은 NCS 직무역량 기준표로 대체
- **DB 미사용 (MVP)** — 포트폴리오·세션 데이터는 인메모리 캐싱(dict)으로 운영. V2에서 DB 도입 예정
- **API 키 필수** — SGIS, 고용행정통계, HRD-Net, NCS 총 4종 공공 API 키 사전 발급 필요

---

## 📄 라이선스

MIT