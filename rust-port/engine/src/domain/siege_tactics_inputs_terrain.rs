//! P6 SIEGE-TAKTYKA K5I-2a1 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1): czyste funkcje terenowe z pinu `07d2fbd72`.
//!
//! Port 1:1 (pin: pliki sa w `gra/src/game/`, nie w `gra/src/battle/`):
//! * [`norm_terrain`] = `normTerrain` (`combat.ts:620-624`),
//! * [`parse_defense_bonus_pct`] = `parseDefenseBonusPct` (`combat.ts:632-637`),
//! * [`terrain_defense_multiplier`] = `terrainDefenseMultiplier` (`combat.ts:639-671`),
//! * [`terrain_river_attack_multiplier`] = `terrainRiverAttackMultiplier` (`combat.ts:677-687`),
//! * [`city_gated_terrain_multiplier`] = `cityGatedTerrainMultiplier` (`city-defense.ts:180-190`).
//!
//! Normalizacja tekstu (NFD bez znakow U+0300..U+036F, lowercase; `parseFloat` pierwszej liczby calkowitej,
//! `''`, `'---'`, `includes('rzek')`) jest CZESCIA portu. Wejscia odzwierciedlaja typy JS: `&str`,
//! `Option<&str>` (`string | undefined`), `f64`.
//!
//! NFD: Rust `std` nie ma normalizacji Unicode, a dodawanie zaleznosci jest poza zakresem tematu. Dlatego
//! `normTerrain` uzywa tabeli "znak -> wynik NFD po zdjeciu U+0300..U+036F" wygenerowanej z `String.prototype.normalize`
//! Node 22 (`p6_siege_tactics_inputs_terrain_gen.mjs --table`; wszystkie punkty kodowe poza surogatami i sylabami Hangul)
//! oraz algorytmicznej dekompozycji Hangul. Zgodnosc dowodzi test wektorowy (skrot FNV-1a po wszystkich punktach kodowych).
//! Kanoniczne uporzadkowanie (Canonical Ordering Algorithm, NFD) znakow laczacych (ccc>0) jest czescia portu:
//! [`canonical_order`] sortuje stabilnie kazdy ciag niestartowych wg rangi ccc z tabeli [`CCC_RANK`]
//! (generowanej z zachowania `normalize('NFD')` Node 22, `p6_siege_tactics_inputs_terrain_gen.mjs --ccc`).
//! Porzadek jest liczony na calym wyniku dekompozycji (takze miedzy znakami wejscia), a usuniecie U+0300..U+036F
//! po sortowaniu daje ten sam wynik co przed nim (usuniecie nie zmienia wzglednej kolejnosci pozostalych i nie
//! tworzy ani nie kasuje starterow). Samotne surogaty UTF-16 nie istnieja w `&str`.

/// Wiersz danych terenu (`TerrainEntry` z pinu, tylko pola czytane przez porty: `Teren`, `Bonus Obrona`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TerrainEntry<'a> {
    /// Pole `Teren`.
    pub teren: &'a str,
    /// Pole `Bonus Obrona` (`string | undefined` w `parseDefenseBonusPct`).
    pub bonus_obrona: Option<&'a str>,
}

/// `normTerrain` (combat.ts:620-624): NFD, usuniecie znakow U+0300..U+036F, lowercase.
pub fn norm_terrain(s: &str) -> String {
    let mut cps: Vec<u32> = Vec::with_capacity(s.len());
    for c in s.chars() {
        let cp = c as u32;
        if (0xAC00..=0xD7A3).contains(&cp) {
            // Hangul: dekompozycja algorytmiczna (L, V, opcjonalnie T); ccc = 0, brak znakow do zdjecia.
            let si = cp - 0xAC00;
            cps.push(0x1100 + si / 588);
            cps.push(0x1161 + (si % 588) / 28);
            if !si.is_multiple_of(28) {
                cps.push(0x11A7 + si % 28);
            }
        } else if let Ok(i) = NFD_STRIPPED.binary_search_by_key(&cp, |&(k, _)| k) {
            cps.extend(NFD_STRIPPED[i].1.chars().map(u32::from));
        } else {
            cps.push(cp);
        }
    }
    canonical_order(&mut cps);
    let mut out = String::with_capacity(s.len());
    for cp in cps {
        if let Some(c) = char::from_u32(cp) {
            out.push(c);
        }
    }
    out.to_lowercase()
}

/// Ranga ccc punktu (0 = starter albo punkt spoza tabeli [`CCC_RANK`]).
fn ccc_rank(cp: u32) -> u8 {
    CCC_RANK
        .binary_search_by_key(&cp, |&(k, _)| k)
        .map_or(0, |i| CCC_RANK[i].1)
}

/// Canonical Ordering Algorithm: kazdy maksymalny ciag niestartowych (ccc>0) sortowany stabilnie wg rangi ccc.
fn canonical_order(cps: &mut [u32]) {
    let mut i = 0;
    while i < cps.len() {
        if ccc_rank(cps[i]) == 0 {
            i += 1;
            continue;
        }
        let start = i;
        while i < cps.len() && ccc_rank(cps[i]) != 0 {
            i += 1;
        }
        cps[start..i].sort_by_key(|&c| ccc_rank(c));
    }
}

/// `parseDefenseBonusPct` (combat.ts:632-637): `None` dla braku/`''`/`'+0%'`/`'---'` lub braku cyfr ASCII;
/// inaczej `parseFloat` pierwszego dopasowania `([+-]?\d+)` (`\d` = tylko ASCII).
pub fn parse_defense_bonus_pct(bonus: Option<&str>) -> Option<f64> {
    let b = bonus?;
    if b.is_empty() || b == "+0%" || b == "---" {
        return None;
    }
    let bytes = b.as_bytes();
    for start in 0..bytes.len() {
        let mut j = start;
        if bytes[j] == b'+' || bytes[j] == b'-' {
            j += 1;
        }
        let digits_from = j;
        while j < bytes.len() && bytes[j].is_ascii_digit() {
            j += 1;
        }
        if j > digits_from {
            // Granice ciagu `[+-]?\d+` leza na bajtach ASCII, wiec wycinek jest poprawnym &str.
            // parse::<f64> daje +-inf przy przepelnieniu, jak parseFloat.
            return b[start..j].parse::<f64>().ok();
        }
    }
    None
}

