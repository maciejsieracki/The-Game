//! P6.8C (pin webu 91dc998a): kolejka produkcji miasta, odpowiedniki `gra/src/game/production.ts`
//! 1253-1976 (queue helpers + `advanceProduction` z `buildingSpeedBonus`).
//!
//! Typy wspoldzielone z `production_units` (`CityProduction`, `ProductionItem`, `ProductionKind`).
//! `drop_front_item` jest wspoldzielony z `production_units` (ten sam kod co web `dropFrontItem`).
//!
//! Zalozenia (ZALOZENIE, do weryfikacji przez Evaluatora):
//! * web `city` (argument opcjonalny) -> Rust przyjmuje TYLKO pole `postepBudynkowUsuniete`:
//!   `None` = argument `city` nieobecny; `Some(&mut None)` = miasto bez mapy (web `undefined`);
//!   `Some(&mut Some(map))` = miasto z mapa (`Some(pusta)` = web `{}`).
//! * web `index` (liczba) -> Rust `f64`: indeks calkowity w zakresie to pozycja; NaN, ulamek,
//!   +-Infinity i poza zakresem daja zachowanie web dla `undefined` (kopia bez zmian).
//! * web `predicate` (`keep`) -> Rust `impl Fn(&ProductionItem) -> bool`.
//! * web `Record` z kluczem `__proto__`: zapis pomijany (web nie moze ustawic wlasnosci `__proto__`
//!   przypisaniem liczby); odczyt `constructor`/`toString` = brak wpisu (0), jak `BTreeMap`.

use std::collections::BTreeMap;

use crate::domain::civ_matrix::js_compat::js_max;
use crate::domain::production_units::{
    drop_front_item, CityProduction, ProductionItem, ProductionKind,
};

/// web `city.postepBudynkowUsuniete`. `None` = pole nieobecne; `Some(pusta)` = `{}`.
pub type PostepBudynkowUsuniete = BTreeMap<String, f64>;

/// web `frontItem(prod)`: pierwsza pozycja kolejki albo `None`.
pub fn front_item(prod: &CityProduction) -> Option<&ProductionItem> {
    prod.kolejka.first()
}

/// web `etaTurns(koszt, postep, praca)`: `None` gdy `!(praca > 0)`; inaczej `max(1, ceil(max(0, koszt-postep)/praca))`.
pub fn eta_turns(koszt: f64, postep: f64, praca: f64) -> Option<f64> {
    // `!(praca > 0)` z webu: NaN i wartosci <= 0 daja brak oszacowania.
    if praca.is_nan() || praca <= 0.0 {
        return None;
    }
    let rem = js_max(0.0, koszt - postep);
    Some(js_max(1.0, (rem / praca).ceil()))
}

/// web `buildingWorkPerTurn(pracaPerTurn, speedBonus)`. Web-domyslne `speedBonus = 0` = wolajacy podaje `0.0`.
pub fn building_work_per_turn(praca_per_turn: f64, speed_bonus: f64) -> f64 {
    let base = if praca_per_turn.is_finite() && praca_per_turn > 0.0 {
        praca_per_turn
    } else {
        0.0
    };
    let bonus = if speed_bonus.is_finite() {
        speed_bonus
    } else {
        0.0
    };
    let scaled = base * (1.0 + bonus);
    if scaled.is_finite() && scaled > 0.0 {
        scaled
    } else {
        0.0
    }
}

/// web `unitRecruitmentCapacityPerTurn(baseCapacity, speedBonus)`: calkowita pojemnosc (min 1 gdy base > 0).
pub fn unit_recruitment_capacity_per_turn(base_capacity: f64, speed_bonus: f64) -> f64 {
    let base = if base_capacity.is_finite() && base_capacity > 0.0 {
        base_capacity
    } else {
        0.0
    };
    if base <= 0.0 {
        return 0.0;
    }
    let bonus = if speed_bonus.is_finite() {
        speed_bonus
    } else {
        0.0
    };
    js_max(1.0, (base * (1.0 + bonus)).floor())
}

/// Indeks JS `kolejka[index]` trafiajacy w pozycje: calkowity, w zakresie `[0, len)`; inaczej `None`
/// (NaN, ulamek, +-Infinity, poza zakresem) -- odpowiada `undefined` po stronie webu.
fn queue_slot(len: usize, index: f64) -> Option<usize> {
    if index.fract() == 0.0 && index >= 0.0 && index < len as f64 {
        Some(index as usize)
    } else {
        None
    }
}

