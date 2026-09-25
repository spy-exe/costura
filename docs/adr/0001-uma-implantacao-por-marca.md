# ADR 0001: Uma implantação por marca, marca escolhida no build

Data: 2026-09-24. Situação: aceita.

## Contexto

O core precisa atender empresas diferentes com o mesmo código. As opções eram multi-tenant em runtime (uma instância serve várias marcas pelo domínio) ou uma implantação por marca.

## Decisão

Cada implantação atende uma marca, escolhida pela variável `BRAND` no build. O `next.config.ts` cria o alias `@active-brand` apontando para `brands/<BRAND>/index.ts`; o core importa só esse alias.

## Consequências

- Só as fontes, textos e logos da marca ativa entram no bundle.
- Não há condicional de marca nos componentes. O script `npm run check:brand` falha a CI se id, nome, cor ou domínio de alguma marca aparecer em `src/`.
- Trocar de marca exige um novo build. Aceitável para lojas com domínio próprio; um marketplace ou SaaS de muitas lojas pediria revisão desta decisão.
- Cookie da sacola, cache do catálogo e processo são naturalmente isolados por marca.
