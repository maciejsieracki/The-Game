//! R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1: port 1:1 gałęzi AI oferującej miasto za pokój
//! (web FALA 556 AIPEACE, `gra/src/game/ai.ts`):
//! - stałe `AI_MIASTO_*` (:6234–6245) i `aiMiastoPrzekazRwProg` (:6248), `aiMiastoWagaOddawanego` (:6255),
//! - `aiPickMiastoDoOddania` (:6264) i `aiPickMiastoDoZadania` (:6286),
//! - blok `decideAIDiplomacy` (:6714–6794): N1a `oferuj_miasto_za_pokoj` (przegrywający) i N1b
//!   `zada_miasto_za_pokoj` (zwycięzca), wraz z `diplomacyMiastoWagaBilansu`
//!   (`gra/src/game/diplomacy-value-catalog.ts:875`).
//!
//! Reszta `decideAIDiplomacy` (priorytety 1–6) NIE jest tu portowana: w Ruście nie ma dekodera całej
//! decyzji AI. Moduł zwraca `None`, gdy blok N1a/N1b nie wystawia komendy (web: kontynuacja do priorytetu 1).
//!
//! Wykorzystane porty: `diplomacy_multiwar` (`war_weariness_level`, `loser_despair`, `despair_stage`,
//! `offer_multiplier`, `is_war_weary`, `js_max`), `diplomacy_war_peace_profile` (`is_feeling_stronger`,
//! `resolve_war_peace_profile`, `war_peace_params`).
//!
//! PARAMETRY SA LITERALAMI W KODZIE: `gra/data/war-weariness-params.json` sekcja `czlowiek`
//! (`rwProgBonusMax` = 0.25, `minMiastAi` = 2) nie jest w `WarWearinessParams` portu `diplomacy_multiwar`;
//! dodane tu jako stałe (ten sam wzorzec co tam: nowy plik w `data/` łamałby liczenie plików testów).
//!
//! JS-SEMANTYKA: `Math.max` propaguje NaN (`js_max`), `Math.round` = `js_round` (remis ku +∞),
//! `Number.prototype.toFixed(2)` = `js_to_fixed2` (w Ruście `{:.2}`, różnica tylko przy remisie dokładnym).

use super::diplomacy_multiwar::{
    despair_stage, is_war_weary, js_max, loser_despair, offer_multiplier, war_weariness_level,
    WarWearinessParams, WAR_WEARINESS_PARAMS,
};
use super::diplomacy_war_peace_profile::{
    is_feeling_stronger, resolve_war_peace_profile, war_peace_params, PeaceAiGateInput,
};

/// Web `AI_MIASTO_PRZEKAZ_RW_BAZA` (ai.ts:6234).
pub const AI_MIASTO_PRZEKAZ_RW_BAZA: f64 = 0.15;
/// Web `AI_MIASTO_PRZEKAZ_MIN_MIAST` (ai.ts:6236).
pub const AI_MIASTO_PRZEKAZ_MIN_MIAST: usize = 3;
/// Web `AI_MIASTO_ZADANIE_RW` (ai.ts:6238).
pub const AI_MIASTO_ZADANIE_RW: f64 = 0.7;
/// Web `AI_MIASTO_ZADANIE_TURY_WOJNY` (ai.ts:6240).
pub const AI_MIASTO_ZADANIE_TURY_WOJNY: f64 = 20.0;
/// Web `AI_MIASTO_CENA_POKOJU_PN` (ai.ts:6245) = `traktaty.pokoj.punkty` (500).
pub const AI_MIASTO_CENA_POKOJU_PN: f64 = 500.0;
/// Web `MIASTO_WAGA_ODDAJACEGO` (diplomacy-value-catalog.ts:786).
pub const MIASTO_WAGA_ODDAJACEGO: f64 = 1.5;
/// Web `MIASTO_AI_EKSPANSYWNOSC_KROK` (diplomacy-value-catalog.ts:788).
pub const MIASTO_AI_EKSPANSYWNOSC_KROK: f64 = 0.1;
/// Web `MIASTO_AI_EKSPANSYWNOSC_BAZA` (diplomacy-value-catalog.ts:789).
pub const MIASTO_AI_EKSPANSYWNOSC_BAZA: f64 = 3.0;
/// Web `WAR_WEARINESS_PARAMS.czlowiek.rwProgBonusMax` (war-weariness-params.json).
pub const CZLOWIEK_RW_PROG_BONUS_MAX: f64 = 0.25;
/// Web `WAR_WEARINESS_PARAMS.czlowiek.minMiastAi` (war-weariness-params.json).
pub const CZLOWIEK_MIN_MIAST_AI: usize = 2;

