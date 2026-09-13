# AutoBot dispatch — R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1

TEMAT: R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1
RUNDA: 1/5
DATA: 2026-09-12
DOMAIN: PROCESS
ŚCIEŻKA: B (Hermes Kanban)
MODEL + EFFORT: Operator gpt-5.6-luna/high; Evaluator gpt-5.6-luna/xhigh; Final Control gpt-5.6-luna/max

## WYZWALACZ
Jawne polecenie właściciela: każda praca ma natychmiast trafiać do Kanbana, a karta ma zawierać pełny plan zadania, zależności, wszystkie wymagane fazy, kryteria i wytyczne. Plan ma być grafem, nie listą do ręcznego przepisywania.

## GOAL
W obowiązujących zasadach The-Game ma istnieć i być spójnie egzekwowany kontrakt: każde nowe zadanie jest najpierw kartą Kanban, pełny plan i zależności są zapisane przed pracą, przyszłe fazy są jawne lecz zablokowane bez workerów, a terminalny event z readbackiem idempotentnie uruchamia wyłącznie legalnego następcę.

## KRYTERIA KOŃCA — PRAWDA/FAŁSZ
1. PRAWDA: zasada „karta przed pracą + pełny graf faz i zależności” jest zapisana w kanonicznych zasadach The-Game i w skróconych warstwach, które czyta agent.
2. PRAWDA: playbook i jego JSON są semantycznie zgodne, a JSON jest wygenerowany narzędziem.
3. PRAWDA: zasada rozróżnia native_status od process_phase i zabrania zgadywania następnego kroku z tytułu lub raportu.
4. PRAWDA: każde terminalne przejście Kanbana (np. `kanban_complete`, `kanban_block`, `review_requested` lub `changes_requested`, gdy kończy bieżącą fazę) + obserwowalny event + technical/context readback są warunkiem następnej fazy; notify+wake jest wymagane po utworzeniu aktywnej karty.
5. PRAWDA: OWNER_HOLD/DECISION_REQUIRED blokują tylko następców, bieżący worker może dokończyć rozpoczętą fazę, a pusta Obrona jest zakazana.
6. PRAWDA: Evaluator i Final Control potwierdzą zakres, spójność wszystkich nośników, brak regresji procesu i brak zmian produktu.

## ALLOWLISTA
- `playbook.md`
- `dyspozycje/autobot/playbook.json` — wyłącznie przez generator
- `README.md` — skrót nowych reguł, jeśli wymagany przez kanon
- `docs/decyzje/R-PROC-AUTOBOT.md` — tylko odpowiednia sekcja procesu
- `.cursor/rules/autobot-evaluator-operator.mdc`
- `.claude/skills/civ-autobot/SKILL.md`
- `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`
- `dyspozycje/autobot/runs/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1/`
Zakazane: `gra/**`, `gra-robocza/**`, `WERSJE.md`, `KANAL-PRACA.md`, sekrety, `.git/**`, ręczna edycja `playbook.json`, push/merge/deploy.

## IZOLACJA
Worktree: `/home/ubuntu/projects/The-Game-autobot-kanban-rule-20260912`
Branch: `hermes/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1`
Baza: `origin/main` @ `fc87bcb7d480c043919a58bc1dba3a8c9af6336d`
Board: `the-game-real24`; profil nowych kart: `game`; role wyłącznie `process_phase`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie traktuj samego faktu istnienia karty, raportu PASS, commita, eventu bez readbacku, statusu running, heartbeat, nazwy profilu ani listy TODO jako dowodu pełnego procesu. Sprawdź wszystkie nośniki, wygenerowany JSON, graf rodziców i eventy; nie pisz „nic nie można pchnąć”, jeśli istnieje kwalifikowany następny etap.

## PROCEDURA NAPRAWCZA
Evaluator wskazuje konkretny rozjazd między kanonicznymi nośnikami lub grafem. Operator poprawia wyłącznie allowlistę na tej samej gałęzi i rundzie. Po Final Control PASS Orkiestrator wykonuje technical/context readback; push/merge/deploy pozostają osobną bramką właściciela.

## OBIEG
Operator → Evaluator → Defense tylko przy konkretnych zarzutach → Final Control → integracja Orkiestratora → READY_FOR_DEPLOY → osobna zgoda deploy/push.
