#!/usr/bin/env bash
#
# Observador de deploy local.
#
# Fica rodando, vigia o Git e, quando aparece commit novo na branch
# escolhida, MATA a instancia, atualiza o codigo e SOBE de novo.
#
# Nao usa hot-reload de proposito: derrubar e subir o processo e o que
# garante que voce esta testando exatamente o que esta no repositorio,
# sem estado velho em memoria.
#
#   ./scripts/auto-update.sh
#   BRANCH=main MODE=preview INTERVAL=15 ./scripts/auto-update.sh
#
# Variaveis:
#   BRANCH    branch vigiada           (padrao: a branch atual)
#   INTERVAL  segundos entre checagens (padrao: 30)
#   PORT      porta do servidor        (padrao: 5173)
#   MODE      dev | preview            (padrao: dev)
#             dev     = servidor de desenvolvimento, sobe rapido
#             preview = build de producao, exercita o PWA e o service worker
#   VERIFY    1 | 0                    (padrao: 1)
#             roda typecheck, validate e testes antes de reiniciar
#
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
INTERVAL="${INTERVAL:-30}"
PORT="${PORT:-5173}"
MODE="${MODE:-dev}"
VERIFY="${VERIFY:-1}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.local-instance}"
SERVER_LOG="$LOG_DIR/server.log"
SERVER_PID=""

mkdir -p "$LOG_DIR"

c_reset=$'\033[0m'; c_dim=$'\033[2m'; c_blue=$'\033[34m'
c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_red=$'\033[31m'

log()  { printf '%s[%s]%s %s\n' "$c_dim" "$(date +%H:%M:%S)" "$c_reset" "$*"; }
info() { log "${c_blue}•${c_reset} $*"; }
ok()   { log "${c_green}✓${c_reset} $*"; }
warn() { log "${c_yellow}!${c_reset} $*"; }
err()  { log "${c_red}✗${c_reset} $*"; }

# ---------------------------------------------------------------------------
# Ciclo de vida do servidor
# ---------------------------------------------------------------------------

stop_server() {
  if [[ -z "$SERVER_PID" ]]; then return 0; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then SERVER_PID=""; return 0; fi
  info "derrubando instancia (pid $SERVER_PID)"
  # Mata o grupo inteiro: vite gera processos filhos que sobrevivem a um
  # kill no pai e seguram a porta.
  kill -TERM -- "-$SERVER_PID" 2>/dev/null || kill -TERM "$SERVER_PID" 2>/dev/null
  for _ in $(seq 1 20); do
    kill -0 "$SERVER_PID" 2>/dev/null || break
    sleep 0.25
  done
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    warn "nao saiu com TERM, mandando KILL"
    kill -KILL -- "-$SERVER_PID" 2>/dev/null || kill -KILL "$SERVER_PID" 2>/dev/null
  fi
  SERVER_PID=""
  ok "instancia derrubada"
}

start_server() {
  : > "$SERVER_LOG"
  if [[ "$MODE" == "preview" ]]; then
    setsid npm run preview -- --host 0.0.0.0 --port "$PORT" >>"$SERVER_LOG" 2>&1 &
  else
    setsid npm run dev -- --host 0.0.0.0 --port "$PORT" >>"$SERVER_LOG" 2>&1 &
  fi
  SERVER_PID=$!
  info "subindo instancia em modo $MODE (pid $SERVER_PID)"

  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null --max-time 2 "http://localhost:$PORT/"; then
      ok "no ar: http://localhost:$PORT  (commit $(git rev-parse --short HEAD))"
      return 0
    fi
    kill -0 "$SERVER_PID" 2>/dev/null || { err "o processo morreu ao subir; ultimas linhas:"; tail -15 "$SERVER_LOG"; return 1; }
    sleep 0.5
  done
  err "nao respondeu em 30s; ultimas linhas:"; tail -15 "$SERVER_LOG"
  return 1
}

restart_server() { stop_server; start_server; }

cleanup() { echo; info "encerrando observador"; stop_server; exit 0; }
trap cleanup INT TERM

# ---------------------------------------------------------------------------
# Atualizacao
# ---------------------------------------------------------------------------

