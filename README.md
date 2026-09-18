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
├── api/          # Generated OpenAPI client
├── core/         # Services, guards, interceptors, NgRx store
├── shared/       # components/, pipes/, models/, constants/
├── layout/       # auth-layout, main-layout
├── login/
├── dashboard/
├── schools/
├── enrollments/
├── payments/
├── invoices/
├── users/
└── settings/
```

One folder per menu; every component has its own folder with `.ts`, `.html`, `.scss` and `.spec.ts`. See `PROJECT_STRUCTURE.md`.

## Roles

- **Admin**: all schools, users, analytics dashboard
- **School**: own school data only

## Build

```bash
npm run build
```
