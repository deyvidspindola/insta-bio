.PHONY: help install setup dev admin build admin-build hostgator package preview \
	hash-password auth-init lint clean

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
	@echo "  make package"
	@echo "  make hash-password PASSWORD=\"SenhaForteDoCliente\""

## — Dependências -------------------------------------------------------------

install: ## Instala dependências do site e do admin
	npm install
	npm install --prefix admin

setup: install ## Alias para install

## — Desenvolvimento local ----------------------------------------------------

dev: ## Site local → http://localhost:5173
	npm run dev

admin: ## Editor local (Node) → http://localhost:5180
	npm run admin

preview: ## Testa o build do site (dist/) localmente
	npm run preview

## — Build --------------------------------------------------------------------

build: ## Gera o site em dist/
	npm run build

admin-build: ## Gera só o editor em admin/dist/ (sem PHP)
	npm run admin:build

hostgator: ## Gera editor + PHP para HostGator em admin/dist/
	npm run admin:hostgator

package: build hostgator ## Build completo para deploy (dist/ + admin/dist/)
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
	rm -rf dist admin/dist
