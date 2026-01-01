# Checklist Pre-Deployment

Usa este checklist antes de hacer deploy a producción.

## 📝 Contenido

- [ ] Revisar que todo el contenido esté correcto (no hay Lorem Ipsum)
- [ ] Verificar ortografía en todas las páginas
- [ ] Confirmar que los datos de la empresa son correctos
- [ ] Revisar que los textos reflejen el tono corporativo premium

## 📧 Información de Contacto

- [ ] Actualizar email real en:
  - [ ] index.html (footer)
  - [ ] empresa.html (footer)
  - [ ] servicios.html (footer)
  - [ ] descubrete.html (footer)
  - [ ] contacto.html (footer y formulario)

- [ ] Actualizar teléfono real en todos los archivos mencionados

- [ ] Actualizar dirección/ubicación si se tiene

## 📨 Formulario de Contacto

- [ ] Decidir servicio a usar (Formspree, EmailJS, etc.)
- [ ] Crear cuenta en el servicio elegido
- [ ] Obtener API key o endpoint
- [ ] Integrar en contacto.html
- [ ] Probar envío de formulario

## 📊 Analytics

- [ ] Crear cuenta de Google Analytics 4
- [ ] Obtener Measurement ID (G-XXXXXXXXXX)
- [ ] Reemplazar en todas las páginas HTML
- [ ] Verificar que funciona después del deploy

## 🎨 Personalización

- [ ] Agregar logo real de Forward34
- [ ] Decidir paleta de colores final
- [ ] Actualizar colores en styles.css si es necesario
- [ ] Agregar favicon personalizado

## 🔒 Legal

- [ ] Crear página de Aviso de Privacidad
- [ ] Crear página de Términos y Condiciones
- [ ] Actualizar enlaces en el footer

## 🔗 Enlaces

- [ ] Verificar todos los enlaces internos funcionan
- [ ] Verificar el botón "Agendar" lleva a contacto
- [ ] Si existe sitio de Descúbrete+, actualizar el enlace

## 🌐 SEO

- [ ] Revisar meta descriptions en todas las páginas
- [ ] Confirmar meta keywords
- [ ] Agregar imagen OG (Open Graph) para redes sociales
- [ ] Crear sitemap.xml (opcional pero recomendado)

## 📱 Testing

- [ ] Probar en Chrome
- [ ] Probar en Firefox
- [ ] Probar en Safari
- [ ] Probar en Edge
- [ ] Probar en móvil iOS
- [ ] Probar en móvil Android
- [ ] Verificar responsive en diferentes tamaños

## ⚡ Performance

- [ ] Optimizar imágenes (si se agregan)
- [ ] Verificar que no hay recursos bloqueantes
- [ ] Test de velocidad (PageSpeed Insights)

## 🚀 Vercel Configuration

- [ ] Cuenta de Vercel creada
- [ ] Vercel CLI instalado (si usas ese método)
- [ ] Dominio personalizado listo (si aplica)
- [ ] DNS configurado (si aplica)

## ✅ Post-Deployment

- [ ] Sitio carga correctamente
- [ ] SSL/HTTPS funcionando
- [ ] Formulario envía emails
- [ ] Analytics registrando visitas
- [ ] Responsive funciona correctamente
- [ ] No hay errores en consola del navegador
- [ ] Todas las páginas accesibles
- [ ] Compartir en redes sociales muestra preview correcto

## 📋 Notas Adicionales

Fecha objetivo de lanzamiento: _______________

Responsable técnico: _______________

Responsable de contenido: _______________

---

**Importante**: No hacer deploy a producción hasta que TODOS los items marcados con contacto real estén completados. El sitio tiene placeholders que deben ser reemplazados.

## Datos a Reemplazar OBLIGATORIAMENTE:

1. **Email**: `contacto@forward34.com` → [EMAIL REAL]
2. **Teléfono**: `+52 55 1234 5678` → [TELÉFONO REAL]
3. **Formulario**: Integrar servicio real de envío
4. **Analytics**: Agregar ID real de Google Analytics
5. **Logo**: Reemplazar texto "Forward34" por logo real
