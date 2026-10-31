//! P6.1C (R-RUSTPORT-P6-1C-START-KLASTRA-Q1) - stan poczatkowy: start klastra, posiew lamy
//! Inkow i dostep do brazu. Port 1:1 trzech plikow weba (pin `edb8fb56`):
//!
//! - `gra/src/game/cluster-start.ts` -> [`build_cluster_start_plan`] (+ `pickSecondHumanStartHex`
//!   i `displayLabelForSlot` z `gra/src/map/cluster-spawn.ts`, wolane wprost przez cluster-start),
//! - `gra/src/game/inca-llama-seed.ts` -> [`seed_inca_llama_deposits`],
//! - `gra/src/game/braz-access.ts` -> [`empire_has_kopalnia_miedzi`], [`city_has_piec_hutniczy`],
//!   [`has_braz_access`].
//!
//! Granice portu (jawne, patrz `dyspozycje/rust-port/p6/P6-1C.md`):
//! - Wejsciem [`build_cluster_start_plan`] jest wynik `buildClusterSpawnPlan` (mapgen klastrow,
//!   `map/cluster-spawn.ts` + `map/clusters.ts`), ktorego ten temat NIE portuje. Pole `placement`
//!   (`ClusterPlacement`) jest tylko przepuszczane przez web i nie ma tu odpowiednika.
//! - Wybor nazwy miasta (`pickNextCityName`, civ-names / city-names-pool) jest wstrzykiwany przez
//!   [`CityNamePicker`]; jego port nalezy do tematu P6.1B.
//! - Kolejnosc wstawiania webowych `Map`/`Set` jest zachowana (wektory `Vec` w kolejnosci wstawienia).
//!
//! Stale balansowe (prog dystansu miast-panstw, promien i liczba lam, ulamek puli drugiego
//! czlowieka, identyfikatory lancucha brazu) leza w `data/derived/start-*.json`. W kodzie zostaja
//! wylacznie stale ALGORYTMICZNE (maska ziarna, mnozniki hasha), ktore sa tozsamoscia generatora.

use std::collections::{BTreeMap, BTreeSet};
use std::{error::Error, fmt};

use super::diplomacy::{Relation, RelationStatus};
use super::hex::HexCoord;
use super::improvement_build::hex_disk_offsets;
use super::map_generator::Terrain;
use super::rng::Mulberry32;
use super::PlayerId;
use crate::data::civilizations::parse_diplomacy;
use crate::data::derived::{start_braz_access, start_cluster_params, start_llama_params};
use crate::data::economy_society::parse_miasto_params;
use crate::data::terrain_map::parse_terrain_improvements;

/// Maska ziarna `pickSecondHumanStartHex` (web `cluster-spawn.ts:504`, `seed ^ 0x5eed2f00`).
/// Stala algorytmiczna (rozdziela strumien RNG drugiego czlowieka od reszty klastra), nie balans.
const SECOND_HUMAN_SEED_XOR: u32 = 0x5eed_2f00;
/// Mnozniki hasha `hashPos` (web `inca-llama-seed.ts:22-26`). Tozsamosc hasha, nie balans.
const HASH_MUL_Q: u32 = 0x27d4_eb2d;
const HASH_MUL_R: u32 = 0x1656_67b1;
const HASH_MUL_SEED: u32 = 0x9e37_79b1;
const HASH_MUL_FINAL: u32 = 0x2c1b_3c6d;
/// `4294967296` z `hashPos` (`/ 4294967296`).
const UNIT_SCALE: f64 = 4_294_967_296.0;

// ---------------------------------------------------------------------------
// cluster-start.ts
// ---------------------------------------------------------------------------

/// Web `HumanDistanceMode` (`cluster-spawn.ts:445`): `'blisko' | 'daleko' | 'losowo'`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HumanDistanceMode {
    Blisko,
    Daleko,
    Losowo,
}

impl HumanDistanceMode {
    /// Wartosc webowa (`'blisko' | 'daleko' | 'losowo'`).
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "blisko" => Some(Self::Blisko),
            "daleko" => Some(Self::Daleko),
            "losowo" => Some(Self::Losowo),
            _ => None,
        }
    }
}