/// web `forfeitedProgressForIndex(prod, index)`: Praca tracona przy usunieciu pozycji `index`.
pub fn forfeited_progress_for_index(prod: &CityProduction, index: f64) -> f64 {
    let Some(slot) = queue_slot(prod.kolejka.len(), index) else {
        return 0.0;
    };
    if slot == 0 {
        return if prod.postep.is_finite() && prod.postep > 0.0 {
            prod.postep
        } else {
            0.0
        };
    }
    match prod.kolejka[slot].postep {
        Some(p) if p.is_finite() && p > 0.0 => p,
        _ => 0.0,
    }
}

/// web `bankRemovedBuildingProgress(city, prod, index)`: zapis NAJNOWSZEJ proby (nadpisuje). Tylko budynki.
/// Mape tworzy dopiero przy realnym zapisie (jak `city.postepBudynkowUsuniete = {}` w webie).
pub fn bank_removed_building_progress(
    city_map: &mut Option<PostepBudynkowUsuniete>,
    prod: &CityProduction,
    index: f64,
) {
    let Some(slot) = queue_slot(prod.kolejka.len(), index) else {
        return;
    };
    let item = &prod.kolejka[slot];
    if item.kind != ProductionKind::Budynek {
        return;
    }
    let forfeited = forfeited_progress_for_index(prod, index);
    if forfeited.is_nan() || forfeited <= 0.0 {
        return;
    }
    let map = city_map.get_or_insert_with(BTreeMap::new);
    if item.id == "__proto__" {
        return;
    }
    map.insert(item.id.clone(), forfeited);
}

/// web `withdrawBankedBuildingProgress(city, buildingId)`: KONSUMUJE wpis (usuwa klucz), zwraca Prace (0 gdy brak).
pub fn withdraw_banked_building_progress(
    city_map: &mut Option<PostepBudynkowUsuniete>,
    building_id: &str,
) -> f64 {
    let Some(map) = city_map.as_mut() else {
        return 0.0;
    };
    match map.get(building_id).copied() {
        Some(banked) if banked > 0.0 => {
            map.remove(building_id);
            banked
        }
        _ => 0.0,
    }
}

/// web `enqueue(prod, item, city?)`: dopisuje budynek; jednostka = kopia `prod` (twarda bramka).
/// `city_map` jak w definicji modulu (`None` = brak argumentu `city`).
pub fn enqueue(
    prod: &CityProduction,
    item: &ProductionItem,
    city_map: Option<&mut Option<PostepBudynkowUsuniete>>,
) -> CityProduction {
    if item.kind != ProductionKind::Budynek {
        return prod.clone();
    }
    let banked = match city_map {
        Some(m) => withdraw_banked_building_progress(m, &item.id),
        None => 0.0,
    };
    if prod.kolejka.is_empty() {
        return CityProduction {
            kolejka: vec![item.clone()],
            postep: prod.postep + banked,
            wstrzymana: prod.wstrzymana,
            rekrutacja: prod.rekrutacja.clone(),
        };
    }
    let mut kolejka = prod.kolejka.clone();
    kolejka.push(if banked > 0.0 {
        ProductionItem {
            postep: Some(banked),
            ..item.clone()
        }
    } else {
        item.clone()
    });
    CityProduction {
        kolejka,
        postep: prod.postep,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja.clone(),
    }
}

/// web `BuildQueueSanitizeResult`.
#[derive(Debug, Clone, PartialEq)]
pub struct BuildQueueSanitizeResult {
    pub prod: CityProduction,
    /// Praca odzyskana z usunietych, legacy jednostek.
    pub refunded_praca: f64,
}

/// web `FilterQueueResult`.
#[derive(Debug, Clone, PartialEq)]
pub struct FilterQueueResult {
    pub prod: CityProduction,
    /// Praca zbankowana na odrzuconym froncie (`prod.postep`); 0 gdy front przetrwal.
    pub forfeited_postep: f64,
}

