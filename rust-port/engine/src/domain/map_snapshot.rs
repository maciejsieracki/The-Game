//! Temat wlasciciel: R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1.
//! P6.M17 (R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1): port 1:1 `gra/src/map/mapSnapshot.ts`
//! (1-404, pin edb8fb56) - snapshot mapy do zapisu gry: format kolumnowy (structure-of-arrays)
//! + slownik stringow (interning), kolumny rzadkie dla pol rzadkich i dla `widocznosc`.
//!
//! Eksporty weba -> Rust:
//! - `serializeMapForSave`      -> [`serialize_map_for_save`]
//! - `buildGameMapFromSnapshot` -> [`build_game_map_from_snapshot`]
//! - `isValidMapSnapshot`       -> [`is_valid_map_snapshot`] (na `serde_json::Value`, bo web przyjmuje `unknown`)
//! - `SerializedMapData`, `SparseColumn`, `SparseWidocznosc` -> typy o tych samych nazwach pol JSON
//!   (kolejnosc pol struktury == kolejnosc kluczy literalu weba, wiec tekst JSON jest bajt w bajt ten sam).
//!
//! Zalozenia (numerowane, opis w `dyspozycje/rust-port/p6/P6-M17-SNAPSHOT-MAPY.md`):
//! - Z-M17-1: model heksa/mapy ([`SnapshotHex`], [`SnapshotMap`]) jest lokalny dla tego modulu - M01
//!   (wlasciciel `MapHex`) biegnie rownolegle i ma rozlaczna allowliste; adapter `From` doda integracja.
//! - Z-M17-2: pola tekstowe heksa to `String` (web nie waliduje wartosci enumow, snapshot ich nie zna).
//! - Z-M17-3: dla niepoprawnych indeksow (poza `dict`, poza zakresem `n`/kolumny) web po cichu daje
//!   `undefined` albo rzuca `TypeError`; Rust zwraca [`MapSnapshotError`]. Dla poprawnych indeksow wynik jest 1:1.
//! - Z-M17-4: wspolrzedne `q`/`r` heksow i krawedzie rzek to liczby calkowite (`i32`), jak w reszcie silnika.
//! - Z-M17-5: kolejnosc kluczy obiektu JS (`Object.keys`): klucze-indeksy tablicy rosnaco, potem reszta
//!   w kolejnosci wstawienia - odtworzona w [`JsKeyedMap`] (ma wplyw na kolejnosc internowania w `dict`).
//! - Z-M17-6: liczby JSON: calkowite wypisywane bez czesci ulamkowej jak `JSON.stringify` ([`JsNum`]);
//!   bajtowa zgodnosc tekstu gwarantowana w zakresie |x| < 1e15 (poza nim tylko rownosc wartosci).

use std::collections::HashMap;
use std::fmt;

use serde::{Deserialize, Serialize, Serializer};
use serde_json::Value;

/// Wartosc pola `fmt` formatu kolumnowego (runda 2 weba; `fmt: 2` w typie `SerializedMapData`).
pub const SNAPSHOT_FMT: i64 = 2;
/// Znacznik "brak wlasciciela" w kolumnie `wlascicielIdx` (web: `-1`).
pub const NO_OWNER_IDX: i64 = -1;
/// Najwiekszy indeks tablicy JS (`2^32 - 2`); klucze-indeksy obiektu sa porzadkowane rosnaco przed resztą.
const MAX_ARRAY_INDEX: u64 = 4_294_967_294;

// ---------------------------------------------------------------------------
// Liczba JSON w stylu JS
// ---------------------------------------------------------------------------

/// `number` weba: `f64`, serializowany jak `JSON.stringify` (calkowite bez `.0`, nie-skonczone jako `null`).
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(transparent)]
pub struct JsNum(pub f64);

impl Serialize for JsNum {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let v = self.0;
        if v.is_finite() && v.fract() == 0.0 && v.abs() < 1e15 {
            // `-0` -> "0" jak w JSON.stringify.
            s.serialize_i64(v as i64)
        } else {
            s.serialize_f64(v)
        }
    }
}

// ---------------------------------------------------------------------------
// Obiekt JS z kolejnoscia kluczy
// ---------------------------------------------------------------------------

fn is_array_index_key(k: &str) -> Option<u64> {
    if k.is_empty() || k.len() > 10 || !k.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    if k.len() > 1 && k.starts_with('0') {
        return None;
    }
    let v: u64 = k.parse().ok()?;
    (v <= MAX_ARRAY_INDEX).then_some(v)
}

