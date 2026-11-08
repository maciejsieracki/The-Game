//! R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1 (partia P2, R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1): wejscie oblegajacej armii
//! do miasta po kapitulacji.
//!
//! Port czystej czesci `gra/src/game/siege-enter-city.ts` (web `a61337844`):
//! * [`plan_surrender_entry`] = `planSurrenderEntry` (`siege-enter-city.ts:51-87`), bez mutacji;
//! * [`enter_city_after_surrender`] = `enterCityAfterSurrender` (`siege-enter-city.ts:89-106`), mutuje `units`.
//!
//! Zasady (web, zalozenia Z1-Z5 z naglowka modulu zrodlowego):
//! * Z1 zdobywca (gracz, AI, barbarzyncy) bez rozgalezien po wlascicielu;
//! * Z2 wchodzi JEDNA glowna armia: stos oblegajacych jednostek niecywilnych o najwiekszej liczbie; remis -> stos
//!   z generalem; dalszy remis -> najmniejsze (leksykograficznie) id w stosie;
//! * Z3 wejscie bez kosztu ruchu i bez walki; `inGarnizon` / `ufortyfikowanyWPolu` zdejmowane;
//! * Z4 obca jednostka na heksie miasta blokuje wejscie (zwraca pusty plan);
//! * Z5 cywilne i zaokretowane zostaja na heksie.
//!
//! R-WEB-ARMY-STACK-LIMIT-Q1: [`SiegeEnterDeps::stack_limit`] = limit jednostek w jednym heksie; grupa, ktora sie nie
//! miesci (wlasne jednostki juz na heksie miasta + grupa > limit), jest pomijana. `None` = bez limitu (web: `undefined`).
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu):
//! * Z-EC-1 Pola JS `inGarnizon` / `ufortyfikowanyWPolu` / `embarked` / `isGeneral` to `bool` (brak pola = `false`);
//!   web sprawdza `=== true`, wiec `undefined` i `false` sa tozsame.
//! * Z-EC-2 `oblegaCityId` = `Option<String>`; `None` nie pasuje do zadnego miasta (web: `undefined !== city.id`).
//! * Z-EC-3 Wspolrzedne heksow to `i64` (web: liczby calkowite). Klucz grupy = para `(q, r)`.
//! * Z-EC-4 Sortowanie id: porzadek bajtowy `String` = porzadek JS dla ASCII (id jednostek sa ASCII).
//! * Z-EC-5 `isCivilian` wstrzykiwane jako closure (web: `deps.isCivilian`).

use std::collections::BTreeMap;

/// Web `SiegeEnterUnit`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct EnterUnit {
    pub id: String,
    pub owner_id: i64,
    pub type_id: String,
    pub category: String,
    pub q: i64,
    pub r: i64,
    pub oblega_city_id: Option<String>,
    pub is_general: bool,
    pub embarked: bool,
    pub in_garnizon: bool,
    pub ufortyfikowany_w_polu: bool,
}

/// Web `SiegeEnterCity`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnterCity {
    pub id: String,
    pub q: i64,
    pub r: i64,
}

/// Web `SiegeEnterDeps` (`isCivilian` jako closure, `stackLimit` jako `Option`).
pub struct SiegeEnterDeps<'a> {
    pub is_civilian: &'a dyn Fn(&EnterUnit) -> bool,
    pub stack_limit: Option<i64>,
}

/// Web `planSurrenderEntry`: id jednostek wchodzacych do miasta (posortowane); pusty = nikt.
pub fn plan_surrender_entry(
    units: &[EnterUnit],
    city: &EnterCity,
    new_owner_id: i64,
    deps: &SiegeEnterDeps<'_>,
) -> Vec<String> {
    // Z4: obca jednostka na heksie miasta blokuje wejscie.
    if units
        .iter()
        .any(|u| u.q == city.q && u.r == city.r && u.owner_id != new_owner_id)
    {
        return Vec::new();
    }
    // Z2 kandydaci: stosy oblegajacych niecywilnych, poza miastem.
    let mut groups: BTreeMap<(i64, i64), Vec<&EnterUnit>> = BTreeMap::new();
    for u in units {
        if u.owner_id != new_owner_id || u.oblega_city_id.as_deref() != Some(city.id.as_str()) {
            continue;
        }
        if u.embarked || (deps.is_civilian)(u) {
            continue;
        }
        if u.q == city.q && u.r == city.r {
            continue;
        }
        groups.entry((u.q, u.r)).or_default().push(u);
    }
    // R-WEB-ARMY-STACK-LIMIT-Q1: miejsce w stosie miasta (wlasne jednostki juz tam stojace).
    let room: Option<i64> = deps.stack_limit.map(|limit| {
        let present = units
            .iter()
            .filter(|u| u.owner_id == new_owner_id && u.q == city.q && u.r == city.r)
            .count() as i64;
        limit - present
    });
    let mut best: Option<&Vec<&EnterUnit>> = None;
    for g in groups.values() {
        if let Some(room) = room {
            if g.len() as i64 > room {
                continue;
            }
        }
        best = match best {
            None => Some(g),
            Some(b) => Some(if prefer(g, b) { g } else { b }),
        };
    }
    let mut ids: Vec<String> = best
        .map(|g| g.iter().map(|u| u.id.clone()).collect())
        .unwrap_or_default();
    ids.sort();
    ids
}

/// `true` gdy stos `g` wygrywa z `b`: wiekszy; przy rownosci stos z generalem; przy dalszym remisie nizsze min-id.
fn prefer(g: &[&EnterUnit], b: &[&EnterUnit]) -> bool {
    if g.len() != b.len() {
        return g.len() > b.len();
    }
    let g_gen = g.iter().any(|u| u.is_general);
    let b_gen = b.iter().any(|u| u.is_general);
    if g_gen != b_gen {
        return g_gen;
    }
    min_id(g) < min_id(b)
}

fn min_id<'a>(g: &[&'a EnterUnit]) -> &'a str {
    g.iter().map(|u| u.id.as_str()).min().unwrap_or("")
}

/// Web `enterCityAfterSurrender`: wykonuje plan (mutuje `units`). Zwraca wchodzace jednostki (posortowane po id).
pub fn enter_city_after_surrender(
    units: &mut [EnterUnit],
    city: &EnterCity,
    new_owner_id: i64,
    deps: &SiegeEnterDeps<'_>,
) -> Vec<String> {
    let ids = plan_surrender_entry(units, city, new_owner_id, deps);
    let mut moved: Vec<String> = Vec::new();
    for u in units.iter_mut() {
        if !ids.contains(&u.id) {
            continue;
        }
        u.q = city.q;
        u.r = city.r;
        u.in_garnizon = false;
        u.ufortyfikowany_w_polu = false;
        moved.push(u.id.clone());
    }
    moved.sort();
    moved
}
