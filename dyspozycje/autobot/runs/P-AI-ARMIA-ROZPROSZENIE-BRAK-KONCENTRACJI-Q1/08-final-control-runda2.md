STATUS: PASS
DOMAIN: GAME
TEMAT: P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1
GOAL: Fix rundy 2 — cofnąć regresję rundy 1 (dwa prawdziwe fronty wojenne z przydzielonymi
obrońcami domu przestały wymuszać osobne klastry) bez cofania fixu rundy 1 (pojedynczy
nieszkodliwy barbarzyniec przy mieście nadal nie blokuje konsolidacji).

WERDYKT ZARZUTU (Evaluator R2, „test scenario 5 ślepy na własny cel"): ODDALAM — zarzut już
PRZYJĘTY i naprawiony przez Obronę w rundzie 2 (2 rezerwy/miasto zamiast 3 pod
ARMY_CONCENTRATION_MIN_UNITS=3; jednostki przeniesione z q=-3 poza mapę na q,r>=0 realnej
mapy 60x60). Final Control zweryfikował NIEZALEŻNIE, własną mutacją, że naprawiony test
faktycznie łapie regresję:
- Mutacja A (usunięcie `.filter(t => t.ownerId === 0)` w ai.ts, przywrócenie globalnego
  odejmowania pokrycia obrońcy domu jak w rundzie 1 przed fixem rundy 2): live run
  `node tools/army-concentration-test.cjs` → `54 passed, 1 failed`, z komunikatem
  `FAIL: scenario 5: po 15 turach rezerwy obu miast nadal przy SWOICH frontach, żadna nie
  została odciągnięta w stronę drugiego` — dokładnie zgodnie z deklaracją Obrony.
- Mutacja cofnięta (powrót do `.filter(t => t.ownerId === 0)`, stan HEAD 1d4c48bd
  niezmieniony): `55 passed, 0 failed`. `git status`/`git diff` po przywróceniu — czysto,
  brak resztek mutacji w drzewie roboczym.
Mutacyjnie potwierdzone w obie strony, samodzielnie, nie na podstawie samej deklaracji.

GOTOWOSC DO INTEGRACJI: TAK

ZMIANY/COMMIT: HEAD `1d4c48bd` na gałęzi `autobot/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1`.
Diff względem wspólnego przodka z `origin/main` (`e4250762`) ograniczony do allowlisty:
  - `gra/src/game/ai.ts` (+49/-1) — filtr `homeDefenseCoveredBarbarianThreatIds`
    (`ownerId===0`) zamiast globalnego odjęcia pokrycia od `threatFrontCount`.
  - `gra/tools/army-concentration-test.cjs` (+121) — nowy scenario 5 (realne miasta, dwa
    prawdziwe fronty `ownerId:2`, obrońcy domu przydzieleni na obu, regression guard cross-
    front), poprawki scenario 4 pozostają.
  - `dyspozycje/autobot/runs/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1/diag-realistic.cjs`
    (+130) — diagnoza żywa Operatora rundy 1, bez zmian w tej rundzie.
`git diff --check e4250762..HEAD` czyste (brak whitespace errors). Świeży `git fetch
origin main`: main odjechał o 4 commity (`3131d411` czubek), branch o 3. Testowy
`git merge --no-commit --no-ff origin/main` → „Automatic merge went well", ZERO konfliktów
(w tym w `ai.ts`, mimo integracji P-AI-BADANIA-ZACOFANIE-Q1 i P-AI-EKSPANSJA-ODBUDOWA-MIAST-
PO-WOJNIE-Q1 już we wspólnym przodku) — treść naszego fixu (`homeDefenseCoveredBarbarianThreatIds`,
linia `const threatFrontCount = countThreatFronts(...)`) przetrwała scalenie niezmieniona.
Merge test natychmiast cofnięty (`git merge --abort`), HEAD z powrotem czysto na `1d4c48bd`.
(P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1 wymieniony w dyspozycji nie widoczny osobno w
`origin/main` — najwyraźniej już we wspólnym przodku `e4250762` przed rozejściem gałęzi;
brak śladu konfliktu z nim potwierdza czysty merge powyżej.)

TESTY (własne, Final Control):
- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) → 0 błędów.
- 5 bramek referencyjnych (R-PROC-AUTOBOT.md §6), świeżo uruchomione:
  `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33,
  `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie zgodne z wynikiem
  referencyjnym, bez odchyleń.
- `army-concentration-test.cjs`: 55/55 na HEAD (przed i po cyklu mutacyjnym, patrz werdykt
  zarzutu wyżej).
- `diag-realistic.cjs` (scenariusz rundy 1, żywa symulacja na aktualnym kodzie):
  Scenario A (5 miast, 0 frontów): klastrów 5→1 po 40 turach — pełna konsolidacja, jak
  oczekiwano.
  Scenario B (5 miast + 1 nieszkodliwy barbarzyniec/miasto, pokryty obrońcą domu):
  klastrów 5→9 (t.2)→8→7→6 (t.40) — trend malejący, wolne jednostki realnie się
  konsolidują (fix rundy 1 nadal działa, BRAK regresji), zgodnie z referencją zadania
  „nadal 5→6 klastrów/40 tur" — dokładne trafienie liczby.
- Przegląd treści scenario 5 w `army-concentration-test.cjs`: realne miasta (`myCities`
  niepuste), realny przeciwnik w wojnie (`ownerId:2`, nie barbarzyńca), obrońcy domu
  przydzieleni na obu frontach, jednostki na współrzędnych mapy (q,r≥0) — struktura
  odpowiada dokładnie kombinacji z zarzutu Evaluatora R1/R2, nie jest tautologiczna.

BLOKADY: brak.

NASTĘPNY KROK: integracja orkiestratora GPT-5.6 Luna Medium → `READY_FOR_DEPLOY` (po
rebase/merge na aktualny `origin/main`, zweryfikowany tu jako bezkonfliktowy).

DEPLOY/PUSH: NIE WYKONANO
