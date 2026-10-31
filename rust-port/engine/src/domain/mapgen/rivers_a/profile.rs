//! P6.M07A partia 3 - profil czasowy rzek (`CIV_RIVER_PROFILE=1`), tylko diagnostyka.
//! Web (pin `edb8fb56`, gen-helpers.ts:5669-5752): `RIVER_PROFILE_ON`, `rpNow`, `RiverProfileStats`,
//! `rpEnsure`, `resetRiverProfileStats`, `getRiverProfileStats`, `formatRiverProfileReport`.
//! Stan zbiera sie tylko przy wlaczonej fladze (`CIV_RIVER_PROFILE=1`); nie wplywa na wynik generatora.
//! Hooki w ciele generatora (web `if (RIVER_PROFILE_ON) rpEnsure().x++`) naleza do portu generatora
//! (poza zakresem tego modulu) i beda wolac {@link river_profile_hook}.
//! Wektory formatowania: `tests/p6_m07a_vectors/web-rivers-a-grow.json` (klucz `profile`).

use std::sync::Mutex;

/// Web `RiverProfileStats` (:5688). Liczniki jako `u64`, czasy w ms jako `f64`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct RiverProfileStats {
    pub field_cache_ms: f64,
    pub field_cache_calls: u64,
    pub generate_rivers_ms: f64,
    pub gen_stage1_ms: f64,
    pub gen_stage2_ms: f64,
    pub gen_stage3_ms: f64,
    pub gen_decor_ms: f64,
    pub gen_dry_patch_ms: f64,
    pub gen_stage2_rounds: u64,
    pub top_up_ms: f64,
    pub top_up_pass_ms: Vec<f64>,
    pub top_up_hard_starts_ms: f64,
    pub top_up_dry_patch_ms: f64,
    pub top_up_grid_prox_ms: f64,
    pub trace_river_calls: u64,
    pub trace_river_ms: f64,
    pub a_star_calls: u64,
    pub a_star_ms: f64,
    pub force_fill_calls: u64,
}

/// Web `_riverProfile` (modul): `null` do pierwszego `rpEnsure()` albo `resetRiverProfileStats()`.
static RIVER_PROFILE: Mutex<Option<RiverProfileStats>> = Mutex::new(None);

/// Web `RIVER_PROFILE_ON` (:5670): `process.env.CIV_RIVER_PROFILE === '1'`.
pub fn river_profile_on() -> bool {
    std::env::var("CIV_RIVER_PROFILE").as_deref() == Ok("1")
}

/// Web `if (RIVER_PROFILE_ON) rpEnsure().<pole> ...`: wykonuje `f` na statystykach (tworzonych
/// leniwie jak `rpEnsure`) tylko gdy flaga jest wlaczona. Przy wylaczonej fladze nic nie robi.
pub fn river_profile_hook(f: impl FnOnce(&mut RiverProfileStats)) {
    if !river_profile_on() {
        return;
    }
    let mut guard = RIVER_PROFILE.lock().unwrap_or_else(|e| e.into_inner());
    f(guard.get_or_insert_with(RiverProfileStats::default));
}

/// Web `resetRiverProfileStats()` (:5719).
pub fn reset_river_profile_stats() {
    let mut guard = RIVER_PROFILE.lock().unwrap_or_else(|e| e.into_inner());
    *guard = None;
}

/// Web `getRiverProfileStats()` (:5723): kopia albo `None`.
pub fn get_river_profile_stats() -> Option<RiverProfileStats> {
    let guard = RIVER_PROFILE.lock().unwrap_or_else(|e| e.into_inner());
    guard.clone()
}

