# Klaster na krawędzi + AI faza 1 (Maciej 2026-07-07)

**Status:** WDROŻONE  
**Warstwa:** 🟡 cross (mapgen + AI + main.ts)

## Decyzja gameplay

1. **Jeden klaster per cywilizacja** — wszystkie miasta-państwa tego typu w jednym skupisku (~3 hex między miastami).
2. **Founding na krawędzi** — gracz i stolica każdego obcego typu startują na obwodzie klastra; w środku państwa + 1 zarezerwowany slot wzrostu.
3. **AI faza 1** — stolice klastrów (ekspansyjna AI) najpierw przejmują własne państwa w klastrze; osadnicy czekają do fazy 2.

## Implementacja

| Plik | Zmiana |
|------|--------|
| `gra/src/map/clusters.ts` | `buildClusterLayoutWithEdgeCapital`, `CLUSTER_GROWTH_RESERVE` |
| `gra/src/map/cluster-spawn.ts` | `pendingSameTypeRivalHexes`, `clusterCapitalOwnerIds` |
| `gra/src/game/cluster-start.ts` | Stolice poza `typCityCopyOwners` |
| `gra/src/game/ai.ts` | `clusterStateTargets`, faza 1 wojsko / blokada osadników |
| `gra/src/main.ts` | Pre-plan spawn państw, kontekst AI klastra |

## Co sprawdzić w grze (Nowa gra)

- Hex startowy gracza jest na skraju skupiska (po founding — państwa wokół, nie rozrzucone).
- Po założeniu miasta pojawiają się państwa tego samego typu w jednym klastrze (~3 hex).
- Obcy typ: stolica na krawędzi, państwa w środku; stolica buduje wojsko i naciera na sąsiednie państwa swego typu zanim ekspanduje dalej.
