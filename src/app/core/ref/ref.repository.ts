import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  CityRefDto,
  ClassLevelRefDto,
  ReferenceService,
  SpecialtyRefDto,
} from '../../api';
import { EducationSystem, EducationType } from '../../shared/models/common.model';
import { unwrapData } from '../api/openapi-helpers';

export interface RefSpecialty {
  id: string;
  code: string;
  label: string;
}

export interface RefLevel {
  id: string;
  code: string;
  label: string;
  system: EducationSystem;
  educationType: EducationType;
}

/** City from `/reference/cities` — used for searchable city dropdowns. */
export interface RefCity {
  id: number;
  name: string;
  adminName: string;
  lat: string;
  lng: string;
  country: string;
  iso2: string;
  population: string;
}

@Injectable({ providedIn: 'root' })
export class RefRepository {
  private readonly referenceApi = inject(ReferenceService);

  private readonly specialties$ = this.referenceApi.referenceSpecialtiesGet().pipe(
    map((envelope) => unwrapData(envelope).map((row) => this.mapSpecialty(row))),
    shareReplay(1),
  );

  getSpecialties(): Observable<RefSpecialty[]> {
    return this.specialties$;
  }

  getLevels(system: EducationSystem, type: EducationType): Observable<RefLevel[]> {
    const educationType =
      type === 'technical' || type === 'vocational' ? type : 'general';
    return this.referenceApi
      .referenceLevelsGet(system, educationType)
      .pipe(
        map((envelope) =>
          unwrapData(envelope).map((row) => this.mapLevel(row, system, type)),
        ),
      );
  }

  /** List/search cities for dropdowns (`GET /reference/cities?q=`). */
  searchCities(q = ''): Observable<RefCity[]> {
    return this.referenceApi.referenceCitiesGet(q || undefined).pipe(
      map((envelope) => unwrapData(envelope).map((row) => this.mapCity(row))),
    );
  }

  private mapSpecialty(dto: SpecialtyRefDto): RefSpecialty {
    return {
      id: String(dto.id ?? ''),
      code: String(dto.code ?? ''),
      label: String(dto.label ?? ''),
    };
  }

  private mapLevel(
    dto: ClassLevelRefDto,
    fallbackSystem: EducationSystem,
    fallbackType: EducationType,
  ): RefLevel {
    const system =
      dto.school_system === 'francophone' || dto.school_system === 'anglophone'
        ? dto.school_system
        : fallbackSystem;
    const educationType =
      dto.education_type === 'general' ||
      dto.education_type === 'technical' ||
      dto.education_type === 'vocational'
        ? dto.education_type
        : fallbackType;
    return {
      id: String(dto.id ?? ''),
      code: String(dto.code ?? ''),
      label: String(dto.label ?? ''),
      system,
      educationType,
    };
  }

  private mapCity(dto: CityRefDto): RefCity {
    return {
      id: Number(dto.id ?? 0),
      name: String(dto.name ?? ''),
      adminName: String(dto.admin_name ?? ''),
      lat: '',
      lng: '',
      country: '',
      iso2: '',
      population: '',
    };
  }
}
