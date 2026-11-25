//! R-RUSTPORT-P4-FQ-SPEED-Q1: prędkość bitwy gracza (`speedMul`) — `SPEED_STEPS` i `_setSpeedIdx` z pinu `07d2fbd72`
//! (`gra/src/battle/battleScene.ts:2551-2555`, `:9512-9536`) oraz klatka sesji `FF_STEP_MS = 16 * speedMul` (`:9419`).
//! Zgodność pełnych bitew z pinem przy prędkościach 2..512 pilnuje `p6_k5loop_wiring_a_pin.rs`
//! (`predkosc_bitwy_wektory_pinu_bajt_w_bajt`).

#![allow(clippy::float_cmp)]

use civ_engine::domain::siege_tactics_clock::{speed_step_index, VirtualClock, SPEED_STEPS};
use civ_engine::domain::siege_tactics_fastforward::{ff_step_ms, BATTLE_FRAME_WALL_MS};

/// `SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]` (`:2551`).
#[test]
fn speed_steps_jak_pin() {
    assert_eq!(
        SPEED_STEPS,
        [1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 128.0, 256.0, 512.0]
    );
}

/// `_setSpeedIdx(idx, { clamp })` (`:9518-9523`): bez `clamp` zawinięcie `((idx % n) + n) % n` (cykl `_cycleSpeed`
/// `:9536`: 512 → 1, także ujemne), z `clamp` przycięcie do `0..=9` (panel ± `:9531-9533`).
#[test]
fn set_speed_idx_zawija_albo_przycina_jak_pin() {
    for i in 0..10_i64 {
        assert_eq!(speed_step_index(i, false), usize::try_from(i).unwrap());
        assert_eq!(speed_step_index(i, true), usize::try_from(i).unwrap());
    }
    // `_cycleSpeed` z 512x wraca do 1x.
    assert_eq!(speed_step_index(10, false), 0);
    assert_eq!(speed_step_index(23, false), 3);
    // JS `((idx % n) + n) % n` dla ujemnych.
    assert_eq!(speed_step_index(-1, false), 9);
    assert_eq!(speed_step_index(-11, false), 9);
    assert_eq!(speed_step_index(-10, false), 0);
    // Panel ± bez zawijania.
    assert_eq!(speed_step_index(10, true), 9);
    assert_eq!(speed_step_index(1000, true), 9);
    assert_eq!(speed_step_index(-1, true), 0);
    assert_eq!(speed_step_index(i64::MIN, true), 0);
    assert_eq!(speed_step_index(i64::MAX, true), 9);
    assert_eq!(speed_step_index(i64::MIN, false), 2, "i64::MIN rem_euclid 10");
}

/// `FF_STEP_MS = _scaledWallDelta(16) = clamp(16, 0, 100) * speedMul` (`:9419`, `:9512-9515`): clamp dotyczy delty
/// ŚCIENNEJ przed mnożeniem, więc klatka rośnie liniowo do 8192 ms przy 512x (brak sufitu efektywnej klatki).
#[test]
fn klatka_przewijania_rosnie_bez_sufitu() {
    let mut c: VirtualClock<()> = VirtualClock::new();
    for k in SPEED_STEPS {
        c.speed_mul = k;
        assert_eq!(ff_step_ms(&c), BATTLE_FRAME_WALL_MS * k, "x{k}");
        // Delta ścienna > 100 ms (karta w tle) jest przycinana PRZED mnożeniem.
        assert_eq!(c.scaled_wall_delta(1_000.0), 100.0 * k, "x{k}");
    }
    c.speed_mul = 512.0;
    assert_eq!(ff_step_ms(&c), 8192.0);
}

/// Czas rzeczywisty przy `speedMul = k`: `_advanceVClock` (`:9500-9511`) przesuwa `vNow` o `16 * k` na klatkę 16 ms,
/// czyli tą samą siatką co przewijanie (klatka ciała sesji D-FQ-1 jest wspólna dla obu trybów).
#[test]
fn czas_rzeczywisty_ta_sama_siatka_co_przewijanie() {
    for k in SPEED_STEPS {
        let mut c: VirtualClock<()> = VirtualClock::new();
        c.speed_mul = k;
        c.advance_v_clock(16.0);
        for i in 1..=5 {
            c.advance_v_clock(16.0 + 16.0 * f64::from(i));
            assert_eq!(c.v_now, ff_step_ms(&c) * f64::from(i), "x{k} klatka {i}");
        }
    }
}
