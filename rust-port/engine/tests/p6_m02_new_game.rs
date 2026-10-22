//! P6.M02 - `newGameMapDefaults.ts` z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m02_vectors/new-game.json`, generator `gen-m02-vectors.mjs`).
//! Floaty porownywane BITOWO (wektor = 16 cyfr hex IEEE-754).

use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::params::{
    aktywne_typy_from_map_label, civ_types_menu_for_map_label, civ_types_triple_for_map_label,
    clamp_miasta_panstwa_count, default_civ_types_from_map_label,
    default_land_fraction_percent_for_typ, default_miasta_panstwa_from_map_label,
    default_player_civ_id, default_rywale_from_map_label, default_start_epoch_id,
    default_world_density, density_multiplier, density_tier_from_label, density_tier_to_label,
    desert_noise_threshold_from_tier, epoch_civ_type_pool, forest_noise_threshold_from_tier,
    highland_noise_threshold_from_tier, land_fraction_percent_opts, map_size_label_from_dims,
    map_size_label_from_menu_label, max_civ_types_for_start_epoch, max_miast_panstwa,
    max_rivers_for_map_and_density, max_rivers_from_density, max_typy_cywilizacji_menu,
    miasta_panstwa_menu_for_map_label, mountain_noise_threshold_from_tier, resolve_land_fraction,
    resolve_river_map_params, resolve_river_trace_for_map, resolve_world_gen_numbers,
    resource_baseline_rarity_mult, river_grid_cell_size_for_tier, river_grid_trace_min_len,
    river_map_area_scale, river_min_path_length_for_tier, river_ref_area,
    river_trace_limits_for_map, rywale_menu_for_map_label, scale_max_rivers_for_land,
    typ_swiata_from_menu_label, DensityTier, Difficulty, MenuBundle, RiverTrace, StartEpochId,
    WorldGenOptions, WorldGenerationPreset,
};
use civ_engine::domain::unit_epoch::CivEntryRow;
use serde_json::Value;

const NEW_GAME: &str = include_str!("p6_m02_vectors/new-game.json");

fn web() -> Value {
    serde_json::from_str(NEW_GAME).expect("new-game vectors parse")
}

fn bits(v: &Value) -> u64 {
    u64::from_str_radix(v.as_str().expect("bity hex"), 16).expect("hex")
}

fn tier(key: &str) -> DensityTier {
    DensityTier::from_key(key).unwrap_or_else(|| panic!("tier {key}"))
}

fn world_type_key(typ: WorldType) -> &'static str {
    match typ {
        WorldType::Continents => "kontynenty",
        WorldType::Pangea => "pangea",
        WorldType::Islands => "wyspy",
        WorldType::Earth => "ziemia",
    }
}

fn world_type(key: &str) -> WorldType {
    match key {
        "kontynenty" => WorldType::Continents,
        "pangea" => WorldType::Pangea,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("typ {other}"),
    }
}

fn check_bundle(got: &MenuBundle, want: &Value, ctx: &str) {
    let opts: Vec<&str> = want["opts"]
        .as_array()
        .expect("opts")
        .iter()
        .map(|v| v.as_str().expect("opt"))
        .collect();
    let descs: Vec<&str> = want["descs"]
        .as_array()
        .expect("descs")
        .iter()
        .map(|v| v.as_str().expect("desc"))
        .collect();
    assert_eq!(
        got.opts.iter().map(String::as_str).collect::<Vec<_>>(),
        opts,
        "{ctx}: opts"
    );
    assert_eq!(
        got.descs.iter().map(String::as_str).collect::<Vec<_>>(),
        descs,
        "{ctx}: descs"
    );
    assert_eq!(
        got.domyslny as i64,
        want["domyslny"].as_i64().expect("domyslny"),
        "{ctx}: domyslny"
    );
}

fn check_triple(got: civ_engine::data::derived::TripleRow, want: &Value, ctx: &str) {
    assert_eq!(
        (got.min, got.default, got.max),
        (
            want["min"].as_i64().expect("min"),
            want["default"].as_i64().expect("default"),
            want["max"].as_i64().expect("max")
        ),
        "{ctx}"
    );
}

fn trace_eq(got: RiverTrace, want: &Value, ctx: &str) {
    assert_eq!(
        (got.min_len, got.max_len, got.margin),
        (
            want["minLen"].as_i64().expect("minLen"),
            want["maxLen"].as_i64().expect("maxLen"),
            want["margin"].as_i64().expect("margin")
        ),
        "{ctx}"
    );
}

