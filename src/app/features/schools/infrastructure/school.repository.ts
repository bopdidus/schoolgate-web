import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  SchoolClassDto,
  SchoolClassRequestDto,
  SchoolDto,
  SchoolRequestDto,
  SchoolsService,
} from '../../../api';
import {
  PaginatedResponse,
  EducationSystem,
  EducationType,
  SchoolSystem,
} from '../../../shared/models/common.model';
import {
  fromCents,
  pageToOffset,
  toCents,
  toPaginated,
  unwrapData,
} from '../../../core/api/openapi-helpers';
import { toUtcMidnightIso } from '../application/school-form.validation';
import {
  CreateSchoolRequest,
  School,
  SchoolClass,
  SchoolFilters,
  UpdateSchoolRequest,
} from '../domain/models/school.model';

@Injectable({ providedIn: 'root' })
export class SchoolRepository {
  private readonly schoolsApi = inject(SchoolsService);

  getAll(filters: SchoolFilters): Observable<PaginatedResponse<School>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);
    return this.schoolsApi.schoolsGet(filters.search || undefined, limit, offset).pipe(
      map((envelope) => {
        const rows = unwrapData(envelope) ?? [];
        return toPaginated(
          rows.map((d) => this.mapSchool(d)),
          envelope.meta,
          page,
          pageSize,
        );
      }),
    );
  }

  getById(id: string): Observable<School> {
    return this.schoolsApi.schoolsIdGet(+id).pipe(
      map((envelope) => this.mapSchool(unwrapData(envelope))),
    );
  }

  /** School for the authenticated school_admin / school_editor. */
  getMine(): Observable<School> {
    return this.schoolsApi.schoolsMineGet().pipe(
      map((envelope) => this.mapSchool(unwrapData(envelope))),
    );
  }

  create(data: CreateSchoolRequest): Observable<School> {
    return this.schoolsApi.schoolsPost(this.toSchoolRequest(data)).pipe(
      map((envelope) => this.mapSchool(unwrapData(envelope))),
    );
  }

  update(id: string, data: UpdateSchoolRequest): Observable<School> {
    return this.schoolsApi.schoolsIdPut(+id, this.toSchoolRequest(data)).pipe(
      map((envelope) => this.mapSchool(unwrapData(envelope))),
    );
  }

  delete(id: string): Observable<void> {
    return this.schoolsApi.schoolsIdDelete(+id).pipe(map(() => undefined));
  }

  addClass(schoolId: string, cls: SchoolClass): Observable<SchoolClass> {
    return this.schoolsApi
      .schoolsIdSchoolClassesPost(+schoolId, this.toClassRequest(cls))
      .pipe(map((envelope) => this.mapClass(unwrapData(envelope))));
  }

  updateClass(schoolId: string, classId: string, cls: SchoolClass): Observable<SchoolClass> {
    return this.schoolsApi
      .schoolsIdSchoolClassesSchoolClassIdPut(+schoolId, +classId, this.toClassRequest(cls))
      .pipe(map((envelope) => this.mapClass(unwrapData(envelope))));
  }

  deleteClass(schoolId: string, classId: string): Observable<void> {
    return this.schoolsApi
      .schoolsIdSchoolClassesSchoolClassIdDelete(+schoolId, +classId)
      .pipe(map(() => undefined));
  }

  // ── Mapping ──────────────────────────────────────────────────────────────

  private mapSchool(dto: SchoolDto): School {
    const classes = (dto.school_classes ?? []).map((c) => this.mapClass(c));
    const schoolSystem = this.resolveSchoolSystem(dto.system, classes);
    // Prefer API snake_case; fall back to camelCase for mocks / partial payloads.
    const raw = dto as SchoolDto & {
      academicYear?: string;
      cityId?: number;
      totalClasses?: number;
      fillRate?: number;
      city?: { id?: number; name?: string } | string;
    };
    const cityName = typeof raw.city === 'string' ? raw.city : (raw.city?.name ?? '');
    const cityId = Number(
      raw.city_id ?? (typeof raw.city === 'object' ? raw.city?.id : undefined) ?? raw.cityId ?? 0,
    );

    return {
      id: String(dto.id ?? ''),
      name: String(dto.name ?? ''),
      city: cityName,
      cityId,
      address: String(dto.address ?? ''),
      phone: String(dto.phone ?? ''),
      email: String(dto.email ?? ''),
      status: (dto.status as School['status']) ?? 'active',
      schoolSystem,
      // Backend-derived Cameroon academic year (Sept→Aug); never written by the form.
      academicYear: dto.academic_year || raw.academicYear || undefined,
      reviewDeadlineDays: dto.review_deadline_days ?? undefined,
      paymentDeadlineDays: dto.payment_deadline_days ?? undefined,
      enrollmentDeadline: dto.enrollment_deadline ?? null,
      classes,
      totalClasses: classes.length || Number(raw.totalClasses ?? 0),
      fillRate: Number(raw.fillRate ?? 0),
      createdAt: '',
      updatedAt: '',
    };
  }

  private mapClass(c: SchoolClassDto): SchoolClass {
    const seats = Number(c.total_seats ?? 0);
    const remaining = Number(c.seats_remaining ?? seats);
    const enrolledCount = Math.max(0, seats - remaining);
    const system = this.readEducationSystem(c.effective_system ?? c.pedagogic_system);
    const educationType = this.readEducationType(c.education_type);
    const levelLabel = c.level?.other_label || c.level?.label || '';
    const specialtyLabel = c.specialty?.other_label || c.specialty?.label;

    return {
      id: String(c.id ?? ''),
      system: system ?? undefined,
      educationType,
      specialtyId: c.specialty?.id != null ? String(c.specialty.id) : undefined,
      specialtyOther: c.specialty?.other_label ?? undefined,
      levelId: String(c.level?.id ?? ''),
      levelLabel: levelLabel || undefined,
      name: [levelLabel, specialtyLabel].filter(Boolean).join(' — ') || levelLabel,
      totalSeats: seats,
      // Class-level advance = enrollment fee only.
      advanceAllowed: Boolean(c.advance_allowed),
      enrollmentFee: {
        amount: fromCents(c.enrollment_fee_cents),
        dueDate: '',
        advancePercentage: c.advance_percentage,
      },
      installments: (c.installments ?? []).map((inst, idx) => ({
        id: inst.id != null ? String(inst.id) : undefined,
        order: Number(inst.number ?? idx + 1),
        amount: fromCents(inst.amount_cents),
        dueDate: String(inst.due_date ?? ''),
        // Tuition advance is per installment — do not copy the class-level %.
        advanceAllowed: Boolean(inst.advance_allowed),
        advancePercentage: inst.advance_percentage,
      })),
      enrolledCount,
      fillRate: seats > 0 ? (enrolledCount / seats) * 100 : 0,
    };
  }

  private resolveSchoolSystem(
    system: string | undefined,
    classes: SchoolClass[],
  ): SchoolSystem {
    if (system === 'bilingual' || system === 'francophone' || system === 'anglophone') {
      return system;
    }
    const systems = [
      ...new Set(classes.map((c) => c.system).filter((v): v is EducationSystem => !!v)),
    ];
    if (systems.includes('francophone') && systems.includes('anglophone')) return 'bilingual';
    return systems[0] ?? 'francophone';
  }

  private readEducationSystem(value: unknown): EducationSystem | null {
    if (value === 'francophone' || value === 'anglophone') return value;
    return null;
  }

  private readEducationType(value: unknown): EducationType {
    if (value === 'technical' || value === 'vocational' || value === 'general') return value;
    if (value === 'professional') return 'vocational';
    return 'general';
  }

  private toSchoolRequest(data: CreateSchoolRequest | UpdateSchoolRequest): SchoolRequestDto {
    return {
      name: data.name,
      city_id: data.cityId,
      address: data.address,
      phone: data.phone,
      email: data.email,
      status: data.status as SchoolRequestDto.StatusEnum,
      system: data.system as SchoolRequestDto.SystemEnum,
      review_deadline_days: data.reviewDeadlineDays,
      payment_deadline_days: data.paymentDeadlineDays,
      enrollment_deadline: data.enrollmentDeadline
        ? toUtcMidnightIso(data.enrollmentDeadline)
        : null,
    };
  }

  private toClassRequest(cls: SchoolClass): SchoolClassRequestDto {
    return {
      level_id: Number(cls.levelId),
      level_other_label: cls.levelLabel,
      education_type: cls.educationType as SchoolClassRequestDto.EducationTypeEnum,
      pedagogic_system: cls.system as SchoolClassRequestDto.PedagogicSystemEnum | undefined,
      specialty_id: cls.specialtyId ? Number(cls.specialtyId) : undefined,
      specialty_other_label: cls.specialtyOther,
      enrollment_fee_cents: toCents(cls.enrollmentFee.amount),
      installments: cls.installments.map((inst, idx) => ({
        number: inst.order ?? idx + 1,
        amount_cents: toCents(inst.amount),
        // Backend contract: `2026-11-02T00:00:00Z` (UTC midnight).
        due_date: toUtcMidnightIso(inst.dueDate),
        // Per-tranche tuition advance (independent of enrollment-fee advance).
        advance_allowed: Boolean(inst.advanceAllowed),
        advance_percentage: inst.advanceAllowed ? inst.advancePercentage : undefined,
      })),
      total_seats: cls.totalSeats,
      // Class-level advance fields = enrollment fee only.
      advance_allowed: cls.advanceAllowed,
      advance_percentage: cls.advanceAllowed ? cls.enrollmentFee.advancePercentage : undefined,
    };
  }
}
