# SchoolGate API Contract (Frontend ↔ Backend)

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <access_token>`

The frontend maps snake_case DTOs to camelCase domain models in each feature's `infrastructure/` layer.

---

## Dashboard (recommended architecture)

**One aggregated, role-scoped endpoint** instead of many parallel calls. Benefits:

- Single round-trip, consistent snapshot time
- Backend enforces role scoping (school sees only own data)
- Frontend stays thin; charts bind to one `DashboardOverview` model

### `GET /dashboard/overview`

Returns data for the authenticated user's role. Omit sections that do not apply.

```json
{
  "role": "school",
  "stats": {
    "pending_validations": 12,
    "validated_payments": 48,
    "seats_filled_percent": 72,
    "total_schools": null,
    "total_enrollments": null,
    "total_revenue": null,
    "refunds_triggered": null
  },
  "class_payment_stats": [
    { "class_name": "6ème A", "validated": 10, "pending": 3 }
  ],
  "recent_payments": [],
  "enrollment_trend": null,
  "payment_status_distribution": null,
  "school_ranking": null,
  "approaching_deadline_payments": [
    {
      "id": "uuid",
      "student_name": "Jean Dupont",
      "amount": 50000,
      "deadline": "2026-07-05T23:59:59Z",
      "hours_remaining": 18
    }
  ]
}
```

**Admin** responses populate `enrollment_trend`, `payment_status_distribution`, `school_ranking`, and admin fields inside `stats`.

**School** responses populate `class_payment_stats`, `recent_payments` (last 10 declared), and school-scoped `stats`.

### Payment validation deadline (business rule)

When a parent declares a payment on mobile, the backend sets:

```
payment.deadline = declared_at + class.payment_validation_days
```

- `payment_validation_days` is configured by **admin** per class when creating/editing a school.
- Allowed range: **1–7 days** (frontend enforces max 7 to prevent long windows e.g. 30 days).
- Default: **5 days**.
- UI urgency (red chip / dashboard alert): `< 24 hours` before `payment.deadline`.

This is independent of installment **due dates** (`class.deadlines[]`), which are calendar dates for fee collection.

---

## Enrollments

### `POST /enrollments/:id/documents/confirm`

School role only. Marks documents received for new students (`is_existing_student = false`).

Required documents (v1): **previous report cards only** (years N-1 and N-2).

---

## Schools — class payload

Each class in create/update body:

```json
{
  "name": "6ème A",
  "enrollment_fee": 25000,
  "tuition_fee": 150000,
  "installments_count": 2,
  "total_seats": 40,
  "advance_allowed": false,
  "payment_validation_days": 5,
  "deadlines": [
    { "type": "enrollment", "deadline_date": "2026-09-01" },
    { "type": "installment", "installment_number": 1, "deadline_date": "2026-11-01" }
  ]
}
```

Validate on backend: `1 <= payment_validation_days <= 7`, deadlines in chronological order.
