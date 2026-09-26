# Pesquisa visual: landing cinematográfica "tecido em estúdio"

Insumo de direção de arte para a landing com WebGL e scroll das duas marcas (Alvorada e OBRA). A direção em estudo: um pano grande iluminado num estúdio vira cortina, abre e revela uma arara com peças (fotos impressas em painéis de tecido); a câmera percorre a arara com o scroll e a grade comercial em DOM assume no fim. Este documento registra o que foi visto nas referências, separa observação de hipótese e fecha com recomendações numéricas.

## 1. Método

- **Data:** 2026-09-26.
- **Ferramenta:** Playwright 1.60.0 (`playwright-core`) com o Chromium headless shell 1234 (HeadlessChrome 151), WebGL por software (`--use-angle=swiftshader`). Um navegador por vez, fechado ao fim de cada site.
- **Viewports:** 1440x900 (DPR 1) e 390x844 (modo móvel com toque e user agent de iPhone). Em Apple, Cecilie Bahnsen e Igloo também foi aberto um contexto com `prefers-reduced-motion: reduce`.
- **Captura:** 4 ou 5 posições de rolagem no desktop e 2 ou 3 no celular, com eventos de roda do mouse (para acionar scroll virtual) e 2,2 s de espera entre posições. As capturas ficaram no scratchpad da sessão, fora do repositório.
- **Dados extraídos por script:** tipografia computada dos maiores textos (px e vw), posição do cabeçalho, canvas e chamadas a `getContext`, curvas `cubic-bezier` e nomes de ease do GSAP encontrados no CSS e JS baixados, presença de `prefers-reduced-motion` nos arquivos, altura da página em viewports e, na Apple, seções `position: sticky`.
- **Sites abertos (8):** Awwwards, Igloo Inc, Lusion, Miu Miu (campanha imersiva), Apple, Loewe, Nike SNKRS, Cecilie Bahnsen.

**Limitações**

- WebGL por software é muito mais lento que GPU real. A captura desktop da Igloo passou de 4 minutos e a primeira tentativa estourou o tempo; a da Lusion no desktop foi cortada na terceira posição. Nada aqui mede desempenho real.
- Em modo móvel com toque, a roda do mouse não moveu o scroll virtual da Igloo (as capturas mostram só carregamento e cena inicial).
- Sem áudio, sem hover, sem teste em aparelho físico. Localização: a Apple mostrou faixa de região Brasil, a Loewe abriu a loja europeia.
- Banners de cookie foram aceitos quando o botão foi encontrado. Na Loewe desktop o banner surgiu depois e cobre parte das capturas.
- `getContext('webgl')` também aparece em scripts de rastreamento: Nike e Loewe pediram contexto WebGL sem nenhum canvas visível. Por isso "usa WebGL" só foi afirmado quando havia canvas na tela.
- **Bloqueados:** Jacquemus respondeu 403 com a página "Site en cours de maintenance"; Bottega Veneta respondeu 403 do Akamai. Os dois foram verificados por HTTP e não abertos no navegador, para não passar do limite de 8 sites. Foram trocados por Miu Miu e Cecilie Bahnsen, tirados da lista Fashion do Awwwards de 2026.

## 2. Referências

### 2.1 Awwwards, coleções Fashion e Three.js

URL: https://www.awwwards.com/websites/fashion/ e https://www.awwwards.com/websites/three-js/

Observado:
- As duas listas estavam atualizadas (entradas de 25/09/2026 e 26/09/2026). A página Fashion lista 31 projetos, com etiquetas de SOTD, menção honrosa e prêmio de desenvolvimento nas miniaturas.
- Padrões nas miniaturas: foto editorial em tela cheia com título grande em grotesca condensada no centro (Serotoninn, "Introducing New Collection / Silver Lands"); duas fotos lado a lado com serifa pequena para e-commerce (Bread & Boxers); passos numerados 01, 02, 03 num site de carteiras feitas sob encomenda (Kraken, "cut & sewn to order"); cenas 3D de marca de moda feitas por estúdio (Miu Miu "A House That We Shaped", Lacoste "Ace Breaker" e "Polo Factory").
- Tags da entrada da Miu Miu: fullscreen, luxury, storytelling, three-js, webgl. Da Cecilie Bahnsen: e-commerce, minimal, shopify.

