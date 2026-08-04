## [20:00 PL, 2026-08-04] CLOUD → Maciej — R-BUDOWA-ZROWNOWAZONE-TRYB (kod → FALA 222)
- Q1=A: zrównoważony = osobny tryb auto (nie 6. priorytet typów)
- Branch: `cursor/fix-budowa-zrownowazone-tryb-63a1`
CZEKAM-NA: deploy FALA 222

## [23:20 PL, 2026-08-04] CLOUD → Maciej — R-BUDYNKI-NIEAKTYWNE (kod, bez deploy)
- Wybudowane: czerwona nazwa + tooltip `Brak: Ceramika` / `Brak: Sól` (Spichlerz I/II + runtime gate)
- API: `resolveOwnedBuildingInactiveStatus` · UI `cityPanel.ts` · test 4/4
- Branch: `cursor/feat-budynki-nieaktywne-63a1`
CZEKAM-NA: Maciej deploy

## [21:20 PL, 2026-08-04] CLOUD → Maciej — R-BATTLE-TEMPO-UI (kod, bez deploy)
- Panel Tempo: Pauza · − · + · AUTO (ikona komputera); ± po SPEED_STEPS 1..512 (clamp, bez zawijania)
- Q1=A · Q2=B: brak etykiety ×N między −/+; prędkość tylko w tooltipach przycisków
- Branch: `cursor/feat-battle-tempo-ui-63a1` · `docs/decyzje/R-BATTLE-TEMPO-UI.md`
- Bramki: tsc 0
CZEKAM-NA: Maciej — **`deploy`** gdy OK


## [23:04 PL, 2026-08-04] CLOUD → Maciej / sesja lokalna — DEPLOY FALA 221 4d17d869
|- md5: 4d17d86943cbd010c6df3ed7d7517f81 · stempel: ROBOCZA · 2026-08-04 23:04
|- Batch: EOT defer · dyplo flex (one-way/qty/Przyjmij pakiet/Usuń) · dobra-kat akordeon · trzoda×1.5 · PW sum+Przyjmij handlowy+przecinek · Zwiedzaj highlight
|- Bramki: tsc 0 · trade-flex 8/8 · eot 5/5 · goods-kat 8/8 · stol-pw 22/22 · accept 225/225 · negot 54/54 · VERIFY OK
|- Wejście: gra-robocza/START.html
CZEKAM-NA: Maciej — **najpierw git pull**, potem Ctrl+F5 + Nowa gra · OK/BUG

## [21:55 PL, 2026-08-04] CLOUD → Maciej — R-SCOUT-ZWIEDZAJ-HIGHLIGHT (kod, bez deploy)
- Przyczyna: select kasował `autoExplore` → Zwiedzaj nigdy nie miało złotej ramki WŁ
- Fix: select NIE czyści; clear tylko przy marszu / ruchu ręcznym + toggle
- Branch: `cursor/fix-zwiedzaj-mode-highlight-63a1` · docs: `R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md`
- Test: scout-auto-explore-test 25/25
CZEKAM-NA: Maciej — **`deploy`** gdy OK (albo BUG)
## [22:05 PL, 2026-08-04] CLOUD → Maciej — R-DYPLO-DOBRA-KAT + R-TRZODA-SCALE-MAP (kod, bez deploy)
- Dobra handlowe: akordeon Surowce · Technologie · Inne (Q1–Q3=A), bez cap 7
- Pastwisko/trzoda: PASTWISKO_S ×1.5 (krowa, świnia, owca, lama — Q1=B)
- Bramki: tsc 0 · diplomacy-goods-kat-test PASS
- Branch: `cursor/feat-dobra-kat-trzoda-63a1` (commit po push)
CZEKAM-NA: Maciej deploy

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
