# R-WEB-TEST-DEBT-CAMPAIGN-Q4 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wyłącznie testy, zero zmian w `gra/src/**`
TEMAT: R-WEB-TEST-DEBT-CAMPAIGN-Q4
GOAL: spłata długu testowego kampanii/wodza bez zmiany zachowania gry.

BAZA: origin/main = 45ea4b67a (worktree na tym SHA, detached).

ZMIANY-COMMIT: tylko `gra/tools/**` (7 plików) + `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-CAMPAIGN-Q4/**`. SHA commitu testów: 9a01fff4f7c550290f5e1d7cc9f7717dc8d40b8a ("test(gra): spłata długu testowego kampanii/wodza").

## Klasyfikacja czerwonych (PRZED = origin/main, 45ea4b67a)

| Test | PRZED | Przyczyna (plik:linia) | Klasa |
|---|---|---|---|
| army-leadership-test | EXIT=1 | asercja szukała nieistniejącej `initialBattleLineOrder` (tools/army-leadership-test.cjs:54) | A |
| army-panel-recruit-rally-general-test | EXIT=1 | regex wymagał gołego `planSpawnedUnitFollowGeneral`; main.ts:13728 ma bramkę `followGeneral === true` (tools :46) | A |
| general-capital-recruitment-order-test | EXIT=1 | purchase wola `isCityUnderSiege` (main.ts:4269), harness go nie podawał; plus `/usr/bin/chromium` | A + C |
| generals-purchase-runtime-test | EXIT=1 | harness rekruta bez `followGeneral` (domyślnie true przy narodzinach, main.ts:4204); po naprawie — test-rekrut z marszem psuł scenariusz batch (timeout 180 s) | A |
| general-quick-follow-action-test | EXIT=1 | `/usr/bin/chromium` ignorował override; substring `issueGeneralQuickFollow(u, units, leaderTitle` nieaktualny (main.ts:23977) | C + A |
| ai-general-war-campaign-live-test | EXIT=1 | kotwica probe `planWarAllInCapital(...)` (ai.ts) usunięta refaktorem ARMY-CONSOLIDATION | A |

Klasa B (prawdziwa usterka gry): NIE ZNALEZIONO w tym zakresie. Nie zmieniano `gra/src`.
Klasa C (środowisko): ścieżka `/usr/bin/chromium` (nieistniejąca) — obejście `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`; ai-war-defend-home-test w parze równoległej ma asercję czasowej (PO 432 ms vs PRZED 247 ms) — solo przechodzi 30/30.

## Zmiany (klasa A, bez osłabiania)

- army-leadership: asercje na `commander: bu.isArmyCommander` + `initialBattleFormation(units, initialBattleRoleOf)` + mapowanie roli 'commander' w formationRules.ts.
- army-panel: regex z bramką `followGeneral === true`.
- general-capital: prawdziwy `isCityUnderSiege`/`CITY_SIEGE_RECRUIT_BLOCK_PL` ładowany z city-siege-state.ts; NOWA asercja: oblężona stolica odrzuca zakup bez zmian zasobów.
- generals-purchase: harness ustawia `followGeneral: true` (jak narodziny gracza) + `dropRecruitThroughRuntime` sprząta testowego rekruta.
- general-quick-follow: honoruje `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; substring zaktualizowany do `commander ? [u, commander] : units`.
- ai-general-war-campaign-live: kotwica probe przeniesiona na `  let plans = planWith(nav);`.

## TESTY — PO (po zmianach) i mutacje

PO, EXIT: ai-general-war-campaign-test 0 (51 PASS); ai-general-war-campaign-live-test 0 (68 PASS); army-leadership 0 (1); army-panel 0 (4); army-to-nearest-leader 0 (43); general-capital 0 (21); general-eligible-unit-roster 0 (138); general-quick-follow 0 (20); generals-purchase-runtime 0 (13); war-allin-general-path-barb-defense 0 (24); war-allin-capital 0 (98); army-concentration 0 (56); ai-war-defend-home 0 (30, solo); tsc --noEmit 0.

Mutacje (każda → FAIL, src przywrócony `git checkout`, `git status gra/src` czysty):
- M1 army-leadership: `commander: bu.isArmyCommander` → `false` (battleScene:1450) → FAIL.
- M2 army-panel: bramka followGeneral usunięta (main.ts:13728) → FAIL.
- M3 general-capital: `if (isCityUnderSiege…)` → `if (false)` (main.ts:4269) → FAIL (nowa asercja).
- M4 generals-purchase: `autoMarchingToGeneral = false &&` (main.ts:13700) → FAIL.
- M5 general-quick-follow: `issueGeneralQuickFollow(u, units…)` → FAIL.
- M6 grupa kampanii (node): filtr `reachable !== false` → `=== true` (ai-general-war-campaign.ts:66) → 6 FAIL.
- Grupa live (chromium 263 s) NIE_ZMIERZONO jako mutacja; zmieniona tylko kotwica probe.

PRZED vs PO (gate-przed-*/gate-po-*.txt): zmieniony tylko zakres testów; kod gry identyczny.

NIE_ZMIERZONO: liczba „~26 czerwonych” z dispatchu — w tym stanie zmierzono 6 czerwonych plików (1 asercja/1 błąd na plik); pozostałe grupy (`*wodz*`, `*kampania*`, `*leader*` w nazwach) nie mają plików poza wymienionymi.

## BLOKADY
Brak blokad procesu. Uwaga: wszystkie czerwone były w klasie A/C; klasa B = 0.

## RUNDY
1/5. Ostatni werdykt: — (pierwsza runda).

## NASTĘPNY KROK
Evaluator (Sonnet 5.5): weryfikacja asercji A i mutacji M1–M6 oraz `git diff` (7 plików tools).

DEPLOY/PUSH: NIE WYKONANO
