# R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES (warunek integracji: decyzja techniczna orkiestratora o rozszerzeniu allowlisty, §3 Z1)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1
GOAL: obrońca w oblężeniu w ProdBody (onWallWalkway, kontrbateria, trzymanie muru, cios sąsiada, HOLD) + ripple
      _shakeAlliesOnLoss przy zabiciu (D-INT-2).
ZMIANY/COMMIT: oceniany stan = obrona/siege-def-q1 @ 0a2ee8fd1 (łańcuch 04ff93f2f -> 6468e30fa -> 661e8a9d3 ->
               5bdc40585 -> bd13bb32f -> 60f04b10f -> 0a2ee8fd1), baza 8a40ff9b3. FC: wyłącznie ten raport
               (gałąź fc/siege-def-q1, rodzic 0a2ee8fd1). Kod niezmieniony przez FC.
TESTY: §2 (odtworzone samodzielnie, kody wyjścia)
BLOKADY: brak technicznych; Z1 = decyzja orkiestratora (allowlista +6 plików), nie Operatora i nie właściciela
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: dopisek DODATEK r2 w 00-dispatch.md (przyjęcie 6 plików z 6468e30fa/60f04b10f) ->
               integracja 0a2ee8fd1 (lub tego commitu FC) na parity-v2 -> wpisy REJESTR-RUST (§5)
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Weryfikacja wejścia

- Dispatch: `origin/claude/rust-sivvrn:…/00-dispatch.md` (jedyny commit `bb8128077`, brak DODATKU orkiestratora).
- `BAZA:` `8a40ff9b3` — `git merge-base obrona/siege-def-q1 origin/rust-port/parity-v2` = `8a40ff9b312a…` (zgodne).
  Bieżący `origin/rust-port/parity-v2` = `47f8b2021`; `git diff --stat 8a40ff9b3 47f8b2021 -- rust-port/engine` = pusty,
  `git merge-tree --write-tree origin/rust-port/parity-v2 obrona/siege-def-q1` = drzewo `ba8170051…` bez konfliktów.
- Pin: `07d2fbd72` (`git show`). Cytaty sprawdzone przez FC: `_rangedTargetInRange` `:7041-7053` (manhattan,
  `dd < 1 || dd > ru.range`, remis `e.bu.hp < best.bu.hp`), HOLD `:6222-6236` (`ru.side === 'def' && siegeWallCol >= 0`),
  ripple `:9048` (po `_startFade`, przed `_boostEnemiesOnBreak`), `_shakeAlliesOnLoss` `:9743-9753`. Port w
  `siege_tactics_loop.rs` (`ranged_target_in_range_js`, ramię `SceneEffect::ShakeAllies`) zgodny 1:1.
- Commity: brak trailerów `Co-Authored-By`; diff nie dodaje `#[ignore]`; jedyna usunięta asercja
  (`outcome_pin` `unported.contains(shakeAlliesOnLoss)`) zastąpiona mocniejszą `kill_ripples == vec![def(0)]` + brak tagu.

## 1. Allowlista (sprawdzona samodzielnie: `git diff --stat 8a40ff9b3 0a2ee8fd1`)

W allowliście: `siege_tactics_loop.rs`, `p6_k5loop_siege_def.rs`, `p6_k5loop_siege_def_gen.mjs`,
`p6_k5loop_siege_def_vectors/{vectors,vectors_nan,vectors_dd0}.json`, `p6_k5loop_outcome_pin.rs` (`:268`, `:281`),
`p6_siege_tactics_loop_body_pin.rs` (`:407`, `:688` — dispatch pisze `_body.rs`, D-INT-2 w REJESTR wskazuje `_pin.rs`;
literówka dispatchu), raporty runu.

