# Implantação

## Modelo

Uma instância Node por marca, com o build `standalone` do Next.js atrás de um proxy reverso. Não há banco de dados: a sacola fica em cookie e o catálogo vem do provedor.

A demonstração pública roda assim:

| Item | Valor |
| --- | --- |
| Servidor | LXC Debian 13 (`ct-costura`, 4 vCPU, 4 GB) |
| Node | 24.18.0 em `/usr/local/bin` |
| Código | `/opt/costura` |
| Releases | `/srv/costura/<marca>/releases/<data>-<commit>`, com link `current` |
| Serviço | `costura@<marca>` (systemd, usuário `costura`, `Restart=always`, sandbox `ProtectSystem=strict`) |
| Variáveis | `/etc/costura/<marca>.env`, modo 600 |
| Portas | Alvorada 3000, OBRA 3001 |
| Entrada pública | Cloudflare Tunnel: `roupas-website.malha.app` → Alvorada |

## Variáveis de ambiente

Modelo em `.env.example` e `deploy/costura.env.example`.

| Variável | Onde vale | Descrição |
| --- | --- | --- |
| `BRAND` | build | Pasta em `brands/`. Escolhe identidade, fontes e catálogo de demonstração |
| `APP_ENV` | build e execução | `development`, `test`, `preview` ou `production` |
| `SITE_URL` | build e execução | URL pública, usada em canonical, sitemap e Open Graph |
| `COMMERCE_PROVIDER` | execução | `demo` (padrão) ou `shopify` |
| `SHOPIFY_*` | build e execução | Ver docs/COMMERCE.md. O domínio entra no CSP no build |
| `ALLOW_INDEXING` | execução | `true` libera buscadores; só funciona com `APP_ENV=production` e provedor real |
| `COMMERCE_TEST_CONTROLS` | execução | Só para E2E. A validação de ambiente recusa em produção |
| `PORT`, `HOSTNAME` | execução | Porta e interface do servidor |

Páginas estáticas gravam `SITE_URL` e `APP_ENV` no build; por isso o build usa o mesmo arquivo de ambiente da execução.

## Primeira instalação

```bash
useradd --system --home /srv/costura --shell /usr/sbin/nologin costura
mkdir -p /srv/costura/<marca>/releases /etc/costura
cp deploy/costura@.service /etc/systemd/system/
cp deploy/costura.env.example /etc/costura/<marca>.env && chmod 600 /etc/costura/<marca>.env
# edite SITE_URL, PORT e provedor
systemctl daemon-reload
deploy/release.sh <marca>
systemctl enable costura@<marca>
```

## Publicar uma versão

```bash
cd /opt/costura && git pull
deploy/release.sh alvorada
```

O script carrega o `.env` da marca, roda `npm ci` e o build, copia para uma release nova, troca o link `current`, reinicia o serviço e verifica `/loja`. Se a verificação falhar em 30 s, volta para a release anterior sozinho. Mantém as 5 releases mais recentes.

## Voltar uma versão manualmente

```bash
ls -1t /srv/costura/alvorada/releases/
ln -sfn /srv/costura/alvorada/releases/<release-anterior> /srv/costura/alvorada/current
systemctl restart costura@alvorada
```

## Proxy e túnel

- O servidor escuta HTTP puro; TLS termina no proxy (Cloudflare Tunnel na demonstração).
- `SITE_URL` precisa ser a URL pública com `https://` para o cookie da sacola sair com `Secure`.
- A limitação de abuso usa `CF-Connecting-IP` ou o primeiro `X-Forwarded-For`. Só publique a porta do Node para o proxy; exposta direto, esses cabeçalhos poderiam ser forjados.
- Redirecionamentos 303 usam `Location` relativo, então funcionam com qualquer host público.
- O limitador fica em memória. Com mais de uma instância por marca, troque por um armazenamento compartilhado (Redis, por exemplo).

## Observação sobre a zona Cloudflare da demonstração

A zona `malha.app` injeta o beacon do Cloudflare Web Analytics nas páginas. O CSP da loja bloqueia esse script, coerente com a página de privacidade, que diz que a loja não usa análise de terceiros. Para eliminar o aviso no console, desligue a injeção automática do Web Analytics para esse hostname no painel da Cloudflare.