/// `Record<string, string>` z kolejnoscia `Object.keys`: indeksy tablicy rosnaco, potem kolejnosc wstawienia.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct JsKeyedMap {
    entries: Vec<(String, String)>,
}

impl JsKeyedMap {
    pub fn new() -> Self {
        Self::default()
    }

    /// `obj[key] = value` (istniejacy klucz zachowuje pozycje).
    pub fn set(&mut self, key: &str, value: &str) {
        if let Some(e) = self.entries.iter_mut().find(|(k, _)| k == key) {
            e.1 = value.to_string();
            return;
        }
        match is_array_index_key(key) {
            Some(idx) => {
                let pos = self
                    .entries
                    .iter()
                    .position(|(k, _)| match is_array_index_key(k) {
                        Some(other) => other > idx,
                        None => true,
                    })
                    .unwrap_or(self.entries.len());
                self.entries
                    .insert(pos, (key.to_string(), value.to_string()));
            }
            None => self.entries.push((key.to_string(), value.to_string())),
        }
    }

    /// `Object.entries(obj)`.
    pub fn entries(&self) -> &[(String, String)] {
        &self.entries
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.entries
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

// ---------------------------------------------------------------------------
// Model mapy (lokalny, Z-M17-1)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SnapshotCoords {
    pub q: i32,
    pub r: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SnapshotVillage {
    pub istnieje: bool,
    pub ludnosc: f64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotRiver {
    pub obecna: bool,
    pub krawedzie: Vec<i32>,
}

/// Heks z polami typu `Hex` weba oraz polami dynamicznymi `HexExt` (`zloze`, `zlozeMinEra`,
/// `ulepszenia`, `improvementKey`; `None` = pole nieobecne).
#[derive(Debug, Clone, PartialEq)]
pub struct SnapshotHex {
    pub coords: SnapshotCoords,
    pub teren_bazowy: String,
    pub nakladka: String,
    pub ulepszenie: String,
    pub wlasciciel: Option<String>,
    pub wioska: SnapshotVillage,
    pub widocznosc: JsKeyedMap,
    pub rzeka: SnapshotRiver,
    pub zloze: Option<String>,
    pub zloze_min_era: Option<f64>,
    pub ulepszenia: Option<Vec<String>>,
    pub improvement_key: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct RiverPoint {
    pub q: i32,
    pub r: i32,
}

/// `GameMap` weba. `hexes` = `Object.keys(map.hexes)` w kolejnosci kluczy (para klucz, heks);
/// `river_paths` puste = web `undefined ?? []`.
#[derive(Debug, Clone, PartialEq)]
pub struct SnapshotMap {
    pub szerokosc_q: f64,
    pub wysokosc_r: f64,
    pub seed: f64,
    pub hexes: Vec<(String, SnapshotHex)>,
    pub river_paths: Vec<Vec<RiverPoint>>,
    pub river_path_kinds: Option<Vec<String>>,
}

// ---------------------------------------------------------------------------
// Format snapshotu
// ---------------------------------------------------------------------------

/// Kolumna rzadka: rownolegle `hexIdx[k]` / `val[k]`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SparseColumn<T> {
    #[serde(rename = "hexIdx")]
    pub hex_idx: Vec<i64>,
    pub val: Vec<T>,
}

impl<T> SparseColumn<T> {
    fn empty() -> Self {
        Self {
            hex_idx: Vec::new(),
            val: Vec::new(),
        }
    }
}

/// Trojka rzadka dla `widocznosc` (per heks, per gracz); indeksy `playerIdx`/`valIdx` wskazuja `dict`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SparseWidocznosc {
    #[serde(rename = "hexIdx")]
    pub hex_idx: Vec<i64>,
    #[serde(rename = "playerIdx")]
    pub player_idx: Vec<i64>,
    #[serde(rename = "valIdx")]
    pub val_idx: Vec<i64>,
}

/// `SerializedMapData` (kolejnosc pol == kolejnosc kluczy literalu `serializeMapForSave`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SerializedMapData {
    pub fmt: i64,
    #[serde(rename = "szerokoscQ")]
    pub szerokosc_q: JsNum,
    #[serde(rename = "wysokoscR")]
    pub wysokosc_r: JsNum,
    pub seed: JsNum,
    #[serde(rename = "riverPaths")]
    pub river_paths: Vec<Vec<RiverPoint>>,
    #[serde(
        rename = "riverPathKinds",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub river_path_kinds: Option<Vec<String>>,
    pub dict: Vec<String>,
    pub n: usize,
    pub q: Vec<i32>,
    pub r: Vec<i32>,
    #[serde(rename = "terenIdx")]
    pub teren_idx: Vec<i64>,
    #[serde(rename = "nakladkaIdx")]
    pub nakladka_idx: Vec<i64>,
    #[serde(rename = "ulepszenieIdx")]
    pub ulepszenie_idx: Vec<i64>,
    #[serde(rename = "wlascicielIdx")]
    pub wlasciciel_idx: Vec<i64>,
    #[serde(rename = "wioskaIstnieje")]
    pub wioska_istnieje: Vec<JsNum>,
    #[serde(rename = "wioskaLudnosc")]
    pub wioska_ludnosc: Vec<JsNum>,
    #[serde(rename = "rzekaObecna")]
    pub rzeka_obecna: Vec<JsNum>,
    #[serde(rename = "rzekaKrawedzie")]
    pub rzeka_krawedzie: SparseColumn<Vec<i32>>,
    pub zloze: SparseColumn<i64>,
    #[serde(rename = "zlozeMinEra")]
    pub zloze_min_era: SparseColumn<JsNum>,
    pub ulepszenia: SparseColumn<Vec<i64>>,
    #[serde(rename = "improvementKey")]
    pub improvement_key: SparseColumn<i64>,
    pub widocznosc: SparseWidocznosc,
}

/// Blad odtwarzania mapy z niepoprawnego snapshotu (Z-M17-3).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MapSnapshotError {
    /// Indeks `dict` poza zakresem (web: `undefined` w polu).
    DictIndex { field: &'static str, index: i64 },
    /// Indeks heksa w kolumnie rzadkiej poza `0..n` (web: `TypeError`).
    HexIndex { field: &'static str, index: i64 },
    /// Kolumna gesta krotsza niz `n` albo pary kolumn rzadkich o roznej dlugosci (web: `undefined`/`TypeError`).
    ColumnLength { field: &'static str },
}

impl fmt::Display for MapSnapshotError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DictIndex { field, index } => {
                write!(
                    f,
                    "snapshot mapy: indeks dict {index} poza zakresem ({field})"
                )
            }
            Self::HexIndex { field, index } => {
                write!(
                    f,
                    "snapshot mapy: indeks heksa {index} poza zakresem ({field})"
                )
            }
            Self::ColumnLength { field } => {
                write!(f, "snapshot mapy: za krotka kolumna ({field})")
            }
        }
    }
}

