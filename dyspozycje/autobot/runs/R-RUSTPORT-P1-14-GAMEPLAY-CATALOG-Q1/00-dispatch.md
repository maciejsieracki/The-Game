STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-14-GAMEPLAY-CATALOG-Q1
GOAL: P1.14 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog mechanizmów gameplayu z podziałem na
podsystemy (serce portu): ekonomia tury, miasta, jednostki, walka, AI, dyplomacja, kultura/religia,
cuda/technologie, państwa-miasta, barbarzyńcy, hot-seat, save/load. Na pinie main=edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Korzystając z gotowego katalogu plików `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md` (751 plików
`gra/src/game` i in.), przypisać każdy plik do DOKŁADNIE JEDNEGO z 12 podsystemów z GOAL (albo do
"INNE/INFRA" jeśli nie pasuje do żadnego — np. util/telemetry), i zapisać w
`dyspozycje/rust-port/p1/P1-14-GAMEPLAY-CATALOG.md`: tabelę plik→podsystem z jednozdaniowym
uzasadnieniem (nazwa/eksporty/importy), oraz dla KAŻDEGO z 12 podsystemów: liczbę plików, łączną liczbę
linii, 2-3 zdania streszczenia co ten podsystem robi (na podstawie realnego odczytu głównego pliku
podsystemu, nie zgadywania). To jest materiał wejściowy do P2.1 (moduły domeny Rust) i P6 (gameplay
core) — ma być wyczerpujący, pokrywać WSZYSTKIE 751 plików z P1.1, nie podzbiór.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przypisania pliku do podsystemu wyłącznie na podstawie nazwy bez otwarcia pliku przy
niejednoznacznych przypadkach (np. plik dotykający 2+ podsystemów — opisać to wprost, nie wybierać
arbitralnie). Streszczenia podsystemów muszą cytować konkretny plik+funkcję jako dowód, nie być
ogólnikowe.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, WSZYSTKIE 751 plików z P1-1-FILE-CATALOG.md mają przypisany dokładnie jeden podsystem
(suma = 751), każdy z 12 podsystemów ma streszczenie z dowodem (ścieżka+linia).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-14-GAMEPLAY-CATALOG.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-14-GAMEPLAY-CATALOG-Q1/**`. Odczyt: `gra/src/**` read-only
(main edb8fb56) + `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md`. Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa. To duży temat (751 plików) —
dozwolone jest grupowanie plików w klastry przy jednoznacznym podsystemie (np. cały katalog
`game/forced-war-*` = AI), żeby nie czytać linia po linii każdego pliku, ale każdy plik musi mieć
wiersz w tabeli końcowej.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 500 słów (duży temat, ale treść katalogu w pliku, nie w raporcie).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
