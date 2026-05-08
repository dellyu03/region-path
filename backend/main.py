from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.trend import router as trend_router
from routers.employment import router as employment_router

app = FastAPI(
    title="RegionPath API",
    description="지역 청년 취업 정보 격차 해소를 위한 채용 매칭 플랫폼 API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trend_router)
app.include_router(employment_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
