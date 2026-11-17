STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko gra/tools/*test*.cjs; gra/src, gra/data, WERSJE.md, manifest nietkniete)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: triage czerwonych testow bazowych, runda 4/5 (Operator SONNET po dwoch merytorycznych rundach Haiku FAIL r1 i r3, zgodnie z DODATKIEM 3). Kompletna tabela 17+ pr141 + defense-breakdown + war-epoch, klasy A/B/C z dowodem, mutacje, B-1.
BAZA: 51a3f6b94445fa6d39101da9d056b090df70e39a (checkout --detach). Ancestry: `git merge-base HEAD origin/main` = 459354a12 (51a3f6b94 NIE jest potomkiem origin/main ef6e8ea1e). `git merge-tree --write-tree HEAD origin/main` = czyste, tree 66b736df56be8f09a96692afee40c15588e93a21 (zero konfliktow; moje zmiany to wylacznie 14 plikow gra/tools).
ZMIANY-COMMIT: 14 plikow testowych (git diff --stat 51a3f6b94..HEAD: +104/-28), kolejne commity na czubku; SHA czubka w polu sha odpowiedzi.

## 1. Tabela pr141-* (33 pliki; pomiar `node` w petli, exit code; ZMIERZONO)
Przed (51a3f6b94, npm ci): 15 czerwonych / 18 zielonych. Po: 5 czerwonych / 28 zielonych.

| test | przed | po | klasa i przyczyna (dowod) |
|---|---|---|---|
| hotseat-diplomacy-owner | exit1, 5/10 | 10/10 | A: harness vm bez zagniezdzonych funkcji main.ts (diploBrakeBonusFlags, isDiploTickWarBrakeEnabled, isPeaceLockedBetween, isTruceActive, getDiploPairMeta, sharedBorderPenaltyForEpochs, empireEpochForOwner) -> stuby; + asercje `wspolnaReligia===true` nieaktualne po decyzji #342 (usuniecie wplywu religii na zaufanie; TickCtx/breakdown nie niosa flagi) -> `undefined` |
| hotseat-production-owner-routing | exit1 (ReferenceError units) | PASS | A: harness bez nowych zaleznosci purchaseRecruitmentUnit/cancelRecruitmentPurchase (units, armyStackLimit, ownUnitCountAt wyciagniete z army-stack-limit.ts, isMe, effectiveGameDifficultyForOwner, superUnitLimitViolation, pendingLedgerSink, recruit*, snapshotOwnersStock...) -> stuby |
| f04-building-speed-activation | exit1 (prod is not defined) | PASS | A: findCall lapal pierwsze `advanceProduction(...3 arg)` = nowa prognoza HUD main.ts:23402 zamiast petli tury (:42512); zawezono do arg0==='prod0' i `pracaImperialPoolGain` do arg1==='queueEmpty' |
| f04-unit-speed-activation | exit1 (recStackFree) | PASS | A: initializer recMaxPerTurn zalezy teraz od recStackFree (R-WEB-ARMY-STACK-LIMIT-Q1) -> w wrapperze `recStackFree=1e9` |
| saveload-mp-f05-g11-behavior | exit1 (showHintMessage) | PASS | A: snippet restoreGameFromSave dotyka recruitGeneralId + jednorazowego hintu -> lokalne stuby |
| semantic-consumer-consistency | exit1 (battleUnitCivBonusy) | 52/0 | A: wyciagnieta metoda BattleScene._movementPointsFor uzywa battleUnitCivBonusy (`unit.civBonusy ?? sideFallback`) -> param |
| ai-strategy-behavior | exit1, 17/2 | 19/0 | A: wypowiedzenie wojny decyduje juz SILA MILITARNA (krok 3 DIPLO-WAR-DECLARE-ZERO-TRUST + CHARACTER-THRESHOLD: prog 20% + 100*warSilaBonus, clamp [10,35]), nie respektWzgledny; fixture dostal silaMilitarnaAI/Partner (116 vs 100; 112 vs 100), perturbacja macierzy nadal rozroznia low/high |
| combat-defense-owner-route | exit1 | PASS (45) | A x3: (a) civKeyForOwnerId wymaga realnego civs.json + wiersza macierzy (test dawal pusta liste civs -> [] dla KAZDEGO ownera); (b) Grecy maja teraz ogolny bonus obrony piechoty +20% wiec nie sa neutralnym ownerem dla las/terytorium/mur -> neutralny = rzymianie (zero we wszystkich walka_obrona_*); (c) staly rzut 0,497 dostrojony do dawnej szansy trafienia, baza 54,5% -> asercja na szanse trafienia atakujacego parsowana z logu (active < foreign) + HP >= |
| dip-activation | exit1 (0.5 vs 0.42) | PASS | A: resolveArchetypeAggression ignoruje `_fallback`; brak wiersza macierzy = neutralne 0,5 (matrix-only) |
| matrix-only-ai | exit1, 38/2 | 40/0 | A: ten sam mechanizm co ai-strategy (fixture bez silaMilitarna) -> przewaga 200 vs 100 w fixture; to czy AI skorzysta nadal decyduje macierz |
| matrix-only-economy | exit1 (0 vs 114) | 92/0 | A: dochodTrasHandlowych nie wchodzi do handelBrutto miasta (decyzja 2026-11-14 szlak = tylko premia, economy.ts:955); baza addytywna w tescie = premiaHandluTrasHandlowych |
| matrix-only-owner-ui | exit1 (found 4) | PASS | A: konsolidacja ctx Zastap (unit-replace-context.ts) zmniejszyla literalne `civKey: civKeyForOwnerId(` z 5 do 4; prog 4 + jawne asercje obu ctx (replaceAvailabilityCtxEmpireWide, productionAvailabilityCtxForCity) |
| current-evidence-ledger (v1/v2 json) | exit1 (raw value differs asyria meta_mnoznik_waluta) | exit1 bez zmian | A (stary snapshot) — NIE ROZSTRZYGNIETE NAPRAWA: ZMIERZONO 1 roznica raw (asyria 1,7 -> 2,2 po R-WEB-CURRENCY-MULT-PER-CIV-Q1, commit 6e7ecbd72). Brakujacy krok: regeneracja ledgera (generate.cjs) + manifestu zrodel w dyspozycje/autobot/runs/R-PR141-CODEX-CURRENT-EVIDENCE-LEDGER-20261018/evidence — POZA allowlista, wymaga decyzji, czy zamrozone dowody maja byc odswiezane |
| current-evidence-ledger-v3 | exit1 | exit1 bez zmian | A (stary snapshot), ZMIERZONO na kopii z licznikiem: 68 niezgodnosci = 30 `consumer status` + 30 `statusReasonPl` + 3 `label` (semantic API zmienione po 2026-10-18) + 1 raw (asyria) + 4 `missing accepted evidence path` (walka_ruch_*, walka_koszt_rekrutacji_proc) + `manifest source hash mismatch gra/data/civ-matrix.json`. Ten sam brakujacy krok co wyzej |
| current-evidence-ledger-v4 | exit1 ENOENT | bez zmian | C: sciezka dyspozycje/.../R-PR141-CODEX-F04-PRODUCTION-DECISION-CLOSEOUT-20261018/evidence/matrix-93x15-current-evidence-ledger-v4.json nie istnieje w zadnym commicie/refie (git log --all puste) |
| evidence-ledger-behavior | exit1 ENOENT /workspace/pr141-review/current-consumers.json | bez zmian | C: sciezka zewnetrzna spoza repo, artefakt nigdy nie byl w repo |
| runtime-ordinary-scope | exit1, 8/19 | bez zmian | C: ENOENT lstat dyspozycje/.../R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019 — katalog runu nigdy nie byl w historii git |
| zielone na starcie (18): ai-production-behavior, combat-defense-behavior, combat-offense-behavior, f04-cost-activation(-defense), f04-rush, f04-society(-remaining), f04-work, f04-yields, g1-combat-activation, matrix-only-combat, matrix-only-data-wiki, matrix-only-production, population-behavior, population-main-happiness-hookup | exit0 | exit0 | — |

## 2. Pozostale pozycje
| test | baza 459354a12 (ZMIERZONO, kopia git archive + node_modules) | 51a3f6b94 | po (HEAD) | klasa |
|---|---|---|---|---|
| budynek-civ-bonus-u17 | 3 pass / 3 FAIL | 6/0 | 6/0 | A (r1; mutacje nizej) |
| okolica-load-reconcile | 21/23 | 23/23 | 23/23 | A (r3) |
| war-epoch-player-first-main-guard | 33/2 | 33/2 | 35/0 | A: regexy-guardy nieaktualne po R-WEB-ERA-WAR-COUNTER/-PLAYER-POOL: przed evaluateInterCivWarGate doszedl `!isOwnerInActiveEraWar`, a `targetEpoch: empireEpochForOwner(targetId)` -> `eraWarCounterEpochOf(targetId, gateForcedTagAny)` (+ attackerEpoch) |
| defense-breakdown | TypeError grecy.bonusy | 23 pass / 10 FAIL (r3: 7) | 32 pass / 6 FAIL | A: chipy (Grecy maja 6 niezerowych bonusow walki, nie 1) i tekst Falangi (civBonusOpisPl, nie surowe `Matrix:...`) — poprawione; 6 FAIL = B-2 nizej |
| diplo-peace-weaker-seeks-city-only (h2/h4/h5) | 35/0 zielony | 35/0 | 35/0 | NIE byly czerwone na 459354a12 (naprawione wczesniej, FALA 696+) |
| diplo-war-peace-main-guard (R6/ZT) | 35/0 | 35/0 | 35/0 | j.w. |
| diplo-war-peace-gate (gate G) | 24/0 | 24/0 | 24/0 | j.w.; pozycja „gate G” — przyjeto ten plik (zalozenie) |
| diplo-truce-r1 / diplo-truce-r4-ai | 31/0, 24/0 | zielone | zielone | j.w. |
| map-snapshot-load | NIE ZMIERZONO w r4 (r3: exit0, 169 s, 58/0 + 1 KNOWN-FAIL poza exit code = budzet rotacji autozapisu 14,364 MB > ~5 MB origin) | — | — | C/B-decyzja ABC; nie ruszane |

## 3. Mutacje (na KOPIACH w tools/, usuniete po pomiarze)
- u17: test z 459354a12 na obecnym kodzie = 3 pass / 3 FAIL (poprawka r1 byla konieczna); kopia obecnego testu z oczekiwaniem `×1.0` zamiast `×1.1` dla 1 Warsztatu = 5 pass / 1 FAIL (asercja wykrywa regresje mnoznika).
- defense-breakdown: test z 459354a12 = TypeError (stan bazowy); kopia z `chips.length === expectedChipCount + 1` = FAIL asercji chipow (31 pass / 7 fail); kontrola odwrotna: gdy zerowe wpisy zostaja odfiltrowane (kopia), caly plik = 45 pass / 0 fail.
- combat-defense-owner-route: asercja szansy trafienia — po przywroceniu starej asercji HP (stary rzut) test byl czerwony (80 vs 80), nowa wykrywa roznice 54,5% -> 50,5% (-4 pp) i 54,5% -> 44,5% (morska).
- NIE wykonano osobnych mutacji dla stubow harnessu (hotseat-*, f04-*, saveload, semantic): stuby neutralizuja tylko zaleznosci spoza zakresu testu; kazdy z tych testow nadal wykonuje REALNY kod main.ts z vm (np. buildDiplomacyTickCtxForPair, purchaseRecruitmentUnit) — NIE ZMIERZONO mutacja.

## 4. B-1 (Grecy `walka_obrona_piechota_teren_las`) — tylko opis, danych NIE zmieniano
Dane: `walka_obrona_piechota_teren_las` = 0,2 TYLKO dla slowianie; Grecy = 0 (matrix 2026-11-16). Wpis zerowy w macierzy jest swiadomy (MATRIX_ZERO_MARKER_IDS, civ-bonuses.ts:293). Pytanie ABC do wlasciciela: czy zerowe wpisy macierzy maja byc widoczne w panelu „Rozbicie obrony” (patrz B-2) — to ta sama klasa objawu.

## 5. Kandydaci klasy B (NIE naprawiano)
- **B-2 (potwierdzony pomiarem, 6 FAIL defense-breakdown):** `defenderCivBonusBreakdown` (gra/src/game/defenseBreakdown.ts:228-249) nie filtruje wpisow o wartosci 0. Wpisy `walka_hp_piechota=0` i `walka_hp_rydwany=0` (znaczniki zera z civ-bonuses.ts:293) trafiaja do panelu jako linie „Walka · punkty zdrowia · piechoty — N z M jednostek”, a roster samej konnicy/rydwanow dostaje linie rydwanow zamiast pustej listy. Dowod: ten sam plik testu z `grecyBonusy.filter(b => b.wartosc !== 0)` = 45 pass / 0 fail. `isCombatModifierBonus` (civ-bonuses.ts:388) ma `wartosc !== 0`, `isDefenseOnlyCivBonus` — nie. Wplyw: panel preBattle pokazuje bonusy 0%. Proponowany temat: R-WEB-UI-DEFENSE-BREAKDOWN-ZERO-BONUS-LINES-Q1 (plik defenseBreakdown.ts, 1 warunek).
- B-3 (pr141-combat-defense-owner-route „naval HP 80=80”, hipoteza r3): ODRZUCONA pomiarem — przyczyna A (patrz tabela), kod OK.
- B (r1 „plon kamienia 50 vs 55”): rozstrzygniete w r1 jako A (u17).
- Brak innych kandydatow B.

## 6. Bramki (ZMIERZONO, na HEAD)
tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; unit-replace-test 21/21; combat-test „All sanity checks passed”; `git diff --check` czysty; zmiany tylko gra/tools/*test*.cjs.

## 7. Tabela przed/po (czerwone -> czerwone)
| zakres | przed (51a3f6b94) | po |
|---|---|---|
| pr141-* (33) | 15 | 5 (ledger v1, v3: A-snapshot, poza allowlista; ledger v4, evidence-ledger-behavior, runtime-ordinary-scope: C brak artefaktow) |
| defense-breakdown | 7 FAIL | 6 FAIL (wszystkie B-2) |
| war-epoch-player-first-main-guard | 2 FAIL | 0 |
| okolica-load-reconcile, budynek-civ-bonus-u17, diplo weaker-seeks/main-guard/gate/truce-r1/r4 | zielone | zielone |

BLOKADY: brak blokad technicznych. NIE ROZSTRZYGNIETE tylko: ledger v1/v3 (A — brakuje kroku regeneracji dowodow poza allowlista + decyzji wlasciciela), v4/behavior/ordinary-scope (C — artefakty nigdy nie byly w repo). map-snapshot-load nie mierzony w r4.
RUNDY: 4/5 (r1 FC FAIL Haiku, r2 INFRA, r3 FC FAIL Haiku, r4 = ta runda Sonnet).
NASTEPNY KROK: Evaluator (diff 14 plikow testowych; mutacje pkt 3); ABC wlasciciela: (1) B-2 filtr zerowych linii w panelu obrony, (2) czy odswiezac zamrozone ledgery PR141 (generate.cjs) czy oznaczyc je jako archiwalne, (3) C-testy bez artefaktow — usunac z gate czy odtworzyc dowody.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: nie utworzono zadnych sesji/zadan/harmonogramow. Kopia bazy 459354a12 w scratchpadzie (git archive) do usuniecia razem z gra/node_modules i /tmp/pr141, /tmp/b_*.log. Dispatch wskazywal `origin/main` jako baze, ale kandydat 51a3f6b94 jest rozlaczny z ef6e8ea1e (merge-base 459354a12) — merge-tree czysty.
