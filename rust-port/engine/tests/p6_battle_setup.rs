//! P6 BATTLE-SETUP T5a (dispatch R-RUSTPORT-P6-BATTLE-SETUP-Q1, runda 1, Operator): zgodność ustawienia pola bitwy
//! w silniku (`battle_setup*`) z WYKONANIEM tekstu pinu `07d2fbd72` (`battle-terrain.ts`, fragmenty `battleScene.ts`,
//! `city-towers.ts`, `city-fortification.ts`, `combat.ts`), oraz z rendererem (`renderer/src/battle/field.rs`
//! `carve_wall_tiles` / `tile_jitter`) WYŁĄCZNIE przez fiksturę JSON (bez zależności od crate renderera).
//!
//! Wektory: `p6_battle_setup_vectors/vectors.json` i `renderer_parity.json` z `p6_battle_setup_gen.mjs` (strażnik
//! SHA-256 plików i wycinków pinu, FNV-1a 64 wycinków renderera).
//!
//! Porównanie bajt w bajt: kafle po generatorze, po `_carveBattleBox`, po `_fencePlayableZone`, po `_carveWallTiles`,
//! końcowe; pola muru (`wallCol`, rzędy, brama, `gateHp`, `wallTileHp`, `siegeWallTilesInit`), rzędy wieżyczek,
//! `fortKind`, preset, `safeCols`, `clearSideCap`; sondy `MoveTerrain` (także indeksy niecałkowite, NaN, poza polem).

use std::sync::mpsc;
use std::time::Duration;

