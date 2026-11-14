# Obrona — R-WEB-DOCS-CIVPEDIA-WEAKENED-PENALTY-AND-STALE-TEXTS-Q1 (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DOCS-CIVPEDIA-WEAKENED-PENALTY-AND-STALE-TEXTS-Q1
GOAL: odpowiedź na 4 zarzuty Evaluatora (zob. 20-evaluator-claude.md na gałęzi eval-civpedia-weakened-claude) z dowodem; ewentualna poprawka w allowliście.
BAZA: ea788f849 (r1 operatora; rodzic d64cd5d46 = origin/main). Dispatch podaje bazę aa7739998, która nie istnieje w repo.
ZMIANY/COMMIT: kandydat r1 ea788f849 + poprawka `docs/encyklopedia/pojecia/respekt.md` (linia 47) + regeneracja `gra/src/data/wikiBundle.json` narzędziem `gra/tools/bundle-wiki-for-game.cjs` (plik zmieniony, bo bundle zawiera hasła encyklopedii). Commit: patrz sekcja SHA poniżej.

## Odpowiedzi na zarzuty

### Zarzut 1 — „tylko gracz” vs hasło (gracz + AI, bez barbarzyńców): PRZYJMUJĘ
- Kod: `gra/src/main.ts:40752-40756` — zbiór `gdAiOwnerIds` wypełniany z `isAiOwner(humanSeats, c.ownerId)`, czyli AI też jest objęta deficytem złota.
- Kod: `gra/src/main.ts:34660-34677` — `armyHungerBattleOpts` i `goldDeficitBattleOpts` nie ograniczają kary do gracza.
- Barbarzyńcy wyłączeni: `gra/src/game/empire-food.ts:354` (`isArmyHungry` zwraca false dla barbarzyńcy), `gra/src/main.ts:40759-40766` (`if (isBarbarian(oid)) continue`).
- Wniosek: literalne kryterium (1) z dispatchu („tylko gracz”) było błędne względem kodu. Hasło zostaje przy prawdzie z kodu. Orkiestrator powinien odnotować tę korektę dispatchu jako decyzję.

### Zarzut 2 — brak testu pilnującego hasła w bundlu (dowód mutacyjny NIE_ZMIERZONO): ODRZUCAM dodanie testu w tym temacie
- Dowód: allowlista dispatchu nie obejmuje `gra/tools/**` (dispatch: „ALLOWLISTA: docs/encyklopedia/**, docs/PORADNIK-GRACZA/12-dyplomacja.md, gra/src/data/wikiBundle.json (tylko regeneracja), runs/…/**. ZAKAZ: gra/src/**, gra/data/**…”). Nowy test w `gra/tools/` naruszałby allowlistę.
- Liczby hasła (mnożnik 0,75) potwierdzone w `gra/data/econ-params.json:130-132` i `:151-153` (easy/normal/hard = 0,75) oraz w domyślnych wartościach `gra/src/game/combat.ts:390,404`.
- Propozycja (decyzja orkiestratora, nie zakładam sesji): osobny temat testowy na pilnowanie tekstu hasła względem econ-params.

### Zarzut 3 — Poradnik §50.3 opisuje tylko utratę HP, nie mnożnik statów: ODRZUCAM w tym temacie (poza allowlistą)
- Dowód: allowlista dispatchu wymienia wyłącznie `docs/PORADNIK-GRACZA/12-dyplomacja.md`. `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` (§50.3, linie 137-146) nie jest na liście.
- Hasło już odsyła do §50 i w sekcji „Inny mechanizm” rozdziela HP od osłabienia statów, więc nie wprowadza w błąd.
- UWAGA-DLA-ORKIESTRATORA: §50.3 wymaga osobnego tematu (dopisanie mnożnika ×0,75 i warunków głodu/deficytu).

### Zarzut 4 — zdarzenia Respektu „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) nie są wywoływane w grze: PRZYJMUJĘ, z poprawką
- Potwierdzone: `grep` po `gra/src` — tylko definicje/`case` w `gra/src/game/diplomacy.ts:878-879, 1014-1021` i etykiety w `diplomacy-factors.ts:71-72`. Brak wywołań.
- Poprawka w `docs/encyklopedia/pojecia/respekt.md:47`: zdanie „+15 przy 50% przewagi” nie ma pokrycia w kodzie. Próg przewagi w kodzie to `progPrzewagiProc` = 20% (`gra/data/diplomacy-military-strength-params.json:4-6`); żadna wartość 50 nie występuje w tych parametrach. Zapis zmieniony na „próg przewagi w kodzie to `progPrzewagiProc` = 20%”.
- UWAGA-DLA-ORKIESTRATORA (rozbieżność do decyzji właściciela): zadanie #328 w rejestrze zapisuje „+15 przy 50% przewadze”, a kod ma 20%. Trzeba rozstrzygnąć, która wartość obowiązuje (50% czy 20%), zanim ktokolwiek dopnie wywołanie zdarzenia.

## Weryfikacja (wyniki z surowego wyjścia tej rundy)
- `node gra/tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 182 haseł (~1280 KB)`, rc=0. Po regeneracji `git status` pokazuje tylko `respekt.md` i `wikiBundle.json`. Dwie regeneracje (przed i po edycji respekt.md) dały spójny wynik.
- `node gra/tools/ui-text-leftovers-test.cjs` → `== WSZYSTKO ZIELONE ==` (B2, B3, C0, C1 PASS).
- `node gra/tools/diplo-civpedia-values-test.cjs` → `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 155`.
- `git diff --check` → czysto.
- Bramki referencyjne (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test): NIE_ZMIERZONO w tej rundzie. Worktree nie ma `gra/node_modules` (esbuild niedostępny; `npm install` nie wykonany, by nie zużywać dysku). Kod gry (`gra/src/**`) nie został zmieniony w tej rundzie, więc wyniki z rundy 1 pozostają adekwatne, ale nie są zmierzone tutaj. Evaluator podał: logic-test 213/213, tech-tree-test 20/0, research-test 33/0, unit-replace-test 21/21, combat-test 6/6 (wynik Evaluatora, nie mój).
- `tsc --noEmit`: NIE_ZMIERZONO (brak `tsc` w worktree). Zmiany w tej rundzie to pliki `.md` i JSON, nie `.ts`.
- Gra w przeglądarce (#378): NIE_ZMIERZONO (poza zakresem tej rundy).
- `ai-trade-oneshot-overpay-limit-test` (#379): NIE_ZMIERZONO, poza zakresem (dług, osobny temat).

## Poza zakresem (UWAGI-DLA-ORKIESTRATORA)
1. Dispatch: baza `aa7739998` nie istnieje w repo; używam `ea788f849` (rodzic `d64cd5d46` = origin/main).
2. Korekta dispatchu: kryterium „tylko gracz” zastąpione zachowaniem z kodu (gracz + AI, bez barbarzyńców), zob. zarzut 1.
3. Osobne tematy do rozważenia: §50.3 w `08-ekonomia-imperium.md`; test pilnujący tekstu hasła; rozstrzygnięcie 50% vs 20% dla przewagi militarnej (Respekt).
4. Nie zakładano żadnych sesji ani zadań.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 2) weryfikuje poprawkę `respekt.md:47` i regenerację bundla; następnie Final Control. Gra w przeglądarce i bramki referencyjne do zmierzenia przy FC, jeśli wymagane.
DEPLOY/PUSH: NIE WYKONANO
