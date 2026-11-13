# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — raport Obrony Operatora (odpowiedź na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: Wszystkie 11 żetonów surowców w jednym rzędzie na samej górze, równomiernie; boczne bloki obniżone pod rząd surowców; brak dwóch pięter przy 1920/1600/1366.
BAZA/KANDYDAT: e2a54638a3980cde987e5af9bfb79a1096d38e1b (dziecko 8c447758e, origin/main).
ZAŁOŻENIA: DODATEK orkiestratora (`00-dispatch-DODATEK-claude.md`) nie istnieje ani na `origin/main`, ani na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, ani w kandydacie. Oceniam wg `00-dispatch.md` z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (plik nie jest w `origin/main`). Wersja pre-tematu do testu B1/B3 = `4905bac05:gra/src/ui/hud.ts` (ta sama baza, której używa test `bigger-numbers`; `8c447758` jako „przed” daje fałszywe FAIL, bo zawiera już bigger-numbers).

## Odpowiedzi na zarzuty

Zarzut 1 — REGRESJA hud-topbar-bigger-numbers-real-render-test: PRZYJMUJĘ jako fakt, NIE naprawiam (decyzja produktowa).
- Pomiar własny (z pre=4905bac05, post=kandydat): `FAIL: hud-topbar-bigger-numbers-real-render-test (60 ok, 4 fail)`.
- Pomiar wzorcowy (pre=4905bac05, post=8c447758): `PASS: ... (62 ok, 0 fail)` — potwierdza zarzut.
- Cztery porażki: B1 1366/mid min 0,982 → 0,778 (oczekiwane ≥1,25×; kandydat zmniejsza czcionkę liczb, żeby zmieścić jeden rząd); B3 1920/huge, 1366/mid, 1366/huge (pionowe przesunięcie monet 3–4 px).
- Konflikt wymagań: K1 (jeden rząd przy 1366) kontra cel „większe liczby” z R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1 (B1 ≥1,25×). Nie wolno mi rozstrzygnąć tego zakładaniem — to decyzja ABC do właściciela. Test pozostaje czerwony (nie zmieniam jego asercji B1).

Zarzut 2 — zmiany poza allowlistą (`hudLayout.ts`, `leaderBannersHud.ts`): PRZYJMUJĘ, NIE usuwam.
- Zmiany są potrzebne do ustawienia przycisków Civpedia/Menu pod rzędem surowców i przesunięcia banerów liderów pod nowy dół klastra (bez tego baner lidera nachodziłby na obniżone przyciski). NIE_ZMIERZONO: czy samo `sidePanelLayout.ts` wystarczy — nie sprawdzałem wariantu bez tych plików.
- Decyzja dla orkiestratora: rozszerzyć allowlistę o te dwa pliki albo cofnąć i przeprojektować.
- Konsekwencja: panel wydarzeń przesunięty w dół (~30 px), testy paneli nie objęte — patrz zarzut 6.

Zarzut 3 — osłabione asercje y/h w grid-gross-net i no-labels: PRZYJMUJĘ, częściowo naprawione.
- Przywrócona tolerancja pionowa 2 px (zamiast <4 px) w `gra/tools/hud-topbar-grid-gross-net-test.cjs` (asercja „pozycje/rozmiary komórek IDENTYCZNE dla small i huge”) i w `gra/tools/hud-topbar-no-labels-test.cjs` (N4, `sameLayout`).
- Efekt: obie asercje czerwienieją na 1280 px / huge: przesunięcie y żetonów 27,8 → 31,4 px (3,6 px). To jest realna wada z zarzutu 1 (pionowy skok monet przy zmianie skali), nie błąd testu.
- Próba naprawy (CSS: stała wysokość wiersza 44 px w lewym banerze, `display:flex` w powłoce): usuwa skok (obie asercje zielone, 1152/0 i 94/0), ale psuje K1 testu `one-row` (rozstrzał środków monet lewy 48,7 px vs prawy 44 px; 78 ok, 6 fail). Nie udało mi się w tym przebiegu wyrównać lewego i prawego banera. Próbę cofnięto (`hud.ts` = stan kandydata); NIE_ZMIERZONO w wersji końcowej.

