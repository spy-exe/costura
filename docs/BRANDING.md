# Configurar outra empresa

O core não muda. Tudo acontece em uma pasta nova em `brands/` e nos arquivos públicos da marca.

## 1. Criar a pasta

Copie uma marca existente como ponto de partida:

```bash
cp -r brands/alvorada brands/minha-marca
mkdir -p public/brands/minha-marca
```

## 2. Identidade (`brand.ts`)

| Campo | O que preencher |
| --- | --- |
| `id` | Igual ao nome da pasta, só letras minúsculas, números e hífens |
| `name`, `shortName` | Nome completo (até 60 caracteres) e curto (até 20) |
| `description` | Uma ou duas frases factuais; vira descrição de SEO e texto do rodapé |
| `logo.horizontal`, `logo.compact` | SVGs em `public/brands/<id>/`. O horizontal aparece a partir de 1024 px; o compacto, no celular. Informe largura e altura do arquivo e as alturas de exibição em `headerHeight` |
| `favicon`, `ogImage` | SVG quadrado e JPG 1200×630 |
| `colors` | 12 cores. O teste `tests/unit/brands.test.ts` exige contraste AA para texto (4,5:1) e 3:1 para o foco |
| `shape` | Raio (`none`, `sm`, `md`) e caixa dos botões |
| `typography` | Peso, espaçamento, caixa, escala e largura (`font-stretch`) dos títulos |
| `contact`, `social` | Canais reais de atendimento. Redes só com URL https |
| `navigation` | Até 8 links principais e até 4 grupos no rodapé, sempre caminhos internos |
| `features.editorialScene` | Liga a cena WebGL na homepage (exige `content.home.scene`) |

Logos com texto precisam ter o texto convertido em curvas: SVG dentro de `<img>` não carrega fonte.

## 3. Fontes (`fonts.ts`)

No máximo duas famílias do Google Fonts via `next/font/google`, expondo `--font-display-family` e `--font-body-family`. Com uma família só, defina `style: { "--font-body-family": "var(--font-display-family)" }`. Registre a licença em docs/ASSETS.md.

## 4. Conteúdo (`content.ts`)

Abertura da homepage (`layout: "split"` ou `"full-bleed"`), título das categorias, coleção em destaque, bloco editorial, cena opcional, textos de "Sobre" e perguntas frequentes. Imagens com texto alternativo que descreve o que se vê.

## 5. Operação comercial (`commerce.ts`)

Veja docs/COMMERCE.md. Preencha apenas o que a empresa realmente oferece.

## 6. Catálogo

- Com Shopify: configure as variáveis de docs/COMMERCE.md; categorias vêm do "tipo de produto".
- Para uma demonstração: escreva `data/demo/<id>/products.json`, registre as fotos em `data/demo/assets.json` e rode `node scripts/build-demo-catalog.mjs <id>`.

## 7. Validar

```bash
npm run check:brand                 # o core continua sem citar marcas
BRAND=minha-marca npm test          # schemas, contraste, links e arquivos da nova marca
node scripts/build-brand.mjs minha-marca
```

Inclua a marca em `tests/unit/brands.test.ts` e em `playwright.config.ts` para a CI cobrir as duas.

## Casos de borda já cobertos

- Nome longo com logo horizontal de duas linhas (Alvorada Costura Brasileira).
- Nome curto com logo compacto só tipográfico (OBRA).
- Títulos em caixa alta e largura expandida versus caixa normal com serifa.
- Marca com e sem cena WebGL.
