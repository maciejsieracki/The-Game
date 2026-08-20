# R-PROC-AUTOBOT — aktywna norma procesu

**Status:** obowiązujący opis dla człowieka. Mapa źródeł prawdy i lokalizacja artefaktów
znajdują się w [`INDEX-PROCESU.md`](../procesy/INDEX-PROCESU.md); techniczny skrót egzekwuje
[reguła Cursor](../../.cursor/rules/autobot-evaluator-operator.mdc), a instrukcja wykonawcza
jest w [skillu](../../.claude/skills/civ-autobot/SKILL.md).

## 1. Role i kolejność

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja głównego orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push
```

| Etap | Odpowiedzialność | Zakaz |
|---|---|---|
| Operator | Wykonuje jeden temat w izolacji, zgodnie z GOAL i allowlistą; zapisuje artefakt, testy i raport | Nie ocenia własnej pracy, nie integruje, nie deployuje, nie pushuje |
| Evaluator | Niezależnie sprawdza SCOPE, regresję, testy, dowody i blokady; wydaje werdykt | Nie zastępuje Operatora i nie publikuje |
| Final Control | Kontroluje kompletność śladu, zgodność z GOAL i gotowość do integracji | Nie integruje i nie wystawia samodzielnie `READY_FOR_DEPLOY` |
| Orkiestrator | Weryfikuje faktyczny Git i integruje wyłącznie zatwierdzoną allowlistę | Nie omija raportów ani bramek |
| Deploy/push | Publikuje po `READY_FOR_DEPLOY` i osobnej autoryzacji | Nie wynika z commita ani raportu |

## 2. GOAL, ID i izolacja

Przed dispatchiem każdy temat ma pełne ID, jawny `GOAL`, mierzalne kryteria końca,
allowlistę plików, bazę worktree i plan testów. Zgłoszenie trafia do rejestru; Operator
nie rozszerza zakresu „przy okazji”. Każda zapisana zmiana wymaga niezależnej kontroli.

## 3. Pętla domknięcia

Temat zachowuje to samo ID przez wszystkie rundy:

```text
Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY
   ↑            │              │
   └────────────┴──────────────┘  FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / niegotowość
```

Po raporcie Operatora Evaluator uruchamia się automatycznie. `PASS` prowadzi do Final
Control, następnie do integracji. Każdy wymieniony wynik negatywny wraca bez czekania do
Operatora, Evaluatora i Final Control z tym samym ID. `ZWIS` nie anuluje tematu; watchdog
sprawdza stan, a orkiestrator przejmuje pracę. Jedyną pauzą jest ABC wymagające decyzji
właściciela; niezależne tematy nadal działają.

## 4. Rejestry i artefakty

- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — jeden aktualny status tematu;
- `dyspozycje/PYTANIA-OTWARTE.md` — wyłącznie aktywne ABC oraz ECHO i odsyłacze zamkniętych decyzji;
- `docs/decyzje/<ID>.md` — decyzja właściciela, wariant, data, kryteria i konsekwencje;
- `dyspozycje/autobot/runs/<ID>/00-dispatch.md … 04-integration.md` — pełny ślad obiegu;
- `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` — jeden bieżący stan przejęcia;
- `dyspozycje/_handoff/KANAL-PRACA.md` — krótkie przekazania między sesjami;
- `dyspozycje/WERSJE.md` — tylko faktycznie opublikowane wersje ROBOCZEJ/KANONU/FINALNEJ;
- `dyspozycje/autobot/logs/` — historyczne/legacy logi, nie nowe źródło routingu.

Raport etapu zawiera:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładny wynik albo powód pominięcia>
BLOKADY: <lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

## 5. ABC, integracja i deploy

Pełne ABC zawiera ID, sytuację, cel, powód, A/B/C, za/przeciw i rekomendację. Właściciel
odpowiada w głównym czacie; orkiestrator zapisuje ECHO i decyzję plikowo. Subagenci nie
prowadzą równoległego kanału decyzji.

Final Control raportuje „gotowość do integracji: TAK/NIE”. Orkiestrator przed integracją
sprawdza raporty, GOAL, allowlistę, diff, commit, testy, blokady i faktyczny worktree.
Po faktycznej integracji może wystawić `READY_FOR_DEPLOY`. Deploy/push jest późniejszą,
osobną bramką i nie jest wykonywany automatycznie.

Historyczne routingi, dawne modele i snapshoty zachowano w
[`docs/archiwum-procesu/`](../archiwum-procesu/); nie są aktywną instrukcją.