use civ_engine::domain::battle_setup::{
    battle_clear_ranks, battle_clear_side_cap, battle_generate_opts, battle_safe_cols_f,
    carve_battle_box, carve_wall_tiles, cavalry_terrain_multiplier, deploy_clear_ranks_for,
    fence_playable_zone, setup_battle_field, terrain_combat_cavalry_rows, BattleFieldInput,
    CavalryTerrainRow, FieldMoveTerrain, SiegeFieldInput, ATK_COL_STEP, ATK_FRONT_COL, BF_COLS,
    BF_ROWS, CLEAR_DEPTH_BASE_CAP, DEF_COL_STEP, DEF_FRONT_COL, DEPLOY_MARGIN, FRONT_GAP,
    MAX_PER_SIDE, PLAYABLE_COLS, PLAYABLE_ROWS, PLAY_COL0, PLAY_COL1, PLAY_MID_COL, PLAY_MID_ROW,
    PLAY_ROW0, PLAY_ROW1, RANK_WIDTH,
};
use civ_engine::domain::battle_setup_sin::js_sin;
use civ_engine::domain::battle_setup_terrain::{
    bterrain, generate_battle_terrain, make_rng, pick_from_ranges, preset_for_world_terrain,
    tile_jitter, BattleTerrainMap, GenerateOpts, RiverMode, TerrainPreset, WorldTerrainInput,
};
use civ_engine::domain::city_towers::DEFAULT_TOWER_SPACING;
use civ_engine::domain::siege_city_fortification::CityFortificationKind;
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_battle_setup_vectors/vectors.json");
const RPARITY: &str = include_str!("p6_battle_setup_vectors/renderer_parity.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// `FILE_SHA` / `FRAG_SHA` z `p6_battle_setup_gen.mjs`.
const TERRAIN_SHA: &str = "a17735ed3ef7b20277cfba3aee9e9aa478c5a0e71481f747dc04cd365fb8f00d";
const FRAG_SHA: &str = "21984ff20c8d13b0446a3e01f655453b50efc9d80ee4f73d8488e95622c3a6d3";

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn num(v: &Value) -> f64 {
    match v.as_str() {
        Some("NaN") => f64::NAN,
        Some("Infinity") => f64::INFINITY,
        Some("-Infinity") => f64::NEG_INFINITY,
        Some("-0") => -0.0,
        Some(s) => panic!("nieznana liczba {s}"),
        None => v.as_f64().expect("liczba"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}

fn hexf(s: &str) -> f64 {
    f64::from_bits(u64::from_str_radix(s, 16).expect("hex"))
}

fn rle_decode(s: &str) -> Vec<u8> {
    let mut out = Vec::new();
    for tok in s.split('.') {
        let (k, n) = tok.split_once('*').expect("rle");
        let k: u8 = k.parse().expect("kod");
        let n: usize = n.parse().expect("dlugosc");
        out.extend(std::iter::repeat_n(k, n));
    }
    out
}

fn rle(tiles: &[u8]) -> String {
    let mut out: Vec<String> = Vec::new();
    let mut i = 0;
    while i < tiles.len() {
        let mut j = i;
        while j < tiles.len() && tiles[j] == tiles[i] {
            j += 1;
        }
        out.push(format!("{}*{}", tiles[i], j - i));
        i = j;
    }
    out.join(".")
}

fn opt_bool(v: &Value) -> bool {
    v.as_bool().unwrap_or(false)
}

fn world(v: &Value) -> Option<WorldTerrainInput> {
    if v.is_null() {
        return None;
    }
    Some(WorldTerrainInput {
        baza: v["baza"].as_str().expect("baza").to_owned(),
        las: opt_bool(&v["las"]),
        rzeka: opt_bool(&v["rzeka"]),
    })
}

fn preset_of(v: &Value) -> TerrainPreset {
    TerrainPreset {
        forest_blobs_mul: num(&v["forestBlobsMul"]),
        hill_blobs_mul: num(&v["hillBlobsMul"]),
        rock_count_mul: num(&v["rockCountMul"]),
        hill_radius_boost: int(&v["hillRadiusBoost"]),
        river_mode: match v["riverMode"].as_str().expect("riverMode") {
            "winding" => RiverMode::Winding,
            "none" => RiverMode::None,
            "wide" => RiverMode::Wide,
            "coast" => RiverMode::Coast,
            m => panic!("riverMode {m}"),
        },
        ford_count: v["fordCount"].as_i64(),
        lake_count: v["lakeCount"].as_array().map(|a| (int(&a[0]), int(&a[1]))),
        edge_rocks: v["edgeRocks"].as_bool().expect("edgeRocks"),
        no_forest: v["noForest"].as_bool().expect("noForest"),
        desert_palette: v["desertPalette"].as_bool().expect("desertPalette"),
        bias_safe_cols: v["biasSafeCols"].as_bool().expect("biasSafeCols"),
        is_mountain: v["isMountain"].as_bool().expect("isMountain"),
    }
}

fn ranges(v: &Value) -> Vec<(i64, i64)> {
    v.as_array()
        .expect("zakresy")
        .iter()
        .map(|r| (int(&r[0]), int(&r[1])))
        .collect()
}

/// Strażnik czasu: wykonanie w osobnym wątku z limitem (NaN/Inf w liczności nie może zawiesić ustawienia).
fn with_deadline<T: Send + 'static>(secs: u64, f: impl FnOnce() -> T + Send + 'static) -> T {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(f());
    });
    rx.recv_timeout(Duration::from_secs(secs))
        .expect("ustawienie pola przekroczylo limit czasu (zawieszenie)")
}

#[test]
fn naglowek_wektorow_i_straznik_pinu() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    assert_eq!(
        v["fileSha256"]["gra/src/battle/battle-terrain.ts"],
        TERRAIN_SHA
    );
    assert_eq!(v["fragSha256"], FRAG_SHA);
}

