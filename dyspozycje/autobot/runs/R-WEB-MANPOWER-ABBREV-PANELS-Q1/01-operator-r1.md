STATUS: PASS
DOMAIN: GAME (WEB) — UI: skracanie liczb w panelach
TEMAT: R-WEB-MANPOWER-ABBREV-PANELS-Q1
GOAL: panele miasta, rekrutacji, imperium i `rekruciMaxLabel` używają wspólnego formatera k/M zamiast „tys./mln”.

## Pomiar PRZED (baza origin/main 95a4b25ab)
`formatManpower` (manpower.ts:902 -> `formatPopulationAbs`): 999 -> „999”, 1000 -> „1 tys.”, 12345 -> „12.3 tys.”, 1234567 -> „1.2 mln”.
Użycia: cityPanel.ts ~30 miejsc (m.in. 1674, 1680, 5314-5315, 5575-5576, 5739-5744, 5787, 8260, 8273, 8316, 8325, 9108-9112, 10853-10855, 11064); unitRecruitCard.ts 178-179 (tooltip statusu); empireDetailPanel.ts 1713, 1740, 1904, 2331, 2472, 2516; main.ts 17793, 17985, 17987, 17990, 20520, 20531 (etykiety panelowe) oraz 6733 (komunikat zdarzenia, poza zakresem, zostaje).

## Zmiany
- manpower.ts: dodano cienką `formatManpowerCompact(n)` = `formatCompactNumber(n)`; `formatManpower` bez zmian (manpower-test oczekuje „mln”).
- cityPanel.ts, empireDetailPanel.ts, unitRecruitCard.ts: wszystkie wywołania -> `formatManpowerCompact`.
- unitRecruitCard.ts `manpowerStatusTitle` (tooltip): pełna wartość przez `formatFullNumber` („dostępne 12 345 / potrzebne …”); widoczny tekst = k/M.
- main.ts: 6 etykiet (ludnoscAbsLabel, rekruciLabel, rekruciMaxLabel) przez `formatManpowerCompact`; import.
- NOWY test: gra/tools/manpower-panels-abbrev-test.cjs (źródło paneli + wartości 999/1000/12345/1234567 + tooltip + `formatManpower` bez zmian + zrzut Chromium).
Wartości PO: 999 / 1k / 12,3k / 1,2M.

## Testy
- RED: nowy test na bazie (src z origin/main) -> 17 FAIL (brak `formatManpowerCompact`, „tys./mln”).
- GREEN: gate-test-po.txt EXIT=0.
- Mutacja (--mutate: formatManpower w unitRecruitCard i main.ts) -> FAIL (2 asercje), gate-mutate.txt EXIT=1.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresje `*manpower*`, `*hud*`, `*city-panel*`, `*recruit*` (52 testy) PRZED vs PO: 52/52 EXIT=0 przed, 53/53 po (+ nowy). Brak zmian w istniejących testach.
- Zrzut Chromium: przed.png (16 KB), po.png (14 KB) — lista wartości w starym vs nowym formacie + tooltip. Uwaga: to mini-render formaterów, NIE zrzut pełnego panelu miasta/imperium (NIE_ZMIERZONO pełnej strony w przeglądarce).
- Logi: gate-*.txt z linią EXIT=.

## BLOKADY
Brak. Nie zmierzono: wizualnej szerokości kolumn w pełnych panelach (skrócone teksty są krótsze od poprzednich, ryzyko zawinięcia pomijalne, ale NIE_ZMIERZONO).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
