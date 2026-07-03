# Guia de comercialização — insta-bio

Como **instalar**, **entregar** e **manter** o produto para cada cliente (igreja, empresa, influenciador).

---

## O que você está vendendo

Um **link da bio** profissional para Instagram, com:

- Página rápida, responsiva e personalizável
- Conteúdo editável **sem programar** (editor visual com login)
- Hospedagem em servidor compartilhado (ex.: HostGator) — **sem mensalidade de VPS**
- Sem banco de dados

**Pacote típico para o cliente:**

| Item | Descrição |
|------|-----------|
| Setup inicial | Logo, cores, textos, links, seções configurados |
| Domínio | `bio.cliente.com.br` ou `cliente.com.br` |
| Editor online | Área restrita para o cliente editar sozinho |
| Suporte | Atualizações pontuais ou plano mensal (você define) |

---

## Modelo técnico (resumo)

```
┌─────────────────────────────────────────────────────────┐
│  SEU COMPUTADOR (desenvolvimento)                        │
│  Node.js → npm run build + npm run admin:hostgator      │
└──────────────────────────┬──────────────────────────────┘
                           │ FTP / upload
                           ▼
┌─────────────────────────────────────────────────────────┐
│  HOSTGATOR (produção)                                    │
│                                                          │
│  public_html/              ← site público (dist/)        │
│  public_html/editor/       ← painel + PHP (admin/dist/)  │
│                                                          │
│  Sem Node · Sem MySQL · Só PHP para login/salvar       │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist — novo cliente do zero

Use esta lista para cada venda/entrega.

### Fase 1 — Coleta (com o cliente)

- [ ] Nome e tagline
- [ ] Cidade / localização
- [ ] @ Instagram e link
- [ ] Logo (arquivo PNG/JPG ou pedir para enviar)
- [ ] Cores preferidas (ou usar padrão laranja)
- [ ] Lista de links (WhatsApp, formulários, YouTube, grupos…)
- [ ] Fotos para cards (opcional)
- [ ] Domínio: já tem? qual pasta usar?

### Fase 2 — Montagem local

```bash
# 1. Clonar o template (ou copiar pasta do projeto)
cd insta-bio
npm install && npm install --prefix admin

# 2. Editar conteúdo
npm run admin          # http://localhost:5180
# Login dev: admin / troque-esta-senha (admin/auth.json)

# 3. Ajustar public/bio.json + public/assets/

# 4. Gerar builds
npm run build
npm run hash-password --prefix admin -- "SenhaUnicaDoCliente"
cp admin/php/auth.config.example.php admin/php/auth.config.php
# Editar auth.config.php com usuário e hash
npm run admin:hostgator
```

### Fase 3 — Publicação

Siga [HOSTGATOR.md](./HOSTGATOR.md) — passos 4 e 5.

- [ ] Site no ar em `https://dominio/`
- [ ] Editor em `https://dominio/editor/`
- [ ] Login testado
- [ ] Salvar testado
- [ ] Upload de imagem testado
- [ ] SSL (HTTPS) ativo
- [ ] Link testado no celular (como abre pelo Instagram)

### Fase 4 — Entrega ao cliente

Envie por escrito:

1. **URL do site:** `https://...`
2. **URL do editor:** `https://.../editor/`
3. **Usuário e senha** do editor (senha forte, única)
4. **Instrução curta:** "Entre no editor, edite e clique em Salvar. O site atualiza na hora."

Opcional: gravar um vídeo de 2 minutos mostrando o editor.

---

## Um cliente = um deploy (recomendado)

Para comercializar, o modelo mais simples é **uma instalação por cliente**:

| Cliente | Onde fica |
|---------|-----------|
| Igreja A | `igreja-a.com.br` → pasta `public_html` da conta A |
| Igreja B | `igreja-b.com.br` → pasta `public_html` da conta B |

Cada um tem seu próprio `bio.json`, `assets/`, `auth.config.php` e senha.

