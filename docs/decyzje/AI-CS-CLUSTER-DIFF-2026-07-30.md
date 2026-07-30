# AI-CS-CLUSTER-DIFF — państwa-miasta w kręgu AI × trudność gry

**Status:** WDROŻONE (commit 2026-07-30)  
**ID:** `AI-CS-CLUSTER-DIFF-2026-07-30`

## Decyzja (cytat sensu)

1. **Trudność państw-miast względem AI cywilizacji** wynika z **poziomu trudności gry** (odwrócona skala):
   - gra **Łatwy** → państwa-miasta **Trudne** (AI ma utrudnione podbijanie),
   - gra **Normalny** → państwa-miasta **Normalne**,
   - gra **Trudny** → państwa-miasta **Łatwe** (AI ma ułatwione podbijanie).
2. **Od tury 20:** każda pełna cywilizacja AI **musi** wypowiedzieć wojnę ≥1 państwu-miastu **ze swojego kręgu** (cluster / ten sam typ w klastrze startowym), jeśli takie jeszcze istnieje i nie jest już w wojnie z nim.
3. **Do tury 100:** AI **musi robić wszystko**, by przejąć **wszystkie państwa-miasta ze swojego kręgu cywilizacji**. Twarda reguła **priorytetu behawioralnego** — brak game over / crasha przy niepowodzeniu.

## Zakres „kręgu”

Państwa-miasta przypisane do klastra / typu danej cywilizacji AI (`typCityCopyOwners` + ten sam typ / cele `clusterStateTargets`) — **nie** cała mapa.

## Uwagi implementacyjne

- Istniejące: `_menuCityStateDifficulty`, `applyCityStateDifficultyTrust`, `cityStateOffensiveSupport`, `clusterStateTargets`, C-AI-WOJNA.
- Domyślne mapowanie `_menuCityStateDifficulty` = **odwrotność** `_menuDifficulty` (zamiast równości). Override w Zaawansowanych może zostać, jeśli ustawiony ręcznie.
- Brak kar kończących partię przy turze 100.