/// `terrainDefenseMultiplier` (combat.ts:639-671): mnoznik Obrony obroncy z danych terenu.
/// Pusty teren lub puste dane -> 1.0; dopasowanie rozmyte (`includes` w obie strony po pierwszym slowie);
/// Las: 1.5 tylko vs `dystans`/`flanka` w roli atakujacego, inaczej 1.0; reszta wg `parse_defense_bonus_pct`.
pub fn terrain_defense_multiplier(
    defender_terrain: &str,
    attacker_rola: &str,
    terrain_data: &[TerrainEntry<'_>],
) -> f64 {
    if defender_terrain.is_empty() || terrain_data.is_empty() {
        return 1.0;
    }
    let terr_norm = norm_terrain(defender_terrain);
    let entry = terrain_data.iter().find(|t| {
        let t_norm = norm_terrain(t.teren);
        t_norm.contains(terr_norm.as_str())
            || terr_norm.contains(t_norm.split(' ').next().unwrap_or(""))
    });
    let Some(entry) = entry else {
        return 1.0;
    };
    if norm_terrain(entry.teren).contains("las") {
        let a_low = norm_terrain(attacker_rola);
        return if a_low.contains("dystans") || a_low.contains("flanka") {
            1.5
        } else {
            1.0
        };
    }
    match parse_defense_bonus_pct(entry.bonus_obrona) {
        Some(pct) => 1.0 + pct / 100.0,
        None => 1.0,
    }
}

/// `terrainRiverAttackMultiplier` (combat.ts:677-687): `river_attack_mult` (`combat-params.json`, wejscie)
/// gdy teren obroncy zawiera `rzek`/`river` i dane maja wiersz z `rzek`; inaczej 1.0.
pub fn terrain_river_attack_multiplier(
    defender_terrain: &str,
    terrain_data: &[TerrainEntry<'_>],
    river_attack_mult: f64,
) -> f64 {
    if defender_terrain.is_empty() || terrain_data.is_empty() {
        return 1.0;
    }
    let terr_norm = norm_terrain(defender_terrain);
    if !(terr_norm.contains("rzek") || terr_norm.contains("river")) {
        return 1.0;
    }
    if terrain_data
        .iter()
        .any(|t| norm_terrain(t.teren).contains("rzek"))
    {
        river_attack_mult
    } else {
        1.0
    }
}

/// `cityGatedTerrainMultiplier` (city-defense.ts:180-190): bonus terenu obrony MIASTA tylko z murem i tylko
/// dla wzniesien (`wzg`/`gor`); wartosc = `terrain_defense_multiplier(terrain, "", data)`.
pub fn city_gated_terrain_multiplier(
    has_mur: bool,
    terrain: &str,
    terrain_data: &[TerrainEntry<'_>],
) -> f64 {
    if !has_mur {
        return 1.0;
    }
    let terr_norm = norm_terrain(terrain);
    if !(terr_norm.contains("wzg") || terr_norm.contains("gor")) {
        return 1.0;
    }
    terrain_defense_multiplier(terrain, "", terrain_data)
}

/// Tabela "punkt kodowy -> wynik NFD po zdjeciu U+0300..U+036F" (posortowana rosnaco; GENEROWANA, nie edytowac recznie).
#[rustfmt::skip]
static NFD_STRIPPED: &[(u32, &str)] = &[
    (0xc0, "\u{41}"), (0xc1, "\u{41}"), (0xc2, "\u{41}"), (0xc3, "\u{41}"), (0xc4, "\u{41}"), (0xc5, "\u{41}"),
    (0xc7, "\u{43}"), (0xc8, "\u{45}"), (0xc9, "\u{45}"), (0xca, "\u{45}"), (0xcb, "\u{45}"), (0xcc, "\u{49}"),
    (0xcd, "\u{49}"), (0xce, "\u{49}"), (0xcf, "\u{49}"), (0xd1, "\u{4e}"), (0xd2, "\u{4f}"), (0xd3, "\u{4f}"),
    (0xd4, "\u{4f}"), (0xd5, "\u{4f}"), (0xd6, "\u{4f}"), (0xd9, "\u{55}"), (0xda, "\u{55}"), (0xdb, "\u{55}"),
    (0xdc, "\u{55}"), (0xdd, "\u{59}"), (0xe0, "\u{61}"), (0xe1, "\u{61}"), (0xe2, "\u{61}"), (0xe3, "\u{61}"),
    (0xe4, "\u{61}"), (0xe5, "\u{61}"), (0xe7, "\u{63}"), (0xe8, "\u{65}"), (0xe9, "\u{65}"), (0xea, "\u{65}"),
    (0xeb, "\u{65}"), (0xec, "\u{69}"), (0xed, "\u{69}"), (0xee, "\u{69}"), (0xef, "\u{69}"), (0xf1, "\u{6e}"),
    (0xf2, "\u{6f}"), (0xf3, "\u{6f}"), (0xf4, "\u{6f}"), (0xf5, "\u{6f}"), (0xf6, "\u{6f}"), (0xf9, "\u{75}"),
    (0xfa, "\u{75}"), (0xfb, "\u{75}"), (0xfc, "\u{75}"), (0xfd, "\u{79}"), (0xff, "\u{79}"), (0x100, "\u{41}"),
    (0x101, "\u{61}"), (0x102, "\u{41}"), (0x103, "\u{61}"), (0x104, "\u{41}"), (0x105, "\u{61}"), (0x106, "\u{43}"),
    (0x107, "\u{63}"), (0x108, "\u{43}"), (0x109, "\u{63}"), (0x10a, "\u{43}"), (0x10b, "\u{63}"), (0x10c, "\u{43}"),
    (0x10d, "\u{63}"), (0x10e, "\u{44}"), (0x10f, "\u{64}"), (0x112, "\u{45}"), (0x113, "\u{65}"), (0x114, "\u{45}"),
    (0x115, "\u{65}"), (0x116, "\u{45}"), (0x117, "\u{65}"), (0x118, "\u{45}"), (0x119, "\u{65}"), (0x11a, "\u{45}"),
    (0x11b, "\u{65}"), (0x11c, "\u{47}"), (0x11d, "\u{67}"), (0x11e, "\u{47}"), (0x11f, "\u{67}"), (0x120, "\u{47}"),
    (0x121, "\u{67}"), (0x122, "\u{47}"), (0x123, "\u{67}"), (0x124, "\u{48}"), (0x125, "\u{68}"), (0x128, "\u{49}"),
    (0x129, "\u{69}"), (0x12a, "\u{49}"), (0x12b, "\u{69}"), (0x12c, "\u{49}"), (0x12d, "\u{69}"), (0x12e, "\u{49}"),
    (0x12f, "\u{69}"), (0x130, "\u{49}"), (0x134, "\u{4a}"), (0x135, "\u{6a}"), (0x136, "\u{4b}"), (0x137, "\u{6b}"),
    (0x139, "\u{4c}"), (0x13a, "\u{6c}"), (0x13b, "\u{4c}"), (0x13c, "\u{6c}"), (0x13d, "\u{4c}"), (0x13e, "\u{6c}"),
    (0x143, "\u{4e}"), (0x144, "\u{6e}"), (0x145, "\u{4e}"), (0x146, "\u{6e}"), (0x147, "\u{4e}"), (0x148, "\u{6e}"),
    (0x14c, "\u{4f}"), (0x14d, "\u{6f}"), (0x14e, "\u{4f}"), (0x14f, "\u{6f}"), (0x150, "\u{4f}"), (0x151, "\u{6f}"),
    (0x154, "\u{52}"), (0x155, "\u{72}"), (0x156, "\u{52}"), (0x157, "\u{72}"), (0x158, "\u{52}"), (0x159, "\u{72}"),
    (0x15a, "\u{53}"), (0x15b, "\u{73}"), (0x15c, "\u{53}"), (0x15d, "\u{73}"), (0x15e, "\u{53}"), (0x15f, "\u{73}"),
    (0x160, "\u{53}"), (0x161, "\u{73}"), (0x162, "\u{54}"), (0x163, "\u{74}"), (0x164, "\u{54}"), (0x165, "\u{74}"),
    (0x168, "\u{55}"), (0x169, "\u{75}"), (0x16a, "\u{55}"), (0x16b, "\u{75}"), (0x16c, "\u{55}"), (0x16d, "\u{75}"),
    (0x16e, "\u{55}"), (0x16f, "\u{75}"), (0x170, "\u{55}"), (0x171, "\u{75}"), (0x172, "\u{55}"), (0x173, "\u{75}"),
    (0x174, "\u{57}"), (0x175, "\u{77}"), (0x176, "\u{59}"), (0x177, "\u{79}"), (0x178, "\u{59}"), (0x179, "\u{5a}"),
    (0x17a, "\u{7a}"), (0x17b, "\u{5a}"), (0x17c, "\u{7a}"), (0x17d, "\u{5a}"), (0x17e, "\u{7a}"), (0x1a0, "\u{4f}"),
    (0x1a1, "\u{6f}"), (0x1af, "\u{55}"), (0x1b0, "\u{75}"), (0x1cd, "\u{41}"), (0x1ce, "\u{61}"), (0x1cf, "\u{49}"),
    (0x1d0, "\u{69}"), (0x1d1, "\u{4f}"), (0x1d2, "\u{6f}"), (0x1d3, "\u{55}"), (0x1d4, "\u{75}"), (0x1d5, "\u{55}"),
    (0x1d6, "\u{75}"), (0x1d7, "\u{55}"), (0x1d8, "\u{75}"), (0x1d9, "\u{55}"), (0x1da, "\u{75}"), (0x1db, "\u{55}"),
    (0x1dc, "\u{75}"), (0x1de, "\u{41}"), (0x1df, "\u{61}"), (0x1e0, "\u{41}"), (0x1e1, "\u{61}"), (0x1e2, "\u{c6}"),
    (0x1e3, "\u{e6}"), (0x1e6, "\u{47}"), (0x1e7, "\u{67}"), (0x1e8, "\u{4b}"), (0x1e9, "\u{6b}"), (0x1ea, "\u{4f}"),
    (0x1eb, "\u{6f}"), (0x1ec, "\u{4f}"), (0x1ed, "\u{6f}"), (0x1ee, "\u{1b7}"), (0x1ef, "\u{292}"), (0x1f0, "\u{6a}"),
    (0x1f4, "\u{47}"), (0x1f5, "\u{67}"), (0x1f8, "\u{4e}"), (0x1f9, "\u{6e}"), (0x1fa, "\u{41}"), (0x1fb, "\u{61}"),
    (0x1fc, "\u{c6}"), (0x1fd, "\u{e6}"), (0x1fe, "\u{d8}"), (0x1ff, "\u{f8}"), (0x200, "\u{41}"), (0x201, "\u{61}"),
    (0x202, "\u{41}"), (0x203, "\u{61}"), (0x204, "\u{45}"), (0x205, "\u{65}"), (0x206, "\u{45}"), (0x207, "\u{65}"),
    (0x208, "\u{49}"), (0x209, "\u{69}"), (0x20a, "\u{49}"), (0x20b, "\u{69}"), (0x20c, "\u{4f}"), (0x20d, "\u{6f}"),
    (0x20e, "\u{4f}"), (0x20f, "\u{6f}"), (0x210, "\u{52}"), (0x211, "\u{72}"), (0x212, "\u{52}"), (0x213, "\u{72}"),
    (0x214, "\u{55}"), (0x215, "\u{75}"), (0x216, "\u{55}"), (0x217, "\u{75}"), (0x218, "\u{53}"), (0x219, "\u{73}"),
    (0x21a, "\u{54}"), (0x21b, "\u{74}"), (0x21e, "\u{48}"), (0x21f, "\u{68}"), (0x226, "\u{41}"), (0x227, "\u{61}"),
    (0x228, "\u{45}"), (0x229, "\u{65}"), (0x22a, "\u{4f}"), (0x22b, "\u{6f}"), (0x22c, "\u{4f}"), (0x22d, "\u{6f}"),
    (0x22e, "\u{4f}"), (0x22f, "\u{6f}"), (0x230, "\u{4f}"), (0x231, "\u{6f}"), (0x232, "\u{59}"), (0x233, "\u{79}"),
    (0x300, ""), (0x301, ""), (0x302, ""), (0x303, ""), (0x304, ""), (0x305, ""),
    (0x306, ""), (0x307, ""), (0x308, ""), (0x309, ""), (0x30a, ""), (0x30b, ""),
    (0x30c, ""), (0x30d, ""), (0x30e, ""), (0x30f, ""), (0x310, ""), (0x311, ""),
    (0x312, ""), (0x313, ""), (0x314, ""), (0x315, ""), (0x316, ""), (0x317, ""),
    (0x318, ""), (0x319, ""), (0x31a, ""), (0x31b, ""), (0x31c, ""), (0x31d, ""),
    (0x31e, ""), (0x31f, ""), (0x320, ""), (0x321, ""), (0x322, ""), (0x323, ""),
    (0x324, ""), (0x325, ""), (0x326, ""), (0x327, ""), (0x328, ""), (0x329, ""),
    (0x32a, ""), (0x32b, ""), (0x32c, ""), (0x32d, ""), (0x32e, ""), (0x32f, ""),
    (0x330, ""), (0x331, ""), (0x332, ""), (0x333, ""), (0x334, ""), (0x335, ""),
    (0x336, ""), (0x337, ""), (0x338, ""), (0x339, ""), (0x33a, ""), (0x33b, ""),
    (0x33c, ""), (0x33d, ""), (0x33e, ""), (0x33f, ""), (0x340, ""), (0x341, ""),
    (0x342, ""), (0x343, ""), (0x344, ""), (0x345, ""), (0x346, ""), (0x347, ""),
    (0x348, ""), (0x349, ""), (0x34a, ""), (0x34b, ""), (0x34c, ""), (0x34d, ""),
    (0x34e, ""), (0x34f, ""), (0x350, ""), (0x351, ""), (0x352, ""), (0x353, ""),
    (0x354, ""), (0x355, ""), (0x356, ""), (0x357, ""), (0x358, ""), (0x359, ""),
    (0x35a, ""), (0x35b, ""), (0x35c, ""), (0x35d, ""), (0x35e, ""), (0x35f, ""),
    (0x360, ""), (0x361, ""), (0x362, ""), (0x363, ""), (0x364, ""), (0x365, ""),
    (0x366, ""), (0x367, ""), (0x368, ""), (0x369, ""), (0x36a, ""), (0x36b, ""),
    (0x36c, ""), (0x36d, ""), (0x36e, ""), (0x36f, ""), (0x374, "\u{2b9}"), (0x37e, "\u{3b}"),
    (0x385, "\u{a8}"), (0x386, "\u{391}"), (0x387, "\u{b7}"), (0x388, "\u{395}"), (0x389, "\u{397}"), (0x38a, "\u{399}"),
    (0x38c, "\u{39f}"), (0x38e, "\u{3a5}"), (0x38f, "\u{3a9}"), (0x390, "\u{3b9}"), (0x3aa, "\u{399}"), (0x3ab, "\u{3a5}"),
    (0x3ac, "\u{3b1}"), (0x3ad, "\u{3b5}"), (0x3ae, "\u{3b7}"), (0x3af, "\u{3b9}"), (0x3b0, "\u{3c5}"), (0x3ca, "\u{3b9}"),
    (0x3cb, "\u{3c5}"), (0x3cc, "\u{3bf}"), (0x3cd, "\u{3c5}"), (0x3ce, "\u{3c9}"), (0x3d3, "\u{3d2}"), (0x3d4, "\u{3d2}"),
    (0x400, "\u{415}"), (0x401, "\u{415}"), (0x403, "\u{413}"), (0x407, "\u{406}"), (0x40c, "\u{41a}"), (0x40d, "\u{418}"),
    (0x40e, "\u{423}"), (0x419, "\u{418}"), (0x439, "\u{438}"), (0x450, "\u{435}"), (0x451, "\u{435}"), (0x453, "\u{433}"),
    (0x457, "\u{456}"), (0x45c, "\u{43a}"), (0x45d, "\u{438}"), (0x45e, "\u{443}"), (0x476, "\u{474}"), (0x477, "\u{475}"),
    (0x4c1, "\u{416}"), (0x4c2, "\u{436}"), (0x4d0, "\u{410}"), (0x4d1, "\u{430}"), (0x4d2, "\u{410}"), (0x4d3, "\u{430}"),
    (0x4d6, "\u{415}"), (0x4d7, "\u{435}"), (0x4da, "\u{4d8}"), (0x4db, "\u{4d9}"), (0x4dc, "\u{416}"), (0x4dd, "\u{436}"),
    (0x4de, "\u{417}"), (0x4df, "\u{437}"), (0x4e2, "\u{418}"), (0x4e3, "\u{438}"), (0x4e4, "\u{418}"), (0x4e5, "\u{438}"),
    (0x4e6, "\u{41e}"), (0x4e7, "\u{43e}"), (0x4ea, "\u{4e8}"), (0x4eb, "\u{4e9}"), (0x4ec, "\u{42d}"), (0x4ed, "\u{44d}"),
    (0x4ee, "\u{423}"), (0x4ef, "\u{443}"), (0x4f0, "\u{423}"), (0x4f1, "\u{443}"), (0x4f2, "\u{423}"), (0x4f3, "\u{443}"),
    (0x4f4, "\u{427}"), (0x4f5, "\u{447}"), (0x4f8, "\u{42b}"), (0x4f9, "\u{44b}"), (0x622, "\u{627}\u{653}"), (0x623, "\u{627}\u{654}"),
    (0x624, "\u{648}\u{654}"), (0x625, "\u{627}\u{655}"), (0x626, "\u{64a}\u{654}"), (0x6c0, "\u{6d5}\u{654}"), (0x6c2, "\u{6c1}\u{654}"), (0x6d3, "\u{6d2}\u{654}"),
    (0x929, "\u{928}\u{93c}"), (0x931, "\u{930}\u{93c}"), (0x934, "\u{933}\u{93c}"), (0x958, "\u{915}\u{93c}"), (0x959, "\u{916}\u{93c}"), (0x95a, "\u{917}\u{93c}"),
    (0x95b, "\u{91c}\u{93c}"), (0x95c, "\u{921}\u{93c}"), (0x95d, "\u{922}\u{93c}"), (0x95e, "\u{92b}\u{93c}"), (0x95f, "\u{92f}\u{93c}"), (0x9cb, "\u{9c7}\u{9be}"),
    (0x9cc, "\u{9c7}\u{9d7}"), (0x9dc, "\u{9a1}\u{9bc}"), (0x9dd, "\u{9a2}\u{9bc}"), (0x9df, "\u{9af}\u{9bc}"), (0xa33, "\u{a32}\u{a3c}"), (0xa36, "\u{a38}\u{a3c}"),
    (0xa59, "\u{a16}\u{a3c}"), (0xa5a, "\u{a17}\u{a3c}"), (0xa5b, "\u{a1c}\u{a3c}"), (0xa5e, "\u{a2b}\u{a3c}"), (0xb48, "\u{b47}\u{b56}"), (0xb4b, "\u{b47}\u{b3e}"),
    (0xb4c, "\u{b47}\u{b57}"), (0xb5c, "\u{b21}\u{b3c}"), (0xb5d, "\u{b22}\u{b3c}"), (0xb94, "\u{b92}\u{bd7}"), (0xbca, "\u{bc6}\u{bbe}"), (0xbcb, "\u{bc7}\u{bbe}"),
    (0xbcc, "\u{bc6}\u{bd7}"), (0xc48, "\u{c46}\u{c56}"), (0xcc0, "\u{cbf}\u{cd5}"), (0xcc7, "\u{cc6}\u{cd5}"), (0xcc8, "\u{cc6}\u{cd6}"), (0xcca, "\u{cc6}\u{cc2}"),
    (0xccb, "\u{cc6}\u{cc2}\u{cd5}"), (0xd4a, "\u{d46}\u{d3e}"), (0xd4b, "\u{d47}\u{d3e}"), (0xd4c, "\u{d46}\u{d57}"), (0xdda, "\u{dd9}\u{dca}"), (0xddc, "\u{dd9}\u{dcf}"),
    (0xddd, "\u{dd9}\u{dcf}\u{dca}"), (0xdde, "\u{dd9}\u{ddf}"), (0xf43, "\u{f42}\u{fb7}"), (0xf4d, "\u{f4c}\u{fb7}"), (0xf52, "\u{f51}\u{fb7}"), (0xf57, "\u{f56}\u{fb7}"),
    (0xf5c, "\u{f5b}\u{fb7}"), (0xf69, "\u{f40}\u{fb5}"), (0xf73, "\u{f71}\u{f72}"), (0xf75, "\u{f71}\u{f74}"), (0xf76, "\u{fb2}\u{f80}"), (0xf78, "\u{fb3}\u{f80}"),
    (0xf81, "\u{f71}\u{f80}"), (0xf93, "\u{f92}\u{fb7}"), (0xf9d, "\u{f9c}\u{fb7}"), (0xfa2, "\u{fa1}\u{fb7}"), (0xfa7, "\u{fa6}\u{fb7}"), (0xfac, "\u{fab}\u{fb7}"),
    (0xfb9, "\u{f90}\u{fb5}"), (0x1026, "\u{1025}\u{102e}"), (0x1b06, "\u{1b05}\u{1b35}"), (0x1b08, "\u{1b07}\u{1b35}"), (0x1b0a, "\u{1b09}\u{1b35}"), (0x1b0c, "\u{1b0b}\u{1b35}"),
    (0x1b0e, "\u{1b0d}\u{1b35}"), (0x1b12, "\u{1b11}\u{1b35}"), (0x1b3b, "\u{1b3a}\u{1b35}"), (0x1b3d, "\u{1b3c}\u{1b35}"), (0x1b40, "\u{1b3e}\u{1b35}"), (0x1b41, "\u{1b3f}\u{1b35}"),
    (0x1b43, "\u{1b42}\u{1b35}"), (0x1e00, "\u{41}"), (0x1e01, "\u{61}"), (0x1e02, "\u{42}"), (0x1e03, "\u{62}"), (0x1e04, "\u{42}"),
    (0x1e05, "\u{62}"), (0x1e06, "\u{42}"), (0x1e07, "\u{62}"), (0x1e08, "\u{43}"), (0x1e09, "\u{63}"), (0x1e0a, "\u{44}"),
    (0x1e0b, "\u{64}"), (0x1e0c, "\u{44}"), (0x1e0d, "\u{64}"), (0x1e0e, "\u{44}"), (0x1e0f, "\u{64}"), (0x1e10, "\u{44}"),
    (0x1e11, "\u{64}"), (0x1e12, "\u{44}"), (0x1e13, "\u{64}"), (0x1e14, "\u{45}"), (0x1e15, "\u{65}"), (0x1e16, "\u{45}"),
    (0x1e17, "\u{65}"), (0x1e18, "\u{45}"), (0x1e19, "\u{65}"), (0x1e1a, "\u{45}"), (0x1e1b, "\u{65}"), (0x1e1c, "\u{45}"),
    (0x1e1d, "\u{65}"), (0x1e1e, "\u{46}"), (0x1e1f, "\u{66}"), (0x1e20, "\u{47}"), (0x1e21, "\u{67}"), (0x1e22, "\u{48}"),
    (0x1e23, "\u{68}"), (0x1e24, "\u{48}"), (0x1e25, "\u{68}"), (0x1e26, "\u{48}"), (0x1e27, "\u{68}"), (0x1e28, "\u{48}"),
    (0x1e29, "\u{68}"), (0x1e2a, "\u{48}"), (0x1e2b, "\u{68}"), (0x1e2c, "\u{49}"), (0x1e2d, "\u{69}"), (0x1e2e, "\u{49}"),
    (0x1e2f, "\u{69}"), (0x1e30, "\u{4b}"), (0x1e31, "\u{6b}"), (0x1e32, "\u{4b}"), (0x1e33, "\u{6b}"), (0x1e34, "\u{4b}"),
    (0x1e35, "\u{6b}"), (0x1e36, "\u{4c}"), (0x1e37, "\u{6c}"), (0x1e38, "\u{4c}"), (0x1e39, "\u{6c}"), (0x1e3a, "\u{4c}"),
    (0x1e3b, "\u{6c}"), (0x1e3c, "\u{4c}"), (0x1e3d, "\u{6c}"), (0x1e3e, "\u{4d}"), (0x1e3f, "\u{6d}"), (0x1e40, "\u{4d}"),
    (0x1e41, "\u{6d}"), (0x1e42, "\u{4d}"), (0x1e43, "\u{6d}"), (0x1e44, "\u{4e}"), (0x1e45, "\u{6e}"), (0x1e46, "\u{4e}"),
    (0x1e47, "\u{6e}"), (0x1e48, "\u{4e}"), (0x1e49, "\u{6e}"), (0x1e4a, "\u{4e}"), (0x1e4b, "\u{6e}"), (0x1e4c, "\u{4f}"),
    (0x1e4d, "\u{6f}"), (0x1e4e, "\u{4f}"), (0x1e4f, "\u{6f}"), (0x1e50, "\u{4f}"), (0x1e51, "\u{6f}"), (0x1e52, "\u{4f}"),
    (0x1e53, "\u{6f}"), (0x1e54, "\u{50}"), (0x1e55, "\u{70}"), (0x1e56, "\u{50}"), (0x1e57, "\u{70}"), (0x1e58, "\u{52}"),
    (0x1e59, "\u{72}"), (0x1e5a, "\u{52}"), (0x1e5b, "\u{72}"), (0x1e5c, "\u{52}"), (0x1e5d, "\u{72}"), (0x1e5e, "\u{52}"),
    (0x1e5f, "\u{72}"), (0x1e60, "\u{53}"), (0x1e61, "\u{73}"), (0x1e62, "\u{53}"), (0x1e63, "\u{73}"), (0x1e64, "\u{53}"),
    (0x1e65, "\u{73}"), (0x1e66, "\u{53}"), (0x1e67, "\u{73}"), (0x1e68, "\u{53}"), (0x1e69, "\u{73}"), (0x1e6a, "\u{54}"),
    (0x1e6b, "\u{74}"), (0x1e6c, "\u{54}"), (0x1e6d, "\u{74}"), (0x1e6e, "\u{54}"), (0x1e6f, "\u{74}"), (0x1e70, "\u{54}"),
    (0x1e71, "\u{74}"), (0x1e72, "\u{55}"), (0x1e73, "\u{75}"), (0x1e74, "\u{55}"), (0x1e75, "\u{75}"), (0x1e76, "\u{55}"),
    (0x1e77, "\u{75}"), (0x1e78, "\u{55}"), (0x1e79, "\u{75}"), (0x1e7a, "\u{55}"), (0x1e7b, "\u{75}"), (0x1e7c, "\u{56}"),
    (0x1e7d, "\u{76}"), (0x1e7e, "\u{56}"), (0x1e7f, "\u{76}"), (0x1e80, "\u{57}"), (0x1e81, "\u{77}"), (0x1e82, "\u{57}"),
    (0x1e83, "\u{77}"), (0x1e84, "\u{57}"), (0x1e85, "\u{77}"), (0x1e86, "\u{57}"), (0x1e87, "\u{77}"), (0x1e88, "\u{57}"),
    (0x1e89, "\u{77}"), (0x1e8a, "\u{58}"), (0x1e8b, "\u{78}"), (0x1e8c, "\u{58}"), (0x1e8d, "\u{78}"), (0x1e8e, "\u{59}"),
    (0x1e8f, "\u{79}"), (0x1e90, "\u{5a}"), (0x1e91, "\u{7a}"), (0x1e92, "\u{5a}"), (0x1e93, "\u{7a}"), (0x1e94, "\u{5a}"),
    (0x1e95, "\u{7a}"), (0x1e96, "\u{68}"), (0x1e97, "\u{74}"), (0x1e98, "\u{77}"), (0x1e99, "\u{79}"), (0x1e9b, "\u{17f}"),
    (0x1ea0, "\u{41}"), (0x1ea1, "\u{61}"), (0x1ea2, "\u{41}"), (0x1ea3, "\u{61}"), (0x1ea4, "\u{41}"), (0x1ea5, "\u{61}"),
    (0x1ea6, "\u{41}"), (0x1ea7, "\u{61}"), (0x1ea8, "\u{41}"), (0x1ea9, "\u{61}"), (0x1eaa, "\u{41}"), (0x1eab, "\u{61}"),
    (0x1eac, "\u{41}"), (0x1ead, "\u{61}"), (0x1eae, "\u{41}"), (0x1eaf, "\u{61}"), (0x1eb0, "\u{41}"), (0x1eb1, "\u{61}"),
    (0x1eb2, "\u{41}"), (0x1eb3, "\u{61}"), (0x1eb4, "\u{41}"), (0x1eb5, "\u{61}"), (0x1eb6, "\u{41}"), (0x1eb7, "\u{61}"),
    (0x1eb8, "\u{45}"), (0x1eb9, "\u{65}"), (0x1eba, "\u{45}"), (0x1ebb, "\u{65}"), (0x1ebc, "\u{45}"), (0x1ebd, "\u{65}"),
    (0x1ebe, "\u{45}"), (0x1ebf, "\u{65}"), (0x1ec0, "\u{45}"), (0x1ec1, "\u{65}"), (0x1ec2, "\u{45}"), (0x1ec3, "\u{65}"),
    (0x1ec4, "\u{45}"), (0x1ec5, "\u{65}"), (0x1ec6, "\u{45}"), (0x1ec7, "\u{65}"), (0x1ec8, "\u{49}"), (0x1ec9, "\u{69}"),
    (0x1eca, "\u{49}"), (0x1ecb, "\u{69}"), (0x1ecc, "\u{4f}"), (0x1ecd, "\u{6f}"), (0x1ece, "\u{4f}"), (0x1ecf, "\u{6f}"),
    (0x1ed0, "\u{4f}"), (0x1ed1, "\u{6f}"), (0x1ed2, "\u{4f}"), (0x1ed3, "\u{6f}"), (0x1ed4, "\u{4f}"), (0x1ed5, "\u{6f}"),
    (0x1ed6, "\u{4f}"), (0x1ed7, "\u{6f}"), (0x1ed8, "\u{4f}"), (0x1ed9, "\u{6f}"), (0x1eda, "\u{4f}"), (0x1edb, "\u{6f}"),
    (0x1edc, "\u{4f}"), (0x1edd, "\u{6f}"), (0x1ede, "\u{4f}"), (0x1edf, "\u{6f}"), (0x1ee0, "\u{4f}"), (0x1ee1, "\u{6f}"),
    (0x1ee2, "\u{4f}"), (0x1ee3, "\u{6f}"), (0x1ee4, "\u{55}"), (0x1ee5, "\u{75}"), (0x1ee6, "\u{55}"), (0x1ee7, "\u{75}"),
    (0x1ee8, "\u{55}"), (0x1ee9, "\u{75}"), (0x1eea, "\u{55}"), (0x1eeb, "\u{75}"), (0x1eec, "\u{55}"), (0x1eed, "\u{75}"),
    (0x1eee, "\u{55}"), (0x1eef, "\u{75}"), (0x1ef0, "\u{55}"), (0x1ef1, "\u{75}"), (0x1ef2, "\u{59}"), (0x1ef3, "\u{79}"),
    (0x1ef4, "\u{59}"), (0x1ef5, "\u{79}"), (0x1ef6, "\u{59}"), (0x1ef7, "\u{79}"), (0x1ef8, "\u{59}"), (0x1ef9, "\u{79}"),
    (0x1f00, "\u{3b1}"), (0x1f01, "\u{3b1}"), (0x1f02, "\u{3b1}"), (0x1f03, "\u{3b1}"), (0x1f04, "\u{3b1}"), (0x1f05, "\u{3b1}"),
    (0x1f06, "\u{3b1}"), (0x1f07, "\u{3b1}"), (0x1f08, "\u{391}"), (0x1f09, "\u{391}"), (0x1f0a, "\u{391}"), (0x1f0b, "\u{391}"),
    (0x1f0c, "\u{391}"), (0x1f0d, "\u{391}"), (0x1f0e, "\u{391}"), (0x1f0f, "\u{391}"), (0x1f10, "\u{3b5}"), (0x1f11, "\u{3b5}"),
    (0x1f12, "\u{3b5}"), (0x1f13, "\u{3b5}"), (0x1f14, "\u{3b5}"), (0x1f15, "\u{3b5}"), (0x1f18, "\u{395}"), (0x1f19, "\u{395}"),
    (0x1f1a, "\u{395}"), (0x1f1b, "\u{395}"), (0x1f1c, "\u{395}"), (0x1f1d, "\u{395}"), (0x1f20, "\u{3b7}"), (0x1f21, "\u{3b7}"),
    (0x1f22, "\u{3b7}"), (0x1f23, "\u{3b7}"), (0x1f24, "\u{3b7}"), (0x1f25, "\u{3b7}"), (0x1f26, "\u{3b7}"), (0x1f27, "\u{3b7}"),
    (0x1f28, "\u{397}"), (0x1f29, "\u{397}"), (0x1f2a, "\u{397}"), (0x1f2b, "\u{397}"), (0x1f2c, "\u{397}"), (0x1f2d, "\u{397}"),
    (0x1f2e, "\u{397}"), (0x1f2f, "\u{397}"), (0x1f30, "\u{3b9}"), (0x1f31, "\u{3b9}"), (0x1f32, "\u{3b9}"), (0x1f33, "\u{3b9}"),
    (0x1f34, "\u{3b9}"), (0x1f35, "\u{3b9}"), (0x1f36, "\u{3b9}"), (0x1f37, "\u{3b9}"), (0x1f38, "\u{399}"), (0x1f39, "\u{399}"),
    (0x1f3a, "\u{399}"), (0x1f3b, "\u{399}"), (0x1f3c, "\u{399}"), (0x1f3d, "\u{399}"), (0x1f3e, "\u{399}"), (0x1f3f, "\u{399}"),
    (0x1f40, "\u{3bf}"), (0x1f41, "\u{3bf}"), (0x1f42, "\u{3bf}"), (0x1f43, "\u{3bf}"), (0x1f44, "\u{3bf}"), (0x1f45, "\u{3bf}"),
    (0x1f48, "\u{39f}"), (0x1f49, "\u{39f}"), (0x1f4a, "\u{39f}"), (0x1f4b, "\u{39f}"), (0x1f4c, "\u{39f}"), (0x1f4d, "\u{39f}"),
    (0x1f50, "\u{3c5}"), (0x1f51, "\u{3c5}"), (0x1f52, "\u{3c5}"), (0x1f53, "\u{3c5}"), (0x1f54, "\u{3c5}"), (0x1f55, "\u{3c5}"),
    (0x1f56, "\u{3c5}"), (0x1f57, "\u{3c5}"), (0x1f59, "\u{3a5}"), (0x1f5b, "\u{3a5}"), (0x1f5d, "\u{3a5}"), (0x1f5f, "\u{3a5}"),
    (0x1f60, "\u{3c9}"), (0x1f61, "\u{3c9}"), (0x1f62, "\u{3c9}"), (0x1f63, "\u{3c9}"), (0x1f64, "\u{3c9}"), (0x1f65, "\u{3c9}"),
    (0x1f66, "\u{3c9}"), (0x1f67, "\u{3c9}"), (0x1f68, "\u{3a9}"), (0x1f69, "\u{3a9}"), (0x1f6a, "\u{3a9}"), (0x1f6b, "\u{3a9}"),
    (0x1f6c, "\u{3a9}"), (0x1f6d, "\u{3a9}"), (0x1f6e, "\u{3a9}"), (0x1f6f, "\u{3a9}"), (0x1f70, "\u{3b1}"), (0x1f71, "\u{3b1}"),
    (0x1f72, "\u{3b5}"), (0x1f73, "\u{3b5}"), (0x1f74, "\u{3b7}"), (0x1f75, "\u{3b7}"), (0x1f76, "\u{3b9}"), (0x1f77, "\u{3b9}"),
    (0x1f78, "\u{3bf}"), (0x1f79, "\u{3bf}"), (0x1f7a, "\u{3c5}"), (0x1f7b, "\u{3c5}"), (0x1f7c, "\u{3c9}"), (0x1f7d, "\u{3c9}"),
    (0x1f80, "\u{3b1}"), (0x1f81, "\u{3b1}"), (0x1f82, "\u{3b1}"), (0x1f83, "\u{3b1}"), (0x1f84, "\u{3b1}"), (0x1f85, "\u{3b1}"),
    (0x1f86, "\u{3b1}"), (0x1f87, "\u{3b1}"), (0x1f88, "\u{391}"), (0x1f89, "\u{391}"), (0x1f8a, "\u{391}"), (0x1f8b, "\u{391}"),
    (0x1f8c, "\u{391}"), (0x1f8d, "\u{391}"), (0x1f8e, "\u{391}"), (0x1f8f, "\u{391}"), (0x1f90, "\u{3b7}"), (0x1f91, "\u{3b7}"),
    (0x1f92, "\u{3b7}"), (0x1f93, "\u{3b7}"), (0x1f94, "\u{3b7}"), (0x1f95, "\u{3b7}"), (0x1f96, "\u{3b7}"), (0x1f97, "\u{3b7}"),
    (0x1f98, "\u{397}"), (0x1f99, "\u{397}"), (0x1f9a, "\u{397}"), (0x1f9b, "\u{397}"), (0x1f9c, "\u{397}"), (0x1f9d, "\u{397}"),
    (0x1f9e, "\u{397}"), (0x1f9f, "\u{397}"), (0x1fa0, "\u{3c9}"), (0x1fa1, "\u{3c9}"), (0x1fa2, "\u{3c9}"), (0x1fa3, "\u{3c9}"),
    (0x1fa4, "\u{3c9}"), (0x1fa5, "\u{3c9}"), (0x1fa6, "\u{3c9}"), (0x1fa7, "\u{3c9}"), (0x1fa8, "\u{3a9}"), (0x1fa9, "\u{3a9}"),
    (0x1faa, "\u{3a9}"), (0x1fab, "\u{3a9}"), (0x1fac, "\u{3a9}"), (0x1fad, "\u{3a9}"), (0x1fae, "\u{3a9}"), (0x1faf, "\u{3a9}"),
    (0x1fb0, "\u{3b1}"), (0x1fb1, "\u{3b1}"), (0x1fb2, "\u{3b1}"), (0x1fb3, "\u{3b1}"), (0x1fb4, "\u{3b1}"), (0x1fb6, "\u{3b1}"),
    (0x1fb7, "\u{3b1}"), (0x1fb8, "\u{391}"), (0x1fb9, "\u{391}"), (0x1fba, "\u{391}"), (0x1fbb, "\u{391}"), (0x1fbc, "\u{391}"),
    (0x1fbe, "\u{3b9}"), (0x1fc1, "\u{a8}"), (0x1fc2, "\u{3b7}"), (0x1fc3, "\u{3b7}"), (0x1fc4, "\u{3b7}"), (0x1fc6, "\u{3b7}"),
    (0x1fc7, "\u{3b7}"), (0x1fc8, "\u{395}"), (0x1fc9, "\u{395}"), (0x1fca, "\u{397}"), (0x1fcb, "\u{397}"), (0x1fcc, "\u{397}"),
    (0x1fcd, "\u{1fbf}"), (0x1fce, "\u{1fbf}"), (0x1fcf, "\u{1fbf}"), (0x1fd0, "\u{3b9}"), (0x1fd1, "\u{3b9}"), (0x1fd2, "\u{3b9}"),
    (0x1fd3, "\u{3b9}"), (0x1fd6, "\u{3b9}"), (0x1fd7, "\u{3b9}"), (0x1fd8, "\u{399}"), (0x1fd9, "\u{399}"), (0x1fda, "\u{399}"),
    (0x1fdb, "\u{399}"), (0x1fdd, "\u{1ffe}"), (0x1fde, "\u{1ffe}"), (0x1fdf, "\u{1ffe}"), (0x1fe0, "\u{3c5}"), (0x1fe1, "\u{3c5}"),
    (0x1fe2, "\u{3c5}"), (0x1fe3, "\u{3c5}"), (0x1fe4, "\u{3c1}"), (0x1fe5, "\u{3c1}"), (0x1fe6, "\u{3c5}"), (0x1fe7, "\u{3c5}"),
    (0x1fe8, "\u{3a5}"), (0x1fe9, "\u{3a5}"), (0x1fea, "\u{3a5}"), (0x1feb, "\u{3a5}"), (0x1fec, "\u{3a1}"), (0x1fed, "\u{a8}"),
    (0x1fee, "\u{a8}"), (0x1fef, "\u{60}"), (0x1ff2, "\u{3c9}"), (0x1ff3, "\u{3c9}"), (0x1ff4, "\u{3c9}"), (0x1ff6, "\u{3c9}"),
    (0x1ff7, "\u{3c9}"), (0x1ff8, "\u{39f}"), (0x1ff9, "\u{39f}"), (0x1ffa, "\u{3a9}"), (0x1ffb, "\u{3a9}"), (0x1ffc, "\u{3a9}"),
    (0x1ffd, "\u{b4}"), (0x2000, "\u{2002}"), (0x2001, "\u{2003}"), (0x2126, "\u{3a9}"), (0x212a, "\u{4b}"), (0x212b, "\u{41}"),
    (0x219a, "\u{2190}"), (0x219b, "\u{2192}"), (0x21ae, "\u{2194}"), (0x21cd, "\u{21d0}"), (0x21ce, "\u{21d4}"), (0x21cf, "\u{21d2}"),
    (0x2204, "\u{2203}"), (0x2209, "\u{2208}"), (0x220c, "\u{220b}"), (0x2224, "\u{2223}"), (0x2226, "\u{2225}"), (0x2241, "\u{223c}"),
    (0x2244, "\u{2243}"), (0x2247, "\u{2245}"), (0x2249, "\u{2248}"), (0x2260, "\u{3d}"), (0x2262, "\u{2261}"), (0x226d, "\u{224d}"),
    (0x226e, "\u{3c}"), (0x226f, "\u{3e}"), (0x2270, "\u{2264}"), (0x2271, "\u{2265}"), (0x2274, "\u{2272}"), (0x2275, "\u{2273}"),
    (0x2278, "\u{2276}"), (0x2279, "\u{2277}"), (0x2280, "\u{227a}"), (0x2281, "\u{227b}"), (0x2284, "\u{2282}"), (0x2285, "\u{2283}"),
    (0x2288, "\u{2286}"), (0x2289, "\u{2287}"), (0x22ac, "\u{22a2}"), (0x22ad, "\u{22a8}"), (0x22ae, "\u{22a9}"), (0x22af, "\u{22ab}"),
    (0x22e0, "\u{227c}"), (0x22e1, "\u{227d}"), (0x22e2, "\u{2291}"), (0x22e3, "\u{2292}"), (0x22ea, "\u{22b2}"), (0x22eb, "\u{22b3}"),
    (0x22ec, "\u{22b4}"), (0x22ed, "\u{22b5}"), (0x2329, "\u{3008}"), (0x232a, "\u{3009}"), (0x2adc, "\u{2add}"), (0x304c, "\u{304b}\u{3099}"),
    (0x304e, "\u{304d}\u{3099}"), (0x3050, "\u{304f}\u{3099}"), (0x3052, "\u{3051}\u{3099}"), (0x3054, "\u{3053}\u{3099}"), (0x3056, "\u{3055}\u{3099}"), (0x3058, "\u{3057}\u{3099}"),
    (0x305a, "\u{3059}\u{3099}"), (0x305c, "\u{305b}\u{3099}"), (0x305e, "\u{305d}\u{3099}"), (0x3060, "\u{305f}\u{3099}"), (0x3062, "\u{3061}\u{3099}"), (0x3065, "\u{3064}\u{3099}"),
    (0x3067, "\u{3066}\u{3099}"), (0x3069, "\u{3068}\u{3099}"), (0x3070, "\u{306f}\u{3099}"), (0x3071, "\u{306f}\u{309a}"), (0x3073, "\u{3072}\u{3099}"), (0x3074, "\u{3072}\u{309a}"),
    (0x3076, "\u{3075}\u{3099}"), (0x3077, "\u{3075}\u{309a}"), (0x3079, "\u{3078}\u{3099}"), (0x307a, "\u{3078}\u{309a}"), (0x307c, "\u{307b}\u{3099}"), (0x307d, "\u{307b}\u{309a}"),
    (0x3094, "\u{3046}\u{3099}"), (0x309e, "\u{309d}\u{3099}"), (0x30ac, "\u{30ab}\u{3099}"), (0x30ae, "\u{30ad}\u{3099}"), (0x30b0, "\u{30af}\u{3099}"), (0x30b2, "\u{30b1}\u{3099}"),
    (0x30b4, "\u{30b3}\u{3099}"), (0x30b6, "\u{30b5}\u{3099}"), (0x30b8, "\u{30b7}\u{3099}"), (0x30ba, "\u{30b9}\u{3099}"), (0x30bc, "\u{30bb}\u{3099}"), (0x30be, "\u{30bd}\u{3099}"),
    (0x30c0, "\u{30bf}\u{3099}"), (0x30c2, "\u{30c1}\u{3099}"), (0x30c5, "\u{30c4}\u{3099}"), (0x30c7, "\u{30c6}\u{3099}"), (0x30c9, "\u{30c8}\u{3099}"), (0x30d0, "\u{30cf}\u{3099}"),
    (0x30d1, "\u{30cf}\u{309a}"), (0x30d3, "\u{30d2}\u{3099}"), (0x30d4, "\u{30d2}\u{309a}"), (0x30d6, "\u{30d5}\u{3099}"), (0x30d7, "\u{30d5}\u{309a}"), (0x30d9, "\u{30d8}\u{3099}"),
    (0x30da, "\u{30d8}\u{309a}"), (0x30dc, "\u{30db}\u{3099}"), (0x30dd, "\u{30db}\u{309a}"), (0x30f4, "\u{30a6}\u{3099}"), (0x30f7, "\u{30ef}\u{3099}"), (0x30f8, "\u{30f0}\u{3099}"),
    (0x30f9, "\u{30f1}\u{3099}"), (0x30fa, "\u{30f2}\u{3099}"), (0x30fe, "\u{30fd}\u{3099}"), (0xf900, "\u{8c48}"), (0xf901, "\u{66f4}"), (0xf902, "\u{8eca}"),
    (0xf903, "\u{8cc8}"), (0xf904, "\u{6ed1}"), (0xf905, "\u{4e32}"), (0xf906, "\u{53e5}"), (0xf907, "\u{9f9c}"), (0xf908, "\u{9f9c}"),
    (0xf909, "\u{5951}"), (0xf90a, "\u{91d1}"), (0xf90b, "\u{5587}"), (0xf90c, "\u{5948}"), (0xf90d, "\u{61f6}"), (0xf90e, "\u{7669}"),
    (0xf90f, "\u{7f85}"), (0xf910, "\u{863f}"), (0xf911, "\u{87ba}"), (0xf912, "\u{88f8}"), (0xf913, "\u{908f}"), (0xf914, "\u{6a02}"),
    (0xf915, "\u{6d1b}"), (0xf916, "\u{70d9}"), (0xf917, "\u{73de}"), (0xf918, "\u{843d}"), (0xf919, "\u{916a}"), (0xf91a, "\u{99f1}"),
    (0xf91b, "\u{4e82}"), (0xf91c, "\u{5375}"), (0xf91d, "\u{6b04}"), (0xf91e, "\u{721b}"), (0xf91f, "\u{862d}"), (0xf920, "\u{9e1e}"),
    (0xf921, "\u{5d50}"), (0xf922, "\u{6feb}"), (0xf923, "\u{85cd}"), (0xf924, "\u{8964}"), (0xf925, "\u{62c9}"), (0xf926, "\u{81d8}"),
    (0xf927, "\u{881f}"), (0xf928, "\u{5eca}"), (0xf929, "\u{6717}"), (0xf92a, "\u{6d6a}"), (0xf92b, "\u{72fc}"), (0xf92c, "\u{90ce}"),
    (0xf92d, "\u{4f86}"), (0xf92e, "\u{51b7}"), (0xf92f, "\u{52de}"), (0xf930, "\u{64c4}"), (0xf931, "\u{6ad3}"), (0xf932, "\u{7210}"),
    (0xf933, "\u{76e7}"), (0xf934, "\u{8001}"), (0xf935, "\u{8606}"), (0xf936, "\u{865c}"), (0xf937, "\u{8def}"), (0xf938, "\u{9732}"),
    (0xf939, "\u{9b6f}"), (0xf93a, "\u{9dfa}"), (0xf93b, "\u{788c}"), (0xf93c, "\u{797f}"), (0xf93d, "\u{7da0}"), (0xf93e, "\u{83c9}"),
    (0xf93f, "\u{9304}"), (0xf940, "\u{9e7f}"), (0xf941, "\u{8ad6}"), (0xf942, "\u{58df}"), (0xf943, "\u{5f04}"), (0xf944, "\u{7c60}"),
    (0xf945, "\u{807e}"), (0xf946, "\u{7262}"), (0xf947, "\u{78ca}"), (0xf948, "\u{8cc2}"), (0xf949, "\u{96f7}"), (0xf94a, "\u{58d8}"),
    (0xf94b, "\u{5c62}"), (0xf94c, "\u{6a13}"), (0xf94d, "\u{6dda}"), (0xf94e, "\u{6f0f}"), (0xf94f, "\u{7d2f}"), (0xf950, "\u{7e37}"),
    (0xf951, "\u{964b}"), (0xf952, "\u{52d2}"), (0xf953, "\u{808b}"), (0xf954, "\u{51dc}"), (0xf955, "\u{51cc}"), (0xf956, "\u{7a1c}"),
    (0xf957, "\u{7dbe}"), (0xf958, "\u{83f1}"), (0xf959, "\u{9675}"), (0xf95a, "\u{8b80}"), (0xf95b, "\u{62cf}"), (0xf95c, "\u{6a02}"),
    (0xf95d, "\u{8afe}"), (0xf95e, "\u{4e39}"), (0xf95f, "\u{5be7}"), (0xf960, "\u{6012}"), (0xf961, "\u{7387}"), (0xf962, "\u{7570}"),
    (0xf963, "\u{5317}"), (0xf964, "\u{78fb}"), (0xf965, "\u{4fbf}"), (0xf966, "\u{5fa9}"), (0xf967, "\u{4e0d}"), (0xf968, "\u{6ccc}"),
    (0xf969, "\u{6578}"), (0xf96a, "\u{7d22}"), (0xf96b, "\u{53c3}"), (0xf96c, "\u{585e}"), (0xf96d, "\u{7701}"), (0xf96e, "\u{8449}"),
    (0xf96f, "\u{8aaa}"), (0xf970, "\u{6bba}"), (0xf971, "\u{8fb0}"), (0xf972, "\u{6c88}"), (0xf973, "\u{62fe}"), (0xf974, "\u{82e5}"),
    (0xf975, "\u{63a0}"), (0xf976, "\u{7565}"), (0xf977, "\u{4eae}"), (0xf978, "\u{5169}"), (0xf979, "\u{51c9}"), (0xf97a, "\u{6881}"),
    (0xf97b, "\u{7ce7}"), (0xf97c, "\u{826f}"), (0xf97d, "\u{8ad2}"), (0xf97e, "\u{91cf}"), (0xf97f, "\u{52f5}"), (0xf980, "\u{5442}"),
    (0xf981, "\u{5973}"), (0xf982, "\u{5eec}"), (0xf983, "\u{65c5}"), (0xf984, "\u{6ffe}"), (0xf985, "\u{792a}"), (0xf986, "\u{95ad}"),
    (0xf987, "\u{9a6a}"), (0xf988, "\u{9e97}"), (0xf989, "\u{9ece}"), (0xf98a, "\u{529b}"), (0xf98b, "\u{66c6}"), (0xf98c, "\u{6b77}"),
    (0xf98d, "\u{8f62}"), (0xf98e, "\u{5e74}"), (0xf98f, "\u{6190}"), (0xf990, "\u{6200}"), (0xf991, "\u{649a}"), (0xf992, "\u{6f23}"),
    (0xf993, "\u{7149}"), (0xf994, "\u{7489}"), (0xf995, "\u{79ca}"), (0xf996, "\u{7df4}"), (0xf997, "\u{806f}"), (0xf998, "\u{8f26}"),
    (0xf999, "\u{84ee}"), (0xf99a, "\u{9023}"), (0xf99b, "\u{934a}"), (0xf99c, "\u{5217}"), (0xf99d, "\u{52a3}"), (0xf99e, "\u{54bd}"),
    (0xf99f, "\u{70c8}"), (0xf9a0, "\u{88c2}"), (0xf9a1, "\u{8aaa}"), (0xf9a2, "\u{5ec9}"), (0xf9a3, "\u{5ff5}"), (0xf9a4, "\u{637b}"),
    (0xf9a5, "\u{6bae}"), (0xf9a6, "\u{7c3e}"), (0xf9a7, "\u{7375}"), (0xf9a8, "\u{4ee4}"), (0xf9a9, "\u{56f9}"), (0xf9aa, "\u{5be7}"),
    (0xf9ab, "\u{5dba}"), (0xf9ac, "\u{601c}"), (0xf9ad, "\u{73b2}"), (0xf9ae, "\u{7469}"), (0xf9af, "\u{7f9a}"), (0xf9b0, "\u{8046}"),
    (0xf9b1, "\u{9234}"), (0xf9b2, "\u{96f6}"), (0xf9b3, "\u{9748}"), (0xf9b4, "\u{9818}"), (0xf9b5, "\u{4f8b}"), (0xf9b6, "\u{79ae}"),
    (0xf9b7, "\u{91b4}"), (0xf9b8, "\u{96b8}"), (0xf9b9, "\u{60e1}"), (0xf9ba, "\u{4e86}"), (0xf9bb, "\u{50da}"), (0xf9bc, "\u{5bee}"),
    (0xf9bd, "\u{5c3f}"), (0xf9be, "\u{6599}"), (0xf9bf, "\u{6a02}"), (0xf9c0, "\u{71ce}"), (0xf9c1, "\u{7642}"), (0xf9c2, "\u{84fc}"),
    (0xf9c3, "\u{907c}"), (0xf9c4, "\u{9f8d}"), (0xf9c5, "\u{6688}"), (0xf9c6, "\u{962e}"), (0xf9c7, "\u{5289}"), (0xf9c8, "\u{677b}"),
    (0xf9c9, "\u{67f3}"), (0xf9ca, "\u{6d41}"), (0xf9cb, "\u{6e9c}"), (0xf9cc, "\u{7409}"), (0xf9cd, "\u{7559}"), (0xf9ce, "\u{786b}"),
    (0xf9cf, "\u{7d10}"), (0xf9d0, "\u{985e}"), (0xf9d1, "\u{516d}"), (0xf9d2, "\u{622e}"), (0xf9d3, "\u{9678}"), (0xf9d4, "\u{502b}"),
    (0xf9d5, "\u{5d19}"), (0xf9d6, "\u{6dea}"), (0xf9d7, "\u{8f2a}"), (0xf9d8, "\u{5f8b}"), (0xf9d9, "\u{6144}"), (0xf9da, "\u{6817}"),
    (0xf9db, "\u{7387}"), (0xf9dc, "\u{9686}"), (0xf9dd, "\u{5229}"), (0xf9de, "\u{540f}"), (0xf9df, "\u{5c65}"), (0xf9e0, "\u{6613}"),
    (0xf9e1, "\u{674e}"), (0xf9e2, "\u{68a8}"), (0xf9e3, "\u{6ce5}"), (0xf9e4, "\u{7406}"), (0xf9e5, "\u{75e2}"), (0xf9e6, "\u{7f79}"),
    (0xf9e7, "\u{88cf}"), (0xf9e8, "\u{88e1}"), (0xf9e9, "\u{91cc}"), (0xf9ea, "\u{96e2}"), (0xf9eb, "\u{533f}"), (0xf9ec, "\u{6eba}"),
    (0xf9ed, "\u{541d}"), (0xf9ee, "\u{71d0}"), (0xf9ef, "\u{7498}"), (0xf9f0, "\u{85fa}"), (0xf9f1, "\u{96a3}"), (0xf9f2, "\u{9c57}"),
    (0xf9f3, "\u{9e9f}"), (0xf9f4, "\u{6797}"), (0xf9f5, "\u{6dcb}"), (0xf9f6, "\u{81e8}"), (0xf9f7, "\u{7acb}"), (0xf9f8, "\u{7b20}"),
    (0xf9f9, "\u{7c92}"), (0xf9fa, "\u{72c0}"), (0xf9fb, "\u{7099}"), (0xf9fc, "\u{8b58}"), (0xf9fd, "\u{4ec0}"), (0xf9fe, "\u{8336}"),
    (0xf9ff, "\u{523a}"), (0xfa00, "\u{5207}"), (0xfa01, "\u{5ea6}"), (0xfa02, "\u{62d3}"), (0xfa03, "\u{7cd6}"), (0xfa04, "\u{5b85}"),
    (0xfa05, "\u{6d1e}"), (0xfa06, "\u{66b4}"), (0xfa07, "\u{8f3b}"), (0xfa08, "\u{884c}"), (0xfa09, "\u{964d}"), (0xfa0a, "\u{898b}"),
    (0xfa0b, "\u{5ed3}"), (0xfa0c, "\u{5140}"), (0xfa0d, "\u{55c0}"), (0xfa10, "\u{585a}"), (0xfa12, "\u{6674}"), (0xfa15, "\u{51de}"),
    (0xfa16, "\u{732a}"), (0xfa17, "\u{76ca}"), (0xfa18, "\u{793c}"), (0xfa19, "\u{795e}"), (0xfa1a, "\u{7965}"), (0xfa1b, "\u{798f}"),
    (0xfa1c, "\u{9756}"), (0xfa1d, "\u{7cbe}"), (0xfa1e, "\u{7fbd}"), (0xfa20, "\u{8612}"), (0xfa22, "\u{8af8}"), (0xfa25, "\u{9038}"),
    (0xfa26, "\u{90fd}"), (0xfa2a, "\u{98ef}"), (0xfa2b, "\u{98fc}"), (0xfa2c, "\u{9928}"), (0xfa2d, "\u{9db4}"), (0xfa2e, "\u{90de}"),
    (0xfa2f, "\u{96b7}"), (0xfa30, "\u{4fae}"), (0xfa31, "\u{50e7}"), (0xfa32, "\u{514d}"), (0xfa33, "\u{52c9}"), (0xfa34, "\u{52e4}"),
    (0xfa35, "\u{5351}"), (0xfa36, "\u{559d}"), (0xfa37, "\u{5606}"), (0xfa38, "\u{5668}"), (0xfa39, "\u{5840}"), (0xfa3a, "\u{58a8}"),
    (0xfa3b, "\u{5c64}"), (0xfa3c, "\u{5c6e}"), (0xfa3d, "\u{6094}"), (0xfa3e, "\u{6168}"), (0xfa3f, "\u{618e}"), (0xfa40, "\u{61f2}"),
    (0xfa41, "\u{654f}"), (0xfa42, "\u{65e2}"), (0xfa43, "\u{6691}"), (0xfa44, "\u{6885}"), (0xfa45, "\u{6d77}"), (0xfa46, "\u{6e1a}"),
    (0xfa47, "\u{6f22}"), (0xfa48, "\u{716e}"), (0xfa49, "\u{722b}"), (0xfa4a, "\u{7422}"), (0xfa4b, "\u{7891}"), (0xfa4c, "\u{793e}"),
    (0xfa4d, "\u{7949}"), (0xfa4e, "\u{7948}"), (0xfa4f, "\u{7950}"), (0xfa50, "\u{7956}"), (0xfa51, "\u{795d}"), (0xfa52, "\u{798d}"),
    (0xfa53, "\u{798e}"), (0xfa54, "\u{7a40}"), (0xfa55, "\u{7a81}"), (0xfa56, "\u{7bc0}"), (0xfa57, "\u{7df4}"), (0xfa58, "\u{7e09}"),
    (0xfa59, "\u{7e41}"), (0xfa5a, "\u{7f72}"), (0xfa5b, "\u{8005}"), (0xfa5c, "\u{81ed}"), (0xfa5d, "\u{8279}"), (0xfa5e, "\u{8279}"),
    (0xfa5f, "\u{8457}"), (0xfa60, "\u{8910}"), (0xfa61, "\u{8996}"), (0xfa62, "\u{8b01}"), (0xfa63, "\u{8b39}"), (0xfa64, "\u{8cd3}"),
    (0xfa65, "\u{8d08}"), (0xfa66, "\u{8fb6}"), (0xfa67, "\u{9038}"), (0xfa68, "\u{96e3}"), (0xfa69, "\u{97ff}"), (0xfa6a, "\u{983b}"),
    (0xfa6b, "\u{6075}"), (0xfa6c, "\u{242ee}"), (0xfa6d, "\u{8218}"), (0xfa70, "\u{4e26}"), (0xfa71, "\u{51b5}"), (0xfa72, "\u{5168}"),
    (0xfa73, "\u{4f80}"), (0xfa74, "\u{5145}"), (0xfa75, "\u{5180}"), (0xfa76, "\u{52c7}"), (0xfa77, "\u{52fa}"), (0xfa78, "\u{559d}"),
    (0xfa79, "\u{5555}"), (0xfa7a, "\u{5599}"), (0xfa7b, "\u{55e2}"), (0xfa7c, "\u{585a}"), (0xfa7d, "\u{58b3}"), (0xfa7e, "\u{5944}"),
    (0xfa7f, "\u{5954}"), (0xfa80, "\u{5a62}"), (0xfa81, "\u{5b28}"), (0xfa82, "\u{5ed2}"), (0xfa83, "\u{5ed9}"), (0xfa84, "\u{5f69}"),
    (0xfa85, "\u{5fad}"), (0xfa86, "\u{60d8}"), (0xfa87, "\u{614e}"), (0xfa88, "\u{6108}"), (0xfa89, "\u{618e}"), (0xfa8a, "\u{6160}"),
    (0xfa8b, "\u{61f2}"), (0xfa8c, "\u{6234}"), (0xfa8d, "\u{63c4}"), (0xfa8e, "\u{641c}"), (0xfa8f, "\u{6452}"), (0xfa90, "\u{6556}"),
    (0xfa91, "\u{6674}"), (0xfa92, "\u{6717}"), (0xfa93, "\u{671b}"), (0xfa94, "\u{6756}"), (0xfa95, "\u{6b79}"), (0xfa96, "\u{6bba}"),
    (0xfa97, "\u{6d41}"), (0xfa98, "\u{6edb}"), (0xfa99, "\u{6ecb}"), (0xfa9a, "\u{6f22}"), (0xfa9b, "\u{701e}"), (0xfa9c, "\u{716e}"),
    (0xfa9d, "\u{77a7}"), (0xfa9e, "\u{7235}"), (0xfa9f, "\u{72af}"), (0xfaa0, "\u{732a}"), (0xfaa1, "\u{7471}"), (0xfaa2, "\u{7506}"),
    (0xfaa3, "\u{753b}"), (0xfaa4, "\u{761d}"), (0xfaa5, "\u{761f}"), (0xfaa6, "\u{76ca}"), (0xfaa7, "\u{76db}"), (0xfaa8, "\u{76f4}"),
    (0xfaa9, "\u{774a}"), (0xfaaa, "\u{7740}"), (0xfaab, "\u{78cc}"), (0xfaac, "\u{7ab1}"), (0xfaad, "\u{7bc0}"), (0xfaae, "\u{7c7b}"),
    (0xfaaf, "\u{7d5b}"), (0xfab0, "\u{7df4}"), (0xfab1, "\u{7f3e}"), (0xfab2, "\u{8005}"), (0xfab3, "\u{8352}"), (0xfab4, "\u{83ef}"),
    (0xfab5, "\u{8779}"), (0xfab6, "\u{8941}"), (0xfab7, "\u{8986}"), (0xfab8, "\u{8996}"), (0xfab9, "\u{8abf}"), (0xfaba, "\u{8af8}"),
    (0xfabb, "\u{8acb}"), (0xfabc, "\u{8b01}"), (0xfabd, "\u{8afe}"), (0xfabe, "\u{8aed}"), (0xfabf, "\u{8b39}"), (0xfac0, "\u{8b8a}"),
    (0xfac1, "\u{8d08}"), (0xfac2, "\u{8f38}"), (0xfac3, "\u{9072}"), (0xfac4, "\u{9199}"), (0xfac5, "\u{9276}"), (0xfac6, "\u{967c}"),
    (0xfac7, "\u{96e3}"), (0xfac8, "\u{9756}"), (0xfac9, "\u{97db}"), (0xfaca, "\u{97ff}"), (0xfacb, "\u{980b}"), (0xfacc, "\u{983b}"),
    (0xfacd, "\u{9b12}"), (0xface, "\u{9f9c}"), (0xfacf, "\u{2284a}"), (0xfad0, "\u{22844}"), (0xfad1, "\u{233d5}"), (0xfad2, "\u{3b9d}"),
    (0xfad3, "\u{4018}"), (0xfad4, "\u{4039}"), (0xfad5, "\u{25249}"), (0xfad6, "\u{25cd0}"), (0xfad7, "\u{27ed3}"), (0xfad8, "\u{9f43}"),
    (0xfad9, "\u{9f8e}"), (0xfb1d, "\u{5d9}\u{5b4}"), (0xfb1f, "\u{5f2}\u{5b7}"), (0xfb2a, "\u{5e9}\u{5c1}"), (0xfb2b, "\u{5e9}\u{5c2}"), (0xfb2c, "\u{5e9}\u{5bc}\u{5c1}"),
    (0xfb2d, "\u{5e9}\u{5bc}\u{5c2}"), (0xfb2e, "\u{5d0}\u{5b7}"), (0xfb2f, "\u{5d0}\u{5b8}"), (0xfb30, "\u{5d0}\u{5bc}"), (0xfb31, "\u{5d1}\u{5bc}"), (0xfb32, "\u{5d2}\u{5bc}"),
    (0xfb33, "\u{5d3}\u{5bc}"), (0xfb34, "\u{5d4}\u{5bc}"), (0xfb35, "\u{5d5}\u{5bc}"), (0xfb36, "\u{5d6}\u{5bc}"), (0xfb38, "\u{5d8}\u{5bc}"), (0xfb39, "\u{5d9}\u{5bc}"),
    (0xfb3a, "\u{5da}\u{5bc}"), (0xfb3b, "\u{5db}\u{5bc}"), (0xfb3c, "\u{5dc}\u{5bc}"), (0xfb3e, "\u{5de}\u{5bc}"), (0xfb40, "\u{5e0}\u{5bc}"), (0xfb41, "\u{5e1}\u{5bc}"),
    (0xfb43, "\u{5e3}\u{5bc}"), (0xfb44, "\u{5e4}\u{5bc}"), (0xfb46, "\u{5e6}\u{5bc}"), (0xfb47, "\u{5e7}\u{5bc}"), (0xfb48, "\u{5e8}\u{5bc}"), (0xfb49, "\u{5e9}\u{5bc}"),
    (0xfb4a, "\u{5ea}\u{5bc}"), (0xfb4b, "\u{5d5}\u{5b9}"), (0xfb4c, "\u{5d1}\u{5bf}"), (0xfb4d, "\u{5db}\u{5bf}"), (0xfb4e, "\u{5e4}\u{5bf}"), (0x105c9, "\u{105d2}"),
    (0x105e4, "\u{105da}"), (0x1109a, "\u{11099}\u{110ba}"), (0x1109c, "\u{1109b}\u{110ba}"), (0x110ab, "\u{110a5}\u{110ba}"), (0x1112e, "\u{11131}\u{11127}"), (0x1112f, "\u{11132}\u{11127}"),
    (0x1134b, "\u{11347}\u{1133e}"), (0x1134c, "\u{11347}\u{11357}"), (0x11383, "\u{11382}\u{113c9}"), (0x11385, "\u{11384}\u{113bb}"), (0x1138e, "\u{1138b}\u{113c2}"), (0x11391, "\u{11390}\u{113c9}"),
    (0x113c5, "\u{113c2}\u{113c2}"), (0x113c7, "\u{113c2}\u{113b8}"), (0x113c8, "\u{113c2}\u{113c9}"), (0x114bb, "\u{114b9}\u{114ba}"), (0x114bc, "\u{114b9}\u{114b0}"), (0x114be, "\u{114b9}\u{114bd}"),
    (0x115ba, "\u{115b8}\u{115af}"), (0x115bb, "\u{115b9}\u{115af}"), (0x11938, "\u{11935}\u{11930}"), (0x16121, "\u{1611e}\u{1611e}"), (0x16122, "\u{1611e}\u{16129}"), (0x16123, "\u{1611e}\u{1611f}"),
    (0x16124, "\u{16129}\u{1611f}"), (0x16125, "\u{1611e}\u{16120}"), (0x16126, "\u{1611e}\u{1611e}\u{1611f}"), (0x16127, "\u{1611e}\u{16129}\u{1611f}"), (0x16128, "\u{1611e}\u{1611e}\u{16120}"), (0x16d68, "\u{16d67}\u{16d67}"),
    (0x16d69, "\u{16d63}\u{16d67}"), (0x16d6a, "\u{16d63}\u{16d67}\u{16d67}"), (0x1d15e, "\u{1d157}\u{1d165}"), (0x1d15f, "\u{1d158}\u{1d165}"), (0x1d160, "\u{1d158}\u{1d165}\u{1d16e}"), (0x1d161, "\u{1d158}\u{1d165}\u{1d16f}"),
    (0x1d162, "\u{1d158}\u{1d165}\u{1d170}"), (0x1d163, "\u{1d158}\u{1d165}\u{1d171}"), (0x1d164, "\u{1d158}\u{1d165}\u{1d172}"), (0x1d1bb, "\u{1d1b9}\u{1d165}"), (0x1d1bc, "\u{1d1ba}\u{1d165}"), (0x1d1bd, "\u{1d1b9}\u{1d165}\u{1d16e}"),
    (0x1d1be, "\u{1d1ba}\u{1d165}\u{1d16e}"), (0x1d1bf, "\u{1d1b9}\u{1d165}\u{1d16f}"), (0x1d1c0, "\u{1d1ba}\u{1d165}\u{1d16f}"), (0x2f800, "\u{4e3d}"), (0x2f801, "\u{4e38}"), (0x2f802, "\u{4e41}"),
    (0x2f803, "\u{20122}"), (0x2f804, "\u{4f60}"), (0x2f805, "\u{4fae}"), (0x2f806, "\u{4fbb}"), (0x2f807, "\u{5002}"), (0x2f808, "\u{507a}"),
    (0x2f809, "\u{5099}"), (0x2f80a, "\u{50e7}"), (0x2f80b, "\u{50cf}"), (0x2f80c, "\u{349e}"), (0x2f80d, "\u{2063a}"), (0x2f80e, "\u{514d}"),
    (0x2f80f, "\u{5154}"), (0x2f810, "\u{5164}"), (0x2f811, "\u{5177}"), (0x2f812, "\u{2051c}"), (0x2f813, "\u{34b9}"), (0x2f814, "\u{5167}"),
    (0x2f815, "\u{518d}"), (0x2f816, "\u{2054b}"), (0x2f817, "\u{5197}"), (0x2f818, "\u{51a4}"), (0x2f819, "\u{4ecc}"), (0x2f81a, "\u{51ac}"),
    (0x2f81b, "\u{51b5}"), (0x2f81c, "\u{291df}"), (0x2f81d, "\u{51f5}"), (0x2f81e, "\u{5203}"), (0x2f81f, "\u{34df}"), (0x2f820, "\u{523b}"),
    (0x2f821, "\u{5246}"), (0x2f822, "\u{5272}"), (0x2f823, "\u{5277}"), (0x2f824, "\u{3515}"), (0x2f825, "\u{52c7}"), (0x2f826, "\u{52c9}"),
    (0x2f827, "\u{52e4}"), (0x2f828, "\u{52fa}"), (0x2f829, "\u{5305}"), (0x2f82a, "\u{5306}"), (0x2f82b, "\u{5317}"), (0x2f82c, "\u{5349}"),
    (0x2f82d, "\u{5351}"), (0x2f82e, "\u{535a}"), (0x2f82f, "\u{5373}"), (0x2f830, "\u{537d}"), (0x2f831, "\u{537f}"), (0x2f832, "\u{537f}"),
    (0x2f833, "\u{537f}"), (0x2f834, "\u{20a2c}"), (0x2f835, "\u{7070}"), (0x2f836, "\u{53ca}"), (0x2f837, "\u{53df}"), (0x2f838, "\u{20b63}"),
    (0x2f839, "\u{53eb}"), (0x2f83a, "\u{53f1}"), (0x2f83b, "\u{5406}"), (0x2f83c, "\u{549e}"), (0x2f83d, "\u{5438}"), (0x2f83e, "\u{5448}"),
    (0x2f83f, "\u{5468}"), (0x2f840, "\u{54a2}"), (0x2f841, "\u{54f6}"), (0x2f842, "\u{5510}"), (0x2f843, "\u{5553}"), (0x2f844, "\u{5563}"),
    (0x2f845, "\u{5584}"), (0x2f846, "\u{5584}"), (0x2f847, "\u{5599}"), (0x2f848, "\u{55ab}"), (0x2f849, "\u{55b3}"), (0x2f84a, "\u{55c2}"),
    (0x2f84b, "\u{5716}"), (0x2f84c, "\u{5606}"), (0x2f84d, "\u{5717}"), (0x2f84e, "\u{5651}"), (0x2f84f, "\u{5674}"), (0x2f850, "\u{5207}"),
    (0x2f851, "\u{58ee}"), (0x2f852, "\u{57ce}"), (0x2f853, "\u{57f4}"), (0x2f854, "\u{580d}"), (0x2f855, "\u{578b}"), (0x2f856, "\u{5832}"),
    (0x2f857, "\u{5831}"), (0x2f858, "\u{58ac}"), (0x2f859, "\u{214e4}"), (0x2f85a, "\u{58f2}"), (0x2f85b, "\u{58f7}"), (0x2f85c, "\u{5906}"),
    (0x2f85d, "\u{591a}"), (0x2f85e, "\u{5922}"), (0x2f85f, "\u{5962}"), (0x2f860, "\u{216a8}"), (0x2f861, "\u{216ea}"), (0x2f862, "\u{59ec}"),
    (0x2f863, "\u{5a1b}"), (0x2f864, "\u{5a27}"), (0x2f865, "\u{59d8}"), (0x2f866, "\u{5a66}"), (0x2f867, "\u{36ee}"), (0x2f868, "\u{36fc}"),
    (0x2f869, "\u{5b08}"), (0x2f86a, "\u{5b3e}"), (0x2f86b, "\u{5b3e}"), (0x2f86c, "\u{219c8}"), (0x2f86d, "\u{5bc3}"), (0x2f86e, "\u{5bd8}"),
    (0x2f86f, "\u{5be7}"), (0x2f870, "\u{5bf3}"), (0x2f871, "\u{21b18}"), (0x2f872, "\u{5bff}"), (0x2f873, "\u{5c06}"), (0x2f874, "\u{5f53}"),
    (0x2f875, "\u{5c22}"), (0x2f876, "\u{3781}"), (0x2f877, "\u{5c60}"), (0x2f878, "\u{5c6e}"), (0x2f879, "\u{5cc0}"), (0x2f87a, "\u{5c8d}"),
    (0x2f87b, "\u{21de4}"), (0x2f87c, "\u{5d43}"), (0x2f87d, "\u{21de6}"), (0x2f87e, "\u{5d6e}"), (0x2f87f, "\u{5d6b}"), (0x2f880, "\u{5d7c}"),
    (0x2f881, "\u{5de1}"), (0x2f882, "\u{5de2}"), (0x2f883, "\u{382f}"), (0x2f884, "\u{5dfd}"), (0x2f885, "\u{5e28}"), (0x2f886, "\u{5e3d}"),
    (0x2f887, "\u{5e69}"), (0x2f888, "\u{3862}"), (0x2f889, "\u{22183}"), (0x2f88a, "\u{387c}"), (0x2f88b, "\u{5eb0}"), (0x2f88c, "\u{5eb3}"),
    (0x2f88d, "\u{5eb6}"), (0x2f88e, "\u{5eca}"), (0x2f88f, "\u{2a392}"), (0x2f890, "\u{5efe}"), (0x2f891, "\u{22331}"), (0x2f892, "\u{22331}"),
    (0x2f893, "\u{8201}"), (0x2f894, "\u{5f22}"), (0x2f895, "\u{5f22}"), (0x2f896, "\u{38c7}"), (0x2f897, "\u{232b8}"), (0x2f898, "\u{261da}"),
    (0x2f899, "\u{5f62}"), (0x2f89a, "\u{5f6b}"), (0x2f89b, "\u{38e3}"), (0x2f89c, "\u{5f9a}"), (0x2f89d, "\u{5fcd}"), (0x2f89e, "\u{5fd7}"),
    (0x2f89f, "\u{5ff9}"), (0x2f8a0, "\u{6081}"), (0x2f8a1, "\u{393a}"), (0x2f8a2, "\u{391c}"), (0x2f8a3, "\u{6094}"), (0x2f8a4, "\u{226d4}"),
    (0x2f8a5, "\u{60c7}"), (0x2f8a6, "\u{6148}"), (0x2f8a7, "\u{614c}"), (0x2f8a8, "\u{614e}"), (0x2f8a9, "\u{614c}"), (0x2f8aa, "\u{617a}"),
    (0x2f8ab, "\u{618e}"), (0x2f8ac, "\u{61b2}"), (0x2f8ad, "\u{61a4}"), (0x2f8ae, "\u{61af}"), (0x2f8af, "\u{61de}"), (0x2f8b0, "\u{61f2}"),
    (0x2f8b1, "\u{61f6}"), (0x2f8b2, "\u{6210}"), (0x2f8b3, "\u{621b}"), (0x2f8b4, "\u{625d}"), (0x2f8b5, "\u{62b1}"), (0x2f8b6, "\u{62d4}"),
    (0x2f8b7, "\u{6350}"), (0x2f8b8, "\u{22b0c}"), (0x2f8b9, "\u{633d}"), (0x2f8ba, "\u{62fc}"), (0x2f8bb, "\u{6368}"), (0x2f8bc, "\u{6383}"),
    (0x2f8bd, "\u{63e4}"), (0x2f8be, "\u{22bf1}"), (0x2f8bf, "\u{6422}"), (0x2f8c0, "\u{63c5}"), (0x2f8c1, "\u{63a9}"), (0x2f8c2, "\u{3a2e}"),
    (0x2f8c3, "\u{6469}"), (0x2f8c4, "\u{647e}"), (0x2f8c5, "\u{649d}"), (0x2f8c6, "\u{6477}"), (0x2f8c7, "\u{3a6c}"), (0x2f8c8, "\u{654f}"),
    (0x2f8c9, "\u{656c}"), (0x2f8ca, "\u{2300a}"), (0x2f8cb, "\u{65e3}"), (0x2f8cc, "\u{66f8}"), (0x2f8cd, "\u{6649}"), (0x2f8ce, "\u{3b19}"),
    (0x2f8cf, "\u{6691}"), (0x2f8d0, "\u{3b08}"), (0x2f8d1, "\u{3ae4}"), (0x2f8d2, "\u{5192}"), (0x2f8d3, "\u{5195}"), (0x2f8d4, "\u{6700}"),
    (0x2f8d5, "\u{669c}"), (0x2f8d6, "\u{80ad}"), (0x2f8d7, "\u{43d9}"), (0x2f8d8, "\u{6717}"), (0x2f8d9, "\u{671b}"), (0x2f8da, "\u{6721}"),
    (0x2f8db, "\u{675e}"), (0x2f8dc, "\u{6753}"), (0x2f8dd, "\u{233c3}"), (0x2f8de, "\u{3b49}"), (0x2f8df, "\u{67fa}"), (0x2f8e0, "\u{6785}"),
    (0x2f8e1, "\u{6852}"), (0x2f8e2, "\u{6885}"), (0x2f8e3, "\u{2346d}"), (0x2f8e4, "\u{688e}"), (0x2f8e5, "\u{681f}"), (0x2f8e6, "\u{6914}"),
    (0x2f8e7, "\u{3b9d}"), (0x2f8e8, "\u{6942}"), (0x2f8e9, "\u{69a3}"), (0x2f8ea, "\u{69ea}"), (0x2f8eb, "\u{6aa8}"), (0x2f8ec, "\u{236a3}"),
    (0x2f8ed, "\u{6adb}"), (0x2f8ee, "\u{3c18}"), (0x2f8ef, "\u{6b21}"), (0x2f8f0, "\u{238a7}"), (0x2f8f1, "\u{6b54}"), (0x2f8f2, "\u{3c4e}"),
    (0x2f8f3, "\u{6b72}"), (0x2f8f4, "\u{6b9f}"), (0x2f8f5, "\u{6bba}"), (0x2f8f6, "\u{6bbb}"), (0x2f8f7, "\u{23a8d}"), (0x2f8f8, "\u{21d0b}"),
    (0x2f8f9, "\u{23afa}"), (0x2f8fa, "\u{6c4e}"), (0x2f8fb, "\u{23cbc}"), (0x2f8fc, "\u{6cbf}"), (0x2f8fd, "\u{6ccd}"), (0x2f8fe, "\u{6c67}"),
    (0x2f8ff, "\u{6d16}"), (0x2f900, "\u{6d3e}"), (0x2f901, "\u{6d77}"), (0x2f902, "\u{6d41}"), (0x2f903, "\u{6d69}"), (0x2f904, "\u{6d78}"),
    (0x2f905, "\u{6d85}"), (0x2f906, "\u{23d1e}"), (0x2f907, "\u{6d34}"), (0x2f908, "\u{6e2f}"), (0x2f909, "\u{6e6e}"), (0x2f90a, "\u{3d33}"),
    (0x2f90b, "\u{6ecb}"), (0x2f90c, "\u{6ec7}"), (0x2f90d, "\u{23ed1}"), (0x2f90e, "\u{6df9}"), (0x2f90f, "\u{6f6e}"), (0x2f910, "\u{23f5e}"),
    (0x2f911, "\u{23f8e}"), (0x2f912, "\u{6fc6}"), (0x2f913, "\u{7039}"), (0x2f914, "\u{701e}"), (0x2f915, "\u{701b}"), (0x2f916, "\u{3d96}"),
    (0x2f917, "\u{704a}"), (0x2f918, "\u{707d}"), (0x2f919, "\u{7077}"), (0x2f91a, "\u{70ad}"), (0x2f91b, "\u{20525}"), (0x2f91c, "\u{7145}"),
    (0x2f91d, "\u{24263}"), (0x2f91e, "\u{719c}"), (0x2f91f, "\u{243ab}"), (0x2f920, "\u{7228}"), (0x2f921, "\u{7235}"), (0x2f922, "\u{7250}"),
    (0x2f923, "\u{24608}"), (0x2f924, "\u{7280}"), (0x2f925, "\u{7295}"), (0x2f926, "\u{24735}"), (0x2f927, "\u{24814}"), (0x2f928, "\u{737a}"),
    (0x2f929, "\u{738b}"), (0x2f92a, "\u{3eac}"), (0x2f92b, "\u{73a5}"), (0x2f92c, "\u{3eb8}"), (0x2f92d, "\u{3eb8}"), (0x2f92e, "\u{7447}"),
    (0x2f92f, "\u{745c}"), (0x2f930, "\u{7471}"), (0x2f931, "\u{7485}"), (0x2f932, "\u{74ca}"), (0x2f933, "\u{3f1b}"), (0x2f934, "\u{7524}"),
    (0x2f935, "\u{24c36}"), (0x2f936, "\u{753e}"), (0x2f937, "\u{24c92}"), (0x2f938, "\u{7570}"), (0x2f939, "\u{2219f}"), (0x2f93a, "\u{7610}"),
    (0x2f93b, "\u{24fa1}"), (0x2f93c, "\u{24fb8}"), (0x2f93d, "\u{25044}"), (0x2f93e, "\u{3ffc}"), (0x2f93f, "\u{4008}"), (0x2f940, "\u{76f4}"),
    (0x2f941, "\u{250f3}"), (0x2f942, "\u{250f2}"), (0x2f943, "\u{25119}"), (0x2f944, "\u{25133}"), (0x2f945, "\u{771e}"), (0x2f946, "\u{771f}"),
    (0x2f947, "\u{771f}"), (0x2f948, "\u{774a}"), (0x2f949, "\u{4039}"), (0x2f94a, "\u{778b}"), (0x2f94b, "\u{4046}"), (0x2f94c, "\u{4096}"),
    (0x2f94d, "\u{2541d}"), (0x2f94e, "\u{784e}"), (0x2f94f, "\u{788c}"), (0x2f950, "\u{78cc}"), (0x2f951, "\u{40e3}"), (0x2f952, "\u{25626}"),
    (0x2f953, "\u{7956}"), (0x2f954, "\u{2569a}"), (0x2f955, "\u{256c5}"), (0x2f956, "\u{798f}"), (0x2f957, "\u{79eb}"), (0x2f958, "\u{412f}"),
    (0x2f959, "\u{7a40}"), (0x2f95a, "\u{7a4a}"), (0x2f95b, "\u{7a4f}"), (0x2f95c, "\u{2597c}"), (0x2f95d, "\u{25aa7}"), (0x2f95e, "\u{25aa7}"),
    (0x2f95f, "\u{7aee}"), (0x2f960, "\u{4202}"), (0x2f961, "\u{25bab}"), (0x2f962, "\u{7bc6}"), (0x2f963, "\u{7bc9}"), (0x2f964, "\u{4227}"),
    (0x2f965, "\u{25c80}"), (0x2f966, "\u{7cd2}"), (0x2f967, "\u{42a0}"), (0x2f968, "\u{7ce8}"), (0x2f969, "\u{7ce3}"), (0x2f96a, "\u{7d00}"),
    (0x2f96b, "\u{25f86}"), (0x2f96c, "\u{7d63}"), (0x2f96d, "\u{4301}"), (0x2f96e, "\u{7dc7}"), (0x2f96f, "\u{7e02}"), (0x2f970, "\u{7e45}"),
    (0x2f971, "\u{4334}"), (0x2f972, "\u{26228}"), (0x2f973, "\u{26247}"), (0x2f974, "\u{4359}"), (0x2f975, "\u{262d9}"), (0x2f976, "\u{7f7a}"),
    (0x2f977, "\u{2633e}"), (0x2f978, "\u{7f95}"), (0x2f979, "\u{7ffa}"), (0x2f97a, "\u{8005}"), (0x2f97b, "\u{264da}"), (0x2f97c, "\u{26523}"),
    (0x2f97d, "\u{8060}"), (0x2f97e, "\u{265a8}"), (0x2f97f, "\u{8070}"), (0x2f980, "\u{2335f}"), (0x2f981, "\u{43d5}"), (0x2f982, "\u{80b2}"),
    (0x2f983, "\u{8103}"), (0x2f984, "\u{440b}"), (0x2f985, "\u{813e}"), (0x2f986, "\u{5ab5}"), (0x2f987, "\u{267a7}"), (0x2f988, "\u{267b5}"),
    (0x2f989, "\u{23393}"), (0x2f98a, "\u{2339c}"), (0x2f98b, "\u{8201}"), (0x2f98c, "\u{8204}"), (0x2f98d, "\u{8f9e}"), (0x2f98e, "\u{446b}"),
    (0x2f98f, "\u{8291}"), (0x2f990, "\u{828b}"), (0x2f991, "\u{829d}"), (0x2f992, "\u{52b3}"), (0x2f993, "\u{82b1}"), (0x2f994, "\u{82b3}"),
    (0x2f995, "\u{82bd}"), (0x2f996, "\u{82e6}"), (0x2f997, "\u{26b3c}"), (0x2f998, "\u{82e5}"), (0x2f999, "\u{831d}"), (0x2f99a, "\u{8363}"),
    (0x2f99b, "\u{83ad}"), (0x2f99c, "\u{8323}"), (0x2f99d, "\u{83bd}"), (0x2f99e, "\u{83e7}"), (0x2f99f, "\u{8457}"), (0x2f9a0, "\u{8353}"),
    (0x2f9a1, "\u{83ca}"), (0x2f9a2, "\u{83cc}"), (0x2f9a3, "\u{83dc}"), (0x2f9a4, "\u{26c36}"), (0x2f9a5, "\u{26d6b}"), (0x2f9a6, "\u{26cd5}"),
    (0x2f9a7, "\u{452b}"), (0x2f9a8, "\u{84f1}"), (0x2f9a9, "\u{84f3}"), (0x2f9aa, "\u{8516}"), (0x2f9ab, "\u{273ca}"), (0x2f9ac, "\u{8564}"),
    (0x2f9ad, "\u{26f2c}"), (0x2f9ae, "\u{455d}"), (0x2f9af, "\u{4561}"), (0x2f9b0, "\u{26fb1}"), (0x2f9b1, "\u{270d2}"), (0x2f9b2, "\u{456b}"),
    (0x2f9b3, "\u{8650}"), (0x2f9b4, "\u{865c}"), (0x2f9b5, "\u{8667}"), (0x2f9b6, "\u{8669}"), (0x2f9b7, "\u{86a9}"), (0x2f9b8, "\u{8688}"),
    (0x2f9b9, "\u{870e}"), (0x2f9ba, "\u{86e2}"), (0x2f9bb, "\u{8779}"), (0x2f9bc, "\u{8728}"), (0x2f9bd, "\u{876b}"), (0x2f9be, "\u{8786}"),
    (0x2f9bf, "\u{45d7}"), (0x2f9c0, "\u{87e1}"), (0x2f9c1, "\u{8801}"), (0x2f9c2, "\u{45f9}"), (0x2f9c3, "\u{8860}"), (0x2f9c4, "\u{8863}"),
    (0x2f9c5, "\u{27667}"), (0x2f9c6, "\u{88d7}"), (0x2f9c7, "\u{88de}"), (0x2f9c8, "\u{4635}"), (0x2f9c9, "\u{88fa}"), (0x2f9ca, "\u{34bb}"),
    (0x2f9cb, "\u{278ae}"), (0x2f9cc, "\u{27966}"), (0x2f9cd, "\u{46be}"), (0x2f9ce, "\u{46c7}"), (0x2f9cf, "\u{8aa0}"), (0x2f9d0, "\u{8aed}"),
    (0x2f9d1, "\u{8b8a}"), (0x2f9d2, "\u{8c55}"), (0x2f9d3, "\u{27ca8}"), (0x2f9d4, "\u{8cab}"), (0x2f9d5, "\u{8cc1}"), (0x2f9d6, "\u{8d1b}"),
    (0x2f9d7, "\u{8d77}"), (0x2f9d8, "\u{27f2f}"), (0x2f9d9, "\u{20804}"), (0x2f9da, "\u{8dcb}"), (0x2f9db, "\u{8dbc}"), (0x2f9dc, "\u{8df0}"),
    (0x2f9dd, "\u{208de}"), (0x2f9de, "\u{8ed4}"), (0x2f9df, "\u{8f38}"), (0x2f9e0, "\u{285d2}"), (0x2f9e1, "\u{285ed}"), (0x2f9e2, "\u{9094}"),
    (0x2f9e3, "\u{90f1}"), (0x2f9e4, "\u{9111}"), (0x2f9e5, "\u{2872e}"), (0x2f9e6, "\u{911b}"), (0x2f9e7, "\u{9238}"), (0x2f9e8, "\u{92d7}"),
    (0x2f9e9, "\u{92d8}"), (0x2f9ea, "\u{927c}"), (0x2f9eb, "\u{93f9}"), (0x2f9ec, "\u{9415}"), (0x2f9ed, "\u{28bfa}"), (0x2f9ee, "\u{958b}"),
    (0x2f9ef, "\u{4995}"), (0x2f9f0, "\u{95b7}"), (0x2f9f1, "\u{28d77}"), (0x2f9f2, "\u{49e6}"), (0x2f9f3, "\u{96c3}"), (0x2f9f4, "\u{5db2}"),
    (0x2f9f5, "\u{9723}"), (0x2f9f6, "\u{29145}"), (0x2f9f7, "\u{2921a}"), (0x2f9f8, "\u{4a6e}"), (0x2f9f9, "\u{4a76}"), (0x2f9fa, "\u{97e0}"),
    (0x2f9fb, "\u{2940a}"), (0x2f9fc, "\u{4ab2}"), (0x2f9fd, "\u{29496}"), (0x2f9fe, "\u{980b}"), (0x2f9ff, "\u{980b}"), (0x2fa00, "\u{9829}"),
    (0x2fa01, "\u{295b6}"), (0x2fa02, "\u{98e2}"), (0x2fa03, "\u{4b33}"), (0x2fa04, "\u{9929}"), (0x2fa05, "\u{99a7}"), (0x2fa06, "\u{99c2}"),
    (0x2fa07, "\u{99fe}"), (0x2fa08, "\u{4bce}"), (0x2fa09, "\u{29b30}"), (0x2fa0a, "\u{9b12}"), (0x2fa0b, "\u{9c40}"), (0x2fa0c, "\u{9cfd}"),
    (0x2fa0d, "\u{4cce}"), (0x2fa0e, "\u{4ced}"), (0x2fa0f, "\u{9d67}"), (0x2fa10, "\u{2a0ce}"), (0x2fa11, "\u{4cf8}"), (0x2fa12, "\u{2a105}"),
    (0x2fa13, "\u{2a20e}"), (0x2fa14, "\u{2a291}"), (0x2fa15, "\u{9ebb}"), (0x2fa16, "\u{4d56}"), (0x2fa17, "\u{9ef9}"), (0x2fa18, "\u{9efe}"),
    (0x2fa19, "\u{9f05}"), (0x2fa1a, "\u{9f0f}"), (0x2fa1b, "\u{9f16}"), (0x2fa1c, "\u{9f3b}"), (0x2fa1d, "\u{2a600}"),
];

/// Tabela "punkt kodowy -> ranga ccc" (posortowana rosnaco; GENEROWANA, nie edytowac recznie).
/// Ranga 0 = brak wpisu (starter). Wieksza ranga = wyzsze ccc; ta sama ccc = ta sama ranga.
#[rustfmt::skip]
static CCC_RANK: &[(u32, u8)] = &[
    (0x300, 51), (0x301, 51), (0x302, 51), (0x303, 51), (0x304, 51), (0x305, 51), (0x306, 51), (0x307, 51),
    (0x308, 51), (0x309, 51), (0x30a, 51), (0x30b, 51), (0x30c, 51), (0x30d, 51), (0x30e, 51), (0x30f, 51),
    (0x310, 51), (0x311, 51), (0x312, 51), (0x313, 51), (0x314, 51), (0x315, 52), (0x316, 46), (0x317, 46),
    (0x318, 46), (0x319, 46), (0x31a, 52), (0x31b, 44), (0x31c, 46), (0x31d, 46), (0x31e, 46), (0x31f, 46),
    (0x320, 46), (0x321, 42), (0x322, 42), (0x323, 46), (0x324, 46), (0x325, 46), (0x326, 46), (0x327, 42),
    (0x328, 42), (0x329, 46), (0x32a, 46), (0x32b, 46), (0x32c, 46), (0x32d, 46), (0x32e, 46), (0x32f, 46),
    (0x330, 46), (0x331, 46), (0x332, 46), (0x333, 46), (0x334, 1), (0x335, 1), (0x336, 1), (0x337, 1),
    (0x338, 1), (0x339, 46), (0x33a, 46), (0x33b, 46), (0x33c, 46), (0x33d, 51), (0x33e, 51), (0x33f, 51),
    (0x342, 51), (0x345, 55), (0x346, 51), (0x347, 46), (0x348, 46), (0x349, 46), (0x34a, 51), (0x34b, 51),
    (0x34c, 51), (0x34d, 46), (0x34e, 46), (0x350, 51), (0x351, 51), (0x352, 51), (0x353, 46), (0x354, 46),
    (0x355, 46), (0x356, 46), (0x357, 51), (0x358, 52), (0x359, 46), (0x35a, 46), (0x35b, 51), (0x35c, 53),
    (0x35d, 54), (0x35e, 54), (0x35f, 53), (0x360, 54), (0x361, 54), (0x362, 53), (0x363, 51), (0x364, 51),
    (0x365, 51), (0x366, 51), (0x367, 51), (0x368, 51), (0x369, 51), (0x36a, 51), (0x36b, 51), (0x36c, 51),
    (0x36d, 51), (0x36e, 51), (0x36f, 51), (0x483, 51), (0x484, 51), (0x485, 51), (0x486, 51), (0x487, 51),
    (0x591, 46), (0x592, 51), (0x593, 51), (0x594, 51), (0x595, 51), (0x596, 46), (0x597, 51), (0x598, 51),
    (0x599, 51), (0x59a, 47), (0x59b, 46), (0x59c, 51), (0x59d, 51), (0x59e, 51), (0x59f, 51), (0x5a0, 51),
    (0x5a1, 51), (0x5a2, 46), (0x5a3, 46), (0x5a4, 46), (0x5a5, 46), (0x5a6, 46), (0x5a7, 46), (0x5a8, 51),
    (0x5a9, 51), (0x5aa, 46), (0x5ab, 51), (0x5ac, 51), (0x5ad, 47), (0x5ae, 50), (0x5af, 51), (0x5b0, 6),
    (0x5b1, 7), (0x5b2, 8), (0x5b3, 9), (0x5b4, 10), (0x5b5, 11), (0x5b6, 12), (0x5b7, 13), (0x5b8, 14),
    (0x5b9, 15), (0x5ba, 15), (0x5bb, 16), (0x5bc, 17), (0x5bd, 18), (0x5bf, 19), (0x5c1, 20), (0x5c2, 21),
    (0x5c4, 51), (0x5c5, 46), (0x5c7, 14), (0x610, 51), (0x611, 51), (0x612, 51), (0x613, 51), (0x614, 51),
    (0x615, 51), (0x616, 51), (0x617, 51), (0x618, 26), (0x619, 27), (0x61a, 28), (0x64b, 23), (0x64c, 24),
    (0x64d, 25), (0x64e, 26), (0x64f, 27), (0x650, 28), (0x651, 29), (0x652, 30), (0x653, 51), (0x654, 51),
    (0x655, 46), (0x656, 46), (0x657, 51), (0x658, 51), (0x659, 51), (0x65a, 51), (0x65b, 51), (0x65c, 46),
    (0x65d, 51), (0x65e, 51), (0x65f, 46), (0x670, 31), (0x6d6, 51), (0x6d7, 51), (0x6d8, 51), (0x6d9, 51),
    (0x6da, 51), (0x6db, 51), (0x6dc, 51), (0x6df, 51), (0x6e0, 51), (0x6e1, 51), (0x6e2, 51), (0x6e3, 46),
    (0x6e4, 51), (0x6e7, 51), (0x6e8, 51), (0x6ea, 46), (0x6eb, 51), (0x6ec, 51), (0x6ed, 46), (0x711, 32),
    (0x730, 51), (0x731, 46), (0x732, 51), (0x733, 51), (0x734, 46), (0x735, 51), (0x736, 51), (0x737, 46),
    (0x738, 46), (0x739, 46), (0x73a, 51), (0x73b, 46), (0x73c, 46), (0x73d, 51), (0x73e, 46), (0x73f, 51),
    (0x740, 51), (0x741, 51), (0x742, 46), (0x743, 51), (0x744, 46), (0x745, 51), (0x746, 46), (0x747, 51),
    (0x748, 46), (0x749, 51), (0x74a, 51), (0x7eb, 51), (0x7ec, 51), (0x7ed, 51), (0x7ee, 51), (0x7ef, 51),
    (0x7f0, 51), (0x7f1, 51), (0x7f2, 46), (0x7f3, 51), (0x7fd, 46), (0x816, 51), (0x817, 51), (0x818, 51),
    (0x819, 51), (0x81b, 51), (0x81c, 51), (0x81d, 51), (0x81e, 51), (0x81f, 51), (0x820, 51), (0x821, 51),
    (0x822, 51), (0x823, 51), (0x825, 51), (0x826, 51), (0x827, 51), (0x829, 51), (0x82a, 51), (0x82b, 51),
    (0x82c, 51), (0x82d, 51), (0x859, 46), (0x85a, 46), (0x85b, 46), (0x897, 51), (0x898, 51), (0x899, 46),
    (0x89a, 46), (0x89b, 46), (0x89c, 51), (0x89d, 51), (0x89e, 51), (0x89f, 51), (0x8ca, 51), (0x8cb, 51),
    (0x8cc, 51), (0x8cd, 51), (0x8ce, 51), (0x8cf, 46), (0x8d0, 46), (0x8d1, 46), (0x8d2, 46), (0x8d3, 46),
    (0x8d4, 51), (0x8d5, 51), (0x8d6, 51), (0x8d7, 51), (0x8d8, 51), (0x8d9, 51), (0x8da, 51), (0x8db, 51),
    (0x8dc, 51), (0x8dd, 51), (0x8de, 51), (0x8df, 51), (0x8e0, 51), (0x8e1, 51), (0x8e3, 46), (0x8e4, 51),
    (0x8e5, 51), (0x8e6, 46), (0x8e7, 51), (0x8e8, 51), (0x8e9, 46), (0x8ea, 51), (0x8eb, 51), (0x8ec, 51),
    (0x8ed, 46), (0x8ee, 46), (0x8ef, 46), (0x8f0, 23), (0x8f1, 24), (0x8f2, 25), (0x8f3, 51), (0x8f4, 51),
    (0x8f5, 51), (0x8f6, 46), (0x8f7, 51), (0x8f8, 51), (0x8f9, 46), (0x8fa, 46), (0x8fb, 51), (0x8fc, 51),
    (0x8fd, 51), (0x8fe, 51), (0x8ff, 51), (0x93c, 3), (0x94d, 5), (0x951, 51), (0x952, 46), (0x953, 51),
    (0x954, 51), (0x9bc, 3), (0x9cd, 5), (0x9fe, 51), (0xa3c, 3), (0xa4d, 5), (0xabc, 3), (0xacd, 5),
    (0xb3c, 3), (0xb4d, 5), (0xbcd, 5), (0xc3c, 3), (0xc4d, 5), (0xc55, 33), (0xc56, 34), (0xcbc, 3),
    (0xccd, 5), (0xd3b, 5), (0xd3c, 5), (0xd4d, 5), (0xdca, 5), (0xe38, 35), (0xe39, 35), (0xe3a, 5),
    (0xe48, 36), (0xe49, 36), (0xe4a, 36), (0xe4b, 36), (0xeb8, 37), (0xeb9, 37), (0xeba, 5), (0xec8, 38),
    (0xec9, 38), (0xeca, 38), (0xecb, 38), (0xf18, 46), (0xf19, 46), (0xf35, 46), (0xf37, 46), (0xf39, 44),
    (0xf71, 39), (0xf72, 40), (0xf74, 41), (0xf7a, 40), (0xf7b, 40), (0xf7c, 40), (0xf7d, 40), (0xf80, 40),
    (0xf82, 51), (0xf83, 51), (0xf84, 5), (0xf86, 51), (0xf87, 51), (0xfc6, 46), (0x1037, 3), (0x1039, 5),
    (0x103a, 5), (0x108d, 46), (0x135d, 51), (0x135e, 51), (0x135f, 51), (0x1714, 5), (0x1715, 5), (0x1734, 5),
    (0x17d2, 5), (0x17dd, 51), (0x18a9, 50), (0x1939, 47), (0x193a, 51), (0x193b, 46), (0x1a17, 51), (0x1a18, 46),
    (0x1a60, 5), (0x1a75, 51), (0x1a76, 51), (0x1a77, 51), (0x1a78, 51), (0x1a79, 51), (0x1a7a, 51), (0x1a7b, 51),
    (0x1a7c, 51), (0x1a7f, 46), (0x1ab0, 51), (0x1ab1, 51), (0x1ab2, 51), (0x1ab3, 51), (0x1ab4, 51), (0x1ab5, 46),
    (0x1ab6, 46), (0x1ab7, 46), (0x1ab8, 46), (0x1ab9, 46), (0x1aba, 46), (0x1abb, 51), (0x1abc, 51), (0x1abd, 46),
    (0x1abf, 46), (0x1ac0, 46), (0x1ac1, 51), (0x1ac2, 51), (0x1ac3, 46), (0x1ac4, 46), (0x1ac5, 51), (0x1ac6, 51),
    (0x1ac7, 51), (0x1ac8, 51), (0x1ac9, 51), (0x1aca, 46), (0x1acb, 51), (0x1acc, 51), (0x1acd, 51), (0x1ace, 51),
    (0x1acf, 51), (0x1ad0, 51), (0x1ad1, 51), (0x1ad2, 51), (0x1ad3, 51), (0x1ad4, 51), (0x1ad5, 51), (0x1ad6, 51),
    (0x1ad7, 51), (0x1ad8, 51), (0x1ad9, 51), (0x1ada, 51), (0x1adb, 51), (0x1adc, 51), (0x1add, 46), (0x1ae0, 51),
    (0x1ae1, 51), (0x1ae2, 51), (0x1ae3, 51), (0x1ae4, 51), (0x1ae5, 51), (0x1ae6, 46), (0x1ae7, 51), (0x1ae8, 51),
    (0x1ae9, 51), (0x1aea, 51), (0x1aeb, 54), (0x1b34, 3), (0x1b44, 5), (0x1b6b, 51), (0x1b6c, 46), (0x1b6d, 51),
    (0x1b6e, 51), (0x1b6f, 51), (0x1b70, 51), (0x1b71, 51), (0x1b72, 51), (0x1b73, 51), (0x1baa, 5), (0x1bab, 5),
    (0x1be6, 3), (0x1bf2, 5), (0x1bf3, 5), (0x1c37, 3), (0x1cd0, 51), (0x1cd1, 51), (0x1cd2, 51), (0x1cd4, 1),
    (0x1cd5, 46), (0x1cd6, 46), (0x1cd7, 46), (0x1cd8, 46), (0x1cd9, 46), (0x1cda, 51), (0x1cdb, 51), (0x1cdc, 46),
    (0x1cdd, 46), (0x1cde, 46), (0x1cdf, 46), (0x1ce0, 51), (0x1ce2, 1), (0x1ce3, 1), (0x1ce4, 1), (0x1ce5, 1),
    (0x1ce6, 1), (0x1ce7, 1), (0x1ce8, 1), (0x1ced, 46), (0x1cf4, 51), (0x1cf8, 51), (0x1cf9, 51), (0x1dc0, 51),
    (0x1dc1, 51), (0x1dc2, 46), (0x1dc3, 51), (0x1dc4, 51), (0x1dc5, 51), (0x1dc6, 51), (0x1dc7, 51), (0x1dc8, 51),
    (0x1dc9, 51), (0x1dca, 46), (0x1dcb, 51), (0x1dcc, 51), (0x1dcd, 54), (0x1dce, 43), (0x1dcf, 46), (0x1dd0, 42),
    (0x1dd1, 51), (0x1dd2, 51), (0x1dd3, 51), (0x1dd4, 51), (0x1dd5, 51), (0x1dd6, 51), (0x1dd7, 51), (0x1dd8, 51),
    (0x1dd9, 51), (0x1dda, 51), (0x1ddb, 51), (0x1ddc, 51), (0x1ddd, 51), (0x1dde, 51), (0x1ddf, 51), (0x1de0, 51),
    (0x1de1, 51), (0x1de2, 51), (0x1de3, 51), (0x1de4, 51), (0x1de5, 51), (0x1de6, 51), (0x1de7, 51), (0x1de8, 51),
    (0x1de9, 51), (0x1dea, 51), (0x1deb, 51), (0x1dec, 51), (0x1ded, 51), (0x1dee, 51), (0x1def, 51), (0x1df0, 51),
    (0x1df1, 51), (0x1df2, 51), (0x1df3, 51), (0x1df4, 51), (0x1df5, 51), (0x1df6, 52), (0x1df7, 50), (0x1df8, 50),
    (0x1df9, 46), (0x1dfa, 45), (0x1dfb, 51), (0x1dfc, 53), (0x1dfd, 46), (0x1dfe, 51), (0x1dff, 46), (0x20d0, 51),
    (0x20d1, 51), (0x20d2, 1), (0x20d3, 1), (0x20d4, 51), (0x20d5, 51), (0x20d6, 51), (0x20d7, 51), (0x20d8, 1),
    (0x20d9, 1), (0x20da, 1), (0x20db, 51), (0x20dc, 51), (0x20e1, 51), (0x20e5, 1), (0x20e6, 1), (0x20e7, 51),
    (0x20e8, 46), (0x20e9, 51), (0x20ea, 1), (0x20eb, 1), (0x20ec, 46), (0x20ed, 46), (0x20ee, 46), (0x20ef, 46),
    (0x20f0, 51), (0x2cef, 51), (0x2cf0, 51), (0x2cf1, 51), (0x2d7f, 5), (0x2de0, 51), (0x2de1, 51), (0x2de2, 51),
    (0x2de3, 51), (0x2de4, 51), (0x2de5, 51), (0x2de6, 51), (0x2de7, 51), (0x2de8, 51), (0x2de9, 51), (0x2dea, 51),
    (0x2deb, 51), (0x2dec, 51), (0x2ded, 51), (0x2dee, 51), (0x2def, 51), (0x2df0, 51), (0x2df1, 51), (0x2df2, 51),
    (0x2df3, 51), (0x2df4, 51), (0x2df5, 51), (0x2df6, 51), (0x2df7, 51), (0x2df8, 51), (0x2df9, 51), (0x2dfa, 51),
    (0x2dfb, 51), (0x2dfc, 51), (0x2dfd, 51), (0x2dfe, 51), (0x2dff, 51), (0x302a, 45), (0x302b, 50), (0x302c, 52),
    (0x302d, 47), (0x302e, 48), (0x302f, 48), (0x3099, 4), (0x309a, 4), (0xa66f, 51), (0xa674, 51), (0xa675, 51),
    (0xa676, 51), (0xa677, 51), (0xa678, 51), (0xa679, 51), (0xa67a, 51), (0xa67b, 51), (0xa67c, 51), (0xa67d, 51),
    (0xa69e, 51), (0xa69f, 51), (0xa6f0, 51), (0xa6f1, 51), (0xa806, 5), (0xa82c, 5), (0xa8c4, 5), (0xa8e0, 51),
    (0xa8e1, 51), (0xa8e2, 51), (0xa8e3, 51), (0xa8e4, 51), (0xa8e5, 51), (0xa8e6, 51), (0xa8e7, 51), (0xa8e8, 51),
    (0xa8e9, 51), (0xa8ea, 51), (0xa8eb, 51), (0xa8ec, 51), (0xa8ed, 51), (0xa8ee, 51), (0xa8ef, 51), (0xa8f0, 51),
    (0xa8f1, 51), (0xa92b, 46), (0xa92c, 46), (0xa92d, 46), (0xa953, 5), (0xa9b3, 3), (0xa9c0, 5), (0xaab0, 51),
    (0xaab2, 51), (0xaab3, 51), (0xaab4, 46), (0xaab7, 51), (0xaab8, 51), (0xaabe, 51), (0xaabf, 51), (0xaac1, 51),
    (0xaaf6, 5), (0xabed, 5), (0xfb1e, 22), (0xfe20, 51), (0xfe21, 51), (0xfe22, 51), (0xfe23, 51), (0xfe24, 51),
    (0xfe25, 51), (0xfe26, 51), (0xfe27, 46), (0xfe28, 46), (0xfe29, 46), (0xfe2a, 46), (0xfe2b, 46), (0xfe2c, 46),
    (0xfe2d, 46), (0xfe2e, 51), (0xfe2f, 51), (0x101fd, 46), (0x102e0, 46), (0x10376, 51), (0x10377, 51), (0x10378, 51),
    (0x10379, 51), (0x1037a, 51), (0x10a0d, 46), (0x10a0f, 51), (0x10a38, 51), (0x10a39, 1), (0x10a3a, 46), (0x10a3f, 5),
    (0x10ae5, 51), (0x10ae6, 46), (0x10d24, 51), (0x10d25, 51), (0x10d26, 51), (0x10d27, 51), (0x10d69, 51), (0x10d6a, 51),
    (0x10d6b, 51), (0x10d6c, 51), (0x10d6d, 51), (0x10eab, 51), (0x10eac, 51), (0x10efa, 46), (0x10efb, 46), (0x10efd, 46),
    (0x10efe, 46), (0x10eff, 46), (0x10f46, 46), (0x10f47, 46), (0x10f48, 51), (0x10f49, 51), (0x10f4a, 51), (0x10f4b, 46),
    (0x10f4c, 51), (0x10f4d, 46), (0x10f4e, 46), (0x10f4f, 46), (0x10f50, 46), (0x10f82, 51), (0x10f83, 46), (0x10f84, 51),
    (0x10f85, 46), (0x11046, 5), (0x11070, 5), (0x1107f, 5), (0x110b9, 5), (0x110ba, 3), (0x11100, 51), (0x11101, 51),
    (0x11102, 51), (0x11133, 5), (0x11134, 5), (0x11173, 3), (0x111c0, 5), (0x111ca, 3), (0x11235, 5), (0x11236, 3),
    (0x112e9, 3), (0x112ea, 5), (0x1133b, 3), (0x1133c, 3), (0x1134d, 5), (0x11366, 51), (0x11367, 51), (0x11368, 51),
    (0x11369, 51), (0x1136a, 51), (0x1136b, 51), (0x1136c, 51), (0x11370, 51), (0x11371, 51), (0x11372, 51), (0x11373, 51),
    (0x11374, 51), (0x113ce, 5), (0x113cf, 5), (0x113d0, 5), (0x11442, 5), (0x11446, 3), (0x1145e, 51), (0x114c2, 5),
    (0x114c3, 3), (0x115bf, 5), (0x115c0, 3), (0x1163f, 5), (0x116b6, 5), (0x116b7, 3), (0x1172b, 5), (0x11839, 5),
    (0x1183a, 3), (0x1193d, 5), (0x1193e, 5), (0x11943, 3), (0x119e0, 5), (0x11a34, 5), (0x11a47, 5), (0x11a99, 5),
    (0x11c3f, 5), (0x11d42, 3), (0x11d44, 5), (0x11d45, 5), (0x11d97, 5), (0x11f41, 5), (0x11f42, 5), (0x1612f, 5),
    (0x16af0, 1), (0x16af1, 1), (0x16af2, 1), (0x16af3, 1), (0x16af4, 1), (0x16b30, 51), (0x16b31, 51), (0x16b32, 51),
    (0x16b33, 51), (0x16b34, 51), (0x16b35, 51), (0x16b36, 51), (0x16ff0, 2), (0x16ff1, 2), (0x1bc9e, 1), (0x1d165, 44),
    (0x1d166, 44), (0x1d167, 1), (0x1d168, 1), (0x1d169, 1), (0x1d16d, 49), (0x1d16e, 44), (0x1d16f, 44), (0x1d170, 44),
    (0x1d171, 44), (0x1d172, 44), (0x1d17b, 46), (0x1d17c, 46), (0x1d17d, 46), (0x1d17e, 46), (0x1d17f, 46), (0x1d180, 46),
    (0x1d181, 46), (0x1d182, 46), (0x1d185, 51), (0x1d186, 51), (0x1d187, 51), (0x1d188, 51), (0x1d189, 51), (0x1d18a, 46),
    (0x1d18b, 46), (0x1d1aa, 51), (0x1d1ab, 51), (0x1d1ac, 51), (0x1d1ad, 51), (0x1d242, 51), (0x1d243, 51), (0x1d244, 51),
    (0x1e000, 51), (0x1e001, 51), (0x1e002, 51), (0x1e003, 51), (0x1e004, 51), (0x1e005, 51), (0x1e006, 51), (0x1e008, 51),
    (0x1e009, 51), (0x1e00a, 51), (0x1e00b, 51), (0x1e00c, 51), (0x1e00d, 51), (0x1e00e, 51), (0x1e00f, 51), (0x1e010, 51),
    (0x1e011, 51), (0x1e012, 51), (0x1e013, 51), (0x1e014, 51), (0x1e015, 51), (0x1e016, 51), (0x1e017, 51), (0x1e018, 51),
    (0x1e01b, 51), (0x1e01c, 51), (0x1e01d, 51), (0x1e01e, 51), (0x1e01f, 51), (0x1e020, 51), (0x1e021, 51), (0x1e023, 51),
    (0x1e024, 51), (0x1e026, 51), (0x1e027, 51), (0x1e028, 51), (0x1e029, 51), (0x1e02a, 51), (0x1e08f, 51), (0x1e130, 51),
    (0x1e131, 51), (0x1e132, 51), (0x1e133, 51), (0x1e134, 51), (0x1e135, 51), (0x1e136, 51), (0x1e2ae, 51), (0x1e2ec, 51),
    (0x1e2ed, 51), (0x1e2ee, 51), (0x1e2ef, 51), (0x1e4ec, 52), (0x1e4ed, 52), (0x1e4ee, 46), (0x1e4ef, 51), (0x1e5ee, 51),
    (0x1e5ef, 46), (0x1e6e3, 51), (0x1e6e6, 51), (0x1e6ee, 51), (0x1e6ef, 51), (0x1e6f5, 51), (0x1e8d0, 46), (0x1e8d1, 46),
    (0x1e8d2, 46), (0x1e8d3, 46), (0x1e8d4, 46), (0x1e8d5, 46), (0x1e8d6, 46), (0x1e944, 51), (0x1e945, 51), (0x1e946, 51),
    (0x1e947, 51), (0x1e948, 51), (0x1e949, 51), (0x1e94a, 3),
];

#[cfg(test)]
mod tests {
    use super::*;

    const DATA: &[TerrainEntry<'static>] = &[
        TerrainEntry {
            teren: "Płaskie (równina/łąka)",
            bonus_obrona: Some("+0%"),
        },
        TerrainEntry {
            teren: "Las",
            bonus_obrona: Some("+50%"),
        },
        TerrainEntry {
            teren: "Wzgórza",
            bonus_obrona: Some("+50%"),
        },
        TerrainEntry {
            teren: "Rzeka",
            bonus_obrona: Some("+0%"),
        },
    ];

    #[test]
    fn tabela_nfd_jest_posortowana() {
        assert!(NFD_STRIPPED.windows(2).all(|w| w[0].0 < w[1].0));
    }

    #[test]
    fn tabela_ccc_jest_posortowana_i_bez_starterow() {
        assert!(CCC_RANK.windows(2).all(|w| w[0].0 < w[1].0));
        assert!(CCC_RANK.iter().all(|&(_, r)| r > 0));
    }

    #[test]
    fn kanoniczne_przestawianie_tybetanskie() {
        // Node: "ཱི".normalize('NFD') = [0F71, 0F72] (ccc 129 < 130).
        assert_eq!(norm_terrain("\u{0F72}\u{0F71}"), "\u{0F71}\u{0F72}");
        assert_eq!(norm_terrain("a\u{0F72}\u{0F71}"), "a\u{0F71}\u{0F72}");
        // Juz uporzadkowane: bez zmian.
        assert_eq!(norm_terrain("a\u{0F71}\u{0F72}"), "a\u{0F71}\u{0F72}");
    }

    #[test]
    fn kanoniczne_przestawianie_przez_granice_wejscia() {
        // U+0345 (ccc 240, usuwany jako U+0300..U+036F) przed run [0F72 (130), 0F71 (129)]: Node daje "a" 0F71 0F72.
        assert_eq!(
            norm_terrain("a\u{0345}\u{0F72}\u{0F71}"),
            "a\u{0F71}\u{0F72}"
        );
        // Stabilnosc: U+0301 i U+0302 maja ta sama ccc (230), wiec kolejnosc zostaje (w obu kierunkach).
        assert_eq!(canonical_order_vec(&[0x0301, 0x0302]), vec![0x0301, 0x0302]);
        assert_eq!(canonical_order_vec(&[0x0302, 0x0301]), vec![0x0302, 0x0301]);
    }

    fn canonical_order_vec(cps: &[u32]) -> Vec<u32> {
        let mut v = cps.to_vec();
        canonical_order(&mut v);
        v
    }

    #[test]
    fn norm_podstawy() {
        assert_eq!(norm_terrain("Wzgórza"), "wzgorza");
        assert_eq!(norm_terrain("Łąki"), "łaki");
        assert_eq!(norm_terrain("a\u{301}"), "a");
        assert_eq!(norm_terrain("한"), "\u{1112}\u{1161}\u{11ab}");
    }

    #[test]
    fn bonus_podstawy() {
        assert_eq!(parse_defense_bonus_pct(Some("+50%")), Some(50.0));
        assert_eq!(parse_defense_bonus_pct(Some("+0%")), None);
        assert_eq!(parse_defense_bonus_pct(Some("x-7y")), Some(-7.0));
        assert_eq!(parse_defense_bonus_pct(Some("+-5")), Some(-5.0));
        assert_eq!(parse_defense_bonus_pct(None), None);
    }

    #[test]
    fn mnozniki_podstawy() {
        assert_eq!(terrain_defense_multiplier("Wzgorza", "", DATA), 1.5);
        assert_eq!(terrain_defense_multiplier("Las", "Dystans", DATA), 1.5);
        assert_eq!(terrain_defense_multiplier("Las", "Piechota", DATA), 1.0);
        assert_eq!(terrain_river_attack_multiplier("Rzeka", DATA, 0.75), 0.75);
        assert_eq!(
            terrain_river_attack_multiplier("Rzeka", &DATA[..2], 0.75),
            1.0
        );
        assert_eq!(city_gated_terrain_multiplier(true, "Wzgórza", DATA), 1.5);
        assert_eq!(city_gated_terrain_multiplier(false, "Wzgórza", DATA), 1.0);
        assert_eq!(city_gated_terrain_multiplier(true, "Las", DATA), 1.0);
    }
}
