import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "use cor hexadecimal de 6 dígitos");
const internalHref = z.string().regex(/^\/(?!\/)[^\s]*$/, "links internos começam com / e não com //");
const externalUrl = z.url({ protocol: /^https$/ });

const logoSchema = z.object({
  src: z.string().regex(/^\/brands\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const navLinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: internalHref,
});

const unit = z.number().min(0).max(1);

export const stageSchema = z.object({
  /** Cor do fundo infinito do estúdio; costuma ser a cor de fundo do site, para a saída se dissolver nela. */
  background: hex,
  floor: hex,
  /** Densidade da névoa que funde o chão com o fundo, 0 a 1. */
  haze: unit,
  fabric: z.object({
    color: hex,
    /** Padrão da trama gerado no shader: "plain" (tela, um fio por cima e um por baixo) ou "twill" (sarja diagonal, como o jeans). */
    weave: z.enum(["plain", "twill"]),
    /** Fios por metro; valores baixos deixam a trama aberta e visível no plano de perto. */
    threadsPerMeter: z.number().int().min(150).max(1500),
    /** Força do vento sobre o pano: linho leve perto de 1, lona pesada perto de 0,3. */
    wind: unit,
    /** Brilho acetinado das fibras (sheen). */
    sheen: unit,
  }),
  light: z.object({
    key: hex,
    fill: hex,
    /** "side": luz de janela lateral e baixa. "top": luz dura de cima, de galpão. */
    direction: z.enum(["side", "top"]),
    /** Intensidade relativa da luz principal, 0,5 a 2. */
    intensity: z.number().min(0.5).max(2),
  }),
  hanger: z.object({ color: hex, metalness: unit, roughness: unit }),
  /** Granulação de filme no pós-processamento, 0 a 0,1. */
  grain: z.number().min(0).max(0.1),
});

export type StageConfig = z.infer<typeof stageSchema>;

/**
 * Identidade de uma empresa. Tudo que muda de uma marca para outra na interface vem daqui.
 * Nada de catálogo, preço, frete ou credencial mora neste objeto.
 */
export const brandSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(60),
  /** Nome usado onde o espaço é curto, como a aba do navegador no celular. */
  shortName: z.string().min(1).max(20),
  description: z.string().min(20).max(200),
  locale: z.literal("pt-BR"),
  logo: z.object({
    horizontal: logoSchema,
    compact: logoSchema,
    /** Altura em px do logo no cabeçalho em telas largas e estreitas. */
    headerHeight: z.object({ desktop: z.number().min(16).max(64), mobile: z.number().min(16).max(48) }),
  }),
  favicon: z.string().regex(/^\/brands\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/),
  ogImage: z.string().regex(/^\/[^\s]+\.(jpg|png)$/),
  colors: z.object({
    background: hex,
    surface: hex,
    ink: hex,
    muted: hex,
    line: hex,
    accent: hex,
    accentInk: hex,
    focus: hex,
    danger: hex,
    success: hex,
    /** Faixa de aviso de demonstração. */
    notice: hex,
    noticeInk: hex,
  }),
  shape: z.object({
    radius: z.enum(["none", "sm", "md"]),
    buttonCase: z.enum(["none", "uppercase"]),
  }),
  typography: z.object({
    displayWeight: z.number().int().min(300).max(900),
    displayTracking: z.string().regex(/^-?\d*\.?\d+em$/),
    displayCase: z.enum(["none", "uppercase"]),
    /** Escala dos títulos grandes; 1 é o padrão do core. */
    displayScale: z.number().min(0.7).max(1.3),
    /** Largura da fonte de títulos (font-stretch), para famílias com eixo wdth. */
    displayStretch: z.number().int().min(75).max(125).default(100),
  }),
  contact: z.object({
    email: z.email(),
    phone: z.string().optional(),
    whatsapp: z.string().regex(/^\d{12,13}$/).optional(),
    hours: z.string().optional(),
    address: z.string().optional(),
  }),
  social: z
    .array(z.object({ network: z.enum(["instagram", "tiktok", "youtube", "pinterest"]), url: externalUrl }))
    .default([]),
  navigation: z.object({
    primary: z.array(navLinkSchema).min(1).max(8),
    footer: z.array(z.object({ title: z.string().min(1), links: z.array(navLinkSchema).min(1) })).max(4),
  }),
  /**
   * Direção de luz e material do estúdio 3D da homepage. Ausente, a homepage usa a abertura clássica.
   * Só parâmetros de arte: textos da experiência ficam em content.home.experience.
   */
  stage: stageSchema.optional(),
});

export type BrandConfig = z.infer<typeof brandSchema>;

const imageRef = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  focal: z.object({ x: z.number(), y: z.number() }).optional(),
});

const ctaSchema = z.object({ label: z.string().min(1).max(40), href: internalHref });

const shortLine = z.string().min(1).max(26);

/** Textos da abertura cinematográfica, na ordem das cenas do storyboard (docs/landing-storyboard.md). */
export const experienceSchema = z.object({
  opening: z.object({
    kicker: z.string().max(40).optional(),
    /** Título quebrado em linhas curtas; cada linha entra e sai separada. */
    title: z.array(shortLine).min(1).max(4),
    body: z.string().min(1).max(160),
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema.optional(),
    scrollHint: z.string().min(1).max(40),
  }),
  weave: z.object({ title: z.string().min(1).max(40), body: z.string().min(1).max(180) }),
  rail: z.object({
    title: z.string().min(1).max(40),
    /** Peças penduradas na arara, na ordem da câmera. */
    products: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).min(3).max(5),
    productCta: z.string().min(1).max(24),
    /**
     * Modelo 3D (GLB exportado do Blender, com Draco ou Meshopt) por peça. A peça sem modelo aparece
     * como foto impressa em painel de tecido.
     */
    models: z.record(z.string(), z.string().regex(/^\/models\/[a-z0-9-]+\.glb$/)).optional(),
  }),
  collection: z.object({ handle: z.string(), ctaLabel: z.string().min(1).max(40) }),
});

export type ExperienceContent = z.infer<typeof experienceSchema>;

const pageSectionSchema = z.object({ heading: z.string().min(1), body: z.array(z.string().min(1)).min(1) });

/** Conteúdo editorial da marca: textos e imagens que não são catálogo nem política comercial. */
export const contentSchema = z.object({
  home: z.object({
    hero: z.object({
      /** "split": texto ao lado da foto. "full-bleed": foto ocupando a largura, texto sobre a base. */
      layout: z.enum(["split", "full-bleed"]),
      eyebrow: z.string().max(40).optional(),
      title: z.string().min(1).max(80),
      body: z.string().max(220).optional(),
      image: imageRef,
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema.optional(),
    }),
    categoriesTitle: z.string().min(1),
    featuredCollection: z.object({ handle: z.string(), title: z.string().optional(), limit: z.number().int().min(2).max(8) }),
    story: z.object({
      title: z.string().min(1).max(80),
      body: z.array(z.string()).min(1).max(3),
      image: imageRef,
      cta: ctaSchema.optional(),
    }),
    /** Roteiro da abertura cinematográfica. Só vale com `brand.stage` definido. */
    experience: experienceSchema.optional(),
    newArrivalsTitle: z.string().min(1),
  }),
  pages: z.object({
    about: z.object({ title: z.string(), intro: z.string(), sections: z.array(pageSectionSchema), image: imageRef.optional() }),
    faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  }),
});

export type BrandContent = z.infer<typeof contentSchema>;
