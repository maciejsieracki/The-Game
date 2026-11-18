//! P6 BATTLE-SETUP T5b (dispatch R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1, runda 1, Operator): zgodnosc rozstawienia
//! jednostek w silniku (`battle_setup_units*`) z WYKONANIEM tekstu pinu `07d2fbd72` (`_placeUnits`,
//! `_placeSiegeDefenders`, `_repositionSiegeAttackers`, `formationRules.ts`).
//!
//! Wektory: `p6_battle_setup_units_vectors/vectors.json` z `p6_battle_setup_units_gen.mjs` (straznik SHA-256 plikow i
//! wycinkow pinu). Porownanie bajt w bajt: kolejnosc `this.atk` / `this.def`, `q`, `r`, `facing`, `formationRank`,
//! `onWallWalkway` kazdej jednostki oraz koncowe `occByKey` (kolejnosc wstawienia `Map` i wartosci). Pola bitwy z
//! `spec` sa dodatkowo odtwarzane przez `setup_battle_field` (T5a) - kafle i mur musza byc identyczne z pinem.
//!
//! Fikstura renderera (`renderer_parity.json`): tylko stala `MAX_PER_SIDE` z `renderer/src/battle/field.rs` (renderer:
//! 120, pin: 500). Silnik porownuje sie z pinem; rozbieznosc renderera = dlug DTO-BRIDGE (raport runu).

use std::sync::mpsc;
use std::time::Duration;

use civ_engine::domain::battle_setup::{
    setup_battle_field, BattleFieldInput, SiegeFieldInput, BF_COLS, BF_ROWS, PLAY_MID_ROW,
    PLAY_ROW0, PLAY_ROW1,
};
use civ_engine::domain::battle_setup_terrain::{bterrain, BattleTerrainMap, WorldTerrainInput};
use civ_engine::domain::battle_setup_units::{
    place_siege_defenders, place_units, place_units_on_field, reposition_siege_attackers, OccEntry,
    Occupancy, PlaceUnitsInput, PlacedUnit, SetupUnit, Side, SiegeWallRows, BATTLE_MAX_PER_SIDE,
    DEPLOY_ATK_FRONT_COL, DEPLOY_DEF_FRONT_COL,
};
use civ_engine::domain::battle_setup_units_formation::{initial_formation, InitialRole};
use civ_engine::domain::siege_tactics_classify::norm_name;
use civ_engine::domain::siege_tactics_inputs_pos::Dir;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_battle_setup_units_vectors/vectors.json");
const RPARITY: &str = include_str!("p6_battle_setup_units_vectors/renderer_parity.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// `FILE_SHA[FORMATION]` / `FRAG_SHA` z `p6_battle_setup_units_gen.mjs`.
const FORMATION_SHA: &str = "800ffb600b4443210def79662f0b7f53b9959e602a130ce4687c77d9ea9fc48c";
const FRAG_SHA: &str = "5c9ce1504295cf84c1c4c584302913d7777a2b079d61345d0552cb6d0afe5c66";
/// Progi licznikow rundy 2 (minimalne wartosci; zmierzone wartosci w raporcie `02a-obrona.md`).
const PROG_PASMO_GRANICA: usize = 10;
const PROG_DOLNE_SKRZYDLO: usize = 8;
const PROG_DOWODCY_NAJSZERSI: usize = 5;
const PROG_ROLA_Z_KATEGORII: usize = 20;
/// Straznik czasu petli wektorow (dispatch: 90 s).
const TIME_GUARD_SECS: u64 = 90;

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn with_timeout<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(f());
    });
    rx.recv_timeout(Duration::from_secs(TIME_GUARD_SECS))
        .expect("rozstawienie przekroczylo limit czasu 90 s (zawieszenie)")
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

fn num(v: &Value) -> f64 {
    match v.as_str() {
        Some("NaN") => f64::NAN,
        Some("Infinity") => f64::INFINITY,
        Some(s) => panic!("nieznana liczba {s}"),
        None => v.as_f64().expect("liczba"),
    }
}

fn opt_str(v: &Value) -> Option<String> {
    v.as_str().map(str::to_owned)
}

