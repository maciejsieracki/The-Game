STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-AI-MOVE-RANGE-Q1
GOAL: AI, miasta-panstwa i barbarzyncy ida w jednej turze pelnym budzetem ruchu jak gracz (nie 1 heks).
ZMIANY/COMMIT: baza bc291361 (Operator r1). Runda 2 zmienia wylacznie `gra/tools/ai-move-range-test.cjs` (przepisany; nowe testy na PRAWDZIWYM zrodle). Zrodla src bez zmian wzgledem bc291361. SHA nowego commitu: patrz sekcja NASTEPNY KROK. Brak push, brak deploy.
RUNDY: 2/5 (Operator obrona r2 na zarzuty Evaluatora r1).

## Odpowiedzi na zarzuty (1-11)

1. PRZYJMUJE. Log tej rundy jest w tym pliku (`git add -f`). Log r1 nie istnial.
2. PRZYJMUJE. Odpowiedz z numerami linii:
   - przyczyna AI: `gra/src/game/ai.ts:849-859`, `return farthestStepWithinBudget(...) ?? path[0]` w linii 859 (dawniej `return path[0]`).
   - przyczyna barbarzyncow: `gra/src/game/barbarians.ts:749-759`, return w linii 759.
   - zerowanie ruchu AI: `gra/src/game/ai-city-capture-executor.ts:138` (`unit.ruchLeft = 0`), wczesniej niz wszystko poza tym pliku.
   - zerowanie ruchu barbarzyncow (ruch bez sciezki): `gra/src/main.ts:36287-36289` (`bu.q = bcmd.toQ; bu.ruchLeft = 0`).
   - skad gracz bierze budzet: reset ruchu `gra/src/main.ts:31732` (`u.ruchLeft = u.ruch`, `u.ruch` z units.json x kampania), trasa przycinana przez `truncatePathToBudget` w `gra/src/game/planned-march.ts:182`.
   - odpowiednik AI (ta sama semantyka): `gra/src/game/ai-move-range.ts:24` (`truncatePathWithinBudget`) i `:59` (`farthestStepWithinBudget`); okablowanie w `gra/src/main.ts:35542` (`truncatePath:`).
   - pomiar budzetu odczytywany PRZED zerowaniem: `main.ts:35542` (closure czyta `u.ruchLeft` przed `ai-city-capture-executor.ts:138`).
3. PRZYJMUJE CZESCIOWO. PRZED/PO na PRAWDZIWYM kodzie `firstStep` (ai.ts i barbarians.ts), test `F-AVG` w `gra/tools/ai-move-range-test.cjs`. PRZED = ten sam plik z podmiana w pamieci `farthestStepWithinBudget(...) ?? path[0]` na `path[0]` (mutacja realnego zrodla). Wynik (10 jednostek, flat 40x20, ten sam stan):
   - budzet 1: PRZED 1,00 / PO 1,00 heksa na jednostke
   - budzet 2: PRZED 1,00 / PO 2,00
   - budzet 5: PRZED 1,00 / PO 5,00
   - budzet 8: PRZED 1,00 / PO 8,00
   Kolizje celu w tym ukladzie: 0 (jednostki z roznych wierszy). Pelna tura (`decideAITurn` / `main.ts`) NIE_ZMIERZONO: main.ts nie jest uruchamialny headless, a harness jest zastepczym silnikiem. Liczby pelnej tury z zarzutu nie sa dowodem Operatora.
