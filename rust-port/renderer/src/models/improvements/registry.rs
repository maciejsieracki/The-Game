//! `render/improvements.ts` (`edb8fb56`): `ImprovementKey`, `IMPROVEMENTS`,
//! `buildImprovement`, `buildImprovementSectored`, `buildImprovementStack`
//! — roblox map style only (D-RR-8 = A).
//!
//! `buildImprovement(key, owner, style)` goes to `buildRobloxImprovement`
//! when `style === 'roblox'` (`improvements.ts:344`), which is always the
//! case in the game (`GAME_MAP_RENDER_STYLE` is a constant). The classic
//! `switch` (`:345-380`) and its private builders, and the non-roblox
//! branches of `buildImprovementStack` (`:537-597`), are unreachable and not
//! ported. In roblox style `buildImprovementStack` reduces to "food stack +
//! the other keys" or "every key" (`:527-535`, `:598-601`): every
//! `foodKeys.length > 0` makes `buildRobloxFoodStack` non-null.

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, ROOT};

use super::droga::{build_droga_gwiazda_into, RoadTyp, ROAD_MASK_FULL};
use super::kopalnie::MineMats;
use super::model::ImprovementExt;
use super::model::{js_max_nan, js_min_nan, Box3, ImprovementModel};
use super::roblox::{build_roblox_food_stack_into, roblox_builder};

/// `ImprovementKey` (`improvements.ts:20-24`) — the 24 keys of `BUILDERS`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ImprovementKey {
    /// `'farma'`.
    Farma,
    /// `'bydlo'`.
    Bydlo,
    /// `'owce'`.
    Owce,
    /// `'lama'`.
    Lama,
    /// `'kamieniolom'`.
    Kamieniolom,
    /// `'oboz_lowiecki'`.
    ObozLowiecki,
    /// `'wyrab'`.
    Wyrab,
    /// `'tartak'`.
    Tartak,
    /// `'lodzie_rybackie'`.
    LodzieRybackie,
    /// `'droga'`.
    Droga,
    /// `'droga_brukowana'`.
    DrogaBrukowana,
    /// `'posterunek'`.
    Posterunek,
    /// `'stadnina'`.
    Stadnina,
    /// `'pastwisko'`.
    Pastwisko,
    /// `'kopalnia_miedzi'`.
    KopalniaMiedzi,
    /// `'kopalnia_zelaza'`.
    KopalniaZelaza,
    /// `'kopalnia_zlota'`.
    KopalniaZlota,
    /// `'kopalnia_cyny'`.
    KopalniaCyny,
    /// `'irygacja'`.
    Irygacja,
    /// `'pole_irygowane'`.
    PoleIrygowane,
    /// `'glinianka'`.
    Glinianka,
    /// `'warzelnia_soli'`.
    WarzelniaSoli,
    /// `'tarasy'`.
    Tarasy,
    /// `'fort'`.
    Fort,
}

impl ImprovementKey {
    /// All keys in the order of the TypeScript union.
    pub const ALL: [Self; 24] = [
        Self::Farma,
        Self::Bydlo,
        Self::Owce,
        Self::Lama,
        Self::Kamieniolom,
        Self::ObozLowiecki,
        Self::Wyrab,
        Self::Tartak,
        Self::LodzieRybackie,
        Self::Droga,
        Self::DrogaBrukowana,
        Self::Posterunek,
        Self::Stadnina,
        Self::Pastwisko,
        Self::KopalniaMiedzi,
        Self::KopalniaZelaza,
        Self::KopalniaZlota,
        Self::KopalniaCyny,
        Self::Irygacja,
        Self::PoleIrygowane,
        Self::Glinianka,
        Self::WarzelniaSoli,
        Self::Tarasy,
        Self::Fort,
    ];

    /// The web key string.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Farma => "farma",
            Self::Bydlo => "bydlo",
            Self::Owce => "owce",
            Self::Lama => "lama",
            Self::Kamieniolom => "kamieniolom",
            Self::ObozLowiecki => "oboz_lowiecki",
            Self::Wyrab => "wyrab",
            Self::Tartak => "tartak",
            Self::LodzieRybackie => "lodzie_rybackie",
            Self::Droga => "droga",
            Self::DrogaBrukowana => "droga_brukowana",
            Self::Posterunek => "posterunek",
            Self::Stadnina => "stadnina",
            Self::Pastwisko => "pastwisko",
            Self::KopalniaMiedzi => "kopalnia_miedzi",
            Self::KopalniaZelaza => "kopalnia_zelaza",
            Self::KopalniaZlota => "kopalnia_zlota",
            Self::KopalniaCyny => "kopalnia_cyny",
            Self::Irygacja => "irygacja",
            Self::PoleIrygowane => "pole_irygowane",
            Self::Glinianka => "glinianka",
            Self::WarzelniaSoli => "warzelnia_soli",
            Self::Tarasy => "tarasy",
            Self::Fort => "fort",
        }
    }

    /// Parses a web key.
    #[must_use]
    pub fn from_web(s: &str) -> Option<Self> {
        Self::ALL.iter().copied().find(|k| k.as_str() == s)
    }
}

