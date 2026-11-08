//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia E, runda 2): port 1:1 z webem
//! `gra/src/game/diplomacy-locks.ts` — `resolveDiplomacyActionLock` dla WSZYSTKICH case'ów
//! (`'2'`..`'15'`, `default`). Pin webu: `origin/main` (wypakowanie `git archive origin/main gra/src gra/data` poza repo).
//!
//! Zakres: rdzeń blokad (notki w formacie makiety, progi już przeskalowane przez silnik).
//! Kontakt (`'1'`) i „brak kontaktu" sprawdza silnik PRZED wywołaniem (web: `ctx.contact` nie jest czytane
//! w `resolveDiplomacyActionLock`), więc pole `contact` nie istnieje w `LockCtx`.
//!
//! Współdzielone z istniejącym portem (bez duplikacji):
//! - case `'2'` = `diplomacy_nap_trust::resolve_nap_lock` (ta sama logika, ten sam wynik),
//! - `dualGate` = `diplomacy_nap_trust::dual_gate`, `fmtProg` = `diplomacy_nap_trust::fmt_prog`,
//! - `NAP_ZAUFANIE_FALLBACK` / `NapRequirement` z `diplomacy_nap_trust`.
//!
//! ZAŁOŻENIA:
//! - Pola web `?:` (undefined) -> `Option<..>` albo `bool` (`false`); `=== false` na `hasTradeTech*` -> `Option<bool>`.
//! - `active` (web: pole obecne tylko przy `active: true`) -> `bool`, `false` = pole nieobecne.
//! - Liczby JS `${n}` w notce (case `'15'`) formatowane przez `js_num` (NaN/Infinity/liczby całkowite).

use super::diplomacy_nap_trust::{
    dual_gate, fmt_prog, resolve_nap_lock, NapLockCtx, NapLockOutcome, NapRequirement,
};

/// Web `DiplomacyLockResult` (`requirement` = `NapRequirement`: kind `"zaufanie"` / `"respekt"` / `"stan"`).
#[derive(Debug, Clone, PartialEq)]
pub struct LockResult {
    pub locked: bool,
    pub requirement: Option<NapRequirement>,
    pub note: String,
    /// Web `active: true` (traktat już zawarty). `false` = pole nieobecne w webie.
    pub active: bool,
}

/// Web `DiplomacyActionLockContext` (pola używane przez `resolveDiplomacyActionLock`).
#[derive(Debug, Clone, PartialEq)]
pub struct LockCtx {
    /// Web `actionId` (`"2"`..`"15"`; inne -> `default`).
    pub action_id: String,
    pub at_war: bool,
    /// Web `relTotal`.
    pub rel_total: f64,
    pub zaufanie: f64,
    pub respekt: f64,
    pub has_nap: bool,
    pub has_handel: bool,
    pub has_trade_connection: bool,
    /// Web `hasTradeTechSelf?` (`undefined` = `None`, wsteczna zgodność: bramka pominięta).
    pub has_trade_tech_self: Option<bool>,
    /// Web `hasTradeTechOther?`.
    pub has_trade_tech_other: Option<bool>,
    /// Web `hasWymiana?` (`undefined` = false).
    pub has_wymiana: bool,
    pub has_sojusz: bool,
    /// Web `hasGranice?` (`undefined` = false).
    pub has_granice: bool,
    /// Web `breaksTreatyLabel?`.
    pub breaks_treaty_label: Option<String>,
    pub sellable_tech_count: f64,
    pub buyable_tech_count: f64,
    pub known_rivals_count: f64,
    pub prog_nap_relacja: f64,
    /// Web `progNapZaufanie?` (`undefined` -> `NAP_ZAUFANIE_FALLBACK`).
    pub prog_nap_zaufanie: Option<f64>,
    /// Web `karaWspolnaGranica?` (`undefined` = false).
    pub kara_wspolna_granica: bool,
    /// Web `napAgresorAktywny?` (`undefined` = false).
    pub nap_agresor_aktywny: bool,
    pub prog_handel_relacja: f64,
    pub prog_sojusz_relacja: f64,
    pub prog_sojusz_zaufanie: f64,
    pub prog_granice_relacja: f64,
    pub prog_granice_zaufanie: f64,
    pub prog_wymiana_tech_zaufanie: f64,
    pub prog_namow_wojne_zaufanie: f64,
    pub prog_wasalizacja_respekt: f64,
    /// Web `progWchloniecieRespekt?` (`undefined` -> 90).
    pub prog_wchloniecie_respekt: Option<f64>,
    pub prog_trybut_zadanie_min_respekt: f64,
    pub prog_dar_relacja: f64,
    /// Web `isCityStatePartner?` (`undefined` = false).
    pub is_city_state_partner: bool,
    /// Web `hasWasal?` (`undefined` = false).
    pub has_wasal: bool,
    /// Web `wasalAgeTurns?` (`undefined` -> 0).
    pub wasal_age_turns: Option<f64>,
    /// Web `graczWchlonieciePoWasaluTur?` (`undefined` -> 10).
    pub gracz_wchloniecie_po_wasalu_tur: Option<f64>,
}