#[test]
fn stale_pola_jak_pin() {
    let v = vectors();
    let c = &v["consts"];
    let ints: [(&str, i64); 16] = [
        ("BF_COLS", BF_COLS),
        ("BF_ROWS", BF_ROWS),
        ("PLAYABLE_COLS", PLAYABLE_COLS),
        ("PLAYABLE_ROWS", PLAYABLE_ROWS),
        ("PLAY_COL0", PLAY_COL0),
        ("PLAY_ROW0", PLAY_ROW0),
        ("PLAY_COL1", PLAY_COL1),
        ("PLAY_ROW1", PLAY_ROW1),
        ("PLAY_MID_COL", PLAY_MID_COL),
        ("PLAY_MID_ROW", PLAY_MID_ROW),
        ("DEPLOY_MARGIN", DEPLOY_MARGIN),
        ("FRONT_GAP", FRONT_GAP),
        ("ATK_FRONT_COL", ATK_FRONT_COL),
        ("DEF_FRONT_COL", DEF_FRONT_COL),
        ("ATK_COL_STEP", ATK_COL_STEP),
        ("DEF_COL_STEP", DEF_COL_STEP),
    ];
    for (k, want) in ints {
        assert_eq!(int(&c[k]), want, "{k}");
    }
    assert!(same(num(&c["MAX_PER_SIDE"]), MAX_PER_SIDE));
    assert!(same(num(&c["RANK_WIDTH"]), RANK_WIDTH));
    assert!(same(num(&c["CLEAR_DEPTH_BASE_CAP"]), CLEAR_DEPTH_BASE_CAP));
}

#[test]
fn side_cap_glebokosc_i_safe_cols_jak_pin() {
    let v = vectors();
    let sc = v["sideCap"].as_array().expect("sideCap");
    assert!(sc.len() >= 100);
    for e in sc {
        let got = battle_clear_side_cap(num(&e["a"]), num(&e["b"]));
        assert!(same(got, num(&e["cap"])), "{e}: {got}");
    }
    for e in v["clearRanks"].as_array().expect("clearRanks") {
        let pa = e["presetActive"].as_bool().expect("presetActive");
        let cap = num(&e["cap"]);
        assert!(same(battle_clear_ranks(pa, cap), num(&e["ranks"])), "{e}");
        assert!(
            same(deploy_clear_ranks_for(pa, cap), num(&e["deploy"])),
            "{e}"
        );
        let got = battle_safe_cols_f(pa, cap);
        let want: Vec<(f64, f64)> = e["safeCols"]
            .as_array()
            .expect("safeCols")
            .iter()
            .map(|r| (num(&r[0]), num(&r[1])))
            .collect();
        assert_eq!(got, want, "{e}");
    }
}

#[test]
fn preset_for_world_terrain_jak_pin() {
    let v = vectors();
    let ps = v["presets"].as_array().expect("presets");
    assert!(ps.len() > 150);
    for e in ps {
        let wt = world(&e["wt"]);
        let got = preset_for_world_terrain(wt.as_ref());
        assert_eq!(got, preset_of(&e["preset"]), "{}", e["wt"]);
    }
}

#[test]
fn rng_jitter_i_pick_from_ranges_jak_pin() {
    let v = vectors();
    for e in v["rng"].as_array().expect("rng") {
        let mut g = make_rng(e["seed"].as_str().expect("seed"));
        for (k, h) in e["first"].as_array().expect("first").iter().enumerate() {
            let got = g.next_f64();
            assert_eq!(
                got.to_bits(),
                hexf(h.as_str().expect("hex")).to_bits(),
                "{} #{k}",
                e["seed"]
            );
        }
    }
    let j = v["jitter"].as_array().expect("jitter");
    assert_eq!(j.len(), 400);
    for e in j {
        let (c, r, s) = (int(&e[0]), int(&e[1]), int(&e[2]));
        let got = tile_jitter(
            i32::try_from(c).expect("c"),
            i32::try_from(r).expect("r"),
            i32::try_from(s).expect("s"),
        );
        assert_eq!(
            got.to_bits(),
            hexf(e[3].as_str().expect("hex")).to_bits(),
            "{e}"
        );
    }
    for e in v["pickFromRanges"].as_array().expect("pfr") {
        let mut g = make_rng(e["seed"].as_str().expect("seed"));
        let mut used = 0;
        let got = pick_from_ranges(
            &mut || {
                used += 1;
                g.next_f64()
            },
            &ranges(&e["ranges"]),
        );
        assert_eq!(got, int(&e["value"]), "{e}");
        assert_eq!(used, int(&e["used"]), "rzuty {e}");
    }
}

