# 🎾 GUÍA DE MANTENIMIENTO - AMERICANAS SOMOSPADEL BCN

Esta guía contiene las instrucciones necesarias para mantener y escalar la aplicación a nivel profesional.

## 🛠️ 1. GESTIÓN DE LA BASE DE DATOS (Firestore)

### 🛡️ Seguridad
Las reglas de seguridad están en `firestore.rules`. 
- **NUNCA** cambies `allow read: if isAuthenticated()` a `true` sin filtros, ya que expondrías los teléfonos de los clientes.
- Si añades una nueva colección, asegúrate de restringir la escritura solo a administradores usando la función `isAdmin()`.

### 🔄 Backup
Firebase realiza backups automáticos si tienes el plan Blaze. Si no, puedes exportar los datos a JSON usando el script de consola `fix-player-ids-console.js` como base para leer datos.

---

## 🚀 2. DESPLIEGUE Y ACTUALIZACIÓN

### Pasos para subir cambios a GitHub Pages:
1. Abre tu terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   git add .
   git commit -m "Mejora: [Descripción de tu cambio]"
   git push origin main
   ```
3. GitHub Pages se actualizará automáticamente en 1-2 minutos.

### Limpieza de Caché
Debido al **Service Worker**, los usuarios pueden ver versiones antiguas.
- Para forzar la actualización, cambia la versión en `sw.js`:
  `const CACHE_NAME = 'somospadel-ultra-cache-vX';` (Incrementa la X).

---

## 📈 3. ESCALABILIDAD

### Añadir más pistas
El sistema está configurado para manejar hasta 8 pistas de forma dinámica. Si el club crece:
1. Asegúrate de que el campo `max_courts` en el documento del evento en Firestore sea el correcto.
2. La lógica de `MatchMakingService.js` se adaptará sola.

### Personalización de Estilos
El núcleo visual está en `css/theme-playtomic.css`. 
- Los colores neón se definen en las variables `--brand-neon`.
- Para cambiar el tema visual, modifica solo esas variables.

---

## 🆘 4. SOLUCIÓN DE PROBLEMAS COMUNES

| Problema | Solución |
| :--- | :--- |
| Pantalla en blanco en móvil | Haz un "Hard Refresh" (Borra caché del navegador). |
| No llegan notificaciones | Asegúrate de que el usuario aceptó los permisos de notificación al entrar. |
| Error al inscribir pareja | Verifica que ambos jugadores tengan un ID válido en el sistema. |

---

## 🔍 5. AUDITORÍA DE CALIDAD
Hemos incluido un auditor automático `VALIDAR_PROYECTO.js`.
- Para ejecutarlo, simplemente haz doble click en `EJECUTAR_AUDITORIA.bat`.
- Este script verifica:
  1. Presencia de archivos críticos.
  2. Implementación de GDPR.
  3. Integridad de las reglas de Firestore (PII Protection).
  4. Estado del Service Worker.

## 🎨 6. COMPONENTES PREMIUM (HeroCard)
La aplicación utiliza un sistema de **Hero Cards** dinámicas (`js/modules/dashboard/HeroCard.js`).
- Estas tarjetas se adaptan al contexto del jugador (victorias, próximos partidos, inscripciones).
- Utilizan un diseño **Dark Premium** con acento neón, optimizado para ser el centro de atención del dashboard.

---

**Protocolo de Calidad Anti-Gravity** - *Entregado el 22/02/2026*
