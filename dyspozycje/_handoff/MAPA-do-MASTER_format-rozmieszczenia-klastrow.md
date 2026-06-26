# MAPA → MASTER: Format rozmieszczenia klastrów (ClusterPlacement)

**Własność:** Civ-MAPA rozmieszcza (`computeClusters`), SILNIK osadza w pętli tury, AI ekspanduje.  
**Plik źródłowy:** `src/map/clusters.ts`

---

## 1. Definicja formatu (typy TypeScript)

```ts
export interface ClusterCity {
  q: number;         // współrzędna aksjalna q
  r: number;         // współrzędna aksjalna r
  isCapital: boolean; // true = stolica klastra (1 na klaster)
}

export interface TypeCluster {
  typIndex: number;              // 0..N-1 (0 = klaster gracza)
  typ: string;                   // klucz z civs.json (np. 'grecy', 'zulusi')
  centrum: { q: number; r: number }; // środek regionu Voronoi (seed klastra)
  miasta: ClusterCity[];         // do 10 miast (1 stolica + do 9 rywali AI)
}

export interface ClusterPlacement {
  rozmiarMapy: 'mala' | 'srednia' | 'duza' | 'ogromna';
  aktywneTypy: number;       // 3 / 5 / 7 / 9 (zależy od rozmiaru mapy)
  minDystans: number;        // min odległość między miastami w klastrze (domyślnie 9)
  playerTypIndex: number;    // indeks klastra gracza (zawsze 0)
  klastry: TypeCluster[];    // lista klastrów (length = aktywneTypy)
}
```

---

## 2. Sygnatura `computeClusters`

```ts
export function computeClusters(
  map: GameMap,
  opts?: {
    seed?: number;              // ziarno deterministyczne (domyślnie 42)
    aktywneTypy?: number;       // nadpisuje heurystykę (3/5/7/9)
    playerTyp?: string;         // klucz typu gracza z civs.json (domyślnie 'grecy')
    minDystans?: number;        // min odl. między miastami w klastrze (domyślnie 9)
    rywaleNaKlaster?: number;   // liczba miast AI w klastrze (domyślnie 9; razem ze stolicą = 10)
    minDystansKlastrow?: number; // min odl. między środkami klastrów (domyślnie 15)
  },
): ClusterPlacement
```

Funkcja jest **czysta** (bez THREE/DOM/efektów ubocznych). Wynik jest deterministyczny dla danego `seed`.

---

## 3. Znaczenie kluczowych pól

| Pole | Znaczenie |
|------|-----------|
| `centrum` | Środek regionu Voronoi danego typu — punkt startowy ekspansji AI; AI powinno traktować to pole jako „serce" swojego terytorium |
| `isCapital: true` | Stolica klastra = miasto gracza lub główne AI; zamiast być generowane losowo, jest to miasto najbliższe środka regionu; stolica startuje pierwsza i ma specjalny status |
| `playerTypIndex: 0` | Klaster gracza zawsze ma indeks 0; `klastry[0]` to miasteczka gracza i jego 9 rywali AI tego samego typu |
| `minDystans: 9` | Gwarantowana odległość między miastami; zapobiega skupianiu; param, łatwo zmienić do 5 dla małych map |
| `rozmiarMapy` | Enum skali — informacja dla AI/UI o tym, jak gęsto jest zaludniona mapa |

---

## 4. Skala aktywnych typów wg rozmiaru mapy

| Rozmiar mapy | area (W×H) | Aktywne typy |
|---|---|---|
| `mala` | < 1 200 | 3 |
| `srednia` | < 3 000 | 5 |
| `duza` | < 6 300 | 7 |
| `ogromna` | ≥ 6 300 | 9 |

Algorytm wyznacza rozmiar automatycznie z wymiarów `GameMap`. Można nadpisać przez `opts.aktywneTypy`.

---

