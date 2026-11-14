# R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch z gałęzi: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1/00-dispatch.md`.

## Decyzje właściciela (2026-11-13)
1. Cena pokoju równa 0 (wymagane PN = 0) → pokój bez oddawania miasta, także dla chronionego przegrywającego z co najmniej 2 miastami (zamyka lukę z FC kroku 4b: „nigdy nie zawrze pokoju”).
2. KONIEC ZMĘCZENIA WOJNĄ: gdy poziom zmęczenia dotrze do progu końcowego, KAŻDA strona — także silniejsza militarnie — sama proponuje pokój BEZWARUNKOWY (bez miasta i bez płatności); druga strona go przyjmuje. Dotyczy AI↔AI oraz AI → gracz (gracz decyduje sam; silniejszy gracz nie jest zmuszany ani automatycznie nie proponuje). Pokój bezwarunkowy na końcu zmęczenia ZASTĘPUJE regułę „słabsza strona z jednym miastem nie kupi pokoju do końca wojny” (ABC A z poprzedniej decyzji) — ta reguła obowiązuje tylko PRZED końcem zmęczenia.
3. Próg końca zmęczenia: nowy parametr w gra/data/war-weariness-params.json (domyślnie 0,8 — dotychczasowy próg pokoju wzajemnego; ZAŁOŻENIE do potwierdzenia przez właściciela, opisz w raporcie jako wartość domyślną). Poziom 0,5 („zmęczona”: obniżona cena, zdjęta blokada silniejszej) i reszta mechaniki zmęczenia bez zmian.
4. Po takim pokoju zostaje karencja 40 tur (100 dla chronionego) i zaufanie 20 jak dziś.

## Wymagane
- Wylistuj w raporcie wszystkie ścieżki (plik:linia): cena 0, zmęczenie ≥ próg końcowy, AI↔AI, AI→gracz, forced-peace po limicie tur.
- Czyste funkcje (jak w kroku 4b) dla decyzji „proponuj pokój bezwarunkowy”, użyte w ai.ts i main.ts; mutacje czerwienią testy behawioralne (lekcja W45).
- Nowy test gra/tools/diplo-weariness-unconditional-end-test.cjs: (a) cena 0 → pokój bez miasta; (b) zmęczenie < próg końcowy: reguła „jedno miasto nie kupi pokoju” działa; (c) zmęczenie ≥ próg końcowy: silniejsza AI sama proponuje pokój bezwarunkowy, słabsza też; (d) gracz nie jest wciągany automatycznie; (e) karencja 40/100; (f) mutacje.
- Testy zmęczenia (diplo-weariness-city-only-test 28/0, ai-war-weariness-peace-test 98/0, diplo-peace-ai-ai-nonnegative-test 21/0, diplo-peace-weaker-seeks-city-only-test 32/0, diplo-peace-stance-wiring-test 10/0) przepisane TYLKO w asercjach o starych regułach; żaden osłabiony.

## Kryteria końca (binarne)
tsc 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; ai-test 297/0, diplomacy-test 149/0, diplo-war-peace-sim ≤ 3 FAIL (dług S3, S4b, M_TUR); nowy test zielony, mutacje czerwone.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
