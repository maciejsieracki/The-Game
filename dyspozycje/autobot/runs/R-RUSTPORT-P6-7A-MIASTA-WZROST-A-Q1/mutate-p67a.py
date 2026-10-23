#!/usr/bin/env python3
"""Mutacje P6.7A: kazda zmienia JEDEN fragment kodu Rust / tabeli JSON, uruchamia testy p6_7a_*,
po KAZDEJ mutacji przywraca plik i sprawdza czystosc drzewa (git diff nie zawiera sladu mutacji).
Oczekiwanie: test CZERWONY (mutant wykryty). Sekwencyjnie, z timeoutem na mutant.
Uzycie (z rust-port/engine, z CARGO_TARGET_DIR):  python3 -I mutate-p67a.py [fragment-nazwy ...]
Tryb MUT_CHECK=1 tylko sprawdza, czy kazdy fragment wystepuje dokladnie raz.
Zmienne: MUT_SKIP / MUT_END (zakres indeksow), MUT_TIMEOUT (s, domyslnie 900).
"""
import hashlib
import os
import signal
import subprocess
import sys

signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))

CG = "src/domain/city_growth.rs"
P = "data/derived/wzrost-ludnosci-params.json"
D = "data/derived/era-diakrytyki.json"
R = "data/derived/racje.json"

