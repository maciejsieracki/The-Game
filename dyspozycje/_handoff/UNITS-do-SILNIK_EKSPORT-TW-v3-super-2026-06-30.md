# UNITS → SILNIK — EKSPORT TW v3 + super-jednostki (2026-06-30)

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** — main.ts §5 (2026-06-30) · kanon czeka Opus |
| **Decydent** | Maciej |
| **Flaga** | GOTOWE |

---

## 1. Co zdecydowaliśmy (sesja 2026-06-30)

| # | Temat | Decyzja | Status |
|---|-------|---------|--------|
| 1 | Model walki | **TW Rome 2** — Atak/OBR = hit%, Obraż = dmg (A1) | ✅ w `combat.ts` |
| 2 | Moc jednostki (podgląd) | **M = A + O** (NIE 10×A) | ✅ roboczo · auto-walka **CZEKA** |
| 3 | Wzór A / O | A = AP + Obraż + Przeb + Szarża/2 + AD/2 · O = OBR + Panc + HP/2 | roboczy |
| 4 | Skróty tabel | **OBR** = Obrona · **Obraż** = Obrażenia · **AD** = Atak dyst. | kanon komunikacji |
| 5 | Super-y AP/OBR | **1:1** ze starego backupu (Atak 8–10, nie ÷10) | ✅ `units.json` |
| 6 | Super-y Obraż | **10** dla wszystkich 7 super | ✅ `units.json` |
| 7 | Super-y reszta | Panc **6**, Przeb **4**, Szarża **8** (Triari/uThulwana **10**) | ✅ |
| 8 | dmg zwarcie | `max(0, Obraż−Panc)+Przeb+Szarża(r1)` | roboczo w silniku · bez formalnego ABC |

---

## 2. Co zrobiliśmy (pliki)

| Plik | Zmiana |
|------|--------|
| `gra/data/units.json` | 7 super-jednostek — pełne staty EN TW v3 |
| `gra/data/units.json.bak-SUPER-fix-2026-06-30` | backup przed poprawką super |
| `gra/tools/migrate-units-tw-v3.py` | OVERRIDES super + Hastati/Konnica (anty-regresja) |
| `gra/src/game/combat.ts` | TW v3 Faza 1 (`hitChanceTw`, `damageTw`, `combatUnitFromDef`) |
| `gra/tools/combat-test.cjs` | 6/6 PASS · testy super (Gwardia Sumeru, Medżaj) |
| `docs/WALKA-TW-v3.md` | nomenklatura skrótów + reguła super ÷10 |
| `dyspozycje/UNITS-DO-MASTERA.md` | meldunek super |

**Nie ruszano:** publikacja kanonu `Gra-podglad.html` (MASTER + Opus).

---

## 3. Kanon super-jednostek (7×) — `units.json`

Pola EN = to czyta silnik przez `combatUnitFromDef`.

| Jednostka | AP | OBR | Obraż | Panc | Przeb | Szarża | HP | AD |
|-----------|---:|----:|------:|-----:|------:|-------:|---:|---:|
| Gwardia Królewska Sumeru | 10 | 8 | 10 | 6 | 4 | 8 | 21 | 0 |
| Hieros Lochos | 8 | 10 | 10 | 6 | 4 | 8 | 21 | 0 |
| Hu Ben Wei | 10 | 7 | 10 | 6 | 4 | 8 | 20 | 0 |
| Królewska Gwardia | 10 | 8 | 10 | 6 | 4 | 8 | 20 | 0 |
| Medżaj | 10 | 8 | 10 | 6 | 4 | 8 | 21 | 6 |
| Triari | 8 | 8 | 10 | 6 | 4 | 10 | 21 | 0 |
| uThulwana | 8 | 7 | 10 | 6 | 4 | 10 | 21 | 0 |

Wspólne: `Super-jednostka: TAK` · Morale 120 · +15% vs włócznik · max 1 · stolica · respawn.

Marker w JSON: `"_super_tw_v3": "2026-06-30"`.

---

## 4. Reguła migracji — dlaczego super-y były zepsute

| Skala w starym JSON | Przykład | Reguła ÷10 | Poprawna reguła |
|---------------------|----------|------------|-----------------|
| 0–100 (standard) | Wojownik Atak 45 → AP 4 | ÷10 | ÷10 |
| **TW-like (super)** | Triari Atak **8** | ÷10 → **1** ❌ | **1:1** → 8 ✅ |

