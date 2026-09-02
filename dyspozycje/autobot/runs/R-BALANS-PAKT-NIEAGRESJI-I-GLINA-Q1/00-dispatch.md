TEMAT:  R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat BALANSU/DANYCH (nie wizualny) — Operator
Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control
Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, dwie jawne, precyzyjne decyzje balansu w tej samej turze
rozmowy:
1. "Jeżeli chodzi o pakt o nieagresję, zwiększymy poziom relacji z 50 na
   90, żeby został zawarty."
2. "Dodatkowo zmniejsz produkcję gliny na łąkach z pięciu do dwóch oraz
   dodatek od rzeki z dziesięciu na pięć."

## RECON (wykonany, nie powtarzaj)
**Część 1 — próg Relacji dla paktu nieagresji:** stała
`progNapRelacja: 50` w `gra/src/game/diplomacy.ts:204` (lista pól
`ULEPSZENIA`-stylu progów w `diplomacy.ts:482` też ją wymienia — sam klucz
konfiguracyjny, nie osobna wartość do zmiany). Używana w
`diplomacy-proposals.ts:997` (`napThreshold = max(0, p.progNapRelacja +
napExpansionSurcharge - napEase)`) i w `ai.ts:4443-4449` (decyzja AI o
zaproponowaniu paktu). Komentarz `diplomacy-proposals.ts:714` i
`diplomacy-acceptance-points.ts:163,175` PRZYWOŁUJE wartość `50` WPROST w
treści komentarza/przykładzie liczbowym — te komentarze staną się
nieaktualne po zmianie i wymagają aktualizacji (nie tylko kod).
`gra/tools/diplomacy-acceptance-points-test.cjs`,
`gra/tools/diplomacy-proposal-test.cjs`,
`gra/tools/dyplo-pakt-ekspansja-granica-test.cjs`,
`gra/tools/diplomacy-test.cjs`,
`gra/tools/diplomacy-negotiation-table-test.cjs`,
`gra/tools/diplomacy-locks-test.cjs` — sprawdź każdy pod kątem
zahardkodowanych oczekiwań na progu 50/scenariuszy Relacji w okolicy 50-70
(które dziś przechodzą próg, a po zmianie na 90 przestaną) — zaktualizuj
TYLKO te, które wprost testują próg paktu nieagresji, nie inne.

**Część 2 — baza gliny na łące + bonus rzeki:** `gra/data/terrain-yields.json`,
`terrain_types` → wiersz `"Teren": "Łąka"` ma `"Glina": 5` (docelowo `2`);
`terrain_modifiers` → wiersz `"Modyfikator": "Rzeka"` ma `"Glina": 10`
(docelowo `5`). Oba pola mają kolumnę `"Suma"` (suma wszystkich surowców
tego wiersza) — sprawdź czy `Suma` jest używana gdziekolwiek w kodzie (nie
tylko dokumentacyjna) i jeśli tak, przelicz ją spójnie z nową wartością
Gliny; jeśli `Suma` jest czysto informacyjna w danych (nieużywana przez
`economy.ts::terrainRowToTileYield`, który czyta tylko nazwane pola) —
zaktualizuj ją mimo to dla spójności danych, bez zmiany logiki. Odczyt
wartości: `economy.ts:376-405` (`terrainRowToTileYield`/`buildTerrainYields`/
`terrainModifier`), zastosowanie bezwarunkowe w `economy.ts:430-435`
(`tileYield()`: `if (tile.maRzeke) { glina += RIVER_MODIFIER.glina }`) —
kod NIE wymaga zmian, to WYŁĄCZNIE zmiana danych w JSON.

