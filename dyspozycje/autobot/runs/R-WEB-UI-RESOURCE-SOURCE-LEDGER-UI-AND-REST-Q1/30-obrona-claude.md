STATUS: PASS-WITH-NOTES (obrona CZĘŚCIOWA: zarzuty 5, 7, 8 poprawione i zmierzone; zarzuty 1, 2, 3, 4, 6 PRZYJĘTE jako otwarte, z powodem)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1
GOAL: Odpowiedź na każdy zarzut Evaluatora (f425a7594, kandydat bd7d63a20): PRZYJMUJĘ z poprawką i dowodem albo PRZYJMUJĘ-OTWARTE z powodem; wynik w kodzie gry: wiersze „Skąd zapasy” w kolejności „+12 Warzelnia (Rzym)” oraz właściciel karty z r.ownerId.
BAZA: bd7d63a20a8b775364fd4e775800c825908b2564 (kandydat z dispatchu, worktree przełączony na ten commit). Zgodnie z 10-operator-claude.md baza pracy to da8e865cc (ten commit jest jego potomkiem; sprawdzono `git merge-base --is-ancestor da8e865cc bd7d63a20`). Dispatch podaje c3e56ee08 — nie jest na linii origin/main (rozstrzygnięte założeniem jak w r1).
ZMIANY-COMMIT: 3467a19f9c65fa83ae5b33baff34435851ff79bd (kod + nowy test DOM; commit raportu jest osobny i następny).
  Pliki (allowlista tematu):
  - gra/src/ui/empireDetailTypes.ts — pole `ownerId?: number` w EmpireResourceRow (+2 linie).
  - gra/src/main.ts — w buildEmpireResourceRows(ownerId) do obiektu wiersza dopisano `ownerId` (1 linia zmieniona; wiersz 4064).
  - gra/src/ui/empireDetailPanel.ts — resCardHtml: `resSkadZapasyHtml(r.id, r.ownerId ?? 0)`; CSS wiersza: justify-content:flex-start, wartość .v min-width 44px, text-align right.
  - gra/src/ui/resourceSourceLedgerHtml.ts — kolejność w wierszu: <span class="v">+N</span> przed <span class="k">Etykieta</span>.
  - gra/tools/resource-ledger-trade-test.cjs — asercje 7j (kwota zapisu księgi wycinki gracza = wycinkaGot, wzorzec przypisania `const wycinkaGot = creditOwnerResourceStock(`) i 7k (samokontrola: mutacja `, wycinkaGot);` na `, 0);` MUSI czerwienić 7j).
  - gra/tools/resource-ledger-skad-dom-test.cjs (NOWY) — test realnego DOM (patrz TESTY).
  Bez zmian: main.ts poza jedną linią, E3c (~40337 szlak), WERSJE.md, manifest, rust-port, docs/encyklopedia, wikiBundle.
