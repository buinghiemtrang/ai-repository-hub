"""Unit tests for guide synthesis, GitHub client retry/rate-limit handling, and manifest validation."""
import unittest

import httpx

from app.repositories.github_client import RateLimitError, fetch_repo_and_readme
from app.repositories.guides import build_guide_vi
from app.repositories.import_catalog import validate_manifest


class GuideAndGitHubTests(unittest.TestCase):
    def test_build_guide_extracts_sections_without_executing(self):
        readme = """# Demo AI Tool

![badge](https://img.shields.io/badge/test-blue)

A fast open-source agent framework for local automation.

## Requirements
- Python 3.11+
- Docker Compose v2

## Installation
```bash
pip install demo-ai-tool
```

## Usage
```python
from demo import Agent
Agent().run()
```
"""
        guide = build_guide_vi(
            full_name="org/demo-ai",
            category="AI Agent",
            description_vi="Công cụ agent mã nguồn mở chạy cục bộ.",
            description_upstream="Open-source agent framework.",
            language="Python",
            license_id="MIT",
            topics=["ai-agent", "automation"],
            homepage="https://example.org",
            default_branch="main",
            readme_text=readme,
        )
        self.assertIn("Tổng quan từ tài liệu gốc", guide)
        self.assertIn("Python 3.11+", guide)
        self.assertIn("pip install demo-ai-tool", guide)
        self.assertIn("Agent().run()", guide)
        self.assertIn("không tự động thực thi", guide.lower())

    def test_github_client_rate_limit_and_retry(self):
        attempts = {"count": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["count"] += 1
            if str(request.url).endswith("/repos/org/retry"):
                if attempts["count"] == 1:
                    return httpx.Response(502, json={"message": "Bad Gateway"})
                return httpx.Response(
                    200,
                    json={
                        "id": 100,
                        "full_name": "org/retry",
                        "private": False,
                        "stargazers_count": 42,
                        "forks_count": 5,
                        "subscribers_count": 2,
                        "updated_at": "2026-01-01T00:00:00Z",
                    },
                )
            if str(request.url).endswith("/repos/org/old-name"):
                return httpx.Response(301, headers={"Location": "https://api.github.com/repositories/100"})
            if str(request.url).endswith("/repositories/100"):
                return httpx.Response(
                    200,
                    json={
                        "id": 100,
                        "full_name": "org/retry",
                        "private": False,
                        "stargazers_count": 42,
                        "forks_count": 5,
                        "subscribers_count": 2,
                        "updated_at": "2026-01-01T00:00:00Z",
                    },
                )
            if str(request.url).endswith("/repos/org/retry/readme"):
                return httpx.Response(200, text="# Retry Repo\n\nWorks cleanly.")
            return httpx.Response(429, headers={"X-RateLimit-Remaining": "0"}, json={"message": "rate limit"})

        transport = httpx.MockTransport(handler)
        with httpx.Client(transport=transport) as client:
            res = fetch_repo_and_readme(client, "org/retry", include_readme=True)
            self.assertEqual(res.metadata["id"], 100)
            self.assertIn("Works cleanly", res.readme_text or "")

            redirected = fetch_repo_and_readme(client, "org/old-name", include_readme=False)
            self.assertEqual(redirected.metadata["full_name"], "org/retry")

            with self.assertRaises(RateLimitError):
                fetch_repo_and_readme(client, "org/limited", include_readme=False)

    def test_validate_manifest(self):
        valid = [
            {
                "full_name": "ollama/ollama",
                "category": "Chạy AI cục bộ",
                "description_vi": "Chạy mô hình ngôn ngữ cục bộ.",
                "source_urls": ["https://github.com/ollama/ollama"],
            }
        ]
        self.assertEqual(len(validate_manifest(valid)), 1)
        with self.assertRaises(ValueError):
            validate_manifest({"candidates": []})
        with self.assertRaises(ValueError):
            validate_manifest([{"full_name": "../bad", "category": "AI", "description_vi": "x", "source_urls": ["https://github.com/a/b"]}])


if __name__ == "__main__":
    unittest.main()
