# Grupa A — inwentaryzacja Panel sterowania

**Data:** 2026-07-02 (sync JSON→Excel)  
**Cel:** `panele-sterowania/Panel-A.xlsx` — balans mapy: ulepszenia terenu, zasięgi, generator (E2), mgła.

---

## W Panel-A (Maciej edytuje tutaj)

| Arkusz | Źródło JSON | Co kręcisz |
|--------|-------------|------------|
| **Ulepszenia-FOOD** | `terrain-improvements.json` (epoka + bonusy + koszty) | Farma, irygacja, tarasy, łodzie, obóz, warzelnia, **bydło, owce, lama** — pełny eksport |
| **Ulepszenia-inne** | `terrain-improvements.json` (reszta pól) | Kopalnia, tartak, fort, posterunek, droga, wyrąb… |
| **Zasięgi-mgła** | `map-gen-params.json` → `mgla` + `terrain-improvements` | Domyślny wzrok jednostki, zasięgi fort/posterunek, nota miasto=10 |
| **Plony-terenow** | `terrain-yields.json` | Łąka, rzeka, las — bazowe plony |
| **Ruch-po-terenie** | `terrain-movement.json` | Koszty ruchu + forestExtra |
| **Generator-rozmiary** | `map-gen-params.json` → `generator` | ROZMIAR_DIMS, default W/H |
| **Zloza-generator** | `map-gen-params.json` | rarity złóż + min epoka metali |
| **Generator-E2** | `map-gen-params.json` → `gestosc` | Mnożniki surowców, rzek, las/pustynia — **wpięcie kodu = P3** |
| **Mapa-skala** | `map-gen-params.json` → `mapa_skala` | Typy cywilizacji i rywale per rozmiar mapy |

**Wartości kanonu FOOD** (Maciej 2026-06-29): farma +3, irygacja +5, tarasy +3, bydło +2/+3, owce +1/+2, lama +1/+3, łodzie +2/+3 — seed w panelu; JSON w grze aktualizuje się po **`eksportuj panel`**.

**Sync 2026-07-02:** regen `Panel-A.xlsx` z JSON (17 ulepszeń aktywnych); usunięto legacy **plantacja** (D3); naprawiono `map-gen-params.json` (pełne złoża + rozmiary); dry-run export **0 zmian** · round-trip ✅.

## Osobne pliki (NIE w Panel-A) — **PANEL-MERGE ✅**

> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (A-M1…A-M3 ✅) · legacy: `docs/archiwum/panele-legacy/`

| Temat | Plik / narzędzie | Lane | Status merge |
|-------|------------------|------|--------------|
| Zasięg okolicy miasta (pop→promień) | `Panel-B.xlsx` → Miasto | EKONOMIA | ✅ w Panel-B |
| Bonusy terenu w ekonomii (rzeka/las…) | `Panel-B.xlsx` → Teren-bonus | EKONOMIA | ✅ w Panel-B |
| Duplikat bonusów FOOD (kontekst B) | `Panel-B.xlsx` → Zywnosc-kanon | B | ✅ B-M7 usunięto |
| Stary Excel MIASTO | `MIASTO/Ulepszenia-terenu.xlsx` | A | ✅ A-M1 zarchiwizowany |

---

## Eksport (agent — Maciej nie używa terminala)

Po zmianie w Excelu Maciej pisze w czacie: **`eksportuj panel`**.

Agent uruchamia: `python panele-sterowania/export-a.py`

- **Ulepszenia-FOOD + Ulepszenia-inne** → `gra/data/terrain-improvements.json` (gra już czyta)
- **Generator-E2 + Mapa-skala + Zasięgi-mgła** → `gra/data/map-gen-params.json` (kod czyta w **P3 E2** / handoff Integratora dla mgły)

Regeneracja panelu z JSON (nadpisuje xlsx): `python panele-sterowania/gen-panel-a.py` — **po backupie** jeśli Maciej edytował ręcznie.

---

## Kroki PANEL-STEROWANIA-SPEC §3 — status A

| # | Krok | Status |
|---|------|--------|
| 1 | Inwentaryzacja | ✅ ten plik |
| 2 | Budowa panelu | ✅ `Panel-A.xlsx` + `gen-panel-a.py` |
| 3 | Wpięcie export | ✅ `export-a.py` · round-trip `test-panel-a-roundtrip.py` |
| 4 | Przeniesienie zadań | ✅ `A-mapa.md` § P1/P2/P3 |
| 5 | Archiwizacja starych | ✅ **PANEL-MERGE** A-M1…A-M3 · `docs/archiwum/panele-legacy/` |

**P2 FOOD-HODOWLA** (Panel-A hodowla + kod warstw/kwalifikacji) — **✅ GOTOWE** · handoff SILNIK: `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md`  
**P3 E2** — generator czyta `map-gen-params.json` zamiast stałych w `.ts`.

---

## Powiązane decyzje

- Kanon FOOD: `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`
- E2 gęstość: `docs/decyzje/E2-gestosc-swiat-kreator.md`
- Kolejność: **P1 Panel-A → P2 FOOD → P3 E2** (Maciej 2026-06-29)
