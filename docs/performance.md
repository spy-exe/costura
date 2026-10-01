# Performance da abertura

Medições da abertura cinematográfica da homepage. A arquitetura está em [landing-architecture.md](landing-architecture.md). As medições das outras páginas estão em [QA.md](QA.md).

## Metas

| Métrica | Meta | Por quê |
| --- | --- | --- |
| LCP | ≤ 2,5 s (mobile, laboratório) | O LCP é o título e o pôster entregues pelo servidor; a cena não pode atrasá-lo |
| CLS | ≤ 0,1 | A seção fixa tem altura definida no CSS desde o servidor; nenhuma troca de nível muda o layout |
| TBT / INP | TBT ≤ 200 ms no laboratório | A cena carrega fora do caminho crítico e os shaders compilam antes do primeiro quadro visível |
| JavaScript da primeira carga | Igual ao da versão estática | three, React Three Fiber, drei, postprocessing, GSAP e Lenis ficam em pedaços carregados depois |
| Taxa de quadros | 60 fps no nível alto e médio, 30 fps ou mais no baixo | O monitor de desempenho baixa a densidade de pixels e depois o nível quando a taxa cai |

## Bytes transferidos

Medidos em produção (https://roupas-website.malha.app, Cloudflare com compressão), na homepage da Alvorada a 1440 × 900, com Chromium 1234 e o nível forçado por `?qualidade=`. Os valores são de transferência (comprimidos).

| Nível | JavaScript na carga | JavaScript depois da carga | Imagens | GLB |
| --- | --- | --- | --- | --- |
| static | 159 KB | 0 | 125 KB | 0 |
| poster | 157 KB | 52 KB (GSAP, ScrollTrigger, Lenis) | 125 KB | 0 |
| low (tempo real) | 159 KB | 369 KB (317 KB da cena 3D, 52 KB de movimento) | 191 KB (pôster e 4 texturas de 640 px) | 5 KB (cabide com Meshopt) |

- O JavaScript da primeira carga é o mesmo nos três níveis: a cena não pesa no LCP.
- O pedaço da cena (three, React Three Fiber, drei e postprocessing) tem 317 KB comprimidos. No desktop e no tablet ele é pedido quando o navegador fica ocioso depois do `load`. O celular recebe a versão editorial e não baixa a cena: na primeira carga ele transfere o mesmo JavaScript da tabela e nada depois.
- O decodificador Draco (`public/draco/`) só é baixado quando algum GLB usa Draco. O cabide de exemplo usa Meshopt, cujo decodificador vem embutido na drei.
- As texturas das peças vêm do otimizador de imagens do Next, em WebP, na largura do nível (1024, 768 ou 640 px).
- **Só WebP, sem AVIF:** com o cache de imagens frio, os encodes AVIF de uma home cheia de fotos chegaram a 22 s no CT (4 núcleos), contra 5 s em WebP. Na CI isso estourava o tempo dos testes, e em produção quem chega primeiro a uma foto nova esperava. O AVIF gerava arquivos cerca de metade menores; o WebP foi escolhido pelo tempo de resposta.

## Custo da cena por nível

| Nível | Triângulos (aprox.) | Sombras | Pós-processamento | DPR máximo | Partículas |
| --- | --- | --- | --- | --- | --- |
| high | 41 mil | Mapa 2048 | Profundidade de campo, vinheta, granulação, AgX | 1,75 | 260 |
| medium | 25 mil | Mapa 1024 | Nenhum (AgX no próprio renderizador) | 1,5 | 120 |
| low | 17 mil | Nenhuma | Nenhum (AgX no próprio renderizador) | 1,25 | 0 |

Os triângulos somam o pano principal, os 4 painéis da arara e os 4 cabides (2.752 triângulos cada). O fundo infinito usa Lambert com emissão em vez de material físico, porque ocupa a tela inteira e o custo por pixel importava mais que o realismo. Não há bloom.

**Proteções em tempo de execução:**
- `PerformanceMonitor` da drei: primeiro baixa a densidade de pixels até o mínimo do nível, depois rebaixa o nível (alto → médio → baixo → pôster ou quadros).
- Fora da tela, o laço de desenho para (`frameloop="never"`).
- Ao desmontar, materiais, geometrias e texturas são descartados.
- Os shaders compilam com `compileAsync` antes de o canvas aparecer, então o primeiro quadro visível não trava.

## GPU emulada por software

Um aparelho sem GPU (ou com a GPU bloqueada pelo navegador) ainda expõe WebGL2, rodando no processador: SwiftShader no Chrome, llvmpipe no Linux, WARP no Windows. A cena roda a poucos quadros por segundo e trava a thread principal.

**Como apareceu:** no Lighthouse da CI, que roda sem GPU. Com a primeira versão da abertura, a homepage caiu para performance 54 e 95,8 s de TBT (mediana de 3 execuções, commit `94cf165`). As outras páginas não mudaram.

**Correção:** `capabilities.ts` lê o nome do renderizador uma vez por visita. Renderizador por software conta como aparelho sem WebGL: a pessoa recebe a sequência de quadros, quando existe, ou a versão estática. O parâmetro `?qualidade=` continua forçando a cena, para QA e testes.

**Consequência para as medições:** Lighthouse e PageSpeed Insights medem a versão estática da abertura, porque rodam sem GPU. O custo da cena em tempo real não aparece nesses números. Ele está nas tabelas acima (bytes e geometria) e precisa de medição em aparelho real (ver "Não medido").

## Lighthouse

CI (ubuntu-24.04, sem GPU), Lighthouse 13.5, perfil mobile simulado (4G lento e CPU 4x mais lenta), 3 execuções, mediana. Build de produção da Alvorada em modo demonstração.

| Página | Commit | Performance | LCP | CLS | TBT | Bytes totais |
| --- | --- | --- | --- | --- | --- | --- |
| / (antes da abertura) | `ea60284` | 93 | 3,27 s | 0 | 67 ms | — |
| / (abertura, sem a correção de GPU) | `94cf165` | 54 | 3,03 s | 0 | 95.753 ms | 839 KB |
| / (abertura, com a correção) | `34d4396` | 94 | 2,97 s | 0 | 71 ms | 370 KB |
| /loja | `34d4396` | 94 | 2,95 s | 0 | 54 ms | 380 KB |
| /produto/calca-cintura-alta | `34d4396` | 96 | 2,75 s | 0 | 55 ms | 292 KB |
| /carrinho | `34d4396` | 99 | 2,01 s | 0 | 48 ms | 290 KB |

A abertura não piorou a homepage no laboratório: o LCP caiu de 3,27 s para 2,97 s e o TBT ficou no mesmo patamar. O LCP simulado continua acima da meta de 2,5 s, como nas outras páginas com foto grande (pendência já registrada em QA.md). Acessibilidade e boas práticas ficaram em 100 em todas as páginas.

SEO abaixo de 90 é intencional: a demonstração responde `noindex` (ver QA.md).

## Não medido

- **Taxa de quadros em GPU real:** o ambiente de desenvolvimento (Proxmox, sem GPU) e a CI só têm SwiftShader. Os números de fps que ele dá não dizem nada sobre um aparelho real. A verificação pendente, por aparelho: iPhone recente (Safari), Android intermediário (Chrome), notebook com GPU integrada e desktop com GPU dedicada. Anotar o nível escolhido, o fps médio na arara e se o monitor rebaixou o nível.
- **INP em campo:** não há dados de usuários reais (a loja é demonstração).
- **Lighthouse com a cena ligada:** rodar o Lighthouse com `?qualidade=low` numa máquina com GPU real. Na CI ele mediria o SwiftShader.
