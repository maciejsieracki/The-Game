# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Obrona Operatora, runda 4

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` wykonane wg pinu albo jawnie oznaczone; `unported` puste dla scenariuszy wektorowych pinu (DODATEK r4: `_fleeStep` + `_removeUnitFromScene` + ripple `_shakeAlliesOnLoss`, tag `strzelec-bez-strzelania`).

## Podstawa
- BAZA r4 (dispatch): `38f5939e2`. Kod Operatora r4 `aeb9cfcf1`, raport `76a483a1a`, raport Evaluatora r4 `eca5edefb` (PASS-WITH-NOTES).
- Obrona pracuje na `eca5edefb` (gałąź lokalna `rust-port-wip/k5loop-close-r4-obrona`). Pin `07d2fbd72` czytany przez `git show`.

## Odpowiedzi na zarzuty

| # | zarzut (skrót) | odpowiedź |
|---|---|---|
| Z1 | Lokalizacja raportu i commitu Evaluatora | Brak zarzutu, informacja. Obrona startuje od `eca5edefb`. |
| Z2 | Bramki odtworzone, EXIT 0, generator bajt w bajt | Brak zarzutu. Po poprawkach obrony bramki wykonane ponownie (tabela niżej). |
| Z3 | Allowlista OK, bez `#[ignore]`, bez usuniętych asercji | Brak zarzutu. Poprawki obrony dotykają tylko plików z allowlisty r4 (lista niżej). |
| Z4 | Mutacje: 4/5 zabite, Operator 24/24 | Brak zarzutu. Jedyny przeżywający (E4) jest zabity po U1. |
| U1 | Mutant E4 przeżył: test nie sprawdza globalnej kolejności `Shaken`/`Rout`/`Leave` | **PRZYJMUJĘ.** Poprawka + dowód niżej. |
| U2 | Ripple `_shakeAlliesOnLoss` przy zabiciu (pin `:9048`, `:5937`) tylko tagiem | **ODRZUCAM w tej rundzie** (poza zakresem i allowlistą r4). Dowód niżej; potrzebny osobny temat przed #113. |
| U3 | `surroundLeft = 0`: żadne okrążenie nie kończy się zniknięciem z pola | **PRZYJMUJĘ.** Dopisane 40 wektorów pinu. |
| U4 | Licznik `nobowShotAdjFar` ma mylącą nazwę | **PRZYJMUJĘ.** Zmieniona nazwa na `nobowShotNoStep`. |
| U5 | Kontrakt `flee_after` chroni tylko `debug_assert` | **PRZYJMUJĘ.** Twarde asercje w każdym profilu, kontrakt opisany dla #113, test i mutant. |

### U1 — PRZYJMUJĘ (globalna kolejność akcji)
- Generator (`p6_k5loop_close_r4_gen.mjs`): uprząż zapisuje, oprócz osobnych list, wspólną listę `expect.order` w kolejności wywołań pinu: `S:<jednostka>` w `_updateMoraleBar` z pętli ripple (`:9749`), `R:<jednostka>` na początku `_startRout` (`:9801`), `L:<jednostka>` w `_removeUnitFromScene` (`:9910`). Sam tekst pinu jest bez zmian (SHA wycinków `72337be6…92c48`, ten sam).
- Test Rust (`p6_k5loop_close_r4.rs`, `split_actions` i `check_activation`): `Got.order` zbierane w kolejności emisji `BattleAction` i porównywane z `expect.order`. Rozbieżność daje FAIL `kolejnosc Shaken/Rout/Leave`.
- Dowód: mutant E4 (w `shake_allies_on_loss` najpierw `check_rout`, potem emisja `Shaken`) jest teraz **ZABITY**. FAIL w obu testach wektorowych, np. `close-r4-nan-flee-42: rust=["L:def2","R:def3","S:def3"] js=["L:def2","S:def3","R:def3"]`. Kod przywrócony. Wektory z `S` i `R` w jednej aktywacji: 92 w `vectors_r4.json` i 83 w `vectors_r4_nan.json`.

