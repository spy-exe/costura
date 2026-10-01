import Link from "next/link";
import type { BrandConfig } from "@/core/brand/schema";
import { whatsappUrl } from "@/core/contact/whatsapp";
import { copy } from "@/ui/copy";

const NETWORK_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", pinterest: "Pinterest" } as const;

/** `demoNote` só no modo demonstração: diz à pessoa que a loja não é real ou que a vitrine é ilustrativa. */
export function Footer({ brand, demoNote }: { brand: BrandConfig; demoNote?: string }) {
  const year = new Date().getFullYear();
  const { whatsapp, whatsappGroup } = brand.contact;
  const channels = [
    ...brand.social.map((s) => ({ label: NETWORK_LABEL[s.network], url: s.url })),
    ...(whatsapp ? [{ label: copy.footer.whatsapp, url: whatsappUrl(whatsapp) }] : []),
    ...(whatsappGroup ? [{ label: copy.footer.group, url: whatsappGroup }] : []),
  ];
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <p className="display display-md">{brand.name}</p>
          <p className="meta mt-3 text-[0.9375rem]">{brand.description}</p>
        </div>
        {brand.navigation.footer.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block py-1.5 text-[0.9375rem] hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="wrap flex flex-col gap-2 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {brand.name}.{demoNote ? ` ${demoNote}` : ""}
        </p>
        {channels.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label={copy.footer.social}>
            {channels.map((c) => (
              <li key={c.url}>
                <a href={c.url} className="inline-block py-1.5 hover:underline" rel="noopener noreferrer" target="_blank">
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
