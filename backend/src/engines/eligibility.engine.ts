/**
 * eligibility.engine.ts
 * Pure-function engine for evaluating student eligibility against job/drive criteria.
 * No external dependencies.
 */

export interface EligibilityInput {
  /** Student's CGPA, or null if not yet recorded */
  studentCgpa: number | null;
  /** Number of active backlogs the student currently has */
  studentActiveBacklogs: number;
  /** Department the student belongs to (e.g., "Computer Science") */
  studentDepartment: string;
  /** Program the student is enrolled in (e.g., "B.Tech") */
  studentProgram: string;
  /** Minimum CGPA required; null means no minimum */
  minCgpa: number | null;
  /** Maximum number of active backlogs allowed */
  maxBacklogs: number;
  /** Allowed departments (case-insensitive) */
  allowedDepartments: string[];
  /** Allowed programs (case-insensitive) */
  allowedPrograms: string[];
}

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'CONDITIONAL' | 'PENDING';

export interface EligibilityResult {
  status: EligibilityStatus;
  /** Rules that failed and disqualify the student */
  failedRules: string[];
  /** Rules that the student passed */
  passedRules: string[];
  /** Non-blocking reasons that require further review */
  conditionalReasons: string[];
}

/**
 * Evaluates whether a student is eligible for a job/drive based on the provided criteria.
 *
 * Status precedence:
 *   - PENDING      – CGPA has not been recorded yet (no other checks are blocked)
 *   - INELIGIBLE   – one or more hard rules failed
 *   - CONDITIONAL  – no hard failures, but soft conditions exist (e.g., unverified CGPA)
 *   - ELIGIBLE     – all checks passed
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const failedRules: string[] = [];
  const passedRules: string[] = [];
  const conditionalReasons: string[] = [];

  // ── CGPA check ──────────────────────────────────────────────────────────────
  if (input.studentCgpa === null) {
    // CGPA not recorded — soft condition, other checks can still proceed
    conditionalReasons.push('CGPA not yet verified');
  } else if (input.minCgpa !== null) {
    const required = input.minCgpa;
    const actual = input.studentCgpa;
    if (actual < required) {
      failedRules.push(
        `CGPA below minimum (required: ${required.toFixed(2)}, student: ${actual.toFixed(2)})`,
      );
    } else {
      passedRules.push(
        `CGPA meets minimum (required: ${required.toFixed(2)}, student: ${actual.toFixed(2)})`,
      );
    }
  } else {
    // No CGPA minimum set
    passedRules.push(`CGPA check not required (no minimum set)`);
  }

  // ── Active backlogs check ────────────────────────────────────────────────────
  const maxBacklogs = input.maxBacklogs;
  const studentBacklogs = input.studentActiveBacklogs;
  if (studentBacklogs > maxBacklogs) {
    failedRules.push(
      `Active backlogs exceed limit (max: ${maxBacklogs}, student: ${studentBacklogs})`,
    );
  } else {
    passedRules.push(
      `Active backlogs within limit (max: ${maxBacklogs}, student: ${studentBacklogs})`,
    );
  }

  // ── Department check (case-insensitive) ─────────────────────────────────────
  const studentDeptLower = input.studentDepartment.toLowerCase();
  const allowedDeptsLower = input.allowedDepartments.map((d) => d.toLowerCase());

  if (allowedDeptsLower.length > 0 && !allowedDeptsLower.includes(studentDeptLower)) {
    failedRules.push(
      `Department not eligible (student: "${input.studentDepartment}", allowed: [${input.allowedDepartments.join(', ')}])`,
    );
  } else {
    passedRules.push(`Department is eligible (${input.studentDepartment})`);
  }

  // ── Program check (case-insensitive) ────────────────────────────────────────
  const studentProgLower = input.studentProgram.toLowerCase();
  const allowedProgsLower = input.allowedPrograms.map((p) => p.toLowerCase());

  if (allowedProgsLower.length > 0 && !allowedProgsLower.includes(studentProgLower)) {
    failedRules.push(
      `Program not eligible (student: "${input.studentProgram}", allowed: [${input.allowedPrograms.join(', ')}])`,
    );
  } else {
    passedRules.push(`Program is eligible (${input.studentProgram})`);
  }

  // ── Derive final status ──────────────────────────────────────────────────────
  let status: EligibilityStatus;

  if (failedRules.length > 0) {
    status = 'INELIGIBLE';
  } else if (conditionalReasons.length > 0) {
    status = 'CONDITIONAL';
  } else {
    status = 'ELIGIBLE';
  }

  // Special case: if CGPA is null and there are no other failures, mark PENDING
  // to indicate the eligibility cannot be fully confirmed until CGPA is available.
  if (input.studentCgpa === null && failedRules.length === 0) {
    status = 'PENDING';
  }

  return { status, failedRules, passedRules, conditionalReasons };
}
