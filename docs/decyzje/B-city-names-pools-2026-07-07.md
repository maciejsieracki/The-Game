# B-city-names-pools — pule nazw miast (2026-07-07)

**Status:** WDROŻONE (bez ABC — implementacja autonomiczna)  
**Warstwa:** 🟡 cross (dane + civ-names + cluster-spawn + main.ts founding)

## Cel

~100 historycznych nazw miast per cywilizacja + 10 wyjątkowych nazw miast-państw (klastr startowy). Auto-nazewnictwo gracza i AI bez ręcznego promptu; save/load bez zmian formatu (nazwy w `City.name`).

## Cywilizacje (15)

| ikonaId | nazwa_pl | miasta_cywilizacji | miasta_panstwa |
|---------|----------|-------------------|----------------|
| grecy | Grecy | 100 | 10 |
| rzymianie | Rzymianie | 100 | 10 |
| chinczycy | Chińczycy | 100 | 10 (królestwa: Qin, Qi, Chu…) |
| inkowie | Inkowie | 100 | 10 |
| zulusi | Zulusi | 100 | 10 |
| egipt | Egipcjanie | 100 | 10 |
| sumer | Sumerowie | 100 | 10 |
| celtowie | Celtowie | 100 | 10 |
| germanie | Germanie | 100 | 10 |
| harappa | Harappanie | 100 | 10 |
| hetyci | Hetyci | 100 | 10 |
| slowianie | Słowianie | 100 | 10 |
| babilonia | Babilończycy | 100 | 10 |
| asyria | Asyryjczycy | 100 | 10 |
| fenicjanie | Fenicjanie | 100 | 10 |

## Pliki

| Plik | Rola |
|------|------|
| `gra/data/city-names-pools.json` | **Źródło prawdy** pul (runtime) |
| `gra/data/civs.json` → `nazwyKlastra[10]` | Mirror `miasta_panstwa` (sync wymagany) |
| `gra/src/game/city-names-pool.ts` | Logika losowania / suffix / walidacja |
| `gra/src/game/civ-names.ts` | API klastra + founding (fallback civs.json) |
| `gra/src/data/loader.ts` | `GameData.cityNamesPools` |
| `gra/tools/generate-city-names-xlsx.py` | JSON → Excel do przeglądu Macieja |
| `gra/tools/import-city-names-from-xlsx.py` | Excel → JSON + auto-sync civs.json |
| `gra/tools/export-city-names.py` | city-names-pools.json → civs.json (wywoływany przez import) |
| `gra/tools/city-names-pool-test.cjs` | Testy regresji |

## Ścieżka Excel (Maciej)

**W czacie:** edytuj `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` → napisz **„eksportuj nazwy miast"** — agent uruchamia import (zero terminala).

```
city-names-pools.json
    ↓ generate-city-names-xlsx.py (pierwsze wygenerowanie / odświeżenie podglądu)
panele-sterowania/Nazwy-miast-cywilizacji.xlsx
    ↓ Maciej edytuje (arkusze: Miasto, Panstwo — lub Nazwy)
    ↓ import-city-names-from-xlsx.py (walidacja 100/10, unikalność, brak pustych)
city-names-pools.json + civs.json (nazwyMiast[100] + nazwyKlastra[10])
```

Arkusze Excel:
- **Miasto** (alias Macierz_100): kolumny **Miasto_01…100** → `miasta_cywilizacji`
- **Panstwo** (alias Macierz_10): kolumny **Panstwo_01…10** → `miasta_panstwa` (= `nazwyKlastra`)
- **Nazwy** — długi format (fallback gdy brak macierzy)

Walidacja importu: 15 cywilizacji, dokładnie 100+10 nazw, bez pustych komórek, unikalne w obrębie cywilizacji.

## Runtime — jak działa auto-nazewnictwo

1. **Stolica gracza (founding #1):** `miasta_panstwa[0]` (np. Ateny, Rzym).
2. **Miasta-państwa w klastrze (AI ten sam typ):** `miasta_panstwa[1..N]` (Sparta, Kapua…).
3. **Stolice obcych klastrów:** `miasta_panstwa[0]` danego typu.
4. **Kolejne miasta gracza (founding #2+):** pierwsza wolna z `miasta_cywilizacji` (bez kolizji z miastami tego typu na mapie).
5. **AI osadnik (foundCity):** ta sama pula `miasta_cywilizacji`, per `aiOwnerCivMap[ownerId]`.
6. **Wyczerpanie puli (110+ miast jednego typu):** suffix `Nazwa II`, `Nazwa III`…

Save/load: nazwy zapisane w `City.name` — brak osobnego stanu puli.

## Testy

```bash
cd gra
node tools/city-names-pool-test.cjs
node tools/civ-names-test.cjs
npx tsc --noEmit
```

## Uwagi audytu państw-miast

AI miast-państw = profil `defensiveCopy` (brak osadników). Nazwy z puli państw; founding AI tylko z puli regularnej.
