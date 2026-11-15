//! P4-1B-Q3 (R-RUSTPORT-P4-1B-Q3-MAP-VIEW): producent `MapViewDto` (mapa statyczna) i
//! `HexDynDto` (warstwa dynamiczna heksow) z modelu mapy, kontrakt DTO §3.2, D-DTO-4 = A
//! (silnik liczy `roadMask` i trasy rzek do renderu).
//!
//! Web (pin `07d2fbd72`, `gra/src/...`):
//! - kolejnosc heksow: kontrakt §1.4 (`r`-major, `q`-minor; `map/generator.ts:216-219`). Model
//!   [`SnapshotMap`] ma kolejnosc `Object.keys(map.hexes)` (kolejnosc wstawienia kluczy), wiec
//!   producent sortuje JAWNIE po `(r, q)` i nie polega na kolejnosci wejscia;
//! - `rivers[i]` = `riverPaths[i]` + `riverPathKinds[i]` (`types/map.ts:43-49`), `None` gdy
//!   tablica rodzajow nie istnieje albo jest krotsza;
//! - `riverRenderPaths[i]`: lancuch `render/scene.ts:1306-1318` — `kinds[i] ?? 'main'`;
//!   `mainPathsForJunction` = trasy `main`; `medium` -> `trimMediumRenderPathAtMain`, potem
//!   `mediumRiverRenderPath`; pozostale -> `landRiverRenderPath`. Wejscie rodzajow jak
//!   `scene.ts:2873-2874` (`riverPathKinds ?? paths.map(() => 'main')`). Filtr etapu
//!   (`filterRiverPathsForStage`) i filtry dlugosci (`:1310-1311`, `:1319-1320`) zostaja w
//!   rendererze (P4-1G): producent liczy trase dla KAZDEJ rzeki, 1:1 z `rivers`;
//! - `roadMask`: `computeRoadMask(q, r, hexHasRoadAt)` (`main.ts:17083`, `map/road-network.ts:75-86`)
//!   dla kazdego heksa, takze bez drogi; `hexHasRoadAt` (`main.ts:3144-3147`): heks spoza mapy
//!   (brak klucza `keyOf(q, r)`) = brak drogi, bez filtra mgly i bez zawijania mapy;
//! - `terraces`: `improvementKeysForHex(hex)` zawiera `'tarasy'` (rozpoznanie §1.3);
//!   `coveringImprovement`: `hexHasCoveringTerrainImprovement` (`game/terrain-improvements.ts:388-392`);
//! - `villagePresent`: `hex.wioska.istnieje` i brak miasta na heksie (`main.ts:3366-3368`,
//!   „miasto zastepuje wioske”).
//!
//! Decyzje techniczne (zapisane w raporcie operatora):
//! - Z-Q3-1 (dispatch): zrodlo mapy = `&SnapshotMap` (jedyny model z kompletem pol).
//! - Z-Q3-2: producent zwraca `Result`: DTO jest typowany (enumy `Terrain`, `Nakladka`,
//!   `Ulepszenie`, `RiverKind`, krawedzie `u8`, wymiary `u32`), a pola `SnapshotMap` sa tekstowe
//!   (Z-M17-2). Wartosc spoza enuma weba nie ma reprezentacji w DTO -> [`MapViewError`] zamiast
//!   cichej podmiany.
//! - Z-Q3-3: miasta przekazuje wolajacy jako wspolrzedne heksow (`cities.some(c => c.q === q &&
//!   c.r === r)` czyta tylko pozycje).
//! - Z-Q3-4: klucz heksa w mapie to klucz wpisu `SnapshotMap.hexes` (web `map.hexes[keyOf(q, r)]`).

use std::collections::HashSet;
use std::fmt;

use civ_view_model::{
    HexCoord, HexDynDto, HexStaticDto, MapViewDto, Nakladka, RiverKind, RiverPathDto,
    Terrain as ViewTerrain, Ulepszenie,
};