/// Web `ClusterSpawnSlot` (`cluster-spawn.ts:35`). `is_cluster_capital` jest opcjonalne jak w
/// webie (`isClusterCapital?: boolean`; brak = falsz).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClusterSpawnSlot {
    pub owner_id: PlayerId,
    pub hex: HexCoord,
    pub city_name: String,
    pub typ: String,
    pub is_same_type_rival: bool,
    pub is_player_capital: bool,
    pub is_cluster_capital: Option<bool>,
}

/// Web `ForeignTypeClusterGroup` (`cluster-spawn.ts:48`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForeignTypeClusterGroup {
    pub typ: String,
    pub owner_ids: Vec<PlayerId>,
    pub positions: Vec<HexCoord>,
}

/// Web `ClusterSpawnPlan` (`cluster-spawn.ts:54`) bez pola `placement` (`ClusterPlacement` z
/// mapgenu klastrow; cluster-start przepuszcza je bez odczytu logiki).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClusterSpawnPlan {
    pub player_start_hex: HexCoord,
    pub player_start_city_name: String,
    pub slots: Vec<ClusterSpawnSlot>,
    pub foreign_type_clusters: Vec<ForeignTypeClusterGroup>,
    pub pending_same_type_rivals: u32,
    pub pending_same_type_rival_hexes: Vec<HexCoord>,
    pub cluster_capital_owner_ids: Vec<PlayerId>,
    pub pending_same_type_rival_owner_ids: Vec<PlayerId>,
}

/// Web `ClusterStartPlan` (`cluster-start.ts:28`). Mapy i zbiory webu sa wektorami w kolejnosci
/// wstawienia (iteracja `Map`/`Set` w JS jest porzadkiem wstawiania).
#[derive(Debug, Clone, PartialEq)]
pub struct ClusterStartPlan {
    pub player_start_hex: HexCoord,
    pub player_start_city_name: String,
    pub second_player_start_hex: Option<HexCoord>,
    pub second_player_owner_id: Option<PlayerId>,
    pub ai_start_hexes: Vec<(HexCoord, PlayerId)>,
    /// `(heks, ownerId, nazwa)`.
    pub spawn_cities: Vec<(HexCoord, PlayerId, String)>,
    pub foreign_type_clusters: Vec<ForeignTypeClusterGroup>,
    pub ai_owner_civ_map: Vec<(PlayerId, String)>,
    pub owner_display_name: Vec<(PlayerId, String)>,
    pub simplified_diplomacy_owners: Vec<PlayerId>,
    pub foreign_type_owners: Vec<PlayerId>,
    pub typ_city_copy_owners: Vec<PlayerId>,
    pub start_relations: Vec<(PlayerId, Relation)>,
    pub pending_same_type_rivals: u32,
    pub pending_same_type_rival_hexes: Vec<HexCoord>,
    pub pending_same_type_rival_owner_ids: Vec<PlayerId>,
    pub pending_same_type_rivals_second: u32,
    pub pending_same_type_rival_owner_ids_second: Vec<PlayerId>,
    pub cluster_capital_owner_ids: Vec<PlayerId>,
}

/// Czesc `BuildClusterStartInput` (`cluster-start.ts:83`) czytana przez sama logike startu.
/// Pola przekazywane wylacznie do `buildClusterSpawnPlan` (mapa, cywilizacje, rywale na klaster,
/// epoka, preferowane typy) naleza do jego wyniku, nie do tego wejscia.
#[derive(Debug, Clone, Copy)]
pub struct BuildClusterStartInput<'a> {
    pub seed: u32,
    pub player_civ_id: &'a str,
    pub second_human_civ_id: Option<&'a str>,
    pub human_distance_mode: Option<HumanDistanceMode>,
    pub second_human_owner_id: Option<PlayerId>,
}

/// Wstrzykiwany wybor nazwy miasta (web `pickNextCityName(pools, typ, usedNames, fallback)`,
/// wolany tylko gdy `input.cityNamesPools` jest podane). `used_names` w kolejnosci wstawienia.
pub trait CityNamePicker {
    fn pick_next_city_name(
        &mut self,
        civ_typ: &str,
        used_names: &[String],
        fallback: &str,
    ) -> String;
}

