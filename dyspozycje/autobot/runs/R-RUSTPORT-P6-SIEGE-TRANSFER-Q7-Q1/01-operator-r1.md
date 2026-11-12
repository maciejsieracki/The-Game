STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q7-Q1
GOAL: z 3 pozycji BRAK w TRANSFER_EFFECTS (siege_transfer*.rs): (1) recordCityCaptureEvent i recordCivElimEvent -> port event store (siege_capture_events.rs) z wektorami z pinu; (2) beginWonderTransferWatch / settleWonderTransfer -> BRAK z dowodem grep (brak planera cudow w Rust). Kryteria: (1) >=1 Ported z wektorami pinu; (2) reszta BRAK z grep; (3) asercje Q3-Q6 bez zmian poza lista Missing; (4) bramki zielone; (5) brak cichych stubow.
BAZA: fc45c4797 (FC Q6, galaz origin rust-port-wip/SIEGE-TRANSFER-Q6-fc), zgodnie z dispatchem. UWAGA ROZJAZD: zadanie wskazywalo origin/rust-port/parity-v2 (f207ea6b1 lub nowszy). Sprawdzone: fc45c4797 NIE jest przodkiem origin/rust-port/parity-v2 (258afaf8f), a parity-v2 nie ma siege_transfer_q5.rs ani siege_capital_plunder.rs, na ktorych stoja asercje Q3-Q6. Wybrano baze z dispatchu. Pin webu: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt).
ZMIANY/COMMIT:
  - rust-port/engine/src/domain/siege_capture_events.rs (NOWY): CaptureEventStore, record_city_capture_event, record_civ_elim_event, trim_war_event_log (limit 8, kasowanie szczegolow po prefiksie), capture_report_one_line / capture_report_short_line / mirror_capture_report_rows_for_victim.
  - rust-port/engine/src/domain/mod.rs: rejestracja modulu (+1 linia).
  - rust-port/engine/src/domain/siege_transfer.rs: recordCityCaptureEvent BRAK -> Ported; recordCivElimEvent dopisany jako Ported; komentarz listy BRAK w apply_transfer zaktualizowany.
  - rust-port/engine/tests/p6_siege_transfer.rs: TYLKO lista Missing (usunieto recordCityCaptureEvent). Reszta asercji bez zmian (git diff: 7 linii).
  - rust-port/engine/tests/p6_siege_capture_events.rs (NOWY): 3 testy (krok po kroku vs pin, helpery raportu, AI<->AI bez zmian).
  - rust-port/engine/tests/p6_siege_capture_events_gen.mjs (NOWY): generator wektorow (wycina funkcje z pinu, wykonuje w node przez stripTypeScriptTypes).
  - rust-port/engine/tests/p6_siege_capture_events_vectors/vectors.json (NOWY): 7 scenariuszy, 30+ krokow; md5 d3d1bd5d1af1f5c34a9dedf2bc93513b.
  - Cargo.toml / Cargo.lock / gra/ / WERSJE.md: nietkniete.
  - COMMIT: SHA w sekcji DEPLOY/PUSH (commit na galezi rust-port-wip/SIEGE-TRANSFER-Q7-Q1).
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0 (po rustfmt na zmienionych plikach).
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (ponownie EXIT 0 po ostatniej zmianie komentarza).
  - cargo test --lib: 48 passed, 0 failed.
  - p6_siege_capture_events: 3 passed (nowe).
  - p6_siege_transfer 2, p6_siege_transfer_effects 4, p6_siege_transfer_effects_q4 12, p6_siege_transfer_prod 5, p6_siege_transfer_q5 6, p6_siege_surrender 10, p6_siege_capital_plunder 3: wszystkie passed.
  - git diff --check: czysty.
  - Asercje Q3-Q6: bez zmian poza lista Missing.
  - Dowod grep BRAK (beginWonderTransferWatch / settleWonderTransfer): `git grep -n "planWonderTransfers|applyWonderTransfers|snapshotWonderTerritoryOwners|wonder_transfer|WonderTerritory" -- rust-port/engine/src` daje tylko komentarz w siege_transfer.rs:54. Pin: planer i snapshot sa w gra/src/game/wonder-transfer.ts (osobny plik), watch w gra/src/main.ts:4230-4250.
DECYZJA PORTU:
  - recordCityCaptureEvent: PORTED z wektorami (store, dedup po parze wlascicieli, lustro wierszy dla ofiary-gracza, trim 8, licznik HUD). Granice jawne: eliminationSpectacleByLabel (pole spectacle nieobecne w wektorach), refreshD1bHud jako licznik, turn jako wejscie.
  - recordCivElimEvent: PORTED z wektorami (karta elim-cs-*, cause 'dyplomacja'/'podboj', nadpisanie szczegolow przy duplikacie id - jak web).
  - Podpiecie w apply_transfer: NIE wykonane (zaleznosc W8).
BLOKADY:
  - beginWonderTransferWatch / settleWonderTransfer: BRAK. Brak planera/snapshotu cudow w Rust (grep wyzej). Plan klockow: (a) snapshot wlasnosci terytorium hexow cudow (territoryOwnerAt/buildAllTerritoryNodes, wejscia jawne); (b) planWonderTransfers(wonders, before, after) -> lista transferow; (c) applyWonderTransfers (zmiana ownerId + bonusy); (d) wrapper watch/settle z wejsciem excludeNewCity; (e) efekty UI (showWonderCompletedNoticeDeferred, syncWonderRender) jako ui_calls. Osobny temat, zalezny od W8 (wiring w produkcji).
  - Stale komentarz poza allowlista: rust-port/engine/src/domain/siege_surrender.rs:40 (tabela) nadal ma recordCityCaptureEvent jako "brak nazwy w src". NIE zmieniano (plik poza allowlista). Do poprawy w osobnym temacie.
  - Rozjazd bazy dispatch vs zadanie (patrz BAZA) - do rozstrzygniecia przez orkiestratora.
  - Nie wykonano: push do rust-port/parity-v2 (zakaz), integracja, deploy.
RUNDY: 1/5 (Operator)
NASTEPNY KROK: Evaluator (Sonnet) na commicie operatora + ponowne bramki w swoim worktree; Final Control po werdykcie.
DEPLOY/PUSH: NIE WYKONANO deploy. Commit lokalny na rust-port-wip/SIEGE-TRANSFER-Q7-Q1 (SHA ponizej); push tylko tej galezi roboczej.