/// Web `formatLockedNote` (`diplomacy-locks.ts:151`): `zablokowana — wymaga ${label} ${fmtProg(prog)} (masz ${fmtProg(masz)}${extra})`.
fn formatted_note(label: &str, prog: f64, masz: f64, powod: &str) -> String {
    let extra = if powod.is_empty() {
        String::new()
    } else {
        format!("; {powod}")
    };
    format!(
        "zablokowana — wymaga {label} {} (masz {}{extra})",
        fmt_prog(prog),
        fmt_prog(masz)
    )
}

/// Web `zaufanieGate` / `respektGate` / `relacjaGate` (`diplomacy-locks.ts:156-183`): `None` = bramka przepuszcza.
fn simple_gate(
    kind: &'static str,
    label: &str,
    prog: f64,
    masz: f64,
    powod: &str,
) -> Option<LockResult> {
    if masz >= prog {
        return None;
    }
    Some(LockResult {
        locked: true,
        requirement: Some(NapRequirement { kind, prog, masz }),
        note: formatted_note(label, prog, masz, powod),
        active: false,
    })
}

fn zaufanie_gate(prog: f64, masz: f64) -> Option<LockResult> {
    simple_gate("zaufanie", "Zaufania", prog, masz, "")
}

fn respekt_gate(prog: f64, masz: f64) -> Option<LockResult> {
    simple_gate("respekt", "Respektu", prog, masz, "")
}

fn relacja_gate(prog: f64, masz: f64) -> Option<LockResult> {
    simple_gate("stan", "Relacji", prog, masz, "")
}

/// Web `dualGate` (ta sama reguła co `diplomacy_nap_trust::dual_gate`, zwrot w kształcie `LockResult`).
fn dual(rel_total: f64, zaufanie: f64, min_rel: f64, min_zauf: f64) -> Option<LockResult> {
    dual_gate(rel_total, zaufanie, min_rel, min_zauf, "").map(|(note, requirement)| LockResult {
        locked: true,
        requirement: Some(requirement),
        note,
        active: false,
    })
}

fn locked(note: &str) -> LockResult {
    LockResult {
        locked: true,
        requirement: None,
        note: note.to_string(),
        active: false,
    }
}

fn open(note: &str) -> LockResult {
    LockResult {
        locked: false,
        requirement: None,
        note: note.to_string(),
        active: false,
    }
}

fn active(note: &str) -> LockResult {
    LockResult {
        locked: false,
        requirement: None,
        note: note.to_string(),
        active: true,
    }
}