Útil: confirma que o 3D premiado em moda em 2026 é quase sempre campanha separada da loja; lojas premiadas são quietas e fotográficas.
Problemas: as miniaturas não mostram movimento; a lista serve para achar referências, não para julgar interação.

### 2.2 Igloo Inc

URL: https://www.igloo.inc

Observado:
- Página inteira num canvas WebGL fixo, `overflow: hidden` no body, altura de 1 viewport (scroll virtual). O JS baixado contém three.js e ScrollTrigger.
- Carregamento: um iglu em arame branco se monta sobre fundo cinza, com números pequenos espalhados.
- Com a roda do mouse, a câmera desce de uma vista aérea para a altura dos olhos e os blocos do iglu se afastam (a construção "se desmonta" com o scroll). Neve, névoa e luz fria difusa.
- Interface como HUD nos quatro cantos: logotipo no alto à esquerda, blocos de texto pequeno no alto à direita e embaixo à esquerda. O texto aparece embaralhado e se resolve aos poucos.
- Eases no JS: `sine.out` (22 ocorrências), `power2.out` (17), `power2.inOut` (16). Nenhuma menção a `prefers-reduced-motion` nos arquivos.
- No celular a mesma cena roda, com o HUD reduzido aos cantos de cima.

Hipótese: o texto embaralhado é desenhado em DOM com troca de caracteres por quadro.
Útil: a câmera que muda de ponto de vista conforme o scroll conta a história sem texto; luz única e difusa com paleta monocromática faz o objeto parecer caro.
Problemas: sem scroll nativo (âncoras, busca na página e leitores de tela sofrem); texto ilegível durante segundos; nenhum tratamento para movimento reduzido.

### 2.3 Lusion

URL: https://lusion.co

Observado:
- Tela preta de carregamento com contador grande de 0 a 100 no canto inferior esquerdo.
- Vídeo-demonstração dentro de um cartão com cantos arredondados que entorta nas bordas enquanto a página rola (a borda inferior esquerda aparece deformada na captura).
- Título "Bold Ideas, Brought to Life" revelado por linha: as palavras sobem de trás de uma máscara, a segunda linha ainda subindo na captura. Margem lateral de 72 px (5vw). Tamanho estimado pela captura: cerca de 150 px (10vw) no desktop; no celular, medido: 78 px (20vw), entrelinha 1,0, espaçamento -0,02em.
- Fio com quatro marcas "+" dividindo a largura em colunas, com "SCROLL TO EXPLORE" no centro. Barra de rolagem própria à direita. Botões em pílula no alto à direita.
- Curvas no CSS: `cubic-bezier(0.35, 0, 0, 1)` (38) e `cubic-bezier(0.4, 0, 0.1, 1)` (28), ambas de saída forte.
- No celular: canvas de 390x844 fixo, scroll virtual, lista de projetos em coluna única. O conteúdo passa por cima do logotipo no topo.

Útil: plano de imagem que se deforma pela velocidade do scroll e volta ao repouso é exatamente o comportamento que um painel de tecido pede; revelação de título por linha com máscara.
Problemas: contador de carregamento antes de qualquer conteúdo; cabeçalho sem fundo encoberto no celular.

### 2.4 Miu Miu, "A House That We Shaped"

URL: https://immersivebags.miumiu.com/

Observado:
- Tela de entrada azul-marinho com "Miu Miu presents A House That We Shaped" em Work Sans 700, caixa alta, 54 px (3,75vw), linhas justificadas num bloco estreito (a última linha com letras espaçadas até a largura do bloco). Aviso para ligar o som e botão "Enter".
- Depois de entrar: sala fotorrealista em vista frontal (parede branca, lambri bege, portas pintadas de vermelho e verde, abajur amarelo, poltrona). Luz de dia suave, sombras baixas e macias. Legenda narrada no rodapé ("Rules are meant to be broken."), botão de som no canto inferior direito.
- Com a roda do mouse a câmera avança um pouco; aparece um ponto de interação sobre os cadernos e um cartão "Pick up the notebook and get started". Nas duas capturas após a entrada nenhuma bolsa ou preço estava visível.
- A classe do `<html>` recebeu `verylow`: o site classifica o aparelho e escolhe a qualidade.
- Curvas no CSS: `cubic-bezier(0.23, 1, 0.32, 1)` (37), `(0.55, 0, 0.1, 1)` (21), `(0.16, 1, 0.3, 1)` (20) e uma com retorno elástico `(0.19, 1.51, 0.29, 0.99)`.

