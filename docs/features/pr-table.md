# PR Table

The PR table displays scored pull requests in a sortable, interactive format.

## Sorting

Click any column header to sort:
- **Score** -- complexity score (default: highest first)
- **PR#** -- pull request number
- **Lines** -- total lines changed
- **Files** -- number of files changed
- **Created** -- creation date
- **Updated** -- last update date

Click the same header again to reverse direction. Keyboard: focus the header and press Enter or Space.

## Expandable Rows

Click any row to expand it and see:
- Branch name (head → base)
- Labels with color badges
- PR description (truncated)
- Changed files list

Keyboard: focus a row and press Enter or Space to toggle.

## Score Badge

Each row shows a color-coded score badge:
- **Green** (1-3): Easy to review
- **Yellow** (4-6): Medium complexity
- **Red** (7-10): Hard, needs deep review

Hover the badge to see the 7-dimension breakdown in a tooltip.

## Accessibility

- All sortable headers have `aria-sort` attributes
- Expandable rows use `aria-expanded`
- All interactive elements are keyboard accessible
- Focus rings are visible on all controls
- Touch targets are minimum 44x44px
