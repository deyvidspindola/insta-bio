#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d platform-template/_template ]]; then
  echo "→ Gerando template de cliente (primeira vez)…"
  npm run build:template
fi

echo ""
echo "insta-bio — servidores de desenvolvimento"
echo ""
echo "  Bio demo:  http://localhost:5173"
echo "  Editor:    http://localhost:5180"
echo "  Painel:    http://localhost:5175/panel/  (admin@local.dev / admin123)"
echo "  Landing:   http://localhost:5190"
echo ""
echo "Ctrl+C para parar todos"
echo ""

cleanup() {
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm run dev &
npm run admin &
npm run panel &
npm run site &

wait