Hipótese: a sala usa iluminação pré-calculada nas texturas (o nível de detalhe das sombras é alto demais para luz em tempo real num aparelho classificado como `verylow`).
Útil: cenário de estúdio com poucos objetos, câmera frontal quase parada e luz macia; classificação de aparelho antes de montar a cena.
Problemas: portão de entrada com som, tarefa ("pegue o caderno") antes de ver o produto; o produto fica escondido atrás da brincadeira.

### 2.5 Apple, AirPods Pro 3

URL: https://www.apple.com/airpods-pro/

Observado:
- Página de 32 viewports no desktop, 16 vídeos, nenhum canvas visível nas posições capturadas.
- Hero: produto em vídeo sobre fundo cinza muito claro, botão de pausa no alto à direita, título "The world's best in-ear Active Noise Cancellation." em SF Pro Display 600, 64 px (4,44vw), espaçamento -0,009em. No canto inferior direito, pílula fixa com preço e botão "Buy".
- Barra de navegação local presa ao topo com "Buy" em azul durante toda a página.
- Seções presas: um elemento de 1 viewport dentro de um pai de 2,5 viewports (1,5 viewport de percurso por cena). Transições de interface: 0,32 s e 0,24 s com `cubic-bezier(0.4, 0, 0.6, 1)`.
- Com movimento reduzido: `<html>` recebe `reduced-motion no-enhanced`; a cena de ondas aparece no quadro final, parada, com o título já no lugar. Nada some.
- No celular o título é centralizado, 32 px (8,2vw), e o botão de pausa continua.

Hipótese: a sequência de imagens clássica foi substituída por vídeo controlado pelo scroll nesta página.
Útil: comércio visível durante todo o cinema (preço e compra fixos); movimento reduzido mostra o estado final da cena, não uma página vazia; percurso curto por cena.
Problemas: 32 viewports é longo demais para uma loja de roupa; faz sentido para explicar um aparelho.

### 2.6 Loewe

URL: https://www.loewe.com/eur/en/home

Observado:
- Cabeçalho preso, 72 px, navegação em texto pequeno (14 px) à esquerda, busca sublinhada e ícones à direita. Margem lateral de 24 px.
- O logotipo em serifa branca, com cerca de um terço da largura, fica sobreposto ao canto superior esquerdo da primeira foto (produto em estúdio, fundo cinza quente).
- Cada história tem título curto ("Bold strides", "Layer up", 22 px) preso ao topo enquanto as fotos passam, com links de categoria à direita marcados por triângulo ("Loafers", "Women's shoes"). Fotos em composição assimétrica (um terço e dois terços, ou metade e metade) sem espaço entre elas.
- No celular: logotipo ocupando a largura toda sobre a foto, barra de navegação azul fixa no rodapé (Menu, busca, conta, sacola), título de capítulo preso com links de categoria, nome da peça sob a foto sem preço.
- Curvas: `cubic-bezier(.4, 0, .2, 1)` na maioria, `(.785, .135, .15, .86)` em algumas. Uma regra `prefers-reduced-motion` no CSS.

Útil: capítulo editorial preso com saída direta para a categoria; tipografia de marca integrada à foto; barra de ações no alcance do polegar.
Problemas: banner de cookie tardio escurece a página inteira no meio da leitura.

### 2.7 Nike SNKRS

URL: https://www.nike.com/launch

Observado:
- Feed em 4 colunas no desktop (margem 48 px, espaço de 12 px), alternando foto de produto em fundo cinza claro e foto de campanha. Legenda em duas linhas: modelo pequeno (14 px) e nome da cor maior (20 px). Cartões editoriais ("This week in SNKRS") misturados aos de produto.
- No celular: coluna única com botão "Buy" em pílula ao lado da legenda de cada cartão. Um banner do aplicativo ocupa cerca de 20% da altura da tela.
- Curvas: `(0.6, 0, 0.1, 1)`, `(0.4, 0, 0.2, 1)`, `(0.86, 0, 0.07, 1)`; três regras de movimento reduzido.

