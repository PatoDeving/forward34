# Landing de recursos — guía de puesta en marcha

Sistema de captación de leads para Instagram (mecánica *comment-to-DM*):
alguien comenta una palabra clave → ManyChat le manda un DM con un botón →
el botón abre esta landing → la persona deja su correo → recibe el PDF en
pantalla **y** en su bandeja, y el lead queda registrado en un Google Sheet
con la cuenta de Instagram de la que vino.

Escrito para alguien que no programa. Cada paso dice qué hacer y por qué.

---

## Qué se agregó al sitio

| Archivo | Qué es |
|---|---|
| `recurso.html` | La landing. Una sola página sirve para todos los recursos. |
| `api/recurso.js` | El backend: guarda el lead y manda el correo. |
| `public/data/recursos.json` | El catálogo. Aquí se agregan recursos nuevos. |
| `public/pdfs/` | Donde viven los PDFs. |
| `.env.example` | Se le agregaron los nombres de las variables nuevas. |

**Nada del sitio existente se modificó.** Ni `vercel.json`, ni las páginas,
ni `api/lead.js` (el diagnóstico IA), ni ninguna variable de entorno actual.

---

## Lo que te toca hacer

### Paso 1 — Subir los PDFs

Mete los archivos en la carpeta `public/pdfs/`. Los nombres deben coincidir
con los del catálogo:

- `liderazgo-ia.pdf`
- `cultura-organizacional.pdf`
- `recurso-tres.pdf`

Detalles de nombres y peso en [`public/pdfs/LEEME.md`](public/pdfs/LEEME.md).

### Paso 2 — Poner el copy final

Abre `public/data/recursos.json` y reemplaza los textos de ejemplo por los
definitivos: `titulo`, `gancho` (una línea) y los 3 `bullets`.

**No cambies el `slug`** salvo que también cambies el enlace en ManyChat.

### Paso 3 — Crear el Google Sheet

1. Crea una hoja nueva en Google Sheets.
2. Nombra la primera pestaña **`Leads`** (con mayúscula inicial).
3. En la fila 1 escribe estos encabezados, uno por columna:

   `fecha` · `nombre` · `correo` · `recurso` · `recurso_id` · `fuente`

4. Guarda el **ID de la hoja**: está en la barra de direcciones, entre
   `/d/` y `/edit`. Es una cadena larga de letras y números.

### Paso 4 — Crear la cuenta de servicio de Google

Esto es lo más laborioso, pero se hace una sola vez. Es una "cuenta robot"
que solo puede escribir en esa hoja.

1. Entra a **console.cloud.google.com** con la cuenta de Google del equipo.
2. Arriba a la izquierda, crea un **proyecto nuevo**. Llámalo `Forward34 Leads`.
3. Menú → **APIs y servicios → Biblioteca**. Busca **Google Sheets API** y
   dale **Habilitar**.
4. Menú → **APIs y servicios → Credenciales**.
5. **Crear credenciales → Cuenta de servicio**. Ponle nombre `leads-recursos`.
   Dale **Crear y continuar** y luego **Listo** (los pasos de permisos
   opcionales se pueden saltar).
6. Haz clic en la cuenta que acabas de crear → pestaña **Claves** →
   **Agregar clave → Crear clave nueva → JSON**. Se descarga un archivo.
7. Abre ese archivo con el Bloc de notas. Vas a necesitar dos valores:
   - `client_email` → algo como `leads-recursos@...iam.gserviceaccount.com`
   - `private_key` → un texto largo que empieza con `-----BEGIN PRIVATE KEY-----`

> **Guarda ese archivo en un lugar seguro y no lo subas a ningún lado.**
> Es la llave de la cuenta robot.

### Paso 5 — Darle acceso al Sheet a la cuenta robot

Vuelve a tu Google Sheet → botón **Compartir** → pega el `client_email` del
paso anterior → dale permiso de **Editor** → **Enviar**.

Sin este paso, Google rechaza la escritura aunque todo lo demás esté bien.

### Paso 6 — Crear las variables en Vercel

En el panel de Vercel del proyecto de Forward34:
**Settings → Environment Variables**. Agrega estas tres, marcando las
casillas **Production**, **Preview** y **Development** en cada una:

| Nombre | Valor |
|---|---|
| `RECURSO_SHEETS_CLIENT_EMAIL` | el `client_email` del archivo JSON |
| `RECURSO_SHEETS_PRIVATE_KEY` | el `private_key` completo, **tal cual aparece en el JSON**, incluyendo los `\n` |
| `RECURSO_SHEETS_SPREADSHEET_ID` | el ID de la hoja del paso 3 |

