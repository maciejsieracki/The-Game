STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1
GOAL: Przenieść 1:1 dane z `gra/data/terrain-improvements.json`, `terrain-movement.json`,
`terrain-yields.json`, `map-gen-params.json` do struktur Rust z `serde::Deserialize`, embedded przez
`include_str!`, parsowane w teście jednostkowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Jeden z 5 RÓWNOLEGŁYCH tematów danych fazy P3 (P3-5A..P3-5E), każdy do WŁASNEGO nowego pliku Rust,
zero styku. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` — ZWŁASZCZA
znalezisko o `wyrab.praca_per_tura` (mylącą nazwa — kredytuje DREWNO nie pracę, z P1-16F-ULEPSZENIA)
i rozjazd tartak/kamieniołom (P1-16D-OPISY-EKONOMIA5X: `_meta`=50/turę vs dane=200/turę, przyczyna
nieustalona). `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md` (generator świata NIEZGODNY z web —
`earth-mask-source.png` i `map-gen-params.json` to dane WEJŚCIOWE generatora, ten temat PRZENOSI je
1:1, NIE naprawia generatora — to osobna, znacznie większa praca poza zakresem). `dyspozycje/
rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji cargo). Katalog `gra/data/*.json` czytaj
na pinie `edb8fb56`. Plik `earth-mask-source.png` (binarny) NIE wchodzi do tego tematu — zostaw go,
to osobna kwestia (assety, P3.8).

ZADANIE
1. Dla KAŻDEGO z 4 plików JSON: wczytaj pełną zawartość na pinie, zaprojektuj struktury
   `#[derive(Deserialize)]` 1:1 z kształtem JSON.
2. Skopiuj zawartość każdego pliku JSON (bez zmian) do `rust-port/engine/data/<ta sama nazwa>.json`.
3. Nowy plik `rust-port/engine/src/data/terrain_map.rs`: struktury + funkcje parsujące przez
   `include_str!` + `serde_json::from_str`.
4. Test jednostkowy: każdy z 4 plików parsuje się bez błędu, co najmniej 1 spot-check liczbowy per
   plik — w tym jawne zanotowanie wartości `tartak`/`kamieniołom` z `terrain-improvements.json` (czy
   to 50 czy 200/turę — rozstrzygnij FAKTYCZNIE z pliku, nie z domysłu, to zamyka pytanie z P1.16d).
5. **NIE dotykaj `rust-port/engine/src/lib.rs`, `domain/mod.rs` ani `domain/map_generator.rs`** —
   osobny temat konsolidacyjny/rewiringu później. Test w
   `rust-port/engine/tests/data_terrain_map.rs` z własnym `#[path]` do nowego pliku źródłowego.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zgadywania kształtu JSON z pamięci — czytaj FAKTYCZNĄ zawartość na pinie. Zakaz twierdzenia
"parsuje się" bez wklejonego surowego logu `cargo test`. Zakaz naprawiania/zmieniania wartości
niezgodnych z `_meta` — kopiujesz dane 1:1, tylko ODNOTOWUJESZ rozjazd jeśli go potwierdzisz.

BINARNE KRYTERIUM SUKCESU
4/4 plików JSON ma odpowiadającą strukturę Rust, parsuje się bez błędu w teście jednostkowym z
surowym logiem `cargo test` (exit 0), z co najmniej 1 spot-checkiem liczbowym per plik — w nowym
pliku `dyspozycje/rust-port/p3/P3-5D-DATA-TERRAIN-MAP.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-5D-DATA-TERRAIN-MAP.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1/**`. Worktree: `rust-port/engine/data/terrain-improvements.json`,
`terrain-movement.json`, `terrain-yields.json`, `map-gen-params.json` (kopie 1:1),
`rust-port/engine/src/data/terrain_map.rs` (NOWY), `rust-port/engine/tests/data_terrain_map.rs`
(NOWY). `Cargo.toml` tylko jeśli opisane jawnie w BLOKADY dlaczego konieczne. Zero zmian w
ISTNIEJĄCYCH plikach `.rs`. Zero zmian w `gra/**`.

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
