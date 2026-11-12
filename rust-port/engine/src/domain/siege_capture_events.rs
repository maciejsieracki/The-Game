//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q7-Q1: event store zdarzen przejecia miasta i eliminacji cywilizacji.
//!
//! Port 1:1 (logika zapisu) z pinu webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75:
//! * `gra/src/main.ts:10583` `recordCivElimEvent` (karta `elim-cs-*` + `civElimEventDetails`),
//! * `gra/src/main.ts:10650` `recordCityCaptureEvent` (karta `capture-*` + `cityCaptureEventDetails`),
//! * `gra/src/main.ts:1897` `captureReportShortLine`, `:1889` `captureReportOneLine`,
//!   `:1917` `mirrorCaptureReportRowsForVictim`,
//! * `gra/src/game/retained-side-panel-events.ts` `trimSidePanelEventLog` (limit 8, kasuje szczegóły wyrzuconych kart).
//!
//! Wektory: `tests/p6_siege_capture_events_vectors/vectors.json` (generator `tests/p6_siege_capture_events_gen.mjs`
//! wykonuje funkcje pinu w node; testy `tests/p6_siege_capture_events.rs`).
//!
//! Granice jawne (NIE_ZMIERZONO po stronie Rust, wejscia wolajacego):
//! * `eliminationSpectacleByLabel` (pole `spectacle` karty eliminacji) - brak w tym porcie;
//! * `refreshD1bHud` i `markCityStateDirty` - efekt UI, zliczany jako licznik `hud_refreshes` (bez wartosci domenowej);
//! * `turn` - wejscie wolajacego ([`CaptureEventStore::turn`]);
//! * `civLabelForOwner`, `buildCityCaptureReportRows` - leza po stronie wolajacego (wiersze przychodza gotowe).

use std::collections::BTreeMap;

/// Web `CITY_CAPTURE_EVENT_PREFIX` (karta zdobycia/utraty miasta).
pub const CITY_CAPTURE_EVENT_PREFIX: &str = "capture-";
/// Web prefiks kart eliminacji cywilizacji (`elim-cs-${turn}-${csOwnerId}`).
pub const CIV_ELIM_EVENT_PREFIX: &str = "elim-cs-";
/// Web `trimWarEventLog` -> `trimSidePanelEventLog(warEventLog, 8, ...)`.
pub const WAR_EVENT_LOG_MAX_ENTRIES: usize = 8;

/// Wiersz raportu zdobycia (web `CaptureReportRow`). `tone`/`group` opcjonalne jak w TS.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureRow {
    pub label: String,
    pub value: String,
    /// `'gain' | 'loss' | 'info'` (web), `None` = pole nieobecne.
    pub tone: Option<String>,
    /// `'przejete' | 'lup' | 'strata'` (web), `None` = pole nieobecne.
    pub group: Option<String>,
}

/// Wpis `SidePanelEvent` z `warEventLog` (tylko pola zapisywane przez te funkcje).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SidePanelEvent {
    pub id: String,
    pub icon: String,
    pub title: String,
    pub subtitle: String,
    pub kind: String,
    pub negative: bool,
    pub turn_created: i64,
}

/// Web `civElimEventDetails` (wartosc): `{ civLabel, details, cause }`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CivElimDetails {
    pub civ_label: String,
    pub details: String,
    pub cause: String,
}

/// Web `cityCaptureEventDetails` (wartosc) bez pola `spectacle` (granica jawna, patrz nagłówek).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CityCaptureDetails {
    pub title: String,
    pub city_name: String,
    pub subtitle: String,
    pub rows: Vec<CaptureRow>,
    pub rows_title: String,
}

/// Argumenty web `recordCityCaptureEvent(args)`.
#[derive(Debug, Clone, PartialEq)]
pub struct CityCaptureArgs<'a> {
    pub city_id: &'a str,
    pub city_name: &'a str,
    pub old_owner: i64,
    pub new_owner: i64,
    pub rows: &'a [CaptureRow],
    pub victim_label: &'a str,
    pub captor_label: &'a str,
    /// Web `eliminatedCivLabel` (`None` = `null`/brak).
    pub eliminated_civ_label: Option<&'a str>,
}

