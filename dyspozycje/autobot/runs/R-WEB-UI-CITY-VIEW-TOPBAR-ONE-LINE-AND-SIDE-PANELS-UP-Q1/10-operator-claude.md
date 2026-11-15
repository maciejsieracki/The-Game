# R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI widoku miasta; bez zmian logiki gry, wartości, balansu i treści paneli)
TEMAT: R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1
GOAL: W widoku miasta żetony lewego banera (Praca · Żywność · Skarbiec) i prawego (Nauka · Kultura · Religia) w jednej linii poziomej, bez zawijania w kwadraty; boczne panele (Produkcja / Dostępne do budowy, Budynki w mieście) startują tuż pod banerami (8 px), nie wychodzą poza ekran.
BAZA: origin/main = ac3f072dd (detached HEAD w worktree wf_e453814c-c3e-1).

## Diagnoza (przed zmianą, Chromium, prawdziwe showCityPanel + prawdziwy CSS)

- Komponenty: `gra/src/ui/cityPanel.ts` — `renderCivResourceTopBar` (pasek górny: `.civ-v-top-stack > .civ-v-top-flank-row > [.civ-v-w3-chips-left | .civ-v-w3-city-col | .civ-v-w3-chips-right]`), `buildCityOnlyW3FlankChips` (6 żetonów: 3 lewe, 3 prawe). `gra/src/ui/cityUxFrame.ts` — ramka `.civ-ux-top`, paneli `.civ-ux-left` / `.civ-ux-right`, rail'i i docków; `fitCitySideTop()` ustawia `--civ-city-side-top` z dolnej krawędzi banerów.
- Przyczyna „kwadratów”: `.civ-v-w3-chips-flank` miał `flex-wrap:wrap`, a szerokość górnego stosu była ograniczona do `min(98vw,1480px)`. Gdy żetony nie mieszczą się w banerze, zawijają się w 2–3 wiersze.
- Skutek dla paneli bocznych: ponieważ `--civ-city-side-top` jest liczona z dolnej krawędzi banerów, zawinięte banery zepchnęły panele w dół.
- Pomiar BAZY (`/tmp/.../scratchpad/measure.cjs`, prawdziwe funkcje):
  - wartości normalne: 1920 i 2000 px = 1 wiersz, panel top 67 px; 1366 i 1280 px = 2 wiersze (Skarbiec, Religia spadają), panel top 111 px;
  - wartości duże (6–7 cyfr): wszystkie rozdzielczości 2–3 wiersze, panel top 111–156 px.
- Zrzut bazy 1366×768: `runs/.../city-view-base-1366x768.png`, zrzut bazy 2000×831: `runs/.../city-view-base-2000x831.png`.

## Zmiany (commit w tym temacie; allowlista zachowana)

1. `gra/src/ui/cityPanel.ts`
   - `.civ-v-w3-chips-flank`: `flex-wrap:wrap` → `flex-wrap:nowrap` (żetony nie zawijają się).
   - `.civ-v-w3-chip`: `font-size:1.56em` → `calc(1.56em * var(--civ-top-chip-scale,1))` (skala z JS, domyślnie 1).
2. `gra/src/ui/cityUxFrame.ts`
   - `TOP_STACK_MAX_PX = 1880` (było 1480) w `max-width` górnego stosu; wolna szerokość jest wykorzystywana.
   - `fitCityTopChipScale()`: zmniejsza `--civ-top-chip-scale` krokami `[1, .94, .88, .82, .76, .70, .65, .60, .55, .50, .46, .44]`, aż każdy baner ma żetony w jednej linii i w swoich granicach (bez zawijania, bez nachodzenia na plakietkę miasta). Wywoływana na początku `fitCitySideTop()` — czyli przy pokazaniu, odświeżeniu, zmianie rozmiaru okna i zmianie banera (istniejąca ścieżka ResizeObserver przez kolejkę rAF; brak nowej pętli RO).
   - Panele boczne, rail'e i docki nadal liczą `--civ-city-side-top` z istniejącego mechanizmu (odstęp 8 px), bez rozsianych stałych.
3. `gra/tools/city-view-layout-test.cjs` (nowy): 2 zestawy wartości × 4 rozdzielczości (1920×1080, 2000×831, 1366×768, 1280×720), 14 kryteriów na kombinację (jedna linia lewa/prawa, mieszczenie w banerze i w oknie, brak nachodzenia na plakietkę, panel top w [baner dół; baner dół + 16 px], panel top ≤ 72 px, brak nachodzenia prostokątów na górne bloki, panel nie wychodzi poza dół, brak poziomego przewijania, brak błędów strony). Tryb `--mutant` cofa poprawkę do stanu bazy i musi dać FAIL.

Nie zmieniono: `hud.ts` (pasek HUD mapy — inny komponent), `gra/src/main.ts`, logiki gry, wartości wskaźników, treści paneli, dolnego panelu „Zarządzanie polami” ani przycisków środkowych. Widok mapy nie korzysta z `.civ-ux-top`, więc nie jest zmieniany.

## Wyniki pomiarów po zmianie (liczby z surowego wyjścia)

Nowy test, poprawka: `WYNIK POPRAWKA (oczekiwane PASS): PASS=112 FAIL=0`, kod wyjścia 0.

