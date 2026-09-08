# Dispatch — H-BUDOWA-KARTA-KOLEJKA-Q1

TEMAT: H-BUDOWA-KARTA-KOLEJKA-Q1
RUNDA: 1/5
DATA: 2026-09-08
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator gpt-5.6-luna / high; Evaluator gpt-5.6-luna / high; Final Control gpt-5.6-luna / high

## WYZWALACZ
Decyzja właściciela przekazana w zleceniu Operatora (2026-09-08): karta szczegółów budynku działa z listy „DOSTĘPNE DO BUDOWY”, ale po dodaniu budynku do kolejki nie jest dostępna.

## GOAL
Umożliwić otwieranie podstawowej karty szczegółów budynku z listy dostępnych budynków przed zakolejkowaniem, po dodaniu do kolejki oraz dla aktywnej pierwszej pozycji, bez zmiany stanu kolejki.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
- PRAWDA/FAŁSZ: dostępny budynek otwiera podstawową kartę przez istniejący renderer (istniejąca ścieżka zachowana); test tematu obejmuje ten przypadek.
- PRAWDA/FAŁSZ: oczekujący budynek w kolejce otwiera tę samą podstawową kartę; klik/podgląd nie wywołuje mutacji kolejki.
- PRAWDA/FAŁSZ: aktywny pierwszy budynek w kolejce otwiera tę samą podstawową kartę; klik/podgląd nie wywołuje mutacji kolejki, zatrzymania, usunięcia ani zmiany kolejności.
- PRAWDA/FAŁSZ: test mutacyjny dowodzi nietautologiczności przez import/render rzeczywistej ścieżki UI lub wykrycie zakazanego efektu po zmianie.
- Nowe sprawdzenie tematu: regresyjny test UI/kontraktu dla trzech stanów i braku efektów ubocznych. Istniejące defensywne bramki: `npx tsc --noEmit` oraz testy obszaru produkcji/UI uruchomione z `gra/`.

## ALLOWLISTA — nic poza tym
- `gra/src/ui/cityPanel.ts` (źródło renderowania listy budowy i kolejki; minimalna zmiana UI)
- właściwy istniejący lub nowy `gra/tools/*building*queue*card*test.cjs` / test tematu regresyjnego
- `dyspozycje/autobot/runs/H-BUDOWA-KARTA-KOLEJKA-Q1/00-dispatch.md`
- `dyspozycje/autobot/runs/H-BUDOWA-KARTA-KOLEJKA-Q1/01-operator.md`

Zakazane: `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`, handoffy, `gra-robocza/**`, inne pliki poza powyższą allowlistą, deploy, push i integracja.

## IZOLACJA
worktree `/root/projects/The-Game`, gałąź `hermes/H-BUDOWA-KARTA-KOLEJKA-Q1`, baza `origin/main` (świeży checkout). Współdzielone nieśledzone pliki innych operatorów pozostają nietknięte.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie wystarczy sprawdzić, że callback istnieje: test musi przejść przez rzeczywisty element kolejki i rzeczywisty renderer karty, a następnie wykazać, że snapshot kolejki przed i po podglądzie jest identyczny. Dodatkowo test mutacyjny ma zmienić produkcyjny fragment odpowiedzialny za podgląd albo wstrzyknąć zakazaną mutację i musi obrócić przejście w FAIL.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt z plikiem/funkcją/testem oraz minimalną poprawkę w allowliście. Operator poprawia ten sam temat i tę samą gałąź w kolejnej rundzie, ponownie uruchamia test tematu i typecheck. Po 5 rundach obowiązuje `LIMIT-5-EXCEEDED`; bez samodzielnego integratora/deployu/pushu.

## GRANICE (naruszenie = FAIL)
Obowiązuje `docs/decyzje/R-PROC-AUTOBOT.md` §9 oraz C-025/C-026/C-059: tylko zgłoszony defekt, bez refaktoryzacji przy okazji; lista miejsc użycia współdzielonego rendereru jawna; brak zmian kolejki przy podglądzie; brak `git add -A`/`git add .`; Operator nie ocenia własnej pracy, nie integruje, nie deployuje i nie pushuje.

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push. Operator nie ocenia, nie integruje, nie deployuje, nie pushuje.
