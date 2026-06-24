#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="${HOME}/.local/bin"
LINK="${BIN_DIR}/454"

mkdir -p "$BIN_DIR"
chmod +x "${ROOT}/bin/454"
ln -sf "${ROOT}/bin/454" "$LINK"

echo "Installed: 454 → ${ROOT}/bin/454"
echo "Run from anywhere: 454"