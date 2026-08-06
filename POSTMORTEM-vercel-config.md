# Postmortem — vercel.json rompió producción (20-jun-2026)

## Regla de oro

> **Nunca reemplazar el bloque legacy `builds[]`+`routes[]` del `vercel.json`
> con la forma moderna** (`{cleanUrls:..., redirects:...}` sin `builds`) **sin
> antes haber visto el Output Directory y el Framework Preset del proyecto en
> el dashboard de Vercel.** Los dos formatos interactúan distinto con esos
> settings y el dashboard puede tener configuraciones que el legacy estaba
> ocultando.
>
> Si vas a tocar `vercel.json`, después del deploy corre `./scripts/smoke.sh`
> contra el preview link. Si no, no estás seguro de nada.

## Qué pasó

PR #8 ("Clean URLs") cambió `vercel.json` de esto:

```json
{
  "version": 2,
  "builds": [
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "favicon.ico", "use": "@vercel/static" },
    { "src": "robots.txt", "use": "@vercel/static" },
    { "src": "sitemap.xml", "use": "@vercel/static" },
    { "src": "public/**", "use": "@vercel/static" },
    { "src": "api/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/", "dest": "/index.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

a esto:

```json
{ "cleanUrls": true, "trailingSlash": false }
```

Tras el merge a `main`, `forward34.com/` devolvió el **404 genérico de Vercel**
(`NOT_FOUND` con un ID `sfo1::...`), incluso para `/`. El sitio quedó caído
hasta que se revirtió (PR #9).

## Root cause

El formato legacy v2 con `builds[]`+`routes[]` le dice a Vercel exactamente
qué archivos servir y cómo rutearlos. **Ignora completamente** la
auto-detección de framework y los settings del dashboard del proyecto.

Al quitar `builds[]`, Vercel cayó a su comportamiento moderno: leer los
settings del dashboard del proyecto (Root Directory, Output Directory,
Framework Preset). El proyecto `forward34` casi con seguridad tiene
**Output Directory = `public/`** (default cuando Vercel detecta una carpeta
`public/`). Con el legacy `builds[]` ese setting estaba neutralizado. Sin él,
Vercel empezó a servir desde `public/`, donde no hay `index.html` → 404 para
todo. Incluso `404.html` (en la raíz) no se sirvió porque también está fuera
del Output Directory.

## Por qué no se cachó antes de mergear

Dos fallos independientes:

1. **El status "Vercel Preview Ready" solo significa que el build compiló.**
   Para un sitio estático sin framework, no hay nada que compilar, así que
   siempre dice "Ready". **No valida que ninguna URL responda 200.**

2. **El emulador local** (`scripts/static-server.js`) lee archivos del disco
   con su propia lógica de rutas. No conoce el Output Directory del
   dashboard de Vercel. Estaba probando la premisa equivocada.

## Prevención

### Inmediata (este repo)

- **`scripts/smoke.sh [URL]`** — smoke test HTTP real que pega a páginas,
  assets, endpoints y al 404, y reporta status + content-type. Corre en
  segundos. Habría cachado este bug.

  ```bash
  ./scripts/smoke.sh https://forward34-git-mi-pr-...vercel.app
  ./scripts/smoke.sh                                            # prod
  ```

### Workflow (humano)

Para cualquier PR que toque `vercel.json`:

1. Mantener la PR como **draft** hasta correr `./scripts/smoke.sh` contra el
   preview link de Vercel.
2. Solo marcar ready (y mergear) si el smoke da exit 0.
3. Tras el merge, correr `./scripts/smoke.sh` contra producción y verificar
   que todo siga verde.

### Si querer hacer clean URLs en el futuro

La forma segura es **aditiva**: mantener el bloque legacy `builds[]`+`routes[]`
y solo agregar `cleanUrls: true` arriba.

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "version": 2,
  "builds": [ ... el bloque legacy completo ... ],
  "routes": [ ... ]
}
```

`cleanUrls` es una propiedad de nivel top que funciona con o sin `builds[]`.
La diferencia es que con `builds[]` no abandonas la configuración explícita.

## Cronología (UTC)

- **02:24** — Merge de PR #8 a `main` (clean URLs).
- **~02:24-02:26** — Vercel deploya a producción. `forward34.com` empieza a
  devolver 404 genérico.
- **02:31** — Usuario reporta el 404 con screenshot.
- **02:32** — PR #9 (revert) creada y mergeada.
- **~02:33** — Vercel deploya el revert, `forward34.com` recupera.

**Downtime total: ~7 minutos.**
