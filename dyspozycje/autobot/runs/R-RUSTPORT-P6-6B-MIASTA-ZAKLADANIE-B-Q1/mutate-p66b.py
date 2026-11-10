#!/usr/bin/env python3
"""Mutacje P6.6B: kazda zmienia JEDEN fragment kodu Rust / tabeli JSON, uruchamia testy p6_6b_*,
przywraca plik. Oczekiwanie: test CZERWONY (mutant wykryty). Uzycie (z rust-port/engine, z ustawionym
CARGO_TARGET_DIR):  python3 -I mutate-p66b.py [fragment-nazwy ...]
Krotka: (nazwa, plik, stary_fragment, nowy_fragment, ktore_wystapienie) - ktore_wystapienie=None wymaga
dokladnie jednego wystapienia; liczba n >= 1 oznacza n-te wystapienie (gdy fragment powtarza sie w pliku).
Tryb MUT_CHECK=1 tylko sprawdza, czy kazdy fragment wystepuje oczekiwana liczbe razy.
"""
import os
import signal
import subprocess
import sys

# SIGTERM -> normalne zakonczenie, aby `finally` przywrocilo mutowany plik
signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))

ST = "src/domain/state.rs"
J_CITIES = "data/derived/cities-params.json"
J_DISP = "data/derived/display-names-params.json"

