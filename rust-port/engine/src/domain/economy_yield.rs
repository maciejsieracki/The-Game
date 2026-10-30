//! REPIN-EKONOMIA-D (krok 4b, czesc D, partie D2.1 i D2.2a): port mnoznikow Handel->Pieniadz z
//! `gra/src/game/economy.ts` (pin `91dc998a`). Port od zera: w silniku nie istnieje jeszcze
//! odpowiednik `cityYieldPerTurn`; ta partia obejmuje wylacznie czyste funkcje (bez pamieci
//! miasta i bez danych turowych).
//!
//! web: gra/src/game/economy.ts@91dc998a:
//! - `mnoznikHandelPieniadzForCiv` (L704-711) -> [`mnoznik_handel_pieniadz_for_civ`]
//! - `civMatrixMnoznikHandelPieniadzRaw` (L717-728, prywatna) -> [`civ_matrix_mnoznik_handel_pieniadz_raw`]
//! - `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (L738-742) -> [`mnoznik_handel_trudnosc_delta`]
//! - `mnoznikHandelPieniadzForCivByDifficulty` (L753-762) -> [`mnoznik_handel_pieniadz_for_civ_by_difficulty`]
//! - `civEconomyYieldMultipliers` (L781-786) -> [`civ_economy_yield_multipliers`]
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Web `loadCivMatrix()` / `civMatrixParam()` = argument `matrix: &CivMatrixFile` (jak w
//!   `civ_matrix.rs`); wywolujacy podaje [`crate::domain::civ_matrix::load_civ_matrix`] dla danych
//!   wbudowanych. Web `civs` (civs.json) jest IGNOROWANE przez oba mnozniki (zgodnie z wersja 91dc998a),
//!   wiec w sygnaturach nie wystepuje.
//! - Web `fallback = 1` (domyslny parametr) = stala [`MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT`];
//!   wywolujacy podaje wartosc jawnie.
//! - Pusty klucz (`""`) traktowany jak brak klucza (web: `!civKey`).
//! - Surowe zero macierzy jest wartoscia (web: `Number.isFinite`, nie `> 0`); NaN/Infinity = brak.

use crate::data::civilizations::CivMatrixFile;
use crate::data::terrain_map::TerrainYieldsFile;
use crate::domain::civ_matrix::js_compat::js_min;
use crate::domain::civ_matrix::{apply_civ_matrix_param, civ_matrix_param, resolve_row};
use crate::domain::improvements::{
    apply_improvement_bonuses, ore_yield_from_improvements, TileYield,
};
use crate::domain::types::Difficulty;

/// Web `mnoznikHandelPieniadzForCiv(..., fallback = 1)`: domyslna wartosc zapasowa.
pub const MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT: f64 = 1.0;

/// Web `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (`economy.ts` L738-742).
pub fn mnoznik_handel_trudnosc_delta(difficulty: Difficulty) -> f64 {
    match difficulty {
        Difficulty::Easy => 0.5,
        Difficulty::Normal => 0.0,
        Difficulty::Hard => -0.5,
    }
}

/// Web `civMatrixMnoznikHandelPieniadzRaw` (prywatna): `None` dla pustego / nieznanego klucza
/// (web: `!civKey` lub brak wiersza z `ikonaId` / `typCywilizacji` / `Cywilizacja`);
/// dla znanej cywilizacji `civMatrixParam(.., 'meta_mnoznik_waluta')` jesli skonczony.
pub fn civ_matrix_mnoznik_handel_pieniadz_raw(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
) -> Option<f64> {
    let key = civ_key.filter(|k| !k.is_empty())?;
    resolve_row(matrix, key)?;
    let value = civ_matrix_param(matrix, key, "meta_mnoznik_waluta");
    value.is_finite().then_some(value)
}

/// Web `mnoznikHandelPieniadzForCiv(civKey, civs, fallback)`: wartosc macierzy albo `fallback`.
pub fn mnoznik_handel_pieniadz_for_civ(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
    fallback: f64,
) -> f64 {
    civ_matrix_mnoznik_handel_pieniadz_raw(matrix, civ_key).unwrap_or(fallback)
}

/// Web `mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled)`:
/// surowa wartosc macierzy + delta trudnosci; brak wiersza => `fallback_scaled` bez drugiej delty.
pub fn mnoznik_handel_pieniadz_for_civ_by_difficulty(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
    difficulty: Difficulty,
    fallback_scaled: f64,
) -> f64 {
    match civ_matrix_mnoznik_handel_pieniadz_raw(matrix, civ_key) {
        None => fallback_scaled,
        Some(raw) => raw + mnoznik_handel_trudnosc_delta(difficulty),
    }
}

/// Wynik web `civEconomyYieldMultipliers` (`{ handel, nauka }`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EconomyYieldMultipliers {
    pub handel: f64,
    pub nauka: f64,
}

/// Web `civEconomyYieldMultipliers(bonusy)`: od wersji 91dc998a zawsze neutralne `{1, 1}`
/// (liczbowe bonusy z civs.json nie sa juz wejsciem konsumenta; argument jest ignorowany).
pub fn civ_economy_yield_multipliers() -> EconomyYieldMultipliers {
    EconomyYieldMultipliers {
        handel: 1.0,
        nauka: 1.0,
    }
}

