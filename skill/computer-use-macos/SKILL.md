---
name: computer-use-macos
description: Use when you need to drive the extracted Claude Code macOS computer-use MCP server from a standalone GitHub project or local Codex setup, especially for screenshots, clicks, typing, app control, and computer-use MCP wiring.
---

# Computer Use macOS

Use this skill when the task needs the extracted standalone macOS computer-use MCP server from this repository.

## What this skill does

- points Codex at the standalone `claude-computer-use-mcp` project
- checks the required native-module environment variables
- builds and launches the MCP server
- reminds the operator that this standalone host auto-approves `request_access`

## Required environment

Before starting the server, verify these environment variables are set:

```bash
printf '%s\n' "$COMPUTER_USE_SWIFT_NODE_PATH" "$COMPUTER_USE_INPUT_NODE_PATH"
```

If either value is empty, stop and explain that the standalone project needs the original native `.node` modules.

## Project path

Assume the extracted project lives at:

```bash
/Users/haoc/Developer/cc-mg/claude-computer-use-mcp
```

## Build

```bash
cd /Users/haoc/Developer/cc-mg/claude-computer-use-mcp
npm install
npm run build
```

## Run

```bash
cd /Users/haoc/Developer/cc-mg/claude-computer-use-mcp
node dist/cli.js
```

## Guardrails

- Treat this host as trusted-local only.
- Do not claim the native modules are bundled if the env vars are missing.
- Mention that `request_access` is auto-approved in this standalone adaptation.
