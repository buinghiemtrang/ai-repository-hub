"""Integration test; requires PostgreSQL and alembic upgrade head."""
import unittest
from fastapi.testclient import TestClient
from app.main import app

class APITest(unittest.TestCase):
    def test_catalog(self):
        with TestClient(app) as c:
            self.assertEqual(c.get("/health").status_code,200)
            r=c.get("/repositories")
            self.assertEqual(r.status_code,200)
            d=r.json()
            self.assertGreaterEqual(d["total"],8)
            self.assertLessEqual(len(d["items"]),12)
            self.assertEqual(c.get("/repositories/"+str(d["items"][0]["id"])).status_code,200)
            self.assertEqual(c.get("/repositories",params={"page":0}).status_code,422)
            self.assertEqual(c.get("/repositories",params={"q":"__unlikely_no_results_123__"}).json()["total"],0)
            self.assertIn("AI Agent",c.get("/repositories/categories").json())