/// web `sanitizeBuildQueue(prod)`: usuwa legacy jednostki z kolejki budynkowej (zwraca ich Prace).
pub fn sanitize_build_queue(prod: &CityProduction) -> BuildQueueSanitizeResult {
    if !prod
        .kolejka
        .iter()
        .any(|i| i.kind == ProductionKind::Jednostka)
    {
        return BuildQueueSanitizeResult {
            prod: prod.clone(),
            refunded_praca: 0.0,
        };
    }
    let refunded_waiting = prod
        .kolejka
        .iter()
        .skip(1)
        .filter(|i| i.kind == ProductionKind::Jednostka)
        .fold(0.0, |acc, i| {
            acc + match i.postep {
                Some(p) if p.is_finite() && p > 0.0 => p,
                _ => 0.0,
            }
        });
    let front_is_legacy = prod
        .kolejka
        .first()
        .is_some_and(|i| i.kind == ProductionKind::Jednostka);
    let filtered = filter_queue(prod, |i| i.kind == ProductionKind::Budynek);
    BuildQueueSanitizeResult {
        prod: CityProduction {
            kolejka: filtered.prod.kolejka,
            postep: filtered.prod.postep,
            wstrzymana: filtered.prod.wstrzymana,
            rekrutacja: prod.rekrutacja.clone(),
        },
        refunded_praca: refunded_waiting
            + if front_is_legacy {
                filtered.forfeited_postep
            } else {
                0.0
            },
    }
}

/// web `dequeue(prod, index = 0, city?)`: usuwa pozycje; front traci SWOJ postep, nowy front odzyskuje swoj zbankowany.
/// Indeks nie-calkowity / NaN / poza zakresem = kopia bez zmian (jak web).
pub fn dequeue(
    prod: &CityProduction,
    index: f64,
    city_map: Option<&mut Option<PostepBudynkowUsuniete>>,
) -> CityProduction {
    let Some(slot) = queue_slot(prod.kolejka.len(), index) else {
        return prod.clone();
    };
    if let Some(m) = city_map {
        bank_removed_building_progress(m, prod, index);
    }
    if slot == 0 {
        let (kolejka, postep) = drop_front_item(&prod.kolejka, 0.0);
        return CityProduction {
            kolejka,
            postep,
            wstrzymana: prod.wstrzymana,
            rekrutacja: prod.rekrutacja.clone(),
        };
    }
    let kolejka: Vec<ProductionItem> = prod
        .kolejka
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != slot)
        .map(|(_, it)| it.clone())
        .collect();
    CityProduction {
        kolejka,
        postep: prod.postep,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja.clone(),
    }
}

/// web `filterQueue(prod, keep)`: usuwa pozycje, dla ktorych `keep` jest false.
/// Odrzucony front oddaje swoj aktywny postep jako `forfeited_postep` (nie przechodzi na nowy front).
pub fn filter_queue(
    prod: &CityProduction,
    keep: impl Fn(&ProductionItem) -> bool,
) -> FilterQueueResult {
    let kolejka: Vec<ProductionItem> = prod.kolejka.iter().filter(|i| keep(i)).cloned().collect();
    if kolejka.len() == prod.kolejka.len() {
        return FilterQueueResult {
            prod: prod.clone(),
            forfeited_postep: 0.0,
        };
    }
    let front_removed = !prod.kolejka.is_empty() && !keep(&prod.kolejka[0]);
    if !front_removed {
        return FilterQueueResult {
            prod: CityProduction {
                kolejka,
                ..prod.clone()
            },
            forfeited_postep: 0.0,
        };
    }
    let mut padded = Vec::with_capacity(kolejka.len() + 1);
    padded.push(prod.kolejka[0].clone());
    padded.extend(kolejka);
    let (rest, postep) = drop_front_item(&padded, 0.0);
    let forfeited = if prod.postep.is_finite() && prod.postep > 0.0 {
        prod.postep
    } else {
        0.0
    };
    FilterQueueResult {
        prod: CityProduction {
            kolejka: rest,
            postep,
            wstrzymana: prod.wstrzymana,
            rekrutacja: prod.rekrutacja.clone(),
        },
        forfeited_postep: forfeited,
    }
}