#[test]
fn js_sin_bit_w_bit_jak_v8() {
    let v = vectors();
    let sv = v["sin"].as_array().expect("sin");
    assert_eq!(sv.len(), 3000);
    for e in sv {
        let x = hexf(e[0].as_str().expect("x"));
        let want = hexf(e[1].as_str().expect("sin"));
        assert_eq!(js_sin(x).to_bits(), want.to_bits(), "sin({x:e})");
    }
    for x in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert!(js_sin(x).is_nan());
    }
    assert_eq!(js_sin(-0.0).to_bits(), (-0.0_f64).to_bits());
}

fn gen_opts(o: &Value) -> GenerateOpts {
    GenerateOpts {
        cols: i32::try_from(int(&o["cols"])).expect("cols"),
        rows: i32::try_from(int(&o["rows"])).expect("rows"),
        seed: o["seed"].as_str().map(str::to_owned),
        deploy_margin: o["deployMargin"].as_i64(),
        row_margin: o["rowMargin"].as_i64(),
        safe_cols: if o["safeCols"].is_null() {
            None
        } else {
            Some(ranges(&o["safeCols"]))
        },
        preset: if o["preset"].is_null() {
            None
        } else {
            Some(preset_of(&o["preset"]))
        },
    }
}

#[test]
fn generate_battle_terrain_losowe_opcje_jak_pin() {
    let v = vectors();
    let gens = v["gens"].as_array().expect("gens");
    assert_eq!(gens.len(), 220);
    let mut modes = [0usize; 4];
    for (k, e) in gens.iter().enumerate() {
        let opts = gen_opts(&e["opts"]);
        if let Some(p) = &opts.preset {
            modes[match p.river_mode {
                RiverMode::Winding => 0,
                RiverMode::None => 1,
                RiverMode::Wide => 2,
                RiverMode::Coast => 3,
            }] += 1;
        }
        let got = generate_battle_terrain(&opts);
        assert_eq!(i64::from(got.map.cols()), int(&e["cols"]), "#{k}");
        assert_eq!(i64::from(got.map.rows()), int(&e["rows"]), "#{k}");
        let want = e["tiles"].as_str().expect("tiles");
        assert!(
            rle(got.map.tiles()) == want,
            "#{k} {}: kafle rozne",
            e["opts"]
        );
    }
    // pokrycie wszystkich trybow rzeki
    assert!(modes.iter().all(|&m| m >= 20), "{modes:?}");
}

fn scenario_input(i: &Value) -> BattleFieldInput {
    BattleFieldInput {
        teren: i["teren"].as_str().expect("teren").to_owned(),
        world_terrain: world(&i["worldTerrain"]),
        attacker_count: num(&i["attackers"]),
        defender_count: num(&i["defenders"]),
        siege: if i["siege"].is_null() {
            None
        } else {
            Some(SiegeFieldInput {
                built_building_ids: i["siege"]["builtBuildingIds"]
                    .as_array()
                    .expect("ids")
                    .iter()
                    .map(|s| s.as_str().expect("id").to_owned())
                    .collect(),
                // miasto-params.json `wieze_strzeleckie_odstep_kafli.wartosc` (pin: 4; null = brak klucza)
                tower_spacing: i["towerSpacing"].as_i64(),
            })
        },
    }
}

