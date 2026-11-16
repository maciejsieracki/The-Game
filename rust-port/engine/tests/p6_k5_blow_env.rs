//! P6-K5-BLOW-ENV-WEKTORY-Q1: wektory pinu `07d2fbd72` dla mnoznika rzeki atakujacego (`terrainRiverAttackMultiplier`)
//! i flag, z ktorych sklada go `blow_env_for`.
//!
//! Zrodla wektorow (wszystkie w `p6_k5_blow_env_vectors/blow_env.json`, generator `gen.mjs` wycina fragmenty pinu):
//! * `gra/src/game/combat.ts:677-687` = `terrainRiverAttackMultiplier` (mnoznik i warunek `isRiver`, :680 / :683),
//! * `gra/src/battle/battleScene.ts:8861` = `atkTerrain = combatTerrainName(attacker)` (kafel atakujacego),
//! * `gra/data/combat-params.json` `river_attack_mult` (0.75), `gra/data/terrain-combat.json` (wiersze terenu).
//!
//! Porownywane: kopia B [`terrain_river_attack_multiplier`] (`siege_tactics_blow_inputs.rs:21`), wynik
//! [`blow_env_for`] (`siege_tactics_blow_env.rs`) oraz mnoznik po nazwie [`attacker_river_mult_by_name`].
//! Kazda wartosc 1:1 z wektorem pinu; mutacja `atk_tile_is_river` -> `def_tile_is_river` MUSI dac FAIL.

use civ_engine::domain::siege_tactics_blow_env::{
    attacker_river_mult_by_name, blow_env_for, BlowPlacement, BlowSceneCtx, TerrainRow, TileMap,
};
use civ_engine::domain::siege_tactics_blow_inputs::terrain_river_attack_multiplier;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5_blow_env_vectors/blow_env.json");

/// Kod `BTerrain` dla nazwy kombatowej (odwrotnosc `combat_name_for`, siege_tactics_blow_env.rs).
fn code_for(name: &str) -> u8 {
    match name {
        "Plaskie (rownina/laka)" => 0,
        "Las" => 1,
        "Wzgorza" => 2,
        "Rzeka" => 3,
        other => panic!("nieobslugiwana nazwa kafla w wektorze: {other}"),
    }
}

fn load() -> Value {
    let v: Value = serde_json::from_str(VECTORS).expect("blow_env.json");
    assert_eq!(
        v["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75"),
        "pin"
    );
    v
}

#[test]
fn blow_env_river_vectors_match_pin() {
    let v = load();
    let river_mult_pin = v["riverAttackMult"].as_f64().expect("riverAttackMult");
    assert_eq!(river_mult_pin, 0.75, "combat-params.json river_attack_mult");
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 8, "wektory: {} < 8", cases.len());

    for c in cases {
        let name = c["name"].as_str().unwrap();
        let atk = c["atkTerrain"].as_str().unwrap();
        let def = c["defTerrain"].as_str().unwrap();
        let exp_mult = c["expMult"].as_f64().unwrap();
        let exp_atk_river = c["expAtkIsRiver"].as_bool().unwrap();
        let exp_row = c["expRowExists"].as_bool().unwrap();
        let rows: Vec<TerrainRow> = c["terrainData"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| TerrainRow {
                teren: r["Teren"].as_str().unwrap().to_string(),
                bonus_obrona: r["Bonus Obrona"].as_str().map(str::to_string),
            })
            .collect();

        // Atakujacy (0,0) na kodzie `atk`, obronca (1,0) na kodzie `def`, rzeka = kod 3 (nie brod = 4).
        let map =
            TileMap::new(3, 1, vec![code_for(atk), code_for(def), 0], false).expect("mapa 3x1");
        let ctx = BlowSceneCtx {
            map,
            terrain_data: rows,
            is_city_defense_battle: false,
            wall_defense_total_proc: 0.0,
            siege_wall_col: -1.0,
            city_terrain: "Wzgorza".to_string(),
            river_attack_mult: river_mult_pin,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        };
        let p = BlowPlacement {
            attacker: (0, 0),
            defender: (1, 0),
            defender_facing: 0,
            defender_on_wall: false,
            defender_side_def: true,
            atk_rola: "Piechota".to_string(),
        };

        // combat.ts:620-624 / :677-687 (nazwa kafla = battleScene.ts:8861 combatTerrainName(attacker)).
        assert_eq!(ctx.map.name(0, 0), atk, "{name}: nazwa kafla atakujacego");
        let env = blow_env_for(&ctx, &p);
        // combat.ts:680 isRiver i :683 wiersz rzeki (flagi wejsciowe kopii B).
        assert_eq!(
            env.atk_tile_is_river, exp_atk_river,
            "{name}: atk_tile_is_river"
        );
        assert_eq!(env.river_row_exists, exp_row, "{name}: river_row_exists");
        assert_eq!(
            env.river_attack_mult, river_mult_pin,
            "{name}: river_attack_mult"
        );
        // combat.ts:684-687 zwraca river_attack_mult albo 1.0 (kopia B: siege_tactics_blow_inputs.rs:21).
        assert_eq!(
            terrain_river_attack_multiplier(
                env.atk_tile_is_river,
                env.river_row_exists,
                env.river_attack_mult
            ),
            exp_mult,
            "{name}: kopia B (atk={atk}, def={def})"
        );
        // Mnoznik po nazwie (ta sama funkcja pinu przez nazwy kafli).
        assert_eq!(
            attacker_river_mult_by_name(&ctx, &p),
            exp_mult,
            "{name}: po nazwie"
        );
    }
}

#[test]
fn blow_env_river_vectors_cover_required_cases() {
    // Wymagane przez dispatch: atakujacy na rzece, obronca na rzece, obaj, brak rzeki, teren nazwany vs flaga.
    let v = load();
    let cases = v["cases"].as_array().expect("cases");
    let has = |atk: &str, def: &str, set: &str| {
        cases
            .iter()
            .any(|c| c["atkTerrain"] == atk && c["defTerrain"] == def && c["rowSet"] == set)
    };
    assert!(
        has("Rzeka", "Plaskie (rownina/laka)", "pelne"),
        "atakujacy na rzece"
    );
    assert!(
        has("Plaskie (rownina/laka)", "Rzeka", "pelne"),
        "obronca na rzece"
    );
    assert!(has("Rzeka", "Rzeka", "pelne"), "obaj na rzece");
    assert!(has("Las", "Wzgorza", "pelne"), "brak rzeki");
    assert!(
        has("Rzeka", "Plaskie (rownina/laka)", "bez-wiersza-rzeki"),
        "flaga bez wiersza"
    );
    let mut n_mult = 0;
    for c in cases {
        if c["expMult"].as_f64() == Some(0.75) {
            n_mult += 1;
        }
    }
    assert!(n_mult >= 2, "przypadki z mnoznikiem 0.75: {n_mult} < 2");
}
