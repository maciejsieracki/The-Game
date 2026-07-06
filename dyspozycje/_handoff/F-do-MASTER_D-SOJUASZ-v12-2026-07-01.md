# GRUPA F → MASTER: D-SOJUASZ-v12 (P1)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | `D-SOJUASZ-v12` |
| **Poprzedni ROBOCZA** | `ED4C8E2B67AC86B7245B01FE9F2A20F9` (C-ODSKOK-FANOUT) |

---

## Scope

### Lane D (kod już w `gra/src` — bundle JSON)

- `gra/src/game/diplomacy.ts` — sojusz v1.2 · `diplomacyProposerStrengthEase()`
- `gra/src/game/diplomacy-proposals.ts` · `ai.ts`
- `gra/data/diplomacy.json` · `ai-params.json` — Panel-D progi
- `gra/src/game/diplomacy-display.ts` — tagi BBBB

### Integrator F (wpięcie)

- `gra/src/main.ts` — `openDiplomacyAudience` → `getState()`:
  - `formatPowerRelationLine` (Respekt z Power P-A)
  - `diplomacyPersonalityTags`
  - `relacjaTotal`, `playerPower`, `otherPower`, `powerRatioLabel`
  - `activeTreaties`, `otherEpochLabel`, `thresholds`
- `gra/src/ui/diplomacyAudience.ts` — layout BBBB (paski, Moc, tagi, traktaty)

**Handoff Master:** `MASTER-do-INTEGRATOR_D-sojusz-v12-2026-07-01.md`  
**Lane D:** `CYWILIZACJE-do-INTEGRATOR_diplomacy-display-ui-batch.md`

---

## Bramka

| Test | Wynik |
|------|-------|
| diplomacy-proposal | **30/30** |
| diplomacy | **143/143** |
| wire-ekonomia | 29/29 |
| logic | 197/197 |
| combat | 6/6 |
| post-battle-map | 10/10 |
| army-merge-bounce | 2/2 |
| civ-bonusy | 33/33 |
| ai-test | 193/198 (5× T2S — pre-existing) |
| smoke | OK |
| battle-smoke | OK |
| vite build | OK |

**Backup:** `main.ts.bak-INTEGRATOR-D-SOJUASZ-2026-07-01`

**Warstwa:** 🟡 cross (wspólny stan audiencji + render UI)

---

## ROBOCZA (F)

| Plik | md5 |
|------|-----|
| **`Gra-podglad-ROBOCZA.html`** | **`EDF380D67364F89A9617A9AFE57C003E`** |
| **PLAYTEST-*** | ten sam bundle |

**Kanon finalna** (`Gra-podglad.html`) — **bez zmian** · md5 `ED4C8E2B…` (Master promocja po review)

---

## Co sprawdzić po wpięciu (playtest)

1. Audiencja dyplomatyczna — linia **Moc** (⚜), stosunek **2:1**, paski Zaufanie/Respekt
2. Tagi charakteru przy portrecie AI (np. Handlowy, Wojowniczy)
3. Chipy aktywnych traktatów
4. Tooltip Respekt na pasku

---

## Następny (czeka w kolejce F)

**P2 A-P4-UI** — **nie** startować przed ACK Master tego batcha.
