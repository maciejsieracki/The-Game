# R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 — obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES (obrona zarzutów Evaluatora; werdykt końcowy należy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1
GOAL: AI wypowiada wojnę przy Zaufaniu pary < 30 i przewadze siły militarnej AI >= 20% (charakter decyduje); hamulec zerowego Zaufania po N turach (silniejsza strona wg siły militarnej); gracz nigdy automatycznie; ostrzeżenie raz na epizod zera.
BAZA: 3950aae12 (origin/main w chwili startu obrony: 478cefaed; kod kandydata 242ed1fa0 oceniany względem 3950aae12).
KANDYDAT (startowy): 242ed1fa0. Commit obrony (kod + testy): bff5ef228. Raport: ten plik (commit podany w polu sha).

## ZMIANY-COMMIT
Commit bff5ef228 (tylko pliki z allowlisty + main.ts):
- gra/src/main.ts (+15/-3 względem kandydata): processDiploCrisisQueue — ostrzeżenie zerowego Zaufania:
  - nowa flaga `diploZeroTrustWarned` (Set, ok. linii 11010), czyszczona na początku funkcji, gdy wpis licznika znika (ok. linia 11875);
  - warunek ostrzeżenia (linia 11896-11897): `counter < nPair && warOutcome.mayDeclare && !isPeaceLockedBetween(sa, sb) && !diploZeroTrustWarned.has(key)`, zamiast `counter === 1 && ...`.
