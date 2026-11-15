//! Shared fixtures:
//! - [`sample_view`]: hand-made, fills every field; every `Option` field is
//!   `Some` at least once (several are also `None` elsewhere in it, e.g.
//!   `units[1].hpMax`, `battle.setup.units[1].ammoLeft`,
//!   `overlays.okolica.yields[1][1]`);
//! - [`sample_view_minimal`]: every collection and optional layer empty
//!   (`owners[0]` with all `Option`s `None`, no cities, units or battle,
//!   overlays all `None`), but it reuses the map and `hexState` of
//!   [`sample_view`], so `rivers[0].kind` and `hexState[0|3].ulepszenia` /
//!   `improvementKey` / `zloze` stay `Some` there. It is NOT "every `Option`
//!   `None`"; the all-`None` variants of single structs are the `*_none`
//!   builders;
//! - [`synthetic_view`]: deterministic synthetic snapshot for the size
//!   measurement (`examples/snapshot_size.rs` includes this file through
//!   `#[path]`).
#![allow(dead_code)]

use civ_view_model::*;

pub fn h(q: i32, r: i32) -> HexCoord {
    HexCoord::new(q, r)
}

pub fn pid(v: u64) -> PlayerId {
    PlayerId::try_new(v).expect("small id")
}

pub fn cid(v: u64) -> CityId {
    CityId::try_new(v).expect("small id")
}

pub fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).expect("small id")
}

pub fn player(v: u64) -> OwnerRef {
    OwnerRef::Player(pid(v))
}

pub fn sample_map() -> MapViewDto {
    MapViewDto {
        width: 2,
        height: 2,
        seed: 123_456.5,
        hexes: vec![
            HexStaticDto {
                coord: h(0, 0),
                teren_bazowy: Terrain::Laka,
                rzeka_krawedzie: vec![0, 5],
            },
            HexStaticDto {
                coord: h(1, 0),
                teren_bazowy: Terrain::PlytkieMorze,
                rzeka_krawedzie: vec![],
            },
            HexStaticDto {
                coord: h(0, 1),
                teren_bazowy: Terrain::Gory,
                rzeka_krawedzie: vec![3],
            },
            HexStaticDto {
                coord: h(1, 1),
                teren_bazowy: Terrain::Polarny,
                rzeka_krawedzie: vec![],
            },
        ],
        rivers: vec![
            RiverPathDto {
                hexes: vec![h(0, 0), h(0, 1)],
                kind: Some(RiverKind::Main),
            },
            RiverPathDto {
                hexes: vec![h(1, 1)],
                kind: None,
            },
        ],
        river_render_paths: vec![vec![h(0, 0), h(0, 1)], vec![]],
    }
}

pub fn sample_hex_dyn_full() -> HexDynDto {
    HexDynDto {
        nakladka: Nakladka::ZlozeRudy,
        ulepszenie: Ulepszenie::DrogaBrukowana,
        ulepszenia: Some(vec!["droga".into(), "kopalnia".into()]),
        improvement_key: Some("kopalnia_rudy".into()),
        zloze: Some("zloze_rudy".into()),
        village_present: true,
        terraces: true,
        covering_improvement: true,
        road_mask: 0x3F,
    }
}

pub fn sample_hex_dyn_none() -> HexDynDto {
    HexDynDto {
        nakladka: Nakladka::Brak,
        ulepszenie: Ulepszenie::Brak,
        ulepszenia: None,
        improvement_key: None,
        zloze: None,
        village_present: false,
        terraces: false,
        covering_improvement: false,
        road_mask: 0,
    }
}

pub fn sample_owner_full() -> OwnerViewDto {
    OwnerViewDto {
        owner_id: player(0),
        color: 0x00_e5_39,
        civ_icon_id: "rzymianie".into(),
        bronze_civ: "rzym".into(),
        era: 2.0,
        is_city_state: false,
        is_barbarian: false,
        ring_hex: Some("#00e539".into()),
        display_name: Some("Rzym".into()),
        map_outline_kind: Some(MapOutlineKind::Player),
        capital_city_id: Some(cid(7)),
        relation_to_viewer: RelationToViewer::Own,
    }
}

