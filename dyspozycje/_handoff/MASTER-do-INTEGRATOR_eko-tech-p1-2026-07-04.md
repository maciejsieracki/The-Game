# MASTER → INTEGRATOR F: EKO-TECH Paczka 1 — build ROBOCZA

**Data:** 2026-07-04 · **Priorytet:** **P0** · **Decyzje:** `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md`

---

## Zakres batchu

Lane A–E **GOTOWE** (JSON + logika bez main.ts). W `main.ts` **powinno być** (weryfikuj / uzupełnij jeśli brakuje):

| Zmiana | Plik | AC |
|--------|------|-----|
| Bramka badań T-TECH-7 | `main.ts` | `researchGateForOwner(0)` → `availableTechs`, `setPlayerResearchTarget`, `researchStep` |
| Upgrade budynków | `main.ts` | `applyCompletedBuildingIds` przy ukończeniu budynku |
| Dane + logika | `tech.json`, `buildings.json`, `terrain-improvements.json`, `research.ts`, `playerState.ts`, `production.ts`, `converters.ts` | już w repo |

**Handoffy lane:** `MASTER-do-CYWILIZACJE_eko-tech-paczka1…` · `MASTER-do-EKONOMIA_eko-tech-paczka1…` · `EKONOMIA-do-SILNIK_eko-tech-p1-integracja…`

---

## Kroki F (wykonawca)

1. **Backup:** `cp gra/src/main.ts gra/src/main.ts.bak-INTEGRATOR-EKO-TECH-P1-2026-07-04` jeśli ruszasz main.
2. **Weryfikacja diff** — tylko scope powyżej; bez cudzych lane'ów.
3. **Testy:**
   - `node tools/eko-tech-paczka1-test.cjs` → **9/9**
   - `node tools/converters-test.cjs` → **31/31**
   - `.\tools\bramka-test-publish.ps1` (logic + smoke + suite batchu)
4. **Publish ROBOCZA only:** `.\tools\publish-robocza-snapshot.ps1`
5. **Meldunek:**
   - `dyspozycje/SILNIK-DO-MASTERA.md` append
   - `dyspozycje/_handoff/F-do-MASTER_eko-tech-p1-2026-07-04.md`
   - Flaga: **`→ MASTER: GOTOWE-ROBOCZA`**
   - md5 z `gra-robocza/ROBOCZA-MANIFEST.json`

---

## DoD (Master sprawdzi)

- [ ] Pismo **niedostępne** bez Cegielni w imperium (picker + setPlayerResearchTarget)
- [ ] Upgrade kręgi→świątynia: jeden slot `swiatynia` w `cityBuilt`
- [ ] Mielerz, Mennica, Akwedukt, Odlewnia brązu w JSON — widoczne po tech
- [ ] ROBOCZA md5 ≠ poprzedni · kanon **nietknięty**
- [ ] **NIE** `publish-kanon-snapshot.ps1` — to robi Master po APPROVE

---

## Flaga

**GOTOWE** (dyspozycja Master) · F **START**
