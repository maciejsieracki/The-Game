# R-PROC-AUTOBOT — AutoBot (Evaluator–Operator)

**Status:** 🟢 **TWARDA REGUŁA OBOWIĄZUJE** (Maciej 2026-08-05) — **KAŻDA praca agenta wyłącznie w AutoBot**  
**Źródło:** Maciej — „każda praca którą wykonujesz ma być teraz wykonywana w systemie AutoBot” + Architectural Spec  
**Reguła Cursor (alwaysApply):** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Kod / playbook:** `dyspozycje/autobot/`

---

## Cel

Self-improving agent framework w patternie **Evaluator–Operator**:
- **Operator** wykonuje zadanie według `playbook.json`
- **Evaluator** mierzy twarde metryki, liczy deltę, robi postmortem i aktualizuje playbook

**U nas:** **nie wolno** wykonywać pracy „obok” systemu. Każda paczka = Operator → Evaluator → Grok final.

---

## Mapowanie na nasze role

| AutoBot | U nas |
|---------|--------|
| **OperatorAgent** | Implementer (`composer-2.5`) — czyta playbook + dyspozycję, wykonuje kod/testy |
| **EvaluatorAgent** | Adwokat diabła + Grok final (+ metryki: testy PASS/FAIL, playtest OK/BUG, **SCOPE + regresja** — `R-PROC-AUTOBOT-EVAL-SCOPE`) |
| **playbook.json** | `dyspozycje/autobot/playbook.json` — reguły z win/loss / win_rate |
| **Guardrails** | Zakaz merge→main / deploy bez hasła `deploy` / krytyczne = bramka Macieja |
| **Feature pruning** | Nie pakować do kontekstu Operatora atrybutów bez mocy predykcyjnej (śmieciowy kontekst) |

**Potrójna warstwa** (`R-PROC-POTROJNA-WARSTWA`) = konkretna realizacja Evaluator przed „gotowe”/deploy. AutoBot = szersza pętla uczenia się z playbooka.

---

## Twarde guardrails (NIENEGOCJOWALNE)

1. Operator **NIE** merge do `main`, **NIE** deploy ROBOCZA/KANON/FINALNA bez hasła Macieja.
2. Krytyczne akcje (promocja kanonu, finalna, force-push, kasowanie danych gry) → **mandatory human approval**.
3. „Zwycięzca testu” / zmiana progu w playbooku dopiero po **istotności statystycznej** lub **opóźnieniu czasowym** (nie po 1 runie).
4. Reguły z `win_rate < 30%` (min. N runów) → **deprecate** (nie kasuj historii — status `deprecated`).

---

## Scaffold (ten PR)

```
dyspozycje/autobot/
  playbook.json
  src/types.ts
  src/playbook-manager.ts
  src/operator-agent.ts
  src/evaluator-agent.ts
  src/feature-pruning.ts
  src/guardrails.ts
  src/logging.ts
  logs/
  README.md
```

Następne iteracje (osobne zadania): podpięcie metryk z `WERSJE.md` / testów / playtest rejestru → UI dashboard postmortems.

---

## Spec v1 — 5 modułów (2026-08-05)

Pełna implementacja w `dyspozycje/autobot/`:

| Moduł | Plik(i) | Kluczowe API |
|-------|---------|--------------|
| **1. Hard Metric Evaluator** | `src/hard-metrics.ts`, `src/evaluator-agent.ts` | `computePerformanceScore(metrics, complexityPenalty)` · `DevProfileScorer` / `SalesProfileScorer` / `TradingProfileScorer` · `EvaluationResult.performanceScore`, `metricBefore`/`metricAfter` |
| **2. Self-Pruning** | `src/feature-pruning.ts` | `pruneFeatureWeights()` — Pearson corr vs success; \|corr\| < 0.05 → usuń z kontekstu; `action_taken: "Removed feature X"` |
| **3. Playbook** | `playbook.json`, `src/playbook-manager.ts` | `rules[].rule_text`, `win_count`/`fail_count`, status `ACTIVE`\|`RETIRED`\|`QUARANTINE`, `min_confidence_threshold`, `quarantine_rules`, `getOperatorSystemRules()` |
| **4. Guardrails** | `src/guardrails.ts` | `assertProdIsolation` · HITL (no merge/mass-mail/real-money) · `canDeclareWinner` / `assertEvaluationDelay` (N≥1000 **LUB** ≥48h) |
| **5. Dashboard Logger** | `src/logging.ts` | JSONL: `run_id`, `timestamp`, `metric_before`, `metric_after`, `delta_percentage`, `postmortem_reasoning`, `action_taken` |