/// Web `Math.max(0, x)` (D2.2a/D2.2b): `NaN` propaguje; dla `x` <= 0 (w tym `-0`) wynik to `+0`,
/// bo w ECMAScript `+0` jest wieksze od `-0`. `js_compat::js_max` z `civ_matrix.rs` zwraca `-0`
/// dla `(0, -0)`, wiec tu jest lokalna wersja zgodna z webem.
fn js_math_max_zero(x: f64) -> f64 {
    if x.is_nan() {
        f64::NAN
    } else if x > 0.0 {
        x
    } else {
        0.0
    }
}

/// Parametry macierzy/ekonomii uzywane przez ogon `cityYieldPerTurn` (web `EconParams`, pin `91dc998a`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldTailParams {
    /// Web `params.korupcjaCap`.
    pub korupcja_cap: f64,
    /// Web `params.mennicaMnoznikPoWalucie`.
    pub mennica_mnoznik_po_walucie: f64,
    /// Web `params.budynekBibliotekaBonusNauki`.
    pub biblioteka_bonus_nauki: f64,
    /// Web `params.budynekAkademiaBonusNauki`.
    pub akademia_bonus_nauki: f64,
    /// Web `params.budynekGarncarniaBonusZywnosci`.
    pub garncarnia_bonus_zywnosci: f64,
    /// Web `params.zywnoscZuzytkaPopulacja`.
    pub zywnosc_zuzytka_populacja: f64,
}

/// Wejscia ogona `cityYieldPerTurn` (web Step 5-9): agregaty Step 1-4 (teren, budynki) podane jawnie
/// oraz pola `city` i `ctx`, ktore ten ogon czyta.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldTailInput<'a> {
    /// Web `city.civKey` (truthy: `None` i `Some("")` = brak wlasciciela).
    pub civ_key: Option<&'a str>,
    /// Web `city.ludnosc`.
    pub ludnosc: f64,
    /// Web `city.podziałHandlu.procentNauka` (surowo 0..100; dzielone przez 100 w ogonie).
    pub procent_nauka: f64,
    /// Web `city.podziałHandlu.procentPieniadz`.
    pub procent_pieniadz: f64,
    /// Web `city.podziałHandlu.procentLuksus`.
    pub procent_luksus: f64,
    /// Liczba wpisow `'poborca'` w `city.specjalisci` (web: +2 Pieniadza za kazdy).
    pub poborca_count: u32,
    /// Web `handelTerenu` (Step 1).
    pub handel_terenu: f64,
    /// Web `pieniadzBudynkow` (Step 3, po ewentualnym bonusie portu).
    pub pieniadz_budynkow: f64,
    /// Web `naukaBudynkow` (Step 3).
    pub nauka_budynkow: f64,
    /// Web `zywnoscTerenu` (Step 1).
    pub zywnosc_terenu: f64,
    /// Web `zywnoscBudynkow` (Step 3).
    pub zywnosc_budynkow: f64,
    /// Web `kulturaBudynkow` (Step 3).
    pub kultura_budynkow: f64,
    /// Web `ctx.strataFraction`.
    pub strata_fraction: f64,
    /// Web `ctx.walutaOdkryta === true`.
    pub waluta_odkryta: bool,
    /// Web `ctx.maMennica === true`.
    pub ma_mennica: bool,
    /// Web `ctx.civHandelMult` (`None` = `undefined`, domyslnie 1).
    pub civ_handel_mult: Option<f64>,
    /// Web `ctx.premiaHandluTrasHandlowych` (`None` = domyslnie 0).
    pub premia_handlu_tras: Option<f64>,
    /// Web `ctx.additionalTax` (`None` = domyslnie 0; ujemne obcinane przez `Math.max(0, ..)`).
    pub additional_tax: Option<f64>,
    /// Web `ctx.civNaukaMult` (`None` = `undefined`).
    pub civ_nauka_mult: Option<f64>,
    /// Web `ctx.maBiblioteka`.
    pub ma_biblioteka: bool,
    /// Web `ctx.maAkademia`.
    pub ma_akademia: bool,
    /// Web `ctx.liczbaGarncarni` (`None` = domyslnie 0).
    pub liczba_garncarni: Option<f64>,
    /// Web `ctx.wojskoZuzycieZywnosci`.
    pub wojsko_zuzycie_zywnosci: f64,
}

/// Wynik ogona (web `CityYieldResult`, pola Step 5-9; wszystkie juz zaokraglone w dol jak w webie).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldTailOutput {
    /// Web `pieniadz`.
    pub pieniadz: f64,
    /// Web `zywnosc` (netto).
    pub zywnosc: f64,
    /// Web `nauka`.
    pub nauka: f64,
    /// Web `luksus`.
    pub luksus: f64,
    /// Web `kultura`.
    pub kultura: f64,
    /// Web `zywnoscBrutto`.
    pub zywnosc_brutto: f64,
    /// Web `handelBrutto`.
    pub handel_brutto: f64,
}