#[test]
fn scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin() {
    let v = vectors();
    let sc = v["scenarios"].as_array().expect("scenarios");
    assert!(sc.len() >= 6);
    let (mut sieges, mut presets, mut legacy) = (0, 0, 0);
    let mut kinds = std::collections::BTreeSet::new();
    for s in sc {
        let id = s["id"].as_str().expect("id").to_owned();
        let input = scenario_input(&s["input"]);
        // Etapami (jak konstruktor pinu), ze straznikiem czasu.
        let inp = input.clone();
        let stages = with_deadline(60, move || {
            let (opts, pa, cap, safe) = battle_generate_opts(&inp);
            let gen = generate_battle_terrain(&opts);
            let mut map = gen.map.clone();
            carve_battle_box(&mut map, pa, cap);
            let after_box = map.clone();
            fence_playable_zone(&mut map);
            let after_fence = map.clone();
            let wall = inp.siege.as_ref().map(|_| {
                let l = carve_wall_tiles(&mut map);
                (l, map.clone())
            });
            (opts, gen, after_box, after_fence, wall, pa, cap, safe)
        });
        let (opts, gen, after_box, after_fence, wall, pa, _cap, safe) = stages;
        let g = &s["gen"];
        assert_eq!(opts.seed.as_deref(), g["seed"].as_str(), "{id} seed");
        assert_eq!(opts.deploy_margin, g["deployMargin"].as_i64(), "{id}");
        assert_eq!(opts.row_margin, g["rowMargin"].as_i64(), "{id}");
        assert_eq!(
            Some(safe.clone()),
            Some(ranges(&g["safeCols"])),
            "{id} safeCols"
        );
        assert_eq!(gen.preset, preset_of(&g["preset"]), "{id} preset");
        assert!(
            rle(gen.map.tiles()) == g["tiles"].as_str().expect("t"),
            "{id} generator"
        );
        assert!(
            rle(after_box.tiles()) == s["afterBox"].as_str().expect("t"),
            "{id} _carveBattleBox"
        );
        assert!(
            rle(after_fence.tiles()) == s["afterFence"].as_str().expect("t"),
            "{id} _fencePlayableZone"
        );
        match (&wall, s["afterWall"].as_str()) {
            (Some((_, m)), Some(w)) => assert!(rle(m.tiles()) == w, "{id} _carveWallTiles"),
            (None, None) => {}
            _ => panic!("{id}: mur obecny niezgodnie z pinem"),
        }
        // Pelne ustawienie (API produkcyjne) == etapy == pin.
        let inp2 = input.clone();
        let field = with_deadline(60, move || setup_battle_field(&inp2));
        assert!(
            rle(field.map.tiles()) == s["final"].as_str().expect("final"),
            "{id} final"
        );
        assert_eq!(field.preset_active, pa);
        assert_eq!(
            field.desert_palette,
            s["desertPalette"].as_bool().expect("dp"),
            "{id}"
        );
        assert_eq!(field.safe_cols, safe);
        match (&field.siege, int(&s["siegeWallCol"])) {
            (None, -1) => {
                assert_eq!(int(&s["siegeGateRow"]), -1);
                assert!(s["towerRows"].as_array().expect("t").is_empty());
                assert_eq!(s["fortKind"], "none");
            }
            (Some(sf), wc) => {
                sieges += 1;
                let l = &sf.layout;
                assert_eq!(l.wall_col, wc, "{id}");
                assert_eq!(l.row_lo, int(&s["siegeWallRowLo"]), "{id}");
                assert_eq!(l.row_hi, int(&s["siegeWallRowHi"]), "{id}");
                assert_eq!(l.gate_col, int(&s["siegeGateCol"]), "{id}");
                assert_eq!(l.gate_row, int(&s["siegeGateRow"]), "{id}");
                assert!(same(l.gate_hp, num(&s["gateHp"])), "{id}");
                assert_eq!(l.gate_open, s["gateOpen"].as_bool().expect("go"), "{id}");
                assert_eq!(
                    l.wall_tiles_init as i64,
                    int(&s["siegeWallTilesInit"]),
                    "{id}"
                );
                let hp: Vec<(i64, f64)> = s["wallTileHp"]
                    .as_array()
                    .expect("hp")
                    .iter()
                    .map(|e| (int(&e[0]), num(&e[1])))
                    .collect();
                assert_eq!(l.wall_tile_hp, hp, "{id}");
                let want_kind = match s["fortKind"].as_str().expect("fk") {
                    "mur" => CityFortificationKind::Mur,
                    "palisada" => CityFortificationKind::Palisada,
                    _ => CityFortificationKind::None,
                };
                assert_eq!(sf.fort_kind, want_kind, "{id}");
                kinds.insert(format!("{want_kind:?}"));
                let rows: Vec<i64> = s["towerRows"]
                    .as_array()
                    .expect("towerRows")
                    .iter()
                    .map(int)
                    .collect();
                assert_eq!(sf.tower_rows, rows, "{id} wiezyczki");
            }
            (None, wc) => panic!("{id}: brak muru, pin ma kolumne {wc}"),
        }
        if s["input"]["worldTerrain"].is_null() {
            legacy += 1;
        } else {
            presets += 1;
        }
    }
    assert!(
        sieges >= 6 && presets >= 10 && legacy >= 3,
        "{sieges} {presets} {legacy}"
    );
    assert_eq!(
        kinds.len(),
        3,
        "mur, palisada i brak obwarowania: {kinds:?}"
    );
}

