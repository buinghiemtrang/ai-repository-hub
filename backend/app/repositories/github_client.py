"""Shared GitHub API client with retries, rate-limit handling, and safe metadata mapping."""
from dataclasses import dataclass
from datetime import datetime, timezone
import os
import time
from urllib.parse import urlsplit

import httpx

from app.repositories.guides import build_guide_vi
from app.repositories.models import Repository


class RateLimitError(RuntimeError):
    """Raised when GitHub API returns 403/429 rate-limit or access denial."""


@dataclass
class GitHubFetchResult:
    metadata: dict
    readme_text: str | None


def build_github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AI-Repository-Hub",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token := os.getenv("GITHUB_TOKEN", "").strip():
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _safe_homepage(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    parsed = urlsplit(cleaned)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return cleaned[:500]
    return None


def _get_with_retry(client: httpx.Client, url: str, headers: dict[str, str] | None = None, max_retries: int = 2) -> httpx.Response:
    last_exc: Exception | None = None
    current_url = url
    redirects = 0
    for attempt in range(max_retries + 1):
        try:
            res = client.get(current_url, headers=headers)
            if res.status_code in (301, 302, 307, 308) and redirects < 3:
                loc = res.headers.get("Location", "")
                parsed = urlsplit(loc)
                if parsed.scheme == "https" and parsed.netloc.lower() == "api.github.com":
                    current_url = loc
                    redirects += 1
                    continue
            if res.status_code in (403, 429):
                remaining = res.headers.get("X-RateLimit-Remaining", "")
                if res.status_code == 429 or remaining == "0" or "rate limit" in res.text.lower():
                    raise RateLimitError(f"GitHub rate limited ({res.status_code}) on {current_url}")
                if res.status_code == 403:
                    raise RateLimitError(f"GitHub denied access (403) on {current_url}")
            if res.status_code >= 500 and attempt < max_retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            return res
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            last_exc = exc
            if attempt < max_retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("Unexpected retry state")


def fetch_repo_and_readme(client: httpx.Client, full_name: str, include_readme: bool = True) -> GitHubFetchResult:
    """Fetch public GitHub metadata and optional raw README markdown."""
    res = _get_with_retry(client, f"https://api.github.com/repos/{full_name}")
    res.raise_for_status()
    metadata = res.json()

    readme_text: str | None = None
    if include_readme and not metadata.get("private"):
        try:
            r_res = _get_with_retry(
                client,
                f"https://api.github.com/repos/{full_name}/readme",
                headers={"Accept": "application/vnd.github.raw+json"},
                max_retries=1,
            )
            if r_res.status_code == 200:
                readme_text = r_res.text[:120000]
        except RateLimitError:
            raise
        except httpx.HTTPError:
            readme_text = None

    return GitHubFetchResult(metadata=metadata, readme_text=readme_text)


def apply_github_metadata(
    repo: Repository,
    metadata: dict,
    readme_text: str | None = None,
    refresh_guide: bool = True,
) -> None:
    """Update Repository model fields from verified GitHub API metadata."""
    repo.full_name = metadata["full_name"]
    repo.github_id = metadata["id"]
    repo.description_upstream = metadata.get("description")
    repo.stars = metadata.get("stargazers_count")
    repo.forks = metadata.get("forks_count")
    repo.watchers = metadata.get("subscribers_count")
    repo.homepage = _safe_homepage(metadata.get("homepage"))
    topics = metadata.get("topics")
    repo.topics = [str(t)[:64] for t in topics[:20]] if isinstance(topics, list) else None
    repo.language = (metadata.get("language") or "")[:100] or None
    repo.default_branch = (metadata.get("default_branch") or "")[:100] or None
    repo.archived = bool(metadata.get("archived", False))
    updated_raw = metadata.get("updated_at")
    if updated_raw:
        repo.updated_at = datetime.fromisoformat(updated_raw.replace("Z", "+00:00"))
    repo.synced_at = datetime.now(timezone.utc)
    repo.license = ((metadata.get("license") or {}).get("spdx_id") or "")[:100] or None

    if refresh_guide or not repo.guide_vi:
        repo.guide_vi = build_guide_vi(
            full_name=repo.full_name,
            category=repo.category,
            description_vi=repo.description_vi,
            description_upstream=repo.description_upstream,
            language=repo.language,
            license_id=repo.license,
            topics=repo.topics,
            homepage=repo.homepage,
            default_branch=repo.default_branch,
            readme_text=readme_text,
        )
