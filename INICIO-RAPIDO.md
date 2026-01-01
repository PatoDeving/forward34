# 🚀 Inicio Rápido - Forward34

## Opción 1: Ver el sitio AHORA MISMO (Sin instalar nada)

### Haz doble clic en:
```
ABRIR-SITIO.bat
```

Esto abrirá el sitio en tu navegador. **¡Así de simple!**

---

## Opción 2: Configurar entorno de desarrollo (Recomendado)

### Método Automático (Windows)

1. **Haz clic derecho** en `install-nodejs.ps1`
2. Selecciona **"Ejecutar con PowerShell"**
3. Si aparece advertencia de seguridad, escribe `S` y presiona Enter
4. Espera a que termine la instalación
5. **Cierra y abre una nueva terminal**
6. Ejecuta:
   ```bash
   npm install
   npm run dev
   ```

### Método Manual

1. **Descarga Node.js:**
   - Ve a: https://nodejs.org/
   - Descarga la versión **LTS** (recomendada)
   - Instala con las opciones predeterminadas

2. **Abre una terminal** en este directorio

3. **Instala dependencias:**
   ```bash
   npm install
   ```

4. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador en:** http://localhost:3000

---

## ✅ Verificar que todo funciona

Después de instalar Node.js, abre una **nueva terminal** y ejecuta:

```bash
node --version
npm --version
```

Deberías ver las versiones instaladas. Por ejemplo:
```
v20.11.0
10.2.4
```

---

## 📋 Comandos Útiles

Una vez que Node.js esté instalado:

```bash
# Ver el sitio en el navegador
npm run dev

# También funciona
npm start

# Preparar para deployment
npm run build

# Deploy a Vercel (requiere Vercel CLI)
npm run deploy
```

---

## 🎯 Próximos Pasos

### 1. Ver el sitio
- Abre `START-HERE.html` para instrucciones completas
- O ejecuta `ABRIR-SITIO.bat`

### 2. Personalizar
- Actualiza email y teléfono en todas las páginas
- Cambia colores en `public/css/styles.css`
- Agrega tu logo

### 3. Probar
- Verifica todas las páginas
- Prueba en diferentes dispositivos
- Revisa el formulario de contacto

### 4. Deploy
- Lee `DEPLOYMENT.md`
- Sube a Vercel
- Configura dominio personalizado

---

## ❓ Problemas Comunes

### "npm no se reconoce como comando"
**Solución:**
- Reinicia tu computadora
- Abre una **nueva** terminal
- Verifica que Node.js se instaló correctamente

### "El puerto 3000 está ocupado"
**Solución:**
```bash
npm run dev -- --port 3001
```

### "No puedo ejecutar scripts de PowerShell"
**Solución:**
Ejecuta esto en PowerShell como Administrador:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📞 ¿Necesitas Ayuda?

Lee la documentación completa:
- `INSTALL-GUIDE.md` - Guía de instalación detallada
- `README.md` - Información del proyecto
- `DEPLOYMENT.md` - Cómo hacer deploy
- `CHECKLIST.md` - Lista de verificación

---

## 🎉 ¡Estás Listo!

**Opción rápida:** Doble clic en `ABRIR-SITIO.bat`

**Opción desarrollo:** Ejecuta `npm run dev`

¡Disfruta trabajando con Forward34! 🚀
