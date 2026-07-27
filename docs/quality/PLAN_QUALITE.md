# Plan qualité — ISO/IEC 12207 & principes ISO 9001

## 1. Portée

Application front-office **SchoolGateWeb** (Angular 17) pour la gestion des inscriptions scolaires et des paiements de pension au Cameroun.

## 2. Processus du cycle de vie (ISO/IEC 12207)

### 2.1 Processus d'acquisition

- Besoins fonctionnels documentés dans les user stories et `docs/API_CONTRACT.md`.
- Rôles utilisateur : `admin`, `school_admin`, `school_editor`.

### 2.2 Processus de développement

| Activité | Livrable | Emplacement |
|----------|----------|-------------|
| Conception UI | Composants Material | `src/app/shared/`, `src/app/features/` |
| Logique métier | Services, validators | `*/application/`, `*.validation.ts` |
| État global | NgRx store | `src/app/core/auth/store/` |
| Internationalisation | Clés i18n | `src/assets/i18n/` |

### 2.3 Processus de vérification (→ IEEE 1012)

- Revue de code sur chaque PR.
- Tests unitaires sur services et validateurs.
- Build production sans erreur (`ng build`).

### 2.4 Processus de validation

- Scénarios par rôle avec API mock (`useMockApi: true`).
- Vérification des parcours critiques : login, CRUD école, inscriptions, paiements.

### 2.5 Processus de maintenance

- Correctifs ciblés, pas de régression sur les tests existants.
- Mise à jour du contrat API en cas de changement backend.

## 3. Critères d'acceptation release

- [ ] `npm run quality:check` réussi
- [ ] Couverture ≥ seuils définis dans `karma.conf.js`
- [ ] Budgets Angular (`angular.json`) respectés
- [ ] i18n FR et EN à jour pour les nouvelles clés
- [ ] Pas de secrets dans le dépôt

## 4. Gestion des anomalies

1. Reproduction du bug (rôle, route, données).
2. Correction avec test de non-régression si applicable.
3. Validation manuelle du scénario corrigé.

## 5. Amélioration continue

- Revue périodique de la matrice ISO 25010.
- Extension progressive de la couverture de tests.
- Refactoring incrémental (architecture feature-based).