4. PRZYJMUJE. Sekcja D jest przepisana: mutacje sa podmieniane w PRAWDZIWYM zrodle (plugin esbuild `onLoad`, dokladnie 1 trafienie wzorca, inaczej blad). Mutanty: AI firstStep -> path[0] (D1: dystans 1, asercja 5 czerwona), barbarzynca firstStep -> path[0] (D2: 1), planer wojny budzet kroku = 1 (D3: 1), egzekutor z wylaczonym truncatePath (D4: 25, asercja 4 czerwona). Kontrola bez mutacji (D5) = 5.
5. PRZYJMUJE. Test F bundluje PRAWDZIWE `firstStep` z `ai.ts` i `barbarians.ts` (probe `export { firstStep as __firstStep }` dopisywany w pamieci przez plugin, src nie zmieniony). Budzet 1,2,3,5,8 -> dokladnie N heksow (F-AI*, F-BARB*). Mutacja z pkt 4 je czerwieni.
6. PRZYJMUJE CZESCIOWO. Poprzedni wynik 1,41 byl z pomiaru niesparowanego i jednorazowego. Nowy pomiar: 9 przeplatanych serii (PRZED/PO), mediana z 20 wywolan, bez tolerancji +5 ms (asercja E1 to teraz czysty ratio <= 1,3):
   - planer wojny, budzet 5, 16 jednostek: PRZED 36,3 ms, PO 36,5 ms, stosunek 1,01 (E1)
   - ai firstStep, 300 wywolan: PRZED 238,3 ms, PO 227,0 ms, stosunek 0,95 (E2)
   Przyczyny rozbieznosci 1,41 vs 0,9 NIE_ZMIERZONO. Pomiar calej tury NIE_ZMIERZONO (patrz 3). Zarzut o raporcie: r1 zglaszal kryterium jako niespelnione, a przepuszczal przez tolerancje; tolerancja usunieta.
7. PRZYJMUJE FAKT, DECYZJA DLA ORKIESTRATORA. Zmierzone na baza `fcd86933` (worktree tymczasowy, usuniety po pomiarze): `war-allin-capital-test` = 85 passed, 6 failed (6a, 6b x4, 6c). Na commicie: 86 passed, 5 failed (6a, 6b x4). Wszystkie bledy sa w sekcji 6, czyli bledy istnialy na bazie. Referencyjne hashe 6b w tescie (np. `49f36d28989cf940`) nie zgadzaja sie z bazą fcd86933 (`7fc4cb5399d10a2e`), wiec sa nieaktualne. Odswiezenie referencji wymaga edycji `gra/tools/war-allin-capital-test.cjs`, poza allowlista: NIE zrobione w tym commicie. Do decyzji orkiestratora (patrz BLOKADY 1).
8. PRZYJMUJE CZESCIOWO (mechanizm wyjasniony, nie przyjmuje "traci ture"). Kod:
   - `computePath` nie blokuje zajetego heksu docelowego (`gra/src/units/setup.ts:994-996`, "destination ... do not block due to occupied"). Druga jednostka dostaje wiec niepusta sciezke do zajetego celu.
   - `gra/src/main.ts:35518-35519` buduje `blockedKeys` dla kazdej jednostki z AKTUALNYCH pozycji pozostalych (w tym juz przesunietych).
   - `gra/src/game/ai-city-capture-executor.ts:124` obcina koniec trasy do ostatniego wolnego heksu. Jednostka stoi na ostatnim wolnym heksie. Pusta trasa (`moved: false`) wystepuje tylko, gdy PIERWSZY heks trasy jest zajety.
   Kolizja dwoch jednostek na jednym kroku z tego samego stanu wejscia wystepuje tez przy 1 heksie (mechanizm sprzed zmiany). Zmiana zwieksza czestotliwosc. NIE_ZMIERZONO w realnym egzekutorze (liczba kolizji w pelnej turze). Propozycja ZALOZENIA: zostawic jak jest; rezerwacja krokow miedzy jednostkami to osobny temat. Do decyzji orkiestratora (patrz BLOKADY 3).
