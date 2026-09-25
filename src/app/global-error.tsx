"use client";

// Último recurso quando o próprio layout falha. Sem tokens da marca, que podem ser a causa da falha.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", maxWidth: "36rem", margin: "0 auto" }}>
        <h1>A loja não carregou</h1>
        <p>Pode ser uma falha momentânea. Tente de novo em instantes.</p>
        <button type="button" onClick={reset} style={{ marginTop: "1rem", padding: "0.75rem 1.25rem" }}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