/// Port web `cityYieldPerTurn` Step 5-9 (`gra/src/game/economy.ts@91dc998a` L908-1009):
/// korupcja i Mennica na Handlu, podzial suwakiem na Nauke/Pieniadz/Luksus, Nauka lokalna
/// (Biblioteka + Akademia addytywnie), Poborca, Zywnosc netto (Garncarnia) i Kultura.
/// Mnozenie przez macierz idzie przez `apply_civ_matrix_param` tylko gdy klucz cywilizacji
/// jest niepusty (web: `city.civKey ? ... : ...`).
pub fn city_yield_tail(
    matrix: &CivMatrixFile,
    input: &CityYieldTailInput<'_>,
    params: &CityYieldTailParams,
) -> CityYieldTailOutput {
    let civ = input.civ_key.filter(|k| !k.is_empty());
    let via_matrix = |base: f64, param_id: &str| match civ {
        Some(key) => apply_civ_matrix_param(matrix, base, key, param_id),
        None => base,
    };

    // Step 4 (handel brutto): mnoznik legacy tylko dla nieznanego wlasciciela.
    let handel_bazowy = input.handel_terenu + input.pieniadz_budynkow;
    let mut handel_brutto = handel_bazowy;
    let civ_handel_mult = if civ.is_some() {
        1.0
    } else {
        input.civ_handel_mult.unwrap_or(1.0)
    };
    if civ_handel_mult != 1.0 {
        handel_brutto *= civ_handel_mult;
    }
    let premia = input.premia_handlu_tras.unwrap_or(0.0);
    if premia > 0.0 {
        handel_brutto += premia;
    }
    handel_brutto = via_matrix(handel_brutto, "eko_handel_brutto_proc");
    handel_brutto += js_math_max_zero(input.additional_tax.unwrap_or(0.0));

    // Step 5: korupcja na calym ogonie podatkowym, potem Mennica (tylko lokalny podatek).
    let strata_raw = via_matrix(input.strata_fraction, "eko_korupcja_proc");
    let strata = js_min(strata_raw, params.korupcja_cap);
    let handel_netto_raw = handel_brutto * (1.0 - strata);
    let waluta_aktywna = input.waluta_odkryta && input.ma_mennica;
    let waluta_mnoznik = if waluta_aktywna {
        params.mennica_mnoznik_po_walucie
    } else {
        1.0
    };
    let handel_netto = handel_netto_raw * waluta_mnoznik;

    // Step 6+7: podzial suwakiem.
    let pct_nauka = input.procent_nauka / 100.0;
    let pct_pieniadz = input.procent_pieniadz / 100.0;
    let pct_luksus = input.procent_luksus / 100.0;
    let nauka_z_handlu = (handel_netto * pct_nauka).floor();
    let pieniadz_z_handlu = (handel_netto * pct_pieniadz).floor();
    let luksus_raw = (handel_netto * pct_luksus).floor();
    let luksus = via_matrix(luksus_raw, "eko_luksus_proc").floor();

    // Nauka lokalna: Biblioteka + Akademia addytywnie (1 + b + a).
    let biblioteka = if input.ma_biblioteka {
        params.biblioteka_bonus_nauki
    } else {
        0.0
    };
    let akademia = if input.ma_akademia {
        params.akademia_bonus_nauki
    } else {
        0.0
    };
    let nauka_bonus_factor = 1.0 + biblioteka + akademia;
    let nauka_lokalna_raw = ((nauka_z_handlu + input.nauka_budynkow) * nauka_bonus_factor).floor();
    let nauka_lokalna = match civ {
        Some(key) => {
            apply_civ_matrix_param(matrix, nauka_lokalna_raw, key, "eko_nauka_proc").floor()
        }
        None => match input.civ_nauka_mult {
            Some(mult) if mult != 1.0 => (nauka_lokalna_raw * mult).floor(),
            _ => nauka_lokalna_raw,
        },
    };

    // Step 8: pieniadz z alokacji plus Poborca (+2 za kazdego, kolejno jak w webie).
    let mut pieniadz_total = via_matrix(pieniadz_z_handlu, "eko_pieniadz_proc");
    for _ in 0..input.poborca_count {
        pieniadz_total += 2.0;
    }

    // Step 9: Zywnosc brutto (Garncarnia lokalnie), potem netto po konsumpcji.
    let zywnosc_baza = input.zywnosc_terenu + input.zywnosc_budynkow;
    let liczba_garncarni = input.liczba_garncarni.unwrap_or(0.0);
    let garncarnia_mnoznik = 1.0 + params.garncarnia_bonus_zywnosci * liczba_garncarni;
    let zywnosc_brutto_raw = zywnosc_baza * garncarnia_mnoznik;
    let zywnosc_brutto = via_matrix(zywnosc_brutto_raw, "eko_zywnosc_proc");
    let zywnosc_zuzyta =
        input.ludnosc * params.zywnosc_zuzytka_populacja + input.wojsko_zuzycie_zywnosci;
    let zywnosc_netto = zywnosc_brutto - zywnosc_zuzyta;

    CityYieldTailOutput {
        pieniadz: pieniadz_total.floor(),
        zywnosc: zywnosc_netto.floor(),
        nauka: nauka_lokalna,
        luksus,
        kultura: via_matrix(input.kultura_budynkow, "eko_kultura_proc").floor(),
        zywnosc_brutto: zywnosc_brutto.floor(),
        handel_brutto: handel_brutto.floor(),
    }
}

/// Parametry Step 2 `cityYieldPerTurn` (web `EconParams`, pin `91dc998a`): Mlyn i Cegielnia na Pracy terenu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldHeadParams {
    /// Web `params.budynekMlynMnoznikPracy`.
    pub budynek_mlyn_mnoznik_pracy: f64,
    /// Web `params.budynekMlynBonusPracy`.
    pub budynek_mlyn_bonus_pracy: f64,
    /// Web `params.budynekCegielniBonusPracy`.
    pub budynek_cegielni_bonus_pracy: f64,
}

