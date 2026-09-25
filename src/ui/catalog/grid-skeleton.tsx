/** Esqueleto da grade com as mesmas proporções do conteúdo final, para não haver salto de layout. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="wrap pt-8 lg:pt-12" aria-busy="true" aria-live="polite">
      <p className="sr-only">Carregando produtos…</p>
      <div className="h-12 w-64 max-w-full animate-pulse bg-surface motion-reduce:animate-none" />
      <ul className="mt-14 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:ml-[17.5rem] xl:ml-[18.5rem] xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div className="aspect-[4/5] animate-pulse bg-surface motion-reduce:animate-none" />
            <div className="mt-3 h-4 w-3/4 bg-surface" />
            <div className="mt-2 h-4 w-1/3 bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