## GOAL
1. Zmień `progNapRelacja` z `50` na `90` w `gra/src/game/diplomacy.ts`.
   Zaktualizuj komentarze, które wprost cytują starą wartość liczbową jako
   przykład/dowód (nie usuwaj kontekstu wyjaśniającego, tylko liczbę).
   Zaktualizuj testy, które zahardkodowały próg 50 lub scenariusz Relacji
   w przedziale (50, 90) jako "pakt powinien przejść" — dopasuj do nowego
   progu z jawną notatką w raporcie dla każdej zmienionej asercji.
2. Zmień w `gra/data/terrain-yields.json`: `Łąka.Glina` z `5` na `2`,
   `Rzeka (modyfikator).Glina` z `10` na `5`. Zaktualizuj kolumnę `Suma`
   tych dwóch wierszy zgodnie z nowymi wartościami (suma pozostałych pól +
   nowa Glina). Zero zmian w innych terenach/modyfikatorach/polach.
Dwie części są NIEZALEŻNE (różne systemy, zero współdzielonych plików) —
możesz je wykonać w dowolnej kolejności, ale raportuj osobno.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `progNapRelacja === 90` w `diplomacy.ts`, potwierdzone odczytem pliku
   po zmianie.
2. Żywy test (rozszerzony/istniejący, node): scenariusz z Relacją 70 (dawny
   próg+20, dziś PONIŻEJ nowego progu 90) — propozycja paktu ODRZUCONA
   ("Relacja zbyt niska"); scenariusz z Relacją 90 — propozycja
   ZAAKCEPTOWANA (przy zerowym `napExpansionSurcharge`/`napEase`, spełnione
   inne warunki: brak wojny, brak istniejącego paktu, brak ekspansji przy
   granicy).
3. `Łąka.Glina === 2` i `Rzeka.Glina === 5` w `terrain-yields.json`,
   potwierdzone odczytem pliku po zmianie.
4. Żywy test (rozszerzony/istniejący, node): `tileYield()` dla łąki bez
   rzeki zwraca `glina === 2`; dla łąki PRZY rzece zwraca `glina === 7`
   (2+5); dla równiny przy rzece nadal `glina === 5` (0+5, teren równiny
   NIETKNIĘTY tym zleceniem).
5. Diff ograniczony do plików w ALLOWLIŚCIE. Zero zmian w innych progach
   dyplomacji ani innych terenach/surowcach.
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + testy dyplomacji i ekonomii wymienione w RECON bez regresu (poza
   jawnie udokumentowanymi, uzasadnionymi aktualizacjami asercji progu/
   wartości opisanymi w GOAL).

## ALLOWLISTA — nic poza tym
`gra/src/game/diplomacy.ts` (WYŁĄCZNIE wartość `progNapRelacja` + literalne
liczby w komentarzach bezpośrednio ją cytujących), `gra/src/game/
diplomacy-proposals.ts` i `gra/src/game/diplomacy-acceptance-points.ts`
(WYŁĄCZNIE liczby `50`/`70` w komentarzach cytujących stary próg jako
przykład — zero zmian w logice/kodzie wykonywalnym), `gra/data/
terrain-yields.json` (WYŁĄCZNIE pola `Glina`/`Suma` wierszy `Łąka` i
`Rzeka`), testy wymienione w RECON — WYŁĄCZNIE asercje wprost dotyczące
progu paktu nieagresji lub gliny na łące/rzece. Zakazane bezwzględnie:
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, jakakolwiek inna
stała/próg dyplomacji lub inny teren/surowiec w `terrain-yields.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryteriów 2/4 za spełnione bez REALNEGO uruchomienia funkcji
(`evaluateProposal`/`tileYield`) z konkretnymi danymi wejściowymi — nie
wystarczy sam odczyt zmienionej stałej/JSON. Zakaz "przy okazji" zmiany
innych progów/terenów niewymienionych explicité w GOAL, nawet jeśli
wydają się niespójne po tej zmianie — to nie jest zakres tego zlecenia.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5) → Evaluator (Sonnet 5, zarzuty, lista może być pusta) →
Operator (Obrona, Sonnet 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
