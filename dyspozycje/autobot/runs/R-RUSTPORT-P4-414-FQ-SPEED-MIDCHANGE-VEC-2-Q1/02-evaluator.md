# R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1 — Evaluator r1 (adwersarialny)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1
GOAL: wektory pinu `07d2fbd72` dla zmiany prędkości w trakcie odcinka `_raf` (cios wypadu o klatkę, koniec wypadu, krok falangi, krok `_advanceToward`) i zgodność `SiegeLoop::respeed` bajt w bajt; mutanty E3/E7/E8 i plan kroku falangi / `_advanceToward` zabite OD WEKTORÓW.
ZMIANY/COMMIT: oceniany kod Operatora `5315b646c` (gałąź `rust-port-wip/414-speed-midchange-vec-2`, baza `bb92c80fa` = `origin/rust-port/parity-v2`, potwierdzone `merge-base --is-ancestor`). Evaluator nie zmienia kodu; jedyny plik: ten raport.
TESTY: fmt EXIT 0, clippy `--all-targets -D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (559 binarek, 4380 passed / 0 failed / 1 ignored); regeneracja `speed_change_vectors_2.json` z tekstu pinu bajt w bajt (MD5 `e86ae5c8bf2394d00ffeb29dd195efff`); mutanty §4.
BLOKADY: merytoryczna — kryterium końca 1 (klasa krok falangi) i 3 (mutant planu kroku falangi) niespełnione; „dowód nieosiągalności” Operatora (§2.1) jest fałszywy (§3).
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / runda 2 Operatora tego samego ID (zakres: §6).
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone samodzielnie, `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

| bramka | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (debug) | EXIT 0; 4380 / 0 / 1 ignored; `zmiana_predkosci_w_trakcie_klasy_raf_wektory_pinu_bajt_w_bajt` ok, `..._mutanty_sterownika_daja_fail` ok |
| `git diff --check` vs baza | czysto |

Renderer/klient: plików nie zmieniono, bramki nie dotyczą.

## 2. Allowlista, asercje, wektory z tekstu pinu

- Diff vs `bb92c80fa`: 4 pliki — `p6_k5loop_wiring_a_gen.mjs` (dopiski), `p6_k5loop_wiring_a_pin.rs` (dopiski), nowy `speed_change_vectors_2.json`, raport `01-operator-r1.md`. Wszystkie w allowliście; kod produkcyjny bez zmian (zgodne z D-414-3). Sekcji „Pliki spoza allowlisty” nie trzeba.
- 0 nowych `#[ignore]`, brak usuniętych/osłabionych asercji (diff testów to wyłącznie dopiski).
- D-414-1: istniejące pliki wektorów nietknięte (diff stat: tylko nowy plik).
- Regeneracja (3 procesy `WIRING_A_SPEED_CHANGE2_SHARD=k/3` + `_MERGE`): `przypadkow 12/12`, MD5 `e86ae5c8…` = plik w commicie, `git status` czysty — wektory są wykonaniem tekstu pinu (strażnik SHA-256 `3eeeb760…` sprawdzony przez generator). 12 bitew, liczniki z logów: `movingAdv` 4, `lungeShift` 4, `lungeTail` 4, `movingPh` 0.
- Opakowania `probe2` (`_phalanxStep`, `_advanceToward`, `_doMove`) nie zmieniają wywołań pinu (try/finally, ten sam `this`/argumenty) — bez zastrzeżeń.
- Uwaga drobna: `base2` ma gałąź `None` (wektor spoza `vectors.json`) przy `EXTRA2_SCENARIOS = []` — w zestawie nieużywana, niepokryta.

## 3. ZARZUT GŁÓWNY Z1: krok falangi JEST osiągalny w pinie w AUTO oblężenia

