# Master Prompt: High-Level UI/UX Documentation

## Project

**AI-Based Placement Matching and Skill Gap Analysis Platform**

## Frontend

The application is a production-quality web application built with:

* Next.js
* TypeScript
* React
* Tailwind CSS
* CSS Variables
* Modern CSS
* Framer Motion or equivalent animation library
* Lucide React or another consistent icon library

---

# 1. YOUR ROLE

Act as a:

* Senior Product Designer
* Senior UI/UX Designer
* Design System Architect
* UX Researcher
* Frontend Architect
* Accessibility Specialist
* Interaction Designer

Your responsibility is to create a **complete high-level UI/UX specification** for the frontend of this placement platform.

This documentation will later be used by developers and coding agents to implement the frontend.

Do not write application implementation code unless a small example is necessary to explain a design rule.

The primary output must be **UI/UX documentation**, not frontend code.

---

# 2. DESIGN REFERENCES

Use these two repositories as design references.

## Reference A: Liquid Glass Widgets

```text
https://github.com/sdegenaar/liquid_glass_widgets
```

Use this reference for:

* Liquid Glass visual language
* Glass surfaces
* Navigation
* Blur
* Transparency
* Borders
* Highlights
* Shadows
* Interactive surfaces
* Sheets
* Dialogs
* Buttons
* Inputs
* Navigation chrome
* Motion principles
* Accessibility considerations

Important:

This is a Flutter/Dart repository.

DO NOT import or use Flutter code.

Recreate the visual principles using:

* CSS
* Tailwind
* React
* Next.js
* TypeScript
* CSS backdrop-filter
* Gradients
* Shadows
* Motion

---

## Reference B: Apple Bento Grid

```text
https://github.com/hubeiqiao/apple-bento-grid
```

Use this reference for:

* Apple-style Bento layouts
* Dashboard composition
* Information hierarchy
* Stat cards
* Category cards
* Highlight cards
* Charts
* Dense but clean layouts
* Tight grid composition
* Light/dark themes
* Restrained accent colors
* Visual balance

The repository uses Apple-inspired zero-gap/tight grid principles, card-based information hierarchy, and responsive presentation layouts. Adapt those principles for an **interactive web application**, not static presentation screenshots.

---

# 3. COMBINED DESIGN DIRECTION

The final design language should be:

```text
Apple-inspired
      +
Liquid Glass
      +
Bento Grid
      +
Professional Placement Management
      +
AI/Data Visualization
```

The application must NOT look like:

* A generic glassmorphism website
* A marketing landing page
* A futuristic neon dashboard
* A gaming interface
* An over-decorated AI dashboard
* A copy of Apple's website

It should feel like a serious product used by:

* Students
* Placement officers
* Recruiters
* College administrators

---

# 4. PRIMARY UX PRINCIPLE

The application deals with placement decisions.

Therefore:

**Clarity > Decoration**

**Trust > Visual Effects**

**Information Hierarchy > Complexity**

**Explainability > Mystery**

**Accessibility > Visual novelty**

Liquid Glass and Bento Grid should support the information, not compete with it.

---

# 5. CORE PRODUCT UX

The platform has two major purposes.

## Placement Cell

The system helps the placement cell:

```text
Create Job
      ↓
Define Requirements
      ↓
View Eligible Students
      ↓
Rank Candidates
      ↓
Understand Candidate Relevance
      ↓
Review Skill Gaps
      ↓
Shortlist Candidates
```

## Student

The system helps students:

```text
Create Profile
      ↓
Explore Jobs
      ↓
Understand Match
      ↓
Understand Skill Gaps
      ↓
Understand Resume vs Job
      ↓
Get Improvement Recommendations
      ↓
Improve Profile
      ↓
Prepare for Future Opportunities
```

The UI must make these workflows obvious.

---

# 6. DESIGN DOCUMENTATION STRUCTURE

Create the following documentation:

