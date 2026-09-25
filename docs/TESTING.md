# Testes

## Comandos

| Comando | O que roda |
| --- | --- |
| `npm run lint` | ESLint com as regras do Next e de hooks do React |
| `npm run typecheck` | TypeScript estrito, sem emitir |
| `npm run check:brand` | Falha se id, nome, cor ou domínio de uma marca aparecer em `src/` |
| `npm test` | Vitest: unidade, integração de rotas e componentes (jsdom + Testing Library) |
| `npm run test:coverage` | O mesmo com cobertura v8 e gates |
| `npm run build:all` | Build de produção das duas marcas em `.next-alvorada` e `.next-obra` |
| `npm run test:e2e` | Playwright: Chromium nas duas marcas, celular (Pixel 7), Firefox e WebKit |
| `npm run test:visual` | Regressão visual (precisa das referências versionadas) |
| `node scripts/lighthouse.mjs <url> <caminhos...>` | Lighthouse 3x por página, mediana |

Os E2E sobem os servidores sozinhos a partir dos builds. Gere-os antes com o ambiente de teste:

```bash
APP_ENV=test SITE_URL=http://127.0.0.1:3100 node scripts/build-brand.mjs alvorada
APP_ENV=test SITE_URL=http://127.0.0.1:3200 node scripts/build-brand.mjs obra
npm run test:e2e
```

## Estratégia

- **Regras de domínio** (`src/core`) são funções puras testadas diretamente: consulta de catálogo, facetas, sacola, preço autoritativo, contratos, ambiente, segurança.
- **Adaptador Shopify** é testado com `fetch` simulado a partir de respostas no formato da Storefront API: normalização, paginação, cache, falhas 4xx, 5xx, erro GraphQL, resposta fora do contrato e checkout.
- **Rotas de API** são chamadas como funções, com cookie jar em memória no lugar de `next/headers`.
- **Componentes cliente** são testados pelo que a pessoa vê e faz: nomes acessíveis, anúncios, foco, erros, nova tentativa.
- **Marcas** são validadas diretamente (`tests/unit/brands.test.ts`): schema, contraste AA, variáveis CSS, arquivos existentes, links que levam a páginas reais, ausência de condição comercial não configurada.
- **E2E** rodam contra builds de produção com catálogo determinístico. Uma rota de teste (`/api/test/catalog`), ligada só com `COMMERCE_TEST_CONTROLS=1` e proibida em produção, altera preço e estoque para simular mudanças.

## Cobertura

Gates no `vitest.config.mts`: 85% de linhas, statements e funções e 80% de ramos no geral; 90% em tudo em `src/core/cart`, `src/core/commerce` e `src/core/config`. Arquivos não importados pelos testes entram no cálculo (`coverage.include`).

Exclusões e motivo:

| Arquivo | Motivo | Coberto por |
| --- | --- | --- |
| `src/app/**/page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx`, `robots.ts`, `sitemap.ts` | Componentes de servidor assíncronos que dependem do runtime do Next | E2E |
| `src/ui/home/scene/cloth.ts` | WebGL não existe no jsdom | E2E de movimento reduzido e QA manual; o componente que o controla é testado |
| `brands/*/fonts.ts` | `next/font` só resolve no build | Build |

Última medição local (2026-09-25, Vitest 5.0.1, `npm run test:coverage`): 142 testes; 96,3% statements, 91,9% ramos, 95,7% funções, 97,5% linhas; gates críticos aprovados.

## Matriz

| Cenário | Onde |
| --- | --- |
| Busca sem acento, prefixo e plural | unidade (`catalog-query`), E2E (`catalog`) |
| Filtros por tamanho, cor e preço; facetas disjuntivas | unidade, componente, E2E |
| Ordenação e paginação na URL; volta do produto mantém contexto | unidade, componente, E2E |
| Parâmetros inválidos não quebram a página | unidade, E2E |
| Escolha obrigatória de tamanho, aviso em dois lugares | componente, E2E |
| Variante esgotada desabilitada com texto | componente, E2E |
| Troca de cor na URL e na galeria | componente, E2E |
| Sacola: inclusão, linhas por variante, quantidade, remoção, persistência | unidade, componente, E2E |
| Limites de quantidade (estoque e teto por linha) | unidade, E2E |
| Preço alterado exige confirmação; estoque caiu pede ajuste; esgotado pede remoção | unidade, componente, E2E |
| Falha de rede e nova tentativa | componente, E2E |
| Preço enviado pelo navegador é ignorado; outra origem recebe 403; abuso recebe 429 | unidade, E2E |
| Checkout de demonstração sem simular pagamento | E2E |
| Adaptador Shopify: normalização, cache, falhas, checkout | unidade |
| Fluxo sem JavaScript (adicionar e ver a sacola) | E2E |
| Troca de marca sem alterar o core | `check:brand`, unidade (`brands`), E2E nas duas marcas |
| Teclado, foco, diálogos com Escape e retorno de foco | componente, E2E |
| Movimento reduzido não carrega WebGL | E2E |
| WCAG A/AA automático (axe) | E2E |
| Isolamento do cookie por marca e ambiente, `no-store` | unidade, E2E |
| Não indexação da demonstração, cabeçalhos de segurança | unidade, E2E |

## Regressão visual

As referências dependem do sistema operacional e das fontes do ambiente. Por isso elas não são geradas na máquina de desenvolvimento: o workflow manual **Referências visuais** gera as capturas no runner da CI e as publica como artifact. Depois de revisadas por uma pessoa, elas vão para `tests/e2e/__screenshots__/`, e a CI passa a compará-las. Nunca atualize referências para esconder uma diferença.

## Testes que dependem de credenciais

Não há. Um teste contra uma loja Shopify real exige credenciais de uma loja de desenvolvimento e deve rodar num job separado, manual, sem cobranças reais.
