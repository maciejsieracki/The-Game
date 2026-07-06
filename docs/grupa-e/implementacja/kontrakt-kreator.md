# Kontrakt kreator ↔ silnik (E1)

> Implementacja: `gra/src/ui/newGameFlow.ts` · `gra/src/map/newGameMapDefaults.ts` · `gra/src/main.ts`

---

## NewGameParams (UI → SILNIK)

| Pole | Przykład | Uwaga |
|------|----------|--------|
| `civId` | `rzymianie` | **ikonaId**, nie nazwa PL |
| `epochId` | `kamien` \| `braz` | |
| `difficulty` | `Normalny` | |
| `mapSize` | `Standardowy` | → `rozmiarFromMenuLabel` |
| `rivals` | `6` | string; skala z mapy |
| `speed` | `Standardowa` | |
| `worldType` | `Kontynenty` | etykieta PL |
| `typSwiata` | `kontynenty` | engine key |
| `seed` | `482910` | używany w `generujSwiat` |

---

## Skala rywali (MAPA heurystyka)

| Mapa menu | Hex | Default AI |
|-----------|-----|------------|
| Malenki | 38×26 | 2 |
| Mały | 54×37 | 4 |
| Standardowy | 84×60 | **6** |
| Duży / Ogromny | 120×84+ | 8 |

Źródło: `newGameMapDefaults.ts` · **E1-Q12** może zmienić zakres UI.

---

## Typ świata

| Menu | Engine |
|------|--------|
| Kontynenty | `kontynenty` |
| Pangea | `pangea` |
| Wyspy | `wyspy` |
| Ziemia | `ziemia` |

---

## ui-params.json (`nowa_gra`)

Kolejność ustawień: trudność → mapa → **world_type** → rywale → prędkość.

`rival_count.opts` — placeholder; runtime nadpisuje `syncRivalOptions()`.
