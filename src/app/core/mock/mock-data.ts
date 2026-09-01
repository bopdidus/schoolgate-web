import { User } from '../../core/auth/models/auth.model';
import { School } from '../../features/schools/domain/models/school.model';
import { Enrollment } from '../../features/enrollments/domain/models/enrollment.model';
import { Payment } from '../../features/payments/domain/models/payment.model';
import { Invoice } from '../../features/invoices/domain/models/invoice.model';
import { DashboardOverview } from '../../features/dashboard/domain/models/dashboard.model';

export const MOCK_CREDENTIALS = {
  admin: { email: 'admin@schoolgate.cm', password: 'demo' },
  school_admin: { email: 'school.admin@schoolgate.cm', password: 'demo' },
  school_editor: { email: 'school.editor@schoolgate.cm', password: 'demo' },
};

export const MOCK_ADMIN: User = {
  id: 'usr-admin-1',
  email: 'admin@schoolgate.cm',
  name: 'Admin User',
  role: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const MOCK_SCHOOL_ADMIN: User = {
  id: 'usr-school-admin-1',
  email: 'school.admin@schoolgate.cm',
  name: 'Marie Nguema',
  role: 'school_admin',
  schoolId: 'sch-1',
  schoolName: 'Lycée Bilingue de Yaoundé',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const MOCK_SCHOOL_EDITOR: User = {
  id: 'usr-school-editor-1',
  email: 'school.editor@schoolgate.cm',
  name: 'Pierre Ateba',
  role: 'school_editor',
  schoolId: 'sch-1',
  schoolName: 'Lycée Bilingue de Yaoundé',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const MOCK_SCHOOLS: School[] = [
  {
    id: 'sch-1',
    name: 'Lycée Bilingue de Yaoundé',
    city: 'Yaoundé',
    cityId: 1,
    address: 'Quartier Bastos',
    phone: '+237 6 99 00 00 01',
    email: 'contact@lycee-yaounde.cm',
    status: 'active',
    schoolSystem: 'bilingual',
    academicYear: '2025-2026',
    totalClasses: 3,
    fillRate: 78,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    classes: [
      {
        id: 'cls-1',
        system: 'francophone',
        educationType: 'general',
        levelId: 'FR_6EME',
        levelLabel: '6ème',
        name: '6ème A',
        totalSeats: 40,
        advanceAllowed: true,
        enrolledCount: 32,
        fillRate: 80,
        enrollmentFee: {
          id: 'fee-1',
          amount: 25000,
          dueDate: '2026-09-01',
          advancePercentage: 30,
        },
        installments: [
          { order: 1, amount: 75000, dueDate: '2026-11-01', advanceAllowed: true, advancePercentage: 30 },
          { order: 2, amount: 75000, dueDate: '2027-02-01', advanceAllowed: true, advancePercentage: 30 },
        ],
      },
      {
        id: 'cls-2',
        system: 'francophone',
        educationType: 'technical',
        specialtyId: 'IH',
        levelId: 'FR_5EME',
        levelLabel: '5ème',
        name: '5ème B',
        totalSeats: 35,
        advanceAllowed: false,
        enrolledCount: 26,
        fillRate: 74,
        enrollmentFee: {
          id: 'fee-2',
          amount: 20000,
          dueDate: '2026-09-01',
        },
        installments: [
          { order: 1, amount: 140000, dueDate: '2026-12-01' },
        ],
      },
      {
        id: 'cls-4',
        system: 'anglophone',
        educationType: 'vocational',
        specialtyId: 'TI',
        levelId: 'EN_FORM1',
        levelLabel: 'Form 1',
        name: 'Form 1 A',
        totalSeats: 38,
        advanceAllowed: true,
        enrolledCount: 28,
        fillRate: 74,
        enrollmentFee: {
          id: 'fee-4',
          amount: 28000,
          dueDate: '2026-09-01',
          advancePercentage: 30,
        },
        installments: [
          { order: 1, amount: 80000, dueDate: '2026-11-01', advanceAllowed: true, advancePercentage: 30 },
          { order: 2, amount: 80000, dueDate: '2027-02-01', advanceAllowed: true, advancePercentage: 30 },
        ],
      },
    ],
  },
  {
    id: 'sch-2',
    name: 'Collège Saint-Joseph',
    city: 'Douala',
    cityId: 2,
    address: 'Akwa',
    phone: '+237 6 99 00 00 02',
    email: 'info@stjoseph-douala.cm',
    status: 'active',
    schoolSystem: 'francophone',
    academicYear: '2025-2026',
    totalClasses: 1,
    fillRate: 65,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    classes: [
      {
        id: 'cls-3',
        system: 'francophone',
        educationType: 'general',
        levelId: 'FR_4EME',
        levelLabel: '4ème',
        name: '4ème C',
        totalSeats: 30,
        advanceAllowed: false,
        enrolledCount: 20,
        fillRate: 67,
        enrollmentFee: {
          id: 'fee-3',
          amount: 18000,
          dueDate: '2026-09-15',
        },
        installments: [
          { order: 1, amount: 40000, dueDate: '2026-10-15' },
          { order: 2, amount: 40000, dueDate: '2027-01-15' },
          { order: 3, amount: 40000, dueDate: '2027-04-15' },
        ],
      },
    ],
  },
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 'enr-1',
    studentName: 'Jean Dupont',
    studentEmail: 'parent@example.cm',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    classId: 'cls-1',
    className: '6ème A',
    academicYear: '2025-2026',
    classSystem: 'francophone',
    classEducationType: 'general',
    classLevelId: 'FR_6EME',
    classLevelLabel: '6ème',
    status: 'active',
    isExistingStudent: true,
    documentsReceived: true,
    paymentValidated: true,
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 'enr-2',
    studentName: 'Amina Bello',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    classId: 'cls-1',
    className: '6ème A',
    classSystem: 'francophone',
    classEducationType: 'general',
    classLevelId: 'FR_6EME',
    classLevelLabel: '6ème',
    status: 'pending_documents',
    isExistingStudent: false,
    documentsReceived: false,
    paymentValidated: false,
    createdAt: '2026-07-01T14:00:00Z',
    updatedAt: '2026-07-01T14:00:00Z',
  },
  {
    id: 'enr-3',
    studentName: 'Paul Essomba',
    schoolId: 'sch-2',
    schoolName: 'Collège Saint-Joseph',
    classId: 'cls-3',
    className: '4ème C',
    classSystem: 'francophone',
    classEducationType: 'general',
    classLevelId: 'FR_4EME',
    classLevelLabel: '4ème',
    status: 'pending',
    isExistingStudent: true,
    documentsReceived: true,
    paymentValidated: false,
    createdAt: '2026-06-28T09:00:00Z',
    updatedAt: '2026-06-28T09:00:00Z',
  },
  {
    id: 'enr-4',
    studentName: 'Sylvie Mbarga',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    classId: 'cls-2',
    className: '5ème B',
    classSystem: 'francophone',
    classEducationType: 'technical',
    classSpecialtyId: 'IH',
    classSpecialtyLabel: "Industrie de l'Habillement",
    classLevelId: 'FR_5EME',
    classLevelLabel: '5ème',
    status: 'rejected',
    isExistingStudent: false,
    documentsReceived: false,
    paymentValidated: false,
    rejectionReason: 'Dossier incomplet : il manque le bulletin de l\'année N-2.',
    createdAt: '2026-06-25T11:00:00Z',
    updatedAt: '2026-06-26T09:00:00Z',
  },
];

const deadlineSoon = new Date(Date.now() + 18 * 3600000).toISOString();

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    enrollmentId: 'enr-1',
    type: 'enrollment_fee',
    amount: 25000,
    declaredAt: '2026-07-01T10:00:00Z',
    deadline: deadlineSoon,
    status: 'declared',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    studentName: 'Jean Dupont',
    classEducationType: 'general',
  },
  {
    id: 'pay-2',
    enrollmentId: 'enr-1',
    type: 'tuition_installment',
    installmentNumber: 1,
    amount: 75000,
    declaredAt: '2026-06-20T11:00:00Z',
    deadline: '2026-11-01T23:59:59Z',
    status: 'validated',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    studentName: 'Jean Dupont',
    classEducationType: 'general',
    validatedAt: '2026-06-21T09:00:00Z',
  },
  {
    id: 'pay-3',
    enrollmentId: 'enr-3',
    type: 'enrollment_fee',
    amount: 18000,
    declaredAt: '2026-07-02T08:00:00Z',
    deadline: deadlineSoon,
    status: 'declared',
    schoolId: 'sch-2',
    schoolName: 'Collège Saint-Joseph',
    studentName: 'Paul Essomba',
    classEducationType: 'general',
  },
];

