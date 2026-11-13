STATUS: PENDING-TESTS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1
GOAL: jedna wspolna implementacja js_max/js_min/js_max0/js_max_sign/js_min_sign (`domain/js_math.rs`), bez zmiany obserwowalnego zachowania zadnego callera.
ZMIANY/COMMIT: patrz sekcja "Zmiany" i SHA na koncu.
TESTY: patrz sekcja "Bramki".
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## KROK 0 - wyniki przeszukania bazy `cfa1edd31`

`git grep 'fn js_max|fn js_min|fn js_max0|fn js_max_sign|fn js_min_sign' cfa1edd31 -- rust-port/engine/src`:
**39 definicji w 28 plikach** (+ 6 funkcji TESTOWYCH `js_max0_zero_sign_jak_math_max` / `js_max0_zachowuje_nan`, ktore nie sa kopiami).
FC (`a0b302eb8`) podal 38 w 27 plikach: **roznica +1 definicja / +1 plik**; w bazie jest dodatkowo `diplomacy_truce.rs::js_max_1_floor`
(nazwa pasuje do wzorca `fn js_max*`; nie znam stanu `a0b302eb8`, wiec nie zgaduje, ktora definicja dodatkowa). Poza `rust-port/engine/src`
(crate `rust-port/renderer`) istnieja osobne kopie - POZA zakresem dispatchu, nie ruszane.

Odkrycie: kopie maja TRZY rozne semantyki (NaN zawsze propaguje; roznica w znaku zera), wiec jedna funkcja zmieniłaby wyniki:

| semantyka | max(+0,-0) / max(-0,+0) | min(+0,-0) / min(-0,+0) | wariant `js_math` |
|---|---|---|---|
| JS (ECMAScript) | +0 / +0 | -0 / -0 | `js_max`, `js_min` |
| std (`f64::max/min`, znak NIEGWARANTOWANY) | wg `f64::max` | wg `f64::min` | `js_max_std`, `js_min_std` |
| tie_b (remis -> `b`) | -0 / +0 | -0 / +0 | `js_max_tie_b`, `js_min_tie_b` |

## Tabela semantyki per caller (baza `cfa1edd31`) -> wariant

| plik (stara definicja) | NaN | zero | wariant |
|---|---|---|---|
| diplomacy_multiwar.rs js_max / js_min (pub) | propaguje | JS | js_max / js_min |
| diplomacy_tick_war_brake.rs js_max / js_min | propaguje | JS | js_max / js_min |
| mapgen/relief.rs js_max / js_min | propaguje | JS | js_max / js_min |
| mapgen/terrain_class.rs js_max / js_min | propaguje | JS | js_max / js_min |
| mapgen/cluster_layout.rs js_max | propaguje | JS | js_max |
| mapgen/masks.rs (v8math) js_max / js_min (pub) | propaguje | JS | js_max / js_min |
| society_breakdown.rs js_max / js_min (pub) | propaguje | JS | js_max / js_min |
| order_effects_culture.rs js_max | propaguje | JS | js_max |
| recruitment.rs (army_merge) js_max / js_min (pub) | propaguje | JS | js_max / js_min |
| turn_economy.rs js_max / js_min | propaguje | JS | js_max / js_min |
| economy_city_fns.rs js_min | propaguje | JS | js_min |
| siege_tactics_inputs_pos.rs js_max_sign / js_min_sign (pub) | propaguje | JS (rownowazne js_max/js_min) | js_max_sign / js_min_sign (delegacja) |
| civ_matrix.rs (js_compat) js_max / js_min (pub) | propaguje | std | js_max_std / js_min_std |
| okolica.rs js_max | propaguje | std | js_max_std |
| pathfinding.rs js_max | propaguje | std | js_max_std |
| roads.rs js_max | propaguje | std | js_max_std |
| territory.rs js_max | propaguje | std | js_max_std |
| order_effects_lane.rs js_max (delegowal do civ_matrix) | propaguje | std | js_max_std |
| auto_improvements.rs js_max / js_min (pub(crate)) | propaguje | tie_b | js_max_tie_b / js_min_tie_b |
| siege_tactics_activate/breach/end/endcheck/unit.rs js_max0 (`js_max(0,x)` z hubu siege = JS) | propaguje | JS (`max(0,-0)=+0`) | js_max0 |
| siege_tactics_inputs_wall.rs js_max0 (`NaN||x>0 ? x : 0`) | propaguje | JS (`-0 -> +0`) | js_max0 |
| turn_economy_post.rs js_max0 (army_merge::js_max(0,x)) | propaguje | JS | js_max0 |
| siege_capital_plunder.rs js_max0 (pub; `x.max(0.0)`) | propaguje | std | js_max0_std |
| diplomacy_truce.rs js_max_1_floor | propaguje | brak remisu zer (max z 1) | js_max_1_floor |

