"""Generate copy-only MCP client configuration snippets from an extracted profile.

Snippets only use placeholders for environment/header values; they are rendered for the
user to review and copy and are never executed by the hub.
"""
from __future__ import annotations

import json
import shlex


def _placeholder(name: str) -> str:
    return f"<{name}>"


def _stdio_entry(method: dict) -> dict:
    entry: dict = {"command": method["command"], "args": list(method.get("args") or [])}
    env = method.get("env") or []
    if env:
        entry["env"] = {name: _placeholder(name) for name in env}
    return entry


def _header_value(header: dict) -> str:
    if header["name"].lower() == "authorization":
        return "Bearer <YOUR_TOKEN>"
    return _placeholder(header["name"])


def _remote_entry(remote: dict, include_type: bool) -> dict:
    entry: dict = {}
    if include_type:
        entry["type"] = remote["transport"]
    entry["url"] = remote["url"]
    headers = remote.get("headers") or []
    if headers:
        entry["headers"] = {h["name"]: _header_value(h) for h in headers}
    return entry


def _json_block(server_name: str, entry: dict) -> str:
    return json.dumps({"mcpServers": {server_name: entry}}, indent=2, ensure_ascii=False)


def build_client_configs(server_name: str, install_methods: list[dict] | None, remotes: list[dict] | None) -> list[dict]:
    """Return snippets for Claude Desktop, Claude Code and Cursor based on the primary method."""
    stdio = next((m for m in (install_methods or []) if m.get("command")), None)
    remote = next(iter(remotes or []), None)
    configs: list[dict] = []

    # Claude Desktop: JSON config supports local stdio servers; remote servers are added via UI.
    if stdio:
        configs.append(
            {
                "client": "claude_desktop",
                "label": "Claude Desktop",
                "format": "json",
                "path_hint": "claude_desktop_config.json (Settings → Developer → Edit Config)",
                "content": _json_block(server_name, _stdio_entry(stdio)),
                "note": None,
            }
        )
    elif remote:
        configs.append(
            {
                "client": "claude_desktop",
                "label": "Claude Desktop",
                "format": "text",
                "path_hint": "Settings → Connectors",
                "content": f"Thêm custom connector với URL: {remote['url']}",
                "note": "Claude Desktop thêm MCP server từ xa qua giao diện Connectors, không qua file JSON.",
            }
        )

    # Claude Code CLI.
    if stdio:
        parts = ["claude", "mcp", "add", "--transport", "stdio"]
        for name in stdio.get("env") or []:
            parts += ["--env", f"{name}={_placeholder(name)}"]
        parts += [server_name, "--", stdio["command"], *(stdio.get("args") or [])]
        configs.append(
            {
                "client": "claude_code",
                "label": "Claude Code",
                "format": "shell",
                "path_hint": "Terminal (thêm --scope project để lưu vào .mcp.json)",
                "content": shlex.join(parts),
                "note": None,
            }
        )
    elif remote:
        parts = ["claude", "mcp", "add", "--transport", remote["transport"]]
        for header in remote.get("headers") or []:
            parts += ["--header", f"{header['name']}: {_header_value(header)}"]
        parts += [server_name, remote["url"]]
        configs.append(
            {
                "client": "claude_code",
                "label": "Claude Code",
                "format": "shell",
                "path_hint": "Terminal (thêm --scope project để lưu vào .mcp.json)",
                "content": shlex.join(parts),
                "note": None,
            }
        )

    # Cursor: same mcpServers JSON shape; supports both stdio and url entries.
    if stdio or remote:
        entry = _stdio_entry(stdio) if stdio else _remote_entry(remote, include_type=False)
        configs.append(
            {
                "client": "cursor",
                "label": "Cursor",
                "format": "json",
                "path_hint": ".cursor/mcp.json (dự án) hoặc ~/.cursor/mcp.json (toàn cục)",
                "content": _json_block(server_name, entry),
                "note": None,
            }
        )
    return configs
