# MASTER → Integrator F: batch P5+P6 dyplomacja (po lane)

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA lane D + C/MAPA** |
| **Batch** | `P5-PRZEMARSZ` + `P6-BASKET-TRANSFER` |
| **Poprzedni kanon** | md5 `7db1561668bdd9df18a010af28fe46c6` |

**Start F dopiero po meldunkach:** `CYWILIZACJE-DO-MASTERA` + `UNITS-DO-MASTERA` P5-P6

---

## P5 — endTurn hook

1. Backup `main.ts.bak-INTEGRATOR-P5-P6-2026-07-01`
2. Na końcu tury gracza (+ opcjonalnie AI): `collectUnauthorizedBorderPairs` → `applyUnauthorizedBorderPenalties`
3. Opcjonalny `showHintMessage` przy pierwszej karze w turze
4. Save/load — jeśli stan nowy, dopisz do save

---

## P6 — `transferBasketItems`

Zastąp stub `tech` / `jednostka` / `surowiec_boolean`:

- tech → `grantTechToOwner`
- jednostka → `spawnTransferredUnit`
- surowiec_boolean → `grantSurowiecBooleanAccess`

Poprawka: ścieżka tech w `diplomacy-proposals.ts` — **Rel ≥ 100** (W5-A), nie `progWymianaTechZaufanie` 70

---

## Bramka

- `diplomacy-border-march-test.cjs`
- `border-march-scan-test.cjs`
- `diplomacy-basket-transfer-test.cjs`
- `diplomacy-unit-transfer-test.cjs`
- `diplomacy-test.cjs` · `diplomacy-proposal-test.cjs` · `smoke.cjs`
- Build ROBOCZA · meldunek `F-do-MASTER_P5-P6-2026-07-01.md`

---

## DoD

- [ ] Przemarsz działa w grze (playtest: jednostka na obcym terytorium → −5 Zauf.)
- [ ] Tech/jednostka/surowiec realnie przenoszone po dealu
- [ ] Master review → kanon
