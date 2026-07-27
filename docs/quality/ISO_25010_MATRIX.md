# Matrice qualité — ISO/IEC 25010:2011

Modèle de qualité du produit logiciel appliqué à SchoolGateWeb.

## Caractéristiques fonctionnelles

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Complétude fonctionnelle | Dashboard, écoles, inscriptions, paiements, utilisateurs, paramètres | Routes `app.routes.ts` |
| Exactitude | Validateurs formulaires (`school-form.validation.ts`) | Tests unitaires |
| Pertinence | Navigation filtrée par rôle (`main-layout`) | Guards + `isNavVisible` |

## Caractéristiques de performance

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Comportement temporel | Lazy loading des features, OnPush | `loadComponent` dans routes |
| Utilisation des ressources | Budgets build production | `angular.json` budgets |

## Compatibilité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Coexistence | API REST + mode mock interchangeable | `environment.ts`, interceptor |
| Interopérabilité | Contrat API documenté | `docs/API_CONTRACT.md` |

## Utilisabilité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Reconnaissabilité | Angular Material, navigation `mat-nav-list` | `main-layout` |
| Apprenabilité | ≤ 7 items nav (loi de Miller) | `navItems` |
| Accessibilité | `aria-label`, tooltips, contrastes Material | Templates |
| Protection erreurs utilisateur | Validations réactives, messages i18n | Formulaires |
| Interface utilisateur | Responsive (sidebar + bottom nav mobile) | SCSS media queries |

## Fiabilité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Maturité | Gestion erreurs HTTP, états loading | Services core |
| Disponibilité | Guards auth, redirection login | `auth.guard.ts` |
| Récupérabilité | Fallback routes invalides (`resolveRoute`) | `main-layout` |

## Sécurité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Confidentialité | JWT en session, pas de credentials en dur | `auth.service.ts` |
| Intégrité | Rôles vérifiés côté UI + guards | `role.guard.ts` |
| Authenticité | Login obligatoire pour routes protégées | `auth.guard.ts` |

## Maintenabilité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Modularité | Architecture feature (`presentation` / `application`) | `src/app/features/` |
| Réutilisabilité | Composants partagés (`page-header`, `empty-state`) | `src/app/shared/` |
| Analysabilité | TypeScript strict, modèles typés | `tsconfig.json`, `*.model.ts` |
| Modifiabilité | i18n externalisé, thème SCSS variables | `styles.scss` |
| Testabilité | Services injectables, specs Jasmine | `*.spec.ts` |

## Portabilité

| Sous-caractéristique | Implémentation | Preuve |
|---------------------|----------------|--------|
| Adaptabilité | i18n FR/EN | `@ngx-translate` |
| Installabilité | `npm install && npm start` | `package.json` |

## Indicateurs mesurables

| Indicateur | Cible | Outil |
|------------|-------|-------|
| Couverture statements | ≥ 50 % | Karma coverage |
| Couverture branches | ≥ 40 % | Karma coverage |
| Bundle initial | < 500 kB (warning) | `angular.json` budgets |
| Erreurs TypeScript | 0 | `ng build` |