/// Bledy [`build_cluster_start_plan`] (web rzuca `Error`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ClusterStartError {
    /// ABC-Q3: fotel 2 nie moze wybrac tej samej cywilizacji co fotel 1.
    DuplicateHumanCiv { civ_id: String },
}

impl fmt::Display for ClusterStartError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DuplicateHumanCiv { civ_id } => write!(
                formatter,
                "buildClusterStartPlan: secondHumanCivId ('{civ_id}') nie może być \
                 identyczne z playerCivId — ABC-Q3, wykluczenie duplikatu cywilizacji fotela 2."
            ),
        }
    }
}

impl Error for ClusterStartError {}

/// Web `MIN_CITY_DISTANCE` (`cities.ts:1120`): `miastoParams.min_dystans_miast.wartosc`.
pub fn min_city_distance() -> u32 {
    static VALUE: std::sync::OnceLock<u32> = std::sync::OnceLock::new();
    *VALUE.get_or_init(|| {
        let params = parse_miasto_params().expect("miasto-params.json must parse");
        u32::try_from(params.min_dystans_miast.wartosc)
            .expect("miasto-params.json: min_dystans_miast.wartosc musi byc >= 0")
    })
}

/// Web `MIN_CITY_DISTANCE_START_CITY_STATE` (`cities.ts:1122`), z `start-cluster-params.json`.
pub fn min_city_distance_start_city_state() -> u32 {
    start_cluster_params()
        .min_dystans_miast_start_miasto_panstwo
        .wartosc
}

/// Web `startRelationForPair(sameType)` (`diplomacy-layers.ts:42`): zaufanie startowe plus
/// modyfikator typu (rywalizacja tego samego typu albo roznica kulturowa), obciete do
/// przedzialu z `start-cluster-params.json`; respekt = `startRespekt`; status `neutralni`.
pub fn start_relation_for_pair(same_type: bool) -> Relation {
    static PARAMS: std::sync::OnceLock<(f64, f64, f64, f64)> = std::sync::OnceLock::new();
    let (start_trust, same_type_delta, cultural_delta, start_respect) = *PARAMS.get_or_init(|| {
        let params = parse_diplomacy().expect("diplomacy.json must parse").params;
        (
            params.start_zaufanie as f64,
            params.rywalizacja_ten_sam_typ_zaufanie as f64,
            params.roznica_kulturowa_zaufanie as f64,
            params.start_respekt as f64,
        )
    });
    let range = &start_cluster_params().start_relacja.przedzial_zaufania;
    let trust = start_trust
        + if same_type {
            same_type_delta
        } else {
            cultural_delta
        };
    Relation {
        trust: trust.clamp(range.min, range.max),
        respect: start_respect,
        status: RelationStatus::Neutral,
    }
}

/// Web `landHexesFromMap` (`cluster-spawn.ts:71`, funkcja prywatna): heksy bez wody, gor i terenu
/// polarnego, w kolejnosci mapy (kolejnosc ma znaczenie: sortowanie kandydatow jest stabilne).
pub fn land_hexes_from_terrain(
    tiles: impl IntoIterator<Item = (HexCoord, Terrain)>,
) -> Vec<HexCoord> {
    tiles
        .into_iter()
        .filter(|(_, terrain)| {
            !terrain.is_water() && *terrain != Terrain::Mountains && *terrain != Terrain::Polar
        })
        .map(|(hex, _)| hex)
        .collect()
}

