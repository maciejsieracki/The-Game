# R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 — obrona Operatora (runda 1, Haiku 5.5)

STATUS: FAIL (kryteria binarne z dispatchu NIE są spełnione; zrobiona jest tylko czysta funkcja i jej testy)
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 (AICULT #189)
GOAL: na poziomie „Kultura i religia” normalny/trudny AI trzyma garnizon wg potrzeby miasta i buduje budynki Prawa/Szczęścia; pomiar PRZED/PO (seed 4242 i 7, 60 tur, poziom maksymalny).
BAZA: 9bfb104fba9b40d8b43009d79fbf8ba0d41b9e3e (origin/main, FALA 924)

## Odpowiedzi na zarzuty Evaluatora

| nr | zarzut | decyzja | dowód / stan |
|---|---|---|---|
| 1 | kandydat = baza, brak pracy, brak `aiCityGarrisonNeed` | PRZYJMUJĘ, częściowo naprawione | dodany `gra/src/game/ai-city-order-need.ts` (`aiCityGarrisonNeed`, `aiGarrisonNeedApplies`); NIE wpięte w `ai-city-garrison.ts` ani `ai.ts` |
| 2 | brak preferencji budynków Prawa/Szczęścia w priorytecie budowy AI | PRZYJMUJĘ, NIE ZROBIONE | nie zmieniano planisty budowy; wymaga wejścia miasta (budynki, osiedle, kultura/religia) w miejscu wywołania |
| 3 | brak testów funkcji potrzeby i mutacji | PRZYJMUJĘ, ZROBIONE | `gra/tools/ai-city-order-need-test.cjs`: 35 passed, 0 failed; mutanty M1 (zwrot capUnits zamiast minimum), M2 (porządek ignorowany), M3 (łatwy włączony) — każda łamie asercje |
| 4 | brak diagnozy z liczbami, pomiaru PRZED/PO i dokumentu AI-KULTURA-RELIGIA-2026-11-26.md | PRZYJMUJĘ, NIE ZROBIONE | nie uruchamiano runnera (60 tur × 2 ziarna na poziomie maksymalnym nie mieści się w tej rundzie); brak dokumentu analizy |

## Co faktycznie zrobiono w tej rundzie

- `gra/src/game/ai-city-order-need.ts` — czysta funkcja: najmniejsza liczba jednostek garnizonu [0..capUnits], przy której PorPct (wzór `computePorPct` + `pctFromNetto` z silnika) nie jest w buncie skrajnym (`porPctBand` ≠ `bunt_skrajny`). Brak drogi wyjścia → capUnits. `aiGarrisonNeedApplies` zwraca prawdę tylko dla `normalny`/`trudny`; `latwy` i `null` (zgodność) — fałsz, czyli zachowanie AI bez zmian.
- `gra/tools/ai-city-order-need-test.cjs` — testy N1–N6 (poziomy, granica 12, minimum 1 i 2, brak drogi, zakres) oraz mutacje M1–M3.
- Nie zmieniono: `ai-city-garrison.ts`, `ai.ts`, `main.ts`, buildings, balans, parametry kultury (zakaz z dispatchu zachowany).

## Bramki (surowe wyniki)

- `node_modules/.bin/tsc --noEmit` (gra/): TSC_EXIT=0 (po dodaniu nowego modułu).
- `node tools/ai-city-order-need-test.cjs`: `ai-city-order-need-test: 35 passed, 0 failed (of 35)`, EXIT=0.
- `node tools/ai-city-garrison-min-one-test.cjs` (przed zmianą, baza): `38 passed, 0 failed (of 38)`, EXIT=0 — zgodne z bazą; nie uruchamiano ponownie po zmianie, bo nie zmieniono tego modułu.
- NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, testy society-* i culture-religion-level 59/0 (nie uruchamiane w tej rundzie).
- NIE ZMIERZONO: pomiar PRZED/PO (seed 4242 i 7, 60 tur, poziom trudny/maksymalny); diagnoza −30% jednostek i 36% pustych miast nie została zweryfikowana.

## Ograniczenie modelu (uczciwie)

Tabela CULTMODEL2 (normalny 3/3, trudny 4 dla pop 5, epoka 1, obca kultura i religia) NIE jest sprawdzana: test używa syntetycznych wejść, a pełne wejście miasta (Szczęście i Prawo z budynkami, osiedlem i liniami kultury) wymaga hakowania silnika miasta. Funkcja nie zna jeszcze tych wejść — wpięcie musi je dostarczyć.

## Brakujące elementy do kolejnej rundy (kolejność)

1. Wpięcie `aiCityGarrisonNeed` w rekrutację garnizonu (`emptyCityGarrisonRecruitIds` / `cityNeedsGarrison`) — tylko gdy `aiGarrisonNeedApplies(getCulturaReligiaLevel())`; cel = max(1, need).
2. Preferencja budynków Prawa (Garnizon, Pretorium) i Szczęścia (Świątynia) w miastach z deficytem Porządku — minimalnie w istniejącym priorytecie budowy AI.
3. Diagnoza z liczbami (jednostki, puste miasta, bunty, utrata miast, budynki) na 60 tur, seed 4242 i 7, poziom maksymalny, PRZED i PO; dokument `dyspozycje/analizy/AI-KULTURA-RELIGIA-2026-11-26.md`.
4. Testy tabeli CULTMODEL2 na pełnym wejściu silnika i mutacje w wpięciu.

## UWAGI-DLA-ORKIESTRATORA

- Pytań ABC do właściciela w tej rundzie NIE zgłaszam (Operator nie prowadzi pytań). Otwarte pytanie właściciela, z którego wynika ten temat (pytanie 36 z CULTIMPL: „AI na trudnym −30% jednostek, 36% pustych miast”), pozostaje w rejestrze bez zmian.
- Dokument z dispatchu wskazywał runner w `dyspozycje/autobot/runs/R-WEB-CULT-REL-IMPL-Q1/` — w tej bazie nie sprawdzono jego obecności; nie użyto go.
- W worktree zainstalowano zależności dev (`npm ci --ignore-scripts` w gra/, katalog gra/node_modules ignorowany przez git); nie uruchamiano `npm run build/dev`.

NASTĘPNY KROK: runda 2 — punkty 1–4 z listy powyżej (wpięcie, budynki, pomiar PRZED/PO, testy tabeli).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
