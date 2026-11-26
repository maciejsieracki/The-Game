# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## Fakty (dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md §2)
- gra/src/render/scene.ts ~1323–1329: szerokość: main = min(1,35; 0,85+len·0,008); WSZYSTKO poza main (medium, tributary, short) = 0,4 (<10 hex) / 0,55 (<18) / 0,7 (≥18). Dziś medium i tributary mają tę samą grubość.
- scene.ts ~1511–1546: domyślny etap widoczności 2 (main+medium); tributary/short dopiero od etapu 3 (FALA 174, decyzja z playtestu); localStorage/ustawienie etapu (0–5).
- Generator produkuje dopływy (8–146 na mapę) niezależnie od widoczności; ZMIANA TYLKO RENDERU.
## Zadanie
1. Domyślny etap widoczności = pokazuje main + medium + tributary (trzeci poziom). Zachowaj opcję zmiany etapu i zgodność ze starym localStorage (stara wartość 2 użytkownika nie może po cichu ukrywać dopływów, jeśli to nie jest jawny wybór — opisz decyzję; ewentualnie migracja: brak wpisu = nowy domyślny).
2. Grubość per poziom (mnożnik półszerokości): main bez zmian; medium ≈ 0,7 × (dotychczasowa reguła długości klamrowana, tak by medium było wyraźnie cieńsze od main); tributary ≈ 0,5 × szerokości main (zgodnie ze specem MAPA-RZEKI-SPEC §5: 50%), short jak tributary. Zachowaj minimalną czytelność (nie cieńsze niż ~0,3 półszerokości main). Podaj dokładne wartości w raporcie.
3. Mgła/widoczność (river-fog-visibility, medium-river fog FALA 202) i okno tur (river-turn-window) muszą działać także dla tributary; sprawdź i opisz.
4. Testy: istniejące river-fog-visibility-test, river-turn-window-test, medium-river-test, testy sceny rzek (grep "filterRiverPathsForStage" i "riverStage" w gra/tools); nowy test źródłowy/behawioralny: filterRiverPathsForStage(stage domyślny) przepuszcza tributary; szerokości main > medium > tributary; mutacje czerwone. Zrzut z żywego Chromium (viewport 1280x800, deviceScaleFactor 1) dla map 84×60 seed 1: obraz z trzema poziomami — jeśli Chromium niestabilny: NIE ZMIERZONO z powodem (nie zgaduj).
## Allowlista
gra/src/render/scene.ts, ewentualnie gra/src/render/riverStage*.ts / ustawienia etapu jeśli istnieją, testy rzek w gra/tools/ (zmiany asercji tylko dla starego kontraktu), nowy gra/tools/river-render-levels-test.cjs, dyspozycje/autobot/runs/R-WEB-MAP-RIVER-RENDER-LEVELS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana wartości balansu poza zakresem, osłabianie asercji (zmiana dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt — wypisz w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 6 GB; usuń node_modules i /tmp po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną. Zacommituj i zwróć SHA.
## Binarne kryterium
Domyślnie widoczne trzy poziomy o różnej grubości; testy z mutacją czerwoną; zero zmian generatora (git diff nie dotyka gra/src/map/**); bramki zielone.