M = [
    # --- display_names ---
    ("disp: strip nie obcina dopisku", ST, "name.strip_suffix(suffix.as_str())\n                .unwrap_or(name)\n                .to_owned()", "name.to_owned()", None),
    ("disp: format - pusta baza zwraca baze", ST, "            if base.is_empty() {\n                return String::new();\n            }\n            if ctx.is_city_state", "            if ctx.is_city_state", None),
    ("disp: format - odwrocony isCityState", ST, "            if ctx.is_city_state.unwrap_or(false) {", "            if !ctx.is_city_state.unwrap_or(false) {", None),
    ("disp: format - bez trim", ST, "let base = js_trim(ctx.base_name.unwrap_or(\"\"));", "let base = ctx.base_name.unwrap_or(\"\");", None),
    ("disp: slot - stolica gracza", ST, "            if slot.is_player_capital.unwrap_or(false) {\n                return false;", "            if slot.is_player_capital.unwrap_or(false) {\n                return true;", None),
    ("disp: slot - rywal tego samego typu", ST, "            if slot.is_same_type_rival.unwrap_or(false) {\n                return true;", "            if slot.is_same_type_rival.unwrap_or(false) {\n                return false;", None),
    ("disp: slot - stolica klastra", ST, "            !slot.is_cluster_capital.unwrap_or(false)", "            slot.is_cluster_capital.unwrap_or(false)", None),
    ("disp: ownerCs - wlasciciel 0", ST, "            if owner_id <= 0 {\n                return false;\n            }\n            let Some(o) = opts", "            if owner_id < 0 {\n                return false;\n            }\n            let Some(o) = opts", None),
    ("disp: ownerCs - startCityState lub", ST, "c.owner_id == owner_id && c.start_city_state.unwrap_or(false)", "c.owner_id == owner_id || c.start_city_state.unwrap_or(false)", None),
    ("disp: ownerCs - brak typCopy", ST, "if o.typ_copy_owners.is_some_and(|s| s.contains(&owner_id)) {", "if false {", None),
    ("disp: ownerCs - brak simplified", ST, "if o.simplified_owners.is_some_and(|s| s.contains(&owner_id)) {", "if false {", None),
    ("disp: clear - warunek flagi", ST, "if *start_city_state != Some(true) {", "if *start_city_state != Some(false) {", None),
    ("disp: clear - nie gasi flagi", ST, "*start_city_state = Some(false);", "*start_city_state = Some(true);", None),
    ("disp: force - brak wykluczenia stolic klastra", ST, " && player_key == owner_key && !capital", " && player_key == owner_key", None),
    ("disp: force - klucze bez trim", ST, "let player_key = js_trim(opts.and_then(|o| o.player_civ_key).unwrap_or(\"\"));", "let player_key = opts.and_then(|o| o.player_civ_key).unwrap_or(\"\");", None),
    ("disp: force - puste klucze rowne", ST, "!player_key.is_empty() && !owner_key.is_empty()", "!player_key.is_empty() || !owner_key.is_empty()", None),
    ("disp: force - wlasciciel 0", ST, "            if owner_id <= 0 {\n                return false;\n            }\n            if is_owner_cluster_city_state(owner_id, opts.map(|o| &o.base))", "            if owner_id < 0 {\n                return false;\n            }\n            if is_owner_cluster_city_state(owner_id, opts.map(|o| &o.base))", None),
    ("disp: mapLabel - MP tylko obce", ST, "let is_city_state = is_foreign && city.start_city_state.unwrap_or(false);", "let is_city_state = city.start_city_state.unwrap_or(false);", None),
    ("disp: mapLabel - bez wykluczenia MP-wlasciciela", ST, "                && !is_city_state\n                && !is_city_state_owner\n", "                && !is_city_state\n", None),
    ("disp: mapLabel - gracz domyslnie 1", ST, "opts.and_then(|o| o.player_owner_id).unwrap_or(0)", "opts.and_then(|o| o.player_owner_id).unwrap_or(1)", None),
    ("disp: mapLabel - stolica niewymagana", ST, "&& opts.and_then(|o| o.is_capital) == Some(true)", "&& opts.and_then(|o| o.is_capital) != Some(false)", None),
    ("disp: diplo - bez obciecia dopisku", ST, "let stripped = strip_city_state_suffix(base_name);", "let stripped = base_name.to_owned();", None),
    ("disp: technical - cyfry opcjonalne", ST, "!rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit())", "rest.chars().all(|c| c.is_ascii_digit())", None),
    ("disp: technical - wielkosc liter", ST, "got.eq_ignore_ascii_case(&want)", "got == want", None),
    ("disp: technical - wszystkie wzorce", ST, ".any(|p| matches_technical(t, p))", ".all(|p| matches_technical(t, p))", None),
    ("disp: technical - bez trim", ST, "let t = js_trim(name.unwrap_or(\"\"));", "let t = name.unwrap_or(\"\");", None),
    ("disp: technical - dowolne znaki po prefiksie", ST, "!rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit())", "!rest.is_empty()", None),
    ("disp: clean - bez odsiewu placeholderow", ST, "Some(v) if !v.is_empty() && !is_technical_owner_label(Some(v)) => {", "Some(v) if !v.is_empty() => {", None),
    ("disp: resolve - rowne nazwy laczone", ST, "                    if city != civ {", "                    if true {", None),
    ("disp: resolve - stolica klastra", ST, "if input.is_cluster_capital.unwrap_or(false) {", "if false {", None),
    ("disp: resolve - nie-MP bierze kulture", ST, "            if !is_city_state {\n                if let Some(civ) = truthy(&clean_civ) {", "            if is_city_state {\n                if let Some(civ) = truthy(&clean_civ) {", None),
    ("disp: resolve - cache pusty po trim", ST, "if !js_trim(cached).is_empty() {", "if true {", None),
    ("disp: resolve - miasto pusty po trim", ST, "if !js_trim(city).is_empty() {", "if true {", None),
    ("disp: truthy - pusty napis prawdziwy", ST, "value.as_deref().filter(|s| !s.is_empty())", "value.as_deref()", None),
    ("disp: foreign - bez fallbacku na kulture", ST, ".or_else(|| clean_display_part(civ_display_name))", ".or(None)", None),
    ("disp: sanitize - bez odsiewu placeholderow", ST, "if !trimmed.is_empty() && !is_technical_owner_label(Some(trimmed)) {", "if !trimmed.is_empty() {", None),
    ("disp: sanitize - civ bez odsiewu", ST, "Some(c) if !c.is_empty() && !is_technical_owner_label(Some(c)) => {", "Some(c) if !c.is_empty() => {", None),
    ("tab: separator", J_DISP, '"separator": " · "', '"separator": " - "', None),
    ("tab: wzorzec oid- wielkosc liter", J_DISP, '"prefiks": "oid-", "cyfry": true, "ignoruj_wielkosc": true', '"prefiks": "oid-", "cyfry": true, "ignoruj_wielkosc": false', None),
    ("tab: wzorzec AI bez cyfr", J_DISP, '"prefiks": "AI ", "cyfry": true', '"prefiks": "AI ", "cyfry": false', None),
    # --- cities: procenty ---
    ("pct: clamp ulepszen bez zaokraglenia", ST, "js_min(max_ulepszenia_praca_auto_percent(), js_round(v)),", "js_min(max_ulepszenia_praca_auto_percent(), v),", None),
    ("pct: clamp ulepszen domyslna", ST, "_ => default_ulepszenia_praca_percent(),", "_ => 0.0,", None),
    ("pct: clamp podzialu bez dolnej granicy", ST, "                    min_podzial_pracy_budynki_percent(),\n                    js_min(max_podzial_pracy_budynki_percent(), js_round(v)),", "                    0.0,\n                    js_min(max_podzial_pracy_budynki_percent(), js_round(v)),", None),
    ("pct: clamp podzialu domyslna", ST, "_ => default_podzial_pracy().procent_budynki,", "_ => 0.0,", None),
    ("pct: pula z budynkow", ST, "pct_total() - clamp_podzial_pracy_budynki_percent(procent_budynki)", "clamp_podzial_pracy_budynki_percent(procent_budynki)", None),
    ("pct: podzial z procentu puli - brak odwrotnosci", ST, "procent_budynki: clamp_podzial_pracy_budynki_percent(Some(pct_total() - p)),", "procent_budynki: clamp_podzial_pracy_budynki_percent(Some(p)),", None),
    ("pct: podzial z procentu puli - gorna granica", ST, "js_min(max_procent_puli_imperium(), js_round(v)),", "js_min(pct_total(), js_round(v)),", None),
    ("pct: migracja per-turn - ostatni wiersz", ST, ".or_else(|| rows.last())", ".or_else(|| rows.first())", None),
    ("pct: resolve raw - nowe pole przed legacy", ST, "            if let Some(v) = new_val {\n                return clamp_ulepszenia_praca_percent(Some(v));\n            }", "            if let Some(v) = legacy_per_turn {\n                return clamp_ulepszenia_praca_percent(Some(v));\n            }", None),
    ("pct: resolve raw - legacy tylko 1|2|3", ST, "                    .any(|row| row.per_turn == legacy);", "                    .any(|_| true);", None),
    ("pct: cap AI - bez ograniczenia procentu", ST, "let bounded_percent = clamp_pct(praca_auto_percent);", "let bounded_percent = praca_auto_percent;", None),
    ("pct: cap AI - sufit", ST, "(cumulative_praca_pool * bounded_percent / pct_total()).floor()", "(cumulative_praca_pool * bounded_percent / pct_total()).ceil()", None),
    ("pct: polityka AI - pelna pula", ST, "policy.praca_auto_percent = ai_major_ulepszenia_praca_percent();", "policy.praca_auto_percent = default_ulepszenia_praca_percent();", None),
    ("pct: polityka AI - odwrocony predykat", ST, "            if is_ai_improvement_owner(owner_id) {", "            if !is_ai_improvement_owner(owner_id) {", None),
    ("pct: efektywne - override tylko true", ST, "if city.ulepszenia_override == Some(true) {\n                return EffectiveUlepszeniaSettings {", "if city.ulepszenia_override != Some(false) {\n                return EffectiveUlepszeniaSettings {", None),
    ("pct: efektywne - procent bez clampa", ST, "praca_auto_percent: clamp_ulepszenia_praca_percent(\n                        city.ulepszenia_praca_percent,\n                    ),", "praca_auto_percent: city.ulepszenia_praca_percent.unwrap_or(0.0),", None),
    ("pct: efektywne - wolno z imperium", ST, "                    wolno_wycinac_las: city\n                        .ulepszenia_wolno_wycinac_las\n                        .unwrap_or_else(default_ulepszenia_wolno_wycinac_las),", "                    wolno_wycinac_las: empire\n                        .wolno_wycinac_las\n                        .unwrap_or_else(default_ulepszenia_wolno_wycinac_las),", None),
    ("pct: snap - bez zaokraglenia", ST, "js_max(0.0, js_min(pct_total(), js_round(n / step) * step))", "js_max(0.0, js_min(pct_total(), (n / step).floor() * step))", None),
    ("pct: normalize - brak limitu Nauki", ST, "            n = js_min(n, max_procent_nauki());\n\n            let mut sum", "\n            let mut sum", None),
    ("pct: normalize - nadwyzka do Luksusu", ST, "                l = clamp_pct(l + (total - sum));", "                l = clamp_pct(l);", None),
    ("pct: normalize - ponowny limit Nauki", ST, "                    n = js_min(n, max_procent_nauki());\n                    sum = p + n + l;\n                    if sum != total {", "                    sum = p + n + l;\n                    if sum != total {", None),
    ("pct: normalize - korekta Pieniadza", ST, "                        p = clamp_pct(p + (total - sum));", "                        p = clamp_pct(p);", None),
    ("pct: adjust - cap Nauki przy zmianie", ST, "            if changed == HandelKey::Nauka {\n                changed_val = js_min(changed_val, max_nauka);", "            if changed == HandelKey::Pieniadz {\n                changed_val = js_min(changed_val, max_nauka);", None),
    ("pct: adjust - nadmiar zeruje reszte", ST, "            if remainder < 0.0 {", "            if remainder <= 0.0 {", None),
    ("pct: adjust - Nauka na capie", ST, "                if current.get(nk) >= max_nauka {", "                if current.get(nk) > max_nauka {", None),
    ("pct: adjust - reszta pod capem Nauki", ST, "next.set(nn, js_max(0.0, remainder - next.procent_nauka));", "next.set(nn, remainder - next.procent_nauka);", None),
    ("pct: adjust - suma pozostalych zero", ST, "            if sum_others <= 0.0 {", "            if sum_others < 0.0 {", None),
    ("pct: adjust - polowa po rowno", ST, "let half = js_round(remainder / 2.0 / step) * step;", "let half = (remainder / 2.0 / step).floor() * step;", None),
    ("pct: adjust - proporcja", ST, "let mut v0 = snap_handel_pct(remainder * current.get(k0) / sum_others);", "let mut v0 = snap_handel_pct(remainder * current.get(k1) / sum_others);", None),
    ("pct: adjust - v0 ponad reszta", ST, "            if v0 > remainder {", "            if v0 >= remainder {", None),
    ("pct: adjust - cap Nauki k0", ST, "            if k0 == HandelKey::Nauka && v0 > max_nauka {", "            if k0 == HandelKey::Pieniadz && v0 > max_nauka {", None),
    ("pct: adjust - cap Nauki k1", ST, "            if k1 == HandelKey::Nauka && next.procent_nauka > max_nauka {\n                next.procent_nauka = max_nauka;\n                next.set(k0, remainder - next.procent_nauka);\n                next.set(k0, clamp_pct(next.get(k0)));", "            if k1 == HandelKey::Luksus && next.procent_nauka > max_nauka {\n                next.procent_nauka = max_nauka;\n                next.set(k0, remainder - next.procent_nauka);\n                next.set(k0, clamp_pct(next.get(k0)));", None),
    ("pct: priorytety - sanitize bez filtra", ST, ".filter(|f| is_budowa_typ_focus(*f))", ".filter(|_| true)", None),
    ("pct: priorytety - pusta lista", ST, "            if filtered.is_empty() {\n                return default_budowa_priorytet_typow();", "            if filtered.is_empty() {\n                return Vec::new();", None),
    ("pct: isAuto - lista", ST, "BudowaTryb::Priorytet | BudowaTryb::Lista | BudowaTryb::Zrownowazone", "BudowaTryb::Priorytet | BudowaTryb::Zrownowazone", None),
    ("pct: isAuto - domyslny tryb", ST, "let v = t.unwrap_or_else(default_budowa_tryb);", "let v = t.unwrap_or(BudowaTryb::Priorytet);", None),
    ("pct: isTyp - zrownowazone", ST, "f != budowa_focus_from(&cities_params().budowa.focus_bez_typu)", "true", None),
    ("pct: procent rozwoj - bez zaokraglenia", ST, "js_round(inputs.domyslny_poziom_racji / inputs.wyzywienie_max * pct_total())", "(inputs.domyslny_poziom_racji / inputs.wyzywienie_max * pct_total()).floor()", None),
    ("pct: max pula", ST, "pct_total() - min_podzial_pracy_budynki_percent()", "pct_total() - max_podzial_pracy_budynki_percent()", None),
    ("tab: domyslny podzial pracy 70 -> 60", J_CITIES, '"domyslnie_budynki": 70', '"domyslnie_budynki": 60', None),
    ("tab: min budynki 50 -> 40", J_CITIES, '"min_budynki": 50', '"min_budynki": 40', None),
    ("tab: cap Nauki 60 -> 50", J_CITIES, '"max_nauka": 60', '"max_nauka": 50', None),
    ("tab: krok handlu 10 -> 5", J_CITIES, '"krok": 10', '"krok": 5', None),
    ("tab: domyslny handel 20/60/20 -> 30/50/20", J_CITIES, '"procentNauka": 20, "procentPieniadz": 60', '"procentNauka": 30, "procentPieniadz": 50', None),
    ("tab: procent AI 100 -> 90", J_CITIES, '"ai_major_praca_procent": 100', '"ai_major_praca_procent": 90', None),
    ("tab: migracja 2 -> 50", J_CITIES, '{ "per_turn": 2, "procent": 66 }', '{ "per_turn": 2, "procent": 50 }', None),
    ("tab: focus okolicy", J_CITIES, '"domyslny_focus": "zywnosc"', '"domyslny_focus": "produkcja"', None),
    ("tab: poziom racji 4 -> 3", J_CITIES, '"domyslny_poziom_racji": 4', '"domyslny_poziom_racji": 3', None),
    ("tab: wealth pula", J_CITIES, '"swiezy_wealth_pula": 0', '"swiezy_wealth_pula": 1', None),
    ("tab: dystans MP 3 -> 4", J_CITIES, '"min_dystans_miasto_panstwo": 3', '"min_dystans_miasto_panstwo": 4', None),
    ("tab: limit miast 10 -> 12", J_CITIES, '"limit_miast_baza_zapas": 10', '"limit_miast_baza_zapas": 12', None),
    ("tab: krok epoki 5 -> 4", J_CITIES, '"limit_miast_krok_epoka": 5', '"limit_miast_krok_epoka": 4', None),
    ("tab: immunitet wealth 5 -> 4", J_CITIES, '"wealth_immunitet_tur": 5', '"wealth_immunitet_tur": 4', None),
    ("tab: nazwa miasta Ur", J_CITIES, '"Ur",', '"Uruk",', None),
    ("tab: prefiks generyczny", J_CITIES, '"prefiks_generyczny": "Miasto "', '"prefiks_generyczny": "City "', None),
    ("tab: powod morze", J_CITIES, '"morze": "morze"', '"morze": "woda"', None),
    ("tab: priorytet typow", J_CITIES, '"domyslny_priorytet_typow": ["wzrost", "produkcja"', '"domyslny_priorytet_typow": ["produkcja", "wzrost"', None),
    ("tab: tryb nowego miasta", J_CITIES, '"domyslny_tryb_nowe_miasto": "zrownowazone"', '"domyslny_tryb_nowe_miasto": "reczny"', None),
    ("tab: tryb AI", J_CITIES, '"domyslny_tryb_ai": "zrownowazone"', '"domyslny_tryb_ai": "reczny"', None),
    ("tab: etykieta puli", J_CITIES, '"pula": "Ulepszenia (pula)"', '"pula": "Ulepszenia"', None),
    ("tab: id prefiks", J_CITIES, '"id_prefiks": "city"', '"id_prefiks": "miasto"', None),
    ("tab: prefiks listy", J_CITIES, '"lista_domyslna_nazwa_prefiks": "Lista "', '"lista_domyslna_nazwa_prefiks": "List "', None),
    # --- biblioteka list ---
    ("list: id - licznik od 0", ST, "                self.seq += 1;\n                format!(", "                format!(", None),
    ("list: nazwa - uwzglednia wielkosc liter", ST, ".map(|s| js_trim(&s.nazwa).to_lowercase())", ".map(|s| js_trim(&s.nazwa).to_owned())", None),
    ("list: nazwa - bez trim", ST, ".map(|s| js_trim(&s.nazwa).to_lowercase())", ".map(|s| s.nazwa.to_lowercase())", None),
    ("list: nazwa - zapas", ST, "biblioteka.len() + 1\n            )", "biblioteka.len()\n            )", None),
    ("list: nazwa - granica petli", ST, "for i in 1..limit {", "for i in 1..limit.saturating_sub(1) {", None),
    ("list: loader - szablon bez budynkow", ST, "&& matches!(o.get(\"budynki\"), Some(Value::Array(_)))", "", None),
    ("list: loader - pusta biblioteka nie jest tablica", ST, "Some(Value::Array(items)) => items.iter().all(is_budowa_lista_szablon_item),", "Some(Value::Array(items)) => !items.is_empty() && items.iter().all(is_budowa_lista_szablon_item),", None),
    ("list: loader - pusty slot legacy", ST, "                            if !budynki.is_empty() {\n                                out.push(", "                            if true {\n                                out.push(", None),
    ("list: loader - legacy wymaga wszystkich kluczy", ST, "if slots.iter().any(|s| o.contains_key(s)) {", "if slots.iter().all(|s| o.contains_key(s)) {", None),
    ("list: loader - legacy tablica", ST, "            if is_budowa_lista_szablon_array(raw_legacy) {", "            if false {", None),
    ("list: loader - nazwa legacy", ST, "                                        \"{}{slot}\",", "                                        \"{}x{slot}\",", None),
    ("list: dedupe - puste id", ST, "if id.is_empty() || !seen.insert(id.as_str()) {", "if !seen.insert(id.as_str()) {", None),
    ("list: dedupe - kolejnosc", ST, "if id.is_empty() || !seen.insert(id.as_str()) {", "if id.is_empty() || seen.insert(id.as_str()) {", None),
    # --- empire_city_defaults ---
    ("emp: podzial equal bez clampa", ST, "clamp_podzial_pracy_budynki_percent(Some(a.procent_budynki))", "a.procent_budynki", None),
    ("emp: resolve podzial - override", ST, "            if city.podzial_pracy_override == Some(true) {\n                if let Some(p) = city.podzial_pracy.as_ref() {", "            if city.podzial_pracy_override != Some(false) {\n                if let Some(p) = city.podzial_pracy.as_ref() {", None),
    ("emp: resolve podzial - bez normalizacji", ST, "            if let Some(d) = owner_default {\n                return normalize_podzial_pracy(d);", "            if let Some(d) = owner_default {\n                return *d;", None),
    ("emp: resolve podzial - fallback parametrow", ST, "&params_fallback\n                    .copied()\n                    .unwrap_or_else(default_podzial_pracy),", "&default_podzial_pracy(),", None),
    ("emp: local - rowne globalnemu", ST, "            if procent_budynki == globalny {", "            if procent_budynki <= globalny {", None),
    ("emp: local - globalny z domyslnej", ST, "                    .unwrap_or(default_podzial_pracy().procent_budynki),", "                    .unwrap_or(0.0),", None),
    ("emp: migracja podzialu - kasowanie pola", ST, "                        if !differs {\n                            city.podzial_pracy = None;\n                        }", "                        if !differs {\n                            city.podzial_pracy = Some(normalized);\n                        }", None),
    ("emp: migracja podzialu - pominiecie z flaga", ST, "                        if city.podzial_pracy_override.is_some() {\n                            continue;\n                        }\n                        let def = owner_defaults\n                            .get(city.owner_id)\n                            .copied()\n                            .unwrap_or_else(default_podzial_pracy);", "                        let def = owner_defaults\n                            .get(city.owner_id)\n                            .copied()\n                            .unwrap_or_else(default_podzial_pracy);", None),
    ("emp: migracja podzialu - bezwarunkowa normalizacja", ST, "            for city in cities.iter_mut() {\n                if let Some(p) = city.podzial_pracy {\n                    city.podzial_pracy = Some(normalize_podzial_pracy(&p));\n                }\n            }", "", None),
    ("emp: migracja podzialu - zapisane domyslne bez normalizacji", ST, "owner_defaults.set(*oid, normalize_podzial_pracy(split));", "owner_defaults.set(*oid, *split);", None),
    ("emp: migracja podzialu - uzupelnienie wlascicieli", ST, "                    owner_defaults.set(\n                        city.owner_id,\n                        normalize_podzial_pracy(&default_podzial_pracy()),\n                    );", "", None),
    ("emp: okolica resolve - override", ST, "            if city.okolica_focus_override == Some(true) {", "            if city.okolica_focus_override != Some(false) {", None),
    ("emp: okolica resolve - kolejnosc fallbackow", ST, "                .or(city.okolica_focus)\n                .unwrap_or_else(default_okolica_focus)", "                .unwrap_or_else(default_okolica_focus)", None),
    ("emp: okolica broadcast - pin", ST, "if c.owner_id != owner_id || c.okolica_focus_override == Some(true) {", "if c.owner_id != owner_id {", None),
    ("emp: okolica migracja - zachowanie wartosci", ST, "                        let differs = city.okolica_focus.is_some_and(|f| f != def);", "                        let differs = false;", None),
    ("emp: okolica migracja - nadpisanie przy braku roznicy", ST, "                        if !differs {\n                            city.okolica_focus = Some(def);\n                        }", "", None),
    ("emp: okolica migracja - pierwsze miasto", ST, "                        if !owner_defaults.has(city.owner_id) {\n                            owner_defaults.set(\n                                city.owner_id,\n                                city.okolica_focus.unwrap_or_else(default_okolica_focus),\n                            );", "                        {\n                            owner_defaults.set(\n                                city.owner_id,\n                                city.okolica_focus.unwrap_or_else(default_okolica_focus),\n                            );", None),
    ("emp: budowa equal - tryb", ST, "a.budowa_focus == b.budowa_focus && a.budowa_tryb == b.budowa_tryb", "a.budowa_focus == b.budowa_focus", None),
    ("emp: budowa resolve - override", ST, "            if city.budowa_focus_override == Some(true) {\n                if let (Some(focus), Some(tryb))", "            if city.budowa_focus_override != Some(false) {\n                if let (Some(focus), Some(tryb))", None),
    ("emp: budowa broadcast - pin", ST, "if c.owner_id != owner_id || c.budowa_focus_override == Some(true) {", "if c.owner_id != owner_id {", None),
    ("emp: budowa broadcast - tryb", ST, "                c.budowa_tryb = Some(profil.budowa_tryb);\n            }\n        }\n\n        /// Web `migrateBudowaProfilOnLoad`", "            }\n        }\n\n        /// Web `migrateBudowaProfilOnLoad`", None),
    ("emp: budowa migracja - brak pola", ST, "                            city.budowa_focus_override = Some(false);\n                            continue;", "                            continue;", None),
    ("emp: budowa migracja - zachowanie pary", ST, "                        city.budowa_focus_override = Some(differs);\n                        if !differs {\n                            city.budowa_focus = Some(def.budowa_focus);", "                        city.budowa_focus_override = Some(false);\n                        if !differs {\n                            city.budowa_focus = Some(def.budowa_focus);", None),
    ("emp: budowa forOwner - ujemny sentinel", ST, "            if owner_id < 0 || is_barbarian_owner(owner_id) {\n                return fresh_owner_default_budowa_profil();", "            if is_barbarian_owner(owner_id) {\n                return fresh_owner_default_budowa_profil();", None),
    ("emp: budowa forOwner - predykat barbarzyncow", ST, "            if owner_id < 0 || is_barbarian_owner(owner_id) {\n                return fresh_owner_default_budowa_profil();", "            if owner_id < 0 {\n                return fresh_owner_default_budowa_profil();", None),
    ("emp: upgrade - pomija gracza", ST, "                if oid == 0 {\n                    continue;\n                }", "", None),
    ("emp: upgrade - ujemni wlasciciele", ST, "                if oid < 0 || is_barbarian_owner(oid) {\n                    continue;\n                }", "                if is_barbarian_owner(oid) {\n                    continue;\n                }", None),
    ("emp: upgrade - barbarzyncy", ST, "                if oid < 0 || is_barbarian_owner(oid) {\n                    continue;\n                }", "                if oid < 0 {\n                    continue;\n                }", None),
    ("emp: upgrade - realne ustawienia", ST, "                    if c.budowa_tryb != default_budowa_tryb() {\n                        continue;\n                    }", "", None),
    ("emp: upgrade - broadcast", ST, "                broadcast_budowa_profil_to_owner_cities(cities, oid, &next);", "", None),
    ("emp: upgrade - tryb AI", ST, "                    budowa_tryb: ai_default_budowa_tryb(),\n                };\n                owner_defaults.set(oid, next);", "                    budowa_tryb: default_budowa_tryb(),\n                };\n                owner_defaults.set(oid, next);", None),
    ("emp: upgrade - kolejnosc wlascicieli", ST, "                if !owners.contains(&c.owner_id) {\n                    owners.push(c.owner_id);\n                }", "                if !owners.contains(&c.owner_id) {\n                    owners.insert(0, c.owner_id);\n                }", None),
    ("emp: racji resolve - override", ST, "            if city.poziom_racji_override == Some(true) {\n                if let Some(p) = city.poziom_racji {", "            if city.poziom_racji_override != Some(false) {\n                if let Some(p) = city.poziom_racji {", None),
    ("emp: racji broadcast - pin", ST, "                if c.owner_id != owner_id || c.poziom_racji_override == Some(true) {\n                    continue;\n                }\n                c.poziom_racji = Some(poziom);", "                if c.owner_id != owner_id {\n                    continue;\n                }\n                c.poziom_racji = Some(poziom);", None),
    ("emp: racji auto - pin", ST, "                if c.owner_id != owner_id || c.poziom_racji_override == Some(true) {\n                    continue;\n                }\n                c.auto_wyzywienie = Some(true);", "                if c.owner_id != owner_id {\n                    continue;\n                }\n                c.auto_wyzywienie = Some(true);", None),
    ("emp: racji migracja - roznica", ST, "                        let differs = city.poziom_racji.is_some_and(|p| p != def);", "                        let differs = false;", None),
    ("emp: OwnerMap - ponowne set zmienia miejsce", ST, "                    Some(slot) => slot.1 = value,", "                    Some(slot) => {\n                        let key = slot.0;\n                        self.entries.retain(|(k, _)| *k != key);\n                        self.entries.push((key, value));\n                    }", None),
    # --- ensure / zakladanie ---
    ("ens: handel - normalizacja override", ST, "            if city.podzial_handlu_override == Some(true) && city.podzial_handlu.is_some() {", "            if city.podzial_handlu_override == Some(true) && city.podzial_handlu.is_none() {", None),
    ("ens: handel - domyslny dla override", ST, "city.podzial_handlu = Some(default_podzial_handlu());", "city.podzial_handlu = None;", None),
    ("ens: podzial pracy - clamp", ST, "procent_budynki: clamp_podzial_pracy_budynki_percent(Some(\n                            p.procent_budynki,\n                        )),", "procent_budynki: p.procent_budynki,", None),
    ("ens: wealth", ST, "city.wealth_state = Some(fresh_wealth_state());", "city.wealth_state = None;", None),
    ("ens: okolica tryb", ST, "city.okolica_tryb = Some(default_okolica_tryb());", "city.okolica_tryb = Some(OkolicaTryb::Reczny);", None),
    ("ens: budowa auto -> priorytet", ST, "                city.budowa_tryb = Some(BudowaTryb::Priorytet);\n                if !has_entries", "                city.budowa_tryb = Some(BudowaTryb::Lista);\n                if !has_entries", None),
    ("ens: budowa auto - lista typow", ST, "                    city.budowa_priorytet_typow =\n                        Some(vec![city.budowa_focus.unwrap_or_else(default_budowa_focus)]);", "                    city.budowa_priorytet_typow = Some(Vec::new());", None),
    ("ens: budowa - domyslny tryb", ST, "                city.budowa_tryb = Some(default_budowa_tryb());\n            }\n            let zrown", "                city.budowa_tryb = Some(BudowaTryb::Priorytet);\n            }\n            let zrown", None),
    ("ens: budowa - tylko zrownowazone", ST, "!raw_priorytet.is_empty() && raw_priorytet.iter().all(|f| *f == zrown)", "raw_priorytet.iter().all(|f| *f == zrown)", None),
    ("ens: budowa - przejscie na zrownowazone", ST, "                    city.budowa_tryb = Some(BudowaTryb::Zrownowazone);\n                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());", "                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());", None),
    ("ens: budowa - sanitize z zrownowazonym", ST, "                } else if raw_priorytet.contains(&zrown) {", "                } else if false {", None),
    ("ens: budowa - zrownowazone: fokus", ST, "                city.budowa_focus = Some(zrown);\n            }\n            if city.budowa_tryb == Some(BudowaTryb::Priorytet)\n                && !has_entries", "            }\n            if city.budowa_tryb == Some(BudowaTryb::Priorytet)\n                && !has_entries", None),
    ("ens: budowa - zrownowazone: pusta lista", ST, "                if !has_entries(&city.budowa_priorytet_typow) {\n                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());\n                } else {", "                if false {\n                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());\n                } else {", None),
    ("ens: budowa - priorytet: pusta lista", ST, "                let seed = [city.budowa_focus.unwrap_or_else(default_budowa_focus)];", "                let seed = [BudowaFocus::Wzrost];", None),
    ("ens: budowa lista", ST, "city.budowa_lista = Some(Vec::new());", "city.budowa_lista = None;", None),
    ("ens: ulepszenia - override tylko true", ST, "            if city.ulepszenia_override == Some(true) {\n                if city.ulepszenia_focus.is_none() {", "            if city.ulepszenia_override != Some(false) {\n                if city.ulepszenia_focus.is_none() {", None),
    ("ens: ulepszenia - onlyWorked", ST, "city.ulepszenia_only_worked = Some(default_ulepszenia_only_worked());", "city.ulepszenia_only_worked = Some(false);", None),
    ("ens: ulepszenia - wyrab", ST, "                    city.ulepszenia_wolno_wycinac_las =\n                        Some(default_ulepszenia_wolno_wycinac_las());", "                    city.ulepszenia_wolno_wycinac_las = Some(true);", None),
    ("ens: ulepszenia - procent legacy", ST, "                        city.ulepszenia_per_turn,\n", "                        None,\n", None),
    ("ens: magazyn - zawsze liczba", ST, "matches!(city.magazyn_zywnosci, Some(FoodBuffer::Number(x)) if x == buf);", "matches!(city.magazyn_zywnosci, Some(FoodBuffer::Number(_)));", None),
    ("ens: magazyn - bity", ST, "Some(FoodBuffer::Number(x)) if x == buf);", "Some(FoodBuffer::Number(x)) if x.to_bits() == buf.to_bits());", None),
    ("ens: ration po magazynie", ST, "            (deps.ensure_city_ration_defaults)(city);\n            if city.surowce.is_none() {", "            if city.surowce.is_none() {", None),
    ("ens: surowce", ST, "city.surowce = Some(BTreeMap::new());", "city.surowce = None;", None),
    ("ens: postep", ST, "city.postep_budynkow_usuniete = Some(BTreeMap::new());", "city.postep_budynkow_usuniete = None;", None),
    ("found: limit miast >", ST, "                    if owners_cities >= limit {", "                    if owners_cities > limit {", None),
    ("found: limit - brak miast przejetych", ST, "c.owner_id == owner_id\n                                && counts_toward_city_founding_limit(c.founded_by_owner)", "c.owner_id == owner_id", None),
    ("found: limit - era minimalna", ST, "let era = js_max(founding.min_epoka, owner_era);", "let era = owner_era;", None),
    ("found: limit - baza zapasowa", ST, "                        .unwrap_or(founding.limit_miast_baza_zapas);", "                        .unwrap_or(0.0);", None),
    ("found: limit - krok epoki", ST, "(era - founding.min_epoka) * founding.limit_miast_krok_epoka", "era * founding.limit_miast_krok_epoka", None),
    ("found: limit - bez ownerEra", ST, "(o.owner_id, o.owner_era, o.game_config)", "(o.owner_id, Some(1.0), o.game_config)", None),
    ("found: dystans <=", ST, "                    if hex_distance(q, r, city.q, city.r) < min_dist {", "                    if hex_distance(q, r, city.q, city.r) <= min_dist {", None),
    ("found: dystans - MP zakladane", ST, "if founding_city_state || city.start_city_state == Some(true) {", "if city.start_city_state == Some(true) {", None),
    ("found: dystans - MP istniejace", ST, "if founding_city_state || city.start_city_state == Some(true) {", "if founding_city_state {", None),
    ("found: slot klastra", ST, "            if !cluster_start_slot {", "            if cluster_start_slot {", None),
    ("found: hex distance - os s", ST, "let ds = ((-aq - ar) - (-bq - br)).abs();\n            js_max(js_max(dq, dr), ds)", "let ds = 0.0;\n            js_max(js_max(dq, dr), ds)", None),
    ("found: terytorium", ST, "                if !within(q, r) {", "                if within(q, r) {", None),
    ("found: gory", ST, "if terrain == RuchTeren::Gory {", "if terrain == RuchTeren::Wzgorza {", None),
    ("found: woda", ST, "if is_water_terrain(terrain) {", "if terrain == RuchTeren::Morze {", None),
    ("found: klucz niecalkowity", ST, "if x.is_finite() && x.fract() == 0.0 && x.abs() <= f64::from(i32::MAX) {", "if x.is_finite() && x.abs() <= f64::from(i32::MAX) {", None),
    ("found: nowe miasto - id", ST, "id: format!(\"{}{index}\", founding.id_prefiks),", "id: format!(\"{}{}\", founding.id_prefiks, index + 1),", None),
    ("found: nowe miasto - populacja", ST, "population: founding.startowa_populacja,", "population: founding.startowa_populacja + 1.0,", None),
    ("found: nowe miasto - override podzialu handlu", ST, "podzial_handlu_override: Some(false),", "podzial_handlu_override: Some(true),", None),
    ("found: nowe miasto - poziom racji", ST, "poziom_racji: Some(default_poziom_racji()),", "poziom_racji: Some(default_procent_rozwoj()),", None),
    ("found: nowe miasto - zalozone przez wlasciciela", ST, "founded_by_owner: Some(true),", "founded_by_owner: Some(false),", None),
    ("found: nowe miasto - procent rozwoj", ST, "procent_rozwoj: Some(default_procent_rozwoj_wyzywienie()),", "procent_rozwoj: Some(default_procent_rozwoj()),", None),
    ("found: nowe miasto - auto wyzywienie tylko w foundCityAt", ST, "                city.auto_wyzywienie = Some(true);\n", "                city.auto_wyzywienie = Some(true);\n                city.founded_by_owner = Some(false);\n", None),
    ("found: nowe miasto - MP flaga", ST, "                if founding_city_state {\n                    city.start_city_state = Some(true);", "                if !founding_city_state {\n                    city.start_city_state = Some(true);", None),
    ("found: foundCity - pelne pola", ST, "                name,\n                false,\n                false,\n            ))\n        }", "                name,\n                true,\n                false,\n            ))\n        }", None),
    ("found: foundCityAt - flagi", ST, "                name,\n                true,\n                founding_city_state,\n            ))", "                name,\n                true,\n                false,\n            ))", None),
    ("found: nazwa - poza pula", ST, "if index >= 0.0 && index < names.lista.len() as f64 {", "if index >= 0.0 && index <= names.lista.len() as f64 {", None),
    ("found: nazwa - niecalkowity", ST, "                if index.fract() != 0.0 {\n                    return None;\n                }", "", None),
    ("found: nazwa - generyczna", ST, "js_number_to_string(index + 1.0)", "js_number_to_string(index)", None),
    ("found: wioska - nazwa z liczby miast", ST, "let name = city_name(cities.len() as f64).unwrap_or_default();", "let name = city_name(0.0).unwrap_or_default();", None),
    ("found: wioska - wlasciciel 0", ST, "match found_city_at(q, r, 0, cities, map, &name, false, false) {", "match found_city_at(q, r, 1, cities, map, &name, false, false) {", None),
    ("found: wioska - terytorium", ST, "            let opts = CanFoundCityOpts {\n                within_territory,\n                ..CanFoundCityOpts::default()\n            };\n            let check = can_found_city(q, r, cities, map, Some(&opts));\n            if !check.ok {\n                return FoundFromVillageResult::Err {", "            let opts = CanFoundCityOpts::default();\n            let check = can_found_city(q, r, cities, map, Some(&opts));\n            if !check.ok {\n                return FoundFromVillageResult::Err {", None),
    ("found: limit predykat", ST, "founded_by_owner != Some(false)", "founded_by_owner == Some(true)", None),
    ("found: proweniencja", ST, "start_city_state == Some(true)\n        }\n\n        /// Web `hexDistance`", "start_city_state != Some(false)\n        }\n\n        /// Web `hexDistance`", None),
]


