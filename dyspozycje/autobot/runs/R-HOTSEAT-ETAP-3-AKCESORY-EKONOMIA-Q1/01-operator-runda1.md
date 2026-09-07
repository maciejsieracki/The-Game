STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1
GOAL: Migracja ośmiu funkcji-akcesorów ekonomicznych na `isHuman()`/scaffold
`playerStateByHuman`-style, behawioralny no-op przy jednym fotelu; rozstrzygnięcie
`isPlayerOwner` w difficulty-cost.ts.

ZMIANY/COMMIT (niezcommitowane, worktree `/home/user/wt-hotseat-etap3`, gałąź
`autobot/R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1`, baza `8bb30795`):
- `gra/src/main.ts`:
  1. `isHuman(ownerId)` — nowy alias, cienki wrapper na `isHumanOwner(humanSeats, ownerId)`
     (import `isHumanOwner` dodany do istniejącego importu z `human-owners.ts`).
  2. Scaffold: `playerStateByHuman: Map<number, PlayerState>` (jeden wpis
     `HUMAN_OWNER_PRIMARY -> player`, TEN SAM obiekt, zero kopii) + `pracaPoolByHuman:
     Map<number, {praca:number}>` z komórką getter/setter zamykającą się nad
     `playerPracaPool` (jedyny sposób "zaaliasować" primitywny `let` bez kopii w JS —
     `playerPracaPool` to luźna zmienna liczbowa, nie pole obiektu, więc nie dało się
     jej umieścić w tej samej mapie co `player`).
  3. Osiem funkcji przepisanych: `empireEpochForOwner`, `initOwnerEra`, `ownerTreasury`/
     `setOwnerTreasury`, `ownerPracaPool`/`setOwnerPracaPool` (zapis `_lastPraca`
     zachowany jako osobna linia, nie przeniesiony do scaffoldu — zgodnie z GOAL),
     `ownerNaukaPool`/`setOwnerNaukaPool`, `ownerResearchedTechs`/
     `addOwnerResearchedTechs`. Warunek `ownerId === 0` -> `isHuman(ownerId)`, odczyt/
     zapis `player.X`/`playerPracaPool` -> przez scaffold.
- `gra/src/game/difficulty-cost.ts`: NIETKNIĘTY. Decyzja: `isPlayerOwner(ownerId):
  boolean { return ownerId === 0; }` zostaje BEZ ZMIAN. Uzasadnienie (grep
  potwierdzony: `grep -rn isPlayerOwner src/` poza samym plikiem = 0 wyników) —
  funkcja jest wołana WYŁĄCZNIE wewnątrz `difficulty-cost.ts` (4 miejsca:
  `getCostMultiplierForOwner` ×2, `getPopulationGrowthDifficultyMultiplier` ×2), nigdy
  importowana gdzie indziej. To czysty moduł bez dostępu do `humanSeats` (zgodnie z
  GENEZĄ). Zmiana znaczenia na "którykolwiek fotel człowieka" byłaby decyzją
  produktową (czy drugi fotel człowieka w hot-seat ma dostawać mnożnik trudności
  gracza, czy AI) nierozstrzygalną milcząco w tym temacie — dokładnie scenariusz
  opisany w dispatchu jako niewymagający zmiany. Dziś (jeden fotel, zawsze
  `ownerId===0`) zachowanie identyczne z `isHuman()`, więc brak zmiany = zero-op.
- Nowa bramka: `gra/tools/hotseat-etap3-akcesory-test.cjs`.

TESTY:
- `npx tsc --noEmit`: czysto (0 błędów).
- Dowód no-op (bramka własna, wzorzec jak `hotseat-etap1-ownerid-test.cjs`: PRZED
  odtworzone dosłownie z main.ts sprzed rundy vs PO z main.ts po rundzie, ten sam
  stan startowy, ownerId ∈ {0,1,2,42}, odczyt+zapis): `hotseat-etap3-akcesory-test:
  52 PASS, 0 FAIL`.
- Bramki wymagane w GOAL: `difficulty-cost-test` 22/22, `wealth-test` 36/36,
  `ai-major-economy-test` 33/33, `ai-praca-podzial-tura1-seed-test` 9/9,
  `ai-praca-split-parity-test` 21 passed / 1 failed — **FAIL PRZEDISTNIEJĄCY**,
  potwierdzony identyczny (git stash/stash pop, ten sam test #5 "gracz i AI czytają
  udział ulepszeń jako dopełnienie jedynego podziału" fail zarówno przed jak i po
  moich zmianach) — nie regresja tego tematu.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19,
  `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie
  zielone.

BLOKADY: brak. Preistniejący fail w `ai-praca-split-parity-test` #5 poza zakresem
tego tematu (potwierdzony niezależny od zmian tej rundy).

RUNDY: 1/5

NASTĘPNY KROK: Evaluator.

DEPLOY/PUSH: NIE WYKONANO
