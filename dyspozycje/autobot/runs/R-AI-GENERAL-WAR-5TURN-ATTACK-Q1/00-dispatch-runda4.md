# Dispatch — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 4

**ID:** R-AI-GENERAL-WAR-5TURN-ATTACK-Q1  
**Runda:** 4  
**Operator:** AutoBot Operator  
**Baza:** `origin/main` = `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
**Izolacja:** `/tmp/the-game-ai-five-turn-20261028`, branch `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`  
**Tryb:** bez `git add/commit/push/checkout/reset/stash`, bez integracji i deployu.

## Goal

Po pięciu pełnych turach zbiórki AI ma rozkazem prawdziwego end-turn executora ruszyć kwalifikujący się skład wojskowy wraz z fizycznym Generałem na jeden cel aktualnej wojny. Sprawdzić wszystkie jednostki składu, postęp ruchu, śmierć Generała (restart zbiórki) i pokój (wyczyszczenie kampanii i jej rozkazów). Kandydat do celu ma być najbliższą osiągalną lądem stolicą przeciwnika; wybór celu ma pozostać stabilny w trakcie wojny.

## Acceptance

1. Ustalić na tej bazie, czy kampania jest już w kodzie/release źródle; potwierdzić na realnym end-turn przepływie, nie wyłącznie przez bezpośrednie wywołanie planisty.
2. Po pięciu pełnych turach zbiórki brak ataków; od kolejnej tury każdy kwalifikujący się, osiągalny członek składu (w tym fizyczny Generał) dostaje ruch do tego samego celu. Wynik podać jako `N/N` i osobno wymienić wykluczenia/held/noPath.
3. Śmierć przypisanego Generała resetuje licznik i wymaga nowego rekrutowanego wodza; pokój usuwa kampanię oraz jej dalsze rozkazy.
4. Wybór celu pomija stolice bez osiągalnej drogi lądowej: przy co najmniej dwóch wojnach wybiera najbliższą osiągalną lądem stolicę, nawet jeśli geometrycznie bliższa stolica jest zablokowana. Sprawdzić istniejącą zatwierdzoną decyzję/handoff o późniejszym priorytecie ataku morskiego. Nie budować transportu ani innych mechanizmów morskich w tym temacie.
5. Jeśli acceptance nie przechodzi, zmienić wyłącznie konieczne pliki produktu/testów. Zapisać liczby, komendy, dokładną bazę, hashe i ograniczenia. Operator nie wystawia werdyktu Final Control ani gotowości.

## Allowlist

- `gra/src/game/ai-general-war-campaign.ts` (wyłącznie jeśli wymaga tego potwierdzony brak produktu)
- `gra/src/game/ai.ts` (wyłącznie jeśli wymaga tego potwierdzony brak produktu)
- `gra/src/main.ts` (wybór osiągalnego celu i wiring kampanii)
- `gra/tools/ai-general-war-campaign-test.cjs`
- `gra/tools/ai-general-war-campaign-live-test.cjs` i jego Vite config (jeśli wymagane do sprawdzenia realnego executora)
- ten dispatch i `01-operator-runda4.md`

## Non-goals

Integracja, Final Control, publikacja/deploy, porządkowanie innych problemów/testów, morski transport albo zmiana istniejących decyzji produktowych. Właścicielskie ograniczenie tej rundy: wybór najbliższego osiągalnego lądem celu. Po odblokowaniu technologii priorytet ataku morskiego pochodzi z zatwierdzonego, osobnego tematu i pozostaje poza allowlistą tej rundy.
