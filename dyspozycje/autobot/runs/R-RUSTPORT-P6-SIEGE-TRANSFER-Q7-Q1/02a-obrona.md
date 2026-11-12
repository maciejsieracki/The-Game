STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q7-Q1
GOAL: obrona Operatora R1 wobec zarzutów Evaluatora (d558c7c92): każdy zarzut przyjęty (poprawka + dowód) albo odrzucony (dowód).
ZMIANY/COMMIT: poprawka na bazie 791fcf47c (worktree detached), jeden commit obrony R1 (SHA w odpowiedzi orkiestratora, lokalnie, bez push). Allowlista zachowana: rust-port/engine/src/domain/siege_transfer.rs (zmieniony). Cargo.lock NIE dodany do commita (wygenerowany przez cargo, niezacommitowany).
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib: 48 passed, EXIT 0; cargo test --test p6_siege_transfer --test p6_siege_transfer_effects --test p6_siege_transfer_effects_q4 --test p6_siege_transfer_q5 --test p6_siege_transfer_prod --test p6_siege_surrender --test p6_siege_capital_plunder --test p6_siege_capture_events: EXIT 0, wyniki 3, 3, 10, 2, 4, 12, 5, 6 passed (0 failed). Asercje Q3-Q6 bez zmian. Bramki uruchomione po poprawce, CARGO_TARGET_DIR poza repo (usunięty po bramkach).
BLOKADY: brak blokad technicznych. Push NIE wykonany (zgodnie z dispatchem; commit lokalny w worktree).
RUNDY: 1/5 (obrona Operatora).
NASTĘPNY KROK: Evaluator R2 na nowym SHA obrony (zarzuty 1 i 3 przyjęte; 2 i 4 odrzucone z dowodem; 5 i 6 informacyjne). Decyzja orkiestratora o bazie (zarzut 5) pozostaje po jego stronie.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1 (niski) recordCivElimEvent w TRANSFER_EFFECTS: PRZYJMUJĘ

Dowód z pina 07d2fbd72 (`gra/src/main.ts`): `recordCivElimEvent` wołane jest w liniach 35336 (wchłonięcie) i 35767 (podbój ofiary-AI). Zakres galezi Transfer to 17646-17893, a w nim jest tylko `recordCityCaptureEvent` (linia 17848). Wpis w tabeli galezi Transfer był więc błędny co do pokrycia.

Poprawka (`siege_transfer.rs`):
- usunięto wpis `("recordCivElimEvent", Ported(...))` z `TRANSFER_EFFECTS`;
- dodano komentarz z liniami pina 35336/35767 i wskazaniem portu `siege_capture_events::CaptureEventStore::record_civ_elim_event` (wolajacy poza galezia, zalezny od W8);
- z opisu `apply_transfer` usunięto `recordCivElimEvent` z listy „Ported-niepodpiete" w tabeli.

Bezpieczeństwo zmiany: `recordCivElimEvent` nie występuje w wektorach `p6_siege_transfer_*` (grep po `tests/` znajduje go tylko w plunder i capture_events), więc test pokrycia `p6_siege_transfer.rs` (linia ~388, sprawdzający wołania z wektorów) nie traci żadnego wiersza. Port `record_civ_elim_event` i jego wektory zostają w `p6_siege_capture_events`.

### Zarzut 2 (niski) stale komentarze poza allowlistą: ODRZUCAM w tym temacie, PRZYJMUJĘ jako dług

