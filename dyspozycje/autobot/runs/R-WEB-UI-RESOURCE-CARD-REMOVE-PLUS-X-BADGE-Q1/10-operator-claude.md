# R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1
GOAL: Usunąć redundantną plakietkę „+X” obok „Brutto · netto” na kartach surowców (ABC 2026-11-15, A). Wiersz „Brutto · netto” (liczby i klasy kolorów) bez zmian; sekcja „Skąd zapasy” nietknięta.
ZMIANY/COMMIT: `bcc2523ef` (kod, docs, bundle, test). Zakres: `gra/src/ui/empireDetailPanel.ts` (usunięte wywołanie `resRateHtml` w `resCardHtml`, sama funkcja `resRateHtml` i reguły CSS `civ-emp-res-rate*`, poprawiony komentarz przy `resGrossNetLineHtml`), `gra/tools/resource-cards-plusx-badge-test.cjs` (nowy), `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` (akapit o plakietce +X), `gra/src/data/wikiBundle.json` (regeneracja `node gra/tools/bundle-wiki-for-game.cjs`, zmiana jednej linii JSON). `gra/src/game/resource-gross-net.ts` nie zmieniony (nie był potrzebny). Brak zmian w `gra/src/ui/empireDetailPanel.ts` poza usunięciem plakietki; `git diff --check` = 0.
TESTY (liczby z surowego wyjścia, uruchomione w worktree z `gra/node_modules` z `npm ci`):
- TypeScript `npx tsc --noEmit`: exit 0, 0 błędów.
- Logika `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- Kontrakt karty encji `node tools/entity-card-contract-test.cjs`: `75 pass, 0 fail`.
- Katalog surowców `node tools/surowce-katalog-kolejnosc-test.cjs`: `62 pass, 0 fail`.
- `node tools/resource-cards-gross-net-test.cjs` (kryterium d): `22 pass, 0 fail`, w tym M1 i M2 wykryte.
- NOWY `node tools/resource-cards-plusx-badge-test.cjs`: `17 pass, 0 fail`. Pokrywa: A (karta bez `civ-emp-res-rate`, dla 3 kart: drewno, złoto z dyplomacją, glina z ujemnym netto), B (tekst „Brutto +457 · netto +422 / turę” / „Brutto +13 · netto +8” / „Brutto 0 · netto −12” i klasy `good`/`bad`), C (karta bez produkcji i zużycia: bez plakietki i bez wiersza), D (statycznie: brak `resRateHtml` i `.civ-emp-res-rate` w panelu), M1 (mutant z przywróconą plakietką „+X” jest wykrywany, warunek A czerwony).
- Kryterium (b) mutacja: M1 w teście powyżej — wykrywa przywrócenie plakietki.
- Kryterium (c) zrzut Chromium, dwa rozmiary (170 px i 300 px kolumny), przed (HEAD `b97287c88`) i po: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/plusx/card-before-300.png`, `.../card-after-300.png`, `.../card-before-170.png`, `.../card-after-170.png`. Przed: plakietka „+457” widoczna w prawym górnym rogu. Po: plakietki nie ma, „Brutto +457 · netto +422 / turę” bez zmian. Zrzuty z prawdziwego CSS panelu i prawdziwego `resCardHtml` (HTML zbudowany ze źródła), a nie z żywej gry — patrz NIE_ZMIERZONO.
- `git diff --check`: exit 0.
BLOKADY: brak.
RUNDY: 1/5 (ostatni werdykt: brak; to pierwsza runda Operatora).
NASTĘPNY KROK: Evaluator (diff `bcc2523ef` vs `b97287c88`), potem Obrona i Final Control. Do rozstrzygnięcia przez FC: czy aktualizacja `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` i `gra/src/data/wikiBundle.json` mieści się w allowliście (patrz UWAGI).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Baza/kandydat: dispatch podaje kandydata `e67d6c288` (commit „Dispatch: PLUS-X-BADGE start teraz”, gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0`), ale ten commit leży na starej bazie `50f607fe` i NIE zawiera kodu (brak `gra/src/game/resource-gross-net.ts`, brak `gra/src/ui/empireDetailPanel.ts` z kartami). Operator pracował więc na `origin/main` = `b97287c88`, zgodnie z DODATKIEM (BAZA = origin/main, b97287c88) i z instrukcją „bazą kodu jest origin/main”. Worktree był już na `b97287c88` (`git checkout --detach e67d6c288` pominięty celowo). Proszę o potwierdzenie bazy w integracji.
2. Allowlista: `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` i `gra/src/data/wikiBundle.json` nie są w dosłownej allowliście dispatchu (allowlista ma `docs/encyklopedia/**`). Zmieniono je, bo kryterium (e) dispatchu wymaga aktualizacji wikiBundle/docs, jeśli wspominają plakietkę, a jedyne takie miejsce to akapit poradnika 08 (linia 311), którego zostawienie opisywałoby usunięty element. Jeśli FC uzna to za naruszenie allowlisty, do wycofania są dwa pliki i ponowna regeneracja bundla (`node gra/tools/bundle-wiki-for-game.cjs`).
3. Zachowanie po zmianie: karta nie pokazuje już osobnego rozbicia „produkcja ± dyplomacja” (np. „−4 dypl.”, „+3 dypl.”) — ta informacja była tylko w usuniętej plakietce. Netto i brutto nadal ją uwzględniają (brutto = produkcja + przychód umów, netto = po zużyciu). Dla kart z aktywną dyplomacją nie ma już widocznego wydatku umów wychodzących poza netto. To wynika z decyzji A (usuń plakietkę), ale warto to potwierdzić w Evaluatorze.
4. Obserwacja poza zakresem (nie naprawiane): przy kolumnie 170 px wiersz „Brutto · netto / turę” zawija się do dwóch linii („…netto +422 / / turę”). Był tak samo przed zmianą (zrzut przed zmianą pokazuje to samo zawijanie). Nie jest częścią tego tematu.
5. Zrzuty z ikonami surowców: emoji ikon nie renderują się w headless Chromium (brak fontu), to właściwość środowiska, nie zmiana.

NIE_ZMIERZONO:
- Zrzut z żywej gry (przeglądarka z buildem vite i realną turą) nie został wykonany; zrzuty są z HTML zbudowanego ze źródła prawdziwego panelu (CSS wyciągnięty z `ensureStyles`, bez `RESOURCE_CHIP_CSS`, którego nie da się rozwiązać poza buildem).
- Test `resource-cards-plusx-badge-test.cjs` nie był uruchomiony bezpośrednio przeciw HEAD `b97287c88` (red na bazie wynika z obecności plakietki na zrzucie przed zmianą i z mutanta M1, który ją odtwarza).
- Bramki pełnego pakietu (`npm run build`, pozostałe testy z listy §6 R-PROC-AUTOBOT) nie były uruchamiane; wybrano bramki dotykające kart surowców, plus tsc i logic-test.
- Nie uruchamiano `npm run build` (zakaz z procesu).

ZAŁĄCZNIKI (poza repo, do wglądu): zrzuty w `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/plusx/` (`card-before-170.png`, `card-after-170.png`, `card-before-300.png`, `card-after-300.png`); skrypt generujący HTML: `.../scratchpad/plusx/shot.cjs`.