/// Wejscia glowy `cityYieldPerTurn` (web Step 2, Step 3' i praca netto): agregaty Step 1 i Step 3
/// podane jawnie oraz pola `city`/`ctx`, ktore ta czesc czyta.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldHeadInput<'a> {
    /// Web `city.civKey` (truthy: `None` i `Some("")` = brak wlasciciela).
    pub civ_key: Option<&'a str>,
    /// Web `pracaTerenu` (Step 1, suma surowej Pracy z kafli).
    pub praca_terenu: f64,
    /// Web `pracaBudynkow` (Step 3).
    pub praca_budynkow: f64,
    /// Web `pieniadzBudynkow` przed bonusem portu (Step 3).
    pub pieniadz_budynkow: f64,
    /// Web `pieniadzPortu` (Step 3, suma Pieniadza budynkow o `id === 'port'`).
    pub pieniadz_portu: f64,
    /// Web `ctx.maMlyn`.
    pub ma_mlyn: bool,
    /// Web `ctx.maCegielnia`.
    pub ma_cegielnia: bool,
}

/// Wynik glowy `cityYieldPerTurn` (web zmienne Step 2, Step 3' i praca netto).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldHeadOutput {
    /// Web `pracaBruttoTerenu` (po Mlynie i Cegielni).
    pub praca_brutto_terenu: f64,
    /// Web `pieniadzBudynkow` po ewentualnym bonusie portu.
    pub pieniadz_budynkow: f64,
    /// Web `pracaBruttoLacznie` = teren + budynki.
    pub praca_brutto_lacznie: f64,
    /// Web `pracaNetto` (mnoznik `eko_praca_proc` tylko dla wlasciciela).
    pub praca_netto: f64,
}

/// Port web `cityYieldPerTurn` Step 2 + Step 3' + praca netto (`gra/src/game/economy.ts@91dc998a`
/// L849-860, L884-890, L892-903). Kolejnosc jak w webie: Mlyn, potem Cegielnia (po Mlynie);
/// bonus portu dziala tylko gdy `eko_pieniadz_port_proc` jest rozne od zera (NaN przechodzi,
/// `-0` nie); mnozniki macierzy tylko przy niepustym kluczu cywilizacji.
pub fn city_yield_head(
    matrix: &CivMatrixFile,
    params: &CityYieldHeadParams,
    input: &CityYieldHeadInput<'_>,
) -> CityYieldHeadOutput {
    let mut praca_brutto_terenu = if input.ma_mlyn {
        input.praca_terenu * params.budynek_mlyn_mnoznik_pracy + params.budynek_mlyn_bonus_pracy
    } else {
        input.praca_terenu
    };
    if input.ma_cegielnia {
        praca_brutto_terenu *= 1.0 + params.budynek_cegielni_bonus_pracy;
    }

    let owner = input.civ_key.filter(|key| !key.is_empty());
    let mut pieniadz_budynkow = input.pieniadz_budynkow;
    if let Some(key) = owner {
        let port_raw = civ_matrix_param(matrix, key, "eko_pieniadz_port_proc");
        if port_raw != 0.0 {
            pieniadz_budynkow += input.pieniadz_portu * port_raw;
        }
    }

    let praca_brutto_lacznie = praca_brutto_terenu + input.praca_budynkow;
    let praca_netto = match owner {
        Some(key) => apply_civ_matrix_param(matrix, praca_brutto_lacznie, key, "eko_praca_proc"),
        None => praca_brutto_lacznie,
    };

    CityYieldHeadOutput {
        praca_brutto_terenu,
        pieniadz_budynkow,
        praca_brutto_lacznie,
        praca_netto,
    }
}

/// Web `cityPracaInteger(raw)` (`gra/src/game/production.ts`, pin `91dc998a`): skonczone i dodatnie
/// -> `Math.round`, w przeciwnym razie `0` (`-0`, NaN, Infinity-bez-skonczonosci i ujemne -> `+0`).
pub fn city_praca_integer(raw: f64) -> f64 {
    if raw.is_finite() && raw > 0.0 {
        raw.round()
    } else {
        0.0
    }
}

/// Parametry pelnej `cityYieldPerTurn` (web `EconParams`): glowa (Step 2) i ogon (Step 5-9).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldParams {
    pub head: CityYieldHeadParams,
    pub tail: CityYieldTailParams,
}

/// Wejscia pelnej `cityYieldPerTurn` (pin `91dc998a`) z agregatami Step 1 (teren) i Step 3 (budynki)
/// podanymi przez wywolujacego. Sumowanie od surowych kafelkow i budynkow (`tileYield`,
/// `buildingValue`, D2.2d): [`city_yield_per_turn_from_worked`].
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldInput<'a> {
    /// Web `city.civKey`.
    pub civ_key: Option<&'a str>,
    /// Web `city.ludnosc`.
    pub ludnosc: f64,
    /// Web `city.podziałHandlu` (surowo 0..100).
    pub procent_nauka: f64,
    pub procent_pieniadz: f64,
    pub procent_luksus: f64,
    /// Liczba wpisow `'poborca'` w `city.specjalisci`.
    pub poborca_count: u32,
    /// Web Step 1: `pracaTerenu`, `handelTerenu`, `zywnoscTerenu`.
    pub praca_terenu: f64,
    pub handel_terenu: f64,
    pub zywnosc_terenu: f64,
    /// Web Step 3: `pracaBudynkow`, `pieniadzBudynkow` (przed bonusem portu), `pieniadzPortu`,
    /// `zywnoscBudynkow`, `naukaBudynkow`, `kulturaBudynkow`.
    pub praca_budynkow: f64,
    pub pieniadz_budynkow: f64,
    pub pieniadz_portu: f64,
    pub zywnosc_budynkow: f64,
    pub nauka_budynkow: f64,
    pub kultura_budynkow: f64,
    /// Web `ctx` (pola czytane przez pin 91dc998a).
    pub ma_mlyn: bool,
    pub ma_cegielnia: bool,
    pub strata_fraction: f64,
    pub waluta_odkryta: bool,
    pub ma_mennica: bool,
    pub ma_biblioteka: bool,
    pub ma_akademia: bool,
    pub civ_handel_mult: Option<f64>,
    pub premia_handlu_tras: Option<f64>,
    pub additional_tax: Option<f64>,
    pub civ_nauka_mult: Option<f64>,
    pub liczba_garncarni: Option<f64>,
    pub wojsko_zuzycie_zywnosci: f64,
}