/// Web `Math.round(x)`: najbliższa liczba całkowita, remis ku +∞.
pub fn js_round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// Web `Number.prototype.toFixed(2)` dla wartości z zakresu [0, 1] (bez remisu dokładnego).
pub fn js_to_fixed2(x: f64) -> String {
    format!("{x:.2}")
}

/// Web `MiastoWycenaWejscie` (ai.ts:6130).
#[derive(Debug, Clone, PartialEq)]
pub struct MiastoWycena {
    pub city_id: String,
    pub city_pn: f64,
    /// Stolica lub ostatnie miasto właściciela (web `zakazane`).
    pub zakazane: bool,
}

/// Web `diplomacyMiastoWagaBilansu` (diplomacy-value-catalog.ts:875). `eks = None` = `undefined` (baza).
pub fn diplomacy_miasto_waga_bilansu(oddajacy_jest_ai: bool, ai_ekspansywnosc: Option<f64>) -> f64 {
    if !oddajacy_jest_ai {
        return 1.0;
    }
    let eks = ai_ekspansywnosc.unwrap_or(MIASTO_AI_EKSPANSYWNOSC_BAZA);
    let mnoznik_ai = 1.0 + MIASTO_AI_EKSPANSYWNOSC_KROK * (eks - MIASTO_AI_EKSPANSYWNOSC_BAZA);
    MIASTO_WAGA_ODDAJACEGO * mnoznik_ai
}

/// Web `aiMiastoPrzekazRwProg` (ai.ts:6248): próg rw oddania miasta; `None` = agresywność 5.
/// Arytmetyka w setnych w tej samej kolejności co JS (bez błędu IEEE754 dla 0.15 − 0.01·5).
pub fn ai_miasto_przekaz_rw_prog(agresywnosc_raw: Option<f64>) -> f64 {
    let agr = agresywnosc_raw.unwrap_or(5.0);
    (AI_MIASTO_PRZEKAZ_RW_BAZA * 100.0 - (agr - 5.0)) / 100.0
}

/// Web `aiMiastoWagaOddawanego` (ai.ts:6255): waga × zaokrąglenie do 0.001; `None` = ekspansywność 3.
pub fn ai_miasto_waga_oddawanego(ekspansywnosc: Option<f64>) -> f64 {
    let w = diplomacy_miasto_waga_bilansu(true, Some(ekspansywnosc.unwrap_or(3.0)));
    js_round(w * 1000.0) / 1000.0
}

/// Opcje web `aiPickMiastoDoOddania` (`minMiast`, `cenaPn`); `None` = `undefined`.
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct PickOddaniaOpcje {
    pub min_miast: Option<usize>,
    pub cena_pn: Option<f64>,
}

/// Web `aiPickMiastoDoOddania` (ai.ts:6264): najtańsze niezakazane miasto AI, którego wycena pokrywa cenę.
/// Przy remisie wygrywa pierwsze w kolejności listy (web: `m.cityPn < best.cityPn`).
pub fn pick_miasto_do_oddania(
    miasta: &[MiastoWycena],
    ekspansywnosc: Option<f64>,
    opcje: PickOddaniaOpcje,
) -> Option<&MiastoWycena> {
    if miasta.len() < opcje.min_miast.unwrap_or(AI_MIASTO_PRZEKAZ_MIN_MIAST) {
        return None;
    }
    let waga = ai_miasto_waga_oddawanego(ekspansywnosc);
    let cena = opcje.cena_pn.unwrap_or(AI_MIASTO_CENA_POKOJU_PN);
    let mut best: Option<&MiastoWycena> = None;
    for m in miasta {
        if m.zakazane {
            continue;
        }
        // Web `!(cityPn * waga >= cena)`: NaN nie pokrywa ceny (pominięcie).
        let pokrywa = m.city_pn * waga >= cena;
        if !pokrywa {
            continue;
        }
        match best {
            None => best = Some(m),
            Some(b) if m.city_pn < b.city_pn => best = Some(m),
            _ => {}
        }
    }
    best
}

