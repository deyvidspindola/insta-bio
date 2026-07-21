# Prompt — detalhar implementação de atualizações remotas

> Use este arquivo para **não gastar tokens implementando** no Cursor agora.  
> Cole o bloco abaixo no Claude / GPT / outro agente e peça o plano detalhado (ou a implementação fase a fase).

---

## Como usar (econômico)

1. Cole o **Prompt completo** numa conversa nova.
2. Anexe **nesta ordem**:
   - `docs/ATUALIZACOES-REMOTAS.md` (especificação)
   - `docs/PADROES-ATUALIZACOES-REMOTAS.md` (**obrigatório** se o modelo não tiver o monorepo — exemplos reais de PHP/React/MJS)
   - este prompt
3. Peça **uma fase por vez** (A → E). Não peça “implemente tudo”.
4. Só volte ao Cursor quando tiver o passo a passo (ou o código) daquela fase.

**Por que economiza:** o doc já fecha escopo e decisões. O arquivo de padrões evita código “às cegas” (ESM, nomes de pasta, sync real).

---

## Prompt completo (copiar daqui)

```text
Você é um engenheiro sênior. Sua tarefa NÃO é reinventar o produto: é detalhar (e, se eu pedir depois, implementar) o MVP de “atualizações remotas” do monorepo insta-bio, seguindo estritamente a especificação.

## Fonte da verdade
1. docs/ATUALIZACOES-REMOTAS.md — especificação + plano mínimo
2. docs/PADROES-ATUALIZACOES-REMOTAS.md — CONVENÇÕES E EXEMPLOS REAIS do monorepo (ESM .mjs, PHP do editor, React AdvancedPanel, lógica de sync-clients-template.mjs). Se você não tem o repositório, este arquivo É o substituto do código.
Ignore ideias fora do MVP (GPG, canal beta, rollback UI, cron, modo manutenção, ZIP público sem auth).
NÃO invente CommonJS, pastas ou helpers que contradigam PADROES-ATUALIZACOES-REMOTAS.md.

## Contexto do produto (resumo)
- Dois modelos: (1) clientes na plataforma linksnabio.app.br/{slug}/ atualizados pelo /panel/; (2) single-tenant em domínio próprio, hoje atualizado só por FTP.
- Objetivo do MVP: no editor do cliente EXTERNO, aba Configurações → “Buscar atualizações” → baixar/aplicar ZIP de template sem apagar dados do cliente.
- Clientes da plataforma: mostram versão, MAS SEM botão de atualizar.

## Decisões TRAVADAS (não reabra, não sugira alternativas)
1. bio.default.json: NÃO sobrescrever.
2. Download: API autenticada na plataforma (slug + license token). NÃO servir ZIP/updates.json como arquivo estático público.
3. Quem aplica: qualquer login do editor + licença ATIVA no servidor.
4. Fora do MVP: rollback UI, GPG, beta, manutenção, update em background.
5. Backup pré-update: editor/.update-backup/ com .htaccess Deny.
6. Lógica de apply: espelhar scripts/sync-clients-template.mjs (preservar auth, limpar bundles órfãos, não duplicar pastas).
7. ZIP gerado no release (build:update-package / flag no make package), não passo manual separado.
8. Temp: preferir sys_get_temp_dir(); fallback editor/.update-tmp/ com Deny + limpeza.

## Segurança do fluxo (obrigatório)
Ordem no apply:
1) sessão do editor OK
2) API valida slug/token e cliente ativo
3) API devolve metadados + URL assinada de curta duração (ou stream autenticado) do ZIP
4) validar SHA-256
5) backup → aplicar → update-state.json → limpar temp

Preservar sempre: bio.json, bio.draft.json, bio-path.json, assets/, editor/auth.config.php, editor/platform-api.json (se existir).

## Fases (entregar UMA por mensagem, só a que eu pedir)
- A — Versão + ZIP: VERSION, package scripts, dist/updates/ com updates.json + insta-bio-{v}.zip + manifest.json interno
- B — UI só leitura: AdvancedPanel mostra versão/data; update-status.php; update-state.json no package; plataforma sem botão
- C — Check remoto: update-check.php + botão Buscar (só single-tenant) via API de licença/updates
- D — Apply: update-apply.php (backup, SHA, cópia, órfãos, estados de erro)
- E — Docs + checklist de release/HOSTGATOR

## Formato da resposta (obrigatório)
Para a fase que eu indicar AGORA, entregue:

1. Objetivo em 2–3 frases
2. Pré-requisitos (o que já precisa existir)
3. Checklist numerado do que EU preciso fazer / o que o código precisa fazer (passos concretos, arquivos, comandos)
4. Contratos JSON de request/response dos endpoints envolvidos
5. Critérios de aceite testáveis (bullet list)
6. Riscos e armadilhas (HostGator, paths, ZipArchive, permissões)
7. O que NÃO fazer nesta fase

NÃO implemente código ainda, a menos que eu diga explicitamente “implemente a Fase X”.
NÃO explore o repositório além do necessário para a fase pedida.
NÃO misture fases.

## Fase pedida nesta mensagem
Detalhe a Fase A (versão + geração do ZIP + manifesto).
Se eu pedir outra fase depois, repita o mesmo formato só para ela.
```

---

## Prompts curtos por fase (depois do primeiro)

Depois que o modelo já leu o doc / o prompt completo, use só isto:

### Fase A
```text
Detalhe só a Fase A (VERSION + build:update-package + ZIP + updates.json). Mesmo formato. Sem código ainda.
```

### Fase B
```text
Detalhe só a Fase B (UI versão/data + update-status.php). Sem botão de update. Sem código ainda.
```

### Fase C
```text
Detalhe só a Fase C (update-check.php + API autenticada + botão Buscar só single-tenant). Sem apply. Sem código ainda.
```

### Fase D
```text
Detalhe só a Fase D (update-apply.php completo). Inclua ordem de segurança, backup, SHA, preservação de arquivos. Sem código ainda.
```

### Fase E
```text
Detalhe só a Fase E (docs HOSTGATOR + checklist manual de release em PRD). Sem código ainda.
```

### Quando quiser código
```text
Agora implemente SOMENTE a Fase {A|B|C|D|E}. Não faça as outras. Ao terminar: arquivos alterados + como testar em 3 bullets.
```

---

## Alternativa ainda mais barata

Se quiser **só um guia manual** (sem o modelo escrever código):

```text
Com base em docs/ATUALIZACOES-REMOTAS.md § Plano mínimo e nas decisões travadas do prompt,
escreva um RUNBOOK em português: passos manuais numerados para eu implementar sozinho no Cursor,
fase A→E, com comandos, arquivos a criar/editar e checklist de teste. Sem código completo — só instruções.
```

---

## Nota

O arquivo `docs/ATUALIZACOES-REMOTAS.md` continua sendo a especificação.  
Este prompt só **empacota** o pedido para outro AI com escopo fechado.
