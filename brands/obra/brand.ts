import type { BrandConfig } from "@/core/brand/schema";

export const brand = {
  id: "obra",
  name: "OBRA",
  shortName: "OBRA",
  description: "Roupa de trabalho para a cidade, em jeans, sarja e brim de algodão. Loja de demonstração do core Costura.",
  locale: "pt-BR",
  logo: {
    horizontal: { src: "/brands/obra/logo-horizontal.svg", width: 261, height: 36 },
    compact: { src: "/brands/obra/logo-compact.svg", width: 122, height: 30 },
    headerHeight: { desktop: 30, mobile: 22 },
  },
  favicon: "/brands/obra/icon.svg",
  ogImage: "/brands/obra/og.jpg",
  colors: {
    background: "#E4E2DC",
    surface: "#D7D4CC",
    ink: "#141414",
    muted: "#46443F",
    line: "#ABA79D",
    accent: "#2A4A8F",
    accentInk: "#FFFFFF",
    focus: "#2A4A8F",
    danger: "#9A1B12",
    success: "#1F5A34",
    notice: "#F2C230",
    noticeInk: "#141414",
  },
  shape: { radius: "none", buttonCase: "uppercase" },
  typography: {
    displayWeight: 800,
    displayTracking: "0.005em",
    displayCase: "uppercase",
    displayScale: 0.84,
    displayStretch: 125,
  },
  contact: {
    email: "contato@obra.example",
    hours: "Segunda a sábado, das 10h às 19h",
  },
  social: [],
  navigation: {
    primary: [
      { label: "Jaquetas e camisas", href: "/categoria/jaquetas-e-camisas" },
      { label: "Calças e macacões", href: "/categoria/calcas-e-macacoes" },
      { label: "Malhas", href: "/categoria/malhas" },
      { label: "Essenciais", href: "/colecao/essenciais" },
    ],
    footer: [
      {
        title: "Loja",
        links: [
          { label: "Tudo", href: "/loja" },
          { label: "Novidades", href: "/loja?ordem=novidades" },
          { label: "Guia de medidas", href: "/guia-de-medidas" },
        ],
      },
      {
        title: "Ajuda",
        links: [
          { label: "Atendimento", href: "/atendimento" },
          { label: "Trocas e devoluções", href: "/trocas-e-devolucoes" },
          { label: "Privacidade", href: "/privacidade" },
        ],
      },
      {
        title: "OBRA",
        links: [
          { label: "Sobre", href: "/sobre" },
          { label: "Créditos das imagens", href: "/creditos" },
        ],
      },
    ],
  },
  stage: {
    background: "#E4E2DC",
    floor: "#CFCBC2",
    haze: 0.5,
    // Lona pesada que mal balança, luz dura de galpão vinda de cima.
    fabric: { color: "#9C8A63", weave: "twill", threadsPerMeter: 560, wind: 0.32, sheen: 0.2 },
    light: { key: "#F2F5FF", fill: "#C9CED6", direction: "top", intensity: 1.45 },
    hanger: { color: "#1C1C1C", metalness: 0.25, roughness: 0.6 },
    grain: 0.05,
  },
} satisfies BrandConfig;
