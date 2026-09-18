# The-Game — procedura tagowania i rekonsyliacji kart Kanbana

Status: P1B, readback-only plus allowlisted Defense recovery. Dokument adaptuje procedurę ABM-CARD-TAGGING-GUIDE.md do projektu The-Game; nie rozszerza zakresu na AutoBot Monitor ani inne boardy.

## Zakres i granica

```text
board:                    the-game-real24
current project anchor:  default/the-game/p_9ae9ac64
tenant:                   the-game
execution profile:       default (current P1B Defense)
legacy anchor:            p_09e13254 (LEGACY_ORPHANED / INFRA)
```

Board jest twardą granicą. `the-game-real24` ma własną bazę, graf, workspace'y i dispatcher. Nie przenoś kart między boardami. Nie dotykaj `autobot-monitor`, `p_ffb5c6ad`, `the-game-bugs` ani kart obcego projektu. Profil wykonawczy nie jest nazwą projektu. `p_09e13254` pozostaje wyłącznie historycznym/orphaned anchor w inventory; nie jest bieżącym projektem profilu `default` i nie wolno używać go do nowego dispatchu.

Obowiązuje łańcuch identyfikacji:

```text
board → project_id → tenant → assignee → process_phase → topic
```

`topic` jest stabilnym identyfikatorem zapisanym w tytule/body albo potwierdzonym workspace'em; `idempotency_key` jest niezależnym kluczem deduplikacji i nie zastępuje żadnego z tych pól.

## Readback obowiązkowy

Przed oceną lub korektą wykonuj jawny, read-only readback:

```bash
hermes -p default profile list
hermes -p default project list
hermes -p default project show the-game
hermes -p default kanban boards list
hermes -p default kanban --board the-game-real24 list --json --archived
hermes -p default kanban --board the-game-real24 show <task-id> --json
hermes -p default kanban --board the-game-real24 runs <task-id> --json
```

Nie polegaj na aktywnym boardzie, UI, nazwie profilu ani komunikacie `created`. W aktualnym readbacku pole `idempotency_key` nie jest ujawniane przez `list/show/runs` ani event/native projection; brak wartości oznacza `unknown`, nie bezpieczne `missing`. `show.task.current_run_id` jest kopiowany jako `null`, gdy tak zwraca native readback, i nie jest zastępowany obserwowanym ID z `runs`. W tej serii body ujawniło tylko deterministyczne klucze dla kart, które same je deklarowały; nie wolno dopisywać kluczy historycznym kartom przez zgadywanie. `projection_gap: unknown`; źródło: `show`, `runs`, `show.events/native projection`; konsekwencja: brak retry/duplikatu bez dodatkowego readbacku.

## Klasyfikacja dowodów

- `CONFIRMED` — aktualny projekt/tenant oraz niezależna zgodność topicu z tytułem/body/workspace'em/grafem.
- `INFERRED` — topic ma dowód, ale routing jest historyczny lub niepełny (np. stary `project_id`, brak tenanta, brak natywnej fazy).
- `UNKNOWN` — nie ma wystarczającego dowodu stabilnego topicu albo karta ma obce/nieustalone pochodzenie. Nie koryguj automatycznie.
- `OUT_OF_SCOPE` — klasyfikacja zakresowa w raporcie, gdy strukturalne pola wskazują inny board/projekt; taka karta pozostaje bez zmian.

Klasyfikacja nie jest powodem do przepisywania historii. Każda karta pozostaje w inventory, również `archived`, `blocked`, `todo` i `scheduled`.

## Twarde zakazy i legalna korekta

- Nie modyfikuj karty `RUNNING` ani aktywnego claimu; run `278` karty `t_fc2b93bb` został zachowany.
- Nie zmieniaj historycznych receiptów/eventów, statusów, parentów ani workspace'ów dla wyglądu UI.
- Nie używaj SQL, nie edytuj `kanban.db`/`state.db`, nie kopiuj baz i nie przenoś kart między boardami.
- Nie twórz duplikatu tylko dlatego, że `idempotency_key` nie jest widoczny w projekcji.
- Korektę wolno wykonać tylko pojedynczo przez wspierane CLI/API, po jednoznacznym dowodzie i z macierzą before/after oraz ponownym `show --json`. Jeśli pole nie ma wspieranej operacji, zapisz lukę `INFRA/UNKNOWN` i zachowaj kartę.
- Process gate (`INTEGRATION_REQUIRED`, `OWNER_HOLD`, plan register) pozostaje bez assignee; nie ustawiaj fallbacku `the-game` automatycznie.

## Wynik pełnego readbacku boardu

Źródło: `list --json --archived` + `show --json` + `runs --json` dla 249/249 kart boardu. Snapshot obejmuje aktywne, historyczne i zarchiwizowane karty.