/// web `promoteToFront(prod, index)`: zamienia pozycje `index >= 1` z frontem; postep per item.
pub fn promote_to_front(prod: &CityProduction, index: f64) -> CityProduction {
    let slot = queue_slot(prod.kolejka.len(), index).filter(|&s| s >= 1);
    let Some(slot) = slot else {
        return prod.clone();
    };
    let mut kolejka = prod.kolejka.clone();
    let outgoing = prod.kolejka[0].clone();
    let incoming = prod.kolejka[slot].clone();
    kolejka[slot] = ProductionItem {
        postep: Some(prod.postep),
        ..outgoing
    };
    let incoming_postep = incoming.postep.unwrap_or(0.0);
    kolejka[0] = ProductionItem {
        postep: None,
        ..incoming
    };
    CityProduction {
        kolejka,
        postep: incoming_postep,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja.clone(),
    }
}

/// web `insertAtFront(prod, item, activePostep)`: wstawia budynek na front; bankuje stary postep frontu na itemie.
pub fn insert_at_front(
    prod: &CityProduction,
    item: &ProductionItem,
    active_postep: f64,
) -> CityProduction {
    if item.kind != ProductionKind::Budynek {
        return prod.clone();
    }
    let mut kolejka = prod.kolejka.clone();
    if !kolejka.is_empty() && prod.postep.is_finite() && prod.postep > 0.0 {
        kolejka[0].postep = Some(prod.postep);
    }
    let mut out = Vec::with_capacity(kolejka.len() + 1);
    out.push(ProductionItem {
        postep: None,
        ..item.clone()
    });
    out.extend(kolejka);
    CityProduction {
        kolejka: out,
        postep: active_postep,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja.clone(),
    }
}

/// web `AdvanceProductionResult`.
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceProductionResult {
    pub prod: CityProduction,
    /// Ukonczona pozycja tej tury albo `None`.
    pub completed: Option<ProductionItem>,
    /// Nadwyzka Pracy do puli ulepszen (`None` = web `undefined`).
    pub overflow_to_pool: Option<f64>,
}

/// web `advanceProduction(prod, pracaPerTurn, buildingSpeedBonus = 0)`: jedna tura Pracy w kolejke.
/// Pauza (`wstrzymana`) nie dodaje Pracy; pusta kolejka oddaje calosc do puli; najwyzej jedna pozycja na ture.
pub fn advance_production(
    prod: &CityProduction,
    praca_per_turn: f64,
    building_speed_bonus: f64,
) -> AdvanceProductionResult {
    if prod.wstrzymana == Some(true) {
        return AdvanceProductionResult {
            prod: prod.clone(),
            completed: None,
            overflow_to_pool: None,
        };
    }
    let base = if praca_per_turn.is_finite() && praca_per_turn > 0.0 {
        praca_per_turn
    } else {
        0.0
    };
    let Some(front) = prod.kolejka.first() else {
        return AdvanceProductionResult {
            prod: CityProduction {
                kolejka: Vec::new(),
                postep: 0.0,
                wstrzymana: prod.wstrzymana,
                rekrutacja: prod.rekrutacja.clone(),
            },
            completed: None,
            overflow_to_pool: if base > 0.0 { Some(base) } else { None },
        };
    };
    let praca = if front.kind == ProductionKind::Budynek {
        building_work_per_turn(base, building_speed_bonus)
    } else {
        base
    };
    let accumulated = prod.postep + praca;
    if accumulated < front.koszt {
        return AdvanceProductionResult {
            prod: CityProduction {
                kolejka: prod.kolejka.clone(),
                postep: accumulated,
                wstrzymana: prod.wstrzymana,
                rekrutacja: prod.rekrutacja.clone(),
            },
            completed: None,
            overflow_to_pool: None,
        };
    }
    let remainder = accumulated - front.koszt;
    let (rest, postep) = drop_front_item(&prod.kolejka, remainder);
    if !rest.is_empty() {
        return AdvanceProductionResult {
            prod: CityProduction {
                kolejka: rest,
                postep,
                wstrzymana: prod.wstrzymana,
                rekrutacja: prod.rekrutacja.clone(),
            },
            completed: Some(front.clone()),
            overflow_to_pool: None,
        };
    }
    AdvanceProductionResult {
        prod: CityProduction {
            kolejka: Vec::new(),
            postep: 0.0,
            wstrzymana: prod.wstrzymana,
            rekrutacja: prod.rekrutacja.clone(),
        },
        completed: Some(front.clone()),
        overflow_to_pool: if remainder > 0.0 {
            Some(remainder)
        } else {
            None
        },
    }
}
