#!/usr/bin/env bash
#
# Gera a chave SSH de deploy, o known_hosts e um checklist com o que
# ainda precisa ser feito à mão (servidor + GitHub Environments).
#
# Não cadastra secrets no GitHub nem altera o servidor — só prepara
# os valores e o documento de próximos passos.
#
# Uso:
#   ./bin/setup-github-deploy-secrets.sh
#   ./bin/setup-github-deploy-secrets.sh staging
#   ./bin/setup-github-deploy-secrets.sh production
#
# Saída (fora do git):
#   .deploy-setup/<ambiente>/

set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
step() { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ! $1${NC}"; }
die()  { echo -e "\n${RED}✗ $1${NC}\n"; exit 1; }

ask() {
    local prompt="$1"
    local default="${2:-}"
    local value
    if [ -n "$default" ]; then
        read -rp "  $prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -rp "  $prompt: " value
        echo "$value"
    fi
}

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT_ROOT="$ROOT/.deploy-setup"

# --- Pré-requisitos ----------------------------------------------------------

step "Verificando pré-requisitos"

command -v ssh-keygen >/dev/null 2>&1 || die "ssh-keygen não encontrado."
command -v ssh-keyscan >/dev/null 2>&1 || die "ssh-keyscan não encontrado."
ok "ssh-keygen e ssh-keyscan disponíveis"

# --- Ambiente ----------------------------------------------------------------

ENV_NAME="${1:-}"
if [ -z "$ENV_NAME" ]; then
    echo ""
    echo "  Qual environment do GitHub?"
    echo "    1) staging     (branch main)"
    echo "    2) production  (branch production)"
    read -rp "  Escolha [1/2]: " choice
    case "$choice" in
        1) ENV_NAME="staging" ;;
        2) ENV_NAME="production" ;;
        *) die "Opção inválida." ;;
    esac
fi

case "$ENV_NAME" in
    staging|production) ;;
    *) die "Ambiente inválido: use staging ou production." ;;
esac

OUT_DIR="$OUT_ROOT/$ENV_NAME"
KEY_PATH="$OUT_DIR/deploy_key"
KNOWN_HOSTS_PATH="$OUT_DIR/known_hosts"
VALUES_PATH="$OUT_DIR/values.env"
CHECKLIST_PATH="$OUT_DIR/PROXIMOS-PASSOS.md"

if [ -d "$OUT_DIR" ]; then
    warn "Já existe $OUT_DIR"
    read -rp "  Sobrescrever? [s/N] " answer
    [ "${answer:-}" = "s" ] || die "Cancelado."
    rm -rf "$OUT_DIR"
fi

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

# --- Dados do servidor -------------------------------------------------------

step "Dados do servidor ($ENV_NAME)"

SSH_HOST="$(ask "SSH_HOST (hostname ou IP)")"
[ -n "$SSH_HOST" ] || die "SSH_HOST é obrigatório."

SSH_PORT="$(ask "SSH_PORT" "22")"
SSH_USER="$(ask "SSH_USER")"
[ -n "$SSH_USER" ] || die "SSH_USER é obrigatório."

