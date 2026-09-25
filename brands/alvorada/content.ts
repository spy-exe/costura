import type { BrandContent } from "@/core/brand/schema";

const img = (src: string, alt: string, width = 1280, height = 1600, focal?: { x: number; y: number }) => ({ src, alt, width, height, focal });

export const content = {
  home: {
    hero: {
      layout: "split",
      title: "Roupa leve para o calor de verdade",
      body: "Camisas, vestidos, saias e calças em tecidos leves, com modelagem folgada.",
      image: img("/demo/alvorada/hero.jpg", "Camisas brancas penduradas em uma arara preta, ao lado de um vaso de planta, com luz natural.", 1600, 1067, { x: 42, y: 50 }),
      primaryCta: { label: "Ver a loja", href: "/loja" },
      secondaryCta: { label: "Novidades", href: "/loja?ordem=novidades" },
    },
    categoriesTitle: "Por peça",
    featuredCollection: { handle: "calor", limit: 4 },
    story: {
      title: "Na dúvida do tamanho, meça uma peça sua",
      body: [
        "Nossas tabelas mostram a medida da peça pronta, não do corpo.",
        "Estique na mesa uma camisa que veste bem em você, meça de uma axila à outra e compare com a tabela do produto.",
      ],
      image: img("/demo/alvorada/story.jpg", "Pessoa de costas, de vestido branco, caminhando na beira do mar ao entardecer.", 1067, 1600),
      cta: { label: "Abrir o guia de medidas", href: "/guia-de-medidas" },
    },
    scene: {
      title: "A trama de perto",
      body: "Tecidos de trama aberta deixam o ar passar e amassam com facilidade. Para a peça ficar lisa, passe a ferro ainda úmida.",
      texture: img("/demo/alvorada/textura.jpg", "Tecido de trama aberta em tom natural, visto de perto.", 1236, 1600),
    },
    newArrivalsTitle: "Chegaram agora",
  },
  pages: {
    about: {
      title: "Sobre a Alvorada",
      intro: "A Alvorada é uma marca fictícia. Ela existe para mostrar como uma marca de roupas leves usaria o core Costura.",
      sections: [
        {
          heading: "O que vendemos",
          body: ["Camisas, vestidos, saias, calças e acessórios para o clima quente."],
        },
        {
          heading: "Como esta loja funciona",
          body: [
            "Os produtos, preços e estoques são dados de demonstração. Você pode navegar, filtrar, escolher tamanhos e montar uma sacola, mas nenhuma compra é concluída.",
            "Uma empresa real troca esta marca pela própria identidade e conecta um provedor de comércio para vender.",
          ],
        },
      ],
    },
    faq: [
      {
        question: "Posso comprar nesta loja?",
        answer: "Não. É uma loja de demonstração: a sacola funciona, mas o checkout não cobra nem cria pedido.",
      },
      {
        question: "Como escolho o tamanho?",
        answer: "Abra o guia de medidas na página do produto e compare com uma peça sua que veste bem, medida esticada na mesa.",
      },
      {
        question: "Como sei se um tamanho está disponível?",
        answer: "Tamanhos esgotados aparecem riscados e não podem ser escolhidos. Quando restam poucas unidades, a página avisa quantas.",
      },
    ],
  },
} satisfies BrandContent;
