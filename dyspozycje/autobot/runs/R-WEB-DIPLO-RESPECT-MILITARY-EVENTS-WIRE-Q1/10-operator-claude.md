# R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1
GOAL: zdarzenia militarne podpięte pod silnik Respektu AI (wariant B, decyzja właściciela 2026-11-13). Zrealizowano TYLKO `wygrana_bitwa` (+5 Respekt przy wygranej gracza). `przewaga_militarna` (+15) i `slabszy_militarnie` (−10) NIE są podpięte (patrz BLOKADY). Wartości zdarzeń i clamp wojenny nietknięte.
BAZA: origin/main a4b7a54641c0e231fa5fe8493fd3cfffdbe6f305 (worktree detach, czysty start)
SHA kodu: patrz commit w polu `sha` odpowiedzi Operatora (commit z `gra/src/main.ts`, `gra/tools/diplo-respect-military-events-test.cjs`, tym raportem)
RUNDY: 1/5

## ZMIANY / COMMIT

Allowlista (tylko te pliki):

- `gra/src/main.ts` (+23 linie, 0 usuniętych):
  - nowa funkcja `applyMilitaryWinRespectEvent(atkRoster, defRoster, winner)` obok `applyDiploEventTracked` (ok. linii 12465–12484). Gate: `winner !== 'remis'`, właściciele różni, zwycięzca = `isHuman`, przegrany nie-human i nie `isBarbarian`. Wywołuje `applyDiploEventTracked(winnerOwner, loserOwner, cur, 'wygrana_bitwa')` i `setDiploRelation`.
  - jedno wywołanie w `applyMapBattleOutcome`, zaraz po `chargeCombatCredibilityPenalties` (linia 35017).
- `gra/tools/diplo-respect-military-events-test.cjs` (NOWY): test silnika (esbuild bundle `diplomacy.ts`) + sekcja wiringu `main.ts` + sekcja zakresu.
- `dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRE-Q1/10-operator-claude.md` (ten plik).

Nie zmieniano: wartości zdarzeń (`diplomacy.ts` nietknięty), `clampRelationForWar`, JSON balansu, `WERSJE.md`, `gra-robocza/`, `rust-port/`. `git add -A` nie użyto.

### Tabela miejsc wywołań `applyDiploEventTracked` dla zdarzeń militarnych

| Zdarzenie | Przed (base a4b7a546) | Po (ta runda) | Miejsce |
|---|---|---|---|
| `wygrana_bitwa` | 0 wywołań | 1 wywołanie | `applyMilitaryWinRespectEvent` (main.ts:12483), wołane z `applyMapBattleOutcome` (main.ts:35017) |
| `przewaga_militarna` | 0 | 0 | brak (BLOKADA) |
| `slabszy_militarnie` | 0 | 0 | brak (BLOKADA) |

Przed zmianą `grep` po `src/main.ts` nie znalazł żadnego z trzech zdarzeń w wywołaniach `applyDiploEventTracked` (istniejące wywołania dotyczą `wojna_wypowiedziana`, `pokoj`, `trybut_*`, `dar`, `handel`, `zerwanie_*`, `zlamana_obietnica*`).

### Założenia (luki rozstrzygnięte ZAŁOŻENIEM)

1. Zdarzenie `wygrana_bitwa` dotyczy wyłącznie wygranej GRACZA (ownerId human). Wygrana AI nad graczem nie daje Respektu (Respekt jest jedną wartością na parę; wygrana AI nie podnosi wiarygodności gracza).
2. Bitwy AI↔AI, bitwy z barbarzyńcami (`isBarbarian`) i remisy nie generują zdarzenia.
3. Hook jest w `applyMapBattleOutcome` (wspólna ścieżka wyniku bitwy po stronie mapy). Nie badano osobno wszystkich ścieżek ręcznych UI; ścieżka `applyMapBattleOutcomeWithSummary` woła `applyMapBattleOutcome` jednokrotnie, więc zdarzenie nie dubluje się.
4. Partner, którym jest przegrany, może być państwem-miastem (`isCityStateOwner`). Nie wykluczano go, bo inne wywołania `applyDiploEventTracked` też obejmują takie pary.

## BLOKADY

