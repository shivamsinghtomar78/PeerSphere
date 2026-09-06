import { checkEligibility, EligibilityInput } from '@/lib/engines/eligibility.engine';

const base: EligibilityInput = {
  studentCgpa: 8.0,
  studentActiveBacklogs: 0,
  studentDepartment: 'Computer Science',
  studentProgram: 'B.Tech',
  minCgpa: 7.0,
  maxBacklogs: 0,
  allowedDepartments: ['Computer Science'],
  allowedPrograms: ['B.Tech'],
};

describe('eligibility engine — status precedence', () => {
  it('all checks pass → ELIGIBLE with populated passedRules', () => {
    const r = checkEligibility(base);
    expect(r.status).toBe('ELIGIBLE');
    expect(r.failedRules).toHaveLength(0);
    expect(r.passedRules.length).toBeGreaterThanOrEqual(4);
  });

  it('hard failure beats a null-CGPA condition → INELIGIBLE', () => {
    const r = checkEligibility({ ...base, studentCgpa: null, studentActiveBacklogs: 3 });
    expect(r.status).toBe('INELIGIBLE');
    expect(r.conditionalReasons).toContain('CGPA not yet verified');
  });

  it('null CGPA with everything else passing → not ELIGIBLE, carries the conditional reason', () => {
    const r = checkEligibility({ ...base, studentCgpa: null });
    expect(['PENDING', 'CONDITIONAL']).toContain(r.status);
    expect(r.failedRules).toHaveLength(0);
    expect(r.conditionalReasons).toContain('CGPA not yet verified');
  });
});

describe('eligibility engine — boundaries', () => {
  it('CGPA exactly at the minimum passes; 0.01 below fails', () => {
    expect(checkEligibility({ ...base, studentCgpa: 7.0 }).status).toBe('ELIGIBLE');
    const fail = checkEligibility({ ...base, studentCgpa: 6.99 });
    expect(fail.status).toBe('INELIGIBLE');
    expect(fail.failedRules[0]).toContain('CGPA below minimum');
  });

  it('backlogs exactly at the limit pass; one over fails', () => {
    expect(checkEligibility({ ...base, maxBacklogs: 2, studentActiveBacklogs: 2 }).status).toBe('ELIGIBLE');
    const fail = checkEligibility({ ...base, maxBacklogs: 2, studentActiveBacklogs: 3 });
    expect(fail.status).toBe('INELIGIBLE');
    expect(fail.failedRules[0]).toContain('backlogs exceed limit');
  });

  it('no CGPA minimum set → CGPA check passes regardless of value', () => {
    const r = checkEligibility({ ...base, minCgpa: null, studentCgpa: 2.0 });
    expect(r.status).toBe('ELIGIBLE');
    expect(r.passedRules.some((p) => p.includes('not required'))).toBe(true);
  });
});

describe('eligibility engine — allow-lists', () => {
  it('empty allow-lists mean no restriction', () => {
    const r = checkEligibility({
      ...base,
      allowedDepartments: [],
      allowedPrograms: [],
      studentDepartment: 'Astrology',
      studentProgram: 'B.Voc',
    });
    expect(r.status).toBe('ELIGIBLE');
  });

  it('department and program checks are case-insensitive', () => {
    const r = checkEligibility({
      ...base,
      studentDepartment: 'computer science',
      studentProgram: 'b.tech',
      allowedDepartments: ['Computer Science'],
      allowedPrograms: ['B.Tech'],
    });
    expect(r.status).toBe('ELIGIBLE');
  });

  it('department not in the allow-list fails with an explanatory rule', () => {
    const r = checkEligibility({ ...base, studentDepartment: 'Mechanical' });
    expect(r.status).toBe('INELIGIBLE');
    expect(r.failedRules[0]).toContain('Department not eligible');
    expect(r.failedRules[0]).toContain('Mechanical');
  });

  it('multiple failures are all reported (explainability contract)', () => {
    const r = checkEligibility({
      ...base,
      studentCgpa: 5.0,
      studentActiveBacklogs: 4,
      studentDepartment: 'Civil',
      studentProgram: 'Diploma',
    });
    expect(r.status).toBe('INELIGIBLE');
    expect(r.failedRules).toHaveLength(4);
  });
});