pub fn sample_owner_none() -> OwnerViewDto {
    OwnerViewDto {
        owner_id: OwnerRef::Barbarian,
        color: 0x55_55_55,
        civ_icon_id: "barbarzyncy".into(),
        bronze_civ: "barbarzyncy".into(),
        era: 1.0,
        is_city_state: false,
        is_barbarian: true,
        ring_hex: None,
        display_name: None,
        map_outline_kind: None,
        capital_city_id: None,
        relation_to_viewer: RelationToViewer::Wojna,
    }
}

pub fn sample_badge_full() -> CityBadgeDto {
    CityBadgeDto {
        city_name: "Roma".into(),
        population: 4.0,
        defense_tier: 2,
        civ_icon_id: "rzymianie".into(),
        owner_color: 0x00_e5_39,
        prod_active: true,
        prod_kind: Some(ProductionKind::Jednostka),
        prod_id: Some("legionista".into()),
        prod_item_name: Some("Legionista".into()),
        prod_category_label: Some("Jednostka".into()),
        prod_paused: false,
        growth_percent: Some(12.5),
        growth_starving: false,
        resource_warning: true,
        is_city_state: false,
        era: 2.0,
        is_capital: true,
    }
}

pub fn sample_badge_none() -> CityBadgeDto {
    CityBadgeDto {
        city_name: "Wioska".into(),
        population: 1.0,
        defense_tier: 0,
        civ_icon_id: "grecy".into(),
        owner_color: 0,
        prod_active: false,
        prod_kind: None,
        prod_id: None,
        prod_item_name: None,
        prod_category_label: None,
        prod_paused: false,
        growth_percent: None,
        growth_starving: false,
        resource_warning: false,
        is_city_state: true,
        era: 1.0,
        is_capital: false,
    }
}

pub fn sample_city() -> CityViewDto {
    CityViewDto {
        id: cid(7),
        owner_id: player(0),
        hex: h(0, 0),
        population: 4.0,
        level: 4.0,
        wall_kind: WallKind::Stone,
        revolt: false,
        besieged: true,
        fog_visible: true,
        unit_count_on_hex: 2,
        badge: sample_badge_full(),
    }
}

pub fn sample_unit_full() -> UnitViewDto {
    UnitViewDto {
        id: uid(11),
        owner_id: player(0),
        type_id: "legionista".into(),
        category: "miecznik".into(),
        hex: h(1, 0),
        ruch_max: 2.0,
        ruch_left: 1.5,
        hp: 87.25,
        hp_max: Some(100.0),
        embarked: true,
        in_garnizon: false,
        is_general: true,
        veteran_stars: 3,
        armor_badge_level: 2,
        soft_badge_level: 1,
        dimmed: false,
    }
}

pub fn sample_unit_none() -> UnitViewDto {
    UnitViewDto {
        id: uid(12),
        owner_id: OwnerRef::Rebel,
        type_id: "wojownik".into(),
        category: "domyslny".into(),
        hex: h(0, 1),
        ruch_max: 1.0,
        ruch_left: 0.0,
        hp: 10.0,
        hp_max: None,
        embarked: false,
        in_garnizon: true,
        is_general: false,
        veteran_stars: 0,
        armor_badge_level: 0,
        soft_badge_level: 0,
        dimmed: true,
    }
}

pub fn sample_vitals() -> StackVitalsDto {
    StackVitalsDto {
        ruch_left: 1.0,
        ruch_max: 2.0,
        hp: 187.25,
        hp_max: 200.0,
        field_power_m: 34.5,
        count: 2,
        armor_badge_level: 2,
        soft_badge_level: 1,
        veteran_level: 3,
        veteran_stars: 3,
        has_commander: true,
    }
}

pub fn sample_stacks() -> StackViewDto {
    StackViewDto {
        visible_ids: vec![uid(11), uid(12)],
        badge_by_rep_id: vec![(uid(11), 2)],
        starving_rep_ids: vec![uid(12)],
        gold_deficit_rep_ids: vec![uid(11), uid(12)],
        vitals_by_rep_id: vec![(uid(11), sample_vitals())],
    }
}

pub fn sample_siege() -> SiegeViewDto {
    SiegeViewDto {
        city_id: cid(7),
        city_hex: h(0, 0),
        camp_hexes: vec![h(1, 0), h(0, 1)],
        ready_machines: vec![SiegeMachineKind::Taran, SiegeMachineKind::Wieza],
    }
}

