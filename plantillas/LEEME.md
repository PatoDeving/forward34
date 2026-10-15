# Plantillas y andamiaje

Esta carpeta **no se publica**. No está listada en `builds` de `vercel.json`, así que nada de lo que esté aquí se sirve en forward34.com.

- `blog-plantilla.html` — molde para una entrada del blog. Para publicar un artículo: duplícalo en `blog/<slug>.html`, reemplaza los marcadores `{{...}}`, agrega su `<li>` arriba en `blog/index.html` y su URL en `sitemap.xml`, con su `lastmod`.
- `START-HERE.html` — hoja de instrucciones del kit con el que se armó el sitio. Se conserva como referencia histórica.

Las dos vivían en rutas publicadas y respondían 200 en producción.
