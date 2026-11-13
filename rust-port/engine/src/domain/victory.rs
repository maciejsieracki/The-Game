//! R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1: warunki zwyciestwa i porazki gracza 0 (port 1:1 `gra/src/game/victory.ts`,
//! pin 07d2fbd72).
//!
//! Zakres (zmierzony na pinie):
//! - `isEliminated` / `citiesOf` (victory.ts:128-138): wejscie `city_owner_ids` to tablica `ownerId` miast
//!   (pole `ownerId` jest jedynym uzywanym przez pin); puste dopasowanie = wyeliminowany.
//! - `powerShare` (victory.ts:141-146): udzial z `Math.max(0, p)` w sumie i `Math.max(0, potegaGracza)`.
//!   Uwaga: JS `Math.max(0, NaN)` = NaN, Rust `f64::max(0.0, NaN)` = 0.0. Wejscia NaN nie sa objete parytetem
//!   (NIE_ZMIERZONO; pin nie generuje NaN w mocy, patrz `p6_victory_gen.mjs`).
//! - `isDominacjaVictory` (victory.ts:149-157): era < ostatnia epoka -> false; udzial > `PROG_DOMINACJI_POWER`.
//! - `isNaukaVictory` (victory.ts:160-167): wszystkie tech + (przy `NAUKA_WYMAGA_RAKIETY` rakieta).
//! - `techIdsInGameScope` (victory.ts:189-202) i `allTechInScopeResearched` (victory.ts:170-179).
//! - `checkDefeat` (victory.ts:214-220): brak miast gracza i `graczKiedysMialMiasto` (domyslnie true w pinie;
//!   pole `Option<bool>` odwzorowuje `??`).
//! - `checkVictory` (victory.ts:228-260): kolejnosc 10=A*: dominacja, przegrana, nauka. Fallbacki
//!   `epokaKoncowa`/`naukaUkonczona` (victory.ts:251-254) jako `Option` z `??` (nie `||`).
//! - `VictoryFlags`: stan konca gry i flaga `graczKiedysMialMiasto` (flaga w zapisie, decyzja orkiestratora).
//!   Pole nie jest jeszcze dolaczone do `PlayableState` (NIE_ZMIERZONO, patrz nizej).
//!
//! NIE_ZMIERZONO (poza tym modulem):
//! - Wpiecie konca gry do petli tury (odrzucanie komend po koncu gry, pin main.ts:37997, :38043, :43827) i
//!   wywolanie `check_victory` z `main.ts:43466-43483`: wymaga pola w `PlayableState` (plik `playable.rs`
//!   spoza allowlisty tego tematu) — osobny temat.
//! - Ekran zwyciestwa (UI) i hooki testowe pinu: poza zakresem / nie portowane (decyzja orkiestratora).
//! - Odczyt rakiety (`main.ts:43478`) i heurystyka `main.ts:46368-46370` (starsze zapisy): nie w tym module.
//! - Nauka przy `NAUKA_WYMAGA_RAKIETY=true` jest nieosiagalna, bo nic nie ustawia `rakieta_wystrzelona` na
//!   true w Rust (parytet z pinem).
//!
//! Modul czysty: bez IO, bez stanu globalnego poza stalymi.

use serde::{Deserialize, Serialize};

/// Ostatnia epoka dostepna w menu v0.1 (Zelazo). Pin: `eStartOstatniaEpokaV1` fallback 3.
pub const OSTATNIA_EPOKA_GRY_V1: i64 = 3;

/// Prog dominacji Power (decyzja 10=A*). Pin: `eStartProgDominacjiPower` fallback 0.5.
pub const PROG_DOMINACJI_POWER: f64 = 0.5;

/// Flaga z Panel-E: dominacja wymaga ostatniej epoki. Pin: `eStartDominacjaWymagaOstatniejEpoki` (`!== false`).
pub const DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI: bool = true;

