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
