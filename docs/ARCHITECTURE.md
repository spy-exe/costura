# Arquitetura

## Visão geral

```
brands/<marca>/        identidade, conteúdo editorial, operação comercial e fontes de UMA empresa
  brand.ts             nome, logos, cores, forma, tipografia, contato, navegação, recursos
  content.ts           textos e imagens editoriais da homepage e das páginas institucionais
  commerce.ts          limites da sacola, faixas de preço, pagamento, frete e trocas (vazios na demo)
  fonts.ts             declaração next/font da marca
src/core/              regras de domínio, sem React e sem Next
  brand/               schemas da marca e do conteúdo, tokens CSS, contraste WCAG
  catalog/             consulta de catálogo: busca, filtros, facetas, ordenação, paginação, tamanhos
  cart/                sacola: linhas guardadas, mutações, preço autoritativo, serviço
  commerce/            contratos, dinheiro, provedores (demo e Shopify), configuração comercial
  config/              variáveis de ambiente validadas
  security/            mesma origem, destino de redirecionamento, limitação de abuso
src/server/            ponte entre core e Next: marca ativa, provedor, cookie da sacola, SEO, créditos
src/app/               rotas do App Router (páginas e API)
src/ui/                componentes; textos de interface do core em src/ui/copy.ts
data/demo/<marca>/     catálogo de demonstração (gerado a partir de products.json + assets.json)
public/brands/<marca>/ logos, favicon e imagem de compartilhamento
public/demo/<marca>/   fotos de demonstração
```

A marca ativa é escolhida no build ([ADR 0001](adr/0001-uma-implantacao-por-marca.md)). Componentes leem tokens CSS (`--c-bg`, `--c-accent`, `--display-case` e outros) gerados de `brand.ts`; nenhum componente conhece uma marca.

## Contratos

`src/core/commerce/types.ts` define, com Zod, `Product`, `Variant`, `Category`, `Collection`, `SizeGuide` e `Catalog`. O mesmo schema valida o catálogo de demonstração e o resultado normalizado da Shopify, com regras cruzadas (variante com cor e tamanho existentes, combinação única, categoria e guia existentes).

Todo provedor implementa:

```ts
interface CommerceProvider {
  id: string;
  mode: "demo" | "live";
  getCatalog(): Promise<Catalog>;                                // pode vir de cache
  getVariantSnapshots(ids: string[]): Promise<Map<string, VariantSnapshot>>; // sempre fresco
  createCheckout(lines): Promise<{ kind: "redirect"; url } | { kind: "demo" }>;
}
```

Falhas recuperáveis do provedor viram `CommerceUnavailableError`; a interface mostra a mensagem e o botão "Tentar de novo".

## Fluxo de dados

```
Página de catálogo (Server Component)
  └─ queryCatalog(searchParams) → getCatalog() → runCatalogQuery() → CatalogView
     filtros, ordem e página vêm da URL; formulários GET funcionam sem JavaScript

Página de produto (Server Component + ProductExperience no cliente)
  └─ escolha de cor/tamanho → POST /api/cart {action:"add", variantId}
     sem JavaScript: POST form {action:"add-options", productHandle, color, size} → 303 /carrinho

POST /api/cart
  └─ mesma origem? limite de abuso? intenção válida (Zod)?
     → applyCartIntent: busca retrato autoritativo da variante → altera linhas → priceCart
     → grava cookie → responde a sacola recalculada (private, no-store)

/checkout (Server Component)
  └─ getCart() recalcula tudo; avisos bloqueiam
     demo: explica que nada é cobrado
     real: form POST /api/checkout → revalida → createCheckout → 303 para o checkout do provedor
```

## Estado no cliente

`StoreShell` agrupa a sacola (`CartProvider`), a gaveta e a região `aria-live` que anuncia inclusão, remoção e erros. A última ação que falhou fica guardada para o botão "Tentar de novo". Filtros vivem na URL; a última listagem visitada fica em `sessionStorage` para o link "Voltar aos resultados".

## Cache

| Dado | Onde | Validade |
| --- | --- | --- |
| Catálogo de demonstração | memória do processo | enquanto o processo vive |
| Catálogo Shopify | memória do processo | 60 s; se a API cair, serve a última versão |
| Homepage | ISR do Next | revalida a cada 60 s |
| Catálogo, busca, produto | renderização por requisição | sempre atual |
| Preço e estoque da sacola e do checkout | nunca em cache | consulta a cada leitura |
| `/api/cart`, `/carrinho`, `/checkout` | `private, no-store` | nunca compartilhado |

## Abertura cinematográfica

A homepage abre com uma cena WebGL controlada pela rolagem quando a marca define `stage` e `content.home.experience`. Módulos, níveis de qualidade, carregamento e assets estão em [landing-architecture.md](landing-architecture.md); o roteiro, em [landing-storyboard.md](landing-storyboard.md). Resumo do que protege a loja: textos e links sempre em DOM, cena carregada fora do caminho da primeira pintura, versão estática com movimento reduzido, economia de dados ou GPU por software, barreira de erro que devolve o pôster, e controle para pausar o movimento autônomo.
