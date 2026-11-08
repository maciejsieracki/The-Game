STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — auto-ulepszenia terenu
TEMAT: R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2
GOAL: po wyczerpaniu farm na polach obywateli automat stawia trzodę, potem irygację; reguła „tylko pola obywateli” bez zmian.
ZMIANY-COMMIT: obrona zarzutów r2. Odtworzony stan Operatora r2: 3d908145b (kod 9420ae1da). Poprawka: gra/tools/ai-food-improvement-priority-stages-test.cjs (tylko test, bez zmian w gra/src). SHA poprawki: patrz sekcja „Commit” niżej. Raport: ten plik. Push: NIE WYKONANO.
RUNDY: 2/5 (obrona zarzutów r2 w tej samej rundzie)

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ (poprawka). Przywrócono wieloturowe pętle E3→E4→E5 w `ai-food-improvement-priority-stages-test.cjs`: 20 tur, po każdej turze kolejność rang E1 farma przy rzece (1) < E3 trzoda (3) < E4 irygacja/tarasy (4) < E5 farma poza rzeką (5) < E6 sól (6), zakaz E3-rzeczna/E4 po E5 w kolejnych turach. Kaskada w jednej turze pozostaje (zgodna z wymogiem „przejście gdy poprzedni wyczerpany”). Usunięto osłabiony warunek soli („albo już zbudowana”); zastąpiony sprawdzeniem kolejności. Wynik: 13/13 PASS.
   Zastrzeżenie: te asercje nie rozróżniają r1 od r2 (13/13 także na źródle r1, eksport f9af066aa). Dyskryminuje dopiero blok (e) w `autoimprove-pasture-irrigation-q2-test.cjs` (patrz pkt 5).
2. PRZYJMUJĘ jako odstępstwo od allowlisty: `autoimprove-pasture-irrigation-q2-bisect.cjs` i `autoimprove-pasture-irrigation-q2-live-measure.cjs` to narzędzia pomiarowe (bisect wymagany przez właściciela, pomiar żywy), bez zmian w `gra/src`. Zostają w `gra/tools`; zakres allowlisty rozszerzony o te dwa pliki w tym temacie.
3. PRZYJMUJĘ: NIE_ZMIERZONO w żywej grze po naprawie. Zakaz `vite build` w `gra/` obowiązuje; orkiestrator uruchamia `live-measure.cjs post` po buildzie (komenda w r2, sekcja 6).
4. PRZYJMUJĘ z wyjaśnieniem (przyczyna wyjaśniona w kodzie, nie w pomiarze). `improvement-tech.ts:39` mapuje `Irygacja` → `Gospodarka wodna`; `data/terrain-improvements.json` (irygacja, `tech: "Irygacja"`). Dowód: Q2 harness z usuniętą „Gospodarka wodna” z zestawu technologii: irygacja 0/54 pól obywateli przy rzece, 0 wszędzie (3 FAIL, zgodnie z oczekiwaniem). Żywy pomiar przed naprawą miał `UNLOCK=none`, więc brak tego techu jest wystarczającym wyjaśnieniem zerowej irygacji. Czy gracz w tym zapisie miał tech: NIE_ZMIERZONO (nie odczytano stanu techów z bundla).
5. PRZYJMUJĘ w części. Bloki (a)-(d) nie rozróżniają r1 od r2: na r1 przechodzą 11/11 (zmierzone). Wadę r1 wykrywa tylko blok (e): na r1 12 OK / 5 FAIL (starved 23, trzoda t26, irygacja t28, 86 farm bez trzody), na r2 17 OK / 0 FAIL. Blok (e) jest wieloturowy (wzrost obywateli), co odpowiada zrzutowi właściciela; przypadek statyczny nie jest regresem i nie jest twierdzony jako taki.

## Testy (na 3d908145b + poprawka)
- ai-food-improvement-priority-stages-test: 13 passed, 0 failed (na r1: 13/13, patrz pkt 1).
- autoimprove-pasture-irrigation-q2-test (r2 src): 17 OK / 0 FAIL. (r1 src): 12 OK / 5 FAIL.
- Zmieniono tylko test; `gra/src` nietknięty, więc logic-test i ai-test nie były uruchamiane w tej obronie (bez zmian kodu).
- `git diff --check`: czysto.

## Blokady
- NIE_ZMIERZONO: żywa gra po naprawie (zakaz buildu w gra/).
- NIE_ZMIERZONO: stan techu „Gospodarka wodna” w zapisie z pomiaru przed naprawą.
- Zero DECISION_REQUIRED.

## Commit
Jawny `git add` tylko: `gra/tools/ai-food-improvement-priority-stages-test.cjs` i ten plik. Bez push.

NASTĘPNY KROK: Evaluator (r3 weryfikacja testu food-stages i bloku (e); decyzja o allowliście dla dwóch narzędzi). Live-measure po buildzie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
