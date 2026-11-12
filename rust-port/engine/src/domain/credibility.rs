//! P6-WIRE-WAR-CRED-Q1: rejestr wiarygodnosci cywilizacji (port 1:1 z pinu).
//!
//! Pin (tylko odczyt) `07d2fbd72f758705f8e1d59cc4968027ffbafe75`:
//! - rdzen czysty `gra/src/game/diplomacy-credibility.ts`: typy `CredibilityEvent` (:67-85), `CredibilityEventRecord`
//!   (:113), `appendCredibilityEvent` (:131), `wartoscBiezaca` (:187), `sumaWiarygodnosci` (:207),
//!   `CredibilityStreamEvent` (:245), `CredibilityStreamEntry` (:275), `credibilityStreamWeight` (:290),
//!   `sumaStrumienia` (:318), `freshCredibilityStreamEntry` (:327), `tickCredibilityStreamEntry` (:340),
//!   `sumaWiarygodnosciCalkowita` (:362), `wiarygodnoscBand` (:50), `wiarygodnoscStartowa` (:72);
//! - stan i haki w domknieciu `gra/src/main.ts`: mapy per wlasciciel (:9976-9992), `getWiarygodnoscEvents` (:12002),
//!   `appendWiarygodnoscEvent` (:12012), `getWiarygodnosc` (:12029), `wiarygodnoscStreamKey` (:12041),
//!   `tickWiarygodnoscStreamFor` (:12045), `tickWiarygodnoscBezWojnyMilestone` (:12058),
//!   `updateWiarygodnoscStreamsThisTurn` (:24184), finisz D2 w `runDiplomacyTurnTick` (:24233-24270),
//!   zapis `meta.wiarygodnosc*` (:37348-37354), odczyt (:47222-47244), hak P4 przy wojnie (:12223-12224).
//!
//! Stan jest JAWNY: [`CredibilityRegistry`] (wejscie/wyjscie kazdej funkcji), bez globali. Kolejnosc wstawiania
//! map JS (`Map`) jest zachowana (wektory `Vec<(K, V)>`), bo wplywa na kolejnosc sumowania `f64` i na zapis.
//!
//! Zapis: te same klucze `meta` co web (`wiarygodnoscZdarzeniaByOwner`, `wiarygodnoscStrumienByOwner`,
//! `wiarygodnoscOstatniaWojnaTuraByOwner`, `wiarygodnoscP4MilestonesByOwner`); trzymane w `WarTurnState.opaque`
//! (lista `DIPLOMACY_RAW_META_KEYS`), czyli zapisy sprzed zmiany (bez kluczy) laduja sie jako pusty rejestr, a zapisy
//! webu laduja sie bez migracji. Klucz zapisywany tylko wtedy, gdy jego zawartosc faktycznie sie zmienila.
//!
//! Bez cichych zer: zly ksztalt zapisu lub nieznany typ zdarzenia => [`CredibilityError`], nie pusty wpis.
//!
//! Poza zakresem (jawnie, BRAK): UI (`buildWiarygodnoscBreakdown`, tooltipy, etykiety PL), dzwignie zaufania
//! (`wiarygodnoscWzrostMult`, `zaufanieDryfOdWiarygodnosci` - istnieja czesciowo w `diplomacy.rs`),
//! `wiarygodnoscN7ActivePairs`, haki kar N1-N7 / P5 (`chargeWarDeclarationCredibility`, `applyBorderMarchPenaltiesEndTurn`).

use std::collections::BTreeSet;
use std::sync::OnceLock;

use serde_json::{Map, Value};

use super::diplomacy::TreatyKind;
use super::types::Difficulty;

/// Klucze `meta` (web `main.ts:37348-37354`).
pub const KEY_EVENTS: &str = "wiarygodnoscZdarzeniaByOwner";
pub const KEY_STREAMS: &str = "wiarygodnoscStrumienByOwner";
pub const KEY_LAST_WAR: &str = "wiarygodnoscOstatniaWojnaTuraByOwner";
pub const KEY_P4_MILESTONES: &str = "wiarygodnoscP4MilestonesByOwner";

/// Blad rejestru wiarygodnosci (zly zapis albo parametr).
#[derive(Debug, Clone, PartialEq)]
pub enum CredibilityError {
    /// Zapis `meta.<klucz>` ma zly ksztalt.
    BadSave { key: &'static str, why: String },
    /// Parametr z danych nie nadaje sie do uzycia (np. okno P4 <= 0 dawaloby nieskonczona petle na pinie).
    BadParam(String),
}

impl std::fmt::Display for CredibilityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::BadSave { key, why } => write!(f, "rejestr wiarygodnosci: {key}: {why}"),
            Self::BadParam(why) => write!(f, "rejestr wiarygodnosci: parametr: {why}"),
        }
    }
}

impl std::error::Error for CredibilityError {}

// ---------------------------------------------------------------------------------------------
// Parametry (web `getBaseDiplomacyParams().wiarygodnosc*`; skalowanie trudnoscia dotyczy tylko progow bramek).
// ---------------------------------------------------------------------------------------------