/// Flaga z Panel-E: nauka wymaga rakiety. Pin: `eStartNaukaWymagaRakiety` (`!== false`).
pub const NAUKA_WYMAGA_RAKIETY: bool = true;

/// Tryb zwyciestwa z kreatora (`VictoryMode` w pinie). Brak wartosci (`undefined`) = `None` po stronie wejscia.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VictoryMode {
    Moc,
    Dominacja,
    MocIDominacja,
}

/// Czy tryb pozwala na dominacje (`victoryModeAllowsDominacja`): `undefined` albo dominacja/moc_i_dominacja.
pub fn victory_mode_allows_dominacja(mode: Option<VictoryMode>) -> bool {
    matches!(
        mode,
        None | Some(VictoryMode::Dominacja) | Some(VictoryMode::MocIDominacja)
    )
}

/// Czy tryb pozwala na moc/nauke (`victoryModeAllowsMoc`): `undefined` albo moc/moc_i_dominacja.
pub fn victory_mode_allows_moc(mode: Option<VictoryMode>) -> bool {
    matches!(
        mode,
        None | Some(VictoryMode::Moc) | Some(VictoryMode::MocIDominacja)
    )
}

/// Rodzaj zwyciestwa/porazki (`VictoryResult.rodzaj` w pinie).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VictoryKind {
    Dominacja,
    Nauka,
    Przegrana,
}

/// Wynik (`VictoryResult` w pinie): zwyciezca i rodzaj.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct VictoryResult {
    pub winner: i64,
    pub rodzaj: VictoryKind,
}

/// Wejscie `checkVictory` (`VictoryInput` w pinie). `city_owner_ids` zastepuje `cities: City[]`
/// (pin czyta wylacznie `ownerId`). Pola `Option` odwzorowuja `undefined` i operator `??` z pinu.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct VictoryInput {
    pub city_owner_ids: Vec<i64>,
    pub gracz: i64,
    pub victory_mode: Option<VictoryMode>,
    /// Pin: `potegaGracza ?? 0`.
    pub potega_gracza: Option<f64>,
    /// Pin: `potegiWszystkich ?? []`.
    pub potegi_wszystkich: Option<Vec<f64>>,
    /// Pin: `graczEra ?? 1`.
    pub gracz_era: Option<i64>,
    /// Pin: `ostatniaEpoka ?? OSTATNIA_EPOKA_GRY_V1`.
    pub ostatnia_epoka: Option<i64>,
    pub wszystkie_tech_zbadane: Option<bool>,
    pub rakieta_wystrzelona: Option<bool>,
    /// @deprecated w pinie (fallback dla `wszystkieTechZbadane`).
    pub epoka_koncowa: Option<bool>,
    /// @deprecated w pinie (fallback dla `rakietaWystrzelona`).
    pub nauka_ukonczona: Option<bool>,
    /// Pin: `graczKiedysMialMiasto ?? true` (w `checkDefeat`).
    pub gracz_kiedys_mial_miasto: Option<bool>,
}

/// Wejscie `checkDefeat` (`DefeatInput` w pinie).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct DefeatInput {
    pub city_owner_ids: Vec<i64>,
    pub gracz: i64,
    pub gracz_kiedys_mial_miasto: Option<bool>,
}

/// Stan konca gry trzymany przy grze: wynik (gdy gra sie skonczyla) i flaga `graczKiedysMialMiasto`.
/// Domyslnie flaga = false (przed pierwszym miastem gracz nie przegrywa). Zapis w stanie gry: NIE_ZMIERZONO.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct VictoryFlags {
    #[serde(default)]
    pub gracz_kiedys_mial_miasto: bool,
    #[serde(default)]
    pub koniec_gry: Option<VictoryResult>,
}

impl VictoryFlags {
    /// Ustawia flage po zalozeniu pierwszego miasta przez gracza 0.
    pub fn note_player_city_founded(&mut self) {
        self.gracz_kiedys_mial_miasto = true;
    }

