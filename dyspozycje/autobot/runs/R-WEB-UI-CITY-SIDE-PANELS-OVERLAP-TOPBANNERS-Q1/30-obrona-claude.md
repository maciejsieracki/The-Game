STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-SIDE-PANELS-OVERLAP-TOPBANNERS-Q1
GOAL: w widoku miasta panele boczne (lewy, prawy), rail'e ikon i docki szczegółów nie nachodzą na banery górne; górna krawędź = zmierzona dolna krawędź banerów + 8 px, jedno źródło prawdy, wewnętrzny scroll i brak wyjścia poza dół okna zachowane, działa przy zmianie rozmiaru okna.

## Odpowiedź na zarzuty Evaluatora

1. Zarzut 1 (brak kandydata, origin/main == baza 6ade0f0ec) — PRZYJMUJĘ. Kod Operatora faktycznie nie istniał. W tej rundzie (rola Operator-obrona) napisałem poprawkę od zera na bazie origin/main 6ade0f0ec; dowody poniżej. SHA końcowy w polu `sha` wyniku workflow / `git log` tej gałęzi (commit zawiera kod + test + evidence + ten raport).
2. Zarzut 2 (brak 00-dispatch.md na main) — PRZYJMUJĘ założenie Evaluatora: pracowałem wg DODATKU (GOAL, kryteria, allowlista są w nim w całości).

## Diagnoza
Widok miasta (`cityUxFrame.ts`) ma własne banery górne (`.civ-ux-top` → `.civ-v-w3-chips-flank` lewy/prawy + plakietka miasta; HUD mapy jest wtedy ukryty przez `.is-city-view`). Panele `.civ-ux-left`/`.civ-ux-right`, rail'e i docki miały `top: CITY_RAIL_TOP_PX` = 10 px (stała), a dolna krawędź banerów to ok. 58,5 px, stąd nakładanie na zrzucie właściciela (panele od y≈10).

## Zmiana (allowlista: gra/src/ui/cityUxFrame.ts, gra/tools/city-side-panels-below-topbanners-test.cjs, evidence/)
- `cityUxFrame.ts`: stała `SIDE_TOP_EXPR = var(--civ-city-side-top, 10px)` zamiast `top:${LEFT_RAIL_TOP}px` w `.civ-ux-left`, `.civ-ux-right`, oba rail'e, oba docki oraz w ich `max-height: calc(100vh - top - 96px)`.
- Nowa `fitCitySideTop()`: mierzy `getBoundingClientRect().bottom` elementów `.civ-v-w3-chips-flank` i `.civ-v-w3-city-badge` w `.civ-ux-top`, ustawia `--civ-city-side-top` na ramce (= bottom + 8 px, nie mniej niż 10 px). Wołana po `showCityUxFrame`, po `refreshCityUxFrame`, na `window.resize` i przez `ResizeObserver` na banerach (zmiana zawijania/treści); observer czyszczony w `hideCityUxFrame`.
- Panele mają `bottom` zakotwiczone, więc ich wysokość maleje o przesunięcie; wewnętrzny scroll bez zmian.
- Nie ruszano: silnik, JSON danych, WERSJE.md, hud.ts.

## Testy (surowe wyniki z tej sesji)
Nowy test Chromium `gra/tools/city-side-panels-below-topbanners-test.cjs` (esbuild + Playwright, chromium-1194, prawdziwy renderer `showCityPanel`), 4 rozdzielczości, panel-lewy/prawy + rail-lewy/prawy vs banery lewy/prawy:
- PRZED (baza): `WYNIK (before): PASS=28 FAIL=33` (panele top=10.0, banery bottom=58.5, NAKLADA w każdej rozdzielczości).
- PO: `WYNIK (after): PASS=61 FAIL=0`.
- MUTACJA (cofnięcie `SIDE_TOP_EXPR` do stałej 10 px): `WYNIK (mutant): PASS=28 FAIL=33` — test czerwieni się.

Tabela po poprawce (dolna krawędź banera vs górna krawędź panelu, px; wszystkie `ok`, panel.top 67.0 >= baner.bottom 58.5):

| rozdzielczość | baner lewy bottom | baner prawy bottom | panel-lewy top / bottom | panel-prawy top / bottom | rail-lewy top | rail-prawy top |
|---|---|---|---|---|---|---|
| 2000x900 | 58.5 | 58.5 | 67.0 / 900.0 | 67.0 / 868.0 | 67.0 | 67.0 |
| 1600x900 | 58.5 | 58.5 | 67.0 / 900.0 | 67.0 / 868.0 | 67.0 | 67.0 |
| 1366x768 | 58.5 | 58.5 | 67.0 / 768.0 | 67.0 / 736.0 | 67.0 | 67.0 |
| 1280x720 | 58.5 | 58.5 | 67.0 / 720.0 | 67.0 / 688.0 | 67.0 | 67.0 |

Dodatkowo: test resize 1600 -> 1366 w jednej stronie: PASS (panel.top >= baner.bottom); brak błędów strony; panel.bottom <= vh we wszystkich przypadkach.
Zrzuty przed/po: `dyspozycje/autobot/runs/R-WEB-UI-CITY-SIDE-PANELS-OVERLAP-TOPBANNERS-Q1/evidence/{before,after}-{2000x900,1366x768}.png` (obejrzano after-2000x900: banery w całości, panele zaczynają się poniżej).
- `npx tsc --noEmit`: exit 0, bez błędów.
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- Istniejące testy panelu miasta: garrison-panel-pinning-real-render-test 16/0; owned-building-detail-side-test 17/0.
- Dwa testy z awariami JEST ICH TAKA SAMA LICZBA NA BAZIE (sprawdzone przez przywrócenie cityUxFrame.ts z HEAD): build-panel-ulepszenia-scroll-real-render-test 42 pass / 1 fail (G2b: nieznana wstawka `TOOLBAR_TOP_PX` w replikacji CSS HUD) oraz recruitment-panel-compact-row-test 32 pass / 7 fail — oba identyczne przed i po poprawce, więc dług istniejący, nie regresja.

## BLOKADY / NOTATKI
- Obserwacja poza zakresem: w fixturze testowym lewy baner (flank) przy 1366 i 1280 px wychodzi poza lewą krawędź okna (x=-21 / -64). Nie ruszano (to szerokość/środkowanie banerów, nie nachodzenie paneli; potencjalny osobny temat R-WEB-UI-CITY-TOPBANNER-CLIP, możliwy ABC jeśli zmiana układu). Fixture nie zawiera realnych stanów surowców, więc szerokość może różnić się w grze.
- Nie wykonano pomiaru w pełnej aplikacji (Vite) z realnym stanem gry; pomiar wykonano na prawdziwym rendererze miasta w izolowanej stronie Chromium z fixturą silnika (NIE_ZMIERZONO w pełnej grze).

RUNDY: obrona rundy 1 (praca Operatora wykonana w tej rundzie) / 5
NASTĘPNY KROK: Evaluator ocenia kandydata na podanym SHA (gałąź worktree), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