```text
docs/
└── frontend/
    │
    ├── README.md
    ├── 01-design-vision.md
    ├── 02-ux-principles.md
    ├── 03-information-architecture.md
    ├── 04-user-personas.md
    ├── 05-user-flows.md
    ├── 06-navigation.md
    ├── 07-design-system.md
    ├── 08-liquid-glass-guidelines.md
    ├── 09-bento-grid-guidelines.md
    ├── 10-color-system.md
    ├── 11-typography.md
    ├── 12-spacing-and-layout.md
    ├── 13-responsive-design.md
    ├── 14-animation-and-motion.md
    ├── 15-accessibility.md
    ├── 16-component-library.md
    ├── 17-states-and-feedback.md
    ├── 18-student-experience.md
    ├── 19-placement-officer-experience.md
    ├── 20-recruiter-experience.md
    ├── 21-admin-experience.md
    ├── 22-dashboard-design.md
    ├── 23-data-visualization.md
    ├── 24-match-analysis-ux.md
    ├── 25-skill-gap-ux.md
    ├── 26-resume-comparison-ux.md
    ├── 27-recommendation-ux.md
    ├── 28-responsive-screen-specifications.md
    ├── 29-frontend-quality-checklist.md
    └── 30-ui-implementation-roadmap.md
```

---

# 7. DESIGN VISION

Define the visual identity.

The application should have:

### Visual qualities

* Clean
* Premium
* Calm
* Intelligent
* Professional
* Spacious
* Data-oriented
* Trustworthy

### Avoid

* Excessive blur
* Excessive transparency
* Neon gradients
* Excessive shadows
* Huge rounded cards everywhere
* Excessive animation
* Too many colors
* Decorative charts with no meaning

---

# 8. INFORMATION ARCHITECTURE

Define the complete frontend information architecture.

## Student

```text
Student
├── Dashboard
├── Jobs
│   ├── Recommended
│   ├── All Jobs
│   └── Job Details
├── Applications
├── Match Analysis
├── Skill Gaps
├── Recommendations
├── Resume
└── Profile
```

## Placement Officer

```text
Placement
├── Dashboard
├── Students
├── Jobs
├── Applications
├── Candidates
│   ├── Rankings
│   └── Candidate Details
├── Skill Gap Analytics
├── Placement Analytics
└── Reports
```

## Recruiter

```text
Recruiter
├── Dashboard
├── Jobs
├── Candidates
├── Candidate Details
└── Applications
```

## Admin

```text
Admin
├── Dashboard
├── Users
├── Students
├── Companies
├── Jobs
├── System Configuration
└── Audit
```

---

# 9. USER PERSONAS

Define UX requirements for:

## Student

Needs:

* Simple profile management
* Job discovery
* Clear match explanations
* Skill-gap understanding
* Improvement guidance
* Placement readiness

Pain points:

* Doesn't know why they are not shortlisted
* Doesn't know which skills matter
* Resume may not reflect actual skills
* Cannot easily compare themselves against a JD

---

## Placement Officer

Needs:

* Fast candidate filtering
* Candidate ranking
* Eligibility visibility
* Explainable recommendations
* Skill-gap overview
* Candidate comparison

Pain points:

* Large student population
* Manual screening
* Multiple company requirements
* Difficulty comparing resumes consistently

---

## Recruiter

Needs:

* Job creation
* Candidate visibility
* Requirement alignment
* Candidate comparison
* Clear candidate profiles

---

# 10. GLOBAL APPLICATION SHELL

Define:

```text
AppShell
├── Sidebar
├── Header
├── Breadcrumb
├── Main Content
└── Responsive Navigation
```

Desktop:

```text
Glass Sidebar
+
Glass Header
+
Bento Content
```

Mobile:

```text
Glass Header
+
Content
+
Glass Bottom Navigation
```

---

# 11. LIQUID GLASS SYSTEM

Define glass surfaces.

Create conceptual categories:

```text
Glass Navigation
Glass Floating
Glass Interactive
Glass Overlay
Glass Control
Glass Subtle
Glass Strong
```

Glass should be used for:

* Sidebar
* Header
* Navigation
* Floating buttons
* Filter controls
* Dialogs
* Sheets
* Selected controls
* Important actions

Avoid using glass for every content card.

---

# 12. GLASS LAYERING

Define a visual hierarchy:

```text
Layer 0
Background

Layer 1
Main Content

Layer 2
Bento Cards

Layer 3
Glass Controls

Layer 4
Glass Navigation

Layer 5
Dialogs / Sheets

Layer 6
Temporary Notifications
```

Every layer must have a clear purpose.

---

# 13. GLASS MATERIAL RULES

Document:

