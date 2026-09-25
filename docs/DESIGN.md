# Design

## 1. Pesquisa de referências

### 1.1 Método

- **Data da consulta:** 2026-09-24.
- **Ferramenta:** Playwright (`playwright-core` com Chromium 1234 em modo headless), um navegador por site, fechado ao fim de cada rodada. Script próprio abria cada URL, esperava cerca de 6 s, tentava fechar banners de cookie e de país, rolava a página para disparar carregamento preguiçoso e então capturava.
- **Viewports:** desktop 1440 x 900 e mobile 390 x 844 (emulação de toque, user agent de Chrome Android; o user agent de iPhone foi bloqueado pelo COS já na primeira tentativa).
- **O que foi capturado por página:** screenshot da primeira dobra, screenshot de página inteira (limitado a cerca de 5400 px de altura), texto visível, títulos com fonte e tamanho computados via `getComputedStyle`, links de navegação, altura e posição do cabeçalho e dimensões renderizadas das imagens. No mobile o script tentou abrir o menu; na página de produto tentou escolher um tamanho e clicar em adicionar.
- **Onde ficou o material:** apenas no scratchpad da sessão, fora do repositório. Nenhum texto, marca ou imagem dos sites foi copiado para o projeto.
- **Localização:** o acesso saiu de um IP brasileiro. Vários sites abriram modais de país e mostraram preços em reais; isso afeta o que foi visto.
- **Como ler esta seção:** "Observado" descreve o que apareceu nas capturas. Interpretações que não verifiquei vêm marcadas com **Hipótese:**.

### 1.2 COS

**URLs abertas:** `cos.com/en-us` (home), `cos.com/en-us/women` (home feminina), `cos.com/en-us/women/knitwear` (listagem), uma página de produto de tricô (bloqueada).

**Observado**

- A home geral é uma escolha binária entre feminino e masculino: duas fotos lado a lado ocupando a dobra, com rótulos grandes em caixa alta (35 px, peso 700) sobre a foto, e logo em seguida o rodapé. Não há produto nessa página.
- Um modal de confirmação de país cobria o centro da tela na primeira visita.
- A home feminina abre com uma foto de campanha em sangria total e dois links de texto sobre ela; depois vêm pares de fotos de categoria e um carrossel horizontal de categorias com rótulo abaixo da imagem.
- Tipografia: uma sans única (SuisseIntl) em tudo. Título da listagem em caixa alta, 16 px, peso 600, centralizado. Nome do produto em 13 px peso 400, preço logo abaixo, também pequeno.
- Listagem: breadcrumb pequeno no topo, título centralizado, uma fileira de quatro miniaturas com fotos que funcionam como abas de subcategoria, "Filter & sort" à esquerda e quatro ícones de densidade de grade à direita (1, 2, 4 e 6 colunas).
- Grade de 4 colunas no desktop, sem gutter entre as fotos. Imagem renderizada em 360 x 540, ou seja proporção **2:3**. Fotos de modelo em ambiente com luz natural, não fundo neutro. Nome e preço alinhados à esquerda sob a foto, amostras de cor e "+N" à direita.
- Mobile: 2 colunas, subcategorias em miniaturas roláveis, "Load more products (12/220)" ao fim, contador de itens dentro do botão.
- Fotos abaixo da terceira fileira apareceram como retângulos cinza vazios mesmo depois da rolagem.

**Padrões úteis**

- Subcategoria como primeira decisão da listagem, visível antes do filtro.
- Nome e preço colados, em tamanho de texto de interface, sem competir com a foto.
- Contagem de resultados junto da ação de carregar mais.

**Problemas de usabilidade**

- Home geral sem nenhum produto ou busca visível: um clique a mais obrigatório.
- Seletor de densidade com quatro opções no desktop; o ganho real é pequeno e a variação de 6 colunas deixa nome e preço minúsculos.
- Placeholders cinza sem cor dominante ou esqueleto dão impressão de página quebrada quando a rede demora.

**Limitações de acesso**

- A página de produto devolveu "Access Denied" (403, proteção de borda) em desktop e mobile, em duas tentativas espaçadas, e também via WebFetch. **Página de produto e carrinho não foram analisados.**
- A home com user agent de iPhone também foi bloqueada; o mobile foi visto só com user agent Android.

### 1.3 Aimé Leon Dore

**URLs abertas:** home, `/collections/sweaters` (listagem), `/products/crest-raglan-sweater-2` (produto).

**Observado**