use crate::domain::improvements::{
    hex_has_covering_terrain_improvement, improvement_keys_for_hex, HexLike,
};
use crate::domain::map_generator::Terrain;
use crate::domain::map_snapshot::{RiverPoint, SnapshotHex, SnapshotMap};
use crate::domain::mapgen::prims::hex_key;
use crate::domain::mapgen::rivers_a::render_trim::trim_medium_render_path_at_main;
use crate::domain::mapgen::rivers_a::{
    land_river_render_path, medium_river_render_path, RiverCoord,
};
use crate::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use crate::domain::road_network::compute_road_mask;
use crate::domain::roads::hex_has_road;

/// Klucz ulepszenia tarasow (`terrain-improvements.json`, `scene.ts:2465`, `main.ts:17076`).
const TARASY: &str = "tarasy";

/// Wartosc modelu mapy bez reprezentacji w DTO (Z-Q3-2).
#[derive(Debug, Clone, PartialEq)]
pub enum MapViewError {
    /// `szerokoscQ` / `wysokoscR` nie jest liczba calkowita w `0..=u32::MAX`.
    Dimension { field: &'static str, value: f64 },
    /// `terenBazowy` spoza `TerenBazowy` (`types/hex.ts:11-23`).
    UnknownTerrain { hex: String, value: String },
    /// `nakladka` spoza `Nakladka` (`types/hex.ts:30-39`).
    UnknownNakladka { hex: String, value: String },
    /// `ulepszenie` spoza `Ulepszenie` (`types/hex.ts:45-54`).
    UnknownUlepszenie { hex: String, value: String },
    /// `riverPathKinds[index]` spoza `'main' | 'medium' | 'short' | 'tributary'` (`types/map.ts:49`).
    UnknownRiverKind { index: usize, value: String },
    /// Krawedz rzeki spoza `u8` (zakres `0..=5` sprawdza `civ_view_model::validate_map`).
    RiverEdge { hex: String, value: i32 },
    /// Wspolrzedna trasy do renderu poza `i32` (naprawa sasiedztwa doklada sasiadow).
    Coord { river: usize, q: i64, r: i64 },
}

impl fmt::Display for MapViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Dimension { field, value } => {
                write!(f, "map view: {field} = {value} nie jest wymiarem u32")
            }
            Self::UnknownTerrain { hex, value } => {
                write!(f, "map view: heks {hex}: nieznany terenBazowy {value:?}")
            }
            Self::UnknownNakladka { hex, value } => {
                write!(f, "map view: heks {hex}: nieznana nakladka {value:?}")
            }
            Self::UnknownUlepszenie { hex, value } => {
                write!(f, "map view: heks {hex}: nieznane ulepszenie {value:?}")
            }
            Self::UnknownRiverKind { index, value } => {
                write!(f, "map view: riverPathKinds[{index}] = {value:?} nieznany")
            }
            Self::RiverEdge { hex, value } => {
                write!(f, "map view: heks {hex}: krawedz rzeki {value} poza u8")
            }
            Self::Coord { river, q, r } => {
                write!(f, "map view: trasa rzeki {river}: ({q},{r}) poza i32")
            }
        }
    }
}

impl std::error::Error for MapViewError {}

/// `TerenBazowy` (wartosci tekstowe weba) -> teren DTO i teren modulu rzek (`mapgen`).
fn parse_terrain(hex: &str, value: &str) -> Result<(ViewTerrain, Terrain), MapViewError> {
    Ok(match value {
        "laka" => (ViewTerrain::Laka, Terrain::Grassland),
        "rownina" => (ViewTerrain::Rownina, Terrain::Plains),
        "wzgorza" => (ViewTerrain::Wzgorza, Terrain::Hills),
        "gory" => (ViewTerrain::Gory, Terrain::Mountains),
        "plytkie_morze" => (ViewTerrain::PlytkieMorze, Terrain::ShallowSea),
        "morze" => (ViewTerrain::Morze, Terrain::Sea),
        "pustynia" => (ViewTerrain::Pustynia, Terrain::Desert),
        "polarny" => (ViewTerrain::Polarny, Terrain::Polar),
        _ => {
            return Err(MapViewError::UnknownTerrain {
                hex: hex.to_string(),
                value: value.to_string(),
            })
        }
    })
}

