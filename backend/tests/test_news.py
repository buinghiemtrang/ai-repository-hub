"""Unit and integration tests for the independent AI & Repo News module."""
from datetime import datetime, timedelta, timezone
import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.news.feeds import parse_hn_json, parse_rss_or_atom, strip_html
from app.news.sections import classify_section, extract_tags, safe_public_url

UTC_PLUS_7 = timezone(timedelta(hours=7))


class NewsUnitTests(unittest.TestCase):
    def test_strip_html_and_safe_url(self):
        self.assertEqual(strip_html("<p>Hello <b>AI</b> &amp; <i>MCP</i></p>"), "Hello AI & MCP")
        self.assertIsNone(safe_public_url("javascript:alert(1)"))
        self.assertEqual(safe_public_url("https://github.com/ollama/ollama"), "https://github.com/ollama/ollama")

    def test_classification_and_tags(self):
        sec_sec = classify_section("CVE-2026-1234 critical zero-day exploit in server", "")
        self.assertEqual(sec_sec, "Bảo mật & An ninh mạng")
        sec_claude = classify_section("Anthropic releases Claude Code MCP guide", "")
        self.assertEqual(sec_claude, "Claude")
        tags = extract_tags("Repo", "Open-source MCP Agent CLI", "Run local ollama", is_important=True)
        self.assertIn("Tin quan trọng", tags)
        self.assertIn("Repo nổi bật", tags)
        self.assertIn("MCP", tags)

    def test_parse_rss_and_hn_json(self):
        now = datetime.now(UTC_PLUS_7)
        rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>AI Feed</title>
<item>
  <title>Gemini API adds native MCP support</title>
  <link>https://ai.google.dev/gemini-api/docs</link>
  <description>&lt;p&gt;New multimodal tools for developers.&lt;/p&gt;</description>
  <pubDate>{now.strftime('%a, %d %b %Y %H:%M:%S +0700')}</pubDate>
</item>
</channel></rss>"""
        items = parse_rss_or_atom(rss, "Google AI Blog", "Gemini", now)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].section, "Gemini")
        self.assertIn("Google AI Blog", items[0].summary)

        hn_items = parse_hn_json(
            {
                "hits": [
                    {
                        "objectID": "999",
                        "title": "Open-source Claude MCP server for PostgreSQL",
                        "url": "https://github.com/example/mcp-pg",
                        "points": 140,
                        "num_comments": 25,
                        "created_at": now.isoformat(),
                        "author": "devuser",
                    }
                ]
            },
            "Hacker News AI",
            "Ứng dụng thực tế",
            now,
        )
        self.assertEqual(len(hn_items), 1)
        self.assertEqual(hn_items[0].section, "Claude")


class NewsAPITests(unittest.TestCase):
    def test_news_endpoints_and_admin_guard(self):
        with TestClient(app) as c:
            feed_res = c.get("/news/feed")
            self.assertEqual(feed_res.status_code, 200)
            feed = feed_res.json()
            self.assertGreaterEqual(len(feed["days"]), 1)
            self.assertTrue(any(s["name"] == "Repo" for s in feed["sections"]))
            self.assertGreaterEqual(feed["stats"]["repo_items"], 1)

            latest_date = feed["days"][0]["date"]
            day_res = c.get(f"/news/day/{latest_date}")
            self.assertEqual(day_res.status_code, 200)
            self.assertEqual(day_res.json()["date"], latest_date)
            self.assertEqual(c.get("/news/day/not-a-date").status_code, 422)

            repo_items = c.get("/news/items", params={"section": "Repo"})
            self.assertEqual(repo_items.status_code, 200)
            self.assertGreaterEqual(repo_items.json()["total"], 1)

            search_res = c.get("/news/items", params={"q": "bao mat"})
            self.assertEqual(search_res.status_code, 200)
            self.assertGreaterEqual(search_res.json()["total"], 1)

            self.assertEqual(c.get("/news/weekly").status_code, 200)
            self.assertEqual(c.get("/news/sync/status").status_code, 200)

            with patch.dict(os.environ, {"ADMIN_API_KEY": ""}, clear=False):
                self.assertEqual(c.post("/news/sync/trigger").status_code, 503)

            with patch.dict(os.environ, {"ADMIN_API_KEY": "secret-test-key"}, clear=False):
                self.assertEqual(c.post("/news/sync/trigger").status_code, 401)
                with patch("app.news.router.run_news_sync") as mock_sync:
                    ok = c.post(
                        "/news/sync/trigger?include_rss=false",
                        headers={"X-Admin-Key": "secret-test-key"},
                    )
                    self.assertEqual(ok.status_code, 202)
                    mock_sync.assert_called_once()