M = [
    # --- population-growth-v85.ts: skala, racje ---
    ("g: clamp - floor zamiast round", CG, "js_math_round(clamped / wyzywienie_step()) * wyzywienie_step()", "(clamped / wyzywienie_step()).floor() * wyzywienie_step()", None),
    ("g: clamp - zamienione granice", CG, "let clamped = js_min(wyzywienie_max(), js_max(wyzywienie_min(), n));", "let clamped = js_max(wyzywienie_max(), js_min(wyzywienie_min(), n));", None),
    ("g: legacy - negacja", CG, "                if old == w.stary {", "                if old != w.stary {", None),
    ("g: procent - domyslny", CG, "                None => default_poziom_racji(),", "                None => wyzywienie_min(),", None),
    ("g: poziom miasta - bez clamp", CG, "                Some(p) => clamp_poziom_racji(p),\n                None => migrate_procent", "                Some(p) => p,\n                None => migrate_procent", None),
    ("g: wzrost % - porownanie poziomu", CG, "                if w.poziom == key {", "                if w.poziom >= key {", None),
    ("g: etykieta - bez przecinka", CG, "js_to_fixed(v, 1).replacen('.', \",\", 1)", "js_to_fixed(v, 1)", None),
    ("g: koszt racji - bez Spichlerza", CG, "spichlerz_state.map_or(1.0, spichlerz_ration_food_cost_multiplier)", "spichlerz_state.map_or(1.0, |_| 1.0)", None),
    ("g: koszt racji - ujemna populacja", CG, "let base = js_max(0.0, population) * ration_food_cost_per_pop(level);", "let base = population * ration_food_cost_per_pop(level);", None),
    ("g: koszt racji - wiersz tabeli", CG, ".map_or(f64::NAN, |r| f64::from(r.zywnosc_na_mieszkanca))", ".map_or(0.0, |r| f64::from(r.zywnosc_na_mieszkanca))", None),
    ("g: wzrost - male miasto bez max", CG, "let male_miasto = js_max(0.0, s.male_miasto_prog - input.population);", "let male_miasto = s.male_miasto_prog - input.population;", None),
    ("g: wzrost - zdrowie bez floor", CG, "let zdrowie_bazowe = (js_max(0.0, input.zdrowie) / s.zdrowie_na_punkt).floor();", "let zdrowie_bazowe = js_max(0.0, input.zdrowie) / s.zdrowie_na_punkt;", None),
    ("g: wzrost - szczescie ceil", CG, "let szczescie = (js_max(0.0, input.szczescie_netto) / s.szczescie_na_punkt).floor();", "let szczescie = (js_max(0.0, input.szczescie_netto) / s.szczescie_na_punkt).ceil();", None),
    ("g: wzrost - cywilizacja floor", CG, "let cywilizacja = js_math_round(civ_raw * civ_difficulty_mult * s.cywilizacja_skala);", "let cywilizacja = (civ_raw * civ_difficulty_mult * s.cywilizacja_skala).floor();", None),
    ("g: wzrost - bez zaopatrzenia w sumie", CG, "                racje + male_miasto + spichlerz + zdrowie + szczescie + cywilizacja + zaopatrzenie;", "                racje + male_miasto + spichlerz + zdrowie + szczescie + cywilizacja;", None),
    ("g: wzrost - mnoznik zdrowia macierzy", CG, "let zdrowie = zdrowie_bazowe * population_matrix.health_growth_multiplier;", "let zdrowie = zdrowie_bazowe;", None),
    ("g: macierz - glod bez max", CG, "hunger_loss_multiplier: js_max(0.0, 1.0 + finite_or_zero(hunger_proc)),", "hunger_loss_multiplier: 1.0 + finite_or_zero(hunger_proc),", None),
    ("g: macierz - brak civ", CG, "                return PopulationMatrixResolved {\n                    hunger_loss_multiplier: 1.0,", "                return PopulationMatrixResolved {\n                    hunger_loss_multiplier: 2.0,", None),
    ("g: trudnosc - domyslna", CG, "civ_matrix_growth_difficulty_mult(d.unwrap_or_default())", "civ_matrix_growth_difficulty_mult(d.unwrap_or(GameDifficulty::Hard))", None),
    ("g: ulamkowy - dodatni limit", CG, "                if growth_pct > 0.0 && pop < pop_cap {", "                if growth_pct > 0.0 && pop <= pop_cap {", None),
    ("g: ulamkowy - petla wzrostu", CG, "                    while frac >= 1.0 && pop < pop_cap {", "                    while frac > 1.0 && pop < pop_cap {", None),
    ("g: ulamkowy - minimalna populacja", CG, "                } else if growth_pct < 0.0 && pop > 1.0 {", "                } else if growth_pct < 0.0 && pop > 0.0 {", None),
    ("g: ulamkowy - przyrost", CG, "frac += pop * growth_pct / hundred;", "frac += growth_pct / hundred;", None),
    ("g: ulamkowy - ubytek", CG, "frac -= pop * (-growth_pct) / hundred;", "frac -= (-growth_pct) / hundred;", None),
    ("g: ulamkowy - tylko nakarmione", CG, "            if fed && growth_pct != 0.0 && pop > 0.0 {", "            if growth_pct != 0.0 && pop > 0.0 {", None),
    ("g: cap - delta macierzy", CG, "            building_cap + safe_delta,", "            building_cap + matrix_delta,", None),
    ("g: cap - akwedukt", CG, "            params.akwedukt_max_ludnosci\n        } else if ma_spichlerz {", "            params.spichlerz_prog_ludnosci\n        } else if ma_spichlerz {", None),
    ("g: cap - spichlerz", CG, "            params.spichlerz_prog_ludnosci\n        } else {\n            params.akwedukt_prog_ludnosci", "            params.akwedukt_prog_ludnosci\n        } else {\n            params.akwedukt_prog_ludnosci", None),
    ("g: cap - delta spoza listy", CG, "        let safe_delta = if delta_allowed(matrix_delta) {\n            matrix_delta", "        let safe_delta = if true {\n            matrix_delta", None),
    ("g: cap - macierz civ", CG, "        if delta_allowed(value) {\n            value\n        } else {\n            0.0\n        }\n    }\n\n    // ====", "        value\n    }\n\n    // ====", None),
    ("g: przyrost slotow - cap", CG, "            if growth_pct > 0.0 && at_pop_cap {\n                return 0.0;", "            if growth_pct > 0.0 && !at_pop_cap {\n                return 0.0;", None),
    ("g: tury do obywatela - frac>=1", CG, "            if frac >= 1.0 {\n                return Some(0.0);", "            if frac > 1.0 {\n                return Some(0.0);", None),
    ("g: tury do obywatela - ceil", CG, "Some(((1.0 - frac) / gain_per_turn).ceil())", "Some(((1.0 - frac) / gain_per_turn).floor())", None),
    ("g: glod - tury po ubytku", CG, "                tury_bez_doplaty: if ubytek { 0.0 } else { next_tury },", "                tury_bez_doplaty: next_tury,", None),
    ("g: glod - minimalna populacja", CG, "            while debt >= 1.0 && pop > 1.0 {", "            while debt >= 1.0 && pop > 0.0 {", None),
    ("g: glod - nakarmione zeruje tury", CG, "                    nowa_ludnosc: population,\n                    tury_bez_doplaty: 0.0,", "                    nowa_ludnosc: population,\n                    tury_bez_doplaty: 1.0,", None),
    ("g: glod - dlug", CG, "            debt += if hunger_loss_multiplier.is_finite() {\n                js_max(0.0, hunger_loss_multiplier)", "            debt += if hunger_loss_multiplier.is_finite() {\n                hunger_loss_multiplier", None),
    ("g: ensure - flaga migracji", CG, "            if !c.ration_migrated_v114.unwrap_or(false) {", "            if c.ration_migrated_v114.unwrap_or(false) {", None),
    ("g: ensure - zakres batonow", CG, "(Some(p), _) if js_is_integer(p) && p >= lo && p <= hi => {", "(Some(p), _) if js_is_integer(p) && p > lo && p <= hi => {", None),
    ("g: ensure - domyslny poziom", CG, "                None => c.poziom_racji = Some(default_poziom_racji()),", "                None => c.poziom_racji = Some(wyzywienie_min()),", None),
    ("g: ensure - bufor glodu", CG, "            if gc.hunger_loss_ulamkowy.is_none() {\n                gc.hunger_loss_ulamkowy = Some(0.0);", "            if gc.hunger_loss_ulamkowy.is_none() {\n                gc.hunger_loss_ulamkowy = Some(1.0);", None),
    ("g: build - sekcja", CG, "                Some(v) if !v.is_null() => v,\n                _ => raw,\n            }\n        }\n\n        /// Web `buildRationParams`", "                Some(_) => raw,\n                _ => raw,\n            }\n        }\n\n        /// Web `buildRationParams`", None),
    ("g: build - tylko skonczone", CG, "                Some(v) if v.is_finite() => v,\n                _ => fallback,", "                Some(v) => v,\n                _ => fallback,", None),
    # --- tempo, szczescie, r-stawki, era ---
    ("t: tempo - round", CG, "                js_math_round(bazowy_prog * mnoznik),", "                (bazowy_prog * mnoznik).floor(),", None),
    ("t: tempo - klucz", CG, "                    Self::Wolny => t.wolny,", "                    Self::Wolny => t.normalny,", None),
    ("t: szczescie - NaN", CG, "            if wealth_zadowolenie.is_finite() {", "            if !wealth_zadowolenie.is_nan() {", None),
    ("t: stawki - zero", CG, "            if !base.is_finite() || base <= 0.0 {", "            if !base.is_finite() || base < 0.0 {", None),
    ("t: stawki - rekord >0", CG, "                    if v.is_finite() && *v > 0.0 {", "                    if v.is_finite() && *v >= 0.0 {", None),
    ("t: stawki - cudo", CG, "            if !koszt_budowy.is_finite() || koszt_budowy <= 0.0 {", "            if !koszt_budowy.is_finite() || koszt_budowy < 0.0 {", None),
    ("t: stawki - min 1", CG, "            js_max(\n                wzrost_ludnosci_params().r_stawki.min_wartosc,", "            js_min(\n                wzrost_ludnosci_params().r_stawki.min_wartosc,", None),
    ("t: era - pusty napis", CG, "            let Some(e) = epoka.filter(|e| !e.is_empty()) else {", "            let Some(e) = epoka else {", None),
    ("t: era - bez trim", CG, "js_trim(&nfd_without_combining(s)).to_lowercase()", "nfd_without_combining(s).to_lowercase()", None),
    ("t: era - hangul T", CG, "                    if t != HANGUL_T_BASE {", "                    if t == HANGUL_T_BASE {", None),
    ("t: era - hangul V", CG, "let v = HANGUL_V_BASE + (index % HANGUL_N_COUNT) / HANGUL_T_COUNT;", "let v = HANGUL_V_BASE + (index % HANGUL_N_COUNT) / HANGUL_V_COUNT;", None),
    ("t: era - fala2", CG, "                .fala2_extra\n                .contains(&era)", "                .fala2_extra\n                .contains(&String::new())", None),
    ("t: era - alias", CG, "                if alias.warianty.contains(&n) {", "                if alias.warianty.contains(&String::new()) {", None),
    ("t: era - tabela", CG, "                } else if let Some(rep) = table.get(&cp) {\n                    out.push_str(rep);", "                } else if let Some(_rep) = table.get(&cp) {\n                    out.push(ch);", None),
    ("t: magazyn - wykladnik", CG, "t.podstawa.powf(e - t.epoka_min)", "t.podstawa.powf(e)", None),
    ("t: spichlerz - tier II wzrost", CG, "        if state.ma_spichlerz_ii_pop {\n            t.wzrost_proc_tier_ii", "        if state.ma_spichlerz_ii_pop {\n            t.wzrost_proc_tier_i", None),
    ("t: spichlerz - tier II koszt", CG, "        if state.ma_spichlerz_ii_pop {\n            t.mnoznik_kosztu_racji_tier_ii", "        if state.ma_spichlerz_ii_pop {\n            t.mnoznik_kosztu_racji_tier_i", None),
    ("t: spichlerz - budynek", CG, "built_ids.iter().any(|b| *b == t.id_i || *b == t.id_ii)", "built_ids.iter().any(|b| *b == t.id_i && *b == t.id_ii)", None),
    # --- empire-food.ts ---
    ("e: recompute - ostatnie id", CG, "            let Some(gc) = cities.iter().rev().find(|c| c.city.id == tick.city_id) else {", "            let Some(gc) = cities.iter().find(|c| c.city.id == tick.city_id) else {", None),
    ("e: recompute - netto", CG, "            tick.zywnosc_netto = bilans;", "            tick.zywnosc_netto = tick.zywnosc_netto;", None),
    ("e: recompute - poziom", CG, "            tick.poziom_racji = Some(poziom);", "            tick.poziom_racji = None;", None),
    ("e: recompute - spichlerz tika", CG, "                    ma_spichlerz_pop: tick.ma_spichlerz.unwrap_or(false),\n                    ma_spichlerz_ii_pop: tick.ma_spichlerz_ii.unwrap_or(false),\n                });\n            let produkcja", "                    ma_spichlerz_pop: false,\n                    ma_spichlerz_ii_pop: tick.ma_spichlerz_ii.unwrap_or(false),\n                });\n            let produkcja", None),
    ("e: advance - bilans >= 0", CG, "                    if bilans >= 0.0 {\n                        central += bilans;", "                    if bilans > 0.0 {\n                        central += bilans;", None),
    ("e: advance - pokrycie deficytu", CG, "                    let fed = covered >= *need;", "                    let fed = covered > *need;", None),
    ("e: advance - cap", CG, "                if central > max_cap {\n                    central = max_cap;\n                }", "", None),
    ("e: advance - glod wojska", CG, "                let glod_wojska = central < 0.0;", "                let glod_wojska = central <= 0.0;", None),
    ("e: advance - karencja", CG, "glod_wojska_atrycja_aktywna: tury_po >= params.glod_wojska_karencja_tur,", "glod_wojska_atrycja_aktywna: tury_po > params.glod_wojska_karencja_tur,", None),
    ("e: advance - barbarzyncy", CG, "                if is_barbarian(owner_id) {\n                    continue;\n                }\n\n                if !states.has", "                if !states.has", None),
    ("e: advance - wlasciciel tika", CG, "                for tick in &econ.per_city {\n                    if tick.owner_id != owner_id || tick.oblegany {", "                for tick in &econ.per_city {\n                    if tick.oblegany {", None),
    ("e: advance - oblegany", CG, "                for tick in &econ.per_city {\n                    if tick.owner_id != owner_id || tick.oblegany {", "                for tick in &econ.per_city {\n                    if tick.owner_id != owner_id {", None),
    ("e: advance - kolejnosc deficytow", CG, "                for (city_id, need) in &deficits {", "                for (city_id, need) in deficits.iter().rev() {", None),
    ("e: advance - wlasciciele bez duplikatow", CG, "                if !owner_ids.contains(&id) {", "                if true {", None),
    ("e: advance - era", CG, "let owner_era = resolve_owner_era.map_or(1.0, |f| f(owner_id));", "let owner_era = 1.0;", None),
    ("e: advance - tury ujemne", CG, "                let tury_po = if glod_wojska { tury_przed + 1.0 } else { 0.0 };", "                let tury_po = if glod_wojska { 1.0 } else { 0.0 };", None),
    ("e: advance - stan nowego wlasciciela", CG, "                if !states.has(owner_id) {\n                    states.set(owner_id, fresh_empire_food_state());\n                }", "", None),
    ("e: cap - tier II", CG, "                    spichlerz_cap += t.cap_imperium_tier_ii * spichlerz_mult;", "                    spichlerz_cap += t.cap_imperium_tier_i * spichlerz_mult;", None),
    ("e: cap - skladnik spichlerza", CG, "magazyn_count\n                + spichlerz_cap\n", "magazyn_count\n", None),
    ("e: cap - epoka", CG, "            let spichlerz_mult = magazyn_era_multiplier(era);", "            let spichlerz_mult = magazyn_era_multiplier(1.0);", None),
    ("e: magazyny - dedup tikow", CG, "                if !seen.insert(tick.city_id.clone()) {", "                if { seen.insert(tick.city_id.clone()); false } {", None),
    ("e: akcesor - atrycja", CG, "                    .is_some_and(|t| t.glod_wojska_atrycja_aktywna)", "                    .is_some_and(|t| t.glod_wojska)", None),
    ("e: akcesor - odliczanie", CG, "Some(js_max(1.0, karencja_tur - t.tury_ujemnych_zapasow_po))", "Some(karencja_tur - t.tury_ujemnych_zapasow_po)", None),
    ("e: akcesor - glodny barbarzynca", CG, "            pub fn is_army_hungry(&self, owner_id: i64) -> bool {\n                if is_barbarian(owner_id) {\n                    return false;\n                }", "            pub fn is_army_hungry(&self, owner_id: i64) -> bool {", None),
    ("e: akcesor - clear", CG, "                self.max_cap_by_owner = BTreeMap::new();", "                let _ = &self.max_cap_by_owner;", None),
    ("e: allFed - epsilon", CG, "                if covered < need - FOOD_EPSILON {\n                    return false;", "                if covered < need - FOOD_EPSILON {\n                    return true;", None),
    ("e: solvent - armia", CG, "compute_empire_city_food_nadwyzka(per_city, owner_id) + zapasy_przed - koszt_armii", "compute_empire_city_food_nadwyzka(per_city, owner_id) + zapasy_przed", None),
    ("e: cel - armia (flow)", CG, "return compute_empire_city_food_nadwyzka(per_city, owner_id) - koszt_armii >= 0.0;", "return compute_empire_city_food_nadwyzka(per_city, owner_id) >= 0.0;", None),
    ("e: pula - pokrycie", CG, "                let covered = js_min(need, js_max(0.0, central));\n                central -= covered;\n            }\n            central", "                let covered = js_min(need, central);\n                central -= covered;\n            }\n            central", None),
    ("e: auto - tylko zarzadzane", CG, "                    !only_auto_managed\n                        || is_city_auto_wyzywienie_enabled", "                    !only_auto_managed\n                        && is_city_auto_wyzywienie_enabled", None),
    ("e: auto - czlowiek", CG, "            if !human_owner_ids.contains(&city.owner_id) {\n                return true;", "            if human_owner_ids.contains(&city.owner_id) {\n                return true;", None),
    ("e: auto - force", CG, "            if force_auto {\n                return true;", "            if force_auto {\n                return false;", None),
    ("e: limit - najnizszy nieujemny", CG, ".find(|l| ration_growth_percent(*l) >= 0.0)", ".find(|l| ration_growth_percent(*l) > 0.0)", None),
    ("e: plan - poziom na limicie", CG, "let capped_level_for = |level: PoziomRacji| js_min(na_limicie, level);", "let capped_level_for = |level: PoziomRacji| js_max(na_limicie, level);", None),
    ("e: plan - miasto na limicie", CG, "                    Some(cap) if cities[i].city.population >= cap => at_pop_cap.push(i),", "                    Some(cap) if cities[i].city.population > cap => at_pop_cap.push(i),", None),
    ("e: plan - skan malejacy", CG, "            for i in (0..levels.len()).rev() {", "            for i in 0..levels.len() {", None),
    ("e: plan - nie przywraca poziomow", CG, "                    .expect(\"poziom poczatkowy\");\n                set_level(&mut cities[i], level);\n            }\n            recompute_city_food_balances_in_econ(\n", "                    .expect(\"poziom poczatkowy\");\n                let _ = level;\n            }\n            recompute_city_food_balances_in_econ(\n", None),
    ("e: plan - bez przeliczenia na koniec", CG, "            }\n            recompute_city_food_balances_in_econ(\n                &mut econ.per_city,\n                cities,\n                opts.spichlerz_by_city,\n            );\n\n            EqualGrowthRationPlan {", "            }\n\n            EqualGrowthRationPlan {", None),
    ("e: plan - brak minimum", CG, "                apply_candidate(wyzywienie_min(), cities, econ);\n                all_fed", "                all_fed", None),
    ("e: plan - ensure", CG, "            for &i in &managed {\n                ensure_city_ration_defaults(&mut cities[i]);\n                original_levels.insert(", "            for &i in &managed {\n                original_levels.insert(", None),
    ("e: zmiany - epsilon", CG, "                if (new_level - old_level).abs() < FOOD_EPSILON {", "                if false {", None),
    ("e: zmiany - przeliczenie", CG, "            if !changes.is_empty() {\n                recompute_city_food_balances_in_econ(&mut econ.per_city, cities, spichlerz_by_city);\n            }", "", None),
    ("e: balance - warunek wczesnego wyjscia", CG, "            if target_already_met && all_fed_already {", "            if target_already_met || all_fed_already {", None),
    ("e: raise - nadwyzka gracza", CG, "                if nadwyzka <= 0.0 {\n                    return AutoRationAdjustResult::default();\n                }\n            } else if", "                if nadwyzka < 0.0 {\n                    return AutoRationAdjustResult::default();\n                }\n            } else if", None),
    ("e: raise - AI zapasy", CG, "            } else if nadwyzka <= 0.0 && opts.zapasy_przed <= 0.0 {", "            } else if nadwyzka <= 0.0 || opts.zapasy_przed <= 0.0 {", None),
    ("e: raise - wypłacalność", CG, "            if !is_empire_city_food_solvent(\n                opts.zapasy_przed,", "            if is_empire_city_food_solvent(\n                opts.zapasy_przed,", None),
    ("e: raise - flow dla gracza", CG, "                    require_flow_balance: opts.require_production_surplus,", "                    require_flow_balance: false,", None),
    ("e: maxSafe - gracz", CG, "let require_flow_balance = opts.human_owner_ids.contains(&opts.owner_id);", "let require_flow_balance = false;", None),
    ("e: maxSafe - warunek", CG, "                if pool >= 0.0 && all_fed && target_met {", "                if pool >= 0.0 && (all_fed || target_met) {", None),
    ("e: maxSafe - inny wlasciciel", CG, "            if cities[city_index].city.owner_id != opts.owner_id {\n                return wyzywienie_min();", "            if cities[city_index].city.owner_id == opts.owner_id {\n                return wyzywienie_min();", None),
    ("e: maxSafe - kontrfaktyk min", CG, "                        js_min(\n                            others_original", "                        js_max(\n                            others_original", None),
    ("e: maxSafe - przywrocenie", CG, "            cities[city_index].city.poziom_racji = Some(original_level);\n            for &i in &others {", "            for &i in &others {", None),
    # --- applyPostCentralPopulationGrowth ---
    ("p: akwedukt", CG, ".any(|b| *b == wzrost_ludnosci_params().spichlerz.id_akwedukt);", ".any(|_| false);", None),
    ("p: spichlerz budynek", CG, "let ma_spichlerz_building = city_has_spichlerz_building(built_ids);", "let ma_spichlerz_building = false;", None),
    ("p: glod nie zmienia populacji", CG, "                    cities[city_index].city.population = hunger.nowa_ludnosc;", "                    cities[city_index].city.population = before;", None),
    ("p: wzrost tylko nakarmione", CG, "                        if fed { breakdown.total } else { 0.0 },", "                        breakdown.total,", None),
    ("p: ubytek", CG, "tick.ubytek = Some(hunger.ubytek || growth.ubytek);", "tick.ubytek = Some(growth.ubytek);", None),
    ("p: magazyn po turze", CG, "tick.magazyn_po_turze = Some(growth.wzrost_ulamkowy);", "tick.magazyn_po_turze = Some(0.0);", None),
    ("p: zmiana populacji", CG, "                    if after != before {", "                    if true {", None),
    ("p: era wlasciciela", CG, "                            .unwrap_or(1.0);\n                        let (_regen, max_mult)", "                            .unwrap_or(2.0);\n                        let (_regen, max_mult)", None),
    ("p: manpower - poprzednia populacja", CG, "                            Some(before),\n                            max_mult,", "                            None,\n                            max_mult,", None),
    ("p: licznik wzrostu", CG, "                        econ.growth += 1.0;", "                        econ.growth += 2.0;", None),
    ("p: licznik glodu", CG, "                    if hunger.ubytek || growth.ubytek {\n                        econ.starved += 1.0;", "                    if growth.ubytek {\n                        econ.starved += 1.0;", None),
    ("p: oblegane miasto", CG, "                    if econ.per_city[tick_index].oblegany {\n                        continue;\n                    }", "", None),
    ("p: wykluczone heksy", CG, "opts.exclude_hex_keys_by_city.and_then(|m| m.get(&city_id)),", "None,", None),
    ("p: domyslnie nienakarmione", CG, "                        .copied()\n                        .unwrap_or(false);\n                    let tick_snapshot", "                        .copied()\n                        .unwrap_or(true);\n                    let tick_snapshot", None),
    ("p: callback zmiany", CG, "                        hooks.on_city_population_changed(&city_id);", "", None),
    ("p: macierz wlasciciela", CG, "                        .unwrap_or_else(|| resolve_population_matrix_for_civ(owner_civ));", "                        .unwrap_or_else(|| resolve_population_matrix_for_civ(None));", None),
    ("p: zaopatrzenie obywateli", CG, "                        citizen_resource_growth_pct: Some(citizen_growth_pct),", "                        citizen_resource_growth_pct: Some(0.0),", None),
    ("p: szczescie", CG, "                        szczescie_netto: happiness,", "                        szczescie_netto: 0.0,", None),
    ("p: spichlerz z tika", CG, "                            ma_spichlerz_pop: tick_snapshot.ma_spichlerz.unwrap_or(false),", "                            ma_spichlerz_pop: false,", None),
    ("p: populacja do rebalansu", CG, "                            before,\n                            after,\n                            opts.exclude", "                            after,\n                            before,\n                            opts.exclude", None),
    # --- tabele JSON ---
    ("j: wzrost % poziom 6", P, '"poziom": 6,\n        "proc": 7', '"poziom": 6,\n        "proc": 8', None),
    ("j: wzrost % poziom 1.5", P, '"poziom": 1.5,\n        "proc": 0', '"poziom": 1.5,\n        "proc": -1', None),
    ("j: male miasto", P, '"male_miasto_prog": 6', '"male_miasto_prog": 5', None),
    ("j: zdrowie", P, '"zdrowie_na_punkt": 10', '"zdrowie_na_punkt": 9', None),
    ("j: szczescie", P, '"szczescie_na_punkt": 10', '"szczescie_na_punkt": 9', None),
    ("j: cywilizacja skala", P, '"cywilizacja_skala": 100', '"cywilizacja_skala": 99', None),
    ("j: trudnosc hard", P, '"hard": 1.5', '"hard": 1.25', None),
    ("j: limit twardy", P, '"twardy_max": 14', '"twardy_max": 15', None),
    ("j: spichlerz wzrost II", P, '"wzrost_proc_tier_ii": 2', '"wzrost_proc_tier_ii": 3', None),
    ("j: spichlerz koszt I", P, '"mnoznik_kosztu_racji_tier_i": 0.75', '"mnoznik_kosztu_racji_tier_i": 0.8', None),
    ("j: spichlerz cap II", P, '"cap_imperium_tier_ii": 1500', '"cap_imperium_tier_ii": 1400', None),
    ("j: magazyn podstawa", P, '"podstawa": 2,', '"podstawa": 3,', None),
    ("j: tempo normalny", P, '"normalny": 2,', '"normalny": 3,', None),
    ("j: tempo prog min", P, '"prog_min": 1', '"prog_min": 2', None),
    ("j: stawki fala2", P, '"fala2_mult": 2', '"fala2_mult": 3', None),
    ("j: stawki koszt", P, '"koszt_mult": 2', '"koszt_mult": 3', None),
    ("j: empire baza", P, '"centralny_cap_baza": 1000', '"centralny_cap_baza": 999', None),
    ("j: empire hp", P, '"glod_hp_frac": 0.08', '"glod_hp_frac": 0.09', None),
    ("j: migracja legacy", P, '"stary": 2,\n        "nowy": 4', '"stary": 2,\n        "nowy": 5', None),
    ("j: racje domyslne", P, '"zywnosc": [\n      2,\n      4,\n      6\n    ]', '"zywnosc": [\n      2,\n      4,\n      7\n    ]', None),
    ("j: epoka domyslna", P, '"domyslna": "kamien"', '"domyslna": "braz"', None),
    ("j: epoka fala2", P, '"fala2_extra": [\n      "braz",\n      "zelazo"\n    ]', '"fala2_extra": [\n      "braz"\n    ]', None),
    ("j: diakrytyki n z kreska", D, '[324,"n"]', '[324,"x"]', None),
    ("j: racje poziom 4", R, '"poziom_racji": 4,\n      "zywnosc_na_mieszkanca": 8', '"poziom_racji": 4,\n      "zywnosc_na_mieszkanca": 9', None),
]

