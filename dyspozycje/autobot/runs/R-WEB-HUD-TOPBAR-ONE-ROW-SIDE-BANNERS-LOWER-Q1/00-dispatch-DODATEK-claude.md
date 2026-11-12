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
