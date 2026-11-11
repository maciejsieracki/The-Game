STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1
GOAL: port pętli rund strzałów (combat.ts Phase 0) do Rust tak, by ranged_shot_damage był używany w walce; opcjonalnie fieldPower
ZMIANY/COMMIT: ocena kodu 3b7841f14 (baza 6d74770df); zapis tylko tego raportu. Brak zmian w kodzie.
TESTY: patrz niżej (EXIT podane)
BLOKADY: brak
RUNDY: 2/5 (r1 Operator, r2 Evaluator)
NASTĘPNY KROK: Final Control (zarzuty N1-N3 do rozstrzygnięcia NAPRAW/ODDAL)
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone w worktree (detach 3b7841f14, CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w worktree, usunięty po bramkach)
| Bramka | EXIT | Wynik |
|---|---|---|
| cargo fmt --check | 0 | czysto |
| cargo clippy --all-targets -- -D warnings | 0 | czysto |
| cargo test --lib | 0 | 22 passed, 0 ignored |
| cargo test --test p6_repin_dystans_petla --test p6_repin_dystans_fieldpower --test p6_repin_dystans_formulas | 0 | petla 3/3, fieldpower 1/1, formulas 8/8, 0 ignored |
| cargo test (pełny, limit 585 s) | 124 (timeout) | 229 binarek `ok`, 0 FAILED/panicked przed ucięciem; NIE ukończony, NIE_ZMIERZONO w całości |

## Weryfikacje
- Allowlista: `git diff --name-only 6d74770df 3b7841f14` = 10 plików, wszystkie w allowliście. Brak gra/**, Cargo.toml, mod.rs, WERSJE.md, REJESTR, Cargo.lock. `--numstat`: 0 usuniętych linii (zmiana czysto addytywna).
- Brak `#[ignore]` w nowych testach (grep); brak usuniętych asercji.
- Pochodzenie wektorów: `combat.ts` na origin/main ma ten sam blob co na pinie cffe39cb9; `unit-power.ts` i combat-params bez różnic pin..origin/main. Zrobiłem `git archive cffe39cb9 gra/src gra/data` poza repo, esbuild 0.24.2 poza repo, Node 22, uruchomiłem generator: `dystans-petla.json` i `dystans-fieldpower.json` są BAJT-W-BAJT identyczne z commitowanymi (cmp). Wektory pochodzą z uruchomionego weba (600 walk / 2827 strzałów / 400 jednostek).
- Pętla vs combat.ts:1008-1067 (czytane z origin/main, linia po linii): warunek while, inkrement i limit rund, strzał ATK (acc*river vs defFinalObrona, roll*100, `<`), strzał DEF (bez river, vs atkObrona0, tylko gdy hpDef>0), kolejność testów rout def, rout atk, zniszczony def, zniszczony atk, wyjście z braku amunicji: zgodne. `ranged_shot_damage` jest wołany w pętli (test uses_ranged_shot_damage, Procarz 45).
- field_power vs unit-power.ts:122: skład ataku/obrony/round1 zgodny; dzielniki z combat-params.

## Zarzuty (nieblokujące funkcjonalnie; do rozstrzygnięcia przez FC)
N1. Test `p6_repin_dystans_petla_matches_web` sprawdza tylko `routed.is_empty()` względem `routedHint`, nie TOŻSAMOŚĆ strony uciekającej (Attacker/Defender), ani końcowe HP, amunicję i `rounds` względem weba (wektory mają tylko `note` tekstowy). Błędna strona routu lub błędny licznik amunicji przeszłyby test. Przy chybieniu nie jest sprawdzane `target_hp`. Rekomendacja: ODDAL do tematu podpięcia (rozszerzyć wektory o stronę routu i końcowe hp/ammo) albo NAPRAW tanio przez parsowanie linii "Obronca/Atakujacy ucieka|zniszczony".
N2. Wejścia `counter_mult` i `river_mult` w wektorach zawsze 1.0, `start_rounds` zawsze 0, `hp` zawsze całkowite (web zaokrągla hpAtk/hpDef; ścieżka z ułamkami niepokryta). Ścieżka kontry/rzeki nietestowana wektorem. Zgodne z założeniem dispatchu (§2 pkt 8), więc rekomendacja ODDAL do tematu wyliczania modyfikatorów.
N3. Pełny `cargo test` nieukończony także u Evaluatora (timeout 585 s; 229 binarek ok, 0 porażek do ucięcia). NIE_ZMIERZONO w całości; zmiana czysto addytywna, ryzyko niskie. Uruchomić w tle przy integracji (założenie dispatchu: pass-with-notes).

## Uwagi
- Wykonywany tylko dispatch; wiadomości adresowane do orkiestratora zignorowane.
- Brak blokujących defektów w zakresie fazy dystansowej. Brak podpięcia do resolve_combat i fazy zwarcia = założenie, nie zarzut.