- gra/tools/diplo-war-declare-zero-trust-test.cjs: sekcja (a2) granica Zaufania (29 -> wojna; 30/31/80 -> brak, AI +25%); asercje źródłowe warunku ostrzeżenia z mutacjami.
- gra/tools/ai-test.cjs: T12-dip-b — obie cywilizacje agresja 0.5 (aggressive 0.75 -> 0.5; peaceful 0.3 -> 0.5), patrz odpowiedź na zarzut 2.
- gra/tools/diplo-war-peace-main-guard-test.cjs: mutacja R7/ZT nie jest już tautologią (sprawdzany warunek na mutancie); asercja D7 zaktualizowana do nowego warunku ostrzeżenia.
- gra/tools/diplo-tick-war-brake-test.cjs: wzorzec ostrzeżenia ZT zaktualizowany do flagi per epizod i blokady rozejmu.
- Nie zmieniano: gra/src/game/ai.ts (przywrócony po każdej mutacji, `git status` czysty), diplomacy-war-peace-profile.ts, JSON, gra/`-zależnych artefaktów.

## ODPOWIEDZI NA ZARZUTY EVALUATORA
1. (ISTOTNY, brak testu zachowania Zaufania >= 30) — PRZYJMUJĘ. Dodano sekcję (a2): zaufanie 29 + AI +25% -> wojna; zaufanie 30, 31, 80 + AI +25% -> brak wypowiedzenia. Dowód mutacji M1 (warunek `rel.relation.zaufanie < PROG_WOJNA_ZAUFANIE` zamieniony na `true &&` w ai.ts): diplo-war-declare-zero-trust-test -> `40 OK, 3 FAIL` (FAIL: "zaufanie 30/31/80 ... zmierzone: [wypowiedz_wojne]"). Plik ai.ts przywrócony. Uwaga: ai-test pod M1 nie był uruchamiany w tej rundzie (Evaluator podał 296/0 dla M1; nie potwierdzam tego samodzielnie).
2. (ISTOTNY, osłabiony T12-dip-b) — PRZYJMUJĘ. Pierwsza wersja (pokojowa agresja 0.3) była trywialna (poniżej progu z samej agresji). Teraz obie cywilizacje mają agresję 0.5 i te same warunki siły/zaufania; różnicę robi wyłącznie charakter przez już istniejące `resolveDiplomacyCivBias.warAgresjaBonus` (pokojowa +0.10 -> efektywny próg 0.60; agresywna -0.10 -> 0.34 po podbojBoost). Bez nowej decyzji ABC: charakter przez effAgresja/warAgresjaBonus to już decyzja ABC A właściciela. Zastrzeżenie: wejście agresywnej cywilizacji też zmieniło się (0.75 -> 0.5), co jest jawne w komentarzu testu. Dowód mutacji M2 (bonus pokojowej cywilizacji `warAgresjaBonus: 0.10` -> `0`): ai-test `295 passed, 1 failed`, FAIL: "T12-dip-b: chinczycy nie wypowiadaja wojny przy tych samych warunkach; got: wypowiedz_wojne". Plik ai.ts przywrócony.
3. (allowlista: diplomacy-war-peace-profile.ts) — PRZYJMUJĘ FAKT, NIE COFAM ZMIANY. Plik zawiera wyłącznie dwie linie: pole `wypowiedzenieZaufanie` w typie WarPeaceParams i eksport `PROG_WOJNA_ZAUFANIE` (czytany z JSON). Bez tego ai.ts nie ma progu z danych (dispatch: "parametry w JSON, nie w kodzie"). Prośba do FC/orkiestratora: rozszerzyć allowlistę o ten plik albo zaakceptować wyjątek.
4. (allowlista main.ts: konstruktory RelacjaWejscie i importy) — ODRZUCAM jako naruszenie zakresu; zgłaszam do potwierdzenia. Hunki w linii 42105-42106 i 42176-42177 dodają wyłącznie pola `silaMilitarnaAI` i `silaMilitarnaPartner` (wywołania `diploMilitarySideOf`) do wejścia `decideAIDiplomacy`. To wiring "adaptera w main.ts" z Zmiany 1 dispatchu, bez którego Zmiana 2 (ai.ts) nie ma danych. Importy (`computeMilitaryStrength`, `readWarBattlePoints`, `isTributeBonusActive`, `militaryBrakeOutcome`) są potrzebne przez pomocnik siły i hamulec. Nie zmieniono żadnej logiki poza listą allowlisty.
5. (ostrzeżenie dla gracza: wąski warunek, „N−1” zamiast „N”, peaceLocked) —
   - (a) wąski warunek `counter === 1` — PRZYJMUJĘ i naprawiono: ostrzeżenie pada raz na epizod w pierwszej turze, w której AI jest silniejsza (flaga `diploZeroTrustWarned`, kasowana przy końcu epizodu). Jeśli AI stanie się silniejsza później w epizodzie, ostrzeżenie pada wtedy.
   - (b) peaceLocked — PRZYJMUJĘ i naprawiono: warunek zawiera `!isPeaceLockedBetween(sa, sb)`.
   - (c) „za N−1 tur” zamiast „za N tur” — ODRZUCAM: tekst jest zgodny z mechaniką. Kolejność w end-turn (main.ts ok. linii 24693-24696): `diploBrakeCrisisStep` zwiększa licznik, potem `processDiploCrisisQueue` wypowiada wojnę, gdy licznik >= N. Przy ostrzeżeniu na liczniku k zostaje N−k kolejnych końców tury, więc komunikat `(nPair - counter) tur` podaje rzeczywistą liczbę. Dispatch podał przykład „za N tur”; liczba w komunikacie jest liczbą prawdziwą.
   - Test (f) w zero-trust teście: sprawdzanie źródłowe warunku ostrzeżenia (flaga, blokada rozejmu, czyszczenie) + mutacje czerwieniące warunek (usunięcie flagi -> FAIL; usunięcie blokady rozejmu -> FAIL). Zachowanie wyświetlenia w działającym silniku NIE_ZMIERZONO (brak uruchomienia gry, zgodnie z dispatchem).
6. (drobne: tautologia w main-guard; sekcja (g) testuje tylko ai.ts) — PRZYJMUJĘ tautologię i naprawiam: asercja mutacji R7/ZT sprawdza teraz, że mutant przestaje spełniać warunek (`MUT_R7 !== MAIN && !r7ZtOk(MUT_R7)`). Sekcja (g) z hamulcem w main.ts: NIE_ZMIERZONO w silniku. Blokady w main.ts (isPeaceLockedBetween, R1/R2, D7 mayDeclare) są pokryte istniejącymi testami źródłowymi i testem d7 (8/0); nie dopisywano nowych zachowaniowych testów main.ts.

## TESTY (wykonane w worktree, gra/ npm ci --ignore-scripts; liczby z surowego wyjścia)
Po commicie bff5ef228 (ponowny przebieg po przywróceniu ai.ts):
- tsc --noEmit: exit 0
- diplo-war-declare-zero-trust-test: 43 OK / 0 FAIL (exit 0; było 36/0 przed poprawką)
- ai-test: 296 passed / 0 failed (exit 0)
- diplo-war-peace-main-guard-test: 35 pass / 0 fail (exit 0)
- diplo-tick-war-brake-test: 51 pass / 0 fail (exit 0)
- ai-early-no-major-war-test: 14 passed / 0 failed (exit 0)

Bramki i pokrewne (kod kandydata + poprawki obrony):
- logic-test: 213/213 (`LOGIC OK (213/213)`), exit 0
- tech-tree-test: 20 pass / 0 fail, exit 0
- research-test: PASSED 33 / FAILED 0, exit 0
- unit-replace-test: 21 linii `[OK]`, exit 0
- combat-test: "All sanity checks passed", exit 0 (liczby nie wyodrębniono)
- diplomacy-test: 148 passed / 0 failed
- diplo-military-strength-test: 27 PASS / 0 FAIL
- diplo-war-battle-counter-test: 35 PASS / 0 FAIL
- diplo-war-trust-only-test: 11 OK / 0 FAIL
- diplo-respect-military-events-test: 24 OK / 0 FAIL
- diplo-war-peace-d7-test: 8 pass / 0 fail
- diplo-war-peace-gate-test: 24 pass / 0 fail
- diplo-war-peace-sim-test: 19 pass / 3 fail (wynik taki sam jak baza 3950aae12 wg Evaluatora 19/3; w moim logu FAIL: M_TUR; pozostałe dwa FAIL nie były porównywane w tej rundzie linia po linii)
- diplo-war-peace-live-test: NIE_ZMIERZONO (Playwright/build zakazany dispatchem)

Mutacje zrobione w tej rundzie (ai.ts przywracany po każdej, `git status` czysty):
- M1 (usunięta bramka Zaufania): zero-trust 40 OK / 3 FAIL.
- M2 (warAgresjaBonus pokojowej cywilizacji = 0): ai-test 295 passed / 1 failed (FAIL T12-dip-b).

## BLOKADY
- Brak technicznych. Dysk: 2,6 GB wolne przy starcie (ostrzeżenie dispatchu: < 4 GB dla web); npm ci zajął 134 MB; node_modules usunięty po zakończeniu.
- Zależne od FC: decyzja o rozszerzeniu allowlisty (zarzuty 3 i 4).

## RUNDY
Runda 1 obrony (odpowiedź na zarzuty runda 1 Evaluatora). Liczba zużytych rund Operatora: 1 z 5.

## NASTĘPNY KROK
Evaluator (ponowna ocena bff5ef228, szczególnie M1/M2 i warunku ostrzeżenia), potem Final Control. Do rozstrzygnięcia przez FC: allowlista dla diplomacy-war-peace-profile.ts i wiring w main.ts (zarzuty 3-4). Poza zakresem tej rundy: pełny test zachowania hamulca w main.ts (NIE_ZMIERZONO).

DEPLOY/PUSH: NIE WYKONANO
