STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17-RUST-CLASSIFICATION-Q1
GOAL: P1.17 z PLAN-PORT-RUST-TAURI-20261020.md §4 — porównanie istniejącego `rust-port/engine` (na
gałęzi `rust-port/parity-v2`, HEAD po poprawce terenu `9e33fc77`, forkowanej z `autobot/real24-staging`)
z katalogiem webowym `gra/src/game` (183 pliki, `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md`) — per
moduł web → `REUSE`/`ADAPT`/`REPLACE`/`UNKNOWN`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeczytaj `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md` (gotowy katalog 183 plików
`gra/src/game`) i `dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md` (co już wiadomo o
`rust-port/engine` na `real24-staging`: 28 plików domain, m.in. `city_growth.rs`, `diplomacy.rs`,
`trade.rs`, `pathfinding.rs`, `turn_economy.rs`, `playable.rs`, `ai_turn.rs`). Dla KAŻDEGO pliku w
`gra/src/game/*.ts` (albo świadomie pogrupowanych klastrów plików realizujących jeden mechanizm, jeśli
1:1 nie ma sensu) ustal w świeżym checkoucie `rust-port/parity-v2`: czy istnieje odpowiadający moduł
Rust, i jeśli tak — czy semantyka się pokrywa (nie tylko nazwa). Nadaj etykietę:
`REUSE` (moduł Rust istnieje i semantycznie odpowiada webowi, prawdopodobnie gotowy do adaptacji bez
przepisywania logiki), `ADAPT` (moduł Rust istnieje, ale wymaga zmian — np. inne wartości/sygnatury),
`REPLACE` (moduł Rust istnieje, ale jest błędny/nieadekwatny, lepiej przepisać od zera),
`UNKNOWN` (brak odpowiednika Rust albo nie dało się ustalić bez głębszej analizy).
Zapisz wynik w `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` jako tabelę: plik web | moduł
Rust (jeśli jest) | etykieta | uzasadnienie jednym zdaniem z konkretnym dowodem (ścieżka+linia).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz etykiety `REUSE` bez realnie otworzonego pliku Rust i porównania z plikiem web w TEJ rundzie.
Domyślna etykieta przy braku takiego sprawdzenia to `UNKNOWN`, nigdy `REUSE` (zgodnie z zasadą §1.1
planu: nieweryfikowany materiał = UNKNOWN).

BINARNE KRYTERIUM SUKCESU
Plik istnieje, każdy z 183 plików `gra/src/game` ma dokładnie jeden wiersz z etykietą i uzasadnieniem z
dowodem, podsumowanie podaje liczbę per etykieta (REUSE/ADAPT/REPLACE/UNKNOWN) sumującą się do 183.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-17-RUST-CLASSIFICATION-Q1/**`. Odczyt: `gra/src/game/**`
(świeży checkout main=edb8fb56) i `rust-port/engine/**` (świeży checkout `rust-port/parity-v2`), oba
read-only. Zero zapisu w `gra/**` ani w `rust-port/engine/**`.

IZOLACJA
Dwa świeże, osobne checkouty read-only: `main` (edb8fb56) i `rust-port/parity-v2` (najnowszy HEAD).
Żadnej modyfikacji kodu w tym temacie.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (treść klasyfikacji w pliku, nie w raporcie).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
