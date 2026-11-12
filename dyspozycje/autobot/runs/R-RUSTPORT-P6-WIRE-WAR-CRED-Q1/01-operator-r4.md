STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-CRED-Q1
GOAL: rejestr wiarygodnosci (appendCredibilityEvent, strumienie S1-S4, P4), D2 zapisuje do rejestru, D4 wpiete; wektory z pinu
RUNDY: 4/5 (nazwa raportu wg polecenia orkiestratora: 01-operator-r4.md)
BAZA: fb7ac73d1 (potomek 8ae77223f), pin web 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt)

## 1. Pomiar modelu na pinie (plik:linia, `gra/src/`)
- `game/diplomacy-credibility.ts`: `CredibilityEvent` :67-85, `CredibilityEventRecord` :113, `appendCredibilityEvent` :131,
  `wartoscBiezaca` :187, `sumaWiarygodnosci` :207, `CredibilityStreamEvent` :245, `CredibilityStreamEntry` :275,
  `credibilityStreamWeight` :290, `sumaStrumienia` :318, `freshCredibilityStreamEntry` :327, `tickCredibilityStreamEntry` :340,
  `sumaWiarygodnosciCalkowita` :362, `wiarygodnoscBand` :50, `wiarygodnoscStartowa` :72.
- `main.ts` (domkniecie): mapy per wlasciciel :9976-9992 (`wiarygodnoscZdarzeniaByOwner`, `...StrumienByOwner`,
  `...OstatniaWojnaTuraByOwner`, `...P4MilestonesByOwner`), `getWiarygodnoscEvents` :12002, `appendWiarygodnoscEvent` :12012,
  `getWiarygodnosc` :12029, `wiarygodnoscStreamKey` :12041, `tickWiarygodnoscStreamFor` :12045, `tickWiarygodnoscBezWojnyMilestone` :12058,
  `updateWiarygodnoscStreamsThisTurn` :24184, D2 w `runDiplomacyTurnTick` :24233-24270, wolanie D4 :24272-24273, `allWiarygodnoscOwnerIds` :12143,
  zapis :37348-37354, odczyt :47222-47244, hak wojny P4 :12223-12224.
- Kolejnosc na pinie: D2 (petla wygasniec) -> tickCyclic (D3) -> updateStreams -> P4 -> tickTruceExpiries (D5). Rust wpiety identycznie.

## 2. Port (nowy `rust-port/engine/src/domain/credibility.rs`)
Typy: `CredibilityEvent` (15), `EventSign`, `CredibilityEventRecord`, `CredibilityStreamEvent` (4), `CredibilityStreamEntry`,
`CredibilityParams` (z `diplomacy.json`), `CredibilityRegistry` (jawny stan; mapy JS jako `Vec<(K,V)>` - zachowana kolejnosc wstawiania).
Funkcje: `append_credibility_event`, `current_value`, `credibility_sum`, `credibility_total`, `credibility_band`, `credibility_start`,
`stream_weight`, `stream_sum`, `fresh_stream_entry`, `tick_stream_entry`, `expiry_finish_events` (D2), `stream_active_tuples` (D4 cz.1),
`CredibilityRegistry::{append_event, update_streams_this_turn, tick_no_war_milestone, note_war_entered, total_of, from_meta, store_changes}`.

## 3. Zapis / zgodnosc wsteczna
Odstepstwo od dyspozycji (jawne): NIE dodano nowego pola z `#[serde(default)]`. Klucze `meta.wiarygodnosc*` sa JUZ w formacie zapisu
(`DIPLOMACY_RAW_META_KEYS`, `WarTurnState.opaque`), wiec rejestr uzywa tych samych kluczy co web: zapis sprzed zmiany (bez kluczy) = pusty
rejestr, zapis weba laduje sie bez migracji, nieruszone klucze zachowuja oryginalny JSON (zapis tylko klucza, ktory sie zmienil).
Dodano klucz `wiarygodnoscP4MilestonesByOwner` do `DIPLOMACY_RAW_META_KEYS` (24 -> 25; web go zapisuje :37354). Migracja NIE jest wymagana.
Zly ksztalt zapisu = `WarTurnError::DiplStep` (atomowo, bez zmian stanu), nie ciche zero.

