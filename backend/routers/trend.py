import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query

from f02.job_api import get_region_total
from f02.job_groups import JOB_GROUPS, REGIONS
from cache import cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/trend", tags=["trend"])

_semaphore = asyncio.Semaphore(5)


async def _fetch_region_total(region_name: str, region_code: str) -> dict:
    async with _semaphore:
        try:
            count = await asyncio.to_thread(get_region_total, region_code)
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.warning("API 호출 실패 region=%s: %s", region_name, e)
            count = 0
    return {"region": region_name, "code": region_code, "raw_total": count}


@router.get("/counts")
async def get_trend_counts(job_group: str = Query(..., description="it | media | business")):
    """
    지역별 채용공고 수를 반환합니다.
    지역별 전체 공고수(고용24 실시간)에 직군별 가중치를 적용한 추정치입니다.
    캐시 히트 시 즉시 반환합니다.
    """
    if job_group not in JOB_GROUPS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 직군입니다. ({', '.join(JOB_GROUPS)})",
        )

    cache_key = f"trend_counts:{job_group}"
    cached = cache.get(cache_key)
    if cached is not None:
        return {**cached, "cached": True}

    # 지역별 전체 공고수 병렬 조회
    tasks = [
        _fetch_region_total(name, code)
        for name, code in REGIONS.items()
    ]
    raw_results = await asyncio.gather(*tasks)

    # 직군 가중치 적용: 지역 전체 공고수 × (직군 가중치 / 전국 평균 가중치)
    group = JOB_GROUPS[job_group]
    multipliers = group["multipliers"]
    nat_avg = sum(multipliers.values()) / len(multipliers)

    regions_data = [
        {
            "region": r["region"],
            "code": r["code"],
            "count": max(0, round(r["raw_total"] * multipliers.get(r["region"], 1.0) / nat_avg)),
        }
        for r in raw_results
    ]

    result = {
        "job_group": job_group,
        "label": group["label"],
        "regions": regions_data,
        "cached": False,
    }
    cache.set(cache_key, result)
    return result


@router.get("/groups")
async def list_job_groups():
    """지원하는 직군 목록을 반환합니다."""
    return [
        {"id": gid, "label": g["label"]}
        for gid, g in JOB_GROUPS.items()
    ]


@router.delete("/cache")
async def clear_trend_cache():
    """트렌드 캐시를 수동으로 초기화합니다."""
    for gid in JOB_GROUPS:
        cache.delete(f"trend_counts:{gid}")
    return {"message": "캐시가 초기화되었습니다."}