Útil: a história e a compra convivem no mesmo cartão; nome da cor com mais peso que o do modelo.
Problemas: banner de aplicativo cobrindo conteúdo; nenhum cinema, só grade.

### 2.8 Cecilie Bahnsen

URL: https://ceciliebahnsen.com

Observado:
- Faixa "Discover New Arrivals", cabeçalho com logotipo em serifa espaçada no centro, navegação em texto (Shop, Highlights, About) à esquerda e Account, Wishlist, Search, Cart à direita. Margem de 40 px.
- Hero em foto de tela cheia, título pequeno "Fall Winter 2026 New Arrivals" (20 px) e link sublinhado de 13 px, ambos em branco sobre foto clara.
- Depois, blocos em zigue-zague: foto em metade da largura, texto curto na outra metade com muito branco, link sublinhado ("Explore the edit"). Fotos de estúdio com parede branca e piso claro.
- No celular: fotos de categoria centralizadas com cerca de 60% da largura e rótulo embaixo, espaços grandes entre blocos.
- O link de pular conteúdo aparece como "Translation missing: en.general.skip_to_content". Nenhuma regra de movimento reduzido no CSS da página.

Útil: estúdio branco e luz lateral macia como linguagem de foto; ritmo lento com muito espaço.
Problemas: texto branco sobre foto clara com contraste baixo; link de acessibilidade quebrado.

## 3. Padrões consolidados

| Padrão | Onde | Decisão | Aplicação no "tecido em estúdio" |
| --- | --- | --- | --- |
| Compra visível durante o cinema (preço, "Buy" fixos) | Apple, Nike | Adotar | Barra fixa com "Ver coleção" e sacola desde o primeiro quadro; cada painel da arara tem nome, preço e link em DOM |
| Movimento reduzido mostra o quadro final parado | Apple | Adotar | Sem scroll ligado à câmera; hero com a foto do pano iluminado e grade logo abaixo |
| Cena presa com percurso curto (1,5 viewport) | Apple | Adotar | Cada cena entre 0,5 e 1,25 viewport de percurso (seção 4.3) |
| Título revelado por linha com máscara | Lusion | Adotar | Título do hero e rótulos de capítulo; nada de revelar letra a letra |
| Plano de imagem que entorta com a velocidade e volta ao repouso | Lusion | Adaptar | Painéis de tecido ondulam com o scroll e assentam lisos quando a câmera para |
| Câmera que muda de ponto de vista contando a história | Igloo | Adaptar | Do pano visto de perto ao plano aberto da arara, sem cortes; movimento lateral, nunca rotação brusca |
| Estúdio com poucos objetos, câmera frontal, luz macia | Miu Miu, Cecilie | Adotar | Fundo infinito, pano, arara; nada de mobília decorativa |
| Classificar o aparelho antes de montar a cena | Miu Miu | Adotar | Três níveis de qualidade e um nível sem WebGL (seção 4.7) |
| Capítulo preso com links de categoria | Loewe | Adaptar | Rótulo da cena (ex.: "Linho, verão 26") preso no canto com link para a categoria correspondente |
| Tipografia de marca sobre a imagem | Loewe | Adaptar | Título do hero em DOM sobre o canvas, alinhado à grade, nunca desenhado na textura |
| Barra de ações no rodapé no celular | Loewe | Adaptar | "Ver coleção" e sacola no rodapé, respeitando a área segura do iOS |
| HUD de texto técnico nos cantos | Igloo | Adaptar só na OBRA | Contador "Peça 03/06" e referência da peça em Archivo pequeno; Alvorada fica sem HUD |
| Linhas justificadas com letras espaçadas | Miu Miu | Descartar | Chama atenção para o efeito; a OBRA já tem Archivo expandido, que resolve o peso |
| Portão "Enter" com aviso de som | Miu Miu | Descartar | Atrasa o produto; a cena começa sozinha e sem som |
| Contador de carregamento de 0 a 100 | Lusion | Descartar | O hero em DOM aparece de imediato; o 3D entra por cima quando estiver pronto |
| Texto embaralhado que se resolve | Igloo | Descartar | Ilegível por segundos e ruim para leitor de tela |
| Scroll virtual com `overflow: hidden` | Igloo, Lusion | Descartar | Scroll nativo; o canvas lê a posição de rolagem |
| Tarefa antes do produto ("pegue o caderno") | Miu Miu | Descartar | O primeiro produto aparece até 3 viewports de rolagem |
| Zigue-zague de foto e texto com muito branco | Cecilie, Loewe | Adaptar | Depois da arara, uma faixa editorial curta antes da grade, só com conteúdo real |
| Legenda com nome da cor em destaque | Nike | Adaptar | Na arara: nome da peça em cima, cor e preço embaixo, algarismos tabulares |

