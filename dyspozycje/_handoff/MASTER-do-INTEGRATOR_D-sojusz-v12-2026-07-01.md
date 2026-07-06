# MASTER → INTEGRATOR F: batch D-SOJUASZ-v12 (P1)

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA PO P0** — start po meldunku `C-ODSKOK-FANOUT` |
| **Data dyspozycji** | 2026-07-01 |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F |
| **Batch** | `D-SOJUASZ-v12` |
| **Poprzedni kanon** | md5 z P0 (≠ `AB471657…`) |

---

## Źródło (lane D — kod już w `gra/src`)

| Handoff | Rola |
|---------|------|
| `D-do-MASTER_sojusz-v12-panel-params-display.md` | meldunek · **ACK Master 2026-07-01** |
| `CYWILIZACJE-do-INTEGRATOR_diplomacy-display-ui-batch.md` | kontrakt wpięcia display + params |

**Kod lane D (bez nowej logiki — build kanon):**
- `gra/src/game/diplomacy.ts` — sojusz v1.2 · `diplomacyProposerStrengthEase()`
- `gra/src/game/diplomacy-proposals.ts` · `ai.ts`
- `gra/data/diplomacy.json` · `ai-params.json` — Panel-D progi
- `gra/src/game/diplomacy-display.ts` — tagi BBBB (wpięcie w `main.ts`)

---

## AC Integratora F

1. **Wpięcie display** w `main.ts` — patrz sekcja INTEGRATOR w `CYWILIZACJE-do-INTEGRATOR_diplomacy-display-ui-batch.md` (`formatPowerRelationLine`, `diplomacyPersonalityTags`, Respekt z Power).
2. **Backup:** `main.ts.bak-INTEGRATOR-D-SOJUASZ-2026-07-01`
3. **Bramka:**
   - `node gra/tools/diplomacy-proposal-test.cjs` — **17/17**
   - `node gra/tools/diplomacy-test.cjs` — **140/140**
   - `.\gra\tools\bramka-test-publish.ps1`
4. **Build** → publish **`Gra-podglad-ROBOCZA.html`** + PLAYTEST-* — **nie** finalna
5. **Meldunek:** `F-do-MASTER_D-SOJUASZ-v12-2026-07-01.md` · **`→ MASTER: GOTOWE-ROBOCZA`**
6. **Kolejka:** zaktualizuj md5 · Slack `#grupa-f` + `#master`

---

## DoD

- [ ] Sojusz v1.2 + Panel-D params w kanonie (bundle JSON)
- [ ] Audiencja: linia Power/Respekt + tagi osobowości (BBBB)
- [ ] Master: review subagent → ACK

**Następny batch (czeka w kolejce):** A-P4-UI — **nie** równolegle.
