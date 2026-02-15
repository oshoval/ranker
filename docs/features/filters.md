# PR Filters

PRanker filters pull requests before scoring to help you focus on PRs that need your attention. You can exclude PRs based on status, labels, and review state.

## Filter Options

| Filter | Description |
|--------|-------------|
| **excludeDrafts** | Hide draft PRs (work in progress) |
| **excludeApproved** | Hide PRs that already have an approved review |
| **excludeHold** | Hide PRs with a "hold" label (see below) |
| **excludeConflicts** | Hide PRs with merge conflicts |
| **excludeActiveReviews** | Hide PRs that have pending review requests |
| **excludeSkipReview** | Hide PRs with a "skip-review" label (see below) |

## Hold Labels

When **excludeHold** is enabled, PRs with any of these labels are filtered out (case-insensitive):

- `hold`
- `on-hold`
- `do-not-merge`
- `wip`
- `blocked`

You can customize the hold label list via the `holdLabels` query parameter (comma-separated). Labels are matched case-insensitively.

## Skip-Review Labels

When **excludeSkipReview** is enabled, PRs with any of these labels are filtered out (case-insensitive):

- `skip-review`
- `no-review`
- `auto-merge`

You can customize the skip-review label list via the `skipLabels` query parameter (comma-separated). Labels are matched case-insensitively.

## Default Behavior

By default, **all filters are enabled**. This gives you a lean list of PRs that:

- Are not drafts
- Have not yet been approved
- Do not have hold labels
- Do not have merge conflicts
- Do not have pending review requests
- Do not have skip-review labels

## Customization

You can override any filter via the API. For example:

- `excludeDrafts=false` — include draft PRs
- `holdLabels=custom-hold,needs-work` — use custom hold labels
- `skipLabels=no-review-needed` — use custom skip-review labels

All label matching is **case-insensitive**, so `HOLD` and `hold` match the same label.
