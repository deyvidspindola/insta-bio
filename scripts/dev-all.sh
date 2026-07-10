#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEV_PORTS=(5173 5175 5180 5190)

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tlnH "sport = :$port" 2>/dev/null | grep -q .
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
    return $?
  fi
  return 1
}

check_ports() {
  local busy=()
  for port in "${DEV_PORTS[@]}"; do
    if port_in_use "$port"; then
      busy+=("$port")
    fi
  done

  if ((${#busy[@]} > 0)); then
    echo "Erro: porta(s) já em uso: ${busy[*]}"
    echo ""
    echo "Provavelmente um make dev-all anterior ainda está rodando."
    echo "Encerre com Ctrl+C no terminal antigo ou rode:"
    echo ""
    for port in "${busy[@]}"; do
      echo "  fuser -k ${port}/tcp"
    done
    echo ""
    exit 1
  fi
}

check_ports

echo ""
echo "→ Verificando builds do template / clientes…"
node scripts/ensure-dev-builds.mjs

# Editor em /{slug}/editor/ usa o build estático sincronizado (confiável).
# Proxy Vite é opt-in e frágil sob subpath: EDITOR_DEV_PROXY=1 make dev-all
export EDITOR_DEV_PROXY="${EDITOR_DEV_PROXY:-0}"

echo ""
echo "insta-bio — servidores de desenvolvimento"
echo ""
echo "  Bio demo:  http://localhost:5173/"
echo "  Editor:    http://localhost:5180/  (Vite ao vivo — use este p/ UX)"
echo "  Demo:      http://localhost:5180/demo.html"
echo "  Painel:    http://localhost:5175/panel/  (admin@local.dev / admin123)"
echo "  Cliente:   http://localhost:5175/{slug}/  (bio estática)"
echo "             http://localhost:5175/{slug}/editor/  (build estático sync)"
echo "  Landing:   http://localhost:5190/"
echo ""
if [[ "$EDITOR_DEV_PROXY" == "1" ]]; then
  echo "  Editor do cliente: PROXY Vite (experimental, EDITOR_DEV_PROXY=1)"
else
  echo "  Editor do cliente: build estático (atualizado no start se fontes mudaram)"
fi
echo "  Pular rebuild: SKIP_DEV_BUILD=1 make dev-all"
echo "  Forçar rebuild: FORCE_DEV_BUILD=1 make dev-all"
echo ""
echo "  No WSL, se localhost falhar no Windows, use o IP Network do Vite."
echo ""
echo "Ctrl+C para parar todos"
echo ""

PIDS=()

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "Parando servidores…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

start_service() {
  local label="$1"
  shift
  "$@" &
  PIDS+=($!)
}

start_service "bio" npm run bio
start_service "editor" npm run editor
start_service "panel" npm run panel
start_service "site" npm run site

wait
