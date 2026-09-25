"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { copy } from "@/ui/copy";

/** Painel de filtros no celular. Os filtros só valem ao tocar em "Aplicar filtros". */
export function FilterDialog({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const form = ref.current?.querySelector("form");
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      const params = new URLSearchParams();
      for (const [key, value] of new FormData(form).entries()) {
        if (typeof value === "string" && value !== "") params.append(key, value);
      }
      const query = params.toString();
      setOpen(false);
      router.push(`${new URL(form.action).pathname}${query ? `?${query}` : ""}`);
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [router]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="btn btn-secondary min-h-11 px-4 lg:hidden"
        aria-haspopup="dialog"
        aria-label={activeCount > 0 ? `${copy.catalog.filters} (${activeCount})` : copy.catalog.filters}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal aria-hidden size={18} strokeWidth={1.5} />
        {copy.catalog.filters}
        {activeCount > 0 && <span className="tabular-nums">({activeCount})</span>}
      </button>
      <dialog
        ref={ref}
        className="drawer"
        aria-labelledby="filter-dialog-title"
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="filter-dialog-title" className="display display-md">
            {copy.catalog.filtersTitle}
          </h2>
          <button type="button" className="icon-btn -mr-2" aria-label="Fechar filtros" onClick={() => setOpen(false)}>
            <X aria-hidden size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="px-5 py-6">{children}</div>
      </dialog>
    </>
  );
}