/// Stan domkniecia web, ktory zapisuja rejestratory: `turn`, `warEventLog`, obie mapy szczegolow.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CaptureEventStore {
    /// Web `turn` (wejscie wolajacego).
    pub turn: i64,
    /// Web `warEventLog` (najnowszy na poczatku, jak `unshift`).
    pub war_event_log: Vec<SidePanelEvent>,
    /// Web `civElimEventDetails` (klucz = id karty).
    pub civ_elim_details: BTreeMap<String, CivElimDetails>,
    /// Web `cityCaptureEventDetails` (klucz = id karty).
    pub city_capture_details: BTreeMap<String, CityCaptureDetails>,
    /// Liczba wywolan `refreshD1bHud` (efekt UI, tylko licznik).
    pub hud_refreshes: u64,
}

/// Web `captureReportOneLine(rows)`: `label: value` połączone ` · ` (U+00B7).
pub fn capture_report_one_line(rows: &[CaptureRow]) -> String {
    rows.iter()
        .map(|r| format!("{}: {}", r.label, r.value))
        .collect::<Vec<_>>()
        .join(" \u{00b7} ")
}

/// Web `captureReportShortLine(rows)` = `captureReportOneLine(rows.filter(group === 'lup'))`.
pub fn capture_report_short_line(rows: &[CaptureRow]) -> String {
    let lup: Vec<CaptureRow> = rows
        .iter()
        .filter(|r| r.group.as_deref() == Some("lup"))
        .cloned()
        .collect();
    capture_report_one_line(&lup)
}

/// Web `mirrorCaptureReportRowsForVictim(rows)`: `tone === 'gain'` i wartosc zaczynajaca sie od `+`
/// -> `tone = 'loss'`, znak `+` zamieniony na U+2212. Pozostale wiersze bez zmian (kopia).
pub fn mirror_capture_report_rows_for_victim(rows: &[CaptureRow]) -> Vec<CaptureRow> {
    rows.iter()
        .map(|r| {
            if r.tone.as_deref() == Some("gain") && r.value.starts_with('+') {
                CaptureRow {
                    label: r.label.clone(),
                    value: format!("\u{2212}{}", &r.value[1..]),
                    tone: Some("loss".to_string()),
                    group: r.group.clone(),
                }
            } else {
                r.clone()
            }
        })
        .collect()
}

impl CaptureEventStore {
    /// Web `recordCivElimEvent(csOwnerId, civLabel, details, cause = 'dyplomacja')`.
    ///
    /// Brak deduplikacji (jak web): ponowne wywolanie z tym samym id dopisuje drugi wpis do logu
    /// i NADPISUJE szczegoly pod tym id.
    pub fn record_civ_elim_event(
        &mut self,
        cs_owner_id: i64,
        civ_label: &str,
        details: &str,
        cause: Option<&str>,
    ) {
        let cause = cause.unwrap_or("dyplomacja");
        let ev_id = format!("{CIV_ELIM_EVENT_PREFIX}{}-{cs_owner_id}", self.turn);
        self.civ_elim_details.insert(
            ev_id.clone(),
            CivElimDetails {
                civ_label: civ_label.to_string(),
                details: details.to_string(),
                cause: cause.to_string(),
            },
        );
        let subtitle = if cause == "podboj" {
            "Podbita \u{2014} kliknij po szczegóły"
        } else {
            "Wchłonięta dyplomatycznie \u{2014} kliknij po szczegóły"
        };
        self.war_event_log.insert(
            0,
            SidePanelEvent {
                id: ev_id,
                icon: "\u{1F3F4}".to_string(),
                title: format!("ELIMINACJA: {civ_label}"),
                subtitle: subtitle.to_string(),
                kind: "diplo".to_string(),
                negative: true,
                turn_created: self.turn,
            },
        );
        self.trim_war_event_log();
        self.hud_refreshes += 1; // web refreshD1bHud()
    }