/// Wynik pelnej `cityYieldPerTurn` (pola `CityYieldResult` obecne w pinie 91dc998a).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityYieldOutput {
    pub praca: f64,
    pub pieniadz: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub luksus: f64,
    pub kultura: f64,
    pub zywnosc_brutto: f64,
    pub handel_brutto: f64,
    pub praca_terenu: f64,
    pub praca_budynkow: f64,
    pub pieniadz_budynkow: f64,
    /// Web `pieniadzZPracy`: w pinie 91dc998a stale `0` (D5 wylaczone).
    pub pieniadz_z_pracy: f64,
}

/// Kompozycja `cityYieldPerTurn` (`gra/src/game/economy.ts@91dc998a` L819-1020) z AGREGATAMI
/// Step 1 i Step 3 podanymi przez wywolujacego: glowa (`city_yield_head`: Step 2, Step 3' port,
/// praca netto) i ogon (`city_yield_tail`: Step 4-9). Pelna funkcja od kafelkow i budynkow:
/// [`city_yield_per_turn_from_worked`]. Kolejnosc jak w webie: praca netto -> `cityPracaInteger`; `pieniadzZPracy` = 0;
/// bonus portu wchodzi do `pieniadzBudynkow` przed handlem brutto.
pub fn city_yield_per_turn(
    matrix: &CivMatrixFile,
    params: &CityYieldParams,
    input: &CityYieldInput<'_>,
) -> CityYieldOutput {
    let head_input = CityYieldHeadInput {
        civ_key: input.civ_key,
        praca_terenu: input.praca_terenu,
        praca_budynkow: input.praca_budynkow,
        pieniadz_budynkow: input.pieniadz_budynkow,
        pieniadz_portu: input.pieniadz_portu,
        ma_mlyn: input.ma_mlyn,
        ma_cegielnia: input.ma_cegielnia,
    };
    let head = city_yield_head(matrix, &params.head, &head_input);
    let praca_int = city_praca_integer(head.praca_netto);

    let tail_input = CityYieldTailInput {
        civ_key: input.civ_key,
        ludnosc: input.ludnosc,
        procent_nauka: input.procent_nauka,
        procent_pieniadz: input.procent_pieniadz,
        procent_luksus: input.procent_luksus,
        poborca_count: input.poborca_count,
        handel_terenu: input.handel_terenu,
        pieniadz_budynkow: head.pieniadz_budynkow,
        nauka_budynkow: input.nauka_budynkow,
        zywnosc_terenu: input.zywnosc_terenu,
        zywnosc_budynkow: input.zywnosc_budynkow,
        kultura_budynkow: input.kultura_budynkow,
        strata_fraction: input.strata_fraction,
        waluta_odkryta: input.waluta_odkryta,
        ma_mennica: input.ma_mennica,
        civ_handel_mult: input.civ_handel_mult,
        premia_handlu_tras: input.premia_handlu_tras,
        additional_tax: input.additional_tax,
        civ_nauka_mult: input.civ_nauka_mult,
        ma_biblioteka: input.ma_biblioteka,
        ma_akademia: input.ma_akademia,
        liczba_garncarni: input.liczba_garncarni,
        wojsko_zuzycie_zywnosci: input.wojsko_zuzycie_zywnosci,
    };
    let tail = city_yield_tail(matrix, &tail_input, &params.tail);

    CityYieldOutput {
        praca: praca_int,
        pieniadz: tail.pieniadz,
        zywnosc: tail.zywnosc,
        nauka: tail.nauka,
        luksus: tail.luksus,
        kultura: tail.kultura,
        zywnosc_brutto: tail.zywnosc_brutto,
        handel_brutto: tail.handel_brutto,
        praca_terenu: head.praca_brutto_terenu.floor(),
        praca_budynkow: input.praca_budynkow.floor(),
        pieniadz_budynkow: head.pieniadz_budynkow.floor(),
        pieniadz_z_pracy: 0.0,
    }
}

// ---------------------------------------------------------------------------
// D2.2d (runda 4): Step 1 (`tileYield`, bez ulepszen i zloz) i Step 3 (`buildingValue`,
// suma `pieniadzPortu`). Wejscia surowe: kafelki i rekordy budynkow; agregaty licza sie tutaj.
// ---------------------------------------------------------------------------

