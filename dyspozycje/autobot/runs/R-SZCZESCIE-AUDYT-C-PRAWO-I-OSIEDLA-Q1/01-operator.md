# R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1 — Operator runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
GOAL: wygładzić `prawo_bonus_osiedle_pop` analogicznie do G10 Szczęścia, redukując najgorszy
spadek PorPct na +1 mieszkańca w całej siatce parametrów.

## ZMIANY

- `gra/data/society-params.json` — WYŁĄCZNIE klucz `prawo_bonus_osiedle_pop`:
  było `easy [32,24,16,10]` / `normal [28,20,14,8]` / `hard [22,16,10,6]`,
  jest `easy [10,7,5,3]` / `normal [8,6,4,2]` / `hard [7,5,3,1]` (proporcjonalnie, factor
  ~0,3 do oryginału — NIE kopia wartości Szczęścia `[15,12,8,5]`). Kształt: nadal malejąca
  pop1→4, dodatnia, `pop>4` nadal 0 (mechanizm `pickOsiedlePopBonus` nietknięty). Proporcje
  easy≥normal≥hard zachowane na każdym indeksie, jak w oryginale.
- Nowa bramka `gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs` (nie rozszerzenie —
  uzasadnienie w nagłówku pliku: ani `prawo-przebudowa-skali-test.cjs` ani
  `szczescie-przebudowa-skali-test.cjs` nie mają infrastruktury siatkowego pomiaru
  najgorszego spadku PorPct; to osobny, generyczny harness pomiarowy PRZED/PO).

## POMIAR (harness: esbuild + realny `evaluateOrderFromBreakdown` z
`society-breakdown.ts`, siatka: 3 trudności x 3 epoki x pop 1-14 x 4 warianty administracji
x trybunał x sąd x 3 warianty garnizonu-jednostek x garnizon-budynek x wojna)

- PRZED: najgorszy spadek = **27,1 p.p.** (easy/era1/pop4→5, 95,4%→68,3%) — zgodne rzędem
  wielkości z reconem dispatchu (27,8 p.p.).
- PO: najgorszy spadek = **19,3 p.p.** (ten sam punkt, 100,2%→80,9%).
- Redukcja: **7,8 p.p. (28,8%)**.
- Sprawdzone: floor przy CAŁKOWITYM wyzerowaniu klucza = 15,8 p.p. — połowa podłogi to
  WŁASNE, nietknięte urwisko Szczęścia (`szczescie_bonus_osiedle_pop`, poza allowlistą tego
  tematu; SzPct samo spada 23,9 p.p. surowo w tym punkcie).
- Zero regresji pop≥5: PRZED i PO identyczne **2,2 p.p.** (D4a, wzór ln-populacyjny
  nietknięty — mechanizm `pickOsiedlePopBonus` zawsze zwraca 0 dla `p>4`, więc te przejścia
  nie mogły się zmienić i faktycznie się nie zmieniły).

## DECISION_REQUIRED — dwa punkty (pełny opis: `decision-abc.md` w tym katalogu)

1. **Magnitude**: 19,3 p.p. to nadal ~3,2× więcej niż precedens 6 p.p. zaakceptowany po
   stronie Szczęścia (G10) — zgodnie z jawną instrukcją dispatchu, Operator NIE zgaduje czy
   to akceptowalne i zgłasza dokładną liczbę. Podłoga strukturalna (15,8 p.p.) wynika w
   połowie z nietkniętego urwiska Szczęścia — sam ten temat nie może zejść niżej bez
   naruszenia allowlisty.
2. **Konflikt kontraktu**: zmiana wartości (jedyny dozwolony ruch) czerwieni DWIE bramki
   spoza allowlisty (`szczescie-skala-normalizacja-test.cjs` 4 FAIL,
   `society-breakdown-test.cjs` 6 FAIL) — hardkodują starą wartość klucza jako oczekiwaną
   liczbę. Potwierdzone `git stash`: FAIL nie występują na baseline, przyczyna to wyłącznie
   ta zmiana danych. Operator nie rozszerza sobie allowlisty samodzielnie.

## TESTY

- `tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19,
  `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
- Nowa bramka `szczescie-audyt-c-prawo-osiedla-test.cjs`: 15/15 OK.
- Rodzina Prawo/Szczęście/Porządek/Order/Society (grep):
  `prawo-palac-tier-test` 30/30, `prawo-przebudowa-skali-test` 152/152,
  `prawo-siatka-v2-test` 55/55, `r-wzrost-szczescie-dubel-...-test` 59/59,
  `szczescie-zamoznosc-test` 88/88, `porzadek-panel-czytelnosc-test` 81/81 — zielone.
  `szczescie-przebudowa-skali-test` 515 OK / **4 FAIL — potwierdzone pre-istniejące**
  (identyczne na `git stash`, niezwiązane z tym tematem).
  `szczescie-skala-normalizacja-test` 144 OK / **4 FAIL — NOWE, spowodowane tą zmianą**
  (0 FAIL na baseline).
  `society-breakdown-test` 47 OK / **6 FAIL — NOWE, spowodowane tą zmianą**
  (0 FAIL na baseline).
  `border-march-wygasanie-test` 4 FAIL — pre-istniejące, temat niezwiązany (nie w grep
  filtrze, sprawdzone przy okazji pełnego przebiegu tools/, potwierdzone identyczne na
  `git stash`).

## BLOKADY

DECISION_REQUIRED (dwa punkty wyżej) — właściciel musi rozstrzygnąć: (a) czy 19,3 p.p. jest
akceptowalną redukcją mimo że nie schodzi do rzędu precedensu, (b) czy rozszerzyć allowlistę
o dwie bramki spoza tematu, żeby przeliczyć ich frozen-value asercje na nowe dane.

## RUNDY

1/5

## NASTĘPNY KROK

Właściciel rozstrzyga oba punkty `decision-abc.md`. Do czasu decyzji: ABC-OCZEKUJE,
Evaluator/Final Control NIE dispatchowani.

## DEPLOY/PUSH

NIE WYKONANO
