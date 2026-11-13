# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — Operator, runda 2/5 (Haiku)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: opcja A (decyzja właściciela 2026-11-13): AI nie proponuje pokoju przed 10. pełną turą wojny dla wszystkich cywilizacji (bramka gracza PEACE_PROPOSAL_MIN_WAR_TURNS = 10); sim-test 24/24+ bez FAIL, tsc 0, bramki referencyjne zielone.
BAZA: 551034cb3 (detach), kod operatora = jeden commit nad bazą (SHA w sekcji ZMIANY-COMMIT).
ZMIANY-COMMIT: gra/src/game/ai.ts (aiPeaceTimeOk + import stałej), gra/tools/diplo-war-peace-sim-test.cjs, ten raport.

## Zmiana w kodzie (gra/src/game/ai.ts, allowlista: tylko bramka czasu)
- l. ~7019: `aiPeaceTimeOk = turnsAtWarRel >= Math.max(warProfile.minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)` (było: `>= warProfile.minTurWojny`, zulusi = 7).
- Import `PEACE_PROPOSAL_MIN_WAR_TURNS` z `./diplomacy-peace-proposal-timing` (jedna linia; konieczna, by nie wpisywać liczby 10). Progi, miara siły i reszta ai.ts nietknięte. Fragment audytu W73 (l. 7126–7186) nietknięty.
- aiPeaceTimeOk steruje też oddaniem/żądaniem miasta (N1a/N1b, zgodnie z komentarzem w kodzie) — ta sama bramka czasu, bez innej zmiany.

## Zmiany w teście (gra/tools/diplo-war-peace-sim-test.cjs)
| Scenariusz | Powód zmiany | Nowa asercja |
|---|---|---|
| S1 / S1a | Harmonogram AI słabszej: od minTurWojny (7) → od max(7,10) = tura 10 | tury 10,13,…,28; każda ≥ 10 |
| S5 | pierwsza propozycja AI słabszej militarnie | midFirstT === 10 |
| S6 / S6b / M_HEALTH | sprawdzenie w turze 7 → 10 (pierwsza tura po bramce) | healthLow/healthHigh w turze 10 |
| S2 / S2b / S3 / S3b / S3c / S4 / S4b / S7 / S7b | bez zmian asercji (już zgodne z regułą) | — |
| Eksport | ENTRY bundla eksportuje PEACE_PROPOSAL_MIN_WAR_TURNS (S1 czyta stałą, nie liczbę) | — |
| M_TUR | `from` dopasowany do nowej linii (stary tekst już nie istniał → applied=0) | bez bramki czasu AI składa propozycję w turze 1; earlyViolations > 0 |
| M_REV (NOWY) | cofnięcie naprawy: `>= warProfile.minTurWojny` | AI proponuje w turach 7–9 → S7b pada |
| M_FEEL | sprawdzenie „AI silniejsze chce pokoju w t=8/9" było pod bramką czasu (zawsze fałsz) → sprawdzenie od tury 10 | strongFirstT !== null |
| M_WEAR | DEAD MUTANT: mutował `warWearinessFraction` (diplomacy-war-peace-profile.ts), którego ścieżka decyzji AI nie używa; asercja (midFirstT !== 8) była pusta. Mutant przeniesiony na licznik tur w `warWearinessLevel` (war-weariness.ts, używany przez ai.ts) | siatka rw×miasta×tury 1–30 różni się od bazy |

Wynik sim-testu po zmianach (surowe wyjście): `diplo-war-peace-sim-test: 25 pass / 0 fail` (dispatch wymagał 24/24+). S7b zielone; wszystkie mutanty (M_SIG, M_FEEL, M_WEAR, M_HEALTH, M_TUR, M_REV, M_GATE, M_STRONG) wykrywane; (0) każdy mutant podmienił dokładnie 1 miejsce.

