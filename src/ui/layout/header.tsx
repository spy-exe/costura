import Link from "next/link";
import { Search } from "lucide-react";
import type { BrandConfig } from "@/core/brand/schema";
import { copy } from "@/ui/copy";
import { CartButton } from "./cart-button";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

export function Header({ brand }: { brand: BrandConfig }) {
  const primary = [{ label: copy.catalog.all, href: "/loja" }, ...brand.navigation.primary];
  // O menu do celular repete os links do rodapé, sem duplicar o que já está no principal.
  const taken = new Set([...primary.map((l) => l.href), "/carrinho"]);
  const secondary = brand.navigation.footer.flatMap((group) => group.links).filter((l) => !taken.has(l.href));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-bg/85">
      <div className="wrap grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 lg:h-20 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex items-center lg:hidden">
          <MobileNav links={primary} secondary={secondary} />
        </div>
        <Link href="/" className="justify-self-center lg:justify-self-start" aria-label={`${brand.name}, página inicial`}>
          <Logo brand={brand} />
        </Link>
        <nav aria-label={copy.nav.label} className="hidden lg:block">
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-1 text-[0.9375rem]">
            {brand.navigation.primary.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="py-2 hover:underline hover:underline-offset-[6px]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-end gap-1">
          <form action="/busca" role="search" className="hidden items-center xl:flex">
            <label htmlFor="header-search" className="sr-only">
              {copy.search.label}
            </label>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder={copy.search.placeholder}
              className="h-10 w-44 border-b border-line bg-transparent px-1 text-[0.9375rem] outline-offset-2 placeholder:text-muted focus:border-ink"
              autoComplete="off"
            />
            <button type="submit" className="icon-btn" aria-label={copy.search.submit}>
              <Search aria-hidden size={20} strokeWidth={1.5} />
            </button>
          </form>
          <Link href="/busca" className="icon-btn xl:hidden" aria-label={copy.search.label}>
            <Search aria-hidden size={22} strokeWidth={1.5} />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