## 4. Recomendações

### 4.1 Escala tipográfica do hero

Referência medida: Apple usa 4,4vw no desktop e 8,2vw no celular; Lusion cerca de 10vw e 20vw; Miu Miu 3,75vw; Cecilie 20 px fixos. A proposta fica entre Apple e Lusion: o título precisa segurar a tela sem competir com o pano.

| Papel | Alvorada (Instrument Serif / Geist) | OBRA (Archivo) |
| --- | --- | --- |
| Título do hero | `clamp(3.25rem, 1.5rem + 7vw, 9rem)`: 52 px em 390, 125 px em 1440; entrelinha 0,95; espaçamento -0,01em; itálico em no máximo uma palavra | `clamp(2.5rem, 1rem + 6vw, 7.5rem)`: 40 px em 390, 102 px em 1440; largura expandida (125%), peso 800, caixa alta, entrelinha 0,9 |
| Subtítulo | `clamp(1rem, 0.875rem + 0.5vw, 1.25rem)` em Geist 400, até 38 caracteres por linha | Mesmo tamanho, Archivo 500, caixa normal |
| Rótulo de capítulo | 0,8125rem (13 px), Geist 500, espaçamento 0,04em | 0,75rem (12 px), Archivo 600 expandido, caixa alta, espaçamento 0,08em |
| Legenda da peça na arara | Nome 1rem, preço 0,875rem com algarismos tabulares | Igual, com referência da peça em 0,75rem |

- Título com no máximo 3 linhas no celular e 2 no desktop. Na OBRA, 40 px expandido cabe cerca de 11 caracteres por linha em 358 px: escrever o título para isso.
- Todo texto fica em DOM sobre o canvas, com contraste AA contra o quadro mais claro da cena (o pano iluminado é quase branco na Alvorada: título na cor `--c-ink`, nunca branco).

### 4.2 Grid e margens

- Margem lateral: `clamp(1rem, 4vw, 4rem)`, ou seja 16 px em 390 e 58 px em 1440. As referências vão de 24 px (Loewe) a 72 px (Lusion).
- Colunas: 4 abaixo de 768 px, 8 de 768 a 1279 px, 12 a partir de 1280 px. Espaço entre colunas: `clamp(0.75rem, 1.5vw, 1.5rem)` (12 px em 390, cerca de 22 px em 1440).
- Hero da Alvorada: título nas colunas 1 a 7, ancorado embaixo, a duas margens da base. Hero da OBRA: título nas colunas 1 a 10, ancorado em cima, logo abaixo do cabeçalho.
- Cabeçalho transparente sobre o canvas (56 px no celular, 64 px no desktop), com fundo `--c-bg` a partir da entrega para a grade. Nunca deixar conteúdo passar por baixo de um cabeçalho sem fundo (erro visto na Lusion).
- O último quadro da arara coloca os painéis exatamente nas posições da primeira fileira da grade (em 1440, 4 cartões de cerca de 315 px). A troca para a grade vira continuidade e não corte.

### 4.3 Ritmo de cenas

Seção única presa (`position: sticky`, canvas de 100svh) com altura igual à soma dos percursos. Percursos em viewports de rolagem:

| Cena | Desktop | Celular | O que acontece |
| --- | --- | --- | --- |
| 1. Pano no estúdio | 1,0 | 0,75 | Pano parado respirando, título entra por linha; primeiro quadro já é o hero completo |
| 2. Luz varre o pano | 0,75 | fundida com a 3 | A luz principal gira cerca de 30 graus e revela a trama |
| 3. O pano vira cortina e abre | 1,0 | 1,0 | O pano se divide ao meio e corre para os lados; a arara aparece no fundo |
| 4. Travelling pela arara | 2,5 (0,5 por peça, 5 peças) | 1,5 (3 peças) | Câmera lateral; cada painel para lisinho por um instante com nome e preço |
| 5. Entrega para a grade | 0,5 | 0,5 | Painéis assentam nas posições dos cartões; o canvas some e a grade DOM fica |
| **Total** | **5,75** | **3,75** | |

