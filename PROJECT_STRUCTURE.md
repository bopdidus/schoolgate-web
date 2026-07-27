# SchoolGate Web — Project Structure

```
src/
├── assets/
│   └── i18n/
│       ├── en.json
│       └── fr.json
├── environments/
│   ├── environment.ts          # dev API URL
│   └── environment.prod.ts     # prod API URL
├── app/
│   ├── core/
│   │   ├── api/
│   │   │   └── api.service.ts              # Generic HTTP client
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   │   └── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts             # authGuard, guestGuard, roleGuard
│   │   │   ├── infrastructure/
│   │   │   │   └── http-auth.repository.ts
│   │   │   ├── models/
│   │   │   │   └── auth.model.ts
│   │   │   ├── store/
│   │   │   │   ├── auth.actions.ts
│   │   │   │   ├── auth.effects.ts
│   │   │   │   ├── auth.reducer.ts
│   │   │   │   └── auth.state.ts
│   │   │   └── token-storage/
│   │   │       ├── token-storage.interface.ts    # Swappable abstraction
│   │   │       └── local-storage-token-storage.service.ts
│   │   ├── guards/
│   │   │   └── unsaved-changes.guard.ts
│   │   ├── i18n/
│   │   │   └── language.service.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts           # Bearer token + 401 refresh
│   │   └── notifications/
│   │       └── notification.service.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── confirm-dialog/
│   │   │   ├── empty-state/
│   │   │   ├── page-header/
│   │   │   └── skeleton-table/
│   │   ├── layouts/
│   │   │   ├── auth-layout/
│   │   │   └── main-layout/                  # Sidebar + top bar + bottom nav
│   │   ├── models/
│   │   │   └── common.model.ts
│   │   └── pipes/
│   │       ├── fill-rate.pipe.ts
│   │       ├── locale-date.pipe.ts
│   │       ├── status-color.pipe.ts
│   │       └── xaf-currency.pipe.ts
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   └── presentation/pages/login-page/
│   │   ├── schools/
│   │   │   ├── domain/models/
│   │   │   ├── infrastructure/school.repository.ts
│   │   │   ├── presentation/pages/
│   │   │   │   ├── school-list-page/
│   │   │   │   ├── school-form-page/         # Dynamic FormArray classes
│   │   │   │   └── school-detail-page/
│   │   │   └── schools.routes.ts
│   │   ├── enrollments/
│   │   ├── payments/
│   │   ├── invoices/
│   │   ├── users/
│   │   ├── settings/
│   │   └── dashboard/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.component.ts
├── styles.scss                               # Material theme + Tailwind + tokens
└── main.ts                                   # Chart.js registration
```

Each feature follows **DDD layers**: `domain/` → `infrastructure/` → `presentation/`.

## Routes

| Path | Role | Feature |
|------|------|---------|
| `/login` | Guest | Auth |
| `/dashboard` | Admin + School | Dashboard (role-scoped) |
| `/schools` | Admin | Schools CRUD |
| `/enrollments` | Admin + School | Enrollments + document confirm |
| `/payments` | Admin + School | Validate/reject payments |
| `/invoices` | Admin + School | List, detail, verify, print |
| `/users` | Admin | User management |
| `/settings` | Admin + School | Language, profile, password |

## Run

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build
npm test           # unit tests
```
