import Image from "next/image";
import Link from "next/link";
import type { BrandContent } from "@/core/brand/schema";

export function Story({ story }: { story: BrandContent["home"]["story"] }) {
  return (
    <section aria-labelledby="story-title" className="mt-28 bg-surface">
      <div className="wrap grid gap-8 py-14 md:grid-cols-2 md:items-center md:gap-14 lg:py-20">
        <div className="relative aspect-[4/5] overflow-hidden md:aspect-[4/5]">
          <Image
            src={story.image.src}
            alt={story.image.alt}
            fill
            sizes="(min-width: 48rem) 45vw, 100vw"
            className="object-cover"
            style={story.image.focal ? { objectPosition: `${story.image.focal.x}% ${story.image.focal.y}%` } : undefined}
          />
        </div>
        <div className="max-w-lg">
          <h2 id="story-title" className="display display-lg">
            {story.title}
          </h2>
          <div className="prose-brand mt-6 text-muted">
            {story.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {story.cta && (
            <Link href={story.cta.href} className="btn btn-secondary mt-8">
              {story.cta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
