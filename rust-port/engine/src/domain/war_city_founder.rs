//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551, AIDRA): tworca miasta i "utracone miasto".
//!
//! Port 1:1 z `gra/src/game/cities.ts` (pin `origin/main` 14f2af1b0):
//! - `cityFounderId` (:1120) -- `foundedBy`, a gdy brak: `foundedByOwner === false` -> brak, inaczej wlasciciel,
//! - `isCityLostOf` (:1132) -- miasto zalozone przez `ownerId`, dzis nalezace do kogos innego;
//!   bez `foundedBy` (stary zapis) fallback na `capturedFromOwnerId === ownerId`.
//!
//! Pole `foundedBy` jest dodane addytywnie do modelu `City` (`state.rs`, `founded_by: Option<i64>`).
//! `capturedFromOwnerId` NIE istnieje jeszcze w modelu Rust -- przekazuje je wolajacy (`None` = brak pola).

/// Web `cityFounderId` (cities.ts:1120). `None` = miasto bez tworcy (`foundedByOwner === false`).
pub fn city_founder_id(
    owner_id: i64,
    founded_by: Option<i64>,
    founded_by_owner: Option<bool>,
) -> Option<i64> {
    if let Some(f) = founded_by {
        return Some(f);
    }
    if founded_by_owner == Some(false) {
        None
    } else {
        Some(owner_id)
    }
}

/// Web `isCityLostOf` (cities.ts:1132): czy miasto jest "utracone" dla cywilizacji `owner_id_of_civ`.
pub fn is_city_lost_of(
    city_owner_id: i64,
    founded_by: Option<i64>,
    captured_from_owner_id: Option<i64>,
    civ_owner_id: i64,
) -> bool {
    if city_owner_id == civ_owner_id {
        return false;
    }
    match founded_by {
        Some(f) => f == civ_owner_id,
        None => captured_from_owner_id == Some(civ_owner_id),
    }
}
