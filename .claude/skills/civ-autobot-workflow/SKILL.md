---
name: civ-autobot-workflow
description: >
  Dispatch Operator/Evaluator/Final Control AutoBot dla Civ przez narzędzie
  orkiestracji wieloagentowej Workflow, z jawnym model+effort per rolę. Używaj
  WYŁĄCZNIE gdy Workflow jest dostępny w tej sesji Claude Code ORAZ właściciel
  dał jawną, opt-in zgodę na multi-agent orchestration w tej sesji. Bez obu
  warunków użyj `civ-autobot`/`autobots` zamiast tego skilla.
---

# Civ — AutoBot dispatch przez Workflow (Ścieżka A)

Ten skill jest **Ścieżką A** z playbook C-061: dispatch Operator/Evaluator z jawnie
ustawionym `effort` per rolę, możliwy WYŁĄCZNIE przez narzędzie orkiestracji
wieloagentowej (Workflow), nigdy przez pojedynczy dispatch `Agent`.

## 0. Warunek wstępny — sprawdź PRZED użyciem tego skilla, nie zgaduj

1. Narzędzie Workflow jest faktycznie dostępne w tej sesji (nie zakładaj z pamięci
   poprzedniej sesji — dostępność jest per sesja).
2. Właściciel dał **jawną, opt-in zgodę na multi-agent orchestration w TEJ sesji**.
   Workflow nie uruchamia się bez tego i zgoda nie przenosi się automatycznie
   z wcześniejszej sesji ani z ogólnej zgody na AutoBot.

Jeśli którykolwiek warunek nie jest spełniony — **nie używaj tego skilla**. Wróć do
`.claude/skills/civ-autobot/SKILL.md` (albo `autobots/SKILL.md`) i różnicuj role
Operator/Evaluator wyłącznie przez treść promptu, bez parametru effort — to jest
Ścieżka B, w pełni poprawna i dziś aktywnie używana.

## 1. Dlaczego to jest osobna ścieżka, nie warunek w istniejącym skillu

Narzędzie `Agent` (podstawowy dispatch subagentów Claude Code) ma w swoim schemacie
parametr `model`, ale **nie ma** parametru `effort`/`reasoning_effort` — sprawdzone
bezpośrednio w schemacie narzędzia, nie z dokumentacji z pamięci. Różnicowanie
Operator (Sonnet 5, effort Medium) / Evaluator (Sonnet 5, effort High) zgodnie z
`docs/decyzje/R-PROC-AUTOBOT.md` §5a jest więc fizycznie możliwe wyłącznie przez
narzędzie z `opts.effort` per agent (Workflow) — nie przez `Agent`. Pełny opis
incydentu, który to ujawnił: `playbook.md` C-061.

## 2. Co ten skrypt Workflow NIE robi (kanon C-042, nie zmienia się w tej ścieżce)

- Nie wystawia `READY_FOR_DEPLOY`.
- Nie integruje kodu do drzewa głównego poza zatwierdzonym zakresem/allowlistą.
- Nie commituje, nie pushuje, nie deployuje.
- Final Control, integracja (allowlist-only, per plik i per hunk — C-059) i cały
  deploy/push dzieją się **poza** tym skryptem Workflow, ręką orkiestratora, po jego
  zakończeniu — dokładnie jak w dispatchu ręcznym.
- Nie resetuje ani nie prowadzi samodzielnie licznika rund (C-050) ani ledgeru
  dispatchu (C-051) — to prowadzi orkiestrator, poza samym skryptem.

## 3. Szkielet skryptu — PRZYBLIŻONY, wymaga potwierdzenia w realnym środowisku

**Zastrzeżenie:** dokładna składnia narzędzia Workflow (nazwa modułu do importu,
kształt `agent()`/`pipeline()`/`phase()`, nazwy pól w `opts`, dokładny identyfikator
modelu Sonnet 5 akceptowany przez `effort`) **nie została dziś zweryfikowana wprost**
względem aktualnej wersji narzędzia dostępnego w tej sesji. Fragmenty oznaczone
`// POTWIERDŹ:` są zamierzenie przybliżone — sprawdź je w realnym środowisku (pomoc
narzędzia, przykład z dokumentacji Workflow) PRZED pierwszym prawdziwym użyciem tego
skryptu. Nie traktuj ich jako pewnik i nie kopiuj bez weryfikacji do produkcyjnego
dispatchu.