POZA allowlistą (6 plików, commity `6468e30fa` + `60f04b10f`): `p6_siege_tactics_loop_body_gen.mjs` +
`p6_siege_tactics_loop_body_vectors/vectors.json`, `p4_1i3_actions_gen.mjs` + `p4_1i3_actions_vectors/vectors.json`,
`p4_1i3_actions.rs` (1 filtr), `p6_k5doc_t8.rs` (filtr `side == atk`). Nietknięte: `renderer/`, `view-model/`,
`bridge.rs`, `siege_tactics_actions.rs`, `siege_tactics_activate.rs`, `battle_setup*.rs`, `Cargo.*`, `mod.rs`, `gra/`,
`REJESTR-RUST.md`.

## 2. Bramki odtworzone przez FC (stan 0a2ee8fd1; CARGO_INCREMENTAL=0, *_DEBUG=0, target w scratchpadzie `siegedef-fc/`, usunięty)

- `cargo fmt --check` **EXIT 0**.
- `cargo clippy --all-targets -- -D warnings` **EXIT 0** (świeży target).
- `cargo test --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin
  --test p6_k5loop_outcome_pin --test p6_k5loop_close --test p6_k5loop_close_r2 --test p6_k5loop_close_r3
  --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions` **EXIT 0**: siege_def 10/10, body 8/8,
  body_pin 2/2, outcome_pin 8/8, close 5/5, close_r2 6/6, close_r3 6/6, close_r4 7/7, k5doc_t8 6/6, p4_1i3_actions 9/9.
- Pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu): **FULL_EXIT=0**; 536 bloków
  `test result: ok`, 4035 passed / 0 failed / 1 ignored (istniejący), 0 linii `FAILED`/`panicked`.
- Determinizm generatora: `node p6_k5loop_siege_def_gen.mjs` EXIT 0; sha256 bez zmian: `vectors.json b99aa6d5…`,
  `vectors_dd0.json 83dfcfa6…`, `vectors_nan.json 3e98d6a9…`; `git status` czysty.
- Mutant kontrolny FC (F1): ramię `ShakeAllies` zapisuje `kill_ripples`, ale NIE woła `shake_allies_on_loss` →
  **ZABITY** (`ripple_przy_zabiciu_zgodny_z_pinem … FAILED`; test porównuje morale, nie tylko licznik). Źródło
  przywrócone (`git checkout`, `git status` czysty).
- Dysk po sprzątaniu: 13 GB wolnego.

