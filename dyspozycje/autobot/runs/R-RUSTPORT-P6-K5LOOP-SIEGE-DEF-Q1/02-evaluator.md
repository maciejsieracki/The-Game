# R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1
GOAL: obrońca w oblężeniu w ProdBody (onWallWalkway, kontrbateria, trzymanie muru, cios sąsiada, HOLD) + ripple
      _shakeAlliesOnLoss przy zabiciu (D-INT-2).
ZMIANY/COMMIT: oceniane: Operator 04ff93f2f (+ raport 3fb942486), DODATEK 6468e30fa (poza allowlistą);
               baza 8a40ff9b3 (zgodna z dispatchem). Evaluator: tylko ten raport (gałąź eval/siege-def-q1).
TESTY: §2 (odtworzone samodzielnie, kody wyjścia)
BLOKADY: (1) bramki dispatchu NIE są EXIT 0 na stanie w allowliście; (2) DODATEK = 6 plików poza allowlistą bez
         dopisku orkiestratora w 00-dispatch.md; (3) luki testów wykryte mutantami E01, E02, E14 (§4)
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: DODATEK r2 (decyzja techniczna o rozszerzeniu allowlisty o 6 plików) → Operator r2
               (przyjęcie 6468e30fa + domknięcie luk §4) → Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Weryfikacja wejścia

- Dispatch przeczytany z `origin/claude/rust-sivvrn` (commit `bb8128077`); brak DODATKU orkiestratora (ostatnia zmiana
  pliku = dispatch). `BAZA:` `8a40ff9b3` — gałąź Operatora `rust-port-wip/siege-def-q1-op` ma rodzica dokładnie
  `8a40ff9b3`. (Bieżący `origin/rust-port/parity-v2` = `e4ffbc342`, nie jest przodkiem — rebase/merge-tree to sprawa
  integracji.)
- Pin: `git show 07d2fbd72:gra/src/battle/battleScene.ts` (sha256 pliku `d784735e…`). Numery z raportu Operatora
  potwierdzone: `siegeDefenderNeverDoctrine` `:6087`, okrążenie `:6105-6118`, `_updateFacing` `:6123`,
  `onWallWalkway` `:6129-6172` (kontrbateria `bestCata` `:6139-6150`), HOLD `:6222-6236`, `_rangedTargetInRange`
  `:7041-7053`, `_meleeBlockedByWall` `:8361-8371`, `_targetInRange` `:8373-8410`, ripple `:9048` w
  `_resolveBlowOutcome` `:9019-9069`, `_shakeAlliesOnLoss` `:9743-9753`. Ripple `:5937` leży w
  `_resolveAutoBatchMovement` (`:5924`) — ścieżka AUTO-batch poza `ProdBody`; wpis w Długach jest zasadny.
- Uwaga „zasięg +1” z dispatchu: w pinie `+1 elewacji` usunięty (`:6130-6133`), x2 korony liczy `_applyTerrainRange`
  (wejście adaptera `range`). Stwierdzenie Operatora poprawne; gameplay bez odstępstwa od webu.
- Asercje D-INT-2: dispatch podaje `p6_siege_tactics_loop_body.rs`, ale `REJESTR-RUST.md:3830` (D-INT-2) podaje
  `p6_siege_tactics_loop_body_pin.rs:407/688` — zmiana w `_pin.rs` jest zgodna z decyzją (literówka dispatchu).

## 1. Przegląd kodu wobec pinu (`siege_tactics_loop.rs`, 04ff93f2f)

| Element | Wynik |
|---|---|
| tag `oblezenie` tylko dla `atk` przy murze; `def` wykonywany | zgodne z GOAL 1 |
| `ranged_target_in_range_js` vs `:7041-7053` | zgodne: `_enemiesOf` (dead/fadingOut/routed), `dd < 1 || dd > range` na f64 (NaN = fałsz jak JS), remis `e.bu.hp < best.bu.hp` ścisłe, kolejność listy |
| cel wręcz obrońcy = `target_in_range_cmb` z `TargetScene{wall_col, wall_ever_breached}` | zgodne z `:8373-8410` + `:8361-8371` |
| kontrbateria (maszyna K5H, `siege_tactics_activate.rs:300-322`) | zgodna z `:6139-6150`; `enemies_of` = pełna lista strony (indeks = idx jednostki) |
| `_trySiegeTowerClimb`/`_siegeInfantryToTowerStep` dla `def` = `false` | potwierdzone w pinie `:8057`, `:8088` (`ru.side !== 'atk'`) |
| ripple: `ShakeAllies` po `start_fade`, przed `BoostEnemies` | zgodne z `:9047-9049` |
| `wall_col = max(scene, st)`; dwie różne nieujemne = `oblezenie-mur-niespojny` | decyzja techniczna Operatora (nie gameplay) — do wpisu orkiestratora w REJESTR |
| brak `#[ignore]`; usunięte asercje | jedyna usunięta: `outcome_pin` `unported.contains(shakeAlliesOnLoss)` — zastąpiona mocniejszą `kill_ripples == [def(0)]` + brak tagu (dozwolone D-INT-2) |