- No desktop a home ficou coberta por um modal de país e, depois de salvo, por uma confirmação que exige outro clique. Ao salvar o país o site redirecionou para a home, perdendo a URL de categoria que eu tinha pedido.
- No mobile a home é uma única foto em tela cheia, com uma linha de texto pequena sobre ela (local e data do dia). A página tem cerca de 875 px de altura: não há conteúdo rolável abaixo.
- Cabeçalho fixo de 61 px, transparente sobre a foto: menu hambúrguer à esquerda também no desktop, logotipo centralizado, busca, conta e sacola à direita.
- Tipografia de interface: Söhne em 12 px com espaçamento de 0,6 px; rótulos de seção em 10 px caixa alta. Logotipo condensado próprio.
- Listagem: breadcrumb "Shop All > Sweaters", "Sort: Recommended" e "Refine" à direita, em texto. Grade de 4 colunas com gutter de cerca de 15 px, packshots sobre fundo cinza muito claro, nome à esquerda e preço à direita na mesma linha. No mobile, 2 colunas com nome e preço empilhados.
- Produto (desktop): três colunas. Nome, preço e acordeões (detalhes, medidas, entrega e devolução) à esquerda; uma única foto no centro; cor em quadradinhos de amostra, tamanho em **menu suspenso** e "Add to bag" à direita. Ao clicar em adicionar sem tamanho, o campo de tamanho ficou rosado e em vermelho, sem texto explicando.
- Produto (mobile): foto, acordeões, e só então nome, preço, cor e tamanho (dois selects lado a lado) e o botão. Logo abaixo, "você também pode gostar" em 2 colunas.

**Padrões úteis**

- Nome e preço na mesma linha no desktop economizam altura e deixam a grade limpa.
- Amostras de cor com a textura real do tecido, não só a cor chapada.
- Cabeçalho mínimo que não disputa com a fotografia.

**Problemas de usabilidade**

- Home sem caminho visível para produto no mobile, fora o ícone de menu.
- Tamanho em select esconde a disponibilidade e custa dois toques.
- Erro de tamanho comunicado só por cor.
- Texto de 10 px e 12 px com espaçamento largo prejudica leitura.
- No layout de três colunas, preço e botão ficam a cerca de 1000 px de distância horizontal um do outro.

**Limitações de acesso**

- O menu mobile não abriu com o clique automatizado. O menu desktop não foi aberto. Carrinho não analisado: nenhum item entrou porque não consegui escolher tamanho no select.
- **Hipótese:** a home de foto única é uma escolha editorial deliberada e muda com frequência; vi um único estado.

### 1.4 Acne Studios

**URLs abertas:** `/us/en/home`, `/us/en/woman/knitwear/` (listagem), uma página de produto de tricô.

**Observado**

- Corpo em Helvetica Now Text 12 px, **caixa alta como padrão do corpo** e espaçamento de 0,3 px. Todos os títulos, inclusive H1 e H2, também em 12 px. A hierarquia vem da posição e das fotos, não do tamanho do tipo.
- Cabeçalho sticky de 60 px, fundo branco. No desktop: categorias à esquerda em texto, logotipo centralizado, busca, ajuda, conta e sacola (com contador "00") à direita, todos com rótulo escrito.
- Home: primeira dobra com o logotipo gigante sobreposto a uma foto de campanha; depois blocos 2 x 1 em sangria total com rótulo pequeno no canto superior esquerdo; "descubra mais" em 4 cartões de categoria com packshot; um bloco de notícias com texto corrido e fotos.
- Listagem: linha de subcategorias em texto logo abaixo do cabeçalho, com seta de voltar para o nível acima. Título pequeno, "37 items" e "Filter" à direita. Grade de 4 colunas sem gutter, fundo cinza claro nas fotos. Nome do produto em **azul**, preço à direita, e uma segunda linha com número de cores e linha da coleção.
- Menu mobile: tela cheia, itens de primeiro nível em caixa alta com seta, separados por fios, seguidos de lista de desejos, conta, lojas, país e canais de atendimento com horário.
- Produto: foto grande ocupando a metade esquerda; à direita nome, preço, cor, "calcular seu tamanho" e guia de medidas, **tamanhos em botões** numa grade de seis células, botão "Add to bag" azul com coração ao lado, depois entrega, embrulho e retirada em loja, descrição e lista de características.
- Ao adicionar sem tamanho: apareceu "Please select size" em vermelho abaixo dos tamanhos **e o texto do botão mudou para "Select a size"**.
- No mobile, um modal de localização ocupou a metade inferior da tela e uma faixa de aviso ficou no topo.

**Padrões úteis**

- Uma cor de acento reservada para o que é clicável (nome do produto, links de ajuda, botão principal). O usuário aprende rápido o que é interativo.
- Validação de tamanho em dois lugares: mensagem junto do campo e rótulo do botão.
- Rótulos escritos nos ícones do cabeçalho no desktop.
- Subcategorias como links de texto com caminho de volta.

**Problemas de usabilidade**

- Caixa alta em 12 px como padrão de leitura cansa em descrições e listas.
- Todos os títulos no mesmo tamanho: leitor de tela recebe uma hierarquia correta, mas o olho não.
- Modal de localização cobrindo metade da página de produto no mobile.

**Limitações de acesso**

- Carrinho não analisado: o clique automatizado não selecionou tamanho, então nada foi adicionado.

### 1.5 ARKET

**URLs abertas:** `/en-eu/` (home), `/en-eu/women/clothing/knitwear/` (listagem), uma página de produto de tricô.

**Observado**

