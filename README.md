# Forward34 - Sitio Web Corporativo

Sitio web corporativo de Forward34 S.A. de C.V., empresa mexicana especializada en estrategia y transformación organizacional.

## Estructura del Proyecto

```
forward34/
├── index.html              # Página de inicio
├── empresa.html           # Página sobre la empresa
├── servicios.html         # Página de servicios
├── descubrete.html        # Página de Descúbrete+
├── contacto.html          # Página de contacto
├── public/
│   └── css/
│       └── styles.css     # Estilos principales
├── vercel.json            # Configuración de Vercel
└── README.md              # Este archivo
```

## Características

- **Diseño Premium**: Look corporativo inspirado en exor.com
- **Responsive**: Optimizado para todos los dispositivos
- **SEO Ready**: Meta tags y Open Graph configurados
- **Animaciones Sutiles**: Fade-in y scroll effects
- **Performance**: CSS optimizado y lazy loading
- **Accesibilidad**: Contraste y tamaños legibles

## Páginas

1. **Inicio** - Hero, servicios principales, proceso y CTAs
2. **Empresa** - Información corporativa y principios
3. **Servicios** - Detalle de los 5 servicios principales
4. **Descúbrete+** - Información sobre la marca operativa
5. **Contacto** - Formulario y datos de contacto

## Deployment en Vercel

### Opción 1: Desde el CLI de Vercel

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Desde el directorio del proyecto
vercel

# Para producción
vercel --prod
```

### Opción 2: Desde la interfaz web de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub/GitLab/Bitbucket
3. Importa este repositorio
4. Vercel detectará automáticamente la configuración
5. Click en "Deploy"

### Opción 3: Deployment directo sin Git

```bash
# Desde el directorio del proyecto
vercel --prod
```

## Personalización

### Actualizar información de contacto

Edita los siguientes archivos para actualizar email, teléfono y ubicación:

- Footer en todas las páginas HTML
- Página de contacto (`contacto.html`)

### Integrar formulario de contacto

El formulario actual es una simulación. Para producción, integra con:

- **Formspree**: https://formspree.io/
- **Netlify Forms**: https://www.netlify.com/products/forms/
- **EmailJS**: https://www.emailjs.com/

### Agregar Analytics

En el `<head>` de cada página hay un placeholder para Google Analytics.
Reemplaza `GA_MEASUREMENT_ID` con tu ID real:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Personalizar colores

Edita las variables CSS en `public/css/styles.css`:

```css
:root {
  --color-primary: #000000;
  --color-accent: #0066cc;
  /* etc... */
}
```

## Información de contacto actual (placeholder)

- **Email**: contacto@forward34.com
- **Teléfono**: +52 55 1234 5678
- **Ubicación**: México

**Actualiza estos valores antes de hacer deploy a producción.**

## Licencia

© 2025 Forward34 S.A. de C.V. Todos los derechos reservados.
# forward34
# forward34
