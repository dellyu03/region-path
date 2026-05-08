import logging
import requests
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

ECIS_URL = "https://eis.work24.go.kr/opi/joApi.do"

SEOUL_DISTRICTS: dict[str, str] = {
    "종로구": "11110", "중구": "11140", "용산구": "11170",
    "성동구": "11200", "광진구": "11215", "동대문구": "11230",
    "중랑구": "11260", "성북구": "11290", "강북구": "11305",
    "도봉구": "11320", "노원구": "11350", "은평구": "11380",
    "서대문구": "11410", "마포구": "11440", "양천구": "11470",
    "강서구": "11500", "구로구": "11530", "금천구": "11545",
    "영등포구": "11560", "동작구": "11590", "관악구": "11620",
    "서초구": "11650", "강남구": "11680", "송파구": "11710",
    "강동구": "11740",
}


def _to_int(val: str | None) -> int:
    try:
        return int(float(val or 0))
    except (ValueError, TypeError):
        return 0


def get_district_employment(
    area_cd: str, year_month: str, sex: str, age: str
) -> dict[str, int]:
    params = {
        "apiSecd": "OPIA",
        "closStdrYm": year_month,
        "rsdAreaCd": area_cd,
        "sxdsCd": sex,
        "ageCd": age,
        "rernSecd": "XML",
        "bgnPage": "1",
        "display": "100",
    }
    try:
        res = requests.get(ECIS_URL, params=params, timeout=10)
        logger.debug("[ECIS] HTTP %s | area=%s %s/%s/%s", res.status_code, area_cd, year_month, sex, age)

        if res.status_code != 200:
            logger.warning("[ECIS] 비정상 응답 area=%s status=%s", area_cd, res.status_code)
            return {"new_jobs": 0, "new_seekers": 0, "employed": 0}

        text = res.content.decode("euc-kr")

        # 루트 요소(<rqstApi>…</rqstApi>)만 추출
        # 데이터가 없을 때 API가 닫는 태그 뒤에 추가 내용을 붙이는 경우가 있어
        # ET가 "junk after document element"를 일으킴
        start = text.find("<rqstApi>")
        end   = text.find("</rqstApi>")
        if start == -1 or end == -1:
            logger.warning("[ECIS] rqstApi 요소 없음 area=%s | 응답: %s", area_cd, text[:300])
            return {"new_jobs": 0, "new_seekers": 0, "employed": 0}

        root = ET.fromstring(text[start : end + len("</rqstApi>")])
        items = root.findall(".//rqst")
        totals: dict[str, int] = {"new_jobs": 0, "new_seekers": 0, "employed": 0}
        for item in items:
            totals["new_jobs"] += _to_int(item.findtext("newJoNmpr"))
            totals["new_seekers"] += _to_int(item.findtext("newJhntNmpr"))
            totals["employed"] += _to_int(item.findtext("empmCt"))

        logger.debug(
            "[ECIS] area=%s rows=%d → 구인=%d 구직=%d 취업=%d",
            area_cd, len(items),
            totals["new_jobs"], totals["new_seekers"], totals["employed"],
        )
        return totals
    except Exception as e:
        logger.error("[ECIS] 파싱 실패 area=%s: %s", area_cd, e, exc_info=True)
        return {"new_jobs": 0, "new_seekers": 0, "employed": 0}
