# Operator report: Mint and Market economy audit

The current runtime matches the approved economy contract. Difficulty parameters already specify Targowisko route bonuses of +62% / +50% / +38%, and Mint local-tax multipliers of ×1.62 / ×1.50 / ×1.38. Targowisko affects route receipts and route slots; Mint is activated empire-wide by the capital and modifies local tax money before the tax-slider split. Route cash is settled separately and bypasses tax, Mint, and Wealth. No product calculation change was needed.

Updated stale assertions in `waluta-mennica-test.cjs` to match the approved values and tax-stage semantics, while retaining civic base multipliers from the authoritative civ matrix. Updated stale city-panel economy descriptions and legacy parameter descriptions. Fixed the HUD test extractor by including the real `targowiskoTradeRouteBonusForCity` helper and its parameter context, then updated its independent route-income reference calculations. The HUD failure was a test fixture scope issue; the helper is in scope in the actual `main.ts` runtime.

Validation in `gra/`:

- `node tools/waluta-mennica-test.cjs`: 61 passed, 0 failed.
- `node tools/trade-routes-hud-filter-test.cjs`: 59 passed, 0 failed.
- `node tools/trade-routes-test.cjs`: 103 passed, 0 failed.
- `node tools/trade-routes-limit-test.cjs`: 76 passed, 0 failed.
- `node tools/trade-routes-income-test.cjs`: 131 passed, 0 failed.
- `node tools/currency-test.cjs`: 37 passed, 0 failed.
- `node tools/work-tax-conversion-test.cjs`: 10 assertions passed.
- `npm run typecheck`: passed.

Hashes at report time:

```
src/main.ts                              7be9ab7860ff929623ef6ed3f823d323b96a265bbe99d5c809cf70e69eee25fc
src/game/economy.ts                      5a101f016d57604376c943910c5c3983944b48acfa7a9a60feb0780753f57a80
src/game/turn-economy.ts                 686fdce72b69078d230bef21dd3b66e2cf86c3ce18b422191262ec79ff2aca35
src/game/trade-routes.ts                 dab9c8f32530e05bce25a03a11d1dd8b2714aa09706741b13b4adb173896a2e3
src/ui/cityPanel.ts                      f4a74708c3ee7bf1880140297cee8caff2fb5a204a7ec45853e091f9fc464f0d
data/econ-params.json                    7806a53b191dc5844c9b2fb31e71445737958562aa5ca695c903731c67e489e3
tools/waluta-mennica-test.cjs            86743b878349f17d5e56320d72248073707f4916d19fc61493dc4349255bcfc9
tools/trade-routes-hud-filter-test.cjs   60acb2bc9161e365ab634c55cddf7fea6de7d2793a3f2a011215809faf647041
```

Limits: the shared `main.ts` hash includes concurrent work by other operators. No commit, merge, push, or deploy was performed.
