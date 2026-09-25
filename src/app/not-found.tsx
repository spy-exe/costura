import Link from "next/link";
import { copy } from "@/ui/copy";

export default function NotFound() {
  return (
    <div className="wrap py-24 lg:py-32">
      <p className="text-sm text-muted">Erro 404</p>
      <h1 className="display display-xl mt-3 max-w-[16ch]">{copy.notFound.title}</h1>
      <p className="mt-5 max-w-md text-[1.0625rem] text-muted">{copy.notFound.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/loja" className="btn btn-primary">
          {copy.notFound.cta}
        </Link>
        <Link href="/busca" className="btn btn-secondary">
          {copy.search.label}
        </Link>
      </div>
    </div>
  );
}