**Przyczyna buga:** migracja `--from-backup` zastosowała ÷10 do superów (małe liczby 6–10). Audyt naprawił linię standardową; super-y zostały przy 1/1/1.

**Fix:** OVERRIDES w `migrate-units-tw-v3.py` — **nie uruchamiać** `--from-backup` bez overrides.

---

## 5. Eksport do silnika — jak dane płyną

```
units.json (EN)
    ↓ lookupUnitDef(typeId)
main.ts: unitDefFor / unitHealth / unitAtak / unitObrona
    ↓ battleUnitToCombatUnit → combatUnitFromDef
combat.ts: resolveCombat (TW v3)
```

### Co już działa (F3 częściowo)

- `main.ts`: import `combatUnitFromDef`, `hitChanceTw`, `resolveCombat`
- `battleUnitToCombatUnit` → **EN z JSON**
- `unitHealth` → `health` (fallback `Health`)
- `unitAtak` / pre-bitwa → `meleeAttack`
- Auto-walka mapy (klik wroga, AI) → `resolveCombat` + EN defs
- `battleScene.ts`: `toCombatUnit` → `combatUnitFromDef`

### Co SILNIK ma jeszcze poprawić (resztki PL)

| Plik | Linia ~ | Problem |
|------|---------|---------|
| `main.ts` | 2831–2836 | `runtimeUnitToSiegeUnit` — `Atak`/`Obrona`/`Health` zamiast EN |
| `main.ts` | 6729–6730 | AI auto-walka — `hp: def['Health']` zamiast `unitHealth(def)` |
| `main.ts` | 1248, 3673 | `def['Health']` — fallback OK jeśli brak `health` |
| `battleScene.ts` | 4665, 4772, 7585 | taktyczna 3D — `Atak`/`Uderzenie` w UI/szarży (osobny batch) |

**DoD eksportu:** auto-walka mapy + pre-bitwa używają TW v3 na EN z JSON · super-y AP≥8 Obraż=10.

---

## 6. Wyjątki balansu w `units.json` (OVERRIDES)

| Jednostka | Pole | Wartość | Powód |
|-----------|------|--------:|-------|
| Hastati | AP, Obraż | 8, 8 | nerf playtest |
| Konnica | AP | 30 | playtest |
| 7× super | patrz §3 | — | skala TW, nie ÷10 |

---

## 7. Wzory silnika (kanon)

```
hit% = clamp(40 + meleeAttack − meleeDefence_wroga + bonusy, 15, 75)
dmg  = max(0, weaponDamage − armor_wroga) + piercing + chargeBonus (r1, atakujący)
pilum = max(1, missileAttack − armor) × ilość pocisków
```

Stałe: `gra/data/combat-params.json` → `tw_v3`.

---

## 8. Moc intrinsic (podgląd — przyszła auto-walka)

```
A = AP + Obraż + Przeb + Szarża/2 + AD/2
O = OBR + Panc + HP/2
M = A + O
```

Skrypt: `gra/tools/intrinsic-unit-power.py` · **nie wpinać do silnika** bez decyzji o auto-walki.

---

## 9. Bramka testów (przed kanonem)

```bash
cd gra
node tools/combat-test.cjs          # 6/6 PASS
node tools/smoke.cjs
node tools/battle-smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
```

---

## 10. DoD dla SILNIK / MASTER

- [x] `units.json` — super-y zamknięte (2026-06-30)
- [x] `combat.ts` TW v3 Faza 1
- [x] `combat-test.cjs` 6/6
- [x] `main.ts` — resztki PL (§5) batch 2026-06-30: siege EN map, barbar HP, fallback EN
- [ ] `battleScene.ts` taktyczna — opcjonalnie osobny batch
- [ ] Build + 17 suitów + Opus → `Gra-podglad.html`

---

## Referencje

- `docs/WALKA-TW-v3.md`
- `dyspozycje/_handoff/UNITS-do-SILNIK_TW-v3-walka-rome2.md` (F1–F3 ogólny)
- `gra/tools/TW-v3-audyt-jednostek.md`
- Backup archiwum PL: `gra/data/units.json.bak-TW-v3-2026-06-29`