fn role_of(s: &str) -> InitialRole {
    match s {
        "commander" => InitialRole::Commander,
        "mounted" => InitialRole::Mounted,
        "melee" => InitialRole::Melee,
        "javelin" => InitialRole::Javelin,
        "archer" => InitialRole::Archer,
        "slinger" => InitialRole::Slinger,
        "ranged" => InitialRole::Ranged,
        "siege" => InitialRole::Siege,
        other => panic!("rola {other}"),
    }
}

fn side_of(s: &str) -> Side {
    match s {
        "atk" => Side::Atk,
        "def" => Side::Def,
        other => panic!("strona {other}"),
    }
}

fn dir_of(n: i64) -> Dir {
    match n {
        0 => Dir::N,
        1 => Dir::E,
        2 => Dir::S,
        3 => Dir::W,
        other => panic!("Dir {other}"),
    }
}

/// Jednostka z wektora + kontrola klasyfikatorow pinu (isMounted, isPrimaryRanged, isSiegeUnit, initialBattleRoleOf).
fn unit(v: &Value, ctx: &str) -> SetupUnit {
    let a = v.as_array().expect("jednostka");
    let u = SetupUnit {
        kategoria: opt_str(&a[0]),
        typ: opt_str(&a[1]),
        jednostka: opt_str(&a[2]),
        nazwa: opt_str(&a[3]),
        is_army_commander: a[4].as_bool().expect("commander"),
        ranged: a[5].as_bool().expect("ranged"),
    };
    assert_eq!(
        u.is_mounted(),
        a[6].as_bool().unwrap(),
        "{ctx}: isMounted {u:?}"
    );
    assert_eq!(
        u.is_primary_ranged(),
        a[7].as_bool().unwrap(),
        "{ctx}: isPrimaryRanged {u:?}"
    );
    assert_eq!(
        u.is_siege_unit(),
        a[8].as_bool().unwrap(),
        "{ctx}: isSiegeUnit {u:?}"
    );
    assert_eq!(
        u.initial_role(),
        role_of(a[9].as_str().unwrap()),
        "{ctx}: initialBattleRoleOf {u:?}"
    );
    u
}

fn placed(v: &Value, side: Side) -> PlacedUnit {
    let a = v.as_array().expect("ru");
    PlacedUnit {
        side,
        index: usize::try_from(a[0].as_u64().expect("indeks")).unwrap(),
        col: a[1].as_i64().expect("q"),
        row: a[2].as_i64().expect("r"),
        facing: dir_of(a[3].as_i64().expect("facing")),
        formation_rank: a[4].as_i64(),
        on_wall_walkway: a[5].as_bool().expect("onWallWalkway"),
    }
}

struct Field {
    map: BattleTerrainMap,
    wall: Option<SiegeWallRows>,
}

fn world(v: &Value) -> Option<WorldTerrainInput> {
    if v.is_null() {
        return None;
    }
    Some(WorldTerrainInput {
        baza: v["baza"].as_str().expect("baza").to_owned(),
        las: v["las"].as_bool().unwrap_or(false),
        rzeka: v["rzeka"].as_bool().unwrap_or(false),
    })
}

fn spec_input(s: &Value) -> BattleFieldInput {
    BattleFieldInput {
        teren: s["teren"].as_str().expect("teren").to_owned(),
        world_terrain: world(&s["worldTerrain"]),
        attacker_count: num(&s["attackers"]),
        defender_count: num(&s["defenders"]),
        siege: if s["siege"].is_null() {
            None
        } else {
            Some(SiegeFieldInput {
                built_building_ids: s["siege"]["builtBuildingIds"]
                    .as_array()
                    .expect("ids")
                    .iter()
                    .map(|x| x.as_str().expect("id").to_owned())
                    .collect(),
                tower_spacing: None,
            })
        },
    }
}

fn wall_of(v: &Value) -> Option<SiegeWallRows> {
    if v.is_null() {
        return None;
    }
    Some(SiegeWallRows {
        wall_col: v["wallCol"].as_i64().unwrap(),
        row_lo: v["rowLo"].as_i64().unwrap(),
        row_hi: v["rowHi"].as_i64().unwrap(),
        gate_row: v["gateRow"].as_i64().unwrap(),
    })
}

