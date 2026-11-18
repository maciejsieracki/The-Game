# R-WEB-DOC-CIVPEDIA-ROZEJM-POKOJ-WEARINESS-RATE-2-5PCT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja Civpedii)
TEMAT: R-WEB-DOC-CIVPEDIA-ROZEJM-POKOJ-WEARINESS-RATE-2-5PCT-Q1
GOAL: hasło „Rozejm i pokój” podaje tempo zmęczenia 2,5% na turę (zgodnie z pelneTur=40), a nie 5%; wikiBundle.json zregenerowany generatorem; strażnik testowy wyłapuje błędne tempo.
ZMIANY/COMMIT: baza d2df9e43a (origin/main). Allowlista: `docs/encyklopedia/pojecia/rozejm-pokoj.md` (linia 46: „2,5% na turę od startu wojny (100% po 40 turach), +10%…”), `gra/src/data/wikiBundle.json` (wyłącznie `node gra/tools/bundle-wiki-for-game.cjs`; diff po parsowaniu JSON = 2 pola, oba w haśle `pojecia/rozejm-pokoj`: `wikiM` i `full`; `git diff --stat` 1 linia JSON), nowy `gra/tools/diplo-wiki-weariness-rate-consistency-test.cjs`. `zmeczenie-wojna.md` bez zmian (grep nie wykazał błędu). SHA commita: patrz sekcja DEPLOY/PUSH i pole `sha` w wyniku.
TESTY:
- nowy test: `node gra/tools/diplo-wiki-weariness-rate-consistency-test.cjs` → 18 asercji OK, 0 FAIL, exit 0; mutanty „5% na turę” (md i bundle) wykryte = true.
- `tsc --noEmit` (gra/) → exit 0, 0 linii wyjścia.
- bramki referencyjne: logic-test 0, tech-tree-test 0, research-test 0, unit-replace-test 0, combat-test 0.
- wiki/Civpedia: pr141-matrix-only-data-wiki-test 0, civpedia-wikihubhud-rys-historyczny-duplikacja-test 0.
- Zależności: `npm ci --ignore-scripts` w gra/ (71 pakietów); brak czerwieni przed zmianą nie była potrzebna, bo wszystkie uruchomione testy są zielone.
BLOKADY: brak. NIE ZMIERZONO: widok w przeglądarce (tekst statyczny, nie dotyczy zmian wizualnych).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (diff tekstu hasła, test, bramki) → Final Control.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Test akceptuje wartość 10% także w formie „0,10” — hasło „Zmęczenie wojną” (`zmeczenie-wojna.md`) zapisuje przyrost za miasto jako „0,10”, a nie „10%”; zmiany tego hasła nie robiłem (poza allowlistą naprawy wymaganej).
2. Mutacja w teście jest wykonywana na tekście w pamięci (podmiana „2,5% na turę” → „5% na turę”), a nie na kopii pliku na dysku; efekt ten sam.
3. Poza allowlistą, do decyzji orkiestratora (nie ruszałem): stare komentarze/opisy z „5%/turę” po zmianie na 20/40 tur: `gra/src/game/diplomacy-war-peace-profile.ts:306` (komentarz), `gra/data/diplomacy-war-peace-params.json:57` (`_wzor`, zakaz gra/data), `gra/tools/peace-gate-military-strength-test.cjs:91` (komentarz), `gra/tools/diplo-weariness-20-turns-test.cjs` (opis testu o starym tempie). Pozycje „+0,5% na turę” (Asymilacja kultury, `building-cards-top5*`) to inny kontekst — pominięte.
4. Sprzątanie: `node_modules` w `gra/` powstał przez `npm ci` (ignorowany przez git; nie mogłem go usunąć bez rm — do usunięcia przez orkiestratora). Pliki tymczasowe poza scratchpadem: `/tmp/wb-before.json`, `/tmp/tsc-out.txt` (użyte przez pomyłkę zamiast scratchpadu), możliwy pusty katalog `/home/user/tmp` (efekt błędnej ścieżki mkdir). Nie usunąłem ich (zakaz rm/rmdir).
