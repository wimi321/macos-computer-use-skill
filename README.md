# claude-computer-use-mcp

Standalone macOS Computer Use MCP server extracted from the `computer use` implementation inside Claude Code.

This repo packages three things:

- a reusable MCP server entrypoint
- the extracted `computer-use-mcp` TypeScript surface plus a CLI host adapter
- a top-level Codex skill for wiring the server into local agent workflows

## Status

This project is intentionally split into two layers:

- Public layer: the MCP server, tool schemas, session binding, host adapter, lock handling, and Codex skill are all included here.
- Native layer: the actual low-level mouse/keyboard/screenshot modules are still loaded from `COMPUTER_USE_SWIFT_NODE_PATH` and `COMPUTER_USE_INPUT_NODE_PATH`.

Those native `.node` binaries were not present in this extracted source tree, so this repo exposes clean injection points instead of pretending the binaries are public.

## Why this exists

Claude Code already has a solid macOS computer-use stack:

- screen capture and app enumeration
- input dispatch
- MCP tool surface
- permission-tier logic
- display and coordinate handling
- session lock behavior

The original implementation is embedded inside the Claude Code product. This repo extracts the reusable part into a standalone GitHub project so the server can be studied, adapted, and reused separately.

## Requirements

- macOS
- Node.js 20+
- access to the two native modules used by the original Claude Code implementation

Environment variables:

```bash
export COMPUTER_USE_SWIFT_NODE_PATH="/absolute/path/to/computer_use.node"
export COMPUTER_USE_INPUT_NODE_PATH="/absolute/path/to/computer-use-input.node"
```

Optional runtime switches:

```bash
export CLAUDE_COMPUTER_USE_DEBUG=1
export CLAUDE_COMPUTER_USE_ENABLED=1
export CLAUDE_COMPUTER_USE_COORDINATE_MODE=pixels
export CLAUDE_COMPUTER_USE_PIXEL_VALIDATION=0
export CLAUDE_COMPUTER_USE_HIDE_BEFORE_ACTION=1
```

## Install

```bash
npm install
npm run build
```

## Run

```bash
node dist/cli.js
```

Or through the package binary:

```bash
npx claude-computer-use-mcp
```

## Notes

- `request_access` is auto-approved inside this standalone host. That makes the server usable outside the original Claude Code permission UI, but it also means you should only run it in trusted local workflows.
- The extracted tool logic and schemas are derivative of the Claude Code implementation and have been preserved as closely as practical.
- The server keeps the original file-lock idea so one active session can hold computer use at a time.

## Skill

The Codex skill lives in [skill/computer-use-macos/SKILL.md](./skill/computer-use-macos/SKILL.md).

To install it locally:

```bash
mkdir -p "$HOME/.codex/skills/computer-use-macos"
rsync -a skill/computer-use-macos/ "$HOME/.codex/skills/computer-use-macos/"
```

## Attribution

This repository was extracted and adapted from the Claude Code `computer use` implementation found in the local recovered source tree at extraction time.