* Background opacity
* Blur
* Saturation
* Border
* Highlight
* Shadow
* Radius
* Hover behavior
* Active behavior
* Focus behavior
* Disabled behavior

Use different levels of glass rather than one glass style everywhere.

---

# 14. BENTO GRID SYSTEM

Use Bento Grid for:

* Dashboard statistics
* Placement analytics
* Candidate overview
* Skill-gap overview
* Job summaries
* Readiness summaries
* Activity
* Reports

Do not force Bento Grid onto every screen.

Forms, tables, and long content may use normal layouts.

---

# 15. BENTO GRID PRINCIPLES

Follow:

```text
Clear hierarchy
Strong grouping
Tight composition
Balanced density
Minimal gaps
Consistent radius
Controlled accent colors
```

Every card must have a purpose.

Avoid empty decorative cards.

---

# 16. DASHBOARD GRID

Example:

```text
┌─────────────────┬─────────────────┬─────────────────┐
│ Students        │ Active Jobs     │ Applications    │
│ 284             │ 18              │ 142             │
├─────────────────┴─────────────────┼─────────────────┤
│                                    │                 │
│ Candidate Ranking                  │ Placement       │
│                                    │ Readiness       │
│ 01 Student A   94%                 │      82%        │
│ 02 Student B   91%                 │                 │
│ 03 Student C   87%                 │                 │
│                                    │                 │
├────────────────────────────────────┼─────────────────┤
│ Skill Gap Analytics                │ Recent Drives   │
└────────────────────────────────────┴─────────────────┘
```

This is a conceptual layout.

Actual dimensions must be responsive.

---

# 17. DASHBOARD CARD TYPES

Define reusable card types:

### Stat Card

```text
284
Students
+12 this month
```

### Match Card

```text
92%
Strong Match
Backend Developer
```

### Skill Gap Card

```text
3
High Priority Gaps
Spring Boot
REST API
DSA
```

### Readiness Card

```text
82%
Placement Readiness
```

### Ranking Card

```text
#1
Student A
94%
```

### Activity Card

```text
Recent Placement Activity
```

### Analytics Card

Use charts only when they communicate meaningful information.

---

# 18. STUDENT DASHBOARD

Design the student dashboard around:

```text
Placement Readiness
Recommended Jobs
Applications
Match Score
Skill Gaps
Improvement Roadmap
Upcoming Drives
```

Primary question:

> "How prepared am I and what should I do next?"

---

# 19. PLACEMENT OFFICER DASHBOARD

Design around:

```text
Students
Active Jobs
Applications
Eligible Candidates
Candidate Rankings
Placement Progress
Skill Gap Distribution
Low Confidence Matches
Recent Activity
```

Primary question:

> "What is happening with placement and where do I need to act?"

---

# 20. RECRUITER DASHBOARD

Design around:

```text
Active Jobs
Applications
Top Candidates
Candidate Distribution
Job Performance
```

Primary question:

> "Which candidates best match my requirements?"

---

# 21. MATCH SCORE UX

Never display only:

```text
82%
```

Always provide context.

Example:

```text
82%

Strong Match

Required Skills
8/9 matched

Confidence
91%
```

Match score must be understandable.

Do not imply that the score guarantees selection.

---

# 22. MATCH ANALYSIS

Create a clear hierarchy:

```text
Overall Match
        ↓
Eligibility
        ↓
Strong Matches
        ↓
Partial Matches
        ↓
Missing Requirements
        ↓
Resume Evidence
        ↓
Improvement Opportunities
```

---

# 23. RESUME VS JOB UX

Use a comparison interface.

Desktop:

```text
Job Requirement        Student Profile

Java                    ✓ Java
Spring Boot             ✕ Missing
REST API                ✕ Missing
SQL                     ✓ MySQL
DSA                     ⚠ Basic
```

Mobile:

Convert into stacked comparison sections.

---

# 24. SKILL GAP EXPERIENCE

The skill-gap UI must answer:

1. What is missing?
2. Why does it matter?
3. How serious is it?
4. What should I improve?
5. How can I improve it?

Example:

```text
Spring Boot

HIGH PRIORITY

Status:
Missing

Reason:
Required by the selected role.

Action:
Build a Spring Boot REST API project.
```

---

# 25. RECOMMENDATION EXPERIENCE

Recommendations should be actionable.

Example:

