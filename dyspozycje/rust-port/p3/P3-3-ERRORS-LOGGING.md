# P3.3 — Strategia błędów, logowania i diagnostyki (rust-port/engine + warstwa Tauri)

**Temat:** R-RUSTPORT-P3-3-ERRORS-LOGGING-Q1 · **Runda:** 1/5 (wersja po obronie Operatora na zarzuty Evaluatora) · **Rola:** Operator (Haiku 5.5 medium)
**Baza:** `origin/rust-port/parity-v2` = `9e33fc77` (worktree wystartował na `edb8fb56`, przełączony `detach` na `9e33fc77`; stan czysty przed startem)
**Status:** PROPOZYCJA. Kod nie został zmieniony (patrz §6 — szkielet świadomie nie wykonany).
**Lokalizacja dokumentu:** ten plik powstał w worktree `wf_7cff9bd0-905-3` (harness odmówił zapisu w głównym checkoucie). Przeniesienie do `dyspozycje/rust-port/p3/` w głównym checkoucie (poza worktree) należy do orkiestratora (zarzut Evaluatora #3).
**DEPLOY/PUSH:** NIE WYKONANO

Ścieżki względem korzenia repo na `9e33fc77`. Pliki Tauri są w korzeniu (`src-tauri/`), nie w `rust-port/`.

---

## 0. Podsumowanie (binarne kryteria)

| Kryterium z dispatchu | Wynik |
|---|---|
| Pełna lista `unwrap()/expect()/panic!()/unreachable!()/assert*!()` w `src/` poza testami | **15 miejsc** w `rust-port/engine/src/` (§2.1; pozycja #4 rozbita na 4a–4e, dodana #11) **+ 1 w warstwie Tauri** (§2.2). Żadne nie leży w `#[cfg(test)]`. |
| Ocena: bezpieczny vs do zamiany | **1 do zamiany** (#5, latentne przez deserializację). **1 kruche** (#8). **7 bezpiecznych warunkowo** (#1, #4a–4e, #11). **6 bezpiecznych** (#2 sam unwrap, #3, #6, #7, #9, #10). |
| Mechanizm logowania | **Brak.** Zero wywołań `log::`, `tracing::`, `eprintln!`, `println!`, `dbg!` w `rust-port/engine/src/` i `src-tauri/src/`. Rekomendacja: `tracing` w silniku bez subskrybenta, subskrybent w shellu (§4). |
| Granulacja `BridgeErrorCode` vs P2.11 §10 | **Niewystarczająca** dla importu zapisów: brak kodów rozróżniających uszkodzenie strukturalne od wersji nieobsługiwanej; ostrzeżenia naprawy nie mają miejsca w modelu (§3). |
| Szkielet (`tracing` + jeden punkt logowania) | **Nie wykonany** — wyjaśnione w §6 (allowlista implementacyjna nie obejmuje `lib.rs`). Decyzja orkiestratora. |

Zakres „pełnej listy”: grep po rodzinie `assert|debug_assert|unwrap|expect|panic!|unreachable!|todo!|unimplemented!` (9e33fc77, `rust-port/engine/src/*` i `src-tauri/src/*`). Pozycje indeksowania (`[i]`), `split_at` i arytmetyka są audytowane **tylko tam, gdzie grep je ujawnił współlokalnie** (#4a–4c); pełny audyt indeksowania i arytmetyki pozostaje poza zakresem (§5 pkt 7).

---

## 1. Stan faktyczny (grep, nie domysł)

### 1.1 Logowanie
- `rust-port/engine/src/`: brak `log::`, `tracing::`, `eprintln!`, `println!`, `eprint!`, `print!`, `dbg!`. Jedyne trafienia to `ValueCatalog::default()` (fałszywy alarm).
- `src-tauri/src/`: brak logowania; jedyny `expect` to start aplikacji (§2.2).
- `rust-port/engine/Cargo.toml`: jedyna zależność produkcyjna to `serde`. Dev-dep: `serde_json`.
- Brak `Cargo.lock` w `rust-port/engine/` na tym commicie (lockfile jest w `src-tauri/Cargo.lock`).
- Transitive w `src-tauri/Cargo.lock`: `log 0.4.34` i `tracing 0.1.44` — już rozwiązane przez zależności Tauri.

### 1.2 Mostek Tauri
- `src-tauri/src/lib.rs:8-9` włącza `rust-port/engine/src/bridge.rs` przez `#[path = "../../rust-port/engine/src/bridge.rs"]` + `pub mod bridge;`. (`lib.rs:17` to początek `EngineStateHandle`, nie dyrektywa `#[path]`.) **Cały `bridge.rs` (w tym `MockEngineAdapter`) trafia do binarki produkcyjnej**, nie tylko do testów.
- Jedyna komenda: `engine_command` (`src-tauri/src/lib.rs:29-48`). Silnik trzymany jest w `Mutex<EngineBridge<CivEngineAdapter>>`.
- **Krytyczna obserwacja:** `panic!` wewnątrz bloku trzymającego `Mutex` **zatruwa mutex**. Każde kolejne wywołanie zwraca `BridgeError::internal("engine state lock is poisoned")` (`src-tauri/src/lib.rs:38`). Sesja gry jest martwa do restartu aplikacji. Panika w silniku = utrata sesji, nie tylko jednego ruchu.

### 1.3 Model błędów
- `BridgeErrorCode` (`rust-port/engine/src/bridge.rs:119-125`): `InvalidRequest | UnsupportedVersion | EngineRejected | EventEmission | Internal` — zgodne z P2.8.
- Wszystkie błędy `PlayableError` (10 wariantów, `domain/playable.rs`) mapowane są na **jeden** kod `EngineRejected` przez `error.to_string()` (`bridge.rs:262-300`). Frontend nie dostaje maszynowego podkodu.
- `EngineCommand` nie ma żadnej komendy importu/wczytania zapisu. Import z P2.11 jest przyszły. Latentna ścieżka danych zewnętrznych istnieje przez deserializację `SaveSnapshot` (`save_load.rs:82` → `EventQueue`, `events.rs:309`; §2.1, #5).

---

## 2. Inwentarz `unwrap()/expect()/panic!()/unreachable!()/assert!()` (każde z osobna)

Zakres: `rust-port/engine/src/**` poza blokami `#[cfg(test)]` (`map_generator.rs` od linii 1343, `save_load.rs` 25/30, `replay.rs` 15/20 — żadne z 15 trafień nie leży w tych blokach; `hex.rs` nie ma `cfg(test)`) oraz `src-tauri/src/**`.

Legenda: **BEZPIECZNY** = niemożliwy do złamania invariant lokalny; **BEZP.-WARUNK.** = bezpieczny, ale zależy od stałej lub od warunku poza miejscem wywołania; **KRUCHY** = bezpieczny dziś, ale zależy od odległej logiki; **DO ZAMIANY** = osiągalny z danych zewnętrznych.

### 2.1 Silnik (`rust-port/engine/src/`) — 15 trafień (11 pozycji)

| # | Plik:linia | Kod | Kontekst | Ocena | Uzasadnienie |
|---|---|---|---|---|---|
| 1 | `src/bridge.rs:249` | `.expect("default playable scenario must be valid")` | `impl Default for CivEngineAdapter` | **BEZP.-WARUNK.** | Stała `StartGameParams::default()`. Panika przy starcie Tauri (`EngineStateHandle::default()`), jeśli stała stanie się niepoprawna. Zalecenie: test, że `PlayableGame::new(StartGameParams::default())` jest `Ok` (nie zweryfikowano wprost, że taki test istnieje). |
| 2 | `src/bridge.rs:347` | `self.state.players.last().unwrap().name.clone()` | `MockEngineAdapter::execute`, arm `AddPlayer` | **BEZPIECZNY** (sam unwrap) | Tuż po `push` — niemożliwe `None`. **Osobny defekt w tym samym bloku:** `players.push(...)` następuje PRZED wywołaniem `game.add_player(...)?`. Gdy `add_player` zwróci błąd, `self.state.players` zawiera gracza, a `game` nie — błąd jest zwracany. Rozjazd stanu, brak atomowości. Mock jest kompilowany do produkcji (§1.2). Poprawka: najpierw `add_player`, potem `push`. |
| 3 | `src/domain/map_generator.rs:684` | `.min_by(...).expect("centers checked above")` | generator mapy, strefa centrów | **BEZPIECZNY** | Wcześniej `if ... \|\| centers.is_empty() { return 0.0; }` (~linia 673). Niemożliwe `None`. |
| 4a | `src/domain/map_generator.rs:966` | `run.split_at(1)` | `earth_mask_bits()`, `OnceLock::get_or_init` | **BEZP.-WARUNK.** | Panika, gdy `run` jest pusty (pusty fragment po `split(';')`). Zweryfikowano skryptem na `EARTH_MASK_RLE` (9e33fc77): 2825 runów, **0 pustych**, wszystkie ASCII. Zmiana stałej może to złamać — stąd test (§5 pkt 4). |
| 4b | `src/domain/map_generator.rs:967` | `value.as_bytes()[0]` | j.w. | **BEZP.-WARUNK.** | Panika przy pustym `value`. Ten sam warunek co 4a (0 pustych runów). |
| 4c | `src/domain/map_generator.rs:967` | `value.as_bytes()[0] - b'0'` (arytmetyka) | j.w. | **BEZP.-WARUNK.** | Underflow (panika w debug) tylko gdy znak < `'0'`. Skrypt: wartości runów to wyłącznie `'0'` i `'1'`. |
| 4d | `src/domain/map_generator.rs:969` | `digit.to_digit(10).expect("valid Earth RLE")` | j.w., fold po znakach licznika | **BEZP.-WARUNK.** | Panika, gdy znak licznika nie jest cyfrą. Skrypt: wszystkie znaki liczników to cyfry (`isdigit`), 0 odrzuceń. |
| 4e | `src/domain/map_generator.rs:973` | `assert_eq!(bits.len(), EARTH_MASK_WIDTH * EARTH_MASK_HEIGHT)` | j.w., koniec inicjalizacji | **BEZP.-WARUNK.** | Skrypt: suma długości runów = **288 000 = 720 × 400** (zgodność: True). Assert przechodzi dla obecnej stałej. |
| 5 | `src/domain/events.rs:384` | `.expect("event queue sequence exhausted")` | `EventQueue::enqueue` (wrapper nad `try_enqueue`) | **DO ZAMIANY** | **Ścieżka z danymi zewnętrznymi:** `EventQueueWire.next_sequence` (`#[serde(default)]`, `events.rs:303-306`) i `normalize()` (`events.rs:508-527`): gdy w danych jest zdarzenie z `sequence == u64::MAX`, `normalize` ustawia `next_sequence = u64::MAX` (`unwrap_or(EventId::MAX)`). Kolejny `try_enqueue` zwraca `Err(SequenceExhausted)` (`next_sequence.checked_add(1)` = `None`), a `expect` panikuje. Ścieżka wejścia: `SaveSnapshot.event_queue` (`save_load.rs:82`) deserializowany z dowolnego JSON-a. **Callery `enqueue` (grep po `rust-port/` i `src-tauri/`, 9e33fc77):** (a) `playable.rs:589` w `enqueue_turn_phases`, wołane z `PlayableGame::new` (`playable.rs:460`) i `advance_turn` (`playable.rs:581`); `PlayableGame` nie jest `Deserialize` (`playable.rs:406`), więc kolejka gry powstaje wyłącznie z parametrów, nie z danych zewnętrznych; (b) `events.rs:359` `from_events` — **0 wywołań** poza definicją i testami (w repo brak wywołań w `src/` i `tests/`); (c) `events.rs:404` `push` — **0 wywołań** w repo poza definicją; (d) `events.rs:409` `schedule` — **0 wywołań** w repo poza definicją. Testy wołają `enqueue` bezpośrednio (`tests/events.rs:36-147`, `tests/replay.rs:72`, `tests/save_load.rs:61-62`). `from_events`/`push`/`schedule` są publicznym API crate'u, więc teoretycznie osiągalne dla zewnętrznego konsumenta biblioteki, ale **nie z gry ani z Tauri**. Wniosek: latentne (sekwencja wyczerpana wyłącznie przez zdeserializowany `EventQueue`). Naprawa bez nowego mechanizmu: w granicy importu używać `try_enqueue` i mapować błąd na strukturalny (§3); w `normalize` odrzucać `sequence == MAX`. Doc `enqueue` już to przewiduje. |
| 6 | `src/domain/diplomacy.rs:2664` | `_ => unreachable!()` | `build_cyclic_resource_transfers` (fn od 2633), mapowanie `payment` z `receive_payment` | **BEZPIECZNY** | `receive_payment` wybrane przez `find(... matches!(kind, Gold \| Work))` — ramię `_` niedosiężne. |
| 7 | `src/domain/diplomacy.rs:2685` | `_ => unreachable!()` | j.w., mapowanie `payment` z `give_payment` | **BEZPIECZNY** | Analogicznie, filtr `matches!(kind, Gold \| Work)`. |
| 8 | `src/domain/diplomacy.rs:3855` | `ProposalAction::Peace => unreachable!()` | `evaluate_proposal_with_params` (fn od 3179) | **KRUCHY** (bezpieczny dziś) | `if proposal.action == ProposalAction::Peace { ... return ...; }` (~3223-3262) zwraca bezwarunkowo. Niedosiężne, ALE zależy od early-return ~600 linii wyżej. Zmiana w tamtym bloku bez zmiany ramienia = panika w produkcji. Zalecenie: wyczerpujące ramię (`Peace => ProposalEvaluation::reject(...)`) zamiast `unreachable!`. |
| 9 | `src/domain/playable.rs:516` | `self.state.map.tile(destination).expect("map contains destination")` | `PlayableGame::move_unit` | **BEZPIECZNY** | Poprzedzone `if !self.state.map.contains(destination) { return Err(...) }` (~512); `tile()` zwraca `None` wyłącznie gdy `!contains`. |
| 10 | `src/domain/playable.rs:564` | `self.phase_queue.pop_next().expect("peeked event remains in queue")` | `PlayableGame::advance_turn` | **BEZPIECZNY** | Tuż po `peek_next()` == `Some`, ta sama kolejka, bez mutacji pomiędzy. |
| 11 | `src/domain/hex.rs:43` | `debug_assert!(cube.is_valid())` | `HexCoord::from_cube` (`pub const fn`, poza `cfg(test)`) | **BEZP.-WARUNK.** | Panika **tylko w buildach debug** (w release `debug_assert!` nie istnieje) i **tylko** dla `CubeCoord` z `q + r + s != 0` (`is_valid`, `hex.rs:167-169`). Jedyny wywołujący w repo: `tests/hex_terrain.rs:16` z `coordinate.cube()`, a `cube()` konstruuje `s = -q - r` (`hex.rs:~30`), więc warunek zachodzi z konstrukcji. Brak wywołań w `src/`. Zalecenie: przy użyciu z danymi zewnętrznymi zwracać `Option`/`Result`, albo zostawić jako precondition z dokumentacją. |

**Podsumowanie silnika:** 0 trafień w testach; 1 DO ZAMIANY (#5, latentne przez deserializację); 1 KRUCHY (#8); 7 bezpiecznych warunkowo (#1, #4a–4e, #11); 6 bezpiecznych (#2 sam unwrap, #3, #6, #7, #9, #10). **Żadna ścieżka wejścia gracza (`CreateSession`, `SelectUnit`, `MoveUnit`, `AdvanceTurn`, `GetState`) nie prowadzi dziś do paniki z tych 15 miejsc** — `PlayableGame::new`, `move_unit`, `select_unit` zwracają `Result`. Nie audytowano arytmetyki (`+`/`*` mogą panikować w debug) ani indeksowania `[i]` w całym silniku — poza zakresem dispatchu.

### 2.2 Warstwa Tauri (`src-tauri/src/`)

| Plik:linia | Kod | Ocena | Uzasadnienie |
|---|---|---|---|
| `src-tauri/src/lib.rs:60` | `.expect("error while running Tauri application")` | **BEZPIECZNY** | Start procesu; brak sensownego odzyskania. Standard Tauri. |
| `src-tauri/src/lib.rs:38` | `lock()` → `map_err(... "poisoned")` | (poprawnie obsłużone) | Zatruty mutex mapowany na `Internal`, nie panikuje — ale patrz §1.2: utrata sesji. |

---

## 3. Propozycja rozszerzenia `BridgeErrorCode` (zgodnie z P2.11 §10)

### 3.1 Wymagania wynikające z P2.11 §10
- **Atomowy fail TYLKO dla nienaprawialnego uszkodzenia strukturalnego:** niesparsowalny JSON, brak/niezgodny znacznik wersji, sprzeczność `seed`/`mapSnapshot` (D-MIG-9d), brak `mapSnapshot` (D-MIG-9b — odrzucenie z jawnym komunikatem).
- **Naprawa Z OSTRZEŻENIEM dla reszty:** duplikaty ID (resekwencjonowane), nieznany `ownerId` (→ `Rebel`), wartości poza zakresem (przycinane), nieznane klucze (D-MIG-20). **To NIE jest błąd** — import kończy się sukcesem, a ostrzeżenia muszą wrócić do wywołującego.
- **Import nienniszczący** (Final Control pkt 5): oryginał nietknięty.

### 3.2 Propozycja (addytywna, wire `snake_case`)

```rust
pub enum BridgeErrorCode {
    InvalidRequest,
    UnsupportedVersion,      // bez zmian: wersja KONTRAKTU bridge
    EngineRejected,
    EventEmission,
    Internal,
    // NOWE:
    SaveUnsupportedVersion,  // wersja zapisu != 3 (D-MIG-1); v1/v2 odrzucane
    SaveCorrupt,             // nienaprawialne: JSON, brak wersji, seed↔mapSnapshot, brak mapSnapshot
}
```

Ostrzeżenia naprawy **nie** są kodem błędu. Dodać do odpowiedzi sukcesu (np. `ImportResponse`):

```rust
pub struct ImportWarning {
    pub code: ImportWarningCode, // DuplicateIdResequenced, UnknownOwnerRebel, OutOfRangeClamped, UnknownKeyIgnored, ...
    pub path: String,            // np. "units[12].ownerId"
    pub message: String,
}
// ImportResponse { state, warnings: Vec<ImportWarning> }  — sukces, nie BridgeError
```

Uwagi:
- Kody są **addytywne**. Frontend (JS) musi tolerować nieznany kod (gałąź domyślna) — warunek kompatybilności wstecznej.
- `PlayableError` nadal mapuje na `EngineRejected`; nie rozszerzać teraz — maszynowy podkod dopiero, gdy frontend go potrzebuje (osobna decyzja).
- `Internal` zostaje dla zatrutego mutexu i błędów niespodziewanych. **Panika nie jest kodem błędu** — powinna być wyeliminowana z tych ścieżek (§2.1, #5).

---

## 4. Propozycja mechanizmu logowania

### 4.1 Wybór: `tracing` (w silniku bez subskrybenta)
- **Silnik jest biblioteką.** Nie instaluje subskrybenta. Używa makr `tracing::{error!, warn!, info!, debug!}`. Subskrybent (format, plik, poziom) ustawia się w shellu `src-tauri` (np. `tracing-subscriber` z filtrem poziomu).
- **Uzasadnienie względem `log`:** `tracing` daje pola strukturalne (`path`, `code`, `reason` dla ostrzeżeń importu) i spany (późniejsze śledzenie tury/fazy), czego wymaga dispatch. `log 0.4.34` też jest w lockfile, więc to realna alternatywa; wybór `tracing` wynika ze struktury pól, nie z dostępności. Koszt: jedna nowa bezpośrednia zależność `tracing = "0.1"` w `rust-port/engine/Cargo.toml`, wersja już rozwiązana w `src-tauri/Cargo.lock` (0.1.44).
- **Brak I/O w silniku** — logowanie nie zmienia stanu domeny; RNG i kolejka zdarzeń nie zależą od logów.

### 4.2 Co loguje się ZAWSZE (poziom ≥ WARN, także w release)
- `ERROR`: odrzucenie importu (`SaveCorrupt`, `SaveUnsupportedVersion`) z `path`/`reason`; zatruty mutex (`lib.rs:38`); błąd emisji eventu (`EventEmission`).
- `WARN`: każde ostrzeżenie naprawy importu (§3.2) — jedno zdarzenie na ostrzeżenie z `code` i `path`; `EventQueue` przy zbliżaniu się do `EventId::MAX`.

### 4.3 Co tylko w trybie debug (`DEBUG`/`TRACE`)
- `INFO`: utworzenie sesji, zakończenie tury (`turn`, `phase`).
- `DEBUG`: każde wywołanie `engine_command` (typ komendy, `request_id`), liczba emitowanych eventów.
- `TRACE`: szczegóły rozstrzygania (np. transfer zasobów) — tylko przy ręcznym włączeniu.

### 4.4 Zasady
- **Nie logować danych gracza poza identyfikatorami** (nazwa gracza, treść zapisu). Logować `id`, nie `name`.
- **Logi nie są jedynym nośnikiem błędu** — błąd nadal wraca jako `BridgeError`.
- **Zero logów w `domain/`** poza granicą importu/błędów. Logowanie w pętlach domeny (np. generator mapy) zakazane.

---

## 5. Zakres przyszłej pracy (NIE zrobiono w tym temacie)

Zgodnie z ZADANIEM pkt 4 dispatchu:
1. Zamiana `events.rs:384` (#5) na obsługę `try_enqueue` w granicy importu + odrzucanie `sequence == MAX` w `normalize` — **osobny temat**.
2. Zamiana `diplomacy.rs:3855` (#8) na wyczerpujące ramię — **osobny temat** (wymaga testu).
3. Naprawa rozjazdu atomowości w `MockEngineAdapter::AddPlayer` (`bridge.rs:330-349`) — **osobny temat** (mock, ale kompilowany do produkcji).
4. Test pokrycia stałych: `CivEngineAdapter::default()` (#1) i `earth_mask_bits()` (#4a–4e) — **osobny temat**. Test powinien wywołać `earth_mask_bits()` i sprawdzić długość; skrypt z §2.1 (#4a–4e) może być wzorem asercji.
5. Rozszerzenie `BridgeErrorCode` (§3.2) i `ImportWarning` — **razem z implementacją importu P2.11**, nie przed nią.
6. Pełny mechanizm logowania (subskrybent w `src-tauri`, poziomy, granice) — **osobny temat implementacyjny** po akceptacji §4.
7. Audyt arytmetyki i indeksowania `[i]` (panika w debug na przepełnieniu / poza zakresem) — **poza zakresem tego dispatchu**, nie audytowano w całości.
8. Decyzja o `debug_assert` w `hex.rs:43` (#11): zostawić jako precondition albo zmienić na `Result` — **osobny temat**, gdy pojawi się zewnętrzne wejście do `from_cube`.

---

## 6. Dlaczego szkielet (`tracing` + jeden punkt logowania) NIE został wykonany

Dispatch dopuszcza szkielet „jeśli projekt jest jednoznaczny”. Nie jest jednoznaczny w obecnej allowliście. ALLOWLISTA implementacyjna dispatchu wymienia **wyłącznie**: `rust-port/engine/Cargo.toml` (dodanie zależności) oraz **co najwyżej 1 nowy plik** (`src/logging.rs` albo podobny). `rust-port/engine/src/lib.rs` nie jest wymieniony ani jako nowy plik, ani jako zależność.
- Dodanie `tracing` do `Cargo.toml` jest dozwolone.
- Nowy plik `src/logging.rs` jest dozwolony (max 1).
- Żeby plik się **skompilował**, trzeba go zadeklarować `pub mod logging;` w `rust-port/engine/src/lib.rs` — modyfikacja pliku spoza wymienionej allowlisty (dispatch zakazuje modyfikacji istniejących plików domenowych; `lib.rs` nie jest domenowy, ale też nie jest wymieniony).
- Punkt logowania w istniejącym pliku byłby również modyfikacją spoza allowlisty.
- Bez tego szkielet byłby martwym kodem, którego `cargo build` nie widzi. To nie jest minimalny szkielet, tylko pozorne wdrożenie.
- Dodatkowo `cargo build` z nową zależnością wymaga pobrania z crates.io — nie wykonano weryfikacji online w tej rundzie.

**Stan GOAL:** punkt „wdrożenie minimalnego szkieletu” jest **niezrealizowany** i pozostaje otwarty.
**Decyzja Operatora:** nie wdrażać szkieletu bez rozszerzenia allowlisty. Jeśli orkiestrator chce szkielet, należy rozszerzyć allowlistę o `rust-port/engine/src/lib.rs` (jedna linia `pub mod logging;`) i wykonać go w osobnym temacie implementacyjnym z weryfikacją `cargo test`.

---

## 7. Ślad procesu

- Dispatch `dyspozycje/autobot/runs/R-RUSTPORT-P3-3-ERRORS-LOGGING-Q1/00-dispatch.md` istnieje w głównym checkoucie (odczytany, bez zapisu).
- Pierwotna wersja była w worktree `wf_7cff9bd0-905-1` (nieśledzona). Ta wersja (runda 1, obrona) powstała w worktree `wf_7cff9bd0-905-3`; harness odmówił zapisu do `/home/user/The-Game/dyspozycje/rust-port/p3/` w głównym checkoucie. Kopię do `dyspozycje/rust-port/p3/` w głównym checkoucie wykonuje orkiestrator.
- Weryfikacje w tej rundzie (grep i skrypt na 9e33fc77, bez `cargo`): inwentarz panik (`git grep`), callery `enqueue`/`from_events`/`push`/`schedule`, pozycje `lib.rs:8-9`, struktura `EARTH_MASK_RLE` (skrypt Python `-I` na `rust-port/engine/src/domain/map_generator.rs` w worktree `wf_7cff9bd0-905-1`: 2825 runów, 0 pustych, suma 288000).
- Odczytane dokumenty: `P2-8-TAURI-ADAPTER.md` (błędy `bridge.rs:119-125` — zgodne z kodem), `P2-11-SAVE-MIGRATION.md` §10 (polityka importu — zgodna), `P3-1-2-TOOLCHAIN.md` (rustc/cargo 1.97.0).
- Brak zmian w `gra/**`. Brak commitów. Brak push. Brak zmian w kodzie `rust-port/` ani `src-tauri/`.

---

## 8. Rozstrzygnięcie (orkiestrator, 2026-10-21)

Final Control (runda 1/5) oddalił 6 zarzutów Evaluatora (poprawki faktycznie wykonane w Obronie:
panic-site #11 dopisany, #4 rozpisany na 4a-4e, analiza osiągalności #5 uzupełniona o wrappery,
cytowanie `lib.rs:8-9` poprawione) i zostawił 1 punkt do decyzji: czy rozszerzyć allowlistę o
`rust-port/engine/src/lib.rs`, żeby wdrożyć szkielet `tracing` W TYM temacie (opcja A), czy
zamknąć P3.3 jako samą propozycję i przenieść szkielet do osobnego tematu implementacyjnego
(opcja B).

**Rozstrzygnięcie: opcja B.** To nie jest genuine decyzja produktowa — to kwestia sekwencjonowania
pracy, taka sama jak dziesiątki podobnych decyzji w fazie P2 (np. „implementacja w P3+" przy
każdym kontrakcie danych). Uzasadnienie: szkielet logowania ma sens dopiero RAZEM z realnymi
punktami, które ma logować — w szczególności z naprawą `events.rs:384` (latentna panika przy
deserializacji `sequence == u64::MAX`), naprawą defektu `MockEngineAdapter::AddPlayer` (rozjazd
stanu przy błędzie `add_player`, `bridge.rs:340-347`) i rozszerzeniem `BridgeErrorCode` o
`SaveUnsupportedVersion`/`SaveCorrupt` zgodnie z polityką importu P2.11 §10. Wdrożenie samego
`pub mod logging;` bez tych napraw byłoby martwym punktem logowania bez nic realnego do
zarejestrowania — rozsądniej zrobić to razem, w jednym zwartym temacie kodowym, niż rozbijać na
dwa wywołania tej samej zmiany pliku `lib.rs`.

**Status: temat zamknięty PASS.** Propozycja (inwentarz 16 miejsc panic/assert z oceną każdego z
osobna, rozszerzenie `BridgeErrorCode`, wybór `tracing` z uzasadnieniem) jest kompletna i gotowa.
Następny krok: osobny temat implementacyjny P3.3-IMPL łączący: (1) szkielet `tracing` (`lib.rs`
+ `src/logging.rs`), (2) naprawę `events.rs:384`, (3) naprawę `MockEngineAdapter::AddPlayer`,
(4) rozszerzenie `BridgeErrorCode` o kody importu P2.11. Allowlista tego następnego tematu MA objąć
`rust-port/engine/src/lib.rs` wprost.
