# P6 REPIN — mnożnik obrażeń pocisku (dystans), FALA 603

Temat: `R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1`, runda 1/5.
Źródło web: `R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1`, kod `a259012fa`, baza weba `origin/main` `638e90bea`.
Baza Rust: `origin/rust-port/parity-v2` `43f4064b0`.

## 1. Co jest w webie (zmierzone, plik:linia na `origin/main`)

| Element | Web | Uwagi |
|---|---|---|
| Parametr `ranged_damage_mult` (slinger 3, lucznik_piesi 2) | `gra/data/combat-params.json` (blok `ranged_damage_mult`) | źródło prawdy |
| Mnożnik klasy strzelca | `gra/src/game/unit-power.ts:26` `rangedDamageMultFor` | Slinger x3; Distance + nazwa `łucznik…` x2; reszta x1 |
| Celność pocisku | `gra/src/game/combat.ts:476` `rangedShotAccuracy` | max(wręcz, dystansowy) |
| Obrażenia pocisku | `gra/src/game/combat.ts:485` `rangedShotDamage` | `rangeDamageTw` (l.468) * kontra * mnożnik, round, podłoga 1 |
| Użycie w auto-walce | `gra/src/game/combat.ts:1036-1059` | celność + obrażenia obu stron |
| Użycie w bitwie animowanej | `gra/src/battle/battleScene.ts:8964` | `rangeDamage(...) * rangedDamageMultFor(...)` |
| Moc polowa (pocisk) | `gra/src/game/unit-power.ts:122` `fieldPower` | `missileAttack * rangedDamageMultFor / missileDivisor` |

## 2. Co jest w Rust (`origin/rust-port/parity-v2` 43f4064b0)

| Element | Rust | Stan |
|---|---|---|
| Parametr `ranged_damage_mult` | brak w `rust-port/engine/data/combat-params.json` przed tą partią | DODANY (kopia z web) |
| Struktura parametru | brak w `src/data/units_combat.rs` (`CombatParamsFile`, `deny_unknown_fields`) | DODANA `RangedDamageMultParams` (i64) |
| Mnożnik klasy strzelca | brak | PORT: `domain/unit_power.rs::ranged_damage_mult_for` |
| Celność pocisku | brak | PORT: `ranged_shot_accuracy` |
| `rangeDamageTw` | brak | PORT: `range_damage_tw` |
| Obrażenia pocisku | brak | PORT: `ranged_shot_damage` (round JS, podłoga 1) |
| `hitChanceTw` (tw_v3) | brak | PORT: `hit_chance_tw` (parametry z `tw_v3`) |
| Petla walki per runda (strzały, kontry, pancerz) | `domain/combat.rs:319` `resolve_combat` — model siły (`effective_strength` l.267: atak*HP*morale*kontra*teren*struktury), BEZ strzałów i BEZ `missileAttack` | BRAK — nie portowane (patrz §4) |
| `missileAttack` | parsowane w `src/data/units_combat.rs` (l.158), przenoszone w `domain/turn_economy.rs:632` | tylko dane, nie użyte w walce |
| `fieldPower` / `armyFieldPower` (unit-power) | brak modułu; `unit_power` w danych (`missile_divisor`) nieużyty | BRAK — nie portowane |
| `battle/**` | katalog nie istnieje w `src/` | BRAK |

## 3. Testy i wektory

- Plik testowy: `rust-port/engine/tests/p6_repin_dystans_formulas.rs` (8 testów, prefiks `p6_repin_dystans_`).
- Wektory: `rust-port/engine/tests/p6_repin_dystans_vectors/` —
  - `dystans-mult.json`: 19 wejść typu (Slinger, Procarz/Huaracoc, Łucznik/odmiany/wielkość liter/spacje, Oszczepnik, Mount, Melee/Oblężnicza z nazwą Łucznik, brak pól, Typ ` Distance` ze spacją, Infantry).
  - `dystans-shots.json`: 2400 strzałów (4 strzelców x 12 pocisków x 10 pancerzy x 5 kontr) + 80 przypadków polowek (JS `Math.round`, np. 1.5 -> 2).
  - `dystans-acc.json`: 8 celności max, 6 `hitChanceTw` (clamp 15..75), 4 `hitChanceTw` z celnością max.
- Generacja: `git archive origin/main gra/src gra/data` do katalogu poza repo, esbuild 0.24.2 bundle `game/unit-power.ts` + `game/combat.ts`, Node 22.22.0, skrypt generujący wektory uruchomiony na zbundlowanym kodzie weba (nie na przepisanej kopii).
- Wynik lokalny: `cargo test --test p6_repin_dystans_formulas` 8/8 PASS; `cargo test --lib` 22/22 PASS (baseline 22); `cargo test --test data_compliance` 40/40 PASS (baseline 40; liczniki N1/N2 nietknięte — pola mnożników są i64, żeby round-trip nie dał N2).

## 4. Luki (ZAŁOŻENIA do akceptacji)

1. ZAŁOŻENIE: w Rust NIE MA jeszcze pętli walki per runda ze strzałami, więc mnożnik nie jest podpięty do `resolve_combat`. Zastosowanie w walce wymaga osobnego tematu (port `combat.ts` rund/strzałów, albo decyzji, że Rust zostaje na modelu siły). Ten temat dostarcza wyłącznie formuły i parametr.
2. ZAŁOŻENIE: `fieldPower` (moc polowa) nie jest portowane — brak `unit_power` w Rust. Składnik pocisku `missileAttack * mnożnik / missileDivisor` jest do dołączenia, gdy powstanie `fieldPower`.
3. ZAŁOŻENIE: `src/data/units_combat.rs` zmieniony (dodane pole `ranged_damage_mult` w `CombatParamsFile` i struct `RangedDamageMultParams`), bo `deny_unknown_fields` wywracałoby parsowanie `combat-params.json` z nowym kluczem. Dispatch dopuszcza `data/**` dla kopii parametru; tu traktowane jako ten sam zakres.
4. ZAŁOŻENIE: wartości mnożników w Rust są `i64` (jak w JSON), konwertowane do f64 w `unit_power.rs`.
5. NIE_ZMIERZONO: zachowanie walki w web po zmianie (wpływ na wyniki bitew) — nie porównywano wyników całej bitwy, tylko formuły.
6. NIE_ZMIERZONO: `hitChanceTw` z niezerowym `hitBonus` — w wektorach `hitBonus = 0`; wywołania w web `combat.ts:1036` i `:1056` nie były analizowane pod kątem bonusu trafienia.
