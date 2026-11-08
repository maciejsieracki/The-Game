//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551 AIDRA): `cityFounderId` / `isCityLostOf` (cities.ts:1120, :1132)
//! oraz addytywne pole `City::founded_by`. Wektory reczne wg definicji webu (generator Node 22 nie
//! obejmuje `cities.ts`: import lancuchowy calego modelu miast) -- ZALOZENIE, do akceptacji.

use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use civ_engine::domain::war_city_founder::{city_founder_id, is_city_lost_of};

#[test]
fn city_founder_id_follows_web() {
    // foundedBy ma pierwszenstwo
    assert_eq!(city_founder_id(3, Some(7), None), Some(7));
    assert_eq!(city_founder_id(3, Some(7), Some(false)), Some(7));
    // brak foundedBy, foundedByOwner === false -> brak tworcy
    assert_eq!(city_founder_id(3, None, Some(false)), None);
    // brak obu pol -> wlasciciel
    assert_eq!(city_founder_id(3, None, None), Some(3));
    assert_eq!(city_founder_id(3, None, Some(true)), Some(3));
}

#[test]
fn is_city_lost_of_follows_web() {
    // wlasne miasto nigdy nie jest "utracone"
    assert!(!is_city_lost_of(2, Some(2), None, 2));
    // zalozone przez civ, dzis u innego -> utracone (dowolna liczba przejsc)
    assert!(is_city_lost_of(5, Some(2), Some(4), 2));
    assert!(is_city_lost_of(5, Some(2), None, 2));
    // zalozone przez kogos innego, obecnie u civ -> nie
    assert!(!is_city_lost_of(2, Some(5), Some(2), 2));
    // brak foundedBy (stary zapis) -> fallback na capturedFromOwnerId
    assert!(is_city_lost_of(5, None, Some(2), 2));
    assert!(!is_city_lost_of(5, None, Some(4), 2));
    assert!(!is_city_lost_of(5, None, None, 2));
}

#[test]
fn city_founded_by_field_defaults_to_none() {
    // Pole addytywne: istniejace konstrukcje (Default) nie zmieniaja zachowania.
    let c = City::default();
    assert_eq!(c.founded_by, None);
    let c2 = City {
        founded_by: Some(4),
        ..City::default()
    };
    assert_eq!(c2.founded_by, Some(4));
    assert_eq!(
        city_founder_id(c2.owner_id, c2.founded_by, c2.founded_by_owner),
        Some(4)
    );
}
