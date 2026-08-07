# Diagnóstico e Plano de Redesign — Links na Bio vs. Seleto.bio

## 1. Resumo executivo

Comparando os prints do seu site (linksnabio.app.br) com o Seleto.bio, a diferença não é de funcionalidade — é de **narrativa e produção visual**. O Seleto vende a *transformação* ("sua marca pessoal merece uma presença à altura"); o seu vende a *ferramenta* ("nós criamos sua página pra você"). Isso muda tudo: tipografia, hierarquia, o que aparece no hero, e até a paleta.

Achado mais importante: **o hero do seu site mostra o painel administrativo (dashboard de métricas)**. O visitante que chega no site não é o dono do painel — é alguém decidindo se quer ou não ter uma bio bonita. Mostrar o dashboard é vender o motor, não o carro. O Seleto acerta isso mostrando um "leque" de bios reais, lindas, de diferentes profissionais, logo no topo.

## 2. Análise comparativa

### 2.1 Site institucional (marketing)

| Aspecto | Seleto.bio | Links na Bio (atual) |
|---|---|---|
| Tema | Dark, premium, cyan/azul consistente | Light, mistura roxo + laranja |
| Hero visual | Leque de telas de bios reais (produto final) | Screenshot do dashboard admin |
| Headline | Aspiracional: "sua marca pessoal e reputação merecem..." | Funcional: "transforme seu link em uma página profissional" |
| Posicionamento | Nicho definido (profissionais liberais: advogado, médico, dentista, consultor) + "grupo seleto" (exclusividade) + IA | Genérico ("qualquer perfil do Instagram") |
| Prova social | Grid de "Profissionais" na home (diretório navegável, cada um com nome/cargo/local) | Não aparece nos prints (ou está mais abaixo, sem grid de clientes) |
| Copy de venda | "Crie seu site... com IA e para IA" — moderno, diferenciado | "Nós criamos tudo pra você" + "Atendimento humano" — soa como serviço manual, não produto escalável |
| Nav | Produto / Como funciona / FAQ / Profissionais | Demonstração / Como funciona / Investimento / FAQ |

O item "Investimento" no menu, em vez de "Planos" ou "Preços", é um detalhe pequeno mas que soa mais burocrático que comercial.

### 2.2 Página de bio (produto final entregue ao cliente)

| Aspecto | Seleto.bio (exemplo: corretora de imóveis) | Links na Bio (exemplo: Igreja Expressar) |
|---|---|---|
| Estilo dos cards | Quase todos com foto de fundo + gradiente + texto sobreposto — visual editorial, tipo "press kit" | Mistura: alguns cards com foto (evento, WhatsApp), mas a maioria é lista simples (ícone + título + descrição + seta) |
| Consistência | Alta — todo card parece parte do mesmo sistema visual | Baixa — cards de fundo de tela cheia convivem com linhas de lista finas, quebrando o ritmo |
| Imagens quebradas | Nenhuma visível | Pelo menos 2 cards aparecem com imagem não carregada (seção "Eventos" e card "Seja um voluntário") — isso pesa muito contra "profissional" |
| Diferenciação por contexto | Cores dos CTAs seguem a identidade de cada rede (WhatsApp verde, TikTok gradiente, YouTube vermelho) — igual ao que vocês já têm no AppHeroCard | Mesmo padrão de cores por app, mas menos presente porque a maioria dos itens não usa esse componente |
| Seção de autoridade | "Conteúdos na Imprensa" — mostra matérias publicadas sobre a pessoa, cada uma com cor própria de botão. Reforça status e credibilidade | Não existe equivalente — nada que traga prova de autoridade/imprensa/reconhecimento |
| Hierarquia de seções | Sem rótulos de seção visíveis (fluxo contínuo, cada bloco já se explica pela imagem) | Usa rótulos em caixa alta cinza ("CONECTE-SE", "FIQUE POR DENTRO", "EVENTOS") — funcional, mas burocrático/genérico perto do visual editorial do Seleto |
| Vídeo embutido | Sim, com legenda estilo "reels" sobre o vídeo — muito nativo do Instagram | Não aparece nos exemplos capturados |

