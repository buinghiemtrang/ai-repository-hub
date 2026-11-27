"""Parse MCP server profiles from public upstream files without executing anything.

Sources, in priority order:
1. ``server.json`` at the repository root (official MCP registry manifest format).
2. README code blocks: JSON client configs (``mcpServers`` / VS Code ``servers``) and
   ``claude mcp add`` command lines.

Security rules:
- Text is only parsed (json / shlex); nothing is ever executed.
- Environment variable and header *values* are discarded; only names (and upstream
  descriptions from server.json) are kept.
- Commands containing shell control operators are rejected.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import json
import re
import shlex

TRANSPORTS = ("stdio", "http", "sse")
MAX_METHODS = 6
MAX_ARGS = 30
MAX_ENV = 40

FENCE_RE = re.compile(r"^\s*(```+|~~~+)\s*([A-Za-z0-9_+-]*)")
ENV_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,99}$")
HEADER_NAME_RE = re.compile(r"^[A-Za-z0-9-]{1,100}$")
SERVER_NAME_RE = re.compile(r"[^a-z0-9-]+")
COMMAND_RE = re.compile(r"^[A-Za-z0-9_./@:\\-]{1,200}$")
CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f]")
LINE_META_RE = re.compile(r"[;|`]|&&|\$\(")
URL_BAD_RE = re.compile(r"[\s\"'`<>\\{}]")
SECRET_HINT_RE = re.compile(r"(KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|AUTH|PAT)(_|$)", re.I)
TRAILING_COMMA_RE = re.compile(r",(\s*[}\]])")


@dataclass
class McpProfile:
    server_name: str
    transports: list[str] = field(default_factory=list)
    install_methods: list[dict] = field(default_factory=list)
    remotes: list[dict] = field(default_factory=list)
    env_vars: list[dict] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)

    @property
    def requires_secret(self) -> bool:
        if any(v.get("is_secret") for v in self.env_vars):
            return True
        return any(h.get("is_secret") for r in self.remotes for h in r.get("headers", []))

    @property
    def detected(self) -> bool:
        return bool(self.install_methods or self.remotes)


def slugify_server_name(raw: str | None, fallback: str = "mcp-server") -> str:
    value = (raw or "").strip().lower()
    if "/" in value:
        value = value.rsplit("/", 1)[-1]
    value = SERVER_NAME_RE.sub("-", value).strip("-")[:60]
    return value or fallback


def _clean_str(value, limit: int = 300) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or len(value) > limit:
        return None
    return value


def _normalize_transport(raw) -> str | None:
    value = (raw or "").strip().lower() if isinstance(raw, str) else ""
    if value == "stdio":
        return "stdio"
    if value in ("streamable-http", "streamable_http", "streamablehttp", "http"):
        return "http"
    if value == "sse":
        return "sse"
    return None


def _safe_https_url(raw) -> str | None:
    value = _clean_str(raw, 500)
    if value and value.startswith("https://") and not URL_BAD_RE.search(value):
        return value
    return None


def _is_secret_name(name: str) -> bool:
    return bool(SECRET_HINT_RE.search(name))


def _safe_command(command, args) -> tuple[str, list[str]] | None:
    cmd = _clean_str(command, 200)
    if not cmd or not COMMAND_RE.match(cmd):
        return None
    clean_args: list[str] = []
    if isinstance(args, list):
        for arg in args[:MAX_ARGS]:
            if isinstance(arg, (int, float)) and not isinstance(arg, bool):
                arg = str(arg)
            value = _clean_str(arg)
            if value is None:
                return None
            clean_args.append(value)
    if any(CONTROL_CHAR_RE.search(a) or "${" in a for a in clean_args):
        return None
    return cmd, clean_args


ENV_FLAGS = ("-e", "--env")


def _strip_inline_env_values(args: list[str]) -> tuple[list[str], list[str]]:
    """Turn `-e NAME=value` / `--env=NAME=value` into `-e NAME` so no env values are stored."""
    out: list[str] = []
    names: list[str] = []
    expect_env = False
    for arg in args:
        if expect_env:
            expect_env = False
            name = arg.split("=", 1)[0]
            if ENV_NAME_RE.match(name):
                names.append(name)
                out.append(name)
                continue
        for flag in ENV_FLAGS:
            if arg.startswith(flag + "=") and "=" in arg[len(flag) + 1 :]:
                name = arg[len(flag) + 1 :].split("=", 1)[0]
                if ENV_NAME_RE.match(name):
                    names.append(name)
                    arg = f"{flag}={name}"
                break
        if arg in ENV_FLAGS:
            expect_env = True
        out.append(arg)
    return out, names


class _Builder:
    def __init__(self, server_name: str):
        self.profile = McpProfile(server_name=server_name)
        self._method_keys: set[tuple] = set()
        self._remote_keys: set[tuple] = set()
        self._env_index: dict[str, dict] = {}

    def add_transport(self, transport: str | None):
        if transport in TRANSPORTS and transport not in self.profile.transports:
            self.profile.transports.append(transport)

    def add_env(self, name, *, description=None, required=None, is_secret=None, source: str):
        if not isinstance(name, str) or not ENV_NAME_RE.match(name):
            return
        existing = self._env_index.get(name)
        if existing:
            if existing.get("description") is None and description:
                existing["description"] = description
            if existing.get("required") is None and required is not None:
                existing["required"] = required
            return
        if len(self.profile.env_vars) >= MAX_ENV:
            return
        entry = {
            "name": name,
            "description": _clean_str(description, 500),
            "required": required if isinstance(required, bool) else None,
            "is_secret": bool(is_secret) if isinstance(is_secret, bool) else _is_secret_name(name),
            "source": source,
        }
        self._env_index[name] = entry
        self.profile.env_vars.append(entry)

    def add_method(self, *, kind: str, command: str, args: list[str], env_names: list[str], source: str,
                   package: str | None = None):
        if command in ("docker", "podman"):
            args, inline_env = _strip_inline_env_values(args)
            for name in inline_env:
                self.add_env(name, source=source)
            env_names = [*env_names, *inline_env]
        key = (command, tuple(args))
        if key in self._method_keys or len(self.profile.install_methods) >= MAX_METHODS:
            return
        self._method_keys.add(key)
        self.profile.install_methods.append(
            {
                "kind": kind,
                "transport": "stdio",
                "command": command,
                "args": args,
                "package": package,
                "env": sorted(set(env_names)),
                "source": source,
            }
        )
        self.add_transport("stdio")

    def add_remote(self, *, transport: str, url: str, header_names: list[dict], source: str):
        key = (transport, url)
        if key in self._remote_keys or len(self.profile.remotes) >= MAX_METHODS:
            return
        self._remote_keys.add(key)
        self.profile.remotes.append(
            {"transport": transport, "url": url, "headers": header_names, "source": source}
        )
        self.add_transport(transport)

    def add_source(self, source: str):
        if source not in self.profile.sources:
            self.profile.sources.append(source)


# ---------------------------------------------------------------------------
# server.json (official MCP registry manifest)
# ---------------------------------------------------------------------------

PACKAGE_RUNNERS = {
    "npm": ("npx", lambda ident: ["-y", ident]),
    "pypi": ("uvx", lambda ident: [ident]),
    "oci": ("docker", lambda ident: ["run", "-i", "--rm", ident]),
    "docker": ("docker", lambda ident: ["run", "-i", "--rm", ident]),
}


def _get(obj: dict, *keys):
    for key in keys:
        if key in obj:
            return obj[key]
    return None


def _parse_server_json(builder: _Builder, manifest: dict) -> bool:
    found = False
    packages = manifest.get("packages")
    if isinstance(packages, list):
        for pkg in packages[:MAX_METHODS]:
            if not isinstance(pkg, dict):
                continue
            registry = (_get(pkg, "registryType", "registry_type", "registry_name") or "").lower()
            ident = _clean_str(_get(pkg, "identifier", "name"), 200)
            transport_raw = pkg.get("transport")
            transport = _normalize_transport(
                transport_raw.get("type") if isinstance(transport_raw, dict) else transport_raw or "stdio"
            )
            env_names: list[str] = []
            env_list = _get(pkg, "environmentVariables", "environment_variables")
            if isinstance(env_list, list):
                for env in env_list[:MAX_ENV]:
                    if not isinstance(env, dict):
                        continue
                    name = env.get("name")
                    builder.add_env(
                        name,
                        description=env.get("description"),
                        required=_get(env, "isRequired", "is_required"),
                        is_secret=_get(env, "isSecret", "is_secret"),
                        source="server.json",
                    )
                    if isinstance(name, str) and ENV_NAME_RE.match(name):
                        env_names.append(name)
            if transport != "stdio" or not ident or registry not in PACKAGE_RUNNERS:
                if transport in ("http", "sse"):
                    builder.add_transport(transport)
                continue
            command, build_args = PACKAGE_RUNNERS[registry]
            hint = _clean_str(_get(pkg, "runtimeHint", "runtime_hint"), 20)
            if hint in ("npx", "uvx", "docker", "bunx", "pnpm", "dnx"):
                command = hint
            args = build_args(ident)
            if command == "docker":
                args = args[:-1] + [x for n in env_names for x in ("-e", n)] + args[-1:]
            safe = _safe_command(command, args)
            if safe:
                builder.add_method(
                    kind=registry, command=safe[0], args=safe[1], env_names=env_names,
                    source="server.json", package=ident,
                )
                found = True

    remotes = manifest.get("remotes")
    if isinstance(remotes, list):
        for remote in remotes[:MAX_METHODS]:
            if not isinstance(remote, dict):
                continue
            transport = _normalize_transport(_get(remote, "type", "transport_type"))
            url = _safe_https_url(remote.get("url"))
            if transport not in ("http", "sse") or not url:
                continue
            headers = []
            for header in (remote.get("headers") or [])[:10]:
                if isinstance(header, dict) and isinstance(header.get("name"), str) and HEADER_NAME_RE.match(header["name"]):
                    headers.append(
                        {
                            "name": header["name"],
                            "description": _clean_str(header.get("description"), 300),
                            "is_secret": bool(_get(header, "isSecret", "is_secret"))
                            or header["name"].lower() == "authorization",
                        }
                    )
            builder.add_remote(transport=transport, url=url, header_names=headers, source="server.json")
            found = True
    return found


# ---------------------------------------------------------------------------
# README parsing
# ---------------------------------------------------------------------------


def _iter_code_blocks(markdown: str, limit: int = 80):
    lang = ""
    buf: list[str] = []
    fence = None
    count = 0
    for line in markdown.splitlines()[:4000]:
        m = FENCE_RE.match(line)
        if fence is None:
            if m:
                fence = m.group(1)[0]
                lang = m.group(2).lower()
                buf = []
            continue
        if m and m.group(1)[0] == fence and not m.group(2):
            yield lang, "\n".join(buf)
            count += 1
            if count >= limit:
                return
            fence = None
            continue
        buf.append(line)


def _strip_json_comments(text: str) -> str:
    """Remove // and /* */ comments outside of strings, then trailing commas."""
    out: list[str] = []
    i, n = 0, len(text)
    in_str = False
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if ch == '"':
                in_str = False
            i += 1
            continue
        if ch == '"':
            in_str = True
            out.append(ch)
            i += 1
            continue
        if text.startswith("//", i):
            while i < n and text[i] != "\n":
                i += 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        out.append(ch)
        i += 1
    return TRAILING_COMMA_RE.sub(r"\1", "".join(out))


