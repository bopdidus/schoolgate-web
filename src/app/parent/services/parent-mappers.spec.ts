import { EnrollmentDto, SchoolDto } from '../../api';
import { mapEnrollment, mapSchool, unwrapPayment } from './parent-mappers';

describe('parent mappers', () => {
  it('keeps amounts in cents and sorts installments', () => {
    const school = mapSchool({
      id: 3,
      name: 'Lycée X',
      city: { id: 1, name: 'Douala' },
      allow_direct_payment_for_returning_students: true,
      school_classes: [
        {
          id: 7,
          school_id: 3,
          level: { id: 1, code: '6eme', label: '6ème' },
          enrollment_fee_cents: 2_500_000,
          installments: [
            { number: 2, amount_cents: 3_000_000, due_date: '2027-02-01' },
            { number: 1, amount_cents: 2_000_000, due_date: '2026-11-01' },
          ],
          seats_remaining: 4,
        },
      ],
    } as SchoolDto);
    expect(school.city).toBe('Douala');
    expect(school.allowsDirectPayment).toBeTrue();
    const offering = school.classes[0];
    expect(offering.label).toBe('6ème');
    expect(offering.enrollmentFeeCents).toBe(2_500_000);
    expect(offering.installments.map((i) => i.number)).toEqual([1, 2]);
  });

  it('maps an enrollment with its child, class and balance', () => {
    const e = mapEnrollment({
      id: 9,
      status: 'active',
      academic_year: '2026-2027',
      person: { id: 4, first_name: 'Awa', last_name: 'Ndiaye', gender: 'female' },
      school: { id: 3, name: 'Lycée X' },
      school_class: { id: 7, school_id: 3, enrollment_fee_cents: 1000 },
      balance: { tuition_settled: true, enrollment_fee_status: 'partial', tuition_remaining_cents: 0 },
    } as EnrollmentDto);
    expect(e.status).toBe('active');
    expect(e.child?.gender).toBe('female');
    expect(e.schoolName).toBe('Lycée X');
    expect(e.offering?.id).toBe('7');
    expect(e.balance?.enrollmentFeeStatus).toBe('partial');
  });

  it('reads the payment out of the declare / sync envelope', () => {
    const p = unwrapPayment({ data: { payment: { id: 5, type: 'tuition_installment', installment_number: 1, amount_cents: 500_000, status: 'validated' } } });
    expect(p).toEqual(jasmine.objectContaining({ id: '5', amountCents: 500_000, status: 'validated', installmentNumber: 1 }));
  });
});
