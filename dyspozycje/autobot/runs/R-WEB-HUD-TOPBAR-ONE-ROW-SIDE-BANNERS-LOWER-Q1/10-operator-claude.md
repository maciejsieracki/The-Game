# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: Wszystkie 11 żetonów surowców (lewy: Skarbiec·Praca·Spichlerz·Handel·Nauka·Surowce; prawy: Armia·Miasta·Obywatele·Kultura·Religia) w jednym rzędzie na samej górze, równomiernie; boczne bloki (przyciski prawego klastra) obniżone pod rząd surowców; brak dwóch pięter przy 1920/1600/1366.

## Założenia (luki w dispatchu rozstrzygnięte zakładaniem)

- DODATEK orkiestratora (`00-dispatch-DODATEK-claude.md`) NIE istnieje na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` ani w `origin/main`. Pracowałem wyłącznie z `00-dispatch.md` (lokalny plik w głównym checkoutcie, kryteria K1–K8 i allowlista tam są kompletne).
- „Lewy i prawy panel obniżony” = przyciski Rekrutacja/Civpedia/Menu (prawy klaster) schodzą POD baner surowców prawego. Dodatkowo banery poboczne z liderami (`.civ-leader-banners`, dotąd top 92 px) przeniesione pod nowy dół klastra, bo inaczej nachodziłyby na przyciski. Lewy blok (pasek narzędzi mapy, top 104) już leży poniżej — bez zmian.
- Dolna krawędź klastra prawego zmieniła się z 68 px na 122 px, więc panel wydarzeń (`eventsPanelTopPx`) przesunął się z ~102 px na ~132 px (wysokość panelu mniejsza o ~30 px).
- Wysokość obu banerów surowców ustawiona na 56 px (wspólna, zawartość wyśrodkowana) — tylko tak monety obu stron leżą na jednej linii poziomej.

## Zmiany (commit: patrz pole `sha`)

- `gra/src/ui/hud.ts`:
  - klaster prawy: kolumna, baner surowców NAD przyciskami (`flex-direction:column`, odstęp 8 px);
  - oba banery: `height:56px` (monety na jednej linii);
  - `fitHudTopbar()`: od 1280 px lewy baner w jednej linii, skala `--hud-k` schodzi 0,96→0,40 aż się zmieści; 2×3 (`.hud-left-fallback`) tylko awaryjnie. Poniżej 1280 px zachowane dotychczasowe zachowanie (2×3 + klasy compact/tiny);
  - w trybie `hud-r-stack` etykieta pod monetą ukryta (`display:none`), bo podnosiła monetę o ~6 px; nazwa zostaje w tooltipie.
- `gra/src/ui/hudLayout.ts`: `HUD_RIGHT_CHIP_ROW_H_PX` 52→56; `hudRightRailBottomPx()` = TOP + 56 + 8 + 42 (kolumna).
- `gra/src/ui/leaderBannersHud.ts`: górna krawędź banerów liderów = `hudRightRailBottomPx() + 8`.
- Testy (allowlista `gra/tools/hud-*-test.cjs`):
  - NOWY `gra/tools/hud-topbar-one-row-test.cjs` (K1–K5, 1920/1600/1366, 4 zestawy wartości);
  - `hud-topbar-grid-gross-net-test.cjs`: oczekiwania zmienione z „3+3" na „jeden rząd od 1280 px" (3+3 dozwolone tylko poniżej 1280 px); tolerancja pionowa 4 px; w pozostałym zakresie te same asercje;
  - `hud-topbar-no-labels-test.cjs`: N4 tolerancja pionowa 4 px; dopuszczone awaryjne 2×3 przy skrajnych liczbach (udokumentowane);
  - `hud-gross-net-rest-test.cjs`: wzorzec mutanta dopasowany do nowego CSS klastra (mutant nadal wykrywany, 8 czerwonych asercji).
- Brak zmian w `gra/` poza powyższym; brak zmian w WERSJE.md, JSON balansu, rust-port; brak deployu i pusha.

## Wyniki bramek (surowe liczby z wyjścia)

Przed zmianą (baseline, `hud-topbar-layout-a-test`, 1920/1366/1024/640): `PASS (144 ok, 0 fail)`.

Po zmianie:
- `npx tsc --noEmit`: rc=0 (bez błędów).
- K1–K5 `hud-topbar-one-row-test` (1920/1600/1366 × małe/średnie/duże/deficyt): `PASS (84 ok, 0 fail)`.
- `hud-topbar-layout-a-test` (1920/1366/1024/640): `PASS (144 ok, 0 fail)`.
- `hud-topbar-grid-gross-net-test`: `OK (1150 ok, 0 fail)`.
- `hud-panels-below-banner-test`: `PASS (130 ok, 0 fail)`.
- `hud-topbar-no-labels-test`: `PASS (94 ok, 0 fail)`.
- `hud-gross-net-rest-test`: `OK (820 ok, 0 fail)` (w tym 8 mutantów wykrytych).
- `hud-number-abbrev-test`: `OK`.
- `left-banner-overflow-narrow-test`: `PASS` (1024: brak błędów strony).
- `logic-test`: PASS; `tech-tree-test`: 20 pass, 0 fail; `research-test`: 33/0; `unit-replace-test`: OK; `combat-test`: OK.

Dwa testy NIE zielone (poza zakresem zmian, nie naprawiane):
- `build-panel-ulepszenia-scroll-real-render-test`: `42 pass, 1 fail` — G2b (nieznane `${…}` w CSS HUD: `TOOLBAR_TOP_PX`, `Z_MAP_CONTROLS`). Ta sama lista nieznanych wstawek jest w bazie 8c447758 (`TOOLBAR_TOP_PX` ×1, `Z_MAP_CONTROLS` ×2) — błąd istnieje przed tą zmianą. Plik testu poza allowlistą.
- `hud-topbar-bigger-numbers-real-render-test`: `FAIL (60 ok, 4 fail)` — DECYZJA WYMAGANA (patrz niżej):
  - B1 `1366: font głównej liczby >= 1,25x PRZED (min 0.778)` — przy dużych wartościach (2,3M…) żetony muszą się skurczyć, by zmieścić jeden rząd na 1366 px (min. skala 0,778 dla „mid", 0,6 dla „huge").
  - B3 (3 przypadki: 1920/huge, 1366/mid, 1366/huge) — pionowe przesunięcie monet o 3–4 px przy zmianie skali (wyśrodkowanie w banerze o stałej wysokości). Poziomo pozycje identyczne.
  - Test wymagał sprzecznie z nowym celem (jeden rząd) rozmiaru liczb; nie zmieniałem jego asercji bez decyzji.
- Uwaga: test wymaga pliku `gra/src/ui/hud.__base.ts` z commita `4905bac05`; wygenerowałem go tymczasowo i usunąłem po teście.

## Dowody wizualne (ścieżki lokalne, NIE commitowane)

- Przed: `dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/evidence/przed-1920-srednie.png`, `przed-1920-duze.png`, `przed-1366-srednie.png` (lewy baner w 2×3, prawy pod przyciskami).
- Po: `.../evidence/po-1920-srednie.png` (jeden rząd na górze, przyciski pod prawym banerem), `po-1366-duze.png` (jeden rząd, skala ~0,4 — małe liczby), `po-1600-duze.png` (prawy baner w trybie stack).
- Pomiar Chromium (harness, nie gra na żywo): K1 rozstrzał środków monet ≤2 px we wszystkich przypadkach z testu K1.

## Otwarte / decyzja dla orkiestratora (ABC do właściciela)

1. DECYZJA: w 1366 px przy wartościach rzędu milionów jedna linia 6 żetonów wymusza skalę ~0,4–0,6 (czytelność spada, B1 nie przechodzi). Opcje: (a) zostawić jak jest; (b) przy wąskim oknie wrócić do 2×3 (łamie K1 dla tych wartości); (c) skrócić wyświetlanie liczb (np. „2,3M" już jest — ograniczyć dalej do k/M bez dziesiątych).
2. Pionowe przesunięcie monet o 3–4 px przy skalowaniu — do akceptacji albo stała wysokość rzędu niezależna od skali (wymaga przebudowy komórki).
3. Panel wydarzeń przesunięty w dół o ~30 px (konsekwencja wyższego klastra prawego) — potwierdzić z właścicielem.
4. NIE_ZMIERZONO: wygląd w grze na żywo (tylko harness Chromium, bez deployu); brak weryfikacji interakcji (kliknięcia przycisków po przesunięciu).

## Stan repo

- Gałąź: detached HEAD od 8c447758e (kandydat bazy).
- Zmienione pliki: `gra/src/ui/hud.ts`, `gra/src/ui/hudLayout.ts`, `gra/src/ui/leaderBannersHud.ts`, `gra/tools/hud-topbar-one-row-test.cjs` (nowy), `gra/tools/hud-topbar-grid-gross-net-test.cjs`, `gra/tools/hud-topbar-no-labels-test.cjs`, `gra/tools/hud-gross-net-rest-test.cjs`, ten raport.
- `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`), nie commitowane.

NASTĘPNY KROK: decyzja właściciela (punkty 1–3); po decyzji ewentualna runda 2 (Operator) na B1/B3 albo akceptacja i aktualizacja asercji `bigger-numbers` z uzasadnieniem.
DEPLOY/PUSH: NIE WYKONANO