/// Parametry wiarygodnosci wyciagniete z `diplomacy.json` (pole po polu, nazwy web w komentarzach).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CredibilityParams {
    /// `wiarygodnoscSkalaMin` / `wiarygodnoscSkalaMax`.
    pub scale_min: f64,
    pub scale_max: f64,
    /// `wiarygodnoscProgWzorCnoty` / `wiarygodnoscProgWiarolomny`.
    pub band_virtue: f64,
    pub band_perfidious: f64,
    /// `wiarygodnoscStartLatwy|Normalny|Trudny`.
    pub start_easy: f64,
    pub start_normal: f64,
    pub start_hard: f64,
    /// `wiarygodnoscS1SojuszPerTure`, `wiarygodnoscS2NapPerTure`.
    pub s1_alliance: f64,
    pub s2_nap: f64,
    /// `wiarygodnoscS3HandelPerTure{Latwy,Normalny,Trudny}`.
    pub s3_trade: [f64; 3],
    /// `wiarygodnoscS4PrzemarszPerTure{Latwy,Normalny,Trudny}`.
    pub s4_march: [f64; 3],
    /// `wiarygodnoscP1FiniszSojusz`, `P2FiniszNap`, `P2FiniszHandel`, `P3FiniszHandelCykliczny`.
    pub p1_alliance: f64,
    pub p2_nap: f64,
    pub p2_trade: f64,
    pub p3_cyclic: f64,
    /// `wiarygodnoscP4BezWojny30Tur`, `wiarygodnoscP4OknoBezWojnyTur`.
    pub p4_value: f64,
    pub p4_window: f64,
    /// `wiarygodnoscCzasZapomnieniaKara{Latwy,Normalny,Trudny}`.
    pub forget_penalty: [f64; 3],
    /// `wiarygodnoscCzasZapomnieniaNagroda{Latwy,Normalny,Trudny}`.
    pub forget_reward: [f64; 3],
    /// `wiarygodnoscTrwalaPodlogaProcent`.
    pub floor_fraction: f64,
}

impl CredibilityParams {
    /// Z danych `diplomacy.json` (`parse_diplomacy().params`).
    pub fn from_params(p: &crate::data::civilizations::Params) -> Self {
        Self {
            scale_min: p.wiarygodnosc_skala_min as f64,
            scale_max: p.wiarygodnosc_skala_max as f64,
            band_virtue: p.wiarygodnosc_prog_wzor_cnoty as f64,
            band_perfidious: p.wiarygodnosc_prog_wiarolomny as f64,
            start_easy: p.wiarygodnosc_start_latwy as f64,
            start_normal: p.wiarygodnosc_start_normalny as f64,
            start_hard: p.wiarygodnosc_start_trudny as f64,
            s1_alliance: p.wiarygodnosc_s1_sojusz_per_ture as f64,
            s2_nap: p.wiarygodnosc_s2_nap_per_ture,
            s3_trade: [
                p.wiarygodnosc_s3_handel_per_ture_latwy,
                p.wiarygodnosc_s3_handel_per_ture_normalny,
                p.wiarygodnosc_s3_handel_per_ture_trudny,
            ],
            s4_march: [
                p.wiarygodnosc_s4_przemarsz_per_ture_latwy,
                p.wiarygodnosc_s4_przemarsz_per_ture_normalny,
                p.wiarygodnosc_s4_przemarsz_per_ture_trudny,
            ],
            p1_alliance: p.wiarygodnosc_p1_finisz_sojusz as f64,
            p2_nap: p.wiarygodnosc_p2_finisz_nap as f64,
            p2_trade: p.wiarygodnosc_p2_finisz_handel as f64,
            p3_cyclic: p.wiarygodnosc_p3_finisz_handel_cykliczny as f64,
            p4_value: p.wiarygodnosc_p4_bez_wojny30_tur as f64,
            p4_window: p.wiarygodnosc_p4_okno_bez_wojny_tur as f64,
            forget_penalty: [
                p.wiarygodnosc_czas_zapomnienia_kara_latwy as f64,
                p.wiarygodnosc_czas_zapomnienia_kara_normalny as f64,
                p.wiarygodnosc_czas_zapomnienia_kara_trudny as f64,
            ],
            forget_reward: [
                p.wiarygodnosc_czas_zapomnienia_nagroda_latwy as f64,
                p.wiarygodnosc_czas_zapomnienia_nagroda_normalny as f64,
                p.wiarygodnosc_czas_zapomnienia_nagroda_trudny as f64,
            ],
            floor_fraction: p.wiarygodnosc_trwala_podloga_procent,
        }
    }

    /// Parametry z wbudowanego `diplomacy.json` (parsowane raz).
    pub fn load() -> &'static CredibilityParams {
        static P: OnceLock<CredibilityParams> = OnceLock::new();
        P.get_or_init(|| {
            let file =
                crate::data::civilizations::parse_diplomacy().expect("diplomacy.json must parse");
            CredibilityParams::from_params(&file.params)
        })
    }
}

/// Indeks trudnosci w tablicach `[latwy, normalny, trudny]` (web `switch`: `default` = normalny).
fn diff_ix(d: Difficulty) -> usize {
    match d {
        Difficulty::Easy => 0,
        Difficulty::Normal => 1,
        Difficulty::Hard => 2,
    }
}

/// JS `Math.min(max, Math.max(min, v))` (NaN propaguje jak w JS).
fn clamp_js(v: f64, min: f64, max: f64) -> f64 {
    let lo = if v.is_nan() || min.is_nan() {
        f64::NAN
    } else if v > min {
        v
    } else {
        min
    };
    if lo.is_nan() || max.is_nan() {
        f64::NAN
    } else if lo < max {
        lo
    } else {
        max
    }
}

// ---------------------------------------------------------------------------------------------
// Typy zdarzen
// ---------------------------------------------------------------------------------------------