#[test]
fn move_terrain_produkcyjny_na_siatce_jak_pin() {
    let v = vectors();
    let mut n = 0;
    for s in v["scenarios"].as_array().expect("scenarios") {
        let field = setup_battle_field(&scenario_input(&s["input"]));
        let mt = FieldMoveTerrain::from_engine_data(field.map.clone()).expect("dane terenu");
        for p in s["probes"].as_array().expect("probes") {
            let (c, r) = (num(&p["c"]), num(&p["r"]));
            assert_eq!(
                field.map.at_f(c, r),
                p["at"].as_u64().map(|x| u8::try_from(x).expect("u8")),
                "{} {p}",
                s["id"]
            );
            assert_eq!(
                mt.passable(c, r),
                p["passable"].as_bool().expect("p"),
                "{} {p}",
                s["id"]
            );
            assert!(
                same(mt.move_cost(c, r), num(&p["moveCost"])),
                "{} {p}",
                s["id"]
            );
            assert_eq!(
                mt.is_ford(c, r),
                p["ford"].as_bool().expect("f"),
                "{} {p}",
                s["id"]
            );
            assert_eq!(
                field.map.combat_terrain_name_f(c, r),
                p["name"].as_str().expect("n"),
                "{} {p}",
                s["id"]
            );
            assert!(
                same(mt.cavalry_multiplier(c, r), num(&p["cav"])),
                "{} {p}",
                s["id"]
            );
            n += 1;
        }
    }
    assert!(n > 2500, "{n}");
}

#[test]
fn move_terrain_mur_brama_i_wylom() {
    let field = setup_battle_field(&BattleFieldInput {
        teren: "Równina".into(),
        world_terrain: None,
        attacker_count: 40.0,
        defender_count: 40.0,
        siege: Some(SiegeFieldInput {
            built_building_ids: vec!["mury".into()],
            tower_spacing: None,
        }),
    });
    let siege = field.siege.clone().expect("mur");
    assert_eq!(siege.tower_rows.first(), Some(&2));
    assert_eq!(siege.tower_rows.get(1), Some(&(2 + DEFAULT_TOWER_SPACING)));
    let mut mt = FieldMoveTerrain::from_engine_data(field.map).expect("dane");
    let (wc, gr) = (siege.layout.wall_col, siege.layout.gate_row);
    #[allow(clippy::cast_precision_loss)]
    let (wcf, grf) = (wc as f64, gr as f64);
    assert!(!mt.passable(wcf, 40.0), "mur");
    assert!(!mt.passable(wcf, grf), "brama");
    assert!(mt.move_cost(wcf, grf).is_infinite());
    // wylom bramy (pin `_breachGate`: Gate -> Plains) otwiera przejscie
    mt.map.set_tile(
        i32::try_from(wc).expect("c"),
        i32::try_from(gr).expect("r"),
        bterrain::PLAINS,
    );
    assert!(mt.passable(wcf, grf));
    assert!(same(mt.move_cost(wcf, grf), 1.0));
}