fn load_field(f: &Value) -> Field {
    #[allow(clippy::cast_possible_truncation)]
    let map = BattleTerrainMap::from_tiles(
        BF_COLS as i32,
        BF_ROWS as i32,
        rle_decode(f["tiles"].as_str().expect("tiles")),
        false,
    )
    .expect("mapa");
    Field {
        map,
        wall: wall_of(&f["wall"]),
    }
}

/// Liczniki pokrycia (dokladne nazwy; progi w `pokrycie_galezi_rozstawienia`).
#[derive(Debug, Default)]
struct Coverage {
    przypadki_oblezenie: usize,
    przypadki_polowe: usize,
    przypadki_rozstawienie_gracza: usize,
    przypadki_ponad_limit: usize,
    przypadki_pusta_strona: usize,
    przypadki_siegemode_bez_muru: usize,
    przypadki_linie_2_3: usize,
    korona_wrecz: usize,
    korona_strzelec: usize,
    korona_katapulta: usize,
    korona_wspolny_rzad: usize,
    reszta_bezposrednio: usize,
    reszta_szukanie_rzedu: usize,
    reszta_szukanie_kolumny: usize,
    reszta_bez_miejsca: usize,
    jazda_skrzydlo: usize,
    jazda_skrzydlo_poza_slotem: usize,
    piechota_poza_slotem: usize,
    pod_jednostka_las: usize,
    pod_jednostka_brod: usize,
    pod_jednostka_wzgorza_skaly: usize,
    nadpisanie_occ: usize,
    dowodca: usize,
    // --- runda 2 (zarzuty Evaluatora r1)
    /// E16: pasmo (strona rozstawiana przez `place`) z `per` rozna dla 108 i 109 wierszy gry.
    pasmo_granica_wierszy_gry: usize,
    /// E12: jazda dolnego skrzydla strony bez korpusu, stojaca poza slotem (pole z przeszkoda vs rowna Plains).
    jazda_dolne_skrzydlo_bez_korpusu_poza_slotem: usize,
    /// E32: strona z jazda, w ktorej pasmo dowodcow ma najwieksze `per` (scisle).
    pasmo_dowodcow_najszersze_z_jazda: usize,
    /// E27: rola javelin/archer/slinger pochodzi tylko z dopasowania kategorii (kategoria != dokladnej, nazwa bez slowa).
    rola_z_kategorii_oszczepnik: usize,
    rola_z_kategorii_lucznik: usize,
    rola_z_kategorii_procarz: usize,
}

/// Wiersze gry, przy ktorych liczona jest granica pasma: pin `PLAY_ROW1 - PLAY_ROW0 - 1` i wartosc o jeden wieksza.
const PLAYABLE_ROWS_PIN: i64 = PLAY_ROW1 - PLAY_ROW0 - 1;

/// `per` pasma n jednostek (`linesForBand`) przy `rows` wierszach gry - wzor z `formationRules.ts:64-70` (liczony
/// niezaleznie od implementacji, tylko do licznikow pokrycia).
fn band_per(n: usize, configured: Option<u8>, rows: i64) -> i64 {
    if n == 0 {
        return 0;
    }
    let n = i64::try_from(n).unwrap();
    let requested = configured.map_or_else(|| (n + 19) / 20, i64::from);
    let lines = n.min(requested.max((n + rows - 1) / rows));
    (n + lines - 1) / lines
}

/// Pasma (dlugosc, linie) w kolejnosci `layBand`: piechota, oszczepnicy, lucznicy, procarze, strzelcy, machiny,
/// dowodcy; plus liczba jazdy.
fn side_bands(
    units: &[SetupUnit],
    input: &PlaceUnitsInput<'_>,
) -> ([(usize, Option<u8>); 7], usize) {
    let roles: Vec<InitialRole> = units.iter().map(SetupUnit::initial_role).collect();
    let f = initial_formation(&roles);
    (
        [
            (f.infantry.len(), input.melee_lines),
            (f.javelins.len(), input.melee_lines),
            (f.archers.len(), input.archer_lines),
            (f.slingers.len(), input.archer_lines),
            (f.ranged.len(), input.archer_lines),
            (f.siege.len(), None),
            (f.commanders.len(), None),
        ],
        f.mounted.len(),
    )
}

