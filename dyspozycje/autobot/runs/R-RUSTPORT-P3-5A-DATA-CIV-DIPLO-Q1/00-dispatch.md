STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1
GOAL: Przenieść 1:1 (nie podzbiór) dane z `gra/data/civs.json`, `civ-matrix.json`, `civ-params.json`,
`civ-ai.json`, `diplomacy.json`, `diplomacy-acceptance-points.json`, `city-names-pools.json` do
struktur Rust z `serde::Deserialize`, embedded przez `include_str!` i parsowane w teście jednostkowym
(zero mechanizmu ładowania w runtime na tym etapie — to osobny temat P3.9 loader/walidator).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Jeden z 5 RÓWNOLEGŁYCH tematów danych fazy P3 (P3-5A..P3-5E), każdy do WŁASNEGO nowego pliku Rust,
zero styku. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (sekcje
dot. `civs.json`/`civ-matrix.json`/`diplomacy.json` — co już wiadomo o kształcie i rozbieżnościach),
`dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji cargo).
Katalog `gra/data/*.json` czytaj na pinie `edb8fb56` (`git show edb8fb56:gra/data/<plik>`).

ZADANIE
1. Dla KAŻDEGO z 7 plików: wczytaj pełną zawartość (`git show edb8fb56:gra/data/<plik>`), zaprojektuj
   odpowiadające struktury `#[derive(Deserialize)]` 1:1 z kształtem JSON (nazwy pól jak w JSON, użyj
   `#[serde(rename)]` gdzie nazwa nie jest poprawnym identyfikatorem Rust; zachowaj TYPY z JSON —
   liczby jako liczby, nie stringi, chyba że JSON ma string).
2. Skopiuj zawartość każdego pliku JSON (bez zmian) do `rust-port/engine/data/<ta sama nazwa>.json`
   (nowy katalog danych w crate, embedded przez `include_str!` w nowym pliku Rust).
3. Nowy plik `rust-port/engine/src/data/civilizations.rs`: struktury + stała/funkcja parsująca każdy
   z 7 plików przez `include_str!` + `serde_json::from_str`.
4. Test jednostkowy w TYM SAMYM pliku (`#[cfg(test)] mod tests`): każdy z 7 plików parsuje się bez
   błędu, oraz przynajmniej 1 spot-check liczbowy per plik (np. liczba cywilizacji w `civs.json`
   zgadza się z liczbą policzoną niezależnie przez `jq`/Python na pinie `edb8fb56`).
5. **NIE dotykaj `rust-port/engine/src/lib.rs` ani `domain/mod.rs`** — to osobny temat konsolidacyjny
   po zamknięciu wszystkich 5 tematów P3-5A..E (unikanie kolizji przy równoległym dispatchu). Twój
   test jednostkowy musi kompilować się i działać SAMODZIELNIE — użyj w pliku testowym
   `#[path = "../../src/data/civilizations.rs"] mod civilizations;` jeśli potrzebujesz odizolowanej
   kompilacji, albo zwykłego `mod data_civilizations;` wewnątrz NOWEGO pliku testowego w
   `rust-port/engine/tests/data_civilizations.rs`, który sam deklaruje `#[path]` do Twojego nowego
   pliku źródłowego — nie edytuj żadnego ISTNIEJĄCEGO pliku poza `Cargo.toml` (dodanie zależności
   jeśli `serde_json` nie jest jeszcze zależnością bezpośrednią — sprawdź, prawdopodobnie już jest
   jako dev-dependency, wtedy przenieś do zwykłych `[dependencies]` TYLKO jeśli to wymagane i opisz to
   jawnie jako zmianę współdzieloną w raporcie).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zgadywania kształtu JSON z pamięci/domysłu — czytaj FAKTYCZNĄ zawartość każdego pliku na pinie.
Zakaz twierdzenia "parsuje się" bez uruchomionego testu z wklejonym surowym logiem `cargo test`.

BINARNE KRYTERIUM SUKCESU
7/7 plików JSON ma odpowiadającą strukturę Rust, parsuje się bez błędu w teście jednostkowym z
surowym logiem `cargo test` (exit 0), z co najmniej 1 spot-checkiem liczbowym per plik — w nowym
pliku `dyspozycje/rust-port/p3/P3-5A-DATA-CIV-DIPLO.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-5A-DATA-CIV-DIPLO.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/**`. Worktree (`rust-port/parity-v2`): NOWE pliki wyłącznie —
`rust-port/engine/data/civs.json`, `civ-matrix.json`, `civ-params.json`, `civ-ai.json`,
`diplomacy.json`, `diplomacy-acceptance-points.json`, `city-names-pools.json` (kopie 1:1),
`rust-port/engine/src/data/civilizations.rs` (NOWY), `rust-port/engine/tests/data_civilizations.rs`
(NOWY). `Cargo.toml` — tylko jeśli opisane jawnie w BLOKADY dlaczego konieczne. Zero zmian w
ISTNIEJĄCYCH plikach `.rs` poza tym. Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2` (HEAD `9e33fc77`). Commit w worktree
dozwolony, PUSH zdalny NIE.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
