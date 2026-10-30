//! REPIN-EKONOMIA-B2 (pin webu 91dc998a): odpowiedniki z `gra/src/game/production.ts`
//! dodane w hunkach 3 (`epochNumber` / `newestAvailableSameTypeUnit`, web:190-226).
//!
//! Zalozenia (ZALOZENIE, do weryfikacji przez Evaluatora):
//! * web operuje na obiektach `UnitDef`; Rust przyjmuje plaski widok `UnitRow` z polami
//!   `Jednostka`, `Typ`, `Epoka` (`None` = pole brakujace albo `null`).
//! * zwracany jest indeks w `units` zamiast obiektu (ten sam wiersz, bez kopiowania).
//! * web `Set` kandydatow i porownanie `Jednostka` sa dokladne (bez trim/normalizacji).

use crate::domain::civ_matrix::js_compat::js_trim;

/// Plaski widok wiersza jednostki (pola uzywane przez web `newestAvailableSameTypeUnit`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitRow<'a> {
    /// web `Jednostka`.
    pub jednostka: &'a str,
    /// web `Typ` (`None` = brak; web traktuje jako pusty napis).
    pub typ: Option<&'a str>,
    /// web `Epoka` (`None` = brak / `null`).
    pub epoka: Option<&'a str>,
}

/// web `EPOCH_BY_NAME` + `epochNumber` (production.ts:190-205).
/// Brak / nieznana nazwa epoki = 1 (najwczesniejsza). Klucze ASCII i z diakrytykami.
pub fn epoch_number(epoka: Option<&str>) -> u32 {
    match epoka {
        Some("Kamien") | Some("Kamień") => 1,
        Some("Braz") | Some("Brąz") => 2,
        Some("Zelazo") | Some("Żelazo") => 3,
        _ => 1,
    }
}

/// web `newestAvailableSameTypeUnit` (production.ts:210-226).
///
/// Zwraca indeks w `units` najnowszej epoki (ściśle nowszej niz bieżaca) o tym samym `Typ`
/// (po `trim`), ktorej nazwa jest w `candidate_names`. Remis: wygrywa pierwszy w kolejnosci
/// `units`. Gdy bieżąca jednostka nie istnieje albo ma pusty `Typ` - `None`.
pub fn newest_available_same_type_unit(
    current_unit_name: &str,
    candidate_names: &[&str],
    units: &[UnitRow<'_>],
) -> Option<usize> {
    let current_idx = units
        .iter()
        .position(|u| u.jednostka == current_unit_name)?;
    let current = units[current_idx];
    let current_typ = js_trim(current.typ.unwrap_or(""));
    if current_typ.is_empty() {
        return None;
    }
    let current_epoch = epoch_number(current.epoka);
    let mut best: Option<usize> = None;
    for (idx, unit) in units.iter().enumerate() {
        if !candidate_names.contains(&unit.jednostka) {
            continue;
        }
        if js_trim(unit.typ.unwrap_or("")) != current_typ {
            continue;
        }
        let epoch = epoch_number(unit.epoka);
        if epoch <= current_epoch {
            continue;
        }
        match best {
            None => best = Some(idx),
            Some(b) if epoch > epoch_number(units[b].epoka) => best = Some(idx),
            Some(_) => {}
        }
    }
    best
}

// ---------------------------------------------------------------------------
// P6.8A-P1 (pin webu 91dc998a): odpowiedniki z `gra/src/game/building-upgrades.ts`
// bez zaleznosci od danych (`miasto-params.json`, `unit-building-bonuses`).
// Zalozenia (ZALOZENIE, Operator R1):
// * `buildingStructuralDefenseBonusPercent` dostaje wartosc procentowa jako argument
//   (web czyta ja z `miasto-params.json`); mapowanie klucza parametru jest tu.
// * `buildingStatSummaryLines` / `cumulativeMnoznikForBuildingId` NIE sa w tej partii
//   (zaleza od `unit-building-bonuses`) -> NASTEPNA-PARTIA.
// * web `Map` z duplikatami id: ostatni wpis wygrywa (`upgrade_chain_steps`);
//   `Array.find` (prev w `upgrade_production_display_name`): pierwszy wpis wygrywa.
// * Cykl w `upgradeFrom` web zapetliłby sie w nieskonczonosc; Rust przerywa po
//   odwiedzeniu wezla (ZALOZENIE: brak cykli w danych, guard jest bezpieczenstwem).
// ---------------------------------------------------------------------------

/// web `BuildingUpgradeLite` (pola uzywane przez helpery P1).
#[derive(Debug, Clone, PartialEq)]
pub struct BuildingUpgradeLite {
    pub id: String,
    pub nazwa: String,
    /// web `upgradeFrom` (`None` = brak pola / `undefined`).
    pub upgrade_from: Option<String>,
    /// web `suppressed` (`None` = brak pola; web traktuje jak `false`).
    pub suppressed: Option<bool>,
}

/// web `isBuildingSuppressedFromProduction`: wylacznie `suppressed === true`.
pub fn is_building_suppressed_from_production(building: &BuildingUpgradeLite) -> bool {
    building.suppressed == Some(true)
}

/// web `upgradeChainSteps`: lancuch [najstarszy ... aktualny].
pub fn upgrade_chain_steps<'a>(
    building_id: &str,
    buildings: &'a [BuildingUpgradeLite],
) -> Vec<&'a BuildingUpgradeLite> {
    // web `new Map(buildings.map(b => [b.id, b]))`: ostatni duplikat wygrywa.
    let by_id = |id: &str| -> Option<&'a BuildingUpgradeLite> {
        buildings.iter().rev().find(|b| b.id == id)
    };
    let mut chain: Vec<&'a BuildingUpgradeLite> = Vec::new();
    let mut cur = by_id(building_id);
    while let Some(node) = cur {
        if chain.iter().any(|c| std::ptr::eq(*c, node)) {
            break; // guard: cykl (patrz zalozenia)
        }
        chain.insert(0, node);
        let from = js_trim(node.upgrade_from.as_deref().unwrap_or(""));
        cur = if from.is_empty() { None } else { by_id(from) };
    }
    chain
}

