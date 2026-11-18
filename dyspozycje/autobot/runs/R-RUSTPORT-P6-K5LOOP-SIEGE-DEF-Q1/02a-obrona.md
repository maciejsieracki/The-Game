# R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1 — Obrona Operatora (odpowiedź na 02-evaluator.md)

```text
STATUS: PASS-WITH-NOTES (Z2–Z5 domknięte kodem i testami; Z1 = decyzja procesowa orkiestratora, poza mocą Operatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1
GOAL: obrońca w oblężeniu w ProdBody + ripple _shakeAlliesOnLoss przy zabiciu (D-INT-2)
ZMIANY/COMMIT: gałąź lokalna obrona/siege-def-q1 (bez push), łańcuch:
               04ff93f2f (Operator r1) -> 6468e30fa (DODATEK r1) -> 661e8a9d3 (raport Op., cherry-pick 3fb942486)
               -> 5bdc40585 (raport Eval., cherry-pick ec0b0caa6)
               -> bd13bb32f (obrona: Z2/Z3/Z4, WYŁĄCZNIE allowlista)
               -> 60f04b10f (obrona DODATEK: Z5, pliki DODATKU 6468e30fa, POZA allowlistą)
               -> <SHA raportu obrony, podany w odpowiedzi Workflow>
TESTY: §6 (fmt, clippy, 10 binarek bramek, mutanty E01/E02/E14 + warianty, pełny cargo test w tle)
BLOKADY: Z1 — wymagany DODATEK r2 orkiestratora w 00-dispatch.md (rozszerzenie allowlisty o pliki 6468e30fa
         i 60f04b10f); bez niego bramki p6_k5doc_t8 i p4_1i3_actions na stanie samej allowlisty = EXIT 101
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: orkiestrator: decyzja DODATEK r2 (allowlista) -> Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Baza tematu bez zmian: `8a40ff9b3` (zgodnie z linią `BAZA:` dispatchu; dispatch czytany z
`origin/claude/rust-sivvrn`, brak DODATKU orkiestratora w `00-dispatch.md` w chwili obrony).

## Z1 (blokuje, proces) — PRZYJMUJĘ ustalenie faktów, ODRZUCAM możliwość domknięcia przez Operatora

Fakty Evaluatora potwierdzam: na stanie wyłącznie z allowlisty bramki dispatchu dają EXIT 101 (5 testów), a DODATEK
`6468e30fa` dotyka 6 plików spoza allowlisty. Operator NIE może sam rozszerzyć allowlisty (zakaz edycji
`00-dispatch.md` przez Operatora; decyzje techniczne = orkiestrator, zasada 8 orkiestratora). Dlatego:

- kod i testy obrony Z2/Z3/Z4 są w osobnym commicie `bd13bb32f`, który dotyka WYŁĄCZNIE plików allowlisty
  (`siege_tactics_loop.rs`, `p6_k5loop_siege_def.rs`, `p6_k5loop_siege_def_gen.mjs`, nowy
  `p6_k5loop_siege_def_vectors/vectors_dd0.json`);
- jedyna zmiana obrony poza allowlistą (Z5, `60f04b10f`) dotyczy WYŁĄCZNIE dwóch plików, które już są w DODATKU
  `6468e30fa` (`p6_siege_tactics_loop_body_gen.mjs`, `p4_1i3_actions_gen.mjs`), więc nie poszerza zbioru plików do
  decyzji (nadal 6 plików). Commit można przyjąć razem z `6468e30fa` albo odrzucić bez wpływu na `bd13bb32f`;
- prośba do orkiestratora (do wpisu w `00-dispatch.md` jako DODATEK r2): allowlista + 6 plików z `6468e30fa`
  (`p6_siege_tactics_loop_body_gen.mjs`, `p6_siege_tactics_loop_body_vectors/vectors.json`, `p4_1i3_actions_gen.mjs`,
  `p4_1i3_actions_vectors/vectors.json`, `p4_1i3_actions.rs` — tylko filtr `Facing` strony `def` w oknie wieży,
  `p6_k5doc_t8.rs` — test muru tylko dla `atk`). Uzasadnienie merytoryczne Evaluator potwierdził w §2.2: bez DODATKU
  wektory stanu `body_pin`/`p4_1i3` są sprzeczne z pinem po wpięciu ripple, a stary test K5DOC-T8 jest wprost sprzeczny
  z GOAL 1.

## Z2 (mutant E01, mur tylko w scenie) — PRZYJMUJĘ

Poprawka (`bd13bb32f`, `tests/p6_k5loop_siege_def.rs`):
- `check_def` ma wariant wejścia `Opts { wall: WallSrc, terrain }` (`WallSrc::{Both, SceneOnly, SeqOnly}`); oczekiwania
  pinu bez zmian.
- Nowy test `mur_tylko_w_scenie_daje_ten_sam_wynik`: WSZYSTKIE wektory obrońcy (880 z `vectors.json` + 1343 z
  `vectors_nan.json`) w wariancie `SceneOnly` (`st.siege_wall_col = -1`, `scene.wall_col = W`) i, dla symetrii,
  `SeqOnly` (`scene.wall_col = -1`) — pełne porównanie (ślad, czas, facing, strzał, cios, amunicja, stan wszystkich
  jednostek, `occByKey`, rzuty, `unported`). Asercja pokrycia gałęzi HOLD (`*-hold` >= 10 każda, w tym
  `walk-cata-hold`, `hold-melee-hold`) i `surround-flee`.

Dowód: mutant E01 (`let wall_col = st.siege_wall_col;`) — ZABITY (EXIT 101,
`mur_tylko_w_scenie_daje_ten_sam_wynik ... FAILED`). Dodatkowo E01b (`let wall_col = self.scene.wall_col;`) — ZABITY
(oba testy lustrzane FAILED).

## Z3 (mutant E14, precedencja ucieczki) — PRZYJMUJĘ (ujednolicenie + test z `MoveTerrain`)

Precedencję ujednoliciłem do istniejącej konwencji gałęzi `routed` w `LoopBody::start` (K5LOOP-CLOSE r4, testy
`p6_k5loop_close_r4::ucieczka_bez_terenu_jawny_tag` i `ucieczka_przy_murze_jawny_tag` — bez zmian):
najpierw brak `MoveTerrain` → `ucieczka-routed`, potem mur → `ucieczka-oblezenie`, dopiero potem wykonanie
`_fleeStep`. Kierunek ujednolicenia wybrany tak, by nie ruszać zintegrowanych testów r4.

Kod (`siege_tactics_loop.rs`, ramię ucieczki z okrążenia w `start`):

```rust
ActivateEvent::Flee if siege && self.terrain.is_some() => {
    skipped.push("ucieczka-oblezenie")
}
ActivateEvent::Flee if self.terrain.is_some() => flee = true,
// bez terenu: ramię `other` -> prod_tag(Flee) = "ucieczka-routed"
```

Zmiana zachowania (jawna): okrążenie obrońcy przy murze BEZ danych terenu daje teraz `ucieczka-routed` (wcześniej
`ucieczka-oblezenie`). Oba tagi to nieportowane `_fleeStep`; efekty stanu (`_startRout`, morale) dalej robi
`complete` — `check_units` na 80 wektorach `surround-flee` (+80 `morale-nan`) zielony. Gameplay bez zmian (tylko
etykieta tagu `unported`), więc decyzja techniczna, nie ABC; do wpisu orkiestratora w REJESTR.

Testy:
- `check_def`: oczekiwany tag zależny od terenu (bez terenu `ucieczka-routed`, z terenem `ucieczka-oblezenie`).
- Nowy `ucieczka_okrazenia_przy_murze_z_terenem_jawny_tag`: wszystkie 880 wektorów obrońcy z `with_terrain(Flat)`
  (80 `surround-flee` → dokładnie `ucieczka-oblezenie`, stan jak w pinie bez ruchu ucieczki; pozostałe gałęzie
  niezależne od terenu) oraz jednostka już `routed` w `start()` z terenem i bez (te same dwa tagi, ta sama
  precedencja co okrążenie).

Dowód mutantów: E14 (`siege && terrain.is_none()`) — ZABITY (4 testy FAILED); E14b (`if siege`, stara precedencja) —
ZABITY (3 testy); E14c (ramię wyłączone, `if false` — z terenem wykonuje się `flee_run`) — ZABITY
(`ucieczka_okrazenia_przy_murze_z_terenem_jawny_tag`).

## Z4 (mutant E02, `dd == 0`) — PRZYJMUJĘ

Generator (`p6_k5loop_siege_def_gen.mjs`, nowa sekcja na końcu, bez wywołań `rnd`): każdy z 800 scenariuszy obrońcy
bez okrążenia + jeden atakujący na TYM SAMYM polu co obrońca (HP 1; co trzeci w `walk-cata` jest katapultą; co czwarty
na koronie). Wynik = wykonanie tekstu pinu (ten sam harness i strażnik SHA `e8e86aec…`). Plik
`p6_k5loop_siege_def_vectors/vectors_dd0.json` (sha256 `83dfcfa6…`). Pliki `vectors.json` (`b99aa6d5…`) i
`vectors_nan.json` (`3e98d6a9…`) bajt w bajt bez zmian po regeneracji.

Pokrycie (statystyka generatora): strzał w innego wroga mimo wroga na polu 279; kontrbateria w katapultę na polu
obrońcy 46 (pin `:6144-6148`: `bestCata` NIE ma dolnej granicy `dd`, tylko `dd <= ru.range`); cios wręcz w wroga na
polu (`_targetInRange` `dd === 0`) 242; cios w innego 107; trzymanie 126.

Nowy test `obronca_wrog_na_tym_samym_polu_zgodny_z_pinem`: pełne `check_def` na 800 wektorach + asercje: wróg leży na
polu obrońcy, `shot_other >= 200`, `shot_stacked >= 20`, `melee_stacked >= 150`, strzał w pole obrońcy wyłącznie
kontrbaterią (obie strony katapulty).

Dowód: E02 (`dd < 1.0` → `dd < 0.0`) — ZABITY (`obronca_wrog_na_tym_samym_polu_zgodny_z_pinem ... FAILED`).

## Z5 (nieścisłości raportu) — PRZYJMUJĘ

1. „8 testów / 8/8”: błąd raportu r1 — w r1 było 7 `#[test]`. Poprawione w `01-operator-r1.md` (dopisek ERRATA przy
   obu miejscach). Po obronie plik ma 10 testów (10/10).
