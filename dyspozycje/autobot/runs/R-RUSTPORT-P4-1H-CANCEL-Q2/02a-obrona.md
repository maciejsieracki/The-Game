# 02a — Obrona Operatora, R-RUSTPORT-P4-1H-CANCEL-Q2 (runda 1)

Odpowiedź na zarzuty Evaluatora r1. Raport Evaluatora: `02-evaluator.md` (commit `acf5cb55d`, nie wypchnięty).

- Baza obrony: commit Operatora r1 `d8f85f7d9`. Jego rodzicem jest `2799cdd4b`, czyli baza z dispatchu.
- Gałąź: `rust-port-wip/R-RUSTPORT-P4-1H-CANCEL-Q2-obrona-r1`, lokalna, bez pusha.
- Pin: `07d2fbd72`.

## Zarzut 1: test `attack_branch_is_observable` jest tautologiczny. PRZYJMUJĘ

Zarzut jest słuszny: test porównywał fikstur z helperem i nie wywoływał kodu produkcyjnego. Usunąłem go z
`tests/p4_1h_cancel_planned_march.rs`. Na jego miejscu jest komentarz, który wskazuje faktyczne dowody mutacji:
test (a) `a_no_force_keeps_attack_plan_byte_for_byte` oraz moduł `playable.rs::cancel_planned_march_game_tests`.

Dowód, że mutacja nadal jest wykrywana bez tego testu (po poprawce; patrz tabela mutacji niżej): M1 „pomiń warunek
attack” daje FAIL.

## Zarzut 2: `expected_after_delete` powtarza implementację. PRZYJMUJĘ

Usunąłem helper `expected_after_delete`, który robił `retain` i 3× `remove`. Oczekiwany stan buduje teraz
`expected_without_own()` = `build_state(None)`. To ten sam fikstur co wejście, tylko wpisów `OWN` nigdy do niego
nie wstawiono: nie ma planu w `planned_marches`, nie ma wpisu w `march_attack_targets`, `march_stop_notified` ani
`march_stop_detail`. Jednostka `OWN` nadal jest w `units`.

Oczekiwana wartość nie wywołuje już żadnej operacji usuwania, więc nie odbija kodu, który testujemy. Kolejność
pozostałych planów (`OWN_C`, `OWN_B`) wynika z kolejności wstawiania w fiksturze. To odpowiada web `Map.delete`,
który zachowuje kolejność wstawiania pozostałych kluczy. Zmiana dotyczy testów (b), (c), (c′) i drugiej części (d).

## Zarzut 3: bridge nie testuje `UnitNotOwned` ani czyszczenia planu przez `EngineCommand`. ODRZUCAM (bez zmiany kodu)

Publiczne API nie pozwala zbudować takiego przypadku w adapterze:

- `CivEngineAdapter { game: PlayableGame }` (`bridge.rs:252-254`) tworzy grę wyłącznie przez
  `PlayableGame::new(StartGameParams)`.
- Scenariusz startowy ma jedną jednostkę, ludzką (`playable.rs`, `new`: `let units = vec![PlayableUnit { id:
  STARTING_UNIT_ID, ... }]`).
- `PlayableGame.state` jest prywatne. Żadna komenda `EngineCommand` (`CreateSession`, `AddPlayer`, `SelectUnit`,
  `MoveUnit`, `AdvanceTurn`, `GetState`, `DeclareWar`) nie dodaje obcej jednostki ani planu marszu.
- Setterów `set_*` używa się tylko dla skarbca, zasobów i stanu zamiany. Żaden nie dodaje jednostek ani planów.

Gdybym dodał publiczny konstruktor testowy albo komendę, rozszerzyłbym API poza zakres dispatchu Q2. Allowlista
obejmuje tylko samą komendę. Ryzyko jest niskie, co Evaluator sam przyznaje: oba adaptery wołają tę samą funkcję
`PlayableGame::cancel_planned_march` (`bridge.rs:293-295`, `:399-403`). Logikę z planami i obcą jednostką pokrywa
`cancel_planned_march_game_tests` w `playable.rs`, gdzie stan jest dostępny.

