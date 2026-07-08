.PHONY: help install setup dev dev-all admin site site-build build admin-build hostgator package preview \
	hash-password auth-init lint clean platform-core

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

install: ## Instala dependências do site, admin, panel e landing
	npm install
	npm install --prefix admin
	npm install --prefix panel
	npm install --prefix site

setup: install ## Alias para install

## — Desenvolvimento local ----------------------------------------------------

dev: ## Site local → http://localhost:5173
	npm run dev

dev-all: ## Sobe bio, editor, painel e landing (Ctrl+C para parar)
	bash scripts/dev-all.sh

admin: ## Editor local (Node) → http://localhost:5180
	npm run admin

site: ## Landing comercial → http://localhost:5190
	npm run site

site-build: ## Build da landing → site/dist/
	npm run site:build

preview: ## Testa o build do site (dist/) localmente
	npm run preview

## — Build --------------------------------------------------------------------

build: ## Gera o site em dist/
	npm run build

admin-build: ## Gera só o editor em admin/dist/ (sem PHP)
	npm run admin:build

hostgator: ## Gera editor + PHP para HostGator em admin/dist/
	npm run admin:hostgator

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

package-split: build hostgator ## Build em dist/ + admin/dist/ (sem pasta única)
	@echo ""
	@echo "Pronto para FTP:"
	@echo "  dist/*        → public_html/"
	@echo "  admin/dist/*  → public_html/editor/"
	@echo ""
	@echo "Guia: docs/HOSTGATOR.md"

## — Autenticação (HostGator) -------------------------------------------------

hash-password: ## Gera hash bcrypt (use PASSWORD=\"...\")
ifndef PASSWORD
	$(error Defina a senha: make hash-password PASSWORD="sua-senha")
endif
	npm run hash-password --prefix admin -- "$(PASSWORD)"

auth-init: ## Cria admin/php/auth.config.php a partir do exemplo
	@test -f admin/php/auth.config.php || cp admin/php/auth.config.example.php admin/php/auth.config.php
	@echo "auth.config.php criado (ou já existia)."
	@echo "Gere o hash: make hash-password PASSWORD=\"sua-senha\""
	@echo "Cole o hash em admin/php/auth.config.php e rode: make hostgator"

## — Qualidade ----------------------------------------------------------------

lint: ## Roda o linter no site e no admin
	npm run lint
	npm run lint --prefix admin

## — Limpeza ------------------------------------------------------------------

clean: ## Remove pastas de build
	rm -rf dist admin/dist site/dist
