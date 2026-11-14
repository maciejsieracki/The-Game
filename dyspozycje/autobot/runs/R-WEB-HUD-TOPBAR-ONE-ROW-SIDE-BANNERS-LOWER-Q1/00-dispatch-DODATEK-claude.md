# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 2/5)

BAZA: kandydat r1 57473d9ed (FC FAIL r1, oparty na 8c447758e). Wolno zrobić merge origin/main (34584b4da) do kandydata, jeśli konflikt jest mechaniczny; nie cofaj zmian z FALI 651–673.
MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0), DODATEK orkiestratora w sekcji na końcu 00-dispatch.md.
ALLOWLISTA: pliki HUD baneru i jego testy w gra/src/ui/ oraz gra/tools/hud-topbar-*.cjs; dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/**. ZAKAZ zmian reguł gry, JSON balansu, WERSJE.md, rust-port, gra-robocza/.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev (dozwolone: tsc --noEmit i vite build --outDir poza repo); długie komendy w limicie 590 s. Nie integrujesz, nie pushujesz na main.

## DODATEK (runda 2/5) — NAPRAWY po FC FAIL r1
Regresje z testów (liczby z FC r1):
1. hud-topbar-grid-gross-net: 1142 ok / 1 fail (baza 1189/0) — przywrócić 0 fail.
2. hud-topbar-no-labels: 93/1 (baza 94/0). Przyczyna: pionowy skok monet o 3,6 px przy 1280 px i przy dużych liczbach ("huge"). NAPRAW: monety i liczby w banerze mają stałą linię bazową niezależną od szerokości ekranu; zero przeskoku między stanami.
3. bigger-numbers (B1/B3): 60/4 (baza 62/0). Przywrócić zgodność z bazą.

WYMÓG WŁAŚCICIELA (#308, niezmienny): surowce w JEDNYM rzędzie na górze; boczne bloki (lewy/prawy) obniżone poniżej rzędu. Nie zmieniać reguł gry — tylko układ HUD.

KRYTERIA KOŃCA:
- tsc --noEmit zielone; 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test) zielone z surowym wynikiem;
- hud-topbar-grid-gross-net 0 fail; hud-topbar-no-labels 94/0; bigger-numbers 62/0 (liczby z surowego wyjścia);
- pomiar pozycji monet przy 1280 px i huge: zmiana Y między stanami = 0 px (raport z liczbą);
- dowód w Chromium (zrzut 1280 i 1920, 2×) jeśli dostępny; jeśli niewykonalny — NIE_ZMIERZONO z powodem.
Raport: dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/10-operator-claude.md (runda 2).

## DODATEK (runda 3/5, 2026-11-13) — FC FAIL r2 → NAPRAW; MODEL: OPERATOR SONNET (uzasadnienie niżej), Obrona HAIKU
UZASADNIENIE SONNET (CLAUDE.md, zasada modeli): dwie nieudane rundy Haiku tego samego tematu (r1 FC FAIL na 57473d9ed; r2 FC FAIL na ab3de312f). W r2 Operator osłabił testy (tolerancja 2 px, bypass fallbackOnly) zamiast naprawić układ — temat wymaga równoczesnej naprawy trzech przypadków (1280/maxw, K1, K5) bez osłabiania progów.
BAZA: kandydat r2 ab3de312f (FC FAIL, oparty na 8c447758e). Merge origin/main (34584b4da) dozwolony, jeśli mechaniczny. Nie cofaj zmian FALI 651–673.
ALLOWLISTA: bez zmian (pliki HUD baneru, gra/tools/hud-topbar-*.cjs, dyspozycje/…/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/**). ZAKAZ zmian reguł gry i balansu.

NAPRAWA 1 (zarzut FC 3): hud-topbar-no-labels przy 1280 px / maxw przeskakuje do układu 2×3 (Y 17,8 → 46). Układ jednego rzędu musi się utrzymać przy 1280 i maxw; pozycja monet Y stała między stanami.
NAPRAWA 2 (zarzut FC 4): test one-row musi obejmować przypadek 1280/maxw. Obecnie K1 rozstrzał 28,2 px i K5 fallback 2 rzędy — mają być ≤1 px i 1 rząd.
NAPRAWA 3 (przywrócenie testów): WYCOFAJ osłabienia z r2 — grid-gross-net i no-labels mają wrócić do progu bazy (0 px, bez bypassu fallbackOnly). Testy NIE mogą być luzowane.
NAPRAWA 4 (bigger-numbers, B1 przy 1366): przywróć zachowanie bazy 8c447758e (62/0). NIE wprowadzaj nowego progu skali czcionki — próg B1 jest decyzją właściciela (pytanie ABC w toku); do tego czasu zachowaj bazę.
NAPRAWA 5: mutacja — poprawka układu musi czerwienić test 1280/maxw; mutacja usunięcia 1 rzędu czerwieni K5.

KRYTERIA KOŃCA: tsc --noEmit 0 błędów; 5 bramek referencyjnych (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6); one-row (1920/1600/1366/1280-maxw) 0 fail; grid-gross-net 0 fail; no-labels 94/0; bigger-numbers 62/0 — liczby z surowego wyjścia; Y monet 0 px zmiany; zrzuty Chromium 1280/1600 (2×) jeśli wykonalne, inaczej NIE_ZMIERZONO z powodem.
Raport: 10-operator-claude.md (runda 3). Nie integrujesz, nie pushujesz na main.

## DODATEK (runda 4/5, 2026-11-13) — DECYZJA WŁAŚCICIELA: „Jak w bazie”; MODEL: OPERATOR SONNET (uzasadnienie niżej), Obrona HAIKU
DECYZJA WŁAŚCICIELA (ABC, 2026-11-13): przy 1366 px zachowujemy zachowanie bazy 8c447758e. NIE wprowadzamy progu skali 1,25× ani nowej asercji. Czcionka liczb przy 1366 może spaść do 0,78× — to akceptowane.
UZASADNIENIE SONNET: dwie porażki Haiku (r1, r2) + r3 FC BLOCK; temat wymaga zmiany asercji B1 bez osłabiania pozostałych testów i potwierdzenia układu jednego rzędu przy 1280/maxw.
BAZA: kandydat r3 4ed8339a3 (FC BLOCK; zarzuty 1 i 4 dotyczyły progu B1 — rozstrzygnięte decyzją). Merge origin/main dozwolony, jeśli mechaniczny.
ZADANIE:
1. Test bigger-numbers (B1 przy 1366): przywróć asercję bazy (wynik 62/0 jak na 8c447758e). Usuń wymóg ≥1,25× i nie dodawaj nowego progu.
2. Zachowaj: one-row 1920/1600/1366/1280-maxw bez przeskoku monet (Y 0 px); układ jednego rzędu przy 1280/maxw (naprawa r3) — nie cofać; grid-gross-net 1150/0; no-labels 94/0; tolerancja 1,5 px (przywrócona r3) — NIE luzować.
3. Nie zmieniaj reguł gry ani balansu. Tylko HUD i jego testy.
KRYTERIA KOŃCA: tsc 0; 5 bramek referencyjnych z surowym wyjściem; bigger-numbers 62/0; one-row 0 fail; grid-gross-net 0 fail; no-labels 94/0; mutacja układu czerwieni one-row; raport 10-operator-claude.md (runda 4). Nie integrujesz, nie pushujesz na main.
