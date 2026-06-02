# TODO

## Step-by-step
1. Inspect and understand existing analytics page/chart code.
2. Add **Recovery Trends** card + `canvas#recoveryTrendChart` to `frontend/analytics.html`.
3. Add `buildRecoveryTrendChart(customers)` to `frontend/analytics.js` and call it from `loadAnalytics()`.
4. Implement “B: another dimension” trend across escalation/attempt stage using available fields:
   - `Escalation Status` / `Payment Status` / `No Response Count`.
5. Smoke-test by running the server and loading `analytics.html`.
6. Fix any rendering/JS errors if found.

