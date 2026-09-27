# Arquitetura da abertura

A abertura da homepage é uma seção fixa enquanto a pessoa rola. Por trás fica um canvas WebGL, e por cima, camadas de texto em DOM. O resto da loja continua sendo a interface convencional descrita em [ARCHITECTURE.md](ARCHITECTURE.md). O roteiro está em [landing-storyboard.md](landing-storyboard.md), a pesquisa em [design-research.md](design-research.md) e as medições em [performance.md](performance.md).

**Regra da página:** cinema onde cria marca, interface convencional onde a pessoa decide. Título, links, preços e botões são sempre DOM: indexáveis, focáveis e legíveis por leitor de tela. O canvas é `aria-hidden` e nunca carrega informação que não esteja também no DOM.

## Módulos

```
src/core/landing/                  lógica pura, sem React nem three (testada por unidade)
  choreography.ts                  SCENES, STAGE e sample(progresso) → estado da cena
  easing.ts                        curvas da linguagem de movimento
  damp.ts                          amortecimento exponencial independente da taxa de quadros
  quality.ts                       níveis de qualidade, decisão e rebaixamento
src/ui/landing/
  landing-experience.tsx           escolhe a versão: cinematográfica (com nível) ou estática
  capabilities.ts                  lê o aparelho uma vez; ?qualidade= força um nível
  static-landing.tsx               versão estática: movimento reduzido, sem JS, sem WebGL
  copy-blocks.tsx                  textos compartilhados pelas duas versões
  store.ts                         estado mutável lido pela cena a cada quadro (progresso, ponteiro)
  types.ts                         dados que a página entrega (serializáveis)
  cinematic/cinematic-landing.tsx  seção fixa, pôster, carregamento tardio da cena, camadas DOM
  cinematic/motion.ts              GSAP + ScrollTrigger + Lenis: linha do tempo das camadas DOM
  three/scene-root.tsx             Canvas, monitor de desempenho, composição da cena
  three/director.tsx               calcula o estado da cena uma vez por quadro, antes dos demais
  three/camera-rig.tsx             câmera amortecida, com paralaxe do ponteiro
  three/lighting-rig.tsx           luz principal, céu e chão, foco da arara
  three/scene-environment.tsx      fundo infinito, névoa, softboxes (Lightformers)
  three/cloth-material.ts          MeshPhysicalMaterial com deslocamento de tecido e trama procedural
  three/cloth-panel.tsx            plano de tecido pendurado
  three/hero-sheet.tsx             pano principal com varão e interação do ponteiro
  three/product-stage.tsx          arara, cabides GLB e ProductModel (painel ou modelo GLB)
  three/glb-model.tsx              carregador GLB com Draco e Meshopt
  three/floating-objects.tsx       poeira no feixe de luz (só nível alto e médio)
  three/effects.tsx                profundidade de campo, vinheta, granulação, AgX (só nível alto)
  sequence/image-sequence.tsx      quadros pré-renderizados controlados pela rolagem
src/server/landing.ts              monta os dados da abertura a partir do catálogo e da marca
scripts/assets/                    geração de assets: cabide GLB, decodificadores, pôster e quadros
```

## Fluxo de um quadro

```
rolagem ─► ScrollTrigger (scrub) ─► timeline GSAP ─► store.progress
                                          │
                                          └─► camadas DOM (opacidade, deslocamento, pointer-events)

requestAnimationFrame (R3F) ─► Director: sample(store.progress, orientação) ─► FrameState
                                   ├─► CameraRig: amortece posição, alvo e campo de visão
                                   ├─► HeroSheet / ProductStage: vento, cortina, arara
                                   ├─► LightingRig: luz da arara
                                   └─► Effects: distância de foco
```

**Uma fonte de verdade:** o progresso da linha do tempo GSAP. As camadas DOM e a cena 3D leem o mesmo número. As faixas de cada cena estão em `SCENES` e as das camadas de texto em `LAYERS` e `railCaptionRange`, todas em `choreography.ts`. O E2E rola até essas mesmas faixas.

**Nada de estado React por quadro:** rolagem e ponteiro vão para um objeto mutável (`useRef`). A cena lê esse objeto dentro de `useFrame` e muta objetos do three diretamente, como recomenda o React Three Fiber. Por isso a regra `react-hooks/immutability` está desligada só em `src/ui/landing/three/**`, com a justificativa no `eslint.config.mjs`.

**Seção fixa com `position: sticky`:** o GSAP não fixa a seção (sem `pin`). Não há espaçador injetado e nada quebra quando o Next troca de rota.

