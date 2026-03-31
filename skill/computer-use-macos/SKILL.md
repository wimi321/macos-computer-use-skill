---
name: computer-use-macos
description: Use when you need a fully standalone macOS computer-use MCP server and skill that bootstraps itself without any local Claude installation, private native modules, or extracted app assets.
---

# Computer Use macOS

Use this skill when the task needs the standalone macOS computer-use MCP server bundled with this skill.

## What this skill does

- uses the bundled `claude-computer-use-mcp` project under the installed skill directory
- builds the standalone MCP server
- lets the server auto-bootstrap its Python runtime on first launch
- avoids any dependency on local Claude binaries, `.node` modules, or extracted app assets

## Default bundled project path

After installation, assume the standalone project lives at:

```bash
~/.codex/skills/computer-use-macos/project
```

If the user installed the skill under a custom `CODEX_HOME`, use that equivalent path instead.

## Build

Always build from the bundled project:

```bash
cd ~/.codex/skills/computer-use-macos/project
npm install
npm run build
```

## Run

```bash
cd ~/.codex/skills/computer-use-macos/project
node dist/cli.js
```

The first real run will automatically create `.runtime/venv` and install the public Python dependencies.

## Guardrails

- Treat this host as trusted-local only.
- Do not tell the user to search their local Claude install for binaries or hidden assets.
- Be explicit that this runtime is standalone and uses public dependencies only.
- Mention that the current runtime reports `screenshotFiltering: none`, so action gating is handled at the MCP layer.