## 3. O que dá pra copiar/adaptar sem perder a identidade de vocês

Vocês já têm boa parte da base técnica para isso — o `AppHeroCard` com preset por app (cor de marca preservada) é exatamente o tipo de componente que sustenta o visual do Seleto. O gap não é reconstruir do zero, é:

1. Tornar o card "com foto de fundo" o **padrão** dos links importantes, não a exceção — hoje a maioria vira lista simples.
2. Eliminar cards com imagem quebrada — ter um fallback visual decente (gradiente + ícone) quando não há imagem, em vez de caixa preta vazia.
3. Trocar a home institucional (marketing) para liderar com **bios reais renderizadas**, não com o dashboard.
4. Criar um bloco de **prova social / autoridade** (imprensa, depoimentos, ou grid de clientes por segmento) — tanto na home institucional quanto como um tipo de card disponível na bio do cliente final.
5. Revisar copy: de "nós fazemos pra você" (agência) para "sua marca merece uma presença à altura" (produto premium, aspiracional) — sem precisar mentir sobre o processo, só mudar o enquadramento.

## 4. Plano de mudanças priorizado

### Prioridade Alta (maior impacto em conversão, menor esforço relativo)
- [ ] Trocar hero da home institucional: sair do screenshot de dashboard, entrar um carrossel/leque de bios reais e bonitas (usar clientes atuais como exemplo, com autorização)
- [ ] Corrigir/blindar contra imagens quebradas nos cards da bio (fallback visual)
- [ ] Padronizar cards da bio: priorizar o modelo "foto de fundo + gradiente + CTA" (AppHeroCard) para a maioria dos links, reservar a lista simples só para itens secundários/utilitários
- [ ] Reescrever headline e subheadline da home: de descrição funcional para promessa aspiracional, mantendo clareza
- [ ] Trocar "Investimento" por "Planos" no menu

### Prioridade Média
- [ ] Criar seção de prova social na home institucional (grid de clientes/segmentos, como o "Profissionais" do Seleto) — vitrine + reforço de confiança
- [ ] Criar um tipo de card "Imprensa/Reconhecimento" reutilizável na bio (título + fonte + link, com cor customizável) para clientes que têm matérias, prêmios, certificações
- [ ] Unificar paleta da home institucional (hoje mistura roxo e laranja) — escolher uma cor de marca dominante e usar o resto como acento
- [ ] Revisar rótulos de seção da bio ("CONECTE-SE", "FIQUE POR DENTRO") para algo menos burocrático ou dar a opção de ocultá-los quando o cliente preferir um fluxo contínuo tipo Seleto

### Prioridade Baixa (polimento)
- [ ] Avaliar suporte a vídeo com legenda estilo "reels" sobre o player, como no exemplo do Seleto
- [ ] Dark mode consistente entre home institucional e produto (hoje a home é clara, o produto é escuro — pode ser proposital, mas vale revisar se ajuda ou atrapalha a percepção de "premium")
- [ ] Badge/selo de destaque no header da home ("presença digital premium", no caso do Seleto) para reforçar posicionamento logo no topo

## 5. Fases de implementação sugeridas

1. **Fase 1 — Confiabilidade visual**: corrigir imagens quebradas e fallback de cards (base para tudo que vem depois; sem isso, qualquer redesign de cima ainda vai parecer "quebrado")
2. **Fase 2 — Hero + copy da home institucional**: novo hero com bios reais, nova headline, ajuste de menu e paleta
3. **Fase 3 — Padronização dos cards da bio**: priorizar cards com foto/gradiente, criar variante "Imprensa"
4. **Fase 4 — Prova social**: grid de clientes/segmentos na home institucional
5. **Fase 5 — Polimento**: vídeo com legenda, badges, revisão de rótulos de seção

## 6. Prompt para o Cursor

Ver arquivo separado `prompt-cursor-redesign.md` — feito para colar diretamente no Cursor, com escopo de uma fase por vez.
