# PANEL-MERGE — tracker weryfikacji (Master)

> Aktualizują: **grupy A–E** (meldunek) + **Master** (weryfikacja końcowa).  
> Orchestracja: `docs/obieg/PANEL-MERGE-ORCHESTRACJA.md`  
> **Ostatnia aktualizacja Master:** 2026-06-30 — weryfikacja testów + dry-run; **18/19 ✅ GOTOWE-DO-ARCHIWUM**

**Legenda statusu:** ⬜ CZEKA · 🔵 W TRAKCIE · 🟡 DO REVIEW MASTER · ✅ GOTOWE-DO-ARCHIWUM · 📦 ZARCHIWIZOWANE

---

## Podsumowanie

| Grupa | Pliki do merge | ✅ Gotowe | ⬜ Czeka |
|-------|----------------|-----------|----------|
| **A** | 3 | 3 | 0 |
| **B** | 7 | 7 | 0 |
| **C** | 2 | 2 | 0 |
| **D** | 6 | 6 | 0 |
| **E** | 1 | 1 | 0 |
| **RAZEM** | **19** | **19** | **0** |

**Bramka archiwum globalna:** 📦 **ZARCHIWIZOWANE** (2026-06-30, 16 plików → `docs/archiwum/panele-legacy/`)

---

## Grupa A

| ID | Stary plik | Docelowy arkusz Panel-A | Status | Wiersze stary→panel | Round-trip | Data |
|----|------------|-------------------------|--------|---------------------|------------|------|
| A-M1 | `MIASTO/Ulepszenia-terenu.xlsx` | `Ulepszenia-FOOD` + `Ulepszenia-inne` | ✅ GOTOWE-DO-ARCHIWUM | 78 → 78 | ✅ | 2026-06-30 |
| A-M2 | `Plony-terenow.xlsx` | `Plony-terenow` | ✅ GOTOWE-DO-ARCHIWUM | 45 → 45 | ✅ | 2026-06-30 |
| A-M3 | Duplikat `Zywnosc-kanon` (Panel-B) | *(usunięcie w B)* | ✅ GOTOWE-DO-ARCHIWUM | B-M7 ✅ | ✅ | 2026-06-30 |

**Weryfikacja Master (A):** ✅ `test-panel-a-roundtrip.py` OK (2026-06-30)

---

## Grupa B

| ID | Stary plik | Docelowy arkusz Panel-B | Status | Wiersze stary→panel | Round-trip | Data |
|----|------------|-------------------------|--------|---------------------|------------|------|
| B-M1 | `Ekonomia-parametry.xlsx` | Ekonomia/Wealth/Globalne/Budynki-eco/Teren-bonus | ✅ GOTOWE-DO-ARCHIWUM | seed JSON → ~73 | ✅ dry-run 0 | 2026-06-30 |
| B-M2 | `Spoleczenstwo-parametry.xlsx` | Zdrowie…Porzadek | ✅ GOTOWE-DO-ARCHIWUM | seed JSON → ~98 | ✅ dry-run 0 | 2026-06-30 |
| B-M3 | `MIASTO/Budynki.xlsx` | `Budynki` | ✅ GOTOWE-DO-ARCHIWUM | 26 → 26 | ✅ | 2026-06-30 |
| B-M4 | `MIASTO/Panel-przeglad-danych.xlsx` | Budynki + Społeczeństwo | ✅ GOTOWE-DO-ARCHIWUM | pokryte B-M2+B-M3 | ✅ | 2026-06-30 |
| B-M5 | `Surowce.xlsx` | `Surowce` | ✅ GOTOWE-DO-ARCHIWUM | 16 → 16 | ✅ | 2026-06-30 |
| B-M6 | `Technologie-drzewko.xlsx` | `Technologie` | ✅ GOTOWE-DO-ARCHIWUM | 31 → 31 | ✅ | 2026-06-30 |
| B-M7 | `Zywnosc-kanon` (Panel-B) | **USUNIĘTO** | ✅ GOTOWE-DO-ARCHIWUM | — | ✅ | 2026-06-30 |

**Weryfikacja Master (B):** ✅ `test-panel-b-roundtrip.py` OK · `export-b.py --dry-run` 0 zmian (2026-06-30)

---

## Grupa C