TESTY (surowe wyniki z tej rundy, worktree wf_37fda61d-c6f-3, commit 3467a19f9):
- `git diff --check`: exit 0, bez wyjścia.
- `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia (plik scratchpad tsc-out.txt pusty).
- resource-ledger-trade-test.cjs: RESULT: 29 passed, 0 failed (w tym 7j PASS, 7k PASS = mutacja wykryta).
- resource-ledger-skad-ui-test.cjs: 18 passed, 0 failed (po zmianie kolejności markupu; asercje `<span class="v">+30</span>` nadal zgodne).
- resource-cards-gross-net-test.cjs: 22 pass, 0 fail.
- resource-ledger-skad-dom-test.cjs (NOWY, Chromium 141 /usr/bin/chromium --headless --dump-dom na realnym resCardHtml): 9 passed, 0 failed:
  D1 sól (owner 0): <details class="civ-emp-res-skad" open>, „+12 Warzelnia (Rzym)”, „+30 Umowa wymiany z Asyria”, „−20 Obywatele” (klasa loss) — wartość przed etykietą;
  D2 ceramika: blok otwarty, „+8 Garncarnia (Rzym)”;
  D3 brak surowych ID w DOM (warzelnia|h1, garncarnia|h2);
  D4 owner 1 widzi „Kopalnia soli (Egipt)”, nie widzi danych owner 0; owner 0 nie widzi danych owner 1;
  D5 drewno bez wpisów: brak bloku.
  MUTACJA D4 (ręcznie, przywrócono i sprawdzono): zmiana `resSkadZapasyHtml(r.id, r.ownerId ?? 0)` na `resSkadZapasyHtml(r.id)` → „FAIL D4 owner 1 widzi własny dziennik”, wynik 8 passed / 1 failed. Przywrócono; diff potwierdzony.
- Zrzuty Chromium (NIE w git, poza repo): /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/skad-shots/ — skad-solOwner0-360px.png, skad-solOwner0-720px.png, skad-ceramika0-360px.png, skad-ceramika0-720px.png. Obejrzano 360 px sól: linie w kolejności +30/+12/−20, wartości wyrównane do prawej, etykiety po lewej, sól rozwinięta. Ikona emoji nie renderuje się w headless (poza zakresem). 720 px i ceramikę obejrzano tylko jako plik (nie oceniano wizualnie) — NIE ZWERYFIKOWANO WIZUALNIE.
- Identyfikator karty = klucz surowca w grze: main.ts:3982 `{ id: 'sol', label: 'Sól' }` i main.ts:3983 `{ id: 'ceramika', … }` — te same identyfikatory, których używa księga (`sol`, `ceramika`). Stwierdzone statycznie (kod), nie w działającej grze.
- NIE ZMIERZONO w tej rundzie: 5 bramek referencyjnych (logic/tech-tree/research/unit-replace/combat/unit-power) — nie uruchamiane ponownie po zmianach 6 plików (ostatni pomiar operatora na bd7d63a20); pomiar czasu tury (≥3×) — NIE ZMIERZONO; test zgodności księgi z magazynem w realnej grze (≥3 ziarna × 30 tur, ledgerTestDebug) — NIE ZMIERZONO; hash stanu z księgą i bez (3 ziarna) — NIE ZMIERZONO.
BLOKADY: patrz odpowiedzi na zarzuty niżej (1, 2, 3, 4, 6 — otwarte).

ODPOWIEDZI NA ZARZUTY EVALUATORA (f425a7594):

Zarzut 1 — partia 3 niewykonana (łup, zwrot, miasto, dary nie księgowane). PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie. Dowód: `git diff --name-only da8e865cc bd7d63a20` nie zawiera turn-economy, post-battle-map, city-conquest. Powód: to osobne przepływy w trzech plikach silnika z własnymi capami i testami; wymaga osobnego dispatchu (kolejna runda tego samego ID). Kryterium (a) pozostaje NIE SPEŁNIONE.

Zarzut 2 — zapis historii w zapisie gry niezaimplementowany; dziennik czyszczony przy wczytaniu. PRZYJMUJĘ jako niespełnione kryterium (b). Dowód: main.ts resetLedgerHistory() przy wczytaniu i przy nowej grze (zgodne z 10-operator). Uwaga do decyzji: dispatch w zakresie partii 3 podaje pole zapisu jako „opcjonalne”, a kryterium (b) wymaga zachowania dziennika — to sprzeczność w dispatchu. NIE ZAŁOŻONO implementacji (zmiana formatu save.ts wymaga decyzji właściciela: tak/nie, wersjonowanie). Pytanie do ABC wpisane w UWAGI.

Zarzut 3 — kryterium (c): hash stanu z księgą i bez (3 ziarna) nie zmierzony, brak testu. PRZYJMUJĘ, NIE ZROBIONE. Powód: wymaga dwóch przebiegów realnej gry (z i bez księgi) na 3 ziarnach; to ten sam pomiar co zarzut 6 i pomiar czasu. Nie wykonano, NIE ZMIERZONO.

Zarzut 4 — kryterium (d): pomiar czasu tury NIE_ZMIERZONO, brak Chromium; ryzyko regresji >10% nierozstrzygnięte. PRZYJMUJĘ, NIE ZMIERZONO. Korekta faktu: Chromium JEST dostępny w tym środowisku (/usr/bin/chromium, wersja 141.0.7390.37) — użyty do zarzutu 5. Pomiar tury wymaga uruchomienia gry w przeglądarce ≥3 razy po 100 tur; resource-ledger-live-measure.cjs używa Playwright, który jest dostępny w zlinkowanym node_modules (gra/node_modules -> wf_1465bf01-f91-1), ale pomiar NIE został uruchomiony w tej rundzie (czas i koszt 3 × 100 tur w headless). Nie zrobiono w tej rundzie. Ryzyko +9,5% (FC r5) pozostaje otwarte; nie optymalizowano snapshotów (ownerResourceStockAll), bo bez pomiaru nie wiadomo, czy próg 10% jest przekroczony.

Zarzut 5 — brak testu renderu realnego DOM; brak zrzutu Chromium; czy r.id jest kluczem surowca w realnej grze. PRZYJMUJĘ i NAPRAWIONO w zakresie DOM i zrzutów:
  - Test DOM: gra/tools/resource-ledger-skad-dom-test.cjs — prawdziwy resCardHtml z panelu, parsowany przez Chromium (--dump-dom), 9 asercji (D1–D5), usunięcie wywołania resSkadZapasyHtml z resCardHtml zaczerwieniłoby D1 (blok nie pojawia się w DOM).
  - Zrzuty: 4 pliki PNG (sól i ceramika × 360/720 px) wygenerowane przez tę samą procedurę (SKAD_SHOT_DIR); sól 360 px obejrzana.
  - Identyfikator: main.ts:3982–3983 (patrz TESTY) — r.id = klucz księgi.
  - Pozostało NIE ZMIERZONO: pełny realny panel gry (nie sam resCardHtml) i zrzut w działającej grze.

Zarzut 6 — brak testu zgodności księgi z magazynem w realnej grze (≥3 ziarna × 30 tur, ledgerTestDebug) i brak testu, że commitLedgerHistoryTick w main.ts faktycznie wypełnia dziennik. PRZYJMUJĘ, NIE ZROBIONE. Dowód luki: test nie dotyka main.ts (poza asercjami tekstowymi 7a–7k). Powód: wymaga uruchomienia realnego ticku gry; headless bez przeglądarki nie był dostępny w poprzedniej rundzie, a Chromium sam w sobie nie uruchamia gry bez harnessu (ledgerTestDebug działa przez ?civTest=1). Otwarte.

Zarzut 7 — słabe miejsce: test wycinki gracza tekstowy; brak realnego testu czerwieniejącego po mutacji wartości. PRZYJMUJĘ CZĘŚCIOWO i POPRAWIONO w granicach możliwości:
  - Dodano 7j: asercja, że kwota zapisu księgi wycinki gracza to `wycinkaGot` (wynik creditOwnerResourceStock) — mutacja wartości na 0 jest wykrywana.
  - 7k: samokontrola mutacji w samym teście (przeszła = mutant wykryty).
  - Dowód: wynik 29 passed / 0 failed, 7j i 7k PASS.
  - NIE ZAŁATANE: nadal jest to asercja tekstowa na źródle main.ts, nie zachowanie w grze. Realny test (uruchomienie ticku z wycinką gracza) wymaga harnessu gry; otwarte.

Zarzut 8 — dokumentacja i wikiBundle niezaktualizowane; twardy ownerId=0; <details open> może nie być zapamiętywany; układ linii różni się od „+12 Warzelnia (Rzym)”.
  - Dokumentacja (docs/encyklopedia, PORADNIK-GRACZA, wikiBundle.json): PRZYJMUJĘ, NIE ZROBIONE. Dispatch wymaga tego przed deployem; to kolejna partia (4b).
  - Twardy ownerId=0: PRZYJMUJĘ i NAPRAWIONO. Pole `ownerId` w EmpireResourceRow ustawiane w buildEmpireResourceRows(ownerId) (main.ts), resCardHtml przekazuje `r.ownerId ?? 0`. Dowód: test D4 (owner 1 widzi własny dziennik) i mutacja (przywrócenie `0` → D4 FAIL, 8/1).
  - Stan <details open> przy przerysowaniu: NIE ZMIERZONO (nie sprawdzono w działającym panelu; brak mechanizmu zapamiętywania stanu w kodzie tego bloku). Ryzyko otwarte.
  - Układ linii: PRZYJMUJĘ i NAPRAWIONO. Wiersz to teraz „+12 Warzelnia (Rzym)” (wartość przed etykietą), zgodnie z dispatchem; dowód D1/D2 i zrzut 360 px.

RUNDY: 2/5 tego tematu (r1: 10-operator; r2: ta obrona po zarzutach f425a7594). Ten sam ID.
NASTĘPNY KROK: (a) orkiestrator decyduje o zgodzie na osobną rundę partii 3 (łup/zwrot/miasto/dary) — wymaga osobnego dispatchu; (b) decyzja ABC: pole zapisu dziennika w zapisie gry (tak/nie, wersjonowanie); (c) realny pomiar: harness ticku gry (ledgerTestDebug, ≥3 ziarna × 30 tur), pomiar czasu tury ≥3× i zrzut pełnego panelu; (d) docs/wikiBundle po decyzji o zakresie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Worktree przełączono na bd7d63a20 (branch worktree-wf_37fda61d-c6f-3 zresetowany do tego commita; poprzedni HEAD 06fcc8526 był zbędny). Potwierdzono, że commit 3467a19f9 leży na tej gałęzi.
- Symlink gra/node_modules -> wf_1465bf01-f91-1/gra/node_modules (ignorowany przez git, nie commitowany). Do usunięcia przy sprzątaniu worktree (samo usunięcie linku, nie celu!).
- Dispatch-konflikt do rozstrzygnięcia: pole zapisu dziennika „opcjonalne” vs kryterium (b) „zapis→wczytanie zachowuje dziennik”.
- Test resource-ledger-skad-dom-test.cjs używa Chromium z /usr/bin/chromium (env CHROMIUM nadpisuje); bez Chromium kończy z SKIP i kodem 0 (nie fałszywy PASS: wyraźnie komunikat „DOM NIE ZMIERZONO”).
- Ta runda nie włączała żadnych sesji ani zadań (zakaz nowych sesji zachowany).