9. ODRZUCAM (dowod kodu). Galaz ruchu barbarzyncow `main.ts:36287-36289` ustawia `bu.q` bezposrednio i `ruchLeft = 0`, bez przejscia trasy. Sprawdzenia obozow i wiosek w trasie NIE byly nigdy wykonywane dla barbarzyncow, takze przy 1 heksie:
   - `checkBarbCampDestroyedAt` (`main.ts:26540`) niszczy oboz, gdy NIE-barbarzynca na nim stanie. Wywolania: animacja gracza (`main.ts:36586`, komentarz: "anim zawsze jednostka gracza") i egzekutor AI (`main.ts:35568`, tylko AI/MP, na skroconej trasie `path`).
   - nagrody za wioski/chatki: `main.ts:35580` tylko dla `u.ownerId` AI/MP; galaz barbarzyncow ich nie wola.
   Zmiana dodaje tylko dluzsze skoki tej samej galezi. Pozostale zasady przy dluzszym skoku NIE_ZMIERZONO.
10. PRZYJMUJE FAKTY, DECYZJA DLA ORKIESTRATORA. Poza dispatchowa allowlista:
   - `gra/src/game/ai-move-range.ts` (nowy src): konieczny; wspolny modul dla ai.ts, barbarians.ts i main.ts. Dispatch dopuszcza "inne pliki src gdy sa przyczyna", tu jest przyczyna.
   - `gra/tools/war-allin-capital-harness.cjs`: zastepczy silnik odrzucal ruch >1 heks, czyli modelowal stare zachowanie; zmiana konieczna.
   - `gra/tools/barbarzyncy-krazenie-test.cjs`: asercja `realMoves >= 40` (liczba komend) zamieniona na `hexesMoved >= 40` (liczba heksow). Przy 1 heksie obie wartosci sa rowne, wiec przy starym zachowaniu asercja nie zmienia znaczenia. Do zatwierdzenia przez orkiestratora.
11. PRZYJMUJE. Brak mechaniki ZOC w silniku (komentarz `gra/src/game/ai.ts:4603`: "no Zone of Control"). Testy `ai-city-capture-integration` (OK 14) i `barb-city-behavior` (178/0) zielone.

## Testy (commit r2 = stan roboczy po zmianie testu)
- `node tools/ai-move-range-test.cjs`: 44 passed, 0 failed (w tym D1-D4 mutacje czerwone, F-AI/F-BARB, E1 1,01, E2 0,95)
- `ai-test`: 276 passed, 18 failed (bez zmiany wzgledem baseline z dispatchu)
- `logic-test`: 213 PASS, 0 FAIL
- `barbarzyncy-krazenie-test`: 249 passed, 0 failed
- `barb-city-behavior-test`: 178 passed, 0 failed
- `barbarians-test`: 213 passed, 0 failed
- `siege-ai-test`: 17 ok, 0 fail
- `ai-city-capture-integration-test`: OK (14)
- `war-allin-capital-test`: 86 passed, 5 failed (wszystkie w sekcji 6; baza fcd86933: 85/6, to samo miejsce)
- `npx tsc --noEmit`: exit 0
- `npx vite build` (outDir w scratchpad): exit 0
- `git diff --check`: exit 0

## BLOKADY (decyzje, nie techniczne)
1. Sekcja 6 `war-allin-capital-test` padala juz na bazie (85/6). Referencje hashe sa nieaktualne. Decyzja: odswiezyc referencje (edycja testu poza allowlista) albo usunac/zastapic 6a i 6b po zatwierdzeniu nowej bazy.
2. Pomiar pelnej tury (`main.ts`) i liczby kolizji w realnym egzekutorze: NIE_ZMIERZONO.
3. Kolizja celu miedzy jednostkami (pkt 8): mechanizm wystepuje takze przy 1 heksie; decyzja, czy robic rezerwacje krokow w tym temacie, czy w osobnym.
4. Pliki poza allowlista (pkt 10): decyzja o zatwierdzeniu.

## NASTEPNY KROK
Evaluator r2 na ten commit. Orkiestrator rozstrzyga blokady 1 i 4 przed Final Control.
DEPLOY/PUSH: NIE WYKONANO
