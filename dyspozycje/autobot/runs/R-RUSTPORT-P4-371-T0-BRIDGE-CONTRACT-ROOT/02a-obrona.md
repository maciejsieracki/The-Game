# 02a-obrona — R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT (= #374)

STATUS: PASS (N1 przyjęty i poprawiony; N2–N4 poza allowlistą, przekazane jako mikrotematy)
DOMAIN: GAME (kontrakt mostu/powłoki, testy engine)
TEMAT: R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT
GOAL: kontrakt powłoki i mostu w `rust-port/engine/tests/bridge_contract.rs`, z `match` wyczerpującym po `EngineCommand` i `BridgeResult`.
BAZA obrony: commit Operatora r1 `04e786472` (rodzic `38f5939e2` = parity-v2 w chwili startu). Gałąź lokalna `op/P4-371-T0-obrona`, bez push.

## Odpowiedzi na zarzuty

### Z1 (podsumowanie bramek Evaluatora: fmt, clippy, test, pełny engine, allowlista, merge-tree)
Nie jest zarzutem, tylko potwierdzeniem. Przyjmuję do wiadomości i nie mam uwag.

### Z2 (mutanty M1, M2, M4, M5a–c zabite)
To też nie jest zarzut. Po poprawce N1 sprawdziłem ponownie M1 (tymczasowy `MutantProbe` w `EngineCommand` w `bridge.rs:78`, potem `git checkout -- rust-port/engine/src/bridge.rs`):
`error[E0004]: non-exhaustive patterns: &bridge::EngineCommand::MutantProbe not covered --> tests/bridge_contract.rs:51:11`. Błąd wskazuje nowy wyczerpujący `command_index`. M1 nadal jest zabity. `git status` po przywróceniu pokazuje zmianę tylko w pliku testu.

### N1: mutant M3 przeżywa, bo `every_command()` nie jest sprawdzany pod kątem kompletności — PRZYJMUJĘ
Poprawka jest w allowliście i dotyczy tylko `rust-port/engine/tests/bridge_contract.rs`:
- Nowa stała `COMMAND_KINDS: [&str; 11]`. Jej długość to zadeklarowana liczba wariantów `EngineCommand`, a kolejność ustala indeks.
- `command_index(&EngineCommand) -> usize` ma wyczerpujący `match` bez `_ =>`. Nowy wariant bez ramienia daje błąd kompilacji (D-371-6).
- `command_kind` = `COMMAND_KINDS[command_index(..)]`.
- Test `every_command_serializes_with_its_wire_kind_and_round_trips` sprawdza teraz:
  - indeks każdej próbki jest mniejszy niż `COMMAND_KINDS.len()`;
  - żaden indeks się nie powtarza (`duplicate sample`);
  - każdy indeks `0..11` ma próbkę, a brakujące nazwy trafiają do komunikatu (`every_command misses samples`);
  - `commands.len() == COMMAND_KINDS.len()`;
  - napisy wire w `COMMAND_KINDS` są unikalne.

  Asercja `command.kind` JSON == `command_kind` oraz round-trip zostały bez zmian.
- Nieprawdziwy komentarz „kept in sync by `command_kind`” zastąpiłem opisem faktycznej asercji kompletności.

Dowód (mutant M3: usunięta próbka `DeclareWar` z `every_command()`, plik przywrócony z kopii):
```
thread 'every_command_serializes_with_its_wire_kind_and_round_trips' panicked at tests/bridge_contract.rs:137:5:
every_command misses samples: ["declare_war"]
test result: FAILED. 0 passed; 1 failed
```
M3 jest zabity. Ograniczenie, jawnie: kompletności próbek nie da się sprawdzić w czasie kompilacji bez derive enumeracji wariantów (np. `strum`), a `Cargo.toml` jest poza allowlistą. Zostaje jeden przypadek: ktoś doda wariant z ramieniem `=> 11`, ale nie dopisze ani wpisu w `COMMAND_KINDS`, ani próbki. Taki mutant nie zostanie wykryty. Nowe ramię wymaga jednak świadomego wyboru indeksu, a komentarz przy `COMMAND_KINDS` wymienia oba wymagane kroki. Mutant z treści zarzutu (usunięcie próbki) i mutant z duplikatem próbki są zabite.

