STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko narzędzie testowe; kod gry nie zmieniony)
TEMAT: R-WEB-TEST-DEBT-RESOURCE-USAGE-BREAKDOWN-BUILD-Q1
GOAL: test gra/tools/resource-usage-breakdown-test.cjs buduje się i kończy kodem 0 przy zielonym wyniku (1 przy czerwonym). Naprawa wyłącznie w narzędziu testowym.
BAZA: origin/main = 8429376275be863d1de0871dca4b1266bd77a809 (842937627), checkout --detach.

ZMIANY/COMMIT: gra/tools/resource-usage-breakdown-test.cjs (jedyny zmieniony plik). Raport: ten plik. Brak zmian w gra/src, WERSJE.md, manifeście, gra-robocza/, rust-port/.

## Tabela (skrypt | wynik przed | klasa | działanie | wynik po)

| Skrypt | Wynik PRZED (origin/main) | Klasa | Działanie | Wynik PO |
|---|---|---|---|---|
| resource-usage-breakdown-test.cjs (krok esbuild) | exit 1: `No loader is configured for ".svg"` (brandAssets.ts:18, scienceOwlIcon.ts:6, pliki ?raw) | D (środowisko/narzędzie) | dodano loader `.svg: 'text'` (+ `.png: 'dataurl'`) jak w barb-karencja-czas-trwania-real-render-test.cjs | po loaderze: exit 1 kolejnymi błędami D (niekompletny stub brandAssets, `import.meta.glob`, `document is not defined`) |
| j.w., stub brandAssets | 20 błędów `No matching export` | D | stub eksportuje wszystkie 13 funkcji + 3 CSS z brandAssets.ts; filtr `/brandAssets$/` | przeszło |
| j.w., leaderPortraits.ts | `import.meta.glob is not a function` | D | stub leaderPortraits (6 eksportów) | przeszło |
| j.w., filePlayer.ts i inne moduły src/ z `import.meta.glob(` | `import_meta.glob is not a function` | D | onLoad: `import.meta.glob(` → `__viteGlobStub(` zwracający `{}` (tylko w bundlu testu) | przeszło |
| j.w., cityPanel.ts (side effect na imporcie) | `ReferenceError: document is not defined` | D | minimalny szkielet globalThis.document/window/localStorage przed require bundla (tylko test) | uruchomione: 93 passed, 7 failed |
| sekcja D3, D4 (gracz) | FAIL x2 | A | asercja szukała literału `set(0, ...)`; kod publikuje w pętli `for (const hOid of humanSeats.humanOwnerIds)` (main.ts:41559, :41561) | PASS (asercja dostosowana do `set(hOid, ...)`) |
| sekcja D8 (AI unit) | FAIL | A | okno 500 zn. za `deductBuildingStockCostAcrossCities` za krótkie: między deduct a publikacją wstawiono `recordTakenToLedger` (main.ts:41595-41602) i długą linię converterProducedLastTurnByOwner; linia `unitResourceUpkeepByOwner.set(oid,...)` = main.ts:41602 | PASS (okno 1000 zn.; D7/D9 nadal działają) |
| sekcja E3, E3b (fallback budynków) | FAIL x2 | A | `cityBuilt` opakowane w `operationalBuiltByCity(cities, cityBuilt)` (main.ts:3983); fallback nadal czyta ŻYWY cityBuilt | PASS |
| sekcja F (5 miejsc czyszczenia) | 0 z 5 (trójka linii) | A | w 5 miejscach (main.ts:47843, 48160, 48415, 48653, 49025) `buildingResourceUpkeepByOwner.clear(); converterProducedLastTurnByOwner.clear();` w jednej linii; policzono `citizenUpkeepByOwner.clear()`=5, `buildingResourceUpkeepByOwner.clear()`=5, `unitResourceUpkeepByOwner.clear()`=5 | PASS (wzorzec trójki zaktualizowany) |
| sekcja H6 (miejsce resUsageDetailsHtml) | FAIL | A | między `resUsageDetailsHtml(r)` a zamknięciem karty wstawiono `resSkadZapasyHtml(...)` (empireDetailPanel.ts:3587-3589, temat #425); kolejność badge -> usage zachowana | PASS |
| pozostałe asercje A-K (93 szt. w 1. przebiegu) | PASS | - | bez zmian | PASS |

Klasyfikacja B (błąd kodu gry): NIE STWIERDZONO. Wszystkie 7 czerwonych asercji to nieaktualne dopasowania tekstu źródła po refaktorach (A). Kod gry nietknięty; kandydatów R-WEB-* z reprodukcją brak.

## Stan PO (kryterium "jedna komenda, 0 zielone / 1 czerwone")

- `cd gra && node tools/resource-usage-breakdown-test.cjs` -> EXIT=0, `resource-usage-breakdown-test: 100 passed, 0 failed`.
- Dowód kodu 1 przy czerwonym: przebieg z 7 czerwonymi asercjami (przed klasyfikacją A) zakończył się EXIT=1.
- Log: /home/user/The-Game/.claude/worktrees/wf_1dde9ab7-514-1/../wf_rub_after2.log (poza repo).

## TESTY (bramki referencyjne, po `npm ci --ignore-scripts` w gra/, bez pobierania przeglądarki)

- logic-test.cjs: EXIT=0, `LOGIC OK (213/213)`
- tech-tree-test.cjs: EXIT=0, `tech-tree-test: 20 pass, 0 fail`
- research-test.cjs: EXIT=0, `ALL GREEN`
- unit-replace-test.cjs: EXIT=0, `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test.cjs: EXIT=0, `All sanity checks passed.`
- `npx tsc --noEmit -p tsconfig.json`: EXIT=0 (bez wyjścia)
- `git diff --check`: bez wyjścia (czysto)
- NIE ZMIERZONO: mutacja na kopii pliku (kontrola czułości asercji A-K po zmianie kodu gry). Nie wykonano w tej rundzie; kontrola "1 przy czerwonym" oparta na przebiegu z 7 czerwonymi asercjami (patrz wyżej).
- Testy live (Playwright) nie były wymagane: test jest czysto Node (bez przeglądarki), nie nadpisuje dyspozycje/**/dowody/*.png.

## BLOKADY

Brak twardych blokad. Uwagi:
- Harness testu używa stubów wyłącznie w bundlu testowym (brandAssets, leaderPortraits, globalne document/window/localStorage, zamiana import.meta.glob w src/**/*.ts). Nie zmienia kodu produkcyjnego, ale test sprawdza tekst źródła plików src/main.ts i src/ui/empireDetailPanel.ts (sekcje C-H), więc każdy przyszły refaktor tych linii wymaga aktualizacji asercji (jak w tej rundzie).
- Asercje klasy A zmienione w tej rundzie wymagają oceny Evaluatora (kontrola, że żadna asercja nie została osłabiona bez dowodu: każda zmiana to nowy, dokładniejszy wzorzec wskazujący tę samą linię kodu, zweryfikowany grep-em w main.ts/empireDetailPanel.ts).

## RUNDY

1/5 (ostatni werdykt: brak; decyzja nie wymagana)

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wspomina `git show origin/main:dyspozycje/.../00-dispatch.md`; plik istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (odczytany stamtąd, zgodnie z instrukcją dispatchu).
- Dług harnessu: dalsze zmiany w src/ui/cityPanel.ts (side effect DOM na imporcie) i w modułach z import.meta.glob nie będą wymagały kolejnych stubów tylko dzięki ogólnej podmianie glob i szkieletowi DOM; nowe side effecty DOM mogą wymagać rozszerzenia szkieletu.
- Nie utworzono żadnych sesji/zadań/harmonogramów.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja gra/tools/resource-usage-breakdown-test.cjs (diff, wykonanie, 5 bramek), ocena 7 asercji klasy A.
DEPLOY/PUSH: NIE WYKONANO
