#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SRC_DIR/../.." && pwd)"
DEST_DIR="${CODEX_HOME:-$HOME/.codex}/skills/computer-use-macos"
PROJECT_DIR="$DEST_DIR/project"

mkdir -p "$DEST_DIR"
rsync -a "$SRC_DIR/" "$DEST_DIR/"
mkdir -p "$PROJECT_DIR"
rsync -a \
  --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.runtime' \
  --exclude '.DS_Store' \
  --exclude 'skill/computer-use-macos' \
  "$REPO_ROOT/" "$PROJECT_DIR/"
printf 'Installed skill to %s\n' "$DEST_DIR"