### U2 — ODRZUCAM w r4 (z dowodem), osobny temat
- Zakres r4 (DODATEK r4, D-K5C-r4-1 pkt 1): `_fleeStep` `:9845-9895` razem z `_removeUnitFromScene` i `_shakeAlliesOnLoss`, czyli ripple wołany z `_fleeStep` (`:9855-9856`). Ten ripple jest wykonywany i pokryty wektorami.
- Ripple przy zabiciu woła `_resolveBlowOutcome` (pin `:9048`: `_startFade` → `_shakeAlliesOnLoss(defender)` → `_boostEnemiesOnBreak`). Ścieżka `:5937` leży poza `_activateUnit`. Rust oznacza go jawnym tagiem `shakeAlliesOnLoss` (`siege_tactics_loop.rs:3881`, `SceneEffect::ShakeAllies`). To nie jest ciche pominięcie.
- Wpięcie zmienia istniejące asercje, które wymagają obecności tego tagu: `tests/p6_siege_tactics_loop_body_pin.rs:407` i `:688` („liczba wywołań z pinu = liczba wpisów `unported`”) oraz `tests/p6_k5loop_outcome_pin.rs:268` i `:281`. Te pliki są poza allowlistą r4, a dispatch zakazuje osłabiania i usuwania asercji. Zmiana w tej rundzie złamałaby allowlistę.
- Wektory r1–r4 kończą się pustym `unported` (asercja `p6_k5loop_close_r4.rs`, `body.unported.is_empty()`), bo nie zawierają zabójstw. Cel z dispatchu jest więc spełniony.
- Propozycja dla orkiestratora: mały temat „K5LOOP-KILL-RIPPLE”, przed #113. Zakres: wykonać `shake_allies_on_loss` w `SceneEffect::ShakeAllies` po `_startFade`, przepiąć 4 asercje z „tag obecny” na „akcje `Shaken`/stan zgodne z pinem”, dodać wektory pinu z zabójstwem w zasięgu `MORALE_DEATH_RADIUS`.

### U3 — PRZYJMUJĘ (okrążenie kończy się zniknięciem z pola)
- Generator: nowy blok wykonany **po wszystkich rodzinach**, więc wcześniejsze wywołania `rnd` i wektory zostają bez zmian. Dodaje 40 scenariuszy `surround` (`close-r4-surround-left-*`), w których pin wykonuje `_fleeStep` po `_startRout` (`:6105-6118`) i jednostka znika z pola (krawędź własna albo `fleeStuck >= 2`, `:9850-9858`).
- Dowód zgodności: skrypt porównujący stary i nowy JSON. Pierwsze 1180 wektorów (`vectors_r4.json`) i 1080 (`vectors_r4_nan.json`) jest identycznych po pominięciu nowego pola `order`. Doszło 40 wektorów i 40 wektorów NaN.
- Liczniki generatora: `surround` 200→240, `surroundLeft` 0→40, `surroundCascade` 2→26, `surroundSteps` 193→196.
- Test Rust: `cases.len()` 1180→1220 i 1080→1120, `cov.surround` 200→240, nowy licznik `surround_left` z asercją `>= 40`. Liczba `assert` w tym pliku tylko rośnie.

### U4 — PRZYJMUJĘ (nazwa licznika)
`nobowShotAdjFar` → `nobowShotNoStep` (strzał bez kroku: `blows.length === 1 && steps.length === 0`). Wartość 279 bez zmian. Zmieniło się tylko pole `stats` w `vectors_r4.json`; test Rust go nie czyta.