/// Web `pickSecondHumanStartHex` (`cluster-spawn.ts:477`). `land` w kolejnosci mapy;
/// `occupied_hexes` wykluczane tym samym progiem `min_distance` co dystans od `primary_hex`.
pub fn pick_second_human_start_hex(
    land: &[HexCoord],
    primary_hex: HexCoord,
    mode: HumanDistanceMode,
    seed: u32,
    min_distance: u32,
    occupied_hexes: &[HexCoord],
) -> Option<HexCoord> {
    let mut with_dist: Vec<(HexCoord, u32)> = land
        .iter()
        .map(|hex| (*hex, hex.distance(primary_hex)))
        .filter(|(_, distance)| *distance >= min_distance)
        .filter(|(hex, _)| {
            occupied_hexes
                .iter()
                .all(|occupied| hex.distance(*occupied) >= min_distance)
        })
        .collect();
    if with_dist.is_empty() {
        return None;
    }
    with_dist.sort_by_key(|(_, distance)| *distance);

    let fraction = start_cluster_params()
        .drugi_czlowiek_pula_blisko_daleko_ulamek
        .wartosc;
    let pool_count = || ((with_dist.len() as f64 * fraction).ceil() as usize).max(1);
    let pool: &[(HexCoord, u32)] = match mode {
        HumanDistanceMode::Blisko => &with_dist[..pool_count()],
        HumanDistanceMode::Daleko => &with_dist[with_dist.len() - pool_count()..],
        HumanDistanceMode::Losowo => &with_dist,
    };

    let mut rng = Mulberry32::new(seed ^ SECOND_HUMAN_SEED_XOR);
    let index = ((rng.next_f64() * pool.len() as f64).floor() as usize).min(pool.len() - 1);
    pool.get(index).map(|(hex, _)| *hex)
}

/// Web `displayLabelForSlot` (`cluster-spawn.ts:511`): etykieta bazowa = nazwa miasta slotu.
pub fn display_label_for_slot(slot: &ClusterSpawnSlot) -> &str {
    &slot.city_name
}

fn ordered_map_set<K: PartialEq, V>(map: &mut Vec<(K, V)>, key: K, value: V) {
    if let Some(entry) = map.iter_mut().find(|(existing, _)| *existing == key) {
        entry.1 = value;
    } else {
        map.push((key, value));
    }
}

fn ordered_set_add<T: PartialEq>(set: &mut Vec<T>, value: T) {
    if !set.contains(&value) {
        set.push(value);
    }
}

/// `Math.max(0, ...ids) + 1`.
fn next_free_owner_id(ids: impl IntoIterator<Item = PlayerId>) -> PlayerId {
    PlayerId::new(ids.into_iter().map(PlayerId::get).max().unwrap_or(0) + 1)
}

