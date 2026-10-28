# Operator correction: stock affordability diagnostics

Date: 2026-10-28 UTC

Updated the two affordability assertion messages in `gra/tools/unit-stock-cost-test.cjs` to match the Bronze Konnica fixture and epoch-scaled costs: `brak 50 Koni (jest 49)` and `50 Koni + 50 Brązu`. No product files changed.

Current test source SHA-256: `883225bfbc861a945adbdb34f1d0ea0ad8f507b80d7b2c3d4bdb9d1e1838cf26`.

Check: `cd gra && node tools/unit-stock-cost-test.cjs` — 58 passed, 0 failed.
