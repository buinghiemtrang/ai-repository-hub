"""Integration test; requires PostgreSQL and alembic upgrade head."""
import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class APITest(unittest.TestCase):
    def test_catalog_and_filters(self):
        with TestClient(app) as c:
            self.assertEqual(c.get("/health").status_code, 200)
            r = c.get("/repositories")
            self.assertEqual(r.status_code, 200)
            d = r.json()
            self.assertGreaterEqual(d["total"], 8)
            self.assertLessEqual(len(d["items"]), 12)

            first = d["items"][0]["id"]
            detail = c.get(f"/repositories/{first}")
            self.assertEqual(detail.status_code, 200)
            detail_json = detail.json()
            self.assertIn("guide_vi", detail_json)
            self.assertIn("readme_url", detail_json)
            self.assertIn("image_url", detail_json)
            self.assertIn("has_custom_image", detail_json)

            self.assertEqual(c.get("/repositories", params={"page": 0}).status_code, 422)
            self.assertEqual(
                c.get("/repositories", params={"q": "__unlikely_no_results_123__"}).json()["total"],
                0,
            )
            self.assertIn("AI Agent", c.get("/repositories/categories").json())

            stats_res = c.get("/repositories/stats")
            self.assertEqual(stats_res.status_code, 200)
            stats = stats_res.json()
            self.assertGreaterEqual(stats["total"], 8)
            self.assertTrue(any(cat["name"] == "AI Agent" for cat in stats["categories"]))

            self.assertGreaterEqual(c.get("/repositories", params={"q": "tro ly ai"}).json()["total"], 1)
            self.assertEqual(c.get("/repositories", params={"favorite_ids": ""}).json()["total"], 0)
            self.assertEqual(c.get("/repositories", params={"favorite_ids": str(first)}).json()["total"], 1)
            self.assertEqual(c.get("/repositories", params={"favorite_ids": "bad"}).status_code, 422)

            for sort_key in ("stars", "stars_asc", "forks", "updated", "oldest", "name"):
                sr = c.get("/repositories", params={"sort": sort_key})
                self.assertEqual(sr.status_code, 200)

    def test_sync_status_and_admin_guard(self):
        with TestClient(app) as c:
            status_res = c.get("/repositories/sync/status")
            self.assertEqual(status_res.status_code, 200)
            body = status_res.json()
            self.assertIn("scheduler", body)
            self.assertIn("recent_runs", body)

            with patch.dict(os.environ, {"ADMIN_API_KEY": ""}, clear=False):
                self.assertEqual(c.post("/repositories/sync/trigger").status_code, 503)

            with patch.dict(os.environ, {"ADMIN_API_KEY": "secret-test-key"}, clear=False):
                self.assertEqual(c.post("/repositories/sync/trigger").status_code, 401)
                self.assertEqual(
                    c.post("/repositories/sync/trigger", headers={"X-Admin-Key": "wrong"}).status_code,
                    401,
                )
                with patch("app.repositories.router.run_sync") as mock_sync:
                    res = c.post(
                        "/repositories/sync/trigger?limit=1",
                        headers={"X-Admin-Key": "secret-test-key"},
                    )
                    self.assertEqual(res.status_code, 202)
                    mock_sync.assert_called_once()