- O primeiro produto aparece com 2,75 viewports no desktop e 1,75 no celular.
- Um link "Pular para a coleção" no início da seção leva direto à grade.
- Não passar de 6 viewports: a Apple usa 32, mas explica um aparelho; roupa se compra olhando a peça.

### 4.4 Linguagem de movimento

Curvas vistas: as referências de cinema usam saída forte (Miu Miu `0.23, 1, 0.32, 1` e `0.16, 1, 0.3, 1`; Lusion `0.35, 0, 0, 1`); as lojas usam `0.4, 0, 0.2, 1` na interface entre 200 e 320 ms (Loewe, Cecilie, Nike; a Apple usa `0.4, 0, 0.6, 1` em 240 e 320 ms).

| Token | Curva | Duração | Uso |
| --- | --- | --- | --- |
| `--ease-reveal` | `cubic-bezier(0.16, 1, 0.3, 1)` | 800 ms linhas de título; 600 ms rótulos e legendas | Entrada de texto e das legendas dos painéis |
| `--ease-settle` | `cubic-bezier(0.35, 0, 0, 1)` | 600 ms | Painel voltando a ficar liso; câmera assentando no fim de uma cena |
| `--ease-cloth` | `cubic-bezier(0.65, 0, 0.35, 1)` | 1200 a 1400 ms | Abertura da cortina quando disparada, não arrastada |
| `--ease-ui` | `cubic-bezier(0.4, 0, 0.2, 1)` | 200 a 280 ms | Menus, gaveta, foco (o projeto já usa 220 ms) |

- **Scroll ligado à cena:** progresso da rolagem com suavização de `lerp` 0,1 por quadro (atraso perto de 150 ms). Acima de 300 ms de atraso a cena parece boiar e descola do dedo.
- **Escalonamento:** 80 ms entre linhas do título; 35 ms entre palavras (máximo 8 palavras); 50 ms entre cartões na grade, até 6 cartões (no máximo 300 ms no total).
- **Respiração do pano:** amplitude de 1,5% da altura do pano, ciclo de 5 a 7 segundos. A velocidade do scroll soma até 3% e volta com `--ease-settle`.
- **Sem retorno elástico:** linho e lona não quicam. Descartar curvas com valores acima de 1 no segundo ponto, como a `0.19, 1.51, 0.29, 0.99` vista na Miu Miu.
- **Diferença entre marcas:** OBRA com durações 25% menores e a curva `cubic-bezier(0.7, 0, 0.3, 1)` no lugar de `--ease-cloth`: movimento mais seco, de máquina. Alvorada nas durações da tabela.

### 4.5 Comportamento de luz

