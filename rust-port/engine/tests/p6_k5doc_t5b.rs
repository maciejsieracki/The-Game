//! P6 SIEGE-TAKTYKA K5DOC-T5b (dispatch R-RUSTPORT-P6-K5DOC-T5B-MARSZ): testy zgodnosci marszu strzelca z pinem
//! `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * `_bestForwardStep` (`:6822-6893`) -> `best_forward_step`,
//! * czesc decyzyjna `_rangedForwardStep` (`:6776-6787`) -> `ranged_forward_step_key`,
//! * `_nearestEnemy` (`:8296-8304`) -> `nearest_enemy_forward`.
//!
//! Wektory: `p6_k5doc_t5b_vectors/vectors.json`, generowane przez `p6_k5doc_t5b_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Stubowane sa tylko `occByKey` (tu: predykat `occupied`, unia kafelkow jednostek),
//! `_passableForUnit` (tu: predykat `passable`), `isSiegeUnit` (tu: flaga `siege`) i `this.finished` (tu: `finished`).

use civ_engine::domain::siege_tactics_approach::BF_ROWS;
use civ_engine::domain::siege_tactics_autobatch::{cell_key, CellKey, BF_COLS};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_pathstep::Tile;
use civ_engine::domain::siege_tactics_ranged_forward::{
    best_forward_step, enemies_of_forward, nearest_enemy_forward, ranged_forward_step_key,
    ForwardUnit,
};
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t5b_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct UnitJson {
    q: f64,
    r: f64,
    side: String,
    range: f64,
    #[serde(rename = "moveLeft")]
    move_left: f64,
    dead: bool,
    #[serde(rename = "fadingOut")]
    fading_out: bool,
    routed: bool,
    removed: bool,
    mounted: bool,
    siege: bool,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    kind: String,
    pin: String,
    unit: UnitJson,
    others: Vec<UnitJson>,
    nearest: Option<[f64; 2]>,
    finished: bool,
    occupied: Vec<[f64; 2]>,
    impassable: Vec<[f64; 2]>,
    expect: serde_json::Value,
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("nieznana strona {other}"),
    }
}

impl UnitJson {
    fn to_forward(&self) -> ForwardUnit {
        ForwardUnit {
            tile: (self.q, self.r),
            side: side_of(&self.side),
            range: self.range,
            move_left: self.move_left,
            dead: self.dead,
            fading_out: self.fading_out,
            routed: self.routed,
            removed: self.removed,
            mounted: self.mounted,
            siege: self.siege,
        }
    }
}

fn vectors() -> Vec<Case> {
    serde_json::from_str::<Vectors>(VECTORS)
        .expect("vectors.json poprawny")
        .cases
}

/// Pomocnik nazwany: jednostka aktywna, zwykla (nie jazda, nie oblezenie), zywa, z zasiegiem i ruchem.
fn u(q: f64, r: f64, side: BattleSide, range: f64, move_left: f64) -> ForwardUnit {
    ForwardUnit {
        tile: (q, r),
        side,
        range,
        move_left,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        mounted: false,
        siege: false,
    }
}

const ATK: BattleSide = BattleSide::Attacker;
const DEF: BattleSide = BattleSide::Defender;

/// Wynik `best_forward_step` dla sceny nazwanej (zajetosc = `occ`, nieprzejezdnosc = `impass`).
fn best(
    me: ForwardUnit,
    nearest: Tile,
    same_side: &[ForwardUnit],
    occ: &[Tile],
    impass: &[Tile],
) -> Option<CellKey> {
    let occ_set: Vec<Tile> = occ.to_vec();
    let imp_set: Vec<Tile> = impass.to_vec();
    let occupied = move |c: f64, r: f64| occ_set.contains(&(c, r));
    let passable = move |c: f64, r: f64| !imp_set.contains(&(c, r));
    best_forward_step(&me, nearest, same_side, &occupied, &passable)
}

fn key_to_tile(k: CellKey) -> Tile {
    (f64::from_bits(k.0), f64::from_bits(k.1))
}

// --- Stale rozmiaru planszy uzyte przez wektory (pin 661-662) ---

/// Pin `battleScene.ts:661-662`: `BF_COLS = 68`, `BF_ROWS = 156`.
#[test]
fn bf_dimensions_match_pin() {
    assert_eq!(BF_COLS, 68.0);
    assert_eq!(BF_ROWS, 156);
}

