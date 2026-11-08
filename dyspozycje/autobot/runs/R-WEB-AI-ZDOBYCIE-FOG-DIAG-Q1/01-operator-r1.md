STATUS: DECISION_REQUIRED
DOMAIN: GAME (WEB) — AI zdobywanie miast / mgla wojny
TEMAT: R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1
GOAL: Diagnoza kazdego FAIL z dlugu B. Kod gry (ai.ts) bez zmian.
BAZA: origin/main 247f1ef2a (detached).

## Diagnoza

### A. ai-zdobycie-miasta-adiacencja-test.cjs: fixtury i kotwice nieaktualne, kod poprawny
- K1b, K2b-K2g (test:275, 297-302): fixtura `planAiCityMove` nie deklarowala wojny. Realne wiring main.ts:39293 podaje `atWarWithCiv`. Bez tego ai.ts:3796 (`consolidationPeace`, R-WEB-ARMY-CONSOLIDATION-Q1, f2100f9cf) prowadzi jednostke do stolicy: `move` (4,3) bez targetCityId. Probe: z `atWarWithCiv:true` -> `move` (5,5) `targetCityId:'wrog-c1'`. Galaz adjacentEnemyCity (ai.ts:4113-4127) dziala.
- A5c, A5d, A6c (test:455, 457, 516): stare kotwice. `onCapture` w main.ts:40721 jest ~2.2 kB od wywolania (okno 1400 za male). `hasCityDefenders` i `canCaptureCityWithoutBattle` dostaly `cityDefenderOptions` (main.ts:34670+, 6d37eb476).
- K6c (test:648): kotwica `if (canEnterEmptyCity) blockedKeys.delete(...)` nie istnieje. Przebudowa passThrough: ai-city-capture-executor.ts:118-121 (8169a3e82).
- dropTarget (test:665): kotwica sprzed linii `canEngageOwner` (ai-city-capture-executor.ts:95-97, e06ad53c8).
- K9e, K9f, K6b: kaskada z fixtury.

### B. ai-fog-test.cjs
- W2 (test:83): `decideAITurn` emituje `attack` a2(5,5) -> e2(6,5) przy visibleHexes={'5,5'}. Zrodlo: applyHomeWarPriorities (ai.ts:3392, 3489) -> planHomeWar (ai-war-home-defense.ts), ktory dostaje `enemyUnits` NIEFILTROWANE przez visibleHexes (ai.ts:3437-3439). Probe: `setHomeWarDefenseOverride(false)` -> move zamiast attack. Flaga domyslnie ON (ai-war-home-defense.ts:62). Commit 344e5b3fd (2026-11-05).
  Konflikt regul: (a) f32f1b3fb (2026-09-08), swiadoma decyzja: AI zna wlasna ziemie niezaleznie od wzroku (ai.ts:3552-3562). (b) ai-fog.ts `aiTargetVisibleForAction` = twarda bramka egzekucji; main.ts:40832-40836 odrzuca atak na niewidoczny cel. Skutek: obronca traci ture (planner emituje atak, silnik go pomija).
- W3 (test:101): (i) fixtura bez `atWarWithCiv`; (ii) oczekiwany krok (6,5) nieaktualny wobec pelnego zasiegu ruchu AI (R-WEB-AI-MOVE-RANGE-Q1, 8b522e8f6), poprawnie (7,5).
- W8 (test:~167): fixtura bez `atWarWithCiv`.

## Zmiany (tylko testy; ai.ts nietkniety)
- gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs: `atWarWithCiv` + `canEngageOwner` w planerze; kotwice nounblock, dropTarget, okno 2600, DEFENDER_GATE; `isMe(anchor.ownerId)` dozwolone w A6f (komunikat dla gracza).
- gra/tools/ai-fog-test.cjs: W3 `atWarWithCiv` + oczekiwane (7,5); W8 `atWarWithCiv`. W2 nietkniety (czerwony do decyzji).
- Brak nowego testu regresyjnego: brak zmiany kodu produkcyjnego.

## TESTY
- ai-zdobycie-miasta-adiacencja-test: 96/96 OK, exit 0 (bylo exit 1).
- ai-fog-test: W1 OK, W2 FAIL (line 83), exit 1. Probe z neutralizacja tylko linii 83 (usuniety): W3-W8 PASS, 8/8.
- ai-test: 289 passed, 0 failed.
- logic-test: LOGIC OK 213/213.
- tsc --noEmit: exit 0.

## BLOKADY
- W2 wymaga decyzji wlasciciela. Bez niej ai-fog-test konczy sie exit 1.

## DECISION_REQUIRED: W2, czy AI broni wlasnego terenu przed niewidocznym wrogiem?
- A: Obrona terenu widzi wszystko (jak f32f1b3fb). Wymaga zmiany bramki w main.ts:40832 (poza allowlista) i zmiany W2.
- B (REKOMENDACJA): Mgla obowiazuje wszedzie. applyHomeWarPriorities filtruje enemyUnits przez visibleHexes (ai.ts:3437-3439, w allowlist). Obronca nie traci tury, W2 zielony bez zmiany tresci.
- C: Stan obecny swiadomy. Planner planuje atak na niewidoczny cel, egzekucja odrzuca; W2 przepisac na "planowanie != wykonanie" i udokumentowac utrate tury.

NASTEPNY KROK: decyzja A/B/C; przy A lub B temat kodu R-WEB-AI-HOME-WAR-FOG-Q1; przy C zmiana testu.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
