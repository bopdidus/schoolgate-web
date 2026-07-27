# SchoolGate Web — Back Office

Angular 17 back-office for the School Pension/Enrollment Platform (Cameroon).

## Stack

- Angular 17 (standalone components, signals)
- Angular Material + Tailwind CSS
- NgRx (auth state)
- Chart.js via ng2-charts
- @ngx-translate (EN/FR)

## Development

```bash
npm install
npm start
```

API base URL: `src/environments/environment.ts` → `http://localhost:8080/api/v1`

### Test without backend (mock mode)

Set `useMockApi: true` in `src/environments/environment.ts` (enabled by default in dev), then:

```bash
npm start
```

Demo logins:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@schoolgate.cm` | `demo` |
| School | `ecole@schoolgate.cm` | `demo` |

To use the real Go API, set `useMockApi: false`.

## Project Structure

```
src/app/
├── core/           # Auth, interceptors, guards, API, i18n
├── shared/         # Layouts, pipes, common components
└── features/
    ├── auth/
    ├── schools/
    ├── enrollments/
    ├── payments/
    ├── invoices/
    ├── users/
    ├── settings/
    └── dashboard/
```

Each feature follows DDD layers: `domain/`, `application/`, `infrastructure/`, `presentation/`.

## Roles

- **Admin**: all schools, users, analytics dashboard
- **School**: own school data only

## Build

```bash
npm run build
```
