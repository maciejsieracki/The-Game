# P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1 — dispatch

TEMAT: `P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1`
RUNDA: 1/5
DOMAIN: INFRA (dowód/zabezpieczenie przed rozjazdem — ARCHITEKTURA JEST ŚWIADOMA, przeczytaj
GENEZĘ przed jakimkolwiek ruchem, nie zgaduj kierunku naprawy)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Znalezisko Obrony rundy 3 tematu `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1` (ZINTEGROWANY,
zgłoszone uczciwie jako RYZYKO, nie błąd): `granaryPriorityBonus()` w `gra/src/game/ai.ts`
duplikuje progi populacji z `economy.ts`/`econ-params.json` ręcznie (stałe
`AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY`, `AI_POP_CAP_WITH_GRANARY_I`), zamiast importować
istniejącą funkcję `cityPopulationCap` (`economy.ts:1122`). Dwa niezależne źródła tej samej
liczby mogą się rozjechać przy przyszłej zmianie balansu populacji.

**KRYTYCZNE — przeczytaj PRZED jakąkolwiek zmianą:** komentarz przy `granaryPriorityBonus()`
(`gra/src/game/ai.ts`, ok. linii 1428-1432) mówi WPROST, że duplikacja jest ŚWIADOMA i
CELOWA: „ai.ts nie importuje `economy.ts` wprost, żeby nie ciągnąć całego modułu ekonomii do
testów jednostkowych AI". To NIE jest przeoczenie do naprawienia importem — to udokumentowany
kompromis architektoniczny z tej samej rundy, w której powstało to znalezisko. Ślepe
„zaimportuj `cityPopulationCap`" złamałoby ten kompromis bez rozstrzygnięcia, czy wciąż jest
ważny.

## GOAL

1. Przeczytaj CAŁY komentarz przy `granaryPriorityBonus()` i `AI_POP_CAP_*` (ok. linii
   1415-1490 w `gra/src/game/ai.ts`) — potwierdź własnym odczytem powyższe ustalenie.
2. Sprawdź, czy istnieje JAKIKOLWIEK istniejący test/bramka pilnująca zgodności
   `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY`/`AI_POP_CAP_WITH_GRANARY_I` z realnymi wartościami
   `cityPopulationCap()`/`econ-params.json` dla wszystkich trzech trudności — grep
   `gra/tools/*.cjs` po tych nazwach. Prawdopodobnie NIE istnieje (recon orkiestratora nie
   znalazł żadnego) — potwierdź to sam, nie zakładaj.
3. **Jeśli nie istnieje: dodaj nową bramkę test-only** (nowy plik albo sekcja w istniejącym
   pliku bramki AI), która dla wszystkich trzech trudności (easy/normal/hard) porównuje:
   - `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY[trudność]` względem realnego
     `cityPopulationCap(false, false, params)` z prawdziwymi `params` załadowanymi z
     `econ-params.json` dla tej trudności;
   - `AI_POP_CAP_WITH_GRANARY_I` względem `cityPopulationCap(false, true, params)`.
   Bramka MUSI wywoływać realne funkcje/dane (import bundlowany albo `require`), nie
   przepisywać liczb ręcznie po raz trzeci. Dowód mutacyjny: zmiana jednej z ręcznych stałych
   w `ai.ts` (tymczasowo, cofnięta po teście) musi realnie zaczerwienić nową bramkę.
4. **NIE zmieniaj `gra/src/game/ai.ts` w tej rundzie** — to jest zadanie „dodaj zabezpieczenie
   przed cichym rozjazdem", nie „usuń duplikację przez import". Jeśli po kroku 2 dojdziesz do
   wniosku, że jednak należy zaimportować `cityPopulationCap` (np. bo koszt „ciągnięcia modułu
   ekonomii do testów AI" okazał się nieaktualny/nieistotny) — **STOP, DECISION_REQUIRED** z
   uzasadnieniem, dlaczego udokumentowany kompromis już nie obowiązuje; nie decyduj o tym
   samodzielnie.

## BINARNE KRYTERIUM SUKCESU

- Nowa bramka (albo rozszerzenie istniejącej) porównuje WSZYSTKIE stałe `AI_POP_CAP_*` z
  realnym `cityPopulationCap()`/`econ-params.json` dla easy/normal/hard, wywołaniem realnych
  funkcji/danych.
- Dowód mutacyjny: ręczne rozjechanie jednej stałej w `ai.ts` (tymczasowo) realnie czerwieni
  nową bramkę; przywrócenie — zielona.
- Zero zmian w `gra/src/**` — wyłącznie nowa/rozszerzona bramka testowa.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- Nowa bramka test-only (np. `gra/tools/ai-granary-prog-populacji-spojnosc-test.cjs`) albo
  rozszerzenie istniejącej bramki AI-ekonomicznej, jeśli bardziej pasuje po przeczytaniu kodu.
- `dyspozycje/autobot/runs/P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1/**`

Zakazane bezwzględnie: `gra/src/**` (diagnoza/odczyt TAK, jakakolwiek zmiana wymaga
DECISION_REQUIRED — patrz GOAL pkt 4), `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-ai-granary-prog-populacji`, gałąź
`autobot/P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1`, baza jawnie `origin/main` (commit
`568f1bbe` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/kodu produkcyjnego AI — wyłącznie nowa bramka zabezpieczająca.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Usunięcie duplikacji przez import `cityPopulationCap` do `ai.ts` — zawsze DECISION_REQUIRED,
  nigdy samodzielna decyzja, bo koliduje z udokumentowanym kompromisem architektonicznym.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