impl std::error::Error for MapSnapshotError {}

// ---------------------------------------------------------------------------
// serializeMapForSave (mapSnapshot.ts:204-298)
// ---------------------------------------------------------------------------

struct Interner {
    dict: Vec<String>,
    index: HashMap<String, i64>,
}

impl Interner {
    fn intern(&mut self, s: &str) -> i64 {
        if let Some(&i) = self.index.get(s) {
            return i;
        }
        let idx = self.dict.len() as i64;
        self.dict.push(s.to_string());
        self.index.insert(s.to_string(), idx);
        idx
    }
}

/// Buduje snapshot z mapy; wszystkie wartosci sa kopiowane (wynik nie dzieli niczego z wejsciem).
pub fn serialize_map_for_save(map: &SnapshotMap) -> SerializedMapData {
    let mut dict = Interner {
        dict: Vec::new(),
        index: HashMap::new(),
    };
    let n = map.hexes.len();

    let mut q = Vec::with_capacity(n);
    let mut r = Vec::with_capacity(n);
    let mut teren_idx = Vec::with_capacity(n);
    let mut nakladka_idx = Vec::with_capacity(n);
    let mut ulepszenie_idx = Vec::with_capacity(n);
    let mut wlasciciel_idx = Vec::with_capacity(n);
    let mut wioska_istnieje = Vec::with_capacity(n);
    let mut wioska_ludnosc = Vec::with_capacity(n);
    let mut rzeka_obecna = Vec::with_capacity(n);

    let mut rzeka_krawedzie = SparseColumn::<Vec<i32>>::empty();
    let mut zloze = SparseColumn::<i64>::empty();
    let mut zloze_min_era = SparseColumn::<JsNum>::empty();
    let mut ulepszenia = SparseColumn::<Vec<i64>>::empty();
    let mut improvement_key = SparseColumn::<i64>::empty();
    let mut widocznosc = SparseWidocznosc {
        hex_idx: Vec::new(),
        player_idx: Vec::new(),
        val_idx: Vec::new(),
    };

    for (i, (_, hex)) in map.hexes.iter().enumerate() {
        let i = i as i64;
        q.push(hex.coords.q);
        r.push(hex.coords.r);
        teren_idx.push(dict.intern(&hex.teren_bazowy));
        nakladka_idx.push(dict.intern(&hex.nakladka));
        ulepszenie_idx.push(dict.intern(&hex.ulepszenie));
        wlasciciel_idx.push(match &hex.wlasciciel {
            None => NO_OWNER_IDX,
            Some(w) => dict.intern(w),
        });
        wioska_istnieje.push(JsNum(if hex.wioska.istnieje { 1.0 } else { 0.0 }));
        wioska_ludnosc.push(JsNum(hex.wioska.ludnosc));
        rzeka_obecna.push(JsNum(if hex.rzeka.obecna { 1.0 } else { 0.0 }));

        if !hex.rzeka.krawedzie.is_empty() {
            rzeka_krawedzie.hex_idx.push(i);
            rzeka_krawedzie.val.push(hex.rzeka.krawedzie.clone());
        }
        // JS: `if (hex.zloze)` - pusty string jest falsy.
        if let Some(z) = hex.zloze.as_deref().filter(|s| !s.is_empty()) {
            zloze.hex_idx.push(i);
            zloze.val.push(dict.intern(z));
        }
        // JS: `!= null` - zero tez trafia do kolumny.
        if let Some(era) = hex.zloze_min_era {
            zloze_min_era.hex_idx.push(i);
            zloze_min_era.val.push(JsNum(era));
        }
        // JS: `if (hex.ulepszenia)` - tablica (takze pusta) jest truthy.
        if let Some(list) = &hex.ulepszenia {
            ulepszenia.hex_idx.push(i);
            let idxs = list.iter().map(|s| dict.intern(s)).collect();
            ulepszenia.val.push(idxs);
        }
        if let Some(k) = hex.improvement_key.as_deref().filter(|s| !s.is_empty()) {
            improvement_key.hex_idx.push(i);
            improvement_key.val.push(dict.intern(k));
        }
        for (player_id, vis) in hex.widocznosc.entries() {
            widocznosc.hex_idx.push(i);
            let p = dict.intern(player_id);
            widocznosc.player_idx.push(p);
            let v = dict.intern(vis);
            widocznosc.val_idx.push(v);
        }
    }

    SerializedMapData {
        fmt: SNAPSHOT_FMT,
        szerokosc_q: JsNum(map.szerokosc_q),
        wysokosc_r: JsNum(map.wysokosc_r),
        seed: JsNum(map.seed),
        river_paths: map.river_paths.clone(),
        river_path_kinds: map.river_path_kinds.clone(),
        dict: dict.dict,
        n,
        q,
        r,
        teren_idx,
        nakladka_idx,
        ulepszenie_idx,
        wlasciciel_idx,
        wioska_istnieje,
        wioska_ludnosc,
        rzeka_obecna,
        rzeka_krawedzie,
        zloze,
        zloze_min_era,
        ulepszenia,
        improvement_key,
        widocznosc,
    }
}

