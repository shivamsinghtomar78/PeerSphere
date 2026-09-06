import { computeMatch, JobSkillRequirement, StudentSkillInput } from '@/lib/engines/matching.engine';

const req = (over: Partial<JobSkillRequirement> = {}): JobSkillRequirement => ({
  id: over.id ?? 'r1',
  name: over.name ?? 'Java',
  aliases: over.aliases ?? [],
  weight: over.weight ?? 1.0,
  required: over.required ?? true,
});

const skill = (name: string, confidence: number): StudentSkillInput => ({ name, confidence });

describe('matching engine — degenerate inputs', () => {
  it('zero requirements → score 100, coverage 100, no review', () => {
    const r = computeMatch([skill('Java', 90)], []);
    expect(r.overallScore).toBe(100);
    expect(r.coveragePercent).toBe(100);
    expect(r.details).toHaveLength(0);
  });

  it('only optional requirements → score 100 (score counts required only)', () => {
    const r = computeMatch([], [req({ required: false })]);
    expect(r.overallScore).toBe(100);
    expect(r.coveragePercent).toBe(100);
    expect(r.missingSkills).toContain('Java');
  });

  it('empty student skills → everything MISSING, score 0, confidence 0', () => {
    const r = computeMatch([], [req(), req({ id: 'r2', name: 'SQL' })]);
    expect(r.overallScore).toBe(0);
    expect(r.coveragePercent).toBe(0);
    expect(r.confidenceScore).toBe(0);
    expect(r.missingSkills).toEqual(['Java', 'SQL']);
  });
});

describe('matching engine — thresholds (40 / 75)', () => {
  it('exact match at confidence 75 → STRONG; at 74 → PARTIAL; at 40 → PARTIAL; at 39 → MISSING', () => {
    expect(computeMatch([skill('Java', 75)], [req()]).details[0].status).toBe('STRONG');
    expect(computeMatch([skill('Java', 74)], [req()]).details[0].status).toBe('PARTIAL');
    expect(computeMatch([skill('Java', 40)], [req()]).details[0].status).toBe('PARTIAL');
    const low = computeMatch([skill('Java', 39)], [req()]);
    expect(low.details[0].status).toBe('MISSING');
    expect(low.details[0].explanation).toContain('below threshold');
  });

  it('alias match behaves like exact for thresholds', () => {
    const jsReq = req({ name: 'JavaScript', aliases: ['js', 'ecmascript'] });
    expect(computeMatch([skill('JS', 80)], [jsReq]).details[0].status).toBe('STRONG');
    expect(computeMatch([skill('js', 50)], [jsReq]).details[0].status).toBe('PARTIAL');
  });

  it('substring match is always PARTIAL, even at high confidence', () => {
    const r = computeMatch([skill('Java Spring Boot', 99)], [req({ name: 'Spring' })]);
    expect(r.details[0].status).toBe('PARTIAL');
    expect(r.details[0].explanation).toContain('substring');
  });
});

describe('matching engine — weighted scoring', () => {
  it('all STRONG → 100; all MISSING → 0', () => {
    const reqs = [req(), req({ id: 'r2', name: 'SQL', weight: 2 })];
    expect(computeMatch([skill('Java', 90), skill('SQL', 90)], reqs).overallScore).toBe(100);
    expect(computeMatch([skill('Rust', 90)], reqs).overallScore).toBe(0);
  });

  it('weight 2.0 STRONG + weight 1.0 MISSING → 67', () => {
    const r = computeMatch(
      [skill('Java', 90)],
      [req({ weight: 2 }), req({ id: 'r2', name: 'SQL', weight: 1 })]
    );
    // (1.0*2 + 0*1) / 3 = 0.667 → 67
    expect(r.overallScore).toBe(67);
    expect(r.coveragePercent).toBe(50);
  });

  it('PARTIAL contributes 0.5', () => {
    const r = computeMatch([skill('Java', 50)], [req()]);
    expect(r.overallScore).toBe(50);
    expect(r.details[0].contribution).toBe(0.5);
  });

  it('confidence score is the weight-averaged confidence of matched skills', () => {
    const r = computeMatch(
      [skill('Java', 80), skill('SQL', 60)],
      [req({ weight: 3 }), req({ id: 'r2', name: 'SQL', weight: 1 })]
    );
    // (80*3 + 60*1) / 4 = 75
    expect(r.confidenceScore).toBe(75);
  });
});

describe('matching engine — review flags', () => {
  it('confidence < 60 → requiresReview with note', () => {
    const r = computeMatch([skill('Java', 45)], [req()]);
    expect(r.confidenceScore).toBeLessThan(60);
    expect(r.requiresReview).toBe(true);
    expect(r.reviewNote).toContain('confidence');
  });

  it('conflicting aliases (duplicate token) → requiresReview', () => {
    const r = computeMatch(
      [skill('Java', 95)],
      [req({ aliases: ['java'] })] // alias duplicates the canonical name
    );
    expect(r.requiresReview).toBe(true);
    expect(r.reviewNote).toContain('conflicting aliases');
  });

  it('high-confidence clean match → no review', () => {
    const r = computeMatch([skill('Java', 95)], [req()]);
    expect(r.requiresReview).toBe(false);
    expect(r.reviewNote).toBeUndefined();
  });
});

describe('matching engine — summary text', () => {
  it('mentions score and coverage; quality label tracks the score', () => {
    const strong = computeMatch([skill('Java', 95)], [req()]);
    expect(strong.matchSummary).toContain('strong');
    expect(strong.matchSummary).toContain('100');

    const weak = computeMatch([], [req()]);
    expect(weak.matchSummary).toContain('weak');
  });

  it('no-gaps summary when everything matches', () => {
    const r = computeMatch([skill('Java', 95)], [req()]);
    expect(r.matchSummary).toContain('no gaps');
  });
});
