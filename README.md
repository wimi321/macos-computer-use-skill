# claude-computer-use-mcp

Standalone macOS Computer Use MCP server extracted from the `computer use` implementation inside Claude Code.

This repository turns an embedded product capability into a reusable top-level project:

- a standalone MCP server
- an extracted TypeScript computer-use surface
- a macOS CLI host adapter
- a top-level Codex skill for local agent workflows

## Why This Project Exists

Claude Code already contains a strong macOS computer-use stack:

- screenshot capture
- app discovery and resolution
- mouse and keyboard control
- permission-tier logic
- display-aware coordinate handling
- session lock protection
- MCP tool schemas and dispatch

That implementation lives inside the Claude Code product. This project extracts the reusable layer into an independent GitHub repository so it can be studied, adapted, and integrated into other local agent setups.

## What You Get

### Included in this repo

- standalone MCP server entrypoint
- extracted `computer-use-mcp` TypeScript logic
- macOS executor and host adapter
- session state and file-lock handling
- Codex skill package
- buildable TypeScript project

### Not bundled in this repo

- the original native macOS `.node` binaries used for low-level input and screenshot operations

Those binaries were not present in the extracted source tree, so this repo exposes explicit injection points instead of shipping broken placeholders.

## Features

- MCP server over stdio
- extracted computer-use tool surface
- macOS-oriented executor wrapper
- display-aware screenshot and coordinate flow
- one-session-at-a-time lock behavior
- Codex skill for repeatable local setup
- clear runtime errors when native module paths are missing

## Current Status

This project is functional at the public TypeScript layer and builds cleanly.

The runtime is split into two layers:

- Public layer: shipped here and ready to inspect, build, and extend
- Native layer: must be supplied through environment variables

## Requirements

- macOS
- Node.js 20+
- access to the original native modules for:
  - Swift screenshot / app-control bridge
  - input bridge

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Provide native module paths

```bash
export COMPUTER_USE_SWIFT_NODE_PATH="/absolute/path/to/computer_use.node"
export COMPUTER_USE_INPUT_NODE_PATH="/absolute/path/to/computer-use-input.node"
```

### 3. Build

```bash
npm run build
```

### 4. Run the MCP server

```bash
node dist/cli.js
```

You can also use the package binary:

```bash
npx claude-computer-use-mcp
```

## Runtime Configuration

Required:

```bash
export COMPUTER_USE_SWIFT_NODE_PATH="/absolute/path/to/computer_use.node"
export COMPUTER_USE_INPUT_NODE_PATH="/absolute/path/to/computer-use-input.node"
```

Optional:

```bash
export CLAUDE_COMPUTER_USE_DEBUG=1
export CLAUDE_COMPUTER_USE_ENABLED=1
export CLAUDE_COMPUTER_USE_COORDINATE_MODE=pixels
export CLAUDE_COMPUTER_USE_PIXEL_VALIDATION=0
export CLAUDE_COMPUTER_USE_HIDE_BEFORE_ACTION=1
export CLAUDE_COMPUTER_USE_AUTO_TARGET_DISPLAY=1
export CLAUDE_COMPUTER_USE_CLIPBOARD_GUARD=1
```

## Codex Skill

The top-level Codex skill is included at:

- [skill/computer-use-macos/SKILL.md](./skill/computer-use-macos/SKILL.md)

Install it locally:

```bash
mkdir -p "$HOME/.codex/skills/computer-use-macos"
rsync -a skill/computer-use-macos/ "$HOME/.codex/skills/computer-use-macos/"
```

## Project Layout

```text
.
├── skill/computer-use-macos/        # top-level Codex skill
├── src/cli.ts                       # server entrypoint
├── src/server.ts                    # MCP server wiring
├── src/session.ts                   # session state and permission behavior
├── src/computer-use/                # macOS host-side adapter code
├── src/lib/                         # local utilities
└── src/vendor/computer-use-mcp/     # extracted TypeScript computer-use layer
```

## Architecture

### Public layer

This repo contains the reusable orchestration layer:

- MCP tool definitions
- tool dispatch
- session binding
- executor interface
- host adapter
- lock handling
- skill packaging

### Native layer

The real device-control implementation is expected to come from:

- `COMPUTER_USE_SWIFT_NODE_PATH`
- `COMPUTER_USE_INPUT_NODE_PATH`

This keeps the repository honest about what was actually recoverable from the local source tree.

## Important Behavior Differences

This standalone adaptation is intentionally pragmatic.

- `request_access` is auto-approved inside this host
- the original Claude Code permission UI is not bundled here
- this should be treated as trusted-local infrastructure, not a multi-tenant service

## Limitations

- macOS only
- native `.node` binaries are not included
- no bundled desktop approval UI
- not yet packaged as a fully self-contained npm distribution
- best suited to local power-user and research workflows

## Roadmap

- add a pluggable approval callback instead of unconditional auto-approve
- support cleaner native-module packaging
- add examples for MCP client integration
- make the server easier to embed in other local agent runtimes
- document a reproducible path for reconnecting native binaries

## Development

Build:

```bash
npm run build
```

Type-check only:

```bash
npm run check
```

When the native module paths are missing, startup fails fast with a clear message. That behavior is intentional.

## Attribution

This repository was extracted and adapted from the Claude Code `computer use` implementation found in the local recovered source tree available during extraction.

This repository preserves and repackages the reusable TypeScript and host-logic layer, while leaving the unavailable native pieces as explicit runtime dependencies.