fn parse_nakladka(hex: &str, value: &str) -> Result<Nakladka, MapViewError> {
    Ok(match value {
        "brak" => Nakladka::Brak,
        "las" => Nakladka::Las,
        "zloze_gliny" => Nakladka::ZlozeGliny,
        "zloze_rudy" => Nakladka::ZlozeRudy,
        "zloze_konia" => Nakladka::ZlozeKonia,
        "zloze_owiec" => Nakladka::ZlozeOwiec,
        "zloze_bydla" => Nakladka::ZlozeBydla,
        "zloze_lamy" => Nakladka::ZlozeLamy,
        _ => {
            return Err(MapViewError::UnknownNakladka {
                hex: hex.to_string(),
                value: value.to_string(),
            })
        }
    })
}

fn parse_ulepszenie(hex: &str, value: &str) -> Result<Ulepszenie, MapViewError> {
    Ok(match value {
        "brak" => Ulepszenie::Brak,
        "farma" => Ulepszenie::Farma,
        "irygacja" => Ulepszenie::Irygacja,
        "kopalnia" => Ulepszenie::Kopalnia,
        "droga" => Ulepszenie::Droga,
        "droga_brukowana" => Ulepszenie::DrogaBrukowana,
        "pastwisko" => Ulepszenie::Pastwisko,
        "tartak" => Ulepszenie::Tartak,
        _ => {
            return Err(MapViewError::UnknownUlepszenie {
                hex: hex.to_string(),
                value: value.to_string(),
            })
        }
    })
}

/// `riverPathKinds[i]` (`types/map.ts:49`).
pub fn parse_river_kind(index: usize, value: &str) -> Result<RiverKind, MapViewError> {
    Ok(match value {
        "main" => RiverKind::Main,
        "medium" => RiverKind::Medium,
        "short" => RiverKind::Short,
        "tributary" => RiverKind::Tributary,
        _ => {
            return Err(MapViewError::UnknownRiverKind {
                index,
                value: value.to_string(),
            })
        }
    })
}

fn dimension(field: &'static str, value: f64) -> Result<u32, MapViewError> {
    if value.is_finite() && value.fract() == 0.0 && (0.0..=f64::from(u32::MAX)).contains(&value) {
        // Calkowita w zakresie u32 (sprawdzone wyzej).
        Ok(value as u32)
    } else {
        Err(MapViewError::Dimension { field, value })
    }
}

/// Heksy mapy w porzadku kontraktu §1.4: JAWNE sortowanie po `(r, q)` (kolejnosc
/// `SnapshotMap.hexes` = kolejnosc wstawienia kluczy, nie jest gwarantowana).
/// Sortowanie stabilne: przy powtorzonej wspolrzednej (mapa niezgodna z kontraktem) zostaje
/// kolejnosc wejscia, a `validate_map` zglosi duplikat.
pub fn sorted_hexes(map: &SnapshotMap) -> Vec<&(String, SnapshotHex)> {
    let mut hexes: Vec<&(String, SnapshotHex)> = map.hexes.iter().collect();
    hexes.sort_by_key(|(_, h)| (h.coords.r, h.coords.q));
    hexes
}

/// `map.hexes` jako rekord modulu rzek (teren dla `land/medium/repair`), klucz wpisu = klucz weba.
pub fn river_hex_record(map: &SnapshotMap) -> Result<HexRecord, MapViewError> {
    let mut record = HexRecord::new();
    for (key, hex) in &map.hexes {
        let (_, terrain) = parse_terrain(key, &hex.teren_bazowy)?;
        let mut th = TerrainHex::new(i64::from(hex.coords.q), i64::from(hex.coords.r), terrain);
        th.river_present = hex.rzeka.obecna;
        record.insert(key.clone(), th);
    }
    Ok(record)
}

