//! P6 SIEGE-TAKTYKA KLASY (#217, R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASY-Q1, runda 1 Operatora): klasyfikatory
//! jednostek bitwy oblezniczej, ktore dotad byly WEJSCIAMI modulow K0b/K1/K1b/K3/K4 (flagi `is_siege_unit`,
//! `is_ram`, `is_siege_tower`, `can_shoot`).
//!
//! Port 1:1 z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`is_siege_unit`] = `isSiegeUnit(bu)` (`:1552-1559`).
//! * [`is_siege_tower`] = `isSiegeTower(bu)` (`:1561-1564`).
//! * [`is_ram`] = `_isRam(bu)` (metoda, `:7402-7405`).
//! * [`can_shoot`] = `canShoot(ru)` (`:1457-1459`).
//! * [`norm_name`] = `normName(s)` (`:1648-1650`), zaleznosc trzech pierwszych.
//!
//! WEJSCIE: jawne struktury [`ClassifyUnit`] i [`ShootUnit`] zamiast `BattleUnit`/`RuntimeBattleUnit`. Rust nie ma
//! modelu jednostek bitwy z `stats` (grep `BattleUnit` / `RuntimeBattleUnit` w `rust-port/engine/src`: brak); tabela
//! `UnitRecord` (`data/units_combat.rs`) nie niesie pola `Typ`. Pola [`ClassifyUnit`] = wartosci JS po
//! `String(v)`, a `None` = wartosc `null`/`undefined` (lub brak `stats`), co odpowiada `?? ''` / `?? nazwa` w pinie.
//!
//! Zgodnosc: wektory `tests/p6_siege_tactics_classify_vectors/vectors.json` (generator `p6_siege_tactics_classify_gen.mts`
//! WYKONUJE linie pinu w harnessie Node, straznik SHA-256). Test: `tests/p6_siege_tactics_classify.rs`.
//!
//! `trim`: [`js_trim`] = `String.prototype.trim` (JS), a nie `str::trim` (Rust). Roznice zmierzone w Node dla BMP:
//! U+0085 (NEL) jest bialym znakiem Rust, nie JS; U+FEFF (BOM) jest JS, nie Rust. Poza BMP zbiory sie nie roznia.
//!
//! GRANICE (NIE_ZMIERZONO poza wektorami): `norm_name` pokrywa dekompozycje NFD dla calego zakresu U+00C0..U+017F
//! (Latin-1 Supplement + Latin Extended-A, kazdy znak wektorowany osobno), a nie pelne Unicode NFD (tabela
//! [`strip_diacritic`]); `to_lowercase` nie rozni sie od JS poza regula finalnego sigma (wektory bez `Σ`).

/// Wejscie klasyfikatora jednostki (`bu`): `bu.stats['Typ']`, `bu.stats['Jednostka']`, `bu.nazwa`.
/// Kazde pole = `String(v)` dla `v` niepustego (nie null/undefined), `None` dla null/undefined/brak stats.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ClassifyUnit {
    /// `bu.stats?.['Typ']`.
    pub typ: Option<String>,
    /// `bu.stats?.['Jednostka']`.
    pub jednostka: Option<String>,
    /// `bu.nazwa`.
    pub nazwa: Option<String>,
}

/// Wejscie `canShoot(ru)`: pola `ru.rangedBase` i `ru.ammoLeft` (JS `ammoLeft > 0`; NaN daje fałsz).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ShootUnit {
    pub ranged_base: bool,
    pub ammo_left: f64,
}

/// `String.prototype.trim` (JS): obcina biale znaki JS (WhiteSpace + LineTerminator). Wzgledem `str::trim` (Rust):
/// bez U+0085 (NEL, bialy znak Rust, nie JS) i z U+FEFF (BOM, JS, nie Rust). Zestawienie zmierzone w Node (BMP).
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(|c: char| (c.is_whitespace() && c != '\u{0085}') || c == '\u{FEFF}')
}