## 5. Roster 9 typów — kolejność i klucze z civs.json

| Kolejność | Klucz `typ` | Nazwa |
|---|---|---|
| 0 | `grecy` | Grecy |
| 1 | `rzymianie` | Rzymianie |
| 2 | `chinczycy` | Chińczycy |
| 3 | `inkowie` | Inkowie |
| 4 | `zulusi` | Zulusi |
| 5 | `egipt` | Egipt |
| 6 | `sumerowie` | Sumerowie |
| 7 | `celtowie` | Celtowie |
| 8 | `germanie` | Germanie |

Klucze mapują się na pole `ikonaId` w `civs.json`. Nazwy klastrów miast: pole `nazwyKlastra` w civs.json (10 nazw na typ).

---

## 6. Parametry algorytmu

- **`minDystans = 9`** heksów — minimalna odległość między miastami WEWNĄTRZ klastra (Poisson-disk)
- **`minDystansKlastrow = 15`** heksów — minimalna odległość między ŚRODKAMI różnych klastrów (greedy)
- **`rywaleNaKlaster = 9`** — do 9 miast AI + 1 stolica = do 10 miast na klaster; mniejsze regiony mogą mieć mniej

---

## 7. Jak AI konsumuje ClusterPlacement

1. **Na inicjalizacji gry** SILNIK wywołuje `computeClusters(map, {seed, playerTyp})` i utrwala `ClusterPlacement` w `playerState` / `gameState`.

2. **Per klaster AI** (`klastry[i]` gdzie `i > 0`):
   - **Cel ekspansji:** dominacja regionu Voronoi swojego typu (środek = `centrum`)
   - **Stolica** (`isCapital: true`) startuje z populacją wyższą / bonusami startowymi
   - **Rywale AI** (`isCapital: false`) to miasta tego samego typu; AI tego klastra może zakładać kolejne miasta w swoim regionie, dążąc do zajęcia wszystkich pól do granicy z sąsiednim typem
   - **Dyplomacja intra-typ:** AI miast tego samego klastra domyślnie ma wewnętrzną koalicję (wspólny typ) — do dopracowania przez Civ-CYWILIZACJE/DYPLOMACJA
   - **Ekspansja między-typowa:** gdy AI osiągnie dominację w swoim regionie, rozważa ekspansję poza granicę Voronoi (agresja wobec sąsiednich typów)

3. **Granice Voronoi** (per hex): każdy heks mapy należy do regionu, którego centrum jest do niego najbliższe (odległość aksjalna/cube). AI rozpoznaje "swój" teren przez porównanie `hexDistanceAxial(hex, centrum_własny) < hexDistanceAxial(hex, centrum_obcy)`.

---

## 8. Właściciel / przepływ

```
computeClusters()   ← Civ-MAPA (właściciel formatu)
        ↓
ClusterPlacement    ← dane w playerState / gameState
        ↓
SILNIK (pętla tury): osadza miasta na mapie, przypisuje wlasciciel
        ↓
AI (Civ-AI): per klaster, ekspansja w regionie swojego typu
        ↓
DYPLOMACJA: relacje między klastrami różnych typów
```

---

## 9. Ograniczenia i uwagi

- **Małe mapy (< 1200 hex):** regiony mają ~300-400 pól; przy `minDystans=9` wychodzi 4-6 miast/klaster zamiast 10 — OK, konsola wypisuje warning
- **Zmiana `minDystans`:** łatwo cofnąć do 5 przez `opts.minDystans=5` (więcej miast/klaster)
- **Stolica = najbliższe centrum:** deterministyczne; AI/SILNIK mogą traktować ją jako "startową" i umieszczać tam pierwszego osadnika
- **Klucze civs.json:** `ikonaId` (np. `'grecy'`) = `typ` w ClusterPlacement; nie hardkodowane w clusters.ts poza ROSTER_KLUCZE (tablica łatwa do aktualizacji)

