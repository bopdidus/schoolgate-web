# Stratégie de tests — IEEE 829

Documentation des tests logiciels conforme à la structure IEEE 829 (IEEE Std 829-2008).

## 1. Identifiant du plan

- **Projet** : SchoolGateWeb
- **Version** : 0.0.0
- **Référence** : SQ-TEST-001

## 2. Introduction

Ce document décrit l'approche de test pour l'application Angular front-office SchoolGate.

## 3. Éléments à tester

| ID | Module | Fichier(s) | Priorité |
|----|--------|------------|----------|
| T-001 | Authentification | `auth.service.ts`, guards | Haute |
| T-002 | Validation école | `school-form.validation.ts` | Haute |
| T-003 | Composant racine | `app.component.ts` | Moyenne |
| T-004 | Navigation par rôle | `main-layout.component.ts` | Moyenne |
| T-005 | Services API | `*.service.ts` | Haute (à étendre) |

## 4. Fonctionnalités à tester

### 4.1 Tests unitaires (Jasmine + Karma)

- Logique pure (validateurs, utilitaires, reducers).
- Services avec mocks HttpClient / Store.

### 4.2 Tests d'intégration (manuel)

- Parcours login → dashboard par rôle.
- CRUD école (admin).
- Liste inscriptions (school_admin).

### 4.3 Tests de non-régression

- Exécution automatique via `npm run test:ci` en CI.

## 5. Critères de passage / échec

| Critère | Seuil |
|---------|-------|
| Tous les specs existants passent | 100 % |
| Couverture globale statements | ≥ 50 % |
| Couverture globale branches | ≥ 40 % |
| Build production | Succès sans erreur |

## 6. Approche de test

```
src/
  app/
    core/auth/application/auth.service.spec.ts
    features/schools/application/school-form.validation.spec.ts
    app.component.spec.ts
```

**Convention** : un fichier `*.spec.ts` adjoint à chaque module contenant de la logique métier.

## 7. Environnement de test

| Composant | Version |
|-----------|---------|
| Jasmine | 5.x |
| Karma | 6.x |
| Chrome Headless | CI |

## 8. Livrables de test

| Livrable | Format | Emplacement |
|----------|--------|-------------|
| Rapport d'exécution | HTML (Karma) | `coverage/school-gate-web/` |
| Résumé couverture | text-summary | Console CI |
| LCOV | lcovonly | `coverage/school-gate-web/lcov.info` |

## 9. Planification

| Phase | Tests |
|-------|-------|
| Développement | Unit tests sur nouvelle logique |
| Pré-merge | `npm run test:ci` |
| Release | `npm run quality:check` |

## 10. Risques

| Risque | Mitigation |
|--------|------------|
| Faible couverture UI | Prioriser logique métier et validators |
| Dépendance API externe | Mock interceptor pour tests manuels et futurs tests e2e |
| Régression i18n | Vérification manuelle FR/EN sur nouvelles clés |

## 11. Approbation

Document maintenu par l'équipe de développement. Révision à chaque release majeure.