pub fn sample_wonder() -> PlacedWonderDto {
    PlacedWonderDto {
        wonder_id: "piramidy".into(),
        hex: h(1, 1),
        owner_id: player(1),
        ruin: true,
    }
}

pub fn sample_owner_hexes() -> OwnerHexesDto {
    OwnerHexesDto {
        owner_id: player(0),
        hexes: vec![h(0, 0), h(1, 0)],
    }
}

pub fn sample_territory() -> TerritoryViewDto {
    TerritoryViewDto {
        by_owner: vec![
            sample_owner_hexes(),
            OwnerHexesDto {
                owner_id: OwnerRef::Barbarian,
                hexes: vec![h(1, 1)],
            },
        ],
    }
}

pub fn sample_trade_route() -> TradeRouteDto {
    TradeRouteDto {
        from: h(0, 0),
        to: h(1, 1),
        medium: TradeMedium::Morze,
    }
}

pub fn sample_yield_full() -> TileYieldDto {
    TileYieldDto {
        zywnosc: Some(3.0),
        praca: Some(2.0),
        handel: Some(0.5),
    }
}

pub fn sample_okolica() -> OkolicaViewDto {
    OkolicaViewDto {
        city_id: cid(7),
        city_hex: h(0, 0),
        range: 2.0,
        worked_hexes: vec![h(1, 0)],
        yields: vec![
            (h(1, 0), sample_yield_full()),
            (
                h(0, 1),
                TileYieldDto {
                    zywnosc: None,
                    praca: None,
                    handel: None,
                },
            ),
        ],
        show_yields: Some(true),
        owner_id: player(0),
    }
}

pub fn sample_overlays_full() -> OverlaysViewDto {
    OverlaysViewDto {
        culture_range: Some(vec![sample_owner_hexes()]),
        religion_range: Some(vec![]),
        trade_routes: vec![sample_trade_route()],
        okolica: Some(sample_okolica()),
        worker_fields: vec![WorkerFieldDto {
            hex: h(1, 0),
            owner_id: player(0),
        }],
        reachable: vec![h(1, 0), h(1, 1)],
        build_highlight: BuildHighlightDto {
            kind: BuildHighlightKind::FoundCity,
            hexes: vec![h(0, 1)],
        },
        selection: Some(SelectionDto {
            hex: h(1, 0),
            owner_id: player(0),
        }),
        path_route: Some(vec![h(1, 0), h(1, 1)]),
    }
}

pub fn sample_overlays_none() -> OverlaysViewDto {
    OverlaysViewDto {
        culture_range: None,
        religion_range: None,
        trade_routes: vec![],
        okolica: None,
        worker_fields: vec![],
        reachable: vec![],
        build_highlight: BuildHighlightDto {
            kind: BuildHighlightKind::Generic,
            hexes: vec![],
        },
        selection: None,
        path_route: None,
    }
}

pub fn sample_spawn(ammo: Option<f64>) -> BattleUnitSpawnDto {
    BattleUnitSpawnDto {
        id: uid(11),
        side: BattleSide::Atk,
        category: "miecznik".into(),
        model_name: "Legionista".into(),
        owner_color: 0x00_e5_39,
        col: 3,
        row: 4,
        facing: 1,
        on_wall_walkway: false,
        hp: 87.25,
        max_hp: 100.0,
        morale: 80.0,
        morale_max: 100.0,
        ammo_left: ammo,
        ammo_max: ammo,
    }
}

pub fn sample_battle() -> BattleViewDto {
    BattleViewDto {
        setup: BattleSetupDto {
            grid: BattleGridDto {
                cols: 3,
                rows: 2,
                tiles: vec![0, 1, 2, 3, 4, 5],
            },
            desert_palette: true,
            siege: true,
            deploy: Some(BattleSide::Def),
            siege_civ: "rzym".into(),
            player_side: BattleSide::Atk,
            units: vec![sample_spawn(Some(2.0)), sample_spawn(None)],
            fort: BattleFortDto {
                kind: FortKind::Mur,
                tower_material: Some(TowerMaterial::Kamien),
                tower_rows: vec![2, 5],
            },
        },
    }
}

