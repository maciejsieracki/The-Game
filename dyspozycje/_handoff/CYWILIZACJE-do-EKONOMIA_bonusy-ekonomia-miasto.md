# HANDOFF CYWILIZACJE → EKONOMIA: Bonusy ekonomia + miasto (RDY-01)

**Data:** 2026-06-26  
**Od:** CYWILIZACJE (Grupa D)  
**Do:** EKONOMIA  
**Flaga:** **GOTOWE (implementacja)** — regresja + Excel sync

---

## Co przesyłam

| Efekt | Nacja | Plik / funkcja | Status |
|-------|-------|----------------|--------|
| +15% handel | Grecy | `civEconomyYieldMultipliers` → `turn-economy.ts` ctx.civHandelMult | **WDROŻONE** |
| +15% nauka | Inkowie | ctx.civNaukaMult | **WDROŻONE** |
| −10% rekrutacja | Zulusi | `civRecruitmentDiscount` → `production.ts` | **WDROŻONE** |
| −20% koszt budynków | Rzymianie | `buildingCostAfterCivDiscount` → `production.ts` | **WDROŻONE** |

**Dane:** `gra/data/civs.json` bonusy[]; lookup: `civBonusyForCivKey(civKey, civs)` w `economy.ts`

---

## Co Odbiorca ma zrobić

### Teraz (minimal)

- [ ] Uruchomić `node tools/civ-bonusy-test.cjs` po każdej zmianie `civs.json` z Excelu
- [ ] Potwierdzić w `EKONOMIA-DO-MASTERA.md`: RDY-01 **ZAMKNIĘTE**

### Po „Excel OK” od Macieja (CYW robi export)

- [ ] CYW: `export-bonusy-cyw.py` → overlay JSON
- [ ] EKONOMIA: **brak zmian kodu** — tylko test regresji jeśli wartości się zmienią

### Przyszłość (jeśli Excel dostanie nowe typy)

Nowe wpisy `realizuje=ekonomia` / `miasto` → EKONOMIA implementuje w `economy.ts` / `production.ts` wg wzorca `civ-bonuses.ts` / `civEconomyYieldMultipliers`.

---

## DoD

- `civ-bonusy-test.cjs`: sekcje A–E **PASS**
- Panel miasta: Rzymianie tańsze budynki, Zulusi tańsze jednostki (przy `getCivBonusy` z silnika)

*— CYWILIZACJE, 2026-06-26*
