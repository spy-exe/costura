"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Envolve um formulário GET de catálogo. Sem JavaScript o formulário funciona com o botão de envio;
 * com JavaScript cada mudança navega na hora, sem recarregar a página e sem perder a rolagem.
 */
export function AutoSubmit({ children, hideSubmit = true }: { children: ReactNode; hideSubmit?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const form = ref.current?.querySelector("form");
    if (!form) return;
    if (hideSubmit) form.querySelectorAll<HTMLElement>("[data-submit]").forEach((el) => (el.hidden = true));
    const onChange = () => {
      const data = new FormData(form);
      const params = new URLSearchParams();
      for (const [key, value] of data.entries()) {
        if (typeof value === "string" && value !== "") params.append(key, value);
      }
      const action = new URL(form.action, window.location.href);
      const query = params.toString();
      router.push(`${action.pathname}${query ? `?${query}` : ""}`, { scroll: false });
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, [router, hideSubmit]);

  return <div ref={ref}>{children}</div>;
}
