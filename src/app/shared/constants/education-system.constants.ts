import { EducationSystem, EducationType, SchoolSystem } from '../models/common.model';

/** Cameroon school sub-systems — Form 1 ≠ 6ème; a school may offer both. */
export const EDUCATION_SYSTEMS: EducationSystem[] = ['francophone', 'anglophone'];
export const SCHOOL_SYSTEMS: SchoolSystem[] = ['francophone', 'anglophone', 'bilingual'];
export const EDUCATION_TYPES: EducationType[] = ['general', 'technical', 'vocational'];

export const EDUCATION_SYSTEM_I18N: Record<EducationSystem, string> = {
  francophone: 'EDUCATION.FRANCOPHONE',
  anglophone: 'EDUCATION.ANGLOPHONE',
};
export const SCHOOL_SYSTEM_I18N: Record<SchoolSystem, string> = {
  francophone: 'EDUCATION.FRANCOPHONE',
  anglophone: 'EDUCATION.ANGLOPHONE',
  bilingual: 'EDUCATION.BILINGUAL',
};
export const SCHOOL_SYSTEM_BADGE: Record<SchoolSystem, string> = {
  francophone: 'FR',
  anglophone: 'EN',
  bilingual: 'BI',
};
export const EDUCATION_TYPE_I18N: Record<EducationType, string> = {
  general: 'EDUCATION.TYPE_GENERAL',
  technical: 'EDUCATION.TYPE_TECHNICAL',
  vocational: 'EDUCATION.TYPE_PROFESSIONAL',
};
export const EDUCATION_TYPE_BADGE: Record<EducationType, string> = {
  general: 'GÉN',
  technical: 'TECH',
  vocational: 'PRO',
};