/// web `upgradeProductionDisplayName` (UPG-PROD A).
pub fn upgrade_production_display_name(
    target: &BuildingUpgradeLite,
    buildings: &[BuildingUpgradeLite],
) -> String {
    let from = js_trim(target.upgrade_from.as_deref().unwrap_or(""));
    if from.is_empty() {
        return target.nazwa.clone();
    }
    // web `buildings.find` -> pierwszy wpis.
    let prev_name = buildings
        .iter()
        .find(|b| b.id == from)
        .map(|b| b.nazwa.as_str())
        .unwrap_or(from);
    format!("Rozbuduj {} → {}", prev_name, target.nazwa)
}

/// web `upgradeCompositionLines` (UPG-BONUS A+C).
pub fn upgrade_composition_lines(
    building_id: &str,
    buildings: &[BuildingUpgradeLite],
) -> Vec<String> {
    let chain = upgrade_chain_steps(building_id, buildings);
    if chain.len() <= 1 {
        return Vec::new();
    }
    let names: Vec<&str> = chain.iter().map(|c| c.nazwa.as_str()).collect();
    vec![
        format!("Łańcuch: {}", names.join(" → ")),
        "Bonusy w silniku = suma poprzednich poziomów (zapisane w JSON tego budynku).".to_string(),
    ]
}

/// web `cityHasBibliotekaLine`: biblioteka lub akademia.
pub fn city_has_biblioteka_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"biblioteka") || built_ids.contains(&"akademia")
}

/// web `cityHasAmfiteatrLine`: teatr lub akademia.
pub fn city_has_amfiteatr_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"teatr") || built_ids.contains(&"akademia")
}

/// web `cityHasMurLine`: mury, fort lub palisada.
pub fn city_has_mur_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"mury") || built_ids.contains(&"fort") || built_ids.contains(&"palisada")
}

/// web `STRUCTURAL_DEFENSE_PARAM_KEY[buildingId]` (klucz parametru w `miasto-params.json`).
pub fn structural_defense_param_key(building_id: &str) -> Option<&'static str> {
    match building_id {
        "palisada" => Some("bonus_obrona_palisada_proc"),
        "mury" => Some("bonus_obrona_mur_proc"),
        "fort" => Some("bonus_obrona_cytadela_proc"),
        "baszta" => Some("bonus_obrona_baszta_proc"),
        _ => None,
    }
}