def tests_for(name, path):
    """Binaria testowe, ktore pokrywaja mutowany fragment."""
    if path.endswith(".json"):
        return ["p6_6b_display", "p6_6b_percent", "p6_6b_lists", "p6_6b_empire", "p6_6b_cities_ensure", "p6_6b_cities_found", "p6_6b_tables"]
    prefix = name.split(":")[0]
    return {
        "disp": ["p6_6b_display"],
        "pct": ["p6_6b_percent", "p6_6b_cities_ensure"],
        "list": ["p6_6b_lists"],
        "emp": ["p6_6b_empire"],
        "ens": ["p6_6b_cities_ensure"],
        "found": ["p6_6b_cities_found"],
    }[prefix]


ONLY = sys.argv[1:]
SKIP = int(os.environ.get("MUT_SKIP", "0"))
END = int(os.environ.get("MUT_END", str(10**9)))
survived = []
ran = 0
for idx, (name, path, old, new, nth) in enumerate(M):
    if idx < SKIP or idx >= END:
        continue
    if ONLY and not any(o in name for o in ONLY):
        continue
    ran += 1
    src = open(path, encoding="utf-8").read()
    cnt = src.count(old)
    if os.environ.get("MUT_CHECK"):
        ok = (cnt == 1) if nth is None else (cnt >= nth)
        print(("OK    " if ok else "BRAK  ") + f"{cnt}x: {name}")
        if not ok:
            survived.append(name)
        continue
    if nth is None:
        if cnt != 1:
            print(f"BLAD: fragment nie wystepuje dokladnie raz: {name} ({cnt})")
            sys.exit(2)
        mutated = src.replace(old, new)
    else:
        if cnt < nth:
            print(f"BLAD: brak {nth}. wystapienia: {name} ({cnt})")
            sys.exit(2)
        pos = -1
        for _ in range(nth):
            pos = src.index(old, pos + 1)
        mutated = src[:pos] + new + src[pos + len(old):]
    open(path, "w", encoding="utf-8").write(mutated)
    try:
        args = ["cargo", "test", "--no-fail-fast"]
        for t in tests_for(name, path):
            args += ["--test", t]
        r = subprocess.run(args, capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if r.returncode == 0:
            survived.append(name)
            print(f"PRZEZYL   : {name}")
        elif "error[" in out or ("error:" in out and not failed):
            print(f"KOMPILACJA: {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:3])}")
    finally:
        open(path, "w", encoding="utf-8").write(src)
print(f"mutantow={ran} przezylo/niekompilujace={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
