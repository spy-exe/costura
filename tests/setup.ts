import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom não implementa <dialog>; o comportamento mínimo basta para os testes de componentes.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

import { vi } from "vitest";
import { createElement } from "react";

// next/image vira <img> simples nos testes; o otimizador não existe fora do servidor do Next.
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, priority, sizes, ...rest }: Record<string, unknown>) => {
    void fill;
    void priority;
    void sizes;
    return createElement("img", { src, alt, ...rest });
  },
}));

export const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/loja",
  useSearchParams: () => new URLSearchParams("tamanho=M"),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
