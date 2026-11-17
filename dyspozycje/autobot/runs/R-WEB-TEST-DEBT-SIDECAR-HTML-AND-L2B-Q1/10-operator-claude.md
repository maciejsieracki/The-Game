STATUS: PASS-WITH-NOTES (kod gry nietknięty; zmiany wyłącznie w narzędziach testowych gra/tools)
DOMAIN: GAME (tylko testy/narzędzia; kod gry NIE)
TEMAT: R-WEB-TEST-DEBT-SIDECAR-HTML-AND-L2B-Q1
GOAL: (1) naprawić live testy r3/r4 i line-advance-browser, które na main dostawały HTML zamiast sidecarów; (2) diplo-truce-live: dopisać gałąź odmowy (oferta pokoju stałego dla gracza, timeout = wojna bez kary) albo jawnie oznaczyć NIE POKRYTE.
BAZA: origin/main = 7ac79dafb (`git merge-base --is-ancestor 7ac79dafb HEAD` = TAK). Worktree od 7ac79dafb, pliki z kandydata r1 (40bfc81e5) wzięte tylko dla 4 plików tools (na main identyczne z bazą r1).
ZMIANY-COMMIT: allowlista zachowana (5 plików gra/tools + runs/R-WEB-TEST-DEBT-SIDECAR-HTML-AND-L2B-Q1/**):
- gra/tools/battle-doctrine-live-r3-test.cjs: serwer statyczny po ścieżce z outDir (404 zamiast index.html dla brakujących plików), 'favicon' 204, klik START WALKI z timeoutem 120 s, tempo _setSpeedIdx(9), okno rundy 8 = 400 s. Progi i asercje bez zmian.
- gra/tools/battle-doctrine-live-r4-test.cjs: ten sam serwer statyczny + klik START WALKI z timeoutem 120 s (sam serwer nie wystarczał: klik wisiał na "waiting for scheduled navigations" po 30 s). Asercje bez zmian.
- gra/tools/battle-line-advance-uniform-browser-entry.ts: import.meta.glob zamiast dynamicznego importu; brak pliku sceny = czytelny błąd "NIE ZMIERZONO".
- gra/tools/battle-line-advance-uniform-browser-test.cjs: wariant bez pliku sceny = rekord NIE ZMIERZONO (bez czekania 90 s); błąd ładowania / pageerror = exit != 0.
- gra/tools/diplo-truce-live-test.cjs: nowa sekcja L2f–L2h (odmowa gracza): po zawarciu rozejmu z AI (inicjator AI, adresat = gracz) tura wygaśnięcia zostawia ofertę w skrzynce (status nadal pokoj), kolejna tura bez odpowiedzi = wojna, bez nowej kary 'zlamanie_paktu_nap' i bez nowej flagi agresora. Nagłówek/komunikat L2b-odmowa zaktualizowany (odmowa AI = NIE_ZMIERZONO).
COMMIT: patrz SHA w polu sha raportu orkiestratora (commit tylko tych plików, bez git add -A).

## Tabela: skrypt | wynik przed (main 7ac79dafb) | klasa | działanie | wynik po

| skrypt | wynik przed | klasa | działanie | wynik po |
|---|---|---|---|---|
| battle-doctrine-live-r3-test.cjs | FAIL: 3× "Unexpected token '<'" (sidecar dostaje HTML); klik START WALKI timeout 30 s | A/routing serwera testu + D (czas, SwiftShader) | serwer statyczny + klik 120 s + tempo | PASS 6/6, 2 powtórzenia (fix-r3-1, fix-r3-2) |
| battle-doctrine-live-r4-test.cjs | FAIL: 13× "Unexpected token '<'" (4/5 asercji PASS, "no browser page or console errors" FAIL); po samej zmianie serwera: klik timeout 30 s | A/routing + D | serwer statyczny + klik 120 s | PASS 5/5, 2 powtórzenia (fix-r4-2, fix-r4-3) |
| battle-line-advance-uniform-browser-test.cjs (+entry) | scena 'after' PASS (errors []); scena 'before' (brak src/battle/battleScene.orig-before.ts) wisi 90 s w waitForFunction i przerywa cały przebieg bez JSON | A/D (brak pliku + routing dev-servera zwraca index.html) | entry: import.meta.glob; test: NIE ZMIERZONO dla braku pliku | after: PASS (errors []); before: NIE ZMIERZONO (brak pliku, z powodem). 1 przebieg |
| diplo-truce-live-test.cjs | 24 pass / 0 fail (L2b zielone) | — (brak czerwieni) | dopisana gałąź odmowy L2f–L2h | 30 pass / 0 fail |
| diplo-truce-live-test.cjs, MUTACJA | — | — | na kopii src/game/diplomacy-peace-lock.ts wyłączono declareWarAfterTruce w truceEndToWarCore (kopia przywrócona cp z kopii, zweryfikowane grep = 0 znaczników) | 29 pass / 1 fail: FAIL dokładnie "L2h brak odpowiedzi na ofertę ... = wojna" (status pokoj, tura 12). Test czuły na mutację |

## Gates referencyjne (po npm ci w gra/, liczby z surowego wyjścia)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST: 6/6 pass
- git diff --check: czysto (CHECK_OK)
- src/ nietknięte (git diff -- src: pusto; mutacja przywrócona)

## BLOKADY
- r3 mutacja "tempo" (czy zmiana tempa/okna ma wpływ na wynik) NIE_ZMIERZONO: zmiany r3 są czasowe, nie zmieniają asercji; nie uruchomiono mutacji tempa (koszt czasu live).
- Odmowa AI wobec propozycji gracza (L2b-odmowa, rozstrzygnięcie przez AI przy zasianej armii) NIE POKRYTE: wymaga haka odpowiedzi AI w main.ts, poza allowlistą. Jawna nota w nagłówku testu i w komunikacie uruchomienia.
- line-advance: jeden przebieg (nie ≥2); scena 'before' NIE ZMIERZONO (brak kopii sceny, zgodnie z dispatchem: kopia nie jest commitowana).
- Klasa B (błąd kodu gry) — nie stwierdzono; żadnego kandydata R-WEB-* z tych testów.

## UWAGI-DLA-ORKIESTRATORA
1. L2b w diplo-truce-live-test.cjs ma etykietę "zgoda AI -> pokój stały", ale mechanizm jest inny: acceptTruceForTest(AI,...) ustawia truceInitiatorId = AI, więc adresatem pokoju stałego po wygaśnięciu jest GRACZ i powstaje oferta w skrzynce (main.ts: truceEndTickPair). Asercja L2b (status 'pokoj') przechodzi w obu wariantach, więc test nie rozróżnia "AI zgadza się" od "oferta czeka na gracza". Nie zmieniłem asercji L2b (poza komunikatem), ponieważ dispatch wymaga zachowania istniejących asercji; L2f–L2h rozróżniają to już poprawnie. Zalecam osobny temat porządkowy: przeetykietować L2b.
2. Nie utworzono żadnych sesji/zadań/harmonogramów (zakaz respektowany).
3. Testy live zapisują do os.tmpdir (evidence r3/r4) — sprzątanie po przebiegu wykonane do katalogu tymczasowego; zrzuty truce przekierowane na katalog scratch (nie nadpisano dyspozycje/**/dowody).
4. Na main r4 w pierwszym przebiegu (oryginalny plik) dawał 4/5 PASS; bez zmian serwera r4 nie przechodzi — to wyjaśnia, że r4 był dotknięty tym samym mechanizmem (routing HTML) co r3.

NASTĘPNY KROK: FC (Sonnet) — weryfikacja przed/po powyżej, mutacja L2h (kopia), gates; orkiestrator decyduje o integracji. Nie integruję ani nie pushuję na main.
RUNDY: 2/5 (runda 1 FAIL: zła baza kodu; runda 2 = ta praca na 7ac79dafb).
DEPLOY/PUSH: NIE WYKONANO
