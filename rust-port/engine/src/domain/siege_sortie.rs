//! R-WEB-SIEGE-SORTIE-ANY-TURN-Q1 / R-WEB-SIEGE-LAST-STAND-SORTIE-Q1 (partia P2, R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1):
//! wypad obleganej armii.
//!
//! Port czystej czesci `gra/src/game/siege-last-stand.ts` (web `a61337844`):
//! * [`shouldLastStandSortie`] = [`should_last_stand_sortie`] (`siege-last-stand.ts:59-62`): sila obleganych * 10 >= sila
//!   oblegajacych * 8 (+ EPS 1e-9), obie sily > 0;
//! * [`isLastTurnBeforeCapitulation`] = [`is_last_turn_before_capitulation`] (`siege-last-stand.ts:47-49`);
//! * [`canUnitSortie`] = [`can_unit_sortie`] (`siege-last-stand.ts:94-100`);
//! * [`planLastStandSortie`] = [`plan_last_stand_sortie`] (`siege-last-stand.ts:117-199`), bez mutacji wejscia.
//!
//! Regula: w KAZDEJ turze oblezenia wypad TAK <=> sila oblezonych >= 80% sily oblegajacych (10 : 8; 80% atakuje, 79% nie).
//! Kotwica = najsilniejsza ruchoma jednostka (remis -> najnizsze id). Cel = oblegajacy z najwieksza liczba
//! oblegajacych w promieniu 1 (remis -> pierwszy w kolejnosci id).
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu):
//! * Z-SO-1 Sila jednostki i predykat wojskowosci sa wstrzykiwane jako closure (web: `siegeAi.estimateUnitCombatStrength`
//!   po `runtimeUnitToSiegeUnit` oraz `isMilitary`); ten modul nie liczy sily sam.
//! * Z-SO-2 `ruchLeft` = `f64`; `ruchLeft <= 0` => nie rusza sie; NaN NIE blokuje (jak JS `NaN <= 0 === false`).
//! * Z-SO-3 Wspolrzedne `i64`; odleglosc heksowa wstrzykiwana (web: `deps.hexDistance`).
//! * Z-SO-4 Brak pola w JS = `None` / `false`; `ownerId` `None` obslugiwany przez `besiegerOwnerId: Option<i64>`.

/// Licznik progu: sila oblezonych * 10 >= sila oblegajacych * 8 (10 : 8 = -20%). Web `LAST_STAND_BESIEGER_PARTS`.
pub const LAST_STAND_BESIEGER_PARTS: f64 = 10.0;
/// Mianownik progu. Web `LAST_STAND_BESIEGED_PARTS`.
pub const LAST_STAND_BESIEGED_PARTS: f64 = 8.0;
const EPS: f64 = 1e-9;

/// Minimalny ksztalt miasta potrzebny do predykatu ostatniej tury (web `LastStandCity`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LastStandCity {
    pub id: String,
    pub q: i64,
    pub r: i64,
    pub owner_id: i64,
    /// Web `oblegane` (`None` = `undefined`).
    pub oblegane: Option<bool>,
    /// Web `siegeCapitulationPending`.
    pub siege_capitulation_pending: Option<bool>,
}

/// Web `isLastTurnBeforeCapitulation`: miasto oblegane ORAZ `siegeCapitulationPending`.
pub fn is_last_turn_before_capitulation(city: &LastStandCity) -> bool {
    city.oblegane == Some(true) && city.siege_capitulation_pending == Some(true)
}

/// Web `shouldLastStandSortie`. Brak wypadu gdy ktorakolwiek sila nie jest > 0 (takze NaN).
pub fn should_last_stand_sortie(besieged_strength: f64, besieger_strength: f64) -> bool {
    // Web `!(x > 0)`: NaN nie jest > 0, wiec NaN albo <= 0 => brak wypadu.
    let not_positive = |x: f64| x.is_nan() || x <= 0.0;
    if not_positive(besieged_strength) || not_positive(besieger_strength) {
        return false;
    }
    besieged_strength * LAST_STAND_BESIEGER_PARTS + EPS
        >= besieger_strength * LAST_STAND_BESIEGED_PARTS
}

/// Jednostka widziana przez planer (web `LastStandUnit`).
#[derive(Debug, Clone, PartialEq)]
pub struct SortieUnit {
    pub id: String,
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    pub ruch_left: f64,
    pub embarked: bool,
    pub sentry: bool,
    pub ufortyfikowany_w_polu: bool,
    pub oblega_city_id: Option<String>,
}

/// Komenda ataku w formacie `AICmdAttack` (web `LastStandAttackCmd`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LastStandAttackCmd {
    pub unit_id: String,
    pub target_unit_id: String,
}

/// Plan wypadu (web `LastStandPlan`).
#[derive(Debug, Clone, PartialEq)]
pub struct LastStandPlan {
    pub city_id: String,
    pub is_last_turn: bool,
    pub besieged_strength: f64,
    pub besieger_strength: f64,
    pub sortie: bool,
    /// Powod (PL) do logu i testow.
    pub reason: &'static str,
    /// 0 lub 1 komenda ataku.
    pub commands: Vec<LastStandAttackCmd>,
}

