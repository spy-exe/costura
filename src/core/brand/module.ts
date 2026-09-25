import type { BrandConfig, BrandContent } from "./schema";
import type { CommerceSettings } from "../commerce/settings";

export interface BrandFonts {
  /** Classes com as variáveis `--font-display` e `--font-body` definidas pelo next/font. */
  variables: string;
  /** Variáveis extras, por exemplo quando a marca usa a mesma família no corpo e nos títulos. */
  style?: Record<string, string>;
}

/** Formato que toda pasta em `brands/<id>/index.ts` exporta. */
export interface BrandModule {
  brand: BrandConfig;
  content: BrandContent;
  commerce: CommerceSettings;
  fonts: BrandFonts;
}