/// Web `CredibilityEvent` (`diplomacy-credibility.ts:67-85`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum CredibilityEvent {
    WypowiedzenieWojnyBezOstrzezenia,
    ZlamaniePaktuNap,
    ZlamaniePaktuSojusz,
    AtakWOknieKarencji,
    OdmowaObowiazkuSojuszu,
    ZerwanieDobrowolneTraktat,
    ZerwanieDobrowolneHandel,
    NiedotrzymanieHandluCyklicznego,
    NieautoryzowanyPrzemarsz,
    DotrwanieSojuszu,
    DotrwanieNap,
    DotrwanieHandlu,
    SplataHandluCyklicznego,
    WieloletniPokoj,
    PomocSojusznikowiRealna,
}

/// Web `CredibilityEventSign`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventSign {
    /// `'kara'`
    Penalty,
    /// `'nagroda'`
    Reward,
}

impl EventSign {
    pub fn web_key(self) -> &'static str {
        match self {
            Self::Penalty => "kara",
            Self::Reward => "nagroda",
        }
    }
    pub fn from_web_key(s: &str) -> Option<Self> {
        match s {
            "kara" => Some(Self::Penalty),
            "nagroda" => Some(Self::Reward),
            _ => None,
        }
    }
}

const ALL_EVENTS: [(CredibilityEvent, &str, EventSign); 15] = [
    (
        CredibilityEvent::WypowiedzenieWojnyBezOstrzezenia,
        "wypowiedzenie_wojny_bez_ostrzezenia",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::ZlamaniePaktuNap,
        "zlamanie_paktu_nap",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::ZlamaniePaktuSojusz,
        "zlamanie_paktu_sojusz",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::AtakWOknieKarencji,
        "atak_w_oknie_karencji",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::OdmowaObowiazkuSojuszu,
        "odmowa_obowiazku_sojuszu",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::ZerwanieDobrowolneTraktat,
        "zerwanie_dobrowolne_traktat",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::ZerwanieDobrowolneHandel,
        "zerwanie_dobrowolne_handel",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::NiedotrzymanieHandluCyklicznego,
        "niedotrzymanie_handlu_cyklicznego",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::NieautoryzowanyPrzemarsz,
        "nieautoryzowany_przemarsz",
        EventSign::Penalty,
    ),
    (
        CredibilityEvent::DotrwanieSojuszu,
        "dotrwanie_sojuszu",
        EventSign::Reward,
    ),
    (
        CredibilityEvent::DotrwanieNap,
        "dotrwanie_nap",
        EventSign::Reward,
    ),
    (
        CredibilityEvent::DotrwanieHandlu,
        "dotrwanie_handlu",
        EventSign::Reward,
    ),
    (
        CredibilityEvent::SplataHandluCyklicznego,
        "splata_handlu_cyklicznego",
        EventSign::Reward,
    ),
    (
        CredibilityEvent::WieloletniPokoj,
        "wieloletni_pokoj",
        EventSign::Reward,
    ),
    (
        CredibilityEvent::PomocSojusznikowiRealna,
        "pomoc_sojusznikowi_realna",
        EventSign::Reward,
    ),
];

impl CredibilityEvent {
    pub const ALL: [CredibilityEvent; 15] = [
        Self::WypowiedzenieWojnyBezOstrzezenia,
        Self::ZlamaniePaktuNap,
        Self::ZlamaniePaktuSojusz,
        Self::AtakWOknieKarencji,
        Self::OdmowaObowiazkuSojuszu,
        Self::ZerwanieDobrowolneTraktat,
        Self::ZerwanieDobrowolneHandel,
        Self::NiedotrzymanieHandluCyklicznego,
        Self::NieautoryzowanyPrzemarsz,
        Self::DotrwanieSojuszu,
        Self::DotrwanieNap,
        Self::DotrwanieHandlu,
        Self::SplataHandluCyklicznego,
        Self::WieloletniPokoj,
        Self::PomocSojusznikowiRealna,
    ];

    fn row(self) -> &'static (CredibilityEvent, &'static str, EventSign) {
        ALL_EVENTS
            .iter()
            .find(|(e, _, _)| *e == self)
            .expect("kazdy wariant ma wiersz w ALL_EVENTS")
    }

    /// Klucz web (`'zlamanie_paktu_nap'` itd.).
    pub fn web_key(self) -> &'static str {
        self.row().1
    }

    pub fn from_web_key(s: &str) -> Option<Self> {
        ALL_EVENTS
            .iter()
            .find(|(_, k, _)| *k == s)
            .map(|(e, _, _)| *e)
    }

    /// Web `credibilityEventSign`.
    pub fn sign(self) -> EventSign {
        self.row().2
    }
}

/// Web `CredibilityEventRecord` (zdarzenie jednorazowe). `turn_occurred` = `turaWystapienia`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CredibilityEventRecord {
    pub typ: CredibilityEvent,
    pub original_value: f64,
    pub turn_occurred: f64,
    pub sign: EventSign,
}

/// Web `CredibilityStreamEvent` (S1-S4).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum CredibilityStreamEvent {
    /// `strumien_sojusz` (S1)
    Alliance,
    /// `strumien_nap` (S2)
    Nap,
    /// `strumien_handel` (S3)
    Trade,
    /// `strumien_przemarsz` (S4)
    March,
}

impl CredibilityStreamEvent {
    pub const ALL: [CredibilityStreamEvent; 4] =
        [Self::Alliance, Self::Nap, Self::Trade, Self::March];

    pub fn web_key(self) -> &'static str {
        match self {
            Self::Alliance => "strumien_sojusz",
            Self::Nap => "strumien_nap",
            Self::Trade => "strumien_handel",
            Self::March => "strumien_przemarsz",
        }
    }

    pub fn from_web_key(s: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|e| e.web_key() == s)
    }
}

/// Web `CredibilityStreamEntry`: waga na ture i suma narosla (bez trwalej podlogi).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CredibilityStreamEntry {
    pub typ: CredibilityStreamEvent,
    pub value_per_turn: f64,
    pub active_sum: f64,
}

