# AutoBot — runtime i odsyłacz procesu

**Status:** REFERENCYJNY README implementacji; normą procesu jest
[`docs/procesy/INDEX-PROCESU.md`](../../docs/procesy/INDEX-PROCESU.md), a pełnym opisem
dla człowieka [`R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md).

## Aktywny obieg

```text
Operator GPT-5.6 Luna High
→ Evaluator GPT-5.6 Luna High
→ Final Control GPT-5.6 Luna High
→ integracja orkiestratora GPT-5.6 Luna Medium
→ READY_FOR_DEPLOY
→ osobna bramka deploy/push
```

W Codex `multi_agent_v1` Operator i Evaluator wymagają jawnych parametrów
`model=gpt-5.6-luna` i `reasoning_effort=high`; nie używaj dziedziczenia modelu.

C-043: właściciel komunikuje się tylko w głównym czacie orkiestratora. Każdy temat ma
GOAL, pełne ID, allowlistę i izolację. To samo ID wraca do Operatora po FAIL/BLOCK/TIMEOUT/INFRA/ZWIS
wyłącznie po `authorizeDispatch({ id, roundsUsed, lastVerdict, automatic: true })`; próba 6 jest
blokowana statusem `LIMIT-5-EXCEEDED`. Manual resume wymaga jawnej decyzji i zachowuje ID,
licznik oraz `lastVerdict`; ABC pauzuje tylko temat wymagający decyzji. Nowe raporty zapisuj w
`runs/<ID>/00–04`; raporty ról są dowodami, nie zastępują Final Control ani integracji.

## Runtime AutoBot

| Obszar | Źródło |
|---|---|
| Aktywne reguły pamięci | [`playbook.md`](../../playbook.md) |
| Wygenerowany obraz playbooka | [`playbook.json`](playbook.json), nie edytuj ręcznie |
| Generator | [`tools/playbook-md-to-json.cjs`](tools/playbook-md-to-json.cjs) |
| Smoke | [`tools/autobot-smoke.cjs`](tools/autobot-smoke.cjs) |
| Typecheck | `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json` |
| Logi postmortemów | [`logs/postmortems.jsonl`](logs/postmortems.jsonl) |
| Audyt procesu | [`tools/process-docs-audit.cjs`](tools/process-docs-audit.cjs) |

```bash
node dyspozycje/autobot/tools/playbook-md-to-json.cjs --dry-run
node dyspozycje/autobot/tools/playbook-md-to-json.cjs --write   # tylko na jawne polecenie
node dyspozycje/autobot/tools/autobot-smoke.cjs
node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json
node dyspozycje/autobot/tools/process-docs-audit.cjs
```

`playbook.json` jest generowany z `playbook.md`; ręczna edycja jest zabroniona.
Smoke/generator uruchamiaj, gdy zmiana dotyka runtime lub playbooka. Dla paczki docs-only
nie uruchamiaj deployu/pushu i nie dotykaj `gra/`; aktualizuj tylko artefakty wskazane
allowlistą runu.

Pełny historyczny snapshot README pozostaje w
[`docs/archiwum-procesu/PAKIET-2-HISTORIA-AKTYWNYCH-DOKUMENTOW.md`](../../docs/archiwum-procesu/PAKIET-2-HISTORIA-AKTYWNYCH-DOKUMENTOW.md).