/// `rivers[i]` = `riverPaths[i]` + `riverPathKinds[i]` (`None`, gdy tablicy rodzajow brak albo
/// jest krotsza — web `undefined`).
pub fn build_rivers(map: &SnapshotMap) -> Result<Vec<RiverPathDto>, MapViewError> {
    let kinds = map.river_path_kinds.as_deref().unwrap_or(&[]);
    map.river_paths
        .iter()
        .enumerate()
        .map(|(i, path)| {
            let kind = match kinds.get(i) {
                Some(k) => Some(parse_river_kind(i, k)?),
                None => None,
            };
            Ok(RiverPathDto {
                hexes: path.iter().map(|p| HexCoord::new(p.q, p.r)).collect(),
                kind,
            })
        })
        .collect()
}

fn river_coords(path: &[RiverPoint]) -> Vec<RiverCoord> {
    path.iter()
        .map(|p| RiverCoord::new(i64::from(p.q), i64::from(p.r)))
        .collect()
}

/// Lancuch `render/scene.ts:1306-1318` dla kazdej trasy (bez filtrow etapu i dlugosci, ktore
/// zostaja w rendererze). `kinds[i]` = `None` znaczy `'main'` (`kinds[pi] ?? 'main'`).
pub fn river_render_paths(
    hexes: &HexRecord,
    paths: &[Vec<RiverPoint>],
    kinds: &[Option<RiverKind>],
) -> Result<Vec<Vec<HexCoord>>, MapViewError> {
    let kind_of = |i: usize| kinds.get(i).copied().flatten().unwrap_or(RiverKind::Main);
    let coords: Vec<Vec<RiverCoord>> = paths.iter().map(|p| river_coords(p)).collect();
    // `scene.ts:1306`: `paths.filter((_, i) => (kinds[i] ?? 'main') === 'main')`.
    let main_paths: Vec<Vec<RiverCoord>> = coords
        .iter()
        .enumerate()
        .filter(|(i, _)| kind_of(*i) == RiverKind::Main)
        .map(|(_, p)| p.clone())
        .collect();
    coords
        .iter()
        .enumerate()
        .map(|(i, path)| {
            // `scene.ts:1312-1318`.
            let land = if kind_of(i) == RiverKind::Medium {
                let for_render = trim_medium_render_path_at_main(path, &main_paths);
                medium_river_render_path(hexes, &for_render)
            } else {
                land_river_render_path(hexes, path)
            };
            land.iter()
                .map(|c| match (i32::try_from(c.q), i32::try_from(c.r)) {
                    (Ok(q), Ok(r)) => Ok(HexCoord::new(q, r)),
                    _ => Err(MapViewError::Coord {
                        river: i,
                        q: c.q,
                        r: c.r,
                    }),
                })
                .collect()
        })
        .collect()
}

