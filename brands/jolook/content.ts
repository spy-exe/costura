import type { BrandContent } from "@/core/brand/schema";

const img = (src: string, alt: string, width = 1280, height = 1600, focal?: { x: number; y: number }) => ({ src, alt, width, height, focal });

export const content = {
  home: {
    hero: {
      layout: "split",
      eyebrow: "Moda feminina em Vassouras",
      title: "Vista confiança. Sinta tendência.",
      body: "Tendências exclusivas, novidades toda semana e atendimento pelo WhatsApp.",
      image: img("/demo/jolook/hero.jpg", "Arara de loja com peças penduradas em tons de cinza, amarelo e estampas.", 1600, 1067, { x: 55, y: 50 }),
      primaryCta: { label: "Ver as novidades", href: "/colecao/novidades" },
      secondaryCta: { label: "Toda a loja", href: "/loja" },
    },
    categoriesTitle: "Por categoria",
    featuredCollection: { handle: "novidades", limit: 4 },
    story: {
      title: "Novidades toda semana no Grupo VIP",
      body: [
        "As peças novas aparecem primeiro no grupo da Jo Look no WhatsApp.",
        "Dúvida de tamanho ou de combinação? A consultora JoLook responde por lá mesmo.",
      ],
      image: img("/demo/jolook/story.jpg", "Cabides de madeira com peças de jeans penduradas.", 1600, 1067),
      cta: { label: "Falar com a consultora", href: "/atendimento" },
    },
    experience: {
      opening: {
        kicker: "Moda feminina · Vassouras, RJ",
        title: ["Vista", "confiança.", "Sinta", "tendência."],
        body: "Tendências exclusivas, novidades toda semana e atendimento pelo WhatsApp.",
        primaryCta: { label: "Ver as wide legs", href: "/colecao/wide-legs" },
        secondaryCta: { label: "Toda a loja", href: "/loja" },
        scrollHint: "Role para ver as peças",
      },
      weave: {
        title: "Tecido que veste bem",
        body: "Jeans, linho e alfaiataria escolhidos peça por peça. Na dúvida do tamanho, a consultora ajuda pelo WhatsApp.",
      },
      rail: {
        title: "As essenciais",
        products: ["wide-leg-jeans-clara", "wide-leg-preta", "wide-leg-linho-bege", "wide-leg-estonada"],
        productCta: "Ver peça",
      },
      collection: { handle: "wide-legs", ctaLabel: "Ver as wide legs" },
    },
    newArrivalsTitle: "Novidades da semana",
  },
  demo: {
    notice: "Prévia do site da Jo Look Fashion: fotos e preços de exemplo.",
    footer: "Prévia feita para a Jo Look Fashion, com fotos de bancos de imagens livres e preços de exemplo.",
  },
  pages: {
    about: {
      title: "Sobre a Jo Look Fashion",
      intro: "A Jo Look Fashion é uma loja de moda feminina de Vassouras (RJ), com tendências exclusivas e novidades toda semana.",
      sections: [
        {
          heading: "Como comprar",
          body: [
            "Escolha a peça, a cor e o tamanho e toque em \"Comprar pelo WhatsApp\": a mensagem já vai pronta para a consultora.",
            "Com mais de uma peça, monte a sacola e envie o pedido inteiro pelo WhatsApp. Entrega e pagamento são combinados na conversa.",
          ],
        },
        {
          heading: "Sobre esta prévia",
          body: [
            "Este site é uma prévia feita para a Jo Look Fashion. As fotos são de bancos de imagens livres e os preços são de exemplo; com as fotos e o estoque da loja, ele fica pronto para vender.",
          ],
        },
      ],
    },
    faq: [
      {
        question: "Como faço o pedido?",
        answer: "Pela página da peça (\"Comprar pelo WhatsApp\") ou pela sacola, com várias peças de uma vez. O pedido chega pronto para a consultora, que confirma tudo na conversa.",
      },
      {
        question: "Vocês entregam?",
        answer: "A entrega e a retirada são combinadas pelo WhatsApp, junto com o pagamento.",
      },
      {
        question: "Como escolho o tamanho?",
        answer: "Abra o guia de medidas na página da peça e compare com uma peça sua que veste bem. Se ficar na dúvida, a consultora ajuda.",
      },
      {
        question: "Onde vejo as novidades primeiro?",
        answer: "No Grupo VIP da Jo Look no WhatsApp e no Instagram @jolook_fashion. O link do grupo está no rodapé.",
      },
    ],
  },
} satisfies BrandContent;
