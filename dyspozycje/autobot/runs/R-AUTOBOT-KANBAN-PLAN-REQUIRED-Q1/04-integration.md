# 04 — INTEGRATION

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
ROLE: Integration Orchestrator
TEMAT: R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1
GOAL: W obowiązujących zasadach The-Game ma istnieć i być spójnie egzekwowany kontrakt: każde nowe zadanie jest najpierw kartą Kanban, pełny plan i zależności są zapisane przed pracą, przyszłe fazy są jawne lecz zablokowane bez workerów, a terminalny event z readbackiem idempotentnie uruchamia wyłącznie legalnego następcę.

## Readback kontroli

- Evaluator: karta `t_4e7ca179`, run 148, `PASS-WITH-NOTES`, konkretne zarzuty: 0.
- Final Control: karta `t_21af5a6c`, run 153, `PASS-WITH-NOTES`; gotowość do lokalnej integracji: TAK.
- Obrona nie powstała, ponieważ lista zarzutów Evaluatora była pusta.
- Kanban technical/context readback i receipt potwierdzają: `changes_requested` run 144, event `kanban:changes_requested:run-144:created_at-1789251508`, round `2/5`, attempt `2` → ten sam card `t_89f369e1`, corrective Operator run 145, `profile=game`, `process_phase=Operator`, `native_status=running`, round `3/5`, attempt `3`; `notify=observed`, `wake=observed`.
- Receipt: `dyspozycje/autobot/runs/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1/transition-receipt.json`, SHA-256 `a2443f30e66546d61de811184b25833ffe53ac1c30e5ff51b69dee9112b79521`, idempotency key `t_89f369e1:changes_requested:run-144:1789251508`.

## Integracja lokalna

- Branch: `hermes/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1`.
- Baza zadeklarowana i odczytana: `origin/main` @ `fc87bcb7d480c043919a58bc1dba3a8c9af6336d`.
- Commit integracji treści: `dbaf3b3cc30c417af9da521e2f92f90cd915c0dd` (`process: integrate C-063 Kanban plan contract`).
- Zakres commitowany jawnie po ścieżkach; bez `git add -A`/`git add .`.
- Zakres plików: `.claude/skills/civ-autobot/SKILL.md`, `.cursor/rules/autobot-evaluator-operator.mdc`, `README.md`, `docs/decyzje/R-PROC-AUTOBOT.md`, `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`, `dyspozycje/autobot/playbook.json`, `playbook.md`, oraz run artifacts `00-dispatch.md`, `01-operator.md`, `transition-receipt.json`.
- Statystyka commit integracji: 10 plików, 619 linii dodanych, 7 usuniętych. Pełny delta względem `origin/main` po commicie: 10 plików, 666 dodanych, 6 usuniętych.
- `gra/**`, `gra-robocza/**`, `dyspozycje/WERSJE.md` i `dyspozycje/_handoff/KANAL-PRACA.md`: brak zmian.

## Dowody wykonania

- `node --check dyspozycje/autobot/tools/playbook-md-to-json.cjs` oraz `node --check dyspozycje/autobot/tools/process-docs-audit.cjs`: exit 0.
- `node dyspozycje/autobot/tools/playbook-md-to-json.cjs --dry-run`: exit 0; 63/63 OK, UPDATE 0, ADD 0, ORPHANED 0, brak różnic.
- `node dyspozycje/autobot/tools/process-docs-audit.cjs`: exit 0; `PROCESS DOCS AUDIT: PASS (14 plików, 5 szablonów, 13 statusów)`.
- Semantic readback: sześć nośników C-063 zgodnych semantycznie; README ma dokładnie 12 wpisów `C-063`…`C-052`; `playbook.md` ma 63 tagowane wiersze; JSON ma 71 reguł; C-063 mapuje się na `rule_167`, `ACTIVE`, `protected=true`, liczniki `0/0`, `win_rate=0`.
- `git diff --check origin/main..HEAD` i `git diff --cached --check`: exit 0; po commicie drzewo było czyste.
- `node dyspozycje/autobot/tools/autobot-smoke.cjs`: exit 1 przed uruchomieniem testów, dokładnie `tsc not found at gra/node_modules/typescript/bin/tsc` (`autobot-smoke.cjs:19-21`). To blokada środowiskowa poza kontraktem docs/process-only; nie maskowano jej i skrypt nie zostawił zmian w Git.

