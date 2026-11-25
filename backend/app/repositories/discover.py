"""Discover canonical public GitHub repository links; do not copy editorial text."""
import argparse
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser

import httpx

ORIGIN = "https://mochistudio.io.vn"
AGENT = "AIRepositoryHub"
RESERVED = {"about", "apps", "collections", "contact", "customer-stories", "enterprise", "events",
            "explore", "features", "issues", "login", "marketplace", "new", "notifications",
            "orgs", "pricing", "pulls", "search", "settings", "signup", "sponsors", "topics", "users"}
PART = re.compile(r"^[A-Za-z0-9_.-]+$")

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)

def repo_name(url):
    p = urlsplit(url)
    if p.scheme != "https" or p.netloc.lower() != "github.com":
        return None
    parts = p.path.strip("/").split("/")
    if len(parts) < 2 or not all(PART.fullmatch(x) and x not in (".", "..") for x in parts[:2]):
        return None
    owner, name = parts[:2]
    if owner.lower() in RESERVED or name.lower() == "sponsors":
        return None
    return owner + "/" + name.removesuffix(".git")

def allowed_detail(url):
    p = urlsplit(url)
    return (p.scheme == "https" and p.netloc == "mochistudio.io.vn"
            and bool(re.fullmatch(r"/skills/[A-Za-z0-9_-]+/?", p.path)) and not p.query)

def scan(client, max_pages, delay):
    robots = RobotFileParser()
    response = client.get(ORIGIN+"/robots.txt")
    if response.status_code == 404:
        robots.parse([])
    else:
        response.raise_for_status()
        robots.parse(response.text.splitlines())
    robots_delay = robots.crawl_delay(AGENT) or robots.crawl_delay("*") or 0
    delay = max(delay, robots_delay)
    seen_details = set()
    found = {}
    errors = []
    pages = []
    def fetch(url):
        if not robots.can_fetch(AGENT, url):
            raise PermissionError("robots.txt disallows "+url)
        time.sleep(delay)
        r = client.get(url)
        if r.status_code in (401, 403, 429):
            raise PermissionError("Access denied or rate limited: "+url)
        r.raise_for_status()
        parser = Links()
        parser.feed(r.text)
        return [urljoin(url, x) for x in parser.links]
    def collect(links, source):
        for link in links:
            name = repo_name(link)
            if name:
                key = name.lower()
                found.setdefault(key, {"full_name":name, "source_urls":[]})
                if source not in found[key]["source_urls"]:
                    found[key]["source_urls"].append(source)
    for page in range(1, max_pages+1):
        url = ORIGIN+"/skills"+(f"?page={page}" if page>1 else "")
        try:
            links = fetch(url)
            pages.append(page)
            collect(links, url)
            details = {x for x in links if allowed_detail(x)}
            fresh = details-seen_details
            if not fresh:
                errors.append({"url":url,"error":"No new detail links; pagination or rendering requires manual review"})
                break
            for detail in sorted(fresh):
                seen_details.add(detail)
                try:
                    collect(fetch(detail),detail)
                except httpx.HTTPError as exc:
                    errors.append({"url":detail,"error":str(exc)})
        except (httpx.HTTPError, PermissionError) as exc:
            errors.append({"url":url,"error":str(exc)})
            break
    return {"source":ORIGIN+"/skills","pages_read":pages,"details_attempted":len(seen_details),
            "candidates":sorted(found.values(), key=lambda x:x["full_name"].lower()),
            "errors":errors,"coverage_verified":False,
            "note":"Candidate URLs may include related repositories. Verify each against source and GitHub; not a certified complete crawl."}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--pages",type=int,required=True)
    p.add_argument("--delay",type=float,default=2)
    p.add_argument("--output",default="/data/discovery.json")
    p.add_argument("--terms-reviewed",action="store_true")
    args=p.parse_args()
    if not args.terms_reviewed:
        p.error("Review source terms and confirm permitted crawling with --terms-reviewed.")
    if not 1 <= args.pages <= 200 or args.delay < 2:
        p.error("Use 1–200 pages and delay >= 2 seconds.")
    with httpx.Client(headers={"User-Agent":AGENT}, timeout=20, follow_redirects=False) as client:
        report=scan(client,args.pages,args.delay)
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Candidate count: {len(report['candidates'])}; coverage not verified; see {path}")

if __name__=="__main__":
    main()
