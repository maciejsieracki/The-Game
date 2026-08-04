## [22:05 PL, 2026-08-04] CLOUD → Maciej — R-EOT-EVENT-DEFER + R-DYPLO-WYMIANA-FLEX (kod, bez deploy)
- Branch: `cursor/feat-eot-dyplo-flex-63a1` — **nie** w gra-robocza (czeka deploy Macieja)
- Dyplo flex: one-way trade · steppery qty w koszyku · Edytuj/Usuń na kartach · jeden Przyjmij/Odrzuć pakietu
- EOT defer: toasty + logi wydarzeń z fazy końca tury → panel na starcie następnej tury gracza
- Bramki: tsc 0 · negotiation-table 55/55 · acceptance-points 218/218 · trade-flex 8/8 · eot-defer 5/5
CZEKAM-NA: Maciej deploy

## [20:35 PL, 2026-08-04] CLOUD → Maciej — R-DYPLO-PRZYJMIJ-TRADE (kod, bez deploy)
- Fix: evaluateProposal obsługuje `umowa_handlowa` (= `umowa_szlakow`); UI `'5'` → `umowa_szlakow`
- Branch: `cursor/fix-dyplo-przyjmij-traktat-63a1` · docs: `docs/decyzje/R-DYPLO-PRZYJMIJ-TRADE.md`
- Bramki: tsc 0 · diplomacy-proposal · negotiation-table · acceptance-points
CZEKAM-NA: merge + **deploy** na hasło Macieja

## [22:10 PL, 2026-08-04] CLOUD → Maciej — R-DYPLO-PW-PRZECINEK (kod, bez deploy)
- Bug: panel PW pokazywał −10.400000000000006% (IEEE)
- Fix: `relationPnModPct` toFixed(1) + `formatLiczbaPl` w UI → −10,4%
- Branch: `cursor/fix-dyplo-pw-przecinek-63a1` · acceptance-points 225/225
CZEKAM-NA: Maciej — **`deploy`** gdy OK

## [21:45 PL, 2026-08-04] CLOUD → Maciej / sesja lokalna — R-DYPLO-STOL-PW-SUM (kod, bez deploy)
- Fix: panel PW stołu sumuje wszystkie pending umowy (nie tylko primary + badge)
- Pliki: `diplomacyAcceptanceBalance.ts` (`balancePanelDataFromRows`), `diplomacyAudience.ts`
- Test: `node tools/diplomacy-stol-pw-sum-test.cjs`
- Branch: `cursor/fix-dyplo-stol-pw-sum-63a1` · bez deploy — czeka merge + `deploy`
CZEKAM-NA: merge PR · Maciej: `deploy` gdy wgrać


