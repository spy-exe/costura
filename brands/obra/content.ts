import type { BrandContent } from "@/core/brand/schema";

const img = (src: string, alt: string, width = 1600, height = 1067, focal?: { x: number; y: number }) => ({ src, alt, width, height, focal });

export const content = {
  home: {
    hero: {
      layout: "full-bleed",
      title: "Roupa de trabalho para a cidade",
      body: "Jaquetas, camisas, calças e malhas de algodão, com bolsos para o que você carrega no dia.",
      image: img("/demo/obra/hero.jpg", "Interior de loja com araras de roupas e luminárias industriais penduradas.", 1600, 1068, { x: 50, y: 55 }),
      primaryCta: { label: "Ver jaquetas e camisas", href: "/categoria/jaquetas-e-camisas" },
      secondaryCta: { label: "Ver tudo", href: "/loja" },
    },
    categoriesTitle: "Categorias",
    featuredCollection: { handle: "essenciais", limit: 4 },
    story: {
      title: "Jeans, sarja e brim",
      body: [
        "As peças partem de tecidos de algodão de trama fechada: jeans nas jaquetas e camisas, sarja nas calças, brim no macacão.",
        "A composição exata e o jeito de lavar estão na página de cada produto.",
      ],
      image: img("/demo/obra/story.jpg", "Pessoa de costas, de gorro e jaqueta caramelo com capuz, em um campo seco.", 1600, 1067, { x: 45, y: 50 }),
      cta: { label: "Ver calças e macacões", href: "/categoria/calcas-e-macacoes" },
    },
    newArrivalsTitle: "Novidades",
  },
  pages: {
    about: {
      title: "Sobre a OBRA",
      intro: "A OBRA é uma marca fictícia. Ela existe para mostrar o mesmo core Costura com outra identidade, outro catálogo e outro tom.",
      sections: [
        {
          heading: "O que vendemos",
          body: ["Roupa de trabalho adaptada para o dia a dia: jaquetas, camisas, calças, macacão e malhas."],
        },
        {
          heading: "Como esta loja funciona",
          body: [
            "Produtos, preços e estoques são dados de demonstração. A navegação, os filtros e a sacola funcionam; o checkout não cobra nem cria pedido.",
          ],
        },
      ],
    },
    faq: [
      {
        question: "Dá para comprar aqui?",
        answer: "Não. Esta é uma demonstração: você monta a sacola, mas nenhum pagamento é feito.",
      },
      {
        question: "As medidas são do corpo ou da peça?",
        answer: "Da peça pronta, medida esticada na mesa. Compare com uma roupa sua que veste bem.",
      },
    ],
  },
} satisfies BrandContent;