- Faixa de anúncio no topo, depois cabeçalho em duas linhas: logotipo à esquerda, **campo de busca largo e sempre visível** no centro, conta, favoritos e sacola à direita; na segunda linha as quatro divisões (feminino, masculino, infantil, casa) à esquerda e café, atendimento e país à direita. Um fio preto de 2 px fecha o cabeçalho.
- No mobile a busca continua visível como campo logo abaixo do logotipo.
- Home: duas fotos de "novidades" lado a lado com rótulo em caixa branca; "descubra mais" com 4 cartões (infantil, casa, viagem, café); bloco editorial com 4 cartões de artigo contendo título, categoria e data em caixa alta miniatura e resumo.
- Um cartão de programa de fidelidade aparece por cima do conteúdo no canto inferior direito, em todas as páginas visitadas.
- Menu mobile: quatro divisões em letras grandes com seta, separadas por fios; abaixo, links secundários.
- Listagem: breadcrumb em caixa alta pequena; título em tamanho real de título; parágrafo de descrição truncado com "leia mais"; **chips de subcategoria** (o ativo em preto); botões "Filter +" e "Sort by" com borda; "202 items"; "View" à direita.
- Grade de 4 colunas com gutter mínimo, fotos de modelo em fundo neutro claro, nome em caixa alta pequena centralizado, preço abaixo, amostras de cor. **Um cartão editorial ocupa 2 x 2 células** dentro da grade.
- Produto: miniaturas em coluna à esquerda, foto grande, painel à direita com nome e preço centralizados, cor, tamanhos em botões quadrados, "encontrar seu tamanho" e "encontrar na loja", botão preto "Select size" com coração, acordeões de material e detalhes.
- Ao adicionar sem tamanho: a área de tamanhos ganhou fundo rosado com "Please select your size" e o botão já mostrava "Select size".
- Produto mobile: foto, nome, preço, cor, tamanhos, botão; depois carrossel de produtos parecidos com **"+" para adicionar direto do cartão** e "combine com" com duas peças.

**Padrões úteis**

- Busca como campo visível, não ícone. Para catálogo grande isso encurta a descoberta.
- Chips de subcategoria mais contagem de itens mais filtro e ordenação numa linha só.
- Cartão editorial inserido na grade, quebrando o ritmo sem tirar o usuário da listagem.
- Área de tamanho que muda de estado inteiro quando falta escolha, não só o botão.
- "Combine com" na página de produto, com poucas peças.

**Problemas de usabilidade**

- Cartão de fidelidade sobreposto e persistente cobre produtos e o botão de favoritos.
- Nome do produto em caixa alta de 10 a 11 px na grade.
- Seta "+" de adicionar direto do carrossel sem escolha de tamanho visível. **Hipótese:** abre um seletor; não testei.

**Limitações de acesso**

- A home desktop foi bloqueada (403) com user agent de Chrome desktop e liberada quando usei um user agent Chrome sem marca de mobile. A proteção de borda parece reagir ao cabeçalho do navegador, não ao IP.
- Carrinho não analisado: nenhum tamanho foi efetivamente escolhido.

### 1.6 TOTEME

**URLs abertas:** `toteme.com` (redirecionou para `/en-int`), `/en-int/collections/knits` (listagem), `/en-int/products/structured-crew-knit-ecru` (produto).

**Observado**

- Tipografia própria (Toteme Sans) em peso 300 praticamente em tudo, com tamanhos entre 12 e 18 px. O logotipo é a única peça grande.
- Cabeçalho fixo de 72 px, transparente sobre a foto da home: três links de texto à esquerda, logotipo no centro, busca e conta em texto e dois ícones à direita.
- Home: grade 2 x 2 de fotos em sangria total, cada uma com título e subtítulo centralizados na parte de baixo, sobre a própria foto; depois uma única foto menor centralizada com legenda para a linha masculina; rodapé em quatro colunas de texto pequeno.
- Menu mobile: abas feminino e masculino no topo, lista de coleções em texto, depois categorias com seta, depois serviços e login.
- Listagem: breadcrumb à esquerda, "View 2 4 8" e "Filter" à direita, grade de 4 colunas com margem lateral de 32 px e **sem gutter** entre fotos. Primeira foto de cada cartão com modelo, outras em packshot; setas de galeria dentro do cartão. Nome e preço centralizados, preço em 12 px, "2 colors" abaixo. Imagem renderizada em 344 x 459, cerca de **3:4**.
- No mobile, "View" e "Filter" ficam numa barra fixa na base da tela.
- Produto: foto à esquerda com margem, painel à direita com nome, preço, favoritos, miniaturas das cores, tamanhos como texto simples sem caixa, "True to size", botão "Add to cart" com borda fina, descrição curta e quatro acordeões com seta.
- Produto mobile: foto, nome, preço e **botão fixo na base**.
- Foram encontrados **sete H1 com o texto do logotipo** na mesma página.
- Um banner de instalação de aplicativo cobriu a base da listagem mobile.

**Padrões úteis**