- **Alvorada:** luz principal grande e macia vinda do alto à esquerda, 35 a 45 graus de elevação, quente (5000 a 5500 K); preenchimento a 25 a 35% da principal; sem luz de contorno forte. Fundo infinito em `--c-surface` (#F2F1EC) clareando até `--c-bg` (#FFFFFF) no alto.
- **OBRA:** luz principal estreita e dura de cima, como luminária de oficina, neutra-fria (4000 a 4500 K); preenchimento de 10 a 15% para sombras escuras nas dobras. Fundo em `--c-surface` (#D7D4CC) e `--c-bg` (#E4E2DC). O azul #2A4A8F só em objeto de cena (etiqueta, cabide), nunca na luz.
- **Luz como narrativa só na cena 2:** a varredura revela a trama. Nas cenas 4 e 5 a luz fica fixa, para a cor das peças não mudar enquanto o cliente olha.
- **Custo:** fundo e arara com luz pré-calculada na textura; em tempo real só o pano (uma luz direcional mais um mapa de ambiente). Sombra da arara como textura de contato no chão; sem mapa de sombra no celular.
- **Emenda com a página:** o último quadro precisa ter exatamente a cor de `--c-bg`. O plano de fundo fica fora do mapeamento de tons (`toneMapped: false`) ou o canvas esmaece até transparente sobre o fundo CSS.

### 4.6 Tratamento das fotos no 3D

- Painéis em 4:5, a mesma proporção dos cartões da grade (seção 2.3 do DESIGN.md), para a entrega da cena 5 funcionar.
- Foto sem iluminação da cena (material sem luz ou com influência mínima), `toneMapped: false` e espaço de cor sRGB: a cor da peça no 3D precisa bater com a da página de produto. A luz age só numa camada de trama por cima, com intensidade de 10 a 15%.
- **Zona segura:** os 60% centrais do painel ficam lisos quando a câmera está parada. Ondulação de até 1,5% nas bordas em repouso e até 4% em movimento, assentando em 600 ms. Nunca uma dobra atravessando a peça no quadro de parada.
- Aparência de tecido impresso: bainha levemente mais escura (2 a 3 px), argola ou pregador no topo explicando por que o painel pende da arara. Sem granulação pesada sobre a foto.
- **Texturas:** 1024 px no lado maior no desktop (o painel ocupa uns 420 px de tela em DPR 2), 768 px no celular; WebP ou KTX2, com mipmaps e filtragem anisotrópica 4. Mesmo arquivo de origem das imagens da grade, para não haver salto de cor ou recorte na troca.
- Cada painel tem um espelho em DOM (link para o produto com nome e preço) posicionado pela projeção da câmera, focável pelo teclado, na mesma ordem da grade. Texto nunca vai dentro da textura.

### 4.7 Celular

- DPR limitado a 1,5 (2 só no nível alto); malha do pano com 32x40 segmentos contra 64x80 no desktop; sem pós-processamento; 3 peças na arara em vez de 5.
- Cenas 2 e 3 fundidas; total de 3,75 viewports.
- Alturas em `svh` para a cena não pular quando a barra do navegador recolhe.
- Título em 13vw (52 px), margens de 16 px, "Ver coleção" e sacola fixos no rodapé com `env(safe-area-inset-bottom)`.
- Níveis de qualidade medidos antes de montar a cena (tempo do primeiro quadro, `navigator.deviceMemory`, núcleos): no nível mais baixo, sem WebGL; o hero vira a foto do pano iluminado e a arara vira um carrossel DOM.
- Parar o laço de renderização quando o canvas sai da tela (IntersectionObserver) e quando a aba fica oculta.
- **Movimento reduzido:** seguir a Apple. Nenhuma câmera ligada ao scroll e nenhum pano mexendo; o hero mostra a foto final da cena e a grade vem em seguida. Só esmaecimentos de opacidade de até 150 ms. Isso bate com a regra atual do DESIGN.md de não carregar a cena nesse modo.

### 4.8 Armadilhas a evitar

1. Portão de entrada, aviso de som ou contador de carregamento antes do conteúdo (Miu Miu, Lusion). O hero em DOM é o primeiro quadro e o maior elemento pintado; o 3D chega depois.
2. Scroll virtual (Igloo, Lusion). Quebra âncoras, busca na página, restauração de posição e leitores de tela.
3. Produto escondido atrás de tarefa ou de mais de 3 viewports de cinema.
4. Texto dentro da textura ou embaralhado (Igloo). Todo texto é DOM, legível desde o primeiro quadro.
5. Cor da peça alterada pela luz, pelo mapeamento de tons ou por filtro de "cinema". Quem compra linho verde precisa ver o verde da página de produto.
6. Dobra ou onda passando pela peça quando a câmera para.
7. Texto branco sobre foto ou pano claro (Cecilie). Na Alvorada o pano é quase branco: título em `--c-ink`.
8. Cabeçalho sem fundo com conteúdo passando por baixo (Lusion no celular).
9. Banners (cookie, aplicativo, demonstração) cobrindo o título ou o botão de compra no celular (Nike, Loewe). Reservar o espaço e compor o hero com eles.
10. Curva elástica ou quique em tecido; mola exagerada ao parar.
11. Peso: o JS e CSS baixados pela Igloo passaram de 1,7 MB. Carregar o 3D em pedaço separado, só depois do hero pintado, e com orçamento de texturas medido no celular.
12. Link de acessibilidade quebrado (Cecilie). O "Pular para a coleção" entra nos testes.