#[test]
fn mnoznik_kawalerii_jak_pin_i_dane_silnika_rowne_pinowi() {
    let v = vectors();
    let engine_rows =
        terrain_combat_cavalry_rows(civ_engine::data::units_combat::TERRAIN_COMBAT_JSON)
            .expect("dane");
    let pin_rows: Vec<CavalryTerrainRow> = v["terrainCombat"]
        .as_array()
        .expect("tc")
        .iter()
        .map(|t| CavalryTerrainRow {
            teren: t["Teren"].as_str().expect("Teren").to_owned(),
            kawaleria: t["kaw"].as_str().map(str::to_owned),
        })
        .collect();
    assert_eq!(engine_rows, pin_rows, "terrain-combat.json silnika != pin");
    let cav = v["cav"].as_array().expect("cav");
    assert!(cav.len() > 30);
    for e in cav {
        let data: Vec<CavalryTerrainRow> = if e["data"] == "pin" {
            pin_rows.clone()
        } else {
            e["data"]
                .as_array()
                .expect("data")
                .iter()
                .map(|t| CavalryTerrainRow {
                    teren: t["Teren"].as_str().expect("Teren").to_owned(),
                    kawaleria: t["kaw"].as_str().map(str::to_owned),
                })
                .collect()
        };
        let got = cavalry_terrain_multiplier(e["name"].as_str().expect("name"), &data);
        assert!(same(got, num(&e["mult"])), "{e}: {got}");
    }
}

#[test]
fn nan_inf_i_skrajne_licznosci_nie_zawieszaja() {
    for (a, d) in [
        (f64::NAN, f64::NAN),
        (f64::INFINITY, f64::INFINITY),
        (f64::NEG_INFINITY, f64::NAN),
        (1e308, -1e308),
        (f64::INFINITY, 3.0),
    ] {
        for wt in [
            None,
            Some(WorldTerrainInput {
                baza: "gory".into(),
                las: true,
                rzeka: true,
            }),
        ] {
            let input = BattleFieldInput {
                teren: "X".into(),
                world_terrain: wt,
                attacker_count: a,
                defender_count: d,
                siege: Some(SiegeFieldInput::default()),
            };
            let f = with_deadline(30, move || setup_battle_field(&input));
            assert_eq!(f.map.tiles().len(), 68 * 156);
        }
    }
    // Bezposrednie wolanie wyciecia z nieskonczona glebokoscia (pin: petla bez konca) konczy sie z tym samym
    // wynikiem co skonczona glebokosc pokrywajaca cale pole.
    let base = generate_battle_terrain(&GenerateOpts {
        cols: 68,
        rows: 156,
        seed: Some("bf:inf".into()),
        ..GenerateOpts::default()
    });
    let mut a = base.map.clone();
    let mut b = base.map;
    let a = with_deadline(30, move || {
        carve_battle_box(&mut a, false, f64::INFINITY);
        a
    });
    carve_battle_box(&mut b, false, 2000.0);
    assert_eq!(a, b);
}

#[test]
fn ustawienie_deterministyczne_i_zalezne_od_terenu() {
    let mk = |t: &str| BattleFieldInput {
        teren: t.into(),
        world_terrain: Some(WorldTerrainInput {
            baza: "laka".into(),
            las: false,
            rzeka: false,
        }),
        attacker_count: 40.0,
        defender_count: 40.0,
        siege: None,
    };
    assert_eq!(
        setup_battle_field(&mk("Łąka")),
        setup_battle_field(&mk("Łąka"))
    );
    assert_ne!(
        setup_battle_field(&mk("Łąka")).map,
        setup_battle_field(&mk("Laka")).map
    );
}

// ------------------------------------------------------------------ fikstura renderera

/// FNV-1a 64 tekstu (jak `fnv64` w generatorze).
fn fnv64(s: &str) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in s.bytes() {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    format!("{h:016x}")
}

