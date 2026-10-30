//! P6.8J-P1 (czesc podzialu partii 1): rozpiski Szczescia i Prawa (`computeHappinessBreakdown`,
//! `computeLawBreakdown`) z `society-breakdown.ts` (pin 91dc998a). Wspolne helpery: `super`.

use super::*;

// ---------------------------------------------------------------------------
// Rozpiska Szczescia / Prawa (batch 1)
// ---------------------------------------------------------------------------

/// Web `HappinessBreakdownInput` (`society-breakdown.ts:63`). Pola `?:` = `Option`; liczby
/// wymagane (`population`, `buildingZadowolenie`) to `f64` (NaN dozwolone, jak w webie).
/// Pola @deprecated (ceramika, spichlerz, haKult, swiatynia, amfiteatr, obca religia, podboj)
/// celowo POMINIETE: web je ignoruje (G3/G4/G5), nie wplywaja na wynik.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct HappinessBreakdownInput {
    pub difficulty: Option<Difficulty>,
    pub era: Option<f64>,
    pub population: f64,
    pub building_zadowolenie: f64,
    pub ha_rel: Option<f64>,
    pub own_religion_share: Option<f64>,
    pub ha_wealth: Option<f64>,
    pub ha_cuda: Option<f64>,
    /// `podzialHandlu.procentLuksus` (None = brak podzialu lub pola -> domyslne 20).
    pub podzial_procent_luksus: Option<f64>,
    pub at_war: bool,
    pub own_culture_share: Option<f64>,
    pub stolica_easy_bonus: bool,
    pub citizen_resource_happiness_delta: Option<f64>,
}

/// Web `computeHappinessBreakdown` (G1-G13). Jedyne miejsce, w ktorym powstaja punkty Szczescia.
pub fn compute_happiness_breakdown(
    input: &HappinessBreakdownInput,
    society: Option<&Value>,
) -> HappinessPctBreakdown {
    let diff = input.difficulty.unwrap_or_default();
    let sz_block = sub(society, "szczescie");
    let scale = load_society_scale_params(society, diff);
    let mut lines: Vec<SocietyLine> = Vec::new();
    let pop = js_max(0.0, input.population.floor());
    let era = input.era.unwrap_or(1.0);

    if input.building_zadowolenie != 0.0 {
        lines.push(SocietyLine {
            id: "budynki".into(),
            label: "Budynki (szczęściodajne)".into(),
            value: input.building_zadowolenie,
        });
    }

    // G4: Kultura i Religia proporcjonalnie do udzialu wlasnej, ta sama skala x(epoka).
    let x = kult_relig_scale_for_era(era, &scale);

    let kult_share = match finite_opt(input.own_culture_share) {
        Some(v) => js_min(1.0, js_max(0.0, v)),
        None => 1.0,
    };
    let kult_v = proporcjonalne_szczescie(x, kult_share);
    if js_truthy(kult_v) {
        lines.push(SocietyLine {
            id: "kultura".into(),
            label: udzial_line_label("Kultura", kult_share),
            value: kult_v,
        });
    }

    let rel_share = match finite_opt(input.own_religion_share) {
        Some(v) => js_min(1.0, js_max(0.0, v)),
        None => own_share_from_signal(input.ha_rel),
    };
    let rel_v = proporcjonalne_szczescie(x, rel_share);
    if js_truthy(rel_v) {
        lines.push(SocietyLine {
            id: "religia".into(),
            label: udzial_line_label("Religia", rel_share),
            value: rel_v,
        });
    }

    if let Some(v) = input.ha_wealth.filter(|v| js_truthy(*v)) {
        lines.push(SocietyLine {
            id: "wealth".into(),
            label: "Wealth (pula luksusu)".into(),
            value: v,
        });
    }
    if let Some(v) = input.ha_cuda.filter(|v| js_truthy(*v)) {
        lines.push(SocietyLine {
            id: "cuda".into(),
            label: "Cuda świata".into(),
            value: v,
        });
    }

    // G12: kara zagesczenia usunieta; wielkosc miasta dziala wylacznie przez mianownik.
    let prog_zagesz = pick_society(sz_block, "szczescie_prog_zagęszczenia", diff, 4.0);
    let legacy_male = if pop <= prog_zagesz {
        pick_society(sz_block, "szczescie_male_miasto_bonus", diff, 1.0)
    } else {
        0.0
    };
    let osiedle_v = pick_osiedle_pop_bonus(
        sz_block,
        "szczescie_bonus_osiedle_pop",
        pop,
        diff,
        legacy_male,
    );
    if js_truthy(osiedle_v) {
        lines.push(SocietyLine {
            id: "osiedle".into(),
            label: osiedle_pop_label(pop),
            value: osiedle_v,
        });
    }

    let luks_pct = input
        .podzial_procent_luksus
        .unwrap_or(DEFAULT_PROCENT_LUKSUS);
    let luks_bonus = luksus_happiness_bonus(luks_pct, society, diff);
    if luks_bonus > 0.0 {
        lines.push(SocietyLine {
            id: "niskie_podatki".into(),
            label: format!("Niskie podatki (Zamożność {}%)", js_num_str(luks_pct)),
            value: luks_bonus,
        });
    } else if luks_bonus < 0.0 {
        lines.push(SocietyLine {
            id: "wysokie_podatki".into(),
            label: format!("Wysokie podatki (Zamożność {}%)", js_num_str(luks_pct)),
            value: luks_bonus,
        });
    }

    if input.at_war {
        let v = pick_society(sz_block, "szczescie_kara_wojna", diff, -5.0);
        if js_truthy(v) {
            lines.push(SocietyLine {
                id: "wojna".into(),
                label: "Wojna".into(),
                value: v,
            });
        }
    }
    if input.stolica_easy_bonus {
        let v = pick_society(sz_block, "szczescie_bonus_stolica_easy", diff, 1.0);
        if js_truthy(v) {
            lines.push(SocietyLine {
                id: "stolica_easy".into(),
                label: "Stolica imperium (easy)".into(),
                value: v,
            });
        }
    }
    // G8: suma zaopatrzenia obywateli wstawiana 1:1 (bez mnoznika).
    if let Some(v) = input
        .citizen_resource_happiness_delta
        .filter(|v| js_truthy(*v))
    {
        lines.push(SocietyLine {
            id: "zaopatrzenie_obywateli".into(),
            label: "Zaopatrzenie obywateli (surowce)".into(),
            value: v,
        });
    }

    let netto = lines.iter().fold(0.0, |s, l| s + l.value);
    let sz_max = sz_max_for_city(era, pop, &scale);
    let sz_pct = pct_from_netto(netto, sz_max, scale.sz_pct_cap);

    HappinessPctBreakdown {
        lines,
        netto,
        sz_max,
        sz_pct,
    }
}

