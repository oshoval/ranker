# Usage Guide

## Getting Started

1. Set your GitHub token in `.env.local`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Loading PRs

Enter a repository in the input field using either format:
- `owner/repo` (e.g., `kubernetes/kubernetes`)
- Full URL (e.g., `https://github.com/kubernetes/kubernetes`)

Press **Enter** or click **Load PRs** to fetch open pull requests.

Your recent repositories are saved and shown as suggestions when you focus the input.

## Understanding Scores

Each PR gets a complexity score from **1** (trivial) to **10** (complex):

| Score | Color  | Meaning                       |
|-------|--------|-------------------------------|
| 1-3   | Green  | Quick review                  |
| 4-6   | Yellow | Moderate effort               |
| 7-10  | Red    | Needs deep review             |

Hover over a score badge to see the full breakdown across 7 dimensions.

## Using Filters

Toggle filters to hide specific PR types:
- **Hide Drafts** -- exclude draft PRs
- **Hide Approved** -- exclude already-approved PRs
- **Hide On Hold** -- exclude PRs with hold labels
- **Hide Conflicts** -- exclude PRs with merge conflicts
- **Hide Active Reviews** -- exclude PRs with pending review requests
- **Hide Skip-Review** -- exclude PRs with skip-review labels

### Custom Labels

You can customize which labels count as "hold" or "skip":
- Edit the comma-separated label list in the Filters panel
- Changes are saved in your browser
- Click **Reset labels to defaults** to restore defaults

## Refreshing

Click the refresh button (↻) to re-fetch PRs. A subtle "Updating..." indicator shows during background refreshes.

## Theme

Toggle between dark and light mode using the theme button in the sidebar footer.
