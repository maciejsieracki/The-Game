STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-3-ENTITY-IDS-Q1
GOAL: Zaproponować schemat ID encji i relacji (miasto↔właściciel, jednostka↔miasto, hot-seat: dwóch
ludzkich właścicieli) oraz pełne porównanie pól `UnitState`/`CityState` (web `RuntimeUnit`/`City` vs
Rust `UnitDto`/`CityDto`) pole po polu. PROPOZYCJA, nie ostateczna decyzja — każdy punkt bez
jednoznacznej odpowiedzi w materiale źródłowym ma być oznaczony jako wymagający decyzji, nie
rozstrzygnięty po cichu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Drugi temat architektoniczny fazy P2, następca `P2-2-GAMESTATE-CONTRACT`. Przeczytaj OBOWIĄZKOWO:
`dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` (CAŁY, zwłaszcza §2 szkielet i §8 rozstrzygnięcia
— D4 [kanon tożsamości = `CivilizationKind`], D10 [to jest WŁAŚNIE Twoje zadanie], punkty 9/10),
`dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md` (macierz hot-seat z P1), `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md`
(co już istnieje w Rust — `UnitDto`/`CityDto`/`PlayablePlayer` itd., NIE projektuj od zera tam gdzie
coś już jest).

ZADANIE
1. Zaproponuj schemat ID: typ ID (np. `u32`/`u64`/UUID), czy ID są globalne czy per-typ (miasto #5
   vs jednostka #5 to różne byty), czy ID są stabilne między turami/zapisami (web: sprawdź czy
   istnieje stabilny identyfikator w `City`/`RuntimeUnit` na pinie edb8fb56, czy ID są generowane od
   nowa przy wczytaniu).
2. Dla relacji miasto↔właściciel, jednostka↔miasto: jak są dziś reprezentowane w web (pole
   `ownerId`/`cityId` czy coś innego) i w Rust (`owner_id` w DTO) — zaproponuj kanoniczną formę.
3. Hot-seat (dwóch ludzkich właścicieli): sprawdź P1-18-HOTSEAT-MATRIX.md i P2.2 D2
   (`activeHumanOwnerId`/`humanOwnerIds` → `owners` w `GameState`) — zaproponuj jak schemat ID
   wspiera przełączanie aktywnego właściciela-człowieka bez utraty stanu pozostałych.
4. PEŁNE porównanie pól `UnitState` (dziś 4 pola w `UnitDto`) vs web `RuntimeUnit` — dla KAŻDEGO pola
   web: czy jest w Rust, jakiego typu, z dowodem (plik:linia po obu stronach). To samo dla
   `CityState` (dziś 5 pól w `CityDto`) vs web `City`.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania schematu ID z intuicji bez sprawdzenia FAKTYCZNEGO typu pola `id` w web i Rust na
pinach. Zakaz pomijania pól przy porównaniu `UnitState`/`CityState` — to jest named explicite jako
niedokończone w P2.2 (D10), więc oczekiwane jest wyczerpujące pokrycie, nie próbka.

BINARNE KRYTERIUM SUKCESU
Schemat ID z uzasadnieniem i dowodem. Każde pole `RuntimeUnit`/`City` (web) ma wiersz: nazwa, typ,
czy jest w Rust (tak/nie+nazwa pola), z dowodem plik:linia po obu stronach — w nowym pliku
`dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-3-ENTITY-IDS-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P2.2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — pełna tabela pól).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
