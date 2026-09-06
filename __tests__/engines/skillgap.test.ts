import { analyzeSkillGaps, GapInput } from '@/lib/engines/skillgap.engine';
import { computeMatch, JobSkillRequirement, StudentSkillInput } from '@/lib/engines/matching.engine';

const req = (over: Partial<JobSkillRequirement> = {}): JobSkillRequirement => ({
  id: over.id ?? 'r1',
  name: over.name ?? 'Java',
  aliases: over.aliases ?? [],
  weight: over.weight ?? 1.0,
  required: over.required ?? true,
});

function gaps(studentSkills: StudentSkillInput[], jobRequirements: JobSkillRequirement[]) {
  const match = computeMatch(studentSkills, jobRequirements);
  const input: GapInput = { studentSkills, jobRequirements, matchDetails: match.details };
  return analyzeSkillGaps(input);
}

describe('skill-gap engine — gap selection', () => {
  it('no gaps when every requirement is STRONG', () => {
    expect(gaps([{ name: 'Java', confidence: 95 }], [req()])).toHaveLength(0);
  });

  it('MISSING and PARTIAL requirements produce gaps; STRONG does not', () => {
    const result = gaps(
      [{ name: 'Java', confidence: 95 }, { name: 'SQL', confidence: 50 }],
      [req(), req({ id: 'r2', name: 'SQL' }), req({ id: 'r3', name: 'Docker' })]
    );
    const names = result.map((g) => g.skillName);
    expect(names).toContain('SQL'); // partial
    expect(names).toContain('Docker'); // missing
    expect(names).not.toContain('Java'); // strong
  });
});

describe('skill-gap engine — priority rules', () => {
  it('missing required high-weight (≥1.5) → high; normal weight → medium; optional → low; partial → medium', () => {
    const result = gaps(
      [{ name: 'SQL', confidence: 50 }],
      [
        req({ id: 'critical', name: 'Kubernetes', weight: 2 }),
        req({ id: 'normal', name: 'Docker', weight: 1 }),
        req({ id: 'nice', name: 'GraphQL', required: false }),
        req({ id: 'partial', name: 'SQL' }),
      ]
    );
    const byName = Object.fromEntries(result.map((g) => [g.skillName, g]));
    expect(byName['Kubernetes'].priority).toBe('high');
    expect(byName['Docker'].priority).toBe('medium');
    expect(byName['GraphQL'].priority).toBe('low');
    expect(byName['SQL'].priority).toBe('medium');
  });

  it('sorts by priority then potentialLift, descending', () => {
    const result = gaps(
      [],
      [
        req({ id: 'a', name: 'Communication', required: false }),
        req({ id: 'b', name: 'Kubernetes', weight: 3 }),
        req({ id: 'c', name: 'Docker', weight: 1 }),
      ]
    );
    expect(result[0].skillName).toBe('Kubernetes'); // high first
    expect(result[result.length - 1].skillName).toBe('Communication'); // low last
    const order = { high: 3, medium: 2, low: 1 } as const;
    for (let i = 1; i < result.length; i++) {
      expect(order[result[i - 1].priority]).toBeGreaterThanOrEqual(order[result[i].priority]);
    }
  });
});

describe('skill-gap engine — output contract', () => {
  it('every gap has 3–5 steps, positive bounded lift, positive weeks', () => {
    const result = gaps(
      [],
      [
        req({ id: 'a', name: 'Python', weight: 2 }),
        req({ id: 'b', name: 'AWS', weight: 1 }),
        req({ id: 'c', name: 'Communication', required: false }),
      ]
    );
    expect(result.length).toBe(3);
    for (const gap of result) {
      expect(gap.steps.length).toBeGreaterThanOrEqual(3);
      expect(gap.steps.length).toBeLessThanOrEqual(5);
      expect(gap.potentialLift).toBeGreaterThan(0);
      expect(gap.potentialLift).toBeLessThanOrEqual(30);
      expect(gap.estimatedWeeks).toBeGreaterThan(0);
      expect(gap.reason.length).toBeGreaterThan(10);
    }
  });

  it('steps are category-specific and mention the skill where templated', () => {
    const [pythonGap] = gaps([], [req({ name: 'Python' })]);
    expect(pythonGap.steps.some((s) => s.includes('Python'))).toBe(true);
    // programming-category template mentions coding practice platforms
    expect(pythonGap.steps.join(' ')).toMatch(/LeetCode|HackerRank|Exercism/);
  });

  it('unknown skills fall back to the general category without crashing', () => {
    const [gap] = gaps([], [req({ name: 'Underwater Basket Weaving' })]);
    expect(gap.steps.length).toBeGreaterThanOrEqual(3);
    expect(gap.skillName).toBe('Underwater Basket Weaving');
  });
});
