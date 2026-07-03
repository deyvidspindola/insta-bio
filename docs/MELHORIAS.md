# Melhorias e roadmap — insta-bio

Documento de oportunidades para evoluir o produto **sem perder o que já funciona bem**: simplicidade, editor visual, deploy na HostGator e edição sem programar.

Última revisão: julho/2026.

---

## Estado atual — o que já está sólido

Antes de listar o que falta, vale registrar o que **não precisa ser refeito**:

| Área | O que já entrega valor |
|------|------------------------|
| **Bio pública** | Layout mobile-first, animações, 5 variantes de card, WhatsApp hero, links, localização, tema por cor |
| **Editor** | Preview ao vivo, undo/redo, drag-and-drop, upload de imagens, salvar no servidor, importar/exportar JSON |
| **Deploy** | Build + PHP na HostGator, sem banco, documentação de comercialização e FTP |
| **Landing** | Página comercial completa (hero, FAQ, pacote, CTAs) |
| **Conteúdo** | `bio.json` editável sem rebuild, modelo padrão, docs de campos e ícones |

O produto **já é vendável** no modelo atual: 1 cliente = 1 deploy. As melhorias abaixo acrescentam valor, reduzem suporte ou abrem novos pacotes — não são pré-requisitos para vender.

---

## Princípio guia

> Cada melhoria deve responder: *isso ajuda o cliente final, reduz meu trabalho de suporte, ou me permite cobrar mais?*

Se a resposta for “só deixa o código mais bonito”, pode esperar. A simplicidade é um diferencial — não transformar o insta-bio em um CMS genérico.

---

## 1. Produto (página da bio)

### Alta prioridade — valor comercial direto

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **Meta tags Open Graph** (`og:title`, `og:description`, `og:image`) | Quando alguém compartilha o link no WhatsApp/Instagram, aparece preview bonito com logo do cliente | Baixo |
| **Card Instagram (ministérios)** | Tipo já existe em `bio.ts` e na documentação, mas **não renderiza** hoje. É o maior gap visual vs referência Voe Connect — muito pedido por igrejas | Médio |
| **Layout `instagram-grid`** | Grid de perfis/cards no estilo Voe; também documentado mas não implementado | Médio |
| **Analytics de cliques** | Cliente pergunta “quantas pessoas clicaram no WhatsApp?”. Um contador simples (PHP + JSON ou Plausible/Umami) justifica plano de manutenção | Médio |
| **Gerador de QR Code** | PNG para stories, cartazes e impressos — entrega rápida no pacote inicial | Baixo |

### Média prioridade — polish

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **Mais ícones/redes** | TikTok, Spotify, PIX, Threads — conjunto atual é pequeno (`IconName` em `bio.ts`) | Baixo |
| **SEO estático** | Hoje title/description mudam via JS; crawlers veem placeholder. Meta tags no `index.html` ou snippet PHP melhoram indexação | Baixo |
| **Indicador visual em links externos** | Ícone ou texto “abre em nova aba” — confiança para visitante | Baixo |
| **PWA / “Adicionar à tela inicial”** | Experiência app-like no celular, especialmente para igrejas | Médio |

### Baixa prioridade — só se cliente pedir

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| Tema claro na bio pública | Admin já tem; visitante sempre vê escuro | Médio |
| Embeds (YouTube, Spotify, formulário) | Aumenta complexidade; links externos resolvem 90% dos casos | Alto |
| Múltiplas páginas / senha / agendamento | Muda o modelo de produto; foge da simplicidade atual | Alto |

---

## 2. Editor (admin)

### Alta prioridade — menos suporte, mais confiança

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **Confirmação antes de “Restaurar modelo padrão”** | Hoje apaga o trabalho sem aviso — risco real para usuário final | Baixo |
| **Aviso de alterações não salvas** | `beforeunload` ao sair da aba com mudanças pendentes | Baixo |
| **Link “Ver site publicado”** no header | Cliente edita e quer abrir a bio real em 1 clique | Baixo |
| **Validação ao salvar** | Garantir `brand.name`, `sections[]`, URLs mínimas — evita JSON que quebra a página pública | Médio |
| **Backup automático** (`bio.json.bak` ou timestamp) no `save.php` | Cliente desfaz erro grave sem você no FTP | Baixo |
| **Mensagem de erro do upload** | Hoje qualquer falha sugere “só funciona local” — confunde em produção | Baixo |

