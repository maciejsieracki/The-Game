TEMAT:  R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow) — opt-in „Autobots workflow" tej sesji, per-temat osobny Operator (żądanie właściciela 2026-08-29)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow) — baza R-PROC-AUTOBOT.md §5a (temat NIE graficzny)

## WYZWALACZ
Recon `P-HANDEL-SZLAKI-PER-MIASTO-CZY-PER-CYWILIZACJA-Q1` (2026-08-29, ten sam
dzień) potwierdził: szlaki handlowe są per PARA MIAST (nie per cywilizację),
bez limitu — N miast gracza × M miast partnera = N×M tras, każda licząca
dochód niezależnie. Właściciel, po zobaczeniu reconu i drugiego zrzutu (16 tras,
suma +553/turę): „OK, niech będzie A i obniżmy pięciokrotnie przychód z handlu,
ale może być z każdym miastem (...) obniżamy pięciokrotnie, ale nie mniej niż 1.
Jeżeli wychodzą cząstkowe, to przybliżenie. Nie stosujemy ułamków, tylko liczby
całkowite." Bezpośrednie ustalenie w dialogu — nie wymaga turnieju ABC.

## GOAL
Funkcja `tradeRouteTotalDistanceIncome` (`gra/src/game/trade-routes.ts:885-892`)
— jedyne udokumentowane w kodzie miejsce, którego mają używać WSZYSCY liczący
finalny dochód trasy (linia 879-883 komentarza) — zwraca wynik pięciokrotnie
niższy niż dziś, zaokrąglony do liczby całkowitej, nigdy niższy niż 1. Żadna
inna funkcja/plik nie jest modyfikowany poza aktualizacją oczekiwanych wartości
w teście referencyjnym tej funkcji (patrz KRYTERIA pkt 4).

## REGUŁA DOKŁADNA
Nowy wynik = `Math.max(1, Math.round(stary_wynik / 5))`, gdzie `stary_wynik` to
dzisiejszy wynik funkcji (już po ewentualnym mnożniku ×2 dla morza — dzielimy
WYNIK FINALNY, nie osobno lądową krzywą i osobno mnożnik morski). Przykłady do
zweryfikowania jawnie w raporcie: ląd dystans=0 (dziś 5) → 1; ląd dystans=12/
szczyt (dziś 40) → 8; morze dystans=0 (dziś 10 po ×2) → 2; morze dystans=20/
szczyt (dziś 80 po ×2) → 16; dowolna wartość pośrednia dająca np. 28 → 28/5=5,6
→ round=6.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `tradeRouteTotalDistanceIncome` zwraca `Math.max(1, Math.round(<dawny wynik>/5))`
   dla KAŻDEJ kombinacji (dystans, medium) przetestowanej — zero przypadków
   zwracających 0 albo wartość ułamkową.
2. `git diff origin/main..branch --stat` pokazuje WYŁĄCZNIE
   `gra/src/game/trade-routes.ts` i `gra/tools/trade-routes-income-test.cjs`
   (drugi plik tylko po to, by zaktualizować oczekiwane wartości zgodnie z tą
   samą regułą ×(1/5) zaokrąglone — NIE luźno dopasowane, żeby test przeszedł).
3. `tradeRouteDistanceIncome` (czysta krzywa dystansowa, BEZ mnożnika ÷5) —
   NIEZMIENIONA — zostaje jako dotychczasowe wewnętrzne narzędzie pomocnicze;
   redukcja wchodzi wyłącznie w `tradeRouteTotalDistanceIncome` (finalny punkt
   zbiorczy, patrz GOAL).
4. `trade-routes-income-test.cjs` zaktualizowany: każda hardkodowana oczekiwana
   wartość odwołująca się do `tradeRouteTotalDistanceIncome` przeliczona wg tej
   samej reguły (nie zgadywana) — w raporcie wklejony PRZED/PO dla każdej
   zmienionej asercji.
5. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
6. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/0), research-test (33/33), unit-replace-test (13/13),
   combat-test (6/6). Znany regres ai-praca-split-parity-test 21/1 — bez zmian.
7. `trade-routes-test.cjs` (osobny plik, testuje generowanie tras, nie sam
   wzór dochodu) — zielony bez pogorszenia; jeśli asercje tam też odwołują się
   do konkretnych kwot dochodu, zaktualizować identycznie jak pkt 4.

## ALLOWLISTA — nic poza tym
`gra/src/game/trade-routes.ts` (wyłącznie ciało `tradeRouteTotalDistanceIncome`),
`gra/tools/trade-routes-income-test.cjs`, `gra/tools/trade-routes-test.cjs`
(tylko oczekiwane wartości liczbowe dochodu, jeśli występują).
Zakazane bezwzględnie: `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, żadna zmiana w
`tradeRouteDistanceIncome` (krzywa dystansowa), żadna zmiana w mechanizmie
generowania tras (`refreshTradeRoutes` i pętla N×M) — TEN temat NIE zmienia
strukturę per-miasto, tylko stawkę (decyzja właściciela: wariant A).

## IZOLACJA
worktree własny, gałąź `autobot/R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1`, baza
JAWNIE `origin/main` (aktualny, po commitach `b060f321`). Sparse-checkout bez
`gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz zgłoszenia „zaokrągliłem zgodnie z regułą" bez wklejonego skryptu
liczącego stare i nowe wartości dla siatki testowych dystansów (przynajmniej:
0, 1, dystans dający nieparzysty wynik przed dzieleniem, maxDist) dla obu
mediów. Zakaz dostrajania oczekiwanych wartości w teście „na oko, żeby przeszło"
— każda nowa oczekiwana wartość w `trade-routes-income-test.cjs` musi mieć w
raporcie widoczne wyliczenie `stara_wartosc/5` zaokrąglone.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładną funkcję/asercję z błędną wartością; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator → Final Control (osobne wywołanie Workflow) → integracja
orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