/// Liczniki rundy 2 dla strony rozstawianej przez `place` (`got`/`ideal` = wynik na polu wektora / na rownej Plains).
fn cover_place_side(
    cov: &mut Coverage,
    units: &[SetupUnit],
    input: &PlaceUnitsInput<'_>,
    got: &[PlacedUnit],
    ideal: &[PlacedUnit],
) {
    let (bands, mounted) = side_bands(units, input);
    for &(n, lines) in &bands {
        if band_per(n, lines, PLAYABLE_ROWS_PIN) != band_per(n, lines, PLAYABLE_ROWS_PIN + 1) {
            cov.pasmo_granica_wierszy_gry += 1;
        }
    }
    let pers: Vec<i64> = bands
        .iter()
        .map(|&(n, l)| band_per(n, l, PLAYABLE_ROWS_PIN))
        .collect();
    if mounted > 0 && pers[6] > pers[..6].iter().copied().max().unwrap() {
        cov.pasmo_dowodcow_najszersze_z_jazda += 1;
    }
    if bands.iter().all(|&(n, _)| n == 0) && mounted >= 2 {
        // jazda w kolejnosci jednostek: indeksy nieparzyste = dolne skrzydlo (`i % 2 === 1`)
        let mut k = 0;
        for (a, b) in got.iter().zip(ideal.iter()) {
            if units[a.index].initial_role() != InitialRole::Mounted {
                continue;
            }
            if k % 2 == 1 && (a.col, a.row) != (b.col, b.row) {
                cov.jazda_dolne_skrzydlo_bez_korpusu_poza_slotem += 1;
            }
            k += 1;
        }
    }
}

/// E27: rola strzelecka wylacznie z kategorii (kategoria zawiera slowo, ale != kategorii dokladnej; nazwa bez slowa).
fn cover_role_from_category(cov: &mut Coverage, u: &SetupUnit) {
    let kat = norm_name(u.kategoria.as_deref().unwrap_or(""));
    let name = norm_name(u.jednostka.as_deref().or(u.nazwa.as_deref()).unwrap_or(""));
    let (exact, words, slot): (&str, &[&str], &mut usize) = match u.initial_role() {
        InitialRole::Javelin => (
            "oszczepnik",
            &["oszczepnik", "javelin", "atlatl", "estolic"],
            &mut cov.rola_z_kategorii_oszczepnik,
        ),
        InitialRole::Archer => (
            "lucznik",
            &["luczn", "archer", "kusznik", "crossbow"],
            &mut cov.rola_z_kategorii_lucznik,
        ),
        InitialRole::Slinger => (
            "procarz",
            &["procarz", "slinger"],
            &mut cov.rola_z_kategorii_procarz,
        ),
        _ => return,
    };
    if kat != exact
        && words.iter().any(|w| kat.contains(w))
        && !words.iter().any(|w| name.contains(w))
    {
        *slot += 1;
    }
}

