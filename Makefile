.PHONY: help install dev-all site site-build platform-core update-package clean lint hash-password

.DEFAULT_GOAL := help

## — Ajuda --------------------------------------------------------------------

help: ## Lista os comandos disponíveis
	@echo "insta-bio — atalhos make"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Fluxo típico:"
	@echo "  make install"
	@echo "  make dev-all"
	@echo "  make platform-core     # sobe no servidor da plataforma"
	@echo "  make update-package    # ZIP para clientes atualizarem pelo editor"
	@echo ""
	@echo "Guia: docs/DEPLOY-ATUALIZACAO.md"

## — Dia a dia ----------------------------------------------------------------

install: ## Instala dependências (raiz, bio, editor, panel, site)
	npm install
	npm install --prefix bio
	npm install --prefix editor
	npm install --prefix panel
	npm install --prefix site

dev-all: ## Sobe bio, editor, painel e landing localmente
	bash scripts/dev-all.sh

site: ## Sobe a landing em modo dev (http://localhost:5190)
	npm run site

site-build: ## Build da landing → site/dist/
	npm run site:build

## — Produção -----------------------------------------------------------------

platform-core: ## Build da plataforma → platform-release/ (panel + template + ZIP)
	npm run build:core

update-package: ## Gera ZIP de update remoto (bump VERSION + changelog)
	npm run build:update-package

## — Utilitários --------------------------------------------------------------

hash-password: ## Gera hash bcrypt (use PASSWORD=\"...\")
ifndef PASSWORD
	$(error Defina a senha: make hash-password PASSWORD="sua-senha")
endif
	npm run hash-password --prefix editor -- "$(PASSWORD)"

lint: ## Linter no bio e no editor
	npm run lint --prefix bio
	npm run lint --prefix editor

clean: ## Remove pastas de build
	rm -rf dist bio/dist editor/dist site/dist platform-release platform-release.zip