Generator `p6_k5loop_siege_def_gen.mjs` wykonuje TEKST pinu (`git show 07d2fbd72`, cały `_activateUnit` `:6048-6299`,
`_resolveBlowOutcome`, `_shakeAlliesOnLoss`, `meleeBlockedByWall` itd.), strażnik SHA wycinków `e8e86aec…` sprawdzany
(`throw`). Stuby udokumentowane (`_applyTerrainRange`, `_isCatapult`, `_executeGroupDoctrineStep` = błąd).
Ponowne uruchomienie: identyczne sha256 `vectors.json b99aa6d5…`, `vectors_nan.json 3e98d6a9…`; liczniki pokrycia
identyczne z raportem (`walk-shoot 119 … surround-flee 80`, ripple shaken 192/rout 120/osłona 28; NaN: range-nan 462,
range-inf 376, morale-nan 80, hp-nan 425). Generatory DODATKU (`body_gen`, `p4_1i3_gen`) też deterministyczne
(`527db205…`, `30b660f2…`).

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, *_DEBUG=0, target w scratchpadzie, usunięty po bramkach)

### 2.1 Stan Operatora (allowlista, 3fb942486) — **FAIL**
- `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0.
- `cargo test --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin
  --test p6_k5loop_outcome_pin --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions` → **EXIT 101**:
  `p4_1i3_actions` 3 FAILED (`zgodnosc_akcji_ciosu_i_kontrataku_z_pinem`, `…_w_trybie_ff_z_pinem`,
  `…_strzalu_wiezy_z_pinem`), `p6_k5doc_t8::cialo_przy_murze_zostaje_tagiem_oblezenie` FAILED,
  `p6_siege_tactics_loop_body_pin::zgodnosc_ciala_z_tekstem_pinu_end_to_end` FAILED. Pozostałe ok.
  `p6_k5doc_t8` i `p4_1i3_actions` są w liście bramek dispatchu → kryterium „BRAMKI (EXIT 0)” niespełnione.

### 2.2 Stan Operator + DODATEK (6468e30fa, stosowany lokalnie, nie commitowany) — zielony
- fmt EXIT 0; clippy (po `touch`, pełne sprawdzenie) EXIT 0.
- 10 binarek (powyższe + `p6_k5loop_close`, `_r2`, `_r3`) EXIT 0: siege_def 7/7, body 8/8, body_pin 2/2, outcome_pin
  8/8, close_r4 7/7, k5doc_t8 6/6, p4_1i3_actions 9/9.
- Pełny `cargo test --all-targets --no-fail-fast` (w tle, setsid nohup) **EXIT=0**: 536 bloków `test result: ok`,
  4032 passed / 0 failed / 1 ignored (istniejący, diff nie dodaje `#[ignore]`).

Ocena DODATKU merytorycznie: konieczny i uczciwy. Generatory `body_gen`/`p4_1i3_gen` zastępują ATRAPĘ ripple tekstem
pinu (bez tego wektory stanu są sprzeczne z pinem po wpięciu ripple); `N_SEQ 320→340` wzmacnia, nie luzuje progu;
`p6_k5doc_t8` — stary test wprost sprzeczny z GOAL 1 (filtr `side == atk`, `take(40)` bez zmiany progu); `p4_1i3`
— filtr pomija wyłącznie `Facing` strony `def` w oknie strzału wieży (syntetyczny obrońca spoza wektora pinu).
Uwaga: „osobny strażnik `rippleSha256`” w obu generatorach DODATKU jest tylko LOGOWANY i zapisywany do JSON, nie ma
porównania ze stałą (`throw`) ani asercji w Rust — to nie jest strażnik (tekst pinu jest stały, więc ryzyko niskie, ale
opis w raporcie jest nieprecyzyjny).

## 3. Kryteria końca

| Kryterium | Stan |
|---|---|
| `def` przy murze: zero tagu `oblezenie` | spełnione (testy + E-mutanty) |
| wektory pinu gałęzi obrońcy + NaN/Inf + strażnik 90 s + dokładne nazwy liczników | spełnione (7 testów; Operator pisze „8 testów / 8/8” — w pliku jest 7 `#[test]`, nieścisłość raportu) |
| wektory ripple (zdarzenia, morale) | spełnione (320 przypadków, kolejność Kill/Shaken/Rout, morale bitowo) |
| mutanty ≥ 10 | Operator 18 (17 zabitych, M18 równoważny — potwierdzam: maszyna nie woła `target_in_range` dla strzelca obrońcy) |
| bramki EXIT 0 w allowliście | **NIE** (§2.1) |

## 4. Mutanty Evaluatora (siege_tactics_loop.rs, stan OP+DOD; 9 binarek testów; skrypt w scratchpadzie)

