STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1
GOAL: (1) pierwszy klocek planu Q7 dla beginWonderTransferWatch/settleWonderTransfer jako czysty modul siege_wonder_watch.rs (rdzen: snapshotWonderTerritoryOwners, planWonderTransfers, applyWonderTransfers, isCivilizationOwnerId) z wektorami z pinu; (2) komentarze siege_surrender.rs:40 i siege_capital_plunder.rs (wskazanie store siege_capture_events.rs), bez zmiany logiki; (3) wrapper watch/settle pozostaje BRAK z dowodem.
BAZA: fd8e8766e (FC Q7, galaz origin rust-port-wip/SIEGE-TRANSFER-Q7-fc) zgodnie z dispatchem. Pin webu: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt; gra/src/game/wonder-transfer.ts wyciety przez git show do scratchpad, poza repo).
ZMIANY/COMMIT (allowlista):
  - rust-port/engine/src/domain/siege_wonder_watch.rs (NOWY): TransferableWonder, WonderTransfer, WonderTerritorySnapshot (BTreeMap; brak klucza = undefined, None = null), is_civilization_owner_id, snapshot_wonder_territory_owners(wonders, territory_owner_at), plan_wonder_transfers(wonders, before, after), apply_wonder_transfers(wonders, plan). Wejscia jawne, bez stanu gry.
  - rust-port/engine/src/domain/mod.rs: rejestracja `pub mod siege_wonder_watch;` (+1 linia).
  - rust-port/engine/tests/p6_siege_wonder_watch.rs (NOWY): 5 testow (liczby wektorow, is_civilization, plan vs pin, apply vs pin, chain snapshot->plan->apply vs pin).
  - rust-port/engine/tests/p6_siege_wonder_watch_gen.mjs (NOWY): generator; wykonuje plik pinu w node (stripTypeScriptTypes); wyczerpujaco dla 1 cudu (owner x before x after, brak klucza/null/wartosc), apply (niespojny from, duplikaty), chain (LCG, 80 przebiegow).
  - rust-port/engine/tests/p6_siege_wonder_watch_vectors/vectors.json (NOWY): plan 246, apply 4, chain 80 (razem 330); md5 195fdf496d3fab5d9c7c4a97819209e2; 90902 bajtow.
  - rust-port/engine/src/domain/siege_surrender.rs: TYLKO komentarze tabeli (wiersz recordCityCaptureEvent -> PORT, wskazanie CaptureEventStore::record_city_capture_event (Q7); wiersz beginWonderTransferWatch/settleWonderTransfer -> wrapper BRAK, rdzen w siege_wonder_watch).
  - rust-port/engine/src/domain/siege_capital_plunder.rs: komentarz naglowka (store CaptureEventStore) + trzy komentarze `//` nad literalami ui_call "recordCityCaptureEvent" (x2) i "recordCivElimEvent" (x1). Same literaly NIE zmienione.
  - rust-port/engine/src/domain/siege_transfer.rs: TYLKO komentarze przy wpisach tabeli beginWonderTransferWatch/settleWonderTransfer (statusy EffectStatus::Missing bez zmian).
  - Nietkniete: gra/**, WERSJE.md, Cargo.toml, origin/main, rust-port/parity-v2. Cargo.lock (wygenerowany lokalnie, nieśledzony) NIE dodany do commita.
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0 (rustfmt na dwoch nowych plikach Rust).
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --lib: 48 passed, 0 failed.
  - cargo test --test p6_siege_transfer (2), p6_siege_transfer_effects (4), p6_siege_transfer_effects_q4 (12), p6_siege_transfer_prod (5), p6_siege_transfer_q5 (6), p6_siege_surrender (10), p6_siege_capital_plunder (3), p6_siege_capture_events (3): wszystkie passed, asercje bez zmian.
  - cargo test --test p6_siege_wonder_watch: 5 passed (plan 246 + apply 4 + chain 80 przypadkow vs pin).
  - Asercje Q3-Q7 i lista Missing w tests/p6_siege_transfer.rs: BEZ ZMIAN (beginWonderTransferWatch/settleWonderTransfer nadal Missing).
DOWOD BRAKU (wrapper): w pinie beginWonderTransferWatch/settleWonderTransfer sa w gra/src/main.ts (efekty UI showWonderCompletedNoticeDeferred, syncWonderRender); w Rust brak odpowiednikow: grep "beginWonderTransferWatch|settleWonderTransfer|WonderTransferWatch" w rust-port/engine/src daje tylko komentarze i wpisy tabeli Missing.
BLOKADY:
  - Wrapper beginWonderTransferWatch / settleWonderTransfer: BRAK (zostaje Missing) - wymaga stanu gry (snapshot terytorium hexow cudow z territoryOwnerAt, zapis ownerId z main.ts) i efektow UI; osobny temat po W8 (wiring w produkcji).
  - Efekty UI (showWonderCompletedNoticeDeferred, syncWonderRender) nieportowane.
  - Rozjazd bazy: zadanie wskazywalo origin/rust-port/parity-v2 (f207ea6b1 lub nowszy); dispatch wskazuje fd8e8766e. Sprawdzone: fd8e8766e NIE jest na parity-v2 i zawiera Q7 (siege_capture_events.rs, p6_siege_capture_events*); bez tego komentarze i tabele nie maja celu. Wybrano fd8e8766e (dispatch). Do rozstrzygniecia przez orkiestratora.
  - Dysk po bramkach: ok. 14 GB wolnego (df /).
  - Nie wykonano: push, integracja, deploy (zakaz dla Operatora).
RUNDY: 1/5 (Operator)
NASTEPNY KROK: Evaluator (Sonnet) na commicie operatora: ponowne bramki w swoim worktree; nastepnie Final Control.
DEPLOY/PUSH: NIE WYKONANO push i deploy. Commit lokalny na galezi rust-port-wip/SIEGE-TRANSFER-Q8-Q1 (SHA w odpowiedzi orkiestratorowi).
