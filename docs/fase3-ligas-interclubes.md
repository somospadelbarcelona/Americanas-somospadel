# Fase 3: Red de Ligas Interclubes & Preparación Móvil

## 1. Visión Estratégica (Efecto Red frente a Playtomic)
En la Fase 3, Somos Pádel trasciende el modelo de competiciones aisladas para construir su propio **efecto red defensivo**:
- Los clubes asociados compiten entre sí en circuitos interclubes oficiales (`leagues/{leagueId}`).
- Las actas de las jornadas (`fixtures`) son validadas por los capitanes (`isCaptain()`) y auditadas por el Staff (`isStaff()`).
- La clasificación de liga (`standings`) se consolida y publica en tiempo real sin requerir cálculo pesado en los dispositivos de los jugadores.

---

## 2. Partición de Base de Datos y Reglas (`firestore.rules`)

```javascript
// ==========================================
// RED DE LIGAS Y CIRCUITOS INTERCLUBES (FASE 3)
// ==========================================
match /leagues/{leagueId} {
  allow read: if true;
  allow write: if isStaff();

  match /fixtures/{fixtureId} {
    allow read: if true;
    allow write: if isStaff() || isCaptain();
  }

  match /standings/{standingId} {
    allow read: if true;
    allow write: if isStaff();
  }
}
```

---

## 3. Backend de Gestión de Ligas (`functions/index.js`)

Se han desarrollado las callables dedicadas:
1. **`createLeague`**: Crea un circuito oficial asignando clubes participantes, código identificativo y temporada (ej. `2026-T1`).
2. **`updateLeagueStandings`**: Agrega y persiste la tabla de clasificación de la liga para consulta pública inmediata con una única lectura.

---

## 4. Estado Completo de las 4 Fases

| Fase | Ámbito | Estado |
|---|---|:---:|
| **Fase 0** | Hardening de Seguridad, Cierre de Brechas PII y Custom Claims (Cero Coste) | ✅ Completada |
| **Fase 1** | SaaS Multi-Tenant para Clubes y Organizaciones (`orgId`) | ✅ Completada |
| **Fase 2** | Optimización de lecturas y Leaderboards precalculados para 50k usuarios | ✅ Completada |
| **Fase 3** | Red de Ligas y Circuitos Interclubes con gobernanza delegada | ✅ Completada |
