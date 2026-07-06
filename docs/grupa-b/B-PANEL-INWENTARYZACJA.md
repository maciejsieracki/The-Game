# Grupa B — inwentaryzacja Panel sterowania

**Data:** 2026-06-26  
**Cel:** `panele-sterowania/Panel-B.xlsx` — balans miasto / okolica / społeczeństwo / Wealth (bez tech i bez pełnych plonów terenu).

---

## W Panel-B (Maciej edytuje tutaj)

| Arkusz | Źródło JSON | Parametry (normal) |
|--------|-------------|-------------------|
| **Miasto** | `miasto-params.json` | 20 — zasięg okolicy, koszty, udziały outputu, mur +200% |
| **Ekonomia** | `econ-params.json` → `ekonomia_miasta` | 15 — wzrost pop, żywność, suwaki HUD, korupcja, głód wojska |
| **Wealth** | `econ-params.json` → `wealth` | 8 — cap, progi, mnożnik podatku, utrzymanie, szczęście |
| **Globalne** | `econ-params.json` → `globalne` | 8 — kurs, magazyny, utrzymanie jednostek |
| **Budynki-eco** | `econ-params.json` → `budynki` | 14 — młyn, targowisko, przepustowości hut |
| **Teren-bonus** | `econ-params.json` → `teren_mapa` | 12 — rzeka/las/farma/irygacja (bonusy, nie baza plonów) |
| **Zdrowie** | `society-params.json` → `zdrowie` | 16 |
| **Szczescie** | `society-params.json` → `szczescie` | 24 |
| **Kultura** | `society-params.json` → `kultura` | 20 |
| **Religia** | `society-params.json` → `religia` | 15 |
| **Religia** | `society-params.json` → `religia` | 15 |
| **Porzadek** | `society-params.json` → `porzadek` + `prawo` | 18 |
| **Budynki** | `buildings.json` (tabela) | 26 |
| **Surowce** | `resources.json` (tabela) | 16 |
| **Technologie** | `tech.json` → `technologie[]` (tabela) | 31 |

**Razem ~186 parametrów** strojenia + 73 wiersze tabelaryczne (poziom normal; easy/hard w JSON — na razie tylko odczyt w opisie).

**PANEL-MERGE 2026-06-29:** arkusz `Zywnosc-kanon` usunięty z Panel-B (master FOOD = Panel-A, B-M7).

---

## Osobne pliki (NIE w Panel-B) — **PANEL-MERGE w toku**

> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (B-M1…B-M7)

| Temat | Plik / narzędzie | Lane | Status merge |
|-------|------------------|------|--------------|
| Pełna lista budynków (koszt, przyrost) | `buildings.json` + `MIASTO/Budynki.xlsx` | EKONOMIA | 🟡 B-M3 — arkusz `Budynki` w Panel-B |
| Baza plonów per teren | `Plony-terenow.xlsx` | MAPA (A) | ✅ Panel-A |
| Ulepszenia heksów (schema) | `terrain-improvements.json` | MAPA (A) | ✅ Panel-A (FOOD master) |
| Technologie | `Technologie-drzewko.xlsx` | **B** | 🟡 B-M6 — arkusz `Technologie` w Panel-B |
| Surowce | `Surowce.xlsx` | **B** | 🟡 B-M5 — arkusz `Surowce` w Panel-B |
| Jednostki | `Panel-C.xlsx` | UNITS | ✅ Panel-C |
| Religie per cywilizacja (tekst) | `Spoleczenstwo-parametry.xlsx` | **D** (merge) | ⬜ cross D |
| Ekonomia / Społeczeństwo legacy | `Ekonomia-parametry.xlsx`, `Spoleczenstwo-parametry.xlsx`, `Panel-przeglad-danych.xlsx` | B | ⬜ B-M1, B-M2, B-M4 |

---

## Eksport

```powershell
cd "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ"
python panele-sterowania/export-b.py
```

Kolumna **Wartość** → pole `normal` (econ/society) lub `wartosc` (miasto). Puste = brak zmiany.

Potem: `node gra/tools/logic-test.cjs` + testy society/economy jeśli dotyczy.

---

## Kroki 5 (PANEL-STEROWANIA-SPEC §3) — status B

| # | Krok | Status |
|---|------|--------|
| 1 | Inwentaryzacja | ✅ ten plik |
| 2 | Budowa panelu | ✅ `Panel-B.xlsx` + `gen-panel-b.py` |
| 3 | Wpięcie export + round-trip | ✅ `export-b.py` + `test-panel-b-roundtrip.py` |
| 4 | Przeniesienie zadań | ✅ ROADMAP § Panele · `PANEL-B-SPEC.md` |
| 5 | Archiwizacja starych | ⬜ **PANEL-MERGE** — po meldunkach B-M* w trackerze |

**FOOD-HODOWLA** (kod) = osobny priorytet — kanon FOOD edytuje się w **Panel-A** (Grupa A).

```powershell
python panele-sterowania/gen-panel-b.py
```

Nadpisuje `Panel-B.xlsx` wartościami z aktualnych JSON-ów (nie kasuje ręcznych edycji Macieja, jeśli najpierw zbackupujesz plik).