/// web `buildingStructuralDefenseBonusPercent`: wartosc > 0, inaczej `None`.
/// `raw_value` = `miasto-params[key].wartosc` (`None` = brak wpisu / nie-liczba).
pub fn building_structural_defense_bonus_percent(
    building_id: &str,
    raw_value: Option<f64>,
) -> Option<f64> {
    structural_defense_param_key(building_id)?;
    match raw_value {
        Some(v) if v > 0.0 => Some(v),
        _ => None,
    }
}

/// web `buildingStructuralDefenseBonusLine` (etykieta UI, pelna forma z jednostka).
pub fn building_structural_defense_bonus_line(
    building_id: &str,
    raw_value: Option<f64>,
) -> Option<String> {
    let proc = building_structural_defense_bonus_percent(building_id, raw_value)?;
    Some(match building_id {
        "palisada" => {
            format!("Obrona (jednostki broniące miasta) +{proc}% — zastąpione przez Mury kamienne")
        }
        "mury" => {
            format!("Obrona (jednostki broniące miasta) +{proc}% — zastępuje Palisadę drewnianą")
        }
        "fort" | "baszta" => format!(
            "Obrona (jednostki broniące miasta) +{proc}% dodatkowo (wymaga Murów w mieście)"
        ),
        _ => format!("Obrona (jednostki broniące miasta) +{proc}%"),
    })
}

/// web `cityHasPalacLine`: palac / palac_ii / palac_iii.
pub fn city_has_palac_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"palac")
        || built_ids.contains(&"palac_ii")
        || built_ids.contains(&"palac_iii")
}

/// web `cityPalacTier`: najwyzszy tier Palacu w miescie, `None` = brak.
pub fn city_palac_tier(built_ids: &[&str]) -> Option<u8> {
    if built_ids.contains(&"palac_iii") {
        Some(3)
    } else if built_ids.contains(&"palac_ii") {
        Some(2)
    } else if built_ids.contains(&"palac") {
        Some(1)
    } else {
        None
    }
}

/// web `BUILDING_GROUP_ORDER` (kolejnosc wyswietlania).
pub const BUILDING_GROUP_ORDER: [&str; 8] = [
    "Prawo i administracja",
    "Wojsko i obrona",
    "Handel i pieniądz",
    "Nauka i kultura",
    "Wiara",
    "Zdrowie",
    "Produkcja surowców",
    "Żywność",
];

/// web `BUILDING_GROUP_FALLBACK`.
pub const BUILDING_GROUP_FALLBACK: &str = "Inne";

/// web `BuildingGroupLite` (`grupa`: `None` = brak / `null`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingGroupLite {
    pub id: String,
    pub grupa: Option<String>,
}

/// web `BuildingGroupBucket`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingGroupBucket {
    pub grupa: String,
    pub ids: Vec<String>,
}

/// web `groupBuiltBuildingIds`: osiem grup zawsze obecnych (kolejnosc `BUILDING_GROUP_ORDER`),
/// nieznane grupy / `Inne` dopisywane w kolejnosci pierwszego wystapienia (jak JS `Map`).
pub fn group_built_building_ids(
    built_ids: &[&str],
    buildings: &[BuildingGroupLite],
) -> Vec<BuildingGroupBucket> {
    let mut buckets: Vec<BuildingGroupBucket> = BUILDING_GROUP_ORDER
        .iter()
        .map(|g| BuildingGroupBucket {
            grupa: (*g).to_string(),
            ids: Vec::new(),
        })
        .collect();
    for id in built_ids {
        // web `byId` (Map): ostatni duplikat wygrywa.
        let raw = buildings
            .iter()
            .rev()
            .find(|b| b.id == *id)
            .and_then(|b| b.grupa.as_deref());
        let trimmed = js_trim(raw.unwrap_or(""));
        let g = if trimmed.is_empty() {
            BUILDING_GROUP_FALLBACK
        } else {
            trimmed
        };
        match buckets.iter_mut().find(|b| b.grupa == g) {
            Some(b) => b.ids.push((*id).to_string()),
            None => buckets.push(BuildingGroupBucket {
                grupa: g.to_string(),
                ids: vec![(*id).to_string()],
            }),
        }
    }
    buckets
}
