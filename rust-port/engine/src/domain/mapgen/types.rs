//! P6.M01 — model heksa mapy `MapHex` (port `gra/src/types/hex.ts`, pin `07d2fbd72`).
//! Temat wlasciciel: R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1 (model MapHex, ZALOZENIE Z2 z P6-25 §9).
//! Realizacja (M01-R2): dispatch w dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1.
//!
//! Odwzorowanie 1:1 nazw pol i wartosci JSON. Zrodla (pin `07d2fbd72`, plik `gra/src/types/hex.ts`):
//! - enumy: `TerenBazowy` :12-24, `Nakladka` :30-39, `Ulepszenie` :45-54, `Widocznosc` :60-64;
//! - struktury: `HexCoords` :71-74, `Wioska` :81-86, `RzekaInfo` :93-101, `Hex` (tu `MapHex`) :107-140.
//!
//! Decyzje i ich dowody: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1/02a-obrona.md`
//! (wpis do `dyspozycje/rust-port/REJESTR-RUST.md` robi orkiestrator, rejestr jest poza allowlista):
//! - JSON enumow = wartosci z webu (snake_case, np. `plytkie_morze`), jawne `#[serde(rename)]`
//!   na kazdym wariancie; nazwy wariantow w kodzie sa Rustowe (`PlytkieMorze`).
//! - `HexCoords` = istniejacy `domain::hex::HexCoord` (ten sam ksztalt `{q, r}`, `s = -q-r` liczone).
//! - `wlasciciel` = `Option<PlayerId>` (web: playerId lub null); id gracza w JSON jako liczba,
//!   zgodnie z kontraktem silnika dla wlascicieli. Pole jest wymagane (null, nie brak klucza).
//! - `widocznosc` = `BTreeMap<PlayerId, Widocznosc>`; brak klucza = `Nieodkryty` (`visibility_for`).
//! - Generator mapy (`generate_map`) NIE jest w tym module; tu tylko typ, serde i dostep.
#![forbid(unsafe_code)]

use std::collections::BTreeMap;

use serde::{Deserialize, Deserializer, Serialize};

use crate::domain::hex::HexCoord;
use crate::domain::PlayerId;

/// Web `HexCoords` (hex.ts:71-74): wspolrzedne aksjalne `{q, r}`; `s = -q-r` nie jest przechowywane.
pub type HexCoords = HexCoord;

/// Typ terenu bazowego (hex.ts:12-24).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TerenBazowy {
    #[serde(rename = "laka")]
    Laka,
    #[serde(rename = "rownina")]
    Rownina,
    #[serde(rename = "wzgorza")]
    Wzgorza,
    #[serde(rename = "gory")]
    Gory,
    /// Web `PlytkieMorze = 'plytkie_morze'` (hex.ts:19): teren wodny.
    #[serde(rename = "plytkie_morze")]
    PlytkieMorze,
    #[serde(rename = "morze")]
    Morze,
    #[serde(rename = "pustynia")]
    Pustynia,
    /// Web `Polarny = 'polarny'` (hex.ts:23): strefa polarna, niezamieszkana.
    #[serde(rename = "polarny")]
    Polarny,
}

/// Nakladka na teren: las, zloze albo brak (hex.ts:30-39).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Nakladka {
    #[serde(rename = "brak")]
    Brak,
    #[serde(rename = "las")]
    Las,
    #[serde(rename = "zloze_gliny")]
    ZlozeGliny,
    #[serde(rename = "zloze_rudy")]
    ZlozeRudy,
    #[serde(rename = "zloze_konia")]
    ZlozeKonia,
    #[serde(rename = "zloze_owiec")]
    ZlozeOwiec,
    #[serde(rename = "zloze_bydla")]
    ZlozeBydla,
    /// Web `ZlozeLamy = 'zloze_lamy'` (hex.ts:38): tylko Inkowie / Ameryka Pd.
    #[serde(rename = "zloze_lamy")]
    ZlozeLamy,
}

