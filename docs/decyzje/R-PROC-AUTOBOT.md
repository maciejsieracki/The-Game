# R-PROC-AUTOBOT — pełny opis procesu dla człowieka

**Status:** 🟢 TWARDA REGUŁA — obowiązuje.
**Powiązane:** [`INDEX-PROCESU.md`](../procesy/INDEX-PROCESU.md), aktywne reguły
[`.cursor/rules/`](../../.cursor/rules/), skill [`.claude/skills/civ-autobot/SKILL.md`](../../.claude/skills/civ-autobot/SKILL.md).

Ten dokument opisuje normę procesu. Nie jest rejestrem tematów, kolejką ani miejscem decyzji
właściciela; nawigację i lokalizację dowodów prowadzi indeks procesu.

## 1. Obowiązujący routing

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja głównego orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push na wyraźne polecenie właściciela
```

| Etap | Odpowiedzialność | Zakaz |
|---|---|---|
| Operator High | Jeden temat w izolacji, artefakt, testy i raport | Nie ocenia, nie integruje, nie deployuje, nie pushuje |
| Evaluator High | Niezależna kontrola zakresu, regresji, metryk, testów i blokad | Nie zastępuje Operatora i nie publikuje |
| Final Control High | Osobny subagent kontroluje ślad obu ról i gotowość integracji | Nie integruje i nie wystawia samodzielnie `READY_FOR_DEPLOY` |
| Orkiestrator Medium | Weryfikuje stan i integruje wyłącznie zatwierdzoną allowlistę | Nie omija raportów ani bramek |
| Deploy/push | Publikuje po `READY_FOR_DEPLOY` i autoryzacji | Nie wynika z commita ani raportu |

Raport Operatora uruchamia Evaluatora bez dodatkowego popychania właściciela. Raport
Evaluatora nie kończy tematu. Final Control raportuje gotowość do integracji; dopiero
faktyczna integracja przez orkiestratora Medium kończy przygotowanie.

## 2. C-043 — kanał właściciela

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Operator, Evaluator
i Final Control są kanałami technicznymi. Ich raporty i pytania wracają do orkiestratora;
właściciel nie jest kurierem między subagentami.

## 3. GOAL i kryteria końca

Każdy temat przed dispatchiem ma jawne:

```text
GOAL: <co ma istnieć po zakończeniu procesu>
KRYTERIA KOŃCA: <mierzalne warunki, artefakty i bramki>
```

GOAL nie może oznaczać wyłącznie raportu, sprawdzenia lub PASS. Dla paczki naprawczej
obejmuje zintegrowaną, allowlistowaną paczkę `READY_FOR_DEPLOY`, pełne ID, dowód
testów/bramek i brak zmian obcych. Deploy/push pozostaje osobnym krokiem.

## 4. Ciągła pętla domknięcia

Temat zachowuje jedno pełne ID:

```text
Operator PASS → Evaluator
Evaluator PASS → Final Control
Final Control PASS → integracja Medium → READY_FOR_DEPLOY
FAIL / techniczny BLOCK / TIMEOUT / INFRA / ZWIS
  → Operator → Evaluator → Final Control
```

Final Control wykrywa niegotowość lub konflikt → ta sama pętla od Operatora. `ZWIS`
nie oznacza anulowania; watchdog weryfikuje stan, a orkiestrator przejmuje temat.
Jedyną zwykłą pauzą jest ABC wymagające decyzji właściciela. Pauza dotyczy tylko danego
ID; niezależne tematy mogą działać dalej. Nowego ID nie twórz tylko z powodu poprawki.

## 5. Zgłoszenie, ABC i decyzja

Każde zgłoszenie dostaje pełne ID w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`. Otwarte ABC
zapisuj w `dyspozycje/PYTANIA-OTWARTE.md`, a decyzję po odpowiedzi właściciela jako
ECHO oraz właściwy dokument `docs/decyzje/<ID>.md`. Pełne ABC zawiera sytuację, cel,
powód, A/B/C, za/przeciw i rekomendację. ID musi być pełne, nie samo `Q1`.

## 6. Izolacja, allowlista i SCOPE

Operator pracuje w izolowanym worktree. Zakres obejmuje tylko zgłoszony temat i allowlistę.
Evaluator weryfikuje SCOPE, regresję i faktyczny diff, a nie opis agenta. Nie wolno
naprawiać „przy okazji”. Zmiana orkiestratora zapisana do repozytorium także wymaga
niezależnej oceny.

Dla kodu obowiązują bramki STRICT: brak asercji, czerwony test tematu lub typecheck
nieprzechodzący → FAIL; happy-path bez edge/negacji, asymetria gracz/AI/MP lub luka
save/load → FAIL według właściwej reguły. Dla dokumentacji uruchom audyt linków i testy
narzędzi, jeśli dotyczą; w Pakiecie 2 nie dotykaj `gra/`.

## 7. Raporty i dowody

Raport każdej roli zapisuj w `dyspozycje/autobot/logs/` z pełnym ID:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <jawny cel>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <komendy i dokładny wynik>
BLOKADY: <lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: wykonano albo nie wykonano
```

Final Control dodaje „gotowość do integracji: TAK/NIE”. Nie nazywa tego
`READY_FOR_DEPLOY`. Sam czat, worktree, branch, UI, „gotowe” ani commit nie są dowodem.

## 8. Playbook i Workflow

`playbook.md` jest źródłem aktywnych reguł pamięci, a `playbook.json` jest generowany
i nie wolno go edytować ręcznie. Po błędzie: napraw przyczynę, sprawdź inne miejsca,
zapisz error log i przekuj w regułę; recydywę zgłoś właścicielowi.

Workflow może automatyzować dispatch Operator → Evaluator, lecz nie zastępuje ról ani
zakazów. Prompt izolowanego agenta zaczyna się od weryfikacji bazy worktree. Final Control,
integracja, commit/push, rejestry oraz deploy pozostają pod kontrolą orkiestratora i
osobnych bramek.

## 9. Integracja i deploy

Przed integracją orkiestrator sprawdza raporty wszystkich ról, GOAL, allowlistę, diff,
commit, testy, blokady i faktyczny stan worktree. Integruje wyłącznie zatwierdzony zakres.
Po integracji może wystawić `READY_FOR_DEPLOY`.

Deploy/push wymaga osobnego polecenia właściciela, właściwego artefaktu i wymaganych
wpisów publikacji. Operator, Evaluator i Final Control nigdy nie wykonują tego kroku
automatycznie.

## 10. Historia

Dawne modele, procedury i pełne snapshoty dokumentów zachowano w
[`docs/archiwum-procesu/`](../archiwum-procesu/) jako historię. Są wyraźnie oznaczone
i nie mogą nadpisywać routingu z sekcji 1 ani mapy w indeksie.
