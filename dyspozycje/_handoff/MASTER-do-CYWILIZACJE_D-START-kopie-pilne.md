# MASTER → CYWILIZACJE — D-START kopie typu (PILNE)

**Data:** 2026-06-27  
**Decyzja:** `docs/decyzje/D-START-miasta-kopie-typu.md`  
**Priorytet:** P1 — blokuje balans mapy

## Do zrobienia

1. **`ai.ts`** — profil `kopia_typu_obronna`: zero `foundCity`, zero ekspansji, tylko obrona garnizonu.
2. **`civ-ai.json` / arkusz** — kolumna `profilMapy` = `kopia_typu_obronna` | `gracz` | `barbarzyncy`.
3. **Handoff MAPA+SILNIK** — spawn **wszystkich** miast klastra per obcy typ (nie tylko stolica).
4. **Test:** 20 tur — AI typu nie zakłada 3. miasta.

## DoD

- [ ] `node tools/ai-test.cjs` zielony
- [ ] Meldunek `CYWILIZACJE-DO-MASTERA.md` → **→ SILNIK: GOTOWE**
- [ ] SILNIK wpina flagę w pętlę AI (bez edycji `cluster-spawn` — to MAPA)

**Status:** **✅ DONE u CYW** (2026-06-27) — profil `kopia_typu_obronna`, defensiveCopy, export JSON. **CZEKA:** Silnik `resolveArchetypeAggression` main.ts ~4914.
