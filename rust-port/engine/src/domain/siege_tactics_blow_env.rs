//! P6 SIEGE-TAKTYKA K5I2b2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1): adapter pozycja + mapa + mur -> [`BlowEnv`].
//!
//! Zakres: skladanie `BlowEnv` (wejscie [`single_blow_full`]) z surowego stanu sceny, ktory w pinie `07d2fbd72`
//! czyta cialo `_singleBlow` (battleScene.ts:8812-9010):
//! * [`blow_hit_arc`] = `relativeHit(defender.facing, attacker.q, attacker.r, defender.q, defender.r)` (battleScene.ts:385-400);
//! * [`blow_env_for`] = `isFordTile` / `isShoreAdjacentToFord` (battleScene.ts:1897-1914) na [`TileMap`],
//!   `combatTerrainName` (mapa nazw), `terrainDefenseMultiplier` / `cityGatedTerrainMultiplier` (combat.ts:639-671,
//!   city-defense.ts:180-190) na wierszach terenu, `_wallBonusProcFor` (battleScene.ts:7459-7464) przez
//!   [`wall_bonus_proc_for`] oraz `terrainRiverAttackMultiplier` (combat.ts:677-687) w postaci dwoch flag
//!   (`atk_tile_is_river`, `river_row_exists`) czytanych przez [`crate::domain::siege_tactics_blow_inputs::terrain_river_attack_multiplier`].
//!
//! Poza zakresem (podawane przez wywolujacego jak dotad w [`crate::domain::siege_tactics_blow_full::FullBlowInput`]):
//! `atk_mods`, `def_mods`, mnozniki poziomu trudnosci, `civWallDefenseMultiplier`, `counterMultiplier`,
//! `bracesAgainstCharge`, stan sceny (`engaged`) i jednostki (`CombatUnit`).
//!
//! Stan muru (`WallState`) jest podawany jawnie jako `wall_defense_total_proc` (bonus % z `cityWallDefenseBonusPercent`)
//! oraz `siege_wall_col` (kolumna muru, `this.siegeWallCol`, `-1` = brak muru oblezniczego).

use crate::domain::siege_tactics_blow::HitArc;
use crate::domain::siege_tactics_blow_full::BlowEnv;
use crate::domain::siege_tactics_inputs_pos::{
    is_ford_tile, is_shore_adjacent_to_ford, relative_hit, JsVal,
};
use crate::domain::siege_tactics_inputs_terrain::{
    city_gated_terrain_multiplier, norm_terrain, terrain_defense_multiplier,
    terrain_river_attack_multiplier as terrain_river_by_name, TerrainEntry,
};
use crate::domain::siege_tactics_inputs_wall::{has_mur, wall_bonus_proc_for};

/// Teren, ktory `_singleBlow` podstawia za obroncę na chodniku muru (battleScene.ts:8831-8833).
pub const WALKWAY_TERRAIN: &str = "Plaskie (rownina/laka)";

/// Mapa kafli bitwy: kod `BTerrain` (0..7) i nazwa kombatowa (`combatTerrainName`) per kafel.
/// Indeks kafla = `r * cols + q`. Poza siatka: kod `Plains` (0) i nazwa pusta (jak `BattleTerrainMap.at`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TileMap {
    cols: i32,
    rows: i32,
    codes: Vec<u8>,
    names: Vec<String>,
}

impl TileMap {
    /// Buduje mape; blad gdy dlugosci wektorow nie zgadzaja sie z `cols * rows`.
    pub fn new(cols: i32, rows: i32, codes: Vec<u8>, names: Vec<String>) -> Result<Self, String> {
        if cols <= 0 || rows <= 0 {
            return Err(format!("mapa: wymiary {cols}x{rows}"));
        }
        let n = usize::try_from(cols * rows).map_err(|e| e.to_string())?;
        if codes.len() != n || names.len() != n {
            return Err(format!(
                "mapa: {} kodow / {} nazw, oczekiwano {n}",
                codes.len(),
                names.len()
            ));
        }
        Ok(Self {
            cols,
            rows,
            codes,
            names,
        })
    }

    fn idx(&self, q: i32, r: i32) -> Option<usize> {
        if q < 0 || r < 0 || q >= self.cols || r >= self.rows {
            None
        } else {
            usize::try_from(r * self.cols + q).ok()
        }
    }