export const MOCK_REF_SPECIALTIES = [
  { id: 'IH', code: 'IH', label: "Industrie de l'Habillement" },
  { id: 'CG', code: 'CG', label: 'Comptabilite et Gestion' },
  { id: 'TI', code: 'TI', label: 'Techniques Industrielles' },
];

export const MOCK_REF_LEVELS = [
  { id: 'FR_6EME', code: '6EME', label: '6ème', system: 'francophone', educationType: 'general' },
  { id: 'FR_5EME', code: '5EME', label: '5ème', system: 'francophone', educationType: 'technical' },
  { id: 'FR_4EME', code: '4EME', label: '4ème', system: 'francophone', educationType: 'general' },
  { id: 'EN_FORM1', code: 'FORM1', label: 'Form 1', system: 'anglophone', educationType: 'vocational' },
  { id: 'EN_FORM2', code: 'FORM2', label: 'Form 2', system: 'anglophone', educationType: 'general' },
];

export const MOCK_REF_CITIES = [
  { id: 1, name: 'Yaoundé', adminName: 'Centre', lat: '3.8667', lng: '11.5167', country: 'Cameroon', iso2: 'CM', population: '2440462' },
  { id: 2, name: 'Douala', adminName: 'Littoral', lat: '4.0500', lng: '9.7000', country: 'Cameroon', iso2: 'CM', population: '2768436' },
  { id: 3, name: 'Garoua', adminName: 'Nord', lat: '9.3000', lng: '13.4000', country: 'Cameroon', iso2: 'CM', population: '436899' },
  { id: 4, name: 'Bamenda', adminName: 'Nord-Ouest', lat: '5.9597', lng: '10.1460', country: 'Cameroon', iso2: 'CM', population: '393835' },
  { id: 5, name: 'Bafoussam', adminName: 'Ouest', lat: '5.4667', lng: '10.4167', country: 'Cameroon', iso2: 'CM', population: '290768' },
  { id: 6, name: 'Maroua', adminName: 'Extrême-Nord', lat: '10.5956', lng: '14.3158', country: 'Cameroon', iso2: 'CM', population: '319941' },
  { id: 7, name: 'Ngaoundéré', adminName: 'Adamaoua', lat: '7.3167', lng: '13.5833', country: 'Cameroon', iso2: 'CM', population: '231357' },
  { id: 8, name: 'Kribi', adminName: 'Sud', lat: '2.9373', lng: '9.9076', country: 'Cameroon', iso2: 'CM', population: '92867' },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    enrollmentId: 'enr-1',
    studentName: 'Jean Dupont',
    schoolId: 'sch-1',
    schoolName: 'Lycée Bilingue de Yaoundé',
    className: '6ème A',
    amount: 75000,
    installmentNumber: 1,
    status: 'issued',
    signatureHash: 'sha256:mock-signature-hash-abc123def456',
    issuedAt: '2026-06-21T10:00:00Z',
  },
];

