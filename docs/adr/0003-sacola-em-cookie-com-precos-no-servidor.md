# ADR 0003: Sacola em cookie, preços sempre no servidor

Data: 2026-09-24. Situação: aceita.

## Decisão

A sacola é guardada num cookie `HttpOnly`, `SameSite=Lax`, com nome `costura_cart_<marca>_<ambiente>`. O cookie guarda só variante, quantidade e o preço que a pessoa viu. A cada leitura o servidor busca preço e estoque no provedor e recalcula linhas e subtotal (`src/core/cart/pricing.ts`).

O preço guardado nunca é usado para cobrar: ele só serve para avisar que o preço mudou. Nesse caso, e em estoque insuficiente ou indisponibilidade, o checkout fica bloqueado até a pessoa resolver o aviso.

## Por quê

- Uma implementação de sacola para todos os provedores; o provedor só precisa informar variantes e criar o checkout.
- Nada de banco de dados para a demonstração nem para lojas pequenas.
- Não há como o navegador impor preço: a API ignora qualquer campo além de variante e quantidade.

## Consequências

- O cookie tem limite de 50 linhas (configurável até isso por marca).
- A página e a gaveta leem a sacola por `GET /api/cart` com `Cache-Control: private, no-store`; as páginas de catálogo continuam em cache.