### Média prioridade — power users e escala

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **JSON editável na aba JSON** | Hoje é só leitura; quem mexe em JSON precisa copiar para editor externo | Médio |
| **Validação com schema (Zod)** compartilhado entre admin e save | Um único lugar define o que é JSON válido | Médio |
| **Templates por nicho** | `bio.igreja.json`, `bio.empresa.json`, `bio.criador.json` — acelera onboarding de novo cliente | Baixo |
| **Tour guiado (3 passos)** | “Edite a marca → Adicione seção → Salve” — reduz curva para cliente não técnico | Médio |
| **Seletor visual de ícones** | Mostrar o desenho do ícone, não só o nome (`zap`, `form`) | Baixo |

### Baixa prioridade

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| Múltiplos usuários no editor | Modelo atual é 1 login por cliente — suficiente para maioria | Alto |
| Rate limiting / CSRF no PHP | Relevante se editor ficar muito exposto publicamente | Médio |
| Recuperação de erro fatal | Hoje um erro bloqueia tela inteira; raro, mas melhorável | Baixo |

---

## 3. Comercialização e landing (`site/`)

### Alta prioridade — vender de verdade

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **WhatsApp real** | Número placeholder (`5519999999999`) ainda no HTML; `site/src/config.ts` existe mas **não está ligado** ao template | Baixo |
| **Link para demo ao vivo** | Apontar da landing para a bio demo (`/bio` ou URL fixa) — prova o produto | Baixo |
| **Depoimentos / casos reais** | Template ainda usa placeholders genéricos; trocar quando tiver clientes | Baixo |
| **Preço ou faixa de investimento** | FAQ fala “sob consulta”; mesmo uma faixa (“a partir de R$ X”) filtra lead | Baixo |

### Média prioridade

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **Formulário de lead** (nome + e-mail) além de WhatsApp | Quem não quer falar agora deixa contato | Médio |
| **Vídeo ou GIF do editor** na landing | Mostra o fluxo em 30s — menos explicação no WhatsApp | Baixo |
| **Otimizar peso da landing** | GSAP, Swiper, Leaflet carregam mesmo sem uso — LCP e mobile | Médio |
| **Checklist PDF para o cliente** | “O que enviar antes do setup” (logo, textos, links) | Baixo |

---

## 4. Qualidade técnica e manutenção

### Recomendado para tranquilidade

| Melhoria | Por quê | Esforço |
|----------|---------|---------|
| **CI básico** (`make lint` + `make build` no GitHub Actions) | Evita quebrar build ao evoluir | Baixo |
| **Testes unitários** em funções críticas | `createItem`, `loadBioConfig`, render de cards — regressão segura | Médio |
| **Remover legado `grid`** | Admin não cria mais; docs já recomendam `feature/square` | Baixo |
| **Monorepo com workspaces** | Três `package.json` independentes; `make install` manual funciona, mas workspaces simplificam | Baixo |
| **`admin/README.md`** alinhado ao `docs/ADMIN.md` | Hoje é boilerplate do Vite | Baixo |
| **Versão semântica** | Três `package.json` em `0.0.0` — útil ao entregar changelog para clientes | Baixo |

### Dívida técnica conhecida (não urgente)

- Schema à frente da implementação (`instagram`, `instagram-grid`)
- Duplicação de assets (`logo-instabio.svg` em várias pastas)
- Keys React em listas usam `item.title` — títulos duplicados geram warning
- Preview postMessage com `targetOrigin: '*'` — aceitável em dev

---

## 5. Negócio e escala (futuro)

Só faz sentido **depois** de alguns clientes pagantes no modelo atual (1 deploy = 1 cliente):