fn run_case(c: &Value, fields: &Value, cov: &mut Coverage) {
    let id = c["id"].as_str().unwrap();
    let f = load_field(&fields[c["field"].as_str().unwrap()]);
    let atk_units: Vec<SetupUnit> = c["attackers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| unit(u, id))
        .collect();
    let def_units: Vec<SetupUnit> = c["defenders"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| unit(u, id))
        .collect();
    let siege_mode = c["siegeMode"].as_bool().unwrap();
    let lines = |k: &str| u8::try_from(c[k].as_u64().unwrap()).ok();
    let input = PlaceUnitsInput {
        map: &f.map,
        wall: f.wall,
        siege_mode,
        deploy_mode: c["deploy"].as_bool().unwrap(),
        player_side: side_of(c["playerSide"].as_str().unwrap()),
        melee_lines: lines("meleeLines"),
        archer_lines: lines("archerLines"),
    };
    let got = place_units(&input, &atk_units, &def_units);
    let want_atk: Vec<PlacedUnit> = c["atk"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| placed(v, Side::Atk))
        .collect();
    let want_def: Vec<PlacedUnit> = c["def"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| placed(v, Side::Def))
        .collect();
    assert_eq!(got.atk, want_atk, "{id}: this.atk");
    assert_eq!(got.def, want_def, "{id}: this.def");
    let want_occ: Vec<OccEntry> = c["occ"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| {
            let a = e.as_array().unwrap();
            (
                (a[0].as_i64().unwrap(), a[1].as_i64().unwrap()),
                (
                    side_of(a[2].as_str().unwrap()),
                    usize::try_from(a[3].as_u64().unwrap()).unwrap(),
                ),
            )
        })
        .collect();
    assert_eq!(
        got.occupancy.entries(),
        want_occ.as_slice(),
        "{id}: occByKey"
    );

    // ---- pokrycie (liczone z wejscia i wyniku, niezaleznie od implementacji)
    let siege_branch = siege_mode && f.wall.is_some_and(|w| w.wall_col >= 0);
    if siege_branch {
        cov.przypadki_oblezenie += 1;
    } else {
        cov.przypadki_polowe += 1;
        if siege_mode {
            cov.przypadki_siegemode_bez_muru += 1;
        }
    }
    if input.deploy_mode {
        cov.przypadki_rozstawienie_gracza += 1;
    }
    if atk_units.len() > BATTLE_MAX_PER_SIDE || def_units.len() > BATTLE_MAX_PER_SIDE {
        cov.przypadki_ponad_limit += 1;
    }
    if atk_units.is_empty() || def_units.is_empty() {
        cov.przypadki_pusta_strona += 1;
    }
    if input.melee_lines != Some(1) || input.archer_lines != Some(1) {
        cov.przypadki_linie_2_3 += 1;
    }
    let total = got.atk.len() + got.def.len();
    cov.nadpisanie_occ += total.saturating_sub(got.occupancy.entries().len());
    for p in got.atk.iter().chain(got.def.iter()) {
        let units = if p.side == Side::Atk {
            &atk_units
        } else {
            &def_units
        };
        let u = &units[p.index];
        if u.is_army_commander {
            cov.dowodca += 1;
        }
        cover_role_from_category(cov, u);
        #[allow(clippy::cast_precision_loss)]
        match f.map.at_f(p.col as f64, p.row as f64) {
            Some(bterrain::FOREST) => cov.pod_jednostka_las += 1,
            Some(bterrain::FORD) => cov.pod_jednostka_brod += 1,
            Some(bterrain::HILLS | bterrain::ROCKS) => cov.pod_jednostka_wzgorza_skaly += 1,
            _ => {}
        }
        if p.on_wall_walkway {
            if u.is_siege_unit() {
                cov.korona_katapulta += 1;
            } else if u.is_primary_ranged() {
                cov.korona_strzelec += 1;
            } else {
                cov.korona_wrecz += 1;
            }
        } else if u.initial_role() == InitialRole::Mounted && p.formation_rank.is_some() {
            cov.jazda_skrzydlo += 1;
        }
    }
    if siege_branch {
        let w = f.wall.unwrap();
        let mut rows: Vec<i64> = got
            .def
            .iter()
            .filter(|p| p.on_wall_walkway)
            .map(|p| p.row)
            .collect();
        let n = rows.len();
        rows.sort_unstable();
        rows.dedup();
        cov.korona_wspolny_rzad += n - rows.len();
        let span = w.row_hi - w.row_lo + 1;
        for (k, p) in got.def.iter().filter(|p| !p.on_wall_walkway).enumerate() {
            let k = i64::try_from(k).unwrap();
            let col0 = (BF_COLS - 1).min(w.wall_col + 2 + k / span);
            let row0 = w.row_lo + k % span;
            if (p.col, p.row) == (col0, row0) {
                cov.reszta_bezposrednio += 1;
            } else if p.col == col0 {
                cov.reszta_szukanie_rzedu += 1;
            } else {
                cov.reszta_szukanie_kolumny += 1;
            }
        }
        // jednostka bez wolnego miejsca: stoi na polu nieprzechodnim albo dzieli pole z inna jednostka obrony
        let mut rest: Vec<(i64, i64)> = got
            .def
            .iter()
            .filter(|p| !p.on_wall_walkway)
            .map(|p| (p.col, p.row))
            .collect();
        #[allow(clippy::cast_precision_loss)]
        let blocked = rest
            .iter()
            .filter(|&&(c, r)| !f.map.passable_f(c as f64, r as f64))
            .count();
        let n = rest.len();
        rest.sort_unstable();
        rest.dedup();
        cov.reszta_bez_miejsca += blocked + (n - rest.len());
    }
    // jednostki przesuniete z idealnego slotu (piechota / jazda) - porownanie z wynikiem bez przeszkod nie jest
    // dostepne bez reimplementacji; zliczamy jednostki stojace poza pasem wierszy slotu (rzad != ideal) przez
    // porownanie z rozstawieniem na pustym polu Plains (ten sam kod, inna siatka).
    let plains = BattleTerrainMap::from_tiles(
        i32::try_from(BF_COLS).unwrap(),
        i32::try_from(BF_ROWS).unwrap(),
        vec![bterrain::PLAINS; usize::try_from(BF_COLS * BF_ROWS).unwrap()],
        false,
    )
    .unwrap();
    let ideal = place_units(
        &PlaceUnitsInput {
            map: &plains,
            ..input
        },
        &atk_units,
        &def_units,
    );
    for (a, b) in got.atk.iter().zip(ideal.atk.iter()) {
        if (a.col, a.row) != (b.col, b.row) {
            if atk_units[a.index].initial_role() == InitialRole::Mounted {
                cov.jazda_skrzydlo_poza_slotem += 1;
            } else {
                cov.piechota_poza_slotem += 1;
            }
        }
    }
    let atk_n = atk_units.len().min(BATTLE_MAX_PER_SIDE);
    cover_place_side(cov, &atk_units[..atk_n], &input, &got.atk, &ideal.atk);
    if !siege_branch {
        let def_n = def_units.len().min(BATTLE_MAX_PER_SIDE);
        cover_place_side(cov, &def_units[..def_n], &input, &got.def, &ideal.def);
    }
}

#[test]
fn naglowek_wektorow_i_straznik_pinu() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    assert_eq!(
        v["fileSha256"]["gra/src/battle/formationRules.ts"],
        FORMATION_SHA
    );
    assert_eq!(v["fragSha256"], FRAG_SHA);
    let c = &v["consts"];
    assert_eq!(c["MAX_PER_SIDE"].as_u64(), Some(BATTLE_MAX_PER_SIDE as u64));
    assert_eq!(
        c["BATTLE_MAX_PER_SIDE"].as_u64(),
        Some(BATTLE_MAX_PER_SIDE as u64)
    );
    assert_eq!(c["PLAY_MID_ROW"].as_i64(), Some(PLAY_MID_ROW));
    assert_eq!(c["PLAY_ROW0"].as_i64(), Some(PLAY_ROW0));
    assert_eq!(c["PLAY_ROW1"].as_i64(), Some(PLAY_ROW1));
    assert_eq!(
        c["DEPLOY_ATK_FRONT_COL"].as_i64(),
        Some(DEPLOY_ATK_FRONT_COL)
    );
    assert_eq!(
        c["DEPLOY_DEF_FRONT_COL"].as_i64(),
        Some(DEPLOY_DEF_FRONT_COL)
    );
}