def _load_json_loose(text: str):
    if len(text) > 50000:
        return None
    try:
        return json.loads(_strip_json_comments(text))
    except (ValueError, RecursionError):
        return None


def _find_server_maps(data, depth: int = 0):
    """Yield dicts mapping server name -> server config from common client config shapes."""
    if depth > 4 or not isinstance(data, dict):
        return
    for key in ("mcpServers", "servers", "mcp_servers", "context_servers"):
        value = data.get(key)
        if isinstance(value, dict):
            yield value
    for key in ("mcp", "settings"):
        if isinstance(data.get(key), dict):
            yield from _find_server_maps(data[key], depth + 1)


def _parse_config_entry(builder: _Builder, name: str, entry: dict) -> bool:
    env_names: list[str] = []
    env = entry.get("env")
    if isinstance(env, dict):
        for env_name in list(env.keys())[:MAX_ENV]:  # values deliberately ignored
            if isinstance(env_name, str) and ENV_NAME_RE.match(env_name):
                builder.add_env(env_name, source="readme")
                env_names.append(env_name)

    if "command" in entry:
        safe = _safe_command(entry.get("command"), entry.get("args") or [])
        if not safe:
            return False
        command, args = safe
        kind = {"npx": "npm", "uvx": "pypi", "docker": "oci"}.get(command, "command")
        builder.add_method(kind=kind, command=command, args=args, env_names=env_names, source="readme")
        return True

    url = _safe_https_url(_get(entry, "url", "serverUrl", "httpUrl"))
    if url:
        transport = _normalize_transport(entry.get("type")) or ("sse" if url.rstrip("/").endswith("/sse") else "http")
        if transport == "stdio":
            return False
        headers = []
        raw_headers = entry.get("headers")
        if isinstance(raw_headers, dict):
            for header in list(raw_headers.keys())[:10]:  # values deliberately ignored
                if isinstance(header, str) and HEADER_NAME_RE.match(header):
                    headers.append(
                        {"name": header, "description": None,
                         "is_secret": header.lower() == "authorization" or _is_secret_name(header)}
                    )
        builder.add_remote(transport=transport, url=url, header_names=headers, source="readme")
        return True
    return False