/// Web `udzialLineLabel`: `Nazwa (udzial wlasnej N%)`, N = Math.round(udzial·100).
fn udzial_line_label(nazwa: &str, share: f64) -> String {
    format!(
        "{nazwa} (udział własnej {}%)",
        js_num_str(js_round(share * 100.0))
    )
}

/// Web `LawBreakdownInput` (`society-breakdown.ts:132`). `brakGarnizonuKara` i
/// `conquestNoGarrisonPenalty` (@deprecated, martwe) pominiete.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct LawBreakdownInput {
    pub difficulty: Option<Difficulty>,
    pub era: Option<f64>,
    pub population: Option<f64>,
    pub garnizon_count: f64,
    pub has_dom_starszyzny: bool,
    pub has_dwor_zarzadcy: bool,
    pub has_pretorium: bool,
    pub has_sad: bool,
    pub has_trybunal: bool,
    pub has_palac: bool,
    /// `palacTier` 1/2/3; None / inna wartosc = brak tieru (patrz `resolve_palac_tier`).
    pub palac_tier: Option<u8>,
    pub stolica_easy_bonus: bool,
    pub has_garnizon_budynek: bool,
}

/// Web `resolvePalacTier`: `palacTier` ma pierwszenstwo; `hasPalac` bez tieru = tier 1.
fn resolve_palac_tier(input: &LawBreakdownInput) -> u8 {
    match input.palac_tier {
        Some(t @ 1..=3) => t,
        _ if input.has_palac => 1,
        _ => 0,
    }
}