**Bramki jakości:** `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json` · `node dyspozycje/autobot/tools/autobot-smoke.cjs`

**Reguły Civ w playbook:** triple-layer (rule_101), numer-abc-deploy (rule_102), no-npm-run-build (rule_103), lane-no-main-ts (rule_104), **eval-scope-no-regression** (rule_105).

---

## Checklista Evaluator — SCOPE (rule_105)

**Kanon:** `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md`

| Oś | Pytanie |
|----|---------|
| **SCOPE** | Czy każda linia diffu wynika z problemu/AC tematu? |
| **DIFF-MINIMAL** | Czy brak refaktoru „przy okazji” i cudzych plików bez handoffu? |
| **REGRESSION** | Czy nie cofa wcześniejszych fixów / nie psuje innego zachowania? |
| **COUPLING** | Czy nie wprowadza sprzężeń poza zakresem tematu? |

**Werdykt:** naruszenie → **FAIL** lub **PASS-WITH-NOTES** z blockerami (nie akceptować cicho).

---

## v2 — Protokół AutoBot (Maciej 2026-08-07)

**Źródło:** trzy dokumenty dostarczone przez Macieja (protokół generyczny, wypracowany poza tym repo, teraz zintegrowany tutaj) — kopie kanoniczne: `dyspozycje/autobot/protokol-v1.2/AUTOBOT-PROMPT-v1.2.md` · `AUTOBOT-opis-i-wdrozenie-v1.2.md` · `playbook-zrodlowy-przykladowy.md` (przykładowy playbook z innego wdrożenia, referencyjny wzór formatu — NIE dane tego projektu).

Zasada nadrzędna v2, cytat: *„Każdy może popełnić błąd. Nie wolno popełnić tego samego błędu drugi raz."*

### Nowe pola `playbook.json` (typy: `src/types.ts`)

| Pole | Rola |
|------|------|
| `errorLog: ErrorLogEntry[]` | **Rejestr błędów** — chronologiczny zapis KONKRETNYCH pomyłek (co się stało / przyczyna źródłowa / ID reguły zapobiegawczej / czy to recydywa). Odrębne od `rules[]` (liczniki win/fail) — to czytelna dla człowieka lista „NIGDY WIĘCEJ". |
| `conclusionsJournal: ConclusionJournalEntry[]` | **Dziennik wniosków** — „co zrobiono → skutek (miara zewnętrzna) → wniosek", najnowsze na górze. Ważniejszy niż same reguły — pokazuje DLACZEGO reguły wyglądają tak, a nie inaczej. |
| `openMatters: OpenMatter[]` | **Sprawy otwarte** — zadania bez jeszcze zmierzonego wyniku; przegląd obowiązkowy na starcie sesji AutoBot. |

### Status `PROTECTED` (alias PL: CHRONIONA)

Dodany do `RuleStatusCanonical`. Bariery bezpieczeństwa i reguły zatwierdzone WPROST przez Macieja — nie podlegają licznikom win/fail (`recordRuleOutcome` wymaga `status===ACTIVE`) ani automatycznemu `RETIRED` (`retireWeakRules` pomija wszystko poza `ACTIVE`). **Status PROTECTED nadaje wyłącznie człowiek** — agent może go tylko zaproponować.

