STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-8-TAURI-ADAPTER-Q1
GOAL: Katalog dzisiejszej granicy Rust↔Tauri↔frontend na `rust-port/parity-v2` (9e33fc77): komendy,
eventy, `bridge.rs`, rola JS.

RUNDY: 1/5 (Operator → Evaluator 7 zarzutów — brakująca sygnatura `engine_command`, pominięty
`ai_turn.rs` jako najbliższy odpowiednik „zarządzania automatycznego", niezaznaczone że kilka
modułów domenowych nie jest zadeklarowanych w `domain/mod.rs` [tylko ścieżki testowe], błędne
twierdzenie o eksportach `lib.rs`, nadinterpretacja komentarza, nieprecyzyjne zakresy linii, brak
pełnych ścieżek w cytowaniach → Obrona 7×PRZYJMUJE → Final Control 7×ODDAL, zweryfikowane
niezależnie przez `git show`/`git grep` na `parity-v2`).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md`.

WYNIK: Dzisiejszy stan granicy jest BARDZO daleko od planu („dziesiątki komend" docelowo):
- Jedna komenda Tauri: `engine_command` (`src-tauri/src/lib.rs:28-33`), `EngineCommand` ma 6 wariantów
  (`bridge.rs:20-41`), ale FRONTEND wysyła tylko 4: `create_session`, `select_unit`, `move_unit`,
  `advance_turn`. `add_player` tylko w sondach/mocku, `get_state` nieużywany przez UI.
- Jeden event: `engine_state_changed`, emitowany tylko po udanych komendach (poza `get_state`).
- ŻADNA z docelowych kategorii P2.5 (rekrutacja, budowa, dyplomacja, handel, badania, zarządzanie
  automatyczne, save/load, rozliczenie tury) NIE MA wpiętej komendy. Moduły domenowe dla większości
  z nich istnieją (`recruitment.rs`, `building_costs.rs`, `diplomacy.rs`, `trade.rs`, `save_load.rs`)
  ale nie są importowane przez `PlayableGame` (`playable.rs:11`) ani wpięte w `EngineCommand`.
  `ai_turn.rs` (1402 linie, `plan_ai_turn`/`decide_ai_turn`) to najbliższy odpowiednik „zarządzania
  automatycznego" — też niewpięty. Kilka modułów domenowych (`save_load`, `ai_turn`, `replay`,
  `combat`, `unit_epoch`) nie jest nawet zadeklarowanych w `domain/mod.rs` — używane tylko ze ścieżek
  testowych.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