/// Web `TERRAIN_NAME_TO_ENUM` (`economy.ts@91dc998a` L368-377): klucz `TerenBazowy` -> etykieta
/// wiersza w `terrain-yields.json`. Nieznany klucz = brak wiersza (web: `?? ZERO_YIELD`).
fn terrain_row_name(teren_bazowy: &str) -> Option<&'static str> {
    Some(match teren_bazowy {
        "laka" => "Łąka",
        "rownina" => "Równina",
        "wzgorza" => "Wzgórza",
        "gory" => "Góry",
        "plytkie_morze" => "Wybrzeże",
        "morze" => "Morze",
        "pustynia" => "Pustynia",
        "polarny" => "Polarny",
        _ => return None,
    })
}

/// Web `WorkedTile` (pola czytane przez `tileYield` bez ulepszen): `terenBazowy`, `nakladka`
/// (tylko `'las'` ma wplyw na ten zakres), `maRzeke`. Ulepszenia i zloza NIE sa wejsciem (ZALOZENIE
/// Z-D2.2d-1: galaz `impKeys` tileYield nieportowana).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WorkedTileInput<'a> {
    pub teren_bazowy: &'a str,
    pub nakladka: &'a str,
    pub ma_rzeke: bool,
}

/// Wynik `tileYield` w zakresie uzywanym przez wyjscie `cityYieldPerTurn` (zywnosc, praca, handel).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TileYieldBase {
    pub zywnosc: f64,
    pub praca: f64,
    pub handel: f64,
}

/// Web `tileYield(tile)` (`economy.ts@91dc998a` L421-470) bez galezi ulepszen: wiersz terenu +
/// modyfikator `'Las (nakładka)'` (gdy las) + modyfikator `'Rzeka'` (gdy rzeka), kolejnosc jak w
/// webie; potem `Math.max(0, x)` per pole. Brak wiersza terenu lub modyfikatora = zera.
/// Kolumna `Podatek` = handel (web: `row['Podatek'] ?? row['Handel']`).
pub fn tile_yield_base(data: &TerrainYieldsFile, tile: &WorkedTileInput<'_>) -> TileYieldBase {
    let modifier = |name: &str| -> (f64, f64, f64) {
        data.terrain_modifiers
            .iter()
            .find(|m| m.modyfikator == name)
            .map(|m| (m.zywnosc as f64, m.praca as f64, m.podatek as f64))
            .unwrap_or((0.0, 0.0, 0.0))
    };
    let (mut zywnosc, mut praca, mut handel) = terrain_row_name(tile.teren_bazowy)
        .and_then(|name| data.terrain_types.iter().find(|r| r.teren == name))
        .map(|r| (r.zywnosc as f64, r.praca as f64, r.podatek as f64))
        .unwrap_or((0.0, 0.0, 0.0));
    if tile.nakladka == "las" {
        let (z, p, h) = modifier("Las (nakładka)");
        zywnosc += z;
        praca += p;
        handel += h;
    }
    if tile.ma_rzeke {
        let (z, p, h) = modifier("Rzeka");
        zywnosc += z;
        praca += p;
        handel += h;
    }
    TileYieldBase {
        zywnosc: js_math_max_zero(zywnosc),
        praca: js_math_max_zero(praca),
        handel: js_math_max_zero(handel),
    }
}

/// Web Step 1 (L837-847): sumy `zywnoscTerenu`, `pracaTerenu`, `handelTerenu` po kafelkach,
/// w kolejnosci tablicy, od `+0`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TerrainSums {
    pub zywnosc: f64,
    pub praca: f64,
    pub handel: f64,
}

pub fn city_terrain_sums(data: &TerrainYieldsFile, tiles: &[WorkedTileInput<'_>]) -> TerrainSums {
    let mut sums = TerrainSums {
        zywnosc: 0.0,
        praca: 0.0,
        handel: 0.0,
    };
    for tile in tiles {
        let y = tile_yield_base(data, tile);
        sums.zywnosc += y.zywnosc;
        sums.praca += y.praca;
        sums.handel += y.handel;
    }
    sums
}

/// Wartosci bazowe lub przyrost budynku dla kluczy Step 3 (web `BuildingYieldKey` z tej zestawu).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BuildingYieldsInput {
    pub praca: f64,
    pub pieniadz: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub kultura: f64,
}

/// Wpis Step 3 (web `{ record, level }`): `id` rekordu (`record.id`), `level`, `baza`, `przyrost`.
/// `NaN` w polu = brak klucza w rekordzie (web `undefined` daje `NaN` w `buildingEffectAtLevel`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityBuildingInput<'a> {
    pub id: &'a str,
    pub level: f64,
    pub baza: BuildingYieldsInput,
    pub przyrost: BuildingYieldsInput,
}

/// Web `buildingValue(b, level, key)` = `Math.floor(buildingEffectAtLevel(baza, przyrost, level))`,
/// gdzie `buildingEffectAtLevel` = `baza + przyrost * (max(1, floor(level)) - 1)`.
/// `NaN` propaguje (web `Math.max(1, NaN)` = NaN).
pub fn building_value(baza: f64, przyrost: f64, level: f64) -> f64 {
    let lf = level.floor();
    let n = if lf.is_nan() {
        f64::NAN
    } else if lf > 1.0 {
        lf
    } else {
        1.0
    };
    (baza + przyrost * (n - 1.0)).floor()
}

/// Web Step 3 (L873-882): sumy `pracaBudynkow`, `pieniadzBudynkow` (przed bonusem portu),
/// `pieniadzPortu` (tylko `id === 'port'`; np. `'port_wielki'` NIE wchodzi), `zywnoscBudynkow`,
/// `naukaBudynkow`, `kulturaBudynkow`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BuildingSums {
    pub praca: f64,
    pub pieniadz: f64,
    pub pieniadz_portu: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub kultura: f64,
}

