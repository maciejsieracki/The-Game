//! P6 SIEGE-TAKTYKA K5i-2a3 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A3-Q1): czyste wejscia muru dla `_singleBlow`.
//!
//! Pin `07d2fbd72`. Porty 1:1 (wejscia jawne, bez stanu sceny):
//! * [`city_wall_defense_bonus_percent`] = `cityWallDefenseBonusPercent` (`gra/src/game/city-defense.ts:57-84`).
//! * [`wall_defense_totals`] = blok konstruktora `BattleScene` (`battleScene.ts:2750-2759`): `wallDefenseMult`
//!   (`1 + totalProc/100`) i `wallDefenseTotalProc`, z domyslnymi wartosciami `miasto-params.json` (`?? 200/150/100/100/100`).
//! * [`defender_inside_fortification`] / [`fortification_defense_bonus_for_unit`]
//!   (`city-defense.ts:113-117`, `124-129`) i [`wall_bonus_proc_for`] = `_wallBonusProcFor` (`battleScene.ts:7459-7464`).
//! * [`has_mur`] (`:8848`), [`city_terr_mult`] (`:8850-8852`) i [`terr_def_mult`] (`:8855-8857`) - zlozenie mnoznika
//!   terenu obroncy w `_singleBlow`; `cityGatedTerrainMultiplier`/`terrainDefenseMultiplier` wchodza jako wartosc
//!   (portowane w K5i-2a1).
//! * [`field_fortify_defense_bonus`] = `fieldFortifyDefenseBonus` (`city-defense.ts:237-245`), przeniesiona z
//!   `siege_tactics_blow_inputs.rs` (tam miala wolajacego tylko w tescie jednostkowym).
//!
//! Kolumny sceny sa `f64` (pin: `number`), zeby NaN/Inf zachowywaly semantyke porownan JS.

/// Parametry `CityDefenseBonusParams` (`city-defense.ts:36-48`). `None` = brak pola (`undefined`/`null`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityDefenseBonusParams {
    pub mur: f64,
    pub cytadela: f64,
    pub baszta: f64,
    pub palisada: Option<f64>,
    pub mur_kamienny: Option<f64>,
}

/// `cityWallDefenseBonusPercent` (city-defense.ts:57-84): suma bonusow obronnych w % (np. 400 = +400%).
/// `built = None` (null/undefined) = brak budynkow.
pub fn city_wall_defense_bonus_percent<S: AsRef<str>>(
    built: Option<&[S]>,
    params: &CityDefenseBonusParams,
) -> f64 {
    let has = |id: &str| built.is_some_and(|b| b.iter().any(|s| s.as_ref() == id));
    let has_mury = has("mury");
    let has_kamienne = has("mury_kamienne");
    let has_fort = has("fort");
    let has_baszta = has("baszta");
    let has_palisada = has("palisada");
    let palisada_proc = params.palisada.unwrap_or(100.0);

    let mut total = 0.0;
    if has_mury {
        total += params.mur;
        if has_fort {
            total += params.cytadela;
        }
    } else if has_kamienne {
        total += params.mur_kamienny.unwrap_or(150.0);
        if has_fort {
            total += params.cytadela;
        }
    } else if has_fort {
        total += params.mur + params.cytadela;
    } else if has_palisada {
        total += palisada_proc;
    }
    if has_baszta {
        total += params.baszta;
    }
    total
}

/// Wartosci `miasto-params.json` (`bonus_obrona_*_proc.wartosc`); `None` = brak pola -> domyslna z pinu.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct MiastoWallParamValues {
    pub mur: Option<f64>,
    pub mur_kamienny: Option<f64>,
    pub cytadela: Option<f64>,
    pub baszta: Option<f64>,
    pub palisada: Option<f64>,
}

/// Wynik bloku konstruktora (battleScene.ts:2750-2759).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WallDefenseTotals {
    /// `wallDefenseMult` = `1 + totalProc / 100`.
    pub mult: f64,
    /// `wallDefenseTotalProc`.
    pub total_proc: f64,
}