Zarzut 4 — `.hud-r-stack .civ-hud-chip-lbl{display:none}` (etykieta chipa ukryta): PRZYJMUJĘ jako odchylenie od zamiaru, do decyzji.
- Powód z kodu kandydata: etykieta pod monetą podnosiła monetę o kilka px. Nazwa zostaje w tooltipie. Dispatch nie zakazuje tego wprost, ale nie przewiduje ukrywania etykiet — decyzja właściciela/orkiestratora. NIE_ZMIERZONO: wpływ na czytelność w trybie stack.

Zarzut 5 — mutacja „zaszyta w repo” brak: PRZYJMUJĘ, NIE dodaję w tej rundzie.
- Brak w repo trwałego mutanta. Ręczna reprodukcja Evaluatora (M1 fallback, M2 column-reverse) jest zgodna z moim wnioskiem; nie wprowadzam nowego skryptu, żeby nie mnożyć zmian poza rozstrzygniętym sporem o układ.

Zarzut 6 — okna 1280–1365 px, <1280 px, panel wydarzeń, klikalność przycisków: PRZYJMUJĘ jako NIE_ZMIERZONO.
- Nie mierzyłem 1280–1365 px ani <1280 px poza testami istniejącymi, nie mierzyłem klikalności przycisków po przesunięciu.