/// Web `buildClusterStartPlan` (`cluster-start.ts:128`). `spawn_plan` = wynik
/// `buildClusterSpawnPlan`; `land_hexes` = [`land_hexes_from_terrain`] mapy; `name_picker` =
/// `Some` odpowiada podanym `cityNamesPools`.
pub fn build_cluster_start_plan(
    input: &BuildClusterStartInput<'_>,
    spawn_plan: &ClusterSpawnPlan,
    land_hexes: &[HexCoord],
    mut name_picker: Option<&mut dyn CityNamePicker>,
) -> Result<ClusterStartPlan, ClusterStartError> {
    if input.second_human_civ_id == Some(input.player_civ_id) {
        return Err(ClusterStartError::DuplicateHumanCiv {
            civ_id: input.player_civ_id.to_owned(),
        });
    }

    let min_distance = min_city_distance();
    let min_distance_city_state = min_city_distance_start_city_state();
    let fallback_name = &start_cluster_params().nazwa_miasta_zastepcza.wartosc;

    let mut ai_owner_civ_map: Vec<(PlayerId, String)> = Vec::new();
    let mut owner_display_name: Vec<(PlayerId, String)> = Vec::new();
    let mut simplified_diplomacy_owners: Vec<PlayerId> = Vec::new();
    let mut foreign_type_owners: Vec<PlayerId> = Vec::new();
    let mut typ_city_copy_owners: Vec<PlayerId> = Vec::new();
    let mut start_relations: Vec<(PlayerId, Relation)> = Vec::new();
    let mut spawn_cities: Vec<(HexCoord, PlayerId, String)> = Vec::new();
    let mut ai_start_hexes: Vec<(HexCoord, PlayerId)> = Vec::new();
    let mut accepted_owner_ids: Vec<PlayerId> = Vec::new();

    // (heks, czy miasto-panstwo) - gracz + juz zaakceptowane sloty.
    let mut accepted_for_distance: Vec<(HexCoord, bool)> =
        vec![(spawn_plan.player_start_hex, false)];
    let mut accepted_names_by_civ: Vec<(String, Vec<String>)> = Vec::new();

    for slot in &spawn_plan.slots {
        let slot_is_city_state =
            slot.is_same_type_rival || !slot.is_cluster_capital.unwrap_or(false);
        let collides = accepted_for_distance
            .iter()
            .any(|(prev_hex, prev_city_state)| {
                let threshold = if *prev_city_state || slot_is_city_state {
                    min_distance_city_state
                } else {
                    min_distance
                };
                slot.hex.distance(*prev_hex) < threshold
            });
        if collides {
            continue;
        }

        let used_index = accepted_names_by_civ
            .iter()
            .position(|(typ, _)| *typ == slot.typ)
            .unwrap_or_else(|| {
                accepted_names_by_civ.push((slot.typ.clone(), Vec::new()));
                accepted_names_by_civ.len() - 1
            });
        let accepted_name = match name_picker.as_deref_mut() {
            Some(picker) => {
                let fallback = if slot.city_name.is_empty() {
                    fallback_name.as_str()
                } else {
                    slot.city_name.as_str()
                };
                picker.pick_next_city_name(
                    &slot.typ,
                    &accepted_names_by_civ[used_index].1,
                    fallback,
                )
            }
            None => slot.city_name.clone(),
        };
        ordered_set_add(
            &mut accepted_names_by_civ[used_index].1,
            accepted_name.clone(),
        );
        let mut accepted_slot = slot.clone();
        if accepted_name != slot.city_name {
            accepted_slot.city_name = accepted_name;
        }

        let owner = accepted_slot.owner_id;
        ordered_map_set(&mut ai_owner_civ_map, owner, accepted_slot.typ.clone());
        ordered_map_set(
            &mut owner_display_name,
            owner,
            display_label_for_slot(&accepted_slot).to_owned(),
        );
        if accepted_slot.is_same_type_rival {
            ordered_set_add(&mut simplified_diplomacy_owners, owner);
        } else {
            ordered_set_add(&mut foreign_type_owners, owner);
        }
        if !accepted_slot.is_cluster_capital.unwrap_or(false) {
            ordered_set_add(&mut typ_city_copy_owners, owner);
        }
        ordered_map_set(
            &mut start_relations,
            owner,
            start_relation_for_pair(accepted_slot.is_same_type_rival),
        );

        spawn_cities.push((accepted_slot.hex, owner, accepted_slot.city_name.clone()));
        ai_start_hexes.push((accepted_slot.hex, owner));
        accepted_for_distance.push((accepted_slot.hex, slot_is_city_state));
        ordered_set_add(&mut accepted_owner_ids, owner);
    }

    let mut promoted_capital_owner_ids: Vec<PlayerId> = Vec::new();
    let mut foreign_type_clusters: Vec<ForeignTypeClusterGroup> = Vec::new();
    for group in &spawn_plan.foreign_type_clusters {
        let mut owner_ids: Vec<PlayerId> = Vec::new();
        let mut positions: Vec<HexCoord> = Vec::new();
        for (index, owner_id) in group.owner_ids.iter().enumerate() {
            if !accepted_owner_ids.contains(owner_id) {
                continue;
            }
            let Some(position) = group.positions.get(index) else {
                continue;
            };
            owner_ids.push(*owner_id);
            positions.push(*position);
        }
        if owner_ids.is_empty() {
            continue;
        }
        let substitute_capital = owner_ids[0];
        foreign_type_clusters.push(ForeignTypeClusterGroup {
            typ: group.typ.clone(),
            owner_ids,
            positions,
        });

        if let Some(original_capital) = group.owner_ids.first() {
            if !accepted_owner_ids.contains(original_capital) {
                promoted_capital_owner_ids.push(substitute_capital);
                typ_city_copy_owners.retain(|owner| *owner != substitute_capital);
            }
        }
    }
    let mut cluster_capital_owner_ids: Vec<PlayerId> = spawn_plan
        .cluster_capital_owner_ids
        .iter()
        .copied()
        .filter(|owner| accepted_owner_ids.contains(owner))
        .collect();
    cluster_capital_owner_ids.extend(promoted_capital_owner_ids);

    let mut second_player_start_hex: Option<HexCoord> = None;
    let mut second_player_owner_id: Option<PlayerId> = None;
    if input.second_human_civ_id.is_some() {
        let mode = input.human_distance_mode.unwrap_or_else(|| {
            HumanDistanceMode::parse(&start_cluster_params().drugi_czlowiek_tryb_domyslny.wartosc)
                .expect("start-cluster-params.json: nieznany drugi_czlowiek_tryb_domyslny")
        });
        let occupied_hexes: Vec<HexCoord> = ai_start_hexes
            .iter()
            .map(|(hex, _)| *hex)
            .chain(spawn_plan.pending_same_type_rival_hexes.iter().copied())
            .collect();
        second_player_start_hex = pick_second_human_start_hex(
            land_hexes,
            spawn_plan.player_start_hex,
            mode,
            input.seed,
            min_distance_city_state,
            &occupied_hexes,
        );
        if second_player_start_hex.is_some() {
            let reserved = ai_start_hexes
                .iter()
                .map(|(_, owner)| *owner)
                .chain(spawn_plan.pending_same_type_rival_owner_ids.iter().copied());
            second_player_owner_id = Some(
                input
                    .second_human_owner_id
                    .unwrap_or_else(|| next_free_owner_id(reserved)),
            );
        }
    }

    let mut pending_owner_ids_second: Vec<PlayerId> = Vec::new();
    if let (Some(_), Some(second_owner)) = (second_player_start_hex, second_player_owner_id) {
        let reserved = ai_start_hexes
            .iter()
            .map(|(_, owner)| *owner)
            .chain(spawn_plan.pending_same_type_rival_owner_ids.iter().copied())
            .chain(std::iter::once(second_owner));
        let first_rival_owner_id = next_free_owner_id(reserved).get();
        pending_owner_ids_second.extend(
            (first_rival_owner_id..)
                .take(spawn_plan.pending_same_type_rivals as usize)
                .map(PlayerId::new),
        );
    }
    let pending_same_type_rivals_second = u32::try_from(pending_owner_ids_second.len())
        .expect("liczba rywali drugiego fotela miesci sie w u32");

    Ok(ClusterStartPlan {
        player_start_hex: spawn_plan.player_start_hex,
        player_start_city_name: spawn_plan.player_start_city_name.clone(),
        second_player_start_hex,
        second_player_owner_id,
        ai_start_hexes,
        spawn_cities,
        foreign_type_clusters,
        ai_owner_civ_map,
        owner_display_name,
        simplified_diplomacy_owners,
        foreign_type_owners,
        typ_city_copy_owners,
        start_relations,
        pending_same_type_rivals: spawn_plan.pending_same_type_rivals,
        pending_same_type_rival_hexes: spawn_plan.pending_same_type_rival_hexes.clone(),
        pending_same_type_rival_owner_ids: spawn_plan.pending_same_type_rival_owner_ids.clone(),
        pending_same_type_rivals_second,
        pending_same_type_rival_owner_ids_second: pending_owner_ids_second,
        cluster_capital_owner_ids,
    })
}