// --- _nearestEnemy / _enemiesOf (pin 8291-8304) ---

/// Pin `:8293`: `_enemiesOf` pomija martwych, znikajacych i rozbitych oraz wlasna strone.
#[test]
fn enemies_of_pomija_martwych_znikajacych_rozbitych() {
    let me = u(5.0, 5.0, ATK, 2.0, 2.0);
    let dead = ForwardUnit {
        dead: true,
        ..u(6.0, 5.0, DEF, 2.0, 2.0)
    };
    let fading = ForwardUnit {
        fading_out: true,
        ..u(7.0, 5.0, DEF, 2.0, 2.0)
    };
    let routed = ForwardUnit {
        routed: true,
        ..u(8.0, 5.0, DEF, 2.0, 2.0)
    };
    let live = u(9.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, dead, fading, routed, live];
    assert_eq!(enemies_of_forward(ATK, &units), vec![live]);
}

/// Pin `:8296-8304`: przy remisie dystansu wygrywa pierwszy z `_enemiesOf` (ostre `<`).
#[test]
fn nearest_enemy_remis_pierwszy_z_listy() {
    let me = u(5.0, 5.0, ATK, 2.0, 2.0);
    let a = u(5.0, 8.0, DEF, 2.0, 2.0);
    let b = u(8.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, a, b];
    assert_eq!(
        nearest_enemy_forward(&me, &units).map(|e| e.tile),
        Some((5.0, 8.0))
    );
}

// --- _bestForwardStep (pin 6822-6893) ---

/// Pin `:6832-6852`: pierwszy wybor to krok w osi marszu (E dla atakujacego).
#[test]
fn best_wybiera_krok_w_osi_marszu() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    let enemy = (6.0, 5.0);
    let units = [me];
    assert_eq!(
        best(me, enemy, &units, &[(2.0, 5.0)], &[]),
        Some(cell_key(3.0, 5.0))
    );
}

/// Pin `:6832-6852`: zajety kafelek w osi i brak objazdu w BFS -> `None` (pin: hold for this turn).
#[test]
fn best_zajety_w_osi_bez_objazdu_none() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    let friend = u(3.0, 5.0, ATK, 2.0, 2.0);
    let units = [me, friend];
    assert_eq!(
        best(me, (6.0, 5.0), &units, &[(2.0, 5.0), (3.0, 5.0)], &[]),
        None
    );
}

/// Pin `:6876-6888`: BFS po wierszach sojuszniczej koperty daje pierwszy krok w gore (2,4).
#[test]
fn best_bfs_objazd_w_gore() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    let units = [me, u(3.0, 5.0, ATK, 2.0, 2.0), u(9.0, 4.0, ATK, 2.0, 2.0)];
    assert_eq!(
        best(me, (6.0, 5.0), &units, &[(2.0, 5.0), (3.0, 5.0)], &[]),
        Some(cell_key(2.0, 4.0))
    );
}

/// Pin `:6875` (`[row - 1, row + 1]`): przy dwoch otwartych wierszach wygrywa wiersz `row - 1`.
#[test]
fn best_bfs_kolejnosc_row_minus_1_pierwszy() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    let units = [
        me,
        u(3.0, 5.0, ATK, 2.0, 2.0),
        u(9.0, 4.0, ATK, 2.0, 2.0),
        u(9.0, 6.0, ATK, 2.0, 2.0),
    ];
    assert_eq!(
        best(me, (6.0, 5.0), &units, &[(2.0, 5.0), (3.0, 5.0)], &[]),
        Some(cell_key(2.0, 4.0))
    );
}

/// Pin `:6832`: granica `nc >= BF_COLS` -> jedyny kandydat E poza plansza (wrog off-board w kolumnie 69) -> `None`.
/// Mutant `nc > BF_COLS` dalby `(68, 5)` (wrog nie zajmuje tego kafelka), wiec test go wykrywa.
///
/// MOC TESTU (adnotacja obrony, zarzut 3 evaluatora): mutant `nc > BF_COLS` rozni sie od pina TYLKO dla
/// `me.q == BF_COLS - 1` i kandydata E `nc == BF_COLS`. Dla wroga na planszy (`nearest.q <= BF_COLS - 1`) kandydat E
/// ma `forwardGain = (me.q - nq) - (BF_COLS - nq) = -1` oraz `rowGap = 0`, wiec jest odrzucany w obu wersjach
/// (mutant rownowazny). Mutant jest zabijany wylacznie przez ten wektor z wrogiem poza plansza (`nearest.q = BF_COLS + 1`,
/// `forwardGain = +1`). To slaba moc testu, swiadomie przyjeta: wrog poza plansza nie wystepuje w grze.
#[test]
fn best_granica_nc_ge_bf_cols_odrzuca_e() {
    let me = u(67.0, 5.0, ATK, 2.0, 2.0);
    let enemy = u(69.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, enemy];
    assert_eq!(
        best(me, (69.0, 5.0), &units, &[(67.0, 5.0), (69.0, 5.0)], &[]),
        None
    );
}

