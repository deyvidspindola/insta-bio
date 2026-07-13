# Pacote para Claude / DeepSeek — Motor de cores

## Arquivos

| Arquivo | Uso |
|---|---|
| [`../PROMPT-MOTOR-CORES.md`](../PROMPT-MOTOR-CORES.md) | Especificação + prompt curto no final |
| [`SNAPSHOT.md`](./SNAPSHOT.md) | Código atual dos componentes (~120 KB) |

## Como usar

1. Abra um chat novo no Claude ou DeepSeek.
2. Anexe / cole `PROMPT-MOTOR-CORES.md`.
3. Anexe / cole `SNAPSHOT.md` (ou faça upload dos dois).
4. Use o bloco **“Prompt curto”** no final do PROMPT se a janela de contexto for apertada — o snapshot continua obrigatório.
5. Peça a entrega no formato patch Antes/Depois.
6. Traga o resultado de volta ao Cursor para aplicar.

## Regenerar o snapshot

Se o código mudar antes de mandar para o outro modelo:

```bash
# a partir da raiz do monorepo — mesmo comando usado para gerar SNAPSHOT.md
# (ou peça ao agente Cursor: "regenere o SNAPSHOT do motor de cores")
```