/// One entry of `IMPROVEMENTS` (`improvements.ts:26-47`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ImprovementInfo {
    /// Key.
    pub key: ImprovementKey,
    /// Polish label.
    pub label: &'static str,
    /// Era.
    pub epoka: u32,
}

/// `IMPROVEMENTS` (22 entries; `pole_irygowane` and `pastwisko` have models
/// but no entry, as in the web).
pub const IMPROVEMENTS: [ImprovementInfo; 22] = {
    use ImprovementKey as K;
    const fn i(key: K, label: &'static str, epoka: u32) -> ImprovementInfo {
        ImprovementInfo { key, label, epoka }
    }
    [
        i(K::Farma, "Farma", 1),
        i(K::Bydlo, "Pastwisko", 1),
        i(K::Owce, "Owczarnia", 1),
        i(K::Lama, "Zagroda lam", 1),
        i(K::Stadnina, "Stadnina", 2),
        i(K::KopalniaMiedzi, "Kopalnia miedzi", 2),
        i(K::KopalniaZelaza, "Kopalnia żelaza", 3),
        i(K::KopalniaCyny, "Kopalnia cyny", 2),
        i(K::Kamieniolom, "Kamieniołom", 1),
        i(K::KopalniaZlota, "Kopalnia złota", 2),
        i(K::ObozLowiecki, "Obóz łowiecki", 1),
        i(K::Wyrab, "Wycinka", 1),
        i(K::Tartak, "Tartak", 1),
        i(K::LodzieRybackie, "Łodzie rybackie", 1),
        i(K::Droga, "Droga", 1),
        i(K::DrogaBrukowana, "Droga brukowana", 3),
        i(K::Posterunek, "Posterunek (Strażnica)", 2),
        i(K::Irygacja, "Irygacja", 2),
        i(K::Glinianka, "Glinianka", 2),
        i(K::WarzelniaSoli, "Warzelnia soli", 2),
        i(K::Tarasy, "Tarasy", 2),
        i(K::Fort, "Fort", 3),
    ]
};

/// Default owner colour of the `buildImprovement*` functions.
pub const DEFAULT_OWNER_COL: u32 = 0x00ff_d54a;
/// `SECTOR_R` (`:392`).
pub const SECTOR_R: f64 = 0.72;
/// `SECTOR_SCALE` (`:393`).
pub const SECTOR_SCALE: f64 = 0.30;
/// `SECTOR_R_ELEVATED` (`:402`).
pub const SECTOR_R_ELEVATED: f64 = 0.86;

/// `buildImprovement(key, ownerCol)` into `g` (roblox `BUILDERS`). Any
/// string is accepted, like the web `k as ImprovementKey` casts; an unknown
/// key leaves `g` empty. (Web deviation, not measured: keys that name
/// `Object.prototype` members other than `toString` — e.g. `__proto__` —
/// may throw in the web; Rust leaves `g` empty.)
pub fn build_improvement_into(
    m: &mut ImprovementModel,
    cache: &mut MineMats,
    g: NodeId,
    key: &str,
    owner_col: u32,
) {
    roblox_builder(m, cache, g, key, owner_col);
}

/// `buildImprovement(key, ownerCol)` as a standalone model.
#[must_use]
pub fn build_improvement(key: &str, owner_col: u32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_improvement_into(&mut m, &mut MineMats::default(), ROOT, key, owner_col);
    m
}

/// `improvementSectorAngle(key)` (`:443-452`), degrees.
#[must_use]
pub fn improvement_sector_angle(key: &str) -> f64 {
    const SUROWIEC: [&str; 7] = [
        "kopalnia_zelaza",
        "glinianka",
        "warzelnia_soli",
        "stadnina",
        "kopalnia_miedzi",
        "kopalnia_zlota",
        "kopalnia_cyny",
    ];
    match key {
        "kamieniolom" => 300.0,
        "oboz_lowiecki" => 30.0,
        "tartak" | "wyrab" => 240.0,
        k if SUROWIEC.contains(&k) => 0.0,
        "farma" | "irygacja" | "pole_irygowane" | "tarasy" => 60.0,
        "bydlo" | "owce" | "lama" | "pastwisko" => 120.0,
        "fort" | "posterunek" => 180.0,
        _ => 240.0,
    }
}

fn is_fort_key(k: &str) -> bool {
    k == "fort" || k == "posterunek"
}

/// `SectorReliefOpts` (`:405-410`).
#[derive(Default)]
pub struct SectorRelief<'a> {
    /// `sectorR` (× hexR); `None` = `SECTOR_R`.
    pub sector_r: Option<f64>,
    /// `surfaceY(x, z)`: terrain height above the hex top in hex space.
    pub surface_y: Option<&'a dyn Fn(f64, f64) -> f64>,
}