/// Pin `:6847`: postep ostry — krok pionowy z `forwardGain = 0` i `rowGap = +1` jest odrzucany.
#[test]
fn best_pionowy_bez_postepu_odrzucony() {
    let me = u(5.0, 5.0, ATK, 2.0, 2.0);
    let friend = u(6.0, 5.0, ATK, 2.0, 2.0);
    let enemy = u(9.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, friend, enemy];
    assert_eq!(
        best(
            me,
            (9.0, 5.0),
            &units,
            &[(5.0, 5.0), (6.0, 5.0), (9.0, 5.0)],
            &[]
        ),
        None
    );
}

/// Pin `:6834-6835`: nieprzejezdny kafelek w osi odpada, objazd przez sojusznika w wierszu 4.
#[test]
fn best_nieprzejezdny_objazd_bfs() {
    let me = u(0.0, 5.0, ATK, 2.0, 2.0);
    let units = [me, u(9.0, 4.0, ATK, 2.0, 2.0), u(4.0, 5.0, DEF, 2.0, 2.0)];
    assert_eq!(
        best(
            me,
            (4.0, 5.0),
            &units,
            &[(0.0, 5.0), (9.0, 4.0), (4.0, 5.0)],
            &[(1.0, 5.0)]
        ),
        Some(cell_key(0.0, 4.0)),
    );
}

// --- _rangedForwardStep, czesc decyzyjna (pin 6777-6787) ---

/// Pin `:6781-6782`: brak wroga -> `done()` bez kroku.
#[test]
fn ranged_brak_wroga_none() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    assert_eq!(
        ranged_forward_step_key(
            &me,
            false,
            &[me],
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        None
    );
}

