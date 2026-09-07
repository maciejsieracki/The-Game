# P-BRAMKI-ZASTANE-CZERWONE-Q1 — Evaluator, runda 1/5

**Uwaga proceduralna:** agent Evaluator zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: PASS
DOMAIN: PROCESS
TEMAT: P-BRAMKI-ZASTANE-CZERWONE-Q1
GOAL: Naprawić dwie zastane czerwone bramki (punkty A i B), wyłącznie testy, zero zmiany balansu/mechaniki.

ZMIANY-COMMIT: worktree `/home/user/wt-bramki-zastane`, gałąź `autobot/P-BRAMKI-ZASTANE-CZERWONE-Q1`, HEAD `a29540b6` (base `f0174f2a` potwierdzone `git merge-base`). Niescommitowane: `gra/tools/building-queue-refund-test.cjs`, `gra/tools/barb-city-capture-cluster-test.cjs` — jedyne pliki w `git status --porcelain` po wszystkich moich weryfikacjach (w tym tymczasowej mutacji `main.ts`, przywróconej z backupu, `git diff --stat main.ts` puste).

TESTY (uruchomione niezależnie):
- `building-queue-refund-test.cjs` → 5/5 PASS. Stary plik (`git show f0174f2a:...`) uruchomiony osobno → 2 passed/3 failed, identycznie jak w dispatch/raporcie. `cost.drewno` pochodzi z realnego wywołania `M.buildingStockCost(stolarnia)` (bundlowana funkcja z `building-stock-cost.ts`), nie z powtórzonego wzoru — potwierdzone czytaniem `building-stock-cost.ts:28` (`scaleStockCostRecord(building?.koszt_surowce)`) i `r-stawki-strojenie.ts:43` (`round(v×2)`); `buildings.json` stolarnia.koszt_surowce.drewno=25 (odczyt `node -e`) → 25×2=50, zgodne.
- `barb-city-capture-cluster-test.cjs` → 96/96 PASS. Stary plik → 92 passed/1 failed, identycznie jak dispatch. Offset zmierzony niezależnie: `idx(isBarbarian)-idx(applyCityCaptureToMap)=6412` (dokładnie zgodne). Okno wyznaczone przez sibling-declaration = 13423 znaków, sibling = `refreshMapAfterCityCapture` (dokładnie zgodne z raportem).
- Dowód mutacyjny B zweryfikowany NIEZALEŻNIE (własna próba): `sed -i` podmiana `if (isBarbarian(atkOwner))` → `if (false)` w main.ts → test poprawnie czerwienieje z DOKŁADNIE 2 FAIL (2h-static + regresja-guard), 93 passed/2 failed → przywrócenie z backupu (`cp`) → `git diff --stat gra/src/main.ts` puste, `git status --porcelain` czyste poza 2 allowlistowanymi plikami.
- `tsc --noEmit` → 0 błędów. 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone, uruchomione samodzielnie.
- Afordancja przed poborem: potwierdzone czytaniem WSZYSTKICH wołań `deductBuildingStockCostAcrossCities`/`deductOwnerStockCost` dla budynków (`ui/cityPanel.ts:6156-6158`, `main.ts` pickAutoBuildItem-path ~7716, AI candidate-execution ~32208-32236) — każde poprzedzone `canAffordBuildingStock` na tej samej puli/koszcie. Brak realnego ryzyka produkcyjnego potwierdzony, nie tylko zadeklarowany.
- `git diff --check` czyste.

BLOKADY: brak nowych. Rozbieżność clamp/refund poprawnie zakwalifikowana jako nieosiągalna w grze — DECISION_REQUIRED słusznie pominięte.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO

ZARZUTY:
1. **Miejsce:** raport Operatora, linia „ZMIANY/COMMIT" pkt A: „5 asercji (było 3), zero ubytku". **Co narusza:** twierdzenie faktycznie fałszywe — niezależnie zweryfikowałem (`git show f0174f2a:gra/tools/building-queue-refund-test.cjs` + uruchomienie), że stary plik miał **5** asercji (1×`assert`+4×`eq`), nie 3 — dokładnie tyle samo co nowy. Liczba 2 passed/3 failed ze starego pliku (poprawnie zacytowana gdzie indziej w raporcie) jest matematycznie niezgodna z twierdzeniem „było 3" (2+3=5, nie 3). **Dlaczego ma znaczenie:** to dokładnie kategoria z reguły anty-halucynacyjnej tego zlecenia — niepoparte bezpośrednim odczytem twierdzenie liczbowe w raporcie, które nie wytrzymuje konfrontacji z `git show`. Błąd najpewniej odziedziczony z `00-dispatch.md` (ten sam błędny „3" pojawia się tam w GOAL pkt A.3), ale Operator powinien był zweryfikować przed powtórzeniem, zgodnie z regułą zlecenia. Nie wpływa na wynik binarny (5≥3 i tak, zero realnego ubytku), więc nie blokuje PASS, ale wymaga sprostowania w raporcie.