/// Odpowiednik bazowej litery dla znaku z dekompozycja NFD (tylko diakrytyk; reszta bez zmian).
/// Obejmuje caly zakres U+00C0..U+017F, ktory ma dekompozycje NFD do litery bazowej (Latin-1 Supplement i Latin
/// Extended-A; zbior zweryfikowany w Node: kazdy znak z dekompozycja ma wpis). Wektory: pelny zakres w `normName`.
/// `ł`/`Ł` NIE sa tu: nie dekomponuja sie w NFD, obsluguje je [`norm_name`] osobno (`łŁ` -> `l`).
fn strip_diacritic(c: char) -> char {
    match c {
        'À' | 'Á' | 'Â' | 'Ã' | 'Ä' | 'Å' | 'Ā' | 'Ă' | 'Ą' => 'A',
        'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' | 'ā' | 'ă' | 'ą' => 'a',
        'Ç' | 'Ć' | 'Č' => 'C',
        'ç' | 'ć' | 'č' => 'c',
        'Ď' => 'D',
        'ď' => 'd',
        'È' | 'É' | 'Ê' | 'Ë' | 'Ē' | 'Ĕ' | 'Ę' | 'Ě' => 'E',
        'è' | 'é' | 'ê' | 'ë' | 'ē' | 'ĕ' | 'ę' | 'ě' => 'e',
        'Ğ' => 'G',
        'ğ' => 'g',
        'Ì' | 'Í' | 'Î' | 'Ï' | 'Ī' | 'Ĭ' | 'İ' => 'I',
        'ì' | 'í' | 'î' | 'ï' | 'ī' | 'ĭ' => 'i',
        'Ñ' | 'Ń' => 'N',
        'ñ' | 'ń' => 'n',
        'Ò' | 'Ó' | 'Ô' | 'Õ' | 'Ö' | 'Ō' | 'Ŏ' | 'Ő' => 'O',
        'ò' | 'ó' | 'ô' | 'õ' | 'ö' | 'ō' | 'ŏ' | 'ő' => 'o',
        'Ĉ' | 'Ċ' => 'C',
        'ĉ' | 'ċ' => 'c',
        'Ė' => 'E',
        'ė' => 'e',
        'Ĝ' | 'Ġ' => 'G',
        'ĝ' | 'ġ' => 'g',
        'Ĥ' => 'H',
        'ĥ' => 'h',
        'Ĩ' | 'Į' => 'I',
        'ĩ' | 'į' => 'i',
        'Ĵ' => 'J',
        'ĵ' => 'j',
        'Ŝ' => 'S',
        'ŝ' => 's',
        'Ũ' | 'Ų' => 'U',
        'ũ' | 'ų' => 'u',
        'Ŵ' => 'W',
        'ŵ' => 'w',
        'Ŷ' => 'Y',
        'ŷ' => 'y',
        'Ĺ' | 'Ļ' | 'Ľ' => 'L',
        'ĺ' | 'ļ' | 'ľ' => 'l',
        'Ģ' => 'G',
        'ģ' => 'g',
        'Ķ' => 'K',
        'ķ' => 'k',
        'Ņ' | 'Ň' => 'N',
        'ņ' | 'ň' => 'n',
        'Ŗ' => 'R',
        'ŗ' => 'r',
        'Ţ' => 'T',
        'ţ' => 't',
        'Ŕ' | 'Ř' => 'R',
        'ŕ' | 'ř' => 'r',
        'Ś' | 'Ş' | 'Š' => 'S',
        'ś' | 'ş' | 'š' => 's',
        'Ť' => 'T',
        'ť' => 't',
        'Ù' | 'Ú' | 'Û' | 'Ü' | 'Ū' | 'Ŭ' | 'Ů' | 'Ű' => 'U',
        'ù' | 'ú' | 'û' | 'ü' | 'ū' | 'ŭ' | 'ů' | 'ű' => 'u',
        'Ý' | 'Ÿ' => 'Y',
        'ý' | 'ÿ' => 'y',
        'Ź' | 'Ż' | 'Ž' => 'Z',
        'ź' | 'ż' | 'ž' => 'z',
        other => other,
    }
}

/// Web `normName(s)`: `s.normalize('NFD')`, usuniecie znakow lacznych U+0300..U+036F, `ł`/`Ł` -> `l`, `toLowerCase()`.
pub fn norm_name(s: &str) -> String {
    let mut stripped = String::with_capacity(s.len());
    for c in s.chars() {
        let base = strip_diacritic(c);
        if ('\u{0300}'..='\u{036F}').contains(&base) {
            continue;
        }
        match base {
            'ł' | 'Ł' => stripped.push('l'),
            other => stripped.push(other),
        }
    }
    stripped.to_lowercase()
}

/// Wartosc `String(bu.stats?.['Jednostka'] ?? bu.nazwa ?? '')` (bez trim).
fn jednostka_or_nazwa(u: &ClassifyUnit) -> String {
    u.jednostka
        .clone()
        .or_else(|| u.nazwa.clone())
        .unwrap_or_default()
}

/// Web `isSiegeUnit(bu)` (`battleScene.ts:1552-1559`): `Typ` po trim rowny `Siege`, albo nazwa znormalizowana
/// zawiera `taran`, `katapult`, `wieza oblezn`, `battering`, `catapult` lub `siege tower`.
pub fn is_siege_unit(u: &ClassifyUnit) -> bool {
    let typ = js_trim(u.typ.as_deref().unwrap_or(""));
    if typ == "Siege" {
        return true;
    }
    let n = norm_name(&jednostka_or_nazwa(u));
    n.contains("taran")
        || n.contains("katapult")
        || n.contains("wieza oblezn")
        || n.contains("battering")
        || n.contains("catapult")
        || n.contains("siege tower")
}

/// Web `isSiegeTower(bu)` (`battleScene.ts:1561-1564`): nazwa znormalizowana zawiera `wieza oblezn` lub `siege tower`.
pub fn is_siege_tower(u: &ClassifyUnit) -> bool {
    let n = norm_name(&jednostka_or_nazwa(u));
    n.contains("wieza oblezn") || n.contains("siege tower")
}

/// Web `_isRam(bu)` (`battleScene.ts:7402-7405`): nazwa znormalizowana zawiera `taran` lub `battering`.
pub fn is_ram(u: &ClassifyUnit) -> bool {
    let n = norm_name(&jednostka_or_nazwa(u));
    n.contains("taran") || n.contains("battering")
}

/// Web `canShoot(ru)` (`battleScene.ts:1457-1459`): `ru.rangedBase && ru.ammoLeft > 0`.
pub fn can_shoot(ru: &ShootUnit) -> bool {
    ru.ranged_base && ru.ammo_left > 0.0
}
