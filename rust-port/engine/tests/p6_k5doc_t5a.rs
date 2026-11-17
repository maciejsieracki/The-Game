//! P6 SIEGE-TAKTYKA K5DOC-T5a (dispatch R-RUSTPORT-P6-K5DOC-T5A-KITE): testy zgodnosci galezi KITE strzelca z pinem
//! `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * `_bestKiteShotStep` (`:6959-7002`) -> `best_kite_shot_step`,
//! * `_nearestEnemyMelee` (`:8315-8324`) -> `nearest_enemy_melee`,
//! * warunek galezi 1 (`:6689-6691`) -> `kite_branch_applies`,
//! * `MELEE_SAFE_GAP` (`:968`) = 2.
//!
//! Wektory: `p6_k5doc_t5a_vectors/vectors.json`, generowane przez `p6_k5doc_t5a_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Stubowane sa tylko `occByKey` (tu: predykat `occupied`) i `_passableForUnit`
//! (tu: predykat `passable`), oba jawnie opisane w wektorze.

use civ_engine::domain::siege_tactics_approach::BF_ROWS;
use civ_engine::domain::siege_tactics_autobatch::BF_COLS;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_kite::{
    best_kite_shot_step, enemies_of_kite, kite_branch_applies, nearest_enemy_melee, KiteUnit,
    MELEE_SAFE_GAP,
};
use civ_engine::domain::siege_tactics_pathstep::Tile;
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t5a_vectors/vectors.json");

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
    #[serde(rename = "primaryRanged")]
    primary_ranged: bool,
    #[serde(rename = "rangedKite")]
    ranged_kite: bool,
    dead: bool,
    #[serde(rename = "fadingOut")]
    fading_out: bool,
    routed: bool,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    kind: String,
    pin: String,
    unit: UnitJson,
    others: Vec<UnitJson>,
    threat: Option<[f64; 2]>,
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
    fn to_kite(&self) -> KiteUnit {
        KiteUnit {
            tile: (self.q, self.r),
            side: side_of(&self.side),
            range: self.range,
            primary_ranged: self.primary_ranged,
            dead: self.dead,
            fading_out: self.fading_out,
            routed: self.routed,
        }
    }
}

fn vectors() -> Vec<Case> {
    serde_json::from_str::<Vectors>(VECTORS)
        .expect("vectors.json poprawny")
        .cases
}

/// Pomocnik testow nazwanych: jednostka aktywna, zwykla (nie strzelec pierwszego rzutu, gotowa do kite).
fn u(q: f64, r: f64, side: BattleSide, range: f64) -> KiteUnit {
    KiteUnit {
        tile: (q, r),
        side,
        range,
        primary_ranged: false,
        dead: false,
        fading_out: false,
        routed: false,
    }
}

fn ranged(q: f64, r: f64, side: BattleSide, range: f64) -> KiteUnit {
    KiteUnit {
        primary_ranged: true,
        ..u(q, r, side, range)
    }
}

/// Wynik `best_kite_shot_step` dla sceny nazwanej (bez occ/impass poza podanymi listami).
fn best(
    me: KiteUnit,
    threat: Tile,
    units: &[KiteUnit],
    occ: &[Tile],
    impass: &[Tile],
) -> Option<Tile> {
    let occ_set: Vec<Tile> = occ.to_vec();
    let imp_set: Vec<Tile> = impass.to_vec();
    let occupied = move |c: f64, r: f64| occ_set.contains(&(c, r));
    let passable = move |c: f64, r: f64| !imp_set.contains(&(c, r));
    best_kite_shot_step(&me, threat, units, &occupied, &passable)
        .map(|(c, r)| (f64::from_bits(c), f64::from_bits(r)))
}

const ATK: BattleSide = BattleSide::Attacker;
const DEF: BattleSide = BattleSide::Defender;

// --- Stala ---

/// Pin `battleScene.ts:968`: `const MELEE_SAFE_GAP = 2;`.
#[test]
fn melee_safe_gap_is_two() {
    assert_eq!(MELEE_SAFE_GAP, 2.0);
}