### Protokół błędu — R-PROC-AUTOBOT-BLAD (5 kroków, natychmiast po każdym błędzie)

Błędem jest: Maciej poprawił lub odrzucił efekt; liczba nie przeszła weryfikacji; zadanie zrozumiane inaczej niż zamierzone; coś trzeba było przerabiać; agent sam zauważył pomyłkę.

1. **NAPRAW** — najpierw poprawka, bez usprawiedliwień.
2. **PRZYCZYNA, NIE WINNY** — „co zrobić inaczej następnym razem", nie „kto zawinił". Odpowiedź „będę uważniejszy” jest ZAKAZANA — wniosek musi zmieniać procedurę.
3. **SPRAWDŹ WSTECZ** — czy ta sama pomyłka siedzi w innych miejscach bieżącej i wcześniejszej pracy? Wskaż i popraw wszystkie wystąpienia.
4. **ZAPISZ DO `errorLog`** — data, co się stało, przyczyna, ID reguły zapobiegawczej.
5. **PRZEKUJ W REGUŁĘ** — nowa reguła w `rules[]`, status `ACTIVE`, licznik **0/0** (nie backfilluj liczników — start zawsze od zera, zgodnie z protokołem). O dalszym losie zdecydują liczniki po min. `thresholds.minRunsForSignificance` (**10**, podniesione z 5) zastosowaniach.

**Recydywa** (powtórka błędu już obecnego w `errorLog`) = incydent krytyczny — zgłoś Maciejowi wprost, zaznacz `isRecidivism: true`, zaproponuj mocniejsze zabezpieczenie. Realny przykład z tej sesji: dwukrotne usunięcie worktree z niescaloną pracą Operatora (`err_20260806_01`) → `rule_114`.

### Progi statusu reguły (v2, ujednolicone z `thresholds`)

Skuteczność = `win_count / (win_count + fail_count)`, liczona od min. **10** zastosowań (`minRunsForSignificance`):

- **< 30%** → `RETIRED` (znika z promptu Operatora, zostaje w pliku; przywrócić może wyłącznie Maciej, przywrócenie zeruje liczniki),
- **30–60%** → `QUARANTINE`/„W OBSERWACJI” — **nadal stosowana** (reguła odstawiona na zawsze nigdy nie zbierze danych na swoją obronę),
- **> 60%** → `ACTIVE`,
- **`PROTECTED`** — poza tym cyklem, patrz wyżej.

### Seed 2026-08-07

`rules[]` rozszerzone o `rule_110`–`rule_114` (test-vs-silnik, ABC-balans, escaping skryptów Workflow, worktree base-drift, worktree retention przed usunięciem) — każda 0/0, wyprowadzona z realnego incydentu w `errorLog` tej sesji. `rule_111` (ABC dla balansu) ustawiona od razu jako `PROTECTED`, bo Maciej zatwierdził ją wprost (patrz `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b, `R-PROC-ABC-BALANS`).

---

## P0 fix (R-PROC-AUTOBOT-P0 · 2026-08-05)

Po FAIL adwokata diabła (`bc-43dbc71b`):

1. **Dev scorer** — `typecheckOk`/`buildPassed`/`linterPassed` wymagają jawnego `=== true`; test signal wymaga `testsPassed` lub `testsFailed`; pusty metrics → score 0.
2. **Run history** — `logs/run-history.jsonl` via `appendRunHistory`/`readRunHistory`; `pruneFeatureWeights` na historii (≥ `minRunsForSignificance`).
3. **Evaluation delay** — `retireWeakRules` + prune pomijane gdy delay niespełniony; `recordRuleOutcome` zawsze; `allowPlaybookMutation` tylko smoke/test.
4. **Guardrails deny-by-default** — nieznany `actionId` → `forbidden`; semantika merge/deploy-force blokowana.
5. **RETIRED** — `retireWeakRules` ustawia `status=RETIRED` (kwarantanna bez nadpisywania na QUARANTINE).
