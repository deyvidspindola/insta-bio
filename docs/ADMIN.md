# Editor visual (admin)

Painel para editar o `bio.json` pela tela, com preview ao vivo e login.

---

## Uso local (desenvolvimento)

```bash
npm run admin    # http://localhost:5180
```

**Login:** usuário e senha em `admin/auth.json` (copie de `admin/auth.example.json`).

```bash
cp admin/auth.example.json admin/auth.json
```

---

## Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Marca** | Nome, logo, Instagram, cores, SEO, rodapé |
| **Seções** | Criar, editar, excluir e **reordenar** (arrastar) |
| **Cards** | Destaque de app (WhatsApp, YouTube, Instagram…), Card (várias variantes), Link, Localização |
| **Cards** | Arrastar para reordenar; **recolher/expandir** para organizar |
| **Preview ao vivo** | Atualiza em tempo real (painel lateral no desktop) |
| **Upload** | Envia imagens para `assets/` e preenche o caminho |
| **Salvar no servidor** | Grava `bio.json` direto (PHP na HostGator / Node no dev) |
| **Importar / Copiar / Baixar** | Exportar JSON |
| **JSON** | Visualização formatada com estatísticas e ações |
| **Tema** | Modo escuro / claro (preferência salva no navegador) |

### Variantes do card (`type: feature`)

| Variante | Uso |
|----------|-----|
| `gradient` | Card colorido com ícone |
| `square` | Card quadrado (use com layout `grid-2`) |
| `compact` | Estilo YouTube / horizontal |
| `portrait` | Retrato com imagem |
| `banner` | Banner largo com imagem e tags |

> O tipo legado `grid` ainda funciona no site, mas no editor use **Card → Quadrado**.

---

## Fluxo de trabalho

### Na HostGator (produção)

1. Acesse `https://seudominio.com/editor/`
2. Faça login
3. Edite Marca, Seções, cards
4. Clique em **Salvar**
5. Confira o site em `https://seudominio.com/`

### No seu computador (dev)

1. `npm run admin`
2. Edite e use **Salvar** (grava em `public/bio.json`) ou **Baixar**
3. O site em `npm run dev` recarrega o JSON automaticamente

---

## Deploy na HostGator

**→ Guia completo:** [HOSTGATOR.md](./HOSTGATOR.md)

Resumo:

```bash
npm run hash-password --prefix admin -- "sua-senha"
cp admin/php/auth.config.example.php admin/php/auth.config.php
# editar auth.config.php
npm run admin:hostgator
```

Subir `admin/dist/` para `public_html/editor/` e o site (`dist/`) para a raiz.

---

## Segurança

| Ambiente | Credenciais |
|----------|-------------|
| Local (`npm run admin`) | `admin/auth.json` |
| HostGator | `editor/auth.config.php` (hash bcrypt) |

- Login validado no **servidor** (Node em dev, PHP em produção)
- Senha **nunca** vai no JavaScript nem no `bio.json` público
- Salvar e upload exigem sessão autenticada
- Use **HTTPS** na HostGator (SSL grátis no cPanel)

---

## Estrutura

```
admin/
├── src/                 # React (editor)
├── php/                 # API PHP (produção HostGator)
│   ├── login.php
│   ├── save.php
│   ├── upload.php
│   └── auth.config.example.php
├── server/              # API Node (só dev local)
├── dist/                # Build para upload (gerado)
└── auth.json            # Login local (gitignored)
```

---

## Documentos relacionados

- [HOSTGATOR.md](./HOSTGATOR.md) — deploy passo a passo
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) — instalar para clientes
- [BIO-JSON.md](./BIO-JSON.md) — referência do conteúdo
