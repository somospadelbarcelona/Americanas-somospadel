# Fase 2: Optimización de Rendimiento & Leaderboards Precalculados (50k Usuarios)

## 1. Problema de Rendimiento Resuelto
En la arquitectura inicial con 500 usuarios, el cálculo del ranking global (`RankingController.js`) realizaba una descarga completa de:
1. Toda la colección `players` (N lecturas).
2. Toda la colección `americanas` (M lecturas).
3. Toda la colección `entrenos` (K lecturas).

**Impacto al escalar a 50.000 usuarios**:
- Con 50.000 perfiles y cientos de torneos, cada usuario que abriera la pestaña de Ranking generaba **más de 50.000 lecturas en Firestore**.
- 100 visitas simultáneas = **5.000.000 de lecturas** (agotamiento instantáneo de la cuota gratuita de Firebase y coste prohibitivo).

---

## 2. Solución Implementada: Modelo de Lectura Unitaria (1 Read)

### A. Backend (`functions/index.js`)
Se ha incorporado la función de servidor:
* **`recomputeLeaderboard`**: Consulta a los mejores jugadores ordenados por nivel/puntos y empaqueta el Top oficial en un **único documento agregado**:
  ```text
  leaderboards/global_top
    ├── rankings: [ { rank: 1, name: "...", level: 5.2, ... }, ... ]
    ├── updated_at: <timestamp>
    └── total_players_sampled: 100
  ```

### B. Reglas de Firestore (`firestore.rules`)
Se ha protegido el acceso a los leaderboards precalculados:
```javascript
// Lectura pública instantánea para todos los jugadores; edición exclusiva del servidor/Staff
match /leaderboards/{boardId} {
  allow read: if true;
  allow write: if isStaff();
}
```

### C. Frontend (`RankingController.js`)
El controlador del cliente ahora prioriza el documento precalculado:
* **Lectura 1**: Intenta leer `leaderboards/global_top`. Si existe, renderiza el ranking al instante con **1 sola lectura**.
* **Fallback resiliente**: Si el documento precalculado aún no se ha generado, recurre al cálculo dinámico local para asegurar que la pantalla nunca quede en blanco.

---

## 3. Estado de la Hoja de Ruta Global

| Fase | Alcance | Estado |
|---|---|:---:|
| **Fase 0** | Hardening de Seguridad, Cierre de Brechas PII y Custom Claims | ✅ Completada |
| **Fase 1** | Multi-Tenant SaaS para Clubes y Organizaciones | ✅ Completada |
| **Fase 2** | Rendimiento y Leaderboards Precalculados (Escalado de lecturas a 50k) | ✅ Completada |
| **Fase 3** | Transición a Bundler/Vite y Preparación de App Nativa | ⏳ Siguiente |
