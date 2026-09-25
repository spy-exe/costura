"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { copy } from "@/ui/copy";

interface Props {
  links: { label: string; href: string }[];
  secondary: { label: string; href: string }[];
}

/** Menu do celular em <dialog> modal, com Escape, foco preso e retorno de foco nativos. */
export function MobileNav({ links, secondary }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="icon-btn -ml-2 lg:hidden"
        aria-label={copy.nav.open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden size={22} strokeWidth={1.5} />
      </button>
      <dialog
        ref={ref}
        className="drawer drawer-left"
        aria-label={copy.nav.label}
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
      >
        <div className="flex items-center justify-end border-b border-line px-3 py-2">
          <button type="button" className="icon-btn" aria-label={copy.nav.close} onClick={() => setOpen(false)}>
            <X aria-hidden size={22} strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label={copy.nav.label} className="px-5 py-6">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="display display-md block py-2" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 space-y-1 border-t border-line pt-6">
            {secondary.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-2" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