Granica snapshotu:

```text
snapshot_id:    R-DOCS-CARDS-TAGGING-Q1:2026-09-14T16:40:11.925033Z
generated_at:   2026-09-14T16:40:11.925033Z (UTC, start read-only list; nie timestamp historyczny)
list_finished:  2026-09-14T16:40:12.533502Z (UTC)
population:     249
previous_file:  246 records, generated_at=unknown
exceptions:     t_11cc108f, t_7f698ba5, t_9bed9920
```

`generated_at` jest dokładnym czasem UTC zapisanym tuż przed wywołaniem
read-only `list`; nie udaje czasu historycznego. Poprzedni inventory pozostaje
snapshotem historycznym bez znanego `generated_at`, a trzy wymienione karty są
nowymi/wyjątkowymi rekordami względem jego 246 linii.

```text
cards:                    249
status:                   {"archived": 110, "blocked": 13, "done": 95, "running": 1, "scheduled": 15, "todo": 15}
project_id:               {"null": 73, "p_09e13254": 12, "p_9ae9ac64": 164}
tenant:                   {"null": 181, "the-game": 68}
process_phase:            {"UNKNOWN": 183, "defense": 11, "evaluator": 14, "final-control": 26, "operator": 15}
classification:           {"CONFIRMED": 33, "INFERRED": 204, "UNKNOWN": 12}
routing_classification:   {"CURRENT_DEFAULT": 164, "LEGACY_ORPHANED": 12, "UNKNOWN": 73}
out_of_scope:              0
projection_gap:            unknown (249/249)
```

`p_9ae9ac64` jest bieżącym ID anchoru projektu `default/the-game`, potwierdzonym
w readbacku profilu/projektu. Ten sam świeży `project show` raportuje jednak
`board=the-game-bugs`, podczas gdy ten audit ma twardą granicę
`the-game-real24`; jest to jawny `INFRA/ROUTING_ERROR`/binding gap, zachowany bez
zmiany project DB. Wszystkie 12 kart z `p_09e13254` mają w inventory
`routing_classification=LEGACY_ORPHANED`, `routing_domain=INFRA` i
`scope=LEGACY_ORPHANED`; zachowano ich task ID, status, historię, evidence i
relacje bez mutowania Kanbana. Brak `project_id` pozostaje `UNKNOWN` routing,
nie powodem do automatycznego przypisania. Karty z `p_9ae9ac64` są oznaczone
`CURRENT_DEFAULT`, lecz ich `routing_binding` pozostaje `INFRA/ROUTING_ERROR`;
tenant/provenance nadal są raportowane oddzielnie.

Każdy rekord ma `projection_gap: unknown` z tym samym źródłem i konsekwencją.
`positive_evidence.runs` przechowuje osobno ID/status/outcome oraz klucze
metadanych z `runs --json`; `positive_evidence.argv` nie jest receipt i nie
uzupełnia `idempotency_key` ani `current_run_id`. Dla aktywnej Obrony osobno
potwierdzono argv runu 282: model `gpt-5.6-luna`, provider `openai-codex`,
reasoning `max`, service tier `priority`.

## Artefakty kanoniczne

- [`AGENT-START-HERE.md`](../../AGENT-START-HERE.md) — nawigacja startowa i link do tej procedury.
- [`P1B-card-inventory.jsonl`](runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-inventory.jsonl) — dokładnie jeden deterministyczny rekord na kartę.
- [`P1B-card-document-map.md`](runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-document-map.md) — mapowanie karta → topic → phase → dokumenty → evidence → legal action.
- [`04-cards-operator.md`](runs/R-DOCS-CONSOLIDATION-Q1/04-cards-operator.md) — handoff Operatora do niezależnego Evaluatora.
- [`05-cards-evaluator-default.md`](runs/R-DOCS-CONSOLIDATION-Q1/05-cards-evaluator-default.md) — historyczny FAIL i trzy ponumerowane zarzuty.
- [`06-cards-defense-default.md`](runs/R-DOCS-CONSOLIDATION-Q1/06-cards-defense-default.md) — allowlisted Defense recovery i odpowiedzi 1–3.

Artefakty są warstwą asocjacyjną; nie załączaj tego samego dużego pliku do każdej karty. Orchestrator może po osobnym PASS dołączyć zatwierdzone artefakty do karty tagowania.

## Reguła przejścia

Ten etap ma historyczny Operator → Evaluator FAIL oraz bieżącą, allowlisted
Defense dla trzech ponumerowanych zarzutów. Nie twórz duplikatu ani nie
reclaimuj aktywnego runu 282; po terminalnym readbacku Obrony dopiero Final
Control. Defense powstaje tylko przy ponumerowanych, konkretnych zarzutach, a
P2 nie startuje z tej karty.
