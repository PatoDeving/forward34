# Instrucciones del agente de recepción (chat del sitio)

`f34_prompt.md` es el texto que define cómo responde el chat que aparece en
forward34.com. **Este archivo es el que manda**: la función lo lee del disco en
cada arranque en frío.

## Dónde corre el chat

Desde el 14 de octubre de 2026 el chat vive en este repositorio. Ya no depende de
la máquina de Tona.

- La burbuja la carga cada página con `/public/js/f34-widget.js`.
- Las respuestas las da `POST /api/chat`, o sea `api/chat.js`.
- El modelo es Gemini por **Vertex AI**, con la cuenta de servicio del proyecto
  `forward34-sitio`. Las credenciales están en las variables de Vercel
  `GOOGLE_SA_CLIENT_EMAIL` y `GOOGLE_SA_PRIVATE_KEY`; el mecanismo está en
  `api/_google.js`.

## Cómo publicar un cambio

1. Edita `data/f34_prompt.md` y abre el pull request.
2. Al integrarlo, Vercel redespliega y el chat ya responde con el texto nuevo.
   No hay que copiar nada a ningún servidor.
3. Comprueba en forward34.com abriendo el chat y preguntando algo del tema que
   cambiaste.

## Por qué esta carpeta se publica pero no se puede leer

`data/**` está listado en `builds` del `vercel.json` para que el archivo exista en
el despliegue y la función pueda leerlo. Para que nadie lo lea desde el navegador,
`routes` devuelve 404 en `/data/`. **No quites ninguna de las dos cosas sin
entender la otra**: sin el `builds` el chat se queda con el prompt de respaldo, y
sin el `routes` el prompt vuelve a quedar público.

## Cuidado

Si `f34_prompt.md` no se puede leer, `api/chat.js` usa un prompt corto incrustado
y **no avisa**: el chat sigue contestando, pero mucho peor. Después de cualquier
cambio en esta carpeta, pruébalo de verdad.

El chat captura datos de contacto con la herramienta `enviar_lead`. Si cambias las
reglas de captura, avisa al equipo.
