# 🔥 Sistema CRM Padel Americanas - Firebase Edition

Sistema de gestión de Americanas de pádel **100% frontend** usando Firebase. Listo para deployment en GitHub Pages sin necesidad de servidor backend.

## 🚀 Configuración Rápida

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (nombre sugerido: "americanas-padel")
3. **Activa Firestore Database**:
   - Ve a "Build" > "Firestore Database"
   - Click "Create database"
   - Selecciona "Start in production mode"
   - Elige la ubicación más cercana (ej: europe-west1)

4. **Activa Authentication**:
   - Ve a "Build" > "Authentication"
   - Click "Get started"
   - NO necesitas activar ningún proveedor (usamos Firestore directamente)

5. **Obtén las credenciales**:
   - Ve a "Project Settings" (⚙️ arriba a la izquierda)
   - Scroll down hasta "Your apps"
   - Click en el icono web `</>`
   - Registra tu app (nombre: "Americanas Web")
   - **Copia el objeto `firebaseConfig`**

### 2. Configurar el Proyecto

1. Abre `public/js/firebase-config.template.js`
2. Copia el archivo y renómbralo a `firebase-config.js`
3. Reemplaza las credenciales con las de tu proyecto Firebase
4. Guarda el archivo

**Ejemplo:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...",  // Tu API Key
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};

window.FIREBASE_CONFIG = firebaseConfig;
```

### 3. Configurar Reglas de Firestore

En Firebase Console > Firestore Database > Rules, pega estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players collection - read for all, write only for authenticated
    match /players/{playerId} {
      allow read: if true;
      allow write: if true; // En producción, agregar autenticación
    }
    
    // Americanas collection
    match /americanas/{americanaId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Matches collection
    match /matches/{matchId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 4. Probar Localmente

1. Abre `public/index.html` en tu navegador
2. Deberías ver el modal de login
3. **Credenciales de admin**: `649219350` / `JARABA`
4. El usuario admin se crea automáticamente en Firestore

## 📦 Deployment en GitHub Pages

### Opción 1: GitHub Pages (Recomendado)

1. Crea un repositorio en GitHub
2. Sube todo el contenido de la carpeta `public/` a la raíz del repo
3. Ve a Settings > Pages
4. Selecciona "Deploy from branch" > "main" > "/ (root)"
5. ¡Listo! Tu app estará en `https://tu-usuario.github.io/tu-repo`

### Opción 2: Netlify/Vercel

1. Conecta tu repositorio a Netlify o Vercel
2. Configura el directorio de publicación como `public`
3. Deploy automático en cada push

## 🔐 Sistema de Usuarios

### Usuario Admin (Predefinido)
- **Teléfono**: 649219350
- **Contraseña**: JARABA
- **Permisos**: Acceso total, aprobar usuarios, gestionar americanas

### Registro de Nuevos Usuarios
1. Los usuarios se registran desde el formulario
2. Quedan en estado "pending"
3. El admin debe aprobarlos desde el panel de administración
4. Una vez aprobados, pueden iniciar sesión

## 📁 Estructura del Proyecto

```
AMERICANAS/
├── public/
│   ├── index.html              # Página principal
│   ├── admin.html              # Panel de admin (legacy)
│   ├── css/
│   │   └── style.css           # Estilos
│   ├── js/
│   │   ├── firebase-config.template.js  # Template de configuración
│   │   ├── firebase-config.js  # TU configuración (gitignored)
│   │   ├── firebase-init.js    # Inicialización de Firebase
│   │   ├── app.js              # Lógica principal
│   │   └── admin.js            # Lógica de admin
│   └── img/
│       └── logo.png            # Logo del club
├── .gitignore                  # Protege credenciales
└── README.md                   # Este archivo
```

## 🎯 Funcionalidades

✅ Login y registro de usuarios
✅ Aprobación de usuarios por admin
✅ Gestión de Americanas (crear, inscribir jugadores)
✅ Dashboard con estadísticas
✅ Panel de administración
✅ Base de datos en tiempo real con Firestore
✅ Persistencia offline
✅ 100% frontend (sin servidor)

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Firestore (NoSQL Database)
- **Hosting**: GitHub Pages / Netlify / Vercel
- **Autenticación**: Custom con Firestore

## 📝 Notas Importantes

- **firebase-config.js** está en `.gitignore` para proteger tus credenciales
- El archivo `firebase-config.template.js` es solo una plantilla
- El usuario admin se crea automáticamente al cargar la app por primera vez
- Los datos se sincronizan en tiempo real entre todos los usuarios

## 🐛 Troubleshooting

### "Firebase config not found"
- Asegúrate de haber creado `firebase-config.js` desde el template
- Verifica que el archivo esté en `public/js/`

### "Permission denied" en Firestore
- Revisa las reglas de seguridad en Firebase Console
- Asegúrate de que las reglas permitan lectura/escritura

### El admin no puede entrar
- Verifica que Firestore esté activado
- Abre la consola del navegador y busca errores
- El usuario admin se crea automáticamente, espera unos segundos

## 📞 Soporte

Para cualquier duda o problema, revisa la consola del navegador (F12) para ver logs detallados.

---

**¡Disfruta de tu sistema de gestión de Americanas! 🎾**