remote_head() {
  git fetch -q origin "$BRANCH" 2>/dev/null || return 1
  git rev-parse FETCH_HEAD 2>/dev/null
}

verify() {
  [[ "$VERIFY" != "1" ]] && return 0
  info "verificando antes de reiniciar"
  if npm run typecheck >>"$LOG_DIR/verify.log" 2>&1 \
     && npm run validate >>"$LOG_DIR/verify.log" 2>&1 \
     && npx vitest run >>"$LOG_DIR/verify.log" 2>&1; then
    ok "verificacao passou"
    return 0
  fi
  err "verificacao FALHOU — detalhes em $LOG_DIR/verify.log"
  return 1
}

update_to_remote() {
  local before after
  before="$(git rev-parse HEAD)"

  # NUNCA puxar por cima de trabalho nao commitado: um pull automatico
  # apagaria alteracoes que ninguem salvou.
  if [[ -n "$(git status --porcelain)" ]]; then
    warn "arvore de trabalho suja — pulando a atualizacao para nao apagar nada"
    git status --short | head -5
    return 1
  fi

  # Somente fast-forward: historico divergente precisa de decisao humana.
  if ! git merge --ff-only FETCH_HEAD >>"$LOG_DIR/git.log" 2>&1; then
    err "historico divergiu de origin/$BRANCH — precisa de decisao sua, nao de automacao"
    return 1
  fi
  after="$(git rev-parse HEAD)"
  ok "atualizado: ${before:0:7} → ${after:0:7}"
  git --no-pager log --oneline "${before}..${after}" | head -8 | sed 's/^/        /'

  if ! git diff --quiet "${before}" "${after}" -- package-lock.json package.json; then
    info "dependencias mudaram, rodando npm ci"
    if ! npm ci >>"$LOG_DIR/npm.log" 2>&1; then
      err "npm ci falhou — veja $LOG_DIR/npm.log"
      return 1
    fi
    ok "dependencias atualizadas"
  fi

  if [[ "$MODE" == "preview" ]]; then
    info "gerando build de producao"
    if ! npm run build >>"$LOG_DIR/build.log" 2>&1; then
      # Build quebrado NAO derruba a instancia: seguimos servindo o ultimo
      # build bom ate alguem consertar.
      err "build falhou — mantendo a instancia anterior no ar. Veja $LOG_DIR/build.log"
      return 1
    fi
    ok "build gerado"
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Inicio
# ---------------------------------------------------------------------------

echo
info "observador de deploy local"
info "repositorio : $REPO_DIR"
info "branch      : $BRANCH"
info "modo        : $MODE   intervalo: ${INTERVAL}s   verificacao: $([[ "$VERIFY" == "1" ]] && echo ligada || echo desligada)"
info "logs        : $LOG_DIR"
echo

if [[ "$MODE" == "preview" ]]; then
  info "gerando build inicial"
  npm run build >>"$LOG_DIR/build.log" 2>&1 || { err "build inicial falhou — veja $LOG_DIR/build.log"; exit 1; }
fi
start_server || exit 1

LAST_SEEN="$(git rev-parse HEAD)"
while true; do
  sleep "$INTERVAL"
  REMOTE="$(remote_head || true)"
  if [[ -z "$REMOTE" ]]; then warn "nao consegui falar com o Git; tento de novo em ${INTERVAL}s"; continue; fi
  [[ "$REMOTE" == "$(git rev-parse HEAD)" ]] && continue

  echo
  info "commit novo em origin/$BRANCH: ${REMOTE:0:7}"
  if update_to_remote && verify; then
    restart_server || warn "a instancia nao voltou; veja $SERVER_LOG"
  elif [[ "$MODE" == "dev" ]]; then
    # Em dev a instancia reinicia mesmo com verificacao vermelha: o erro
    # aparece no navegador, que e onde voce quer ver.
    warn "reiniciando mesmo assim (modo dev mostra o erro na tela)"
    restart_server || warn "a instancia nao voltou; veja $SERVER_LOG"
  else
    warn "instancia anterior mantida no ar"
  fi
  LAST_SEEN="$(git rev-parse HEAD)"
  echo
done
