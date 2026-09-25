TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2
RUNDA: 2/5
DATA: 2026-09-23
DOMAIN: GAME
ŚCIEŻKA: B (prompt; Hermes Kanban, bez autoryzowanego Workflow)
MODEL + EFFORT per rola: Operator gpt-5.6-luna / reasoning_effort=high; Evaluator gpt-5.6-luna / reasoning_effort=high; Final Control gpt-5.6-luna / reasoning_effort=high; integracja orkiestratora gpt-5.6-luna / reasoning_effort=medium

## WYZWALACZ
Powrót po FAIL/re-review rundy 1, zgodnie z decyzją Evaluatora z 2026-09-23: implementacja została zachowana i przeszła focused readback, ale brakowało kompletnego artefaktu dispatchu `00-dispatch.md`; runda 2 ma uzupełnić ten artefakt na tym samym ID, worktree i zakresie, bez resetu licznika.

## GOAL
Podłączyć mp_regen_proc, mp_max_proc i mp_koszt_jednostki_proc do żywej ścieżki Manpower dla gracza, AI, miasta, kolejki rekrutacji, odnowy i UI.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. [NOWE] MANPOWER-WIRING: PRAWDA wyłącznie wtedy, gdy niezależne uruchomienie `NODE_PATH=/home/ubuntu/projects/The-Game/gra/node_modules node tools/manpower-test.cjs` potwierdzi exact-ID consumery `mp_regen_proc`, `mp_max_proc` i `mp_koszt_jednostki_proc` w żywej ścieżce player/AI/city-state, kolejce rekrutacji, kosztach/refundach, odnowie/utrzymaniu i UI; wynik musi być jawnie zapisany jako X OK, 0 FAIL. FAŁSZ przy choć jednym brakującym consumerze albo przy teście sprawdzającym wyłącznie kopię formuły.
2. [NOWE] MANPOWER-BOUNDARY: PRAWDA wyłącznie wtedy, gdy ten sam `gra/tools/manpower-test.cjs` przejdzie realny fixture/override dla niezależnych max/cost oraz granicy 0/-100%, a kod produkcyjny nie używa placeholderowego clampu `0.1`; FAŁSZ przy przejściu tylko wartości dodatnich albo przy sztucznym, nietestowanym obejściu granicy.
3. [ISTNIEJĄCA BRAMKA DEFENSYWNA] TS-PARSE: PRAWDA wyłącznie po esbuild parse wszystkich siedmiu zmienionych plików TypeScript (`civ-matrix-semantic.ts`, `manpower.ts`, `population-growth-v85.ts`, `production.ts`, `turn-economy.ts`, `main.ts`, `cityPanel.ts`) bez błędu. Nie wolno zastąpić tego deklaracją Operatora.
4. [ISTNIEJĄCA BRAMKA DEFENSYWNA] SCOPE-DATA: PRAWDA wyłącznie, gdy `git diff --name-only` mieści się w allowliście, `git diff -- gra/data/civ-matrix.json` jest pusty, a `git diff --check` przechodzi. Jakakolwiek zmiana danych macierzy albo pliku spoza allowlisty = FAŁSZ/FAIL.
5. [ISTNIEJĄCA BRAMKA DEFENSYWNA] TYPECHECK: jeśli lokalne, przypięte zależności zawierają wymagany `three` i TypeScript 5.9.3, `node ./node_modules/typescript/bin/tsc --noEmit` musi zwrócić 0 diagnostyków; brak wymaganej zależności raportować jako `INFRA`, nigdy jako zielony wynik z innego kompilatora.
6. [ISTNIEJĄCA BRAMKA PROCESOWA] DISPATCH-COMPLETE: PRAWDA wyłącznie, gdy ten plik zawiera wszystkie pola szablonu: DATA, DOMAIN, ŚCIEŻKA, model+effort per rolę, wyzwalacz, jednozdaniowy GOAL, binarne kryteria z nazwanymi testami/bramkami, allowlistę, izolację z jawną bazą, regułę przeciw samooszukiwaniu, procedurę naprawczą FAIL oraz GRANICE/OBIEG.

## ALLOWLISTA — nic poza tym

Kod i test tematu:
- `gra/src/game/civ-matrix-semantic.ts`
- `gra/src/game/manpower.ts`
- `gra/src/game/population-growth-v85.ts`
- `gra/src/game/production.ts`
- `gra/src/game/turn-economy.ts`
- `gra/src/main.ts`
- `gra/src/ui/cityPanel.ts`
- `gra/tools/manpower-test.cjs`

