STATUS: PASS-WITH-NOTES (zakres częściowy — przeplanowany)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4-IDS-VERSIONING-Q1

Workflow zwrócił w rundzie 1/5 agregat DECISION_REQUIRED. Diagnoza orkiestratora (admininstracyjna,
nie produktowa):

1. **Zła baza początkowa.** Operator wystartował na `edb8fb56` (pin web) zamiast
   `origin/rust-port/parity-v2`. Przyczyna: `isolation: worktree` nie wymusza automatycznie checkout
   właściwego ref z tekstu promptu — agent musi to zrobić sam jako pierwszy krok, a dispatch podał
   bazę jako tło ("Baza: X"), nie jako jawny krok 1. Obrona samodzielnie to naprawiła
   (repoint na `e72c74f7`).
2. **Brak wyjaśnienia struktury dwóch gałęzi.** Dispatch kazał przeczytać
   `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md`, który istnieje WYŁĄCZNIE na gałęzi dokumentacyjnej
   (`claude/sprawdzenie-funkcjonalnosci-ek4ra0`), nie na `rust-port/parity-v2`, gdzie pracuje worktree
   kodu. Agenci, pracujący czysto na `rust-port/parity-v2`, poprawnie zaobserwowali, że ten plik (i
   commit zamykający P3.3-IMPL na gałęzi dokumentacyjnej) nie jest przodkiem ich bazy — i błędnie
   potraktowali to jako niespójność procesu wymagającą rozstrzygnięcia właściciela, zamiast oczekiwanej
   struktury dwugałęziowej. To NIE była genuine decyzja produktowa — to brak instrukcji w dispatchu.
3. **Refaktor newtype ID nie został podjęty** — poprawnie, jawnie opisany jako pominięty z powodu
   zakresu/czasu, zgodnie z regułą anty-halucynacyjną dispatchu ("zakaz połowicznego refaktoru bez
   jawnego zaznaczenia zakresu"). Jedyna faktyczna praca: `SCHEMA_VERSION` (plik `src/version.rs`,
   `pub mod version;` w `lib.rs`) — `cargo check` zielony w rundzie Obrony, `cargo test` nie uruchomiony
   tam z powodu braku miejsca na dysku.

**DECYZJA ORKIESTRATORA (administracyjna — brak tu żadnej genuine decyzji produktowej/gracza do
eskalacji; cała rozbieżność to artefakt niekompletnego dispatchu, nie wybór dotyczący gry):**
Temat zamykany jako **PASS-WITH-NOTES, zakres częściowy**. Orkiestrator osobiście zweryfikował
pracę Obrony (worktree `wf_1284f37b-dac-3`, commit `4ad0609e`): diff vs `e72c74f7` to wyłącznie
`lib.rs` (+1 linia), nowy `src/version.rs`, dokument i raport — zero ingerencji w `domain/**`. Uruchomił
`cargo test --offline` niezależnie: zielone, zero regresji. Zrebase'ował na aktualny
`origin/rust-port/parity-v2` (po P3.5C+P3.5E, `1051b66d`) — czysty rebase, zero konfliktów — i
wypchnął jako `9d4f2aba`.

Newtype ID refaktor (`PlayablePlayer.id`/`CombatUnit.id`/`AiUnit`/`BarbUnit`) zostaje
**przeplanowany jako nowy temat `P3.4b`**, z poprawionym dispatchem zawierającym explicite w pierwszym
akapicie KONTEKST: (a) worktree pracuje na `rust-port/parity-v2`, dokumentacja z fazy P2 jest dostępna
WYŁĄCZNIE przez `git show <sha-gałęzi-dokumentacyjnej>:<ścieżka>` (nie jest to błąd ani niespójność —
to zamierzona struktura dwóch gałęzi: kod vs dokumentacja); (b) pierwszym krokiem Operatora MUSI być
jawny `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`, nie
poleganie na domyślnym stanie worktree.

ZMIANY/COMMIT: `rust-port/engine/src/version.rs` (nowy), `rust-port/engine/src/lib.rs` (+1 linia),
`dyspozycje/rust-port/p3/P3-4-IDS-VERSIONING.md` (commit `9d4f2aba` na `origin/rust-port/parity-v2`),
ten plik dyspozycji.
TESTY: `cargo check --all-targets` zielony (Obrona); `cargo test --offline` niezależnie przez
orkiestratora po integracji: zielony, zero regresji względem bazy.
BLOKADY: brak dla zakresu `SCHEMA_VERSION`. Newtype ID refaktor przeniesiony do P3.4b (nowy dispatch
do napisania).
RUNDY: 1/5
NASTĘPNY KROK: napisać i dispatchować `R-RUSTPORT-P3-4B-IDS-NEWTYPE-REFACTOR-Q1` z poprawionym
KONTEKST (struktura dwóch gałęzi, jawny pierwszy krok checkout) — po ustabilizowaniu dysku.
DEPLOY/PUSH: WYKONANO (push do `origin/rust-port/parity-v2`, gałąź robocza kodu — nie jest to
deploy produktu/READY_FOR_DEPLOY)