```text
Improve Spring Boot

Step 1
Learn Spring Boot fundamentals

Step 2
Build CRUD REST API

Step 3
Add authentication

Step 4
Connect SQL database

Step 5
Add project to resume
```

Design this as a roadmap rather than a random list.

---

# 26. PROFILE EXPERIENCE

Student profile should have sections:

```text
Basic Information
Education
Skills
Projects
Internships
Certifications
Assessments
Resume
Preferences
```

Display profile completion:

```text
Profile Completion
85%
```

Show missing information.

---

# 27. JOB CREATION EXPERIENCE

Use a multi-step form:

```text
Company
→ Role
→ Eligibility
→ Required Skills
→ Preferred Skills
→ Description
→ Review
→ Publish
```

Do not put every field on one huge page.

---

# 28. CANDIDATE RANKING UX

Candidate ranking should prioritize:

```text
Rank
Student
Match Score
Confidence
Eligibility
Key Skills
Major Gaps
```

Provide:

```text
Search
Filter
Sort
Compare
```

---

# 29. CANDIDATE COMPARISON

Allow the placement officer to compare selected candidates.

Example:

```text
                Student A   Student B   Student C

Match Score       94%         89%         76%

Java               ✓           ✓           ✓
Spring Boot        ✓           ✓           ✕
REST API            ✓           ✕           ✕
DSA                 ✓           ✓           ⚠
SQL                 ✓           ✓           ✓
```

Keep this interface highly readable.

---

# 30. DATA VISUALIZATION

Use charts only when they help decision-making.

Useful charts:

### Placement readiness distribution

### Skill-gap distribution

### Candidate match distribution

### Applications by job

### Placement progress

Avoid decorative charts.

Every chart must answer a question.

---

# 31. COLOR SYSTEM

Use a restrained palette.

Base:

```text
Neutral / White / Black / Gray
```

Semantic:

```text
Success
Warning
Danger
Information
```

Accent:

Use only a small number of brand accents.

Do not use five or six bright gradient colors simultaneously.

The Apple-inspired Bento reference emphasizes restrained accent usage. Adapt that principle for the application.

---

# 32. LIGHT MODE

Define:

```text
Background
Surface
Glass Surface
Border
Text
Muted Text
Accent
```

The overall feeling should be:

```text
Clean
Bright
Soft
Professional
```

---

# 33. DARK MODE

Define a separate dark system.

Do not simply invert light mode.

Dark mode should have:

```text
Deep background
Subtle surfaces
Controlled glass
Readable text
Low-intensity borders
Limited highlights
```

---

# 34. TYPOGRAPHY

Create a hierarchy:

```text
Display
H1
H2
H3
Title
Body
Label
Caption
```

Important values such as:

```text
Match Score
CGPA
Candidate Rank
Placement Readiness
```

should have strong visual hierarchy.

---

# 35. SPACING SYSTEM

Use a consistent spacing scale.

For example:

```text
4
8
12
16
20
24
32
40
48
64
```

Do not randomly assign spacing throughout the application.

---

# 36. BORDER RADIUS

Use a consistent radius system.

```text
Small
Medium
Large
XL
Pill
```

Avoid making every component excessively rounded.

---

# 37. INTERACTION STATES

Every interactive component must define:

```text
Default
Hover
Focus
Active
Selected
Disabled
Loading
Error
Success
```

This applies to:

* Buttons
* Inputs
* Navigation
* Cards
* Filters
* Tabs
* Dropdowns

---

# 38. ANIMATION SYSTEM

Define motion categories:

### Micro interaction

100–180ms

### Standard transition

180–300ms

### Sheet/dialog

250–400ms

Use easing consistently.

Avoid animations that distract from placement data.

Respect reduced-motion preferences.

---

# 39. RESPONSIVE DESIGN

Define layouts for:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Do not simply scale desktop down.

Create intentional responsive transformations.

Example:

```text
Desktop:
Sidebar + Header + Bento Dashboard

Tablet:
Collapsed Sidebar + Header + Bento Dashboard

Mobile:
Header + Single Column + Bottom Navigation
```

---

# 40. MOBILE BENTO

On mobile:

```text
4-column Bento
      ↓
2-column Bento
      ↓
1-column priority layout
```

Cards should reorder according to importance.

The most important information appears first.

---

# 41. ACCESSIBILITY

The application must support:

