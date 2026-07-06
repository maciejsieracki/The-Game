# D-START + nazewnictwo klastra (Maciej ABC)

**Status:** **ZAMKNIĘTE** (2026-06-27)  
**Lane:** CYWILIZACJE (dane) · MAPA (klaster) · SILNIK (wpięcie) · UI (dyplomacja warstwowa)  
**Źródło danych:** `gra/data/civs.json` → pole `nazwyKlastra` (10 nazw / typ)

---

## Decyzje Macieja

| ID | Pytanie | Decyzja | Data |
|----|---------|---------|------|
| **D-START-1B** | Ile rywali tego samego typu w klastrze gracza? | **B** — skala z rozmiaru mapy (`rywaleNaKlaster` w menu), nie pełne 9 | 2026-06-27 |
| **D-START-2B** | Dyplomacja w klastrze (ten sam typ)? | **B** — uproszczona: **pokój, wojna, handel** (bez sojuszy, tech, wasalizacji) | 2026-06-27 |
| **D-START-3A** | Dyplomacja z obcymi typami po kontakcie? | **A** — **pełna** dyplomacja | 2026-06-27 |
| **N-1A** | Domyślna nazwa pierwszego miasta gracza | **A** — zawsze `nazwyKlastra[0]` (stała, bez edycji przed startem) | 2026-06-27 |
| **N-2A** | Etykieta rywala tego samego typu | **A** — **tylko miasto** (np. „Sparta”, bez prefiksu typu) | 2026-06-27 |
| **N-3A** | Kolejność nazw rywali w klastrze | **A** — stała: `[1..N]` jak w JSON (bez losowania puli) | 2026-06-27 |
| **N-4C** | Miasta poza klastrem / kolejne miasta gracza | **C** — **gracz zawsze nazywa ręcznie** | 2026-06-27 |
| **N-5B** | Źródło prawdy list `nazwyKlastra` | **B** — **ręczna edycja `civs.json`** (uwaga: `export-data.py` może nadpisać) | 2026-06-27 |

---

## Reguły implementacyjne (kanon)

### Klaster startowy

1. Gracz + N rywali **tego samego typu** w jednym klastrze (~10 hexów); N z `newGameMapDefaults.ts` (mała 2 … ogromna 8).
2. Indeks nazw: gracz = `[0]`, i-ty rywal = `[i]` (i = 1…N), kolejność **deterministyczna**.
3. Obcy typy na mapie (poza klastrem) — osobne spawn-y; po kontakcie **pełna** dyplomacja (D-START-3A).

### Nazwy

| Przypadek | Nazwa |
|-----------|--------|
| Pierwsze miasto gracza (start) | `nazwyKlastra[0]` |
| Pierwsze miasto rywala klastra i | `nazwyKlastra[i]` |
| Etykieta UI rywala klastra | sama nazwa miasta (N-2A) |
| Kolonia / kolejne miasto gracza | **prompt ręczny** (N-4C) |
| Miasta AI poza klastrem | poza zakresem tej paczki — osobna decyzja |

### Dyplomacja warstwowa

| Warstwa | Zakres | Dozwolone |
|---------|--------|-----------|
| **Uproszczona** | owner w klastrze, ten sam `typ` co gracz | pokój, wojna, handel |
| **Pełna** | owner obcego typu (po kontakcie) | istniejący model `diplomacy.ts` |

Istniejący modyfikator `rywalizacjaTenSamTyp_zaufanie: -20` zostaje; UI ukrywa akcje spoza uproszczonego zestawu dla warstwy klastrowej.

### Dane (N-5B)

- Edycja **tylko** `gra/data/civs.json` (pole `nazwyKlastra` per typ).
- **Nie** uruchamiać pełnego `export-data.py` na `civs.json` bez whitelisty kolumn.
- Wycofać mix `cityName()` / `CITY_NAMES` na rzecz `nazwyKlastra` dla startu klastra.

---

## Zależności implementacji

| Krok | Lane | Pliki / deliverable |
|------|------|---------------------|
| 1 | CYWILIZACJE | utrwalić `nazwyKlastra`, typ w loaderze |
| 2 | MAPA | `computeClusters()` → API `{ ownerId, nazwaMiasta, typ, isSameTypeRival }` |
| 3 | SILNIK | wpięcie przy `doStartGame`; przypisanie nazw; warstwa dyplomacji |
| 4 | UI | panel dyplomacji: tryb prosty vs pełny |

Handoffy: `dyspozycje/_handoff/MAPA-do-MASTER_nazwy-klastrow.md`, `CYWILIZACJE-do-MASTER_nazwy-klastrow-pole.md`

---

## Uwagi / konflikty

- **N-1A** vs wcześniejsze D8 (nazwy miast z możliwością zmiany): **N-1A dotyczy wyłącznie pierwszego miasta startowego** — kolejne miasta = N-4C (ręcznie).
- **E1-D-Q1=A** (losowy roster typów na mapie) — nadal obowiązuje dla **obcych typów**; klaster gracza = jeden wybrany typ.

**D-START-miasta-kopie-typu** (2026-06-27): wszystkie miasta AI = **kopie typu** (ta sama gospodarka/bonusy), AI **defensywne**, obce typy **symetrycznie** (chińskie nazwy, chiński typ). Szczegóły: `docs/decyzje/D-START-miasta-kopie-typu.md` · Grupa D: `docs/grupa-d/MODELE-MIAST-TYPU.md`.
