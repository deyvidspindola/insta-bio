<!--
O PR existe para você ler o próprio diff inteiro antes de integrar.
Não é burocracia de aprovação — é o momento em que se pega regra de negócio
no lugar errado, especialmente em código gerado por IA.
-->

## O que muda

<!-- Uma ou duas frases. Se precisar de mais, provavelmente são dois PRs. -->

## Por quê

<!-- O problema que isso resolve. Referencie a decisão, se houver: D-xx ou DT-xx. -->

## Bloco

<!-- B0 a B10 do capítulo 17 do Escopo Técnico. -->

---

## Revisão

- [ ] `make check` passou localmente
- [ ] Nenhuma regra de negócio em controller, componente Livewire, model ou helper
- [ ] Nenhuma lógica copiada — se repetiu, virou Service
- [ ] Texto novo exibido ao usuário está em `lang/pt_BR/`
- [ ] Componente novo do TallStackUI está por trás de wrapper próprio
- [ ] Caso de uso novo entrou com teste de feature
- [ ] PHPDoc completo em toda classe e método público novo
- [ ] Li o diff inteiro perguntando: **isso poderia estar num lugar melhor?**

## Migrations

- [ ] Não há migration nesta branch
- [ ] Há migration e ela é **aditiva** (não remove nem renomeia coluna em uso)
- [ ] Há migration **destrutiva** — descreva o plano de rollback abaixo

<!-- Plano de rollback, se aplicável: -->
