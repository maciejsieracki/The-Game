# MASTER → INTEGRATOR F: batch B-B5-SPICHLERZ (P3)

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA PO P2** — start po meldunku `A-P4-UI` |
| **Data dyspozycji** | 2026-07-01 |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F |
| **Batch** | `B-B5-SPICHLERZ` |
| **Warstwa** | 🟡 cross (`turn-economy`, `cityPanel`, `empire-food`) |
| **Poprzedni kanon** | md5 z P2 |

---

## Źródło (lane B)

| Handoff | Rola |
|---------|------|
| `EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md` | meldunek · **ACK Master 2026-07-01** |
| `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` | kanon decyzji |

**Pliki lane B (w `gra/src`):**
- `game/economy.ts` · `empire-food.ts` · `turn-economy.ts`
- `ui/cityPanel.ts` — sekcja Spichlerz

---

## AC Integratora F

1. Weryfikacja diff vs kanon — scope B5 tylko (bufor wzrostu, kumulacja zapasów ze Spichlerzem).
2. **Backup:** `main.ts.bak-INTEGRATOR-B-B5-2026-07-01` (jeśli dotykasz main)
3. **Bramka:**
   - `node gra/tools/spichlerz-wzrost-test.cjs` — **9/9**
   - `node gra/tools/empire-food-b5-test.cjs` — **10/10**
   - `node gra/tools/food-hodowla-test.cjs` — **26/26**
   - `bramka-test-publish.ps1`
4. **Build** → publish **ROBOCZA**
5. **Meldunek:** `F-do-MASTER_B-B5-SPICHLERZ-2026-07-01.md` · **`→ MASTER: GOTOWE-ROBOCZA`**

---

## DoD (playtest checklist — Maciej opcjonalny)

- Miasto bez Spichlerza: bufor 0, zapasy armii nie kumulują
- Ze Spichlerzem: bufor 50%, zapasy państwa kumulują
- Panel miasta: kolumna Spichlerz + suwak Rozwój/armia

**Kolejka po P3:** Master ustali następny priorytet (lane A P5 C3 / inne).