/// Format liczby jak w szablonie JS `${n}` (NaN, Infinity, liczby całkowite bez `.0`).
fn js_num(x: f64) -> String {
    if x.is_nan() {
        return "NaN".to_string();
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    if x.fract() == 0.0 {
        return format!("{}", x as i64);
    }
    format!("{x}")
}

/// Web `resolveDiplomacyActionLock` (diplomacy-locks.ts:222-380).
pub fn resolve_diplomacy_action_lock(ctx: &LockCtx) -> LockResult {
    match ctx.action_id.as_str() {
        "2" => {
            let nap = resolve_nap_lock(&NapLockCtx {
                at_war: ctx.at_war,
                has_nap: ctx.has_nap,
                rel_total: ctx.rel_total,
                zaufanie: ctx.zaufanie,
                prog_nap_relacja: ctx.prog_nap_relacja,
                prog_nap_zaufanie: ctx.prog_nap_zaufanie,
                kara_wspolna_granica: ctx.kara_wspolna_granica,
                nap_agresor_aktywny: ctx.nap_agresor_aktywny,
            });
            match nap {
                NapLockOutcome::Open => open(""),
                NapLockOutcome::Active { note } => LockResult {
                    locked: false,
                    requirement: None,
                    note,
                    active: true,
                },
                NapLockOutcome::Locked { note, requirement } => LockResult {
                    locked: true,
                    requirement,
                    note,
                    active: false,
                },
            }
        }
        "3" => {
            if ctx.has_sojusz {
                return active("już zawarty");
            }
            if ctx.at_war {
                return locked("zablokowany — trwa wojna");
            }
            dual(
                ctx.rel_total,
                ctx.zaufanie,
                ctx.prog_sojusz_relacja,
                ctx.prog_sojusz_zaufanie,
            )
            .unwrap_or_else(|| open(""))
        }
        "4" => {
            if ctx.has_granice {
                return active("już zawarty");
            }
            if ctx.at_war {
                return locked("zablokowane — trwa wojna");
            }
            dual(
                ctx.rel_total,
                ctx.zaufanie,
                ctx.prog_granice_relacja,
                ctx.prog_granice_zaufanie,
            )
            .unwrap_or_else(|| open("przemarsz wojsk dozwolony"))
        }
        "5" => {
            if ctx.at_war {
                return locked("handel niedostępny w wojnie");
            }
            if ctx.has_handel {
                return active("już zawarta");
            }
            if ctx.has_trade_tech_self == Some(false) {
                return locked("zablokowana — nie zbadano technologii Wymiana");
            }
            if ctx.has_trade_tech_other == Some(false) {
                return locked("zablokowana — partner nie zbadał technologii Wymiana");
            }
            if !ctx.has_trade_connection {
                return locked("brak możliwego połączenia handlowego (ląd lub porty)");
            }
            relacja_gate(ctx.prog_handel_relacja, ctx.rel_total)
                .unwrap_or_else(|| open("szlaki handlowe, +1 Zaufanie/turę"))
        }
        "14" => {
            if ctx.at_war {
                return locked("handel niedostępny w wojnie");
            }
            if ctx.has_wymiana {
                return active("już zawarta");
            }
            relacja_gate(ctx.prog_handel_relacja, ctx.rel_total)
                .unwrap_or_else(|| open("koszyk towarów jednorazowo / co turę"))
        }
        "6" => {
            if let Some(g) = dual(
                ctx.rel_total,
                ctx.zaufanie,
                ctx.prog_handel_relacja,
                ctx.prog_wymiana_tech_zaufanie,
            ) {
                return g;
            }
            if ctx.sellable_tech_count == 0.0 && ctx.buyable_tech_count == 0.0 {
                return locked("zablokowana — brak technologii do wymiany");
            }
            open("")
        }
        "7" => {
            if let Some(g) = zaufanie_gate(ctx.prog_namow_wojne_zaufanie, ctx.zaufanie) {
                return g;
            }
            if ctx.known_rivals_count == 0.0 {
                return locked("zablokowana — brak znanych celów wojny");
            }
            open("")
        }
        "8" => {
            // Web: w wojnie tylko oferta reparacji za pokój — zawsze dostępna.
            if ctx.at_war {
                return open("oferta reparacji za pokój");
            }
            respekt_gate(ctx.prog_trybut_zadanie_min_respekt, ctx.respekt)
                .unwrap_or_else(|| open(""))
        }
        "9" => {
            if ctx.at_war {
                return locked("zablokowane — wymaga pokoju (trwa wojna)");
            }
            open("")
        }
        "10" => {
            if !ctx.at_war {
                return locked("niedostępna — nie trwa wojna");
            }
            open("")
        }
        "11" => {
            if ctx.at_war {
                return locked("już w stanie wojny");
            }
            if let Some(label) = &ctx.breaks_treaty_label {
                return open(&format!("zrywa {label}"));
            }
            open("")
        }
        "12" => {
            if ctx.at_war {
                return locked("zablokowana — trwa wojna");
            }
            respekt_gate(ctx.prog_wasalizacja_respekt, ctx.respekt).unwrap_or_else(|| open(""))
        }
        "15" => {
            if ctx.at_war {
                return locked("zablokowana — trwa wojna");
            }
            if !ctx.is_city_state_partner {
                return locked("zablokowana — tylko miasta-państwa");
            }
            if !ctx.has_wasal {
                return locked("zablokowana — brak aktywnej wasalizacji");
            }
            let min_age = ctx.gracz_wchloniecie_po_wasalu_tur.unwrap_or(10.0);
            let age = ctx.wasal_age_turns.unwrap_or(0.0);
            if age < min_age {
                let remain = min_age - age;
                return locked(&format!(
                    "zablokowana — wasal musi trwać ≥ {} tur (pozostało {})",
                    js_num(min_age),
                    js_num(remain)
                ));
            }
            let wch_respekt = ctx.prog_wchloniecie_respekt.unwrap_or(90.0);
            respekt_gate(wch_respekt, ctx.respekt)
                .unwrap_or_else(|| open("jednorazowa opłata ¤ + zgoda wasala"))
        }
        "13" => {
            if ctx.at_war {
                return locked("dar niedostępny w wojnie");
            }
            relacja_gate(ctx.prog_dar_relacja, ctx.rel_total).unwrap_or_else(|| open(""))
        }
        _ => open(""),
    }
}