## 3. Orzeczenia zarzutów

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| Z1 | Bramki EXIT 101 na stanie samej allowlisty; DODATEK = 6 plików poza allowlistą (Eval §5.1) | **DO DECYZJI (orkiestrator, techniczna — nie ABC)** | Dispatch jest wewnętrznie sprzeczny: wymaga EXIT 0 dla `p6_k5doc_t8` i `p4_1i3_actions`, a GOAL 1/2 zmienia zachowanie, które te testy (i ich generatory z ATRAPĄ `_shakeAlliesOnLoss`) utrwalały. FC potwierdza, że zmiany są minimalne i nie luzują asercji: generatory zastępują atrapę TEKSTEM pinu `:9743` ze strażnikiem SHA + `throw` (`60f04b10f`), `N_SEQ 320→340` wzmacnia (próg ≥300 bez zmian), `p6_k5doc_t8` filtruje do `atk` (obrońcę pokrywa nowy test 10/10, `take(40)` bez zmian), `p4_1i3` pomija wyłącznie `Facing` strony `def` w oknie wieży. Rekomendacja FC: przyjąć 6 plików (DODATEK r2). Operator nie może tego naprawić — to nie NAPRAW. |
| Z2 | E01: brak testu „mur tylko w scenie” | ODDAL (naprawione) | `mur_tylko_w_scenie_daje_ten_sam_wynik` (SceneOnly + SeqOnly na 880+1343 wektorach); E01/E01b zabite wg obrony; test zielony u FC. |
| Z3 | E14: precedencja ucieczki przy murze z `MoveTerrain` | ODDAL (naprawione) | Ramię `Flee if siege && terrain.is_some()` → `ucieczka-oblezenie`, bez terenu `ucieczka-routed` (spójne z `start()` r4; testy `close_r4` bez zmian i zielone). Zmienia wyłącznie etykietę tagu `unported` — decyzja techniczna, nie gameplay. |
| Z4 | E02: brak wektora `dd == 0` | ODDAL (naprawione) | `vectors_dd0.json` (800 przypadków, wykonanie tekstu pinu), test `obronca_wrog_na_tym_samym_polu_zgodny_z_pinem`; generator deterministyczny u FC. |
| Z5 | Nieścisłości raportu (liczba testów, „strażnik” rippleSha256 tylko log) | ODDAL (naprawione) | Errata w `01-operator-r1.md`; w obu generatorach DODATKU `EXPECTED_RIPPLE_SHA256` + `throw`. W pliku testu 10 `#[test]` (sprawdzone `grep -c`). |
| M18/E09/E10/E15 | Mutanty przeżyłe uznane za równoważne | ODDAL | Maszyna K5H nie woła `target_in_range` dla strzelca obrońcy w U7.1/U7.4 ani `ranged_target_in_range` poza nimi; jednostka ginie raz. Uzasadnienie spójne u Operatora, Evaluatora i obrony. |
| D1 | Dispatch: „zasięg +1” | ODDAL | Pin `:6130-6133`: +1 elewacji usunięty; x2 korony w `_applyTerrainRange` = wejście adaptera (T6, w Długach). Brak odstępstwa od webu. |
| D2 | Ripple `:5937` (`_resolveAutoBatchMovement`) niewpięty | ODDAL (poza ciałem) | Ścieżka AUTO-batch poza `ProdBody` (`SiegeLoop` panikuje na `BeginAutoBatchPhase`); zapisane w Długach (#369). |

Zero zarzutów NAPRAW. Brak decyzji gameplay — brak pytań ABC do właściciela.

## 4. Kryteria końca

| Kryterium | Stan (FC) |
|---|---|
| `def` przy murze: zero tagu `oblezenie` w `unported` | spełnione (strażnik tylko dla `Attacker`; testy siege_def asertują pusty `unported` poza jawną ucieczką) |
| Wektory pinu gałęzi obrońcy + NaN/Inf + strażnik 90 s + liczniki pokrycia | spełnione (880 + 1343 NaN/Inf + 800 dd0; `recv_timeout(90 s)`; nazwy liczników = gałęzie pinu) |
| Wektory ripple (zdarzenia, morale) | spełnione (320 zabić; mutant F1 zabity) |
| Mutanty ≥ 10 | spełnione (Operator 18, Evaluator 15, obrona 6, FC 1; przeżyłe = jawnie równoważne) |
| Bramki EXIT 0 | spełnione na stanie z DODATKIEM; na samej allowliście NIE — stąd warunek Z1 |

## 5. Dla orkiestratora (REJESTR-RUST, Długi)

- DODATEK r2: allowlista +6 plików (lista §1), uzasadnienie Z1.
- Decyzje techniczne do wpisu: (a) mur sceny = `max(scene.wall_col, st.siege_wall_col)`, dwie różne nieujemne =
  `oblezenie-mur-niespojny`; (b) precedencja tagów ucieczki: brak terenu → `ucieczka-routed` przed murem;
  (c) wektory `dd == 0` w osobnym pliku; (d) D-INT-2 zrealizowane (asercje w `_body_pin.rs`, nie `_body.rs`).
- Długi: T6 (x2 korony, stały 6 katapulty obrońcy, szablony ciosu dla celu ciała), T2/T7 (synchronizacja
  `ProdBody::wall_ever_breached` z `SiegeEnv` przy wyłomie w trakcie bitwy; strona `atk` przy murze), T4 (ripple z
  trafienia wieży — tag `wieza-resolveBlowOutcome-efekty`), #369 (ripple `:5937` w AUTO-batch).
- Integracja: merge-tree z `47f8b2021` czysty; pełny test do powtórzenia na wyniku integracji.
