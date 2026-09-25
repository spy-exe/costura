"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/ui/copy";

const KEY = "costura:last-listing";

/** Guarda a última listagem visitada (com filtros e página) para o link de volta no produto. */
export function RememberListing() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    const qs = params.toString();
    try {
      sessionStorage.setItem(KEY, `${pathname}${qs ? `?${qs}` : ""}`);
    } catch {
      // Armazenamento bloqueado: o link de volta simplesmente não aparece.
    }
  }, [pathname, params]);
  return null;
}

export function BackToResults() {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    try {
      const value = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage só existe no navegador
      if (value && value.startsWith("/")) setHref(value);
    } catch {
      // sem armazenamento, sem link
    }
  }, []);
  if (!href) return null;
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-sm hover:underline" data-testid="back-to-results">
      <ArrowLeft aria-hidden size={16} strokeWidth={1.5} />
      {copy.catalog.backToResults}
    </Link>
  );
}