/// `MapViewDto` z mapy (kontrakt §3.2): wymiary, ziarno, heksy `r`-major po jawnym sortowaniu,
/// `rivers` i `riverRenderPaths` 1:1 z `rivers`.
///
/// # Errors
/// Wartosc mapy bez reprezentacji w DTO ([`MapViewError`], Z-Q3-2).
pub fn build_map_view(map: &SnapshotMap) -> Result<MapViewDto, MapViewError> {
    let width = dimension("szerokoscQ", map.szerokosc_q)?;
    let height = dimension("wysokoscR", map.wysokosc_r)?;
    let hexes = sorted_hexes(map)
        .into_iter()
        .map(|(key, hex)| {
            let (teren_bazowy, _) = parse_terrain(key, &hex.teren_bazowy)?;
            let rzeka_krawedzie = hex
                .rzeka
                .krawedzie
                .iter()
                .map(|&e| {
                    u8::try_from(e).map_err(|_| MapViewError::RiverEdge {
                        hex: key.clone(),
                        value: e,
                    })
                })
                .collect::<Result<Vec<u8>, _>>()?;
            Ok(HexStaticDto {
                coord: HexCoord::new(hex.coords.q, hex.coords.r),
                teren_bazowy,
                rzeka_krawedzie,
            })
        })
        .collect::<Result<Vec<_>, MapViewError>>()?;
    let rivers = build_rivers(map)?;
    let kinds: Vec<Option<RiverKind>> = rivers.iter().map(|r| r.kind).collect();
    let record = river_hex_record(map)?;
    let river_render_paths = river_render_paths(&record, &map.river_paths, &kinds)?;
    Ok(MapViewDto {
        width,
        height,
        seed: map.seed,
        hexes,
        rivers,
        river_render_paths,
    })
}

/// Heks w ksztalcie czytanym przez `terrain-improvements.ts` / `road-movement.ts`
/// (`ulepszenie`, `ulepszenia`; `nakladka` i `zloze` nie wplywaja na liste kluczy).
fn hex_like(hex: &SnapshotHex) -> HexLike {
    HexLike {
        ulepszenie: Some(hex.ulepszenie.clone()),
        ulepszenia: hex.ulepszenia.clone(),
        nakladka: None,
        zloze: hex.zloze.clone(),
    }
}

/// Zbior kluczy heksow z droga (`hexHasRoad`), podstawa predykatu `hexHasRoadAt`.
pub fn road_hex_keys(map: &SnapshotMap) -> HashSet<&str> {
    map.hexes
        .iter()
        .filter(|(_, hex)| hex_has_road(&hex_like(hex)))
        .map(|(key, _)| key.as_str())
        .collect()
}

/// Web `hexHasRoadAt(q, r)` (`main.ts:3144-3147`): `!!hex && hexHasRoad(hex)` dla
/// `map.hexes[keyOf(q, r)]`; heks spoza mapy (brak klucza) = `false`.
pub fn hex_has_road_at(road_keys: &HashSet<&str>, q: i32, r: i32) -> bool {
    road_keys.contains(hex_key(i64::from(q), i64::from(r)).as_str())
}

