#!/bin/bash
# Run this in your Mac Terminal (not Cursor background) for reliable auth/network.
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
echo "Starting HireLoop web on http://localhost:3000"
npm run dev -- --hostname localhost --port 3000
