---
name: autobot-aneks-2026-08-21
description: >-
  DRAFT — nieprzeniesiony jeszcze do kanonu. Konkretne instrukcje AutoBot per rola
  (Operator/Integrator/Evaluator/Watchdog/orkiestrator) wynikające z retrospektywy
  2026-08-20/21: rozdzielenie DECISION_REQUIRED od BLOCK, integracja allowlist-only
  per hunk, weryfikacja wdrożenia przez git merge-base --is-ancestor, rejestr
  duplikatów, domena GAME/PROCESS/INFRA/INFORMATIONAL, watchdog liczący własny slot.
  Nie używaj jako źródła prawdy zamiast civ-autobot — to materiał do scalenia po
  zakończeniu bieżącej sesji edytującej playbook.md/civ-autobot/autobots.
---

# Aneks AutoBot 2026-08-21 (DRAFT, do scalenia)

Status: **DRAFT, po niezależnej weryfikacji (Evaluator PASS-WITH-NOTES → poprawki naniesione)**.
Nie zastępuje `civ-autobot` ani `autobots` — te pozostają źródłem prawdy do
czasu, aż właściciel jawnie zatwierdzi scalenie tego aneksu do `playbook.md`,
`R-PROC-AUTOBOT.md` i obu istniejących skilli. Pełna treść, uzasadnienie
incydentów i raport z weryfikacji: [`dyspozycje/AUTOBOT-INSTRUKCJE-ANEKS-DRAFT-2026-08-21.md`](../../../dyspozycje/AUTOBOT-INSTRUKCJE-ANEKS-DRAFT-2026-08-21.md).

## Po co ten aneks

Retrospektywa 2026-08-20/21 wykazała, że większość zmarnowanego czasu nie
brała się z błędów w kodzie gry, tylko z tego, że proces nie rozróżniał:
problemu procesowego (worktree/ledger/provenance) od błędu funkcjonalnego gry;
konfliktu kontraktów (wymaga decyzji właściciela) od zwykłego FAIL (wymaga
kolejnej rundy Operatora); tematu gotowego do integracji per-hunk od tematu
faktycznie zablokowanego.

## Kluczowe reguły (skrót — pełna treść w pliku docelowym)

1. **`DECISION_REQUIRED`** ≠ `BLOCK`. Konflikt dispatch/kod/testy → Operator
   nie koduje dalej, nie zużywa rundy, zapisuje zgłoszenie w
   `runs/<ID>/decision-abc.md`. To NIE zastępuje **C-018** (obowiązkowy turniej
   A/B/C dwóch niezależnych agentów dla decyzji z wpływem na gameplay/UX/dane
   gracza) — dla takich decyzji `decision-abc.md` jest tylko wyzwalaczem
   turnieju, nie substytutem. Tylko konflikty czysto inżynierskie bez wpływu
   na gameplay idą lekką ścieżką (jedna propozycja).
2. **Domena w każdym raporcie**: `GAME` / `PROCESS` / `INFRA` / `INFORMATIONAL`.
   Brudny worktree, obcy hunk, rozjazd ledgeru = `PROCESS`/`INFRA`, nigdy
   automatycznie błąd gry.
3. **Weryfikacja wdrożenia** przez `git merge-base --is-ancestor <commit> <HEAD>`,
   nie przez pamięć „co jest w najnowszej Fali".
4. **Integracja = allowlist-only, per plik i per hunk.** Zakaz `git add -A`/`git add .`.
   Nierozdzielny wspólny plik → `INTEGRATION_PENDING`, nie `BLOCK`.
5. **Rejestr duplikatów** (`duplicate_of`/`related_to`/`supersedes`) sprawdzany
   PRZED otwarciem nowego tematu.
6. **Watchdog liczy się jako zajęty slot**, jeśli dzieli limit wątków z
   Operatorem/Evaluatorem; raportuje rozjazd `ledger_free_slot` vs
   `runtime_thread_limit` osobno.
7. **`READY_FOR_DEPLOY`** dopiero po Operator PASS → Evaluator PASS → Final
   Control PASS → integracja allowlist-only → weryfikacja manifestu.
   `INTEGRATED` i `DEPLOYED` to osobne statusy.

## Jak używać tego skilla teraz

Traktuj go jako listę kontrolną przy pracy nad tematami AutoBot w tej sesji,
**ale nie edytuj nim `playbook.md`, `civ-autobot/SKILL.md` ani `autobots/SKILL.md`**
dopóki właściciel nie potwierdzi, że tamta sesja skończyła i można scalać —
te pliki są aktualnie w aktywnej edycji gdzie indziej.