- **DECISION_REQUIRED — `przewaga_militarna` (+15) i `slabszy_militarnie` (−10) NIE podpięte.** Definicja w `diplomacy.ts` (ok. linii 875–876, 1017–1024): „crossed 2x or 5x military threshold" oraz „gracz słabszy militarnie od partnera". W kodzie nie istnieje żaden istniejący wyzwalacz tych zdarzeń (`grep` po `src/` zwraca tylko definicje i etykiety). Zdarzenia są stanowe (przekroczenie progu = zmiana poziomu), więc wymagają: (a) progów 2x/5x i definicji stosunku wojsk (dziś `militaryRatioFromArmyM` / `sumArmyMForOwner` — do wyboru), (b) miejsca tury i (c) decyzji, czy stan „poziom progu" ma być zapisywany w save (zmiana formatu zapisu). To decyzje produktowe/progowe, więc wg CLAUDE.md §3 wymagają pytania ABC do właściciela. Nie wybierano ich samodzielnie.
- **DECISION_REQUIRED — clamp wojenny (pomiar, nie zmieniany).** `clampRelationForWar` (diplomacy.ts ok. 1121) ścina wynik do `WAR_RELATION_SCORE_CAP` (29) w stanie wojny. Pomiar w teście (sekcja B): w wojnie przy Z=60, R=60 (score 120) wynik po zdarzeniu `wygrana_bitwa` to Z=0, R=29 (score 29): cały +5 Respektu jest pochłaniany przez clamp, a dodatkowo Zaufanie spada do 0. W wojnie przy score poniżej capu (Z=0, R=10) +5 przechodzi w pełni (R=15). Zmiana clampu jest poza zakresem tematu i wymaga decyzji właściciela (stąd DECISION_REQUIRED).
- **Brak weryfikacji w przeglądarce.** Temat nie jest wizualny (logika dyplomacji), więc nie wykonano testu live. Nie wykonano też testu zapisu/odczytu gry po zdarzeniu.

## TESTY (surowe wyniki, z tego uruchomienia)

- `tsc --noEmit` (w `gra/`): exit 0, 0 linii wyjścia.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` / `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass` / `All sanity checks passed.`, exit 0.
- `node tools/diplo-respect-military-events-test.cjs` (nowy): `Wynik: 15 OK, 0 FAIL`, exit 0.
  - A: delta Respektu poza wojną = +5 (`wygraBitwa_respekt`), Zaufanie bez zmian, status pokój zachowany.
  - B: wojna poniżej capu +5 w pełni; wojna powyżej capu clamp do 29; wynik = `clampRelationForWar(wynik)`.
  - C: wiring: wywołanie `applyMilitaryWinRespectEvent(atkRoster, defRoster, winner)` w `applyMapBattleOutcome` dokładnie raz; helper ma gate `!isHuman(winnerOwner)`, wywołanie `applyDiploEventTracked(winnerOwner, loserOwner, cur, 'wygrana_bitwa')`, gate `remis`.
  - D: brak wywołań `przewaga_militarna` / `slabszy_militarnie` w `main.ts`.
- `git diff --check`: bez wyjścia (czysto).
- **Mutacja** (usunięcie linii wywołania `applyMilitaryWinRespectEvent(atkRoster, defRoster, winner);` z `main.ts`): test czerwony, `MUT_EXIT=1`, FAIL „applyMapBattleOutcome wywołuje applyMilitaryWinRespectEvent (1 raz)" i „wywołanie występuje dokładnie raz w main.ts". Po przywróceniu pliku z kopii (`main.ts` zgodny z `git diff`, 1 wywołanie) test znów `15 OK, 0 FAIL`, exit 0.

Uwaga procesowa: `npm ci --ignore-scripts` w `gra/` (57 pakietów w `node_modules`), `npm run build`/`dev` NIE uruchamiano.

## NASTĘPNY KROK

Evaluator: sprawdzić diff (2 pliki kodu, 23 linie w `main.ts`) i powtórzyć bramki. Decyzje dla właściciela (ABC): (1) progi i definicja `przewaga_militarna`/`slabszy_militarnie` oraz zapis stanu progu w save; (2) czy zmienić clamp wojenny (pomiar w BLOKADACH).

DEPLOY/PUSH: NIE WYKONANO