APP_PATH="$(ask "APP_PATH (caminho absoluto no servidor)")"
[ -n "$APP_PATH" ] || die "APP_PATH é obrigatório."
[[ "$APP_PATH" == /* ]] || die "APP_PATH precisa ser absoluto (começar com /)."

DEFAULT_URL=""
if [ "$ENV_NAME" = "staging" ]; then
    DEFAULT_URL="https://homolog.exemplo.com.br"
else
    DEFAULT_URL="https://app.exemplo.com.br"
fi
APP_URL="$(ask "APP_URL (URL pública, sem barra no final)" "$DEFAULT_URL")"
APP_URL="${APP_URL%/}"

# --- Chave -------------------------------------------------------------------

step "Gerando chave Ed25519 (sem senha — só para o Actions)"

ssh-keygen -t ed25519 -C "github-deploy-${ENV_NAME}" -f "$KEY_PATH" -N "" -q
chmod 600 "$KEY_PATH"
chmod 644 "$KEY_PATH.pub"
ok "Chave em $KEY_PATH"

# --- Known hosts -------------------------------------------------------------

step "Capturando SSH_KNOWN_HOSTS (ssh-keyscan)"

warn "Confie neste host agora: o fingerprint entrará no secret do GitHub."
if ! ssh-keyscan -p "$SSH_PORT" -T 10 "$SSH_HOST" > "$KNOWN_HOSTS_PATH" 2>/dev/null; then
    die "ssh-keyscan falhou para $SSH_HOST:$SSH_PORT. Confira host/porta/firewall."
fi

if [ ! -s "$KNOWN_HOSTS_PATH" ]; then
    die "ssh-keyscan retornou vazio. Confira se a porta SSH responde."
fi

# Remove comentários vazios / linhas só com # geradas pelo keyscan
grep -v '^#' "$KNOWN_HOSTS_PATH" | grep -v '^[[:space:]]*$' > "$KNOWN_HOSTS_PATH.tmp"
mv "$KNOWN_HOSTS_PATH.tmp" "$KNOWN_HOSTS_PATH"
chmod 644 "$KNOWN_HOSTS_PATH"
ok "known_hosts salvo ($KNOWN_HOSTS_PATH)"

# --- Arquivo de valores ------------------------------------------------------

step "Gravando valores prontos para colar"

{
    echo "# Gerado em $(date '+%Y-%m-%d %H:%M:%S') · environment=$ENV_NAME"
    echo "# NÃO versionar. NÃO compartilhar."
    echo ""
    echo "SSH_HOST=$SSH_HOST"
    echo "SSH_PORT=$SSH_PORT"
    echo "SSH_USER=$SSH_USER"
    echo "APP_PATH=$APP_PATH"
    echo "APP_URL=$APP_URL"
    echo ""
    echo "# SSH_PRIVATE_KEY → conteúdo de deploy_key (arquivo sem .pub)"
    echo "# SSH_KNOWN_HOSTS → conteúdo de known_hosts"
} > "$VALUES_PATH"
chmod 600 "$VALUES_PATH"
ok "Valores em $VALUES_PATH"

# --- Checklist ---------------------------------------------------------------

step "Gerando checklist de próximos passos"

BRANCH="main"
if [ "$ENV_NAME" = "production" ]; then
    BRANCH="production"
fi

REPO_URL="https://github.com/OWNER/REPO"
if command -v gh >/dev/null 2>&1; then
    if REMOTE_URL="$(gh repo view --json url -q .url 2>/dev/null)"; then
        REPO_URL="$REMOTE_URL"
    fi
fi

SETTINGS_URL="${REPO_URL}/settings/environments"

cat > "$CHECKLIST_PATH" <<EOF
# Próximos passos — deploy GitHub ($ENV_NAME)

Gerado em $(date '+%d/%m/%Y %H:%M:%S') por \`bin/setup-github-deploy-secrets.sh\`.

Arquivos deste pacote (locais, fora do git):

| Arquivo | Uso |
|---|---|
| \`deploy_key\` | Secret **SSH_PRIVATE_KEY** |
| \`deploy_key.pub\` | Colar no \`authorized_keys\` do servidor |
| \`known_hosts\` | Secret **SSH_KNOWN_HOSTS** |
| \`values.env\` | Demais secrets / variável |
| \`PROXIMOS-PASSOS.md\` | Este checklist |

---

## 1. Servidor — autorizar a chave pública

Conecte no servidor (com a sua chave pessoal) e acrescente a pública:

\`\`\`bash
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo '$(cat "$KEY_PATH.pub")' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
\`\`\`

Teste da sua máquina (deve entrar **sem senha**, só com a chave gerada):

\`\`\`bash
ssh -p $SSH_PORT -i $KEY_PATH $SSH_USER@$SSH_HOST 'echo OK && pwd'
\`\`\`

Confirme que o projeto existe em \`$APP_PATH\` e que \`./bin/deploy.sh\` está executável.

---

## 2. GitHub — environment \`$ENV_NAME\`

Abra: [$SETTINGS_URL]($SETTINGS_URL)

1. Crie o environment **$ENV_NAME** se ainda não existir.
2. Branch que dispara o deploy: **$BRANCH**.
$([ "$ENV_NAME" = "production" ] && echo "3. Em **Environment protection rules**, exija aprovação manual antes do deploy." || echo "3. Staging pode ficar sem aprovação manual.")

### Secrets (Environment secrets)

| Secret | Valor |
|---|---|
| \`SSH_PRIVATE_KEY\` | Conteúdo completo de \`deploy_key\` (incluindo as linhas BEGIN/END) |
| \`SSH_HOST\` | \`$SSH_HOST\` |
| \`SSH_PORT\` | \`$SSH_PORT\` |
| \`SSH_USER\` | \`$SSH_USER\` |
| \`SSH_KNOWN_HOSTS\` | Conteúdo completo de \`known_hosts\` |
| \`APP_PATH\` | \`$APP_PATH\` |

### Variável (Environment variables — **não** é secret)

| Variável | Valor |
|---|---|
| \`APP_URL\` | \`$APP_URL\` |

Comandos úteis para copiar do terminal:

\`\`\`bash
# privada
cat $KEY_PATH | xclip -selection clipboard 2>/dev/null || cat $KEY_PATH

# known_hosts
cat $KNOWN_HOSTS_PATH | xclip -selection clipboard 2>/dev/null || cat $KNOWN_HOSTS_PATH
\`\`\`

---

## 3. Validar o pipeline

1. Garanta que o CI do commit passou.
2. Push na branch \`$BRANCH\` (ou rode o workflow **Deploy** em Actions → workflow_dispatch).
3. Confira o job do environment **$ENV_NAME**.
4. A URL \`$APP_URL/up\` deve responder **200**.

---

## 4. Limpeza local (depois de cadastrar)

Quando os secrets estiverem no GitHub e a chave no servidor:

\`\`\`bash
rm -rf $OUT_DIR
\`\`\`

Não versione \`.deploy-setup/\` — já está no \`.gitignore\`.

---

## Referência

- Workflow: \`.github/workflows/deploy.yml\`
- README: seção Deploy
EOF

chmod 600 "$CHECKLIST_PATH"
ok "Checklist em $CHECKLIST_PATH"

# --- Resumo ------------------------------------------------------------------

echo ""
echo -e "${GREEN}Pronto.${NC} Pacote gerado em:"
echo "  $OUT_DIR"
echo ""
echo "Abra o checklist e siga na ordem:"
echo "  $CHECKLIST_PATH"
echo ""
warn "A chave privada nunca deve ir para o git nem para chat."
echo ""
