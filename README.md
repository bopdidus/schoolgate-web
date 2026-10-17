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

The app always talks to SchoolGateApi: start it locally (`docker compose up` in
SchoolGateApi) and sign in with the administrator created by `go run ./cmd/seed`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Tests

```bash
npm test -- --watch=false   # unit tests + coverage gate (70 % statements, 60 % branches)
npm run build               # production build
```

## Project Structure

```
src/app/
├── api/          # Generated OpenAPI client
├── core/         # Services, guards, interceptors, NgRx store
├── shared/       # components/, pipes/, models/, constants/, validators/
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