/// Buduje wiersze rosteru z wektora i wywoluje `f` (CivEntryRow pozycyjnie pozycjonuje &str).
fn with_roster<R>(roster: &Value, f: impl FnOnce(&[CivEntryRow<'_>]) -> R) -> R {
    let rows = roster.as_array().expect("roster");
    let legacy: Vec<Option<Vec<&str>>> = rows
        .iter()
        .map(|r| {
            r.get("epokiStartowe").map(|a| {
                a.as_array()
                    .expect("arr")
                    .iter()
                    .map(|s| s.as_str().expect("str"))
                    .collect()
            })
        })
        .collect();
    let built: Vec<CivEntryRow<'_>> = rows
        .iter()
        .zip(legacy.iter())
        .map(|(r, l)| CivEntryRow {
            ikona_id: r.get("ikonaId").and_then(Value::as_str),
            epoka_wejscia: r.get("epokaWejscia").and_then(Value::as_str),
            epoki_startowe: l.as_deref(),
        })
        .collect();
    f(&built)
}

#[test]
fn map_size_label_from_dims_matches_web() {
    let web = web();
    let rows = web["mapSizeFromDims"].as_array().expect("rows");
    assert!(rows.len() > 200, "za malo wektorow: {}", rows.len());
    for row in rows {
        let (w, h) = (row["w"].as_i64().expect("w"), row["h"].as_i64().expect("h"));
        assert_eq!(
            map_size_label_from_dims(w, h).key(),
            row["label"].as_str().expect("label"),
            "mapSizeLabelFromDims({w},{h})"
        );
    }
}

#[test]
fn per_label_functions_match_web() {
    let web = web();
    let epochs: Vec<&str> = web["epochs"]
        .as_array()
        .expect("epochs")
        .iter()
        .map(|v| v.as_str().expect("epoch"))
        .collect();
    let tiers: Vec<&str> = web["tiers"]
        .as_array()
        .expect("tiers")
        .iter()
        .map(|v| v.as_str().expect("tier"))
        .collect();
    let rows = web["perLabel"].as_array().expect("rows");
    assert!(rows.len() > 50);
    for row in rows {
        let label = row["label"].as_str().expect("label");
        let ctx = |name: &str| format!("{name}({label:?})");
        assert_eq!(
            map_size_label_from_menu_label(label).key(),
            row["mapSizeFromMenu"].as_str().expect("s"),
            "{}",
            ctx("mapSizeLabelFromMenuLabel")
        );
        assert_eq!(
            default_rywale_from_map_label(label),
            row["defaultRywale"].as_i64().expect("n"),
            "{}",
            ctx("defaultRywaleFromMapLabel")
        );
        check_bundle(
            &rywale_menu_for_map_label(label),
            &row["rywaleMenu"],
            &ctx("rywaleMenuForMapLabel"),
        );
        assert_eq!(
            world_type_key(typ_swiata_from_menu_label(label)),
            row["typSwiata"].as_str().expect("s"),
            "{}",
            ctx("typSwiataFromMenuLabel")
        );
        assert_eq!(
            density_tier_from_label(label).key(),
            row["density"].as_str().expect("s"),
            "{}",
            ctx("densityTierFromLabel")
        );
        assert_eq!(
            default_miasta_panstwa_from_map_label(label),
            row["miastaDefault"].as_i64().expect("n"),
            "{}",
            ctx("defaultMiastaPanstwaFromMapLabel")
        );
        check_bundle(
            &miasta_panstwa_menu_for_map_label(label),
            &row["miastaMenu"],
            &ctx("miastaPanstwaMenuForMapLabel"),
        );
        check_triple(
            civ_types_triple_for_map_label(label, None),
            &row["civTripleDefault"],
            &ctx("civTypesTripleForMapLabel[default]"),
        );
        assert_eq!(
            aktywne_typy_from_map_label(label, None),
            row["aktywneDefault"].as_i64().expect("n"),
            "{}",
            ctx("aktywneTypyFromMapLabel[default]")
        );
        check_bundle(
            &civ_types_menu_for_map_label(label, None, None),
            &row["civMenuDefault"],
            &ctx("civTypesMenuForMapLabel[default]"),
        );
        assert_eq!(
            default_civ_types_from_map_label(label, None, None),
            row["civDefaultDefault"].as_i64().expect("n"),
            "{}",
            ctx("defaultCivTypesFromMapLabel[default]")
        );
        for (i, t) in tiers.iter().enumerate() {
            assert_eq!(
                max_rivers_for_map_and_density(label, tier(t)),
                row["maxRiversLegacy"][i].as_i64().expect("n"),
                "maxRiversForMapAndDensity({label:?},{t})"
            );
            trace_eq(
                resolve_river_trace_for_map(label, tier(t)),
                &row["riverTraceForMap"][i],
                &format!("resolveRiverTraceForMap({label:?},{t})"),
            );
        }
        trace_eq(
            river_trace_limits_for_map(label),
            &row["riverTraceLimits"],
            &ctx("riverTraceLimitsForMap"),
        );
        for (i, e) in epochs.iter().enumerate() {
            assert_eq!(
                aktywne_typy_from_map_label(label, Some(e)),
                row["aktywne"][i].as_i64().expect("n"),
                "aktywneTypyFromMapLabel({label:?},{e:?})"
            );
            check_triple(
                civ_types_triple_for_map_label(label, Some(e)),
                &row["civTriple"][i],
                &format!("civTypesTripleForMapLabel({label:?},{e:?})"),
            );
            check_bundle(
                &civ_types_menu_for_map_label(label, Some(e), None),
                &row["civMenuNoRoster"][i],
                &format!("civTypesMenuForMapLabel({label:?},{e:?})"),
            );
            assert_eq!(
                default_civ_types_from_map_label(label, Some(e), None),
                row["civDefaultNoRoster"][i].as_i64().expect("n"),
                "defaultCivTypesFromMapLabel({label:?},{e:?})"
            );
        }
    }
}

#[test]
fn civ_menus_with_rosters_match_web() {
    let web = web();
    let rosters = &web["rosters"];
    let cases = web["rosterCases"].as_array().expect("cases");
    assert!(cases.len() > 500, "za malo wektorow: {}", cases.len());
    for case in cases {
        let label = case["label"].as_str().expect("label");
        let roster = &rosters[case["roster"].as_str().expect("roster")];
        let epoch = case["epoch"].as_str();
        let ctx = format!("roster={} label={label:?} epoch={epoch:?}", case["roster"]);
        with_roster(roster, |rows| {
            if let Some(e) = epoch {
                assert_eq!(
                    max_civ_types_for_start_epoch(e, rows),
                    case["maxCiv"].as_i64().expect("maxCiv"),
                    "maxCivTypesForStartEpoch {ctx}"
                );
            }
            check_bundle(
                &civ_types_menu_for_map_label(label, epoch, Some(rows)),
                &case["menu"],
                &format!("civTypesMenuForMapLabel {ctx}"),
            );
            assert_eq!(
                default_civ_types_from_map_label(label, epoch, Some(rows)),
                case["def"].as_i64().expect("def"),
                "defaultCivTypesFromMapLabel {ctx}"
            );
        });
    }
}

#[test]
fn constants_match_web() {
    let web = web();
    assert_eq!(max_miast_panstwa(), web["maxMiast"].as_i64().expect("n"));
    assert_eq!(
        max_typy_cywilizacji_menu(),
        web["maxTypyMenu"].as_i64().expect("n")
    );
    for (key, epoch) in [
        ("kamien", StartEpochId::Kamien),
        ("braz", StartEpochId::Braz),
        ("zelazo", StartEpochId::Zelazo),
    ] {
        assert_eq!(
            epoch_civ_type_pool(epoch),
            web["epochPool"][key].as_i64().expect("pool"),
            "EPOCH_CIV_TYPE_POOL[{key}]"
        );
    }
    assert_eq!(
        default_player_civ_id(),
        web["defaultPlayerCivId"].as_str().expect("s")
    );
    assert_eq!(
        default_start_epoch_id(),
        web["defaultStartEpochId"].as_str().expect("s")
    );
    let opts: Vec<i64> = web["landFractionPercentOpts"]
        .as_array()
        .expect("opts")
        .iter()
        .map(|v| v.as_i64().expect("n"))
        .collect();
    assert_eq!(land_fraction_percent_opts().to_vec(), opts);
    assert_eq!(
        river_ref_area(),
        web["riverRefArea"].as_i64().expect("n") as f64
    );
    assert_eq!(
        resource_baseline_rarity_mult().to_bits(),
        bits(&web["baselineRarity"])
    );
    let preset = default_world_density();
    for (got, key) in [
        (preset.resources, "resources"),
        (preset.rivers, "rivers"),
        (preset.desert, "desert"),
        (preset.forest, "forest"),
        (preset.relief, "relief"),
    ] {
        assert_eq!(
            got.key(),
            web["defaultWorldDensity"][key].as_str().expect("s"),
            "DEFAULT_WORLD_DENSITY.{key}"
        );
    }
    for (i, key) in ["low", "medium", "high"].iter().enumerate() {
        assert_eq!(
            density_tier_to_label(tier(key)),
            web["densityToLabel"][i].as_str().expect("s"),
            "densityTierToLabel({key})"
        );
    }
}

fn parse_raw(raw: &str) -> Option<f64> {
    match raw {
        "NaN" => Some(f64::NAN),
        "Infinity" => Some(f64::INFINITY),
        "-Infinity" => Some(f64::NEG_INFINITY),
        _ => None,
    }
}

#[test]
fn clamp_miasta_panstwa_count_matches_web() {
    let web = web();
    let rows = web["clampMiasta"].as_array().expect("rows");
    assert!(rows.len() > 60);
    for row in rows {
        // wejscia nie-liczbowe (`js:...`) wymagaja `Number(raw)` weba: mapujemy je jawnie.
        let raw = &row["raw"];
        let value = match raw {
            Value::Number(n) => n.as_f64().expect("f64"),
            Value::String(s) => match s.as_str() {
                "js:\"5\"" => 5.0,
                "js:\"\"" | "js:null" | "js:false" => 0.0,
                "js:\"abc\"" | "js:undefined" => f64::NAN,
                "js:true" => 1.0,
                other => parse_raw(other).unwrap_or_else(|| panic!("raw {other}")),
            },
            other => panic!("raw {other}"),
        };
        let allow_zero = row["allowZero"].as_bool().unwrap_or(false);
        assert_eq!(
            clamp_miasta_panstwa_count(value, allow_zero),
            row["result"].as_i64().expect("result"),
            "clampMiastaPanstwaCount({raw}, {allow_zero})"
        );
    }
}

#[test]
fn world_generation_presets_match_web() {
    use civ_engine::domain::mapgen::params::world_generation_preset_from_labels;
    let web = web();
    let rows = web["presets"].as_array().expect("rows");
    assert!(rows.len() >= 9);
    for row in rows {
        let l = &row["labels"];
        let get = |k: &str| l[k].as_str().expect("label");
        let relief = l.get("relief").map(|v| v.as_str().expect("relief"));
        let got: WorldGenerationPreset = world_generation_preset_from_labels(
            get("resources"),
            get("rivers"),
            get("desert"),
            get("forest"),
            relief,
        );
        for (tier, key) in [
            (got.resources, "resources"),
            (got.rivers, "rivers"),
            (got.desert, "desert"),
            (got.forest, "forest"),
            (got.relief, "relief"),
        ] {
            assert_eq!(
                tier.key(),
                row["result"][key].as_str().expect("s"),
                "worldGenerationPresetFromLabels {l} .{key}"
            );
        }
    }
}

#[test]
fn tier_functions_match_web() {
    let web = web();
    for row in web["tierFns"].as_array().expect("rows") {
        let key = row["tier"].as_str().expect("tier");
        let t = tier(key);
        assert_eq!(
            density_multiplier(t).to_bits(),
            bits(&row["multiplier"]),
            "densityMultiplier({key})"
        );
        assert_eq!(
            max_rivers_from_density(t),
            row["maxRiversBase"].as_i64().expect("n"),
            "maxRiversFromDensity({key})"
        );
        assert_eq!(
            river_min_path_length_for_tier(t),
            row["minPath"].as_i64().expect("n"),
            "riverMinPathLengthForTier({key})"
        );
        assert_eq!(
            river_grid_cell_size_for_tier(t),
            row["gridCell"].as_i64().expect("n"),
            "riverGridCellSizeForTier({key})"
        );
        for (name, got, field) in [
            ("desert", desert_noise_threshold_from_tier(t), "desert"),
            ("forest", forest_noise_threshold_from_tier(t), "forest"),
            (
                "mountain",
                mountain_noise_threshold_from_tier(t),
                "mountain",
            ),
            (
                "highland",
                highland_noise_threshold_from_tier(t),
                "highland",
            ),
        ] {
            assert_eq!(got.to_bits(), bits(&row[field]), "{name}Threshold({key})");
        }
        for (catalog, want) in row["traceMinLen"]
            .as_array()
            .expect("arr")
            .iter()
            .enumerate()
        {
            assert_eq!(
                river_grid_trace_min_len(catalog as i64, t),
                want.as_i64().expect("n"),
                "riverGridTraceMinLen({catalog},{key})"
            );
        }
        if let Some(default_tier) = row["traceMinLenDefaultTier"].as_array() {
            for (catalog, want) in default_tier.iter().enumerate() {
                assert_eq!(
                    river_grid_trace_min_len(catalog as i64, DensityTier::Medium),
                    want.as_i64().expect("n"),
                    "riverGridTraceMinLen({catalog}) tier domyslny"
                );
            }
        }
        for (i, configured) in [0_i64, 5, 77].iter().enumerate() {
            assert_eq!(
                scale_max_rivers_for_land(*configured, 1234, t),
                row["scaleMaxRivers"][i].as_i64().expect("n"),
                "scaleMaxRiversForLand({configured})"
            );
        }
    }
}

#[test]
fn river_map_params_match_web_bitwise() {
    let web = web();
    let rows = web["riverParams"].as_array().expect("rows");
    assert!(rows.len() >= 90, "za malo wektorow: {}", rows.len());
    for row in rows {
        let key = row["tier"].as_str().expect("tier");
        let (w, h) = (row["w"].as_i64().expect("w"), row["h"].as_i64().expect("h"));
        let p = resolve_river_map_params(tier(key), w, h);
        let ctx = format!("resolveRiverMapParams({key},{w},{h})");
        assert_eq!(
            p.area_scale.to_bits(),
            bits(&row["areaScale"]),
            "{ctx} areaScale"
        );
        assert_eq!(
            river_map_area_scale(w, h).to_bits(),
            bits(&row["areaScaleFn"]),
            "riverMapAreaScale({w},{h})"
        );
        assert_eq!(
            p.feeder_source_sep_mult.to_bits(),
            bits(&row["feederSourceSepMult"]),
            "{ctx} feederSourceSepMult"
        );
        let ints = &row["ints"];
        for (name, got) in [
            ("minDim", p.min_dim),
            ("mainCell", p.main_cell),
            ("tributaryCell", p.tributary_cell),
            ("mainGridStride", p.main_grid_stride),
            ("minLen", p.min_len),
            ("maxLen", p.max_len),
            ("gridTraceMinLen", p.grid_trace_min_len),
            ("feederMinLen", p.feeder_min_len),
            ("hardMeanderLen", p.hard_meander_len),
            ("mouthTailLen", p.mouth_tail_len),
            ("minInlandFromSea", p.min_inland_from_sea),
            ("reliefSearchMin", p.relief_search_min),
            ("reliefSearchMax", p.relief_search_max),
            ("reliefSourceBonus", p.relief_source_bonus),
            ("feederPasses", p.feeder_passes),
            ("topUpPasses", p.top_up_passes),
            ("expandSourceRadius", p.expand_source_radius),
            ("minInlandCell", p.min_inland_cell),
        ] {
            assert_eq!(
                got,
                ints[name].as_i64().unwrap_or_else(|| panic!("brak {name}")),
                "{ctx} {name}"
            );
        }
        assert_eq!(
            ints.as_object().expect("obj").len(),
            18,
            "wektor ma inna liczbe pol calkowitych niz port"
        );
    }
}

#[test]
fn land_fraction_functions_match_web() {
    let web = web();
    for row in web["landFraction"].as_array().expect("rows") {
        let typ = world_type(row["typ"].as_str().expect("typ"));
        assert_eq!(
            default_land_fraction_percent_for_typ(typ),
            row["defaultPercent"].as_i64().expect("n"),
            "defaultLandFractionPercentForTyp({typ})"
        );
        assert_eq!(
            resolve_land_fraction(None, typ).to_bits(),
            bits(&row["noOpts"]),
            "resolveLandFraction(undefined,{typ})"
        );
        assert_eq!(
            resolve_land_fraction(Some(&WorldGenOptions::default()), typ).to_bits(),
            bits(&row["emptyOpts"]),
            "resolveLandFraction({{}},{typ})"
        );
    }
    let rows = web["landFractionOpts"].as_array().expect("rows");
    assert!(rows.len() >= 50);
    for row in rows {
        let typ = world_type(row["typ"].as_str().expect("typ"));
        let fraction = match &row["landFraction"] {
            Value::Null => None,
            Value::Number(n) => Some(n.as_f64().expect("f64")),
            Value::String(s) => Some(parse_raw(s).unwrap_or_else(|| panic!("raw {s}"))),
            other => panic!("landFraction {other}"),
        };
        let opts = WorldGenOptions {
            land_fraction: fraction,
            ..WorldGenOptions::default()
        };
        assert_eq!(
            resolve_land_fraction(Some(&opts), typ).to_bits(),
            bits(&row["result"]),
            "resolveLandFraction({{landFraction:{fraction:?}}},{typ})"
        );
    }
}

fn opts_from_web(v: &Value) -> Option<WorldGenOptions> {
    if v.is_null() {
        return None;
    }
    let world_density = v.get("worldDensity").map(|d| WorldGenerationPreset {
        resources: tier(d["resources"].as_str().expect("s")),
        rivers: tier(d["rivers"].as_str().expect("s")),
        desert: tier(d["desert"].as_str().expect("s")),
        forest: tier(d["forest"].as_str().expect("s")),
        relief: tier(d["relief"].as_str().expect("s")),
    });
    Some(WorldGenOptions {
        world_density,
        map_size_menu_label: v
            .get("mapSizeMenuLabel")
            .map(|s| s.as_str().expect("s").to_owned()),
        land_fraction: v.get("landFraction").map(|f| f.as_f64().expect("f64")),
        difficulty: v.get("difficulty").map(|d| match d.as_str().expect("s") {
            "easy" => Difficulty::Easy,
            "normal" => Difficulty::Normal,
            "hard" => Difficulty::Hard,
            other => panic!("difficulty {other}"),
        }),
        civ_types_count: v.get("civTypesCount").map(|n| n.as_i64().expect("n")),
        city_states_count: v.get("cityStatesCount").map(|n| n.as_i64().expect("n")),
        village_rewards_enabled: v
            .get("villageRewardsEnabled")
            .map(|b| b.as_bool().expect("b")),
    })
}

#[test]
fn resolve_world_gen_numbers_matches_web() {
    let web = web();
    let rows = web["worldGenNumbers"].as_array().expect("rows");
    assert!(rows.len() >= 10);
    for row in rows {
        let opts = opts_from_web(&row["opts"]);
        let got = resolve_world_gen_numbers(opts.as_ref());
        let ctx = format!("resolveWorldGenNumbers({})", row["opts"]);
        assert_eq!(
            got.resource_mult.to_bits(),
            bits(&row["resourceMult"]),
            "{ctx} resourceMult"
        );
        assert_eq!(
            got.resource_baseline.to_bits(),
            bits(&row["resourceBaseline"]),
            "{ctx} resourceBaseline"
        );
        assert_eq!(
            got.max_rivers,
            row["maxRivers"].as_i64().expect("n"),
            "{ctx} maxRivers"
        );
        assert_eq!(
            got.desert_threshold.to_bits(),
            bits(&row["desertThreshold"]),
            "{ctx} desert"
        );
        assert_eq!(
            got.forest_threshold.to_bits(),
            bits(&row["forestThreshold"]),
            "{ctx} forest"
        );
        assert_eq!(
            got.mountain_threshold.to_bits(),
            bits(&row["mountainThreshold"]),
            "{ctx} mountain"
        );
        assert_eq!(
            got.highland_threshold.to_bits(),
            bits(&row["highlandThreshold"]),
            "{ctx} highland"
        );
        trace_eq(
            got.river_trace,
            &row["riverTrace"],
            &format!("{ctx} riverTrace"),
        );
    }
}

#[test]
fn density_to_label_round_trips_where_web_does() {
    // `densityTierFromLabel(densityTierToLabel(t))`: web gubi `Dużo` (normQualityLabel bez ż->z).
    let web = web();
    let rows = web["perLabel"].as_array().expect("rows");
    let dense = rows
        .iter()
        .find(|r| r["label"] == "Dużo")
        .expect("wektor Dużo");
    assert_eq!(
        density_tier_from_label("Dużo").key(),
        dense["density"].as_str().expect("s")
    );
    let low = density_tier_to_label(DensityTier::Low);
    assert_eq!(density_tier_from_label(low), DensityTier::Low);
}
