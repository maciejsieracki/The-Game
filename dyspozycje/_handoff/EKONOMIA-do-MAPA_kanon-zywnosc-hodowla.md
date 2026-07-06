# EKONOMIA → MAPA: FOOD-HODOWLA P2 — JSON + API + Panel-A

**Data:** 2026-06-26  
**Od:** lane EKONOMIA (Maciej: „p2 możesz robić”)  
**Status:** **GOTOWE po stronie EKONOMII** — **MAPA: start P2**  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`  
**Dyspozycja MAPA:** `dyspozycje/_handoff/MASTER-do-MAPA_kanon-zywnosc-hodowla.md` (M1–M7 kod)

---

## Co EKONOMIA dostarczyła (nie duplikuj)

### 1. JSON — źródło prawdy bonusów (Panel-A eksportuje tutaj)

| Klucz | +żywność | +produkcja | Uwagi |
|-------|----------|------------|--------|
| `farma` | 3 | 0 | płaski, nie na złożu |
| `irygacja` | 5 | 0 | płaski/pustynia przy rzece |
| `tarasy` | 3 | 0 | solo wzgórze, Chińczycy+Inkowie |
| `bydlo` | 2 | 3 | płaski; pierwsze na złożu |
| `owce` | 1 | 2 | solo wzgórze |
| `lama` | 1 | 3 | solo; Inkowie |
| `lodzie_rybackie` | 2 | 3 | wybrzeże/morze |

**Usunięto:** `pastwisko` (legacy alias w kodzie EKONOMII: `pastwisko` → `bydlo` tylko przy odczycie starych save).

**Plik:** `gra/data/terrain-improvements.json`  
**Test lane B:** `node gra/tools/food-hodowla-test.cjs` → 21/21 OK

---

## Co MAPA ma zrobić z **Panelem-A** (Twój panel sterowania)

> **To jest temat mapy świata** — kwalifikacja/render/budowa na mapie + **Panel-A** jako Excel Macieja do kręcenia bonusów ulepszeń terenu.

### Krok PANEL (przed lub równolegle z kodem M1–M7)

| # | Akcja | Plik |
|---|--------|------|
| P-A1 | **Regeneruj** `Panel-A.xlsx` z aktualnego JSON (wiersze bydło/owce/lama już podpięte w generatorze) | `python panele-sterowania/gen-panel-a.py` |
| P-A2 | Sprawdź arkusz **Ulepszenia-FOOD** — wiersze `bydlo.*`, `owce.*`, `lama.*` mają **Wartość** i eksport (nie „P2 bez eksportu”) | `Panel-A.xlsx` |
| P-A3 | Usuń ewentualne **legacy** wiersze `pastwisko.*` jeśli zostały po starym Excelu (gen-panel-a już ich nie generuje) | ręcznie lub regen |
| P-A4 | Round-trip: `python panele-sterowania/test-panel-a-roundtrip.py` + `export-a.py` — **0 skip** na bydlo/owce/lama | test |
| P-A5 | Meldunek: `MAPA-DO-MASTERA.md` — „Panel-A FOOD hodowla podpięty” | append |

**Zmiana w repo (EKONOMIA przygotowała):** `gen-panel-a.py` — `FOOD_SHEET_KEYS` + wiersze bydło/owce/lama z `imp_key`; `export-a.py` — komunikat skip bez „czeka P2”.

**Maciej:** po edycji Excela → **`eksportuj panel`** w czacie lane A → `export-a.py` → `terrain-improvements.json`.

**Nie duplikuj Panel-B:** bonusy ulepszeń terenu = **Panel-A** (`docs/obieg/A-PANEL-INWENTARYZACJA.md`). Panel-B `Zywnosc-kanon` = kontekst ekonomii miasta — preferuj A.

---

## Co MAPA importuje z EKONOMII (kod M1–M7 — **nie kopiuj logiki**)

| Import | Plik EKONOMII | Użycie MAPA |
|--------|---------------|-------------|
| `isLivestockAllowed(civType, key, era)` | `livestock-unlock.ts` | kwalifikacja budowy (Inkowie ep&lt;3) |
| `computeEmpireLivestockUnlocks(map, placed, ownerId)` | j.w. | pierwsze pastwisko na złożu → unlock |
| `isLivestockUnlockedForPlacement(key, hex, unlocks)` | j.w. | M3 — pole bez złoża po unlock |
| `improvementKeysForHex(hex)` | `terrain-improvements.ts` | M2 — warstwy na heksie (czytaj `hex.ulepszenia[]`) |

**NIE edytuj:** `economy.ts`, `turn-economy.ts`, `resource-access.ts` (lane EKONOMIA).

**Handoff do SILNIK po DoD MAPA:** `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md` (buildMode, render warstw).

---

## Kolejność integracji (cała gra)

```
EKONOMIA P2  ✅ (ten handoff)
     ↓
MAPA P2      ← TERAZ (Panel-A + M1–M7) → → SILNIK: GOTOWE
     ↓
SILNIK       batch F-FOOD-HODOWLA-01 (main.ts, hex.ulepszenia[])
     ↓
INTEGRATOR   Gra-podglad-ROBOCZA → Opus → kanon
```

**Blokada Integratora:** batch **F-FOOD-HODOWLA-01** dopiero gdy **EKONOMIA + MAPA** obie mają `→ SILNIK: GOTOWE`.

---

## AC dla MAPA (panel)

| AC | Kryterium |
|----|-----------|
| AC-PA1 | `export-a.py` po regen — 0 skipped dla `bydlo.*` / `owce.*` / `lama.*` |
| AC-PA2 | Round-trip Panel-A ↔ JSON zielony |
| AC-PA3 | Maciej może kręcić bonus bydło w Excelu → `eksportuj panel` → JSON się zmienia |

## AC kod (MASTER-do-MAPA) — bez zmian

Patrz `MASTER-do-MAPA_kanon-zywnosc-hodowla.md` AC-M1–M7.

---

## Powiązane handoffy

- EKONOMIA → SILNIK: `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md` (**GOTOWE**)
- EKONOMIA → INTEGRATOR: `EKONOMIA-do-INTEGRATOR_kanon-zywnosc-hodowla.md`
- SILNIK integracja: `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`
