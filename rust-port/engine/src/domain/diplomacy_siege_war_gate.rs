//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia D, runda 2): port 1:1 z webem
//! `gra/src/game/diplomacy-siege-war-gate.ts` (R-WEB-AI-SIEGE-WITHOUT-WAR-Q1) wraz z podzbiorem
//! `gra/src/game/mapSiegeDetect.ts` potrzebnym przez tę bramkę (`classifyCityAttack`, `MapSiegeContext`).
//!
//! Pin webu: `origin/main` (wypakowanie `git archive origin/main gra/src gra/data` poza repo).
//! Zasada: oblężenie / szturm / auto-oblężenie wolno założyć i utrzymać WYŁĄCZNIE między wrogami
//! (`are_enemies`, web `areEnemies` = `areEnemyOwners`). Obca jednostka w pokoju przy murze nie zakłada oblężenia.
//!
//! ZAŁOŻENIE (odstępstwo od formy, nie od semantyki): web operuje na obiektach `City` / `RuntimeUnit`
//! i zwraca obiekty `MapSiegeContext`. Tu `City` i `RuntimeUnit` są odchudzone do pól używanych przez
//! te funkcje, a jednostki identyfikowane są indeksem w slice `units` (web: `units.indexOf(...)`).
//! `hexDistance` = `setup.ts:359` (kopia w `hex_distance`, dla współrzędnych całkowitych).

/// Web `City` (pola używane przez bramkę oblężenia).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeCity {
    pub q: i64,
    pub r: i64,
    pub owner_id: i64,
    /// Web `city.maMur`.
    pub ma_mur: bool,
    /// Web `city.oblegane`.
    pub oblegane: bool,
}

/// Web `RuntimeUnit` (pola używane przez bramkę oblężenia).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeUnit {
    pub q: i64,
    pub r: i64,
    pub owner_id: i64,
}

/// Web `MapStarcieTryb`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MapStarcieTryb {
    Oblezenie,
    ZdobycieZMarszu,
    BitwaPolowa,
}

/// Web `MapSiegeContext`. `atakujacy` i `garnizonUnit` jako indeksy w `units`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MapSiegeContext {
    pub tryb: MapStarcieTryb,
    pub atakujacy_idx: usize,
    pub garnizon_idx: Option<usize>,
    /// Web `oblegajacyOwnerId` = `atakujacy.ownerId`.
    pub oblegajacy_owner_id: i64,
}

/// Web `hexDistance` (`setup.ts:359`) dla współrzędnych całkowitych.
pub fn hex_distance(aq: i64, ar: i64, bq: i64, br: i64) -> i64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// Web `siegeAllowedBetween`: oblegający != właściciel miasta ORAZ są wrogami.
pub fn siege_allowed_between(
    besieger_owner_id: i64,
    defender_owner_id: i64,
    are_enemies: impl Fn(i64, i64) -> bool,
) -> bool {
    if besieger_owner_id == defender_owner_id {
        return false;
    }
    are_enemies(besieger_owner_id, defender_owner_id)
}

/// Web `enemyUnitsAdjacentToCity`: indeksy jednostek przy murach (dystans 1) wrogich właścicielowi miasta.
pub fn enemy_units_adjacent_to_city(
    city: &SiegeCity,
    units: &[SiegeUnit],
    are_enemies: impl Fn(i64, i64) -> bool,
) -> Vec<usize> {
    units
        .iter()
        .enumerate()
        .filter(|(_, u)| {
            hex_distance(u.q, u.r, city.q, city.r) == 1
                && siege_allowed_between(u.owner_id, city.owner_id, &are_enemies)
        })
        .map(|(i, _)| i)
        .collect()
}

/// Web `classifyCityAttack` (mapSiegeDetect.ts): garnizon = pierwsza jednostka właściciela miasta na jego heksie;
/// mur -> oblężenie; brak muru + garnizon -> zdobycie z marszu; inaczej bitwa polowa.
pub fn classify_city_attack(
    atakujacy_idx: usize,
    city: &SiegeCity,
    units: &[SiegeUnit],
) -> MapSiegeContext {
    let garnizon_idx = units
        .iter()
        .position(|u| u.owner_id == city.owner_id && u.q == city.q && u.r == city.r);
    let tryb = if city.ma_mur {
        MapStarcieTryb::Oblezenie
    } else if garnizon_idx.is_some() {
        MapStarcieTryb::ZdobycieZMarszu
    } else {
        MapStarcieTryb::BitwaPolowa
    };
    MapSiegeContext {
        tryb,
        atakujacy_idx,
        garnizon_idx,
        oblegajacy_owner_id: units[atakujacy_idx].owner_id,
    }
}

/// Web `detectWarAutoSiegeOnCity`: kotwicą może być wyłącznie jednostka WROGA przy murze.
pub fn detect_war_auto_siege_on_city(
    city: &SiegeCity,
    units: &[SiegeUnit],
    are_enemies: impl Fn(i64, i64) -> bool,
) -> Option<MapSiegeContext> {
    if !city.ma_mur {
        return None;
    }
    let anchor = *enemy_units_adjacent_to_city(city, units, are_enemies).first()?;
    Some(classify_city_attack(anchor, city, units))
}

/// Web `isSiegeStillValid`: oblegający nadal wrogi właścicielowi miasta ORAZ stoi przy murze.
pub fn is_siege_still_valid(
    city: &SiegeCity,
    besieger_owner_id: i64,
    units: &[SiegeUnit],
    are_enemies: impl Fn(i64, i64) -> bool,
) -> bool {
    if !siege_allowed_between(besieger_owner_id, city.owner_id, are_enemies) {
        return false;
    }
    units
        .iter()
        .any(|u| u.owner_id == besieger_owner_id && hex_distance(u.q, u.r, city.q, city.r) == 1)
}

/// Web `aiAutoSiegeAllowed` (R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (C)).
pub fn ai_auto_siege_allowed(
    city_owner_id: i64,
    besieger_owner_id: i64,
    is_human_owner: impl Fn(i64) -> bool,
    is_barbarian_owner: impl Fn(i64) -> bool,
) -> bool {
    if is_human_owner(city_owner_id) {
        return true;
    }
    if is_human_owner(besieger_owner_id) {
        return false;
    }
    if is_barbarian_owner(city_owner_id) || is_barbarian_owner(besieger_owner_id) {
        return false;
    }
    city_owner_id != besieger_owner_id
}

/// Web `autoSiegeCandidateForScan`: kandydat na auto-oblężenie w skanie po turze AI.
pub fn auto_siege_candidate_for_scan(
    city: &SiegeCity,
    units: &[SiegeUnit],
    are_enemies: impl Fn(i64, i64) -> bool,
    is_human_owner: impl Fn(i64) -> bool,
    is_barbarian_owner: impl Fn(i64) -> bool,
) -> Option<MapSiegeContext> {
    if city.oblegane || !city.ma_mur {
        return None;
    }
    let auto = detect_war_auto_siege_on_city(city, units, are_enemies)?;
    if city.owner_id != 0 && is_human_owner(city.owner_id) {
        return None;
    }
    if !ai_auto_siege_allowed(
        city.owner_id,
        auto.oblegajacy_owner_id,
        &is_human_owner,
        &is_barbarian_owner,
    ) {
        return None;
    }
    Some(auto)
}
