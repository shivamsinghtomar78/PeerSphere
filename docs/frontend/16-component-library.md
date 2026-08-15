# 16 — Component Library

## Shared primitives

GlassHeader, GlassSidebar, GlassBottomNav, GlassButton, GlassInput, GlassSelect, GlassDialog, GlassSheet, GlassBadge, GlassTabs, GlassSearch, GlassFilter, LoadingState, EmptyState, ErrorState, SuccessState, Skeleton.

## Product components

StatCard, MatchScoreCard, JobCard, CandidateCard, CandidateRanking, SkillChip, SkillGapCard, RecommendationCard, ReadinessCard, AnalyticsCard, ResumeComparison, EvidenceList, ConfidenceIndicator, HumanReviewBanner.

## Documentation Contract

Every component page/story must state purpose, use/not-use cases, variants, states, responsive behavior, keyboard/screen-reader behavior, content rules, and visual examples. Product components must accept structured data; they must not reconstruct or infer matching logic client-side.

## Acceptance Criteria

- [ ] Components cover all screen requirements before one-off code is introduced.
- [ ] All interactive variants have accessible names and state semantics.
