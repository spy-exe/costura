import type React from "react";
import * as active from "@active-brand";
import { brandSchema, contentSchema } from "@/core/brand/schema";
import { commerceSettingsSchema } from "@/core/commerce/settings";
import type { BrandModule } from "@/core/brand/module";

// Validação em tempo de carga: uma marca mal configurada quebra o build, não a página em produção.
const mod: BrandModule = active;

export const brand = brandSchema.parse(mod.brand);
export const content = contentSchema.parse(mod.content);
export const commerceSettings = commerceSettingsSchema.parse(mod.commerce);
export const fontVariables = mod.fonts.variables;
export const fontStyle = (mod.fonts.style ?? {}) as React.CSSProperties;
