STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1
GOAL: Katalog mapowania ID danych — web `gra/data/*.json` (30 plików wg P1.12) → struktury Rust w
`rust-port/engine` na `rust-port/parity-v2` — z zachowaniem kluczy (plan P2.9). To jest katalog
faktów, NIE decyzja projektowa.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Trzeci temat fazy P2, równoległy do `R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1` (inny plik, bez kolizji).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (katalog modułów, PASS),
`dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md` (katalog 30 plików `gra/data/*.json` z P1), oraz
sprawdź `rust-port/engine`/`rust-port/parity-v2` pod kątem struktur danych (Rust structs/serde) które
odpowiadają tym plikom JSON.

ZADANIE
Dla KAŻDEGO z 30 plików `gra/data/*.json` (cywilizacje, epoki, tereny, budynki, jednostki, zasoby,
dyplomacja, handel, kultura/religia, parametry AI, itd. — pełna lista w P1-12-DATA-CATALOG.md):
1. Czy istnieje odpowiadająca struktura Rust (struct/enum) w `rust-port/engine` na `parity-v2`?
   Jeśli tak — ścieżka pliku, nazwa struktury.
2. Czy klucze pól JSON (polskie nazwy, np. `koszt_surowce`, `epokaWejscia`) są zachowane 1:1 w
   strukturze Rust, czy przemianowane/przetłumaczone? Dla KAŻDEGO przemianowanego pola: stare→nowe.
3. Czy istnieje mechanizm wczytywania tych JSON-ów do Rust (serde deserialize, ścieżka pliku
   wczytywania) na `parity-v2`, czy tylko struktury bez loadera?

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania istnienia struktury z samej nazwy pliku Rust — sprawdź FAKTYCZNE pola struct i
porównaj z realnymi kluczami JSON na pinie edb8fb56 (`git show edb8fb56:gra/data/<plik>.json`).

BINARNE KRYTERIUM SUKCESU
Każdy z 30 plików danych ma wiersz: (1) struktura Rust tak/nie+ścieżka, (2) zgodność kluczy z
dowodem (lista rozbieżności albo „zgodne 1:1"), (3) loader tak/nie — w nowym pliku
`dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero
zmian w `gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w tematach P1/P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
