STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-1-DOMAIN-MODULES-Q1
GOAL: Pierwszy temat fazy P2 — katalog 15 modułów domeny: pliki web na pinie edb8fb56, odpowiednik
w `rust-port/engine`, klasyfikacja startowa z P1-17C.

RUNDY: 1/5 (Operator → Evaluator 8 zarzutów — błędne „BRAK" dla rzek [istnieje częściowa
implementacja w `map_generator.rs`], pominięte trafienia kultury/religii i państw-miast w
`parity-v2` [w tym jawny znacznik `cityStatesCount:NOT_IMPLEMENTED`], pominięte granice lądowe w
`trade.rs`, błędne twierdzenie że `rust-port/engine` nie istnieje na `main` [istnieje, mniejsza
wersja — 18 plików vs 28 na `parity-v2`], niepełna lista 33 plików modułu Dyplomacja, niejednoznaczne
przypisanie `villageRewards`, niedoprecyzowane uzasadnienie odroczenia 3 plików → Obrona 8×PRZYJMUJE
→ Final Control 8×ODDAL, zweryfikowane niezależnie przez `git ls-tree`/`git show`/`grep` na obu
pinach web i Rust).

ZMIANY/COMMIT: nowy katalog i plik `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md`.

WYNIK: 183/183 plików `gra/src/game` przypisane (172 do 15 modułów domeny, 11 jawnie ODROCZONE z
powodem — victory.ts i 2 inne, do decyzji w P2.2). Dla każdego modułu: pliki web + linie, stan w
`rust-port/engine` (CZĘŚCIOWO/BRAK z dowodem code-level, nie domysłem), klasyfikacja startowa z
P1-17C. Kluczowe ustalenia: rzeki mają częściową implementację w `parity-v2` (deterministyczne
ścieżki od źródeł, ale bez pełnej topologii — odnotowane w samym kodzie jako „późniejsza faza");
państwa-miasta mają jawny znacznik `NOT_IMPLEMENTED` w `playable.rs:167`; kultura/religia i
manpower/hot-seat/forced-war potwierdzone jako BRAK (0 trafień) w `parity-v2`.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora. Kolejna fala P2 (kontrakt `GameState`, ID encji, RNG —
P2.2-P2.4) zależy architektonicznie od tego katalogu, dispatch natychmiast po integracji.
DEPLOY/PUSH: NIE WYKONANO
