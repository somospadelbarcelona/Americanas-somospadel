# Auditoría de Seguridad y Hardening - Fase 0 (Somos Pádel)

## 1. Resumen Ejecutivo
En esta Fase 0 se han neutralizado las vulnerabilidades críticas detectadas en `firestore.rules` y se ha dotado a `functions/index.js` de la infraestructura de backend necesaria para operar con **Zero-Cost Rules** (mediante Custom Claims de Firebase Auth) e inscripciones transaccionales atómicas protegidas contra condiciones de carrera.

---

## 2. Matriz de Permisos: Antes vs Después

| Colección | Regla Anterior | Vulnerabilidad / Riesgo | Regla Endurecida (Nueva) |
|---|---|---|---|
| `broadcasts/{id}` | `allow create, update: if isAuthenticated() \|\| isAdmin()` | Cualquier usuario autenticado podía suplantar comunicados oficiales del club | **`allow create, update, delete: if isStaff()`**. Solo organizadores y directiva oficial pueden emitir avisos. |
| `system_config/{id}` | `allow write: if isAuthenticated() \|\| isAdmin()` | Cualquier usuario autenticado podía sobreescribir la configuración global | **`isStaff()`** para toda la configuración. Se autoriza únicamente al usuario autenticado para el documento específico `purged_notifications`. |
| `open_matches/{id}` | `allow update: if isAuthenticated()` | Modificación arbitraria de partidas públicas ajenas | **`isStaff() \|\| isCreator \|\| (isAuthenticated && affectedKeys == ['slots'])`**. Los jugadores solo pueden reservar/liberar su plaza en el array `slots`. |
| `chats/{id}` | `allow write: if isAuthenticated()` en raíz y mensajes | Manipulación de chats ajenos y falsificación de remitente | Documento raíz restringido a **participantes reales o Staff**. Subcolección `messages`: **`senderId == request.auth.uid`** estricto. |
| `players/{id}/devices` | Escritura permitida si `deviceId == deviceId && token.size() > 5` sin comprobar dueño | Suplantación de tokens push FCM en dispositivos de terceros | **`isOwner(playerId) \|\| isStaff()`**. Nadie puede registrar tokens en perfiles ajenos. |
| `players/{id}` (creación) | Permitía autoasignarse `isSessionAdmin: true` | Escalada de privilegios en el alta | `isOwner(playerId)` solo permite roles base (`player`, `player_americanas`, `player_somospadel`) y prohíbe `isSessionAdmin`. |
| Roles `captain` y `collaborator` | Incluidos en `isAdmin()` con acceso total comodín (`/{allPaths=**}`) | Sobreexposición innecesaria de base de datos a colaboradores y capitanes | Separados de `isStaff()`. `isCaptain()` tiene acceso restringido a sus convocatorias y reportes tácticos. |

---

## 3. Infraestructura de Custom Claims (Firebase Auth)

Para escalar a 50.000 usuarios sin incurrir en costes por lecturas repetidas de documentos (`get(/databases/.../players/uid)`), se ha implementado la capa de claims:

1. **`setUserRole` (Callable)**:
   - Permite a un miembro de Staff asignar roles tanto en Firestore como en los claims JWT del token (`request.auth.token.role`).
2. **`syncUserRoleClaimsOnWrite` (Firestore Trigger)**:
   - Sincroniza en background el claim en Firebase Auth en cuanto el campo `role` de un jugador es actualizado.
3. **`backfillRoleClaims` (Callable de Migración)**:
   - Procesa en lote a todos los usuarios existentes en la base de datos para asignarles su claim correspondiente sin intervención manual.
4. **Reglas Híbridas Resilientes**:
   - `firestore.rules` comprueba primero `request.auth.token.role` (0 lecturas). Si aún no existe el claim, recurre a `get()` como fallback transparente durante la transición.

---

## 4. Gestión Transaccional de Eventos

Se han incorporado en el servidor dos Cloud Functions atómicas para resolver el cuello de botella de concurrencia:

1. **`registerToEvent`**:
   - Valida el aforo (`max_courts * 4`), previene registros duplicados y deriva a `waitlist` con posición garantizada si no quedan plazas libres.
2. **`unregisterFromEvent`**:
   - Procesa la baja del jugador y promociona automáticamente al primer integrante de la lista de espera, reajustando parejas fijas sin inconsistencias.

---

## 5. Protocolo de Despliegue en Producción

El orden estricto para llevar a cabo el despliegue sin interrumpir el servicio es:

1. **Desplegar Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```
2. **Ejecutar Backfill de Claims**:
   - Invocar `backfillRoleClaims` desde la consola o panel de administración para sincronizar los usuarios actuales.
3. **Desplegar Reglas de Seguridad**:
   ```bash
   firebase deploy --only firestore:rules
   ```
