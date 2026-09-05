# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — Obrona Operatora (runda 1, obrona nie zwiększa licznika)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort medium (C-052)
GOAL: (1) kontratak tylko dla PIERWSZEGO atakującego w turze, bez wyjątku dla fortyfikacji/miasta;
(2) startowa kara morale `min(65%, 50%·log10(r))`, `r` = MOC ważona bieżącym HP, liczona RAZ.

## OBRONA

### Zarzut 1 → PRZYJMUJĘ (trafny, poprawione)

Zarzut potwierdzony własnym odczytem, nie przyjęty na słowo. `_resetBattleRuntimeState()`
(`battleScene.ts:9202`) czyścił `roundNo`, `engaged`, `turnOrder`, `_routCount*` — ale **nie**
`_startMoralePenaltyApplied`. Ścieżka: `onReplay` (`:9374`) → `_replayBattle()` (`:9233`) →
`_resetBattleRuntimeState()` → `_placeUnits(klony)` (świeże `morale/moraleMax = moraleBaseFor(bu)`)
→ `_startBattle()` (`:3399`) → `_applyStartingMoralePowerPenalty()` (`:3409`) wychodzi na guardzie
`:5222`. Słabsza strona startowała w powtórce z ułamkiem **100%** — dokładnie stan, który
kryterium 4 uznaje za niedomknięcie tematu, tylko innym wejściem.

Poprawka: `this._startMoralePenaltyApplied = false;` w `_resetBattleRuntimeState()`, z komentarzem
wyjaśniającym, że flaga jest jednorazowa NA BITWĘ, nie na instancję sceny.

Dowód, że poprawka jest mierzona (nie „zielona z założenia") — NOWA **CZĘŚĆ F** w
`walka-morale-przewaga-mocy-test.cjs`: asercje strukturalne na reset w `_resetBattleRuntimeState`
i na przejście `_replayBattle` → reset → `_startBattle`, plus symulacja sekwencji bitwa→powtórka na
**prawdziwych** `startingMoralePenaltyFrac`/`applyStartingMoralePenalty`.
- po poprawce: **76/76**, exit=0 (było 68/68);
- mutacja (usunięcie samej dodanej linii): **73/76**, exit=1, komunikat
  `powtórka … oczekiwano 0.5, jest 1` — ułamek wraca do 100%. Przywrócone.

### Zarzut 2 → ODRZUCAM jako defekt wykonania; PRZYJMUJĘ jako DO DECYZJI CZŁOWIEKA

Dane Evaluatora potwierdziłem samodzielnie na `gra/data/units.json` (71 rekordów z morale): przy
karze sufitowej 65% cztery rekordy startują ≤ własnego progu ucieczki — `mb=50/fm=22→17,5`;
`40/25→14,0`; `30/25→10,5`; `60/22→21,0`. Fakt jest prawdziwy.

Odrzucam jednak kwalifikację „defekt wykonania", z dowodem z dispatchu: GOAL 2 pkt 5 wiąże
**dosłownie** — „Obniża `morale` (pulę bieżącą), a NIE `moraleMax` ani `fleeMorale`", a bramka ma
asertować, że `fleeMorale` jest nietknięte (kryterium 4). Klamp do `fleeMorale` to nowa reguła
produktowa, której wytwór ani dispatch nie rozstrzygają („startuje BLIŻEJ progu", nie „poniżej”);
wprowadzenie jej z własnej inicjatywy byłoby zmianą GOAL przez wykonawcę.

Przyjmuję natomiast część proceduralną zarzutu: §3b i §16b pkt 4 zakazują trzymania tego w wolnej
nocie. Dlatego **wyprowadzam to z noty do jawnej pozycji DO DECYZJI CZŁOWIEKA** i zmieniam status
raportu na `DECISION_REQUIRED`. Kodu nie zmieniam do rozstrzygnięcia właściciela.

**DO DECYZJI CZŁOWIEKA:** czy startowa kara morale ma być klampowana tak, by nie schodziła poniżej
`fleeMorale` jednostki (wariant A: jednostka nigdy nie startuje złamana), czy zostaje bez klampu
zgodnie z literą GOAL 2 (wariant B: przy skrajnej przewadze 4 typy jednostek startują już poniżej
progu ucieczki). Dotyczy wyłącznie skrajnych stosunków mocy blisko sufitu 65%.

Nota (1) Operatora z rundy 1 (`export-c.py`) — wycofuję, Evaluator wykazał, że generator zachowuje
sekcję `morale_przewaga_mocy`; nota była bezprzedmiotowa.

## ZMIANY/COMMIT

Baza `487b0cfc`. Poprawki obrony wyłącznie w allowliście, 2 pliki:
`gra/src/battle/battleScene.ts` (reset flagi w `_resetBattleRuntimeState`),
`gra/tools/walka-morale-przewaga-mocy-test.cjs` (CZĘŚĆ F). `git diff --check` czysto,
brak `git add -A`/`git add .`. Węzeł W1 (`auto-battle-power.ts`, `auto-battle-params.json`) —
tylko czytany, 0 zmian.

## TESTY

- `walka-jeden-kontratak` 24/24, `walka-morale-przewaga-mocy` **76/76**, `tsc --noEmit` 0 błędów.
- Referencyjne (kryt. 7): logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6. Kryt. 8: battle-roster 7/7, battle-summary OK, battle-hp-display 7/7,
  teren-walki-etapy 33/33, army-hunger-combat 13/13. Żadna istniejąca bramka nie wymagała
  aktualizacji zaszytych wartości.
- Mutacja poprawki: 73/76, exit=1 (wyżej).

## BLOKADY

`map-field-battle-test.cjs` exit=1, `TypeError: import_meta.glob is not a function` — potwierdzone
przeze mnie ponownie: po `git stash` własnych źródeł błąd jest **identyczny** na czystej bazie.
Znana INFRA `P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1`, nie defekt tej pracy.

RUNDY: 1/5 (obrona nie zwiększa licznika)
NASTĘPNY KROK: Final Control (Sonnet 5, effort high) → `04-final-control.md`; przed integracją
wymagane rozstrzygnięcie właściciela w sprawie klampu do `fleeMorale`.
DEPLOY/PUSH: NIE WYKONANO
