.PHONY: help install setup dev dev-all editor site site-build build editor-build hostgator package preview \
	hash-password auth-init lint clean platform-core admin admin-build

.DEFAULT_GOAL := help

## — Ajuda --------------------------------------------------------------------

help: ## Lista os comandos disponíveis
	@echo "insta-bio — atalhos make"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Exemplos:"
	@echo "  make install"
	@echo "  make dev-all"
	@echo "  make package"
	@echo "  make platform-core"
	@echo "  make hash-password PASSWORD=\"SenhaForteDoCliente\""

## — Dependências -------------------------------------------------------------

install: ## Instala dependências do site, bio, editor, panel e landing
	npm install
	npm install --prefix bio
	npm install --prefix editor
	npm install --prefix panel
	npm install --prefix site

setup: install ## Alias para install

## — Desenvolvimento local ----------------------------------------------------

dev: ## Site local → http://localhost:5173
	npm run dev

dev-all: ## Sobe bio, editor, painel e landing (rebuilda template se fontes mudaram)
	bash scripts/dev-all.sh

editor: ## Editor local (Node) → http://localhost:5180
	npm run editor

admin: editor ## Alias legado

site: ## Landing comercial → http://localhost:5190
	npm run site

site-build: ## Build da landing → site/dist/
	npm run site:build

preview: ## Testa o build do site (dist/) localmente
	npm run preview

## — Build --------------------------------------------------------------------

build: ## Gera o site em dist/
	npm run build

editor-build: ## Gera só o editor em editor/dist/ (sem PHP)
	npm run editor:build

admin-build: editor-build ## Alias legado

hostgator: ## Gera editor + PHP para HostGator em editor/dist/
	npm run editor:hostgator

panel: ## Painel da plataforma (dev) → http://localhost:5175/panel/
	npm run panel

package-platform: ## Build completo: landing + panel + template → platform-release/
	npm run build:platform

platform-core: ## Platform sem landing → platform-release/
	npm run build:core

package-template: ## Gera só o template de cliente → platform-template/_template/
	npm run build:template

sync-clients: ## Atualiza bio+editor de todos os clientes locais (preserva bio.json e imagens)
	npm run sync:clients

package: ## Build unificado em release/ (BASE_PATH=/insta-bio ou deploy.config.json)
	npm run build:package

## Build separado (legado) ----------------------------------------------------

package-split: build hostgator ## Build em dist/ + editor/dist/ (sem pasta única)
	@echo ""
	@echo "Pronto para FTP:"
	@echo "  dist/*          → public_html/"
	@echo "  editor/dist/*   → public_html/editor/"
	@echo ""
	@echo "Guia: docs/HOSTGATOR.md"

## — Autenticação (HostGator) -------------------------------------------------

hash-password: ## Gera hash bcrypt (use PASSWORD=\"...\")
ifndef PASSWORD
	$(error Defina a senha: make hash-password PASSWORD="sua-senha")
endif
	npm run hash-password --prefix editor -- "$(PASSWORD)"

auth-init: ## Cria editor/php/auth.config.php a partir do exemplo
	@test -f editor/php/auth.config.php || cp editor/php/auth.config.example.php editor/php/auth.config.php
	@echo "auth.config.php criado (ou já existia)."
	@echo "Gere o hash: make hash-password PASSWORD=\"sua-senha\""
	@echo "Cole o hash em editor/php/auth.config.php e rode: make hostgator"

## — Qualidade ----------------------------------------------------------------

lint: ## Roda o linter no bio e no editor
	npm run lint --prefix bio
	npm run lint --prefix editor

## — Limpeza ------------------------------------------------------------------

clean: ## Remove pastas de build
	rm -rf dist bio/dist editor/dist site/dist
