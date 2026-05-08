import asyncio
import logging
from fastapi import APIRouter, Query

from f03.ecis_api import get_district_employment, SEOUL_DISTRICTS
from cache import cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/employment", tags=["employment"])

_sem = asyncio.Semaphore(5)

AGE_LABELS = {
    "01": "15~19세", "02": "20~24세", "03": "25~29세",
    "04": "30~34세", "05": "35~39세", "06": "40~44세",
    "07": "45~49세", "08": "50~54세", "09": "55~59세", "10": "60세 이상",
}
SEX_LABELS = {"M": "남성", "F": "여성"}


@router.get("/seoul")
async def get_seoul_employment(
    year_month: str = Query("202601", description="기준년월 YYYYMM"),
    sex: str = Query("M", description="성별 M 또는 F"),
    age: str = Query("02", description="연령코드 01~10"),
):
    """서울 25개 구의 ECIS 고용통계(신규구인·구직·취업건수)를 반환합니다."""
    cache_key = f"employment:seoul:{year_month}:{sex}:{age}"
    cached = cache.get(cache_key)
    if cached is not None:
        logger.info("[Employment] 캐시 히트 key=%s", cache_key)
        return {**cached, "cached": True}

    logger.info(
        "[Employment] ECIS 수집 시작 | %s %s %s (25개 구)",
        year_month, SEX_LABELS.get(sex, sex), AGE_LABELS.get(age, age),
    )

    async def fetch_one(name: str, code: str) -> dict:
        async with _sem:
            try:
                data = await asyncio.to_thread(
                    get_district_employment, code, year_month, sex, age
                )
                await asyncio.sleep(0.05)
            except Exception as e:
                logger.warning("[Employment] ECIS 실패 구=%s: %s", name, e)
                data = {"new_jobs": 0, "new_seekers": 0, "employed": 0}
        return {"district": name, "code": code, **data}

    tasks = [fetch_one(name, code) for name, code in SEOUL_DISTRICTS.items()]
    districts = await asyncio.gather(*tasks)

    # 수집 결과 요약 로그
    total_employed   = sum(d["employed"]    for d in districts)
    total_seekers    = sum(d["new_seekers"] for d in districts)
    total_jobs       = sum(d["new_jobs"]    for d in districts)
    zero_districts   = [d["district"] for d in districts if d["employed"] == 0 and d["new_seekers"] == 0]

    logger.info(
        "[Employment] 수집 완료 | 취업=%d 구직=%d 구인=%d | 전구간 0인 구 %d개",
        total_employed, total_seekers, total_jobs, len(zero_districts),
    )
    if zero_districts:
        logger.warning("[Employment] 모든 지표가 0인 구: %s", ", ".join(zero_districts))

    result = {
        "year_month": year_month,
        "sex": sex,
        "sex_label": SEX_LABELS.get(sex, sex),
        "age": age,
        "age_label": AGE_LABELS.get(age, age),
        "districts": list(districts),
    }
    cache.set(cache_key, result)
    return {**result, "cached": False}


@router.get("/business")
async def get_national_business():
    """전국 시도별 사업체 수 (SGIS 2019, 데모용 캐시 데이터)."""
    return {
        "year": "2019",
        "source": "SGIS",
        "regions": [
            {"shortName": "서울", "fullName": "서울특별시",    "count": 832842},
            {"shortName": "경기", "fullName": "경기도",        "count": 622185},
            {"shortName": "부산", "fullName": "부산광역시",    "count": 193521},
            {"shortName": "인천", "fullName": "인천광역시",    "count": 147823},
            {"shortName": "경남", "fullName": "경상남도",      "count": 133658},
            {"shortName": "경북", "fullName": "경상북도",      "count": 110429},
            {"shortName": "대구", "fullName": "대구광역시",    "count": 108234},
            {"shortName": "충남", "fullName": "충청남도",      "count": 96542},
            {"shortName": "전남", "fullName": "전라남도",      "count": 85217},
            {"shortName": "전북", "fullName": "전라북도",      "count": 82104},
            {"shortName": "대전", "fullName": "대전광역시",    "count": 80345},
            {"shortName": "충북", "fullName": "충청북도",      "count": 77821},
            {"shortName": "광주", "fullName": "광주광역시",    "count": 76923},
            {"shortName": "강원", "fullName": "강원특별자치도", "count": 74532},
            {"shortName": "울산", "fullName": "울산광역시",    "count": 54321},
            {"shortName": "제주", "fullName": "제주특별자치도", "count": 38452},
            {"shortName": "세종", "fullName": "세종특별자치시", "count": 11234},
        ],
    }
