STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1
GOAL: port 1:1 profilu wojny/pokoju per cywilizacja (`diplomacy-war-peace-profile.ts`, dane `diplomacy-war-peace-params.json`, czyste rdzenie `main.ts:10225-10324`) z pinu `23dd158e9`; baza `origin/rust-port/parity-v2` (`66df65a1b`).

ZMIANY/COMMIT: kod+wektory+dowody `CODE_SHA` (poprzedzają go commity WIP `ec61b2461`, `470e45912`, `f5b02b036` i trzy doskalowania wektorów); commit raportu = HEAD gałęzi worktree (SHA w odpowiedzi).
* NOWE: `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs` (nagłówek: mapowanie web plik:linia + ZAŁOŻENIA), `rust-port/engine/data/derived/diplomacy-war-peace-params.json` (kopia pinu, `cmp` bajt w bajt), `tests/p6_dyplomacja_profil_wojny_pokoju.rs` + `tests/p6_dyplomacja_profil_wojny_pokoju_vectors/*.json` (8 plików, ok. 9 MB, każdy ≤ 3,2 MB), `dyspozycje/rust-port/p6/P6-DYPL-2.md`, generator/weryfikator/mutacje/shard-test w katalogu runu.
* ISTNIEJĄCE: `domain/mod.rs` +1 linia `pub mod diplomacy_war_peace_profile;`. Zero zmian w `gra/**`, `diplomacy.rs`, `session.rs`, `state.rs`, `Cargo.toml`, `renderer/**`, `src-tauri/**`, `WERSJE.md`. Poza allowlistą: `rust-port/engine/Cargo.lock` powstał przy buildzie (nieśledzony, NIE commitowany). Dane `civ-matrix.json` i `ai-params.json` w Rust identyczne z pinem (`cmp`), więc brak nowych danych pochodnych.

ZAKRES (doc sek. 1, 100%): wszystkie 14 funkcji/stałych `diplomacy-war-peace-profile.ts` oraz czyste rdzenie 5 domknięć `main.ts` (`diploArmyHealthShare`, `diploWarStateFor`+`diploEnsureWarStart`, `diploRelWarFields`, `diploProposalWarState`, `diploBrakeWarParams`). Niezaportowane: domknięcia zależne od stanu sesji (`diploWarProfileOf`, `recordWarCityLossForPair`, `diploBrakeCrisisStep`) — jawnie w doc.
`premiaProfilObronny` 0,05: 1:1 jako wartość z JSON (ZAŁOŻENIE Z2 w doc i w nagłówku modułu); test potwierdza przykłady z opisu JSON (Zulusi 0,33; Chińczycy 0,54).

TESTY:
* `cargo test --test p6_dyplomacja_profil_wojny_pokoju` 10/10, wektory z URUCHOMIONEGO weba (funkcje modułu z bundla esbuild z czystego `git archive 23dd158e9`; rdzenie `main.ts` przepisane w generatorze z numerami linii, Z7). Wektory: profil 5761, zmęczenie 778, rejestr 6006, hamulec 140, sygnały 16680, ceny 1370, bramka 13590, rdzenie 5543; N-1/N/N+1 (±ULP), NaN, `undefined`, ±Infinity, -0; porównanie bitowe.
* Weryfikator `python3 -I`: 177 275 sprawdzeń, 0 rozbieżności; kontrola negatywna 3249 rozbieżności (wykryte).
* Mutacje: 91, zabitych 91, równoważnych 0, kompilacyjnych 0; brutto 100%. Cztery mutanty przeżyły w pierwszym podejściu ([03] [06] [42] [71]) → dopracowano wektory → zabite (`mutacje-wynik.txt`). Uwaga: mutanty biegły na wektorach z kolejnych etapów (gen1..gen5, tylko dodawano przypadki); pełny jeden przebieg 91 na wektorach ostatecznych NIE_ZMIERZONO (wymaga ok. 90 min).
* Bramki: `cargo fmt --check` EXIT=0; `clippy --all-targets -D warnings` EXIT=0; `git diff --check` (po `git add -N`) czyste; pełny `cargo test -j 2` w 8 shardach PO ostatniej zmianie kodu: 2108 passed / 0 failed (`gate-test-full.txt`; shard 6 zawiera `--doc`).

BLOKADY: brak. NIE_ZMIERZONO: PRZED (baza) osobnym przebiegiem w tym worktree (PO−10 = 2098, bo moduł nie dodaje testów w `lib`); pojedynczy przebieg weba przez całe `main.ts` (wymaga DOM) — zastąpiony przepisanymi rdzeniami (ryzyko Z7).

RUNDY: 1/5

NASTĘPNY KROK: Evaluator R1 (sprawdzić: zgodność przepisanych rdzeni generatora z `main.ts:10225-10324`; ZAŁOŻENIA Z1-Z8; pełny przebieg 91 mutantów na wektorach ostatecznych; PRZED/PO; konflikt `mod.rs` z TRUCE-AGRESOR).

DEPLOY/PUSH: NIE WYKONANO
