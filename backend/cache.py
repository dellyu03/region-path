import time
from typing import Any


class TTLCache:
    """인메모리 TTL 캐시. MVP 기준 외부 DB 없이 운영."""

    def __init__(self, ttl: int = 3600):
        self._store: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, ts = entry
        if time.time() - ts > self._ttl:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, time.time())

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


# 앱 전역 캐시 인스턴스 (1시간 TTL)
cache = TTLCache(ttl=3600)