    /// Web `recordCityCaptureEvent(args)`: JEDYNY rejestrator karty zdobycia miasta.
    ///
    /// Pomija przejecia AI<->AI (oba wlasciciele !== 0). Deduplikacja po kluczu
    /// `capture-<turn>-<cityId>-<oldOwner>-<newOwner>` (pierwszy zapis wygrywa).
    pub fn record_city_capture_event(&mut self, args: &CityCaptureArgs<'_>) {
        if args.old_owner != 0 && args.new_owner != 0 {
            return;
        }
        let ev_id = format!(
            "{CITY_CAPTURE_EVENT_PREFIX}{}-{}-{}-{}",
            self.turn, args.city_id, args.old_owner, args.new_owner
        );
        if self.city_capture_details.contains_key(&ev_id) {
            return;
        }

        let player_captured = args.new_owner == 0;
        // Web `const elim = args.eliminatedCivLabel ?? null;` + truthiness `elim ? ... : ...`:
        // pusty napis zachowuje sie jak brak etykiety.
        let elim: Option<&str> = args.eliminated_civ_label.filter(|s| !s.is_empty());
        let view_rows: Vec<CaptureRow> = if player_captured {
            args.rows.to_vec()
        } else {
            mirror_capture_report_rows_for_victim(args.rows)
        };
        let one_line = capture_report_short_line(&view_rows);

        let card_title = match elim {
            Some(e) => format!("ELIMINACJA: {e}"),
            None if player_captured => format!("Zdobyto miasto: {}", args.city_name),
            None => format!("Utracono miasto: {}", args.city_name),
        };
        let card_subtitle = if player_captured {
            one_line
        } else {
            format!("Przejęte przez {} \u{2014} {one_line}", args.captor_label)
        };

        let title = match elim {
            Some(_) => "ELIMINACJA!",
            None if player_captured => "Miasto zdobyte",
            None => "Miasto utracone",
        };
        let subtitle = match elim {
            Some(e) => format!("{e} \u{2014} ostatnie miasto przejęte, cywilizacja wyeliminowana"),
            None if player_captured => format!("Odebrane: {}", args.victim_label),
            None => format!("Przejęte przez {}", args.captor_label),
        };
        let rows_title = if player_captured {
            "Bilans zdobycia"
        } else {
            "Bilans straty"
        };
        self.city_capture_details.insert(
            ev_id.clone(),
            CityCaptureDetails {
                title: title.to_string(),
                city_name: args.city_name.to_string(),
                subtitle,
                rows: view_rows,
                rows_title: rows_title.to_string(),
            },
        );

        let icon = if elim.is_some() {
            "\u{1F3F4}"
        } else if player_captured {
            "\u{1F3F0}"
        } else {
            "\u{1F6A9}"
        };
        self.war_event_log.insert(
            0,
            SidePanelEvent {
                id: ev_id,
                icon: icon.to_string(),
                title: card_title,
                subtitle: card_subtitle,
                kind: if player_captured { "city" } else { "enemy" }.to_string(),
                negative: !player_captured,
                turn_created: self.turn,
            },
        );
        self.trim_war_event_log();
        self.hud_refreshes += 1; // web refreshD1bHud()
    }

    /// Web `trimWarEventLog()` -> `trimSidePanelEventLog(warEventLog, 8, owners)`: obcina ogon
    /// logu (najstarsze) i kasuje szczegoly wyrzuconych kart po prefiksie id.
    pub fn trim_war_event_log(&mut self) {
        if self.war_event_log.len() <= WAR_EVENT_LOG_MAX_ENTRIES {
            return;
        }
        let evicted = self.war_event_log.split_off(WAR_EVENT_LOG_MAX_ENTRIES);
        for ev in &evicted {
            if ev.id.starts_with(CITY_CAPTURE_EVENT_PREFIX) {
                self.city_capture_details.remove(&ev.id);
            }
            if ev.id.starts_with(CIV_ELIM_EVENT_PREFIX) {
                self.civ_elim_details.remove(&ev.id);
            }
        }
    }
}