export function buildAdminDashboard(schools: School[] = MOCK_SCHOOLS): DashboardOverview {
  const lastSchool = [...schools].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return {
    role: 'admin',
    stats: {
      pendingValidations: 2,
      validatedPayments: 48,
      seatsFilledPercent: 72,
      totalSchools: schools.length,
      totalEnrollments: 78,
      totalRevenue: 12500000,
      refundsTriggered: 1,
    },
    lastRegisteredSchool: lastSchool
      ? {
          id: lastSchool.id,
          name: lastSchool.name,
          city: lastSchool.city,
          createdAt: lastSchool.createdAt,
        }
      : undefined,
    approachingDeadlinePayments: MOCK_PAYMENTS.filter((p) => p.status === 'declared').map((p) => ({
      id: p.id,
      studentName: p.studentName,
      amount: p.amount,
      deadline: p.deadline,
      hoursRemaining: 18,
    })),
  };
}

/** Platform commission: 5% on each validated payment. */
const COMMISSION_RATE = 0.05;

export function buildSchoolCommissionSummary(schools: School[] = MOCK_SCHOOLS) {
  const bySchool = new Map<
    string,
    { schoolName: string; city: string; commissionCount: number; totalCommissionAmount: number }
  >();

  for (const school of schools) {
    bySchool.set(school.id, {
      schoolName: school.name,
      city: school.city,
      commissionCount: 0,
      totalCommissionAmount: 0,
    });
  }

  for (const payment of MOCK_PAYMENTS) {
    if (payment.status !== 'validated') continue;
    const entry = bySchool.get(payment.schoolId);
    if (!entry) continue;
    entry.commissionCount += 1;
    entry.totalCommissionAmount += Math.round(payment.amount * COMMISSION_RATE);
  }

  return [...bySchool.entries()].map(([schoolId, data]) => ({
    schoolId,
    ...data,
  }));
}

export function buildSchoolDashboard(): DashboardOverview {
  return {
    role: 'school_admin',
    stats: {
      pendingValidations: 1,
      validatedPayments: 12,
      seatsFilledPercent: 80,
    },
    classPaymentStats: [
      { className: '6ème A', validated: 10, pending: 1 },
      { className: '5ème B', validated: 2, pending: 0 },
    ],
    recentPayments: MOCK_PAYMENTS.filter((p) => p.schoolId === 'sch-1'),
    approachingDeadlinePayments: [
      {
        id: 'pay-1',
        studentName: 'Jean Dupont',
        amount: 25000,
        deadline: deadlineSoon,
        hoursRemaining: 18,
      },
    ],
  };
}
