//! P6.M04 - `reapplyLandTerrain` i `reapplyForestOverlay` (`gen-helpers.ts`:1012-1161):
//! wektory z URUCHOMIONEGO weba. Zaleznosci lasu (8 metod `ForestOverlayHooks`) sa ODTWARZANE z
//! wartosci policzonych przez PRAWDZIWY kod weba na stanie przed wywolaniem; kazda metoda
//! sprawdza argumenty wywolania (tier, rozmiar komorki, typ swiata, zbior masy), wiec zle
//! przekazanie argumentu = panika, nie cicha zgodnosc.

#[path = "p6_m04_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::map_generator::{Terrain, WorldType};
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::prims::is_water_terrain_local;
use civ_engine::domain::mapgen::terrain_class::{
    reapply_forest_overlay, reapply_land_terrain, ForestOverlayHooks, HexRecord, Nakladka,
    TerrainScratch,
};
use common::{
    assert_f64, assert_hexes, cases, fnv1a64, fv, i, s, spec_to_record, terrain_from_code,
    terrain_from_web, thresholds_from, tier_from_web, typ_from_web, web,
};
use serde_json::Value;

fn land_scratch(v: &Value) -> HashMap<String, TerrainScratch> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|r| {
            (
                s(&r[0]).to_string(),
                TerrainScratch {
                    elev_continental: fv(&r[1]),
                    land_mask: fv(&r[2]),
                    mtn_noise: fv(&r[3]),
                    for_noise: fv(&r[4]),
                    des_noise: fv(&r[5]),
                },
            )
        })
        .collect()
}

#[test]
fn reapply_land_terrain_matches_web() {
    let rows = cases("reapplyLand");
    assert!(rows.len() >= 45);
    let (mut relief_cases, mut tiers, mut heights_none, mut heights_zero, mut heights_set) =
        (0, [0; 3], 0, 0, 0);
    let mut total_changed = 0;
    for (n, c) in rows.iter().enumerate() {
        let mut hexes = spec_to_record(&c["spec"]);
        let before = hexes.clone();
        let scratch = land_scratch(&c["scratch"]);
        let th = thresholds_from(&c["th"]);
        let height = c["mapHeight"].as_u64().map(|h| u32::try_from(h).unwrap());
        match height {
            None => heights_none += 1,
            Some(0) => heights_zero += 1,
            Some(_) => heights_set += 1,
        }
        let tier = tier_from_web(s(&c["tier"]));
        tiers[match tier {
            DensityTier::Low => 0,
            DensityTier::Medium => 1,
            DensityTier::High => 2,
        }] += 1;
        reapply_land_terrain(
            &mut hexes,
            &scratch,
            fv(&c["seed"]),
            th.as_ref(),
            height,
            tier,
        );
        assert_hexes(&hexes, &c["out"], &format!("reapplyLand #{n}"));
        if hexes
            .iter()
            .any(|(_, h)| h.terrain == Terrain::Mountains || h.terrain == Terrain::Hills)
        {
            relief_cases += 1;
        }
        total_changed += hexes
            .iter()
            .zip(before.iter())
            .filter(|((_, a), (_, b))| a.terrain != b.terrain || a.overlay != b.overlay)
            .count();
    }
    assert!(
        relief_cases >= 25,
        "za malo przypadkow z reliefem: {relief_cases}"
    );
    assert!(tiers.iter().all(|t| *t >= 10), "tiery: {tiers:?}");
    assert!(heights_none >= 3 && heights_zero >= 3 && heights_set >= 20);
    assert!(total_changed > 2000, "za malo zmian: {total_changed}");
}

/// Odtworzenie zaleznosci `reapplyForestOverlay` z wektora jednego przypadku.
struct ReplayHooks<'a> {
    case: &'a Value,
    tier: DensityTier,
    typ: WorldType,
    n_continents: f64,
    continent_of: Option<HashMap<String, f64>>,
    eligible: Vec<(Terrain, bool)>,
}

impl ReplayHooks<'_> {
    fn deps(&self) -> &Value {
        &self.case["deps"]
    }
}

