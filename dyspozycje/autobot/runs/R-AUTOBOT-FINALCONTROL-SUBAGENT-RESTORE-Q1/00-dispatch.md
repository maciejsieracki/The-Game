# 00-dispatch — R-AUTOBOT-FINALCONTROL-SUBAGENT-RESTORE-Q1

**Data:** 2026-08-21
**Pochodzenie:** audyt zleconego przez właściciela porównania stanu procesu AutoBot; wykryto,
że reguła „Final Control zawsze osobny subagent" (wdrożona wcześniej dziś jako
`R-AUTOBOT-FINALCONTROL-SUBAGENT-Q1`, docs-only, na lokalnym `main` tej sesji) zniknęła z
`docs/decyzje/R-PROC-AUTOBOT.md` §5a na gałęzi `origin/main` — najprawdopodobniej przez
nadpisanie całego pliku przez inną, równoległą sesję pracującą ze starszego checkoutu, nie
przez świadomą decyzję właściciela. Właściciel delegował decyzję o przywróceniu do
orkiestratora ("Zdecyduj sam, co będzie najlepszym rozwiązaniem").

**Izolacja:** branch `autobot/R-AUTOBOT-FINALCONTROL-SUBAGENT-RESTORE-Q1`, oparty o
`origin/work/clean-main-2026-08-21` (aktualna autorytatywna gałąź, potwierdzona przez
właściciela — NIE stary lokalny `main` tej sesji, który jest już przestarzały względem tego
punktu). Bez push.

## GOAL

Przywrócić do `docs/decyzje/R-PROC-AUTOBOT.md` §5a jawne stwierdzenie, że dla sesji Claude
Code Final Control używa tego samego modelu/effort co Evaluator (Sonnet 5, effort High) i
jest wykonywany przez OSOBNEGO subagenta, nigdy bezpośrednio przez głównego orkiestratora —
analogicznie do już istniejącego w §1 zapisu dla narzędzia GPT-5.6 Luna ("Final Control GPT-5.6
Luna High (osobny subagent)"). Dziś §5a (Ścieżka A, Claude Code) kończy się zdaniem
przypisującym model/effort WYŁĄCZNIE Operatorowi i Evaluatorowi — Final Control jest tam
pominięty, mimo że jest wspomniany wcześniej w tym samym paragrafie jako część dispatchu przez
Workflow.

Dodać też krótką notatkę w `README.md` (lista „Co nowego w regułach AutoBota") jako nowy wpis
`C-062`, zgodnie z istniejącą konwencją numeracji (najwyższy dziś: C-061).

## Zakres

**NIE przepisywać całego pliku, NIE zmieniać niczego poza precyzyjnie wskazanym miejscem.**
Allowlista jest celowo wąska — to przywrócenie jednego zdania, nie redesign dokumentu.

1. `docs/decyzje/R-PROC-AUTOBOT.md`, §5a — na końcu akapitu zaczynającego się „Dla sesji
   Claude Code, Ścieżka A..." (kończy się dziś na „...Evaluator dostaje więcej przestrzeni
   na adwersaryjne rozumowanie, nie inny, droższy model.") dodać zdanie: „Final Control → ten
   sam model i effort co Evaluator (Sonnet 5, effort High), wykonywany przez OSOBNEGO
   subagenta, nigdy bezpośrednio przez głównego orkiestratora — analogicznie do zapisu w §1
   dla GPT-5.6 Luna."
2. `README.md`, sekcja „Co nowego w regułach AutoBota" — dodać na górze listy (usuwając
   najstarszy wpis jeśli lista ma już 12, zgodnie z instrukcją w nagłówku sekcji):
   `- **C-062** (2026-08-21) — przywrócono zapis: Final Control (Claude Code) = Sonnet 5
   effort High, zawsze osobny subagent, nigdy główny orkiestrator — zaginął z §5a przy
   nadpisaniu pliku przez równoległą sesję, przywrócony po audycie właściciela.`
3. `playbook.md` — dodać odpowiadający wpis C-062 w formacie zgodnym z sąsiednimi C-0XX
   (sprawdzić dokładny format istniejących wpisów w tym pliku przed dopisaniem — NIE zgadywać
   formatu, skopiować konwencję z najbliższego istniejącego wpisu C-061/C-060).

## Allowlista

- `docs/decyzje/R-PROC-AUTOBOT.md`
- `README.md`
- `playbook.md`
- `dyspozycje/autobot/runs/R-AUTOBOT-FINALCONTROL-SUBAGENT-RESTORE-Q1/`

Zero zmian w `gra/`, zero zmian w innych plikach dokumentacji procesu.

## Kryteria końca

1. `docs/decyzje/R-PROC-AUTOBOT.md` §5a jawnie przypisuje Final Control do Sonnet 5/effort
   High/osobny subagent dla Claude Code.
2. `README.md` ma nowy wpis C-062 na górze listy „Co nowego", format spójny z istniejącymi.
3. `playbook.md` ma odpowiadający wpis C-062, format spójny z sąsiednimi wpisami.
4. Zero zmian poza tymi trzema plikami + artefaktami runu.
5. Nie usuwać, nie zmieniać żadnej z reguł C-050…C-061 — to CZYSTE DODANIE, nie redakcja
   istniejącej listy poza dopisaniem nowego wpisu na górze (i ewentualnym usunięciem TYLKO
   najstarszego wpisu, jeśli limit 12 jest przekroczony, zgodnie z istniejącą instrukcją
   nagłówka sekcji).

## Model / effort

Operator → Sonnet 5, effort Medium. Evaluator → Sonnet 5, effort High. Final Control →
Sonnet 5, effort High, OSOBNY subagent (ironicznie: dokładnie ta reguła, którą ten temat
przywraca — Final Control musi jej dziś przestrzegać, weryfikując sam siebie).

Dispatch przez narzędzie Workflow (Ścieżka A) — właściciel dał jawną zgodę na multi-agent
orchestration w tej sesji.
