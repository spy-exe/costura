# ADR 0002: Shopify Storefront API como adaptador real

Data: 2026-09-24. Situação: aceita, sem credenciais configuradas.

## Contexto

O repositório não tinha backend de comércio. Precisávamos de um provedor com catálogo, variantes, estoque e checkout hospedado, que opere no Brasil e que não obrigue a loja a guardar dados de cartão.

## Opções avaliadas

| Opção | Encaixe técnico | Operação no Brasil | Custo e manutenção |
| --- | --- | --- | --- |
| Shopify (Storefront API) | GraphQL pública e estável, Cart API com `checkoutUrl`, token público só de leitura | Vende em reais com checkout em português; meios de pagamento locais, como Pix, dependem do gateway escolhido (confirmar no plano) | Mensalidade da plataforma; zero servidor de comércio para manter |
| Nuvemshop | API REST forte para gestão; checkout hospedado atrelado à vitrine própria | Muito usada no Brasil | Uso headless menos documentado |
| VTEX | Muito completo, headless maduro | Forte no Brasil | Custo e complexidade de empresa grande |
| Medusa (self-hosted) + Mercado Pago | Controle total | Depende de integrar pagamento e frete | Mais um serviço, banco e atualizações para operar |

Hipótese, não verificada com conta real: preços e taxas de cada plataforma mudam; a empresa precisa confirmar o plano antes de contratar.

## Decisão

Implementar um único adaptador real, Shopify Storefront API (`src/core/commerce/providers/shopify.ts`), além do adaptador de demonstração. O checkout é o hospedado pela Shopify: a loja cria um carrinho via `cartCreate` e redireciona para o `checkoutUrl`.

## Consequências

- Nenhum dado de cartão passa pela loja.
- Filtro, busca e ordenação rodam no core sobre o catálogo normalizado, com cache de 60 s. Serve bem até algumas centenas de produtos; acima disso, os filtros devem ir para a API do provedor.
- Preço e estoque da sacola são sempre buscados de novo (sem cache) a cada leitura.
- Sem as credenciais, o adaptador está testado contra respostas simuladas da API, mas não contra uma loja real.