- `rust-port/engine/src/domain/siege_surrender.rs` (tabela w komentarzu, w 791fcf47c linia 37 - Evaluator podał :40) nadal podaje `recordCityCaptureEvent` jako BRAK. Zgadzam się, że jest nieaktualny. Plik NIE należy do allowlisty tematu (allowlista: `siege_transfer*.rs`, `siege_capture_events.rs`, `siege_wonder_*.rs`, `mod.rs`, testy P6 siege transfer/capture). Zmiana wymagałaby naruszenia allowlisty, czyli FAIL wg dispatchu. Do osobnego tematu: aktualizacja tabeli w `siege_surrender.rs`.
- `rust-port/engine/src/domain/siege_capital_plunder.rs` (linie 19, 584, 662, 714): komentarze i wpisy tabeli plundera opisują `recordCityCaptureEvent`/`recordCivElimEvent` jako wołania po stronie wołającego, zgodnie z pinem (wektory plundera zawierają `recordCivElimEvent` w `calls`). Plik poza allowlistą. Nie ma błędu merytorycznego; brak wskazania nowego store to dług, ujęty w tym samym osobnym temacie.

### Zarzut 3 (niski) pole spectacle pominięte: PRZYJMUJĘ (doprecyzowanie)

Status `Ported` dotyczy logiki store, nie karty ELIMINACJA w całości. Granica była wprawdzie w kodzie, ale napis tabeli sugerował pełne pokrycie. Poprawka w `siege_transfer.rs`: wpis `recordCityCaptureEvent` ma teraz w statusie „logika store bez pola spectacle - W8", a w komentarzu: „Pole `spectacle` NIE jest portowane (wektory maja mape pusta); zaleznosc W8".

Dowód granicy z generatora (`tests/p6_siege_capture_events_gen.mjs`, linia 11 i linia 196 `boundary`): `eliminationSpectacleByLabel` jest zawsze pusta, pole `spectacle` nieobecne we wszystkich wektorach. To jawna granica, nie cichy stub.

### Zarzut 4 (niski) test helperów na wartościach ręcznych: ODRZUCAM (dowód)

Test `report_line_helpers_match_pin_on_gain_and_loss_rows` jest testem jednostkowym dodatkowym. Bramką wektorową jest `capture_events_match_pin_step_by_step`, a helpery są pokryte wektorami pośrednio, przez pola, które porównuje:
- `subtitle` wpisu `war_event_log` (`card_subtitle`, `siege_capture_events.rs`, linie ~203-255) jest zbudowany z `capture_report_short_line` (linia 203). Wektory z pina mają 136 wystąpień pola `subtitle` (`p6_siege_capture_events_vectors/vectors.json`).
- `rows` (`mirror_capture_report_rows_for_victim`, linia 118) są porównywane po `value` i `tone` w wektorach z pina (61 wystąpień `rows`, 182 `value`).
Wartości ręczne w teście NIE zostały w tej rundzie zweryfikowane wektorem z pina (uczciwie: NIE_ZMIERZONO bezpośrednio). Nie oslabia to bramki, bo bramka wektorowa przechodzi i pokrywa ścieżkę helperów.

### Zarzut 5 (informacja) baza fc45c4797 nie jest przodkiem parity-v2: INFORMACJA, bez zmian

Potwierdzone: `git merge-base --is-ancestor fc45c4797 258afaf8f` → exit 1 (nie jest przodkiem). Dispatch (`00-dispatch.md`) wskazywał bazę fc45c4797 (FC Q6), a zadanie z kontekstu wskazywało origin/rust-port/parity-v2. Commit został zrobiony na bazie z dispatchu. Decyzja, czy integrować z Q3-Q6 razem z Q7, należy do orkiestratora. W tym temacie baza NIE została zmieniona.

### Zarzut 6 (informacja) brak beginWonderTransferWatch / settleWonderTransfer: INFORMACJA, potwierdzone

Grep w `rust-port/engine/src` na 791fcf47c: nazwy występują tylko w komentarzach/tabeli: `siege_transfer.rs:56` (`EffectStatus::Missing`), `:81-82` (komentarz i `Missing`), `:304`, `:376`, oraz w komentarzu `siege_surrender.rs:37`. Brak planera cudów i snapshotu w Rust. Zostaje BRAK z dowodem grep i planem klocków w raporcie operatora. Bez zmian.