Operator §2.1 twierdzi, że `_phalanxStep` jest nieosiągalny, bo atakujący w AUTO idą przez `_executeGroupDoctrineStep`. Tekst pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`):

- `:6092-6098`: gałąź doktryny wykonuje się tylko, gdy `this._isUnitDoctrineAuto(ru)` i `meta.doctrine !== 'manual'`.
- `:17621-17623` `_isUnitDoctrineAuto`: `if (doc === 'manual') return false;` — doktryna `'manual'` jednostki (`GroupDoctrine` `:1938` zawiera `'manual'`) przy `_manualMode === false` pomija gałąź doktryny; dalej `:6225` (tylko obrońcy) → `:6290` `if (ru.phalanx) { this._phalanxAction(ru, done); return; }` → `_phalanxStep` `:6588` → `_doMove` `:6635`.
- Generator już ma mechanizm `sc.doctrine` (#404, `:324-345`, `ru.unitDoctrine = x`) i Rust go obsługuje (`run_move_order_vector` ustawia `body.doctrine[..].unit_doctrine`; `GroupDoctrine::Manual` istnieje w `siege_tactics_loop.rs:2442/2452`).

Pomiar (kopia generatora poza repo-commitem, usunięta; tekst pinu i strażnik SHA bez zmian, jedyna różnica: 2 wpisy `EXTRA2_SCENARIOS` z `doctrine: { atk: ['manual', …] }`):

| scenariusz | wynik | `_phalanxStep` |
|---|---|---|
| `ev_falangi_manual_mur` (seed 409, mury, rzeka; atk F,F,W,W,L,L) | remis tura 150 | 78 wywołań, kroki w turach 1–32 |
| `ev_falangi_manual_pal` (seed 414, palisada; atk F,F,F,W,W,T) | atakujący tura 76 | 228 wywołań, kroki w turach 1–12 |

Tryb wektorów (`WIRING_A_SPEED_CHANGE2_CASES_JSON`) z `when: 'movingPh'`: obie zmiany zastosowane w pinie, licznik `movingPh = 1` (`sc2_ev_falangi_manual_pal_x1_movingPh4`: klatka 237, 1→4, tura 2, 77 zdarzeń; `sc2_ev_falangi_manual_mur_x2_movingPh1`: klatka 259, 2→1, tura 3, 37 zdarzeń). Plik dowodowy: scratchpad `ph_vec.json`, MD5 `f55c727e08bd055ae19ab9dce0cecbbc` (nie wchodzi do repo).

Wniosek: kryterium 1 nie jest spełnione ani pokryciem, ani dowodem nieosiągalności (dowód jest sprzeczny z tekstem pinu). Operator sam oznaczył ścieżkę `manual` jako niebadaną, ale wyciągnął z tego wniosek „nieosiągalna” w kodzie (`RAF_KLASY_WYMAGANE` bez `movingPh`, komentarz w teście i generatorze) — to trzeba wycofać.

## 4. Mutanty (odtworzone; `siege_tactics_loop.rs` mutowany skryptem i przywracany; `cargo test --release --test p6_k5loop_wiring_a_pin -- <filtr>`)

| ID | mutacja | stare wektory 40 (`w_trakcie_bitwy_wektory_pinu`) | nowe 12 (`klasy_raf_wektory_pinu`) | wynik |
|---|---|---|---|---|
| E3 | `respeed` bez `+ p.then` | ok | FAILED (101) | zabity od wektorów |
| E8 | `if false && attack_pre == 0.0 …` (brak planu ciosu) | ok | FAILED | zabity od wektorów |
| M-Z1b | brak `put_step_done_plan` w `_advanceToward` (`:7788`) | ok | FAILED | zabity od wektorów |
| MT (własny) | brak `put_raf_plan(RafPlanKey::Tail…)` w `take_tail` (klasa `lungeTail`) | ok | FAILED | zabity od wektorów |
| E7 | strażnik planu `due.is_some() && planned.is_finite()` | ok | ok | **przeżywa** |
| M-Z1a | brak `put_step_done_plan` w `phalanx_action` (`:5537`) | ok | ok | **przeżywa** — zabijalny po dodaniu wektorów z §3 |
| MB (własny) | `end_old <= now` → `<` w `respeed` | ok | ok | przeżywa; równoważny (przy `end_old == now` cel `<= now`, więc nowy `due` = `now + then` = stary) |

Kryterium 3: E3, E8, M-Z1b — spełnione; mutant planu kroku falangi (M-Z1a) — niespełnione, i to nie z powodu nieosiągalności (§3). E7: Operator nie wykazał ani zabicia, ani równoważności w sesji — NIE_ZMIERZONO (do rozstrzygnięcia w r2: albo wektor, albo argument równoważności z liniami kodu).

## 5. Zgodność bajt w bajt

12/12 nowych wektorów zgodnych (chwila zmiany, strumień C/R/K/D z czasem, klatki, wynik) — potwierdzone w pełnym teście. Kontrola czułości sterownika (8 mutantów `MID_MUTANTS`) zielona. Kod produkcyjny bez zmian — poprawne wg D-414-3 dla zbadanych klas. Dla kroku falangi zgodność Rust vs pin NIE_ZMIERZONO.

## 6. Wymagane w rundzie 2

1. Dołożyć do `speed_change_vectors_2.json` (nadal ≤ 16 bitew) ≥ 2 bitwy z `movingPh > 0` przez doktrynę `'manual'` falang atakującego (scenariusze jak w §3, `EXTRA2_SCENARIOS` z `doctrine`), z wejściem i doktryną zapisanymi w wektorze; w teście Rust ustawić `unit_doctrine = Manual` przed `play()` (jak `run_move_order_vector`) i dodać `movingPh` do `RAF_KLASY_WYMAGANE`.
2. Porównanie bajt w bajt na tych bitwach; rozbieżność → naprawa wg pinu (D-414-3).
3. M-Z1a musi ginąć od wektorów; E7 — zabić albo udokumentować równoważność.
4. Usunąć/poprawić komentarze „krok falangi nieosiągalny w AUTO” w generatorze i teście.

## 7. NIE_ZMIERZONO

- Zgodność Rust vs pin dla zmiany prędkości w kroku falangi (brak wektora w zestawie Operatora).
- E7: zabicie od wektorów albo dowód równoważności.
- Regeneracja istniejących plików wektorów nowym generatorem (nie uruchamiałem; stare testy Rust zielone).
- Pozostałe 19/40 scenariuszy sondy Operatora.
