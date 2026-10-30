#!/usr/bin/env bash
# One-command setup for a new developer: checks Node, installs dependencies, runs all checks.
set -euo pipefail
cd "$(dirname "$0")/.."

required=$(cat .nvmrc)
current=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$current" -lt "$required" ]; then
  echo "Node $required or newer is required (found: ${current}). Install it from https://nodejs.org or with nvm: nvm install" >&2
  exit 1
fi

npm install
npm run check
echo "Setup OK. See README.md for next steps."