```js
// POTWIERDŹ: dokładny import/nazwa modułu Workflow w wersji dostępnej w tej sesji.
import { phase, agent } from "workflow"; // POTWIERDŹ

export const meta = {
  id: "civ-autobot-operator-evaluator",
  description:
    "Operator -> Evaluator dla jednego pełnego ID AutoBot (Civ), effort per rola, Ścieżka A (playbook C-061).",
};

// Wywoływane per temat. Pełne ID/GOAL/allowlista/izolacja/plan testów są już
// ustalone przez orkiestratora w `00-dispatch.md` PRZED wywołaniem tego skryptu
// (kanon C-044, C-051) — ten skrypt ich nie wymyśla, tylko wykonuje dispatch.
export default async function autobotOperatorEvaluator(input) {
  const { fullId, goal, allowlist, testPlan, worktreeBase, round } = input;

  // Guard rundy (C-050): licznik rośnie PRZED dispatchem Operatora i jest
  // prowadzony przez orkiestratora, nie przez ten skrypt — tu tylko sprawdzamy,
  // że w ogóle wolno dispatchować.
  if (round > 5) {
    throw new Error(
      "LIMIT-5-EXCEEDED — nie dispatchuj przez Workflow; wymagana jawna decyzja właściciela/orkiestratora (playbook C-050, C-053)."
    );
  }

  const operatorReport = await phase("Operator", async () => {
    return agent({
      role: "operator",
      model: "sonnet-5", // POTWIERDŹ: dokładny identyfikator modelu wymagany przez Workflow
      effort: "medium", // Sonnet 5, effort Medium — kanon R-PROC-AUTOBOT.md §5a
      isolation: "worktree", // wymaga weryfikacji bazy PRZED pracą (playbook C-035, C-042)
      prompt: buildOperatorPrompt({ fullId, goal, allowlist, testPlan, worktreeBase }),
      // Operator NIE ocenia własnej pracy, NIE integruje, NIE deployuje, NIE pushuje (C-044).
    });
  });

  // Evaluator startuje automatycznie po raporcie Operatora, bez czekania na
  // dodatkowy sygnał właściciela (C-044) — ALE Operator i Evaluator są dwiema
  // sekwencyjnymi fazami W JEDNYM skrypcie, nigdy dwoma osobnymi, niezależnymi
  // dispatchami — to strukturalne zabezpieczenie przed powtórką incydentu
  // "zmiany scalone bez Evaluatora" (naruszenie C-017), patrz playbook.md sekcja
  // "Integracja z Ultracode/Workflow".
  const evaluatorReport = await phase("Evaluator", async () => {
    return agent({
      role: "evaluator",
      model: "sonnet-5", // POTWIERDŹ
      effort: "high", // Sonnet 5, effort High — adwersaryjne rozumowanie, kanon §5a
      isolation: "worktree",
      prompt: buildEvaluatorPrompt({ fullId, goal, operatorReport }),
      // Evaluator NIE zastępuje Operatora, NIE integruje, NIE publikuje (C-044).
    });
  });

  // FAIL / techniczny BLOCK / TIMEOUT / INFRA / ZWIS: guard rundy (C-050, C-051)
  // działa POZA tym skryptem — orkiestrator decyduje o kolejnym dispatchu (runda
  // N+1, max 5) po odebraniu wyniku, ten skrypt się NIE re-dispatchuje sam w pętli.
  if (isNegativeVerdict(evaluatorReport.status)) {
    return {
      status: evaluatorReport.status, // FAIL | BLOCK | TIMEOUT | INFRA
      domain: evaluatorReport.domain, // GAME | PROCESS | INFRA | INFORMATIONAL (C-055)
      round,
      operatorReport,
      evaluatorReport,
      nextStep:
        "Orkiestrator decyduje o kolejnej rundzie poza tym skryptem (guard C-050, max 5 rund).",
    };
  }

  // PASS / PASS-WITH-NOTES: skrypt Workflow KOŃCZY SIĘ TUTAJ.
  // Final Control, integracja, READY_FOR_DEPLOY i deploy/push są POZA tym skryptem
  // (C-042, C-044) — Workflow ich nie wystawia i nie wykonuje.
  return {
    status: "PASS_TO_FINAL_CONTROL",
    domain: evaluatorReport.domain,
    round,
    operatorReport,
    evaluatorReport,
    nextStep:
      "Orkiestrator dispatchuje Final Control osobno (poza tym skryptem Workflow) i dopiero po pozytywnym wyniku integruje (allowlist-only, C-059).",
  };
}

// POTWIERDŹ: czy Workflow w tej sesji faktycznie eksponuje phase()/agent() z tym
// kształtem argumentów, czy inny (np. parallel(), task(), inne nazwy pól opts,
// inny sposób przekazania modelu/effortu). Sprawdzić w dokumentacji/pomocy
// narzędzia PRZED pierwszym realnym użyciem — nie zakładać z tego szkieletu.
```

## 4. Checklist przed użyciem

- [ ] Workflow dostępny w tej konkretnej sesji (zweryfikowane, nie zgadywane).
- [ ] Właściciel dał jawną, opt-in zgodę na multi-agent orchestration w TEJ sesji.
- [ ] `00-dispatch.md` zapisany przed wywołaniem: pełne ID, GOAL, allowlista, izolacja,
      plan testów (C-044, C-051).
- [ ] Licznik rund (C-050) i ledger (C-051) prowadzone przez orkiestratora — nie
      polegaj na tym, że skrypt Workflow sam je aktualizuje.
- [ ] Model i effort per rola zapisane w raporcie etapu, jak przy dispatchu ręcznym
      (analogicznie do C-052 dla Codex `multi_agent_v1`).
- [ ] Po zakończeniu skryptu: Final Control, integracja allowlist-only (C-059),
      `READY_FOR_DEPLOY` i deploy/push wykonuje orkiestrator, nie ten skrypt.
- [ ] Raport końcowy jawnie stwierdza, że dispatch przebiegł Ścieżką A (Workflow),
      nie Ścieżką B (prompt) — patrz playbook C-061.

## 5. Powiązane

- `docs/decyzje/R-PROC-AUTOBOT.md` §5a (uzasadnienie effort per rola), §1a (jawny model Codex)
- `playbook.md` C-042 (Workflow nie zastępuje AutoBota), C-044 (kanon routingu), C-050
  (limit 5 rund), C-051 (ledger+watchdog), C-054 (`DECISION_REQUIRED`), C-059
  (integracja allowlist-only), C-061 (dwie ścieżki dispatchu, incydent źródłowy)
- `.claude/skills/civ-autobot/SKILL.md` i `.claude/skills/autobots/SKILL.md` — Ścieżka B
  (różnicowanie wyłącznie przez prompt), używana też przez narzędzia bez koncepcji
  Workflow (Cursor, GPT i inne)
