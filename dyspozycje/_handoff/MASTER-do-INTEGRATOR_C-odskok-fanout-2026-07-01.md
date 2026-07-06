# MASTER → INTEGRATOR F: batch C-ODSKOK-FANOUT (P0)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **WPIĘTE — meldunek F 2026-07-01** |
| **Data** | 2026-07-01 |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F |
| **Batch** | `C-ODSKOK-FANOUT` |
| **Poprzedni kanon** | `AB471657E64C0D87F3BA7E3094DE0A1B` (E2-PLAYTEST-B2Q5) |

---

## Źródło (lane C — już w `gra/src`)

| Handoff | Rola |
|---------|------|
| `C-do-MASTER_odskok-fanout-2026-07-01.md` | meldunek · **ACK Master 2026-07-01** |
| `C-do-INTEGRATOR_rebuild-playtest-2026-07-01.md` | kontekst PLAYTEST-* |

**Kod (lane C — zweryfikuj przed buildem):**
- `gra/src/game/post-battle-map.ts` — odskok **od atakujących**, nie losowy
- `gra/src/main.ts` — `mapHexPassableForUnit` enum `TerenBazowy`
- `gra/src/game/playtestOdskok3v3.ts` + pathname PLAYTEST-ODSKOK

---

## AC Integratora F

1. **Weryfikacja:** diff vs kanon `AB471657…` — tylko scope odskoku + passability (+ merge bounce jeśli w kodzie C).
2. **Backup:** `main.ts.bak-INTEGRATOR-C-ODSKOK-2026-07-01` · `Gra-podglad.html.bak-C-ODSKOK-2026-07-01`
3. **Bramka:**
   - `node gra/tools/post-battle-map-test.cjs` — **7/7**
   - `node gra/tools/army-merge-bounce-test.cjs` — **2/2** (jeśli w repo)
   - `.\gra\tools\bramka-test-publish.ps1` — pełna (17 suitów + smoke + battle-smoke)
4. **Build:** `npx vite build --outDir $env:TEMP\civ-dist` → publish **`Gra-podglad.html`**
5. **Sync PLAYTEST-*:** `PLAYTEST-ODSKOK`, `PLAYTEST-WALKA`, `ROBOCZA`, `PLAYTEST-MAPA` = ten sam bundle co kanon
6. **Meldunek:** `SILNIK-DO-MASTERA.md` + handoff `F-do-MASTER_C-ODSKOK-FANOUT-2026-07-01.md` · flaga **`→ MASTER: GOTOWE-ROBOCZA`** (nie finalna)
7. **Publish F:** tylko **`Gra-podglad-ROBOCZA.html`** + PLAYTEST-* — **nie** `Gra-podglad.html` (Master: `publish-kanon-snapshot.ps1`)

---

## DoD

- [ ] md5 kanon ≠ `AB471657…` ✅ `ED4C8E2B…`
- [ ] Maciej może retest `Gra-podglad-PLAYTEST-ODSKOK.html` — wróg ucieka **od gracza**, **tylko ląd**
- [ ] Master: review subagent → ACK

**Następny batch (czeka w kolejce):** D-SOJUASZ-v12 — **nie** równolegle.
