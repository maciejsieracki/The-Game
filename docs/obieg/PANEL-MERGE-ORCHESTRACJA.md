# PANEL-MERGE — orkiestracja scalenia starych paneli

> **Decyzja Macieja (2026-06-30):** Jeden Excel na grupę (A–E). Wszystkie dotychczasowe panele Excel **wchłonić** do `Panel-A…E.xlsx`. Stare pliki **zarchiwizować dopiero po weryfikacji 100%** — zero utraty parametrów.
> **Tracker statusu:** `docs/obieg/PANEL-MERGE-TRACKER.md`  
> **Dyspozycje per grupa:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md`

---

## Cel i Definition of Done (całość)

| # | Kryterium | Weryfikuje |
|---|-----------|------------|
| 1 | Każdy parametr ze starego Excela ma odpowiednik w `Panel-X.xlsx` (wiersz + kolumna Wartość) | Grupa X |
| 2 | `export-x.py` **sam** produkuje wszystkie dotyczące JSON-y — **bez** `--full`, **bez** starych skryptów | Grupa X + Master |
| 3 | Round-trip: zmiana w Excel → eksport → JSON → (opcjonalnie) `gen-panel-x.py` → te same wartości | Grupa X |
| 4 | `_INFO` w Panel-X: tylko „napisz **eksportuj panel**" — zero ścieżek do starych plików | Grupa X |
| 5 | Meldunek `GOTOWE-DO-ARCHIWUM` per stary plik w trackerze | Grupa X |
| 6 | Master: brak wywołań legacy w `export-*.py` po merge | Master (F) |
| 7 | Fizyczna archiwizacja → `docs/archiwum/panele-legacy/` + README z mapą migracji | Master po 6× ✅ |

**Workflow Macieja po merge:** wyłącznie `Panel-A…E.xlsx` + komenda **eksportuj panel** w czacie grupy.

---

## Mapa własności — stary plik → grupa → docelowy arkusz

### Grupa A — Mapa (`Panel-A.xlsx`)

| Stary plik | Lokalizacja | Docelowy arkusz Panel-A | Stary eksport | Priorytet |
|------------|-------------|-------------------------|---------------|-----------|
| `Ulepszenia-terenu.xlsx` | `MIASTO/` | `Ulepszenia-FOOD` + `Ulepszenia-inne` | `gra/tools/export-ulepszenia.py` | P1 |
| `Plony-terenow.xlsx` | root | `Plony-terenow` | `export-data.py` / `export-a.py` | P1 |
| Duplikat FOOD w Panel-B | `Panel-B` → `Zywnosc-kanon` | **Usunąć z B** po weryfikacji A | `export-b.py` (gałąź terrain) | P0 — blok archiwum B |

**Uwaga A↔E:** `Generator-E2` w Panel-A = parametry **generatora mapy** (gęstość świata). Panel-E ma własny `Generator-E2` = **domyślne suwaki kreatora** — to **nie duplikat**, ale wymaga jednej linii w `_INFO` obu paneli („kto jest masterem czego").

---

### Grupa B — Ekonomia / Miasto (`Panel-B.xlsx`)

| Stary plik | Lokalizacja | Docelowy arkusz Panel-B | Stary eksport | Priorytet |
|------------|-------------|-------------------------|---------------|-----------|
| `Ekonomia-parametry.xlsx` | root | `Ekonomia`, `Wealth`, `Globalne`, `Budynki-eco`, `Teren-bonus` | `export-data.py` | P1 — porównaj arkusz po arkuszu |
| `Spoleczenstwo-parametry.xlsx` | root / `MIASTO/` | `Zdrowie`, `Szczescie`, `Kultura`, `Religia`, `Porzadek` | `export-data.py` | P1 |
| `Budynki.xlsx` | `MIASTO/` | **NOWY** `Budynki` (pełna lista: koszt, przyrost, epoki) | `export-budynki.py` / `export-panel.py` | P1 — **brak w Panel-B dziś** |
| `Panel-przeglad-danych.xlsx` | `MIASTO/` | sekcje Budynki + Społeczeństwo → jak wyżej | `gra/tools/export-panel.py` | P2 — diff vs Panel-B |
| `Surowce.xlsx` | root | **NOWY** `Surowce` | `export-data.py` → `resources.json` | P2 |
| `Technologie-drzewko.xlsx` | root | **NOWY** `Technologie` | `gra/tools/export-tech.py` → `tech.json` | P1 — routing: `docs/decyzje/ROUTING-tech-nauka-Grupa-B.md` |
| `Zywnosc-kanon` (arkusz w Panel-B) | `Panel-B.xlsx` | **USUNĄĆ** — master = Panel-A | `export-b.py` | P0 — przed archiwum |

**Nie w Panel-B (zostaje u innych):** jednostki → C · cywilizacje/bonusy → D · ulepszenia schema → A.

---

### Grupa C — Walka (`Panel-C.xlsx`)

| Stary plik | Lokalizacja | Docelowy arkusz Panel-C | Stary eksport | Priorytet |
|------------|-------------|-------------------------|---------------|-----------|
| `Jednostki.xlsx` | root (OneDrive) | `Macierz-jednostek` (+ ewent. osobny `Jednostki-pelna` jeśli >49 wierszy) | pipeline / `export-data.py` | P1 |
| `Macierz-walki.xlsx` | poza repo | już w Panel-C | — | ✅ zastąpione |
| `Civ-AI/AI-parametry.xlsx` (sekcje walki) | `Civ-AI/` | tylko jeśli są klucze **nie** w Panel-C/D | `export-ai-params.py` | P3 — diff z D |

**Stan:** Panel-C najpełniejszy (~49 jedn., countery, siege). Zadanie C = **audyt Jednostki.xlsx vs Panel-C** (kolumny: Widok pola, epoki, koszty produkcji jeśli są w Excelu a nie w panelu).

---

### Grupa D — Cywilizacje / Dyplomacja / AI (`Panel-D.xlsx`)

| Stary plik | Lokalizacja | Docelowy arkusz Panel-D | Stary eksport | Priorytet |
|------------|-------------|-------------------------|---------------|-----------|
| `Panel-efekty-cyw-dyplomacja.xlsx` | `Civ-CYWILIZACJE/` | **NOWY** `Bonusy-cywilizacji` | `export-bonusy-cyw.py` | P1 |
| `Cywilizacje.xlsx` | root | **NOWE:** `Cywilizacje-roster`, `Parametry-cyw`, `AI-per-nacja` | `export-civs.py`, `export-civ-params.py`, `export-civ-ai.py` | P1 |
| `Cywilizacje.xlsx` [Dyplomacja] | root | **NOWY** `Dyplomacja-per-nacja` | `export-civ-dyplomacy-nations.py` | P1 |
| `Dyplomacja/Dyplomacja.xlsx` | `Dyplomacja/` | `Dyplomacja` (params ✅) + **NOWY** akcje/koszty | `export-diplomacy.py` | P1 |
| `Civ-AI/AI-parametry.xlsx` | `Civ-AI/` | scala z `AI-trudnosc`, `AI-archetyp`, `AI-zachowanie` | `export-ai-params.py` | P1 |
| `Bonusy-cywilizacji-9x3.xlsx` | `Civ-CYWILIZACJE/` | widok pomocniczy — **nie kanon** | `gen-bonusy-cyw-xlsx.py` | P3 — tylko archiwum po merge bonusów |

**Bloker dziś:** `export-d.py --full` woła 6 starych skryptów — **cel merge = jeden `export-d.py` bez `--full`**.

**Religie 9 nacji:** źródło historyczne `Spoleczenstwo-parametry.xlsx` → docelowo arkusz w Panel-D `Religie-cywilizacji` (teksty per nacja) lub cross-handoff B→D — meldunek w trackerze.

---

### Grupa E — Start / Meta (`Panel-E.xlsx`)

| Stary plik | Lokalizacja | Docelowy arkusz Panel-E | Stary eksport | Priorytet |
|------------|-------------|-------------------------|---------------|-----------|
| `UI/UI-parametry.xlsx` | `UI/` | `Nowa-gra`, `Menu` | spec `PANEL-E1-SPEC.md` / `gen-panel-e.py` | P1 |
| Stałe w kodzie (victory cutoff) | `victory.ts`, `barbarians.ts` | koordynacja z D (`Zwyciestwo` w Panel-D) — **E nie duplikuje** | — | P2 |

**Stan:** Panel-E strukturalnie gotowy. Zadanie E = **checklist vs `UI-parametry.xlsx`** (jeśli plik lokalny istnieje u Macieja — porównaj z `ui-params.json` seed w repo).

---

## Kolejność wykonania (Master)

```mermaid
flowchart LR
  P0[P0: B usuń FOOD duplikat] --> D1[D: wchłonić 4 Excele]
  D1 --> B1[B: Budynki + Tech + Surowce]
  B1 --> A1[A: potwierdź Ulepszenia + Plony]
  A1 --> C1[C: audyt Jednostki.xlsx]
  C1 --> E1[E: UI-parametry checklist]
  E1 --> V[Master weryfikacja]
  V --> ARCH[Archiwum panele-legacy]
