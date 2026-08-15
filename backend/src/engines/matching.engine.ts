/**
 * matching.engine.ts
 * Pure-function engine for computing skill-match score between a student and a job.
 * No external dependencies.
 */

export interface StudentSkillInput {
  /** Skill name as reported by the student */
  name: string;
  /** Student's self-reported confidence 0–100 */
  confidence: number;
}

export interface JobSkillRequirement {
  /** Unique identifier for this requirement */
  id: string;
  /** Canonical skill name */
  name: string;
  /** Alternative names / synonyms for fuzzy matching */
  aliases: string[];
  /** Relative importance weight (e.g. 1.0 = normal, 2.0 = critical) */
  weight: number;
  /** true = mandatory, false = nice-to-have */
  required: boolean;
}

export interface SkillMatchDetail {
  requirementId: string;
  skillName: string;
  status: 'STRONG' | 'PARTIAL' | 'MISSING';
  /** Numeric contribution used in score calculation: 1.0 / 0.5 / 0.0 */
  contribution: number;
  explanation: string;
}

export interface MatchingResult {
  /** Weighted overall fit score 0–100 (based on required skills only) */
  overallScore: number;
  /** Confidence in the match quality 0–100 */
  confidenceScore: number;
  /** Percentage of required skills that are STRONG or PARTIAL */
  coveragePercent: number;
  strongSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  matchSummary: string;
  requiresReview: boolean;
  reviewNote?: string;
  details: SkillMatchDetail[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Attempts to match a single job requirement against the student's skill list.
 * Returns the best-matching StudentSkillInput and the match method, or null.
 */
function findBestMatch(
  requirement: JobSkillRequirement,
  studentSkills: StudentSkillInput[],
): { skill: StudentSkillInput; method: 'exact' | 'alias' | 'substring' } | null {
  const reqName = normalize(requirement.name);
  const reqAliases = requirement.aliases.map(normalize);

  let bestSubstring: { skill: StudentSkillInput; method: 'substring' } | null = null;

  for (const skill of studentSkills) {
    const skillName = normalize(skill.name);

    // Exact name match
    if (skillName === reqName) {
      return { skill, method: 'exact' };
    }

    // Alias match
    if (reqAliases.includes(skillName)) {
      return { skill, method: 'alias' };
    }

    // Substring match (keyword overlap) — kept as fallback
    if (!bestSubstring) {
      if (skillName.includes(reqName) || reqName.includes(skillName)) {
        bestSubstring = { skill, method: 'substring' };
      } else {
        // Check if any alias overlaps
        for (const alias of reqAliases) {
          if (skillName.includes(alias) || alias.includes(skillName)) {
            bestSubstring = { skill, method: 'substring' };
            break;
          }
        }
      }
    }
  }

  return bestSubstring ?? null;
}

/**
 * Detect conflicting aliases: two different aliases that normalize to the
 * same token as different canonical names — a simple heuristic to flag
 * ambiguous requirement definitions.
 */
function hasConflictingAliases(requirement: JobSkillRequirement): boolean {
  const seen = new Set<string>();
  const tokens = [normalize(requirement.name), ...requirement.aliases.map(normalize)];
  for (const token of tokens) {
    if (seen.has(token)) return true;
    seen.add(token);
  }
  return false;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Computes a skill-match result between a student's skills and job requirements.
 */
export function computeMatch(
  studentSkills: StudentSkillInput[],
  jobRequirements: JobSkillRequirement[],
): MatchingResult {
  const details: SkillMatchDetail[] = [];
  const strongSkills: string[] = [];
  const partialSkills: string[] = [];
  const missingSkills: string[] = [];

  let weightedScoreNumerator = 0;
  let weightedScoreDenominator = 0;

  // For confidence score: collect (confidence * weight) for matched skills
  let confidenceWeightedSum = 0;
  let confidenceWeightTotal = 0;

  let anyConflictingAliases = false;
  let requiredTotal = 0;
  let requiredMatched = 0; // strong or partial

  for (const req of jobRequirements) {
    const isRequired = req.required;
    if (isRequired) requiredTotal++;

    if (hasConflictingAliases(req)) anyConflictingAliases = true;

    const match = findBestMatch(req, studentSkills);

    let status: 'STRONG' | 'PARTIAL' | 'MISSING';
    let contribution: number;
    let explanation: string;
    let matchedConfidence = 0;

    if (match === null) {
      // No match at all
      status = 'MISSING';
      contribution = 0.0;
      explanation = `No matching skill found for "${req.name}".`;
      missingSkills.push(req.name);
    } else {
      const { skill, method } = match;
      matchedConfidence = skill.confidence;

      if ((method === 'exact' || method === 'alias') && skill.confidence >= 75) {
        // Strong match
        status = 'STRONG';
        contribution = 1.0;
        explanation =
          method === 'exact'
            ? `Exact match on "${skill.name}" with confidence ${skill.confidence}.`
            : `Alias match: "${skill.name}" maps to "${req.name}" with confidence ${skill.confidence}.`;
        strongSkills.push(req.name);
        if (isRequired) requiredMatched++;
      } else if (
        ((method === 'exact' || method === 'alias') && skill.confidence >= 40) ||
        method === 'substring'
      ) {
        // Partial match
        status = 'PARTIAL';
        contribution = 0.5;
        if (method === 'substring') {
          explanation = `Keyword/substring match: "${skill.name}" partially overlaps "${req.name}" (confidence ${skill.confidence}).`;
        } else {
          explanation = `Match on "${skill.name}" with moderate confidence ${skill.confidence} (below strong threshold of 75).`;
        }
        partialSkills.push(req.name);
        if (isRequired) requiredMatched++;
      } else {
        // Match found but confidence too low — treat as missing
        status = 'MISSING';
        contribution = 0.0;
        explanation = `Skill "${skill.name}" matched "${req.name}" but confidence ${skill.confidence} is below threshold (40).`;
        missingSkills.push(req.name);
        matchedConfidence = 0; // don't count toward confidence score
      }

      // Accumulate confidence score for matched skills
      if (status !== 'MISSING') {
        confidenceWeightedSum += matchedConfidence * req.weight;
        confidenceWeightTotal += req.weight;
      }
    }

    details.push({
      requirementId: req.id,
      skillName: req.name,
      status,
      contribution,
      explanation,
    });

    // Overall score only counts required skills
    if (isRequired) {
      weightedScoreNumerator += contribution * req.weight;
      weightedScoreDenominator += req.weight;
    }
  }

  // ── Compute scores ───────────────────────────────────────────────────────────
  const overallScore =
    weightedScoreDenominator > 0
      ? Math.round((weightedScoreNumerator / weightedScoreDenominator) * 100)
      : 100; // No required skills → full score by default

  const coveragePercent =
    requiredTotal > 0 ? Math.round((requiredMatched / requiredTotal) * 100) : 100;

  // Confidence score: weighted average of matched skill confidences.
  // Default to 85 when there are matched skills but no confidence data.
  let confidenceScore: number;
  if (confidenceWeightTotal > 0) {
    confidenceScore = Math.round(confidenceWeightedSum / confidenceWeightTotal);
  } else if (strongSkills.length > 0 || partialSkills.length > 0) {
    confidenceScore = 85;
  } else {
    confidenceScore = 0;
  }
  // Clamp to 0–100
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));

  // ── Review flag ──────────────────────────────────────────────────────────────
  const requiresReview = confidenceScore < 60 || anyConflictingAliases;
  const reviewNotes: string[] = [];
  if (confidenceScore < 60) reviewNotes.push('overall confidence score is low');
  if (anyConflictingAliases) reviewNotes.push('one or more requirements have conflicting aliases');
  const reviewNote = reviewNotes.length > 0 ? `Review required: ${reviewNotes.join('; ')}.` : undefined;

  // ── Match summary ────────────────────────────────────────────────────────────
  const matchSummary = buildMatchSummary({
    overallScore,
    coveragePercent,
    strongCount: strongSkills.length,
    partialCount: partialSkills.length,
    missingCount: missingSkills.length,
    totalRequired: requiredTotal,
  });

  return {
    overallScore,
    confidenceScore,
    coveragePercent,
    strongSkills,
    partialSkills,
    missingSkills,
    matchSummary,
    requiresReview,
    reviewNote,
    details,
  };
}

// ─── Summary builder ─────────────────────────────────────────────────────────

interface SummaryParams {
  overallScore: number;
  coveragePercent: number;
  strongCount: number;
  partialCount: number;
  missingCount: number;
  totalRequired: number;
}

function buildMatchSummary(p: SummaryParams): string {
  const { overallScore, coveragePercent, strongCount, partialCount, missingCount, totalRequired } = p;

  let qualityLabel: string;
  if (overallScore >= 80) qualityLabel = 'strong';
  else if (overallScore >= 55) qualityLabel = 'moderate';
  else qualityLabel = 'weak';

  const line1 = `The student shows a ${qualityLabel} overall match with a score of ${overallScore}/100, covering ${coveragePercent}% of required skills.`;

  let line2: string;
  if (missingCount === 0) {
    line2 = `All ${totalRequired} required skill(s) were matched (${strongCount} strong, ${partialCount} partial) with no gaps identified.`;
  } else {
    const matchedDesc =
      strongCount + partialCount > 0
        ? `${strongCount} strong and ${partialCount} partial match(es)`
        : 'no direct matches';
    line2 = `There are ${missingCount} missing required skill(s); ${matchedDesc} out of ${totalRequired} total required skill(s).`;
  }

  return `${line1} ${line2}`;
}
