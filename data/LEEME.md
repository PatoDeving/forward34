# Instrucciones del agente de recepción (chat del sitio)

`f34_prompt.md` es el texto que define cómo responde el chat que aparece en
forward34.com. **Este repositorio es la copia de referencia; el archivo que el
chat lee de verdad vive en el servidor.**

## Dónde corre el chat

- La burbuja la carga cada página con `https://tona34.com/static/f34-widget.js`.
- Las respuestas las da `POST https://tona34.com/api/f34/chat`.
- El código está en la máquina `tona` (proyecto de Google Cloud `tona-exc`,
  zona `us-south1-b`), en `/opt/tona`. Esa carpeta **no** está versionada.
- El archivo que el servidor lee es `/opt/tona/data/f34_prompt.md`. Si no
  existe, el código usa una copia incrustada en
  `/opt/tona/routes/f34_agent_routes.py`, que está desactualizada.

## Cómo publicar un cambio

1. Edita `data/f34_prompt.md` en este repositorio y abre el pull request.
2. Ya integrado, copia el archivo a la máquina:

   ```
   gcloud compute scp data/f34_prompt.md tona:/tmp/f34_prompt.md --project tona-exc --zone us-south1-b
   gcloud compute ssh tona --project tona-exc --zone us-south1-b --command "cd /opt/tona && sudo cp -p data/f34_prompt.md data/f34_prompt.md.bak-\$(date +%Y%m%d-%H%M) && sudo cp /tmp/f34_prompt.md data/f34_prompt.md"
   ```

3. No hace falta reiniciar: el servidor lee el archivo en cada consulta.
4. Comprueba en forward34.com abriendo el chat y preguntando algo del tema que
   cambiaste.

Cada publicación deja un respaldo con fecha en la misma carpeta del servidor.

## Cuidado

El chat captura datos de contacto (`enviar_lead`) y los guarda en la máquina.
Si cambias las reglas de captura, avisa al equipo.
