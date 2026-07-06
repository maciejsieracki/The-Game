# Handoff: EKONOMIA → MASTER · B1-Q3 + Panel-B (2026-07-02)

**Od:** Grupa B (Ekonomia)  
**Do:** Master Orkiestrator → Integrator F  
**Flaga:** `→ MASTER: GOTOWE`  
**Warstwa:** 🟡 cross (tech.json + moduł lane B; **bez `main.ts`**)  
**Dyspozycja:** [`MASTER-PILNE-2026-07-02.md`](../MASTER-PILNE-2026-07-02.md)

---

## Co przesyłam

### P1 — B1-Q3 drzewko liniowe (Maciej 2026-06-28, opcja B)

| Plik | Zmiana |
|------|--------|
| `gra/data/tech.json` | Pole `drzewko_model: "liniowe"` + `_drzewko_model_opis` (31 tech bez zmiany prereq) |
| `gra/src/game/tech-tree.ts` | **NOWY** — model liniowy: `orderedTechsInEpoch`, `linearDepthInEpoch`, `techPrereqChain`, `validateTechGraph`, `readTechTreeModel` |
| `gra/src/game/economy.ts` | Re-eksport API z `tech-tree.ts` |
| `gra/tools/tech-tree-test.cjs` | **NOWY** — 19 asercji (graf, kolejność, depth, chain) |

**Semantyka B (liniowe):** w epoce oś wg `Poziom` + kolejność w tablicy; gałęzie równoległe L1 i prereq AND **bez zmian** — dostępność nadal `research.ts` (`parsePrerequisites`).

**Nie wdrożono (świadomie, poza lane B):**
- Przepisanie wszystkich prereq na pojedynczy łańcuch (balans + redesign danych)
- Layout `sciencePicker.ts` na kolumny liniowe — **wpięcie F/UI** gdy Master zaakceptuje kontrakt z `orderedTechsInEpoch`

**Uwaga ID:** `B1-Q3` (drzewko) ≠ `B1-tech-Q3` (posterunek=C, już w `improvement-tech.ts`).

### P2 — Panel-B (Budynki · Technologie · Surowce)

| Element | Status |
|---------|--------|
| Arkusze w `Panel-B.xlsx` | ✅ Budynki, Surowce, Technologie (+ 15 innych) |
| `panele-sterowania/export-b.py` | ✅ już eksportuje 3 arkusze → `buildings.json`, `resources.json`, `tech.json` |
| FOOD / `terrain-improvements.json` | ✅ brak eksportu z B (Panel-A) |

**Bez zmian kodu export-b** — weryfikacja wystarczyła.

---

## Testy (2026-07-02)

| Test | Wynik |
|------|-------|
| `python panele-sterowania/export-b.py --dry-run` | **PASS** — 0 zmian, Technologie 31 wierszy |
| `python panele-sterowania/test-panel-b-roundtrip.py` | **PASS** — miasto + budynki + Potega-P-A |
| `node gra/tools/tech-tree-test.cjs` | **PASS** — 19/19 |
| `node gra/tools/grupa-b-lane-test.cjs` | **41 pass, 1 fail** — `empire reserve after army cost 1` (regresja sprzed tego batcha; nie dotyczy B1-Q3) |
| `npx tsc --noEmit` | **FAIL** — znane błędy cross-lane (battleScene, main.ts, …); **brak nowych w tech-tree.ts** |

---

## Co Odbiorca ma z tym zrobić

1. **Master:** review 🟡 — akceptacja modelu „liniowe” bez pełnego przepisania prereq.
2. **Integrator F:** opcjonalnie podpiąć `orderedTechsInEpoch` / `linearDepthInEpoch` w `sciencePicker.ts` (handoff cross → UI/E).
3. **Batch:** wpięcie do `main.ts` tylko jeśli wymagane importy z economy — obecnie **zero zmian main**.

---

## DoD

- [x] B1-Q3 flaga + moduł + test dedykowany
- [x] Panel-B arkusze + export + roundtrip
- [x] Bez `main.ts`
- [x] Meldunek `EKONOMIA-DO-MASTERA.md`
- [ ] Slack #master + #grupa-b — **do Mastera / agenta z MCP Slack**

---

## Co sprawdzić po wpięciu

- `tech.json` zachowuje `drzewko_model` po `eksportuj panel` (export-b nie nadpisuje top-level poza `technologie`/`tempo_gry`)
- Hub nauki: czy layout ma używać `orderedTechsInEpoch` — **ZAMKNIĘTE: B1-Q3-UI=A** (SVG gałęzie, bez przebudowy UI)

**Blokery:** brak technicznych dla lane B. Otwarte: wizualny layout drzewka (sciencePicker) = 🟡 u F/UI.