## Hashes artefaktów po integracji treści

- `.claude/skills/civ-autobot/SKILL.md` — `039ed778ebb14623c89a7e576f9a97cb44e2ced0a2a08b61a29f5cc64c6c16ef`
- `.cursor/rules/autobot-evaluator-operator.mdc` — `ff86d0c9195545e98ae81b169be16c059ad04296434390bd638d42a9269ead76`
- `README.md` — `36c59b23873bcf64333acdc3efff6ecce42bd87ee2b23846a72b7b7a836c450e`
- `docs/decyzje/R-PROC-AUTOBOT.md` — `0e9ee8683df13e08a033a40e9ac2f2ccfa0d82d0bea834a540d8daf81677242c`
- `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — `9803101268c5300a61768ed740ed5192921a9b6d8e7e4000665579717f1d0ad3`
- `dyspozycje/autobot/playbook.json` — `cb617c7292dcb96a4382f854f43d16c8964ce1fbf94931cb1d4f2ff509bd3aca`
- `dyspozycje/autobot/runs/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1/00-dispatch.md` — `00a71a7bab74b60e415a5b32cdf7d8b05ae4f21ac69bfaa79bbcd8feeb13602d`
- `dyspozycje/autobot/runs/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1/01-operator.md` — `485635b8b108784ceac6e47154b6e4807ff3168c7bd8ae60d898587e7c938bee`
- `dyspozycje/autobot/runs/R-AUTOBOT-KANBAN-PLAN-REQUIRED-Q1/transition-receipt.json` — `a2443f30e66546d61de811184b25833ffe53ac1c30e5ff51b69dee9112b79521`
- `playbook.md` — `0cb40b7b373307bc37a2ea1fdc96f2efe9bb45799268b99137487c1948f8caf2`

## Provenance i ograniczenia odczytu

- `usage`, `diagnostics` i `journal` nie są wystawiane przez dostępny `kanban_show` ani zapisany receipt; nie wpisuję wartości zastępczych. Raport Operatora l. 27 jawnie odnotowuje brak tych danych w corrective readback.
- `02-evaluator.md` i `03-final-control.md` nie zostały dopisane do drzewa jako fikcyjne kopie raportów ról. Ich terminalne dowody są zapisane w natywnych kartach Kanban `t_4e7ca179`/run 148 i `t_21af5a6c`/run 153 oraz w ich readbacku.
- Nie wykonano merge do `main`, pushu, deployu ani `READY_FOR_DEPLOY`. Ta karta kończy wyłącznie lokalną integrację procesu; publikacja wymaga osobnej jawnej autoryzacji właściciela.

ZMIANY/COMMIT: zatwierdzona allowlista procesu + run artifacts; commit `dbaf3b3cc30c417af9da521e2f92f90cd915c0dd`.
TESTY: generator dry-run PASS; process-docs-audit PASS; oba `node --check` PASS; semantic readback PASS; diff-check PASS; autobot-smoke reprodukuje blocker środowiskowy `tsc`.
BLOKADY: brak blokady merytorycznej; smoke wymaga obecności `gra/node_modules/typescript/bin/tsc` i nie jest bramką akceptacji tego tematu.
RUNDY: 3/5 (zgodnie z readbackiem Final Control; corrective Operator run 145; bez resetu).
NASTĘPNY KROK: zachować lokalny commit i czekać na osobną autoryzację publikacji; nie wykonywać push/deploy bez niej.
DEPLOY/PUSH: NIE WYKONANO
READY_FOR_DEPLOY: NIE WYSTAWIONO — poza zakresem tej karty.