### U5 — PRZYJMUJĘ (kontrakt `flee_after`)
- `siege_tactics_loop.rs`: `flee_after` to teraz `Option<ProdFleeAfter>` z jednostką, migawką stanu w chwili `start` (`before_atk`/`before_def`) i stanem po ucieczce. `complete` sprawdza trzy warunki twardymi asercjami, aktywnymi w każdym profilu, także release:
  1. wynik `start` istnieje (`expect`),
  2. `complete` dotyczy tej samej jednostki (`assert_eq!`),
  3. stan jednostek nie zmienił się między `start` a `complete` (`assert!`).
  Porównanie stanu odporne na NaN, czyli `moveLeft = NaN` z lekcji r2 a (`same_seq_units`: `==`, a przy niezgodności porównanie `Debug`, bitowo równoważne dla `f64`).
- Kontrakt dla #113 opisany w dokumentacji pola `ProdBody::flee_after`: między `start` a `complete` uciekającej jednostki sterownik nie zmienia `atk`/`def` i nie startuje innej aktywacji z ucieczką. Naruszenie to błąd sterownika, który inaczej po cichu nadpisałby cudze zmiany.
- Testy: `ucieczka_kontrakt_stanu_miedzy_start_a_complete` (`#[should_panic(expected = "kontrakt flee_after")]`, zmiana morale w oknie start..complete) oraz `ucieczka_kontrakt_stanu_bez_zmian_przechodzi` (kontrola poprawnej ścieżki).
- Mutant U5-M (asercja stanu wyłączona: `true || …`) jest **ZABITY**: `should_panic` daje FAIL. Kod przywrócony. Wszystkie wektory r1–r4 (w tym NaN) przechodzą z twardymi asercjami, więc obecny sterownik spełnia kontrakt.

## ZMIANY/COMMIT
Commit obrony: SHA w sekcji DEPLOY/PUSH i w odpowiedzi do orkiestratora. Pliki (wszystkie z allowlisty r4, jawny `git add`):
- `rust-port/engine/src/domain/siege_tactics_loop.rs`: `ProdFleeAfter`, `same_seq_units`, twarde asercje kontraktu i dokumentacja (U5).
- `rust-port/engine/tests/p6_k5loop_close_r4.rs`: `Got.order` z porównaniem (U1), `surround_left` i nowe liczności (U3), 2 testy kontraktu (U5).
- `rust-port/engine/tests/p6_k5loop_close_r4_gen.mjs`: `__order` w uprzęży (U1), blok `surround-left` (U3), nazwa licznika (U4).
- `rust-port/engine/tests/p6_k5loop_close_vectors/vectors_r4.json` (sha256 `60d57c91…`), `vectors_r4_nan.json` (sha256 `7f33f8a1…`): odtworzone generatorem (Node v22.23.4); drugi przebieg daje identyczny SHA.
- ten raport.
Nietknięte: wektory r1/r2/r3, `siege_tactics_actions.rs`, `p4_1i3_actions.rs`, `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`. `git diff --check` czysty. Bez `#[ignore]`, bez usuniętych asercji. Commit bez `Co-Authored-By`.

## TESTY
Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `k5r4ob/tgt` (usunięty po bramkach). Przed pełną bramką wolne 9,0 GB.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r4` | 0 | 7 passed (było 5: +2 testy kontraktu U5) |
| mutant E4 (U1) | — | ZABITY (2 testy wektorowe FAIL) |
| mutant U5-M | — | ZABITY (`should_panic` FAIL) |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **532 binarki, 3995 passed** (3993 z r4 + 2 nowe testy kontraktu U5), **0 failed, 1 ignored** (istniejący `p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, był w bazie) |

## BLOKADY
Brak. U2 przekazane orkiestratorowi jako osobny temat (poza allowlistą r4).

## RUNDY
4/5

## NASTĘPNY KROK
Final Control r4 (`03-final-control-r4.md`) na commicie obrony. Po FC PASS: integracja orkiestratora; temat K5LOOP-KILL-RIPPLE (U2) przed K5LOOP-WIRING (#113); kontrakt `flee_after` do uwzględnienia w #113.

## DEPLOY/PUSH
NIE WYKONANO
