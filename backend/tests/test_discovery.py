import unittest
from app.repositories.discover import (
    Links,
    allowed_detail,
    extract_category,
    extract_github_urls,
    extract_listing_totals,
    repo_name,
)


class DiscoveryTests(unittest.TestCase):
    def test_valid_repo(self):
        self.assertEqual(repo_name("https://github.com/owner/repo/blob/main/README.md"), "owner/repo")
        self.assertEqual(repo_name("https://github.com/owner/repo.git"), "owner/repo")

    def test_reject_non_repo(self):
        for link in (
            "https://github.com/topics/ai",
            "https://github.com.evil.test/a/b",
            "https://github.com/a",
            "https://github.com/a/..",
            "http://github.com/a/b",
        ):
            self.assertIsNone(repo_name(link))

    def test_detail(self):
        self.assertTrue(allowed_detail("https://mochistudio.io.vn/repo/example"))
        self.assertTrue(allowed_detail("https://mochistudio.io.vn/skills/example"))
        self.assertFalse(allowed_detail("https://evil.test/repo/example"))
        self.assertFalse(allowed_detail("https://mochistudio.io.vn/repo?page=2"))

    def test_parser(self):
        parser = Links()
        parser.feed('<a href="/skills/test">test</a>')
        self.assertEqual(parser.links, ["/skills/test"])

    def test_extract_rsc_github_url_and_category(self):
        sample = (
            '<a href="/skills?category=AI%20Agent">AI Agent</a>'
            '<script>self.__next_f.push([1,"{\\"url\\":\\"https:\\/\\/github.com\\/openclaw\\/openclaw\\"}"])</script>'
        )
        urls = extract_github_urls(sample)
        self.assertTrue(any(repo_name(u) == "openclaw/openclaw" for u in urls))
        self.assertEqual(extract_category(sample), "AI Agent")

    def test_extract_listing_totals(self):
        sample = "<div>487<!-- --> skill<!-- --> · trang <!-- -->1<!-- -->/<!-- -->41</div>"
        self.assertEqual(extract_listing_totals(sample), (487, 41))


if __name__ == "__main__":
    unittest.main()