* Keyboard navigation
* Screen readers
* Focus visibility
* Semantic HTML
* ARIA where appropriate
* Contrast
* Reduced motion
* Reduced transparency
* Touch target sizing
* Logical reading order

Do not use color alone.

Example:

```text
✓ Matched
⚠ Partial
✕ Missing
```

---

# 42. FEEDBACK STATES

Every important operation needs:

### Loading

```text
Analyzing profile...
```

### Empty

```text
No jobs found.
```

### Error

```text
We couldn't load the candidates.
[Retry]
```

### Success

```text
Job published successfully.
```

### Warning

```text
This candidate has a low-confidence match.
Manual review is recommended.
```

---

# 43. NAVIGATION UX

Navigation should remain predictable.

Desktop:

```text
Persistent Sidebar
```

Mobile:

```text
Bottom Navigation
```

Use glass treatment for navigation surfaces.

Highlight the current route clearly.

Do not hide critical navigation behind unnecessary menus.

---

# 44. SEARCH UX

Search should support:

* Clear action
* Keyboard interaction
* Loading
* Empty results
* Recent searches where useful
* Suggestions where useful

Example:

```text
Search students, jobs, skills...
```

---

# 45. FILTER UX

Desktop:

```text
Search
Branch
CGPA
Match Score
Confidence
Status
```

Mobile:

```text
[ Filters ]
```

Open filters inside a glass sheet/drawer.

---

# 46. TABLE UX

Tables are appropriate for placement data.

Use them for:

* Candidate rankings
* Student management
* Applications
* Reports

But ensure mobile transformation.

Mobile options:

```text
Table
→ Horizontal scroll only if necessary

OR

Table
→ Candidate cards
```

Choose based on information density.

---

# 47. MODALS AND SHEETS

Use:

### Dialog

For:

* Confirmation
* Short actions
* Small pieces of information

### Sheet

For:

* Filters
* Candidate details
* Job preview
* Skill details

### Full page

For:

* Large forms
* Long reports
* Complex analysis

---

# 48. FRONTEND COMPONENT SYSTEM

Define reusable components:

```text
GlassHeader
GlassSidebar
GlassBottomNav
GlassCard
GlassButton
GlassInput
GlassSelect
GlassDialog
GlassSheet
GlassBadge
GlassTabs
GlassSearch
GlassFilter
```

Product components:

```text
StatCard
MatchScoreCard
JobCard
CandidateCard
CandidateRanking
SkillChip
SkillGapCard
RecommendationCard
ReadinessCard
AnalyticsCard
ResumeComparison
```

State components:

```text
LoadingState
EmptyState
ErrorState
SuccessState
Skeleton
```

---

# 49. COMPONENT DOCUMENTATION

For every reusable component document:

```text
Purpose
When to use
When not to use
Variants
States
Responsive behavior
Accessibility
Content guidelines
Examples
```

---

# 50. SCREEN SPECIFICATION FORMAT

Every screen specification must contain:

```text
Screen Name

Purpose

Primary User

Primary Goal

Entry Points

Navigation

Layout

Information Hierarchy

Components

Primary Actions

Secondary Actions

Responsive Behavior

Loading State

Empty State

Error State

Success State

Accessibility

Animation

Acceptance Criteria
```

---

# 51. SCREEN DEVELOPMENT PRIORITY

Build documentation and design in this order:

```text
01 Design System

02 Application Shell

03 Navigation

04 Student Dashboard

05 Student Profile

06 Job Discovery

07 Job Detail

08 Match Analysis

09 Resume vs Job

10 Skill Gap

11 Recommendations

12 Placement Dashboard

13 Candidate Ranking

14 Candidate Detail

15 Candidate Comparison

16 Job Creation

17 Recruiter Dashboard

18 Analytics

19 Reports

20 Admin
```

---

# 52. DESIGN REVIEW PROCESS

Every major screen must pass:

```text
UX Review
↓
Visual Review
↓
Responsive Review
↓
Accessibility Review
↓
Interaction Review
↓
Performance Review
↓
Final Approval
```

Do not approve a screen just because it looks attractive.

---

# 53. VISUAL QA

Check for:

```text
Incorrect spacing
Text overflow
Broken Bento alignment
Unbalanced cards
Excessive empty space
Excessive glass
Unreadable glass
Poor contrast
Wrong hierarchy
Broken mobile layout
Incorrect typography
Excessive animation
```