CLAUDE_ADD_OPTS_WITH_VALUE = {"-t", "--transport", "-s", "--scope", "-e", "--env", "-H", "--header"}


def _parse_claude_mcp_add(builder: _Builder, line: str) -> str | None:
    """Parse `claude mcp add [opts] <name> [<url> | -- <command> args...]`; return server name."""
    if LINE_META_RE.search(line):
        return None
    try:
        tokens = shlex.split(line, comments=False, posix=True)
    except ValueError:
        return None
    try:
        start = next(i for i in range(len(tokens) - 2) if tokens[i : i + 3] == ["claude", "mcp", "add"])
    except StopIteration:
        return None
    tokens = tokens[start + 3 :]
    transport = "stdio"
    env_names: list[str] = []
    header_names: list[dict] = []
    positional: list[str] = []
    command_tokens: list[str] = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok == "--":
            command_tokens = tokens[i + 1 :]
            break
        if tok in CLAUDE_ADD_OPTS_WITH_VALUE and i + 1 < len(tokens):
            value = tokens[i + 1]
            if tok in ("-t", "--transport"):
                transport = _normalize_transport(value) or transport
            elif tok in ("-e", "--env"):
                env_name = value.split("=", 1)[0]
                if ENV_NAME_RE.match(env_name):
                    env_names.append(env_name)
            elif tok in ("-H", "--header"):
                header = value.split(":", 1)[0].strip()
                if HEADER_NAME_RE.match(header):
                    header_names.append(
                        {"name": header, "description": None,
                         "is_secret": header.lower() == "authorization" or _is_secret_name(header)}
                    )
            i += 2
            continue
        if tok.startswith("-"):
            i += 1
            continue
        positional.append(tok)
        i += 1

    if not positional:
        return None
    name = positional[0]
    for env_name in env_names:
        builder.add_env(env_name, source="readme")
    if transport in ("http", "sse"):
        url = _safe_https_url(positional[1] if len(positional) > 1 else None)
        if not url:
            return None
        builder.add_remote(transport=transport, url=url, header_names=header_names, source="readme")
        return name
    cmd_tokens = command_tokens or positional[1:]
    if not cmd_tokens:
        return None
    safe = _safe_command(cmd_tokens[0], cmd_tokens[1:])
    if not safe:
        return None
    kind = {"npx": "npm", "uvx": "pypi", "docker": "oci"}.get(safe[0], "command")
    builder.add_method(kind=kind, command=safe[0], args=safe[1], env_names=env_names, source="readme")
    return name


