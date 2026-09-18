# AGENT-START-HERE — Civ „The Game”

Ten plik jest nawigacją dla agenta pracującego w repozytorium dokumentacji Civ „The Game”. Źródłem ogólnych reguł pozostaje [README.md](README.md); ten plik nie usuwa ani nie zastępuje istniejących źródeł.

## Kolejność czytania

1. [README.md](README.md) — kanoniczny punkt wejścia i kolejność startowa.
2. [docs/procesy/INDEX-PROCESU.md](docs/procesy/INDEX-PROCESU.md) — mapa procesu i artefaktów.
3. [docs/decyzje/R-PROC-AUTOBOT.md](docs/decyzje/R-PROC-AUTOBOT.md) — norma ról, bramek i barier.
4. [playbook.md](playbook.md) — aktywne reguły i rejestr „nigdy więcej”.
5. [dyspozycje/_handoff/HANDOFF-AKTUALNY.md](dyspozycje/_handoff/HANDOFF-AKTUALNY.md) — bieżący stan przejęcia.
6. [dyspozycje/_handoff/KANAL-PRACA.md](dyspozycje/_handoff/KANAL-PRACA.md) — ostatnie przekazania.
7. [dyspozycje/REJESTR-PROSB-I-ZADAN.md](dyspozycje/REJESTR-PROSB-I-ZADAN.md) i [dyspozycje/PYTANIA-OTWARTE.md](dyspozycje/PYTANIA-OTWARTE.md) — rejestry tematów i ABC.
8. Dopiero potem Git, diff, testy i kod.

Dla zmian samego AutoBota przeczytaj [dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md](dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md).

## Tożsamość bieżącego audytu

Poniższa tożsamość jest jawna dla tego snapshotu i nie jest domyślnym routingiem
dla innych projektów:

- profil wykonawczy: `default`;
- projekt: `the-game` / `The Game Box`, `project_id=p_9ae9ac64`;
- board: `the-game-real24`;
- tenant: `the-game`;
- worktree dowodowy: `/home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1`;
- temat/faza: `t_518149f7` / `R-DOCS-P5-INDEX-CONSOLIDATION-Q1` / P5 Operator;
- bieżący run przy readbacku: `328` (status `running` przed terminalnym przekazaniem).

Świeży `project show` potwierdza obecnie board `the-game-real24`. Starsza wzmianka
o `the-game-bugs` w historycznej mapie P1B nie jest bieżącym bindingiem i nie
może być kopiowana do nowego routingu. Historyczny anchor `p_09e13254` pozostaje
wyłącznie `LEGACY_ORPHANED` / `INFRA`; nie jest bieżącym projektem profilu
`default`.

## Wymagana procedura tagowania kart

Przy inwentaryzacji lub rekonsyliacji Kanbana użyj
[R-DOCS-CARDS-TAGGING-GUIDE.md](dyspozycje/autobot/R-DOCS-CARDS-TAGGING-GUIDE.md).
Nie używaj profilu jako substytutu projektu ani statusu boardu jako dowodu.
Katalogowanie kart i ich wymaganych dokumentów zachowuje klasyfikacje
`CONFIRMED`, `INFERRED` i `UNKNOWN`; tytuł lub prefiks nie rozstrzyga własności.

## Stan bramek dokumentacyjnych

P1B, P2, P3 i P4 są zachowanymi, snapshotowymi dowodami. P4 zakończyło się
`PASS-WITH-NOTES`; nie było kasowania, scalania, zmiany nazw ani naprawy źródeł.
P5 aktualizuje wyłącznie ten plik i
[INDEX-PROCESU.md](docs/procesy/INDEX-PROCESU.md), a raporty P5 są dodatkowymi
artefaktami w tym samym katalogu runu.

Poprzednie artefakty:

- [P1B-card-inventory.jsonl](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-inventory.jsonl)
- [P1B-card-document-map.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-document-map.md)
- [P2-summary.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-summary.md)
- [P3-summary.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-summary.md)
- [P3-conflicts.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-conflicts.md)
- [P4-summary.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P4-summary.md)
- [P4-final-control.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P4-final-control.md)

Artefakty bieżącej fazy P5:

- [23-dispatch-p5-index-consolidation.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/23-dispatch-p5-index-consolidation.md)
- [P5-index-consolidation.md](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-index-consolidation.md)
- [P5-evidence.json](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-evidence.json)
- [P5-transition-receipt.json](dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-transition-receipt.json)

## Readback Kanbana

Przed każdą oceną karty wykonaj jawny readback właściwego boardu:

```bash
hermes -p default profile list
hermes -p default project list
hermes -p default project show the-game
hermes -p default kanban boards list
hermes -p default kanban --board the-game-real24 list --json --archived
hermes -p default kanban --board the-game-real24 show <task-id> --json
hermes -p default kanban --board the-game-real24 runs <task-id> --json
```

Po każdym terminalnym evencie odczytaj dokładną kartę, run, event, rodziców,
artefakt, workspace i dostępny receipt. Brak `idempotency_key` lub
`current_run_id` w native readbacku oznacz jako `unknown`/`null` z jawną luką
projekcji; źródło opisuj jako `show`, `runs` i `show.events/native projection`.
Bez dodatkowego readbacku nie wykonuj retry ani nie twórz duplikatu.

## Zasady bezpieczeństwa zakresu

P5 nie tworzy P6, nie zmienia `gra/`, `rust-port/`, danych, rejestrów, pytań,
handoffów, źródeł historycznych ani Kanban DB. Nie integruje, nie pushuje, nie
merguje i nie deployuje. `DUPLICATE_CANDIDATE`, `STALE_CANDIDATE`,
`OWNER_DECISION` i `UNKNOWN_NEEDS_REVIEW` są etykietami audytowymi, nie poleceniem
usuwania. Nowa inwentaryzacja live wymaga osobnej autoryzacji i granicy snapshotu.

Następna legalna bramka po terminalnym P5 to niezależny Evaluator P5, następnie
Final Control P5. Dopiero po tych odczytach można otworzyć P6 jako
niedestrukcyjny plan konsolidacji; P6 nie usuwa ani nie scala źródeł. Nierozwiązane
decyzje P3 pozostają jawne: konflikty `1, 4, 5, 6, 7`, bez wybranej precedencji.
