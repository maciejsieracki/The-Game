STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1
GOAL: (1) liczniki rekrutacji trzymane dopóki panel otwarty, (2) zerowane po zamknięciu każdą ścieżką, (3) dodatek właściciela: machiny oblężnicze bez odblokowanej technologii w ogóle niewidoczne.
ZMIANY/COMMIT: start f6f9904bf; kod: gra/src/ui/empireDetailPanel.ts (guard `if (open)`), gra/src/ui/siegeMapPanel.ts (usunięcie bloku machin gdy lista pusta); nowy test gra/tools/recruit-reset-close-and-siege-visibility-test.cjs; zrzuty w katalogu runu. SHA końcowy: pole sha zwrotki (commit tej obrony).
TESTY (surowe wyjścia):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20 pass/0 fail; research 33/33; unit-replace 21/21; combat 6/6
- empire-mass-recruitment 48/0; empire-recruit-panel-no-inner-scroll 17/0; army-recruitment-concentration 30/0; ui-resource-chip-no-raw-html 9/0; siege-engines-built-during-siege 33/0; empire-recruit-panel-real-render 29/0
- NOWY recruit-reset-close-and-siege-visibility: 11 PASS / 0 FAIL (prawdziwy Chromium, prawdziwe moduły)
- Mutanty nowego testu: no-open-guard 9 PASS/2 FAIL; no-clear 5/6 FAIL; keep-empty-block 10/1 FAIL
- empire-army-city-recruit-no-inner-scroll: 14 PASS/2 FAIL ("precondition >8 pozycji -- 6") -- identycznie na bazie 1a42785d4 (zmierzone w osobnym worktree): dług istniejący, spoza listy kryteriów tematu.

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. Nowy test w Chromium na prawdziwym empireDetailPanel: prawdziwy klik w Zamknij, prawdziwy Escape (page.keyboard.press), prawdziwy klik w tło (page.mouse.click) -> panel zamknięty, szkice 0, localStorage `civ-army-recruit-drafts-v1` = null. Zrzuty: close-paths-przed-zamknieciem.png, close-paths-po-zamknieciu-tlo.png. Mutant no-clear czerwieni wszystkie 3 ścieżki.
2. PRZYJMUJĘ. hideEmpireDetailPanel zeruje szkice tylko gdy `open` (`if (open) clearArmyRecruitDraftsOnPanelClose();`). Dowód: test "hide przy zamkniętym panelu NIE zeruje szkiców (6)"; mutant no-open-guard FAIL (total 0). Brak przeżycia przeładowania strony jest zamierzony (wymaganie właściciela: po Zamknij zera) -- odnotowane. ZAŁOŻENIE: szkice wpisane w panelu miasta przy zamkniętym panelu imperium nie są zerowane zamknięciem panelu imperium (poza zakresem zgłoszenia).
3. PRZYJMUJĘ. siegeMapPanel.ts: gdy getSiegeEngineOptions zwraca [], blok `[data-siege-engine-build]` (nagłówek + kwota + wiersz) jest usuwany z DOM. Dowód: test DOM; mutant keep-empty-block FAIL (heading "Zbuduj machinę w oblężeniu", block 1). Zrzut: siege-panel-bez-machin.png.
4. PRZYJMUJĘ. Dodany test DOM w Chromium panelu oblężenia (lista = dokładnie opcje z getSiegeEngineOptions; 1 opcja Taran -> jeden przycisk Taran). Zrzut: siege-panel-tylko-taran.png. Filtr w main.ts nadal pokryty testem siege-engines (33/0).
5. ODRZUCAM jako błąd kodu, ZAKŁADAM: filtr działa dosłownie wg zasady właściciela ("tylko dostępne zgodnie z technologią"). Taran ma Tech "Obróbka drewna", nowa gra startuje z pustym zbiorem zbadanych (main.ts:45572), więc w turze 0 lista jest pusta, a Taran pojawia się po zbadaniu Obróbki drewna (poziom 1, koszt 5). NIE_ZMIERZONO w żywej pełnej grze. DO ORKIESTRATORA (ABC): czy Taran ma być dostępny od startu bez badania (wtedy decyzja produktowa/dane, nie ta runda).
6. PRZYJMUJĘ jako notatkę procesową: main.ts, siege-engine-build.ts, siegeMapPanel.ts, siege-engines-built-during-siege-test.cjs i nowy test wykraczają poza pierwotną allowlistę; uzasadnienie: dodatek właściciela o niewidoczności machin. Orkiestrator powinien formalnie rozszerzyć allowlistę. Oryginalny 00-dispatch.md nie istnieje na origin/main (na origin/claude/... jest tylko DODATEK).

BLOKADY: brak (poza wcześniej istniejącym długiem empire-army-city-recruit-no-inner-scroll).
RUNDY: obrona po rundzie 1/5.
NASTĘPNY KROK: Evaluator/Final Control na tej samej gałęzi; ABC o Taranie od startu (pkt 5).
DEPLOY/PUSH: NIE WYKONANO
