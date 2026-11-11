# P6 REPIN — pętla walki ze strzałami (faza dystansowa) + `fieldPower`

Temat: `R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1`, runda 1/5. Kontynuacja
`P6-REPIN-DYSTANS-MULT.md` §4 pkt 1–2.
Baza Rust: `origin/rust-port/parity-v2` `6d74770df`. Źródło web: `origin/main` `cffe39cb9`
(`gra/src/game/combat.ts` `resolveCombat`, „Phase 0: Ranged”, l.1008–1067; `unit-power.ts:122`).

## 1. Dostarczone

| Element | Rust | Web |
|---|---|---|
| Pętla rund strzałów (strzał ATK, strzał DEF, rout/zniszczenie, limit rund, koniec amunicji) | `domain/combat.rs::ranged_phase::resolve_ranged_phase` | `combat.ts:1008-1067` |
| Użycie `ranged_shot_damage` / `hit_chance_tw` / `ranged_shot_accuracy` w walce | tak, wprost w pętli (`hit_bonus = 0`, jak w web) | `combat.ts:1036-1059` |
| `fieldPower` (składnik pocisku × mnożnik klasy / `missile_divisor`) | `domain/unit_power.rs::field_power`, `UnitPowerCoeffs::from_params` | `unit-power.ts:122` |

Testy (wektory z URUCHOMIONEGO weba, `tests/p6_repin_dystans_petla_gen.mjs`, esbuild 0.24.2, Node 22, mulberry32 seed 6101;
RNG walki = zapisana sekwencja losowań weba, strzały sparsowane z logu weba):
- `p6_repin_dystans_petla.rs` — 600 walk / 2827 strzałów (3 testy),
- `p6_repin_dystans_fieldpower.rs` — 400 jednostek, w tym połówki (`Math.round`).

## 2. Założenia (luki rozstrzygnięte bez ABC)

1. ZAŁOŻENIE: zakres to WYŁĄCZNIE faza dystansowa. `resolve_ranged_phase` przyjmuje statystyki PO modyfikatorach
   (`atkMelee0`, `atkMissile0`, `defPanc0`, `defFinalObrona`, `terrRiverMult`, HP, amunicja, próg dezercji, kontra).
   Ich wyliczenie (civ/budynki/trudność/głód/weterani/teren/flanka) i faza zwarcia pozostają do portu. Funkcja NIE jest
   jeszcze wywołana z `resolve_combat` (model siły) — podpięcie wymaga decyzji o zastąpieniu modelu siły i jest osobnym tematem.
2. ZAŁOŻENIE: pętla żyje w `combat.rs` jako podmoduł `ranged_phase` (bez nowego pliku, bo `domain/mod.rs` jest poza allowlistą).
3. ZAŁOŻENIE: log tekstowy weba nie jest portowany; zamiast niego struktura `RangedShot` (runda, strona, trafienie, %, obrażenia, HP celu).
   Test porównuje je ze strzałami sparsowanymi z logu weba (HP/obrażenia/% bez zaokrągleń `toFixed`).
4. ZAŁOŻENIE: `hit_bonus` w fazie dystansowej = 0 (domknięcie luki 6 z `P6-REPIN-DYSTANS-MULT.md`: wywołania `combat.ts:1036`
   i `:1056` nie przekazują bonusu — potwierdzone czytaniem kodu).
5. ZAŁOŻENIE: `UnitPowerCoeffs::from_params` nie dubluje web-owego fallbacku dzielników ≤ 0 (dane w repo są dodatnie).
6. ZAŁOŻENIE: `UnitPowerInput` ma pola `f64` (brak = 0); normalizacja `null`/`''`/`'—'`/NaN po stronie wołającego.
7. `armyFieldPower` (cache `u.fieldPower`, siege = 0) NIE portowane — poza zakresem tego kroku.
8. NIE_ZMIERZONO: wektory mają mnożnik kontry = 1 (web liczył z pustą tabelą `counters`), teren-rzeka (`terrRiverMult` ≠ 1),
   flankę/tyły, mody civ/budynków i weteranów, `canonicalCurrentHp`. Funkcje tych wartości są przekazywane z zewnątrz, więc
   pętla je obsługuje, ale wektorami weba nie sprawdzono ich wyliczenia.
9. Wektory zakładają `hp = health` i `defFinalObrona = Obrona × (1 + structureDefBonusPct/100)` (neutralne mody) — potwierdzone
   zgodnością ze 100% strzałów weba (HP celu po strzale, % trafienia).

## 3. Bramki

Patrz `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1/01-operator-r1.md`.