| # | Mutant | Wynik |
|---|---|---|
| E01 | `wall_col = st.siege_wall_col` (mur sceny ignorowany) | **PRZEŻYŁ — luka**: brak testu „mur tylko w scenie” (`scene.wall_col >= 0`, `st.siege_wall_col = -1`); przy tym wejściu maszyna dostaje `wall_col = -1`, więc U7.4 HOLD i bramka doktryny `:6087` nie działają, a strażnik `siege` nadal kieruje obrońcę do ścieżki ciała. Jest test odwrotny (`mur_tylko_w_sekwencji…`), brak lustrzanego. |
| E02 | `dd < 1.0` → `dd < 0.0` w `ranged_target_in_range_js` | **PRZEŻYŁ — luka pokrycia**: generator nie stawia wroga na tym samym polu (`dd == 0`); pin (`:8386-8391`, `_targetInRange`) dopuszcza `dd === 0` na koronie. Wymagany wektor z wrogiem na polu obrońcy (pin: strzał go pomija). |
| E03 | `dd > range` → `dd >= range` | ZABITY |
| E04 | bez `fading_out` w celu strzału | ZABITY |
| E05 | bez `routed` w celu strzału | ZABITY |
| E06 | remis: wyższe HP | ZABITY |
| E07 | `wall_ever_breached: true` | ZABITY |
| E08 | brak gałęzi `oblezenie-mur-niespojny` | ZABITY |
| E09 | `ranged_target` liczony także poza oblężeniem | przeżył — RÓWNOWAŻNY (maszyna woła `ranged_target_in_range` tylko w U7.1/U7.4, `siege_tactics_activate.rs:317,321,400`) |
| E10 | strzelec-obrońca: `melee_target` z adaptera zamiast `None` | przeżył — RÓWNOWAŻNY (jak M18; U7.1/U7.4 strzelca wracają przed `target_in_range`) |
| E11 | bez `dead` w celu strzału | ZABITY |
| E12 | remis przy `best == None` / `<=` | ZABITY |
| E13 | podwójny ripple | ZABITY (4 testy, w tym body_pin i p4_1i3) |
| E14 | `Flee if siege && terrain.is_none()` (okrążenie przy murze z `MoveTerrain` wykonuje `flee_run`) | **PRZEŻYŁ — luka**: wektory `surround-flee` budują ciało bez `MoveTerrain`, więc kolejność ramion `Flee if siege` / `Flee if terrain.is_some()` nie jest testowana. Ten sam problem precedencji: ścieżka `routed` w `start()` daje `ucieczka-routed` przed `ucieczka-oblezenie`, a ścieżka okrążenia odwrotnie — niespójne tagi dla tego samego braku. |
| E15 | `kill_ripples` bez duplikatów | przeżył — RÓWNOWAŻNY (jednostka ginie raz) |

Wynik: 15 mutantów, 9 zabitych, 3 równoważne (E09, E10, E15), **3 luki (E01, E02, E14)**.

## 5. Zarzuty (do Operatora r2)

1. **Z1 (blokujący, proces)**: bramki dispatchu na stanie w allowliście EXIT 101 (5 testów). Bez rozszerzenia
   allowlisty przez orkiestratora temat nie może przejść. Rekomendacja dla orkiestratora: decyzja techniczna
   „allowlista + 6 plików z DODATKU” (wpis w `00-dispatch.md` jako DODATEK r2), przyjęcie `6468e30fa`.
2. **Z2 (luka testu, E01)**: dodać test/wektory „mur tylko w scenie” (`st.siege_wall_col = -1`), analogiczny do
   `mur_tylko_w_sekwencji_daje_ten_sam_wynik`.
3. **Z3 (luka testu, E14)**: dodać przypadek okrążenia obrońcy przy murze z `MoveTerrain` (oczekiwany jawny tag
   `ucieczka-oblezenie`, brak `flee_run`); ujednolicić precedencję tagów z gałęzią `routed` w `start()` albo jawnie
   uzasadnić różnicę.
4. **Z4 (luka pokrycia, E02)**: wektor pinu z wrogiem na polu obrońcy (`dd == 0`) dla `_rangedTargetInRange`.
5. **Z5 (raport)**: „8 testów” → w pliku 7; „strażnik `rippleSha256`” → tylko log. Poprawić opis albo dodać
   porównanie ze stałą w generatorach DODATKU.

Brak zarzutów gameplay; brak pytań ABC. Długi z §7 raportu Operatora (T6 x2 korony/stały 6 katapulty, T2/T7
synchronizacja `wall_ever_breached`, T4 ripple wieży, #369 ripple `:5937`) — potwierdzone, do REJESTR (orkiestrator).

## 6. Sprzątanie

Target `scratchpad/siegedef-ev/target` usunięty po bramkach; drzewo robocze przywrócone (`git checkout -- rust-port`),
`src/` bez zmian po mutantach. Wolne miejsce po sprzątaniu: 9,7 GB.
