# HANDOFF CYWILIZACJE → UNITS: Bonusy walki + bitwa 3D + jednostki specjalne

**Data:** 2026-06-26  
**Od:** CYWILIZACJE (Grupa D)  
**Do:** UNITS (Composer)  
**Flaga:** **GOTOWE** — czeka dyspozycja od MASTER w `dyspozycje/UNITS.md`

---

## Co przesyłam

1. **Dane:** `gra/data/civs.json` → `bonusy[]` per nacja (27 efektów, pole `realizuje: "walka"` = 23 mechaniczne + 9× `jednostka_specjalna` jako dane opisowe)
2. **Kontrakt walki:** `gra/src/game/civ-bonuses.ts`
   - `civCombatStatMultipliers(bonusy, unit, { side, terrain, isChargeRound })`
   - `unitCombatCategory(unit)` → dopasowanie `cel` (piechota/lukownicy/kawaleria/rydwany)
3. **Wpięcie auto-resolve (SILNIK już częściowo):** `combat.ts` → `ResolveCombatOpts.attackerCivBonusy` / `defenderCivBonusy`
4. **Tabela efektów:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md` § realizuje=walka

---

## Co Odbiorca ma zrobić

### Batch A — Bitwa 3D (priorytet)

- [ ] `gra/src/battle/battleScene.ts` — przy `resolveCombat` / `_singleBlow` przekazać bonusy obu stron (jak `main.ts` map auto-resolve)
- [ ] `gra/src/battle/manualBattle.ts` — j.w.
- [ ] Kontrakt: owner jednostki → `civBonusy[]` (prop z init bitwy lub callback z silnika)
- [ ] **NIE** duplikować formuł — import z `civ-bonuses.ts`

**DoD:** `battle-smoke.cjs` ZIELONY; Falanga vs Hastati z bonusami cyw widoczne w HP/obronie

### Batch B — Jednostki specjalne

- [ ] `gra/data/units.json` — wpisy spec. już są (Falanga, Hastati, Impi, …); zweryfikować `"W zamian za"`
- [ ] `gra/src/game/production.ts` — `availableProduction`: dla cyw gracza/AI pokazać jednostkę spec. **zamiast** bazowej (np. Grecy: Falanga zamiast Włócznik)
- [ ] Mapowanie: `civs.json` `typCywilizacji` / `ikonaId` ↔ wpis `jednostka_specjalna` w bonusy[]

**DoD:** Grecy w panelu miasta widzi Falangę; AI Grecy też (przez ten sam filtr + owner civKey)

### Batch C — Testy

- [ ] Rozszerzyć `combat-test.cjs` lub dodać case Grecy obrona / Celtowie szarża
- [ ] `civ-bonusy-test.cjs` już ma sekcję F — utrzymać ZIELONY

---

## Kiedy handoff jest gotowy

**GOTOWE** (dane + kontrakt). Implementacja = UNITS po dyspozycji MASTER.

---

## Uwagi

- `jednostka_specjalna` w bonusy[] = **metadane** (nazwa, opis); mechanika = osobny wiersz w `units.json`
- Warunki terenowe (Inkowie las, Germanie zasadzka): logika w `civ-bonuses.ts` — UNITS tylko przekazuje `defenderTerrain`
- Maciej może zmienić wartości w Excelu później → CYW re-export → UNITS bez zmian kodu

*— CYWILIZACJE, 2026-06-26*
