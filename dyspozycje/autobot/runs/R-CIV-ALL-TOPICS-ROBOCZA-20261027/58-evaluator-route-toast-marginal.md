# AutoBot Evaluator — final route-toast marginal income follow-up

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna weryfikacja poprawki morskiej z raportu 56 oraz ponowna ocena kontraktu Mennica/Targowisko z raportu 57. Read-only; bez zmian produktu.

## Tożsamość bieżących plików

| Plik | SHA-256 |
|---|---|
| `gra/src/main.ts` | `77dac8a0ec23518888d64e239897545781ea6b0cf37c7c005fd3c79f944548ba` |
| `gra/src/game/economy.ts` | `5a101f016d57604376c943910c5c3983944b48acfa7a9a60feb0780753f57a80` |
| `gra/src/game/turn-economy.ts` | `686fdce72b69078d230bef21dd3b66e2cf86c3ce18b422191262ec79ff2aca35` |
| `gra/src/game/trade-routes.ts` | `dab9c8f32530e05bce25a03a11d1dd8b2714aa09706741b13b4adb173896a2e3` |
| `gra/src/ui/cityPanel.ts` | `f4a74708c3ee7bf1880140297cee8caff2fb5a204a7ec45853e091f9fc464f0d` |
| `gra/data/econ-params.json` | `7806a53b191dc5844c9b2fb31e71445737958562aa5ca695c903731c67e489e3` |
| `gra/tools/trade-routes-hud-filter-test.cjs` | `a9213f3d3662ea5518e20c0e70bdb168610c28a2c6b34274d940658dcebee9f4` |
| `gra/tools/trade-routes-income-test.cjs` | `8ed880a3be049eaeaa8d12319632e3d0293debb778873960e8081273a678ede9` |
| `gra/tools/waluta-mennica-test.cjs` | `86743b878349f17d5e56320d72248073707f4916d19fc61493dc4349255bcfc9` |
| `gra/tools/trade-routes-limit-test.cjs` | `3130e9ee51d344ec001e0e3f1a1e68fb3bceacd46905a30048beae49657544db` |

The `main.ts` and HUD harness hashes match operator report 56.

## Independent check of marginal amount

`reportTradeRouteEvents()` now calculates a new route's player-side marginal receipt as full settlement after that route minus full settlement before it. Both sides use `computeTradeRouteIncomeByCityBreakdown()` with the same Wonder and per-city Targowisko callbacks as normal settlement. That helper applies owner-specific Wonder rounding first, then endpoint-specific Market rounding, matching the credited route calculation. It then adds `computeSeaTradeBonusIncomeByCity(computeSeaTradeRouteCountByCity(...))` on both sides, so a second maritime route includes the city’s +1/tick extra-route increment. `routesBeforeAdded` starts with prior routes and appends each new route in order, so multiple new routes in one recompute receive sequential marginal values; their combined toast amount telescopes to the overall settlement difference.

The player city is selected symmetrically (`fromCityId` when the player owns `route.ownerId`, otherwise `toCityId`), including internal player routes. The focused HUD test exercises endpoint Market/no-Market amounts, internal/reversed endpoint cases, and compares a second sea route toast with the before/after settlement total including the maritime bonus. This resolves the sea-bonus gap recorded in report 57.

The displayed amount is the marginal **direct route receipt** for the player's endpoint, including Wonder, Market and extra-sea-route settlement. Existing separate `premiaHandluTrasHandlowych` route-building yield still enters local gross tax; it is not direct route cash and was not modified here.

## Economy contract and unchanged math

Targowisko route bonuses remain +62% / +50% / +38% for easy/normal/hard, and route slots remain a separate limit. Mennica remains ×1.62 / ×1.50 / ×1.38 on local tax after corruption and before slider allocation, activated empire-wide by the owner's capital Mint, Currency and gold access in normal valid game state. Direct route receipts remain separately settled outside local tax, Mint, sliders and Wealth. Work is not automatically converted; manual Work-to-tax remains the only conversion path.

The product change in this follow-up is toast/event display calculation only. `economy.ts`, `turn-economy.ts` and `trade-routes.ts` are byte-identical to report 55/57 state. `econ-params.json` changes are descriptions only. The earlier note remains: compatibility logic accepts a legacy saved Mint id in any city and activates the owner's empire-wide effect; normal construction blocks regional Mint placement.

## Verification

- `node tools/trade-routes-hud-filter-test.cjs`: **63 passed, 0 failed**.
- `node tools/trade-routes-income-test.cjs`: **131 passed, 0 failed**.
- `node tools/waluta-mennica-test.cjs`: **61 passed, 0 failed**.
- `node tools/trade-routes-limit-test.cjs`: **76 passed, 0 failed**.
- `npm run typecheck`: **PASS**, exit 0.
- `git diff --check -- src/main.ts tools/trade-routes-hud-filter-test.cjs`: **PASS**.

**PASS-WITH-NOTES:** the revised toast now matches the player's marginal direct route settlement, including proper sequential extra-sea-route bonus and endpoint-specific Wonder/Market rounding. The only remaining scope note is the legacy regional-Mint save compatibility behavior; regular city-building rules enforce the capital requirement.
