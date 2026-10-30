STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1
GOAL: Niezalezna weryfikacja rundy 4 (Operator-impl `8f866ee2`, raport `41e98956` / `05-operator-r4.md`): 4 naprawy zarzutow Evaluatora r3 (wealth granica pula == prog, znak zera js_max/js_min, gold-deficit pick z NaN/Infinity, js_round k+0.5 i -0). Wektory regenerowane z weba `91dc998a`, mutacje, bramki fmt/clippy/test z surowymi logami i EXIT. Bez push, bez integracji.
ZMIANY/COMMIT: Baza weryfikacji: `41e98956` (detach; kod = `8f866ee2`, raport Operatora = `41e98956`). Kod portu i `gra/**` nie zmieniane przez weryfikatora. Zmiany w kodzie: `git diff a2e6f837 8f866ee2 -- gra` puste; `renderer`, `src-tauri`, `Cargo.toml`, `WERSJE.md` nietkniete. Zmienione pliki (w calosci w allowlicie): rust-port/engine/tests/p6_8d_gold_deficit.rs, rust-port/engine/tests/p6_8d_wealth.rs, rust-port/engine/tests/p6_8d_vectors/gold_deficit.json, rust-port/engine/tests/p6_8d_vectors/wealth.json, runs/.../gen-p6-8d-gold-mennica-vectors.mjs, gen-p6-8d-wealth-vectors.mjs, mut-gold-mennica.sh, mut-wealth.sh, 05-operator-r4.md. Commit weryfikatora: wylacznie ten raport (`06-verifier-r4.md`). `turn_economy.rs` po mutacjach przywrocony i zweryfikowany `cmp` (identyczny z kopia pre-mutacyjna).
TESTY:
- Regeneracja wektorow: `git archive 91dc998a gra/src gra/data` do scratchpad, node 22 z `--experimental-transform-types --import ./repin-b-loader-register.mjs`:
  - gen-p6-8d-gold-mennica-vectors.mjs: EXIT 0; "params=25 advance=40 statMult=132 hpLoss=120 mennica=10"
  - gen-p6-8d-wealth-vectors.mjs: EXIT 0; "load=16 fn=1344 advance=43"
  - cmp gold_deficit.json: IDENTYCZNE; mennica_zloto_grace.json: IDENTYCZNE; wealth.json: IDENTYCZNE (wzgledem commitowanych wektorow).
  - Rozmiary: gold_deficit.json 1325584 B, wealth.json 497696 B (<= 10 MB).
- cargo fmt --all -- --check: EXIT 0 (log: scratchpad/v4/fmt.log).
- cargo clippy --all-targets -- -D warnings: EXIT 0 (log: scratchpad/v4/clippy.log).
- cargo test --no-fail-fast (pelny suite engine, CARGO_INCREMENTAL=0, CARGO_PROFILE_{DEV,TEST}_DEBUG=0): EXIT 0; 194 linii "test result", passed=1436 failed=0 (log: scratchpad/v4/test-full.log).
- Targeted (cargo test --test p6_8d_gold_deficit --test p6_8d_mennica_grace --test p6_8d_wealth --test p6_8d_citizen_upkeep): EXIT 0; citizen_upkeep 11/0, gold_deficit 10/0, mennica_grace 5/0, wealth 6/0 (razem 32/0).
- git diff --check a2e6f837 8f866ee2: czysty (bez wyjscia).
- Mutacje gold-deficit + mennica (17 mutantow, lista z mut-gold-mennica.sh): 17/17 KILLED (exit 101 = bledy testow, nie bledy kompilacji; brak SED NO-OP). Mutanty 15 (pick is_finite), 16 (js_round `> 0.5`), 17 (galaz -0 usunieta) KILLED.
- Mutacje wealth (14 mutantow, lista z mut-wealth.sh): 14/14 KILLED (exit 101; brak SED NO-OP). Mutanty 12 (`pula > prog`), 13 (js_max znak zera odwrocony), 14 (js_min znak zera odwrocony) KILLED.
- Unikalnosc wzorcow sprawdzona Grep na turn_economy.rs: is_sign_positive/negative (js_max :392 / js_min :407), `if pula >= prog` (:910), `x - floor >= 0.5` (:609), `Some(x) if x.is_finite()` (:483), `if grace > 0 {` (:1034): po jednym trafieniu, mutacje trafiaja dokladnie w jedno miejsce.
- Logi: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/v4/ (gen-gm.log, gen-w.log, fmt.log, clippy.log, build-test.log, test-full.log, test-p6.log, m1..m17.log, w1..w14.log).
- Uwaga metodyczna: mut-gold-mennica.sh i mut-wealth.sh nie zostaly uruchomione jako pliki (`bash mut-*.sh`), bo narzedzie srodowiska odmowilo uruchomienia skryptu zawierajacego wywolanie git. Te same sed-wyrazenia, te same polecenia cargo test z tymi samymi filtrami i ta sama procedura przywracania (cmp po kazdym mutancie) wykonano recznie, po jednym mutancie na polecenie. Wyniki identyczne z oczekiwanymi (wszystkie KILLED).

