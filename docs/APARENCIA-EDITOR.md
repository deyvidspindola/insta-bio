# Aba Aparência v2 — Templates + Personalizar

Redesenho conforme `docs/remodelagem-aba-aparencia-editor/redesenho_aba_aparencia_e_templates.pdf`.

## Modelo mental

1. **Templates prontos** — bios-modelo (visual + links sugestivos por nicho)  
2. **Personalizar** — fine-tuning do tema ativo (fundo, cores, formato dos links)

Aplicar um template **substitui as seções/cards** pelos do modelo (com confirmação). Nome, logo e Instagram são preservados.

## Packs showcase (topo da galeria)

| ID | Destaca |
|----|---------|
| `igreja-completa` | Fundo sólido, banner com foto, WhatsApp/YouTube, grid 2 colunas, voluntariado, endereço (referência Expressar) |
| `fundo-foto` | Background image + overlay + capa no header |
| `criador-midia` | Stories (slides), YouTube embed, app-heroes IG/YT, grid |
| `loja-vitrine` | Products, solid, WhatsApp |
| `negocio-local` | Capa, grid com fotos, pill, localização |

Imagens em `bio/public/assets/templates/`.

## O que cada pack aplica

- Fundo (preset) + primary/secondary/glow + estilo de link + raio  
- Tagline / localização / redes sugestivas  
- Seções com links, heróis WhatsApp, localização etc. (URLs de exemplo)

## Organização atual

### Templates prontos
- Grid **2 colunas no mobile / 4 no desktop**
- Mini mockup fiel à bio (avatar, tagline, redes, links do nicho)
- Botão **Usar esta bio** + confirmação antes de trocar o conteúdo
- Criar do zero (só visual) e Salvar meu template (visual + conteúdo)

### Personalizar (página única — sem sub-abas)

1. **Fundo da página** — foto + overlay, cor sólida ou gradiente; atalhos só mudam o fundo  
2. **Cores e estilo dos links** — paletas por nicho, pickers, formato, arredondamento