// ---------------------------------------------------------------------------------------------
// Funkcje czyste rdzenia (diplomacy-credibility.ts)
// ---------------------------------------------------------------------------------------------

/// Web `wiarygodnoscBand`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CredibilityBand {
    Perfidious,
    Wavering,
    Honest,
    Virtue,
}

impl CredibilityBand {
    pub fn web_key(self) -> &'static str {
        match self {
            Self::Perfidious => "wiarolomny",
            Self::Wavering => "chwiejny",
            Self::Honest => "uczciwy",
            Self::Virtue => "wzor_cnoty",
        }
    }
}

pub fn credibility_band(w: f64, p: &CredibilityParams) -> CredibilityBand {
    if w >= p.band_virtue {
        CredibilityBand::Virtue
    } else if w >= 0.0 {
        CredibilityBand::Honest
    } else if w > p.band_perfidious {
        CredibilityBand::Wavering
    } else {
        CredibilityBand::Perfidious
    }
}

/// Web `wiarygodnoscStartowa` (`default` = normalny).
pub fn credibility_start(d: Difficulty, p: &CredibilityParams) -> f64 {
    [p.start_easy, p.start_normal, p.start_hard][diff_ix(d)]
}

/// Web `appendCredibilityEvent` (+ `appendWiarygodnoscEvent`, `main.ts:12012`): dopisuje zdarzenie; `value == 0`
/// albo nieskonczone => bez zmian. Zwraca `true`, gdy dopisano.
pub fn append_credibility_event(
    events: &mut Vec<CredibilityEventRecord>,
    typ: CredibilityEvent,
    original_value: f64,
    turn: f64,
) -> bool {
    if original_value == 0.0 || !original_value.is_finite() {
        return false;
    }
    events.push(CredibilityEventRecord {
        typ,
        original_value,
        turn_occurred: turn,
        sign: typ.sign(),
    });
    true
}

/// Web `czasZapomnienia` (:157).
fn forget_time(sign: EventSign, d: Difficulty, p: &CredibilityParams) -> f64 {
    match sign {
        EventSign::Penalty => p.forget_penalty[diff_ix(d)],
        EventSign::Reward => p.forget_reward[diff_ix(d)],
    }
}

/// Web `wartoscBiezaca` (:187): `pierwotna * clamp(1 - (tura - turaWyst)/czas, podloga, 1)`.
pub fn current_value(
    e: &CredibilityEventRecord,
    turn: f64,
    d: Difficulty,
    p: &CredibilityParams,
) -> f64 {
    let time = forget_time(e.sign, d, p);
    if !time.is_finite() || time <= 0.0 {
        return e.original_value;
    }
    let elapsed = turn - e.turn_occurred;
    let frac = elapsed / time;
    let mult = clamp_js(1.0 - frac, p.floor_fraction, 1.0);
    e.original_value * mult
}

/// Web `sumaWiarygodnosci` (:207): start + suma wartosci biezacych zdarzen, klamrowane do skali.
pub fn credibility_sum(
    events: &[CredibilityEventRecord],
    start: f64,
    turn: f64,
    d: Difficulty,
    p: &CredibilityParams,
) -> f64 {
    let mut sum = start;
    for e in events {
        sum += current_value(e, turn, d, p);
    }
    clamp_js(sum, p.scale_min, p.scale_max)
}

/// Web `credibilityStreamWeight` (:290).
pub fn stream_weight(typ: CredibilityStreamEvent, d: Difficulty, p: &CredibilityParams) -> f64 {
    match typ {
        CredibilityStreamEvent::Alliance => p.s1_alliance,
        CredibilityStreamEvent::Nap => p.s2_nap,
        CredibilityStreamEvent::Trade => p.s3_trade[diff_ix(d)],
        CredibilityStreamEvent::March => p.s4_march[diff_ix(d)],
    }
}

/// Web `sumaStrumienia` (:318).
pub fn stream_sum<'a>(entries: impl IntoIterator<Item = &'a CredibilityStreamEntry>) -> f64 {
    let mut sum = 0.0;
    for e in entries {
        sum += e.active_sum;
    }
    sum
}

/// Web `freshCredibilityStreamEntry` (:327).
pub fn fresh_stream_entry(
    typ: CredibilityStreamEvent,
    d: Difficulty,
    p: &CredibilityParams,
) -> CredibilityStreamEntry {
    CredibilityStreamEntry {
        typ,
        value_per_turn: stream_weight(typ, d, p),
        active_sum: 0.0,
    }
}

/// Web `tickCredibilityStreamEntry` (:340): dolicza jedna ture.
pub fn tick_stream_entry(e: &CredibilityStreamEntry) -> CredibilityStreamEntry {
    CredibilityStreamEntry {
        active_sum: e.active_sum + e.value_per_turn,
        ..*e
    }
}

/// Web `sumaWiarygodnosciCalkowita` (:362): start + zdarzenia (krzywa zapominania) + strumien, klamrowane.
pub fn credibility_total<'a>(
    events: &[CredibilityEventRecord],
    streams: impl IntoIterator<Item = &'a CredibilityStreamEntry>,
    start: f64,
    turn: f64,
    d: Difficulty,
    p: &CredibilityParams,
) -> f64 {
    let mut sum = start;
    for e in events {
        sum += current_value(e, turn, d, p);
    }
    sum += stream_sum(streams);
    clamp_js(sum, p.scale_min, p.scale_max)
}

// ---------------------------------------------------------------------------------------------
// D2: finisz wygaslego traktatu (main.ts:24233-24270)
// ---------------------------------------------------------------------------------------------

