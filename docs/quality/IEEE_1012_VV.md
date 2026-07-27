# Plan Vérification & Validation — IEEE 1012

Conforme aux principes IEEE Std 1012-2017 (System, Software, and Hardware Verification and Validation).

## 1. Portée V&V

| Niveau | Périmètre SchoolGateWeb |
|--------|-------------------------|
| Unit | Services, validateurs, reducers NgRx |
| Integration | Interceptor mock, routing + guards |
| System | Application complète avec API mock |
| Acceptance | Scénarios métier par rôle utilisateur |

## 2. Matrice de traçabilité

| Exigence | Implémentation | Vérification | Validation |
|----------|----------------|--------------|------------|
| REQ-AUTH-01 Login utilisateur | `login-page`, `auth.service` | `auth.service.spec.ts` | Test manuel login |
| REQ-AUTH-02 Protection routes | `auth.guard`, `role.guard` | Revue code | Navigation sans token → redirect |
| REQ-SCHOOL-01 CRUD écoles admin | `schools` feature | `school-form.validation.spec.ts` | Création/édition école |
| REQ-SCHOOL-02 Systèmes éducatifs | `EducationSystem` model | Revue modèle | Formulaire FR/ANG |
| REQ-ENROLL-01 Inscriptions école | `enrollments` feature | À compléter | Liste par école |
| REQ-PAY-01 Commissions | `payments` feature | À compléter | Vue admin commissions |
| REQ-I18N-01 Bilinguisme UI | `@ngx-translate` | Revue clés | Bascule FR/EN |
| REQ-UI-01 Material Design | Angular Material | Revue composants | Inspection visuelle |

## 3. Activités de vérification

### 3.1 Revue de code

- Conformité architecture feature-based.
- Pas de logique métier dans les templates.
- ChangeDetection OnPush sur les pages liste.

### 3.2 Analyse statique

- TypeScript `strict: true`.
- Angular `strictTemplates: true`.
- Budgets de taille (`angular.json`).

### 3.3 Tests

- Exécution `npm run test:ci`.
- Rapport de couverture analysé avant release.

## 4. Activités de validation

### 4.1 Scénarios d'acceptation par rôle

**Admin** (`admin@schoolgate.cm`)
1. Connexion → dashboard avec statistiques globales.
2. Liste et édition des écoles.
3. Gestion des utilisateurs.
4. Vue commissions paiements.

**School Admin** (`school.admin@schoolgate.cm`)
1. Accès « Mon école » → édition.
2. Inscriptions de l'établissement.
3. Paiements de l'école.

**School Editor** (`school.editor@schoolgate.cm`)
1. Consultation école (lecture seule).
2. Gestion inscriptions.
3. Pas d'accès utilisateurs globaux.

### 4.2 Critères de validation

- Chaque scénario s'exécute sans erreur console.
- Données affichées cohérentes avec le rôle.
- Messages d'erreur en i18n.

## 5. Gestion des écarts

| Type | Action |
|------|--------|
| Écart mineur (cosmétique) | Ticket backlog |
| Écart majeur (fonctionnel) | Bloque la release |
| Écart sécurité | Correction immédiate |

## 6. Rapports V&V

- Résultat `quality:check` archivé en CI.
- Couverture exportée en LCOV pour intégration future (SonarQube, Codecov).

## 7. Responsabilités

| Rôle | Vérification | Validation |
|------|--------------|------------|
| Développeur | Tests unitaires, build | Auto-test scénarios |
| Relecteur | Revue PR | Checklist rôles |
| Release manager | `quality:check` | Sign-off acceptance |
