# Recursos descargables (PDFs)

Aquí van los PDFs que la gente descarga desde `recurso.html`.

## Cómo agregar un recurso nuevo

1. Sube el PDF a esta carpeta.
2. Abre [`public/data/recursos.json`](../data/recursos.json), copia un bloque
   completo y pégalo antes del corchete final. Cambia `slug`, `titulo`,
   `gancho`, los 3 `bullets` y la ruta del `pdf`.
3. La ruta del `pdf` debe coincidir **exactamente** con el nombre del archivo
   que subiste, con el prefijo `/public/pdfs/`.
4. Listo. El enlace para ManyChat queda así:

```
https://forward34.com/recurso.html?r=TU-SLUG&utm_source=forward34
```

No hay que tocar la página ni la función. Solo el JSON y el PDF.

## Reglas para los nombres

- Minúsculas, sin acentos, sin espacios y sin ñ.
- Palabras separadas con guion medio: `liderazgo-ia.pdf`.
- Usa el mismo nombre que el slug. Es lo más fácil de rastrear después.

El `slug` es lo que viaja en la URL. **No lo cambies una vez publicado**, o los
enlaces que ya repartiste en Instagram dejan de funcionar.

## Las tres cuentas

El mismo recurso se comparte desde tres cuentas distintas. Lo único que cambia
en el enlace es el `utm_source`, y es lo que aparece en la columna `fuente`
del Google Sheet:

| Cuenta | utm_source |
|---|---|
| Forward34 | `forward34` |
| Descúbrete+ | `descubrete` |
| Héctor (personal) | `hector` |

El recurso y la cuenta son independientes: cualquier recurso puede venir de
cualquier cuenta.

## PDFs actuales

| Archivo | Recurso | Slug |
|---|---|---|
| `criterio.pdf` | Tu criterio es la nueva ventaja competitiva | `criterio-ia` |
| `conocimiento-interno.pdf` | El conocimiento interno como tu mayor ventaja | `conocimiento-interno` |
| `momento-sputnik.pdf` | El momento Sputnik de la IA | `momento-sputnik` |

## Dos cosas que conviene saber

**Los archivos quedan en una URL pública.** Cualquiera con el enlace directo
puede abrirlos sin dejar su correo. Es lo normal en un lead magnet —el muro
captura a la gran mayoría que llega por el camino esperado— pero no pongas
aquí nada confidencial.

**Cuida el peso.** Menos de 5 MB por archivo. Casi todo el tráfico llega desde
el navegador de Instagram en celular, muchas veces con datos móviles.
