# Gestion de la qualité logicielle — SchoolGateWeb

Ce répertoire formalise l'alignement du projet sur les normes internationales de qualité logicielle.

## Références normatives

| Norme | Objet | Document projet |
|-------|--------|-----------------|
| **ISO/IEC 25010** | Modèle de qualité du produit logiciel | [ISO_25010_MATRIX.md](./ISO_25010_MATRIX.md) |
| **ISO/IEC 12207** | Processus du cycle de vie logiciel | [PLAN_QUALITE.md](./PLAN_QUALITE.md) |
| **IEEE 829** | Documentation des tests logiciels | [IEEE_829_TESTS.md](./IEEE_829_TESTS.md) |
| **IEEE 1012** | Vérification et validation (V&V) | [IEEE_1012_VV.md](./IEEE_1012_VV.md) |

## Objectifs qualité

1. **Traçabilité** — exigences → implémentation → tests (voir matrices dans chaque document).
2. **Mesurabilité** — couverture de code, budgets de build, TypeScript strict.
3. **Maintenabilité** — architecture feature-based, Angular Material, i18n FR/EN.
4. **Fiabilité** — guards d'authentification, validation des formulaires, gestion d'erreurs API.

## Contrôles automatisés

```bash
npm run quality:check   # build production + tests avec couverture
npm run test:ci         # tests headless + rapport de couverture
npm run build:prod      # build production avec budgets angular.json
```

## Cycle de vie (ISO/IEC 12207)

| Phase | Activités SchoolGateWeb |
|-------|-------------------------|
| Acquisition | Spécifications métier (inscriptions, pensions, commissions) |
| Développement | Features Angular (`src/app/features/`), contrat API (`docs/API_CONTRACT.md`) |
| Vérification | Tests unitaires Jasmine/Karma, revue de code |
| Validation | Tests manuels par rôle (admin, school_admin, school_editor) |
| Maintenance | Correctifs, évolutions i18n, migration UI Material |

## Responsabilités

- **Développeur** : respect des conventions, tests unitaires sur la logique métier.
- **Revue** : vérification conformité ISO 25010 (lisibilité, modularité).
- **Release** : exécution de `quality:check` avant merge.
