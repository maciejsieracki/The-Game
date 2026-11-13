# 02a-obrona — R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1 (#134)
GOAL: odpowiedź na zarzuty Evaluatora z `02-evaluator.md` (commit 03faa12e0); poprawka zarzutów 1–4, obrona zarzutu 5 jako zakres.
ZMIANY/COMMIT: SHA poprawki **9687a72b8** (gałąź odłączona w worktree `wf_08013046-e0f-3`, baza `b9b180873` = przodek; nie pushowano). Allowlista: `rust-port/engine/tests/p6_combat_melee_gen.mjs`, `rust-port/engine/tests/p6_combat_melee_vectors/vectors.json`, `rust-port/engine/tests/p6_combat_melee.rs`. Cargo.lock nietknięty.
TESTY: patrz sekcja „Dowody” niżej. Bramki cargo NIE_ZMIERZONO (patrz BLOKADY).
BLOKADY: NIE_ZMIERZONO — `cargo fmt --check` (uruchomiony jako `rustfmt --edition 2021 --check` na zmienionym pliku: EXIT 0), `cargo clippy`, `cargo test --lib`, `cargo test --test p6_combat_melee` i pełny `cargo test --no-fail-fast` NIE uruchomione w tej rundzie: dysk `/` ma 379 MB wolnego (99% zajęte), a kompilacja crate'a wymaga kilku GB. Nie ryzykowano zapełnienia dysku. Orkiestrator musi odpalić bramki na zdrowym dysku przed FC. Port (#136) i porównanie z portem: poza zakresem.
RUNDY: 2/5 (runda 1 = Operator r1, runda 2 = ta obrona; FC wymaga ponownej oceny Evaluatora).
NASTĘPNY KROK: Evaluator r2 ponownie liczy liczniki i sprawdza generator (cmp); potem bramki cargo na wolnym dysku.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### Zarzut 1 (BLOKUJĄCY): NaN/Infinity/-0 gubione w input — PRZYJMUJĘ
Potwierdzenie na `b9b180873` (przed poprawką), zmierzone na `vectors.json`:
- `input.attacker` + `input.defender`: 25 + 40 = **65 pól null** (zgodnie z zarzutem).
- `input.modsCharge` + `input.modsRound`: 41 + 50 = **91 pól null** (zgodnie z zarzutem).
Przyczyna: generator w `mkInput`/`cases.push` wstawiał `attacker: c.attacker` i `modsCharge: { atk: c.modsCharge.atkA, ... }` surowo, bez `enc()`. Raport Operatora twierdził, że wartości specjalne są kodowane — dla tych pól to nie była prawda.
Poprawka (commit 9687a72b8): dodane `encRec` (enc na każdej liczbie obiektu); `attacker`, `defender`, `modsCharge.{atk,def}`, `modsRound.{atk,def}` idą przez `encRec`. Po regeneracji: **0 null** i **0 surowych liczb niecalkowitych** we wszystkich czterech polach (`chk` na wektorach z commitu 9687a72b8).

