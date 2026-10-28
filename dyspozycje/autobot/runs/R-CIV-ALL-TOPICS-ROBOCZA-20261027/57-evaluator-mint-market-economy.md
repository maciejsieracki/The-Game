# AutoBot Evaluator — Mennica, Targowisko i dochód tras

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna ocena raportu 55 oraz jego follow-upu 56 względem kontraktu właściciela. Inspekcja formuł, parametrów, opisów i testów; bez zmian produktu.

## Tożsamość źródeł

| Plik | SHA-256 |
|---|---|
| `gra/src/main.ts` | `9aef37f69d40624009ae4c5244ed44a61786a3049fdc9f620a8887a6cfbd1cdb` |
| `gra/src/game/economy.ts` | `5a101f016d57604376c943910c5c3983944b48acfa7a9a60feb0780753f57a80` |
| `gra/src/game/turn-economy.ts` | `686fdce72b69078d230bef21dd3b66e2cf86c3ce18b422191262ec79ff2aca35` |
| `gra/src/game/trade-routes.ts` | `dab9c8f32530e05bce25a03a11d1dd8b2714aa09706741b13b4adb173896a2e3` |
| `gra/src/ui/cityPanel.ts` | `f4a74708c3ee7bf1880140297cee8caff2fb5a204a7ec45853e091f9fc464f0d` |
| `gra/data/econ-params.json` | `7806a53b191dc5844c9b2fb31e71445737958562aa5ca695c903731c67e489e3` |
| `gra/tools/waluta-mennica-test.cjs` | `86743b878349f17d5e56320d72248073707f4916d19fc61493dc4349255bcfc9` |
| `gra/tools/trade-routes-hud-filter-test.cjs` | `2572bcd85c1cf3386ea2d35dc22b2fdb582d04936376073b1f3552249d445be0` |
| `gra/tools/trade-routes-test.cjs` | `e3641ee15ff71ab5bc991e9f3ea0df22a3202accc100ac690ef2ed184b11ece7` |
| `gra/tools/trade-routes-limit-test.cjs` | `3130e9ee51d344ec001e0e3f1a1e68fb3bceacd46905a30048beae49657544db` |
| `gra/tools/trade-routes-income-test.cjs` | `8ed880a3be049eaeaa8d12319632e3d0293debb778873960e8081273a678ede9` |
| `gra/tools/currency-test.cjs` | `db0656680770e84c818607a3a0348de2a4c635afd7453c49ade5cfa0788df209` |
| `gra/tools/work-tax-conversion-test.cjs` | `b4b9b0ed5bb2baddc871fcf5c3f2fbab426883a08cfb146de49bc4d83fecd520` |

These identities match report 55 for its files except `main.ts` and the route HUD test, which were updated by follow-up 56. Their hashes now match that report. The core economy, turn-economy, and route-calculation files are unchanged from report 55.

## Contract verification

- **Targowisko:** difficulty values are +62% / +50% / +38% (`easy/normal/hard`). `computeTradeRouteIncomeByCityBreakdown()` applies the endpoint's Wonder bonus and then its local difficulty-scaled Targowisko bonus to that endpoint's direct route receipt. Route-slot limits remain a separate building-slot calculation. The local city tax formula does not multiply its gross local tax by the Targowisko percentage.
- **Mennica:** difficulty multipliers are ×1.62 / ×1.50 / ×1.38. In `economy.ts`, it multiplies the post-corruption local tax pool before the tax sliders allocate Treasury/Science/Luxury. The turn layer activates it empire-wide for the owner when a Mint is present and the owner has Currency and gold access. Normal building availability gates the Mint to the capital; the multiplier then reaches every city owner's local tax.
- **Route settlement:** direct trade-route proceeds are computed in `main.ts` and credited separately as `pieniadzZTras`, outside local tax, Mint, sliders, and Wealth. Manual Work tax enters the local-tax pipeline explicitly; automatic Work conversion is retired (`pieniadzZPracy = 0`). The separate existing T4 `premiaHandluTrasHandlowych` remains an established route-building bonus added to local gross trade; it is distinct from direct route cash and was not changed by this task.
- **Calculation scope:** `git diff` shows no changes to `economy.ts`, `turn-economy.ts`, or `trade-routes.ts`. `econ-params.json` changes in this scope update descriptions, not numeric values. The `main.ts` product change from follow-up 56 changes the new-route toast/event amount to use the existing settlement breakdown; it does not alter credited economy. Other shared `main.ts` work is outside this economy review.
- **Toast amount:** follow-up 56 now reports the player's own endpoint amount, including Wonder and endpoint Market bonuses, and chooses the right city for external, internal, and reversed-direction routes. The current fixture confirms displayed values of +12, +7, and +4, and the amended test checks market/no-market and player endpoint handling. One residual limit: the toast calculates the breakdown for `[route]`, so it omits `computeSeaTradeBonusIncomeByCity()`'s extra +1 per active sea route beyond the first. When the new route is maritime and gives an endpoint an additional sea-route bonus, the displayed `+N/turę` is the route's direct amount but not the full marginal total credited to that city. The label is acceptable if defined as direct route proceeds; it is incomplete if promised as total incremental city income.
- **Capital legacy edge:** legal current building flow restricts Mint to capital and its normal effect is empire-wide. For backward compatibility, `ownersWithMennica()` considers a legacy saved Mint id in any city; the focused test explicitly asserts that a regional Mint in an old save still activates the empire-wide multiplier. This only diverges from a strict “capital only even for malformed/legacy saves” interpretation.

## Checks

The requested suite passed: `waluta-mennica-test` 61/61, `trade-routes-hud-filter-test` initially 59/59 on report-55 state and then **62/62** on report-56 state, `trade-routes-test` 103/103, `trade-routes-limit-test` 76/76, `trade-routes-income-test` 131/131, `currency-test` 37/37, `work-tax-conversion-test` 10 assertions, and `npm run typecheck` PASS. After route-toast follow-up 56, I reran its relevant checks against the matching hashes: HUD test 62/62, typecheck exit 0, and scoped `git diff --check` clean. The six economy-focused tests ran before that toast-only update; their source calculation files are unchanged at the hashes above.

**PASS-WITH-NOTES:** the tested economy values, activation gates for normal gameplay, tax-stage ordering, direct route settlement, route slots, and manual-only Work conversion match the contract. The note is the sea-route extra bonus not included in the per-route toast amount (plus compatibility for legacy regional Mint records as described above).
