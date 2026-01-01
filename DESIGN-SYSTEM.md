# Forward34 — Design System

## 🎨 Identidad Visual

Forward34 es una holding. No es una marca emocional.

**Sensación:**
- Infraestructura
- Control tecnológico
- Autoridad silenciosa
- Precisión

**NO es:**
- Startup
- Motivacional
- Wellness
- Coaching

---

## 1. Colores

### Paleta Monocromática

```css
Negro profundo (Principal)
#000000

Blanco puro (Secundario)
#FFFFFF

Grises de apoyo:
#1A1A1A - Negro suave
#2B2B2B - Gris muy oscuro
#4A4A4A - Gris medio oscuro
#E6E6E6 - Gris muy claro
#F5F5F5 - Gris casi blanco
```

### Reglas de Uso

✅ **Permitido:**
- Negro sobre blanco
- Blanco sobre negro
- Grises neutros para separadores y fondos sutiles

❌ **Prohibido:**
- Colores adicionales (azul, naranja, verde, etc.)
- Gradientes
- Sombras de color
- Overlays con tinte

**NOTA:** Los colores de Descúbrete+ (naranja/azul) NO se usan en Forward34.

---

## 2. Tipografía

### Fuentes Principales

**Opción 1 (Recomendada):** Inter
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Opción 2:** Manrope
```css
font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Opción 3:** Space Grotesk
```css
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Jerarquía Tipográfica

```css
/* Display - Hero principal */
font-size: 72px (4.5rem)
font-weight: 700 (Bold)
line-height: 1.1
letter-spacing: -0.03em

/* H1 - Títulos principales */
font-size: 56px (3.5rem)
font-weight: 600 (SemiBold)
line-height: 1.1
letter-spacing: -0.02em

/* H2 - Títulos de sección */
font-size: 40px (2.5rem)
font-weight: 600 (SemiBold)
line-height: 1.2
letter-spacing: -0.01em

/* H3 - Subtítulos */
font-size: 28px (1.75rem)
font-weight: 600 (SemiBold)
line-height: 1.3
letter-spacing: 0

/* H4 - Títulos menores */
font-size: 20px (1.25rem)
font-weight: 600 (SemiBold)
line-height: 1.4
letter-spacing: 0

/* Body Large - Intros */
font-size: 20px (1.25rem)
font-weight: 400 (Regular)
line-height: 1.6
letter-spacing: 0

/* Body - Texto principal */
font-size: 16px (1rem)
font-weight: 400 (Regular)
line-height: 1.6
letter-spacing: 0

/* Body Small - Texto secundario */
font-size: 14px (0.875rem)
font-weight: 400 (Regular)
line-height: 1.5
letter-spacing: 0

/* Caption - Textos muy pequeños */
font-size: 12px (0.75rem)
font-weight: 500 (Medium)
line-height: 1.4
letter-spacing: 0.02em
text-transform: uppercase
```

### Pesos Permitidos

- **Regular (400):** Body text
- **Medium (500):** Énfasis leve, captions
- **SemiBold (600):** Headlines, títulos
- **Bold (700):** Display, hero sections

❌ **Prohibido:**
- Light (300)
- ExtraBold (800+)
- Italic (salvo citas si es necesario)

---

## 3. Espaciado

### Sistema Base (8pt grid)

```css
--spacing-xs: 8px (0.5rem)
--spacing-sm: 16px (1rem)
--spacing-md: 24px (1.5rem)
--spacing-lg: 48px (3rem)
--spacing-xl: 96px (6rem)
--spacing-2xl: 160px (10rem)
```

### Márgenes de Sección

```css
/* Entre secciones principales */
padding-top: 160px (10rem)
padding-bottom: 160px (10rem)

/* Entre secciones secundarias */
padding-top: 96px (6rem)
padding-bottom: 96px (6rem)

/* Entre bloques dentro de sección */
margin-bottom: 48px (3rem)
```

### Contenedores

```css
/* Max width del contenido */
max-width: 1440px

/* Padding lateral (desktop) */
padding-left: 80px (5rem)
padding-right: 80px (5rem)

/* Padding lateral (tablet) */
padding-left: 40px (2.5rem)
padding-right: 40px (2.5rem)

/* Padding lateral (mobile) */
padding-left: 24px (1.5rem)
padding-right: 24px (1.5rem)
```

**Regla:**
> Menos elementos, más peso visual. Mucho aire entre secciones.

---

## 4. Logo

### Uso del Logo

**Fondos permitidos:**
- ✅ Negro sólido (principal)
- ✅ Blanco sólido (secundario)
- ✅ #1A1A1A si es necesario

**Versiones:**
- Logo blanco sobre fondo negro (preferente)
- Logo negro sobre fondo blanco (alternativo)

### Ubicación