    /// Zapisuje koniec gry, jesli jeszcze nie ustawiony (pierwszy wynik wygrywa).
    pub fn set_game_over(&mut self, result: VictoryResult) -> bool {
        if self.koniec_gry.is_some() {
            return false;
        }
        self.koniec_gry = Some(result);
        true
    }

    /// Czy gra jest zakonczona.
    pub fn is_game_over(&self) -> bool {
        self.koniec_gry.is_some()
    }
}

/// `playersOfType` nie ma wejscia w tym module (typy cywilizacji sa po stronie wolajacego).
/// `citiesOf` (victory.ts:128): liczba miast gracza.
pub fn cities_of(player_id: i64, city_owner_ids: &[i64]) -> usize {
    city_owner_ids.iter().filter(|&&o| o == player_id).count()
}

/// `isEliminated` (victory.ts:136): gracz nie ma zadnego miasta.
pub fn is_eliminated(player_id: i64, city_owner_ids: &[i64]) -> bool {
    cities_of(player_id, city_owner_ids) == 0
}

/// `powerShare` (victory.ts:141): udzial Power gracza w sumie (0..1).
pub fn power_share(potega_gracza: f64, potegi: &[f64]) -> f64 {
    let mut sum = 0.0_f64;
    for &p in potegi {
        sum += p.max(0.0);
    }
    if sum <= 0.0 {
        return 0.0;
    }
    potega_gracza.max(0.0) / sum
}

/// `isDominacjaVictory` (victory.ts:149): >50% Power w ostatniej epoce.
pub fn is_dominacja_victory(
    potega_gracza: f64,
    potegi: &[f64],
    gracz_era: i64,
    ostatnia_epoka: i64,
) -> bool {
    if gracz_era < ostatnia_epoka {
        return false;
    }
    power_share(potega_gracza, potegi) > PROG_DOMINACJI_POWER
}

/// `isNaukaVictory` (victory.ts:160): wszystkie tech w zakresie + rakieta (gdy wymagana).
pub fn is_nauka_victory(wszystkie_tech_zbadane: bool, rakieta_wystrzelona: bool) -> bool {
    if !wszystkie_tech_zbadane {
        return false;
    }
    if !NAUKA_WYMAGA_RAKIETY {
        return true;
    }
    rakieta_wystrzelona
}

/// `allTechInScopeResearched` (victory.ts:170): pusty zakres = false.
pub fn all_tech_in_scope_researched<S: AsRef<str>>(
    researched: &std::collections::BTreeSet<String>,
    tech_ids_in_scope: &[S],
) -> bool {
    if tech_ids_in_scope.is_empty() {
        return false;
    }
    tech_ids_in_scope
        .iter()
        .all(|id| researched.contains(id.as_ref()))
}

/// Epoki w zakresie gry dla ostatniej epoki (victory.ts:182-186). Nieznana epoka -> zakres 3 (`?? EPOKI_W_SCOPE[3]`).
fn epoki_w_scope(ostatnia_epoka: i64) -> &'static [&'static str] {
    match ostatnia_epoka {
        1 => &["Kamień"],
        2 => &["Kamień", "Brąz"],
        _ => &["Kamień", "Brąz", "Żelazo"],
    }
}

/// `techIdsInGameScope` (victory.ts:189): wejscie to pary (`Technologia`, `Epoka`), `None` = `null`/brak.
/// Przycina spacje (`trim`), pomija puste id i epoki spoza zakresu.
pub fn tech_ids_in_game_scope(
    techs: &[(Option<&str>, Option<&str>)],
    ostatnia_epoka: i64,
) -> Vec<String> {
    let allowed = epoki_w_scope(ostatnia_epoka);
    let mut out = Vec::new();
    for (id_raw, ep_raw) in techs {
        let ep = ep_raw.unwrap_or("").trim();
        let id = id_raw.unwrap_or("").trim();
        if id.is_empty() || !allowed.contains(&ep) {
            continue;
        }
        out.push(id.to_string());
    }
    out
}