| ID | Stary plik | Docelowy arkusz Panel-C | Status | Wiersze stary→panel | Round-trip | Data |
|----|------------|-------------------------|--------|---------------------|------------|------|
| C-M1 | `Jednostki.xlsx` | `Macierz-jednostek` (+ staty, koszty) | ✅ GOTOWE-DO-ARCHIWUM | 50 jedn. / 347 meta | ✅ | 2026-06-30 |
| C-M2 | `Macierz-walki.xlsx` | Panel-C | ✅ GOTOWE-DO-ARCHIWUM | zastąpione | ✅ | 2026-06-29 |

**Weryfikacja Master (C):** ✅ `test-panel-c-roundtrip.py` OK (2026-06-30)

---

## Grupa D

| ID | Stary plik | Docelowy arkusz Panel-D | Status | Wiersze stary→panel | Round-trip | Data |
|----|------------|-------------------------|--------|---------------------|------------|------|
| D-M1 | `Panel-efekty-cyw-dyplomacja.xlsx` | `Bonusy-cywilizacji` | ✅ GOTOWE-DO-ARCHIWUM | 29 wierszy / 9 nacji | ✅ dry-run | 2026-06-30 |
| D-M2 | `Cywilizacje.xlsx` | roster + Parametry-cyw + AI-per-nacja | ✅ GOTOWE-DO-ARCHIWUM | 9+9+9 | ✅ dry-run | 2026-06-30 |
| D-M3 | `Cywilizacje.xlsx` [Dyplomacja] | `Dyplomacja-per-nacja` | ✅ GOTOWE-DO-ARCHIWUM | 9 | ✅ dry-run | 2026-06-30 |
| D-M4 | `Dyplomacja/Dyplomacja.xlsx` | Dyplomacja + akcje | ✅ GOTOWE-DO-ARCHIWUM | 38+12 | ✅ | 2026-06-30 |
| D-M5 | `Civ-AI/AI-parametry.xlsx` | AI-trudnosc/archetyp/zachowanie | ✅ GOTOWE-DO-ARCHIWUM | 67+10 barb. | ✅ | 2026-06-30 |
| D-M6 | `export-d.py --full` | jeden `export-d.py` | ✅ GOTOWE-DO-ARCHIWUM | bez --full | ✅ | 2026-06-30 |

**Weryfikacja Master (D):** ✅ `test-panel-d-roundtrip.py` OK · `export-d.py --dry-run` wszystkie arkusze OK (2026-06-30)

---

## Grupa E

| ID | Stary plik | Docelowy arkusz Panel-E | Status | Wiersze stary→panel | Round-trip | Data |
|----|------------|-------------------------|--------|---------------------|------------|------|
| E-M1 | `UI/UI-parametry.xlsx` | `Nowa-gra`, `Menu` | ✅ GOTOWE-DO-ARCHIWUM | 10+7 | ✅ | 2026-06-30 |

**Weryfikacja Master (E):** ✅ checklist ui-params.json diff=0 (2026-06-30)

---

## Cross-lane (otwarte poza archiwum paneli)

| Temat | Właściciel | Uwagi |
|-------|------------|-------|
| Religie 9 nacji (teksty w society) | **D** (v1.1) | `religie_cywilizacji` — osobny arkusz później, nie blokuje archiwum Exceli |
| Zwycięstwo progi JSON | **D/E** v1.1 | stałe w kodzie — nie legacy Excel |

---

## Log weryfikacji Master

| Data | Co sprawdzono | Wynik |
|------|---------------|-------|
| 2026-06-30 | Dyspozycje rozesłane | 18/19 ⬜ |
| 2026-06-30 | Subagenci B, D, A/C/E — merge kod + seed JSON | implementacja ✅ |
| 2026-06-30 | Bramka testów: test-panel-a/b/c/d roundtrip + export dry-run | **19/19 ✅ GOTOWE-DO-ARCHIWUM** |
| 2026-06-30 | Fizyczna archiwizacja 16 Exceli + DEPRECATED skrypty | 📦 ZARCHIWIZOWANE |

---

## Workflow po archiwum

**Maciej:** wyłącznie `Panel-A…E.xlsx` + komenda **eksportuj panel** w czacie grupy.  
**Skrypty legacy:** 📦 DEPRECATED — `gra/tools/DEPRECATED-EXPORTS.md`