**Amortecimento com meia-vida:** a câmera nunca salta, mesmo quando o `scrub` do GSAP avança aos trancos. O teste de continuidade da coreografia garante que, entre dois passos de 0,1% de rolagem, a câmera anda no máximo 20 cm.

## Níveis de qualidade

Decididos uma vez por visita em `capabilities.ts` (`decideTier`). Em tempo de execução, o `PerformanceMonitor` da drei primeiro baixa a densidade de pixels e depois rebaixa o nível.

| Nível | Quando | O que roda |
| --- | --- | --- |
| high | Desktop largo, 6+ núcleos, 4+ GB | Sombras 2048, profundidade de campo, vinheta, granulação, poeira, DPR até 1,75, 6 telas de rolagem, Lenis |
| medium | Tablet, notebook modesto, até 4 núcleos | Sombras 1024, poeira, DPR até 1,5, 5,5 telas, Lenis |
| low | Celular, 2 GB ou menos | Sem sombras nem pós-processamento, malha menor, DPR até 1,25, 4 telas, rolagem nativa; a cena carrega na primeira rolagem |
| sequence | Sem WebGL ou com GPU emulada por software, com quadros pré-renderizados da marca | Canvas 2D desenhando o quadro da rolagem |
| poster | A cena falhou em tempo de execução | Imagem parada sob as mesmas camadas DOM |
| static | Movimento reduzido, economia de dados, ou sem WebGL (ou com GPU por software) e sem quadros | Composição estática, sem seção fixa |

**GPU emulada por software conta como sem WebGL:** SwiftShader (Chrome sem GPU ou com a GPU bloqueada), llvmpipe (Linux sem driver) e WARP (Windows) têm WebGL2, mas rodam a cena a poucos quadros por segundo e travam a thread principal. É também o caso do Lighthouse e do PageSpeed Insights, que rodam sem GPU. A detecção lê o nome do renderizador uma vez por visita.

**O rebaixamento em tempo de execução nunca volta ao estático:** trocar o layout no meio da rolagem faria o conteúdo pular.

**Pausa:** `store.paused` congela o relógio do tecido e da poeira; o resto da cena segue a rolagem. O botão fica no canto superior direito da seção, com `aria-pressed` e rótulo fixo.

**Título que cabe na coluna:** `HeroCopy` publica o tamanho da linha mais longa em `--title-chars`, e o CSS limita o título a `100cqi / (--title-chars × --display-glyph)`, com a coluna de texto como contêiner. A marca informa a largura de um caractere do título em `typography.displayGlyphWidth`.

**Falha da cena:** uma barreira de erro (`SceneBoundary`) envolve a cena e o sequenciador. Contexto WebGL recusado, shader que não compila, modelo ou pedaço de JavaScript que não carrega: a cena some, o pôster continua sob as mesmas camadas de texto e a seção ganha `data-scene-failed`. O nível vai direto para quadros ou pôster, sem tentar níveis menores, porque a falha não é de desempenho. Sem a barreira, o React Three Fiber relançaria o erro e a homepage inteira viraria a tela de erro.

**`?qualidade=`:** força um nível (`high`, `medium`, `low`, `sequence`, `poster` ou `static`) para QA, E2E e suporte. O nível forçado não é rebaixado. Movimento reduzido vence o parâmetro.

## Carregamento

1. O servidor entrega o HTML com a seção, o pôster (quando existe) e todos os textos. Isso é o LCP.
2. Na hidratação, `useSyncExternalStore` devolve `"static"` no servidor e o nível real no navegador. A primeira pintura é igual nas duas versões, sem salto.
3. `cinematic/motion.ts` (GSAP, ScrollTrigger e Lenis) é importado assim que a seção monta.
4. `three/scene-root.tsx` (three, React Three Fiber, drei, postprocessing) é importado com `next/dynamic` sem SSR. No desktop, quando o navegador fica ocioso depois do `load`; no celular, na primeira rolagem ou toque, com prazo de 4 s.
5. A cena compila os shaders (`compileAsync`) antes de avisar que está pronta. Só então o canvas entra em fade de 700 ms sobre o pôster.
6. Fora da tela, o laço de desenho para (`frameloop="never"`), e cada material, geometria e textura é descartado ao desmontar.

## Assets 3D

**Formato de entrega:** GLB. Pode vir comprimido com Draco (geometria) ou Meshopt (geometria e animação); os dois decodificadores são servidos pelo próprio domínio:
- Draco: `scripts/assets/copy-decoders.mjs` copia o decodificador do three para `public/draco/` antes de todo build;
- Meshopt: o decodificador vem embutido na drei.

