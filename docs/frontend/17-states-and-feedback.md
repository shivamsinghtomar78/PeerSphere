# 17 — States and Feedback

Every asynchronous region has a scoped loading skeleton, meaningful empty state, recoverable error state, and success confirmation. Preserve input on failures where safe. Use inline validation before submit and an error summary for multi-field forms.

Use clear placement language: “Analysis is processing,” “This result needs manual review,” and “No evidence was found in this resume” are preferred over opaque AI language. Toasts are supplemental; important changes remain visible in page content. Success messages never imply candidate selection.

## Acceptance Criteria

- [ ] Each destructive or consequential action has confirmation and result feedback.
- [ ] Failures offer Retry, Edit, or support/review action where appropriate.