## TESTY (surowe wyniki, po zmianach)
- `npx tsc --noEmit`: exit 0.
- Bramki referencyjne (gra/): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.`; unit-power-test `6 pass, 0 fail`.
- ai-test: `297 passed, 0 failed`.
- diplomacy-test: `149 passed, 0 failed`.
- Testy pokoju/zmęczenia:
  - ai-war-weariness-peace-test: `PASS=99 FAIL=0`
  - diplo-peace-balance-accept-test: `32 pass / 0 fail`
  - diplo-peace-stance-wiring-test: `10 pass / 0 fail`
  - diplo-weariness-20-turns-test: `PASS=30 FAIL=0`; diplo-weariness-city-only-test: `PASS=30 FAIL=0`; diplo-weariness-display-test: `PASSED: 52 / FAILED: 0`; diplo-weariness-unconditional-end-test: `PASS=22 FAIL=0`
  - diplo-war-peace-d7-test `8/0`; diplo-war-peace-profile-unit-test `198/0`; diplomacy-peace-lock-test `9/0`.
- Testy pokoju, których NIE da się zieleni bez edycji plików POZA allowlistą (patrz BLOKADY):
  - diplo-peace-weaker-seeks-city-only-test: 28 pass / 4 fail (baza 551034cb3: 29 / 3). Nowy FAIL h3 (wojna 5 tur, 6 miast, oczekuje oferty miasta za rozejm) — zgodnie z nową bramką oferta miasta w turze 5 jest zakazana. Stare FAIL h2, h4, h5 istnieją też na bazie.
  - ai-losing-war-asks-peace-vs-player-test: 11 PASS / 1 FAIL (baza: exit 0). FAIL (1) Harappa: 6 miast, t=3 → oczekiwano komendy pokojowej, teraz 0 (bramka 10 tur). Zgodne z nową regułą, test pisany pod starą.
  - diplo-war-peace-main-guard-test: 33 pass / 2 fail (baza: 34 / 1). Nowy FAIL „R3 spojnosc": test sprawdza literał `const aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny;` — literał zmieniony przez naprawę. Stary FAIL „R6/ZT" istnieje też na bazie.
  - diplo-war-peace-gate-test: 23 pass / 1 fail (FAIL „G" — identyczny jak na bazie).
  - diplo-war-peace-live-test: przekroczył timeout 280 s (exit 124); nie uruchamiałem ponownie. Przy pierwszym uruchomieniu nadpisał dwa pliki PNG w dyspozycje/autobot/runs/R-WEB-PEACE-RULES-Q1/evidence/ — przywrócone `git checkout`, nie ma ich w commicie.
- `git diff --check`: czysto; `node --check` sim-testu: OK.

## Dlaczego tych 4 testów nie zmieniałem
Allowlista rundy 2: gra/tools/diplo-war-peace-sim-test.cjs, gra/src/game/ai.ts (tylko aiPeaceTimeOk), runs/**. Trzy z nich (weaker-seeks h3, ai-losing Harappa, main-guard R3) testują ten sam stary harmonogram (tura 7) i wymagają przepisania pod „od tury 10" — poza allowlistą. Nie ruszałem ich.

## BLOKADY
- DECISION_REQUIRED: potrzebna zgoda na rozszerzenie allowlisty o trzy pliki testów (przepisanie pod „od tury 10"):
  1. gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs: h3 — wojna 5 → 12 tur (zakres <20).
  2. gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs: (1) Harappa — t=3 → t≥10 dla „6 miast".
  3. gra/tools/diplo-war-peace-main-guard-test.cjs: R3 — literał aiPeaceTimeOk → nowa linia z Math.max(...,PEACE_PROPOSAL_MIN_WAR_TURNS).
  Bez tego: 3 testy pokoju czerwone (wcześniej zielone lub z tym samym FAIL). Kryterium „testy pokoju zielone" z dispatchu NIESPEŁNIONE w tych trzech plikach.
- Stare FAIL-e (nie z tego tematu, na bazie też): weaker-seeks h2/h4/h5; main-guard R6/ZT; gate-test G.

## RUNDY
2/5 (Operator, Haiku). Poprzednia: runda 1 (obrona, DECISION_REQUIRED S7b) — S7b teraz zielone po naprawie.

## UWAGI-DLA-ORKIESTRATORA
- Naprawa wymaga także importu jednej stałej w ai.ts (ponad „tylko aiPeaceTimeOk"); to jedyna inna zmiana w tym pliku.
- Zmiana dotyka oddania/żądania miast przez AI (N1a/N1b), bo używają tej samej bramki; to zgodne z komentarzem w kodzie, ale warto to potwierdzić przy ocenie.
- Stary mutant M_WEAR (profil) był martwy; zastąpiony mutantem na ścieżce decyzji — do odnotowania przy Evaluatorze.
- Operator nie uruchamiał bramek poza wymienionymi (np. pełnego zestawu testów gry); NIE_ZMIERZONO: npm run build (zakaz), testy przeglądarkowe.

NASTĘPNY KROK: decyzja właściciela/orkiestratora w sprawie allowlisty dla trzech testów (BLOKADY 1–3); po zgodzie — runda 3 (Operator) lub bezpośredni Evaluator na tej rundzie.
DEPLOY/PUSH: NIE WYKONANO
