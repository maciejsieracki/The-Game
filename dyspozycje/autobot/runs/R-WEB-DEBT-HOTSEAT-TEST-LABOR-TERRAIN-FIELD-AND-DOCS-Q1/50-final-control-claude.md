STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy, dane, dokumentacja)
TEMAT: R-WEB-DEBT-HOTSEAT-TEST-LABOR-TERRAIN-FIELD-AND-DOCS-Q1
GOAL: test hotseat zielony; martwe pole suwak_praca_teren_domyslnie usunięte bez zmiany zachowania; rada 70% -> 50%; poradnik 08 §50.3 (x0,75) i 12 (baner); test-strażnik hasła oslabienie-glod-deficyt.
ZMIANY/COMMIT: kandydat de68b0328b8902cd6a3cb4c698a5424013285e16 (potomek aktualnego origin/main 7c2074e00; `git merge-base --is-ancestor 7c2074e00 de68b0328` = tak, czyli integracja fast-forward). Do integracji: de68b0328 (kod i dokumentacja; ten raport jest osobnym commitem na wierzchu i niczego w kodzie nie zmienia). Diff vs main: 18 plików, 196+/24-, wszystko w allowliście (docs/encyklopedia, docs/PORADNIK-GRACZA, econ-params.json klucz, economy.ts i turn-economy.ts odczyty, 3 testy fixture, hotseat test, nowy strażnik, wikiBundle, runs/<ID>). cityPanel.ts nie dotknięty (brak odczytów pola, grep). Uwaga: baza z dispatchu fef330d84 jest nieaktualna; origin/main = 7c2074e00.

TESTY (surowe wyjście, uruchomione na de68b0328 po `npm ci`):
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree 20 pass 0 fail; research-test 33/33 ALL GREEN; unit-replace 21/21; combat-test 6/6; unit-power 6 pass 0 fail (5 bramek referencyjnych zielone, żadna czerwona, więc porównanie z bazą nie było potrzebne)
- hotseat-ustawienia-kopiowane-test: GREEN 16 PASS, 0 FAIL, exit 0 (Chromium, realny build vite). Mutacja DEFAULT_POZIOM_RACJI 6->5 w population-growth-v85.ts: RED "got 5", exit 1 (po mutacji przywrócone git checkout).
- civpedia-oslabienie-docs-guard-test: GREEN 7 PASS 0 FAIL. Mutacja ("karą **×0,75**" -> "x0,7X" w §50.3 wikiBundle): RED, exit 1 (przywrócone).
- growthmult-compound 24/0; civ-bonusy 56/0; trade-routes-income 134/0; wire-ekonomia 37/0; praca-auto-ulepszenia-koszt-split 20/0; praca-cap-migracja-luka 11/0; determinism-same-seed PASS.
- wikiBundle: regeneracja narzędziem (bundle-wiki-for-game.cjs) daje plik identyczny bajt w bajt z kandydatem (cmp).
- grep suwak_praca_teren / suwaakPracaTeren w gra/src i gra/data: 0 trafień. Zostają tylko generowane gra/tools/.*-bundle.cjs (poza allowlistą, nieczytane przez grę).
- git diff --check 7c2074e00 HEAD: czysty.
NIE ZMIERZONO: determinism-save-load-resume-test, praca-* poza dwoma wyżej, mapa-gen, Chromium poza hotseat, test budynki-koszt-pracy-50 (dług bazowy 141/42 podany przez Evaluatora, nie weryfikowany przeze mnie).

WERDYKTY ZARZUTÓW (żaden NAPRAW):
1. Strażnik szeroki: ODDAL, naprawione w obronie (sekcja §50.3 od "### 50.3" do "### 50.4", klucz "×0,75"); potwierdzona mutacja RED.
2. Link tylko z brod.md: ODDAL. W encyklopedii nie ma ogólnego hasła o walce; brod to hasło walki w kategorii bitwy, link spełnia wymóg dispatchu. Dodatkowe linki (jednostki) opcjonalnie przy innym temacie.
3. Przykłady 70% w scenariuszach: ODDAL (dispatch pkt 3 zawęża zmiany do opisów domyślnego/rekomendowanego podziału; pominięcia wypisane w 10-operator). Orkiestrator może zlecić osobny przegląd arytmetycznych przykładów.
4. Pusta linia w growthmult: ODDAL, naprawione w obronie; test 24/0.
5. Stary klucz w .*-bundle.cjs i P2-9-ASSET-DATA-MAPPING.md: ODDAL, REPIN Rust do zapisu (bundle'e generowane, P2-9 poza allowlistą).
6. Proces (baza, nadpisywanie dowodów png, dług 141/42): ODDAL, informacja. Test hotseat modyfikuje śledzone dowody/*.png przy uruchomieniu (przywróciłem git checkout; kandydat ich nie zmienia).

BLOKADY: brak.
RUNDY: 1/5 (Operator r1, Obrona r1, Evaluator, Final Control r1)
NASTĘPNY KROK: integracja orkiestratora (FF main -> de68b0328), ewentualny deploy na ROBOCZĄ; osobno REPIN Rust (usunięcie pola), adnotacje w B-WYZYWIENIE-SLIDER-2026-07-30.md i P-MP-SPAWN-WYZYWIENIE.md (racja 4 jako kanon, wg punktu 5 dispatchu do decyzji orkiestratora).

UWAGI-DLA-ORKIESTRATORA: (a) test hotseat nadpisuje dowody/hotseat-*.png, odrzuć zmiany przed commitem; (b) dług bazowy budynki-koszt-pracy-50-test do osobnego tematu; (c) przykłady scenariuszowe z suwakiem pracy 70% (32 pliki encyklopedii, poradnik 06 l.574/598/788) niezmienione celowo.
DEPLOY/PUSH: NIE WYKONANO