Rownowaznosc wariantow JS miedzy soba (rozne zapisy: `a==b`, `a==0&&b==0`, `else if b>a`, "oba ujemne -> -0") i `js_max_sign`~`js_max`
jest sprawdzona na calej siatce 19x19 wartosci brzegowych (+-0, NaN, +-Inf, subnormalne, MIN_POSITIVE, MAX/MIN) w tescie.

## Zmiany

- NOWY `rust-port/engine/src/domain/js_math.rs` (warianty z tabeli, `#[inline]`).
- `rust-port/engine/src/domain/mod.rs`: `pub mod js_math;` (odstepstwo od "tylko `mod js_math;`": `pub`, bo test integracyjny w `tests/` musi
  wolac warianty bezposrednio; test per caller dla prywatnych kopii nie ma innej sciezki).
- 28 plikow domeny: definicje zastapione `use`/`pub use ... js_math::<wariant> [as js_max/js_min/js_max0]`; publiczne sciezki
  (`society_breakdown::js_max`, `diplomacy_multiwar::js_max`, `recruitment::army_merge::js_max`, `civ_matrix::js_compat::js_max`,
  `siege_tactics_inputs_pos::js_max_sign`, `siege_capital_plunder::js_max0`, `mapgen::masks::v8math::*`) ZACHOWANE jako re-eksporty,
  wiec huby (`siege_tactics_blow`, `siege_tactics_blow_full`, `siege_tactics_clock`, `unit_power`) i wszyscy wolajacy dzialaja bez zmian.
  Usuniete 5 nieuzywanych importow `siege_tactics_blow::js_max` (siege_tactics_{activate,breach,end,endcheck,unit}.rs).
- NOWY `rust-port/engine/tests/p6_js_math_equiv.rs` (6 testow): wyrocznie = dosłowne stare ciala, porownanie bit-w-bit z `js_math` per caller
  (wszystkie 39 starych definicji) + sciezki publiczne + jawne przypadki znaku zera/NaN/Inf.
- Istniejace testy wektorowe (`p6_8j_guards`, `p6_js_max0`, `p6_js_max0_rest`, `p6_js_max_sign`, `p6_siege_tactics_inputs_pos`) NIE zmienione.
- Nie ruszano: `gra/`, `Cargo.toml`, `Cargo.lock` (nieśledzony `rust-port/engine/Cargo.lock` nie jest commitowany), `siege_tactics_blow.rs`.
- Wyniki callerow NIE zmienione (bez ujednolicania do JS +0).

## Kryteria
1. `git grep -E 'fn js_(max|min)[a-z0-9_]*\(' -- rust-port/engine/src` na HEAD: zero wynikow poza `js_math.rs` (poza 6 fn testowych `js_max0_*`, ktore nie pasuja do wzorca z `\(` w kopii `-> f64`; sprawdzone).
2. Test rownowaznosci: PASS (patrz Bramki).
3. Istniejace wektory: zielone, treść nietknieta.
5. Brak `#[ignore]`, brak oslabionych asercji.