    /// `BattleTerrainMap.at(col,row)` jako kod `BTerrain`; poza siatka = 0 (Plains).
    pub fn at(&self, q: i32, r: i32) -> u8 {
        self.idx(q, r).map_or(0, |i| self.codes[i])
    }

    /// `terrainMap.combatTerrainName(col,row)`; poza siatka = pusty napis.
    pub fn name(&self, q: i32, r: i32) -> &str {
        self.idx(q, r).map_or("", |i| self.names[i].as_str())
    }
}

/// Wiersz danych terenu bitwy (`terrain-combat.json`): tylko pola czytane przez porty (`Teren`, `Bonus Obrona`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TerrainRow {
    pub teren: String,
    pub bonus_obrona: Option<String>,
}

/// Stan sceny potrzebny do zlozenia [`BlowEnv`] (pola `this` z `_singleBlow`).
#[derive(Debug, Clone, PartialEq)]
pub struct BlowSceneCtx {
    /// `this.terrainMap`.
    pub map: TileMap,
    /// `this.terrainData`.
    pub terrain_data: Vec<TerrainRow>,
    /// `this.isCityDefenseBattle`.
    pub is_city_defense_battle: bool,
    /// `this.wallDefenseTotalProc` (`> 0` = `hasMur`).
    pub wall_defense_total_proc: f64,
    /// `this.siegeWallCol`.
    pub siege_wall_col: f64,
    /// `this.terrain` (teren miasta; uzywany jako wzniesienie gdy obronca stoi na chodniku).
    pub city_terrain: String,
    /// `combat-params.json` `river_attack_mult` (0.75 w pinie).
    pub river_attack_mult: f64,
    /// `BROD_KARA_OBRONA` (`brod.karaObrona`).
    pub brod_kara_obrona: f64,
    /// `BROD_BONUS_BRZEG` (`brod.bonusObronaBrzegu`).
    pub brod_bonus_brzegu: f64,
    /// `FORTIFY_OBRONA_PROC_FIELD` (`oblezenie.fortify_obrona_proc`).
    pub fortify_obrona_proc: f64,
}

/// Ulozenie jednego ciosu na mapie.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BlowPlacement {
    /// `attacker.q`, `attacker.r`.
    pub attacker: (i32, i32),
    /// `defender.q`, `defender.r`.
    pub defender: (i32, i32),
    /// `defender.facing` (Dir 0..3).
    pub defender_facing: i32,
    /// `defender.onWallWalkway`.
    pub defender_on_wall: bool,
    /// `cuA.rola` (argument `terrainDefenseMultiplier`).
    pub atk_rola: String,
}

fn entries(rows: &[TerrainRow]) -> Vec<TerrainEntry<'_>> {
    rows.iter()
        .map(|r| TerrainEntry {
            teren: r.teren.as_str(),
            bonus_obrona: r.bonus_obrona.as_deref(),
        })
        .collect()
}

/// `relativeHit(defender.facing, attacker.q, attacker.r, defender.q, defender.r)` (battleScene.ts:8880).
pub fn blow_hit_arc(p: &BlowPlacement) -> HitArc {
    let (aq, ar) = p.attacker;
    let (dq, dr) = p.defender;
    relative_hit(
        &JsVal::Num(f64::from(p.defender_facing)),
        &JsVal::Num(f64::from(aq)),
        &JsVal::Num(f64::from(ar)),
        &JsVal::Num(f64::from(dq)),
        &JsVal::Num(f64::from(dr)),
    )
}

/// `_wallBonusProcFor(defender)` (battleScene.ts:7459-7464): bonus obwarowania obrońcy (%).
pub fn blow_wall_bonus_proc(ctx: &BlowSceneCtx, p: &BlowPlacement) -> f64 {
    let (dq, _) = p.defender;
    wall_bonus_proc_for(
        true,
        p.defender_on_wall,
        f64::from(dq),
        ctx.siege_wall_col,
        ctx.wall_defense_total_proc,
    )
}