/// Wycinki `field.rs` jak w generatorze (stale, `tile_jitter`, `set_index`, `carve_wall_tiles`).
fn renderer_fragments(text: &str, consts: &[Value]) -> String {
    let lines: Vec<&str> = text.split('\n').collect();
    let fn_block = |prefix: &str, close: &str| -> String {
        let i = lines
            .iter()
            .position(|l| l.starts_with(prefix))
            .expect(prefix);
        let mut j = i;
        while lines[j] != close {
            j += 1;
        }
        lines[i..=j].join("\n")
    };
    let mut frags: Vec<String> = consts
        .iter()
        .map(|c| {
            let name = c.as_str().expect("stala");
            let pfx = format!("pub const {name}:");
            (*lines
                .iter()
                .find(|l| l.starts_with(&pfx))
                .expect("stala w field.rs"))
            .to_owned()
        })
        .collect();
    frags.push(fn_block("pub fn tile_jitter(", "}"));
    frags.push(fn_block("    fn set_index(", "    }"));
    frags.push(fn_block("pub fn carve_wall_tiles(", "}"));
    frags.join("\n")
}

#[test]
fn rownosc_z_rendererem_przez_fiksture() {
    let fx: Value = serde_json::from_str(RPARITY).expect("renderer_parity.json");
    // Fikstura odpowiada biezacemu tekstowi renderera (odczyt pliku, bez zaleznosci od crate).
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../renderer/src/battle/field.rs"
    );
    let text = std::fs::read_to_string(path).expect("renderer/src/battle/field.rs");
    let frags = renderer_fragments(&text, fx["constants"].as_array().expect("constants"));
    assert_eq!(
        fnv64(&frags),
        fx["fragmentsFnv64"].as_str().expect("fnv"),
        "field.rs zmieniony: regeneruj fiksture"
    );

    for e in fx["jitter"].as_array().expect("jitter") {
        let got = tile_jitter(
            i32::try_from(int(&e[0])).expect("c"),
            i32::try_from(int(&e[1])).expect("r"),
            i32::try_from(int(&e[2])).expect("s"),
        );
        assert_eq!(
            format!("{:016x}", got.to_bits()),
            e[3].as_str().expect("bits"),
            "{e}"
        );
    }
    let carve = fx["carve"].as_array().expect("carve");
    assert!(carve.len() >= 10);
    for c in carve {
        let cols = i32::try_from(int(&c["cols"])).expect("cols");
        let rows = i32::try_from(int(&c["rows"])).expect("rows");
        let mut map = BattleTerrainMap::from_tiles(
            cols,
            rows,
            rle_decode(c["input"].as_str().expect("in")),
            false,
        )
        .expect("mapa");
        let l = carve_wall_tiles(&mut map);
        let r = &c["renderer"];
        assert!(
            rle(map.tiles()) == r["tiles"].as_str().expect("t"),
            "{} kafle",
            c["id"]
        );
        assert_eq!(l.wall_col, int(&r["wallCol"]));
        assert_eq!(l.row_lo, int(&r["rowLo"]));
        assert_eq!(l.row_hi, int(&r["rowHi"]));
        assert_eq!(l.gate_col, int(&r["gateCol"]));
        assert_eq!(l.gate_row, int(&r["gateRow"]));
        assert_eq!(
            format!("{:016x}", l.gate_hp.to_bits()),
            r["gateHpBits"].as_str().expect("g")
        );
        assert_eq!(l.gate_open, r["gateOpen"].as_bool().expect("o"));
        assert_eq!(l.wall_tile_hp.len() as i64, int(&r["wallTileHpLen"]));
        let hp: Vec<(i64, String)> = r["wallTileHp"]
            .as_array()
            .expect("hp")
            .iter()
            .map(|e| (int(&e[0]), e[1].as_str().expect("b").to_owned()))
            .collect();
        let mine: Vec<(i64, String)> = l
            .wall_tile_hp
            .iter()
            .map(|&(row, h)| (row, format!("{:016x}", h.to_bits())))
            .collect();
        assert_eq!(mine, hp, "{}", c["id"]);
    }
}