impl ForestOverlayHooks for ReplayHooks<'_> {
    fn forest_share_of_dry_land(&self, tier: DensityTier) -> f64 {
        assert_eq!(tier, self.tier, "FOREST_SHARE_OF_DRY_LAND[tier]: zly tier");
        fv(&self.deps()["share"])
    }
    fn forest_overlay_cap_frac(&self) -> f64 {
        fv(&self.deps()["capFrac"])
    }
    fn forest_coverage_cell_size(&self, tier: DensityTier) -> f64 {
        assert_eq!(tier, self.tier, "forestCoverageCellSize(tier): zly tier");
        fv(&self.deps()["cellSize"])
    }
    fn min_land_hexes_for_fair_play_cell(&self, cell_size: f64) -> f64 {
        assert_f64(
            cell_size,
            fv(&self.deps()["cellSize"]),
            "minLandHexesForFairPlayCell(cellSize)",
        );
        fv(&self.deps()["minLand"])
    }
    fn is_forest_eligible_terrain(&self, terrain: Terrain) -> bool {
        lookup_eligible(&self.eligible, terrain)
    }
    fn build_sea_distance_field(&self, hexes: &HexRecord) -> HashMap<String, f64> {
        let spec = self.case["spec"].as_array().unwrap();
        let dist = self.deps()["seaDist"].as_array().unwrap();
        assert_eq!(
            hexes.len(),
            spec.len(),
            "buildSeaDistanceField: liczba heksow"
        );
        let mut out = HashMap::new();
        for (row, d) in spec.iter().zip(dist) {
            if !d.is_null() {
                out.insert(common::key_of(i(&row[0]), i(&row[1])), fv(d));
            }
        }
        out
    }
    fn land_partition_keys_for_distribution(
        &self,
        _hexes: &HexRecord,
        typ: WorldType,
        continent_of: Option<&HashMap<String, f64>>,
        n_continents: f64,
    ) -> Vec<Vec<String>> {
        assert_eq!(typ, self.typ, "landPartitionKeysForDistribution: typ");
        assert_f64(
            n_continents,
            self.n_continents,
            "landPartitionKeysForDistribution: nContinents",
        );
        assert_eq!(continent_of, self.continent_of.as_ref(), "continentOf");
        self.deps()["partitions"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| {
                p.as_array()
                    .unwrap()
                    .iter()
                    .map(|k| s(k).to_string())
                    .collect()
            })
            .collect()
    }
    fn land_hexes_by_coverage_cell(
        &self,
        mass_set: &[String],
        cell_size: f64,
    ) -> Vec<(String, Vec<(i64, i64)>)> {
        assert_f64(
            cell_size,
            fv(&self.deps()["cellSize"]),
            "landHexesByCoverageCell(cellSize)",
        );
        let key = fnv1a64(&mass_set.join(";"));
        let call = self.deps()["cellCalls"]
            .as_array()
            .unwrap()
            .iter()
            .find(|c| {
                s(&c["massKey"]) == key && c["massLen"].as_u64() == Some(mass_set.len() as u64)
            })
            .unwrap_or_else(|| {
                panic!("brak wektora landHexesByCoverageCell dla zbioru masy {key}")
            });
        call["cells"]
            .as_array()
            .unwrap()
            .iter()
            .map(|cell| {
                (
                    s(&cell[0]).to_string(),
                    cell[1]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|p| (i(&p[0]), i(&p[1])))
                        .collect(),
                )
            })
            .collect()
    }
}

fn lookup_eligible(table: &[(Terrain, bool)], terrain: Terrain) -> bool {
    table
        .iter()
        .find(|(t, _)| *t == terrain)
        .map(|(_, e)| *e)
        .expect("teren w tabeli kwalifikacji lasu")
}

fn eligible_table() -> Vec<(Terrain, bool)> {
    web()["cases"]["forestEligible"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| (terrain_from_web(s(&r[0])), i(&r[1]) == 1))
        .collect()
}