**Não** misture vários clientes no mesmo `bio.json`.

---

## Reutilizar o template para outro cliente

### Opção A — Pelo editor (rápido)

1. `npm run admin`
2. **Importar JSON** de outro projeto, ou **Limpar e começar do zero**
3. Trocar marca, seções, imagens
4. Build + deploy na conta HostGator do novo cliente

### Opção B — Copiar pasta do projeto

1. Duplicar a pasta `insta-bio` → `insta-bio-cliente-x`
2. Limpar `public/assets/` (manter só o que for do cliente)
3. Resetar `public/bio.json` (ou usar `createEmptyConfig` no editor)
4. Novo `auth.config.php` com senha diferente

---

## O que cobrar (sugestão de referência)

Valores são **seus** — isto é só estrutura:

| Serviço | Exemplo de escopo |
|---------|-------------------|
| Setup único | Montagem, identidade visual, até X links, publicação |
| Hospedagem | Repasse do plano HostGator ou incluso no pacote |
| Manutenção mensal | Suporte para editar por ele, backups, pequenos ajustes |
| Domínio | Registro anual (se você gerenciar) |

O cliente pode editar sozinho pelo editor — isso reduz suporte recorrente.

---

## Manutenção que você faz vs. cliente

| Tarefa | Quem |
|--------|------|
| Mudar texto/link | Cliente (editor) |
| Trocar logo / foto | Cliente (upload no editor) |
| Nova seção ou card | Cliente (editor) |
| Atualizar template (código novo) | Você (rebuild + FTP) |
| Trocar domínio / SSL | Você |
| Esqueceu a senha | Você (gera novo hash) |

### Resetar senha do cliente

```bash
npm run hash-password --prefix admin -- "NovaSenha123"
```

Atualize `AUTH_PASSWORD_HASH` no `auth.config.php` do servidor (FTP) e envie a nova senha ao cliente.

---

## Desenvolvimento local vs. produção

| Ambiente | Comando | Login |
|----------|---------|-------|
| **Seu PC** | `npm run admin` | `admin/auth.json` |
| **HostGator** | (arquivos em `editor/`) | `auth.config.php` |

No PC você desenvolve e testa. Na HostGator o cliente usa o editor publicado.

---

## Estrutura de arquivos que o cliente **não** deve mexer

Por FTP, o cliente só precisa do editor. Estes arquivos são técnicos:

- `editor/assets/*.js` — código compilado
- `editor/*.php` — autenticação e API
- `editor/.htaccess`

Se algo quebrar após edição manual no servidor, reenvie `admin/dist/` (preservando `auth.config.php`).

---

## Checklist de qualidade antes de entregar

- [ ] Site abre em menos de 3s no 4G
- [ ] Todos os links abrem (WhatsApp, formulários, mapas)
- [ ] Logo nítido (não pixelado)
- [ ] Textos sem typo
- [ ] `seo.title` e `seo.description` preenchidos
- [ ] Rodapé com nome/ano corretos
- [ ] Preview no editor bate com o site publicado
- [ ] HTTPS sem aviso de "não seguro"

---

## Evolução do produto (para você)

Quando adicionar funcionalidades no código:

1. Desenvolva local (`npm run dev` / `npm run admin`)
2. Teste
3. `npm run build` + `npm run admin:hostgator`
4. Atualize clientes via FTP (ou ofereça como "atualização paga")

Documente mudanças em [PROJETO.md](./PROJETO.md) e [BIO-JSON.md](./BIO-JSON.md).

---

## Documentos relacionados

- [HOSTGATOR.md](./HOSTGATOR.md) — deploy técnico passo a passo
- [ADMIN.md](./ADMIN.md) — manual do editor
- [BIO-JSON.md](./BIO-JSON.md) — referência de conteúdo
- [PROJETO.md](./PROJETO.md) — arquitetura para desenvolvedores
