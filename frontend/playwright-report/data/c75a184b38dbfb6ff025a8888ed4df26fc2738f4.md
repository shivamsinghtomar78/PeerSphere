# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-flow.spec.ts >> Student Portal & Flows >> Student Roadmap, Applications, and Profile update
- Location: e2e\student-flow.spec.ts:77:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /\+ Add/i })
    - locator resolved to <button type="submit" aria-busy="false" class="inline-flex items-center justify-center font-medium rounded-sm transition-base cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ps-focus)] bg-surface-raised text-text border border-border hover:border-border-strong hover:bg-surface active:scale-[0.98] shadow-sm h-8 px-3 text-sm gap-1.5">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span>Applications</span> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <a href="/student/applications" class="flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-focus)] text-text-muted min-h-[44px]">…</a> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    21 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <a href="/student/applications" class="flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-focus)] text-text-muted min-h-[44px]">…</a> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span>Applications</span> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <a href="/student/applications" class="flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-focus)] text-text-muted min-h-[44px]">…</a> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <a href="/student/applications" class="flex flex-col items-center justify-center h-full gap-1 text-xs font-medium transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-focus)] text-text-muted min-h-[44px]">…</a> from <nav aria-label="Primary navigation" class="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - generic [ref=f2e3]:
      - banner [ref=f2e4]:
        - button "Open navigation menu" [ref=f2e5] [cursor=pointer]
        - generic [ref=f2e7]:
          - generic [ref=f2e8]: P
          - generic [ref=f2e9]: PeerSphere
        - 'button "Current: System mode. Click to switch theme." [ref=f2e11] [cursor=pointer]'
      - main [ref=f2e14]:
        - generic [ref=f2e15]:
          - generic [ref=f2e16]:
            - generic [ref=f2e17]:
              - heading "Profile & Resume Management" [level=1] [ref=f2e18]
              - paragraph [ref=f2e19]: Keep your verified academic record, parsed skills, and resume updated for automated AI placement screening.
            - button "Save Changes" [ref=f2e20] [cursor=pointer]
          - generic [ref=f2e22]:
            - generic [ref=f2e23]:
              - heading "Academic Information" [level=2] [ref=f2e24]
              - generic [ref=f2e25]:
                - generic [ref=f2e26]:
                  - generic [ref=f2e27]: Full Name
                  - textbox "Full Name" [ref=f2e29]: Arjun Sharma
                - generic [ref=f2e30]:
                  - generic [ref=f2e31]: University Email
                  - textbox "University Email" [disabled] [ref=f2e33]: arjun.sharma@college.edu
                  - paragraph [ref=f2e34]: Verified college identity
                - generic [ref=f2e35]:
                  - generic [ref=f2e36]: Roll Number / Student ID
                  - textbox "Roll Number / Student ID" [disabled] [ref=f2e38]: 21CS001
                - generic [ref=f2e39]:
                  - generic [ref=f2e40]: Department / Branch
                  - textbox "Department / Branch" [disabled] [ref=f2e42]: Computer Science
                - generic [ref=f2e43]:
                  - generic [ref=f2e44]: Current CGPA
                  - textbox "Current CGPA" [disabled] [ref=f2e46]: "8.4"
                  - paragraph [ref=f2e47]: Verified by Placement Cell
                - generic [ref=f2e48]:
                  - generic [ref=f2e49]: Active Backlogs
                  - textbox "Active Backlogs" [disabled] [ref=f2e51]: "0"
            - generic [ref=f2e52]:
              - generic [ref=f2e53]:
                - heading "Active Resume" [level=2] [ref=f2e54]
                - paragraph [ref=f2e55]: Parsed for AI match modeling.
                - generic [ref=f2e56]:
                  - paragraph [ref=f2e61]: resume-arjun-v2.pdf
                  - paragraph [ref=f2e62]: "Updated: 10 Jul 2026"
              - generic [ref=f2e63]:
                - button "Upload New PDF" [ref=f2e64] [cursor=pointer]
                - generic [ref=f2e66]: Max file size 5MB • PDF only
          - generic [ref=f2e67]:
            - generic [ref=f2e68]:
              - generic [ref=f2e69]:
                - heading "Skills & Competencies" [level=2] [ref=f2e70]
                - paragraph [ref=f2e71]: Add technical skills verified in your projects, internships, or certifications.
              - generic [ref=f2e72]:
                - textbox "Add skill (e.g. Docker)..." [active] [ref=f2e73]: Kubernetes
                - button "+ Add" [ref=f2e74] [cursor=pointer]
            - generic [ref=f2e76]:
              - generic [ref=f2e77]:
                - generic [ref=f2e78]: Java
                - button "Remove skill Java" [ref=f2e80]: ✕
              - generic [ref=f2e81]:
                - generic [ref=f2e82]: SQL
                - button "Remove skill SQL" [ref=f2e84]: ✕
              - generic [ref=f2e85]:
                - generic [ref=f2e86]: Git
                - button "Remove skill Git" [ref=f2e88]: ✕
              - generic [ref=f2e89]:
                - generic [ref=f2e90]: Data Structures
                - button "Remove skill Data Structures" [ref=f2e92]: ✕
              - generic [ref=f2e93]:
                - generic [ref=f2e94]: Python
                - button "Remove skill Python" [ref=f2e96]: ✕
    - navigation "Primary navigation" [ref=f2e97]:
      - list [ref=f2e98]:
        - listitem [ref=f2e99]:
          - link "Dashboard" [ref=f2e100] [cursor=pointer]:
            - /url: /student
        - listitem [ref=f2e104]:
          - link "Jobs" [ref=f2e105] [cursor=pointer]:
            - /url: /student/jobs
        - listitem [ref=f2e109]:
          - link "Applications" [ref=f2e110] [cursor=pointer]:
            - /url: /student/applications
        - listitem [ref=f2e114]:
          - link "Match Analysis" [ref=f2e115] [cursor=pointer]:
            - /url: /student/match
        - listitem [ref=f2e119]:
          - link "Skill Gaps" [ref=f2e120] [cursor=pointer]:
            - /url: /student/skill-gaps
  - alert [ref=f2e124]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Student Portal & Flows', () => {
  4   |   test('Landing page and navigation to Student Workspace', async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await expect(page).toHaveTitle(/PeerSphere/);
  7   |     await expect(page.locator('h1')).toContainText('Placement Matching');
  8   | 
  9   |     // Click on Student Portal
  10  |     await page.getByRole('link', { name: /Enter Student Experience/i }).click();
  11  |     await expect(page).toHaveURL(/\/student/);
  12  |   });
  13  | 
  14  |   test('Student Dashboard Bento Grid verification', async ({ page }) => {
  15  |     await page.goto('/student');
  16  | 
  17  |     // Verify key readiness and stats
  18  |     await expect(page.getByText('Placement Readiness')).toBeVisible();
  19  |     await expect(page.getByText('82%')).toBeVisible();
  20  |     await expect(page.getByText('Top Recommendation')).toBeVisible();
  21  |     await expect(page.getByText('Active Improvement Track')).toBeVisible();
  22  | 
  23  |     // Verify Bento cards exist
  24  |     const cards = page.locator('.surface, .surface-raised');
  25  |     expect(await cards.count()).toBeGreaterThan(3);
  26  |   });
  27  | 
  28  |   test('Student Jobs directory search, filter, and detail flow', async ({ page }) => {
  29  |     await page.goto('/student/jobs');
  30  | 
  31  |     await expect(page.locator('h1')).toContainText('Campus Placement Openings');
  32  |     await expect(page.getByText('ABC Technologies').first()).toBeVisible();
  33  | 
  34  |     // Search for Backend
  35  |     const searchInput = page.getByPlaceholder(/Search by job title/i);
  36  |     await searchInput.fill('Backend');
  37  |     await expect(page.getByRole('heading', { name: 'Backend Developer' }).first()).toBeVisible();
  38  | 
  39  |     // Navigate to Job Detail
  40  |     await page.getByRole('link', { name: 'View Details' }).first().click();
  41  |     await expect(page).toHaveURL(/\/student\/jobs\/job-001/);
  42  | 
  43  |     // Check Job detail sections
  44  |     await expect(page.getByRole('heading', { name: 'About the Role' })).toBeVisible();
  45  |     await expect(page.getByRole('heading', { name: 'Skill Requirements' })).toBeVisible();
  46  |     await expect(page.getByRole('heading', { name: 'Eligibility Criteria' })).toBeVisible();
  47  |     await expect(page.getByText('Resume vs Job Requirements Matrix')).toBeVisible();
  48  | 
  49  |     // Test Apply interaction
  50  |     const applyBtn = page.getByRole('button', { name: /Apply for Role/i });
  51  |     if (await applyBtn.isVisible()) {
  52  |       await applyBtn.click();
  53  |       await expect(page.getByText('Application Submitted ✓')).toBeVisible();
  54  |     }
  55  |   });
  56  | 
  57  |   test('Student Match Analysis and Skill Gap inspection', async ({ page }) => {
  58  |     await page.goto('/student/match');
  59  | 
  60  |     await expect(page.locator('h1')).toContainText('AI Match & Gap Analysis');
  61  |     await expect(page.getByText('Overall AI Match Score')).toBeVisible();
  62  |     await expect(page.getByRole('heading', { name: 'Skill Match Categorization' })).toBeVisible();
  63  |     await expect(page.getByText('Strong Matches').first()).toBeVisible();
  64  |     await expect(page.getByText('Missing Gaps').first()).toBeVisible();
  65  | 
  66  |     // Navigate to Skill Gaps
  67  |     await page.getByRole('link', { name: /Inspect Skill Gaps/i }).first().click();
  68  |     await expect(page).toHaveURL(/\/student\/skill-gaps/);
  69  | 
  70  |     // Expand Spring Boot gap
  71  |     await expect(page.getByText('Spring Boot').first()).toBeVisible();
  72  |     await page.getByText('Spring Boot').first().click();
  73  |     await expect(page.getByText('Why It Matters').first()).toBeVisible();
  74  |     await expect(page.getByText('Improvement Steps').first()).toBeVisible();
  75  |   });
  76  | 
  77  |   test('Student Roadmap, Applications, and Profile update', async ({ page }) => {
  78  |     // 1. Roadmap
  79  |     await page.goto('/student/recommendations');
  80  |     await expect(page.locator('h1')).toContainText('Improvement Roadmap');
  81  |     await expect(page.getByText('Milestone Roadmap').first()).toBeVisible();
  82  | 
  83  |     // 2. Applications
  84  |     await page.goto('/student/applications');
  85  |     await expect(page.locator('h1')).toContainText('My Applications');
  86  |     await expect(page.getByText('ABC Technologies').first()).toBeVisible();
  87  | 
  88  |     // 3. Profile
  89  |     await page.goto('/student/profile');
  90  |     await expect(page.locator('h1')).toContainText('Profile & Resume Management');
  91  |     await expect(page.getByLabel('Full Name')).toHaveValue('Arjun Sharma');
  92  | 
  93  |     // Add a skill test
  94  |     const skillInput = page.getByPlaceholder(/Add skill/i);
  95  |     await skillInput.fill('Kubernetes');
> 96  |     await page.getByRole('button', { name: /\+ Add/i }).click();
      |                                                         ^ Error: locator.click: Test timeout of 45000ms exceeded.
  97  |     await expect(page.getByText('Kubernetes')).toBeVisible();
  98  | 
  99  |     // Save
  100 |     await page.getByRole('button', { name: /Save Changes/i }).click();
  101 |     await expect(page.getByText('Changes Saved ✓')).toBeVisible();
  102 |   });
  103 | });
  104 | 
```