# MAPA → MASTER · Skala kreatora: mp max 9 + typy (Maciej 2026-07-04)

**Status:** ZINTEGROWANE kanon md5 `31c6db16…` (MASTER 2026-07-04 ~16:28)

---

## Co przesyłam

### 1. Miasta-państwa (każdy klaster) — max **9**

| Mapa | Min | Domyślne | Max |
|------|-----|----------|-----|
| Malenki | 3 | 4 | 5 |
| Mały | 4 | 5 | 6 |
| Standardowy | 5 | 6 | 7 |
| Duży | 6 | 7 | 8 |
| Ogromny | 7 | 8 | **9** |
| Super Huge | 7 | 8 | **9** |

Stała: `MAX_MIAST_PANSTWA = 9` w `newGameMapDefaults.ts`.

### 2. Typy cywilizacji (gracz + obce) — osobna skala

| Mapa | Min | Domyślne | Max |
|------|-----|----------|-----|
| Malenki | 3 | 4 | 6 |
| Mały | 4 | 5 | 8 |
| Standardowy | 5 | 6 | 10 |
| Duży | 6 | 7 | 11 |
| Ogromny | 8 | **10** | 12 |
| Super Huge | 10 | **12** | 14 |

Stała: `MAX_TYPY_CYWILIZACJI_MENU = 14`.

### 3. Naprawiony błąd

- W `e-start-params.json` były błędne wartości **11 / 13 / 15** mp — usunięte.
- `defaultCivTypesFromMapLabel` brało domyślną liczbę z **miast-państw** zamiast z **`typy_cywilizacji`** — naprawione.

### 4. Bez zmian (z poprzedniego handoffu)

- Spawn: mp min **3 hex**, obce od stolicy min **5 hex**, w obcym klastrze mp min **3 hex** (decyzja B).
- `clusters.ts`, `cities.ts`, rzeki, złoża wybrzeża — nadal w `gra/`, czekają na batch MASTER.

---

## Pliki

| Plik | Zmiana |
|------|--------|
| `gra/data/e-start-params.json` | nowe domyślne mp/typy |
| `gra/src/map/newGameMapDefaults.ts` | tabele min/def/max, stałe, fix typów |
| `gra/tools/map-scale-menu-test.cjs` | regresja menu (nowy) |
| `gra/tools/rozmiar-label-test.cjs` | Duży mp=7 |

---

## Co MASTER ma zrobić

1. **Review** diff MAPA (bez nowego `main.ts` w tym batchu — chyba że łączysz ze spawn batch).
2. **Bramka:** `node tools/map-scale-menu-test.cjs` + `node tools/rozmiar-label-test.cjs` + `node tools/cluster-start-test.cjs`
3. **Build** → Opus → kanon (razem z resztą sesji MAPA jeśli możliwe).

---

## DoD

- [x] Menu 3 opcje (min · zalecane · max) zgodne z tabelą Macieja
- [x] `MAX_MIAST_PANSTWA = 9` — nigdy więcej w menu
- [x] Typy z `eStartTypyCywilizacji`, nie z mp
- [x] `map-scale-menu-test.cjs` — 26+ asercji ZIELONE
- [x] Kanon opublikowany przez MASTER (2026-07-04 ~16:28, md5 `31c6db16…`)