## 4. Wpiecie (`turn_war_dipl_steps.rs`)
D2: zlecenia (P1-P3) i N6 z D3 zapisywane do rejestru (`credibility_requests` zostaje jako dziennik). D4: po D3, przed D5.
Nowe wejscia `DiplStepsInputs`: `difficulty` (domyslnie Normal = `default:` weba), `credibility_excluded_owners` (barbarzyncy, P4).

## 5. Wektory i testy (`tests/p6_credibility*.{rs,mjs}`, `tests/p6_credibility_vectors/`)
Generator wykonuje TEKST pinu: moduly `diplomacy-credibility/treaties/diplomacy/types` (esbuild bundle) oraz funkcje domkniete z `main.ts`
(wyciete po markerach, transpilowane, wykonane w fabryce ze wstrzyknietym stanem) + fragment D2 `runDiplomacyTurnTick`.
Straznik SHA-256 (6 plikow pinu). 250 przypadkow czystych + 48 sekwencji / 616 krokow; porownanie calego rejestru i wiarygodnosci
calkowitej bit-w-bit (niecalkowite f64 jako hex bitow, bo serde_json bez `float_roundtrip` myli sie o 1 ulp; Cargo.toml zakazany).
Dodatkowo: parametry Rust == pin (47), 3 tury przez `run_war_turn`, zapis->odczyt->tura, P4 w pipeline, trudnosc, bledny zapis, stary zapis (fixture).

## 6. Zmiany oczekiwan istniejacych testow
`tests/p6_wire_war_dipl_steps.rs`: tylko literal `DiplStepsInputs { .. }` dostal `..DiplStepsInputs::default()` (nowe pola). Asercji nie oslabiono.

## 7. BRAK / luki jawne
- Hak wojny P4 (`note_war_entered`, main.ts:12223) i kary N1-N7/P5: BRAK wywolan (deklaracje wojny poza krokiem D); P4 w Rust liczy od 0, dopoki wolajacy nie zapisze `OstatniaWojnaTura`.
- Wiring produkcyjny `difficulty` i barbarzyncow (producent `dipl_steps_inputs` w `turn_war_inputs.rs`, poza allowlista): dzis domyslne Normal / brak wykluczen; `StartGameParams.difficulty` jest "NOT_IMPLEMENTED".
- Legacy `umowa_handlowa` (warunkowy S3): serde scala go z `umowa_szlakow` (bezwarunkowy S3); funkcja 1:1 (`StreamDealKind::LegacyTradeAgreement`) pokryta wektorami, adapter jej nie produkuje. Web hydratuje ten rodzaj przy wczytaniu, wiec zywy stan go nie zawiera.
- `wiarygodnoscN7ActivePairs`, UI (breakdown, tooltipy), dzwignie zaufania: poza zakresem.
- Parametry z `diplomacy.json` Rust (nie z efektywnych): skalowanie trudnoscia dotyczy tylko progow bramek, wiec rowne.

## 8. Dowody
Allowlista: tylko credibility.rs (nowy), turn_war_dipl_steps.rs, war_turn_state.rs, mod.rs, tests/p6_credibility*, p6_wire_war_dipl_steps.rs, ten raport. `Cargo.lock` nie commitowany.
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -D warnings EXIT 0; cargo test --lib 60 ok EXIT 0; testy celowane (p6_credibility 15, p6_wire_war_dipl_steps 8, p6_wire_war_pipeline, p6_wire_war_inputs, p6_wire_war_diplo, p6_tickdiplo, p6_wire_war_state) wszystkie ok; pelny cargo test --no-fail-fast: FULL_EXIT=0, 410 binarek 'test result: ok', 0 FAILED (log /tmp/claude-0/full.log). df przed startem 8,7 GB (>= 8).
DEPLOY/PUSH: NIE WYKONANO
