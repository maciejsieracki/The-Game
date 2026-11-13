# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — Final Control, runda 3/5 (SONNET)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: diplo-war-peace-sim-test bez FAIL pod zatwierdzone reguły; AI proponuje pokój od tury 10 wojny; brak regresji względem bazy f196422ef.

ZMIANY/COMMIT: kandydat 68c7a5eac (HEAD). Jest potomkiem f196422ef (`merge-base --is-ancestor` = OK). Diff vs f196422ef: ai.ts (+import PEACE_PROPOSAL_MIN_WAR_TURNS, aiPeaceTimeOk = max(minTurWojny, stała)), 4 testy w gra/tools, 2 raporty runs/. Zgodne z allowlistą r3. Kandydat NIE zawiera najnowszego origin/main f9d8948ba (W75/W76: tylko data JSON + nowe narzędzia testowe, brak wspólnych plików z kandydatem); `git merge-tree` HEAD+origin/main = czysty merge (drzewo 3eec7cb2c).

TESTY (surowe wyjście, kandydat vs baza f196422ef; baza zmierzona przeze mnie przez checkout 5 plików z f196422ef):
- tsc --noEmit: rc=0, 0 linii.
- diplo-war-peace-sim-test: kandydat 25/0, baza 19/3. Mutanty M_REV, M_HEALTH (i pozostałe) PASS.
- diplo-peace-weaker-seeks-city-only: kandydat 29/3, baza 29/3 (dług h2/h4/h5; h3 zielone po zmianie 5->10).
- ai-losing-war-asks-peace-vs-player: kandydat 12/0, baza 12/0.
- diplo-war-peace-main-guard: kandydat 34/1, baza 34/1 (dług R6/ZT).
- diplo-war-peace-gate-test 23/1 (dług G), diplo-truce-r1 28/2, diplo-truce-r4-ai 23/1 (dług, zgodnie z raportem Operatora; nietykane przez diff).
- Zielone: diplo-truce-impl 94/0, truce-until-turn 15/0, truce-n6-saveload 8/0, profile-unit 198/0, ai-war-weariness-peace 99/0, peace-balance-accept 32/0, stance-wiring 10/0, weariness-20-turns 30/0, weariness-city-only 30/0, weariness-unconditional-end 22/0, peace-gate-military-strength 14/0.
- Bramki: logic-test rc=0 (213 PASS), tech-tree 20/0, research 33/0, unit-replace-test rc=0, combat-test "All sanity checks passed", ai-test 297/0, diplomacy-test 149/0.
- Regresje (zielone na bazie, czerwone na kandydacie): ZERO.
- Nie uruchamiano: diplo-war-peace-live-test (zakaz dispatchu), weryfikacja Chromium (temat bez UI).

ZARZUTY: brak (lista pusta). Zakres ai.ts ograniczony do bramki czasowej, zgodnie z regułą właściciela „pierwsze oferty od tury 10” (opcja A).

BLOKADY: brak.
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora SHA 68c7a5eac (merge z origin/main f9d8948ba czysty), potem READY_FOR_DEPLOY wg procesu. Dług bazowy (weaker-seeks h2/h4/h5, main-guard R6/ZT, gate G, truce-r1 P1/P2, truce-r4 M2) do osobnego tematu.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: h4/h5 w weaker-seeks padają, bo przy tury wojny=30 działa bezwarunkowy koniec zmęczenia (zmęczenie 1.00) - test sprzed reguły 20 tur; to dług bazowy, nie regresja.
