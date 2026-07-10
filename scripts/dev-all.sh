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

if [[ ! -d platform-template/_template ]]; then
  echo "→ Gerando template de cliente (primeira vez)…"
  npm run build:template
fi

check_ports

echo ""
echo "insta-bio — servidores de desenvolvimento"
echo ""
echo "  Bio demo:  http://localhost:5173/"
echo "  Editor:    http://localhost:5180/  (código ao vivo)"
echo "  Cliente:   http://localhost:5175/{slug}/editor/  (proxy → :5180 em dev)"
echo "  Demo:      http://localhost:5180/demo.html"
echo "  Painel:    http://localhost:5175/panel/  (admin@local.dev / admin123)"
echo "  Landing:   http://localhost:5190/"
echo ""
echo "  No WSL, se localhost falhar no Windows, use o IP que o Vite mostrar em Network."
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