#[test]
fn pola_z_t5a_identyczne_z_pinem() {
    with_timeout(|| {
        let v = vectors();
        let mut checked = 0;
        for (id, f) in v["fields"].as_object().unwrap() {
            if f["spec"].is_null() {
                continue;
            }
            let field = setup_battle_field(&spec_input(&f["spec"]));
            assert_eq!(
                field.map.tiles(),
                rle_decode(f["tiles"].as_str().unwrap()).as_slice(),
                "{id}: kafle"
            );
            assert_eq!(
                field.siege.as_ref().map(|s| SiegeWallRows::from(&s.layout)),
                wall_of(&f["wall"]),
                "{id}: mur"
            );
            checked += 1;
        }
        assert!(checked >= 12, "pola z spec: {checked}");
    });
}

#[test]
fn rozstawienie_identyczne_z_pinem() {
    let cov = with_timeout(|| {
        let v = vectors();
        let mut cov = Coverage::default();
        let cases = v["cases"].as_array().unwrap();
        let mut siege_named = 0;
        let mut random = 0;
        for c in cases {
            run_case(c, &v["fields"], &mut cov);
            let id = c["id"].as_str().unwrap();
            if id.starts_with('S') && c["siegeMode"].as_bool().unwrap() {
                siege_named += 1;
            }
            if id.starts_with('L') {
                random += 1;
            }
        }
        assert!(siege_named >= 8, "scenariusze siegeMode: {siege_named}");
        assert!(random >= 100, "losowe wywolania: {random}");
        cov
    });
    eprintln!("pokrycie rozstawienia: {cov:#?}");
    pokrycie_galezi_rozstawienia(&cov);
}