#[test]
fn reapply_forest_overlay_matches_web() {
    let rows = cases("reapplyForest");
    assert!(rows.len() >= 36);
    let eligible = eligible_table();
    assert_eq!(
        eligible.len(),
        8,
        "tabela kwalifikacji lasu: wszystkie 8 terenow"
    );
    let (mut with_forest, mut by_typ, mut by_tier) = (0, [0; 4], [0; 3]);
    let (mut h_none, mut h_zero, mut h_set, mut no_cont, mut cont) = (0, 0, 0, 0, 0);
    let mut total_assigned = 0;
    for (n, c) in rows.iter().enumerate() {
        let tier = tier_from_web(s(&c["tier"]));
        let typ = typ_from_web(s(&c["typ"]));
        let continent_of: Option<HashMap<String, f64>> = c["continentOf"].as_array().map(|a| {
            a.iter()
                .map(|p| (s(&p[0]).to_string(), p[1].as_f64().unwrap()))
                .collect()
        });
        let n_cont = c["nContinents"].as_f64().unwrap();
        let height = c["mapHeight"].as_u64().map(|h| u32::try_from(h).unwrap());
        match height {
            None => h_none += 1,
            Some(0) => h_zero += 1,
            Some(_) => h_set += 1,
        }
        if continent_of.is_some() {
            cont += 1;
        } else {
            no_cont += 1;
        }
        by_typ[match typ {
            WorldType::Continents => 0,
            WorldType::Pangea => 1,
            WorldType::Islands => 2,
            WorldType::Earth => 3,
        }] += 1;
        by_tier[match tier {
            DensityTier::Low => 0,
            DensityTier::Medium => 1,
            DensityTier::High => 2,
        }] += 1;
        let hooks = ReplayHooks {
            case: c,
            tier,
            typ,
            n_continents: n_cont,
            continent_of: continent_of.clone(),
            eligible: eligible.clone(),
        };
        let scratch: HashMap<String, TerrainScratch> = c["scratch"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| {
                (
                    s(&r[0]).to_string(),
                    TerrainScratch {
                        elev_continental: 0.0,
                        land_mask: 1.0,
                        mtn_noise: 0.0,
                        for_noise: fv(&r[1]),
                        des_noise: 0.0,
                    },
                )
            })
            .collect();
        let mut hexes = spec_to_record(&c["spec"]);
        let terrain_before: Vec<Terrain> = hexes.iter().map(|(_, h)| h.terrain).collect();
        let assigned = reapply_forest_overlay(
            &mut hexes,
            &scratch,
            None,
            typ,
            tier,
            continent_of.as_ref(),
            n_cont,
            height,
            &hooks,
        );
        assert_eq!(assigned, c["assigned"].as_i64().unwrap(), "assigned #{n}");
        assert_hexes(&hexes, &c["out"], &format!("reapplyForest #{n}"));
        let terrain_after: Vec<Terrain> = hexes.iter().map(|(_, h)| h.terrain).collect();
        assert_eq!(terrain_before, terrain_after, "las nie zmienia terenu");
        let forests = hexes
            .iter()
            .filter(|(_, h)| h.overlay == Nakladka::Las)
            .count() as i64;
        // Las z poprzednich przebiegow jest czyszczony, wiec liczba Las <= przypisanych + zloza
        // nie dotykane: kazdy Las po wywolaniu pochodzi z tego wywolania
        assert_eq!(forests, assigned, "liczba heksow Las == assigned (#{n})");
        if assigned > 0 {
            with_forest += 1;
        }
        total_assigned += assigned;
    }
    assert!(
        with_forest >= 25,
        "za malo przypadkow z lasem: {with_forest}"
    );
    assert!(total_assigned > 500, "za malo lasu: {total_assigned}");
    assert!(
        by_typ.iter().all(|t| *t >= 6) && by_tier.iter().all(|t| *t >= 8),
        "{by_typ:?} {by_tier:?}"
    );
    assert!(h_none >= 3 && h_zero >= 3 && h_set >= 15 && no_cont >= 6 && cont >= 15);
    // wartosci referencyjne tablicy lasu z weba rowniez dla kwalifikacji: woda/gory/pustynia/polarny nie
    assert!(
        !lookup_eligible(&eligible, Terrain::Sea)
            && !lookup_eligible(&eligible, Terrain::Mountains)
            && lookup_eligible(&eligible, Terrain::Hills)
    );
}

#[test]
fn forest_replay_hooks_reject_wrong_arguments() {
    // Kontrola negatywna odtwarzania: zly tier / zbior masy musi spanikowac (nie przechodzic cicho).
    let c = &cases("reapplyForest")[0];
    let tier = tier_from_web(s(&c["tier"]));
    let hooks = ReplayHooks {
        case: c,
        tier,
        typ: typ_from_web(s(&c["typ"])),
        n_continents: c["nContinents"].as_f64().unwrap(),
        continent_of: None,
        eligible: eligible_table(),
    };
    let wrong_tier = if tier == DensityTier::Low {
        DensityTier::High
    } else {
        DensityTier::Low
    };
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(
        || hooks.forest_share_of_dry_land(wrong_tier)
    ))
    .is_err());
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| hooks
            .land_hexes_by_coverage_cell(
                &["nie,istnieje".to_string()],
                fv(&c["deps"]["cellSize"])
            )))
        .is_err()
    );
}

