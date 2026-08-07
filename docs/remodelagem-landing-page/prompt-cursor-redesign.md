# Prompt para o Cursor — Redesign Links na Bio

> Como usar: cole isso no chat do Cursor com o repositório do projeto aberto. Ele foi escrito para
> trabalhar em uma fase por vez — recomendo colar só a "Fase 1" primeiro, revisar, e só então
> avançar para as próximas, em conversas separadas. Ajuste os caminhos de arquivo depois que o
> Cursor mapear a estrutura real do projeto.

---

## Prompt base (contexto — cole sempre no início de cada fase)

```
Este é o monorepo do produto "insta-bio" (marca comercial: linksnabio.app.br), uma
plataforma que cria páginas profissionais de "link na bio" para Instagram. O projeto tem
duas frentes de código:

1. Um site institucional/marketing (a landing page que vende o produto)
2. O produto em si: o editor e o componente que renderiza a bio publicada do cliente
   (BioPage, com cards de destaque via AppHeroCard e presets de cor por app em
   appHeroPresets.ts, contraste adaptativo em contrastColor.ts)

Antes de editar qualquer coisa, explore a estrutura do repo e me diga:
- onde fica o código do site institucional/marketing (a landing page pública)
- onde fica o BioPage e o AppHeroCard usados na renderização da bio do cliente
- se já existe algum sistema de fallback de imagem quebrada, ou se card sem imagem
  simplesmente quebra hoje

Não faça nenhuma alteração ainda nesta etapa — só mapeie e reporte.
```

---

## Fase 1 — Confiabilidade visual (prioridade máxima)

```
Objetivo: eliminar cards com imagem quebrada na bio renderizada (BioPage/AppHeroCard) e
garantir que todo card sem imagem de fundo tenha um estado visual decente.

Requisitos:
- Quando a URL de imagem de um card falhar ao carregar (onError) ou estiver ausente,
  renderizar um fallback: gradiente baseado na cor/preset do app (reaproveitar
  appHeroPresets.ts / contrastColor.ts, sem hardcode de cor nova) + ícone do app centralizado,
  em vez de deixar a área vazia/preta.
- Não alterar o schema do bio.json nem quebrar nenhum preset/layout existente
  (default/compact/condensed, align side/center, showIcon) — só adicionar o fallback.
- Cobrir tanto o caso de imagem que não existe no JSON quanto o caso de URL que retorna erro
  de carregamento.
- Depois de implementar, liste os arquivos alterados e um resumo do que mudou, sem aplicar
  nada além do escopo acima.
```

## Fase 2 — Hero e copy da home institucional

```
Objetivo: reformular o hero da landing page institucional (a página que vende o produto,
não a bio do cliente) para vender o resultado, não a ferramenta.

Mudanças:
1. Remover/substituir o screenshot do dashboard administrativo do hero por um showcase de
   bios reais publicadas (se já existirem componentes de preview/mockup de telefone
   reaproveitáveis no design system, usar; senão, criar um carrossel simples de imagens
   estáticas que eu vou fornecer depois).
2. Trocar a headline atual (~"Transforme o único link do seu Instagram em uma página
   profissional") por algo mais aspiracional, mantendo clareza sobre o que é o produto.
   Sugestão de direção (ajustar tom): "Sua marca no Instagram merece uma página à altura."
   Manter o CTA duplo já existente (ação principal + "agendar demonstração").
3. No menu de navegação, trocar o item "Investimento" por "Planos".
4. Unificar a paleta da home institucional: escolher UMA cor de marca dominante (ver
   design tokens/tailwind config do projeto) e usar a segunda cor (hoje aparentam ser
   roxo + laranja) só como acento pontual, não em pé de igualdade.

Não mexer no produto/editor nem no BioPage nesta fase — só na landing institucional.
Antes de aplicar, me mostre onde estão os arquivos da home institucional para eu confirmar.
```

## Fase 3 — Padronização dos cards da bio

```
Objetivo: fazer o card "com foto de fundo + gradiente + CTA" (AppHeroCard) ser o padrão
visual dominante na bio publicada, reduzindo o uso da lista simples (ícone + título +
descrição + seta) para itens realmente secundários/utilitários.

Também: criar uma nova variante de card "Imprensa/Reconhecimento" reutilizando a estrutura
do AppHeroCard — título da matéria/prêmio, nome da fonte, link, cor de destaque
customizável por item (sem depender de um preset de app fixo, já que aqui a "marca" é uma
publicação externa, não uma rede social).

Restrições: mesmas de sempre — zero breaking change no schema bio.json, sem lib nova de
UI, reaproveitar contrastColor.ts para legibilidade do texto sobre a imagem.

Me pergunte antes de decidir qual mecanismo usar para marcar um item como "secundário"
(novo campo no schema vs. heurística por tipo de link) — não decida isso sozinho.
```

## Fase 4 — Prova social na home institucional

```
Objetivo: adicionar uma seção de prova social na landing institucional, no estilo de um
grid/diretório de clientes reais (nome, segmento/categoria, foto pequena), similar a uma
vitrine de casos de uso.

Isso deve ser dado estático (array de objetos) por enquanto, editável facilmente no código
— não precisa vir de banco de dados nesta fase. Me pergunte que dados de clientes reais
(nome, segmento, foto) devo usar antes de inventar exemplos fictícios.
```

## Fase 5 — Polimento

```
Objetivo: melhorias de acabamento, uma de cada vez, com confirmação antes de cada uma:
1. Suporte a legenda sobreposta em cards de vídeo embutido na bio (estilo legenda de reels).
2. Badge/selo curto acima da headline da home institucional (ex.: "página profissional
   para Instagram"), reforçando posicionamento antes mesmo do título.
3. Revisar os rótulos de seção em caixa alta da bio (hoje tipo "CONECTE-SE", "FIQUE POR
   DENTRO") — avaliar dar ao cliente a opção de ocultar esses rótulos para um layout mais
   contínuo, sem remover a opção atual para quem já usa.

Aplique só o item que eu confirmar primeiro.
```
