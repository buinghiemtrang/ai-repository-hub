import unittest
from app.repositories.discover import repo_name, allowed_detail, Links

class DiscoveryTests(unittest.TestCase):
    def test_valid_repo(self):
        self.assertEqual(repo_name("https://github.com/owner/repo/blob/main/README.md"),"owner/repo")
        self.assertEqual(repo_name("https://github.com/owner/repo.git"),"owner/repo")
    def test_reject_non_repo(self):
        for link in ("https://github.com/topics/ai","https://github.com.evil.test/a/b",
                     "https://github.com/a","https://github.com/a/..","http://github.com/a/b"):
            self.assertIsNone(repo_name(link))
    def test_detail(self):
        self.assertTrue(allowed_detail("https://mochistudio.io.vn/skills/example"))
        self.assertFalse(allowed_detail("https://evil.test/skills/example"))
        self.assertFalse(allowed_detail("https://mochistudio.io.vn/skills?page=2"))
    def test_parser(self):
        parser=Links()
        parser.feed('<a href="/skills/test">test</a>')
        self.assertEqual(parser.links,["/skills/test"])

if __name__=="__main__":
    unittest.main()
