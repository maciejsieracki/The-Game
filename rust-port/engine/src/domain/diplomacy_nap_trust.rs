//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 2): port 1:1 z webem (pin `origin/main` a61337844)
//! bramki Paktu o nieagresji (case '2' w `resolveDiplomacyActionLock`):
//! - `gra/src/game/diplomacy-locks.ts:220-240` (case '2'), `:187-205` (`dualGate`), `:146-186` (formaty notek),
//! - `gra/src/game/diplomacy-proposals.ts:521,533,544-553` (`SWEETENER_EASE_MAX_POINTS = 20`,
//!   `NAP_GRANICA_RELACJA_NARZUT = 20`, `napRelacjaProgEfektywny`),
//! - `deltaRelacjiSojusz` = `diplomacy.ts:1885` (+15 z `diplomacy-aggressor-params.json`, reuse z `diplomacy_aggressor`).
//!
//! Zasada (R-WEB-DIPLO-NAP-TRUST-30-Q1): pakt wymaga Relacji ORAZ Zaufania (`progNapZaufanie`, fallback 30 —
//! fail-closed). Próg Relacji = `napRelacjaProgEfektywny` (baza + narzut wspólnej granicy + delta agresora).

use super::diplomacy_multiwar::js_max;

/// Web `NAP_ZAUFANIE_FALLBACK` (diplomacy-locks.ts:50). Ta sama wartość co `diplomacy.json progNapZaufanie`.
pub const NAP_ZAUFANIE_FALLBACK: f64 = 30.0;

/// Web `NAP_GRANICA_RELACJA_NARZUT = SWEETENER_EASE_MAX_POINTS` (diplomacy-proposals.ts:533, :521).
pub const NAP_GRANICA_RELACJA_NARZUT: f64 = 20.0;

/// Web `deltaRelacjiSojusz(true)` = `relacjaDeltaSojusz` z `diplomacy-aggressor-params.json` (wplywNaAI).
pub const NAP_DELTA_AGRESOR: f64 = 15.0;

/// Web `napRelacjaProgEfektywny` (diplomacy-proposals.ts:544-553):
/// `max(0, progNapRelacja + narzut - napEase + deltaRelacjiSojusz(agresor))`.
pub fn nap_relacja_prog_efektywny(
    prog_nap_relacja: f64,
    kara_wspolna_granica: bool,
    proponent_agresor: bool,
    nap_ease: f64,
) -> f64 {
    let narzut = if kara_wspolna_granica {
        NAP_GRANICA_RELACJA_NARZUT
    } else {
        0.0
    };
    let delta = if proponent_agresor {
        NAP_DELTA_AGRESOR
    } else {
        0.0
    };
    js_max(0.0, prog_nap_relacja + narzut - nap_ease + delta)
}

/// Web `fmtProg` (diplomacy-locks.ts:146): `Number.isInteger(n) ? String(n) : n.toFixed(1)`.
pub fn fmt_prog(n: f64) -> String {
    if n.is_finite() && n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        js_to_fixed_1(n)
    }
}

