# Qualidade de Código — Editor React (2026-07-31)

Parte 4 de 5 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `AppearanceForm.tsx` quebra o padrão de extração de campos em componentes pequenos já estabelecido em `item-editors/`

- **Severidade:** Alto
- **Categoria:** Organização/Coesão · Desvio de arquitetura
- **Local:** `editor/src/components/AppearanceForm.tsx:1-765` (arquivo inteiro); comparar com `editor/src/components/item-editors/BackgroundFields.tsx:1-85`, `editor/src/components/item-editors/FeatureItemFields.tsx`, `editor/src/components/ItemEditor.tsx:1-129` + `editor/src/components/item-editors/ItemTypeFields.tsx:1-76`
- **Problema encontrado:** o padrão dominante do editor, usado consistentemente para todo o formulário de edição de item (`ItemEditor.tsx`), é: o componente "casca" (`ItemEditor.tsx`) fica pequeno (129 linhas) e delega a um dispatcher (`ItemTypeFields.tsx`, 76 linhas) que só decide qual sub-componente renderizar; cada grupo de campos vira um arquivo próprio em `item-editors/` (`BackgroundFields.tsx`, `FeatureItemFields.tsx`, `LinkItemFields.tsx`, etc.), recebendo props primitivas e devolvendo um `onChange` com um "patch" — nenhum desses arquivos passa de ~140 linhas. `AppearanceForm.tsx` é o maior componente do editor (765 linhas — mais que o dobro do segundo maior, `SectionEditor.tsx` com 432) e não segue esse padrão: mistura, tudo dentro da mesma função `AppearanceForm`, JSX inline para (a) galeria de templates prontos, (b) salvar/aplicar/excluir templates customizados do usuário, (c) upload e overlay de imagem de fundo, (d) alternância cor sólida/gradiente, (e) paletas de cor por nicho, (f) cores do sistema (primária/secundária/glow), (g) formato dos links, (h) arredondamento de card — oito seções de UI, cada uma manipulando diretamente `brand.theme` inline, sem nenhuma extração equivalente a `BackgroundFields.tsx`.
- **Por que isso é um problema:** o próprio pacote já demonstra, no formulário de item, que a extração em sub-componentes pequenos facilita adicionar/alterar um campo sem re-ler o arquivo inteiro. Em `AppearanceForm.tsx`, qualquer alteração num único campo (ex.: mudar o comportamento do slider de overlay de imagem, linhas 389-404) exige entender o componente completo de 765 linhas, incluindo estado que não tem relação com o campo em questão (ex.: `saveOpen`/`saveName`/`saveCategory` do fluxo de salvar template, linhas 66-70). Isso já é o maior arquivo de componente do editor e tende a crescer ainda mais a cada novo controle de aparência adicionado, pelo caminho de menor resistência (colar mais JSX na função existente).
- **Evidência:**
  ```tsx
  // editor/src/components/item-editors/BackgroundFields.tsx — padrão esperado:
  // componente pequeno, props primitivas, um único onChange com patch.
  export function BackgroundFields({ mode, color, opacity, defaultMode, onChange }: {...}) { ... }
  ```
  ```tsx
  // editor/src/components/AppearanceForm.tsx:222-765 — um único componente
  // concentrando templates, paletas, fundo, cores, formato de link e arredondamento.
  export function AppearanceForm({ brand, sections, onChange, onChangeConfig }: AppearanceFormProps) {
    // ~40 linhas de estado + ~10 funções + ~540 linhas de JSX
  }
  ```
- **Refatoração sugerida (extrair uma seção por vez, sem tocar nas demais no mesmo commit):**
  1. Extrair a seção "1. Fundo da página" (`AppearanceForm.tsx:350-557`) para `editor/src/components/appearance/BackgroundSection.tsx`, recebendo `brand`, `onChange` e devolvendo os handlers já existentes (`applyBackgroundOnly`, `suggestColorsFromBackground`) via props ou movendo-os junto — segue exatamente o mesmo contrato de `BackgroundFields.tsx`.
  2. Extrair a seção "2. Cores e estilo dos links" (`AppearanceForm.tsx:559-715`) para `editor/src/components/appearance/ColorsSection.tsx`.
  3. Extrair o bloco de galeria de templates + salvar/aplicar/excluir template customizado (`AppearanceForm.tsx:230-346`) para `editor/src/components/appearance/TemplateGallery.tsx`.
  4. `AppearanceForm.tsx` fica só como orquestrador: estado de `mode`/diálogos de confirmação + composição dos três sub-componentes acima — no mesmo espírito de `ItemEditor.tsx` hoje.