/// Pin `:6777`: `finished` -> brak kroku.
#[test]
fn ranged_finished_none() {
    let me = u(2.0, 5.0, ATK, 2.0, 2.0);
    let enemy = u(6.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, enemy];
    assert_eq!(
        ranged_forward_step_key(
            &me,
            true,
            &units,
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        None
    );
}

/// Pin `:6779`: `moveLeft <= 0` -> brak kroku.
#[test]
fn ranged_move_left_zero_none() {
    let me = u(2.0, 5.0, ATK, 2.0, 0.0);
    let enemy = u(6.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, enemy];
    assert_eq!(
        ranged_forward_step_key(
            &me,
            false,
            &units,
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        None
    );
}

/// Pin `:6784`: wrog w zasiegu -> brak kroku (strzal wybiera galaz strzalu).
#[test]
fn ranged_w_zasiegu_none() {
    let me = u(2.0, 5.0, ATK, 4.0, 2.0);
    let enemy = u(6.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, enemy];
    assert_eq!(
        ranged_forward_step_key(
            &me,
            false,
            &units,
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        None
    );
}

/// Pin `:6786`: poza zasiegiem -> klucz kroku w osi marszu.
#[test]
fn ranged_poza_zasiegiem_krok_e() {
    let me = u(0.0, 5.0, ATK, 2.0, 2.0);
    let enemy = u(6.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, enemy];
    assert_eq!(
        ranged_forward_step_key(
            &me,
            false,
            &units,
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        Some(cell_key(1.0, 5.0)),
    );
}

/// Pin `:6777-6787` + `:8291-8294`: martwy wrog nie jest celem `_nearestEnemy` (krok liczony do zywego wroga).
#[test]
fn ranged_martwy_wrog_pominiety_w_nearest() {
    let me = u(0.0, 5.0, ATK, 2.0, 2.0);
    let dead = ForwardUnit {
        dead: true,
        ..u(0.0, 3.0, DEF, 2.0, 2.0)
    };
    let live = u(6.0, 5.0, DEF, 2.0, 2.0);
    let units = [me, dead, live];
    assert_eq!(
        ranged_forward_step_key(
            &me,
            false,
            &units,
            &[me],
            &|_: f64, _: f64| false,
            &|_: f64, _: f64| true
        ),
        Some(cell_key(1.0, 5.0)),
    );
}

// --- Wektory wygenerowane przez pin ---

/// Kazdy wektor (`best_forward` i `ranged_key`) musi dac dokladnie to, co wykonanie pina (bajt-w-bajt jako klucz
/// komorki albo `None`). Sprawdza takze liczniki pokrycia, zeby pusty plik nie przeszedl.
#[test]
fn wektory_zgodne_z_pinem() {
    let cases = vectors();
    let mut n_best = 0usize;
    let mut n_best_some = 0usize;
    let mut n_ranged = 0usize;
    let mut n_ranged_some = 0usize;
    let mut mismatches: Vec<String> = Vec::new();

    for c in &cases {
        let me = c.unit.to_forward();
        let others: Vec<ForwardUnit> = c.others.iter().map(UnitJson::to_forward).collect();
        let mut all: Vec<ForwardUnit> = vec![me];
        all.extend(others.iter().copied());
        let same_side: Vec<ForwardUnit> =
            all.iter().copied().filter(|u| u.side == me.side).collect();
        let occ: Vec<Tile> = c.occupied.iter().map(|p| (p[0], p[1])).collect();
        let imp: Vec<Tile> = c.impassable.iter().map(|p| (p[0], p[1])).collect();

        let got: Option<CellKey> = match c.kind.as_str() {
            "best_forward" => {
                n_best += 1;
                let nearest = c.nearest.expect("best_forward ma nearest");
                best(me, (nearest[0], nearest[1]), &same_side, &occ, &imp)
            }
            "ranged_key" => {
                n_ranged += 1;
                let occupied = {
                    let occ = occ.clone();
                    move |cc: f64, rr: f64| occ.contains(&(cc, rr))
                };
                let passable = {
                    let imp = imp.clone();
                    move |cc: f64, rr: f64| !imp.contains(&(cc, rr))
                };
                ranged_forward_step_key(&me, c.finished, &all, &same_side, &occupied, &passable)
            }
            other => panic!("nieznany rodzaj {other} w {}", c.name),
        };

        let want: Option<CellKey> = match &c.expect {
            serde_json::Value::Null => None,
            serde_json::Value::Array(xs) => {
                let col = xs[0].as_f64().expect("kolumna");
                let row = xs[1].as_f64().expect("wiersz");
                Some(cell_key(col, row))
            }
            other => panic!("nieoczekiwany expect {other} w {}", c.name),
        };

        if want.is_some() {
            if c.kind == "best_forward" {
                n_best_some += 1;
            } else {
                n_ranged_some += 1;
            }
        }
        if got != want {
            mismatches.push(format!(
                "{} ({}, pin {}): got {:?} want {:?}",
                c.name,
                c.kind,
                c.pin,
                got.map(key_to_tile),
                want.map(key_to_tile)
            ));
        }
    }

    assert!(
        mismatches.is_empty(),
        "rozbieznosci z pinem: {:#?}",
        mismatches
    );
    assert!(n_best >= 400, "za malo wektorow best_forward: {n_best}");
    assert!(
        n_best_some >= 100,
        "za malo wektorow best_forward z krokiem: {n_best_some}"
    );
    assert!(n_ranged >= 200, "za malo wektorow ranged_key: {n_ranged}");
    assert!(
        n_ranged_some >= 20,
        "za malo wektorow ranged_key z krokiem: {n_ranged_some}"
    );
    // Nazwane przypadki graniczne musza byc obecne (zmiana generatora nie moze ich cicho usunac).
    for required in [
        "bfs_kolejnosc_row_minus_1_przed_plus_1",
        "postep_ostry_pionowy_zero_gain_odrzut",
        "granica_nc_ge_bf_cols_jedyny_kandydat_null",
        "granica_nr_ge_bf_rows_jedyny_kandydat_null",
        "granica_nr_ujemne_jedyny_kandydat_null",
        "granica_nc_ujemne_jedyny_kandydat_null",
    ] {
        assert!(
            cases.iter().any(|c| c.name == required),
            "brak wektora nazwanego {required}"
        );
    }
}