// ---------------------------------------------------------------------------
// buildGameMapFromSnapshot (mapSnapshot.ts:301-352)
// ---------------------------------------------------------------------------

fn dict_get<'a>(
    dict: &'a [String],
    field: &'static str,
    index: i64,
) -> Result<&'a String, MapSnapshotError> {
    usize::try_from(index)
        .ok()
        .and_then(|i| dict.get(i))
        .ok_or(MapSnapshotError::DictIndex { field, index })
}

fn col<'a, T>(v: &'a [T], field: &'static str, i: usize) -> Result<&'a T, MapSnapshotError> {
    v.get(i).ok_or(MapSnapshotError::ColumnLength { field })
}

fn hex_slot<'a>(
    hex_list: &'a mut [SnapshotHex],
    field: &'static str,
    index: i64,
) -> Result<&'a mut SnapshotHex, MapSnapshotError> {
    usize::try_from(index)
        .ok()
        .and_then(|i| hex_list.get_mut(i))
        .ok_or(MapSnapshotError::HexIndex { field, index })
}

fn sparse_pair<'a, T>(
    hex_idx: &'a [i64],
    val: &'a [T],
    field: &'static str,
    k: usize,
) -> Result<(i64, &'a T), MapSnapshotError> {
    let idx = *col(hex_idx, field, k)?;
    Ok((idx, col(val, field, k)?))
}

