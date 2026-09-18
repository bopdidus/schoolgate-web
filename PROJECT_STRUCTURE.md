# SchoolGate Web — Project Structure

```
src/
├── assets/i18n/                 # en.json, fr.json
├── environments/
├── styles/ + styles.scss        # Material theme, tokens, utilities
├── testing/
│   └── test-providers.ts        # provideTestDefaults() shared by component specs
└── app/
    ├── api/                     # Generated OpenAPI client (npm run swagger:generate) — do not edit
    ├── core/                    # App-wide singletons, no UI
    │   ├── auth/                # app-ability.ts (CASL rules), auth.config.ts
    │   ├── guards/              # auth, role, ability, unsaved-changes
    │   ├── interceptors/        # auth token, token refresh, HTTP error notification
    │   ├── mock/                # mock API interceptor + data
    │   ├── models/              # auth.model.ts
    │   ├── services/            # auth, auth-api, session timeout, token storage, language, theme, notifications, ref...
    │   ├── store/               # NgRx auth actions / effects / reducer / state
    │   └── utils/               # jwt, openapi helpers, css colors
    ├── shared/                  # Reusable building blocks
    │   ├── components/          # brand-logo, confirm-dialog, empty-state, page-header, stat-card...
    │   ├── constants/
    │   ├── models/
    │   └── pipes/
    ├── layout/
    │   ├── auth-layout/
    │   └── main-layout/         # Sidebar + top bar + bottom nav
    ├── login/                   # /login
    ├── dashboard/               # /dashboard
    ├── schools/                 # /schools
    │   ├── school-list/  school-form/  school-detail/  class-form/
    │   ├── school-*-panel/      # Panels shown on the school detail page
    │   ├── school.service.ts  school.model.ts  schools.routes.ts
    ├── enrollments/             # /enrollments
    ├── payments/                # /payments
    ├── invoices/                # /invoices (invoice-list/, invoice-detail/)
    ├── users/                   # /users
    ├── settings/                # /settings
    ├── not-found/
    ├── app.component.*
    ├── app.config.ts
    └── app.routes.ts
```

## Conventions

- **One folder per menu** at the root of `app/`. It holds the page component(s), the menu's
  `<menu>.service.ts` (HTTP calls + mapping from the generated API), `<menu>.model.ts` and `<menu>.routes.ts`.
- **Every component** lives in its own folder with four files:
  `x.component.ts`, `x.component.html`, `x.component.scss`, `x.component.spec.ts` — no inline templates or styles.
- Component specs use `provideTestDefaults()` from `src/testing/test-providers.ts`.
- Something used by more than one menu goes to `shared/` (UI) or `core/` (services, guards, store).

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
