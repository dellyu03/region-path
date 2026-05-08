from dotenv import load_dotenv
import os
import requests
import xml.etree.ElementTree as ET

load_dotenv()

API_KEY = os.environ.get("EMPLOYMENT_API_KEY")
BASE_URL = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do"


def _call(params: dict) -> ET.Element:
    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()
    root = ET.fromstring(response.content)
    error = root.findtext("error")
    if error:
        raise RuntimeError(f"API 오류: {error}")
    return root


def get_employment_info(
    region: str = None,
    occupation: str = None,
    keyword: str = None,
    education: str = None,
    career: str = None,
    sal_tp: str = None,
    min_pay: int = None,
    max_pay: int = None,
    start_page: int = 1,
    display: int = 100,
) -> list[dict]:
    """
    워크넷 채용공고 목록을 반환합니다.

    Args:
        region     : 근무지역 코드 (예: "11" 서울, "26" 부산)
        occupation : 직종 코드 (KSCO 소분류 6자리)
        keyword    : 키워드 검색
        education  : 학력 코드 (00~07)
        career     : 경력 코드 (N: 신입, E: 경력, Z: 무관)
        sal_tp     : 임금형태 (D: 일급, H: 시급, M: 월급, Y: 연봉)
        min_pay    : 최소 급여 (sal_tp 입력 시 필수)
        max_pay    : 최대 급여 (sal_tp 입력 시 필수)
        start_page : 시작 페이지 (기본 1, 최대 1000)
        display    : 페이지당 결과 수 (기본 100, 최대 100)

    Returns:
        채용공고 dict 리스트. 주요 키:
            - title         : 채용제목
            - company       : 회사명
            - site_url      : 워크넷 URL
    """
    params = {
        "authKey":    API_KEY,
        "callTp":     "L",
        "returnType": "XML",
        "startPage":  start_page,
        "display":    display,
    }
    if region:
        params["region"] = region
    if occupation:
        params["jobsCd"] = occupation
    if keyword:
        params["keyword"] = keyword
    if education:
        params["education"] = education
    if career:
        params["career"] = career
    if sal_tp:
        params["salTp"] = sal_tp
        params["minPay"] = min_pay
        params["maxPay"] = max_pay

    root = _call(params)

    results = []
    for item in root.iter("dhsOpenEmpInfo"):
        raw = {child.tag: child.text for child in item}
        results.append({
            "title":    raw.get("empWantedTitle", ""),
            "company":  raw.get("empBusiNm", ""),
            "site_url": raw.get("empWantedHomepgDetail", ""),
        })
    return results


def get_region_total(region: str) -> int:
    """
    특정 지역의 전체 채용공고 수를 반환합니다.
    Work24 API는 직종코드 필터가 실질적으로 동작하지 않아 지역 전체 수를 기준으로 사용합니다.
    """
    params = {
        "authKey":    API_KEY,
        "callTp":     "L",
        "returnType": "XML",
        "startPage":  1,
        "display":    1,
        "region":     region,
    }
    root = _call(params)

    for field in ("total", "totCnt", "tot_cnt", "totalCount"):
        val = root.findtext(field)
        if val is not None:
            try:
                return int(val)
            except ValueError:
                pass

    return sum(1 for _ in root.iter("dhsOpenEmpInfo"))


def get_job_count(region: str, occupation: str) -> int:
    """
    특정 지역 + 직종의 채용공고 총 건수를 반환합니다.
    display=1 로 최소 요청 후 XML total 필드를 파싱합니다.
    """
    params = {
        "authKey":    API_KEY,
        "callTp":     "L",
        "returnType": "XML",
        "startPage":  1,
        "display":    1,
        "region":     region,
        "jobsCd":     occupation,
    }
    root = _call(params)

    for field in ("total", "totCnt", "tot_cnt", "totalCount"):
        val = root.findtext(field)
        if val is not None:
            try:
                return int(val)
            except ValueError:
                pass

    return sum(1 for _ in root.iter("dhsOpenEmpInfo"))


if __name__ == "__main__":
    import sys
    code = sys.argv[1] if len(sys.argv) >= 2 else input("직종 코드: ").strip()
    count = int(sys.argv[2]) if len(sys.argv) >= 3 else 10

    print(f"직종코드 [{code}] 채용공고 검색 중...")
    results = get_employment_info(occupation=code, display=count)
    print(f"총 {len(results)}건\n")
    for i, job in enumerate(results, 1):
        print(f"[{i}] {job['title']} | {job['company']}")
