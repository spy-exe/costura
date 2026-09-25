"use client";

import { useEffect } from "react";
import { copy } from "@/ui/copy";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Só o identificador vai para o log do navegador; a mensagem pode conter detalhes internos.
    console.error("Falha ao renderizar a página", error.digest);
  }, [error]);
  return (
    <div className="wrap py-24 lg:py-32" role="alert">
      <h1 className="display display-lg max-w-[18ch]">{copy.error.title}</h1>
      <p className="mt-5 max-w-md text-[1.0625rem] text-muted">{copy.error.body}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        {copy.error.retry}
      </button>
    </div>
  );
}