// ---------------------------------------------------------------------------
// inca-llama-seed.ts
// ---------------------------------------------------------------------------

/// Web `Nakladka` (`types/hex.ts:30`): nakladka na teren bazowy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Overlay {
    Brak,
    Las,
    ZlozeGliny,
    ZlozeRudy,
    ZlozeKonia,
    ZlozeOwiec,
    ZlozeBydla,
    ZlozeLamy,
}

impl Overlay {
    /// Wartosc webowa enumu `Nakladka`.
    pub fn from_web_value(value: &str) -> Option<Self> {
        match value {
            "brak" => Some(Self::Brak),
            "las" => Some(Self::Las),
            "zloze_gliny" => Some(Self::ZlozeGliny),
            "zloze_rudy" => Some(Self::ZlozeRudy),
            "zloze_konia" => Some(Self::ZlozeKonia),
            "zloze_owiec" => Some(Self::ZlozeOwiec),
            "zloze_bydla" => Some(Self::ZlozeBydla),
            "zloze_lamy" => Some(Self::ZlozeLamy),
            _ => None,
        }
    }

    pub const fn web_value(self) -> &'static str {
        match self {
            Self::Brak => "brak",
            Self::Las => "las",
            Self::ZlozeGliny => "zloze_gliny",
            Self::ZlozeRudy => "zloze_rudy",
            Self::ZlozeKonia => "zloze_konia",
            Self::ZlozeOwiec => "zloze_owiec",
            Self::ZlozeBydla => "zloze_bydla",
            Self::ZlozeLamy => "zloze_lamy",
        }
    }
}