2. „Strażnik `rippleSha256`”: w r1 tylko log + pole JSON. Poprawka `60f04b10f` (pliki DODATKU): w obu generatorach
   `EXPECTED_RIPPLE_SHA256 = '2fccc76c…cdb6a'` i `throw` przy niezgodności (wycinki `:1118`, `:9743-9753`). Oba
   generatory uruchomione po zmianie: EXIT 0, wektory bez zmian (`527db205…`, `30b660f2…`).

## Uwagi Evaluatora bez zarzutu (potwierdzam)

- Rozbieżność „dispatch: `p6_siege_tactics_loop_body.rs`” vs REJESTR D-INT-2 „`_pin.rs`” — zmiana asercji jest w
  `_pin.rs` zgodnie z D-INT-2 (literówka dispatchu), do odnotowania przez orkiestratora.
- Mutanty równoważne E09, E10, E15 i M18 — zgadzam się.

## Mutanty obrony (skrypt `scratchpad/siegedef/obrona/mut.py`, `cargo test --test p6_k5loop_siege_def`)

| # | Mutant | Wynik |
|---|---|---|
| E01 | `wall_col = st.siege_wall_col` | ZABITY |
| E01b | `wall_col = self.scene.wall_col` | ZABITY |
| E02 | `dd < 1.0` → `dd < 0.0` | ZABITY |
| E14 | `Flee if siege && terrain.is_none()` | ZABITY |
| E14b | `Flee if siege` (stara precedencja) | ZABITY |
| E14c | ramię ucieczki przy murze wyłączone | ZABITY |

