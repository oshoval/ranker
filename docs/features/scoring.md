# PR Complexity Scoring

PRanker scores each pull request on a **1-10 complexity scale** to help you triage your review queue. Higher scores mean more effort to review.

## Score Ranges

| Score | Label  | Color  | Meaning                              |
|-------|--------|--------|--------------------------------------|
| 1-3   | Easy   | Green  | Quick review -- small, focused       |
| 4-6   | Medium | Yellow | Moderate effort -- multiple concerns |
| 7-10  | Hard   | Red    | Deep review -- large or cross-cutting|

## The 7 Dimensions

Each PR is evaluated across seven dimensions, each scored 1-10:

1. **Lines Changed** -- total additions + deletions
2. **Files Changed** -- number of files touched
3. **File Types** -- diversity and complexity of file categories (source vs config vs docs)
4. **Dependencies** -- changes to dependency manifests (package.json, go.mod, etc.)
5. **Test Coverage** -- whether the PR includes tests alongside code changes
6. **Documentation** -- proportion of documentation files
7. **Cross-Cutting** -- how many different system areas are affected

The final score is a weighted combination of all seven dimensions.

## Special Cases

- **Documentation-only PRs** always score **1** (trivial to review)
- **Mechanical changes** (bulk renames, auto-generated) receive a lower score
- **Refactoring PRs** (balanced additions/deletions across many files) receive a slightly higher score

## How to Use Scores

- Start your review queue from the **highest score** (hardest) when you have focus time
- Save **low scores** for quick passes between meetings
- Use the score breakdown tooltip to understand *why* a PR scored the way it did