/// `najnizszaPowierzchniaPod(box, surfaceY)` (`:417-425`).
fn najnizsza_powierzchnia_pod(b: &Box3, surface_y: &dyn Fn(f64, f64) -> f64) -> f64 {
    let xs = [b.min.x, (b.min.x + b.max.x) / 2.0, b.max.x];
    let zs = [b.min.z, (b.min.z + b.max.z) / 2.0, b.max.z];
    let mut y = f64::INFINITY;
    for &x in &xs {
        for &z in &zs {
            y = js_min_nan(y, surface_y(x, z));
        }
    }
    if y.is_finite() {
        js_max_nan(0.0, y)
    } else {
        0.0
    }
}

fn normalized<'k>(keys: &[&'k str]) -> Vec<&'k str> {
    keys.iter()
        .copied()
        .filter(|k| !k.is_empty() && *k != "brak")
        .collect()
}

/// `buildImprovementSectored(keys, ownerCol, 'roblox', hexR, relief,
/// roadMask)` (`:458-515`).
#[must_use]
pub fn build_improvement_sectored(
    keys: &[&str],
    owner_col: u32,
    hex_r: f64,
    relief: &SectorRelief<'_>,
    road_mask: u32,
) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    let mut cache = MineMats::default();
    let g = ROOT;
    let norm = normalized(keys);
    let road = if norm.contains(&"droga_brukowana") {
        Some(RoadTyp::DrogaBrukowana)
    } else if norm.contains(&"droga") {
        Some(RoadTyp::Droga)
    } else {
        None
    };
    if let Some(typ) = road {
        let r = m.detached();
        build_droga_gwiazda_into(&mut m, r, typ, road_mask, hex_r);
        m.attach(g, r);
    }
    // Map<number, string[]> in insertion order
    let mut by_sector: Vec<(f64, Vec<&str>)> = Vec::new();
    for &k in &norm {
        if k == "droga" || k == "droga_brukowana" {
            continue;
        }
        let ang = improvement_sector_angle(k);
        match by_sector.iter_mut().find(|(a, _)| *a == ang) {
            Some((_, v)) => v.push(k),
            None => by_sector.push((ang, vec![k])),
        }
    }
    for (ang_deg, ks) in by_sector {
        let sub = m.detached();
        for k in ks {
            let model = m.detached();
            build_improvement_into(&mut m, &mut cache, model, k, owner_col);
            let c = m.box_from_object(model).center();
            let n = m.node(model);
            n.position.x -= c.x;
            n.position.z -= c.z;
            if is_fort_key(k) {
                n.scale.x *= 0.5;
                n.scale.y *= 0.5;
                n.scale.z *= 0.5;
            }
            m.attach(sub, model);
        }
        let a = (ang_deg * PI) / 180.0;
        let ring_r = relief.sector_r.unwrap_or(SECTOR_R) * hex_r;
        m.node(sub).set_scale_scalar(SECTOR_SCALE).set_pos(
            js_sin(a) * ring_r,
            0.0,
            -js_cos(a) * ring_r,
        );
        if let Some(sy) = relief.surface_y {
            let b = m.box_from_object(sub);
            m.node(sub).position.y = najnizsza_powierzchnia_pod(&b, sy);
        }
        m.attach(g, sub);
    }
    m
}

/// `buildImprovementSectored(keys)` with every default (`ownerCol =
/// 0xffd54a`, `hexR = 1`, `relief = {}`, `roadMask = ROAD_MASK_FULL`).
#[must_use]
pub fn build_improvement_sectored_default(keys: &[&str]) -> ImprovementModel {
    build_improvement_sectored(
        keys,
        DEFAULT_OWNER_COL,
        1.0,
        &SectorRelief::default(),
        ROAD_MASK_FULL,
    )
}

/// `buildImprovementStack(keys, ownerCol, 'roblox')` (`:518-602`).
#[must_use]
pub fn build_improvement_stack(keys: &[&str], owner_col: u32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    let mut cache = MineMats::default();
    let g = ROOT;
    let norm = normalized(keys);
    let food: Vec<&str> = norm
        .iter()
        .copied()
        .filter(|k| super::roblox::FOOD_STACK_KEYS.contains(k))
        .collect();
    if !food.is_empty() && build_roblox_food_stack_into(&mut m, g, &norm) {
        for &k in norm.iter().filter(|k| !food.contains(k)) {
            let s = m.detached();
            build_improvement_into(&mut m, &mut cache, s, k, owner_col);
            m.attach(g, s);
        }
        return m;
    }
    for &k in &norm {
        let s = m.detached();
        build_improvement_into(&mut m, &mut cache, s, k, owner_col);
        m.attach(g, s);
    }
    m
}