- **Header:** Izquierda, 40px de alto
- **Footer:** Centro o izquierda, 32px de alto

### Prohibiciones

❌ **NO aplicar:**
- Sombras
- Gradientes
- Animaciones (salvo fade in inicial)
- Distorsiones o efectos
- Fondos con imagen
- Overlays

---

## 5. Imágenes

### Estilo Visual

**Temáticas permitidas:**
- Liderazgo corporativo
- Tecnología abstracta
- Arquitectura moderna
- Equipos profesionales en contexto formal
- Interfaces y código
- Datos y visualizaciones

**Tratamiento:**
- Blanco y negro (preferente)
- Alto contraste
- Grano sutil editorial
- Desaturadas si tienen color

**Prohibido:**
- Stock emocional / lifestyle
- Wellness / naturaleza
- Sonrisas forzadas
- Coaching / motivacionales
- Colores saturados
- Filtros vintage

### Especificaciones Técnicas

```
Formato: WebP (fallback JPG)
Ratio: 16:9 o 3:2 (editorial)
Compresión: 85% calidad
Lazy loading: Siempre
```

---

## 6. Animaciones

### Inspiración

Basadas en el logo de Forward34:
- Arcos
- Movimiento circular preciso
- Transiciones controladas

### Animaciones Permitidas

```css
/* Fade In */
opacity: 0 → 1
duration: 0.6s
easing: ease-out

/* Slide Suave */
transform: translateY(20px) → translateY(0)
duration: 0.6s
easing: ease-out

/* Hover en elementos */
transition: all 0.3s ease
transform: translateY(-4px)
```

### Prohibido

❌ **NO usar:**
- Parallax
- Efectos llamativos
- Loops infinitos
- Bounces o elásticos
- Rotaciones dramáticas
- Efectos 3D

**Regla:**
> El sitio debe sentirse preciso, serio y controlado.

---

## 7. Componentes

### Botones

**Primario (Negro):**
```css
background: #000000
color: #FFFFFF
padding: 16px 32px
border-radius: 4px
font-weight: 600
font-size: 16px
letter-spacing: 0.02em

hover:
  background: #1A1A1A
  transform: translateY(-2px)
```

**Secundario (Outline):**
```css
background: transparent
color: #000000
border: 2px solid #000000
padding: 14px 30px
border-radius: 4px

hover:
  background: #000000
  color: #FFFFFF
```

### Cards

```css
background: #FFFFFF
border: 1px solid #E6E6E6
border-radius: 8px
padding: 40px

hover:
  border-color: #000000
  transform: translateY(-4px)
  transition: all 0.3s ease
```

### Separadores

```css
Líneas horizontales:
  border-top: 1px solid #E6E6E6
  margin: 96px 0

Líneas verticales (si aplica):
  border-left: 1px solid #E6E6E6
  height: 100%
```

---

## 8. Grid y Layout

### Grid System

```css
display: grid
gap: 48px

/* 2 columnas */
grid-template-columns: repeat(2, 1fr)

/* 3 columnas */
grid-template-columns: repeat(3, 1fr)

/* 4 columnas */
grid-template-columns: repeat(4, 1fr)
```

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px)

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px)

/* Desktop */
@media (min-width: 1025px)

/* Large Desktop */
@media (min-width: 1440px)
```

---

## 9. Sensación General

### Holding. Infraestructura. Control.

El sitio debe transmitir:
- ✅ Tecnología sobria
- ✅ Autoridad silenciosa
- ✅ Precisión
- ✅ Profesionalismo
- ✅ Solidez corporativa

El sitio NO debe transmitir:
- ❌ Emoción
- ❌ Motivación
- ❌ Dinamismo startup
- ❌ Cercanía lifestyle
- ❌ Creatividad expresiva

---

## 10. Referencias de Implementación

### HTML Semántico
```html
<section class="section-editorial">
  <div class="container-wide">
    <h2 class="headline-lg">Título</h2>
    <p class="body-large">Intro text</p>
  </div>
</section>
```

### Nomenclatura de Clases
```
.section-editorial
.container-wide
.headline-{size}
.body-{size}
.btn-primary
.btn-secondary
.card-minimal
.grid-{columns}
```

---

## ✅ Checklist de Implementación

- [ ] Tipografía geométrica (Inter/Manrope/Space Grotesk)
- [ ] Solo negro, blanco y grises
- [ ] Espaciado amplio (96px-160px entre secciones)
- [ ] Logo sin efectos
- [ ] Imágenes B&N o alto contraste
- [ ] Animaciones sutiles únicamente
- [ ] Sin colores adicionales
- [ ] Márgenes editoriales amplios
- [ ] Aire visual entre elementos

---

**Última actualización:** 2025-01-30
**Versión:** 1.0
**Aprobado por:** Forward34 Brand Team
