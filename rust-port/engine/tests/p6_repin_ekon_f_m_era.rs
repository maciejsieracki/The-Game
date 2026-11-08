//! REPIN-EKONOMIA-F partia 1 (temat R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1, runda 2):
//! mnoznik zuzycia obywateli m(e) = 1 + 0,5 x (floor(e) - 1), port 1:1 z webem
//! `gra/src/game/citizen-consumption-era.ts` (`citizenConsumptionEraMultiplier`, pin web `origin/main`
//! `16c0509f6`). Wartosci sa wielokrotnosciami 0,5 -> dokladne w f64, asercje `assert_eq!`.
//!
//! Pokrycie: N-1 / N / N+1 dla kazdego progu epoki, ulamki (floor), NaN, +-Inf, e < 1, zera, ujemne.

use civ_engine::domain::resource_production::{
    citizen_consumption_era_multiplier, CITIZEN_CONSUMPTION_ERA_STEP,
};

#[test]
fn step_is_half_of_base() {
    assert_eq!(CITIZEN_CONSUMPTION_ERA_STEP, 0.5);
}

/// Tabela web: epoka 1 x1, 2 x1,5, 3 x2, 4 x2,5, 5 x3.
#[test]
fn canonical_epoch_table() {
    let expected = [(1.0, 1.0), (2.0, 1.5), (3.0, 2.0), (4.0, 2.5), (5.0, 3.0)];
    for (era, want) in expected {
        assert_eq!(citizen_consumption_era_multiplier(era), want, "era={era}");
    }
}

/// N-1 / N / N+1 dla kazdego progu: m(N-0,001) = m(N-1), m(N) i m(N+0,001) = m(N).
#[test]
fn threshold_n_minus_one_n_plus_one() {
    for n in 1..=8_i32 {
        let nf = n as f64;
        let m_n = 1.0 + 0.5 * (nf - 1.0);
        let m_prev = if n >= 2 { 1.0 + 0.5 * (nf - 2.0) } else { 1.0 };
        // N-1 (tuz ponizej progu): poprzednia epoka
        let below = nf - 0.001;
        let want_below = if n >= 2 { m_prev } else { 1.0 };
        assert_eq!(
            citizen_consumption_era_multiplier(below),
            want_below,
            "below n={n}"
        );
        // N (prog): biezaca epoka
        assert_eq!(citizen_consumption_era_multiplier(nf), m_n, "at n={n}");
        // N+1 (tuz powyzej progu): nadal biezaca epoka (floor)
        assert_eq!(
            citizen_consumption_era_multiplier(nf + 0.001),
            m_n,
            "above n={n}"
        );
    }
}

/// Epoki ulamkowe zaokraglane w dol (web: Math.floor).
#[test]
fn fractional_eras_floor_down() {
    assert_eq!(citizen_consumption_era_multiplier(2.5), 1.5);
    assert_eq!(citizen_consumption_era_multiplier(2.9999), 1.5);
    assert_eq!(citizen_consumption_era_multiplier(3.9), 2.0);
    assert_eq!(citizen_consumption_era_multiplier(1.999), 1.0);
}

/// Epoka < 1 (w tym ulamki ponizej 1) -> neutralnie 1.
#[test]
fn below_one_is_neutral() {
    for era in [0.0, -0.0, 0.5, 0.999, -1.0, -3.0, f64::MIN] {
        assert_eq!(citizen_consumption_era_multiplier(era), 1.0, "era={era}");
    }
}

/// NaN i nieskonczonosci -> 1 (web: !Number.isFinite -> 1).
#[test]
fn non_finite_is_neutral() {
    assert_eq!(citizen_consumption_era_multiplier(f64::NAN), 1.0);
    assert_eq!(citizen_consumption_era_multiplier(f64::INFINITY), 1.0);
    assert_eq!(citizen_consumption_era_multiplier(f64::NEG_INFINITY), 1.0);
}

/// Duze, ale skonczone epoki rosna liniowo (bez obcinania) — zgodnie ze wzorem webowym.
#[test]
fn large_finite_era_is_linear() {
    assert_eq!(citizen_consumption_era_multiplier(11.0), 6.0);
    assert_eq!(
        citizen_consumption_era_multiplier(1e6),
        1.0 + 0.5 * (1e6 - 1.0)
    );
}

/// Monotonicznosc: m nie maleje wraz z epoka (N-1 .. N+3).
#[test]
fn monotone_non_decreasing() {
    let mut prev = citizen_consumption_era_multiplier(1.0);
    for i in 0..60 {
        let era = 1.0 + i as f64 * 0.1;
        let m = citizen_consumption_era_multiplier(era);
        assert!(m >= prev, "era={era} m={m} prev={prev}");
        prev = m;
    }
}

/// Runda 3: m(e) jest WPIETY w oba wolajace (jedna funkcja dla gracza i AI, jak w webie):
/// koszt racji zywnosci (`ration_era_food_cost_multiplier`) i stawka drenazu surowcow
/// (`citizen_upkeep_rate_for_era` = 1,0 x m(e)). Brak galezi po `owner_id` - tylko `era`.
#[test]
fn m_of_e_is_wired_into_ration_and_upkeep_rate() {
    use civ_engine::data::economy_society::parse_citizen_resource_upkeep;
    use civ_engine::domain::city_growth::p6_7a::growth_v85::ration_era_food_cost_multiplier;
    use civ_engine::domain::resource_production::{
        citizen_upkeep_rate_for_era, CITIZEN_UPKEEP_RATE_PER_CITIZEN,
    };
    let table = parse_citizen_resource_upkeep().expect("tabela");
    let eras = [
        f64::NEG_INFINITY,
        -1.0,
        0.0,
        0.999,
        1.0,
        1.999,
        2.0,
        2.001,
        2.999,
        3.0,
        3.999,
        4.0,
        5.0,
        6.0,
        1e6,
        f64::NAN,
        f64::INFINITY,
    ];
    for era in eras {
        let m = citizen_consumption_era_multiplier(era);
        assert_eq!(ration_era_food_cost_multiplier(era), m, "ration era={era}");
        assert_eq!(
            citizen_upkeep_rate_for_era(&table, era),
            CITIZEN_UPKEEP_RATE_PER_CITIZEN * m,
            "upkeep era={era}"
        );
    }
    // 4+ epoka NIE jest juz obcinana do 4x jak w pinie (1/2/4): era 5 => 3x
    assert_eq!(ration_era_food_cost_multiplier(5.0), 3.0);
    assert_eq!(ration_era_food_cost_multiplier(3.0), 2.0);
}
