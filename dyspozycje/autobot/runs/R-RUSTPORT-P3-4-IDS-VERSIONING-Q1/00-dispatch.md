STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4-IDS-VERSIONING-Q1
GOAL: Wdrożyć konsekwentne stosowanie newtypów `PlayerId`/`CityId`/`UnitId` (już istniejących w
`ids.rs:36-38`, ale stosowanych niekonsekwentnie — P2.3 §9 potwierdza) w strukturach, które dziś
używają surowego `u64`/`i64`: `PlayablePlayer.id`, `CombatUnit.id`, pola `AiUnit`/`BarbUnit`. Dodać
stałą wersji schematu danych (`SCHEMA_VERSION`) jako podstawę przyszłego wersjonowania zapisów/danych
(P2.11/P2.7), bez implementowania pełnego mechanizmu migracji teraz.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Niezależny temat fazy P3, równoległy do P3.3-IMPL (zamknięty, zintegrowany) i P3.5A-E (dane, w toku
— zero styku plikowego: P3.5A-E piszą WYŁĄCZNIE nowe pliki w `src/data/`, ten temat zmienia
ISTNIEJĄCE pliki domenowe `playable.rs`, `combat.rs`, i pliki z `AiUnit`/`BarbUnit`). Przeczytaj
OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` CAŁY (§9 — schemat ID jest ROZSTRZYGNIĘTY
jako propozycja: newtype `u64` per typ, `OwnerRef` enum zamiast liczb ujemnych; §4 tabela pól
RuntimeUnit — wiersz z `PlayablePlayer.id`/`CombatUnit.id` jako przykłady niekonsekwencji; punkt
10(a)-(c) Final Control: „zakaz surowego u64/i64 jako ID w GameState/DTO — potwierdzone, wymaga
przepisania PlayablePlayer/CombatUnit/AiUnit/BarbUnit na newtypy w fazie implementacji, nie teraz" —
TA FAZA WŁAŚNIE NADESZŁA). `dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji).

ZADANIE
1. Znajdź (`git grep`) wszystkie miejsca w `rust-port/engine/src/` gdzie `PlayablePlayer.id`,
   `CombatUnit.id` i analogiczne pola w `AiUnit`/`BarbUnit` są typu `u64`/`i64` zamiast
   `PlayerId`/`CityId`/`UnitId`. Zamień typ pola na odpowiedni newtype z `ids.rs`.
2. Napraw WSZYSTKIE miejsca użycia tych pól (konstrukcja, porównania, arytmetyka na ID jeśli
   istnieje — newtype prawdopodobnie nie wspiera arytmetyki wprost, może wymagać `.0` albo metody
   pomocniczej — zaprojektuj minimalnie, nie buduj całego API na zapas).
3. Zastąp liczby ujemne oznaczające "brak właściciela"/"barbarzyńca" (jeśli takie wzorce istnieją w
   kodzie — sprawdź `git grep` dla `-1` czy podobnych sentineli przy polach właściciela) przez
   `OwnerRef` z P2.3 §9, JEŚLI to da się zrobić bez przebudowy większych fragmentów logiki — jeśli
   okaże się zbyt duże, opisz to jako zakres przyszłej pracy, nie rób połowicznie.
4. Dodaj `pub const SCHEMA_VERSION: u32 = 1;` w odpowiednim miejscu (np. `lib.rs` albo nowy mały
   plik `src/version.rs`) z komentarzem wyjaśniającym relację do `contractVersion` z `BridgeRequest`
   (P2.5 §1, już istniejący) i do przyszłego `SAVE_VERSION` z P2.11 — to TYLKO stała + dokumentacja,
   nie pełny mechanizm wersjonowania/migracji.
5. Upewnij się, że WSZYSTKIE istniejące 227 testów (stan po P3.3-IMPL) nadal przechodzą po
   refaktorze typów — to jest refaktor, nie zmiana zachowania.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz częściowego refaktoru bez jawnego zaznaczenia zakresu pominiętego — jeśli jakieś użycie
surowego ID zostanie celowo pominięte (bo zbyt ryzykowne/duże), WYPISZ je jawnie z uzasadnieniem.
Zakaz twierdzenia "testy przechodzą" bez wklejonego surowego logu `cargo test`.

BINARNE KRYTERIUM SUKCESU
`PlayablePlayer.id`, `CombatUnit.id` używają newtypów (nie `u64`/`i64`) z dowodem (`git grep` przed/
po), `cargo build`+`cargo test` zielone (exit 0, wszystkie 227+ testów PASS) z surowym logiem,
`SCHEMA_VERSION` dodany z uzasadnieniem — w nowym pliku
`dyspozycje/rust-port/p3/P3-4-IDS-VERSIONING.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-4-IDS-VERSIONING.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-4-IDS-VERSIONING-Q1/**`. Worktree (`rust-port/parity-v2`, baza `2c518a12` — HEAD PO
integracji P3.3-IMPL, nie `9e33fc77`): `rust-port/engine/src/domain/playable.rs`, `combat.rs`,
plik(i) z `AiUnit`/`BarbUnit` (sprawdź który — prawdopodobnie `ai_turn.rs`/`barbarians.rs`),
`rust-port/engine/src/lib.rs` LUB nowy `src/version.rs` (tylko dla stałej wersji — minimalna zmiana).
Zero zmian w `src/data/**` (zakres P3.5A-E). Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2` (sprawdź aktualny HEAD — po integracji
P3.3-IMPL powinien być `2c518a12` lub nowszy). Commit w worktree dozwolony, PUSH zdalny NIE —
integracja po PASS Final Control, osobny krok orkiestratora.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (pełne logi cargo w pliku docelowym, liczą się osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