Źródło przywrócone po mutantach (`git status` czysty przed commitem).

## 6. Bramki (CARGO_INCREMENTAL=0, *_DEBUG=0, target w scratchpadzie `siegedef/obrona/target`)

Stan `60f04b10f` (allowlista + DODATEK r1 + obrona):
- `cargo fmt --check` EXIT 0.
- `cargo clippy --all-targets -- -D warnings` EXIT 0 (po poprawce jednego `doc_lazy_continuation` w nowym opisie
  modułu testu).
- `cargo test --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin
  --test p6_k5loop_outcome_pin --test p6_k5loop_close --test p6_k5loop_close_r2 --test p6_k5loop_close_r3
  --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions` EXIT 0: siege_def 10/10, body 8/8, body_pin 2/2,
  outcome_pin 8/8, close 5/5, close_r2 6/6, close_r3 6/6, close_r4 7/7, k5doc_t8 6/6, p4_1i3_actions 9/9.
- Pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`): **EXIT=0**: 536 bloków `test result: ok`, 4035 passed / 0 failed / 1 ignored (ten sam istniejący `#[ignore]` co u
  Evaluatora; +3 = nowe testy obrony). Target usunięty po bramkach.

## Długi (bez zmian względem r1, dla orkiestratora)

T6 (x2 korony / stały 6 katapulty w adapterze), T2/T7 (synchronizacja `wall_ever_breached` w trakcie bitwy), T4 (ripple
z trafienia wieży), #369 (ripple `:5937` w `_resolveAutoBatchMovement`, poza `ProdBody`). Nowe: decyzja techniczna
„precedencja tagów ucieczki: teren przed murem” (Z3) i „wektory `dd == 0` w osobnym pliku” (Z4) — do wpisu w
REJESTR-RUST (orkiestrator).
