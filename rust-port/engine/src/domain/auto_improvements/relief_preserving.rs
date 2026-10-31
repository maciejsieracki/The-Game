//! P6.8I: port `relief-preserving-improvements.ts` (wersja z PINA 91dc998a).
//!
//! Ulepszenia, ktore NIE splaszczaja wzgorza/gory pod soba: jawne klucze
//! (bydlo / owce / lama / kamieniolom / tartak) oraz prefiks `kopalnia_*` i legacy `kopalnia`.
//! Pusta lista warstw = `false`. Porownanie kluczy: dokladna rownosc / `starts_with` na bajtach
//! UTF-8 (odpowiednik `Set.has` i `String.prototype.startsWith` dla tych danych).

/// Jawne klucze BEZ prefiksu "kopalnia" (pin 91dc998a: hodowla solo, kamieniolom, tartak).
const PRESERVES_HILL_RELIEF_EXPLICIT_KEYS: [&str; 5] =
    ["bydlo", "owce", "lama", "kamieniolom", "tartak"];

const KOPALNIA_PREFIX: &str = "kopalnia_";
/// Legacy uniwersalna "kopalnia" (stare zapisy/migracje).
const KOPALNIA_LEGACY_KEY: &str = "kopalnia";

/// Czy POJEDYNCZY klucz ulepszenia zachowuje relief wzgorza/gory pod soba.
pub fn preserves_hill_relief_key(key: &str) -> bool {
    if PRESERVES_HILL_RELIEF_EXPLICIT_KEYS.contains(&key) {
        return true;
    }
    key == KOPALNIA_LEGACY_KEY || key.starts_with(KOPALNIA_PREFIX)
}

/// Czy WSZYSTKIE warstwy ulepszen na heksie zachowuja relief (pusta lista = `false`).
pub fn preserves_hill_relief<S: AsRef<str>>(layers: &[S]) -> bool {
    !layers.is_empty() && layers.iter().all(|k| preserves_hill_relief_key(k.as_ref()))
}