/// RUNDA 2 (zarzut 3): przypadki UKIERUNKOWANE dla warunku `maxSeaInPart > 1` w `reapplyForestOverlay`.
/// Mapy maja `maxSeaInPart == 1` (kazdy heks ladu graniczy z woda albo nie ma wpisu w polu
/// odleglosci), a szum lasu ma REMISY zmiennoprzecinkowe po dodaniu `0.14` (0, 1e-20, `nextUp(0.9)` ...)
/// albo skladowa ladu bez wody. Generator uruchomil tez WEB z mutacja `>= 1` i policzyl rozbieznosci:
/// zbior jest wiec nieekwiwalentny dla tej mutacji (`stats.forestTie`), a Rust musi dawac wynik weba.
#[test]
fn reapply_forest_overlay_targeted_inland_cases_match_web() {
    let rows = cases("reapplyForestTie");
    assert!(rows.len() >= 51, "za malo przypadkow: {}", rows.len());
    let eligible = eligible_table();
    let (mut max_one, mut max_gt_one, mut mutant_differs_max_one, mut with_forest) = (0, 0, 0, 0);
    let mut missing_sd_land = 0;
    for (n, c) in rows.iter().enumerate() {
        let tier = tier_from_web(s(&c["tier"]));
        let typ = typ_from_web(s(&c["typ"]));
        let continent_of: Option<HashMap<String, f64>> = c["continentOf"].as_array().map(|a| {
            a.iter()
                .map(|p| (s(&p[0]).to_string(), p[1].as_f64().unwrap()))
                .collect()
        });
        let n_cont = c["nContinents"].as_f64().unwrap();
        let height = c["mapHeight"].as_u64().map(|h| u32::try_from(h).unwrap());
        // niezalezne przeliczenie maxSeaInPart z zapisanych zaleznosci (jak web: start 1, brak wpisu = 0)
        let spec = c["spec"].as_array().unwrap();
        let dist = c["deps"]["seaDist"].as_array().unwrap();
        let mut sd_by_key: HashMap<String, Option<f64>> = HashMap::new();
        let mut water: HashMap<String, bool> = HashMap::new();
        for (row, d) in spec.iter().zip(dist) {
            let key = common::key_of(i(&row[0]), i(&row[1]));
            sd_by_key.insert(key.clone(), if d.is_null() { None } else { Some(fv(d)) });
            water.insert(key, is_water_terrain_local(terrain_from_code(i(&row[2]))));
        }
        let mut max_sea = 1.0_f64;
        for part in c["deps"]["partitions"].as_array().unwrap() {
            for k in part.as_array().unwrap() {
                let k = s(k);
                if water.get(k).copied().unwrap_or(false) {
                    continue;
                }
                let d = sd_by_key.get(k).copied().flatten().unwrap_or(0.0);
                if sd_by_key.get(k).is_some_and(Option::is_none) {
                    missing_sd_land += 1;
                }
                if d > max_sea {
                    max_sea = d;
                }
            }
        }
        assert_f64(
            max_sea,
            c["maxSeaInPart"].as_f64().unwrap(),
            &format!("maxSeaInPart #{n} {}", s(&c["label"])),
        );
        if max_sea > 1.0 {
            max_gt_one += 1;
        } else {
            max_one += 1;
            if c["mutantDiffers"].as_i64() == Some(1) {
                mutant_differs_max_one += 1;
            }
        }
        let hooks = ReplayHooks {
            case: c,
            tier,
            typ,
            n_continents: n_cont,
            continent_of: continent_of.clone(),
            eligible: eligible.clone(),
        };
        let scratch: HashMap<String, TerrainScratch> = c["scratch"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| {
                (
                    s(&r[0]).to_string(),
                    TerrainScratch {
                        elev_continental: 0.0,
                        land_mask: 1.0,
                        mtn_noise: 0.0,
                        for_noise: fv(&r[1]),
                        des_noise: 0.0,
                    },
                )
            })
            .collect();
        let mut hexes = spec_to_record(&c["spec"]);
        let assigned = reapply_forest_overlay(
            &mut hexes,
            &scratch,
            None,
            typ,
            tier,
            continent_of.as_ref(),
            n_cont,
            height,
            &hooks,
        );
        let label = format!("reapplyForestTie #{n} {}", s(&c["label"]));
        assert_eq!(
            assigned,
            c["assigned"].as_i64().unwrap(),
            "assigned {label}"
        );
        assert_hexes(&hexes, &c["out"], &label);
        with_forest += i64::from(assigned > 0);
    }
    assert!(max_one >= 40, "mapy z maxSeaInPart == 1: {max_one}");
    assert!(max_gt_one >= 1, "kontrola z max > 1: {max_gt_one}");
    assert!(with_forest >= 30, "przypadki z lasem: {with_forest}");
    assert!(
        missing_sd_land >= 100,
        "heksy ladu bez wpisu w polu odleglosci: {missing_sd_land}"
    );
    // dowod nieekwiwalnosci mutacji `>= 1` z URUCHOMIONEGO weba (policzony przez generator)
    assert!(
        mutant_differs_max_one >= 10,
        "web z mutacja `maxSeaInPart >= 1` ma sie ROZNIC w >= 10 mapach: {mutant_differs_max_one}"
    );
    let stats = &web()["stats"]["forestTie"];
    assert_eq!(
        stats["differsWhenMaxGt1"].as_i64(),
        Some(0),
        "przy max > 1 mutacja nie ma wplywu"
    );
}