// --- _bestKiteShotStep (pin 6959-7002) ---

/// Pin `:6962`: `if (enemies.length === 0) return null;`.
#[test]
fn best_brak_wroga_zwraca_none() {
    let me = u(0.0, 5.0, ATK, 3.0);
    assert_eq!(best(me, (4.0, 5.0), &[me], &[], &[]), None);
}

/// Pin `:6971` + `:661-662`: `nc < 0` odrzuca krok W (-1,5); pierwszy z DIRS4 (N) wygrywa remis z S.
#[test]
fn best_granica_planszy_odrzuca_nc_ujemne() {
    let me = u(0.0, 5.0, ATK, 5.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(best(me, (4.0, 5.0), &units, &[], &[]), Some((0.0, 4.0)));
}

/// Pin `:6971` (`nc < 0`, DODATEK r3): W (-1,5) jedynym kandydatem poza plansza (N/S zajete, E odpada na gap); brak kroku.
#[test]
fn best_granica_nc_ujemne_w_jedyny_odrzucony() {
    let me = u(0.0, 5.0, ATK, 5.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(
        best(me, (4.0, 5.0), &units, &[(0.0, 4.0), (0.0, 6.0)], &[]),
        None
    );
}

/// Pin `:6971` (`nc >= BF_COLS`, BF_COLS = 68, `:661`, DODATEK r3): E (68,5) z kolumny 67 poza plansza.
/// Bez granicy E (450, movedBackAxis) wygralby; pin wybiera N (67,4) (400, pierwszy w DIRS4).
#[test]
fn best_granica_nc_ge_bf_cols_odrzuca_e() {
    let me = u(BF_COLS - 1.0, 5.0, DEF, 4.0);
    let units = [me, u(BF_COLS - 4.0, 5.0, ATK, 2.0)];
    assert_eq!(
        best(me, (BF_COLS - 4.0, 5.0), &units, &[], &[]),
        Some((BF_COLS - 1.0, 4.0))
    );
}

/// Pin `:6971` (`nr >= BF_ROWS`, BF_ROWS = 156, `:662`, DODATEK r3): S (30,156) z wiersza 155 poza plansza.
/// E/W zajete, N odpada na gap; jedyny kandydat to S poza plansza -> brak kroku.
#[test]
fn best_granica_nr_ge_bf_rows_odrzuca_s() {
    let last_row = (BF_ROWS - 1) as f64;
    let me = u(30.0, last_row, ATK, 4.0);
    let units = [me, u(30.0, last_row - 3.0, DEF, 2.0)];
    assert_eq!(
        best(
            me,
            (30.0, last_row - 3.0),
            &units,
            &[(29.0, last_row), (31.0, last_row)],
            &[]
        ),
        None
    );
}

/// Pin `:6971` (`nr < 0`, dolna granica wiersza = 0, DODATEK r3): N (30,-1) z wiersza 0 poza plansza.
/// E/W zajete, S odpada na gap; jedyny kandydat to N poza plansza -> brak kroku.
#[test]
fn best_granica_nr_ujemne_odrzuca_n() {
    let me = u(30.0, 0.0, ATK, 4.0);
    let units = [me, u(30.0, 3.0, DEF, 2.0)];
    assert_eq!(
        best(me, (30.0, 3.0), &units, &[(29.0, 0.0), (31.0, 0.0)], &[]),
        None
    );
}

/// Pin `:6973` (`occByKey.has(nk)`): zajety N odrzucony, wybor pada na S.
#[test]
fn best_zajety_kafelek_odrzucony() {
    let me = u(0.0, 5.0, ATK, 5.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(
        best(me, (4.0, 5.0), &units, &[(0.0, 4.0)], &[]),
        Some((0.0, 6.0))
    );
}

/// Pin `:6974` + `:7446` (`_passableForUnit`): N i S nieprzejezdne, E odpada na gap; brak kroku.
#[test]
fn best_nieprzejezdny_odrzucony() {
    let me = u(0.0, 5.0, ATK, 5.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(
        best(me, (4.0, 5.0), &units, &[], &[(0.0, 4.0), (0.0, 6.0)]),
        None
    );
}

/// Pin `:6985` (`if (dMinAny <= 1) continue;`): N (0,4) sasiaduje z wrogiem (0,3); wygrywa S (0,6).
#[test]
fn best_dmin_any_le_1_odrzuca() {
    let me = u(0.0, 5.0, ATK, 5.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0), u(0.0, 3.0, DEF, 2.0)];
    assert_eq!(best(me, (4.0, 5.0), &units, &[], &[]), Some((0.0, 6.0)));
}

/// Pin `:6987` (`if (!inRangeOfSome) continue;`): zasieg 1, zaden kandydat nie ma wroga w [1..1].
#[test]
fn best_brak_celu_w_zasiegu_odrzuca() {
    let me = u(0.0, 5.0, ATK, 1.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(best(me, (4.0, 5.0), &units, &[], &[]), None);
}

/// Pin `:6990` (`if (gap <= dNow) continue;`): jedyny wolny kandydat E (3,5) zbliza do zagrozenia (5,5); odrzut.
#[test]
fn best_gap_nie_wiekszy_od_dnow_odrzuca() {
    let me = u(2.0, 5.0, ATK, 3.0);
    let units = [me, u(5.0, 5.0, DEF, 2.0)];
    let occ = [(1.0, 5.0), (2.0, 4.0), (2.0, 6.0)];
    assert_eq!(best(me, (5.0, 5.0), &units, &occ, &[]), None);
}

/// Pin `:6992` (`movedBackAxis ? 50 : 0`): krok W (1,5) = 350 wygrywa z N/S (300) mimo tej samej luki.
#[test]
fn best_bonus_movedbackaxis_wybiera_krok_wstecz() {
    let me = u(2.0, 5.0, ATK, 3.0);
    let units = [me, u(4.0, 5.0, DEF, 2.0)];
    assert_eq!(best(me, (4.0, 5.0), &units, &[], &[]), Some((1.0, 5.0)));
}

/// Pin `:6743-6745` (`_advanceDir`): strona obrony ma kierunek wsteczny +1 (E); E (8,5) wygrywa.
#[test]
fn best_strona_obrony_kierunek_wsteczny_e() {
    let me = u(7.0, 5.0, DEF, 5.0);
    let units = [me, u(3.0, 5.0, ATK, 2.0)];
    assert_eq!(best(me, (3.0, 5.0), &units, &[], &[]), Some((8.0, 5.0)));
}

// --- _nearestEnemyMelee (pin 8315-8324) i _enemiesOf (pin 8291-8294) ---

/// Pin `:8317` (`if (e.primaryRanged) continue;`): ranged (dd 1) pominiety, melee (dd 3) wygrywa.
#[test]
fn nearest_melee_pomija_primary_ranged() {
    let me = u(5.0, 5.0, ATK, 2.0);
    let units = [me, ranged(6.0, 5.0, DEF, 2.0), u(8.0, 5.0, DEF, 2.0)];
    assert_eq!(
        nearest_enemy_melee(&me, &units).map(|e| e.tile),
        Some((8.0, 5.0))
    );
}

/// Pin `:8319-8322` (ostre `<`): remis dystansu, pierwszy z `_enemiesOf` wygrywa.
#[test]
fn nearest_melee_remis_pierwszy_z_listy() {
    let me = u(5.0, 5.0, ATK, 2.0);
    let units = [me, u(5.0, 8.0, DEF, 2.0), u(8.0, 5.0, DEF, 2.0)];
    assert_eq!(
        nearest_enemy_melee(&me, &units).map(|e| e.tile),
        Some((5.0, 8.0))
    );
}

/// Pin `:8293` (filtr `!dead && !fadingOut && !routed`): martwy wrog pominiety.
#[test]
fn enemies_of_pomija_martwych_i_rozbitych() {
    let me = u(5.0, 5.0, ATK, 2.0);
    let dead = KiteUnit {
        dead: true,
        ..u(6.0, 5.0, DEF, 2.0)
    };
    let routed = KiteUnit {
        routed: true,
        ..u(7.0, 5.0, DEF, 2.0)
    };
    let live = u(8.0, 5.0, DEF, 2.0);
    let units = [me, dead, routed, live];
    assert_eq!(enemies_of_kite(ATK, &units), vec![live]);
}

// --- Warunek galezi 1 (pin 6689-6691) ---

/// Pin `:6689`: `rangedKite === false` wylacza galaz (strzelec bije z miejsca).
#[test]
fn gate_ranged_kite_false_wylacza() {
    let me = ranged(5.0, 5.0, ATK, 2.0);
    assert!(!kite_branch_applies(
        &me,
        false,
        &[me, u(7.0, 5.0, DEF, 2.0)]
    ));
}

/// Pin `:6689`: bez `primaryRanged` galaz nieaktywna.
#[test]
fn gate_bez_primary_ranged_wylacza() {
    let me = u(5.0, 5.0, ATK, 2.0);
    assert!(!kite_branch_applies(
        &me,
        true,
        &[me, u(7.0, 5.0, DEF, 2.0)]
    ));
}

/// Pin `:6691`: dokladnie `MELEE_SAFE_GAP` (dd 2) -> galaz aktywna (wektor graniczny).
#[test]
fn gate_prog_dokladnie_dwa_aktywny() {
    let me = ranged(5.0, 5.0, ATK, 2.0);
    assert!(kite_branch_applies(&me, true, &[me, u(7.0, 5.0, DEF, 2.0)]));
}

/// Pin `:6691`: dd 3 > 2 -> galaz nieaktywna (wektor graniczny).
#[test]
fn gate_prog_trzy_nieaktywny() {
    let me = ranged(5.0, 5.0, ATK, 2.0);
    assert!(!kite_branch_applies(
        &me,
        true,
        &[me, u(8.0, 5.0, DEF, 2.0)]
    ));
}

// --- Wektory z wykonania pina (tests/p6_k5doc_t5a_vectors/vectors.json) ---

fn tile_of(v: &serde_json::Value) -> Option<Tile> {
    v.as_array().map(|a| {
        (
            a[0].as_f64().expect("wspolrzedna q"),
            a[1].as_f64().expect("wspolrzedna r"),
        )
    })
}

/// Kazdy wektor: wynik Rust == wynik wykonania pina (kafelek, wartosc logiczna lub null).
#[test]
fn vectors_zgodne_z_pinem() {
    let cases = vectors();
    let mut n_best_step = 0usize;
    for c in &cases {
        let me = c.unit.to_kite();
        let units: Vec<KiteUnit> = c.others.iter().map(UnitJson::to_kite).collect();
        let occ: Vec<Tile> = c.occupied.iter().map(|[a, b]| (*a, *b)).collect();
        let imp: Vec<Tile> = c.impassable.iter().map(|[a, b]| (*a, *b)).collect();
        match c.kind.as_str() {
            "best_kite" => {
                let t = c.threat.expect("threat w wektorze best_kite");
                let got = best(me, (t[0], t[1]), &units, &occ, &imp);
                assert_eq!(got, tile_of(&c.expect), "{} ({})", c.name, c.pin);
                if got.is_some() {
                    n_best_step += 1;
                }
            }
            "nearest_melee" => {
                let got = nearest_enemy_melee(&me, &units).map(|e| e.tile);
                assert_eq!(got, tile_of(&c.expect), "{} ({})", c.name, c.pin);
            }
            "kite_gate" => {
                let got = kite_branch_applies(&me, c.unit.ranged_kite, &units);
                assert_eq!(Some(got), c.expect.as_bool(), "{} ({})", c.name, c.pin);
            }
            other => panic!("nieznany rodzaj wektora {other}"),
        }
    }
    // Pokrycie: wektory musza obejmowac realne kroki KITE, nie tylko odrzuty.
    assert!(
        n_best_step >= 50,
        "za malo wektorow z krokiem KITE: {n_best_step}"
    );
    assert!(cases.len() >= 700, "za malo wektorow: {}", cases.len());
}
