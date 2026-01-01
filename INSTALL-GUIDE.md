# 🚀 Guía de Instalación - Forward34

Esta guía te ayudará a configurar todo lo necesario para trabajar con el sitio.

## Opción 1: Ver el Sitio SIN Servidor (Más Rápido)

### Solo para revisar el contenido

Simplemente haz **doble clic** en cualquier archivo HTML:
- `START-HERE.html` - Instrucciones generales
- `index.html` - Página de inicio
- `empresa.html`, `servicios.html`, etc.

**Nota:** Algunas funcionalidades pueden no funcionar al 100% sin un servidor.

---

## Opción 2: Instalar Node.js (RECOMENDADO para desarrollo)

### Paso 1: Descargar Node.js

1. Ve a: **https://nodejs.org/**
2. Descarga la versión **LTS** (Long Term Support)
3. Ejecuta el instalador
4. Acepta todas las opciones predeterminadas
5. **IMPORTANTE:** Marca la casilla "Automatically install necessary tools"

### Paso 2: Verificar la instalación

Abre una **nueva** terminal (PowerShell o CMD) y ejecuta:

```bash
node --version
npm --version
```

Deberías ver algo como:
```
v20.x.x
10.x.x
```

### Paso 3: Instalar dependencias del proyecto

Desde el directorio del proyecto (donde está este archivo):

```bash
npm install
```

### Paso 4: Iniciar servidor de desarrollo

```bash
npm run dev
```

El sitio se abrirá automáticamente en: **http://localhost:3000**

---

## Opción 3: Servidor Simple con Python

Si prefieres usar Python:

### Instalar Python

1. Ve a: **https://www.python.org/downloads/**
2. Descarga Python 3.x
3. **IMPORTANTE:** Durante la instalación marca "Add Python to PATH"

### Iniciar servidor

Desde el directorio del proyecto:

```bash
# Python 3
python -m http.server 8000

# O si tienes Python 2
python -m SimpleHTTPServer 8000
```

Luego abre: **http://localhost:8000**

---

## Opción 4: Usar Visual Studio Code Live Server

Si usas VS Code:

1. Instala la extensión **"Live Server"** de Ritwick Dey
2. Haz clic derecho en `index.html`
3. Selecciona **"Open with Live Server"**

---

## ¿Qué opción elegir?

| Opción | Pros | Contras | Recomendado para |
|--------|------|---------|------------------|
| **Sin servidor** | Rápido, sin instalación | Funcionalidad limitada | Solo revisar contenido |
| **Node.js** | Completo, mejor para desarrollo | Requiere instalación | Desarrollo y deployment |
| **Python** | Simple, ligero | Básico | Vista previa rápida |
| **VS Code Live Server** | Fácil si usas VS Code | Requiere VS Code | Desarrollo en VS Code |

---

## Mi Recomendación

**Para trabajar en este proyecto:** Instala **Node.js** (Opción 2)

**Razones:**
- ✅ Es el estándar de la industria
- ✅ Lo necesitarás para Vercel CLI
- ✅ Mejor experiencia de desarrollo
- ✅ Hot reload automático
- ✅ Herramientas de build incluidas

---

## Después de Instalar Node.js

Una vez que tengas Node.js instalado:

### 1. Inicializar el proyecto

```bash
npm install
```

### 2. Scripts disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Deploy a Vercel
npm run deploy
```

### 3. Instalar Vercel CLI

```bash
npm install -g vercel
```

---

## Solución de Problemas

### "npm no se reconoce como comando"

**Solución:**
- Cierra y abre una nueva terminal
- Reinicia tu computadora
- Verifica que Node.js se instaló correctamente

### "El servidor no inicia"

**Solución:**
- Verifica que estás en el directorio correcto
- Asegúrate de que el puerto no esté ocupado
- Intenta con otro puerto: `npm run dev -- --port 3001`

### "Los cambios no se reflejan"

**Solución:**
- Refresca el navegador con Ctrl+F5
- Verifica que guardaste los archivos
- Reinicia el servidor de desarrollo

---

## Próximos Pasos

Una vez que tengas el servidor funcionando:

1. ✅ Revisar todas las páginas
2. ✅ Verificar responsive design
3. ✅ Actualizar información de contacto
4. ✅ Personalizar colores y estilos
5. ✅ Integrar formulario de contacto
6. ✅ Agregar Google Analytics
7. ✅ Deploy a Vercel

---

## ¿Necesitas Ayuda?

- **Node.js Docs:** https://nodejs.org/docs/
- **npm Docs:** https://docs.npmjs.com/
- **Vercel Docs:** https://vercel.com/docs

---

**¿Todo listo?** Abre una terminal en este directorio y ejecuta:

```bash
npm install
npm run dev
```

🎉 ¡Listo para empezar!
