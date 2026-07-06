# MASTER → INTEGRATOR F: B5-SP follow-up (limit + HUD)

| Pole | Wartość |
|------|---------|
| **Status** | ⏸ **CZEKA** — start **po GOTOWE** lane B + UI |
| **Batch** | `B5-SP-FOLLOWUP` |
| **Priorytet** | Po P5/P6 dyplomacji **lub** równolegle jeśli brak kolizji `main.ts` |
| **Decyzja** | `MACIEJ-do-MASTER_B5-spichlerz-SP-2026-07-01.md` |

---

## Warunek startu

- [ ] `EKONOMIA-DO-MASTERA.md` — **GOTOWE** B5-SP-LIMIT
- [ ] `UI-DO-MASTERA.md` — **GOTOWE** B5-SP-HUD
- [ ] Kontrakt `_handoff/EKONOMIA-do-UI_*` / `UI-do-INTEGRATOR_*` jeśli dotyczy

---

## AC Integratora F

1. Weryfikacja diff vs kanon SP (limit, HUD, panel cleanup).
2. **`main.ts`:** tylko jeśli lane wymaga `buildHudState()` / `getEmpireFood*` — minimalny wire.
3. Backup: `main.ts.bak-INTEGRATOR-B5-SP-2026-07-01`
4. Bramka:
   - `node gra/tools/spichlerz-wzrost-test.cjs` — 9/9
   - `node gra/tools/empire-food-b5-test.cjs` — zielone (+ nowe cap)
   - `node gra/tools/smoke.cjs`
   - `.\gra\tools\bramka-test-publish.ps1`
5. Publish **ROBOCZA only** → meldunek `F-do-MASTER_B5-SP-FOLLOWUP-2026-07-01.md` · `→ MASTER: GOTOWE-ROBOCZA`

---

## DoD playtest Macieja (po ROBOCZA)

- HUD: `142 / 200` przy 2 Spichlerzach
- Panel miasta: brak 📦; suwak + bufor OK
- Po przekroczeniu limitu: nadwyżka nie rośnie dalej

---

## Master po meldunku F

Review subagent → APPROVE → `publish-kanon-snapshot.ps1`
