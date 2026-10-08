import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { CreateEnrollmentRequestDto, EnrollmentsService, PersonsService } from '../../api';
import { unwrapData } from '../../core/utils/openapi-helpers';
import { ChecklistItem, Child, Gender, ParentEnrollment } from '../domain/models';
import { mapChecklistItem, mapChild, mapEnrollment } from './parent-mappers';

/** A place request: an existing child, or a new one with names and gender. */
export interface EnrollmentRequest {
  classId: string;
  academicYear?: string;
  isReturningStudent: boolean;
  childId?: string;
  newChild?: { firstName: string; lastName: string; gender: Gender };
  /** Only sent for a returning student when the school offers the bypass. */
  matricule?: string;
}

/** The parent's requests, students, children and documents. */
@Injectable({ providedIn: 'root' })
export class ParentEnrollmentsService {
  private readonly enrollmentsApi = inject(EnrollmentsService);
  private readonly personsApi = inject(PersonsService);

  /**
   * The parent's enrollments (the API scopes them to the caller). A parent has
   * few, so one page of 100 covers them; `academicYear` is filtered by the API.
   */
  list(academicYear?: string): Observable<ParentEnrollment[]> {
    return this.enrollmentsApi
      .enrollmentsGet(undefined, undefined, undefined, undefined, academicYear || undefined, undefined, undefined, 100, 0)
      .pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapEnrollment)));
  }

  /** The parent's enrollments matching a student matricule (exact) or name (partial). */
  findStudent(term: string): Observable<ParentEnrollment[]> {
    return this.enrollmentsApi
      .enrollmentsGet(undefined, undefined, term.trim(), undefined, undefined, undefined, undefined, 20, 0)
      .pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapEnrollment)));
  }

  getById(id: string): Observable<ParentEnrollment> {
    return this.enrollmentsApi.enrollmentsIdGet(+id).pipe(map((envelope) => mapEnrollment(unwrapData(envelope))));
  }

  create(request: EnrollmentRequest): Observable<ParentEnrollment> {
    const body: CreateEnrollmentRequestDto = {
      school_class_id: +request.classId,
      academic_year: request.academicYear || undefined,
      is_returning_student: request.isReturningStudent,
      person_id: request.childId ? +request.childId : undefined,
      student_first_name: request.newChild?.firstName.trim(),
      student_last_name: request.newChild?.lastName.trim(),
      student_gender: request.newChild?.gender,
      matricule: request.isReturningStudent ? request.matricule?.trim() || undefined : undefined,
    };
    // The create response is a partial enrollment: reload it whole.
    return this.enrollmentsApi.enrollmentsPost(body).pipe(
      map((envelope) => {
        const id = (envelope as { data?: { id?: number } } | null)?.data?.id;
        if (!id) throw new Error('Enrollment response missing id');
        return String(id);
      }),
      switchMap((id) => this.getById(id)),
    );
  }

  /** Uploads files tagged with the required document they satisfy. */
  uploadDocuments(enrollmentId: string, files: File[], documentTypeId?: string): Observable<void> {
    return this.enrollmentsApi
      .enrollmentsIdDocumentsPost(+enrollmentId, files, documentTypeId ? +documentTypeId : undefined)
      .pipe(map(() => undefined));
  }

  checklist(enrollmentId: string): Observable<ChecklistItem[]> {
    return this.enrollmentsApi
      .enrollmentsIdDocumentsChecklistGet(+enrollmentId)
      .pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapChecklistItem)));
  }

  children(): Observable<Child[]> {
    return this.personsApi.personsGet(100, 0).pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapChild)));
  }
}
