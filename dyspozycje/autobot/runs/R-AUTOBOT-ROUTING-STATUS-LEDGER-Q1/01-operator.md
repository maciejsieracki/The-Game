# 01-operator — R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1

STATUS: PASS
TEMAT: R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1
GOAL: Uszczelnić routing stanów subagentów tak, aby każdy dispatch miał jednoznaczny ślad, a brak raportu nigdy nie pozostawał pustym przebiegiem.
RUNDY: 1
ROLA: Operator

## Zakres i źródła

Przeczytane: `README.md`, `C:\Users\macie\OneDrive - NASTER S.A\Pulpit\autobots\SKILL.md`,
`dyspozycje/autobot/runs/R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1/00-dispatch.md`, aktywna reguła
`.cursor/rules/autobot-evaluator-operator.mdc`, `.claude/skills/civ-autobot/SKILL.md`,
`CLAUDE.md`, `C-037` i `C-038` z `playbook.md`, a także generator `playbook-md-to-json.cjs`.

## Diagnoza utraty stanów

- `spawn`: istnieje opis dispatchu, ale brakowało jednego rekordu wiążącego agenta, rundę, oczekiwany raport i artefakt.
- `wait`: brak notyfikacji nie miał terminalnej klasyfikacji; mógł być błędnie uznany za nadal działającego agenta (C-037).
- `completed`/`interrupted`/`close`: raporty etapów nie wymuszały zamknięcia konkretnego dispatchu i timestampu zakończenia.
- `not_found`: nie było mechanicznego przejścia do `BLOCK`; możliwy był kolejny dispatch bez dowodu poprzedniej rundy (C-038).
- `timeout`: istniał guard limitu rund, lecz nie watchdog ledgeru, który zapisałby wynik timeoutu i dalszy routing.
- nieznany status: brak zakazu duplikowania agenta przy nierozstrzygniętym rekordzie.

## Wdrożony kontrakt

Każdy dispatch ma dokładnie dziewięć pól: `agent_id`, `temat`, `rola`, `runda`, `start`,
`oczekiwany_artefakt`, `ostatni_status`, `timestamp_zakonczenia`,
`routing_nastepnego_kroku`. Przejścia są jawne: `pending → running → terminalny status`.
Watchdog sprawdza rekord co minutę. Brak raportu klasyfikuje się jako `TIMEOUT`, `ZWIS`
albo `BLOCK`: `not_found → BLOCK`, cisza → `ZWIS`, timeout → `TIMEOUT`. `FAIL` i `BLOCK`
wracają do tego samego ID i Operatora po guardzie rund; po rundzie 5 routing zatrzymuje się
na `LIMIT-5-EXCEEDED`. Nieznany status blokuje duplikat i kolejny dispatch. Monitoring
kończy się po `READY_FOR_DEPLOY`, jawnym `BLOCK` albo `ABC-OCZEKUJE`. Operator nie deployuje
ani nie pushuje.

## Zmienione pliki

- `dyspozycje/autobot/src/routing-status-ledger.ts` — minimalny ledger, przejścia, watchdog i routing retry.
- `dyspozycje/autobot/tools/routing-status-ledger-test.cjs` — test procesu.
- `.cursor/rules/autobot-evaluator-operator.mdc` — aktywna reguła ledgeru i watchdogu minutowego.
- `.claude/skills/civ-autobot/SKILL.md` — źródło zasad ledgeru/watchdogu.
- `playbook.md` — wygenerowana zasada `C-051`.
- `dyspozycje/autobot/playbook.json` — zaktualizowany wyłącznie przez generator.
- `dyspozycje/autobot/runs/R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1/01-operator.md` — niniejszy raport.

## Testy

- `node dyspozycje/autobot/tools/playbook-md-to-json.cjs --write` — PASS; `C-051` dodane, `playbook.json` version 45.
- `node dyspozycje/autobot/tools/routing-status-ledger-test.cjs` — PASS, `12/12`.
  Pokryto `pending/running`, `completed`, `interrupted`, `not_found → BLOCK`, `timeout → TIMEOUT`,
  brak notyfikacji → `ZWIS`, `close → CLOSED`, zakaz duplikatu przy nieznanym statusie,
  routing tego samego Operatora oraz guard rundy 5.
- `git diff --check` — PASS dla zmian procesu; ostrzeżenia CRLF pochodzą z istniejącego repozytorium.
- Audyt procesu zgłasza istniejące, niezależne zmiany w `gra/**`; nie zostały przeze mnie zmienione.

## Ograniczenia i blokady

- Nie zmieniono `gra/**`, nie wykonano resetu, czyszczenia, integracji, commita, deployu ani pushu.
- `playbook.json` wymagał podwyższonego dostępu systemu plików z powodu `EPERM`; zapis wykonał wskazany generator, nie edycja ręczna.
- To jest implementacja kontraktu i test procesu; faktyczny orkiestrator musi wywoływać watchdog co minutę i zasilać ledger każdym dispatchiem.
- Kolejna bramka: niezależny Evaluator dla tego samego ID.

ZMIANY/COMMIT: allowlista powyżej; brak commita.
TESTY: `routing-status-ledger-test.cjs` 12/12 PASS; generator PASS.
BLOKADY: brak blokady zadania; istniejące zmiany `gra/**` pozostają poza zakresem.
NASTĘPNY KROK: Evaluator → Final Control; przy FAIL/BLOCK/TIMEOUT/ZWIS wrócić do tego samego ID po guardzie rund.
DEPLOY/PUSH: NIE WYKONANO
