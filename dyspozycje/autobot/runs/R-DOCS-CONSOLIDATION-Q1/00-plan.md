# R-DOCS-CONSOLIDATION-Q1 — plan Kanban

STATUS: AUTHORIZED_BY_OWNER / EXECUTING
BOARD: the-game-real24
PROFILE: the-game
PROJECT: p_09e13254

## Cel nadrzędny

Przeprowadzić audyt dokumentacji The-Game na OVH i w relewantnych refach GitHub,
wyznaczyć źródła prawdy, opisać duplikaty i nieaktualność, uzupełnić jeden indeks
wejściowy dla agentów oraz przygotować bezpieczny plan konsolidacji. Nie usuwać
plików ani nie scalać treści bez osobnej zgody właściciela.

## Siedem zależnych faz

```text
P1 zakres audytu
 → P1B katalog kart The-Game i mapowanie do dokumentów
 → P2 inwentaryzacja Markdownów
 → P3 źródła prawdy
 → P4 duplikaty i nieaktualność
 → P5 aktualizacja AGENT-START-HERE.md
 → P6 plan konsolidacji
 → OWNER DECISION / OWNER HOLD
 → P7 weryfikacja i publikacja
```

Logicalzne topic keys:

```text
R-DOCS-P1-SCOPE-Q1
R-DOCS-CARDS-TAGGING-Q1
R-DOCS-P2-INVENTORY-Q1
R-DOCS-P3-SOURCES-OF-TRUTH-Q1
R-DOCS-P4-STALE-DUPLICATES-Q1
R-DOCS-P5-INDEX-UPDATE-Q1
R-DOCS-P6-CONSOLIDATION-PLAN-Q1
R-DOCS-P7-PUBLISH-Q1
```

## Pełny cykl każdej fazy

Każda faza ma osobno: Operator → niezależny Evaluator → Defense tylko przy
niepustej, numerowanej liście zarzutów → Final Control → Orchestrator
staging/readback. Brak zarzutów nie uruchamia pustej Defense; karta warunkowa
kończy się `SKIPPED_CONDITION_NOT_MET` albo pozostaje workerless.

Dopiero terminalny PASS Final Control i readback Orchestratora odblokowują
następną fazę. `FAIL`, `BLOCK`, `INFRA`, `TIMEOUT` lub brak dowodu zatrzymują
wyłącznie ten strumień i wymagają recovery tej samej fazy.

## Zakres faz

### P1 — scope
Ustalić repozytoria, primary checkout, aktywne worktree, stagingi, katalogi
OVH, relewantne refy GitHub i wyłączenia (`.git`, cache, target, dist,
node_modules, wygenerowane artefakty). Wynik: `P1-scope.md`, `P1-sources.json`.

### P1B — katalog kart The-Game i mapowanie dokumentów
Zastosować zasady oznaczania kart z przewodnika ABM jako osobny, jawnie
zatwierdzony zakres The-Game: `the-game-real24`, `p_09e13254`, profil
`the-game`. Nie dotykać `autobot-monitor`, ABM ani innych boardów. Zrobić
read-only inventory wszystkich kart tego boardu, w tym historycznych i
zarchiwizowanych, oraz sklasyfikować je jako `CONFIRMED`, `INFERRED` albo
`UNKNOWN`. Dla każdej karty zapisać task ID, topic, status, project, tenant,
assignee, process phase, workspace/branch, parent/children, routing,
idempotency/readback status i wymagane dokumenty. Przygotować
`dyspozycje/autobot/R-DOCS-CARDS-TAGGING-GUIDE.md`, maszynowy inventory oraz
mapę `card/topic → required documents → evidence path`; uzupełnić
`AGENT-START-HERE.md` o te wymagane dokumenty. Nie zmieniać historycznych kart,
nie przenosić boardów i nie używać ręcznego SQL. Mapowanie jest źródłem
powiązania; nie duplikować tych samych załączników masowo.

### P2 — inventory
Programowo zebrać dla każdego Markdowna: path, source root, local/remote,
tracked/untracked, bytes, lines, first heading, SHA-256 i status. Wynik:
maszynowe inventory lokalne/zdalne, summary i counts. Nie ładować tysięcy plików
do promptu i nie zapisywać sekretów.

### P3 — sources of truth
Przypisać dokumenty do kategorii: start agenta, architektura, proces, routing,
current handoff, decyzje, registry, evidence, integracja, deploy, historia,
companion project. Wynik: `question → canonical file → when to read` plus
konflikty i OWNER_DECISION_REQUIRED.

### P4 — stale/duplicates
Wykryć identyczne i logiczne duplikaty, LOCAL-ONLY, REMOTE-ONLY, HISTORY,
STALE i SEPARATE-PROJECT. Wynik: tabela survivor/replacement/reason/risk.
Żaden plik nie jest kasowany ani przepisywany.

### P5 — index update
Zmienić wyłącznie zatwierdzony indeks `AGENT-START-HERE.md` oraz jawnie
wskazany raport. Uzupełnić mapę dokumentacji, statusy synchronizacji, stale
warnings, context economy i komendy readbacku. Sprawdzić linki, diff-check,
sekrety i zgodność z P1–P4.

### P6 — consolidation plan
Przygotować tabelę `scalić / pozostawić / oznaczyć / opublikować / usunąć po
zgodzie`, z ryzykiem i uzasadnieniem. Faza nie wykonuje żadnego usuwania,
scalania treści ani pushu. Kończy się OWNER_HOLD / DECISION_REQUIRED.

### P7 — verification/publish
Po decyzji właściciela niezależnie zweryfikować paczkę publikacyjną, utworzyć
branch, commit i push tylko jawnie dopuszczonych plików, wykonać GitHub readback
SHA i porównać hash treści. Merge do main i deploy są poza zakresem.

## Routing

```text
Operator       gpt-5.6-luna / openai-codex / max   / priority
Evaluator      gpt-5.6-luna / openai-codex / max   / priority
Defense        gpt-5.6-luna / openai-codex / max   / priority
Final Control  gpt-5.6-luna / openai-codex / ultra / priority
```

Każda karta musi mieć jawne board, profile, tenant, `project_id=p_09e13254`,
workspace, parent, phase, round/attempt, allowlist, idempotency key, provider,
model, effort, service tier, completion contract i `notify+wake`.

## Bezpieczeństwo

- Audyt czyta brudny primary checkout i aktywne worktree, ale ich nie modyfikuje.
- Raporty powstają w dedykowanym worktree dokumentacyjnym.
- Nie używać reset, clean, stash, rebase ani pull na aktywnych checkoutach.
- Nie zapisywać haseł, tokenów, connection strings ani surowych sekretów.
- Nie traktować lokalnego pliku jako opublikowanego.
- Nie wykonywać usunięć ani konsolidacji przed osobną zgodą właściciela.