### N2: `tests/bridge_contract.cjs:307` nadal wskazuje usunięty root `tests/bridge_contract.rs` — ODRZUCAM w tym temacie (poza allowlistą), potwierdzam fakt
Potwierdzam: `tests/bridge_contract.cjs:307` ma `path.join(repository, 'tests', 'bridge_contract.rs')`. Dispatch dopuszcza tylko usunięcie root `.rs`, nowy test engine i raporty, a harness `.cjs` jest poza allowlistą. Harness był martwy już przed tematem (E0004/E0308 przy kompilacji przez rustc), więc nie ma regresji CI. To przemilczenie w raporcie r1 przyjmuję jako brak w raporcie. Proponuję orkiestratorowi mikrotemat **BRIDGE-CJS-HARNESS**: (a) przepiąć ścieżkę w `.cjs` na `rust-port/engine/tests/bridge_contract.rs` (z `--extern`/`#[path]`, tak żeby harness się kompilował) i przenieść jego sondy mutacji powłoki Tauri (rejestracja komendy i zdarzenia) do testu engine albo (b) jawnie wycofać harness. Decyzja techniczna należy do orkiestratora (REJESTR-RUST).

### N3: nieaktualne komentarze w `bridge.rs:22-24` i `:122-125` — ODRZUCAM w tym temacie (poza allowlistą), potwierdzam fakt
Potwierdzam oba miejsca. `bridge.rs:21-23` (komentarz przy `#[allow(clippy::large_enum_variant)]` dla `EngineCommand`) i `bridge.rs:122-125` (to samo dla `BridgeResult`) nadal mówią o „root `tests/bridge_contract.rs`, outside this topic's allowlist”. Dispatch: „NIE ruszaj `bridge.rs`”. Raport r1 wymienił tylko pierwsze miejsce. Ten raport uzupełnia go o drugie. Mikrotemat dokumentacyjny **BRIDGE-COMMENTS-STALE**: w obu komentarzach zamienić odwołanie na `rust-port/engine/tests/bridge_contract.rs`.

### N4: filtr `paths` w `.github/workflows/rust-engine.yml` nie obejmuje `src-tauri/**` — ODRZUCAM w tym temacie (poza allowlistą), potwierdzam fakt
Potwierdzam: `rust-engine.yml:5-11` (`pull_request` i `push`) ma tylko `rust-port/engine/**` i sam plik workflow. Test robi `include_str!("../../../src-tauri/src/lib.rs")`. Zmiana wyłącznie w `src-tauri/src/lib.rs` nie uruchomi więc CI engine. `.github/**` jest poza allowlistą. Mikrotemat **CI-ENGINE-PATHS-TAURI**: dopisać `rust-port/src-tauri/src/lib.rs` (albo `rust-port/src-tauri/**`) do obu filtrów `paths`. Przed T3 (zmiany w powłoce) wymaga decyzji orkiestratora.

## ZMIANY/COMMIT
- `rust-port/engine/tests/bridge_contract.rs`: `COMMAND_KINDS` + wyczerpujący `command_index` + asercja kompletności próbek (N1).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT/02a-obrona.md` (ten raport).
- Bez zmian w `bridge.rs`, `src-tauri/**`, `Cargo.*`, `.github/**` i `tests/*.cjs`.
- SHA: commit z tym raportem na gałęzi `op/P4-371-T0-obrona` (podany w StructuredOutput).

## TESTY (rust-port/engine; CARGO_TARGET_DIR w scratchpadzie `t0bridge/target`; INCREMENTAL=0, DEBUG=0)
| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test bridge_contract` | EXIT 0, 9 passed |
| M3 (usunięta próbka DeclareWar) | FAIL testu: `every_command misses samples: ["declare_war"]` — zabity |
| M1 (nowy wariant `MutantProbe`) | E0004 w `tests/bridge_contract.rs:51` — zabity, `bridge.rs` przywrócony |
| `cargo test --all-targets --no-fail-fast` (tło, setsid nohup) | EXIT=0; 532 binarki, 3997 passed, 0 failed, 1 ignored (istniejący wcześniej, poza tym plikiem) |
| `git diff --check` | czysty |
| `#[ignore]` w pliku | 0 |

## BLOKADY
Brak w zakresie tematu. N2–N4 przekazuję orkiestratorowi jako trzy mikrotematy poza allowlistą.

RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control (`03-final-control.md`), potem integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
