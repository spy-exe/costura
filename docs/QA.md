# QA

Última rodada: 2026-09-25, commit `ea60284`, em produção em https://roupas-website.malha.app (Alvorada) e na rede interna (OBRA, porta 3001).

## Resumo

| Verificação | Ferramenta e ambiente | Resultado |
| --- | --- | --- |
| Lint, tipos, isolamento de marca | CI (ubuntu-24.04, Node 24.18) | Aprovado |
| Unidade, integração e componentes | Vitest 5.0.1, CI e LXC Debian 13 | 142 aprovados; 96,3% statements, 91,9% ramos, 95,7% funções, 97,5% linhas |
| E2E | Playwright 1.63, CI | 65 aprovados, 2 pulados de propósito (paginação: os catálogos cabem numa página; um cenário exclusivo do desktop no projeto de celular) |
| Navegadores | Chromium (duas marcas), Pixel 7, Firefox, WebKit | Aprovado |
| Regressão visual | Playwright, referências geradas na CI e revisadas | 4 comparações, 8 capturas, aprovado |
| Acessibilidade automática | axe-core 4.13 (WCAG 2.0/2.1/2.2 A e AA) em 10 páginas por marca e com a sacola aberta | Sem violações |
| QA visual manual | Capturas examinadas em 360, 390, 768, 1280 e 1440 px | Ver abaixo |
| Lighthouse | 13.5, perfil mobile simulado, 3 execuções por página, mediana, runner da CI | Ver abaixo |

Um agente de QA independente começou a revisão, mas foi interrompido por limite de uso depois de varrer a Alvorada. A varredura da OBRA e a inspeção das capturas foram feitas na sequência, fora dele. Portanto a revisão não foi totalmente independente.

## QA visual

Varredura automatizada nas duas marcas, em 5 larguras e 8 páginas (homepage, loja, categoria, produto, sacola com item, checkout, busca vazia e 404), num total de 80 verificações: nenhuma rolagem horizontal, nenhuma imagem quebrada, exatamente um H1 por página e status HTTP corretos (404 na página inexistente). Capturas examinadas a olho: homepage das duas marcas (1440 e 390 px), loja (1440, 768 e 360 px), produto com erro de tamanho (360 px), sacola aberta (360 px), checkout (768 px), produto e sacola da OBRA (390 px).

Defeitos encontrados na inspeção e corrigidos:

| Defeito | Correção |
| --- | --- |
| Fileira de categorias colada na borda no celular | `scroll-padding` no carrossel |
| Vão ao lado de produto com foto única no celular | Foto única em largura total |
| Buraco na grade com três categorias | Grade acompanha a quantidade |
| "Todos os produtos" duplicado no menu do celular | Remoção de duplicatas por endereço |
| Barra de compra fixa encobria o foco nas cores (WCAG 2.4.11) | `scroll-padding-bottom` no celular |
| Texto do checkout de demonstração citava um botão que não existe | Texto corrigido |
| Título da 404 era só o nome da marca | "Página não encontrada" |

## Defeitos encontrados pelos testes e corrigidos

| Defeito | Como apareceu | Correção |
| --- | --- | --- |
| Redirecionamento 303 apontava para `localhost`; adicionar à sacola sem JavaScript falhava e o checkout real falharia atrás do proxy | E2E sem JavaScript | `Location` relativo |
| Categoria inexistente respondia 200 | E2E | `loading.tsx` removido das rotas com 404 |
| Zod no bundle do cliente disparava violação de CSP no Firefox | Smoke no Firefox | Módulos usados no cliente sem Zod (menos 390 KB de JavaScript) |
| Botões das linhas da sacola com o mesmo nome acessível para variantes do mesmo produto | Teste de componente | Nome inclui cor e tamanho |
| Botão "Filtrar (3)" com nome acessível "Filtrar(3)" | Teste de componente | `aria-label` explícito |
| Nova tentativa da sacola chamava estado de forma síncrona dentro do efeito | Lint (react-hooks) | Estado atualizado no retorno da promessa |
| Ordem de títulos pulava de H1 para H3 na listagem | Lighthouse | Contagem de resultados como H2 |

## Performance (laboratório)

Build de produção da Alvorada em modo demonstração, servidor local no runner da CI, Lighthouse 13.5 com perfil mobile simulado (4G lento e CPU 4x mais lenta). São dados de laboratório, não medições de usuários reais: não há dado de campo.

| Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| / | 93 | 100 | 100 | 69 | 3,27 s | 0 | 67 ms |
| /loja | 93 | 100 | 100 | 69 | 3,00 s | 0 | 69 ms |
| /produto/calca-cintura-alta | 96 | 100 | 100 | 69 | 2,79 s | 0 | 64 ms |
| /carrinho | 99 | 100 | 100 | 66 | 2,01 s | 0 | 49 ms |

- SEO abaixo de 90 é intencional: a demonstração responde `noindex` e o `robots.txt` bloqueia tudo. Com provedor real e `ALLOW_INDEXING=true`, esse item deixa de falhar.
- CLS e TBT estão bem abaixo das metas (0,1 e o equivalente de 200 ms de INP).
- LCP simulado entre 2,8 e 3,3 s nas páginas com foto grande, **acima da meta de 2,5 s**. No runner sem limitação, a imagem leva cerca de 40 ms para carregar e 240 ms para aparecer; o tempo vem da simulação de rede lenta. Pendência abaixo.
- Medições dentro do LXC foram descartadas: o host compartilhado estava com carga de 4,7 e a mesma página variou de 1 s para 7 s de TBT entre duas rodadas.

## Observações de ambiente

- A zona Cloudflare injeta o beacon do Web Analytics, e o CSP bloqueia. O único erro de console em produção vem daí. Ver docs/DEPLOYMENT.md.
- Prefetches do Next cancelados durante a navegação aparecem como `ERR_ABORTED` no navegador. É comportamento normal, não falha.

## Não executado

- Leitor de tela real (NVDA, VoiceOver, TalkBack): não disponível no ambiente. A acessibilidade foi verificada por axe, testes de nome acessível e navegação por teclado. Isso não equivale a conformidade WCAG 2.2 AA integral.
- Zoom a 200% e reflow a 320 px CSS: coberto indiretamente pela largura de 360 px, não testado com zoom do navegador.
- Teclado virtual em aparelho real: não testado.
- Integração com uma loja Shopify real: sem credenciais.

## Pendências

| Pendência | Impacto | O que falta | Pronto quando |
| --- | --- | --- | --- |
| Ligar a Shopify | A loja não vende | Loja Shopify, token Storefront, produtos com opções Cor/Tamanho, gateway em modo de teste (docs/COMMERCE.md) | Compra de teste concluída no checkout hospedado e E2E de integração verde |
| LCP simulado acima de 2,5 s na home e na loja | Métrica de laboratório fora da meta; experiência real desconhecida | Testar imagens menores no primeiro carregamento, AVIF de qualidade menor e `sizes` mais justo; medir de novo na CI | Mediana do LCP abaixo de 2,5 s na CI |
| Beacon do Cloudflare bloqueado | Erro no console em produção | Desligar a injeção do Web Analytics para `roupas-website.malha.app` no painel da Cloudflare | Console sem erro em produção |
| Revisão com leitor de tela | Conformidade AA não confirmada | Rodada manual com NVDA e VoiceOver nos fluxos de compra | Relatório anexado aqui |
| Limitador de abuso em memória | Não vale com várias instâncias por marca | Armazenamento compartilhado se escalar | Teste com duas instâncias |