/// Mnoznik rzeki atakujacego liczony po NAZWIE kafla (`terrainRiverAttackMultiplier(atkTerrain, terrainData)`,
/// combat.ts:677-687). Sluzy do porownan; w [`blow_env_for`] ta sama wartosc powstaje z flag logicznych.
pub fn attacker_river_mult_by_name(ctx: &BlowSceneCtx, p: &BlowPlacement) -> f64 {
    let rows = entries(&ctx.terrain_data);
    let (aq, ar) = p.attacker;
    terrain_river_by_name(ctx.map.name(aq, ar), &rows, ctx.river_attack_mult)
}

/// Zlozenie [`BlowEnv`] dla jednego ciosu z pinu (`_singleBlow`, battleScene.ts:8831-8880).
pub fn blow_env_for(ctx: &BlowSceneCtx, p: &BlowPlacement) -> BlowEnv {
    let (aq, ar) = p.attacker;
    let (dq, dr) = p.defender;
    let rows = entries(&ctx.terrain_data);

    // defTerrain / atkTerrain / cityElevationTerrain (battleScene.ts:8831-8849).
    let def_terrain: &str = if p.defender_on_wall {
        WALKWAY_TERRAIN
    } else {
        ctx.map.name(dq, dr)
    };
    let atk_terrain = ctx.map.name(aq, ar);
    let city_elevation: &str = if p.defender_on_wall {
        ctx.city_terrain.as_str()
    } else {
        def_terrain
    };

    let has_wall = has_mur(ctx.wall_defense_total_proc);
    let gated = city_gated_terrain_multiplier(has_wall, city_elevation, &rows);
    let field_tdm = terrain_defense_multiplier(def_terrain, &p.atk_rola, &rows);

    // Rzeka atakujacego: flagi logiczne zgodne z terrainRiverAttackMultiplier (combat.ts:677-687).
    let n_atk = norm_terrain(atk_terrain);
    let atk_tile_is_river = n_atk.contains("rzek") || n_atk.contains("river");
    let river_row_exists = rows.iter().any(|r| norm_terrain(r.teren).contains("rzek"));

    let at = |c: i32, r: i32| ctx.map.at(c, r);
    BlowEnv {
        is_city_defense_battle: ctx.is_city_defense_battle,
        wall_bonus_proc: blow_wall_bonus_proc(ctx, p),
        gated_terrain_multiplier: gated,
        field_terrain_multiplier: field_tdm,
        atk_tile_is_river,
        river_row_exists,
        river_attack_mult: ctx.river_attack_mult,
        atk_on_ford: is_ford_tile(&at, aq, ar),
        def_on_ford_raw: is_ford_tile(&at, dq, dr),
        shore_adjacent: is_shore_adjacent_to_ford(&at, dq, dr),
        brod_kara_obrona: ctx.brod_kara_obrona,
        brod_bonus_brzegu: ctx.brod_bonus_brzegu,
        fortify_obrona_proc: ctx.fortify_obrona_proc,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::siege_tactics_blow_inputs::terrain_river_attack_multiplier as river_logical;

    fn row(teren: &str, bonus: Option<&str>) -> TerrainRow {
        TerrainRow {
            teren: teren.to_string(),
            bonus_obrona: bonus.map(str::to_string),
        }
    }

    fn ctx_with(codes: Vec<u8>, names: Vec<&str>) -> BlowSceneCtx {
        BlowSceneCtx {
            map: TileMap::new(2, 2, codes, names.into_iter().map(str::to_string).collect())
                .expect("mapa 2x2"),
            terrain_data: vec![
                row("Płaskie (równina/łąka)", Some("+0%")),
                row("Las", Some("+50%")),
                row("Wzgórza", Some("+50%")),
                row("Rzeka", Some("+0%")),
            ],
            is_city_defense_battle: false,
            wall_defense_total_proc: 0.0,
            siege_wall_col: -1.0,
            city_terrain: "Wzgórza".to_string(),
            river_attack_mult: 0.75,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        }
    }

    fn place(a: (i32, i32), d: (i32, i32), facing: i32, on_wall: bool) -> BlowPlacement {
        BlowPlacement {
            attacker: a,
            defender: d,
            defender_facing: facing,
            defender_on_wall: on_wall,
            atk_rola: "Piechota".to_string(),
        }
    }

    #[test]
    fn mapa_poza_siatka_to_plains_i_pusta_nazwa() {
        let m = TileMap::new(
            2,
            2,
            vec![0, 4, 3, 1],
            vec!["a".into(), "b".into(), "c".into(), "d".into()],
        )
        .expect("mapa");
        assert_eq!(m.at(-1, 0), 0);
        assert_eq!(m.at(2, 1), 0);
        assert_eq!(m.name(0, 2), "");
        assert_eq!(m.at(1, 0), 4);
        assert_eq!(m.name(1, 1), "d");
        assert!(TileMap::new(2, 2, vec![0], vec![]).is_err());
    }

    #[test]
    fn kierunek_trafienia_z_relative_hit() {
        // Obronca patrzy na E (1); atak z zachodu daje incoming=W=3=oppositeDir(E): trafienie z tylu.
        assert_eq!(blow_hit_arc(&place((0, 1), (1, 1), 1, false)), HitArc::Rear);
        assert_eq!(
            blow_hit_arc(&place((2, 1), (1, 1), 1, false)),
            HitArc::Front
        );
        assert_eq!(
            blow_hit_arc(&place((1, 0), (1, 1), 1, false)),
            HitArc::Flank
        );
    }

    #[test]
    fn brod_i_brzeg_z_mapy() {
        // 2x2: (0,0)=Ford, (1,0)=Plains (brzeg obok brodu), (0,1)=Plains, (1,1)=River.
        let ctx = ctx_with(
            vec![4, 0, 0, 3],
            vec![
                "Rzeka",
                "Płaskie (równina/łąka)",
                "Płaskie (równina/łąka)",
                "Rzeka",
            ],
        );
        let env = blow_env_for(&ctx, &place((0, 1), (1, 0), 0, false));
        assert!(!env.atk_on_ford, "atakujacy na (0,1) nie jest brodem");
        assert!(!env.def_on_ford_raw);
        assert!(env.shore_adjacent, "(1,0) styka sie z brodem (0,0)");
        let env2 = blow_env_for(&ctx, &place((0, 0), (1, 0), 0, false));
        assert!(env2.atk_on_ford, "atakujacy na brodzie");
    }

    #[test]
    fn rzeka_flagi_daja_ten_sam_mnoznik_co_po_nazwie() {
        let ctx = ctx_with(vec![0, 0, 0, 0], vec!["Rzeka", "Las", "Rzeka", "Wzgórza"]);
        for (a, d) in [((0, 0), (1, 0)), ((1, 0), (0, 0)), ((0, 1), (1, 1))] {
            let p = place(a, d, 0, false);
            let env = blow_env_for(&ctx, &p);
            let logical = river_logical(
                env.atk_tile_is_river,
                env.river_row_exists,
                env.river_attack_mult,
            );
            assert_eq!(logical, attacker_river_mult_by_name(&ctx, &p));
        }
        // Bez wiersza rzeki w danych: mnoznik 1.0 nawet dla kafla-rzeki.
        let mut ctx2 = ctx.clone();
        ctx2.terrain_data.retain(|r| r.teren != "Rzeka");
        let p = place((0, 0), (1, 0), 0, false);
        let env = blow_env_for(&ctx2, &p);
        assert_eq!(
            river_logical(
                env.atk_tile_is_river,
                env.river_row_exists,
                env.river_attack_mult
            ),
            1.0
        );
        assert_eq!(attacker_river_mult_by_name(&ctx2, &p), 1.0);
    }

    #[test]
    fn chodnik_muru_podstawia_plaskie_i_wzgorze_miasta() {
        let mut ctx = ctx_with(vec![0, 0, 0, 0], vec!["Las", "Las", "Las", "Las"]);
        ctx.is_city_defense_battle = true;
        ctx.wall_defense_total_proc = 200.0;
        ctx.siege_wall_col = 0.0;
        // Chodnik: obronca NA murze -> teren bazowy Plaskie (tdm 1.0), gated liczony z wzgorza miasta (Wzgorza +50%).
        let p = place((0, 0), (1, 0), 0, true);
        let env = blow_env_for(&ctx, &p);
        assert_eq!(env.field_terrain_multiplier, 1.0);
        assert_eq!(env.gated_terrain_multiplier, 1.5);
        assert_eq!(env.wall_bonus_proc, 200.0);
    }
}
