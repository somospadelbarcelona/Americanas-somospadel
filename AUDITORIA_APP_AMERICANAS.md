# 🔍 AUDITORÍA COMPLETA - APP AMERICANAS SOMOSPADEL

**Fecha:** 17 de Enero de 2026  
**Auditor:** Kilo Code AI  
**Versión de la App:** v2026

---

## 📋 RESUMEN EJECUTIVO

La aplicación "Americanas SomosPadel" es una **PWA (Progressive Web App)** para gestionar torneos de pádel tipo "Americana" y entrenamientos. Utiliza **Firebase (Firestore + Auth)** como backend principal y tiene un backend secundario en **Python/FastAPI** con SQLite.

### Puntuación General: **7.2/10**

| Categoría | Puntuación | Estado |
|-----------|------------|--------|
| Arquitectura | 7/10 | ⚠️ Mejorable |
| Seguridad | 5/10 | 🔴 Crítico |
| Rendimiento | 7/10 | ⚠️ Mejorable |
| Mantenibilidad | 6/10 | ⚠️ Mejorable |
| UX/UI | 8/10 | ✅ Bueno |
| Funcionalidad | 9/10 | ✅ Excelente |

---

## 🏗️ ARQUITECTURA

### Estructura del Proyecto
```
AMERICANAS/
├── index.html          # Entry point principal
├── admin.html          # Panel de administración
├── js/
│   ├── app.js          # Punto de entrada JS
│   ├── core/           # Servicios fundamentales
│   │   ├── AuthService.js
│   │   ├── DatabaseService.js
│   │   ├── Router.js
│   │   ├── StateManager.js
│   │   └── SecurityArmor.js
│   └── modules/        # Módulos de negocio
│       ├── americanas/
│       ├── dashboard/
│       ├── common/
│       └── logic/
├── api/                # Backend Python (secundario)
│   ├── main.py
│   ├── database.py
│   └── models.py
└── css/                # Estilos
```

### ✅ Puntos Positivos
1. **Separación de responsabilidades** clara entre módulos
2. **Patrón Pub/Sub** implementado en StateManager
3. **PWA completa** con Service Worker y manifest
4. **Persistencia offline** habilitada en Firestore

### ⚠️ Problemas Detectados

#### 1. Patrón Global Window (Anti-patrón)
**Severidad: Media**

Todos los módulos se exponen al objeto `window` global:
```javascript
// AuthService.js:172
window.AuthService = new AuthService();

// Router.js:126
window.Router = new Router();
```

**Recomendación:** Migrar a ES6 Modules con `import/export` para mejor encapsulación.

#### 2. Duplicación de Backends
**Severidad: Media**

Existe un backend Python/FastAPI (`api/`) que parece no estar en uso activo. La app usa principalmente Firebase.

**Recomendación:** Eliminar el backend Python si no se usa, o documentar su propósito.

#### 3. Archivos Versionados en Nombre
**Severidad: Baja**

```
EventsController_V6.js  # ¿Por qué V6?
```

**Recomendación:** Usar Git para versionado, no nombres de archivo.

---

## 🔐 SEGURIDAD

### 🔴 PROBLEMAS CRÍTICOS

#### 1. API Key de Firebase Expuesta
**Severidad: CRÍTICA**

```javascript
// firebase-config.js:6
const firebaseConfig = {
  apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
  // ... resto de config
};
```

**Riesgo:** Cualquiera puede ver esta API key en el código fuente.

**Mitigación:**
- Configurar **Firebase Security Rules** estrictas
- Usar **App Check** para validar solicitudes
- Restringir la API key por dominio en Google Cloud Console

#### 2. Contraseñas en Texto Plano
**Severidad: CRÍTICA**

```javascript
// AuthService.js:89
if (playerData.password !== password) {
    throw new Error("Contraseña incorrecta");
}
```

```python
# api/main.py:291
if user.password != creds.password:
    raise HTTPException(...)
```

**Riesgo:** Las contraseñas se almacenan y comparan sin hash.

**Solución:**
```python
# Usar bcrypt o argon2
from passlib.hash import bcrypt
hashed = bcrypt.hash(password)
bcrypt.verify(password, hashed)
```

#### 3. Credenciales de Admin Hardcodeadas
**Severidad: ALTA**

```python
# api/main.py:219-234
admin_phone = "649219350"
admin.password = "JARABA"
```

```javascript
// firebase-init.js:481-483
phone: "649219350",
password: "JARABA",
```

**Riesgo:** Credenciales de administrador visibles en código fuente.

**Solución:** Usar variables de entorno.

#### 4. Autenticación Local Insegura (Fallback)
**Severidad: ALTA**

```javascript
// AuthService.js:78-120
// === LOCAL AUTHENTICATION FALLBACK ===
// Try to authenticate against Firestore directly
```

El sistema permite autenticación directa contra Firestore sin Firebase Auth, lo cual bypasea las protecciones de Firebase.

#### 5. Sin Validación de Roles en Frontend
**Severidad: MEDIA**

No hay verificación consistente de roles antes de mostrar opciones de admin.

```javascript
// app.js:161
<div class="drawer-item" onclick="window.location.href='admin.html'">
    <span>PANEL ADMIN</span>
</div>
```

**Solución:** Verificar rol antes de renderizar:
```javascript
if (currentUser?.role === 'admin' || currentUser?.role === 'admin_player') {
    // Mostrar opción admin
}
```

### ⚠️ Problemas Moderados

#### 6. SecurityArmor Deshabilitado
```javascript
// SecurityArmor.js:8-12
const CONFIG = {
    enableDevToolsDetection: false, // DESHABILITADO
    disableRightClick: false,       // DESHABILITADO
    // ...
};
```

