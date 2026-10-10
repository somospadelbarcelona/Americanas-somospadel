# Fase 1: Arquitectura Multi-Organizador (SaaS B2B para Clubes)

## 1. Contexto y Objetivos (Sin Pasarela de Pagos)
Tal como has determinado, se ha descartado la pasarela de pagos en esta etapa para priorizar el **modelo de negocio B2B por suscripción de clubes/organizadores** y la preparación del sistema para soportar de 500 a 50.000 usuarios sin fricción.

El foco de la Fase 1 es transformar la plataforma de una herramienta monousuario/monoclub en un **sistema multi-tenant robusto**:
- Cada club o entidad organizadora dispone de su propia identidad y espacio (`organizations/{orgId}`).
- Los organizadores y árbitros operan bajo el paraguas de su club (`orgId` en Custom Claims).
- Los jugadores pueden participar en eventos de su club o de la red global sin colisiones.

---

## 2. Cambios Implementados en `firestore.rules`

Se ha añadido la partición de seguridad para organizaciones:

```javascript
// ==========================================
// MULTI-TENANT ORGANIZACIONES (CLUBES Y SEDES)
// ==========================================
match /organizations/{orgId} {
  allow read: if true; // Lectura pública para landing/cartelería del club
  allow write: if isStaff();

  match /members/{memberId} {
    allow read: if isAuthenticated();
    allow write: if isStaff();
  }
}
```

---

## 3. Nuevas Cloud Functions Implementadas (`functions/index.js`)

Se han desarrollado las callables atómicas para dar de alta clubes y vincular coordinadores:

1. **`createOrganization`**:
   - Da de alta formalmente un club en `organizations/{slug}` con metadatos de sede, pistas máximas y contacto.
   - Restringido a Staff/SuperAdmin para control centralizado de licencias B2B.

2. **`assignUserToOrganization`**:
   - Inyecta de forma atómica en los Custom Claims de Firebase Auth los atributos `{ role: 'organizer', orgId: 'slug-club' }`.
   - Registra al usuario en la subcolección `organizations/{orgId}/members/{uid}`.
   - Actualiza el documento del perfil de jugador en Firestore (`players/{uid}`).
   - **Beneficio crítico de rendimiento**: Las validaciones en las reglas del club no requieren lecturas a base de datos, ya que el `orgId` viaja directamente en el token JWT del usuario autenticado.

---

## 4. Estructura de Datos Multi-Tenant Proyectada

```text
organizations/{orgId}
  ├── name: "Club Padel Barcelona"
  ├── slug: "padel-bcn"
  ├── maxCourts: 8
  ├── members/{uid}             <- Administradores y monitores del club
  └── settings                  <- Personalización de marca y colores

americanas/{eventId}            <- Incluye campo 'orgId' para filtrado por club
entrenos/{eventId}              <- Incluye campo 'orgId'
players/{uid}                   <- Perfil universal del jugador (pertenencia opcional a orgId)
```

---

## 5. Próximos Pasos en el Frontend

1. Vincular el panel de `organizacion.html` con las nuevas llamadas de `createOrganization` y `assignUserToOrganization`.
2. Habilitar selector de sede/organización en la creación de eventos de `admin.html` para etiquetar automáticamente los torneos con su correspondiente `orgId`.
