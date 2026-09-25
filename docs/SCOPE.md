# Escopo da primeira versão

Costura é um core de e-commerce de roupas. Um mesmo código atende empresas diferentes; cada implantação escolhe uma marca por variável de build e traz sua própria configuração comercial. Esta versão entrega a vitrine completa, o carrinho e a passagem para um checkout hospedado pelo provedor. Ela não processa pagamentos.

## Objetivos

1. Loja navegável e comercialmente utilizável: descoberta, escolha de variantes, carrinho e passagem para o checkout.
2. Identidade trocável por configuração, sem editar componentes. Duas marcas fictícias provam isso: **Alvorada Costura Brasileira** (nome longo, logo horizontal) e **OBRA** (nome curto, logo compacto).
3. Camada de comércio com contratos explícitos, um adaptador de demonstração com dados determinísticos e um adaptador real (Shopify Storefront API, ver [ADR 0002](adr/0002-provedor-de-comercio.md)).
4. Qualidade verificável: testes, cobertura, acessibilidade, performance e QA visual documentados.

## Incluído

| Área | Entrega |
| --- | --- |
| Homepage | Abertura editorial com acesso direto ao catálogo, categorias, coleção em destaque, bloco editorial por marca |
| Catálogo | `/loja`, `/categoria/[slug]`, `/colecao/[slug]` com filtros de tamanho, cor e faixa de preço, ordenação e paginação numerada. Estado na URL |
| Busca | `/busca?q=` sem distinção de acentos e caixa, sobre nome, descrição, categoria, cor e etiquetas |
| Produto | Galeria, preço, cor e tamanho obrigatórios, disponibilidade por variante, composição, cuidados, guia de medidas, link de volta aos resultados |
| Carrinho | Painel lateral e página `/carrinho`: incluir, alterar quantidade, remover, persistir. Linhas distintas por variante. Avisos de preço alterado, estoque insuficiente e indisponibilidade. Nova tentativa em falha de rede |
| Checkout | `/checkout` revalida o carrinho no servidor. No modo demonstração explica que nada é cobrado; no modo real redireciona ao checkout hospedado |
| Institucional | Sobre, atendimento, trocas e devoluções, privacidade, guia de medidas, créditos de imagens |
| Estados | Carregamento, vazio, erro com nova tentativa, indisponível, 404 |
| SEO | Metadados por marca e página, canonical, sitemap, robots, JSON-LD de produto sem avaliações. Demonstração e preview não indexam |
| Movimento | Cena editorial em Three.js opcional por marca, carregada sob demanda só na homepage, com alternativa estática |

## Fora do escopo

Conta de cliente, favoritos, newsletter, avaliações, cupons, cálculo de frete próprio, painel administrativo, ERP, marketplace, fidelidade, backend de pagamentos, multi-tenant em runtime. Nada disso aparece na interface.

Frete, Pix, parcelamento, descontos e prazos só aparecem quando configurados no arquivo comercial da empresa. As marcas de demonstração não configuram nenhum deles.

## Fluxos principais

1. **Descobrir**: homepage → categoria → filtrar por tamanho e cor → ordenar → produto → voltar e encontrar os mesmos filtros e página.
2. **Buscar**: campo de busca no cabeçalho → resultados → refinar com filtros.
3. **Comprar**: produto → escolher cor e tamanho → adicionar → painel do carrinho anuncia a inclusão → alterar quantidade → checkout.
4. **Recuperar**: variante esgotada, estoque que caiu, preço que mudou ou falha de rede → mensagem que diz o que houve e o que fazer.

## Critérios de aceite

- [x] As duas marcas rodam do mesmo core, escolhidas por `BRAND`, sem condicional de marca em componentes.
- [x] Adicionar ao carrinho exige cor e tamanho; variante esgotada não pode ser adicionada.
- [x] Carrinho persiste entre recargas, é isolado por marca e ambiente e nunca vai para cache compartilhado.
- [x] O servidor recalcula preço, estoque e totais a cada leitura; valores vindos do navegador são ignorados.
- [x] Filtros, ordenação e página vivem na URL; o botão voltar restaura o contexto.
- [x] Nenhum controle falso, link morto ou condição comercial inventada.
- [x] Modo demonstração identificado em toda página e no checkout; nenhuma compra simulada aparece como paga.
- [x] Navegação completa por teclado, foco visível, diálogos com Escape e retorno de foco, anúncios de carrinho.
- [x] Lint, typecheck, testes, cobertura mínima (85/80, e 90 nas regras críticas), build e E2E passam na CI.
- [ ] Venda real: depende de ligar a Shopify (credenciais externas). Ver [QA.md](QA.md#pendências).
- [x] QA visual em 360, 390, 768, 1280 e 1440 px nas duas marcas, registrado em [QA.md](QA.md).