/// Heks mapy w zakresie wymaganym przez posiew lamy: teren bazowy, nakladka i runtime-owe pole
/// `zloze` (zloze metali/soli; web `(hex as { zloze?: string }).zloze`, niepusty napis = zajete).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StartMapHex {
    pub terrain: Terrain,
    pub overlay: Overlay,
    pub runtime_deposit: Option<String>,
}

/// Web `hashPos` (`inca-llama-seed.ts:21`): deterministyczny hash pozycji + ziarna w `[0, 1)`.
pub fn hash_pos(seed: u32, q: i32, r: i32) -> f64 {
    let mut h = (q as u32).wrapping_mul(HASH_MUL_Q)
        ^ (r as u32).wrapping_mul(HASH_MUL_R)
        ^ seed.wrapping_mul(HASH_MUL_SEED);
    h ^= h >> 15;
    h = h.wrapping_mul(HASH_MUL_FINAL);
    h ^= h >> 12;
    f64::from(h) / UNIT_SCALE
}

/// Web `hexKeysWithinRadius` (`okolica.ts:66`): heksy mapy w promieniu, w kolejnosci petli
/// `dq` (zewnetrzna) i `dr` (wewnetrzna).
pub fn hex_keys_within_radius(
    center: HexCoord,
    radius: u32,
    map: &BTreeMap<HexCoord, StartMapHex>,
) -> Vec<HexCoord> {
    let radius = i32::try_from(radius).expect("promien miesci sie w i32");
    hex_disk_offsets(radius)
        .into_iter()
        .map(|(dq, dr)| HexCoord::new(center.q + dq, center.r + dr))
        .filter(|hex| map.contains_key(hex))
        .collect()
}

/// Web `seedIncaLlamaDeposits` (`inca-llama-seed.ts:35`): dosiewa `ZlozeLamy` na wzgorzach i
/// gorach wokol startow Inkow. `per_start` / `radius` = `None` -> wartosci z
/// `start-llama-params.json` (webowe wartosci domyslne parametrow). Zwraca liczbe posianych zloz.
pub fn seed_inca_llama_deposits(
    map: &mut BTreeMap<HexCoord, StartMapHex>,
    seed: u32,
    inca_starts: &[HexCoord],
    avoid: &BTreeSet<HexCoord>,
    per_start: Option<u32>,
    radius: Option<u32>,
) -> usize {
    let per_start =
        per_start.unwrap_or_else(|| start_llama_params().zloza_na_start.wartosc) as usize;
    let radius = radius.unwrap_or_else(|| start_llama_params().promien_regionu_startowego.wartosc);
    let mut seeded = 0;
    let mut used_global: BTreeSet<HexCoord> = BTreeSet::new();
    for start in inca_starts {
        let mut candidates: Vec<(HexCoord, f64)> = Vec::new();
        for key in hex_keys_within_radius(*start, radius, map) {
            if avoid.contains(&key) || used_global.contains(&key) {
                continue;
            }
            let Some(hex) = map.get(&key) else {
                continue;
            };
            if hex.terrain != Terrain::Hills && hex.terrain != Terrain::Mountains {
                continue;
            }
            if hex.overlay != Overlay::Brak {
                continue;
            }
            if hex
                .runtime_deposit
                .as_deref()
                .is_some_and(|deposit| !deposit.is_empty())
            {
                continue;
            }
            candidates.push((key, hash_pos(seed, key.q, key.r)));
        }
        // Stabilne sortowanie rosnaco po hashu (JS `Array.prototype.sort` jest stabilne).
        candidates.sort_by(|a, b| a.1.total_cmp(&b.1));
        for (key, _) in candidates.iter().take(per_start) {
            if let Some(hex) = map.get_mut(key) {
                hex.overlay = Overlay::ZlozeLamy;
            }
            used_global.insert(*key);
            seeded += 1;
        }
    }
    seeded
}

// ---------------------------------------------------------------------------
// braz-access.ts
// ---------------------------------------------------------------------------

/// Warstwy ulepszen postawione na heksie (web `string | readonly string[]`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlacedImprovement {
    Single(String),
    Layers(Vec<String>),
}