**CSP:** permite `wasm-unsafe-eval`, que libera apenas a compilação de WebAssembly usada pelos dois decodificadores, e `worker-src blob:`, necessário para os Web Workers do Draco.

**Cabide de exemplo:** `public/models/cabide.glb` (11 KB, 2.752 triângulos) é gerado por `npm run assets:hanger`, com Meshopt e quantização. Ele prova o caminho completo: arquivo, decodificador, CSP e cache. Um cabide modelado no Blender substitui o arquivo sem mudar código.

**Modelo 3D de uma peça:** `content.home.experience.rail.models` mapeia o identificador da peça para `/models/<nome>.glb`. O `ProductModel` usa o modelo no lugar do painel com a foto. Recomendações para o export do Blender:
- glTF binário, +Y para cima, escala em metros, origem no ponto de pendurar;
- menos de 30 mil triângulos por peça;
- texturas em WebP ou KTX2, no máximo 2048 px;
- compressão com `gltf-transform optimize --compress meshopt` ou Draco.

**Texturas das fotos:** vêm do otimizador de imagens do Next (`/_next/image`, AVIF ou WebP conforme o navegador), na largura do nível: 1024, 768 ou 640 px.

**Trama:** gerada no shader, sem textura. É nítida em qualquer distância e esmaece antes de virar serrilhado (derivadas `fwidth`). Cada marca escolhe tela ou sarja e a densidade de fios.

## Quadros pré-renderizados

**Quando usar cada abordagem:**

| Abordagem | Quando |
| --- | --- |
| Tempo real | Interação (ponteiro, vento) ou quando a cena é leve. É o caso deste estúdio: 5 a 10 draw calls e poucos milhares de triângulos, com JavaScript e texturas menores que uma sequência de imagens |
| Sequência de imagens | A cena é cara demais para tempo real (tecido simulado de verdade, milhões de polígonos, iluminação global) ou o aparelho não tem WebGL. É o formato de entrega de cinematográficos renderizados no Blender |
| Vídeo | Não é usado: `currentTime` controlado pela rolagem engasga no Safari, e o quadro exato não é garantido |

**Formato:**
- arquivos: `public/landing/<marca>/sequencia/<orientacao>-<000>.webp` (paisagem com 1280 px, retrato com 540 px);
- manifesto: `public/landing/<marca>/sequencia.json`, com `frames`, `pattern`, `width` e `height`.

O `ImageSequence` carrega os quadros de forma esparsa (1 a cada 8, depois 4, 2 e 1) e desenha o quadro carregado mais próximo.

**Geração:** `node scripts/assets/render-landing.mjs <url> <marca>` renderiza o pôster e a sequência a partir da própria cena, num navegador headless. Para substituir por render do Blender, exporte a mesma câmera com os mesmos nomes de arquivo e ajuste o manifesto.

## Configurar a abertura de uma marca

1. **Tipografia:** meça a largura de um caractere do título (largura da linha ÷ tamanho da fonte ÷ caracteres, o maior valor entre as linhas) e informe em `typography.displayGlyphWidth`.
2. **Direção de arte:** `brand.stage`, com fundo, chão, névoa, tecido (cor, trama, fios por metro, vento, brilho), luz (cor principal, preenchimento, direção "side" ou "top", intensidade), cabide e granulação.
3. **Roteiro:** `content.home.experience`, com o título em linhas curtas, textos, 3 a 5 peças do catálogo na ordem da câmera e a coleção de destino.
4. **Assets gerados:** rode o script de pôster e quadros com o servidor da marca de pé.

Sem `stage` ou sem `experience`, a homepage usa a abertura clássica (`Hero`).

## Decisões

| Decisão | Motivo |
| --- | --- |
| React Three Fiber em vez de three puro | A cena vive no ciclo de vida do React (montar, desmontar, Suspense, contexto) sem código imperativo paralelo. A cena anterior, em three puro, foi removida |
| Lightformers em vez de HDRI | Softboxes geradas na hora dão o brilho de estúdio sem baixar HDR, e sem o CDN externo que os presets da drei usam |
| Fundo infinito em Lambert, com emissão | Papel fosco não precisa de PBR. Na tela inteira, isso custava caro por pixel |
| Fotos com cor fiel e sem mapeamento de tons | A peça no painel tem a cor da página de produto; as dobras ainda são sombreadas |
| Lenis só no desktop | Em toque, a rolagem nativa é melhor, e o Lenis desligado evita conflito com a rolagem da barra do navegador |
| Cabeçalho com fundo sólido | Um `backdrop-filter` sobre canvas animado travava o compositor por segundos por quadro na GPU emulada. Em GPU real ele também custa |
