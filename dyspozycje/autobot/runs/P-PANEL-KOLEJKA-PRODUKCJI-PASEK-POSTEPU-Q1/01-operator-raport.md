# P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1 — raport Operatora, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1
ROLA: Operator · MODEL+EFFORT: **Opus 5, effort high**
ŚCIEŻKA DISPATCHU: A (Workflow) — zgodnie z `00-dispatch.md`
BAZA: `21ae70b6` (= `origin/main`), gałąź `autobot/P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1`,
worktree `/home/user/wt-panel-kolejka-pasek` — potwierdzone `git log -1` PRZED pracą.

## GOAL (z dispatchu, bez przesunięcia)

Sekcja „Kolejka produkcji" w panelu imperium dostaje poziomy pasek postępu przy pozycji na
froncie kolejki, wizualnie spójny z paskiem sekcji „Produkcja nauki"; procent liczbowy ZOSTAJE
(„oprócz procentów", nie zamiast). GOAL 2 — stopka rozróżnia znaczenie obu pasków. GOAL 3 —
pięć przypadków brzegowych. GOAL 4 — nowa bramka real-render.

## FORMUŁA PASKA (wprost, bo to główne ryzyko tematu)

```
pct = clamp( round( front.postep / max(1, front.koszt) * 100 ), 0, 100 )   // gdy front.postep != null
pct = null                                                                 // gdy front.postep == null
```

`empireDetailPanel.ts:2099-2101`. To formuła **BEZWZGLĘDNA** — ukończenie pozycji 0-100%.
**Nie** jest to `wartość / max(wartości)`, czyli formuła paska nauki (`:1971`,
`pct = maxN > 0 ? round(n / maxN * 100) : 0` — udział wobec najsilniejszego miasta), która
została **nietknięta**. Sama formuła kolejki istniała już w bazie (liczyła procent w nawiasie);
temat podpina ją do szerokości paska, nie przelicza jej od nowa.

Rozróżnienie jest dowiedzione pomiarem, nie deklaracją: fixture bramki dobrano tak, żeby obie
formuły dawały różne wyniki dla tych samych miast (Sparta 63% bezwzględnie vs 42% względnie,
Ateny 75% vs 30%, Lu 7% vs 5%), a asercje (D) wymagają zgodności z bezwzględną **i**
niezgodności ze względną.

## DECYZJA O SIATCE (recon F — przeszkoda konstrukcyjna)

Siatka `'1fr 1.3fr 0.7fr'` **została bez zmian**; pasek stoi jako blok POD nazwą i procentem,
wewnątrz tej samej komórki „BUDUJE TERAZ" (`display:block;margin-top:4px`).

Uzasadnienie z pomiaru, nie z wyczucia. Panel ma realne 404px; po odjęciu paddingów kolumna
„BUDUJE TERAZ" to ok. 140px. Nazwy z realnych danych („Dom Starszyzny", „Mury miejskie") same
zajmują tam dwie linie — pasek wstawiony *obok* nazwy dostałby kilkanaście pikseli i przestałby
być czytelny jako pasek. Poszerzenie kolumny musiałoby odebrać szerokość kolumnie MIASTO albo
W KOLEJCE, których treść już jest na granicy. Układ pionowy daje paskowi pełną szerokość
kolumny przy zerowym koszcie dla sąsiadów.

Dowód na zrzucie przy 12 miastach (`dowody/kolejka-pasek-po-12-miast.png`): żadna komórka nie
przepełnia swojej kolumny (asercja G: max nadmiar 0-1px), tabela nie rozpycha panelu w poziomie,
a wiersz z paskiem jest realnie wyższy od wiersza bez paska (czyli pasek zajmuje miejsce, nie
jest pudełkiem o zerowej wysokości).

## ZMIANY / COMMIT

Allowlist-only, dodawane po nazwie (zakaz `git add -A` respektowany):
- `gra/src/ui/empireDetailPanel.ts` — helper `empireBarHtml()` (wspólny tor: 8px / 999px /
  `#1f2733`), użyty w OBU sekcjach; pasek w wierszu kolejki; rozszerzona stopka sekcji.
- `gra/tools/panel-kolejka-pasek-postepu-test.cjs` — nowa bramka (żywy Chromium).
- `dyspozycje/autobot/runs/P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1/**` — ten raport + `dowody/`.

Sekcja „Produkcja nauki" — wzorzec, nie cel — dostała wyłącznie wywołanie wspólnego helpera.
Dowód „przed i po" (skrypt roboczy w scratchpadzie, poza repo):
- zrzuty `dowody/nauka-wzorzec-PRZED.png` i `dowody/nauka-wzorzec-PO.png` są **bajt w bajt
  identyczne** (26802 = 26802 B);
- wygenerowany HTML paska nauki jest identyczny po odjęciu SAMYCH atrybutów `class`
  (`civ-emp-nauka-bar` / `-fill`), do których nie ma żadnej reguły CSS — służą tylko selekcji
  w bramce;
- stopka sekcji nauki bez zmian.

## PRZYPADKI BRZEGOWE (GOAL 3) — rozstrzygnięcia

| Przypadek | Rozstrzygnięcie | Dlaczego |
|---|---|---|
| kolejka pusta | brak paska, komórka nadal „pusta" | nie ma czego pokazywać; 0% byłoby kłamstwem |
| `front.postep == null` | brak paska **i** brak procentu | „nie wiadomo" ≠ „nie zaczęto"; pusty tor zrównałby dwa różne stany danych |
| 0% | tor widoczny, wypełnienie o szerokości 0 | miasto nie może zniknąć z tabeli (Yan, Zhao ze zrzutu właściciela) |
| 100% | wypełnienie = tor, `overflow:hidden` + clamp | brak przelania; sprawdzone też dla `postep > koszt` (150/100) |
| kolejka wstrzymana | pasek zostaje, wypełnienie **wygaszone** (szary gradient) + dopisek „· wstrzymana" | zgromadzony postęp istnieje i ma być widoczny, ale pasek nie może sugerować, że rośnie |

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **zielone** (tsc 5.9.3, przez symlink
  `gra/node_modules` → drzewo główne; C-029 sprawdzone).
- `node tools/panel-kolejka-pasek-postepu-test.cjs` — **82/82 pass, 0 fail** (79 pass przy
  `--skip-vite`). Bramka mierzy szerokości `getBoundingClientRect()` toru i wypełnienia, nigdy
  atrybutu `style`; tolerancja ≤1 p.p.
- Bramki referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6** — bez regresu.
- Bramki panelu imperium — wyniki w sekcji niżej.

### Dowód nietautologiczności (Tryb czwarty)

Dwie niezależne warstwy:
1. **W samej bramce (sekcja M)** — drugi bundel esbuild z formułą podmienioną na `pct = 100`
   dla wszystkich pozycji, BEZ dotykania pliku w repo; asercje (A)/(B)/(C1)/(C3) muszą się na
   nim zapalić na czerwono. Kotwica `PCT_RE` rzuca wyjątkiem, gdy przestanie trafiać w kod —
   mutacja nie może po cichu „przejść".
2. **Mutacja pliku w repo** — wynik w sekcji „Mutacja źródła" niżej.

Zrzut zmutowanego renderu (`dowody/kolejka-pasek-mutacja-pct100.png`) pokazuje wprost, jak
wygląda błąd: wszystkie miasta na 100%, Wei (brak `postep`) dostaje pasek, którego mieć nie może.

**Mutacja źródła (plik w repo, wynik wklejony, zmiana cofnięta).** Dwa warianty:

1. `const pct = 100` w miejsce formuły — bramka pada **natychmiast**: FAIL na statycznej kotwicy
   „(0) formuła paska kolejki jest BEZWZGLĘDNA", a plugin antytautologiczny przerywa przebieg
   nazwanym błędem `mutacja (M): kotwica PCT_RE nieaktualna` (exit ≠ 0). Mutacja nie może po
   cichu „przejść jako zielona".
2. `empireBarHtml(100, …)` zamiast `empireBarHtml(pct, …)` — czyli pasek odcięty od formuły przy
   nietkniętych procentach w nawiasie; kotwica nadal trafia, więc cały zestaw asercji
   przeglądarkowych się wykonuje: **66 pass, 13 fail**. Czerwone są dokładnie te asercje, które
   mają być czerwone: 7× (A) szerokość ≠ oczekiwany procent (zmierzone 100 zamiast 63/75/0/0/33/7/25),
   2× (C1) zero przestaje być pustym torem, 1× (C5) wstrzymana ma złą szerokość, 3× (D) rozróżnienie
   formuły bezwzględnej od względnej.

Po obu przebiegach źródło przywrócone; `tsc --noEmit` zielone, bramka znów **82/82**.

## BRAMKI PANELU IMPERIUM (znalezione samodzielnie)

> **KOREKTA (2026-09-05, obrona rundy 1, zarzut 1 Evaluatora — §13b).** Bilans w tej sekcji
> jest **błędny i nie domyka się**: 36 zielonych + 8 czerwonych + 1 skrypt = 45 przy 43 plikach,
> a `hud-tooltip-body-mounted-panels-test.cjs` nie trafiło na listę czerwonych. Poprawny,
> przemierzony bilans (36 zielonych + 6 czerwonych z parytetem + 1 skrypt = 43) oraz pomiar
> przeplatany HEAD/BAZA dla trzech bramek wrażliwych na obciążenie: **`02-operator-obrona.md`**.
> Poniższy tekst zostaje w niezmienionej postaci jako ślad tego, co raport mówił wcześniej.
> Wniosek „żadna czerwona nie jest regresem tego tematu" korekta **potwierdza**, nie odwraca.

`ls gra/tools/ | grep -Ei "empire|imperium|panel"` → 43 pliki `.cjs`, uruchomione **wszystkie**.
36 zielonych. Osiem czerwonych + jeden skrypt niebędący bramką — **żadna nie jest regresem tego
tematu**, każda sprawdzona na czystej bazie `21ae70b6` w osobnym worktree `wt-pkpp-parity`
(usunięty po pomiarze, `git status --porcelain` pusty przed usunięciem — C-033):

| Bramka | Ten temat | Czysta baza `21ae70b6` | Werdykt |
|---|---|---|---|
| `empire-food-b5-test` | 25 pass / 3 fail | 25 pass / 3 fail | parytet — zastane |
| `empire-panel-econ-slider-visibility-test` | 57 / 3 | 57 / 3 | parytet — zastane |
| `empire-panel-miasto-obywatele-content-test` | 113 / 2 | 113 / 2 | parytet — zastane |
| `empire-panel-moc-scroll-preserve-test` | 38 / 9 | 38 / 9 | parytet — zastane |
| `empire-panel-sliders-always-visible-test` | 6 / 2 | 6 / 2 | parytet — zastane (plik sam deklaruje SUPERSEDED) |
| `hint-toast-zindex-empire-panel-test` | exit 1 | exit 1 | parytet — zastane |
| `sidepanel-hud-deadzone-test` | 20 / 13 | 20 / 13 | parytet — zastane |
| `sidepanel-blocking-card-cutoff-real-render-test` | **47 / 0** po ponowieniu | 47 / 0 | **flake obciążeniowy, nie regres** |
| `preview-unit-side-panel-screenshots.cjs` | exit 1 | — | to nie bramka, tylko skrypt podglądu; pada na braku binarki Playwrighta (INFRA) |

Uwaga do ostatniego wiersza z bramek: pierwszy przebieg `sidepanel-blocking-card-cutoff` dał
44/3, ale wszystkie trzy porażki brzmiały `locator.click: Timeout 8000ms exceeded` — bez różnicy
treściowej. Maszyna była wtedy obciążona równoległymi Chromium innych worktree; ponowienie na
spokojnej maszynie w TYM worktree dało **47 pass, 0 fail**, identycznie jak baza. To timeout
kliknięcia pod obciążeniem, nie zmiana zachowania.

Bramki zielone objęte przebiegiem (wyciąg): `empire-miasta-table` 96/0, `empire-armia-produkcja`
51/0, `empire-nauka-panel-coverage` 15/15, `empire-praca-panel-coverage` 15/15,
`empire-skarbiec-panel-coverage` 12/12, `empire-religia-panel-coverage` 15/15,
`empire-trade-route-split-real-render` 58/0, `empire-panel-split` 25/0, `escape-overlay-real-panels`
49/0, `porzadek-panel-czytelnosc` 81/0, `side-list-hud-panel-coverage` 74/74,
`sidepanel-diplo-dismiss-real-render` 35/0, `citypanel-konwerter-produkcja` 83/0.

## ZRZUTY (obejrzane i opisane)

`dowody/`:
- `kolejka-pasek-po-12-miast.png` — **główny dowód**: tabela przy 12 miastach + stopka.
  Obejrzane: Sparta „Dom Starszyzny (63%)" — nazwa łamie się na dwie linie, pasek pod nią
  wypełniony w ok. 2/3; Ateny 75%; Yan i Zhao — pusty tor przy 0%, wiersze nie znikają; Qin 100%
  — wypełnienie kończy się dokładnie na krawędzi toru; Wei — sam „Targowisko", bez paska i bez
  procentu; Chu — szare „pusta", bez paska; Han — pasek wyraźnie SZARY wobec niebieskich sąsiadów,
  dopisek „· wstrzymana"; Lu 7% — wypełnienie widoczne jako wąski kikut, nie zeruje się;
  Song 99%; Qi 100% (postęp 150 przy koszcie 100, przycięty); Yue — najdłuższa nazwa, dwie linie,
  pasek pod spodem. Kolumna „W KOLEJCE" nietknięta, prawa krawędź równa dla wszystkich wierszy.
- `kolejka-pasek-po-12-miast-cala-zakladka.png` — kontekst całej zakładki (3724px).
- `kolejka-pasek-mutacja-pct100.png` — materiał „jak wygląda błąd".
- `nauka-wzorzec-PRZED.png` / `nauka-wzorzec-PO.png` — wzorzec przed i po (bajt w bajt identyczne).
- `kolejka-pasek-po-12-miast-wzorzec-nauka.png` — pasek nauki obok, do porównania toru.

## BLOKADY

Brak. Nie było potrzeby `DECISION_REQUIRED`: dane (`econ.queue`, `front.postep`, `front.koszt`,
`econ.queueWstrzymana`) są w widoku dostępne, `empireDetailTypes.ts` i źródło danych nietknięte.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — ponumerowane zarzuty wg `R-PROC-AUTOBOT.md` §16a.

DEPLOY/PUSH: **NIE WYKONANO**
