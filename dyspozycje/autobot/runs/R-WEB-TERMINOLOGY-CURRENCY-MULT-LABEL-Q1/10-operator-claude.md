STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-CURRENCY-MULT-LABEL-Q1
GOAL: Zmienić etykietę „Mnożnik handlu/waluty” na „Mnożnik waluty” (bez zmian mechaniki, nazw pól i kluczy); poprawić poradnik i komentarz w civ-matrix-semantic.ts zgodnie z silnikiem.
BAZA: origin/main af12355440db400634db0b4a8fabbc8ae5786067 (worktree wf_db833968-8a5-1, detach).

ZMIANY/COMMIT (allowlista):
- docs/encyklopedia/cywilizacje/{celtowie,chinczycy,egipt,germanie,grecy,inkowie,rzymianie,sumer,zulusi}.md — linia 50: „Mnożnik waluty: **X** (meta macierzy).” (9 plików)
- gra/tools/gen-cyw-encyklopedia.py — szablon linii 148 (generator, by regeneracja nie cofnęła etykiety)
- docs/PORADNIK-GRACZA-SPIS-TRESCI.md:2352 — było „**Mnożnik handlu** — więcej złota z suwaka Daniny”; jest „**Mnożnik waluty** — mnoży podatek miasta przed podziałem suwakiem (działa, gdy Mennica i Waluta są aktywne)”. Obietnica wpływu na złoto usunięta.
- gra/src/data/wikiBundle.json — regenerowany `node gra/tools/bundle-wiki-for-game.cjs` (1 linia diff; baza odtwarzalna: regeneracja na bazie = brak diffu).
- gra/src/game/civ-matrix-semantic.ts:96 — tylko komentarz (wpis meta_mnoznik_waluta): usunięte odwołanie turn-economy.ts:297 (tam brak użycia), dopisano, że silnik mnoży podatek przez mennicaMnoznikPoWalucie (economy.ts). Kod wykonywalny bez zmian.
- gra/tools/pr141-matrix-only-data-wiki-test.cjs:66 — regex dopasowujący nową etykietę (test bez tej zmiany padłby po rename).
- UI (gra/src): brak napisów „Mnożnik handlu/waluty” — nic nie zmieniano.
- Raport: dyspozycje/autobot/runs/R-WEB-TERMINOLOGY-CURRENCY-MULT-LABEL-Q1/10-operator-claude.md
Pozostawione celowo: dyspozycje/** (historia rejestrów i runów), gra-robocza/**, Gra-FINALNA.html (artefakty/historia, poza zakresem).
SHA: patrz commit wykonany po tym raporcie (czubek gałęzi detach).

TESTY (surowe wyniki):
- npx tsc --noEmit (gra/): exit 0, brak błędów.
- node gra/tools/pr141-matrix-only-data-wiki-test.cjs: „15 civ rows and 9 bundled CivPedia pages passed”, exit 0.
- node gra/tools/terminology-trade-vs-tax-test.cjs: „795 pass, 1 fail” — PO ZMIANIE. Ten sam wynik na bazie origin/main (zmierzone: 795 pass, 1 fail). Jedyny FAIL: [G] gen-building-cards-top5 --check, building-cards-top5.json NIEZGODNY z generatorem (dług bazowy, nie naprawiany). Dispatch podawał 798/1 — nie odtworzone na bazie.
- node gra/tools/ids-leak-audit-test.cjs: WYNIK 1648 ok, 0 FAIL, exit 0.
- node gra/tools/wonder-text-no-raw-ids-test.cjs: WYNIK 132 ok, 0 FAIL, exit 0.
- node gra/tools/city-administrator-test.cjs: 117 passed, 0 failed, exit 0.
- node gra/tools/city-administrator-economy-test.cjs: 72 passed, 0 failed, exit 0.
- grep „Mnożnik handlu/waluty” poza wyjątkami (dyspozycje/, gra-robocza/, Gra-FINALNA.html): 0 trafień.
- git diff --check: czysto.
- Nie uruchamiano npm run build/dev (zakaz). npm ci --ignore-scripts wykonane w gra/.

BLOKADY:
- Oryginalny dispatch 00-dispatch.md dla tego ID NIE istnieje w origin/main (sprawdzone `git show origin/main:...`). Użyto wyłącznie DODATKU (origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 .../00-dispatch-DODATEK-claude.md). Założenie: DODATEK zawiera pełny zakres.
- Brak blokad technicznych.

ZAŁOŻENIA / NOTATKI DLA ORKIESTRATORA:
1. Engine: mnoznikHandelPieniadzForCiv / mnoznikHandelPieniadzForCivByDifficulty są wywoływane tylko z testów (gra/tools). Realny mnożnik w economy.ts (handelNetto = handelNettoRaw * walutaMnoznikAktywny) to params.mennicaMnoznikPoWalucie (domyślnie 1,5), a nie wartość meta z macierzy, która jest pokazywana w encyklopedii („meta macierzy”). Rozbieżność wartości w encyklopedii vs silnik NIE jest rozstrzygana w tym temacie — do decyzji ABC/osobnego tematu.
2. Nowa treść poradnika jest neutralna (bez „więcej złota”); wpływ na skarb nie jest obiecywany.
3. Zakres poszerzony o gen-cyw-encyklopedia.py i pr141 test (konieczne dla spójności i zielonego testu) — zgodne z duchem dispatchu.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diffu allowlisty, wikiBundle regeneracja, testy wyżej) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