/// Web `canUnitSortie`: ma ruch, nie zaokretowana, nie oblegajaca. Sen / fortyfikacja / garnizon NIE blokuja.
pub fn can_unit_sortie(u: &SortieUnit) -> bool {
    if u.ruch_left <= 0.0 {
        return false;
    }
    if u.embarked {
        return false;
    }
    if u.oblega_city_id.as_deref().is_some_and(|s| !s.is_empty()) {
        return false;
    }
    true
}

/// Wstrzykiwane zaleznosci planera (web `LastStandDeps`).
pub struct LastStandDeps<'a> {
    pub strength_of: &'a dyn Fn(&SortieUnit) -> f64,
    pub is_military: &'a dyn Fn(&SortieUnit) -> bool,
    pub is_enemy: &'a dyn Fn(i64, i64) -> bool,
    pub hex_distance: &'a dyn Fn(i64, i64, i64, i64) -> i64,
}

/// Web `planLastStandSortie`. Nie mutuje wejscia. `besieger_owner_id` = web `city.oblegajacyOwnerId`.
pub fn plan_last_stand_sortie(
    city: &LastStandCity,
    besieger_owner_id: Option<i64>,
    units: &[SortieUnit],
    deps: &LastStandDeps<'_>,
) -> LastStandPlan {
    let is_last_turn = is_last_turn_before_capitulation(city);
    let none = |reason: &'static str, bd: f64, br: f64| LastStandPlan {
        city_id: city.id.clone(),
        is_last_turn,
        besieged_strength: bd,
        besieger_strength: br,
        sortie: false,
        reason,
        commands: Vec::new(),
    };

    if city.oblegane != Some(true) {
        return none("miasto nie jest oblegane", 0.0, 0.0);
    }
    let Some(besieger) = besieger_owner_id else {
        return none("brak oblegającego", 0.0, 0.0);
    };
    if besieger == city.owner_id || !(deps.is_enemy)(city.owner_id, besieger) {
        return none("oblegający nie jest wrogiem", 0.0, 0.0);
    }

    // Oblegana armia = wojskowe jednostki wlasciciela na heksie miasta (posortowane po id).
    let mut defenders: Vec<&SortieUnit> = units
        .iter()
        .filter(|u| {
            u.owner_id == city.owner_id && u.q == city.q && u.r == city.r && (deps.is_military)(u)
        })
        .collect();
    defenders.sort_by(|a, b| a.id.cmp(&b.id));
    // Oblegajacy = wojskowe jednostki oblegajacego przy murach (dystans 1), bez zaokretowanych.
    let mut besiegers: Vec<&SortieUnit> = units
        .iter()
        .filter(|u| {
            u.owner_id == besieger
                && (deps.hex_distance)(u.q, u.r, city.q, city.r) == 1
                && !u.embarked
                && (deps.is_military)(u)
        })
        .collect();
    besiegers.sort_by(|a, b| a.id.cmp(&b.id));

    // Sumy jawnie od 0.0 (jak w JS `bd = 0; bd += ...`).
    let bd: f64 = defenders
        .iter()
        .fold(0.0, |acc, u| acc + (deps.strength_of)(u));
    let br: f64 = besiegers
        .iter()
        .fold(0.0, |acc, u| acc + (deps.strength_of)(u));

    if defenders.is_empty() {
        return none("brak obrońców", bd, br);
    }
    if besiegers.is_empty() {
        return none("brak oblegających przy murach", bd, br);
    }
    if !should_last_stand_sortie(bd, br) {
        return none(
            "siła obleganych poniżej 80% oblegających -- zostaje w oblężeniu",
            bd,
            br,
        );
    }

    // Kotwica = najsilniejsza ruchoma jednostka (remis -> najnizsze id; defenders juz posortowane).
    let mut anchor: Option<&SortieUnit> = None;
    let mut anchor_str: f64 = -1.0;
    for &d in &defenders {
        if !can_unit_sortie(d) {
            continue;
        }
        let st = (deps.strength_of)(d);
        if st > anchor_str + EPS {
            anchor = Some(d);
            anchor_str = st;
        }
    }
    let Some(anchor) = anchor else {
        return none("żadna jednostka nie może się ruszyć -- zostaje", bd, br);
    };

    // Cel: oblegajacy z najwieksza liczba oblegajacych w promieniu 1 (remis -> pierwszy wg id).
    let mut target: &SortieUnit = besiegers[0];
    let mut best_cover: i64 = -1;
    for &cand in &besiegers {
        let cover = besiegers
            .iter()
            .filter(|o| (deps.hex_distance)(cand.q, cand.r, o.q, o.r) <= 1)
            .count() as i64;
        if cover > best_cover {
            best_cover = cover;
            target = cand;
        }
    }

    LastStandPlan {
        city_id: city.id.clone(),
        is_last_turn,
        besieged_strength: bd,
        besieger_strength: br,
        sortie: true,
        reason: "wypad obleganej armii (siła obleganych >= 80% oblegających)",
        commands: vec![LastStandAttackCmd {
            unit_id: anchor.id.clone(),
            target_unit_id: target.id.clone(),
        }],
    }
}