/// Zdarzenia finiszu (P1/P2/P3) dla traktatu, ktory wygasl NATURALNIE w `expireTreaties`; kazde przyznawane OBU
/// stronom (wywolujacy dopisuje dla `pa` i `pb`). Kolejnosc jak w webie: sojusz -> P1; NAP -> P2; handel
/// (szlaki/wymiana/legacy handlowa) -> P2 handel, potem P3 gdy sa pozycje cykliczne i nigdy nie niedostarczono.
/// Web rozroznia `UmowaHandlowa`/`UmowaSzlakow`/`UmowaWymiany` - w D2 wszystkie trzy daja ten sam wynik, wiec
/// scalenie ich aliasami serde w Rust (`TradeRoute`/`Exchange`) nie zmienia wyniku.
pub fn expiry_finish_events(
    kind: TreatyKind,
    has_cyclic: bool,
    cyclic_ever_failed: bool,
    p: &CredibilityParams,
) -> Vec<(CredibilityEvent, f64)> {
    match kind {
        TreatyKind::DefensiveAlliance | TreatyKind::FullAlliance => {
            vec![(CredibilityEvent::DotrwanieSojuszu, p.p1_alliance)]
        }
        TreatyKind::Nap => vec![(CredibilityEvent::DotrwanieNap, p.p2_nap)],
        TreatyKind::TradeRoute | TreatyKind::Exchange => {
            let mut out = vec![(CredibilityEvent::DotrwanieHandlu, p.p2_trade)];
            if has_cyclic && !cyclic_ever_failed {
                out.push((CredibilityEvent::SplataHandluCyklicznego, p.p3_cyclic));
            }
            out
        }
        _ => Vec::new(),
    }
}

// ---------------------------------------------------------------------------------------------
// D4: aktywne zobowiazania strumienia (main.ts:24184-24228)
// ---------------------------------------------------------------------------------------------

/// Rodzaj traktatu widziany przez krok strumieni (web `RodzajTraktatu` po `normalizeTreatyKind`). Wariant
/// `LegacyTradeAgreement` (`umowa_handlowa`) istnieje, by funkcja byla 1:1 z pinem; adapter z `TreatyKind`
/// (`stream_kind_of`) go NIE produkuje, bo serde scala `umowa_handlowa` z `umowa_szlakow`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StreamDealKind {
    DefensiveAlliance,
    FullAlliance,
    Nap,
    OpenBorders,
    MilitaryMarch,
    BarbarianCooperation,
    TradeRoute,
    LegacyTradeAgreement,
    Exchange,
    Vassalization,
}

/// Adapter `TreatyKind` -> kind kroku strumieni. `TradeRoute` = `UmowaSzlakow` (bezwarunkowy S3); `Exchange`
/// = `UmowaWymiany` (brak strumienia w webie).
pub fn stream_kind_of(kind: TreatyKind) -> StreamDealKind {
    match kind {
        TreatyKind::DefensiveAlliance => StreamDealKind::DefensiveAlliance,
        TreatyKind::FullAlliance => StreamDealKind::FullAlliance,
        TreatyKind::Nap => StreamDealKind::Nap,
        TreatyKind::OpenBorders => StreamDealKind::OpenBorders,
        TreatyKind::MilitaryMarch => StreamDealKind::MilitaryMarch,
        TreatyKind::BarbarianCooperation => StreamDealKind::BarbarianCooperation,
        TreatyKind::TradeRoute => StreamDealKind::TradeRoute,
        TreatyKind::Exchange => StreamDealKind::Exchange,
        TreatyKind::Vassalization => StreamDealKind::Vassalization,
    }
}

/// Wejscie kroku strumieni: jeden aktywny traktat (`activeDeals[i]`).
#[derive(Debug, Clone, PartialEq)]
pub struct StreamDeal {
    pub id: String,
    pub kind: StreamDealKind,
    /// Web `deal.strony` `[a, b]` (kolejnosc ma znaczenie dla kolejnosci wpisow).
    pub parties: (i64, i64),
    /// `deal.handelSurowiecCykliczny?.length ?? 0`.
    pub cyclic_len: usize,
}

/// Jedno aktywne zobowiazanie strumienia (web `StreamActiveTuple`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StreamActive {
    pub owner: i64,
    pub partner: i64,
    pub typ: CredibilityStreamEvent,
}

/// Czesc 1 `updateWiarygodnoscStreamsThisTurn`: aktywny zbior zobowiazan z `activeDeals`. `delivery_ok(id, idx)`
/// = web `wiarygodnoscCyclicDeliveryOkThisTurn.get(...)`: `Some(false)` = niedostarczono, `None`/`Some(true)` = ok.
pub fn stream_active_tuples(
    deals: &[StreamDeal],
    delivery_ok: &dyn Fn(&str, usize) -> Option<bool>,
) -> Vec<StreamActive> {
    let mut active = Vec::new();
    for deal in deals {
        let (a, b) = deal.parties;
        let typ = match deal.kind {
            StreamDealKind::DefensiveAlliance | StreamDealKind::FullAlliance => {
                Some(CredibilityStreamEvent::Alliance)
            }
            StreamDealKind::Nap => Some(CredibilityStreamEvent::Nap),
            StreamDealKind::OpenBorders
            | StreamDealKind::MilitaryMarch
            | StreamDealKind::BarbarianCooperation => Some(CredibilityStreamEvent::March),
            StreamDealKind::TradeRoute => Some(CredibilityStreamEvent::Trade),
            StreamDealKind::LegacyTradeAgreement => {
                let all = (0..deal.cyclic_len).all(|i| delivery_ok(&deal.id, i) != Some(false));
                all.then_some(CredibilityStreamEvent::Trade)
            }
            StreamDealKind::Exchange | StreamDealKind::Vassalization => None,
        };
        let Some(typ) = typ else { continue };
        active.push(StreamActive {
            owner: a,
            partner: b,
            typ,
        });
        active.push(StreamActive {
            owner: b,
            partner: a,
            typ,
        });
    }
    active
}

