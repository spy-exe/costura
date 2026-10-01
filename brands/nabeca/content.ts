import type { BrandContent } from "@/core/brand/schema";

const img = (src: string, alt: string, width: number, height: number, focal?: { x: number; y: number }) => ({ src, alt, width, height, focal });

export const content = {
  home: {
    hero: {
      layout: "split",
      eyebrow: "Streetwear nacional",
      title: "Estilo de rua, raiz no morro, visão no asfalto.",
      body: "Plano C, Wanted, LadyBack e Hocks, com pedido direto pelo WhatsApp da loja.",
      image: img("/demo/nabeca/camisa-entre-ruas-e-reis-modelo.jpg", "Pessoa em estúdio cinza vestindo a camisa branca de manga longa com faixas azuis.", 563, 704, { x: 50, y: 30 }),
      primaryCta: { label: "Ver o drop", href: "/colecao/novidades" },
      secondaryCta: { label: "Toda a loja", href: "/loja" },
    },
    categoriesTitle: "Por categoria",
    featuredCollection: { handle: "plano-c", limit: 4 },
    story: {
      title: "Sem pressa. Sem atalhos.",
      body: [
        "A Na Beca é loja de rua: peça escolhida a dedo, marca nacional e conversa direta.",
        "Dúvida de tamanho ou de caimento? Chama no WhatsApp que a loja responde.",
      ],
      image: img("/demo/nabeca/shorts-legacy-modelo.jpg", "Pessoa numa quadra à noite vestindo o shorts Legacy preto com meias brancas.", 560, 700),
      cta: { label: "Falar com a loja", href: "/atendimento" },
    },
    experience: {
      opening: {
        kicker: "Na Beca · streetwear nacional",
        title: ["Estilo de rua.", "Raiz no morro.", "Visão no asfalto."],
        body: "Plano C, Wanted, LadyBack e Hocks, com pedido direto pelo WhatsApp da loja.",
        primaryCta: { label: "Ver o drop", href: "/colecao/novidades" },
        secondaryCta: { label: "Toda a loja", href: "/loja" },
        scrollHint: "Role para ver o drop",
      },
      weave: {
        title: "Algodão pesado",
        body: "Malha grossa, jeans baggy e nylon que aguentam a rua. Cada peça vem das marcas que fazem a cena.",
      },
      rail: {
        title: "Em destaque",
        products: ["camiseta-plano-c-resort", "camisa-entre-ruas-e-reis", "calca-baggy-army-wash", "tenis-hocks-flat-core"],
        productCta: "Ver peça",
      },
      collection: { handle: "novidades", ctaLabel: "Ver o drop" },
    },
    newArrivalsTitle: "Chegou na loja",
  },
  demo: {
    notice: "Prévia do site da Na Beca: preços e estoque de exemplo.",
    footer: "Prévia feita para a Na Beca, com fotos enviadas pela loja e preços de exemplo.",
  },
  pages: {
    about: {
      title: "Sobre a Na Beca",
      intro: "Construindo algo em que acreditamos. Sem pressa. Sem atalhos.",
      sections: [
        {
          heading: "O que tem na loja",
          body: ["Streetwear nacional: camisetas, manga longa, jeans baggy, shorts, cropped e tênis da Plano C, da Wanted, da LadyBack e da Hocks."],
        },
        {
          heading: "Como comprar",
          body: [
            "Escolha a peça, a cor e o tamanho e toque em \"Comprar pelo WhatsApp\": a mensagem já vai pronta para a loja.",
            "Com mais de uma peça, monte a sacola e envie o pedido inteiro pelo WhatsApp. Entrega e pagamento são combinados na conversa.",
          ],
        },
        {
          heading: "Sobre esta prévia",
          body: ["Este site é uma prévia feita para a Na Beca, com fotos enviadas pela loja. Preços e estoque são de exemplo."],
        },
      ],
    },
    faq: [
      {
        question: "Como faço o pedido?",
        answer: "Pela página da peça (\"Comprar pelo WhatsApp\") ou pela sacola, com várias peças de uma vez. O pedido chega pronto para a loja, que confirma tudo na conversa.",
      },
      {
        question: "Vocês entregam?",
        answer: "A entrega e a retirada são combinadas pelo WhatsApp, junto com o pagamento.",
      },
      {
        question: "Como escolho o tamanho?",
        answer: "As camisetas são de modelagem larga. Compare o guia de medidas da peça com uma camiseta sua que veste bem, medida esticada na mesa.",
      },
      {
        question: "Onde vejo as novidades?",
        answer: "No Instagram @na._.beca e na coleção \"Novidades\" do site.",
      },
    ],
  },
} satisfies BrandContent;
