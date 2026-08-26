# 04 — OPERATOR (runda 2)

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna (bez przesunięcia wobec `00-dispatch.md`).

## Przyczyna regresji — potwierdzona własnym pomiarem

Rezerwa `90 + 184px` (`174px` przy powiększeniu UI) bywa **wyższa niż cały blok zawierający**:
przeglądarka 200% × okno 640 → viewport 320px CSS, przy UI 125% body ma 256px. `calc(100% − 274px)`
jest wtedy ujemny, `max-height` zapada się do ~0, panel kurczy się do 23–31px — na zrzucie z żywego
Chromium to kilkupikselowy pasek, dla gracza nieobecny.

## Naprawa — dwie sprzężone deklaracje z tych samych stałych

1. `max-height: max(52px, calc(100% − rezerwa))` — **podłoga**. 52px = jeden PEŁNY wiersz listy
   (padding 7+7 + ikona 18 + ramka 1+1 = **34px, zmierzone** `getBoundingClientRect()`) + chrom panelu
   (8+8 + 1+1 = 18px). Mniej = wiersz przycięty w połowie, więcej = zbędnie zjada pas przewijania.
2. `top: min(90px, max(0px, calc(100% − rezerwa_dolna − 52px)))` — gdy te 52px nie mieszczą się pod
   `top:90px`, panel idzie **w górę**, zamiast wejść na stos WYKONAJ/ZAKOŃCZ TURĘ. Bez tego członu sama
   podłoga naprawia listę **kosztem** klikalności WYKONAJ w 3 komórkach (zmierzone, wariant odrzucony).
   Przy `top:0` panel nachodzi — wtedy lepiej to niż zniknięcie.

## Siatka łączona 60 punktów (BR{100…200}% × UI{100,125,150}% × wys.{1080,900,768,640})

Kryterium: realny `page.mouse.click` w środku ostatniej pozycji + potwierdzenie przez `onSelectType`.

| stan | nieklikalnych | nachodzenie na pasek | WYKONAJ zasłonięty |
|---|---|---|---|
| PRZED `416733e1` | 29/60 | 60/60 | 59/60 |
| RUNDA 1 `d0fd2301` | 5/60 | 4/60 | 0/60 |
| **RUNDA 2 `9c2386fe`** | **0/60** | **0/60** | **0/60** |

Żadna komórka nie przeszła z OK na NIE. Trzy punkty **pre-istniejące** (BR150×UI150×640,
BR175×UI150×640, BR200×UI150×768) ta sama poprawka naprawiła przy okazji — bez poszerzania zakresu.

ZMIANY/COMMIT: `gra/src/ui/buildModeHud.ts` (CSS/layout panelu + dwie stałe), `gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs`
(siatka 28→60 punktów, kryterium realnego kliknięcia, grupa asercji F). SHA **`9c2386fe`**, gałąź
`autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1` (uprzednio `--ff-only` do `31de6363`, więc niesie
raporty 02/03 i micro-fix Final Control). Warstwa suwaków budżetu automatu nietknięta.

TESTY:
- Test tematu **30/30** (było 25/25 przy 28 punktach); `--verbose` daje tabelę 60 komórek.
- Nietautologiczność — cztery mutacje po jednej wartości, **rozłączne zbiory czerwieni**.
  **M3 (usunięcie podłogi)**: czerwienieją wyłącznie C(b)/C(c)/C(d)+F; C(d) wskazuje dokładnie 5 komórek —
  2 regresyjne (BR200×UI125×640, BR200×UI150×640) + 3 pre-istniejące. Wszystkie 20 komórek osi
  przeglądarki, nachodzenie, WYKONAJ, D i E zostają zielone. **M4 (usunięcie `top:min/max`)**: czerwienieje
  wyłącznie nachodzenie (7 komórek) i klikalność WYKONAJ (3) — cała klikalność listy zielona.
  **M1** (`%`→`vh`): tylko oś UI + A2/A7. **M2** (rezerwa→90): tylko nachodzenie/WYKONAJ + A3.
- Bramki: `tsc --noEmit` 0 błędów; logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6; `vite` build binarką z `node_modules` do `/tmp/civ-dist-op-r2` (C-001) OK, `git status` po
  buildzie czysty. Defensywnie (ten sam plik): lock-tip 21/21, slider-max 13/13.
- Dowód wizualny: `shot-{PRZED,PO_R1,PO_R2}-BR200-UI125-640.png` (scratchpad, nie do repo) — R1 pasek
  kilku pikseli, R2 pełny wiersz „Fort · E3 · 30 P" nad odsłoniętym WYKONAJ.

BLOKADY: brak. Do rejestru (bez zmian wobec rundy 1): `.et-hint`; brak wpisu tematu w `REJESTR-PROSB-I-ZADAN.md`.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5 High — temat wizualny, §5a).
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi tematu, bez `main`, bez deployu).
