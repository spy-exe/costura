# Comércio

## Situação atual

| Item | Situação |
| --- | --- |
| Catálogo, variantes, estoque | Funcionando com o provedor de demonstração (dados fixos em `data/demo/<marca>/catalog.json`) |
| Sacola | Funcionando; preços e estoque recalculados no servidor a cada leitura |
| Checkout | Modo demonstração: revisão dos itens e aviso de que nada é cobrado |
| Adaptador Shopify | Implementado e testado contra respostas simuladas; **não testado contra uma loja real** (faltam credenciais) |
| Pagamento, frete, parcelamento, Pix | Não exibidos: nenhuma marca de demonstração os configura |

A loja **não está pronta para vender**. Para isso, siga "Ligar a Shopify" abaixo e valide com uma compra de teste no ambiente de testes do provedor.

## Configuração comercial por empresa

`brands/<marca>/commerce.ts`, validado por `src/core/commerce/settings.ts`:

| Campo | Efeito | Na demonstração |
| --- | --- | --- |
| `cart.maxQuantityPerLine` | Teto de unidades por variante | 10 |
| `cart.maxLines` | Teto de variantes diferentes (até 50) | 30 |
| `priceFilterBoundaries` | Faixas do filtro de preço, em reais | Alvorada 0/200/350/500, OBRA 0/150/300/500 |
| `paymentMethods` | Formas de pagamento mostradas | vazio: o assunto não aparece |
| `installments` | Parcelamento mostrado | ausente |
| `shipping` | Texto sobre envio e frete grátis | ausente |
| `returns` | Página de trocas com prazo e regras | ausente: a página diz que a loja não publicou política e cita o direito de arrependimento de 7 dias do CDC |
| `legal` | Razão social e CNPJ | ausente |

Nada é exibido por padrão. Uma empresa só vê parcelamento, Pix ou frete grátis na interface se preencher o campo com as condições reais dela.

## Regras da sacola

- Linhas separadas por variante (mesma peça em outra cor ou tamanho é outra linha).
- Adicionar mais do que o estoque ajusta a quantidade e avisa ("Só há N disponível...").
- Preço mudou desde a inclusão: aviso com os dois valores e botão "Aceitar novo preço". O checkout fica bloqueado até aceitar.
- Estoque caiu abaixo da quantidade: aviso e botão "Ajustar para N". Bloqueia o checkout.
- Variante esgotada ou removida do catálogo: aviso e remoção. Não entra no subtotal e bloqueia o checkout.
- A API aceita só `variantId` e `quantity`. Qualquer preço enviado pelo navegador é descartado pelo schema.
- `POST /api/cart` recusa outra origem (403) e limita 60 alterações por minuto por IP (429 com `Retry-After`).

## Ligar a Shopify

1. Na Shopify, instale o canal **Headless** e gere um **token público da Storefront API** com as permissões de leitura de produtos, coleções e inventário (`unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`) e de carrinho (`unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`).
2. Cadastre os produtos com opções chamadas **Cor** e **Tamanho** (também aceitamos Color, Colour e Size). Use o campo de cor do swatch para o círculo de cor.
3. Opcional: metafields `custom.composition`, `custom.care` (um cuidado por linha) e `custom.fit`. Sem eles, a página mostra "Composição não informada pela loja".
4. Defina no ambiente de produção:
   ```
   COMMERCE_PROVIDER=shopify
   SHOPIFY_STORE_DOMAIN=sua-loja.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=<token público>
   SHOPIFY_API_VERSION=2026-07
   ```
5. Faça um novo build (o CSP inclui o domínio da loja em `form-action`).
6. Teste uma compra com o gateway em modo de teste. Não use cobrança real como teste.

Guias de medidas, textos editoriais e identidade continuam vindo de `brands/<marca>`. Sem permissão de inventário, a Storefront API não informa a quantidade; nesse caso o core trata a variante como disponível até o limite por linha, e a Shopify faz a checagem final no checkout.

## Webhooks

Não há webhooks nesta versão: a loja não cria nem acompanha pedidos, o provedor faz isso no checkout hospedado. Se no futuro a loja reagir a pedidos, os webhooks precisam validar a assinatura HMAC da Shopify e ser idempotentes pelo id do evento.
