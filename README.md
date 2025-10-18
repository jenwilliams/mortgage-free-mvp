# Mortgage‑Free Planner (MVP)

A tiny UK‑focused educational tool: estimate the monthly payment needed to clear a mortgage in a chosen timeframe and see potential interest saved.

## Quick start
```bash
# if you haven't created the project yet
npm create next@latest mortgage-free-mvp --ts --eslint=false --app --src-dir=false --import-alias "@/*"
cd mortgage-free-mvp
# replace generated files with the ones in this scaffold
npm install
npm run dev
```
Open http://localhost:3000

## Notes
- No server, no auth; state saved to localStorage.
- Fixed APR assumption; fees/ERCs not modelled.
- UK formatting via `Intl.NumberFormat('en-GB')`.

## Tests (optional)
- You can add Vitest tests for `monthlyPayment()` and the amortisation schedule using the acceptance numbers in the requirements doc.