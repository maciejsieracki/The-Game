# CYWILIZACJE → INTEGRATOR (SILNIK + UI): dyplomacja na Mocy — 🟢 GOTOWE (dane)

**Data:** 2026-06-26  
**Od:** Grupa D (CYWILIZACJE)  
**Wejście:** `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md`

---

## Co jest gotowe

| Warstwa | Stan |
|---------|------|
| **Moc (Power P-A)** | silnik + `power-params.json` |
| **Respekt** | `computeRespekt(Moc_self, Moc_partner)` co turę |
| **Progi dyplomacji** | `diplomacy.json` params — **bez zmian** po tuningu D |
| **Testy** | power 9/9 · diplomacy 135/135 |

---

## Co integrator robi teraz

1. **Audiencja** — wypełnić `DiplomacyAudienceState`: `playerPower`, `otherPower`, `relacjaTotal` (handoff UI v2).
2. **HUD / overlay** — Moc z cache `objectivePowerByOwner` (już w SILNIK).
3. **NIE** czytać `respekt_-_czynniki` ani `computePotegaNacji` do Respektu dyplomacji.

---

## Otwarte (nie blokuje integracji)

| Temat | Owner |
|-------|--------|
| D3-UX ABC (layout audiencji) | Maciej → UI |
| Jednorazowe delty Respekt vs nadpisanie co turę | SILNIK-D-V11 |
| Tagi charakteru `dip_*` | CYW po macierzy |
| Eksport Panel-D po edycji Excel | Maciej → `export-d.py` |

---

## DoD integratora

- [ ] Audiencja pokazuje Moc obu stron (po D3-UX-4)
- [ ] Respekt w UI = wartość z silnika (ratio Mocy)
- [ ] Brak „Wpływ" / legacy Potęga 0–100 w stringach PL

**Flaga:** 🟢 JSON + spec — czeka batch UI/SILNIK
