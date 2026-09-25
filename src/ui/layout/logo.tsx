import type { BrandConfig } from "@/core/brand/schema";

/**
 * Logo compacto no celular e horizontal a partir de telas largas.
 * As alturas vêm da configuração; a largura acompanha a proporção de cada arquivo.
 */
export function Logo({ brand }: { brand: BrandConfig }) {
  const { horizontal, compact, headerHeight } = brand.logo;
  return (
    <picture>
      <source media="(min-width: 64rem)" srcSet={horizontal.src} width={horizontal.width} height={horizontal.height} />
      {/* SVG vetorial: o otimizador de imagens não traz ganho aqui. */}
      <img
        src={compact.src}
        width={compact.width}
        height={compact.height}
        alt={brand.name}
        className="block h-[var(--logo-h-m)] w-auto max-w-[52vw] lg:h-[var(--logo-h-d)] lg:max-w-none"
        style={
          {
            "--logo-h-m": `${headerHeight.mobile}px`,
            "--logo-h-d": `${headerHeight.desktop}px`,
          } as React.CSSProperties
        }
      />
    </picture>
  );
}
