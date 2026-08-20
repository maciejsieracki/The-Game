---
name: civ-autobot
description: >
  Aktywna instrukcja procesu AutoBot dla repozytorium Civ: routing ról, GOAL, izolacja,
  ABC, dowody, testy i bramka deploy/push. Szczegóły normatywne są w INDEX-PROCESU.md
  i R-PROC-AUTOBOT.
---

# Civ — skill AutoBot

Najpierw przeczytaj [`docs/procesy/INDEX-PROCESU.md`](../../../docs/procesy/INDEX-PROCESU.md), a następnie stosuj
aktywną regułę [`.cursor/rules/autobot-evaluator-operator.mdc`](../../../.cursor/rules/autobot-evaluator-operator.mdc).
Pełny opis dla człowieka jest w [`R-PROC-AUTOBOT.md`](../../../docs/decyzje/R-PROC-AUTOBOT.md).

## Routing i reguła nadrzędna

Każda praca agenta przechodzi przez:

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja głównego orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push
```

Raport Operatora automatycznie uruchamia Evaluatora. Po `PASS` uruchom Final Control,
potem zleć integrację orkiestratorowi Medium. Żadna rola poza orkiestratorem po integracji
nie wystawia `READY_FOR_DEPLOY`, nie integruje, nie deployuje i nie pushuje.

## Start tematu

Przed dispatchiem zapisz pełne ID, `GOAL`, kryteria końca, allowlistę, izolację,
plan testów oraz właściwy handoff/rejestr/decyzję, jeśli temat je posiada. Nie ufaj
nazwie worktree, statusowi UI ani raportowi bez niezależnej kontroli Git i plików.

## Ciągła pętla

```text
Operator → Evaluator → Final Control
  ↖ FAIL / BLOCK / TIMEOUT / INFRA / ZWIS
Final Control → integracja Medium → READY_FOR_DEPLOY
```

`ZWIS` nie anuluje tematu: watchdog sprawdza stan, a orkiestrator przejmuje wykonanie.
ABC wymagające decyzji pauzuje tylko ten temat; niezależne tematy pracują dalej.

## C-043 i ABC

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Poboczne czaty są
techniczne; orkiestrator przekazuje ich raporty i pytania.

Pełne ABC zawiera ID, sytuację, cel, powód, A/B/C, za/przeciw oraz rekomendację. Po
odpowiedzi właściciela wykonaj ECHO i zapis plikowy, a następnie kontynuuj to samo ID.

## Raport i dowód

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista i commit albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: wykonano albo nie wykonano
```

Raport Operatora ani Evaluatora nie kończy procesu. Final Control raportuje gotowość do
integracji, a nie `READY_FOR_DEPLOY`.

## Izolacja, testy i zamknięcie

Nie dotykaj plików poza allowlistą. Dla pakietu dokumentacyjnego nie zmieniaj `gra/`,
rejestru tematów, `PYTANIA-OTWARTE.md`, handoffów ani logów. Uruchom audyt linków,
`git diff --check` oraz smoke/generator, jeśli zmiana obejmuje narzędzia AutoBot.
Po Final Control orkiestrator integruje wyłącznie zatwierdzony zakres i dopiero wtedy
może wystawić `READY_FOR_DEPLOY`. Deploy/push wymaga osobnego polecenia właściciela.

Historyczne routingi i procedury są tylko w [`docs/archiwum-procesu/`](../../../docs/archiwum-procesu/);
nie są instrukcją aktywną.
