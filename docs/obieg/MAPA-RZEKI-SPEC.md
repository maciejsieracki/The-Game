# MAPA — specyfikacja generowania i renderu rzek

**Hasło:** `reguły rzeki` · powiązane: `docs/obieg/MAPA-KANON-GENERATOR.md` (generator ogółem)

**Decydent gameplay:** Maciej (ABC) · **Implementacja:** lane MAPA · **Integracja kanonu:** MASTER

**Status:** wdrożone 2026-07-04 · kanon md5 `fe53661e98e25280a9726d4936ce8041` (batch delta)

---

## 1. Cel (fair play)

Rzeki dają bonusy (żywność, produkcja). Muszą być **równomiernie** na mapie — żadna cywilizacja nie może startować w „klastrze rzek”, podczas gdy inny kontynent jest pusty.

---

## 2. Równomierna siatka (co X hexów)

Mapa lądu dzielona jest na **kwadraty N×N heksów** (oś q×r). W każdej komórce z wystarczającą ilością lądu i drogą do morza:

- musi być **co najmniej jeden główny nurt** rzeki (źródło → morze),
- komórka uznana za pokrytą, gdy **główny nurt przechodzi przez jej heksy** (nie tylko start w rogu).

### Rozmiar siatki (ABC — decyzja Macieja)

| Opcja | N (hex) | Tier kreatora „Rzeki” | Efekt |
|-------|---------|------------------------|--------|
| **A** | 12 | Dużo | gęściej |
| **B** | **15** | **Normalnie (wdrożone, Maciej 20:34)** | woda + miedź |
| **C** | 18 | Mało | rzadziej |

**Nadrzędna siatka fair play:** [`MAPA-FAIR-PLAY-SIATKA.md`](MAPA-FAIR-PLAY-SIATKA.md) — woda **15×15**, min. **1 źródło** / komórkę.

### Anty‑klaster

- **Min. odstęp między źródłami głównych nurtów:** ~`0,8 × N` hex (dla N=14 → ok. 11 hex).
- **Zakaz** dodatkowego „dosypywania” rzek tylko przy górach/wzgórzach (dawało stada).
- **Dopływy nie liczą się** do pokrycia siatki — nie psują równomierności źródeł.

---

## 3. Geometria — tylko krawędzie heksów (Roblox)

| ✅ Dozwolone | ❌ Zakaz |
|-------------|----------|
| Rzeka biegnie **wzdłuż granicy** między dwoma heksami | Rzeka „na środku pola” / przez interior heksa |
| Zapis w `hex.rzeka.krawedzie[]` (indeks krawędzi 0–5) | Oznaczanie całego heksa jako „tile rzeki” wizualnie |
| Render: odcinki obwodu hex + środki wspólnych krawędzi | Proste linie łączące niesąsiednie punkty mapy |
| Kwadratowy, łamany styl (ostre segmenty) | Serpentyny, pętelki, „klucz wiolinowy” |

**Trasa `riverPaths`** to lista heksów po **A\*** (logika gry, ścieżka). **Wizual i gameplay krawędzi** wynikają z par sąsiednich heksów na trasie → wspólna krawędź.

---

## 4. Bieg rzeki — kierunek i meander

1. **Cel hydrologiczny:** najbliższe **morze / wybrzeże** (pole `seaDist`, A*).
2. **Bufor od morza (Maciej 2026-07-04):** ciało rzeki **min. 2 hex** od morza/wybrzeża (`RIVER_MIN_INLAND_FROM_SEA`). Tylko **ujście** (ostatnie ≤2 hex) może zejść do wybrzeża i wpłynąć w morze — **zakaz** biegu wzdłuż plaży.
3. **Relief:** góry/wzgórza **nieprzechodne** w biegu (wyjątek: hex startu źródła).
4. **Meander = łagodne S**, nie serpentyna:
   - A* ma **karę za długie proste** → lekki zygzag w stronę morza;
   - sztuczne S: max **3** na nurt, tylko po **≥4 hexach** prosto;
   - każdy krok meandra: `seaDist` **nie rośnie** (tylko w dół lub bok przy zbliżaniu do celu);
   - **bez pętli** — ten sam hex nie może wystąpić dwa razy (`sanitizeRiverPath`).
5. **Bez skoków:** każdy krok trasy = sąsiedni hex (`assertRiverPathAdjacent`).

---

## 5. Główny nurt + dopływy (delta / dendryt)

Wzór wizualny: rzeka główna gruba, dopływy cieńsze, wpływ pod kątem (jak delta na diagramie Macieja).

| Typ | `riverPathKinds` | Szerokość renderu | Generacja |
|-----|------------------|-------------------|-----------|
| **Główny nurt** | `main` | 100% (bazowa półszerokość wstęgi) | 1 na komórkę siatki N×N |
| **Dopływ** | `tributary` | **50%** (2× cieńszy) | max ~2 na długi main (≥12 hex), łączy się z main w połowie trasy |

- Dopływy generowane **po** siatce głównych nurtów.
- Ujście / delta wizualna (fan na wybrzeżu): tylko **main** (`renderCoastalRiverExtension`).

---

## 6. Implementacja (lane MAPA)

| Warstwa | Pliki |
|---------|--------|
| Generator | `gra/src/map/gen-helpers.ts` — `generateRivers`, `traceRiver`, `ensureMassRiverGridCoverage`, `addTributariesForMainRiver` |
| Mapa | `gra/src/map/generator.ts` — `riverPaths`, `riverPathKinds` |
| Typ | `gra/src/types/map.ts` — `riverPathKinds?: ('main' \| 'tributary')[]` |
| Render | `gra/src/render/scene.ts` — `buildRiverPointsFromHexPath`, `renderLandRiversFromPaths` |
| Parametry tier | `riverCoverageCellSize()`, `gra/data/map-gen-params.json` (Panel-A) |

### API wyniku generatora

```typescript
generateRivers(...): { paths: RiverCoord[][]; kinds: ('main' | 'tributary')[] }
// GameMap: riverPaths + riverPathKinds (równoległe tablice, ten sam indeks)
```

---

## 7. Testy regresji

```powershell
cd gra
node tools/river-path-adjacency-test.cjs   # sąsiedztwo kroków
node tools/river-grid-coverage-test.cjs    # siatka ≥85% na dużych masach lądu
```

---

## 8. Playtest (Maciej)

1. **Ctrl+F5**
2. **Nowa gra** (typ **Ziemia** lub Kontynenty)
3. Sprawdź: równomierność na kontynentach · krawędzie hex · grube nurty + cienkie dopływy · brak pęteli

Stara mapa w sesji = stary generator — zawsze **nowa gra** po batchu MAPA.

---

## 9. Historia decyzji

| Data | Temat |
|------|--------|
| 2026-07-04 | Maciej: równomierna siatka, krawędzie only, S nie serpentyna, anty‑stada, main/tributary |
| 2026-07-04 | Wdrożenie siatki 14×14, render obwodu, kinds, usunięcie relief-cluster fill |
| ABC otwarte | Rozmiar siatki A=10 · **B=14** · C=18 |

---

*Append-only po zmianach gameplay — aktualizuje lane MAPA lub MASTER po decyzji ABC.*