/// Progi licznikow pokrycia (kazda galaz rozstawienia wykonana w wektorach pinu).
fn pokrycie_galezi_rozstawienia(cov: &Coverage) {
    let checks: [(&str, usize, usize); 29] = [
        ("przypadki_oblezenie", cov.przypadki_oblezenie, 60),
        ("przypadki_polowe", cov.przypadki_polowe, 20),
        (
            "przypadki_rozstawienie_gracza",
            cov.przypadki_rozstawienie_gracza,
            10,
        ),
        ("przypadki_ponad_limit", cov.przypadki_ponad_limit, 3),
        ("przypadki_pusta_strona", cov.przypadki_pusta_strona, 4),
        (
            "przypadki_siegemode_bez_muru",
            cov.przypadki_siegemode_bez_muru,
            1,
        ),
        ("przypadki_linie_2_3", cov.przypadki_linie_2_3, 20),
        ("korona_wrecz", cov.korona_wrecz, 100),
        ("korona_strzelec", cov.korona_strzelec, 30),
        ("korona_katapulta", cov.korona_katapulta, 10),
        ("korona_wspolny_rzad", cov.korona_wspolny_rzad, 10),
        ("reszta_bezposrednio", cov.reszta_bezposrednio, 3),
        ("reszta_szukanie_rzedu", cov.reszta_szukanie_rzedu, 50),
        ("reszta_szukanie_kolumny", cov.reszta_szukanie_kolumny, 20),
        ("reszta_bez_miejsca", cov.reszta_bez_miejsca, 3),
        ("jazda_skrzydlo", cov.jazda_skrzydlo, 50),
        (
            "jazda_skrzydlo_poza_slotem",
            cov.jazda_skrzydlo_poza_slotem,
            5,
        ),
        ("piechota_poza_slotem", cov.piechota_poza_slotem, 50),
        ("pod_jednostka_las", cov.pod_jednostka_las, 5),
        ("pod_jednostka_brod", cov.pod_jednostka_brod, 5),
        (
            "pod_jednostka_wzgorza_skaly",
            cov.pod_jednostka_wzgorza_skaly,
            5,
        ),
        ("nadpisanie_occ", cov.nadpisanie_occ, 10),
        ("dowodca", cov.dowodca, 3),
        // runda 2: progi = wartosci z wektorow r2 (dokladnie te scenariusze R2-*; patrz 02a-obrona.md)
        (
            "pasmo_granica_wierszy_gry",
            cov.pasmo_granica_wierszy_gry,
            PROG_PASMO_GRANICA,
        ),
        (
            "jazda_dolne_skrzydlo_bez_korpusu_poza_slotem",
            cov.jazda_dolne_skrzydlo_bez_korpusu_poza_slotem,
            PROG_DOLNE_SKRZYDLO,
        ),
        (
            "pasmo_dowodcow_najszersze_z_jazda",
            cov.pasmo_dowodcow_najszersze_z_jazda,
            PROG_DOWODCY_NAJSZERSI,
        ),
        (
            "rola_z_kategorii_oszczepnik",
            cov.rola_z_kategorii_oszczepnik,
            PROG_ROLA_Z_KATEGORII,
        ),
        (
            "rola_z_kategorii_lucznik",
            cov.rola_z_kategorii_lucznik,
            PROG_ROLA_Z_KATEGORII,
        ),
        (
            "rola_z_kategorii_procarz",
            cov.rola_z_kategorii_procarz,
            PROG_ROLA_Z_KATEGORII,
        ),
    ];
    for (name, got, min) in checks {
        assert!(got >= min, "pokrycie {name}: {got} < {min}");
    }
}

