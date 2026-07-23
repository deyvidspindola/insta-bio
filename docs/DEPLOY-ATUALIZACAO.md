# Deploy — o que buildar e o que subir

Dois destinos. Só isso.

| Destino | Comando | Pasta gerada | Onde sobe |
|---------|---------|--------------|-----------|
| **Plataforma** (painel + API + updates) | `make platform-core` | `platform-release/` | Servidor principal (`/panel/`, `/_template/`, landing) |
| **Clientes** (bio + editor) | `make update-package` | `dist/updates/` | **Só na plataforma** em `panel/data/updates/` — o cliente atualiza pelo editor |

---

## 1. Plataforma (`make platform-core`)

Use quando mudar: painel admin, APIs PHP (`license`, `analytics`, etc.), landing, template de cliente novo, ou quiser republicar o ZIP de updates junto.

```bash
make platform-core
```

### O que sobe no FTP (servidor da plataforma)

| De `platform-release/` | Para no servidor | Observação |
|------------------------|------------------|------------|
| `panel/*` (HTML, JS, PHP, lib/) | `/panel/` | **Preservar** `db.config.php`, `sites/`, dados de clientes |
| `panel/data/updates/` | `/panel/data/updates/` | ZIP + `updates.json` |
| `_template/` | `/_template/` | Modelo para **novos** clientes |
| raiz (`index.html`, assets…) | raiz do domínio | Landing (se existir no pacote) |

**Nunca sobrescrever no servidor:** `panel/db.config.php`, pastas `panel/sites/{slug}/` (dados dos clientes).

### Analytics / licença

Tudo isso vive **só no `/panel/`** da plataforma:

- `analytics-track.php`, `analytics-*.php`
- `license-check.php`
- `lib/analytics*.php`, `lib/license.php`

Cliente self-hosted **não** recebe esses arquivos. Ele só chama a API da plataforma.

---

## 2. Update dos clientes (`make update-package`)

Use quando mudar: bio (cards, preview), editor, PHP do editor (`update-apply.php`, save, gate `index.php` do cliente).

```bash
make update-package
```

Isso gera:

- `dist/updates/insta-bio-{versão}.zip`
- `dist/updates/updates.json`
- (e copia para `panel/data/updates/` se o painel local existir)

### O que fazer depois

1. Suba **só** `panel/data/updates/` na plataforma (ZIP + `updates.json`), **ou** rode `make platform-core` e suba o painel completo.
2. No editor do cliente: **Configurações → Buscar atualizações → Atualizar agora**.

Não precisa FTP em cada cliente. O ZIP já leva bio + editor + gate (`index.php`, `client-license.php`, …).

### O que o update **preserva** no cliente

- `bio.json` / `bio.draft.json`
- imagens do cliente
- `license.config.php` / cache de licença
- `auth.config.php` do editor

---

## 3. Mapa mental (não se perde)

```
Você (dev)
   │
   ├─ make platform-core ──► platform-release/
   │                              │
   │                              ▼ FTP
   │                         servidor PLATAFORMA
   │                         /panel/          ← APIs (analytics, license, admin)
   │                         /panel/data/updates/  ← ZIPs
   │                         /_template/      ← só clientes NOVOS
   │
   └─ make update-package ──► dist/updates/*.zip
                                  │
                                  ▼ sobe em /panel/data/updates/
                             cliente clica "Atualizar" no editor
                                  │
                                  ▼
                             site do CLIENTE (bio + editor atualizados)
```

| Mudou o quê? | Comando | Sobe onde? |
|--------------|---------|------------|
| Analytics, license, dashboard do painel | `platform-core` | `/panel/` na plataforma |
| Cards da bio, editor, update-apply | `update-package` | ZIP → `panel/data/updates/` → cliente atualiza no editor |
| Os dois | `platform-core` (já inclui ZIP) | plataforma; depois clientes atualizam no editor |

---

## 4. Comandos make (os que ficaram)

```bash
make install          # dependências
make dev-all          # desenvolvimento local
make platform-core    # build da plataforma
make update-package   # ZIP de update remoto
make hash-password PASSWORD="..."
make lint
make clean
```

---

## 5. Checklist rápido pós-release

1. `make platform-core` (ou só `update-package` se só mudou bio/editor)
2. FTP: sobe `/panel/` (preservando `db.config.php` e `sites/`)
3. Confirma `panel/data/updates/` com o ZIP novo
4. No editor do cliente: **Buscar atualizações → Atualizar agora**
5. Se a versão já estiver “atual” mas a bio estiver antiga: **Reaplicar pacote (bio + editor)**
6. O editor recarrega sozinho após sucesso — confira a bio (view-source nos hashes dos assets)

### O apply agora exige bio + editor completos

`update-apply.php` só grava a nova versão se:

- `site/index.html` e bundles referenciados foram copiados (hash confere)
- pasta `editor/` copiada sem falha
- gate (`index.php`, etc.) e `.htaccess` entram na bio

Falha parcial → erro explícito; a versão **não** sobe.

### Clientes “presos” (versão nova, bio antiga)

1. Publique ZIP novo na plataforma (`make update-package`)
2. No cliente: **Buscar** → se não oferecer update, use **Reaplicar pacote**
3. Se falhar: leia `editor/update.log` e liberar escrita na **raiz** do cliente e em `assets/` (não só em `editor/`)
4. Último recurso: FTP uma vez de `editor/update-apply.php` novo + **Reaplicar**

| Mudança | Como chega |
|---------|------------|
| API do painel (analytics, license) | FTP `/panel/` |
| Bio + editor + gate | ZIP → Atualizar / Reaplicar no editor |