/// Blok konstruktora `BattleScene` (battleScene.ts:2750-2759).
pub fn wall_defense_totals<S: AsRef<str>>(
    built: Option<&[S]>,
    values: &MiastoWallParamValues,
) -> WallDefenseTotals {
    let params = CityDefenseBonusParams {
        mur: values.mur.unwrap_or(200.0),
        mur_kamienny: Some(values.mur_kamienny.unwrap_or(150.0)),
        cytadela: values.cytadela.unwrap_or(100.0),
        baszta: values.baszta.unwrap_or(100.0),
        palisada: Some(values.palisada.unwrap_or(100.0)),
    };
    let total_proc = city_wall_defense_bonus_percent(built, &params);
    WallDefenseTotals {
        mult: 1.0 + total_proc / 100.0,
        total_proc,
    }
}

/// `defenderInsideFortification` (city-defense.ts:113-117). `side_def` = `ctx.side === 'def'`.
pub fn defender_inside_fortification(
    side_def: bool,
    on_wall_walkway: bool,
    q: f64,
    siege_wall_col: f64,
) -> bool {
    if !side_def {
        return false;
    }
    if on_wall_walkway {
        return true;
    }
    siege_wall_col >= 0.0 && q > siege_wall_col
}

/// `Math.max(0, x)`: NaN -> NaN, -0 -> +0.
fn js_max0(x: f64) -> f64 {
    if x.is_nan() || x > 0.0 {
        x
    } else {
        0.0
    }
}

/// `fortificationDefenseBonusForUnit` (city-defense.ts:124-129): `Math.max(0, wallTotalProc)` (NaN zostaje NaN).
pub fn fortification_defense_bonus_for_unit(
    side_def: bool,
    on_wall_walkway: bool,
    q: f64,
    siege_wall_col: f64,
    wall_total_proc: f64,
) -> f64 {
    if defender_inside_fortification(side_def, on_wall_walkway, q, siege_wall_col) {
        js_max0(wall_total_proc)
    } else {
        0.0
    }
}

/// `_wallBonusProcFor` (battleScene.ts:7459-7464): bonus obwarowania (%) dla jednostki sceny.
pub fn wall_bonus_proc_for(
    side_def: bool,
    on_wall_walkway: bool,
    q: f64,
    siege_wall_col: f64,
    wall_defense_total_proc: f64,
) -> f64 {
    fortification_defense_bonus_for_unit(
        side_def,
        on_wall_walkway,
        q,
        siege_wall_col,
        wall_defense_total_proc,
    )
}

/// `hasMur` (battleScene.ts:8848): `wallDefenseTotalProc > 0`.
pub fn has_mur(wall_defense_total_proc: f64) -> bool {
    wall_defense_total_proc > 0.0
}

/// `cityTerrMult` (battleScene.ts:8850-8852): `isCityDefenseBattle ? cityGatedTerrainMultiplier(..) : 1`.
pub fn city_terr_mult(is_city_defense_battle: bool, gated_terrain_multiplier: f64) -> f64 {
    if is_city_defense_battle {
        gated_terrain_multiplier
    } else {
        1.0
    }
}

/// `terrDefMult` (battleScene.ts:8855-8857). `field_terrain_multiplier` = wynik `terrainDefenseMultiplier`
/// (galaz poza obrona miasta); `wall_bonus_proc` = [`wall_bonus_proc_for`]; `city_terr_mult` = [`city_terr_mult`].
pub fn terr_def_mult(
    is_city_defense_battle: bool,
    wall_bonus_proc: f64,
    city_terr_mult: f64,
    field_terrain_multiplier: f64,
) -> f64 {
    if is_city_defense_battle {
        1.0 + (wall_bonus_proc + (city_terr_mult - 1.0) * 100.0) / 100.0
    } else {
        field_terrain_multiplier
    }
}

/// `fieldFortifyDefenseBonus` (city-defense.ts:237-245): Obrona po bonusie fortyfikacji (tylko Obrona).
pub fn field_fortify_defense_bonus(
    base_obrona: f64,
    is_fortified_in_field: bool,
    fortify_obrona_proc: f64,
) -> f64 {
    if is_fortified_in_field {
        base_obrona * (1.0 + fortify_obrona_proc / 100.0)
    } else {
        base_obrona
    }
}
