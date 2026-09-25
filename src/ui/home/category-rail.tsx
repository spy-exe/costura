import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/core/commerce/types";

/** Categorias como fileira de fotos: rolagem lateral no celular, grade no desktop. */
export function CategoryRail({ title, categories }: { title: string; categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-title" className="wrap mt-24">
      <h2 id="categories-title" className="display display-md">
        {title}
      </h2>
      <ul
        className="-mx-4 mt-6 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:overflow-visible md:px-0"
        style={{ "--cols": Math.min(categories.length, 4) } as React.CSSProperties}
      >
        {categories.map((category) => (
          <li key={category.handle} className="w-[62vw] shrink-0 snap-start sm:w-[40vw] md:w-auto">
            <Link href={`/categoria/${category.handle}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                {category.image && (
                  <Image
                    src={category.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 48rem) 24vw, 62vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    style={category.image.focal ? { objectPosition: `${category.image.focal.x}% ${category.image.focal.y}%` } : undefined}
                  />
                )}
              </div>
              <p className="mt-3 text-[1.0625rem] font-medium group-hover:underline">{category.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
