STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-20-OWNERREF-CAMPID-Q1
GOAL: Domknij typy tożsamości z P2.3 (§9, D-ID-7 PRZYJĘTA): (1) `enum OwnerRef { Player(PlayerId), Barbarian, Rebel }` zamiast liczb ze znakiem/sentynelów dla właściciela (`owner_id: u64/i64`, `-1` barbarzyńcy, `-99` bunt w webie; w Rust ok. 76 deklaracji `owner_id`/`player_id`, w tym `barbarians.rs:13` `BARBARIAN_OWNER_ID: i64 = -1`);
(2) `CampId` w `ids.rs` i `BarbCamp.id: CampId` (dziś `u64`, bo brak `CampId`). Blokują te punkty fazę P6 (bramka P3, P3.13). Pominięcia z P3.4b/c (`owner_id` w `AiCity/AiUnit/PlayableCity/PlayableUnit/BarbUnit/CitySnapshot`, `BarbCamp.id`) wylistowane w `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md` §1b — tamte decyzje „POZOSTAWIONE u64/i64” są tym tematem odwrócone.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `7aab83f5` (P3.18 + renderer P4.8–P4.10) lub nowszą.
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock` silnika (`rust-port/engine/Cargo.lock`) ani `target/`.
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` (§9, D-ID-7, tabele pól RuntimeUnit/City), `p2/P2-2-GAMESTATE-CONTRACT.md` (kontrakt właściciela), `p3/P3-4C-IDS-REMAINING.md` §1b (lista 129 trafień z decyzjami), `src/domain/ids.rs`, `src/domain/barbarians.rs`, `tests/barbarians.rs`.
KONTRAKT JSON: dotychczasowe DTO serializują właściciela jako liczbę. Jeśli P2-2/P2-3 definiują nową reprezentację JSON `OwnerRef` — zastosuj ją i opisz zmianę kontraktu w dokumencie; jeśli NIE definiują — zachowaj reprezentację dotychczasową (liczba: gracz = jego ID, barbarzyńca = -1, bunt = -99) przez własne `Serialize/Deserialize`, tak aby testy save/DTO/parity_suite nie zmieniły oczekiwań.

ZADANIE
1. Zdefiniuj `OwnerRef` (w `ids.rs` lub `types.rs` — uzasadnij) z `Serialize/Deserialize`, `Copy/Eq/Ord/Hash`, wygodnymi konwersjami (`from_legacy_i64`, `legacy_i64`, `player()`), BEZ arytmetyki. Dodaj `CampId` (newtype jak pozostałe, `#[serde(transparent)]`).
2. Zamień typy pól `owner_id`/`player_id`-jako-właściciel i `BarbCamp.id` oraz wszystkie użycia (porównania, klucze map, sentynele `-1`/`-99`), minimalnie, w `domain/**` i `bridge.rs` (TYLKO konwersje). Pola, które semantycznie NIE są właścicielem (np. id gracza w komendach dyplomatycznych między dwoma graczami) → `PlayerId`, nie `OwnerRef`. Wypisz jawnie wszystkie decyzje „OwnerRef vs PlayerId vs bez zmiany” z uzasadnieniem (tabela wg grup, jak w P3-4C §1b).
3. Testy: istniejące mają przejść bez osłabiania; aktualizuj tylko konstrukcje typów. Dodaj testy: round-trip serde `OwnerRef` (wszystkie warianty) w reprezentacji kontraktu, konwersje legacy, `CampId`.
BINARNE KRYTERIUM: `git grep` przed/po: brak surowych `i64`/`u64` jako właściciela w `domain/**` poza jawnie uzasadnionymi wyjątkami; `fmt/clippy -D warnings/test` EXIT=0, liczba testów ≥ baseline; JSON kontraktu bez niezamierzonej zmiany; dokument `dyspozycje/rust-port/p3/P3-20-OWNERREF-CAMPID.md` z surowymi logami.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-20-OWNERREF-CAMPID.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-20-OWNERREF-CAMPID-Q1/**`.
Worktree: `rust-port/engine/src/domain/{ids,types,state,ai_turn,playable,barbarians,combat,trade,diplomacy,map_generator,session,player,events}.rs` (tylko typy właścicieli/ID), `rust-port/engine/src/bridge.rs` (TYLKO konwersje), `rust-port/engine/src/lib.rs` (eksporty), `rust-port/engine/tests/*.rs` (konstrukcje typów + nowe testy).
Zero zmian w `domain/{recruitment,building_costs,improvements}.rs`, `tests/{recruitment,building_costs,derived_values,parity_suite}.rs`, `data/**` (równoległy P3.19 — jeśli konieczna kolizja: STOP/BLOCK), `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` z `echo "EXIT=$?"` w dokumencie (nie wyciąg). Każda liczba i twierdzenie ma plik:linia lub komendę. Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.
IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO

RUNDA 1 — PONOWNE URUCHOMIENIE (przebieg wf_a8debab3-5a3 zwrócił pytania zamiast pracy: skażony kontekst). ROZSTRZYGNIĘCIA ORKIESTRATORA (administracyjne, zgodne z rekomendacjami; NIE pytaj, NIE generuj pytań ABC — wykonaj pracę):
- JSON właściciela = LICZBA jak dziś (gracz=ID, Barbarian=-1, Rebel=-99); enum tylko wewnątrz Rust, własny Serialize/Deserialize, testy round-trip. Kontrakt JSON/save/DTO/parity_suite bez zmian oczekiwań.
- Zakres: pola właściciela w allowliście + BarbCamp.id: CampId. Reszta surowych ID → lista w dokumencie jako kandydat P3.21.
- Rebel bez danych w enum; `rebelPreviousOwnerId` odnotuj w dokumencie jako brak po stronie Rust (pole Option<PlayerId> przy mieście dodaj tylko jeśli mieści się w allowliście bez zmiany JSON; inaczej opisz).
