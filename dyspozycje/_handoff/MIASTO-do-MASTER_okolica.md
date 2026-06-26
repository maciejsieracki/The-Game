# PACZKA: MIASTO -> MASTER : modul okolica.ts (auto-przydzial obrabianych pol) -- GOTOWE
Data: 2026-06-24. Dyspozycja [DOMKNIECIE v0.1] pkt 2 (WYSOKI prio). Implementacja przez subagenta Sonnet.

NOWY MODUL: gra/src/game/okolica.ts (czysty, bez DOM/THREE). Automat styl Civ VII:
miasto o populacji N obrabia N NAJLEPSZYCH pol w promieniu okolicy (OKOLICA_RADIUS = miasto-params
`zasieg_okolicy_miasta`, domyslnie 5), rankowanych po wyniku plonow.
API:
- `OKOLICA_RADIUS` (z miasto-params).
- `okolicaTiles(centerQ, centerR, radius, map, isWorkable?)` -> pola w promieniu (bez centrum).
- `tileScore(yield, wagi?)` -> wazona suma plonow (domyslnie 1/1/1).
- `assignWorkedTiles(centerQ, centerR, population, map, yieldOf, opts?)` -> N najlepszych pol (deterministyczny tie-break).
  PLONY pola sa WSTRZYKIWANE: `yieldOf(q,r) -> { zywnosc?, praca?, handel? }` (dostarcza EKONOMIA/MAPA).

TEST: gra/tools/okolica-test.cjs -> "OKOLICA OK (10/10)".

WPIECIE (master, w petli tury per miasto):
  const worked = assignWorkedTiles(c.q, c.r, c.population, map, (q,r) => yieldPolaZ_EKONOMIA_MAPA(q,r));
To ZASTEPUJE/uzupelnia dotychczasowe workedTilesForCity (uzgodnic styk z EKONOMIA: kto dostarcza yieldOf).
DODANE PARAMETRY (miasto-params.json): `zasieg_okolicy_miasta` = 5; `praca_udzial_budynki` = 0.7 (dla splitPraca).

DoD: test 10/10; modul czysty, deterministyczny. Cross-lane: yieldOf = EKONOMIA/MAPA (przez mastera).