### Zarzut 2 (BLOKUJĄCY): surowe liczby niecałkowite w input — PRZYJMUJĘ
Potwierdzenie przed poprawką: attacker 2904 + defender 2884 surowych floatów (statystyki) oraz modsCharge 3873 + modsRound 3872 (mnożniki) = 7745 mnożników, zgodnie z zarzutem.
Poprawka: `encRec` zamienia każdą niecałkowitą liczbę na napis (`String(x)`, czyli najkrótsza reprezentacja round-trip), całkowite pozostają liczbami. Po poprawce surowych floatów w input jest **0**, więc parsowanie serde_json nie może rozjechać się o 1 ulp na tych polach. Spójność: wszystkie liczby wejściowe są teraz kodowane tak samo jak pozostałe pola input (`decJs`/`enc`). Kwestia `float_roundtrip` (#139) pozostaje otwarta jako osobne zadanie, ale nie dotyczy już tych danych.

### Zarzut 3 (UWAGA): test strukturalny nie sprawdza wejść — PRZYJMUJĘ (test dodany), CZĘŚCIOWO ODRZUCAM (straznik SHA)
- Wejścia: PRZYJMUJĘ. Dodany test `melee_vectors_inputs_have_no_null_and_no_raw_floats` (funkcja `assert_input_encoded`): panikuje na `null` w input, na surowej liczbie niecałkowitej, a dla pól liczbowych wymaga, by napis dał się sparsować przez `num`. Przed poprawką ten test by oblał (65 + 91 null), po poprawce przechodzi (0 null, 0 surowych floatów).
- Straznik SHA: ODRZUCAM część „prawdziwy straznik jest tylko w generatorze”. Dowód: stała `EXPECT_FRAGMENT_SHA256` (`cab87df7…2bf27e`) jest zakodowana na sztywno w `p6_combat_melee.rs`, a test porównuje ją z polem `source.fragmentSha256`. Zmiana samego pola w `vectors.json` (np. podmiana wektorów z innego pinu) daje FAIL. Rust nie może sam przeliczyć SHA pinu, bo nie ma pliku `combat.ts` w drzewie, więc sprawdzenie samego pinu zostaje w generatorze — to ograniczenie zaznaczone tutaj, nie błąd. Zweryfikowane: `fragmentSha256` w `vectors.json` po regeneracji nadal `cab87df78457c3c2a2c320b9b92ad3eb602cf4be36a42b69834801993a2bf27e`.

### Zarzut 4 (UWAGA): 32% kroków z hitPct NaN — PRZYJMUJĘ (poprawka)
Przed: 600/1880 (31,9%). Przyczyna: mnożniki `atkDiffMult`, `defDiffMult`, `terrRiverMult` losowane z tablic zawierających NaN z prawdopodobieństwem 1/8 każdy.
Poprawka: `pickMult` — NaN/0/-0 w ~5% przypadków (zamiast ~12,5% na mnożnik), reszta z wartości normalnych. Po poprawce: **90/1716 kroków z NaN (5,2%)**; przypadki z NaN w hitPct: 26/500. Liczniki niepustości nadal > 0 (przypadki 500, kroki 1716, szarża 444, zwarcie 1272, trafienia 714, chybienia 1002, rout 150, limit rund 208, roll==hitPct 99). Pokrycie -0 w polach: 36 kroków (`stepsNegZeroAnyField`), więc -0 nadal jest w wektorach.

### Zarzut 5 (UWAGA, jawne w raporcie Operatora): wejścia przed fazą zwarcia wstrzykiwane — PRZYJMUJĘ jako ograniczenie zakresu, bez zmiany kodu
Zgodnie z dispatchem: wejścia przed pętlą (civ/budynki/teren/różnica trudności, mnożniki rundy) są wstrzykiwane (#135 otwarte), a pełne porównanie z `resolveCombat` jest w #136. Ten temat dostarcza wektory fazy zwarcia i strażnik, nie dowód równości z pełnym `resolveCombat`. Nie zmieniam tego w tej rundzie. Zapisane w BLOKADACH jako otwarte (#135, #136).

### NIE_ZMIERZONO (z zarzutu): pełny `cargo test --no-fail-fast` — PRZYJMUJĘ jako otwarte
Operator r1 podał 3264 passed / 0 failed / 1 ignored; Evaluator nie odtworzył. W tej rundzie nie odtworzono też (patrz BLOKADY — dysk). Liczby z r1 traktować jako nieodtworzone do czasu bramki na zdrowym dysku.

## Dowody (commit 9687a72b8)
- Generator deterministyczny: dwa uruchomienia `node rust-port/engine/tests/p6_combat_melee_gen.mjs` z korzenia repo dają plik identyczny (`cmp` = identyczny).
- `counts` po poprawce: `{"cases":500,"steps":1716,"stepsCharge":444,"stepsMelee":1272,"stepsHit":714,"stepsMiss":1002,"stepsNaNHitPct":90,"stepsNegZeroAnyField":36,"casesRouted":150,"casesLimitReached":208,"casesDefBracing":147,"casesNaNHp":56,"casesWithChargeStep":222,"stepsRollEq":99,"stepsRollOnNaN":90}`.
- Skan wejść (python, nie w repo): null = 0, surowe niecałkowite = 0 we wszystkich czterech polach input.
- `rustfmt --edition 2021 --check rust-port/engine/tests/p6_combat_melee.rs`: EXIT 0 (po jednorazowym `rustfmt` na tym pliku).
- `git diff --check`: bez błędów. Zmiany tylko w trzech plikach z allowlisty (`git diff --stat` względem `b9b180873`: pliki testowe + vectors).

## Uwagi dla Evaluatora r2
- Nie dotykano `src/**`, `gra/`, `Cargo.toml`, `Cargo.lock`, `combat.rs`.
- Commit bez linii `Co-Authored-By` z nazwą modelu (zgodnie z CLAUDE.md i dispatchem); jest linia `Claude-Session`.
- Odłączona głowa worktree (`9687a72b8` nad `b9b180873`); gałąź `wip/R-RUSTPORT-P6-COMBAT-MELEE-VEKTORY-Q1` jest nadal przypięta do worktree `wf_08013046-e0f-1` i nie była przestawiana. Orkiestrator decyduje, czy przenieść gałąź na `9687a72b8` przy integracji.
