/**
 * Limitador por janela deslizante em memória. Suficiente para uma instância por loja;
 * com várias instâncias, trocar por um armazenamento compartilhado (ver docs/DEPLOYMENT.md).
 */
export function createRateLimiter(options: { limit: number; windowMs: number; now?: () => number; maxKeys?: number }) {
  const now = options.now ?? Date.now;
  const maxKeys = options.maxKeys ?? 10_000;
  const hits = new Map<string, number[]>();

  return {
    /** Registra uma tentativa e diz se ela está dentro do limite. */
    check(key: string): { allowed: boolean; retryAfterSeconds: number } {
      const t = now();
      const since = t - options.windowMs;
      const recent = (hits.get(key) ?? []).filter((at) => at > since);
      if (recent.length >= options.limit) {
        hits.set(key, recent);
        const retry = Math.ceil((recent[0]! + options.windowMs - t) / 1000);
        return { allowed: false, retryAfterSeconds: Math.max(1, retry) };
      }
      recent.push(t);
      hits.delete(key);
      hits.set(key, recent);
      // Descarta as chaves mais antigas para a memória não crescer sem limite.
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest === undefined) break;
        hits.delete(oldest);
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