/// `checkDefeat` (victory.ts:214): przegrana, gdy gracz kiedys mial miasto i nie ma zadnego.
pub fn check_defeat(input: &DefeatInput) -> Option<VictoryResult> {
    let kiedys_mial = input.gracz_kiedys_mial_miasto.unwrap_or(true);
    if kiedys_mial && is_eliminated(input.gracz, &input.city_owner_ids) {
        return Some(VictoryResult {
            winner: input.gracz,
            rodzaj: VictoryKind::Przegrana,
        });
    }
    None
}

/// `checkVictory` (victory.ts:228): 1. dominacja, 2. przegrana, 3. nauka (10=A*).
pub fn check_victory(input: &VictoryInput) -> Option<VictoryResult> {
    let ostatnia_epoka = input.ostatnia_epoka.unwrap_or(OSTATNIA_EPOKA_GRY_V1);
    let gracz_era = input.gracz_era.unwrap_or(1);
    let potega_gracza = input.potega_gracza.unwrap_or(0.0);
    let potegi: &[f64] = input.potegi_wszystkich.as_deref().unwrap_or(&[]);
    let mode = input.victory_mode;

    // 1. Dominacja Power (10=A*).
    if victory_mode_allows_dominacja(mode)
        && !potegi.is_empty()
        && is_dominacja_victory(potega_gracza, potegi, gracz_era, ostatnia_epoka)
    {
        return Some(VictoryResult {
            winner: input.gracz,
            rodzaj: VictoryKind::Dominacja,
        });
    }

    // 2. Przegrana.
    let defeat = check_defeat(&DefeatInput {
        city_owner_ids: input.city_owner_ids.clone(),
        gracz: input.gracz,
        gracz_kiedys_mial_miasto: input.gracz_kiedys_mial_miasto,
    });
    if defeat.is_some() {
        return defeat;
    }

    // 3. Nauka (tech + rakieta). Fallbacki z pinu: `??`, nie `||`.
    let fallback_both = input.epoka_koncowa == Some(true) && input.nauka_ukonczona == Some(true);
    let wszystkie_tech = input.wszystkie_tech_zbadane.unwrap_or(fallback_both);
    let rakieta = input
        .rakieta_wystrzelona
        .unwrap_or(input.nauka_ukonczona == Some(true));
    if victory_mode_allows_moc(mode) && is_nauka_victory(wszystkie_tech, rakieta) {
        return Some(VictoryResult {
            winner: input.gracz,
            rodzaj: VictoryKind::Nauka,
        });
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dominacja_wymaga_ostatniej_epoki_i_progu_stricte() {
        assert!(is_dominacja_victory(60.0, &[60.0, 40.0], 3, 3));
        assert!(!is_dominacja_victory(60.0, &[60.0, 40.0], 2, 3));
        assert!(!is_dominacja_victory(50.0, &[50.0, 50.0], 3, 3));
    }

    #[test]
    fn power_share_przycina_ujemne_w_sumie_i_w_mocy_gracza() {
        // Suma po przycieciu = 100, udzial 40/100 (bez przyciecia 40/50 = 0.8).
        assert_eq!(power_share(40.0, &[-50.0, 40.0, 60.0]), 0.4);
        assert_eq!(power_share(-5.0, &[-10.0, 30.0, 70.0]), 0.0);
        assert_eq!(power_share(0.0, &[0.0, 0.0]), 0.0);
    }

    #[test]
    fn eliminacja_i_przegrana_z_flaga() {
        let base = VictoryInput {
            city_owner_ids: vec![1, 2, 2],
            gracz: 0,
            ..VictoryInput::default()
        };
        assert!(is_eliminated(0, &base.city_owner_ids));
        assert_eq!(
            check_victory(&base),
            Some(VictoryResult {
                winner: 0,
                rodzaj: VictoryKind::Przegrana
            })
        );
        let przed_miastem = VictoryInput {
            gracz_kiedys_mial_miasto: Some(false),
            ..base
        };
        assert_eq!(check_victory(&przed_miastem), None);
    }

    #[test]
    fn nauka_nieosiagalna_bez_rakiety() {
        let mut input = VictoryInput {
            city_owner_ids: vec![0],
            gracz: 0,
            wszystkie_tech_zbadane: Some(true),
            rakieta_wystrzelona: Some(false),
            ..VictoryInput::default()
        };
        assert_eq!(check_victory(&input), None);
        input.rakieta_wystrzelona = Some(true);
        assert_eq!(
            check_victory(&input),
            Some(VictoryResult {
                winner: 0,
                rodzaj: VictoryKind::Nauka
            })
        );
    }

    #[test]
    fn fallback_deprecated_tylko_gdy_nowe_pola_brak() {
        let fallback = VictoryInput {
            city_owner_ids: vec![0],
            gracz: 0,
            epoka_koncowa: Some(true),
            nauka_ukonczona: Some(true),
            ..VictoryInput::default()
        };
        assert_eq!(
            check_victory(&fallback).map(|r| r.rodzaj),
            Some(VictoryKind::Nauka)
        );
        let nowe_pierwsze = VictoryInput {
            wszystkie_tech_zbadane: Some(false),
            rakieta_wystrzelona: Some(false),
            ..fallback
        };
        assert_eq!(check_victory(&nowe_pierwsze), None);
    }

    #[test]
    fn tryb_blokuje_sciezki() {
        let dom = VictoryInput {
            city_owner_ids: vec![0],
            gracz: 0,
            victory_mode: Some(VictoryMode::Dominacja),
            wszystkie_tech_zbadane: Some(true),
            rakieta_wystrzelona: Some(true),
            ..VictoryInput::default()
        };
        assert_eq!(check_victory(&dom), None);
        let moc = VictoryInput {
            victory_mode: Some(VictoryMode::Moc),
            potega_gracza: Some(90.0),
            potegi_wszystkich: Some(vec![90.0, 10.0]),
            gracz_era: Some(3),
            ..dom
        };
        // Tryb moc: dominacja 90% zablokowana, ale nauka (tech + rakieta) dozwolona -> Nauka, nie Dominacja.
        assert_eq!(
            check_victory(&moc).map(|r| r.rodzaj),
            Some(VictoryKind::Nauka)
        );
        // Tryb moc bez tech: dominacja zablokowana i brak nauki -> None.
        let moc_bez_tech = VictoryInput {
            wszystkie_tech_zbadane: Some(false),
            ..moc
        };
        assert_eq!(check_victory(&moc_bez_tech), None);
    }

    #[test]
    fn tech_scope_przycina_i_filtruje_epoki() {
        let techs = [
            (Some("Rolnictwo"), Some("Kamień")),
            (Some(" Pismo "), Some(" Brąz ")),
            (Some("Zelazo"), Some("Żelazo")),
            (Some(""), Some("Kamień")),
            (None, Some("Kamień")),
            (Some("Inna"), Some("Inna")),
        ];
        assert_eq!(
            tech_ids_in_game_scope(&techs, 1),
            vec!["Rolnictwo".to_string()]
        );
        assert_eq!(
            tech_ids_in_game_scope(&techs, 3),
            vec![
                "Rolnictwo".to_string(),
                "Pismo".to_string(),
                "Zelazo".to_string()
            ]
        );
    }

    #[test]
    fn flagi_stanu_domyslnie_bez_przegranej() {
        let mut flags = VictoryFlags::default();
        assert!(!flags.gracz_kiedys_mial_miasto);
        assert!(!flags.is_game_over());
        flags.note_player_city_founded();
        assert!(flags.gracz_kiedys_mial_miasto);
        let wynik = VictoryResult {
            winner: 0,
            rodzaj: VictoryKind::Dominacja,
        };
        assert!(flags.set_game_over(wynik));
        assert!(!flags.set_game_over(VictoryResult {
            winner: 1,
            rodzaj: VictoryKind::Przegrana
        }));
        assert_eq!(flags.koniec_gry, Some(wynik));
    }
}