/// Web `computeLawBreakdown`. Kary D5 (brak garnizonu, podboj bez garnizonu) USUNIETE na stale.
pub fn compute_law_breakdown(
    input: &LawBreakdownInput,
    society: Option<&Value>,
) -> LawPctBreakdown {
    let diff = input.difficulty.unwrap_or_default();
    let pr_block = sub(society, "prawo");
    let scale = load_society_scale_params(society, diff);
    let mut lines: Vec<SocietyLine> = Vec::new();
    let era = input.era.unwrap_or(1.0);

    let per_unit = pick_society(pr_block, "prawo_garnizon_per_jednostka", diff, 20.0);
    let cap_units = pick_society(pr_block, "prawo_garnizon_cap_jednostek", diff, 5.0);
    let units = js_max(0.0, input.garnizon_count.floor());
    let effective = js_min(units, cap_units);
    if effective > 0.0 {
        lines.push(SocietyLine {
            id: "garnizon".into(),
            label: format!("Garnizon ({} jedn.)", js_num_str(effective)),
            value: per_unit * effective,
        });
    }

    let fixed: [(bool, &str, &str, f64, &str); 5] = [
        (
            input.has_dom_starszyzny,
            "prawo_dom_starszyzny",
            "dom_starszyzny",
            28.0,
            "Dom Starszyzny",
        ),
        (
            input.has_dwor_zarzadcy,
            "prawo_dwor_zarzadcy",
            "dwor_zarzadcy",
            33.0,
            "Dwór Zarządcy",
        ),
        (
            input.has_pretorium,
            "prawo_pretorium",
            "pretorium",
            2.0,
            "Pretorium",
        ),
        (
            input.has_trybunal,
            "prawo_trybunal",
            "trybunal",
            17.0,
            "Trybunał",
        ),
        (input.has_sad, "prawo_sad", "sad", 2.0, "Sąd"),
    ];
    for (has, key, id, fallback, label) in fixed {
        if has {
            let v = pick_society(pr_block, key, diff, fallback);
            if js_truthy(v) {
                lines.push(SocietyLine {
                    id: id.into(),
                    label: label.into(),
                    value: v,
                });
            }
        }
    }

    let palac_tier = resolve_palac_tier(input);
    if (1..=3).contains(&palac_tier) {
        let (key, fallback, label) = match palac_tier {
            1 => ("prawo_palac", 35.0, "Pałac"),
            2 => ("prawo_palac_ii", 45.0, "Pałac II"),
            _ => ("prawo_palac_iii", 55.0, "Pałac III"),
        };
        let v = pick_society(pr_block, key, diff, fallback);
        if js_truthy(v) {
            lines.push(SocietyLine {
                id: "palac".into(),
                label: label.into(),
                value: v,
            });
        }
    }

    if input.has_garnizon_budynek {
        let v = praw_garnizon_budynek_for_era(era, &scale);
        if js_truthy(v) {
            lines.push(SocietyLine {
                id: "garnizon_budynek".into(),
                label: "Garnizon (budynek)".into(),
                value: v,
            });
        }
    }

    let pop = js_max(0.0, input.population.unwrap_or(0.0).floor());
    let osada_prog = pick_society(pr_block, "prawo_bonus_osada_prog", diff, 4.0);
    let legacy_osada = if pop > 0.0 && pop <= osada_prog {
        pick_society(pr_block, "prawo_bonus_osada", diff, 3.0)
    } else {
        0.0
    };
    let osiedle_v =
        pick_osiedle_pop_bonus(pr_block, "prawo_bonus_osiedle_pop", pop, diff, legacy_osada);
    if js_truthy(osiedle_v) {
        lines.push(SocietyLine {
            id: "osiedle".into(),
            label: osiedle_pop_label(pop),
            value: osiedle_v,
        });
    }
    if input.stolica_easy_bonus {
        let v = pick_society(pr_block, "prawo_bonus_stolica_easy", diff, 1.0);
        if js_truthy(v) {
            lines.push(SocietyLine {
                id: "stolica_easy".into(),
                label: "Stolica imperium (easy)".into(),
                value: v,
            });
        }
    }

    let netto = lines.iter().fold(0.0, |s, l| s + l.value);
    let praw_max = praw_max_for_city(era, pop, &scale);
    let praw_pct = pct_from_netto(js_max(0.0, netto), praw_max, scale.praw_pct_cap);

    LawPctBreakdown {
        lines,
        netto,
        praw_max,
        praw_pct,
    }
}