/// Web `toFixed(digits)` (ECMAScript Number.prototype.toFixed): dokladne zaokraglenie, a przy
/// remisie (dokladnie polowa) wybor wiekszej wartosci - inaczej niz `format!` Rusta (half-even).
pub fn js_to_fixed(x: f64, digits: usize) -> String {
    if x.is_nan() {
        return "NaN".to_string();
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    let neg = x < 0.0;
    let exact = format!("{:.1100}", x.abs());
    let (int_part, frac_part) = exact.split_once('.').unwrap_or((exact.as_str(), ""));
    let mut digits_vec: Vec<u8> = int_part
        .bytes()
        .chain(frac_part.bytes().take(digits))
        .map(|b| b - b'0')
        .collect();
    let next = frac_part.as_bytes().get(digits).copied().unwrap_or(b'0');
    if next >= b'5' {
        // Przeniesienie w gore (dziesietne), dla ostatniej cyfry.
        let mut i = digits_vec.len();
        loop {
            if i == 0 {
                digits_vec.insert(0, 1);
                break;
            }
            i -= 1;
            if digits_vec[i] == 9 {
                digits_vec[i] = 0;
            } else {
                digits_vec[i] += 1;
                break;
            }
        }
    }
    let int_len = digits_vec.len() - digits;
    let mut out = String::new();
    if neg {
        out.push('-');
    }
    for (i, d) in digits_vec.iter().enumerate() {
        if i == int_len && digits > 0 {
            out.push('.');
        }
        out.push(char::from(b'0' + d));
    }
    out
}

/// Web `formatRiverProfileReport(totalMs?)` (:5727) dla stanu z modulu.
pub fn format_river_profile_report(total_ms: Option<f64>) -> String {
    format_river_profile_text(get_river_profile_stats().as_ref(), total_ms)
}

/// Czysta czesc {@link format_river_profile_report}: `None` = web `getRiverProfileStats() === null`.
pub fn format_river_profile_text(
    stats: Option<&RiverProfileStats>,
    total_ms: Option<f64>,
) -> String {
    let Some(s) = stats else {
        return "(profiler off — set CIV_RIVER_PROFILE=1)".to_string();
    };
    let river_ms = s.generate_rivers_ms + s.top_up_ms;
    let denom = total_ms.unwrap_or(river_ms);
    let pct = |ms: f64| {
        if denom > 0.0 {
            js_to_fixed(ms / denom * 100.0, 1)
        } else {
            "0.0".to_string()
        }
    };
    let f0 = |ms: f64| js_to_fixed(ms, 0);
    let mut lines: Vec<String> = vec![
        "=== RIVER PROFILE (CIV_RIVER_PROFILE=1) ===".to_string(),
        format!(
            "fieldCache:        {}ms ({}%) ×{}",
            f0(s.field_cache_ms),
            pct(s.field_cache_ms),
            s.field_cache_calls
        ),
        format!(
            "generateRivers:    {}ms ({}%)",
            f0(s.generate_rivers_ms),
            pct(s.generate_rivers_ms)
        ),
        format!(
            "  stage1 (main):   {}ms ({}%)",
            f0(s.gen_stage1_ms),
            pct(s.gen_stage1_ms)
        ),
        format!(
            "  stage2 (medium): {}ms ({}%) rounds={}",
            f0(s.gen_stage2_ms),
            pct(s.gen_stage2_ms),
            s.gen_stage2_rounds
        ),
        format!(
            "  stage3 (short):  {}ms ({}%)",
            f0(s.gen_stage3_ms),
            pct(s.gen_stage3_ms)
        ),
        format!(
            "  decor tributary: {}ms ({}%)",
            f0(s.gen_decor_ms),
            pct(s.gen_decor_ms)
        ),
        format!(
            "  gen dry-patch:   {}ms ({}%)",
            f0(s.gen_dry_patch_ms),
            pct(s.gen_dry_patch_ms)
        ),
        format!(
            "topUp total:       {}ms ({}%)",
            f0(s.top_up_ms),
            pct(s.top_up_ms)
        ),
    ];
    for (i, ms) in s.top_up_pass_ms.iter().enumerate() {
        lines.push(format!(
            "  pass {}:        {}ms ({}%)",
            i + 1,
            f0(*ms),
            pct(*ms)
        ));
    }
    lines.push(format!(
        "  hardStarts:      {}ms ({}%)",
        f0(s.top_up_hard_starts_ms),
        pct(s.top_up_hard_starts_ms)
    ));
    lines.push(format!(
        "  dryPatch:        {}ms ({}%)",
        f0(s.top_up_dry_patch_ms),
        pct(s.top_up_dry_patch_ms)
    ));
    lines.push(format!(
        "  grid+proximity:  {}ms ({}%)",
        f0(s.top_up_grid_prox_ms),
        pct(s.top_up_grid_prox_ms)
    ));
    lines.push(format!(
        "traceRiver:        {}ms ({}%) ×{}",
        f0(s.trace_river_ms),
        pct(s.trace_river_ms),
        s.trace_river_calls
    ));
    lines.push(format!(
        "aStarRiverToSea:   {}ms ({}%) ×{}",
        f0(s.a_star_ms),
        pct(s.a_star_ms),
        s.a_star_calls
    ));
    lines.push(format!("forceFill:         ×{}", s.force_fill_calls));
    lines.push(format!("rivers subtotal:   {}ms", f0(river_ms)));
    lines.join("\n")
}