| Iniciativa | Valor | Complexidade |
|------------|-------|--------------|
| **Painel multi-cliente** | Um servidor, várias bios (`cliente1/`, `cliente2/`) | Alta |
| **SaaS com subdomínios** | `igreja.instabio.cc` — receita recorrente | Muito alta |
| **White-label do editor** | Agências revendem com sua marca | Alta |
| **Relatório mensal de cliques** | PDF automático no plano de manutenção | Média |
| **Domínio + SSL no pacote premium** | Você configura tudo; cliente só paga | Média (operacional) |

**Recomendação:** não antecipar SaaS. O modelo HostGator + editor PHP é o diferencial (custo baixo, sem mensalidade de VPS). Escale operacionalmente antes de escalar arquitetura.

---

## 6. O que evitar (para manter o produto simples)

- Transformar em **page builder genérico** (blocos infinitos, CSS livre)
- **Banco de dados** no produto base — quebra o pitch “sem MySQL”
- **Login do visitante** na bio pública
- **Marketplace de temas** antes de fechar 2–3 templates por nicho
- **Refatorar a landing inteira para React** sem necessidade — o HTML injetado funciona e está idêntico ao template

---

## 7. Roadmap sugerido (fases)

### Fase A — “Pronto para vender” (1–2 semanas)

Foco: landing real + confiança no editor.

1. WhatsApp real na landing (`config.ts` → HTML)
2. Link “Ver site” no editor
3. Confirmação em “Restaurar modelo padrão” + aviso de não salvo
4. Backup `bio.json.bak` no save
5. Open Graph básico na bio
6. QR Code para o cliente

### Fase B — “Diferencial Voe” (2–4 semanas)

Foco: o que igrejas e empresas pedem na referência.

1. Renderizar card `instagram`
2. Layout `instagram-grid`
3. Analytics simples de cliques
4. Templates por nicho no editor
5. Tour guiado (3 passos)

### Fase C — “Escala com qualidade” (contínuo)

1. CI + testes nas funções críticas
2. Validação Zod no save
3. Depoimentos reais na landing
4. Relatório mensal (se oferecer plano de manutenção)

### Fase D — “Novo modelo de negócio” (só com demanda)

Multi-tenant, SaaS, white-label — avaliar após N clientes recorrentes.

---

## 8. Pacotes que você pode vender hoje (ideias)

Com o que **já existe**, dá para empacotar sem código novo:

| Pacote | Inclui | Upsell natural |
|--------|--------|----------------|
| **Essencial** | Setup + domínio + editor + 1 revisão | — |
| **Profissional** | Essencial + QR + treino 30 min no editor | Manutenção mensal |
| **Igreja** | Profissional + seções ministérios (quando card Instagram existir) | Atualização de eventos |
| **Empresa** | Profissional + analytics (quando existir) | Relatório mensal |

---

## 9. Resumo executivo

| Situação | Conclusão |
|----------|-----------|
| **Vender agora?** | Sim. Produto funcional, documentado e com landing. |
| **Maior gap de produto** | Card Instagram + grid de ministérios (já no schema, não no renderer). |
| **Maior gap comercial** | WhatsApp placeholder na landing; falta demo linkada e prova social real. |
| **Maior gap de confiança** | Backup ao salvar, confirmações no editor, validação de JSON. |
| **Maior gap técnico** | Zero testes/CI — risco ao evoluir rápido. |

**Em uma frase:** o insta-bio está pronto para os primeiros clientes; as melhorias de maior retorno são **fechar o visual Voe (Instagram)**, **métricas de clique**, **landing com contato real** e **pequenos cuidados no editor** — tudo sem abandonar a simplicidade que você já construiu.

---

## Referências no repositório

| Tópico | Arquivo |
|--------|---------|
| Comercialização | [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) |
| Deploy HostGator | [HOSTGATOR.md](./HOSTGATOR.md) |
| Editor | [ADMIN.md](./ADMIN.md) |
| Schema e cards | [BIO-JSON.md](./BIO-JSON.md) |
| Arquitetura | [PROJETO.md](./PROJETO.md) |
| Landing | [../site/README.md](../site/README.md) |
