STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: Paczka MOD-13 (wioska-oboz, siegeCampModels, siegeMarker, siegeCampSync CPU, rangeOverlay + map/territory-border, tradeRoutesOverlay, robloxCity tylko addRobloxSkyDecor) w Rust 1:1 z webem `edb8fb56`, nakładki jako bufory CPU.
ZMIANY/COMMIT: tylko ten plik (allowlista `dyspozycje/autobot/runs/<ID>/**`), commit na bazie Evaluatora r3 `713e3646c` (gałąź dokumentacyjna `origin/claude/rust-sivvrn` + raport r3). Brak zmian w kodzie: żaden zarzut nie wymaga poprawki w `rust-port/renderer/**`. Bez zmian w `gra/**`, `rust-port/engine/**`, `Cargo.lock`.
TESTY: własny bieg na `origin/rust-port/parity-v2` = `525a2ef7b` (git archive do scratch, `CARGO_TARGET_DIR` w scratch, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`): `cargo fmt --all -- --check` FMT EXIT=0; `cargo test --locked --test misc_web_parity` TEST EXIT=0, 11 passed, 0 failed, 0 ignored. MD5 `rust-port/renderer/Cargo.lock` przed i po: `a0b5ccdff90bc125d01377b579a99e5d` (bez zmian). Pełnych bramek nie powtarzałem: kod się nie zmienił, Evaluator r3 ma pełne logi EXIT=0 (§2, §3 jego raportu). Scratch usunięty.
BLOKADY: brak.
RUNDY: 3/5 (Obrona Operatora, domknięcie wg DODATKU r3)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

Evaluator r3 nie zgłosił zarzutów blokujących. Poniżej odpowiadam na każdą uwagę N1-N5.

### Z0. „Zarzutów blokujących brak” (podsumowanie Evaluatora): PRZYJMUJĘ

Nie ma czego poprawiać. Wynik testu parytetu potwierdziłem własnym biegiem (sekcja TESTY): 11/11 na HEAD parity, w tym `range_overlay_real_relief_matches_web` i `relief_sampler_matches_web` z P4.24.

### N1. Brak `03-operator-r2.md`: PRZYJMUJĘ (bez zmiany kodu, korekta śladu)

Potwierdzam, że plik nie istnieje i że rundy r2 Operatora nie było:
- `git log --all --oneline -- dyspozycje/autobot/runs/R-RUSTPORT-P4-22-MOD13-MISC-Q1/` zwraca tylko `713e3646c`, `e693127f7`, `aac34b521`, `6a1e9ba22`, `f1a1740cc`, `fa94290a4`, `6c5f83224`. Żaden z nich nie dodaje `03-operator-r2.md`.
- `git log --all --grep=MISC` pokazuje dla P4.22 wyłącznie `6c5f83224` (Operator r1), `fa94290a4` (Obrona r1), `f1a1740cc` (Evaluator r1), `713e3646c` (Evaluator r3).

Ostatnim kodem tematu jest **`fa94290a4`** (Obrona r1, `03-operator-obrona-r1.md`). `git merge-base --is-ancestor fa94290a4 origin/rust-port/parity-v2` zwraca 0, więc kod jest w parity `525a2ef7b`. Przy kolejnych dispatchach orkiestrator powinien wskazywać `03-operator-obrona-r1.md` / `fa94290a4` zamiast `03-operator-r2.md`. Plik dispatchu jest poza moją rolą, a ten raport zapisuje poprawny odnośnik.

### N2. Nieistniejące SHA w raportach r1: PRZYJMUJĘ (mapowanie poniżej)

Potwierdzam: `git cat-file -t 03c8e0ee`, `9b574147` i `e06090bf` (ten ostatni cytuje `dyspozycje/rust-port/LEDGER.md:155`) zwracają `fatal: Not a valid object name`. Commity przepisano przy rebase z `e1d69078` na `2a45e3409`. Mapowanie ustaliłem po temacie commita, zakresie plików i kolejności rodziców (`git log --format='%h %p %s' -4 f1a1740cc`):

| SHA w raportach r1 / LEDGER | SHA w repo | Treść | Dowód |
|---|---|---|---|
| `03c8e0ee` (Operator r1, rodzic `e1d69078`) | `6c5f83224` (rodzic `2a45e3409`) | feat MOD-13 misc | jedyny commit „MOD-13 misc … (R-RUSTPORT-P4-22-…)”, a `git diff --stat 6c5f83224^ fa94290a4` daje 22 pliki = 21 plików r1 + `03-operator-obrona-r1.md` |
| `e06090bf` (Obrona r1, LEDGER) | `fa94290a4` (rodzic `6c5f83224`) | fix obrona r1 | 3 pliki: `03-operator-obrona-r1.md`, `P4-22-MOD13-MISC.md`, `overlay.rs` (+17, test równoważności toFixed), co odpowiada opisowi w `03-operator-obrona-r1.md:5` |
| `9b574147` (Evaluator r1) | `f1a1740cc` (rodzic `fa94290a4`) | docs Evaluator r1 | 1 plik: `02-evaluator-r1.md` (+57) |

Orkiestrator powinien przy domknięciu poprawić `LEDGER.md:155` na `6c5f83224` / `fa94290a4`. Ten plik jest poza allowlistą tego tematu.

### N3. Przeżyłe mutanty strażników zdegenerowanych: ODRZUCAM jako lukę testów (mutanty są równoważne, a nie tylko „ryzyko teoretyczne”)

Dla obu nowych mutantów pokazuję, że w dziedzinie wejść nie istnieje wektor, który by je rozróżnił. Testu dodać się nie da, bo każdy test dałby ten sam wynik dla oryginału i mutanta.

1. **`territory.rs` (HEAD `:209`) `js_hypot(last-first) < 1e-4` → `< 1e-3`**, web `territory-border.ts:218`.
   - Pętla kończy się domknięciem tylko przy `at_key == start.v0_key` (`territory.rs:194`, web analogicznie). Klucz to `toFixed(5)` dla x i z (`territory.rs:45-53`, web `territory-border.ts:64`). Ten sam string oznacza, że |Δx| ≤ 1e-5 i |Δz| ≤ 1e-5, więc hypot ≤ 1,415e-5. To jest < 1e-4 i < 1e-3, czyli obie wersje usuwają punkt.
   - Pętla przerwana bez domknięcia (brak następnej krawędzi albo `max_steps`) kończy się na wierzchołku o innym kluczu. Różne wierzchołki siatki heksów o `HEX_R = 1` (`unit_core/consts.rs:9`) dzieli co najmniej długość krawędzi, czyli 1. To jest ≥ 1e-3, więc obie wersje zostawiają punkt.
   - Przedział [1e-4, 1e-3) jest w dziedzinie pusty. Mutant jest równoważny.

2. **`range.rs` (HEAD `:424`, w `fa94290a4` `:388`) `len > 1e-9` → `> 1e-3`** w `push_drape_triangle`, web `rangeOverlay.ts:313`.
   - `ny = uz·vx − ux·vz` nie zależy od wysokości reliefu: składowe y nie wchodzą do `ny`. Dlatego `len = hypot(nx, ny, nz) ≥ |ny| = 2·A_xz`, gdzie A_xz to pole rzutu trójkąta na XZ.
   - Trójkąty powstają z podziału sektora (środek, róg i, róg i+1) heksu o promieniu `HEX_R·0,97` (`range.rs:503`, `HUG_RELIEF_RADIUS_FRAC`) na siatkę `n = 4` (`range.rs:466-489`). Daje to 16 trójkątów o równym polu.
   - Obliczyłem minimalne |ny| po wszystkich 6×16 trójkątach (python, obie orientacje rogów): **0,050927706**. Analitycznie to 2·(√3/4·0,97²)/16 = 0,0509277.
   - Dla dowolnego reliefu (także NaN/Inf) zachodzi więc: wartość skończona daje len ≥ 0,0509 > 1e-3 > 1e-9, czyli obie wersje normalizują. NaN daje `NaN > próg` = false w obu wersjach. +Inf daje true w obu wersjach. Mutant jest równoważny dla wszystkich wejść osiągalnych z `build_relief_drape_mesh`, bo `push_drape_triangle` nie ma innego wołającego.

Pozostałe 3 przeżyłe mutanty z r1 (cache reliefu, `cross <`→`>`, nawiasy `/2.0`) mają uzasadnienie równoważności w `02-evaluator-r1.md` i `03-operator-obrona-r1.md`, które Evaluator r3 potwierdził (§5). Progi są przepisane 1:1 z weba. Zmiana progu w Rust na „bardziej testowalny” byłaby odejściem od parytetu (zasada 9 CLAUDE.md).

### N4. `overlays.json` przepięty przez REPIN-3D-B1 na `86d510c66`: ODRZUCAM jako zarzut wobec P4.22 (poza zakresem, opisane)

Przepięcie zrobiły tematy REPIN-3D B1 (`cb00afecd`) i B4 (`8f5aa88d7`) po integracji P4.22. Jedyna różnica to `MINE_ELIGIBLE_TINT_OPACITY` 0,30 → 0,36 (`rangeOverlay.ts:477`). Opisuje ją `tests/fixtures/misc/README.md:1-10` na HEAD parity, który przeczytałem. `models.json` i `siege.json` odtwarzają się bajt w bajt. Test `misc_web_parity` przechodzi na HEAD (11/11, mój bieg). Zakres P4.22 (pin `edb8fb56`) Evaluator r3 zweryfikował osobno na `fa94290a4` (SHA-256 fixtur identyczne z generatorem). Nie ma tu nic do poprawy w tym temacie.

### N5. NIE_ZMIERZONO (ocena wzrokowa/GPU, sprite ⚔ D-MOD-6): PRZYJMUJĘ jako stan zgodny z dispatchem

Dispatch nakazuje oznaczyć ocenę wzrokową jako NIE_ZMIERZONO, bo środowisko nie ma GPU. Lista „co ocenić wzrokiem po RR-T5” jest w `P4-22-MOD13-MISC.md` §5. Rasteryzacja sprite'a ⚔ zależy od D-MOD-6 (canvas/tekstura), którego CPU nie rozstrzyga. W tej rundzie nie da się tego zmierzyć. Pozostaje to NIE_ZMIERZONO do etapu GPU (RR-T5).

## Podsumowanie

Poprawki kodu: 0. Odpowiedzi: Z0 i N1, N2, N5 przyjęte, w tym korekta śladu audytowego (mapowanie SHA, poprawny odnośnik rundy). N3 i N4 odrzucone z dowodem: N3 przez dowód równoważności mutantów w dziedzinie, N4 jako zmianę poza zakresem, opisaną i przechodzącą testy. Rekomendacja: Final Control na `fa94290a4` (kod tematu) oraz `525a2ef7b` (stan po integracji).