/// Web `aiPickMiastoDoZadania` (ai.ts:6286): najtańsze niezakazane miasto gracza o wycenie >= 500 PW.
pub fn pick_miasto_do_zadania(miasta_partnera: &[MiastoWycena]) -> Option<&MiastoWycena> {
    let mut best: Option<&MiastoWycena> = None;
    for m in miasta_partnera {
        if m.zakazane {
            continue;
        }
        let wystarcza = m.city_pn >= AI_MIASTO_CENA_POKOJU_PN;
        if !wystarcza {
            continue;
        }
        match best {
            None => best = Some(m),
            Some(b) if m.city_pn < b.city_pn => best = Some(m),
            _ => {}
        }
    }
    best
}

/// Wejście per relacja (pola `RelacjaWejscie` używane przez blok N1a/N1b; `None` = `undefined` w webie).
#[derive(Debug, Clone, Copy)]
pub struct CityOfferRel<'a> {
    /// Web `rel.partnerId`.
    pub partner_id: &'a str,
    /// Web `rel.respektWzgledny`.
    pub rw: f64,
    /// Web `rel.stanWojny`.
    pub stan_wojny: bool,
    /// Web `rel.turnsAtWar`.
    pub turns_at_war: Option<f64>,
    /// Web `rel.lostCitiesInWar`.
    pub lost_cities_in_war: Option<f64>,
    /// Web `rel.zdobyteMiastaPartnera`.
    pub zdobyte_miasta_partnera: Option<f64>,
    /// Web `rel.turnsSinceCityChange`.
    pub turns_since_city_change: Option<f64>,
    /// Web `rel.isMinorCivPartner`.
    pub is_minor_civ_partner: bool,
    /// Web `rel.miastaPartnera ?? []`.
    pub miasta_partnera: &'a [MiastoWycena],
}

/// Wejście globalne `decideAIDiplomacy` używane przez blok N1a/N1b.
#[derive(Debug, Clone, Copy)]
pub struct CityOfferCtx<'a> {
    /// Web `inp.myTypCywilizacji` (`None` = brak danych).
    pub my_typ_cywilizacji: Option<&'a str>,
    /// Web `inp.isMinorCivSelf`.
    pub is_minor_civ_self: bool,
    /// Web `inp.agresywnoscRaw`.
    pub agresywnosc_raw: Option<f64>,
    /// Web `inp.ekspansywnosc`.
    pub ekspansywnosc: Option<f64>,
    /// Web `inp.miastaAI ?? []`.
    pub miasta_ai: &'a [MiastoWycena],
}

/// Komenda bloku N1a/N1b (pola jak w `AIDiplomacyCommand`).
#[derive(Debug, Clone, PartialEq)]
pub enum CityOfferCommand {
    /// Web `oferuj_miasto_za_pokoj` (ai.ts:6304).
    OferujMiastoZaPokoj {
        target_id: String,
        powod: String,
        city_id: String,
        city_pn: f64,
        city_weight: f64,
    },
    /// Web `zada_miasto_za_pokoj` (ai.ts:6308).
    ZadaMiastoZaPokoj {
        target_id: String,
        powod: String,
        city_id: String,
        city_pn: f64,
    },
}