/// Odtwarza mape ze snapshotu (bez generatora). Kolejnosc `hexes` = kolejnosc pierwszego wstawienia klucza
/// `"q,r"`; przy powtorzonym kluczu wygrywa ostatni heks (jak przypisanie do obiektu JS).
pub fn build_game_map_from_snapshot(
    snap: &SerializedMapData,
) -> Result<SnapshotMap, MapSnapshotError> {
    let dict = &snap.dict;
    let n = snap.n;
    let mut hex_list: Vec<SnapshotHex> = Vec::with_capacity(n);

    for i in 0..n {
        let qi = *col(&snap.q, "q", i)?;
        let ri = *col(&snap.r, "r", i)?;
        let owner_idx = *col(&snap.wlasciciel_idx, "wlascicielIdx", i)?;
        let hex = SnapshotHex {
            coords: SnapshotCoords { q: qi, r: ri },
            teren_bazowy: dict_get(dict, "terenIdx", *col(&snap.teren_idx, "terenIdx", i)?)?
                .clone(),
            nakladka: dict_get(
                dict,
                "nakladkaIdx",
                *col(&snap.nakladka_idx, "nakladkaIdx", i)?,
            )?
            .clone(),
            ulepszenie: dict_get(
                dict,
                "ulepszenieIdx",
                *col(&snap.ulepszenie_idx, "ulepszenieIdx", i)?,
            )?
            .clone(),
            wlasciciel: if owner_idx == NO_OWNER_IDX {
                None
            } else {
                Some(dict_get(dict, "wlascicielIdx", owner_idx)?.clone())
            },
            wioska: SnapshotVillage {
                istnieje: col(&snap.wioska_istnieje, "wioskaIstnieje", i)?.0 == 1.0,
                ludnosc: col(&snap.wioska_ludnosc, "wioskaLudnosc", i)?.0,
            },
            widocznosc: JsKeyedMap::new(),
            rzeka: SnapshotRiver {
                obecna: col(&snap.rzeka_obecna, "rzekaObecna", i)?.0 == 1.0,
                krawedzie: Vec::new(),
            },
            zloze: None,
            zloze_min_era: None,
            ulepszenia: None,
            improvement_key: None,
        };
        hex_list.push(hex);
    }

    let sc = &snap.rzeka_krawedzie;
    for k in 0..sc.hex_idx.len() {
        let (idx, val) = sparse_pair(&sc.hex_idx, &sc.val, "rzekaKrawedzie", k)?;
        hex_slot(&mut hex_list, "rzekaKrawedzie", idx)?
            .rzeka
            .krawedzie = val.clone();
    }
    let sc = &snap.zloze;
    for k in 0..sc.hex_idx.len() {
        let (idx, val) = sparse_pair(&sc.hex_idx, &sc.val, "zloze", k)?;
        let text = dict_get(dict, "zloze", *val)?.clone();
        hex_slot(&mut hex_list, "zloze", idx)?.zloze = Some(text);
    }
    let sc = &snap.zloze_min_era;
    for k in 0..sc.hex_idx.len() {
        let (idx, val) = sparse_pair(&sc.hex_idx, &sc.val, "zlozeMinEra", k)?;
        hex_slot(&mut hex_list, "zlozeMinEra", idx)?.zloze_min_era = Some(val.0);
    }
    let sc = &snap.ulepszenia;
    for k in 0..sc.hex_idx.len() {
        let (idx, val) = sparse_pair(&sc.hex_idx, &sc.val, "ulepszenia", k)?;
        let items = val
            .iter()
            .map(|di| dict_get(dict, "ulepszenia", *di).cloned())
            .collect::<Result<Vec<_>, _>>()?;
        hex_slot(&mut hex_list, "ulepszenia", idx)?.ulepszenia = Some(items);
    }
    let sc = &snap.improvement_key;
    for k in 0..sc.hex_idx.len() {
        let (idx, val) = sparse_pair(&sc.hex_idx, &sc.val, "improvementKey", k)?;
        let text = dict_get(dict, "improvementKey", *val)?.clone();
        hex_slot(&mut hex_list, "improvementKey", idx)?.improvement_key = Some(text);
    }
    let w = &snap.widocznosc;
    for k in 0..w.hex_idx.len() {
        let idx = w.hex_idx[k];
        let player = dict_get(
            dict,
            "widocznosc.playerIdx",
            *col(&w.player_idx, "widocznosc.playerIdx", k)?,
        )?
        .clone();
        let vis = dict_get(
            dict,
            "widocznosc.valIdx",
            *col(&w.val_idx, "widocznosc.valIdx", k)?,
        )?
        .clone();
        hex_slot(&mut hex_list, "widocznosc", idx)?
            .widocznosc
            .set(&player, &vis);
    }

    // `hexes[`${q},${r}`] = hex` - powtorzony klucz zachowuje pozycje, wartosc to ostatni heks.
    let mut hexes: Vec<(String, SnapshotHex)> = Vec::with_capacity(n);
    let mut position: HashMap<String, usize> = HashMap::with_capacity(n);
    for hex in hex_list {
        let key = format!("{},{}", hex.coords.q, hex.coords.r);
        match position.get(&key) {
            Some(&p) => hexes[p].1 = hex,
            None => {
                position.insert(key.clone(), hexes.len());
                hexes.push((key, hex));
            }
        }
    }

    Ok(SnapshotMap {
        szerokosc_q: snap.szerokosc_q.0,
        wysokosc_r: snap.wysokosc_r.0,
        seed: snap.seed.0,
        hexes,
        river_paths: snap.river_paths.clone(),
        river_path_kinds: snap.river_path_kinds.clone(),
    })
}