/// Web `wiarygodnoscStreamKey`: `${partnerId}_${typ}`.
pub fn stream_key(partner: i64, typ: CredibilityStreamEvent) -> String {
    format!("{partner}_{}", typ.web_key())
}

// ---------------------------------------------------------------------------------------------
// Rejestr (stan jawny)
// ---------------------------------------------------------------------------------------------

/// Wpisy strumienia jednego wlasciciela: `(klucz `${partner}_${typ}`, wpis)` w kolejnosci wstawiania.
pub type StreamEntries = Vec<(String, CredibilityStreamEntry)>;

/// Rejestr wiarygodnosci wszystkich wlascicieli. Mapy JS jako wektory par (zachowana kolejnosc wstawiania).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CredibilityRegistry {
    /// `wiarygodnoscZdarzeniaByOwner`.
    pub events: Vec<(i64, Vec<CredibilityEventRecord>)>,
    /// `wiarygodnoscStrumienByOwner`: `owner -> [(klucz `${partner}_${typ}`, wpis)]`.
    pub streams: Vec<(i64, StreamEntries)>,
    /// `wiarygodnoscOstatniaWojnaTuraByOwner`.
    pub last_war_turn: Vec<(i64, f64)>,
    /// `wiarygodnoscP4MilestonesByOwner`.
    pub p4_milestones: Vec<(i64, f64)>,
}

fn upsert<V>(map: &mut Vec<(i64, V)>, key: i64, value: V) {
    match map.iter_mut().find(|(k, _)| *k == key) {
        Some(slot) => slot.1 = value,
        None => map.push((key, value)),
    }
}

impl CredibilityRegistry {
    /// Web `getWiarygodnoscEvents`.
    pub fn events_of(&self, owner: i64) -> &[CredibilityEventRecord] {
        self.events
            .iter()
            .find(|(k, _)| *k == owner)
            .map(|(_, v)| v.as_slice())
            .unwrap_or(&[])
    }

    /// Web `appendWiarygodnoscEvent`: dopisuje zdarzenie ownera w turze `turn` (no-op dla wartosci 0).
    pub fn append_event(&mut self, owner: i64, typ: CredibilityEvent, value: f64, turn: f64) {
        let mut cur = self.events_of(owner).to_vec();
        if append_credibility_event(&mut cur, typ, value, turn) {
            upsert(&mut self.events, owner, cur);
        }
    }

    /// Web `getWiarygodnoscStreamEntries`.
    pub fn stream_entries_of(&self, owner: i64) -> Vec<&CredibilityStreamEntry> {
        self.streams
            .iter()
            .find(|(k, _)| *k == owner)
            .map(|(_, m)| m.iter().map(|(_, e)| e).collect())
            .unwrap_or_default()
    }

    /// Web `getWiarygodnosc(ownerId)`: wiarygodnosc calkowita na zywo.
    pub fn total_of(&self, owner: i64, turn: f64, d: Difficulty, p: &CredibilityParams) -> f64 {
        credibility_total(
            self.events_of(owner),
            self.stream_entries_of(owner),
            credibility_start(d, p),
            turn,
            d,
            p,
        )
    }

    /// Web `tickWiarygodnoscStreamFor`: dolicza ture wpisowi (swiezy, gdy brak).
    pub fn tick_stream_for(
        &mut self,
        owner: i64,
        partner: i64,
        typ: CredibilityStreamEvent,
        d: Difficulty,
        p: &CredibilityParams,
    ) {
        let key = stream_key(partner, typ);
        let mut m = self
            .streams
            .iter()
            .find(|(k, _)| *k == owner)
            .map(|(_, m)| m.clone())
            .unwrap_or_default();
        match m.iter_mut().find(|(k, _)| *k == key) {
            Some((_, e)) => *e = tick_stream_entry(e),
            None => m.push((key, tick_stream_entry(&fresh_stream_entry(typ, d, p)))),
        }
        upsert(&mut self.streams, owner, m);
    }

    /// Web `updateWiarygodnoscStreamsThisTurn` (czesc 2): kasuje wpisy spoza aktywnego zbioru (C-WIAR-SLAD=A,
    /// self-healing; wlasciciel z pustym zbiorem zostaje na liscie), potem tika kazde aktywne zobowiazanie
    /// (duplikaty tikaja wielokrotnie).
    pub fn update_streams_this_turn(
        &mut self,
        active: &[StreamActive],
        d: Difficulty,
        p: &CredibilityParams,
    ) {
        let mut keep: Vec<(i64, BTreeSet<String>)> = Vec::new();
        for t in active {
            let key = stream_key(t.partner, t.typ);
            match keep.iter_mut().find(|(o, _)| *o == t.owner) {
                Some((_, set)) => {
                    set.insert(key);
                }
                None => keep.push((t.owner, BTreeSet::from([key]))),
            }
        }
        for (owner, m) in &mut self.streams {
            let empty = BTreeSet::new();
            let set = keep
                .iter()
                .find(|(o, _)| o == owner)
                .map(|(_, s)| s)
                .unwrap_or(&empty);
            m.retain(|(k, _)| set.contains(k));
        }
        for t in active {
            self.tick_stream_for(t.owner, t.partner, t.typ, d, p);
        }
    }

