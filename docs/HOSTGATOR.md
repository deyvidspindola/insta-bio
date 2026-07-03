# Deploy na HostGator — passo a passo

Guia completo para publicar o **site da bio** e o **editor online** em hospedagem compartilhada HostGator (sem Node, sem banco de dados).

---

## O que você vai publicar

| Parte | URL típica | Tecnologia no servidor |
|-------|------------|------------------------|
| Site da bio (público) | `https://seudominio.com/` | HTML + JS + `bio.json` (estático) |
| Editor (protegido) | `https://seudominio.com/editor/` | React compilado + **PHP** |

O build é feito **no seu computador** (precisa de Node.js). Na HostGator você só sobe arquivos prontos via FTP ou Gerenciador de Arquivos.

---

## Pré-requisitos

### No seu computador (uma vez)

- [Node.js](https://nodejs.org/) 20+ instalado
- Este repositório clonado ou baixado
- Terminal na pasta do projeto

```bash
cd insta-bio
npm install
npm install --prefix admin
```

### Na HostGator

- Plano com **PHP** (todos os compartilhados têm)
- Acesso ao **cPanel** (FTP ou Gerenciador de Arquivos)
- Domínio apontando para a hospedagem
- **SSL ativo** (Let's Encrypt grátis no cPanel → SSL/TLS)

---

## Passo 1 — Configurar o caminho público (se não for a raiz do domínio)

Se a bio ficar em uma **subpasta** (ex.: `https://dmta.dev.br/insta-bio/`), defina o `basePath` **antes** do build:

```bash
cp deploy.config.example.json deploy.config.json
```

Edite `deploy.config.json`:

```json
{
  "basePath": "/insta-bio/"
}
```

Ou passe na hora do build:

```bash
make package BASE_PATH=/insta-bio
```

Para a **raiz do domínio** (`https://cliente.com.br/`), use `"/"` ou omita o arquivo.

---

## Passo 2 — Gerar o pacote de deploy (recomendado)

Na raiz do projeto:

```bash
make package
# ou: npm run build:package
```

Isso cria a pasta **`release/`** com **tudo junto**:

```
release/
├── index.html          ← bio pública
├── bio.json
├── assets/
└── editor/             ← painel + PHP
    ├── index.html
    ├── login.php
    └── ...
```

Suba **todo o conteúdo** de `release/` para a pasta correspondente no servidor.

**Exemplo:** para `https://dmta.dev.br/insta-bio/` → envie para `public_html/insta-bio/` no FTP.

---

## Passo 2 (alternativo) — Builds separados

```bash
npm run build                  # → dist/
npm run admin:hostgator        # → admin/dist/
```

Use `make package-split` se preferir subir `dist/` e `admin/dist/` separadamente (modo legado).

---

## Passo 3 — Gerar só o site (alternativo antigo)

Na raiz do projeto:

```bash
npm run build
```

Isso cria a pasta **`dist/`** com:

```
dist/
├── index.html
├── bio.json          ← copiado de public/bio.json
├── assets/           ← imagens
└── assets/*.js, *.css
```

> Antes do build, confira se `public/bio.json` e `public/assets/` já estão com o conteúdo do cliente.

---

## Passo 2 — Configurar login do editor

### 2.1 Gerar hash da senha

```bash
npm run hash-password --prefix admin -- "SenhaForteDoCliente123"
```

O terminal imprime uma linha como:

```php
define('AUTH_PASSWORD_HASH', '$2a$10$...');
```

Copie essa linha.

### 2.2 Criar `auth.config.php`

```bash
cp admin/php/auth.config.example.php admin/php/auth.config.php
```

Edite `admin/php/auth.config.php`:

```php
define('AUTH_USERNAME', 'admin');           // ou o usuário que preferir
define('AUTH_PASSWORD_HASH', '$2a$10$...'); // cole o hash gerado
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');
```

> **Nunca** commite `auth.config.php` no Git. Ele fica só no servidor.

Os caminhos `BIO_JSON_PATH` e `ASSETS_DIR` assumem que o editor fica em `public_html/editor/` e o site na raiz. Só altere se usar outra estrutura.

---

## Passo 3 — Gerar o pacote do editor

```bash
npm run admin:hostgator
```

Isso compila o editor React e copia os arquivos PHP para **`admin/dist/`**:

```
admin/dist/
├── index.html
├── preview.html
├── assets/
├── login.php
├── logout.php
├── session.php
├── save.php
├── upload.php
├── auth.config.php      ← se você criou no passo 2
├── auth.config.example.php
└── .htaccess
```

Se aparecer aviso de que falta `auth.config.php`, volte ao passo 2 e rode o comando de novo.

---

## Passo 4 — Enviar para a HostGator

### Via Gerenciador de Arquivos (cPanel)

1. Acesse **cPanel → Gerenciador de Arquivos**
2. Abra a pasta **`public_html`** (ou a pasta do domínio/addon)
3. **Site da bio (raiz):**
   - Envie **todo o conteúdo** de `dist/` (não a pasta `dist` em si)
   - Deve ficar: `public_html/index.html`, `public_html/bio.json`, `public_html/assets/...`
4. **Editor:**
   - Crie a pasta `public_html/editor/`
   - Envie **todo o conteúdo** de `admin/dist/` para dentro de `editor/`

### Via FTP (FileZilla, etc.)

| Local no PC | Remoto na HostGator |
|-------------|---------------------|
| `dist/*` | `/public_html/` |
| `admin/dist/*` | `/public_html/editor/` |

---

## Estrutura final no servidor

```
public_html/
├── index.html              ← site da bio
├── bio.json
├── assets/
│   ├── logo-expressar.jpeg
│   └── ...
├── favicon.svg             (se houver no build)
└── editor/
    ├── index.html
    ├── assets/
    ├── login.php
    ├── save.php
    ├── upload.php
    ├── session.php
    ├── logout.php
    ├── auth.config.php
    └── .htaccess
```

---

## Passo 5 — Testar

| Teste | URL | Resultado esperado |
|-------|-----|-------------------|
| Site público | `https://seudominio.com/` | Página da bio carrega |
| Editor | `https://seudominio.com/editor/` | Tela de login |
| Login | usuário + senha do `auth.config.php` | Abre o editor |
| Salvar | Editar texto → **Salvar** | `bio.json` atualiza no servidor |
| Upload | Enviar imagem no editor | Arquivo em `/assets/` |
| Site após salvar | Recarregar a raiz | Mudança visível (pode precisar Ctrl+F5) |

---

## Fluxo do dia a dia (cliente editando)

1. Acessar `https://seudominio.com/editor/`
2. Fazer login
3. Editar Marca, Seções, cards
4. Clicar em **Salvar**
5. Abrir `https://seudominio.com/` e conferir

Não é necessário rebuild nem FTP para mudanças de texto, links ou imagens enviadas pelo editor.

---

## Atualizar o código (nova versão do template)

Quando você melhorar o template no repositório:

```bash
npm run build
npm run admin:hostgator
```

Depois, por FTP:

1. Substitua os arquivos do site em `public_html/` (**exceto** `bio.json` e `assets/` do cliente, se quiser preservar)
2. Substitua os arquivos em `public_html/editor/` (**preserve** `auth.config.php` do cliente)

---

## Problemas comuns

### Página em branco no site

- Confira se `index.html` está na raiz de `public_html`, não dentro de uma subpasta extra
- Abra o Console do navegador (F12) e veja erros de caminho de JS/CSS

### Editor: erro 500 ao salvar ou fazer login

- PHP ativo? (HostGator compartilhada: sim)
- `auth.config.php` existe em `editor/`?
- Permissões: pastas `755`, arquivos `644`; `bio.json` e pasta `assets/` precisam ser **graváveis** pelo PHP (geralmente `644` no json e `755` em assets)

Para permissões no cPanel: clique com botão direito no arquivo → **Alterar permissões**.

### Salvar não reflete no site

- O `BIO_JSON_PATH` em `auth.config.php` deve apontar para o `bio.json` da raiz (`../bio.json` se editor está em `/editor/`)
- Limpe cache do navegador (Ctrl+F5)

### Upload de imagem falha

- Pasta `public_html/assets/` existe e tem permissão de escrita
- Tamanho do arquivo dentro do limite do PHP (HostGator costuma aceitar até alguns MB)

### Cookie de sessão não segura

- Ative **SSL/HTTPS** no cPanel para o domínio

---

## Subdomínio para o editor (opcional)

Em vez de `seudominio.com/editor/`, você pode usar `editor.seudominio.com`:

1. cPanel → **Subdomínios** → criar `editor`
2. A pasta será algo como `public_html/editor` ou `public_html/editor.seudominio.com`
3. Ajuste `BIO_JSON_PATH` e `ASSETS_DIR` no `auth.config.php` conforme a estrutura real

---

## Documentos relacionados

- [ADMIN.md](./ADMIN.md) — funcionalidades do editor
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) — instalar para novos clientes e vender o serviço
- [BIO-JSON.md](./BIO-JSON.md) — referência do conteúdo