**No toques ninguna variable que ya exista.** El sistema reusa la
`RESEND_API_KEY` que ya está configurada para el diagnóstico IA: solo la
lee, no la modifica.

Después de agregarlas hay que **volver a desplegar** para que tomen efecto.

### Paso 7 — Probar en el Preview

Cuando el Pull Request esté abierto, Vercel genera una URL de prueba. Ábrela
en el celular y visita:

```
https://LA-URL-DE-PREVIEW/recurso.html?r=liderazgo-ia&utm_source=forward34
```

Comprueba que:
- Se ve bien en el celular.
- Al enviar el formulario aparece el botón de descarga.
- Llega el correo con el PDF.
- Aparece una fila nueva en el Google Sheet con `forward34` en la columna `fuente`.

Si las cuatro cosas pasan, se puede aprobar a producción.

### Paso 8 — Armar los enlaces para ManyChat

El formato es siempre el mismo. Cambia `r=` según el recurso y `utm_source=`
según la cuenta desde la que se publicó el video:

```
https://forward34.com/recurso.html?r=liderazgo-ia&utm_source=forward34
https://forward34.com/recurso.html?r=liderazgo-ia&utm_source=descubrete
https://forward34.com/recurso.html?r=liderazgo-ia&utm_source=hector
```

Los tres apuntan al mismo recurso; lo único que cambia es de qué cuenta vino
la persona. Eso es lo que verás en la columna `fuente` del Sheet.

### Paso 9 (opcional) — Meta Pixel

Para poder hacer anuncios después a quienes descargaron:

1. Abre `recurso.html` y busca la línea `var META_PIXEL_ID = '';`
2. Pega tu ID entre las comillas (solo los números).

Mientras esté vacío, el pixel no carga y no se envía nada a Meta.

---

## Variables de entorno, en resumen

**Nuevas** (las creas tú en el paso 6):

| Nombre | ¿Obligatoria? | Para qué |
|---|---|---|
| `RECURSO_SHEETS_CLIENT_EMAIL` | Sí | Identificar la cuenta robot de Google |
| `RECURSO_SHEETS_PRIVATE_KEY` | Sí | Su llave (secreta) |
| `RECURSO_SHEETS_SPREADSHEET_ID` | Sí | Qué hoja recibe los leads |
| `RECURSO_SHEETS_RANGE` | No | Otra pestaña. Por defecto `Leads!A:F` |
| `RECURSO_MAIL_FROM` | No | Otro remitente. Por defecto usa `LEAD_FROM` |
| `RECURSO_SITE_URL` | No | Otro dominio. Por defecto `https://forward34.com` |

**Existentes que solo se leen** (no se modifican ni se renombran):

| Nombre | Para qué la usa esta landing |
|---|---|
| `RESEND_API_KEY` | Enviar el correo con el recurso |
| `LEAD_FROM` | Remitente, si no defines `RECURSO_MAIL_FROM` |

---

## Cómo agregar un recurso nuevo (después)

Cada video nuevo son dos cosas, sin tocar código:

1. Sube el PDF a `public/pdfs/`.
2. Agrega una entrada en `public/data/recursos.json` copiando un bloque
   existente y cambiando los textos.

El enlace queda listo automáticamente. No hay límite de recursos.

---

## Si algo falla

**El diseño de la landing es una decisión deliberada:** no lleva el menú de
navegación del sitio. La gente llega desde un DM de Instagram con una
intención concreta; un menú completo solo la distrae de dejar su correo.

**La persona siempre recibe su PDF.** Si Google Sheets o el correo fallan, el
botón de descarga aparece igual. El lead queda registrado en los logs de
Vercel para poder recuperarlo a mano.

**Los PDFs están en una URL pública.** Cualquiera con el enlace directo puede
abrirlos sin dejar su correo. Es lo normal en un lead magnet, pero no pongas
ahí nada confidencial.

**Si no llegan filas al Sheet:** casi siempre es el paso 5 (no compartiste la
hoja con la cuenta robot) o que la `RECURSO_SHEETS_PRIVATE_KEY` se pegó
incompleta. En Vercel, en la pestaña **Logs** de la función, aparece el
motivo exacto.

**Si no llega el correo:** revisa que el dominio del remitente esté verificado
en Resend. Es el mismo que ya usa el diagnóstico IA, así que si aquel
funciona, este también debería.