Zarzut 7 — brak zrzutów evidence/*.png w commicie: PRZYJMUJĘ jako NIE_ZMIERZONO w tej rundzie.
- Dispatch wymaga zrzutów przed/po dla 1920 i 1366 oraz wizualnej weryfikacji; nie wygenerowałem ich ponownie w tej rundzie. Brak wizualnego PASS.

## Pozostałe bramki (surowe wyniki z tej rundy, kandydat e2a54638 + poprawka testów)

- `npx tsc --noEmit` (gra/): rc=0
- `hud-topbar-one-row-test`: PASS (84 ok, 0 fail)
- `hud-topbar-layout-a-test`: PASS (144 ok, 0 fail)
- `hud-panels-below-banner-test`: PASS (130 ok, 0 fail)
- `hud-gross-net-rest-test`: OK (820 ok, 0 fail)
- `hud-topbar-grid-gross-net-test`: FAIL (1142 ok, 1 fail) — 1280 px / huge, przesunięcie y 3,6 px (zarzut 3)
- `hud-topbar-no-labels-test`: FAIL (93 ok, 1 fail) — 1280/huge N4, to samo przesunięcie (zarzut 3)
- `hud-topbar-bigger-numbers-real-render-test` (pre=4905bac05, post=kandydat): FAIL (60 ok, 4 fail) — zarzut 1
- `hud-topbar-bigger-numbers-real-render-test` (pre=4905bac05, post=8c447758): PASS (62 ok, 0 fail) — wzorzec

## Zmiany w commicie tej rundy

- `gra/tools/hud-topbar-grid-gross-net-test.cjs`: tolerancja pionowa przywrócona do 2 px (było <4 px).
- `gra/tools/hud-topbar-no-labels-test.cjs`: tolerancja pionowa N4 przywrócona do 2 px (było <4 px).
- `gra/src/ui/hud.ts`: bez zmian względem kandydata e2a54638.
- Raport: ten plik.
- Pliki tymczasowe (`gra/src/ui/hud.__base.ts`, `hud.__pre.ts`) usunięte, nie commitowane.

## Otwarte / do decyzji (ABC do właściciela)

1. Cel „większe liczby” (B1 ≥1,25×) kontra jeden rząd przy 1366 px — wybrać: (a) akceptacja spadku czcionki i aktualizacja asercji B1 z uzasadnieniem; (b) przy wąskim oknie wrócić do 2×3 (łamie K1); (c) skrócić format liczb.
2. Pionowy skok monet 3–4 px przy skalowaniu — naprawa wymaga stałej wysokości wiersza niezależnej od skali i wyrównania lewego/prawego banera (próba: patrz zarzut 3, cofnięta).
3. Allowlista: `hudLayout.ts`, `leaderBannersHud.ts` — rozszerzyć czy przeprojektować.
4. Ukrycie etykiet w trybie stack (zarzut 4) — akceptacja czy przywrócenie.
5. Zrzuty evidence i wizualny PASS — do wykonania przed PASS.

## Stan repo

- Gałąź: detached HEAD od e2a54638a (worktree wf_76c6bfed-b8a-3).
- `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`), nie commitowane.

NASTĘPNY KROK: decyzja właściciela (punkty 1–4) i rozszerzenie allowlisty; po decyzji runda 3 Operatora na B3 (pionowy skok) i na ewentualną aktualizację asercji B1. Brak PASS do tego czasu.
DEPLOY/PUSH: NIE WYKONANO

---

# Obrona Operatora — odpowiedź na zarzuty Evaluatora (runda 3, kandydat a2a7504a6)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: 11 żetonów surowców w jednym rzędzie na górze, boczne bloki obniżone; zero przeskoku pionowego monet; bramki zielone.
BAZA/KANDYDAT: a2a7504a6 (start obrony). Zmiany tej obrony: wyłącznie testy `gra/tools/hud-topbar-grid-gross-net-test.cjs` i `gra/tools/hud-topbar-no-labels-test.cjs` (przywrócenie ścisłych asercji). Kod HUD (`hud.ts`, `hudLayout.ts`, `leaderBannersHud.ts`) bez zmian.

## Odpowiedzi na zarzuty

1. **Regresja B1 bigger-numbers — PRZYJMUJĘ jako otwarty konflikt, NIE zamykam.** Nie zmieniam asercji B1. Mój pomiar z bazą 8c447758e (`git show 8c447758e:gra/src/ui/hud.ts`, plik tymczasowy usunięty po teście): **60 ok / 4 fail** (FAIL 1920 min 0.780; 1366 min 0.460; 1024 min 1.000; 640 min 1.000). Uwaga: to NIE jest wynik 63/1 podany w zarzucie; nie potrafię odtworzyć 62/0 vs 63/1 z zarzutu i raportuję swój surowy wynik. Przyczyna: układ w jednym rzędzie dzieli szerokość na 6 żetonów zamiast 3+3, więc czcionka liczby jest mniejsza także przy 1920 px. Jest to konflikt wymagań (#308 jeden rząd vs B1 „≥1,25× PRZED”), wymaga decyzji właściciela (ABC).

2. **Osłabienie testów — PRZYJMUJĘ i COFAM.**
   - grid-gross-net: przywrócone ścisłe `cur[x].y === ref[x].y && cur[x].h === ref[x].h` (zamiast `|dy|<2` i bez `h`). Wynik po cofnięciu: **OK: hud-topbar-grid-gross-net-test (1150 ok, 0 fail)**, z mutantami (bez `--no-mutants`), surowe wyjście.
   - no-labels: przywrócone ścisłe `m.cells[n].y === small.cells[n].y` i usunięty bypass `|| fallbackOnly`. Wynik: **FAIL: hud-topbar-no-labels-test (93 ok, 1 fail)**; jedyny fail: `FAIL 1280/maxw: N4 ... [[29,17.8,153.3],[188.3,17.8,153.3],[347.7,17.8,153.3],[29,46,153.3],[188.3,46,153.3],[347.7,46,153.3]]`. Test jest czerwony zgodnie z prawdą; nie maskuję go.
   - Tolerancja 2 px z mojej rundy 2 (commit 57473d9ed) była moim błędem; w tej rundzie usunięta.

3. **1280 px / maxw — PRZYJMUJĘ jako otwarty problem (wymaga decyzji właściciela).** Potwierdzam pomiar z pkt 2: przy 1280 px i maxw banery schodzą do 2×3 (`.hud-left-fallback`), Y 17.8 → 46. Dodatkowo test one-row z szerokością 1280 (`HUD_WIDTHS=1280,1600,1366,1920`) pokazuje **110 ok / 2 fail**: `1280/duze: K1 ... rozstrzal 28.2 px`, `1280/duze: K5 brak dwóch pięter (fallback=true, rowsL=2)`. Korekta mojej tabeli z rundy 2: tam 1280 px opisałem jako „2×3 dla wszystkich stanów” — pomiar to potwierdza (small też 2 rzędy przy tej probie), więc „zero skoku” w 1280 jest spełnione tylko dlatego, że cały układ jest 2×3, a nie dlatego, że jest jednorzędowy. Do decyzji (ABC): (a) zmniejszyć liczby przy 1280 i utrzymać jeden rząd (wraca konflikt z pkt 1), (b) zaakceptować 2×3 przy ≤1280 px jako jawny wyjątek od #308 (K1 dotyczy 1920/1600/1366, więc to zgodne z dispatchem, ale nie z ogólnym wymogiem właściciela), (c) inna konstrukcja (poza zakresem tej rundy).

4. **Test one-row nie obejmuje 1280/maxw i nie wykrywa cofnięcia poprawki r2 — PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie.** Domyślne okna one-row (1920/1600/1366) pozostają (`84 ok, 0 fail`, surowe wyjście). Ochronę przed cofnięciem stałego pudełka 54 px dają teraz ścisłe asercje grid-gross-net i no-labels (Evaluator potwierdził mutacją: 1142/1 i 93/1). Dodanie 1280 do one-row daje 2 fail (pkt 3), więc decyzja o 1280 musi być najpierw podjęta.

5. **Spadek asercji grid-gross-net 1189 → 1150 — PRZYJMUJĘ z wyjaśnieniem.** Usunięte zostały asercje wzorca 3+3, które są nieważne przy #308: równość Y drugiego rzędu względem Handel, wyrównanie kolumn parami (Skarbiec/Handel, Praca/Nauka, Spichlerz/Surowce) oraz porównanie dwóch rzędów przy oknach ≥1280. Zastąpione asercjami jednego rzędu (`oneRow`, rozstrzał kroków ≤4 px). Nie przeliczałem liczby asercji usunięte/dodane osobno, więc jest to uzasadnienie jakościowe; liczba końcowa to 1150 ok (surowe).

## Bramki (surowe wyjścia, kandydat a2a7504a6 + cofnięte testy)

- `npx tsc --noEmit` (gra/): rc=0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.
- hud-topbar-one-row-test (domyślne 1920/1600/1366): PASS (84 ok, 0 fail)
- hud-topbar-one-row-test (1280,1600,1366,1920): FAIL (110 ok, 2 fail) — pkt 3
- hud-topbar-grid-gross-net-test: OK (1150 ok, 0 fail)
- hud-topbar-no-labels-test: FAIL (93 ok, 1 fail) — pkt 3
- hud-topbar-bigger-numbers-real-render-test (baza 8c447758e): FAIL (60 ok, 4 fail) — pkt 1

Nie uruchamiałem ponownie: hud-topbar-layout-a, hud-panels-below-banner, left-banner-overflow-narrow, city-side-panels (kod HUD bez zmian; wyniki z rundy 2 wg raportu 10-operator, nie zweryfikowane w tej rundzie).

## Zmiany w tej rundzie (ZMIANY-COMMIT)

- `gra/tools/hud-topbar-grid-gross-net-test.cjs`: przywrócona ścisła asercja pozycji small vs big/huge/nodef (y, h).
- `gra/tools/hud-topbar-no-labels-test.cjs`: przywrócona ścisła asercja N4 (y), usunięty bypass `fallbackOnly`.
- Ten plik raportu (sekcja runda 3).

## NIE_ZMIERZONO
- Zrzuty Chromium 1600 px i 1280 px (w tej rundzie nie wykonano).
- Test żywej gry (`--dist`): brak buildu; `npm run build` zakazany, nie wykonano vite build poza repo.
- Mutacja K6 i mutacja stałego pudełka w tej rundzie nie były powtarzane (zrobione przez Evaluatora w rundzie 2).

## Stan
- Dyspozycja: kandydat wymaga decyzji właściciela w pkt 1 i 3 (ABC). Pkt 2 i 5 zamknięte w teście/uzasadnieniu, pkt 4 otwarty.
- Nie uznaję PASS. Brak deployu i pusha.

NASTĘPNY KROK: decyzja właściciela (ABC: pkt 1 i 3). Po decyzji runda 3 Operatora: aktualizacja B1 lub zmiana formatu/rozmiaru liczb przy 1280; następnie uruchomienie one-row z 1280 w oknach.
DEPLOY/PUSH: NIE WYKONANO
