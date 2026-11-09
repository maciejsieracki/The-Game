STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SUPER-UNIT-LIMIT-ONE-NOT-ENFORCED-Q1
GOAL: Limit 1 Super-jednostki na cywilizacje liczy caly stan (zywe + kolejki rekrutacji wszystkich miast), wymuszany przy zakupie i zamianie, dla gracza i AI.
ZMIANY/COMMIT: baza operatora bec653461 (rodzic 264aebdf7, is-ancestor OK). Commit obrony 84844fc73 (gra/src/game/production.ts, gra/src/main.ts, gra/tools/super-unit-limit-one-test.cjs). Ten raport: osobny commit po 84844fc73. Brak zmian poza allowlista; WERSJE.md i gra-robocza/ nietkniete.

ODPOWIEDZI NA ZARZUTY
1. Egzekucja w main.ts nie sprawdzona zachowaniem (regex). PRZYJMUJE CZESCIOWO.
   - Poprawka: wlasciciel-zalezna rezerwacja wyciagnieta do czystej funkcji reservedUnitTypeNamesOfOwner (production.ts). Testowana zachowaniem w sekcji 9: izolacja wlascicieli, kolejka miasta B, brak produkcji. main.ts tylko deleguje (cityProd.get).
   - Sciezka wodzow przeniesiona do czystej funkcji generalSyncTargets; sekcja 10 testuje zachowaniem.
   - NIE pokryte testem wykonania: ciala purchaseRecruitmentUnit, purchaseRecruitmentUnits, performUnitReplace oraz AI w boot(). Sa zbyt DOM-owe, zeby uruchomic je w node bez main.ts. Pozostaje regex (sekcja 8). Chromium: NIE_ZMIERZONO.
   - Commit: 84844fc73.
2. diplomacy-unit-transfer.ts (transferJednostki) bez sprawdzenia limitu Super. ODRZUCAM (dowod: brak sciezki produkcyjnej):
   - spawnTransferredUnit ma w src/ jedna definicje (src/game/diplomacy-unit-transfer.ts:38) i zero wywolan. main.ts:1646 tylko importuje, main.ts:12135 to komentarz TODO.
   - Galaz 'jednostka' w wykonaniu deali (main.ts ~12133) jest pusta (break), wiec nie tworzy jednostki.
   - Ryzyko na przyszlosc: jesli ktos podepnie spawnTransferredUnit, musi dostac ten sam guard. Zanotowane tutaj, bez zmiany kodu.
3. syncGeneralFormsForOwner moze zmienic typeId wodza na Super bez limitu. PRZYJMUJE. Blad realny i naprawiony:
   - bestGeneralUnitForOwner korzysta z productionAvailabilityCtxForCity, ktory ma juz rezerwacje, wiec Super jest odrzucana, gdy juz istnieje. To bylo OK.
   - Dziura: petla zmieniala typeId WSZYSTKICH wodzow wlasciciela naraz (warunek tylko isGeneral i ownerId). Gdy wodzow bylo wiecej niz jeden, a Super jeszcze nie istniala, powstawaloby kilka Super.
   - Poprawka: generalSyncTargets przepuszcza kolejnych wodzow tylko, gdy cel nie jest zarezerwowany. Po pierwszym przeksztalceniu cel trafia do rezerwy. Test 10: trzech wodzow, cel Super, przeksztalcony 1.
   - Commit: 84844fc73.
4. Stare zapisy: sztuki oplacone w kolejce wypuszczaja sie normalnie (brak zwrotu kosztu). PRZYJMUJE jako pytanie do wlasciciela. ZALOZENIE w kodzie: brak zwrotu i brak usuwania jednostek; nowe sztuki sa blokowane. Nie zmieniano. DECYZJA DLA ORKIESTRATORA: zwrot kosztu dla starych kolejek z duplikatem, tak/nie.
5. Brak pliku LEDGER REPIN na tej bazie. PRZYJMUJE jako informacje. Nie tworze pliku, bo w repo nie ma istniejacego LEDGER dla REPIN. Tresc wpisu: runs/R-WEB-SUPER-UNIT-LIMIT-ONE-NOT-ENFORCED-Q1/01-operator-r1.md, linia 27. Przeniesienie: orkiestrator.

TESTY (wykonane lokalnie w worktree, esbuild z tymczasowego linku node_modules, link usuniety):
- node tools/super-unit-limit-one-test.cjs: 40 OK / 0 FAIL (r1: 28 OK; dodane sekcje 9 i 10).
- unit-replace-test: 15/15.
- unit-replace-full-cost-test: 40 passed / 0 failed.
- empire-recruit-plan-test: 17 passed / 0 failed.
- recruit-list-visibility-test: 9 passed / 0 failed.
- esbuild transform (skladnia) main.ts i production.ts: OK.
- git diff --check: czysty.
- NIE_ZMIERZONO: pelne tsc (srodowisko bez node_modules gry, jak w r1), Chromium/playwright, recruitment-batch-contract-test (dlug z r1, poza allowlista).

BLOKADY: brak. Otwarte decyzje: pkt 4 (zwrot kosztu starych kolejek).
RUNDY: 2/5 (obrona r1 z zarzutami; wynik tej rundy: poprawka 84844fc73)
NASTEPNY KROK: Evaluator r2 (ten sam ID), potem Final Control. Orkiestrator: decyzja pkt 4, przeniesienie wpisu LEDGER.
DEPLOY/PUSH: NIE WYKONANO