// ---------------------------------------------------------------------------
// isValidMapSnapshot (mapSnapshot.ts:365-404)
// ---------------------------------------------------------------------------

/// Pole obiektu JSON; `None` dla nie-obiektu (JS: odczyt wlasciwosci prymitywu/tablicy daje `undefined`).
fn field<'a>(v: &'a Value, key: &str) -> Option<&'a Value> {
    v.as_object().and_then(|o| o.get(key))
}

fn js_number(v: Option<&Value>) -> Option<f64> {
    match v {
        Some(Value::Number(n)) => n.as_f64(),
        _ => None,
    }
}

fn array_len(v: Option<&Value>) -> Option<usize> {
    match v {
        Some(Value::Array(a)) => Some(a.len()),
        _ => None,
    }
}

/// Minimalna walidacja ksztaltu snapshotu (wartosci wewnatrz kolumn celowo NIE sa sprawdzane - jak w webie).
pub fn is_valid_map_snapshot(snap: &Value) -> bool {
    // `!snap || typeof snap !== 'object'`: null i prymitywy odpadaja; tablica jest obiektem, ale nie ma pol.
    if !snap.is_object() && !snap.is_array() {
        return false;
    }
    if js_number(field(snap, "fmt")) != Some(SNAPSHOT_FMT as f64) {
        return false;
    }
    match js_number(field(snap, "szerokoscQ")) {
        Some(w) if w > 0.0 => {}
        _ => return false,
    }
    match js_number(field(snap, "wysokoscR")) {
        Some(h) if h > 0.0 => {}
        _ => return false,
    }
    if js_number(field(snap, "seed")).is_none() {
        return false;
    }
    if array_len(field(snap, "riverPaths")).is_none() {
        return false;
    }
    let n = match js_number(field(snap, "n")) {
        Some(n) if n > 0.0 => n,
        _ => return false,
    };
    if array_len(field(snap, "dict")).is_none() {
        return false;
    }

    const DENSE: [&str; 9] = [
        "q",
        "r",
        "terenIdx",
        "nakladkaIdx",
        "ulepszenieIdx",
        "wlascicielIdx",
        "wioskaIstnieje",
        "wioskaLudnosc",
        "rzekaObecna",
    ];
    for f in DENSE {
        match array_len(field(snap, f)) {
            Some(len) if len as f64 == n => {}
            _ => return false,
        }
    }

    const SPARSE: [&str; 5] = [
        "rzekaKrawedzie",
        "zloze",
        "zlozeMinEra",
        "ulepszenia",
        "improvementKey",
    ];
    for f in SPARSE {
        let Some(sc) = field(snap, f) else {
            return false;
        };
        match (array_len(field(sc, "hexIdx")), array_len(field(sc, "val"))) {
            (Some(a), Some(b)) if a == b => {}
            _ => return false,
        }
    }

    let Some(wid) = field(snap, "widocznosc") else {
        return false;
    };
    match (
        array_len(field(wid, "hexIdx")),
        array_len(field(wid, "playerIdx")),
        array_len(field(wid, "valIdx")),
    ) {
        (Some(a), Some(b), Some(c)) if a == b && a == c => {}
        _ => return false,
    }

    true
}