#[test]
fn pole_t5a_jako_wejscie_place_units_on_field() {
    with_timeout(|| {
        let v = vectors();
        let mut checked = 0;
        for c in v["cases"].as_array().unwrap() {
            let f = &v["fields"][c["field"].as_str().unwrap()];
            if f["spec"].is_null()
                || c["meleeLines"] != 1
                || c["archerLines"] != 1
                || c["siegeMode"].as_bool().unwrap() != !f["wall"].is_null()
            {
                continue;
            }
            let id = c["id"].as_str().unwrap();
            let field = setup_battle_field(&spec_input(&f["spec"]));
            let atk: Vec<SetupUnit> = c["attackers"]
                .as_array()
                .unwrap()
                .iter()
                .map(|u| unit(u, id))
                .collect();
            let def: Vec<SetupUnit> = c["defenders"]
                .as_array()
                .unwrap()
                .iter()
                .map(|u| unit(u, id))
                .collect();
            let got = place_units_on_field(
                &field,
                c["deploy"].as_bool().unwrap(),
                side_of(c["playerSide"].as_str().unwrap()),
                &atk,
                &def,
            );
            let want_atk: Vec<PlacedUnit> = c["atk"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| placed(x, Side::Atk))
                .collect();
            let want_def: Vec<PlacedUnit> = c["def"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| placed(x, Side::Def))
                .collect();
            assert_eq!(got.atk, want_atk, "{id}: atk z pola T5a");
            assert_eq!(got.def, want_def, "{id}: def z pola T5a");
            checked += 1;
        }
        assert!(checked >= 20, "przypadki na polu T5a: {checked}");
    });
}

#[test]
fn reposition_siege_attackers_to_no_op_jak_w_pinie() {
    // Pin `_repositionSiegeAttackers` (`:4427-4434`) ma puste cialo; wywolanie nie zmienia stanu.
    reposition_siege_attackers();
    let map = BattleTerrainMap::from_tiles(
        i32::try_from(BF_COLS).unwrap(),
        i32::try_from(BF_ROWS).unwrap(),
        vec![bterrain::PLAINS; usize::try_from(BF_COLS * BF_ROWS).unwrap()],
        false,
    )
    .unwrap();
    let mut occ = Occupancy::default();
    let wall = SiegeWallRows {
        wall_col: 40,
        row_lo: 0,
        row_hi: 155,
        gate_row: 77,
    };
    let d = vec![SetupUnit {
        jednostka: Some("Konnica".into()),
        ..SetupUnit::default()
    }];
    let before = place_siege_defenders(&map, &mut occ.clone(), wall, &d);
    reposition_siege_attackers();
    let after = place_siege_defenders(&map, &mut occ, wall, &d);
    assert_eq!(before, after);
    assert_eq!(after[0].col, 42);
    assert_eq!(after[0].row, 0);
}

#[test]
fn occupancy_jak_map_js() {
    let mut o = Occupancy::default();
    o.set(1, 2, (Side::Atk, 0));
    o.set(3, 4, (Side::Def, 1));
    o.set(1, 2, (Side::Def, 7));
    assert_eq!(
        o.entries(),
        &[((1, 2), (Side::Def, 7)), ((3, 4), (Side::Def, 1))]
    );
    assert!(o.has(3, 4));
    assert!(!o.has(4, 3));
}

#[test]
fn fikstura_renderera_max_per_side() {
    let r: Value = serde_json::from_str(RPARITY).expect("renderer_parity.json");
    assert_eq!(
        r["pinMaxPerSide"].as_u64(),
        Some(BATTLE_MAX_PER_SIDE as u64)
    );
    // Renderer ma 120 (stary limit sprzed R-WEB-BATTLE-CAP-500-Q1): rozbieznosc z pinem = dlug DTO-BRIDGE.
    assert_eq!(r["rendererMaxPerSide"].as_u64(), Some(120));
    // Linia zrodla renderera jest czytana WYLACZNIE przez generator (fikstura JSON); test silnika nie otwiera plikow
    // `renderer/` (dispatch: porownanie tylko przez fiksture; obrona r2, uwaga N1 Evaluatora).
    assert_eq!(
        r["maxPerSideLine"].as_str(),
        Some("pub const MAX_PER_SIDE: i32 = 120;")
    );
    assert_eq!(
        r["source"].as_str(),
        Some("rust-port/renderer/src/battle/field.rs")
    );
}
