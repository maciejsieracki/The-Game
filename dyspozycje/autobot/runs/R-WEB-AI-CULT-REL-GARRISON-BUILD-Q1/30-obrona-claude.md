# R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 — obrona Operatora (runda 2, Haiku 5.5)

STATUS: BLOCK (cel gameplayowy NIE dostarczony; zrobiona diagnoza z kodu, dokument analizy i bramki bazowe; wpięcie i pomiar do kolejnej rundy)
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 (AICULT #189)
GOAL: na poziomie „Kultura i religia” normalny/trudny AI trzyma garnizon wg potrzeby miasta i buduje budynki Prawa/Szczęścia; pomiar PRZED/PO (seed 4242 i 7, 60 tur, poziom maksymalny).
BAZA: kandydat 24db8cbd228953144b553ce0605c570d6aca9fcf (r1 4617cc91b + raport r2); baza kodu 9bfb104fba9b40d8b43009d79fbf8ba0d41b9e3e (FALA 924)
ZMIANY/COMMIT: w tej rundzie dodano dwa pliki dokumentacyjne (brak zmian w kodzie gry): `dyspozycje/analizy/AI-KULTURA-RELIGIA-2026-11-26.md` (nowy) i ten raport. SHA czubka: patrz pole sha w StructuredOutput.

## Odpowiedzi na zarzuty Evaluatora (runda 2)

| nr | zarzut | decyzja | dowód / stan |
|---|---|---|---|
| 1 | `aiCityGarrisonNeed` nie wpięta w rekrutację garnizonu | PRZYJMUJĘ, NIE ZROBIONE | `grep -rn "aiCityGarrisonNeed\|aiGarrisonNeedApplies" gra/src gra/tools` poza `ai-city-order-need` — brak trafień (wynik surowy: pusto). Wpięcie wymaga wejścia miasta (Szczęście, Prawo z budynkami, osiedle, kultura/religia) z main.ts przez `opts` oraz wykluczenia wielu jednostek garnizonu z puli armii w ok. 6 konsumentach `garrisonUnitIdSet` w ai.ts. Nie zrobiono w tej rundzie, żeby nie wprowadzić niespójnego wpięcia (szczegóły: dokument analizy, pkt 1 i 5). |
| 2 | brak preferencji budynków Prawa/Szczęścia | PRZYJMUJĘ, NIE ZROBIONE | `chooseCityProduction` (ai.ts ok. linia 2005) nie ma wagi zależnej od poziomu „Kultura i religia”; zmiana bez wejścia Porządku byłaby zgadywaniem. |
| 3 | brak diagnozy PRZED/PO (NIE_ZMIERZONO) | PRZYJMUJĘ, CZĘŚCIOWO | Diagnoza z kodu: hipotezy H1–H3 w dokumencie analizy, pkt 2. Pomiar PRZED/PO NIE_ZMIERZONO w tej rundzie (60 tur × 2 ziarna na poziomie maksymalnym wymaga runnera z hakiem i Chromium; nie uruchomiono). Liczby −30% / 36% są z notatek FALI 924, nie z tej rundy. |
| 4 | brak dokumentu `AI-KULTURA-RELIGIA-2026-11-26.md` | PRZYJMUJĘ, ZROBIONE | plik utworzony: `dyspozycje/analizy/AI-KULTURA-RELIGIA-2026-11-26.md` (sekcje: stan kodu, diagnoza, funkcja potrzeby, bramki, co pozostaje). |
| 5 | brak testów wpięcia i mutacji | PRZYJMUJĘ, NIE ZROBIONE | Nie ma czego mutować: wpięcie nie istnieje. Istniejące testy `ai-city-order-need-test.cjs` (35/0) nie są testami wpięcia. |
| 6 | Operator nie uruchomił `npm ci` ani bramek bazowych | PRZYJMUJĘ, ZROBIONE CZĘŚCIOWO | `npm ci --ignore-scripts` w `gra/` EXIT=0. Wyniki poniżej. Pozostałe bramki NIE ZMIERZONO. |

## Surowe wyniki bramek (kandydat 24db8cbd2, runda 2)

- `npm ci --ignore-scripts` (gra/): EXIT=0 (log: `/tmp/claude-0/npmci.log`).
- `npx tsc --noEmit -p .` (gra/): TSC_EXIT=0 (log: `/tmp/claude-0/tsc.log`, pusty błąd).
- `node tools/ai-city-order-need-test.cjs`: `ai-city-order-need-test: 35 passed, 0 failed (of 35)`.
- `node tools/ai-city-garrison-min-one-test.cjs`: `ai-city-garrison-min-one-test: 38 passed, 0 failed (of 38)`.
- NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, testy society-* i culture-religion-level 59/0 (nie uruchamiane w tej rundzie).
- NIE ZMIERZONO: pomiar PRZED/PO na poziomie trudnym (seed 4242 i 7, 60 tur).

## Co pozostaje (kolejność dla rundy 3)

1. Wejście miasta dla funkcji potrzeby (z main.ts, przez `opts`), wpięcie `aiCityGarrisonNeed` w `emptyCityGarrisonRecruitIds` tylko dla `aiGarrisonNeedApplies`, cel = max(1, need), wykluczenie wszystkich jednostek garnizonu z puli armii.
2. Preferencja budynków Prawa/Szczęścia w `chooseCityProduction` przy deficycie Porządku, tylko normalny/trudny.
3. Testy wpięcia i mutacje; zgodność łatwy/null bit-w-bit (ai-test 297/0).
4. Pomiar PRZED/PO na trudnym, seed 4242 i 7, 60 tur, z licznikiem powodów.
5. Jeżeli przyczyną okaże się utrzymanie jednostek (H3), temat wymaga DECISION_REQUIRED (balans).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazuje runner w `dyspozycje/autobot/runs/R-WEB-CULT-REL-IMPL-Q1/`; w tym worktree nie został użyty (nie zweryfikowano jego obecności w gałęzi bazowej).
- Operator nie zadał pytań ABC właścicielowi. Pytanie 36 (CULTIMPL) pozostaje w rejestrze bez zmian.
- Zależności zainstalowane w `gra/node_modules` (ignorowane przez git). Nie uruchamiano `npm run build/dev`.
- Ta runda nie zmienia kodu gry; wynik BLOCK oznacza brak dostarczonego celu, nie regresję.

RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL r1; runda 2 = BLOCK z przyczyną: wpięcie wymaga wejścia z main.ts i zmiany wielu konsumentów puli garnizonu)
NASTĘPNY KROK: runda 3 — punkty 1–5 z sekcji „Co pozostaje”.
DEPLOY/PUSH: NIE WYKONANO
