# AutoBot — Operator–Evaluator–integracja (R-PROC-AUTOBOT)

**Status:** ⛔ **TWARDA REGUŁA** — **KAŻDA praca agenta wyłącznie tędy** (Maciej 2026-08-05)  
**Decyzja:** [`docs/decyzje/R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md)  
**Reguła Cursor (alwaysApply):** `.cursor/rules/autobot-evaluator-operator.mdc`

> Operator → Evaluator → finalna kontrola → integracja → deploy/push. **ZAKAZ** omijania pętli.

**Evaluator — SCOPE:** przed werdyktem sprawdza, czy diff dotyczy **wyłącznie** zgłoszonego problemu/AC i nie wprowadza ubocznych zmian ani regresji w innych miejscach (`rule_105`, `R-PROC-AUTOBOT-EVAL-SCOPE`). Naruszenie SCOPE → FAIL.

**Evaluator — STRICT (Maciej „2”, 2026-08-05):** luki testów, brak asercji AC, czerwone testy tematu lub `tsc≠0` → **FAIL** (nie PASS-WITH-NOTES). PASS-WITH-NOTES tylko dla wąskiej listy wyjątków procesowych (`rule_106`, `R-PROC-AUTOBOT-EVAL-STRICT`).

**Evaluator — STRICT-EDGE (Maciej „2 Jeszcze twardszy”, 2026-08-05):** testy tematu tylko happy-path bez edge/negacji/repro buga → **FAIL #7** (`rule_107`, `R-PROC-AUTOBOT-EVAL-STRICT-EDGE`).

**Evaluator — STRICT-PARITY (Maciej „2 = Tylko A (parytet)”, 2026-08-05):** asymetria gracz/AI/MP (`ownerId === 0` / `isPlayer`) bez decyzji ABC lub bez testu parytetu → **FAIL #8** (`rule_108`, `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`).

**Evaluator — STRICT-SAVE (Maciej „1+2” oś B save/load, 2026-08-05):** nowe trwałe pole bez snapshot/restore lub restore bez `?? default`; Operator bez roundtrip → **FAIL #9** (`rule_109`, `R-PROC-AUTOBOT-EVAL-STRICT-SAVE`).

## v2 — Protokół AutoBot (Maciej 2026-08-07)

Źródło: `protokol-v1.2/` (dokumenty dostarczone przez Macieja). Integracja: `docs/decyzje/R-PROC-AUTOBOT.md` §„v2 — Protokół AutoBot". Skrót:

- **`playbook.json`** ma teraz 3 nowe sekcje: `errorLog` (Rejestr błędów — chronologiczny, „NIGDY WIĘCEJ"), `conclusionsJournal` (Dziennik wniosków), `openMatters` (Sprawy otwarte).
- **Status reguły `PROTECTED`** (alias CHRONIONA) — nadaje wyłącznie Maciej, poza licznikami win/fail i poza automatycznym `RETIRED`.
- **Próg istotności statystycznej** podniesiony z 5 do **10** zastosowań (`thresholds.minRunsForSignificance`).
- **Protokół błędu** (5 kroków, natychmiast po każdym błędzie): NAPRAW → przyczyna nie winny → sprawdź wstecz → zapisz do `errorLog` → przekuj w regułę (`ACTIVE`, 0/0). Recydywa = incydent krytyczny.

## Architektura — 5 modułów

```
┌─────────────────────────────────────────────────────────────────┐
│                         TASK / DYSPOZYCJA                        │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 3: Playbook (playbook.json + playbook-manager.ts)          │
│  rules[ACTIVE] · win_rate · min_confidence_threshold · RETIRED   │
│  getOperatorSystemRules() → prompt Operatora                      │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 4: Guardrails (guardrails.ts)                            │
│  Prod Isolation · HITL · canDeclareWinner / assertEvaluationDelay│
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 2: Self-Pruning (feature-pruning.ts)                       │
│  pruneFeatureWeights() → |corr| < 0.05 → usuń z kontekstu         │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  OperatorAgent → ExecutionRun                                    │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 1: Hard Metric Evaluator (evaluator-agent + hard-metrics) │
│  performanceScore = f(metricReal) - penaltyComplexity            │
│  Dev / Sales / Trading profile scorers                           │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 5: Dashboard Logger (logging.ts)                          │
│  JSONL: run_id · metric_before/after · delta_percentage · …      │
└─────────────────────────────────────────────────────────────────┘
```

## Moduły (pliki)

| # | Moduł | Pliki | Odpowiedzialność |
|---|-------|-------|------------------|
| 1 | Hard Metric Evaluator | `src/hard-metrics.ts`, `src/evaluator-agent.ts` | Twarde metryki (SSOT), `computePerformanceScore`, profile Dev/Sales/Trading |
| 2 | Self-Pruning | `src/feature-pruning.ts` | `pruneFeatureWeights()` — korelacja vs success, usuń słabe cechy |
| 3 | Playbook | `playbook.json`, `src/playbook-manager.ts` | `ACTIVE`/`RETIRED`/`QUARANTINE`, `getOperatorSystemRules()` |
| 4 | Guardrails | `src/guardrails.ts` | Prod isolation, HITL, data exposure delay |
| 5 | Dashboard Logger | `src/logging.ts`, `logs/postmortems.jsonl` | Strukturalny JSONL pod dashboard |

## `playbook.json` jest GENEROWANY — nie edytuj ręcznie (Maciej, 2026-08-07)

**Kanon pamięci to `playbook.md` w korzeniu repo** (sekcja „## 2. Zasady"). `playbook.json`
w tym katalogu jest z niego wyprowadzony przez `tools/playbook-md-to-json.cjs` i nie wolno
go poprawiać ręcznie — ręczna edycja to dokładnie ten błąd, który 2026-08-07 doprowadził
do odrzucenia iteracji przez Evaluatora (liczniki wpisane „z pamięci" zamiast 0/0; zgubione
`C-002` przy scaleniu — patrz `playbook.md` §3/§4).

Generator dopasowuje wiersz markdownu do reguły JSON po tagu `[C-0NN]` na końcu `rule_text`
(to jedyne pole, które przetrwa `loadPlaybook`/`savePlaybook`) i **zawsze zachowuje już
zebrane liczniki** (`win_count`/`fail_count`) — nigdy ich nie zeruje dla istniejącej reguły.
Nowe wiersze (bez dopasowania) dostają nowe `rule_1NN` i zawsze startują 0/0
(protokół `AUTOBOT.md` §3 krok 5). Reguły `rule_101`, `102`, `104`–`109` istniały przed
generatorem (bez tagu) — generator ich nie rusza.

```bash
# podgląd różnic, bez zapisu (domyślne, bezpieczne)
node dyspozycje/autobot/tools/playbook-md-to-json.cjs --dry-run

# zapis do playbook.json — wyłącznie jawne wywołanie z --write
node dyspozycje/autobot/tools/playbook-md-to-json.cjs --write
```

## Playbook (spec v1)

```json
{
  "min_confidence_threshold": 0.60,
  "rules": [
    {
      "id": "rule_101",
      "rule_text": "...",
      "win_count": 12,
      "fail_count": 2,
      "win_rate": 0.85,
      "status": "ACTIVE"
    }
  ],
  "quarantine_rules": []
}
```

- Statusy: `ACTIVE` | `RETIRED` | `QUARANTINE` (aliasy `active`/`deprecated` mapowane przy load)
- `win_rate < 0.30` (przy min runs) → `RETIRED` / `quarantine_rules`
- `getOperatorSystemRules(playbook)` → tylko ACTIVE z `win_rate ≥ min_confidence_threshold`

## Guardrails (skrót)

- **Prod Isolation:** `env === 'production'` → throw/block destrukcyjne akcje Operatora
- **HITL:** PR/draft OK; **ZAKAZ** merge main, mass mail, real money; deploy = `humanApproved` + `deployPassword`
- **Data Exposure:** winner dopiero gdy `N ≥ minEvents` **LUB** `elapsed ≥ 48h` (`canDeclareWinner`)

## Użycie

```ts
import { OperatorAgent, EvaluatorAgent, computePerformanceScore } from './src';

const op = new OperatorAgent();
const run = await op.run({
  taskId: 'R-EXAMPLE',
  summary: 'fix X',
  actionId: 'run-lane-tests',
  context: { taskId: 'R-EXAMPLE', acChecklist: ['…'] },
});

const ev = new EvaluatorAgent();
const result = ev.evaluate({
  run,
  metrics: {
    profile: 'dev',
    testsPassed: 10,
    testsFailed: 0,
    typecheckOk: true,
    buildPassed: true,
    linterPassed: true,
    humanApproved: true,
  },
  complexityPenalty: 0.05,
});
// result.performanceScore, result.metricBefore, result.metricAfter
```

## Testy

```bash
# Typecheck
node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json

# Smoke (11 scenariuszy)
node dyspozycje/autobot/tools/autobot-smoke.cjs
```

## Mapowanie Civ

| AutoBot | Sesja Cursor |
|---------|----------------|
| Operator | **GPT-5.6 Luna Medium** — implementer |
| Evaluator | **GPT-5.6 Luna High** — adwokat diabła + testy · **SCOPE** — diff tylko do tematu (`rule_105`) · **STRICT** — luki testów → FAIL (`rule_106`) · **STRICT-EDGE** — happy-path-only → FAIL (`rule_107`) · **STRICT-PARITY** — asymetria gracz/AI/MP → FAIL (`rule_108`) · **STRICT-SAVE** — luki save/load → FAIL (`rule_109`) |
| Finalna kontrola / integracja | **GPT-5.6 Luna Medium** — status/ABC albo skierowanie do integracji |
| playbook | ten katalog + reguły procesu |
| Dev scorer | typecheck + testy + deploy gate |

Po raporcie Operatora Evaluator jest uruchamiany automatycznie. `PASS` przechodzi przez
finalną kontrolę, a następnie do aktualizacji statusu, pełnego ABC z ID albo integracji;
`FAIL` wraca do Operatora. Deploy/push wymaga bramek i autoryzacji właściciela.

## Integracja z Ultracode/Workflow (Maciej 2026-08-12)

Workflow (Ultracode, Claude Agent SDK) jest narzędziem wykonawczym, które automatyzuje
dokładnie architekturę opisaną wyżej — nie zastępuje żadnego z 5 modułów. `OperatorAgent`
odpowiada `phase('Operator')` z modelem GPT-5.6 Luna Medium, a `EvaluatorAgent` odpowiada
`phase('Evaluator')` z modelem GPT-5.6 Luna High; obie fazy MUSZĄ być krokami jednego
skryptu Workflow, nigdy dwoma osobno zlecanymi uruchomieniami — bo dokładnie ten podział
umożliwił w tej sesji scalenie ~11 zmian Operatora bez pośredniego Evaluatora. `pipeline()`
z Workflow przepuszcza wiele tematów przez `OperatorAgent → EvaluatorAgent` niezależnie
(temat A może być już w Module 1/Hard Metric Evaluator, gdy temat B wciąż jest w Module
4/Guardrails), bez ręcznego pilnowania kolejności.

Guardrails (Moduł 4) obowiązują identycznie wewnątrz Workflow: `assertProdIsolation`, HITL,
zakaz merge→`main`, deploy tylko po `humanApproved` + `deployPassword`. Dla zmian
dotykających silnika bitwy, save/load lub migracji `gra/data/**` — jeden `EvaluatorAgent`
nie wystarcza, wymagane 3 niezależne instancje głosujące większością (adversarial verify).

Każdy prompt agenta uruchamianego w `isolation:'worktree'` (Workflow albo ręczny `Agent`
tool) zaczyna się od obowiązkowej weryfikacji bazy worktree (grep symbolu, który musi
istnieć na właściwej gałęzi; brak trafienia = STOP i zgłoszenie, nie ręczne odtwarzanie
kodu) — dokładny szablon: `.cursor/rules/autobot-evaluator-operator.mdc`
§„Integracja z Ultracode/Workflow".

**Co zostaje poza Workflow, zawsze ręką orkiestratora:** finalna kontrola, integracja,
`git commit`/`push`, wpisy do
`PYTANIA-OTWARTE.md`/`WERSJE.md`/`REJESTR-PROSB-I-ZADAN.md`/`KANAL-PRACA.md`, cały deploy
(hasło `deploy`, po bramkach i autoryzacji). Moduł 5 (Dashboard Logger) pozostaje docelowym miejscem na
postmortemy z przebiegów Workflow, gdy scaffold na to pozwoli.