    /// Web `tickWiarygodnoscBezWojnyMilestone` (P4): kamienie milowe "bez wojny", powtarzalne; kazdy nowy daje
    /// `wieloletni_pokoj` o wartosci `p4_value`. Okno <= 0 / nieskonczone => blad (na pinie petla bez konca).
    pub fn tick_no_war_milestone(
        &mut self,
        owner: i64,
        turn: f64,
        p: &CredibilityParams,
    ) -> Result<(), CredibilityError> {
        let window = p.p4_window;
        if !window.is_finite() || window <= 0.0 {
            return Err(CredibilityError::BadParam(format!(
                "wiarygodnoscP4OknoBezWojnyTur = {window} (musi byc > 0)"
            )));
        }
        let last_war = self
            .last_war_turn
            .iter()
            .find(|(k, _)| *k == owner)
            .map(|(_, v)| *v)
            .unwrap_or(0.0);
        let now = ((turn - last_war).max(0.0) / window).floor();
        let already = self
            .p4_milestones
            .iter()
            .find(|(k, _)| *k == owner)
            .map(|(_, v)| *v)
            .unwrap_or(0.0);
        if now > already {
            let mut i = already;
            while i < now {
                self.append_event(owner, CredibilityEvent::WieloletniPokoj, p.p4_value, turn);
                i += 1.0;
            }
            upsert(&mut self.p4_milestones, owner, now);
        }
        Ok(())
    }

    /// Hak P4 (`main.ts:12223-12224`): KAZDA wojna zeruje licznik "bez wojny" OBU stron. Wolajacy (deklaracja wojny)
    /// jest poza zakresem tego klocka; metoda jest gotowa do wpiecia.
    pub fn note_war_entered(&mut self, a: i64, b: i64, turn: f64) {
        upsert(&mut self.last_war_turn, a, turn);
        upsert(&mut self.last_war_turn, b, turn);
    }
}

// ---------------------------------------------------------------------------------------------
// Zapis (format web `meta`)
// ---------------------------------------------------------------------------------------------

/// Liczba w formie JSON jak `JSON.stringify`: calkowite bez czesci ulamkowej.
fn num(v: f64) -> Value {
    if v.is_finite() && v.fract() == 0.0 && v.abs() < 9.0e15 {
        Value::from(v as i64)
    } else {
        Value::from(v)
    }
}

fn bad(key: &'static str, why: impl Into<String>) -> CredibilityError {
    CredibilityError::BadSave {
        key,
        why: why.into(),
    }
}

fn owner_id(key: &'static str, v: &Value) -> Result<i64, CredibilityError> {
    v.as_i64()
        .or_else(|| v.as_f64().filter(|f| f.fract() == 0.0).map(|f| f as i64))
        .ok_or_else(|| {
            bad(
                key,
                format!("id wlasciciela nie jest liczba calkowita: {v}"),
            )
        })
}

fn f64_of(key: &'static str, field: &str, v: Option<&Value>) -> Result<f64, CredibilityError> {
    v.and_then(Value::as_f64)
        .ok_or_else(|| bad(key, format!("pole `{field}` nie jest liczba")))
}

fn str_of<'a>(
    key: &'static str,
    field: &str,
    v: Option<&'a Value>,
) -> Result<&'a str, CredibilityError> {
    v.and_then(Value::as_str)
        .ok_or_else(|| bad(key, format!("pole `{field}` nie jest tekstem")))
}

fn rows<'a>(key: &'static str, v: &'a Value) -> Result<&'a Vec<Value>, CredibilityError> {
    v.as_array()
        .ok_or_else(|| bad(key, "oczekiwano tablicy par [id, wartosc]"))
}

fn pair<'a>(key: &'static str, row: &'a Value) -> Result<(i64, &'a Value), CredibilityError> {
    let a = row
        .as_array()
        .filter(|a| a.len() == 2)
        .ok_or_else(|| bad(key, "wpis nie jest para [id, wartosc]"))?;
    Ok((owner_id(key, &a[0])?, &a[1]))
}

fn parse_scalar_map(key: &'static str, v: &Value) -> Result<Vec<(i64, f64)>, CredibilityError> {
    let mut out = Vec::new();
    for row in rows(key, v)? {
        let (o, val) = pair(key, row)?;
        out.push((o, f64_of(key, "wartosc", Some(val))?));
    }
    Ok(out)
}

fn parse_events(v: &Value) -> Result<Vec<(i64, Vec<CredibilityEventRecord>)>, CredibilityError> {
    let mut out = Vec::new();
    for row in rows(KEY_EVENTS, v)? {
        let (o, list) = pair(KEY_EVENTS, row)?;
        let mut recs = Vec::new();
        for e in rows(KEY_EVENTS, list)? {
            let typ_s = str_of(KEY_EVENTS, "typ", e.get("typ"))?;
            let typ = CredibilityEvent::from_web_key(typ_s)
                .ok_or_else(|| bad(KEY_EVENTS, format!("nieznany typ zdarzenia '{typ_s}'")))?;
            let sign_s = str_of(KEY_EVENTS, "znak", e.get("znak"))?;
            let sign = EventSign::from_web_key(sign_s)
                .ok_or_else(|| bad(KEY_EVENTS, format!("nieznany znak '{sign_s}'")))?;
            recs.push(CredibilityEventRecord {
                typ,
                original_value: f64_of(KEY_EVENTS, "wartoscPierwotna", e.get("wartoscPierwotna"))?,
                turn_occurred: f64_of(KEY_EVENTS, "turaWystapienia", e.get("turaWystapienia"))?,
                sign,
            });
        }
        out.push((o, recs));
    }
    Ok(out)
}

