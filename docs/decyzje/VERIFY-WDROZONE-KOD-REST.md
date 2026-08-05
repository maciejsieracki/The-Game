# VERIFY — WDROŻONE(kod) batch REST (AutoBot 2026-08-05)

Branch: `cursor/verify-wdrozone-kod-rest-63a1` · main `@28819c7` · **bez deployu**

| ID | Wynik | Dowód (main) | Uwagi |
|---|---|---|---|
| R-UNIT-KOSZT-ŁUCZ | **CLOSED** | `gra/data/units.json` L171-178, L2193-2194, L2973-2974 — dystansowe 0 surowca | Decyzja 0 Brąz |
| R-PALAC-KOSZT | **GAP** | `gra/data/buildings.json` L1037-1039 — `koszt_surowce.drewno:8` nadal obecne | C-PALAC-Q1=A niewdrożone |
| R-SUROWCE-DOSTEP | **GAP** | `main.ts` L2363-2371 cap na wszystkich wierszach · `empireDetailPanel.ts` L736 `cap==null` → pusta podsekcja | Częściowo: dostep/zrodlo bez UI access |
| R-TURA-JEDN-AKTYWNA | **CLOSED** | `main.ts` L2666, L20845 `ruchLeft: ruch` · L8169-8185 `afterPlayerUnitSpawned` | C-TURA-Q1=A |
| R-DYP-NEGOCJACJE-NA-ZYWO | **CLOSED** | `main.ts` L11414-11459 `resolveNegotiationEntryAt` | Negocjacje na żywo w audiencji |