```

1. **P0** — Grupa B: stop `export-b.py` → `terrain-improvements.json`; usuń `Zywnosc-kanon`.
2. **Grupa D** — największy dług (`--full`).
3. **Grupa B** — Budynki + Technologie + Surowce (brakujące arkusze).
4. **Grupa A** — potwierdzenie vs `Ulepszenia-terenu.xlsx` / `Plony-terenow.xlsx`.
5. **Grupa C** — audyt `Jednostki.xlsx`.
6. **Grupa E** — checklist UI.
7. **Master** — weryfikacja trackera + archiwizacja.

---

## Protokół weryfikacji (każda grupa)

1. **Inwentaryzacja liczbowa:** policz wiersze parametrów w starym Excelu vs docelowym arkuszu Panel-X (tabela w meldunku).
2. **Diff JSON:** wyeksportuj ze starego skryptu → zapisz `.bak-merge`; wyeksportuj z `export-x.py` → porównaj kluczowe pola (automated diff lub `test-panel-x-roundtrip.py`).
3. **Brak orphanów:** każdy klucz w `gra/data/*.json` z `_meta.zrodlo` wskazującym stary Excel musi mieć wiersz w Panel-X.
4. **Meldunek:** append do `docs/obieg/PANEL-MERGE-TRACKER.md` (kolumna Status + data) + krótki wpis w `docs/obieg/<grupa>.md` § PANEL-MERGE.

Szablon meldunku:

```markdown
## PANEL-MERGE meldunek Grupa X — RRRR-MM-DD
- Plik: `<stary.xlsx>` → arkusz `<Arkusz>` — wiersze stary: N, panel: N, diff: 0
- export-x.py: ✅ bez legacy / ⬜ jeszcze woła `<skrypt>`
- Round-trip: ✅ / ❌
- **GOTOWE-DO-ARCHIWUM:** TAK/NIE
```

---

## Po merge — archiwizacja (Master, dopiero gdy tracker = 100%)

| Akcja | Ścieżka |
|-------|---------|
| Przenieś Excel | `docs/archiwum/panele-legacy/<oryginalna-ścieżka>` |
| README mapy | `docs/archiwum/panele-legacy/README.md` |
| Deprecate skrypty | nagłówek `# DEPRECATED — użyj export-x.py` w starych `gra/tools/export-*.py` |
| Usuń `--full` | `export-d.py` — gałąź legacy po migracji D |
| Aktualizuj `_INFO` | wszystkie Panel-A…E |

**Nie commitować / nie kasować lokalnie:** `Bonusy-cywilizacji-9x3.xlsx` (regenerowalny widok).

---

## Powiązane pliki

| Plik | Rola |
|------|------|
| `docs/obieg/PANEL-STEROWANIA-SPEC.md` | standard kolumn, 5 kroków |
| `docs/obieg/PANEL-MERGE-TRACKER.md` | status per plik |
| `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` | dyspozycje copy-paste |
| `docs/obieg/A-PANEL-INWENTARYZACJA.md` … | inwentaryzacja per grupa |
| `docs/archiwum/panele-miasto-legacy/README.md` | stan przed merge (B) |
