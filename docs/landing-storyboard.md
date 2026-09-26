# Storyboard da abertura

A abertura da homepage é uma seção fixa na tela enquanto a pessoa rola. O progresso da rolagem (0 a 1) é a linha do tempo. As faixas abaixo são as de `SCENES` em `src/core/landing/choreography.ts`, e o código segue este documento.

**Conceito: tecido em estúdio.** O protagonista é o tecido, a matéria-prima da roupa. Um pano grande respira no estúdio, a câmera chega perto da trama, o pano abre como cortina e revela uma arara com peças do catálogo real. A câmera percorre a arara, recua para mostrar a coleção e devolve a tela para a loja.

**Intenção por etapa:**
- impacto: título e pano;
- curiosidade: a trama de perto;
- exploração: a cortina;
- produto: a arara;
- coleção: o recuo;
- conversão: a grade DOM.

A mesma cena serve às duas marcas. Luz, tecido e fundo vêm de `brand.stage`, e o texto vem de `content.home.experience`.

| | Alvorada | OBRA |
| --- | --- | --- |
| Luz principal | Janela lateral baixa, quente (#FFE6C4) | Luz dura de cima, fria (#F2F5FF) |
| Tecido | Linho cru, tela simples, vento forte | Lona cáqui, sarja diagonal, vento fraco |
| Fundo | Branco, chão levemente quente | Concreto claro, névoa mais densa |
| Cabide | Latão escovado | Preto fosco |
| Título | Serifa, caixa normal | Archivo expandido, caixa alta |

Comprimento da rolagem: 6 telas no desktop, 5,5 no tablet e 4,5 no celular.

---

## Cena 01: Abertura (0 a 12%)

- **Estado inicial:** estúdio de fundo infinito na cor de fundo do site. Pano de 2,3 × 3,25 m pendurado por um trilho invisível, à direita do centro.
- **Câmera:** 7,4 m, levemente abaixo do centro do pano, 30° de campo. Aproxima 0,8 m ao longo da cena (`power2.inOut`).
- **Produto:** o pano. Vento contínuo com duas ondas cruzadas e borda superior presa.
- **Luz:** principal rasante pelo lado (Alvorada) ou de cima (OBRA), revelando as dobras. Preenchimento frio e fraco. Softboxes no ambiente dão o brilho acetinado das fibras.
- **Título:** à esquerda, em 2 a 4 linhas curtas, a maior tipografia da página. Abaixo, o texto de apoio e dois botões ("Ver a coleção" e "Toda a loja"). No pé, a dica de rolagem.
- **Interação:** o mouse move a câmera em até ±12 cm com amortecimento, e o ponteiro sobre o pano empurra o tecido localmente. A dica de rolagem some nos primeiros 3%.
- **Celular:** a câmera fica mais perto e o pano preenche a tela como fundo do título, com o varão acima do quadro. Numa tela estreita não cabem pano e título lado a lado.

## Cena 02: Trama (12 a 30%)

- **Transformação:** a câmera avança até 1,3 m do pano e fecha para 26°. A trama procedural passa a ocupar a tela.
- **Saem:** as linhas do título, uma a uma, em 3,5% de rolagem cada, com 1,2% de intervalo, subindo e perdendo opacidade. Depois saem os botões e o texto de apoio.
- **Entra:** a legenda "A trama de perto", curta, no canto inferior esquerdo, que aparece entre 17 e 27%.
- **Vento:** acalma de 1 para 0,55, para a trama ficar legível.
- **Duração relativa:** a cena mais longa depois da arara, porque é o momento de curiosidade.

## Cena 03: Cortina (30 a 45%)

- **Antecipação:** o pano recua levemente para a direita nos primeiros 12% da cena e então é recolhido para a esquerda em pregas (`power2.inOut`), como cortina de palco. O recolhimento termina na metade da cena.
- **Câmera em dois tempos:** primeiro recua do macro para um plano aberto, com o pano recolhido emoldurando a borda esquerda; depois avança até a primeira peça.
- **Entra:** a arara desce do alto do quadro a partir de 30% da cena e passa um pouco do ponto antes de assentar (`back.out(1.05)`). É o follow-through, pequeno de propósito: tecido não quica.
- **Luz:** a luz sobre a arara acende de 0 a 1 (`expo.out`) a partir de 40% da cena.
- **Vento:** rajada no pano ao ser puxado, de 0,55 a 1,4, e acomodação logo depois. Os painéis da arara chegam balançando e acalmam.
- **Câmera:** recua e vira para a primeira peça.
- **Sai:** a legenda da trama.

## Cena 04: Arara (45 a 76%)

- **Transformação:** travelling lateral pela arara, de peça em peça.
- **Ritmo:** cada peça fica parada 55% do seu trecho (metade na chegada e metade na saída), e o resto é deslocamento com `power2.inOut`. A leitura do preço acontece com a câmera parada.
- **Foco:** a profundidade de campo segue a peça em foco (só no nível alto).
- **Entra por peça:** legenda DOM com categoria, nome, preço e o link "Ver peça", que troca em crossfade quando o foco passa de uma peça para a outra.
- **Teclado:** focar o link de uma peça rola a página até o trecho em que ela aparece.
- **Produto:** 4 peças por marca, cada uma impressa num painel de tecido pendurado num cabide. O cabide é um GLB comprimido com Meshopt. A peça pode trocar o painel por um modelo GLB próprio quando existir.

## Cena 05: Coleção (76 a 90%)

- **Transformação:** a câmera recua e sobe até enquadrar a arara inteira.
- **Vento:** o dos painéis diminui (0,8 para 0,45); as peças assentam.
- **Entra:** o título da coleção (vindo do catálogo), a descrição e o botão da coleção, centralizados no alto.
- **Sai:** a legenda da última peça, no começo da cena.

## Cena 06: Saída (90 a 100%)

- **Transformação:** a câmera sobe mais um pouco e a luz cai para 60%.
- **Saem:** o canvas se dissolve na cor de fundo do site a partir de 93%, e o título da coleção também.
- **Entra:** ao fim da seção fixa, a rolagem continua naturalmente para a grade de produtos da coleção, as categorias, o bloco editorial e as novidades. É a interface convencional da loja.

---

## Movimento reduzido e aparelhos sem WebGL

Com `prefers-reduced-motion` ou economia de dados, não há seção fixa nem câmera. A abertura vira uma composição estática com o mesmo roteiro, na mesma ordem:

1. Título e botões sobre a imagem do estúdio.
2. A trama em texto.
3. As peças da arara em lista com foto, nome, preço e link.
4. O título da coleção.

Sem WebGL, a experiência usa a mesma versão estática. Quando existirem quadros pré-renderizados da marca, ela usa esses quadros controlados pela rolagem.

## Linguagem de movimento

| Uso | Curva | Onde |
| --- | --- | --- |
| Movimentos longos de câmera | `power2.inOut` (`easeInOutCubic`) | Todas as transições de câmera |
| Chegada e assentamento | `expo.out` | Luz da arara, entrada de textos |
| Antecipação | recuo senoidal curto | Pano antes de ser puxado |
| Follow-through | `back.out(1.05)` | Arara que desce |
| Saída de texto | `power2.in`, subindo 40 px | Título, legendas |

**Princípios:**
- Nada anima ao mesmo tempo: linhas de título em sequência e arara com atraso em relação ao pano.
- Todo valor é amortecido na cena (`damp` com meia-vida curta), então a rolagem nunca dá tranco.
- A velocidade da rolagem é a do navegador: sem travas nem saltos automáticos.