The Bento reference specifically emphasizes visual review for overflow, empty space, font fallback, and broken grid composition. Apply those principles to the interactive application.

---

# 54. PERFORMANCE UX

Because glass effects can be expensive:

* Avoid excessive backdrop filters
* Avoid large numbers of simultaneous glass layers
* Avoid unnecessary animated blur
* Use glass selectively
* Provide graceful fallback
* Keep scrolling smooth

The UI must remain functional even if advanced glass effects are unavailable.

---

# 55. DESIGN SYSTEM RULE

Never create a new visual pattern when an existing component can handle the requirement.

Before creating a new component, ask:

```text
Can an existing component handle this?
```

If yes, reuse it.

If no, create a reusable component.

Avoid one-off UI implementations.

---

# 56. HIGH-LEVEL FRONTEND ARCHITECTURE

Recommended conceptual structure:

```text
Next.js Application

├── App Shell
│
├── Design System
│
├── Navigation
│
├── Shared Components
│
├── Student Experience
│
├── Placement Experience
│
├── Recruiter Experience
│
├── Admin Experience
│
└── Data Visualization
```

The UI layer must remain independent from backend implementation details.

---

# 57. WHAT THIS DOCUMENT MUST NOT DEFINE

Do not include implementation details for:

* AI models
* Matching algorithms
* Embedding models
* Database schemas
* API implementation
* Backend services
* Authentication implementation
* Deployment
* Infrastructure
* Server configuration

Only document how those systems affect the frontend experience.

Example:

Allowed:

> "The frontend displays a confidence indicator for a candidate recommendation."

Not allowed:

> "The backend calculates confidence using model X with threshold Y."

---

# 58. FINAL DESIGN GOAL

The finished application should communicate:

```text
                    PLACEMENT INTELLIGENCE

      ┌──────────────────────────────────────────┐
      │             LIQUID GLASS UI              │
      └──────────────────────────────────────────┘

       Apple-inspired Bento information layout

                     +

              Clear AI insights

                     +

             Professional UX

                     +

             Student guidance

                     +

           Placement operations
```

The final product should feel like a polished, modern enterprise web application designed specifically for college placement management.

It should be visually inspired by Apple's design principles without copying Apple's proprietary UI.

---

# 59. FINAL DOCUMENTATION CHECKLIST

Before completing the UI/UX documentation:

```text
[ ] Design vision documented
[ ] UX principles documented
[ ] Personas documented
[ ] Information architecture documented
[ ] User flows documented
[ ] Navigation documented
[ ] Liquid Glass system documented
[ ] Bento Grid system documented
[ ] Color system documented
[ ] Typography documented
[ ] Spacing documented
[ ] Responsive system documented
[ ] Motion documented
[ ] Accessibility documented
[ ] Component system documented
[ ] Student experience documented
[ ] Placement officer experience documented
[ ] Recruiter experience documented
[ ] Admin experience documented
[ ] Dashboard layouts documented
[ ] Match analysis documented
[ ] Skill gap experience documented
[ ] Resume comparison documented
[ ] Recommendation experience documented
[ ] Data visualization documented
[ ] Loading states documented
[ ] Empty states documented
[ ] Error states documented
[ ] Success states documented
[ ] Mobile behavior documented
[ ] Screen specifications documented
[ ] UI implementation roadmap documented
[ ] Visual QA checklist documented
```

---

# 60. FINAL INSTRUCTION TO THE CODING AGENT

Before implementing any frontend screen:

1. Read the relevant UI/UX documentation.
2. Identify the required components.
3. Follow the design system.
4. Follow the Liquid Glass rules.
5. Follow the Bento layout rules where applicable.
6. Implement responsive behavior.
7. Implement all required states.
8. Test accessibility.
9. Test the screen at multiple viewport sizes.
10. Perform visual QA.
11. Fix visual problems before marking the screen complete.
12. Update the documentation if the design changes.

Never invent a new visual style for individual screens.

Maintain one coherent design language throughout the entire application.

The goal is not simply to make the application "look beautiful".

The goal is to make placement information **easy to understand, easy to compare, trustworthy, actionable, and visually organized**, while using Liquid Glass and Apple-inspired Bento composition as the application's visual foundation.