Pomiar `measure.cjs` (po zmianie):
- wartości normalne: 1920 i 2000 px — 1 wiersz w obu banerach, panel top 67 px; 1366 i 1280 px — 1 wiersz, panel top 62 px;
- wartości duże: 1920 i 2000 px — 1 wiersz, skala żetonów mieści się, panel top 62 px; 1366 i 1280 px — 1 wiersz (skala ~0,44–0,55), panel top 62 px, brak przepełnienia.

Mutacja (test `--mutant`, odtwarza stan bazy: zawijanie, brak skali, cap 1480): `WYNIK MUTANT (stan bazy; oczekiwane FAIL): PASS=88 FAIL=24`, kod wyjścia 1 — 12 FAIL „jedna linia” (wszystkie rozdzielczości poza 2000×831 normal) + 12 FAIL „panel tak wysoko jak się da (top 111/156 > 72)”. Zrzuty: `runs/.../city-view-after-2000x831.png`, `city-view-after-1366x768.png` (po zmianie), `city-view-base-2000x831.png`, `city-view-base-1366x768.png` (mutacja = baza).

## TESTY

| Bramka / test | Wynik (z surowego wyjścia) |
|---|---|
| `npx tsc --noEmit` | exit 0, 0 linii wyjścia (0 błędów) |
| `node tools/logic-test.cjs` | `LOGIC OK (213/213)` |
| `node tools/tech-tree-test.cjs` | `tech-tree-test: 20 pass, 0 fail` |
| `node tools/research-test.cjs` | `ALL GREEN`, exit 0 |
| `node tools/unit-replace-test.cjs` | `WSZYSTKIE TESTY ZIELONE (21/21)` |
| `node tools/combat-test.cjs` | `All sanity checks passed.`, exit 0 |
| `node tools/unit-power-test.cjs` | `=== unit-power-test: 6 pass, 0 fail ===` |
| `node tools/city-view-layout-test.cjs` (nowy) | PASS=112 FAIL=0 |
| `node tools/city-view-layout-test.cjs --mutant` | PASS=88 FAIL=24 (czerwony na bazie, oczekiwane) |
| `node tools/city-side-panels-below-topbanners-test.cjs` | WYNIK (after): PASS=61 FAIL=0 |
| `node tools/left-banner-overflow-narrow-test.cjs` | WYNIK (after): PASS=74 FAIL=0; mutant nadal FAIL (6) |
| `node tools/kolor-surowce-spojnosc-test.cjs` | `34/34 PASS` |
| `node tools/city-ro-loop-boot-error-test.cjs` | `WYNIK (KOD): PASS=1 FAIL=0` |
| `node tools/siege-badge-zorder-test.cjs` | `PASS=13 FAIL=0` |
| `node tools/recruitment-panel-compact-row-test.cjs` | PASS 32 / FAIL 7 — **te same 7 FAIL istnieją na bazie ac3f072dd** (sprawdzone przez podmianę obu plików na wersje z bazy i powrót); nie jest to regresja tego tematu |
| `git diff --check` | exit 0 |

NIE_ZMIERZONO:
- testy `hud-topbar-*` (pasek HUD mapy) nie były uruchamiane — nie dotyczą zmienianego komponentu;
- pełna gra w przeglądarce (realna tura, realne dane kampanii) nie była uruchamiana — pomiary robione na fixture'ze `showCityPanel` z prawdziwymi danymi gry, ale bez sesji gry;
- rozdzielczości poza czterema z dispatchu oraz okna pionowe / bardzo wąskie (<1280 px) nie były mierzone;
- przy wartościach 7-cyfrowych w 1280 px żetony idą do najmniejszej skali (0,44 → ok. 11 px); czytelność w tym skrajnym przypadku nie była oceniana wzrokowo poza zrzutami.

## BLOKADY

Brak blokad technicznych. Uwaga procesowa: `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` w worktree (katalog ignorowany przez git, nie trafia do commita); sprzątanie zgodnie z §5a po stronie orkiestratora.

## UWAGI-DLA-ORKIESTRATORA

- Pole „wiersz Kultura 0 +10 (97) · Religia 0 (10) nie w jednej linii z Nauką” w dispatchu zgadza się z bazą (zawijanie prawego banera) — usunięte zmianą.
- Po zmianie cap szerokości 1880 px górny pasek zajmuje na 1920 px niemal całą szerokość; jeśli właściciel woli węższy pasek, wystarczy zmienić `TOP_STACK_MAX_PX` (test ma stałe progi niezależne od tej wartości, z wyjątkiem 72 px dla góry paneli).
- Temat zgłoszony w zadaniu jako „HUD-TOPBAR-LAYOUT-A / #308 / #318” dotyczył paska HUD mapy (`hud.ts`), nie widoku miasta; nie został zmieniony.
- Istniejący test `recruitment-panel-compact-row-test.cjs` ma 7 czerwonych asercji już na bazie — dług do osobnego tematu (nie w tym zakresie).

## NASTĘPNY KROK

Evaluator (Sonnet) weryfikuje allowlistę, mutację i zrzuty. Po FC PASS — integracja orkiestratora i deploy na ROBOCZĄ (poza tym tematem).

## DEPLOY/PUSH: NIE WYKONANO

## ZMIANY/COMMIT

Commit z kodem i raportem (tylko wymienione ścieżki, bez `git add -A`):
- `gra/src/ui/cityPanel.ts`
- `gra/src/ui/cityUxFrame.ts`
- `gra/tools/city-view-layout-test.cjs`
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/10-operator-claude.md`
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/city-view-after-1366x768.png`
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/city-view-after-2000x831.png`
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/city-view-base-1366x768.png`
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/city-view-base-2000x831.png`
