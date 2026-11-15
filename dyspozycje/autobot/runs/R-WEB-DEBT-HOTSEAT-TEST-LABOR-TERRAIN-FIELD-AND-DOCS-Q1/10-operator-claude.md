STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy, dane, dokumentacja)
TEMAT: R-WEB-DEBT-HOTSEAT-TEST-LABOR-TERRAIN-FIELD-AND-DOCS-Q1
GOAL: test hotseat zielony; usunięte martwe pole suwak_praca_teren_domyslnie bez zmiany zachowania; rada 70% -> 50%; poradnik: kara x0,75 (§50.3) i opis banera statusu (12-dyplomacja); test-strażnik hasła oslabienie-glod-deficyt.

BAZA (odchylenie od dispatchu): dispatch wskazuje kandydata fef330d84, ale origin/main = 7c2074e00 (157 commitów dalej; zawiera już FALĘ 717: domyślne praca 50/50, podatki 30/60/10, racja 6 oraz część poprawek testu hotseat). Operator pracował na 7c2074e00 (detached origin/main). Kod sprzed FALI 717 nie był używany.

ZMIANY-COMMIT:
- kod + dokumenty: 4fd7e9499 (R-WEB-DEBT-HOTSEAT-...: test, pole, rada, poradnik, wikiBundle)
- raport: ten plik, osobny commit po 4fd7e9499 (git add tylko tej ścieżki)
- ALLOWLISTA: zgodna. tools/hotseat-ustawienia-kopiowane-test.cjs; nowy tools/civpedia-oslabienie-docs-guard-test.cjs; data/econ-params.json (tylko klucz); src/game/economy.ts i turn-economy.ts (tylko pole); docs/encyklopedia/budynki/{biblioteka,akademia}.md, docs/encyklopedia/pojecia/brod.md; docs/PORADNIK-GRACZA/{06,08,12}; src/data/wikiBundle.json (regeneracja); testy dotykające pola: civ-bonusy-test, growthmult-compound-test, trade-routes-income-test, wire-ekonomia-test.
- Poza allowlistą: nic. Nie dotykano WERSJE.md, manifestu, rust-port, docs/decyzje/**. cityPanel.ts bez zmian (nie zawierał odczytu pola).

ZMIANY:
1. Test hotseat: w kreatorze „Dalej” to `.civ-newgame .nb.next` (dwa miejsca zamiast `.civ-newgame .start`). Asercje bez zmian (praca 50, podatki 30/60/10, racja 6). Mutacja DEFAULT_POZIOM_RACJI 6->5 (src/game/population-growth-v85.ts) => RED "fotel 2 ma DEFAULT_POZIOM_RACJI=6, nie 1 (got 5)", exit 1; zmiana cofnięta.
2. Martwe pole: suwaakPracaTeren (z suwak_praca_teren_domyslnie) jest tylko przypisywany (economy.ts:264, turn-economy.ts:344) i nigdzie nie czytany; cityPanel.ts bez odczytu. Usunięto klucz z econ-params.json (wszystkie trudności), pole z interfejsu i przypisań, fixtury w 4 testach. Odczyt NIE był żywy, więc bez DECISION_REQUIRED.
3. Rada 70% -> 50%: biblioteka.md:33 i akademia.md:41 („suwak pracy 50% budynki”). Poradnik 06 §38.2 (tabela domyślna: Budynki 50% / Ulepszenia 50%) i zdanie o domyślnych wartościach miasta (praca 50/50).
   POMINIĘTE (przykłady z jawnym scenariuszem 70%, nie opis domyślnego podziału): encyklopedia/budynki/{port,studnia,stolarnia,teatr,magazyn,palac,spichlerz,laznia_publiczna,sad,kamieniarski,swiatynia,stela}.md linia „Scenariusz: … suwak pracy 70%”; biblioteka.md:44 (ta sama linia scenariusza); encyklopedia/cuda/*.md (15 plików) „Plan budowy … suwak pracy 70%”; pojecia/suwak-pracy.md (już 50/50, bez zmian); pojecia/spichlerz.md SP5 i suwak-zywnosci.md (70/30 dotyczy ŻYWNOŚCI, nie pracy); PORADNIK 06 l.574-604 (przykład liczbowy i tabele obliczeń), 06 l.788 („Praca 70/30” w przykładzie), 45/57/28/91-katalogi i 07 („7/t na budynki (70% z 10)” - przykład), 03 l.348 i 08 l.151 (żywność); HANDOFF-rev-E-2026-07-03 (dokument historyczny). Do decyzji orkiestratora, czy przepisać przykłady.
4. Poradnik 08 §50.3: dopisany akapit „Osłabienie w walce (gracz i AI)”: ×0,75 (−25%) przy głodzie wojska i deficycie złota, bez pancerza, kumulacja, barbarzyńcy wyłączeni, link do hasła. Zgodne z docs/encyklopedia/pojecia/oslabienie-glod-deficyt.md.
   Poradnik 12 l.110: opis banera zmieniony na etykietę „Stan: POKÓJ / WOJNA / …” z podpowiedzią „To nie jest propozycja”, „obowiązuje od X tur”, „Rozejm do tury N”, „zerwanie: …”. Zgodne z src/ui/diplomacyAudience.ts (~l.1290-1296). Uwaga: tekst „to nie jest propozycja” nie istniał w poradniku; dopisany na podstawie kodu.
   Hasło o walce: pojecia/brod.md („Bród (Ford) w bitwie”, jedyne hasło walki w wiki) dostało link do oslabienie-glod-deficyt.md w linii „Powiązane”.
5. Test-strażnik gra/tools/civpedia-oslabienie-docs-guard-test.cjs (czyta src/data/wikiBundle.json): 6 sprawdzeń (hasło istnieje; zawiera „0,75”; hasło o walce linkuje; rozdział poradnika 08 zawiera „0,75”). GREEN 6 PASS. Mutacja (0,75 -> 0,7X w md, regeneracja bundle) => RED „hasło pojecia/oslabienie-glod-deficyt zawiera „0,75””, exit 1; przywrócenie => GREEN.
6. wikiBundle regenerowany (node tools/bundle-wiki-for-game.cjs: 22 rozdz. + 182 haseł).

TESTY (surowe wyniki, exit codes):
- npx tsc --noEmit: exit 0
- logic-test.cjs: LOGIC OK (213/213), exit 0
- combat-test.cjs: "All sanity checks passed.", exit 0
- unit-power-test.cjs: "=== unit-power-test: 6 pass, 0 fail ===", exit 0
- unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
- tech-tree-test.cjs: 20 pass, 0 fail, exit 0
- research-test.cjs: ALL GREEN, exit 0
- hotseat-ustawienia-kopiowane-test.cjs: GREEN 16 PASS, 0 FAIL, exit 0 (przed i po usunięciu pola)
- civpedia-oslabienie-docs-guard-test.cjs: GREEN 6 PASS, exit 0
- determinism-same-seed-test.cjs: WYNIK: PASS, exit 0
- determinism-save-load-resume-test.cjs: WYNIK: PASS, exit 0
- praca-limit-50-test.cjs: 34 passed, 0 failed
- praca-jeden-podzial-kontrakt-test.cjs: 634 OK, 0 FAIL
- praca-na-pieniadz-test.cjs: 6 passed, 0 failed
- praca-global-default-live-test.cjs: 7 passed, 0 failed
- owner-economy-test.cjs: 20 passed, 0 failed
- civ-bonusy-test.cjs: 56 passed, 0 failed
- growthmult-compound-test.cjs: 24 passed, 0 failed
- wire-ekonomia-test.cjs: 37 passed, 0 failed
- trade-routes-income-test.cjs: 134 passed, 0 failed
- git diff --check: czysty

NIE ZMIERZONO / CZERWONE POZA ZAKRESEM:
- tools/budynki-koszt-pracy-50-test.cjs: exit 1, „141 pass, 42 fail” (FAIL „<budynek> poziom 1: itemCost z kosztBudowy/przyrostKosztu”, m.in. kuznia, port, cegielnia, spichlerz_ii). Test dotyczy kosztów budynków, nie domyślnego podziału ani usuniętego pola. NIE ZMIERZONO na czystym origin/main (nie uruchomiono tam); wg Operatora niezależne od tej zmiany, do potwierdzenia.
- Chromium poza testem hotseat: nie uruchamiano.
- Pełny zestaw testów gry: nie uruchamiano (tylko bramki referencyjne i testy pola/podziału).

DŁUG RUST: REPIN usunięcia klucza suwak_praca_teren_domyslnie z econ-params.json (do zapisu w rejestrze/REPIN).

UWAGI-DLA-ORKIESTRATORA:
(a) Nieaktualne dokumenty decyzji (NIE zmieniane): docs/decyzje/B-WYZYWIENIE-SLIDER-2026-07-30.md i docs/decyzje/P-MP-SPAWN-WYZYWIENIE.md podają rację 4 jako kanon; aktualnie 6 (FALA 717 / #382).
(b) Baza: dispatch zakładał kandydat fef330d84; origin/main zawiera już część tematu (FALA 717). Operator pracował na 7c2074e00; orkiestrator decyduje o integracji.
(c) Pliki generowane tools/.*-bundle.cjs (np. .krok2-typecheck-bundle.cjs, .pt-layout-bundle.cjs, .scc-bundle.cjs, .dip-audit-bundle.cjs, .test-diag-bundle.cjs, .diag-playtest-bundle.cjs) nadal zawierają stary klucz; spoza allowlisty, nie ruszane.
(d) dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md:1026 wymienia klucz (dokument planu, nie ruszany).
(e) Omyłkowe wywołanie narzędzia archiwizacji sesji z placeholderem ID: odrzucone przez klasyfikator uprawnień, bez skutków; nic nie zarchiwizowano.
(f) Pliki dowodów dowody/hotseat-*.png są nadpisywane przez test przy każdym uruchomieniu; przywrócone do stanu z git (nie commitowane).

NASTĘPNY KROK: Evaluator (SONNET) i Final Control wg procesu; decyzja o przykładach 70% (pkt 3) i o wyniku budynki-koszt-pracy-50-test na czystym main.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
