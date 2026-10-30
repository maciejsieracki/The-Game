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
use crate::domain::civ_matrix::js_compat::js_min;
use crate::domain::civ_matrix::{apply_civ_matrix_param, civ_matrix_param, resolve_row};
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