/// Blok `decideAIDiplomacy` (ai.ts:6714–6794) dla jednej relacji. `None` = web nie wystawia komendy
/// i przechodzi do priorytetu 1 (trybut). Parametry wojny: `WAR_WEARINESS_PARAMS` i `war_peace_params()`.
pub fn decide_city_offer(
    rel: &CityOfferRel<'_>,
    ctx: &CityOfferCtx<'_>,
) -> Option<CityOfferCommand> {
    let wp = war_peace_params();
    let wwp: &WarWearinessParams = &WAR_WEARINESS_PARAMS;
    let rw = rel.rw;
    // Web: Math.max(0, rel.turnsAtWar ?? 0) tylko w wojnie, inaczej 0.
    let turns_at_war_rel = if rel.stan_wojny {
        js_max(0.0, rel.turns_at_war.unwrap_or(0.0))
    } else {
        0.0
    };
    let lost = js_max(0.0, rel.lost_cities_in_war.unwrap_or(0.0));
    let profile = resolve_war_peace_profile(ctx.my_typ_cywilizacji, wp);
    let peace_time_ok = turns_at_war_rel >= profile.min_tur_wojny;

    let cs_blocks_cession = ctx.is_minor_civ_self || rel.is_minor_civ_partner;
    let feels_stronger = rel.stan_wojny
        && is_feeling_stronger(
            &PeaceAiGateInput {
                rw,
                turns_at_war: turns_at_war_rel,
                lost_cities_in_war: lost,
            },
            wp,
        );

    // Zmęczenie wojną i desperacja przegrywającego (ai.ts:6729–6744).
    let weary_level = if rel.stan_wojny {
        let lost_total = js_max(0.0, rel.lost_cities_in_war.unwrap_or(0.0))
            + js_max(0.0, rel.zdobyte_miasta_partnera.unwrap_or(0.0));
        war_weariness_level(
            turns_at_war_rel,
            lost_total,
            rel.turns_since_city_change,
            wwp,
        )
    } else {
        0.0
    };
    let weary_despair = if rel.stan_wojny && is_war_weary(weary_level, wwp) {
        loser_despair(weary_level, rw, lost, wwp)
    } else {
        0.0
    };
    let weary_stage = despair_stage(weary_despair, wwp);
    let weary_city_bonus = if weary_stage >= 2 {
        CZLOWIEK_RW_PROG_BONUS_MAX * weary_despair
    } else {
        0.0
    };
    let weary_offer_mult = if weary_stage >= 2 {
        offer_multiplier(weary_stage, 0.0, wwp)
    } else {
        1.0
    };

    let eks = ctx.ekspansywnosc;
    let common_gate = rel.stan_wojny && rel.partner_id == "0" && peace_time_ok;

    // N1a: AI oddaje miasto zamiast trybutu.
    if common_gate
        && !cs_blocks_cession
        && !feels_stronger
        && rw <= ai_miasto_przekaz_rw_prog(ctx.agresywnosc_raw) + weary_city_bonus
    {
        let weary_min_miast = if weary_despair > 0.0 {
            Some(CZLOWIEK_MIN_MIAST_AI)
        } else {
            None
        };
        let pick = pick_miasto_do_oddania(
            ctx.miasta_ai,
            eks,
            PickOddaniaOpcje {
                min_miast: weary_min_miast,
                cena_pn: Some(AI_MIASTO_CENA_POKOJU_PN * weary_offer_mult),
            },
        )
        .or_else(|| {
            pick_miasto_do_oddania(
                ctx.miasta_ai,
                eks,
                PickOddaniaOpcje {
                    min_miast: weary_min_miast,
                    cena_pn: None,
                },
            )
        });
        if let Some(p) = pick {
            return Some(CityOfferCommand::OferujMiastoZaPokoj {
                target_id: rel.partner_id.to_string(),
                powod: format!(
                    "krytyczna slabosc w wojnie (respektWzgledny={}): oddajemy miasto {} ({} PW) za pokoj",
                    js_to_fixed2(rw),
                    p.city_id,
                    p.city_pn
                ),
                city_id: p.city_id.clone(),
                city_pn: p.city_pn,
                city_weight: ai_miasto_waga_oddawanego(eks),
            });
        }
    }

    // N1b: AI żąda miasta gracza (kontroferta pokoju).
    if common_gate
        && rw >= AI_MIASTO_ZADANIE_RW
        && (turns_at_war_rel >= AI_MIASTO_ZADANIE_TURY_WOJNY
            || rel.zdobyte_miasta_partnera.unwrap_or(0.0) > 0.0)
    {
        if let Some(p) = pick_miasto_do_zadania(rel.miasta_partnera) {
            return Some(CityOfferCommand::ZadaMiastoZaPokoj {
                target_id: rel.partner_id.to_string(),
                powod: format!(
                    "silni w wojnie (respektWzgledny={}, tury wojny={}): zadamy miasta {} ({} PW) za pokoj",
                    js_to_fixed2(rw),
                    turns_at_war_rel,
                    p.city_id,
                    p.city_pn
                ),
                city_id: p.city_id.clone(),
                city_pn: p.city_pn,
            });
        }
    }

    None
}
