"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ruler, X } from "lucide-react";
import { copy } from "@/ui/copy";

export function SizeGuideDialog({ title, children }: { title: string; children: ReactNode }) {
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
        className="inline-flex min-h-11 items-center gap-1.5 text-sm underline underline-offset-4"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Ruler aria-hidden size={16} strokeWidth={1.5} />
        {copy.product.sizeGuide}
      </button>
      <dialog
        ref={ref}
        className="modal"
        aria-labelledby="size-guide-title"
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="size-guide-title" className="display display-md">
            {title}
          </h2>
          <button type="button" className="icon-btn -mr-2" aria-label={copy.product.sizeGuideClose} onClick={() => setOpen(false)}>
            <X aria-hidden size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-5 py-5">{children}</div>
      </dialog>
    </>
  );
}