/// Ulepszenie terenu budowane przez robotnika (hex.ts:45-54).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Ulepszenie {
    #[serde(rename = "brak")]
    Brak,
    #[serde(rename = "farma")]
    Farma,
    #[serde(rename = "irygacja")]
    Irygacja,
    #[serde(rename = "kopalnia")]
    Kopalnia,
    #[serde(rename = "droga")]
    Droga,
    #[serde(rename = "droga_brukowana")]
    DrogaBrukowana,
    #[serde(rename = "pastwisko")]
    Pastwisko,
    #[serde(rename = "tartak")]
    Tartak,
}

/// Widocznosc heksa z perspektywy jednego gracza (fog of war; hex.ts:60-64).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Widocznosc {
    #[serde(rename = "nieodkryty")]
    Nieodkryty,
    #[serde(rename = "odkryty")]
    Odkryty,
    #[serde(rename = "widoczny")]
    Widoczny,
}

/// Wioska na heksie (hex.ts:81-86). Bez wioski: `istnieje = false`, `ludnosc = 0`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Wioska {
    pub istnieje: bool,
    pub ludnosc: u32,
}

/// Rzeka na krawedziach heksa (hex.ts:93-101). `krawedzie` to indeksy 0-5 (flat-top); puste gdy `obecna = false`.
/// Zakres 0-5 i puste-gdy-brak NIE sa egzekwowane przy deserializacji (web tez nie waliduje, to komentarze;
/// decyzja Z3b w 02a-obrona.md). Typ `u8` odrzuca wartosci powyzej 255.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RzekaInfo {
    pub obecna: bool,
    pub krawedzie: Vec<u8>,
}

/// Postac JSON web `HexCoords` (hex.ts:71-74): dokladnie pola `q` i `r`. Nieznane pole (np. `s`) jest bledem.
/// Osobna struktura, bo wspolny `domain::hex::HexCoord` nie ma `deny_unknown_fields` (poza allowlista).
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct HexCoordsWire {
    q: i32,
    r: i32,
}

fn strict_coords<'de, D>(deserializer: D) -> Result<HexCoords, D::Error>
where
    D: Deserializer<'de>,
{
    let wire = HexCoordsWire::deserialize(deserializer)?;
    Ok(HexCoord::new(wire.q, wire.r))
}

/// Pole, ktore w JSON MUSI byc obecne, ale moze miec wartosc `null` (web: `string | null`).
/// Zwykly `Option<T>` w serde traktuje brak klucza jako `None`; tu brak klucza jest bledem.
fn required_nullable<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Option::<T>::deserialize(deserializer)
}

/// Pojedynczy heks mapy swiata (web `Hex`, hex.ts:107-140). Wszystkie pola zawsze obecne.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MapHex {
    /// Pozycja na mapie (hex.ts:109).
    #[serde(deserialize_with = "strict_coords")]
    pub coords: HexCoords,
    /// Typ terenu bazowego (hex.ts:112).
    pub teren_bazowy: TerenBazowy,
    /// Nakladka na teren (hex.ts:118).
    pub nakladka: Nakladka,
    /// Ulepszenie zbudowane przez robotnika (hex.ts:121).
    pub ulepszenie: Ulepszenie,
    /// Wlasciciel heksa; `None` = niczyje (hex.ts:127).
    #[serde(deserialize_with = "required_nullable")]
    pub wlasciciel: Option<PlayerId>,
    /// Wioska i jej ludnosc (hex.ts:130).
    pub wioska: Wioska,
    /// Widocznosc per gracz; brak klucza = `Nieodkryty` (hex.ts:136).
    pub widocznosc: BTreeMap<PlayerId, Widocznosc>,
    /// Rzeka na krawedziach (hex.ts:139).
    pub rzeka: RzekaInfo,
}

impl MapHex {
    /// Widocznosc heksa dla gracza. Brak klucza w `widocznosc` oznacza `Nieodkryty` (hex.ts:134).
    pub fn visibility_for(&self, player: PlayerId) -> Widocznosc {
        self.widocznosc
            .get(&player)
            .copied()
            .unwrap_or(Widocznosc::Nieodkryty)
    }
}