Artefakty tego runu:
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923/00-dispatch.md`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923/01-operator.md`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923/02-evaluator.md`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923/03-final-control.md`
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923/04-integration.md`

W tej rundzie naprawa procesowa dotyczy wyłącznie brakującego/niekompletnego `00-dispatch.md`; istniejące zmiany implementacyjne pozostają bez resetu i bez rozszerzania zakresu.

Zakazane bezwzględnie: `gra/data/civ-matrix.json` oraz całe `gra/data/**`, pozostałe pliki `gra/**` i repo poza powyższą listą, pliki z sekretami/kluczami/poświadczeniami, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, `gra-robocza/**`, `gra-kanon/**`, `dist/**`. Zakazane są również `npm run build`, `npm run dev`, commit, push, merge i deploy.

## IZOLACJA

Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-manpower-r2-20260923`
Gałąź: `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923`
Baza jawna: `origin/main` = `a8c9cf6c181f688201dd45e6a5871da1b0eb1301`; HEAD przed tą rundą musi wskazywać ten hash. Sparse-checkout bez `gra-robocza/`, `gra-kanon/` i `dist/`.

To jest recovery na tym samym worktree po FAIL: istniejące, niezacommitowane zmiany z allowlisty implementacyjnej są zachowane. Nie wolno wykonywać `git reset`, `git checkout`, `git clean`, stashowania ani kopiowania zmian do innego drzewa w celu „wyczyszczenia” statusu. Przed pracą sprawdzić `git log -1 --oneline`, `git status --short` i porównać każdą ścieżkę statusu z allowlistą.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Tryb „deklaracja zamiast artefaktu” oraz „wynik bramki z pamięci”: raport Operatora, wcześniejsze 72 OK ani status Kanbana nie są dowodem. Evaluator musi sam uruchomić `manpower-test.cjs`, parser TypeScript, `git diff --check`, kontrolę diffu danych i readback exact-ID consumerów; przy parytecie gracz/AI sprawdza ścieżkę wykonywaną przez żywą grę, a nie tylko opcjonalny resolver testowy. Każdy wynik podany bez świeżego stdout/stanu Git traktować jako FAŁSZ.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator zapisuje ponumerowany, konkretny zarzut z miejscem w pliku/funkcji i wskazuje dokładnie jedną poprawkę. Obrona odpowiada na każdy zarzut dowodem z wytworu. Final Control orzeka per zarzut `NAPRAW` / `ODDAL` / `DO DECYZJI CZŁOWIEKA`; choć jeden `NAPRAW` oznacza FAIL. Przy FAIL kolejna próba wraca do Operatora na tym samym pełnym ID i tej samej gałęzi, z zachowaniem implementacji i historii; runda 2 jest bieżącą rundą po FAIL rundy 1, a następny retry może być wyłącznie rundą 3/5. Nie wolno tworzyć nowego ID, nowej gałęzi ani cicho zerować licznika. Po rundzie 5 zatrzymać automatyczny retry i wystawić `LIMIT-5-EXCEEDED` z ostatnim werdyktem, blokadą i decyzją wymaganą od orkiestratora/właściciela. Przy konflikcie kontraktu nie zgadywać: zapisać `decision-abc.md`, `DECISION_REQUIRED` i `ABC-OCZEKUJE` zgodnie z C-054.

## GRANICE (naruszenie = FAIL)

Obowiązuje `docs/decyzje/R-PROC-AUTOBOT.md` §9 oraz C-001/C-008/C-025/C-026/C-034/C-044/C-050/C-052/C-055/C-056/C-059. W szczególności: nie zmieniać `gra/data/civ-matrix.json`; nie wykonywać `npm run build` ani `npm run dev` w `gra/`; nie używać `git add -A` ani `git add .`; nie wprowadzać sekretów; nie rozszerzać allowlisty ani naprawiać „przy okazji"; zachować parytet player/AI; nie commitować, pushować, mergować ani deployować. Operator, Evaluator i Final Control nie integrują i nie wystawiają `READY_FOR_DEPLOY`.

## OBIEG

Operator → Evaluator → (Obrona przy niepustej liście zarzutów) → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push. Operator nie ocenia własnej pracy, nie integruje, nie deployuje i nie pushuje; Evaluator nie zastępuje Final Control; Final Control działa jako osobny subagent. Każde terminalne przejście Kanbana wymaga technical/context readbacku karty, eventu, grafu, artefaktów i legalnego następcy; brak readbacku nie jest dowodem zamknięcia.