BLOKADY:
- Brak blokad testow ani wektorow.
- Incydent srodowiskowy (naprawiony, bez wplywu na wynik): pierwsze uruchomienie `cargo test` (bez `CARGO_PROFILE_*_DEBUG=0`) przebudowalo crate z debug info i zapelnilo dysk (`rustc-LLVM ERROR: IO failure`, `No space left on device`). Usunieto wylacznie `rust-port/engine/target/` tego worktree (katalog regenerowalny, nieskomitowany), przebudowano z flagami z dispatchu, pelny suite przeszedl. Cudze worktree i stash nie byly dotykane.
- Poza zakresem tematu (potwierdzone Grep): `advance_wealth`, `apply_gold_deficit_hp_loss` i `wealth_params_with_*` nie maja wywolan poza testami i `turn_economy.rs`/`city_growth.rs`; `state.rs` nie jest podpiete (wealth :1661, :1759 wg 04-verifier-r3.md). Integracja w osobnej partii, nie blokuje tego tematu.
- Brak dokumentu tematu P6-8 w HEAD (`dyspozycje/rust-port/p6/P6-8*` nie istnieje; Glob pusty). Dokumentacja tematu = raporty 02/03/04/05/06 w katalogu runu (zgodnie z Z-R4-1).
- Untracked, nie wchodzi do commita: `rust-port/engine/Cargo.lock`, `rust-port/engine/target/`.
- Srodowisko: dysk byl bliski zapelnienia podczas budowy testow (patrz incydent wyzej). Ryzyko ENOSPC przy kolejnych buildach.

ZALOZENIA (bez pytan ABC, rozstrzygniete w dokumencie):
- Z-V4-1: wektory z `git archive 91dc998a` (poza repo, scratchpad) uznane za wzorzec; zgodnosc bajt w bajt potwierdza, ze commitowane wektory sa z weba 91dc998a.
- Z-V4-2: mutant uznany KILLED, gdy `cargo test` konczy sie niezerowo bez bledu kompilacji (exit 101 z bledem testu).
- Z-V4-3: zalozenia 1-10 z 02-operator-r3.md bez zmian; weryfikator nie kwestionuje ich w tej rundzie.

RUNDY: 4/5 (weryfikacja Operatora-impl r4; bez nowej rundy Operatora).
NASTEPNY KROK: Final Control (ten sam ID) na `8f866ee2` / `41e98956`; osobna partia `state.rs` (wealth :1661, :1759) przed uznaniem 8D za zintegrowane. Integracja i READY_FOR_DEPLOY poza tym raportem.
DEPLOY/PUSH: NIE WYKONANO