ALL_TESTS = ["p6_7a_tables", "p6_7a_growth", "p6_7a_tempo", "p6_7a_empire", "p6_7a_post_central"]


def tests_for(name, path):
    """Binaria testowe pokrywajace mutowany fragment (kod: wg prefiksu nazwy; tabele JSON: wszystkie)."""
    if path.endswith(".json"):
        return ALL_TESTS
    return {
        "g": ["p6_7a_growth", "p6_7a_empire", "p6_7a_post_central", "p6_7a_tables"],
        "t": ["p6_7a_tempo", "p6_7a_growth", "p6_7a_empire"],
        "e": ["p6_7a_empire", "p6_7a_post_central"],
        "p": ["p6_7a_post_central"],
    }[name.split(":")[0]]


# MUT_LIST="0,3,5": tylko mutanty o tych indeksach (po przyciaciu listy do ~100 reprezentatywnych)
LIST = {int(x) for x in os.environ.get("MUT_LIST", "").split(",") if x.strip()}
ONLY = sys.argv[1:]
SKIP = int(os.environ.get("MUT_SKIP", "0"))
END = int(os.environ.get("MUT_END", str(10**9)))
TIMEOUT = int(os.environ.get("MUT_TIMEOUT", "900"))


def digest(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def tree_clean(path, before):
    """Plik po przywroceniu identyczny co przed mutacja (SHA-256) i git nie widzi zmiany wzgledem stanu sprzed serii."""
    return digest(path) == before


survived = []
ran = 0
for idx, (name, path, old, new, nth) in enumerate(M):
    if idx < SKIP or idx >= END:
        continue
    if LIST and idx not in LIST:
        continue
    if ONLY and not any(o in name for o in ONLY):
        continue
    ran += 1
    src = open(path, encoding="utf-8").read()
    before = digest(path)
    cnt = src.count(old)
    if os.environ.get("MUT_CHECK"):
        ok = cnt == 1
        print(("OK    " if ok else "BRAK  ") + f"{cnt}x: [{idx}] {name}")
        if not ok:
            survived.append(name)
        continue
    if cnt != 1:
        print(f"BLAD: fragment nie wystepuje dokladnie raz: [{idx}] {name} ({cnt})")
        sys.exit(2)
    mutated = src.replace(old, new)
    open(path, "w", encoding="utf-8").write(mutated)
    try:
        args = ["cargo", "test", "--no-fail-fast"]
        for t in tests_for(name, path):
            args += ["--test", t]
        try:
            r = subprocess.run(args, capture_output=True, text=True, timeout=TIMEOUT)
            out = r.stdout + r.stderr
            rc = r.returncode
        except subprocess.TimeoutExpired:
            out, rc = "TIMEOUT", -1
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if out == "TIMEOUT":
            print(f"TIMEOUT   : [{idx}] {name}")
            survived.append(name + " [timeout]")
        elif rc == 0:
            survived.append(name)
            print(f"PRZEZYL   : [{idx}] {name}")
        elif "error[" in out or ("error:" in out and not failed):
            print(f"KOMPILACJA: [{idx}] {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : [{idx}] {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:3])}")
    finally:
        open(path, "w", encoding="utf-8").write(src)
        clean = tree_clean(path, before)
        print(f"  przywrocono {path}: SHA-256 {'zgodny' if clean else 'NIEZGODNY'}")
        if not clean:
            print("BLAD KRYTYCZNY: plik nie wrocil do stanu sprzed mutacji")
            sys.exit(3)
print(f"mutantow={ran} przezylo/niekompilujace/timeout={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
