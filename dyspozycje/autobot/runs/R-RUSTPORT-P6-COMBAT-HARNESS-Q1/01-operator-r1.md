STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-Q1
GOAL: Wektory pinu 07d2fbd72 dla petli dystansu resolveCombat (combat.ts, blok "Phase 0: Ranged") wykonane z TEKSTU pinu w harnessie node, porownane z Rust `ranged_phase::resolve_ranged_phase` na >= 300 przypadkach (NaN/Inf/-0/duze wartosci w HP, obrazeniach, szansie trafienia).
ZMIANY/COMMIT: baza e9b505939 (FC RANGED-DAMAGE-NAN). Branch roboczy `rust-port-wip/R-RUSTPORT-P6-COMBAT-HARNESS-Q1`, commit: SHA w sekcji DEPLOY/PUSH (podany w odpowiedzi orkiestratora). Allowlista: nowe `rust-port/engine/tests/p6_combat_harness.rs`, `rust-port/engine/tests/p6_combat_harness_gen.mjs`, `rust-port/engine/tests/p6_combat_harness_vectors/vectors.json` (644 KB), `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-HARNESS-Q1/**`. `rust-port/engine/src/domain/combat.rs` BEZ ZMIAN: nie znaleziono rozbieznosci Rust vs pin w zakresie testu.
  Straznik generatora: SHA-256 wyciętych fragmentow pinu = 700d16235700836e4c5eb9e49d697556e9e1bbe21331c98dd1d535a314bd7837 (funkcje hitChanceTw, rangedShotAccuracy, rangeDamageTw, rangedShotDamage, rangedDamageMultFor oraz blok petli); SHA-256 combat-params.json = 5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e.
  Co wykonuje harness (TEKST pinu, verbatim): blok petli dystansu od markera "Phase 0: Ranged" do "Phase 1 & 2: Melee"; hitChanceTw, rangedShotAccuracy, rangeDamageTw, rangedShotDamage (combat.ts); rangedDamageMultFor (unit-power.ts); TW = tw_v3 i RANGED_DAMAGE_MULT z combat-params.json. Jedyny stub: RNG = zapisana sekwencja losowan [0,1) (jedno na strzal, kolejnosc ATK, DEF).
  Wejscia petli (atkMelee0, atkMissile0, atkObrona0, atkPanc0, defMelee0, defMissile0, defPanc0, defFinalObrona, terrRiverMult, ctrAtkVsDef, ctrDefVsAtk, routAtk, routDef, hpAtk, hpDef, ammo, totalRounds, maxRounds, flagi isRanged, unbreakable) sa wartosciami wstrzykiwanymi (wynik czesci przed petla). Ich wyprowadzenie z civ/budynkow/terenu NIE jest testowane (patrz NIE_ZMIERZONO).
RUNDY: 1/5 (Operator, HAIKU)
TESTY:
  - `cargo test --test p6_combat_harness`: 2 passed (wektory: 700 przypadkow, 1156 strzalow; plus test jawny NaN rollu i NaN HP).
  - Liczniki wektorow (z generatora): cases=700, shots=1156, trafienia z hitPct=NaN: 185, obrazenia NaN: 25, obrazenia Infinity: 22, przypadki z NaN HP (koncowe): 65, przypadki z -Infinity HP: 54, przypadki z roztopieniem: 142; w pliku 428 wystapien "-0" i 359 "-Infinity" (jako napisy).
  - Porownanie: NaN==NaN; pozostale wartosci zmiennoprzecinkowe bit-w-bit (rozroznia -0 od +0); liczba rund, amunicja, rout (strona), liczba strzalow, runda/strona/trafienie/hitPct/obrazenia/HP celu kazdego strzalu.
  - `cargo test --lib`: 94 passed.
  - `cargo test --test combat --test p6_ranged_damage_nan --test p6_repin_dystans_petla --test p6_repin_dystans_formulas`: wszystkie zielone (7, 7, 3, 8 passed).
  - `cargo fmt --check` (rust-port/engine): exit 0 (plik testu sformatowany rustfmt --edition 2021).
  - `cargo clippy --all-targets -- -D warnings`: exit 0.
  - Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (scratchpad/target-combat) - do usuniecia po zapisie raportu.
  - Generator: `node rust-port/engine/tests/p6_combat_harness_gen.mjs` (Node 22.23.4, stripTypeScriptTypes).
ODKRYTE PODCZAS PRACY (nie rozbieznosci logiki, tylko kodowanie wektorow):
  - serde_json bez float_roundtrip potrafi zaokraglic liczbe JSON o 1 ULP (np. 1e308 jako liczba JSON). Wektory emituja niecalkowite liczby i wartosci |x| >= 2^53 jako napisy (String(x) z JS, parsowane przez Rust f64::from_str). Bez tego test wykazal falszywe rozbieznosci o 1 ULP (przyp. 67 i 310 w pierwszej iteracji).
BLOKADY:
  - NIE_ZMIERZONO: faza zwarcia (melee) nie jest objeta wektorami (Rust jej nie portuje: "Faza zwarcia nie jest portowana" w combat.rs).
  - NIE_ZMIERZONO: obliczenia PRZED petla dystansu (civ/budynki/teren/weterani/glod/zlota-deficyt/flank/struktury, resolveAmmo, routThreshold, counterMultiplier, terrain*) - wejscia sa wstrzykiwane, a nie wyprowadzane z pinu w tym tescie.
  - NIE_ZMIERZONO: `combat::resolve` (top-level, combat.rs:379) nie jest porownywane - nie implementuje petli dystansu z pinu; porownywany jest port fazy dystansowej `combat::ranged_phase::resolve_ranged_phase` (ta sama petla co blok pinu). Zgodnie z dyspozycja nie zmieniano tej funkcji.
  - NIE_ZMIERZONO: log tekstowy - Rust nie produkuje logu; porownywane sa zdarzenia strzalow wyprowadzone z logu pinu (regex na linie "[Dyst-ATK|DEF]").
  - Zakres typow: maxRounds jako liczba calkowita 0..8 (Rust: u32); amunicja jako calkowita (Rust: i64), NaN/Infinity w tych polach poza zakresem typow Rust - NIE_ZMIERZONO.
  - Dla NaN/Infinity w rolu RNG: wektory zawieraja tylko skonczone losowania [0,1); NaN w RNG nie jest mozliwe w pinie (rng()*100 jest skonczony).
  - Dysk przed startem: 4.4 GB wolnego (< 6 GB); kompilacja wykonana mimo to, zgodnie z dyspozycja.
NASTEPNY KROK: Final Control (Sonnet): sprawdzic allowliste, reprodukowalnosc generatora (straznik SHA), zakres NIE_ZMIERZONO; ewentualnie rozszerzyc o faze zwarcia w osobnym temacie.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; bez push, bez integracji).