/// Argument `empireStock` z `hasBrazAccess`: `Record<string, number>`, `Map` (traktowany jak brak
/// zapasu) albo `null`/`undefined`.
#[derive(Debug, Clone, Copy)]
pub enum EmpireStockArg<'a> {
    Absent,
    Stock(&'a BTreeMap<String, f64>),
    PlacedImprovementsMap,
}

fn improvement_keys() -> &'static BTreeSet<String> {
    static KEYS: std::sync::OnceLock<BTreeSet<String>> = std::sync::OnceLock::new();
    KEYS.get_or_init(|| {
        let file = parse_terrain_improvements().expect("terrain-improvements.json must parse");
        let value = serde_json::to_value(file).expect("terrain-improvements.json serializes");
        value
            .as_object()
            .expect("terrain-improvements.json is an object")
            .keys()
            .cloned()
            .collect()
    })
}

/// Web `normalizeImprovementKey` (`terrain-improvements.ts:109`), w zakresie danych z
/// `terrain-improvements.json` (tak jak `IMPROVEMENTS[key]` w webie, razem z kluczami `_meta`).
/// Klucze prototypu JS (`constructor`, `toString`...) sa POZA domena: web zwraca je jako
/// "istniejace", Rust nie - bez wplywu na wynik braz-access (porownanie z `kopalnia_miedzi`).
/// To NIE jest `resource_production::normalize_improvement_key` (inna semantyka: tamta zna tylko
/// ulepszenia produkujace surowce).
pub fn web_normalize_improvement_key(raw: &str) -> Option<String> {
    if raw.is_empty() || raw == "brak" {
        return None;
    }
    let aliases = &start_braz_access().aliasy_kluczy_ulepszen.wartosc;
    let key = aliases.get(raw).map_or(raw, String::as_str);
    let known = improvement_keys();
    if known.contains(key) {
        Some(key.to_owned())
    } else if known.contains(raw) {
        Some(raw.to_owned())
    } else {
        None
    }
}

fn improvement_keys_on_placed(improvement: &PlacedImprovement) -> Vec<String> {
    match improvement {
        PlacedImprovement::Single(key) => web_normalize_improvement_key(key).into_iter().collect(),
        PlacedImprovement::Layers(keys) => keys
            .iter()
            .filter_map(|key| web_normalize_improvement_key(key))
            .collect(),
    }
}

/// Web `empireHasKopalniaMiedzi` (`braz-access.ts:25`): `placed` to wartosci mapy
/// `placedImprovements` (`None` = brak mapy).
pub fn empire_has_kopalnia_miedzi<'a>(
    placed: Option<impl IntoIterator<Item = &'a PlacedImprovement>>,
) -> bool {
    let Some(placed) = placed else {
        return false;
    };
    let copper_key = &start_braz_access().ulepszenie_zrodlo_miedzi.wartosc;
    placed
        .into_iter()
        .any(|improvement| improvement_keys_on_placed(improvement).contains(copper_key))
}

/// Web `cityHasPiecHutniczy` (`braz-access.ts:38`): odlewnia brazu albo jej ulepszenie.
pub fn city_has_piec_hutniczy(built_ids: &[String]) -> bool {
    let table = start_braz_access();
    built_ids.contains(&table.budynek_odlewnia_brazu.wartosc)
        || table
            .budynki_ulepszenia_odlewni
            .wartosc
            .iter()
            .any(|upgrade| built_ids.contains(upgrade))
}

/// Web `hasBrazAccess` (`braz-access.ts:45`): Braz w magazynie panstwa, a gdy podano budynki
/// miasta - dodatkowo odlewnia w miescie.
pub fn has_braz_access(empire_stock: EmpireStockArg<'_>, built_ids: Option<&[String]>) -> bool {
    let stock_key = &start_braz_access().klucz_magazynu_brazu.wartosc;
    let has_stock = match empire_stock {
        EmpireStockArg::Stock(stock) => stock.get(stock_key).copied().unwrap_or(0.0) > 0.0,
        EmpireStockArg::Absent | EmpireStockArg::PlacedImprovementsMap => false,
    };
    match built_ids {
        None => has_stock,
        Some(ids) => has_stock && city_has_piec_hutniczy(ids),
    }
}