/// Every field filled, every `Option` `Some` (except where the same type has
/// a `None` twin elsewhere in the snapshot).
pub fn sample_view() -> RenderViewDto {
    RenderViewDto {
        contract_version: CONTRACT_VERSION,
        viewer: ViewerDto {
            owner_id: player(0),
            fog_active: true,
        },
        turn: 42,
        map: sample_map(),
        hex_state: vec![
            sample_hex_dyn_full(),
            sample_hex_dyn_none(),
            sample_hex_dyn_none(),
            sample_hex_dyn_full(),
        ],
        fog: FogViewDto {
            state: vec![
                FogState::Visible,
                FogState::Explored,
                FogState::Unexplored,
                FogState::Visible,
            ],
        },
        owners: vec![sample_owner_none(), sample_owner_full()],
        cities: vec![sample_city()],
        units: vec![sample_unit_full(), sample_unit_none()],
        stacks: sample_stacks(),
        sieges: vec![sample_siege()],
        wonders: vec![sample_wonder()],
        territory: sample_territory(),
        overlays: sample_overlays_full(),
        battle: Some(sample_battle()),
    }
}

/// The same snapshot with every optional part empty.
pub fn sample_view_minimal() -> RenderViewDto {
    RenderViewDto {
        owners: vec![sample_owner_none()],
        cities: vec![],
        units: vec![],
        stacks: StackViewDto {
            visible_ids: vec![],
            badge_by_rep_id: vec![],
            starving_rep_ids: vec![],
            gold_deficit_rep_ids: vec![],
            vitals_by_rep_id: vec![],
        },
        sieges: vec![],
        wonders: vec![],
        territory: TerritoryViewDto { by_owner: vec![] },
        overlays: sample_overlays_none(),
        battle: None,
        ..sample_view()
    }
}

// ---------------------------------------------------------------------------
// Synthetic snapshot for the size measurement.
// ---------------------------------------------------------------------------

/// Assumed content of a late-game map. The web never measured unit/city
/// counts (contract §4.1, §9 pt 5: NIE_ZMIERZONO); these are assumptions of
/// the measurement, printed next to the result.
#[derive(Debug, Clone, Copy)]
pub struct Scenario {
    pub name: &'static str,
    pub width: u32,
    pub height: u32,
    pub owners: u32,
    /// Hexes per city.
    pub hexes_per_city: u32,
    /// Hexes per unit.
    pub hexes_per_unit: u32,
}

impl Scenario {
    pub fn hexes(&self) -> u32 {
        self.width * self.height
    }

    /// `0` hexes per city = no cities.
    pub fn cities(&self) -> u32 {
        self.hexes().checked_div(self.hexes_per_city).unwrap_or(0)
    }

    /// `0` hexes per unit = no units.
    pub fn units(&self) -> u32 {
        self.hexes().checked_div(self.hexes_per_unit).unwrap_or(0)
    }
}

/// Map thresholds of the web "lite" switch: > 3000 and > 8000 hexes
/// (`render/mapRenderStyle.ts:50`, `:52` @ `07d2fbd72`).
pub const SCENARIOS: [Scenario; 4] = [
    Scenario {
        name: "3000 heksow, bez miast i jednostek",
        width: 60,
        height: 50,
        owners: 0,
        hexes_per_city: 0,
        hexes_per_unit: 0,
    },
    Scenario {
        name: "3000 heksow, pozna gra (zalozenie)",
        width: 60,
        height: 50,
        owners: 8,
        hexes_per_city: 60,
        hexes_per_unit: 12,
    },
    Scenario {
        name: "8000 heksow, bez miast i jednostek",
        width: 100,
        height: 80,
        owners: 0,
        hexes_per_city: 0,
        hexes_per_unit: 0,
    },
    Scenario {
        name: "8000 heksow, pozna gra (zalozenie)",
        width: 100,
        height: 80,
        owners: 8,
        hexes_per_city: 60,
        hexes_per_unit: 12,
    },
];

/// Deterministic xorshift (no external crate).
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }

    /// `true` with probability `per_mille / 1000`.
    fn chance(&mut self, per_mille: u64) -> bool {
        self.next() % 1000 < per_mille
    }

    fn below(&mut self, n: u64) -> u64 {
        self.next() % n
    }
}