/// `HexDynDto` dla kazdego heksa w porzadku [`build_map_view`] (`hexState[i]` nalezy do
/// `map.hexes[i]`). `city_hexes` = pozycje wszystkich miast na mapie (Z-Q3-3).
///
/// # Errors
/// `nakladka` / `ulepszenie` spoza enumow weba ([`MapViewError`], Z-Q3-2).
pub fn build_hex_dyn(
    map: &SnapshotMap,
    city_hexes: &[HexCoord],
) -> Result<Vec<HexDynDto>, MapViewError> {
    let road_keys = road_hex_keys(map);
    let cities: HashSet<HexCoord> = city_hexes.iter().copied().collect();
    sorted_hexes(map)
        .into_iter()
        .map(|(key, hex)| {
            let like = hex_like(hex);
            let (q, r) = (hex.coords.q, hex.coords.r);
            Ok(HexDynDto {
                nakladka: parse_nakladka(key, &hex.nakladka)?,
                ulepszenie: parse_ulepszenie(key, &hex.ulepszenie)?,
                ulepszenia: hex.ulepszenia.clone(),
                improvement_key: hex.improvement_key.clone(),
                zloze: hex.zloze.clone(),
                village_present: hex.wioska.istnieje && !cities.contains(&HexCoord::new(q, r)),
                terraces: improvement_keys_for_hex(&like).iter().any(|k| k == TARASY),
                covering_improvement: hex_has_covering_terrain_improvement(&like),
                road_mask: compute_road_mask(q, r, |nq, nr| hex_has_road_at(&road_keys, nq, nr)),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::map_snapshot::{JsKeyedMap, SnapshotCoords, SnapshotRiver, SnapshotVillage};

    fn hex(q: i32, r: i32, teren: &str, ulepszenie: &str) -> (String, SnapshotHex) {
        (
            format!("{q},{r}"),
            SnapshotHex {
                coords: SnapshotCoords { q, r },
                teren_bazowy: teren.into(),
                nakladka: "brak".into(),
                ulepszenie: ulepszenie.into(),
                wlasciciel: None,
                wioska: SnapshotVillage {
                    istnieje: q == 1 && r == 0,
                    ludnosc: 1.0,
                },
                widocznosc: JsKeyedMap::new(),
                rzeka: SnapshotRiver {
                    obecna: false,
                    krawedzie: vec![],
                },
                zloze: None,
                zloze_min_era: None,
                ulepszenia: None,
                improvement_key: None,
            },
        )
    }

    /// Mapa 2x2 wstawiona w kolejnosci q-major; droga na (0,0) i (1,1).
    fn map2x2() -> SnapshotMap {
        SnapshotMap {
            szerokosc_q: 2.0,
            wysokosc_r: 2.0,
            seed: 7.0,
            hexes: vec![
                hex(0, 0, "laka", "droga"),
                hex(0, 1, "rownina", "brak"),
                hex(1, 0, "wzgorza", "farma"),
                hex(1, 1, "morze", "droga_brukowana"),
            ],
            river_paths: vec![],
            river_path_kinds: None,
        }
    }

    #[test]
    fn heksy_r_major_i_maska_bez_sasiadow_spoza_mapy() {
        let m = map2x2();
        let v = build_map_view(&m).expect("view");
        let order: Vec<(i32, i32)> = v.hexes.iter().map(|h| (h.coord.q, h.coord.r)).collect();
        assert_eq!(order, vec![(0, 0), (1, 0), (0, 1), (1, 1)]);
        assert_eq!(v.hexes[3].teren_bazowy, ViewTerrain::Morze);
        let d = build_hex_dyn(&m, &[]).expect("dyn");
        // (0,0): sasiedzi w mapie (1,0) [kier. 0] i (0,1) [kier. 5] — bez drogi.
        assert_eq!(d[0].road_mask, 0);
        // (1,0): sasiedzi w mapie (0,0) [kier. 3], (0,1) [kier. 4], (1,1) [kier. 5].
        assert_eq!(d[1].road_mask, (1 << 3) | (1 << 5));
        // (0,1): sasiedzi w mapie (1,1) [kier. 0], (1,0) [kier. 1], (0,0) [kier. 2].
        assert_eq!(d[2].road_mask, (1 << 0) | (1 << 2));
        assert!(d[1].village_present);
        let d = build_hex_dyn(&m, &[HexCoord::new(1, 0)]).expect("dyn");
        assert!(!d[1].village_present, "miasto zastepuje wioske");
        assert!(d[1].covering_improvement && !d[0].covering_improvement);
    }

    #[test]
    fn wymiary_i_rodzaje() {
        assert_eq!(dimension("w", 3.0), Ok(3));
        assert!(dimension("w", -1.0).is_err());
        assert!(dimension("w", f64::NAN).is_err());
        assert!(dimension("w", 4_294_967_296.0).is_err());
        assert_eq!(parse_river_kind(0, "tributary"), Ok(RiverKind::Tributary));
        assert!(parse_river_kind(0, "Main").is_err());
        let mut m = map2x2();
        m.river_paths = vec![vec![RiverPoint { q: 0, r: 0 }], vec![]];
        m.river_path_kinds = Some(vec!["medium".into()]);
        let v = build_map_view(&m).expect("view");
        assert_eq!(v.rivers[0].kind, Some(RiverKind::Medium));
        assert_eq!(v.rivers[1].kind, None);
        assert_eq!(v.river_render_paths.len(), 2);
    }
}
