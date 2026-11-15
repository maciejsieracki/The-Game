STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: modele pomocnicze MOD-13 (wioska/obóz, oblężenie, niebo Roblox, nakładki zasięgu, granic i tras handlowych) w Rust 1:1 z webem (pin `edb8fb56`), nakładki jako bufory CPU, bez GPU.
ZMIANY/COMMIT: ten raport (jedyny nowy plik) na `445277178` (Obrona r3). Kod tematu: `fa94290a4` (Operator r1 `6c5f83224` + Obrona r1). Kodu nie zmieniałem.
TESTY: bramki uruchomione SAMODZIELNIE, opis niżej, wszystkie EXIT=0.
BLOKADY: brak.
RUNDY: 3/5
NASTĘPNY KROK: orkiestrator: wpis w rejestrze i korekta SHA w `LEDGER.md:155` (N2); kod już jest w `rust-port/parity-v2`, nowej integracji kodu nie trzeba.
DEPLOY/PUSH: NIE WYKONANO

## Ancestry (sprawdzone `git merge-base --is-ancestor`)

| Relacja | Wynik |
|---|---|
| `6c5f83224` (Operator r1) ⊂ `fa94290a4` (Obrona r1) | TAK |
| `fa94290a4` ⊂ `origin/rust-port/parity-v2` = `525a2ef7b` | TAK (temat zintegrowany) |
| `713e3646c` (Evaluator r3) ⊂ `445277178` (Obrona r3) | TAK |
| baza dokumentacji Evaluatora r3 | `e693127f7` (wcześniejszy stan `claude/rust-sivvrn`; obecny `69928b147` poszedł dalej, sama dokumentacja, bez konfliktu w katalogu runu) |

## Allowlista i diff

`git diff --stat 2a45e3409 fa94290a4`: 22 pliki, +5881/−0. Wszystkie w allowliście:
`src/models/misc/**` (9), `src/models.rs` (dokładnie 1 linia `pub mod misc;`), `tests/misc_web_parity.rs`,
`tests/fixtures/misc/**` (7), `dyspozycje/rust-port/p4/P4-22-MOD13-MISC.md`, katalog runu (3).
Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `Cargo.lock`, `Cargo.toml` (`git diff --name-only … | wc -l` = 0).
`git diff --check` czysty dla `2a45e3409..fa94290a4` i `e693127f7..445277178` (Evaluator r3 + Obrona r3: 2 pliki dokumentacji).

## Bramki (źródła przez `git archive` do scratch poza repo, `CARGO_TARGET_DIR` w scratch, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, crate `rust-port/renderer`)

| Bramka | `fa94290a4` (kod tematu) | `525a2ef7b` (parity-v2 HEAD) |
|---|---|---|
| `cargo fmt --all -- --check` | EXIT=0 | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 | EXIT=0 |
| `cargo test --locked --all-targets` | EXIT=0; 132 passed, 0 failed, 0 ignored | EXIT=0; 472 passed, 0 failed, 0 ignored |
| `misc_web_parity` | 9/9 | 11/11 |
| MD5 `Cargo.lock` przed i po | bez zmian | bez zmian |

Scratch (`target`, drzewa źródeł) usunięty po bramkach.

## Fixtury

SHA-256 na `fa94290a4` zgodne z README fixtur: `models.json` cf17ac9d…, `overlays.json` d590e026…, `siege.json` 06383e4d….
Na HEAD `overlays.json` = dc62fa14… i jest dodatkowo `relief_real.json`. `git log` pliku pokazuje późniejsze zmiany:
`bfa2cd0dd` (P4-24 RELIEF-WIRE), `cb00afecd` (REPIN-3D B1), `8f5aa88d7` (REPIN-3D B4). To nie ten temat.

## Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|
| Z0: brak zarzutów blokujących | ODDAL (potwierdzenie) | moje bramki wyżej, EXIT=0 |
| N1: brak `03-operator-r2.md` | ODDAL | `git ls-tree` katalogu runu: 00, 01, 02, 03-operator-obrona-r1, mut.py. Rundy r2 Operatora nie było. Dispatch r3 zabrania nowego Operatora. Ostatni kod to `fa94290a4` i jest w parity-v2. Błąd tkwi w tekście zadania, nie w temacie. |
| N2: SHA z raportów r1 (`03c8e0ee`, `9b574147`, `e06090bf`) nie istnieją | ODDAL wobec tematu, uwaga dla orkiestratora | Commity przepisano przy integracji. Mapowanie z Obrony r3 jest spójne z `git log` (temat i kolejność commitów). Poprawka `LEDGER.md:155` należy do rejestrów orkiestratora i leży poza allowlistą tematu. |
| N3: przeżyłe mutanty `territory.rs:209` (1e-4→1e-3) i `range.rs:388` (1e-9→1e-3) | ODDAL | Progi są 1:1 z pinem: `git show edb8fb56:gra/src/map/territory-border.ts` l.217 `Math.hypot(...) < 1e-4`, `rangeOverlay.ts` l.313 `if (len > 1e-9)`. Argument równoważności Obrony jest poprawny. Pętla zamknięta (ten sam klucz `toFixed(5)`) daje hypot ≤ ~1,42e-5. Pętla niezamknięta to różne wierzchołki siatki heksów, odległe o co najmniej długość krawędzi. Żadne wejście nie wpada w przedział [1e-4, 1e-3). Zmiana progu w kodzie byłaby odstępstwem od webu. |
| N4: `overlays.json` przepięty przez REPIN-3D | ODDAL | poza zakresem P4.22 (commity wyżej). Test na HEAD przechodzi 11/11. |
| N5: ocena wzrokowa, GPU, rasteryzacja sprite'a ⚔ (D-MOD-6) | ODDAL jako NIE_ZMIERZONO | dispatch każe to oznaczyć. Lista do oceny wzrokiem: `P4-22-MOD13-MISC.md` §5. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## Werdykt

PASS-WITH-NOTES. SHA końcowy kodu: `fa94290a4`, przodek `origin/rust-port/parity-v2` (`525a2ef7b`). SHA końcowy raportów: commit tego pliku na `445277178`.
Uwagi dla orkiestratora:
1. Popraw stare SHA w `LEDGER.md:155` (03c8e0ee→6c5f83224, e06090bf→fa94290a4, 9b574147→f1a1740cc).
2. Ocena wzrokowa (§5) czeka na etap z GPU.