/// JS `Number.prototype.toFixed(1)` (ECMA-262 21.1.3.3): dokładny remis (np. 0.25, 29.25) zaokrąglany
/// w GÓRĘ po wartości bezwzględnej; Rust `{:.1}` zaokrągla remisy do parzystej (0.25 -> "0.2").
/// Niefinityczne: `NaN`, `Infinity`, `-Infinity` jak w JS.
fn js_to_fixed_1(n: f64) -> String {
    if n.is_nan() {
        return "NaN".to_string();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    let neg = n < 0.0;
    let a = n.abs();
    // Remis dokładny: po drugim miejscu po przecinku stoi „5”, a dalej same zera (np. 0.25, 29.25).
    // Dla f64 różnica od remisu nie mieści się w 60 cyfrach, więc to rozstrzygnięcie jest dokładne.
    let exact = format!("{:.60}", a);
    let is_tie = exact.find('.').is_some_and(|d| {
        let frac = &exact[d + 1..];
        frac.len() >= 2 && frac.as_bytes()[1] == b'5' && frac[2..].bytes().all(|b| b == b'0')
    });
    let body = if is_tie {
        format!("{:.1}", ((a * 10.0).floor() + 1.0) / 10.0)
    } else {
        format!("{:.1}", a)
    };
    if neg {
        format!("-{body}")
    } else {
        body
    }
}

/// Wymóg zwracany przez blokadę (web `DiplomacyLockResult.requirement`).
#[derive(Debug, Clone, PartialEq)]
pub struct NapRequirement {
    /// `"zaufanie"` albo `"stan"` (Relacja), jak w web.
    pub kind: &'static str,
    pub prog: f64,
    pub masz: f64,
}

/// Wynik bramki case '2'.
#[derive(Debug, Clone, PartialEq)]
pub enum NapLockOutcome {
    /// `{ locked: false, note: '' }`.
    Open,
    /// `{ locked: false, active: true, note: 'już zawarty' }`.
    Active { note: String },
    /// `{ locked: true, note, requirement? }`.
    Locked {
        note: String,
        requirement: Option<NapRequirement>,
    },
}

/// Kontekst bramki Paktu (podzbiór `DiplomacyActionLockContext` używany przez case '2').
#[derive(Debug, Clone, PartialEq)]
pub struct NapLockCtx {
    pub at_war: bool,
    pub has_nap: bool,
    /// Web `relTotal`.
    pub rel_total: f64,
    pub zaufanie: f64,
    pub prog_nap_relacja: f64,
    /// Web `progNapZaufanie` (`undefined` -> `NAP_ZAUFANIE_FALLBACK`).
    pub prog_nap_zaufanie: Option<f64>,
    pub kara_wspolna_granica: bool,
    pub nap_agresor_aktywny: bool,
}

/// Web `dualGate` (diplomacy-locks.ts:187-205). `None` = bramka przepuszcza.
fn dual_gate(
    rel_total: f64,
    zaufanie: f64,
    min_rel: f64,
    min_zauf: f64,
    powod_rel: &str,
) -> Option<(String, NapRequirement)> {
    let rel_ok = rel_total >= min_rel;
    let zauf_ok = zaufanie >= min_zauf;
    if rel_ok && zauf_ok {
        return None;
    }
    if !zauf_ok && !rel_ok {
        let rel_extra = if powod_rel.is_empty() {
            String::new()
        } else {
            format!("; {powod_rel}")
        };
        let note = format!(
            "zablokowana — wymaga Zaufania {} (masz {}) i Relacji {} (masz {}{})",
            fmt_prog(min_zauf),
            fmt_prog(zaufanie),
            fmt_prog(min_rel),
            fmt_prog(rel_total),
            rel_extra
        );
        return Some((
            note,
            NapRequirement {
                kind: "zaufanie",
                prog: min_zauf,
                masz: zaufanie,
            },
        ));
    }
    if !zauf_ok {
        // Web zaufanieGate (diplomacy-locks.ts:156): bez przyczyny Relacji.
        let note = format!(
            "zablokowana — wymaga Zaufania {} (masz {})",
            fmt_prog(min_zauf),
            fmt_prog(zaufanie)
        );
        return Some((
            note,
            NapRequirement {
                kind: "zaufanie",
                prog: min_zauf,
                masz: zaufanie,
            },
        ));
    }
    // Web relacjaGate (diplomacy-locks.ts:174) z powodem.
    let extra = if powod_rel.is_empty() {
        String::new()
    } else {
        format!("; {powod_rel}")
    };
    let note = format!(
        "zablokowana — wymaga Relacji {} (masz {}{})",
        fmt_prog(min_rel),
        fmt_prog(rel_total),
        extra
    );
    Some((
        note,
        NapRequirement {
            kind: "stan",
            prog: min_rel,
            masz: rel_total,
        },
    ))
}

/// Web `resolveDiplomacyActionLock`, case '2' (diplomacy-locks.ts:222-242).
pub fn resolve_nap_lock(ctx: &NapLockCtx) -> NapLockOutcome {
    if ctx.has_nap {
        return NapLockOutcome::Active {
            note: "już zawarty".to_string(),
        };
    }
    if ctx.at_war {
        return NapLockOutcome::Locked {
            note: "zablokowany — trwa wojna".to_string(),
            requirement: None,
        };
    }
    let nap_rel_prog = nap_relacja_prog_efektywny(
        ctx.prog_nap_relacja,
        ctx.kara_wspolna_granica,
        ctx.nap_agresor_aktywny,
        0.0,
    );
    let mut powody: Vec<String> = Vec::new();
    if ctx.kara_wspolna_granica {
        powody.push(format!(
            "+{} za wspólną granicę",
            NAP_GRANICA_RELACJA_NARZUT as i64
        ));
    }
    if ctx.nap_agresor_aktywny {
        powody.push(format!("+{} za flagę agresora", NAP_DELTA_AGRESOR as i64));
    }
    let powod = powody.join(", ");
    let min_zauf = ctx.prog_nap_zaufanie.unwrap_or(NAP_ZAUFANIE_FALLBACK);
    match dual_gate(ctx.rel_total, ctx.zaufanie, nap_rel_prog, min_zauf, &powod) {
        Some((note, requirement)) => NapLockOutcome::Locked {
            note,
            requirement: Some(requirement),
        },
        None => NapLockOutcome::Open,
    }
}