fn parse_streams(v: &Value) -> Result<Vec<(i64, StreamEntries)>, CredibilityError> {
    let mut out = Vec::new();
    for row in rows(KEY_STREAMS, v)? {
        let (o, list) = pair(KEY_STREAMS, row)?;
        let mut entries = Vec::new();
        for kv in rows(KEY_STREAMS, list)? {
            let a = kv
                .as_array()
                .filter(|a| a.len() == 2)
                .ok_or_else(|| bad(KEY_STREAMS, "wpis strumienia nie jest para [klucz, wpis]"))?;
            let k = str_of(KEY_STREAMS, "klucz", a.first())?.to_owned();
            let e = &a[1];
            let typ_s = str_of(KEY_STREAMS, "typ", e.get("typ"))?;
            let typ = CredibilityStreamEvent::from_web_key(typ_s)
                .ok_or_else(|| bad(KEY_STREAMS, format!("nieznany typ strumienia '{typ_s}'")))?;
            entries.push((
                k,
                CredibilityStreamEntry {
                    typ,
                    value_per_turn: f64_of(KEY_STREAMS, "wartoscNaTure", e.get("wartoscNaTure"))?,
                    active_sum: f64_of(KEY_STREAMS, "sumaAktywna", e.get("sumaAktywna"))?,
                },
            ));
        }
        out.push((o, entries));
    }
    Ok(out)
}

fn events_to_json(events: &[(i64, Vec<CredibilityEventRecord>)]) -> Value {
    Value::Array(
        events
            .iter()
            .map(|(o, list)| {
                let recs = list
                    .iter()
                    .map(|e| {
                        let mut m = Map::new();
                        m.insert("typ".into(), Value::from(e.typ.web_key()));
                        m.insert("wartoscPierwotna".into(), num(e.original_value));
                        m.insert("turaWystapienia".into(), num(e.turn_occurred));
                        m.insert("znak".into(), Value::from(e.sign.web_key()));
                        Value::Object(m)
                    })
                    .collect();
                Value::Array(vec![num(*o as f64), Value::Array(recs)])
            })
            .collect(),
    )
}

fn streams_to_json(streams: &[(i64, StreamEntries)]) -> Value {
    Value::Array(
        streams
            .iter()
            .map(|(o, list)| {
                let entries = list
                    .iter()
                    .map(|(k, e)| {
                        let mut m = Map::new();
                        m.insert("typ".into(), Value::from(e.typ.web_key()));
                        m.insert("wartoscNaTure".into(), num(e.value_per_turn));
                        m.insert("sumaAktywna".into(), num(e.active_sum));
                        Value::Array(vec![Value::from(k.clone()), Value::Object(m)])
                    })
                    .collect();
                Value::Array(vec![num(*o as f64), Value::Array(entries)])
            })
            .collect(),
    )
}

fn scalar_map_to_json(map: &[(i64, f64)]) -> Value {
    Value::Array(
        map.iter()
            .map(|(o, v)| Value::Array(vec![num(*o as f64), num(*v)]))
            .collect(),
    )
}

impl CredibilityRegistry {
    /// Odczyt z mapy `opaque` (klucze `meta` weba). Brak klucza = pusta mapa (stary zapis).
    pub fn from_meta(meta: &Map<String, Value>) -> Result<Self, CredibilityError> {
        Ok(Self {
            events: meta
                .get(KEY_EVENTS)
                .map(parse_events)
                .transpose()?
                .unwrap_or_default(),
            streams: meta
                .get(KEY_STREAMS)
                .map(parse_streams)
                .transpose()?
                .unwrap_or_default(),
            last_war_turn: meta
                .get(KEY_LAST_WAR)
                .map(|v| parse_scalar_map(KEY_LAST_WAR, v))
                .transpose()?
                .unwrap_or_default(),
            p4_milestones: meta
                .get(KEY_P4_MILESTONES)
                .map(|v| parse_scalar_map(KEY_P4_MILESTONES, v))
                .transpose()?
                .unwrap_or_default(),
        })
    }

    /// Zapis do `opaque`: TYLKO klucze, ktorych zawartosc rozni sie od `before` (reszta zachowuje oryginalny JSON,
    /// takze gdy `before` jest pusty, a klucza nie bylo). Zwraca `true`, gdy cokolwiek zapisano.
    pub fn store_changes(&self, before: &Self, meta: &mut Map<String, Value>) -> bool {
        let mut changed = false;
        if self.events != before.events {
            meta.insert(KEY_EVENTS.into(), events_to_json(&self.events));
            changed = true;
        }
        if self.streams != before.streams {
            meta.insert(KEY_STREAMS.into(), streams_to_json(&self.streams));
            changed = true;
        }
        if self.last_war_turn != before.last_war_turn {
            meta.insert(KEY_LAST_WAR.into(), scalar_map_to_json(&self.last_war_turn));
            changed = true;
        }
        if self.p4_milestones != before.p4_milestones {
            meta.insert(
                KEY_P4_MILESTONES.into(),
                scalar_map_to_json(&self.p4_milestones),
            );
            changed = true;
        }
        changed
    }

    /// Pelny zapis czterech kluczy (do testow zgodnosci formatu).
    pub fn to_meta(&self) -> Map<String, Value> {
        let mut m = Map::new();
        m.insert(KEY_EVENTS.into(), events_to_json(&self.events));
        m.insert(KEY_STREAMS.into(), streams_to_json(&self.streams));
        m.insert(KEY_LAST_WAR.into(), scalar_map_to_json(&self.last_war_turn));
        m.insert(
            KEY_P4_MILESTONES.into(),
            scalar_map_to_json(&self.p4_milestones),
        );
        m
    }
}
