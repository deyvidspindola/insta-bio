COMPOSE := docker compose
APP     := $(COMPOSE) exec app
APP_TTY := $(COMPOSE) exec -T app

.DEFAULT_GOAL := help

.PHONY: help up down restart build logs ps fresh sh artisan migrate seed \
	test pint stan tinker mysql mail

help: ## Lista os atalhos
	@echo ""
	@echo "  Links na Bio — atalhos"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  App:     http://localhost:8000"
	@echo "  Mail:    http://localhost:8025  (Mailpit)"
	@echo "  Admin:   admin@local.dev / admin123"
	@echo "  Artisan: make artisan CMD=\"route:list\""
	@echo ""

up: ## Sobe o projeto em Docker
	$(COMPOSE) up --build -d
	@echo ""
	@echo "Pronto → http://localhost:8000"
	@echo "E-mails → http://localhost:8025"

down: ## Para os containers
	$(COMPOSE) down

restart: ## Reinicia os containers
	$(COMPOSE) restart

build: ## Reconstrói as imagens
	$(COMPOSE) build

logs: ## Acompanha os logs (Ctrl+C para sair)
	$(COMPOSE) logs -f --tail=80

ps: ## Status dos containers
	$(COMPOSE) ps

fresh: ## Zera o MySQL e sobe de novo (apaga dados)
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d
	@echo ""
	@echo "Banco novo → http://localhost:8000"

sh: ## Shell no container PHP
	$(APP) bash

artisan: ## Roda artisan. Ex.: make artisan CMD="route:list"
	$(APP_TTY) php artisan $(CMD)

migrate: ## Roda as migrations
	$(APP_TTY) php artisan migrate --force

seed: ## Popula o banco (admin local)
	$(APP_TTY) php artisan db:seed --force

test: ## Roda os testes
	$(APP_TTY) php artisan test

pint: ## Formata o PHP (PSR-12)
	$(APP_TTY) vendor/bin/pint

stan: ## Análise estática (PHPStan)
	$(APP_TTY) vendor/bin/phpstan analyse --memory-limit=512M

tinker: ## Console interativo do Laravel
	$(APP) php artisan tinker

mysql: ## Cliente MySQL do projeto
	$(COMPOSE) exec mysql mysql -ulinksnabio -psecret linksnabio

mail: ## Abre a caixa de e-mails locais (Mailpit)
	@echo "http://localhost:8025"
	@$(COMPOSE) ps mailpit
