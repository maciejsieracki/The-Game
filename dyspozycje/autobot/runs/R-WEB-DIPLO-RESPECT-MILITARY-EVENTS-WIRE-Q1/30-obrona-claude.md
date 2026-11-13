# R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1 — obrona (runda 1, odpowiedź na zarzuty Evaluatora 04f2a8bc)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1
GOAL: zdarzenie militarne 'wygrana_bitwa' (+5 Respekt) realnie zmienia Respekt AI wobec gracza poza wojną; clamp wojenny bez zmian; przewaga_militarna / slabszy_militarnie → DECISION_REQUIRED (ABC).
ZMIANY-COMMIT: kandydat a3d2773e8 (operator); poprawka obrony r1 = 9560764098c72d371b476cb5bdf0fce98ef7397d (kod); ten raport = commit po nim. Allowlista zachowana: gra/src/game/diplomacy.ts, gra/src/main.ts, gra/tools/diplo-respect-military-events-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1/**. Wartości zdarzeń (+15/−10/+5), clampRelationForWar, JSON balansu, WERSJE.md nietknięte.

## Odpowiedź na zarzuty Evaluatora

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Logika helpera (kto wygrał, kierunek pary, gate human/barbarian/remis) nieprzetestowana behawioralnie; mutant z odwróconym `winnerOwner` przechodzi 15/15 | PRZYJMUJĘ | Logikę wydzielono do czystej funkcji `militaryWinRespectPair(winner, atkOwner, defOwner, isHumanOwner, isBarbarianOwner)` (eksport w `gra/src/game/diplomacy.ts`). Helper `applyMilitaryWinRespectEvent` w `main.ts` tylko ją wywołuje i przekazuje wynik do `applyDiploEventTracked(..., 'wygrana_bitwa')`. Nowa sekcja E testu: 9 asercji behawioralnych (gracz atakuje i wygrywa; gracz broni i wygrywa; przegrana gracza; wygrana AI; remis; AI↔AI; gracz vs barbarzyńca; ta sama własność; brak właściciela). Mutacja (odwrócenie kierunku w `diplomacy.ts`) → `Wynik: 22 OK, 2 FAIL`, z FAIL `gracz atakuje i wygrywa → gracz dostaje zdarzenie` i FAIL `gracz broni i wygrywa → gracz dostaje zdarzenie`, exit 1. Plik przywrócony z kopii (zawartość = kandydat + poprawka). |
| 2 | GOAL niepełny: podpięto 1 z 3 zdarzeń militarnych; przewaga_militarna i slabszy_militarnie bez wywołań | PRZYJMUJĘ JAKO DECISION_REQUIRED (nie wdrażam) | `diplomacy.ts:875` komentarz: przewaga „crossed 2x or 5x military threshold”; `diplomacy.ts:876`: slabszy „player weaker than partner”. Grep `przewaga_militarna\|slabszy_militarnie` w `gra/src/main.ts` i `gra/src/game/*.ts` daje tylko definicje i etykiety (`diplomacy-factors.ts:72-73`). Silnik nie wykrywa progu 2x/5x ani porównania siły gracz–partner, więc podpięcie wymaga NOWEJ reguły wyzwalania (próg, częstość, kierunek) — decyzja liczbowa/produktowa, pytanie ABC do właściciela (CLAUDE.md, stałe zasady pkt 3). Kryterium końca dispatchu (po wygranej bitwie Respekt rośnie o wartość zdarzenia) jest spełnione. Test sekcja D utrwala brak wywołań celowo, do czasu decyzji. |
| 3a | Efekt praktyczny mały i niezmierzony w grze; niejasne, czy każda wygrana (także kolejne rundy oblężenia) daje +5 | CZĘŚCIOWO PRZYJMUJĘ: pomiar jest w teście, pytanie o częstość → ABC | Pomiar z testu B (surowe wyjście): `POMIAR wojna wysoka: przed Z=60 R=60 score=120; po Z=0 R=29 score=29`; `wojna, score poniżej capu: pełne +5 Respektu (zmierzone 5)`. Czy każda runda oblężenia daje osobne +5, zależy od definicji „wygrana bitwy”, która nie jest określona w dispatchu — pytanie ABC (C poniżej). NIE_ZMIERZONO: efekt w pełnej grze (rozgrywka na żywo) nie był mierzony. |
| 3b | Brak testu w przeglądarce i testu zapisu/odczytu | ODRZUCAM jako blokadę | Dispatch nie wymaga weryfikacji w przeglądarce ani testu zapisu/odczytu. Temat nie jest wizualny (wymóg przeglądarki z CLAUDE.md dotyczy tematów wizualnych). Zdarzenie idzie ścieżką `setDiploRelation`, tą samą co inne zdarzenia dyplomatyczne. Ewentualny test zapisu to osobny temat, nie ten. |
| — | Uwaga integracyjna: `origin/main` zmienił main.ts (NEGOTIATION-ROUND-COUNTER-UNIFY) | Przyjęte do integracji przez orkiestratora | Nie integruję. Kandydat jest potomkiem bazy a4b7a546 (`git merge-base --is-ancestor` → OK). Przed FF orkiestrator sprawdza `git merge-tree` względem aktualnego origin/main. |

## Bramki (surowe wyjście, po poprawce, katalog gra/)

- `npx tsc --noEmit` → exit 0, bez wyjścia.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs` → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0.
- `node tools/diplo-respect-military-events-test.cjs` → `Wynik: 24 OK, 0 FAIL`, exit 0 (sekcje A, B, C, E, D).
- Mutacja (odwrócony kierunek w `militaryWinRespectPair`) → `Wynik: 22 OK, 2 FAIL`, exit 1.
- NIE_ZMIERZONO: przeglądarka (nie wymagana dispatchem). `npm run build/dev` nie uruchamiano (zakaz).

## Tabela miejsc wywołań (kod po poprawce)

- `applyMilitaryWinRespectEvent(atkRoster, defRoster, winner);` — dokładnie jedno wywołanie, w `applyMapBattleOutcome` w `gra/src/main.ts`, przed `battleQ`.
- `applyDiploEventTracked(winnerOwner, loserOwner, cur, 'wygrana_bitwa')` — jedno wywołanie, w helperze w `main.ts`, po `militaryWinRespectPair`.
- `przewaga_militarna` / `slabszy_militarnie` — 0 wywołań (świadomie, DECISION_REQUIRED).

## Pytania ABC do właściciela (do zadania w oknie orkiestratora)

A. Przewaga militarna (+15): jaki próg wyzwala zdarzenie? (A) 2x jednorazowo na parę, (B) 5x jednorazowo, (C) 2x i 5x osobno, (D) nie podpinać. Rekomendacja: C.
B. Słabszy militarnie (−10): wyzwalać przy każdym spadku poniżej partnera, czy raz na przejście progu? Rekomendacja: raz na przejście.
C. Wygrana bitwa (+5): czy każda wygrana bitwa (także kolejna runda oblężenia) daje +5, czy jedna wygrana na oblężenie/turę? Rekomendacja: każda wygrana bitwa (stan obecny).
D. Clamp wojenny ścina Respekt do 29 (`WAR_RELATION_SCORE_CAP`): zostawić (stan obecny) czy zmienić? Rekomendacja: zostawić; poza tym tematem.

## RUNDY

1/5. Werdykt Evaluatora na kandydacie a3d2773e8: PASS-WITH-NOTES. Ta runda: 1 zarzut przyjęty w pełni (kod + test), 1 przyjęty jako DECISION_REQUIRED, 1 częściowo przyjęty (pomiar tak, częstość → ABC), 1 odrzucony z uzasadnieniem.

## NASTĘPNY KROK

Orkiestrator: Evaluator/Final Control na SHA kodu 9560764098c72d371b476cb5bdf0fce98ef7397d; zadać ABC A–D; przed integracją `git merge-tree` względem aktualnego origin/main.

DEPLOY/PUSH: NIE WYKONANO
