# Guía de Deployment en Vercel

## Pre-requisitos

Antes de hacer deploy, asegúrate de:

1. ✅ Actualizar información de contacto (email, teléfono)
2. ✅ Configurar el formulario de contacto con un servicio real
3. ✅ Agregar tu Google Analytics ID
4. ✅ Revisar todos los enlaces y CTAs

## Método 1: Deploy con Vercel CLI (Recomendado)

### Paso 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

### Paso 3: Deploy

Desde el directorio del proyecto:

```bash
# Para preview
vercel

# Para producción
vercel --prod
```

## Método 2: Deploy desde Git

### Paso 1: Crear repositorio Git

```bash
git init
git add .
git commit -m "Initial commit - Forward34 website"
```

### Paso 2: Subir a GitHub

```bash
# Crear repo en GitHub y luego:
git remote add origin https://github.com/tu-usuario/forward34.git
git branch -M main
git push -u origin main
```

### Paso 3: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración
5. Click en "Deploy"

## Método 3: Deploy directo (Sin Git)

1. Ve a [vercel.com](https://vercel.com)
2. Arrastra la carpeta del proyecto a la interfaz web de Vercel
3. Vercel hará el deploy automáticamente

## Configuración del Dominio

### Dominio personalizado

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en "Settings" > "Domains"
3. Agrega tu dominio (ej: forward34.com)
4. Sigue las instrucciones para configurar los DNS

### Configuración DNS típica

```
A Record: 76.76.21.21
CNAME www: cname.vercel-dns.com
```

## Variables de Entorno (Si las necesitas)

Si agregas funcionalidad backend o servicios externos:

1. Ve a "Settings" > "Environment Variables"
2. Agrega las variables necesarias:
   - `FORMSPREE_ID` (para formularios)
   - `GA_MEASUREMENT_ID` (Google Analytics)
   - etc.

## Integrar Formulario de Contacto

### Opción A: Formspree (Recomendado - Gratis hasta 50 envíos/mes)

1. Crea cuenta en [formspree.io](https://formspree.io)
2. Crea un nuevo formulario
3. Obtén tu endpoint
4. En `contacto.html`, reemplaza el código JavaScript con:

```html
<form action="https://formspree.io/f/TU_FORM_ID" method="POST">
  <!-- campos del formulario -->
</form>
```

### Opción B: Netlify Forms (Si usas Netlify en lugar de Vercel)

Agrega `data-netlify="true"` al form:

```html
<form data-netlify="true" name="contact">
  <!-- campos -->
</form>
```

### Opción C: EmailJS (JavaScript - Gratis hasta 200 emails/mes)

1. Crea cuenta en [emailjs.com](https://www.emailjs.com)
2. Configura tu servicio de email
3. Sigue su documentación para integrar

## Agregar Google Analytics

En todas las páginas HTML, reemplaza el placeholder:

```html
<!-- Reemplazar esto: -->
<!-- <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script> -->

<!-- Por esto: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Verificación Post-Deploy

Después del deploy, verifica:

- [ ] Todas las páginas cargan correctamente
- [ ] El formulario de contacto funciona
- [ ] Los enlaces de navegación funcionan
- [ ] El sitio se ve bien en mobile
- [ ] No hay errores en la consola del navegador
- [ ] Google Analytics está funcionando (si lo configuraste)
- [ ] El sitio tiene SSL (https://)

## Mantenimiento

### Actualizar el sitio

```bash
# Método CLI
vercel --prod

# Método Git
git add .
git commit -m "Descripción de cambios"
git push
# Vercel deployará automáticamente
```

### Rollback

Si algo sale mal:

1. Ve al dashboard de Vercel
2. Click en "Deployments"
3. Encuentra el deployment anterior que funcionaba
4. Click en "Promote to Production"

## Soporte

- Documentación Vercel: https://vercel.com/docs
- Soporte Vercel: https://vercel.com/support

## Notas Importantes

- El plan gratuito de Vercel incluye:
  - 100 GB bandwidth
  - Despliegues ilimitados
  - SSL automático
  - CDN global

- Para sitios de producción importantes, considera el plan Pro de Vercel

---

¿Necesitas ayuda? Consulta la [documentación oficial de Vercel](https://vercel.com/docs).