Aunque esto es correcto para desarrollo, asegurarse de habilitarlo en producción si se desea protección anti-inspección.

#### 7. Sin Rate Limiting
La API no tiene protección contra ataques de fuerza bruta en login.

---

## ⚡ RENDIMIENTO

### ✅ Puntos Positivos
1. **Persistencia offline** de Firestore habilitada
2. **Lazy loading** implícito por rutas
3. **Service Worker** para caché

### ⚠️ Problemas Detectados

#### 1. Listeners No Limpiados
**Severidad: Media**

```javascript
// EventsController_V6.js:90-98
this.unsubscribeEvents = window.db.collection('americanas')
    .onSnapshot(snap => { ... });
```

Los listeners de Firestore se crean pero no siempre se limpian al cambiar de vista.

**Solución:**
```javascript
// En el destructor o cambio de vista
if (this.unsubscribeEvents) this.unsubscribeEvents();
```

#### 2. Múltiples Queries Redundantes
```javascript
// EventsController_V6.js:386-400
this.unsubscribeMatchesA = window.db.collection('matches').where('team_a_ids', 'array-contains', uid)...
this.unsubscribeMatchesB = window.db.collection('matches').where('team_b_ids', 'array-contains', uid)...
this.unsubscribeEntrenosA = window.db.collection('entrenos_matches').where('team_a_ids', 'array-contains', uid)...
this.unsubscribeEntrenosB = window.db.collection('entrenos_matches').where('team_b_ids', 'array-contains', uid)...
```

4 listeners separados para obtener partidos de un jugador.

**Solución:** Usar una Cloud Function o índice compuesto.

#### 3. Broadcast Excesivo en Timer
```javascript
// AmericanaLogic.js:177-186
this.timerInterval = setInterval(() => {
    if (this.state.timeLeft > 0) {
        this.state.timeLeft--;
        this.broadcast(); // Cada segundo!
    }
}, 1000);
```

**Solución:** Usar `requestAnimationFrame` o actualizar UI directamente sin broadcast completo.

#### 4. Cache Busting Manual
```html
<!-- index.html -->
<script src="js/core/Router.js?v=5.7"></script>
<script src="js/modules/logic/MatchMakingService.js?v=5011"></script>
```

**Solución:** Usar un bundler (Vite, Webpack) con hash automático.

---

## 🧹 MANTENIBILIDAD

### ⚠️ Problemas Detectados

#### 1. Código Duplicado
El manejo de waitlist está duplicado en:
- `firebase-init.js` (FirebaseDB.americanas.addToWaitlist)
- `firebase-init.js` (FirebaseDB.entrenos.addToWaitlist)
- `ParticipantService.js`

**Solución:** Crear una clase base `EventCollection` con métodos compartidos.

#### 2. Comentarios TODO Pendientes
```javascript
// EventService.js:81
// TODO: Optional - delete associated matches?
```

#### 3. Console.logs en Producción
```javascript
// Múltiples archivos
console.log("🚀 EventService Loaded");
console.log("✅ MatchMakingService EXPORTED SUCCESSFULLY!");
```

**Solución:** Usar un logger configurable por entorno.

#### 4. Inconsistencia en Nombres de Campos
```javascript
// Diferentes archivos usan:
player.id vs player.uid
event.players vs event.registeredPlayers
score_a vs scoreA
```

#### 5. Modelo Python con Columna Duplicada
```python
# api/models.py:31
category_preference = Column(String, default="mixed") # Duplicada!
category_preference = Column(String, default="mixed") # Duplicada!
```

---

## 🎨 UX/UI

### ✅ Puntos Positivos
1. **Diseño mobile-first** bien implementado
2. **Feedback visual** con animaciones (neonPulse, etc.)
3. **PWA instalable** con splash screen
4. **Navegación intuitiva** con tabs y drawer

### ⚠️ Mejoras Sugeridas
1. Añadir **skeleton loaders** en lugar de spinners genéricos
2. Implementar **pull-to-refresh** nativo
3. Mejorar **accesibilidad** (ARIA labels, contraste)

---

## 🔧 RECOMENDACIONES PRIORITARIAS

### 🔴 Urgente (Hacer YA)

1. **Hashear contraseñas** con bcrypt/argon2
2. **Mover credenciales** a variables de entorno
3. **Configurar Firebase Security Rules** estrictas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == playerId || 
                      get(/databases/$(database)/documents/players/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. **Eliminar autenticación local fallback** o asegurarla

### ⚠️ Importante (Esta semana)

5. **Limpiar listeners** de Firestore al cambiar de vista
6. **Eliminar código duplicado** de waitlist
7. **Corregir columna duplicada** en models.py
8. **Implementar rate limiting** en login

### 💡 Mejoras (Próximo sprint)

9. **Migrar a ES6 Modules** con bundler
10. **Añadir tests unitarios** (Jest/Vitest)
11. **Implementar logging centralizado**
12. **Documentar API** con OpenAPI/Swagger

---

## 📊 MÉTRICAS DE CÓDIGO

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| Archivos JS | ~35 | - |
| Líneas de código JS | ~8,000 | - |
| Dependencias externas | 3 (Firebase, Chart.js, FontAwesome) | ✅ |
| Cobertura de tests | 0% | 🔴 >70% |
| Complejidad ciclomática promedio | Alta | ⚠️ Media |

---

## 🏁 CONCLUSIÓN

La aplicación tiene una **funcionalidad sólida** y una **buena experiencia de usuario**, pero presenta **vulnerabilidades de seguridad críticas** que deben abordarse antes de un despliegue en producción con usuarios reales.

**Prioridad máxima:** Seguridad de autenticación y almacenamiento de contraseñas.

---

*Informe generado automáticamente por Kilo Code AI*
