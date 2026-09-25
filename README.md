# Costura

Core de e-commerce de roupas para várias empresas com o mesmo código. Cada implantação escolhe uma marca por configuração de build e traz sua própria operação comercial. O core entrega vitrine, busca, filtros, página de produto, sacola e a passagem para o checkout hospedado do provedor.

Demonstração: **https://roupas-website.malha.app** (marca fictícia Alvorada, em modo demonstração: nada é vendido nem cobrado).

## Stack

Next.js 16 (App Router), React 19, TypeScript 5.9 estrito, Tailwind CSS 4, Zod 4, Lucide, Three.js (opcional, por marca), Vitest 5 com Testing Library, Playwright 1.63 com axe-core. Node 24.18 e npm 11.16, fixados em `.nvmrc` e `packageManager`.

## Rodar localmente

```bash
nvm use                # Node 24.18
npm ci
npm run dev            # Alvorada em http://localhost:3000
BRAND=obra npm run dev # a mesma base com a marca OBRA
```

Sem variáveis de ambiente o projeto sobe em modo demonstração, com catálogo fixo e sem indexação. Modelo de configuração em `.env.example`.

## Comandos

| Comando | Para quê |
| --- | --- |
| `npm run lint` / `npm run typecheck` | Qualidade estática |
| `npm test` / `npm run test:coverage` | Unidade, integração e componentes, com gates de cobertura |
| `npm run check:brand` | Garante que o core não cita nenhuma marca |
| `node scripts/build-brand.mjs <marca>` | Build de produção de uma marca em `.next-<marca>/standalone` |
| `npm run test:e2e` | E2E nas duas marcas, em Chromium, Firefox, WebKit e celular (precisa dos builds) |
| `deploy/release.sh <marca>` | Publica no servidor, com verificação de saúde e rollback |

## Configurar outra empresa

Crie `brands/<id>/` com identidade (`brand.ts`), fontes, conteúdo editorial e operação comercial, e os arquivos em `public/brands/<id>/`. Nenhum componente muda. Passo a passo em [docs/BRANDING.md](docs/BRANDING.md).

## Limitações

- **Não está pronto para vender.** O adaptador da Shopify está implementado e testado contra respostas simuladas, mas falta ligá-lo a uma loja real (credenciais e teste de compra). Ver [docs/COMMERCE.md](docs/COMMERCE.md).
- Frete, Pix, parcelamento e política de trocas só aparecem quando a empresa configura; as marcas de demonstração não configuram.
- Sem conta de cliente, favoritos, avaliações, cupons ou painel administrativo nesta versão.
- As fotos de demonstração são de terceiros, com licença CC0, e não mostram mercadorias reais. Ver [docs/ASSETS.md](docs/ASSETS.md).

## Documentação

Índice em [docs/README.md](docs/README.md).
