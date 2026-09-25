import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brandCssVariables } from "@/core/brand/tokens";
import { brand, fontStyle, fontVariables } from "@/server/brand";
import { isDemoMode } from "@/server/commerce";
import { baseMetadata } from "@/server/seo";
import { copy } from "@/ui/copy";
import { DemoNotice } from "@/ui/layout/demo-notice";
import { Footer } from "@/ui/layout/footer";
import { Header } from "@/ui/layout/header";
import { StoreShell } from "@/ui/layout/store-shell";
import "./globals.css";

export const metadata: Metadata = baseMetadata();

export const viewport: Viewport = {
  themeColor: brand.colors.background,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const demo = isDemoMode();
  return (
    <html lang="pt-BR" className={fontVariables} style={{ ...brandCssVariables(brand), ...fontStyle }}>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-bg focus:px-4 focus:py-3"
        >
          {copy.skipToContent}
        </a>
        {demo && <DemoNotice />}
        <StoreShell>
          <Header brand={brand} />
          <main id="conteudo" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer brand={brand} demo={demo} />
        </StoreShell>
      </body>
    </html>
  );
}
