# Recovery Funnel – Pending Enhancements

## What we found (backend)
- `/api/recovery-funnel` currently returns: `total=500, contacted=2, responded=0, promiseToPay=7, recovered=0, escalated=5`.
- Dataset inconsistency: `promiseToPay` is derived from `Last Commitment Date`, but **5 of 7** promise-to-pay customers have `No Response Count <= 0` (not counted as “contacted”).

## UI improvements (no backend changes)
- Replace stacked KPI cards with a true funnel visualization:
  - decreasing-width blocks
  - connecting arrows
  - stage percentages
  - show counts and “% of previous stage / % of total”
- Handle 0-count stages gracefully (“No recoveries yet”, “No responses yet”).

## Logic integrity checks (optional backend improvements)
- Decide whether to redefine `contacted` and `promiseToPay` based on actual call/response fields.
- If backend fields are correct but sparse, keep UI improvements only.