const TERRAINS: [Terrain; 8] = [
    Terrain::Laka,
    Terrain::Rownina,
    Terrain::Wzgorza,
    Terrain::Gory,
    Terrain::PlytkieMorze,
    Terrain::Morze,
    Terrain::Pustynia,
    Terrain::Polarny,
];

fn hex_at(i: u32, width: u32) -> HexCoord {
    h((i % width) as i32, (i / width) as i32)
}

/// Builds the synthetic snapshot of a scenario (seeded, reproducible).
pub fn synthetic_view(s: &Scenario) -> RenderViewDto {
    let mut rng = Rng(0x9E37_79B9_7F4A_7C15);
    let n = s.hexes();
    let w = s.width;

    let hexes: Vec<HexStaticDto> = (0..n)
        .map(|i| HexStaticDto {
            coord: hex_at(i, w),
            teren_bazowy: TERRAINS[rng.below(8) as usize],
            rzeka_krawedzie: if rng.chance(150) {
                vec![rng.below(6) as u8, rng.below(6) as u8]
            } else {
                vec![]
            },
        })
        .collect();
    let river_count = n / 100;
    let rivers: Vec<RiverPathDto> = (0..river_count)
        .map(|_| {
            let start = rng.below(u64::from(n)) as u32;
            RiverPathDto {
                hexes: (0..12).map(|k| hex_at((start + k * w) % n, w)).collect(),
                kind: Some(match rng.below(4) {
                    0 => RiverKind::Main,
                    1 => RiverKind::Medium,
                    2 => RiverKind::Short,
                    _ => RiverKind::Tributary,
                }),
            }
        })
        .collect();
    let river_render_paths = rivers.iter().map(|r| r.hexes.clone()).collect();
    let map = MapViewDto {
        width: s.width,
        height: s.height,
        seed: 1_234_567.0,
        hexes,
        rivers,
        river_render_paths,
    };

    let hex_state: Vec<HexDynDto> = (0..n)
        .map(|_| {
            let nakladka = match rng.below(100) {
                0..=24 => Nakladka::Las,
                25..=27 => Nakladka::ZlozeRudy,
                28..=29 => Nakladka::ZlozeKonia,
                _ => Nakladka::Brak,
            };
            let improved = rng.chance(100);
            HexDynDto {
                nakladka,
                ulepszenie: if improved {
                    Ulepszenie::Farma
                } else {
                    Ulepszenie::Brak
                },
                ulepszenia: improved.then(|| vec!["farma".to_owned()]),
                improvement_key: improved.then(|| "farma".to_owned()),
                zloze: matches!(nakladka, Nakladka::ZlozeRudy | Nakladka::ZlozeKonia)
                    .then(|| "zloze_rudy".to_owned()),
                village_present: rng.chance(200),
                terraces: rng.chance(20),
                covering_improvement: improved,
                road_mask: if rng.chance(100) {
                    rng.below(64) as u8
                } else {
                    0
                },
            }
        })
        .collect();
    let fog = FogViewDto {
        state: (0..n)
            .map(|_| match rng.below(3) {
                0 => FogState::Unexplored,
                1 => FogState::Explored,
                _ => FogState::Visible,
            })
            .collect(),
    };

    let owner_ids: Vec<OwnerRef> = (0..s.owners)
        .map(|k| match k {
            0 => OwnerRef::Rebel,
            1 => OwnerRef::Barbarian,
            _ => player(u64::from(k - 2)),
        })
        .collect();
    let owners: Vec<OwnerViewDto> = owner_ids
        .iter()
        .map(|&o| {
            let civ = matches!(o, OwnerRef::Player(_));
            OwnerViewDto {
                owner_id: o,
                color: 0x12_34_56,
                civ_icon_id: "rzymianie".into(),
                bronze_civ: "rzym".into(),
                era: 2.0,
                is_city_state: false,
                is_barbarian: o == OwnerRef::Barbarian,
                ring_hex: civ.then(|| "#123456".to_owned()),
                display_name: civ.then(|| "Imperium Rzymskie".to_owned()),
                map_outline_kind: Some(MapOutlineKind::Neutral),
                capital_city_id: civ.then(|| cid(1)),
                relation_to_viewer: RelationToViewer::Pokoj,
            }
        })
        .collect();
    let owner_of = |k: u32| owner_ids[(k as usize) % owner_ids.len()];

    let cities: Vec<CityViewDto> = (0..s.cities())
        .map(|k| CityViewDto {
            id: cid(u64::from(k) + 1),
            owner_id: owner_of(k),
            hex: hex_at(k * s.hexes_per_city, w),
            population: 7.0,
            level: 7.0,
            wall_kind: WallKind::Palisada,
            revolt: false,
            besieged: false,
            fog_visible: true,
            unit_count_on_hex: 2,
            badge: CityBadgeDto {
                city_name: format!("Miasto {k}"),
                population: 7.0,
                defense_tier: 1,
                civ_icon_id: "rzymianie".into(),
                owner_color: 0x12_34_56,
                prod_active: true,
                prod_kind: Some(ProductionKind::Budynek),
                prod_id: Some("spichlerz".into()),
                prod_item_name: Some("Spichlerz".into()),
                prod_category_label: Some("Budynek".into()),
                prod_paused: false,
                growth_percent: Some(3.5),
                growth_starving: false,
                resource_warning: false,
                is_city_state: false,
                era: 2.0,
                is_capital: k == 0,
            },
        })
        .collect();

    let units: Vec<UnitViewDto> = (0..s.units())
        .map(|k| UnitViewDto {
            id: uid(u64::from(k) + 1),
            owner_id: owner_of(k),
            type_id: "wlocznik".into(),
            category: "wlocznik".into(),
            hex: hex_at((k * s.hexes_per_unit + 3) % n, w),
            ruch_max: 2.0,
            ruch_left: 1.0,
            hp: 100.0,
            hp_max: Some(100.0),
            embarked: false,
            in_garnizon: false,
            is_general: k % 50 == 0,
            veteran_stars: 1,
            armor_badge_level: 0,
            soft_badge_level: 0,
            dimmed: false,
        })
        .collect();
    // One stack of 2 for every 4 units (assumption).
    let reps: Vec<UnitId> = units.iter().map(|u| u.id).collect();
    let stacks = StackViewDto {
        visible_ids: reps.clone(),
        badge_by_rep_id: reps.iter().step_by(4).map(|&id| (id, 2)).collect(),
        starving_rep_ids: vec![],
        gold_deficit_rep_ids: vec![],
        vitals_by_rep_id: reps
            .iter()
            .map(|&id| {
                (
                    id,
                    StackVitalsDto {
                        ruch_left: 1.0,
                        ruch_max: 2.0,
                        hp: 100.0,
                        hp_max: 100.0,
                        field_power_m: 12.0,
                        count: 1,
                        armor_badge_level: 0,
                        soft_badge_level: 0,
                        veteran_level: 1,
                        veteran_stars: 1,
                        has_commander: false,
                    },
                )
            })
            .collect(),
    };

    // Territory: radius-2 ring (19 hexes) per city, grouped by owner.
    let mut by_owner: Vec<OwnerHexesDto> = owner_ids
        .iter()
        .map(|&o| OwnerHexesDto {
            owner_id: o,
            hexes: vec![],
        })
        .collect();
    for (k, c) in cities.iter().enumerate() {
        let slot = &mut by_owner[k % owner_ids.len().max(1)];
        for dq in -2..=2_i32 {
            for dr in (-2_i32).max(-dq - 2)..=2_i32.min(-dq + 2) {
                slot.hexes.push(h(c.hex.q + dq, c.hex.r + dr));
            }
        }
    }
    by_owner.retain(|o| !o.hexes.is_empty());

    RenderViewDto {
        contract_version: CONTRACT_VERSION,
        viewer: ViewerDto {
            owner_id: player(0),
            fog_active: true,
        },
        turn: 250,
        map,
        hex_state,
        fog,
        owners,
        cities,
        units,
        stacks,
        sieges: vec![],
        wonders: vec![],
        territory: TerritoryViewDto { by_owner },
        overlays: OverlaysViewDto {
            culture_range: None,
            religion_range: None,
            trade_routes: vec![],
            okolica: None,
            worker_fields: vec![],
            reachable: vec![],
            build_highlight: BuildHighlightDto {
                kind: BuildHighlightKind::Generic,
                hexes: vec![],
            },
            selection: None,
            path_route: None,
        },
        battle: None,
    }
}