Proponuję zapis w rejestrze, który zrobi orkiestrator: gdy temat P4-1H doda komendę tworzącą plan marszu (np.
`plan_march`), test bridge ma objąć `UnitNotOwned` i rzeczywiste czyszczenie planu przez `EngineCommand`.

## Zarzut 4: osierocony plan jednostki, której już nie ma. PRZYJMUJĘ jako wskazówkę

Zgoda co do faktów. Tak działa decyzja techniczna z `REJESTR-RUST.md` 15.11 (nieznana jednostka → `UnitNotFound`).

`REJESTR-RUST.md` nie jest na allowliście tego tematu, więc nie mogę tam pisać. Wskazówkę zapisałem w dwóch
miejscach:

1. W doc-komentarzu `PlayableState::clear_planned_march_for_unit` (`playable.rs`, plik z allowlisty). Treść:
   przyszli wołający wewnątrz silnika (rozwiązanie jednostki, nowy rozkaz, `tryLaunchMarchAttack`; web
   `main.ts:25920/25946/26013/26060/26085` @ `07d2fbd72`) mają wołać tę funkcję bezpośrednio i PRZED usunięciem
   jednostki z `units`, bo komenda dla nieistniejącej jednostki zwraca `UnitNotFound`.
2. Tutaj. Orkiestrator powinien przenieść tę wskazówkę do `REJESTR-RUST.md` przy integracji.

## Zarzut 5: brak wołającego (deselect RMB/Esc z `force=false`, przycisk Stop z `force=true`). ODRZUCAM jako defekt tej rundy

Evaluator sam kwalifikuje to jako zadeklarowaną zależność. Dispatch Q2 obejmuje wyłącznie komendę i adaptery.
Wołających rozpoznanie P4-1H przypisuje do osobnych tematów. Zostają one na liście P4-1H (#217).

## Tabela mutacji po poprawce (wszystkie cofnięte, `cmp` = RESTORED)

Uruchomienie: `cargo test --test p4_1h_cancel_planned_march`, 12 testów.

| Mutacja w `clear_planned_march_for_unit` | Wynik |
|---|---|
| M1: pomiń warunek attack (`if false && !force …`) | FAIL, 1 test (a) |
| M2: ignoruj `force` (`if true && …`) | FAIL, 2 testy |
| M3: nie usuwaj `march_stop_detail` | FAIL, 4 testy |
| M4: nie usuwaj `march_attack_targets` | FAIL, 1 test |

M4 jest nowa: helper z lustrem implementacji ukrywał ten przypadek mniej czytelnie. Teraz wykrywa go niezależny
oczekiwany stan w (c).

## Bramki (`rust-port/engine`; `CARGO_TARGET_DIR` w unikalnym katalogu poza repo, potem usunięty)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_1h_cancel_planned_march`: EXIT 0, 12 passed (było 13; usunięto test tautologiczny)
- `cargo test --all-targets --no-fail-fast`: zobacz sekcję „Pełny test” niżej
- `git diff --check`: czysto. Nie dodano żadnego `#[ignore]`. `Cargo.lock` nie jest commitowany.

## Pliki zmienione w obronie (wszystkie z allowlisty)

- `rust-port/engine/tests/p4_1h_cancel_planned_march.rs`
- `rust-port/engine/src/domain/playable.rs` (tylko doc-komentarz)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/02a-obrona.md`

## Kontrakt raportu

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-CANCEL-Q2
GOAL: `cancel_planned_march` 1:1 z `clearPlannedMarch(unitId, force)` (`main.ts:31051-31056` @ `07d2fbd72`) i `EngineCommand::CancelPlannedMarch`
ZMIANY/COMMIT: zobacz SHA w wyniku obrony (gałąź `rust-port-wip/R-RUSTPORT-P4-1H-CANCEL-Q2-obrona-r1`)
TESTY: jak wyżej
BLOKADY: brak. Zarzut 3 czeka na przyszłą komendę tworzącą plan. Zarzut 4: wpis do `REJESTR-RUST.md` należy do orkiestratora.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
