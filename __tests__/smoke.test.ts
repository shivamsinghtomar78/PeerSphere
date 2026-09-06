import { checkEligibility } from '@/lib/engines/eligibility.engine';

describe('test infrastructure smoke', () => {
  it('resolves @/ path mapping and runs an engine', () => {
    const result = checkEligibility({
      studentCgpa: 8.0,
      studentActiveBacklogs: 0,
      studentDepartment: 'Computer Science',
      studentProgram: 'B.Tech',
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedDepartments: ['Computer Science'],
      allowedPrograms: ['B.Tech'],
    });
    expect(result.status).toBe('ELIGIBLE');
    expect(result.failedRules).toHaveLength(0);
  });
});
