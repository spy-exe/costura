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
  features: z.object({
    /** Cena WebGL editorial na homepage. Desligada, a homepage usa só a imagem estática. */
    editorialScene: z.boolean(),
  }),
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
    /** Texto da cena editorial, quando a marca liga `features.editorialScene`. */
    scene: z.object({ title: z.string(), body: z.string(), texture: imageRef }).optional(),
    newArrivalsTitle: z.string().min(1),
  }),
  pages: z.object({
    about: z.object({ title: z.string(), intro: z.string(), sections: z.array(pageSectionSchema), image: imageRef.optional() }),
    faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  }),
});

export type BrandContent = z.infer<typeof contentSchema>;