- Grade 2 x 2 na home como mapa das coleções: cada foto é uma porta de entrada.
- Barra fixa de filtro e visualização no mobile.
- Botão de compra fixo no mobile.
- Informação da página de produto reduzida ao essencial com acordeões.

**Problemas de usabilidade**

- Peso 300 em 12 px sobre branco: baixo contraste percebido.
- Tamanhos como texto sem caixa: área de toque pequena e estado selecionado pouco distinto.
- Múltiplos H1 quebram a estrutura para leitor de tela.
- Título sobre foto sem véu escuro depende da foto ter área calma.

**Limitações de acesso**

- O clique automatizado em "adicionar" acionou o marcador de favoritos em vez do carrinho; o carrinho não foi analisado.

### 1.7 Osklen (referência brasileira)

**URLs abertas:** `osklen.com.br` (home), `/new-in-feminino` (listagem), `/calca-tokyo-raw-linen-natural-77280-51/p` (produto).

**Observado**

- Estava em liquidação: faixa com cupom, título da página citando descontos, item de menu "Bazar" em vermelho.
- Cabeçalho em **pílulas flutuantes com fundo translúcido**: navegação à esquerda, logotipo no centro, busca em campo, conta, favoritos e "Bag" à direita. Fundo geral cinza muito claro (#F8F8F8), cartões com cantos arredondados.
- Tipografia: Suisse Intl na interface e Neue Haas Grotesk Display nos títulos editoriais (22 px, peso 500). Nome de produto em 14 px peso 500.
- Home: banner arredondado, dois cartões grandes de feminino e masculino, uma frase de manifesto da marca, chips de categoria e um carrossel de produtos com nome e preço na mesma linha. Uma área de cerca de 500 px ficou cinza vazia depois da rolagem.
- Os cartões de produto da home trazem botões ocultos de adicionar à sacola com tamanhos P, M e G (vistos no DOM, não na tela).
- Menu mobile: painel arredondado com as cinco entradas principais em corpo grande e uma seção "Mais" com conta, pedidos e lista.
- Listagem: breadcrumb, título da coleção, parágrafo em corpo grande, chips de subcategoria, "Filtrar", "Ordenar" em select e "Grid 2 4 8". Grade de 4 colunas com fotos em fundo cinza.
- Produto desktop: foto de corpo inteiro e detalhe lado a lado; o **painel de compra fica sobreposto à foto** no canto direito, com nome, preço, descrição truncada, cor, "descubra seu tamanho", tamanhos em círculos, "Adicionar à Sacola" e **"Em até 6x de R$ ... sem juros"** abaixo do botão.
- Produto mobile: foto, cartão com nome e preço, e barra fixa na base com "Selecione um tamanho" e a linha de parcelamento.
- Clicar no ícone de favoritos sem login abriu um modal pedindo acesso à conta.

**Padrões úteis**

- Parcelamento escrito junto do botão de compra, em frase curta e completa.
- Barra fixa no mobile que já diz a próxima ação ("Selecione um tamanho") enquanto não há tamanho.
- Chips de subcategoria em português, com "Ver tudo" como primeiro chip ativo.

**Problemas de usabilidade**

- Painel de compra sobre a foto esconde parte do produto justamente na página de produto.
- Navegação em inglês (New In, Men, Women, Shoes, Bag) num site brasileiro.
- Pílulas translúcidas sobre fotos claras perdem contraste.
- Favoritos que exigem login só depois do clique.

**Limitações de acesso**

- No desktop, o clique automatizado de tamanho levou a outra listagem; a interação de carrinho não foi concluída. O carrinho não foi analisado.

### 1.8 Handred (referência brasileira)

**URLs abertas:** `handred.com.br` (home), `/collections/camisas` (listagem), `/collections/colecao-destaque/products/bermuda-linho-fole` (produto e carrinho).

Escolhida por trabalhar linho e peças leves com tom de ateliê, o território mais próximo da Alvorada.

**Observado**

- Faixa preta de anúncio no topo; cabeçalho com cinco links de texto à esquerda (um deles, de liquidação, em vermelho), logotipo em serifa espaçada no centro e três ícones à direita.
- Um pop-up de cadastro com e-mail, celular e data de aniversário cobriu a primeira dobra no desktop.
- Títulos em serifa (Plantin, 30 px, peso 700), interface em Helvetica. Nome do produto também em serifa.
- Home: carrossel de campanha, grade de 3 colunas de produtos com modelo em fundo cinza, preço com **parcelamento em cinza na mesma linha**, bolinha de cor; depois blocos meio a meio de ateliê, blog e lojas físicas com fotos de ambiente em luz quente.
- Listagem: carrossel de categorias com foto e nome em serifa grande sobre a imagem, título "CAMISAS" centralizado, "Refinar" à esquerda, "54 produtos" no centro e ordenação à direita. Grade de 3 colunas com cantos levemente arredondados e selo "Em breve".
- Produto: foto grande à esquerda (cerca de 52% da largura); à direita, coleção em caixa alta pequena, nome em serifa, preço e "ou 6x R$ ... sem juros", cor com bolinha e nome, tamanhos em texto (indisponíveis em cinza claro), quantidade, "Comprar" em pílula escura, **campo de CEP e "Calcular frete"**, descrição, composição e cuidados em texto corrido.
- Carrinho em **painel lateral** que abre após adicionar: miniatura, nome, cor e tamanho, preço, controle de quantidade, "Eliminar", um produto sugerido com botão de adicionar, subtotal e "Finalizar pedido" fixos na base.
- No painel, o preço da linha (com desconto de campanha) era diferente do subtotal (preço cheio), sem explicação. A frase sob o subtotal estava em inglês.
- Botão flutuante de WhatsApp fixo no canto inferior direito em todas as páginas.

**Padrões úteis**

- Serifa nos títulos e sans na interface: combinação que funciona para roupa leve e tom de ateliê.
- Painel lateral de carrinho com subtotal e ação principal presos à base.
- Blocos de ateliê e loja física ligam a peça a um lugar e a um processo.
- Variante escolhida escrita por extenso no carrinho ("cor / tamanho").

**Problemas de usabilidade**

- Preço da linha e subtotal incoerentes no carrinho: quebra a confiança no momento da decisão.
- Tamanho indisponível indicado só por cinza claro.
- Mistura de idiomas no carrinho.
- WhatsApp flutuante disputa espaço com botões fixos e cobre conteúdo no mobile.
- Pop-up de cadastro pedindo celular e aniversário antes de qualquer interação.

**Limitações de acesso**

- Nenhuma. O carrinho foi o único efetivamente analisado entre os sete sites.

### 1.9 Adotar, adaptar, descartar

As decisões respeitam o [escopo](SCOPE.md): favoritos, newsletter, conta, cupons e cálculo de frete próprio estão fora da primeira versão, e parcelamento só aparece quando configurado pela empresa.

| Decisão | Veredito | Origem | Como fica no Costura |
| --- | --- | --- | --- |
| Grade de 4 colunas no desktop e 2 no mobile | Adotar | COS, ALD, Acne, ARKET, TOTEME | 4 colunas a partir de 1280 px, 3 entre 768 e 1279, 2 abaixo. Gutter como token da marca |
| Proporção da foto de produto | Adaptar | 2:3 no COS, 3:4 na TOTEME, 4:5 no ALD | Token `--ratio-product` com padrão **3:4**. Alvorada 4:5, OBRA 3:4. `aspect-ratio` fixo no contêiner para não haver salto de layout |
| Nome e preço sob a foto | Adotar | Todos | Nome e preço na mesma linha no desktop, empilhados no mobile. Preço sempre visível, nunca só no hover |
| Contagem de cores no cartão | Adotar | COS, Acne, TOTEME | "3 cores" em texto; bolinhas apenas se a marca pedir, com nome acessível |
| Subcategorias em chips no topo da listagem | Adotar | ARKET, Osklen, Acne, COS | Chips roláveis no mobile, "Todas" como primeiro item ativo |
| Contagem de resultados | Adotar | Acne, ARKET, Handred | "54 peças" ao lado de filtro e ordenação |
| Filtro em painel | Adotar | Todos | Painel lateral no desktop, folha em tela cheia no mobile, com "Ver N peças" como ação de fechar. Estado na URL |
| Barra fixa de filtro e ordenação no mobile | Adaptar | TOTEME | Barra fixa só na listagem e só quando o usuário já rolou além dos chips |
| Seletor de densidade de grade | Descartar | COS, TOTEME, Osklen | Densidade fixa por breakpoint. Menos estado, menos teste visual |
| Paginação | Adaptar | COS usa "carregar mais" com contador | Paginação numerada, conforme escopo, com "página 2 de 9" e contador visível |
| Cartão editorial dentro da grade | Adaptar | ARKET | Opcional por coleção, no máximo um a cada 12 produtos, nunca na primeira linha |
| Busca como campo visível | Adaptar | ARKET | Campo visível no desktop quando a marca tem espaço (OBRA). Na Alvorada, ícone com rótulo "Buscar" por causa do logo longo |
| Ícones do cabeçalho com rótulo | Adotar | Acne, TOTEME | Rótulo escrito no desktop; no mobile só ícone com `aria-label` e contador da sacola |
| Menu mobile em lista grande com drill-down | Adotar | ARKET, Acne, TOTEME | Primeiro nível em corpo grande com seta, segundo nível em tela própria com "Voltar" |
| Página de produto com galeria à esquerda e compra à direita | Adotar | Acne, ARKET, TOTEME, Handred | Painel de compra sticky no desktop. Nunca sobreposto à foto |
| Layout de três colunas no produto | Descartar | ALD | Preço e botão ficam longe demais |
| Tamanhos em botões visíveis | Adotar | Acne, ARKET, Osklen | Grade de botões com 44 px de altura mínima; esgotado riscado, com texto "esgotado" para leitor de tela, não só cor |
| Tamanho em menu suspenso | Descartar | ALD | Esconde disponibilidade |
| Validação de tamanho em dois lugares | Adotar | Acne, ARKET | Mensagem junto do grupo de tamanhos e rótulo do botão "Escolha um tamanho" enquanto faltar escolha. Foco vai para o grupo |
| Botão de compra fixo no mobile | Adotar | TOTEME, Osklen | Barra fixa com preço e ação; some quando o botão original está visível |
| Parcelamento junto do preço | Adaptar | Osklen, Handred | Só quando a empresa configurar. Frase completa sob o preço, mesma cor do texto secundário, sem abreviar |
| Cálculo de frete por CEP no produto | Descartar nesta versão | Handred | Fora do escopo. Registrar como candidato futuro |
| Carrinho em painel lateral | Adotar | Handred | Painel com linhas por variante, quantidade, remover, subtotal e ação presos à base. Anúncio em região viva ao adicionar |
| Sugestão de produto dentro do carrinho | Descartar | Handred | Distrai no momento de fechar. "Combine com" fica na página de produto |
| "Combine com" na página de produto | Adaptar | ARKET | Até 3 peças da mesma coleção, sem adicionar direto do cartão |
| Coerência de preço no carrinho | Adotar como regra | Problema visto na Handred | Preço da linha, preço riscado e subtotal vêm do mesmo cálculo do servidor; desconto aparece como linha própria |
| Uma cor de acento só para interação | Adaptar | Acne | Cada marca define `--color-action`; usada em links, foco e botão principal, nunca em decoração |
| Grade 2 x 2 de coleções na home | Adaptar | TOTEME | Bloco de categorias da home com títulos sobre véu escuro ou abaixo da foto, conforme contraste |
| Modais de país, cadastro e fidelidade na chegada | Descartar | COS, ALD, Acne, ARKET, Handred | Nenhum modal na primeira visita. Avisos de demonstração em faixa fixa, sem bloquear |
| Home sem produto ou sem rolagem | Descartar | COS, ALD | A primeira dobra sempre tem caminho para o catálogo |
| Caixa alta como corpo de texto | Descartar | Acne | Caixa alta só em rótulos curtos, com no mínimo 12 px e espaçamento positivo |
| Texto de interface abaixo de 12 px | Descartar | ALD, ARKET | Mínimo de 12 px para rótulos, 14 px para corpo, 16 px em campos de formulário no mobile |
| Peso 300 em texto pequeno | Descartar | TOTEME | Peso mínimo 400 abaixo de 16 px |
| Placeholders cinza vazios | Adaptar | COS, Osklen | Fundo na cor de superfície da marca com proporção reservada e texto alternativo; sem blocos de altura indefinida |
| Um H1 por página | Adotar como regra | Problema visto na TOTEME | Logo não é H1; H1 é o título da página |
| Navegação em inglês | Descartar | Osklen, Handred | Todo texto de interface em português |
| Botão flutuante de atendimento | Descartar | Handred | Canal de atendimento no rodapé e na página de atendimento, sem sobrepor barras fixas |
| Favoritos no cabeçalho e no cartão | Descartar nesta versão | Vários | Fora do escopo; nenhum ícone sem função |

### 1.10 Implicações para a direção visual

O core precisa expor como tokens pelo menos: proporção da foto, gutter da grade, raio de canto, cor de ação, par de fontes (título e interface), largura e posição do logo e estilo do título sobre foto. Tudo abaixo cabe nesses tokens, sem condicional de marca em componente.

#### Alvorada Costura Brasileira

**Território.** Linho, algodão e peças leves, luz natural, tom de ateliê. As referências mais próximas são a Handred (serifa com sans, ambiente de ateliê) e a TOTEME (calma, pouca informação por tela), sem herdar o peso 300 nem os títulos sobre foto sem véu.

**Cabeçalho e logo.** Um logo horizontal longo não cabe centralizado com ícones dos dois lados em 360 px. Recomendo logo **alinhado à esquerda** em todos os breakpoints, com largura máxima de cerca de 168 px no mobile, e ícones de busca, sacola e menu à direita. No desktop, navegação principal em segunda linha ou à direita do logo; não centralizar. **Hipótese:** o logo terá uma versão reduzida ou um monograma; se não tiver, testar em 360 px antes de fechar a altura do cabeçalho.

**Cor.** Fundo em branco quebrado quente, texto em marrom quase preto, superfície de foto em areia clara para os placeholders. Cor de ação em terracota escurecida o bastante para passar 4,5:1 sobre o fundo. Sem preto puro.

**Fotografia e grade.** Proporção 4:5, luz natural, modelo em ambiente na primeira foto e peça plana ou em cabide na segunda. Gutter de 8 a 12 px e cantos retos ou de 2 px. Home com uma abertura editorial em meia altura (não tela cheia) seguida de categorias com foto e título abaixo da imagem.

**Tipografia prevista: Instrument Serif nos títulos e Geist na interface.**

- Concordo com **Instrument Serif** para títulos, com duas ressalvas. Ela tem só peso regular e itálico, então não serve para nada abaixo de uns 28 px nem para ênfase por peso; o itálico pode fazer o papel de destaque. Também é condensada, o que ajuda o nome longo da marca em títulos de coleção.
- **Geist** funciona na interface: legível em tamanho pequeno, tem algarismos tabulares para preços e carrinho, e é OFL. O risco é soar técnica demais para o tom quente. Se o teste com páginas reais confirmar isso, a alternativa OFL é **Hanken Grotesk**, com proporções mais humanas e pesos de 100 a 900.
- Registro: hoje `brands/alvorada/fonts.ts` carrega **Bricolage Grotesque** como família única. Isso diverge da previsão. Bricolage tem personalidade forte e eixo óptico, mas é uma grotesca com traço marcado, mais próxima de um território jovem e gráfico do que de linho e luz natural. Recomendo voltar ao par Instrument Serif mais Geist.
- Regra de uso: serifa só em H1, H2 e títulos de coleção; preço, botões, filtros, tamanhos e carrinho sempre na sans.

#### OBRA

**Território.** Utilitário e workwear urbano, tom seco, alto contraste. As referências mais próximas são o ARKET (fios pretos, busca visível, informação organizada) e a COS (uma família só, fotos urbanas), com a clareza de estados do Acne.

**Cabeçalho e logo.** Logo compacto permite o padrão centralizado ou à esquerda com **campo de busca visível** no desktop. Um fio preto de 1 a 2 px separando cabeçalho e conteúdo reforça o caráter de ficha técnica.

**Cor.** Branco e preto próximos do puro, cinza concreto para superfícies de foto. Cor de ação num laranja de segurança escurecido, usado só em botão principal, foco e estados; nunca como fundo de seção. Alvo de contraste AAA no texto de corpo.

**Fotografia e grade.** Proporção 3:4, packshot sobre fundo neutro como primeira foto e modelo em rua como segunda. Grade sem gutter ou com 1 px de fio, cantos retos. Na página de produto, composição e gramatura em lista tipo tabela, com rótulo e valor alinhados.

**Tipografia prevista: Archivo em larguras variadas.**

- Concordo. Archivo é OFL, variável em peso (100 a 900) e em largura (62 a 125), e uma família só cobre título expandido, rótulos condensados e corpo em largura normal. Isso bate com `brands/obra/fonts.ts`, que já usa o eixo `wdth`.
- Cuidados: largura condensada em caixa alta abaixo de 14 px perde legibilidade; usar largura 100 para corpo, preço e tamanhos, e reservar 112 a 125 para títulos e 75 a 87 para rótulos curtos.
- Segunda família opcional: **IBM Plex Mono** (OFL) só para dados técnicos, como referência, composição e medidas. Reforça o tom de etiqueta de fábrica sem competir com Archivo. Se o objetivo for ficar numa família só, Archivo com algarismos tabulares resolve preços e tabelas.

## 2. Direção visual implementada

A pesquisa acima é o insumo; esta seção registra o que foi construído e onde a implementação divergiu das recomendações, com o motivo.

### 2.1 Revisão antes de construir

O primeiro rascunho da Alvorada era fundo creme, serifa de alto contraste e acento terracota; o da OBRA, preto com laranja. Os dois caíam em combinações muito repetidas em lojas genéricas. Revisão:

- **Alvorada:** fundo branco de vitrine (#FFFFFF), superfície de linho cru (#F2F1EC), tinta verde escura (#22261F) e acento verde-folha (#2F5D46). A recomendação de terracota foi descartada por esse motivo.
- **OBRA:** cinza-concreto (#E4E2DC), preto (#141414) e acento azul de macacão de trabalho (#2A4A8F). O laranja de segurança recomendado foi trocado; o amarelo de segurança (#F2C230) ficou só na faixa de aviso de demonstração, onde sinalizar é o objetivo.

### 2.2 Composição de homepage e produto, e revisão

A homepage e a página de produto foram montadas primeiro, fotografadas em 360, 390, 768, 1280 e 1440 px e revisadas antes das demais páginas. Correções feitas nessa revisão:

| Problema visto | Correção |
| --- | --- |
| As duas marcas em grotesca sem serifa: a prova de troca de identidade ficava fraca | Alvorada passou a Instrument Serif + Geist, como a pesquisa recomendou |
| Fileira de categorias colada na borda esquerda no celular (scroll-snap ignora o padding) | `scroll-padding` no contêiner |
| Produto com uma foto só deixava um vão à direita no carrossel do celular | Foto única ocupa a largura toda |
| Três categorias numa grade de quatro colunas deixavam um buraco | A grade acompanha o número de categorias |
| Aviso de tamanho só em um lugar | Aviso junto do grupo e rótulo do botão "Escolha um tamanho", foco no grupo |
| Botão de compra some ao rolar pelos detalhes no celular | Barra de compra presa à base da tela no celular |
| Menu do celular repetia "Todos os produtos" | Links do rodapé que já estão no menu principal saem da lista secundária |

### 2.3 Recomendações da pesquisa que não foram seguidas

| Recomendação | Decisão | Motivo |
| --- | --- | --- |
| Proporção 3:4 na OBRA | 4:5 nas duas | As fotos de demonstração foram recortadas em 4:5; a proporção fica fixa no componente. Uma marca com fotos 3:4 precisaria de um token de proporção, ainda não criado |
| Logo da Alvorada à esquerda no celular | Centralizado com logo compacto | O logo compacto tem 142 px e cabe com os ícones em 360 px (verificado na captura) |
| Menu do celular com drill-down | Lista de um nível | A navegação tem no máximo 5 itens por marca; um segundo nível não teria conteúdo |
| Chips de subcategoria e cartão editorial na grade | Não implementados | O catálogo de demonstração não tem subcategorias; cartão editorial sem conteúdo real seria enfeite |
| Barra de filtro fixa no celular | Botão "Filtrar" no topo da lista | Catálogos pequenos; entra se a listagem crescer |
| IBM Plex Mono para dados técnicos na OBRA | Não usada | Uma família só (Archivo) resolve com algarismos tabulares; menos fonte para carregar |
| Rótulos de texto nos ícones do cabeçalho no desktop | Só ícones com nome acessível | Espaço para a navegação principal em 1280 px. Candidato a revisão com teste de usuário |

## 3. Tokens

Definidos em `brands/<marca>/brand.ts`, convertidos em variáveis CSS por `src/core/brand/tokens.ts` e lidos pelo Tailwind via `@theme` em `src/app/globals.css`.

| Token | Alvorada | OBRA | Uso |
| --- | --- | --- | --- |
| `--c-bg` | #FFFFFF | #E4E2DC | Fundo |
| `--c-surface` | #F2F1EC | #D7D4CC | Rodapé, blocos editoriais, fundo de foto |
| `--c-ink` | #22261F | #141414 | Texto |
| `--c-muted` | #585E56 | #46443F | Texto secundário (AA sobre fundo e superfície) |
| `--c-line` | #D6D5CD | #ABA79D | Fios e bordas |
| `--c-accent` / `--c-accent-ink` | #2F5D46 / #FFFFFF | #2A4A8F / #FFFFFF | Botão principal, seleção |
| `--c-focus` | #2F5D46 | #2A4A8F | Anel de foco (2 px, 3 px de afastamento) |
| `--c-danger`, `--c-success` | #A3261B, #2B6A3D | #9A1B12, #1F5A34 | Erros e confirmações |
| `--c-notice` / `--c-notice-ink` | #22261F / #F2F1EC | #F2C230 / #141414 | Faixa de demonstração |
| `--radius` | 2 px | 0 | Botões, campos, diálogos |
| `--button-case` | normal | caixa alta | Botões |

Os pares de contraste são verificados em teste (`tests/unit/brands.test.ts`) a cada mudança.

## 4. Tipografia

| | Alvorada | OBRA |
| --- | --- | --- |
| Títulos | Instrument Serif 400, espaçamento −0,015 em, escala 1,08 | Archivo 800 a 125% de largura, caixa alta, escala 0,84 |
| Interface e texto | Geist | Archivo a 100% |

Escala de títulos fluida com `clamp()`, multiplicada pela escala da marca:

| Classe | Mínimo | Máximo | Uso |
| --- | --- | --- | --- |
| `display-xl` | 40 px | 100 px | Abertura da homepage, 404 |
| `display-lg` | 32 px | 60 px | Título de página, produto |
| `display-md` | 24 px | 36 px | Títulos de seção |

Corpo de 16 px, texto de leitura de 17 px com entrelinha 1,65 e largura máxima de 38 rem (cerca de 70 caracteres). Metadados em 13 px, nunca abaixo de 12 px. Preços com algarismos tabulares. Campos com 16 px para o iOS não aplicar zoom.

## 5. Texto

Regras aplicadas em `src/ui/copy.ts` e nos conteúdos das marcas:

- Português brasileiro direto, sem travessão e sem frase de efeito.
- Botão diz o que acontece: "Adicionar à sacola", "Finalizar compra", "Aceitar novo preço", "Ajustar para 2".
- Erro diz o que houve e o que fazer: "Só restam 2 unidades. Ajuste a quantidade para seguir."
- Nenhuma condição comercial, avaliação, urgência ou benefício inventado. Estoque baixo só aparece com o número real ("Restam 2 unidades").
- Composição e cuidados das marcas fictícias são dados de demonstração, e o site inteiro avisa isso.
- "Sacola" em toda a interface (não "carrinho"); a URL `/carrinho` foi mantida por ser mais conhecida.

## 6. Movimento

- Gaveta e menu deslizam em 220 ms; detalhes giram o ícone de mais. Nada anima sozinho, exceto a cena WebGL da Alvorada, que tem botão de pausa.
- `prefers-reduced-motion: reduce` zera transições e animações e impede a cena de carregar.
- A cena usa a foto da trama como textura num plano que ondula; a foto estática é o conteúdo e continua lá se o WebGL faltar.
