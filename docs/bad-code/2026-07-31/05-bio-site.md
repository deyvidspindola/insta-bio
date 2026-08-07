# Qualidade de Código — Bio e Site (2026-07-31)

Parte 5 de 5 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — Interface `Hsv` morta em `bio/src/lib/colorEngine.ts`

- **Severidade:** Baixo
- **Categoria:** Organização/Coesão
- **Local:** `bio/src/lib/colorEngine.ts:15-19`
- **Problema encontrado:** `colorEngine.ts` exporta uma interface `Hsv { h, s, v }` que não é usada em nenhum outro lugar do arquivo (o arquivo não converte para/de HSV, só trabalha com `Rgb`) nem é importada por nenhum outro módulo do repositório. A única outra ocorrência do nome `Hsv` no projeto é em `editor/src/lib/color.ts:5-9`, que define a mesma forma e efetivamente a usa em `hexToHsv`/`hsvToHex` para o seletor de cor do editor — mas os dois arquivos não têm relação de import entre si (`bio/src/lib/colorEngine.ts` não é usado pelo color picker do editor, que resolve conversão de cor via `<canvas>`, não via `colorEngine`).
- **Por que isso é um problema:** é um export sem nenhum consumidor — aumenta a superfície do "motor único de cores" (como o próprio comentário do arquivo o descreve, `colorEngine.ts:1-6`) com um tipo que não faz parte do motor, e pode confundir quem for adicionar uma nova função de cor a acreditar que já existe suporte a HSV ali quando não existe.
- **Evidência:**
  ```ts
  // bio/src/lib/colorEngine.ts:15-19
  export interface Hsv {
    h: number;
    s: number;
    v: number;
  }
  ```
  Confirmado por busca em todo o repositório (`grep -rn "\bHsv\b" bio editor`): a única outra ocorrência é a definição independente em `editor/src/lib/color.ts:5-9`, sem import cruzado entre os dois arquivos.
- **Refatoração sugerida:**
  1. Remover a interface `Hsv` de `bio/src/lib/colorEngine.ts:15-19` — mudança de uma linha, sem nenhum consumidor a atualizar.
  2. Rodar `npm run lint` (Oxlint, conforme `docs/PROJETO.md`) em `bio/` após a remoção para confirmar que nenhum import quebrou.
