STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy, dane, dokumentacja)
TEMAT: R-WEB-DEBT-HOTSEAT-TEST-LABOR-TERRAIN-FIELD-AND-DOCS-Q1
GOAL: test hotseat zielony; usunięte martwe pole suwak_praca_teren_domyslnie bez zmiany zachowania; rada 70% -> 50%; poradnik: kara x0,75 (§50.3) i baner statusu (12-dyplomacja); test-strażnik hasła oslabienie-glod-deficyt.

BAZA: kandydat 9a869bf45 (oparty na 7c2074e00 = aktualny origin/main). Dispatch wskazuje fef330d84, który nie jest przodkiem kandydata; diff liczony względem 9a869bf45 / 7c2074e00 (patrz NOTE-6 w ev-zarzutach).
KOMMIT OBRONY: 5cb070da7 (2 pliki: gra/tools/civpedia-oslabienie-docs-guard-test.cjs, gra/tools/growthmult-compound-test.cjs). Raport: ten plik, osobny commit.

ODPOWIEDZI NA ZARZUTY EVALUATORA (6aeda4168):
- Zarzut 1 (NOTE, strażnik sprawdza „0,75” w całym rozdziale 08): PRZYJMUJĘ. Strażnik zawężony do sekcji §50.3 (od „### 50.3” do „### 50.4” w wikiBundle). Dowód: po zmianie mutacja ×0,75 -> ×0,7X w 08-ekonomia §50.3 + regeneracja bundle => RED „poradnik 08-ekonomia-imperium §50.3 opisuje karę „×0,75””, exit 1; przywrócenie => GREEN 7 PASS, exit 0. Uwaga: pierwsza wersja zawężenia (szukanie „0,75”) NIE wykryła tej mutacji, bo zdanie o kumulacji „(0,75 × 0,75)” w §50.3 zawierało „0,75”. Dlatego kluczem jest forma „×0,75” (bez spacji), a nie samo „0,75”. Zmierzone, nie zakładane.
- Zarzut 2 (NOTE, jedyne hasło walki linkujące to brod.md): ODRZUCAM (dowód). Dispatch pkt 4c wymaga linku „z hasła o walce”. Jedyne hasło w encyklopedii o walce w sensie mechaniki bitwy to pojecia/brod.md („Bród (Ford) w bitwie”, kategoria „Jednostki i walka”, poradnik_ref „Część X (Walka)”). Grep `kategoria.*Jednostki i walka` w docs/encyklopedia zwraca tylko brod.md i oslabienie-glod-deficyt.md w pojecia/. Brak innego hasła o walce, do którego można by dodać link bez wymyślania treści. Decyzja, czy dodać link także w jednostkach/*.md, należy do orkiestratora.
- Zarzut 3 (NOTE, niespójne liczby 70% w przykładach): ODRZUCAM (dowód: dispatch pkt 3). Dispatch nakazuje poprawić TYLKO opisy domyślnego/rekomendowanego podziału i wykluczyć przykłady z innym sensem. Pozostałe wystąpienia 70% to jawnie oznaczone scenariusze (np. „Scenariusz: … suwak pracy 70%” w budynki/*.md, „Plan budowy … suwak pracy 70%” w cuda/*.md) lub przykłady liczbowe w PORADNIK 06 l.574–604 i l.788. Pełna lista pominiętych pozycji z powodem jest w 10-operator-claude.md (pkt 3). Nie są opisem domyślnego podziału, więc zmiana byłaby poza zakresem dispatchu.
- Zarzut 4 (NOTE, pusta linia w growthmult-compound-test.cjs): PRZYJMUJĘ. Usunięta pusta linia po `suwaakPracaBudynki: 70,` (commit 5cb070da7). Dowód: `node tools/growthmult-compound-test.cjs` => „growthmult-compound-test: 24 passed, 0 failed”, exit 0. git diff --check czysty.
- Zarzut 5 (NOTE, stary klucz w tracked *-bundle.cjs i P2-9-ASSET-DATA-MAPPING.md): ODRZUCAM (dowód: allowlista dispatchu). Pliki gra/tools/.*-bundle.cjs (np. .scc-bundle.cjs, .diag-playtest-bundle.cjs) są tracked wyjściami narzędzi diagnostycznych, a nie kodem gry i nie są w allowliście. dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md jest dokumentem planu, także poza allowlistą (dispatch: NIE rust-port). Żadna ścieżka wykonania gry ani testu nie czyta tych plików (grep po gra/src, gra/data, gra/tools/*.cjs bez bundle: 0 trafień). Wpis do REPIN zapisany w 10-operator-claude.md (DŁUG RUST); decyzja o ruszeniu bundli leży u orkiestratora.
- Zarzut 6 (NOTE, proces): PRZYJMUJĘ jako informację, bez zmiany kodu. (a) Baza: patrz BAZA powyżej; integracja musi iść względem aktualnego main, orkiestrator decyduje. (b) Test hotseat nadpisuje tracked dowody/hotseat-*.png przy każdym uruchomieniu (EVIDENCE_DIR w hotseat-ustawienia-kopiowane-test.cjs:25, page.screenshot na l.124 i l.137). To zamierzone odświeżanie dowodu. Po uruchomieniu przywróciłem oba pliki git checkout (nie commitowane). (c) Dług bazowy budynki-koszt-pracy-50-test: 141 pass / 42 fail. Potwierdzone surowym logiem ewaluatora /tmp/claude-0/ev_bk_base.log i ev_bk_cand.log: obie wersje „budynki-koszt-pracy-50-test: 141 pass, 42 fail; 44 budynków / 68 poziomów”. Nie naprawiane w tym temacie; wymaga osobnego tematu.

ZMIANY-COMMIT:
- 4fd7e9499 (kandydat, bez zmian): test hotseat, pole, rada 50%, poradnik 06/08/12, brod.md, wikiBundle, strażnik.
- 5cb070da7 (obrona r1): strażnik zawężony do §50.3 (kluczowa forma „×0,75”), usunięta pusta linia w growthmult-compound-test.cjs.
- raport: 30-obrona-claude.md (commit po 5cb070da7).

TESTY (surowe wyniki, exit codes; uruchomione w tym worktree po 5cb070da7):
- npx tsc --noEmit: exit 0
- logic-test.cjs: LOGIC OK (213/213), exit 0
- combat-test.cjs: "All sanity checks passed.", exit 0
- unit-power-test.cjs: "=== unit-power-test: 6 pass, 0 fail ===", exit 0
- unit-replace-test.cjs: "WSZYSTKIE TESTY ZIELONE (21/21)", exit 0
- tech-tree-test.cjs: "20 pass, 0 fail", exit 0
- research-test.cjs: "ALL GREEN", exit 0
- hotseat-ustawienia-kopiowane-test.cjs: "GREEN: ... 16 PASS, 0 FAIL", exit 0
- determinism-same-seed-test.cjs: "WYNIK: PASS", exit 0
- civpedia-oslabienie-docs-guard-test.cjs: "GREEN: ... 7 PASS, 0 FAIL", exit 0; mutacja ×0,75->×0,7X w §50.3 + regeneracja bundle => "RED: poradnik 08-ekonomia-imperium §50.3 opisuje karę „×0,75”", exit 1; przywrócenie => GREEN exit 0
- growthmult-compound-test.cjs: "24 passed, 0 failed", exit 0
- git diff --check 9a869bf45 HEAD: czysty (exit 0)
- NIE ZMIERZONO w tej rundzie: mutacja racji 6->5 dla hotseat (zrobiona przez Operatora r1 i odtworzona przez Evaluatora, nie powtarzana); determinism-save-load-resume-test, praca-*, civ-bonusy-test, wire-ekonomia-test, trade-routes-income-test (zielone wg Operatora r1, nie powtarzane); Chromium poza hotseat; pełny zestaw testów.
- Uwaga środowiskowa: w worktree zainstalowano gra/node_modules (npm ci, nie tracked, nie w commicie).

BLOKADY: brak.

RUNDY: 1/5 (obrona)

NASTĘPNY KROK: Evaluator r2 (SONNET) na 5cb070da7 i ten raport; decyzje orkiestratora: (a) link z jednostek/*.md do oslabienie-glod-deficyt (zarzut 2), (b) przykłady 70% w PORADNIK 06 i budynki/cuda (zarzut 3), (c) bundle .cjs i P2-9 (zarzut 5), (d) budynki-koszt-pracy-50-test (dług bazowy).

UWAGI-DLA-ORKIESTRATORA:
(a) docs/decyzje/B-WYZYWIENIE-SLIDER-2026-07-30.md i docs/decyzje/P-MP-SPAWN-WYZYWIENIE.md podają rację 4 jako kanon; aktualnie 6 (FALA 717 / #382). Nie zmieniane (docs/decyzje/** poza allowlistą).
(b) Dispatch fef330d84 nie jest przodkiem kandydata 9a869bf45 (merge-base = ac3352c25); origin/main = 7c2074e00 zawiera już część tematu (FALA 717). Integracja względem aktualnego main.
(c) Tracked gra/tools/.*-bundle.cjs zawierają stary klucz (poza allowlistą).
(d) Dług bazowy budynki-koszt-pracy-50-test: 141/42 na bazie i na kandydacie (nie regresja).
(e) Test hotseat przy każdym uruchomieniu nadpisuje dowody/hotseat-*.png (tracked).

DEPLOY/PUSH: NIE WYKONANO