def _join_continuations(code: str) -> list[str]:
    lines: list[str] = []
    buf = ""
    for raw in code.splitlines():
        stripped = raw.rstrip()
        if stripped.endswith("\\"):
            buf += stripped[:-1] + " "
            continue
        lines.append((buf + stripped).strip())
        buf = ""
    if buf:
        lines.append(buf.strip())
    return lines


def _parse_readme(builder: _Builder, readme: str) -> tuple[bool, str | None]:
    found = False
    first_name: str | None = None
    for lang, code in _iter_code_blocks(readme):
        if lang in ("json", "jsonc", "json5", "") and ("mcpServers" in code or '"servers"' in code
                                                       or "context_servers" in code):
            data = _load_json_loose(code)
            for server_map in _find_server_maps(data):
                for name, entry in list(server_map.items())[:MAX_METHODS]:
                    if isinstance(entry, dict) and _parse_config_entry(builder, str(name), entry):
                        found = True
                        first_name = first_name or str(name)
        if "claude mcp add" in code and lang in ("", "sh", "bash", "shell", "zsh", "console", "powershell", "ps1"):
            for line in _join_continuations(code):
                line = line.lstrip("$> ").strip()
                if "claude mcp add" in line and "add-json" not in line:
                    name = _parse_claude_mcp_add(builder, line)
                    if name:
                        found = True
                        first_name = first_name or name
    return found, first_name


def extract_profile(repo_name: str, server_json_text: str | None, readme_text: str | None) -> McpProfile:
    """Build an MCP profile from upstream manifest/README text. Pure function; never executes input."""
    builder = _Builder(slugify_server_name(repo_name))
    named_from_manifest = False

    if server_json_text:
        manifest = _load_json_loose(server_json_text[:200000])
        if isinstance(manifest, dict) and _parse_server_json(builder, manifest):
            builder.add_source("server.json")
            if isinstance(manifest.get("name"), str):
                builder.profile.server_name = slugify_server_name(manifest["name"], builder.profile.server_name)
                named_from_manifest = True

    if readme_text:
        found, name = _parse_readme(builder, readme_text[:200000])
        if found:
            builder.add_source("readme")
            if name and not named_from_manifest:
                builder.profile.server_name = slugify_server_name(name, builder.profile.server_name)

    return builder.profile