pub fn city_building_sums(buildings: &[CityBuildingInput<'_>]) -> BuildingSums {
    let mut sums = BuildingSums {
        praca: 0.0,
        pieniadz: 0.0,
        pieniadz_portu: 0.0,
        zywnosc: 0.0,
        nauka: 0.0,
        kultura: 0.0,
    };
    for b in buildings {
        sums.praca += building_value(b.baza.praca, b.przyrost.praca, b.level);
        let money = building_value(b.baza.pieniadz, b.przyrost.pieniadz, b.level);
        sums.pieniadz += money;
        if b.id == "port" {
            sums.pieniadz_portu += money;
        }
        sums.zywnosc += building_value(b.baza.zywnosc, b.przyrost.zywnosc, b.level);
        sums.nauka += building_value(b.baza.nauka, b.przyrost.nauka, b.level);
        sums.kultura += building_value(b.baza.kultura, b.przyrost.kultura, b.level);
    }
    sums
}

/// Pelna `cityYieldPerTurn` od surowych wejsc (web `cityYieldPerTurn(city, workedTiles,
/// cityBuildings, params, ctx)`): Step 1 i Step 3 licza sie z `tiles` i `buildings`, potem
/// skladanie jak w [`city_yield_per_turn`]. Pola agregatow w `input` (`praca_terenu`,
/// `handel_terenu`, `zywnosc_terenu`, `praca_budynkow`, `pieniadz_budynkow`, `pieniadz_portu`,
/// `zywnosc_budynkow`, `nauka_budynkow`, `kultura_budynkow`) sa IGNOROWANE i nadpisywane sumami.
pub fn city_yield_per_turn_from_worked(
    matrix: &CivMatrixFile,
    terrain: &TerrainYieldsFile,
    params: &CityYieldParams,
    input: &CityYieldInput<'_>,
    tiles: &[WorkedTileInput<'_>],
    buildings: &[CityBuildingInput<'_>],
) -> CityYieldOutput {
    let t = city_terrain_sums(terrain, tiles);
    city_yield_per_turn_with_sums(matrix, params, input, t, buildings)
}

/// Skladanie `cityYieldPerTurn` z gotowymi sumami Step 1 (`t`) i liczonymi Step 3 (`buildings`).
fn city_yield_per_turn_with_sums(
    matrix: &CivMatrixFile,
    params: &CityYieldParams,
    input: &CityYieldInput<'_>,
    t: TerrainSums,
    buildings: &[CityBuildingInput<'_>],
) -> CityYieldOutput {
    let b = city_building_sums(buildings);
    let mut full = *input;
    full.praca_terenu = t.praca;
    full.handel_terenu = t.handel;
    full.zywnosc_terenu = t.zywnosc;
    full.praca_budynkow = b.praca;
    full.pieniadz_budynkow = b.pieniadz;
    full.pieniadz_portu = b.pieniadz_portu;
    full.zywnosc_budynkow = b.zywnosc;
    full.nauka_budynkow = b.nauka;
    full.kultura_budynkow = b.kultura;
    city_yield_per_turn(matrix, params, &full)
}

// ---------------------------------------------------------------------------
// D2.2e (runda 1 operatora, R-RUSTPORT-REPIN-EKONOMIA-D2-Q1): galaz ulepszen i zloz `tileYield`
// (web `economy.ts@91dc998a` L421-470, `impKeys` L458-472) oraz `buildingHappinessAtLevel`
// (L513-531). Zamyka Z-D2.2d-1 dla Step 1 (ulepszenia) i daje osobna funkcje szczescia.
// ---------------------------------------------------------------------------

/// Web `BUILDING_HAPPINESS_BASE_PER_BUILDING` (`economy.ts@91dc998a`, ryczalt +1 za budynek).
pub const BUILDING_HAPPINESS_BASE_PER_BUILDING: f64 = 1.0;

/// Web `WorkedTile` z polami ulepszen. `ulepszenia_keys`: `None` = `undefined` lub `null`;
/// `ulepszenie_key`: `None` = brak lub `null`. `zloze` jest czytane przez web tylko w
/// `oreYieldFromImprovements`, ktore go ignoruje (nie wplywa na wynik).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WorkedTileImpInput<'a> {
    pub teren_bazowy: &'a str,
    pub nakladka: &'a str,
    pub ma_rzeke: bool,
    pub ulepszenia_keys: Option<&'a [String]>,
    pub ulepszenie_key: Option<&'a str>,
    pub zloze: Option<&'a str>,
}

/// Web `impKeys` (L458-460): `ulepszeniaKeys?.length ? ulepszeniaKeys : (ulepszenieKey ? [ulepszenieKey] : [])`.
fn imp_keys_of(tile: &WorkedTileImpInput<'_>) -> Vec<String> {
    match tile.ulepszenia_keys {
        Some(keys) if !keys.is_empty() => keys.to_vec(),
        _ => tile
            .ulepszenie_key
            .filter(|key| !key.is_empty())
            .map(|key| vec![key.to_owned()])
            .unwrap_or_default(),
    }
}

/// Web `tileYield(tile)` (`economy.ts@91dc998a` L421-470) z galezia ulepszen: wiersz terenu, modyfikator
/// lasu (zywnosc, praca, handel, drewno), modyfikator rzeki (zywnosc, praca, handel, glina), potem
/// `Math.max(0, x)`. Gdy `impKeys` niepusta: `applyImprovementBonuses`, ponowne `Math.max(0, x)` na
/// zywnosc, praca, handel, drewno, kamien, glina oraz `ruda`/`ruda_zelaza` z `oreYieldFromImprovements`.
pub fn tile_yield_full(data: &TerrainYieldsFile, tile: &WorkedTileImpInput<'_>) -> TileYield {
    let modifier = |name: &str| -> [f64; 6] {
        data.terrain_modifiers
            .iter()
            .find(|m| m.modyfikator == name)
            .map(|m| {
                [
                    m.zywnosc as f64,
                    m.praca as f64,
                    m.podatek as f64,
                    m.drewno as f64,
                    m.kamien as f64,
                    m.glina as f64,
                ]
            })
            .unwrap_or([0.0; 6])
    };
    let base = terrain_row_name(tile.teren_bazowy)
        .and_then(|name| data.terrain_types.iter().find(|r| r.teren == name))
        .map(|r| {
            [
                r.zywnosc as f64,
                r.praca as f64,
                r.podatek as f64,
                r.drewno as f64,
                r.kamien as f64,
                r.glina as f64,
            ]
        })
        .unwrap_or([0.0; 6]);
    let [mut zywnosc, mut praca, mut handel, mut drewno, kamien, mut glina] = base;
    if tile.nakladka == "las" {
        let m = modifier("Las (nakładka)");
        zywnosc += m[0];
        praca += m[1];
        handel += m[2];
        drewno += m[3];
    }
    if tile.ma_rzeke {
        let m = modifier("Rzeka");
        zywnosc += m[0];
        praca += m[1];
        handel += m[2];
        glina += m[5];
    }
    let mut out = TileYield {
        zywnosc: js_math_max_zero(zywnosc),
        praca: js_math_max_zero(praca),
        handel: js_math_max_zero(handel),
        drewno: js_math_max_zero(drewno),
        kamien: js_math_max_zero(kamien),
        glina: js_math_max_zero(glina),
        ruda: 0.0,
        ruda_zelaza: 0.0,
    };
    let keys = imp_keys_of(tile);
    if !keys.is_empty() {
        apply_improvement_bonuses(&mut out, &keys);
        out.zywnosc = js_math_max_zero(out.zywnosc);
        out.praca = js_math_max_zero(out.praca);
        out.handel = js_math_max_zero(out.handel);
        out.drewno = js_math_max_zero(out.drewno);
        out.kamien = js_math_max_zero(out.kamien);
        out.glina = js_math_max_zero(out.glina);
        let ore = ore_yield_from_improvements(&keys, tile.zloze);
        out.ruda += ore.ruda;
        out.ruda_zelaza += ore.ruda_zelaza;
    }
    out
}

/// Web Step 1 (L837-847) z galezia ulepszen: sumy `zywnoscTerenu`, `pracaTerenu`, `handelTerenu`
/// po kafelkach `tileYield` (z ulepszeniami), w kolejnosci tablicy, od `+0`.
pub fn city_terrain_sums_imp(
    data: &TerrainYieldsFile,
    tiles: &[WorkedTileImpInput<'_>],
) -> TerrainSums {
    let mut sums = TerrainSums {
        zywnosc: 0.0,
        praca: 0.0,
        handel: 0.0,
    };
    for tile in tiles {
        let y = tile_yield_full(data, tile);
        sums.zywnosc += y.zywnosc;
        sums.praca += y.praca;
        sums.handel += y.handel;
    }
    sums
}

/// Pelna `cityYieldPerTurn` od kafelkow z ulepszeniami (web liczy `tileYield` z `impKeys` w Step 1).
/// Pola agregatow w `input` sa IGNOROWANE i nadpisywane sumami (jak w [`city_yield_per_turn_from_worked`]).
pub fn city_yield_per_turn_from_worked_imp(
    matrix: &CivMatrixFile,
    terrain: &TerrainYieldsFile,
    params: &CityYieldParams,
    input: &CityYieldInput<'_>,
    tiles: &[WorkedTileImpInput<'_>],
    buildings: &[CityBuildingInput<'_>],
) -> CityYieldOutput {
    let t = city_terrain_sums_imp(terrain, tiles);
    city_yield_per_turn_with_sums(matrix, params, input, t, buildings)
}

/// Web `buildingHappinessAtLevel(b, level)` (`economy.ts@91dc998a` L523-531).
/// - `daje_szczescie` = `b.dajeSzczescie === true` (w Rust pole typu `bool`, patrz `buildings_tech.rs`);
/// - `baza_zadowolenie` = `b.baza.zadowolenie` gdy jest liczba (`typeof === 'number'`), inaczej `None`;
/// - `przyrost_zadowolenie` = `b.przyrost.zadowolenie` (NaN gdy brak, jak `undefined` w webie).
///
/// Wynik: 0 gdy budynek nie daje szczescia; inaczej `1 + buildingValue(b, level, 'zadowolenie')`
/// gdy `baza.zadowolenie !== 0`, a `1` w przeciwnym razie.
pub fn building_happiness_at_level(
    daje_szczescie: bool,
    baza_zadowolenie: Option<f64>,
    przyrost_zadowolenie: f64,
    level: f64,
) -> f64 {
    if !daje_szczescie {
        return 0.0;
    }
    let extra = match baza_zadowolenie {
        Some(z) if z != 0.0 => building_value(z, przyrost_zadowolenie, level),
        _ => 0.0,
    };
    BUILDING_HAPPINESS_BASE_PER_BUILDING + extra
}
