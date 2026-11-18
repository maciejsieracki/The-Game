# R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1 — Operator r1

```text
STATUS: BLOCK (allowlista) — kod T1 + KILL-RIPPLE gotowy i zgodny z pinem; 3 istniejące testy POZA allowlistą
        muszą się zmienić (bezpośrednia konsekwencja GOAL 1 i GOAL 2), patrz §4. Poprawka przygotowana i
        zweryfikowana na osobnej gałęzi (DODATEK), nie w gałęzi Operatora.
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1
GOAL: obrońca w oblężeniu w ProdBody (onWallWalkway, kontrbateria, trzymanie muru, cios sąsiada, HOLD) + ripple
      _shakeAlliesOnLoss przy zabiciu (D-INT-2).
ZMIANY/COMMIT: gałąź rust-port-wip/siege-def-q1-op = 04ff93f2f (tylko allowlista);
               gałąź rust-port-wip/siege-def-q1-op-dodatek = 6468e30fa (rodzic 04ff93f2f; 6 plików POZA allowlistą, §4)
TESTY: §6 (bramki); pełny engine na stanie OP+DODATEK: §6.3
BLOKADY: rozszerzenie allowlisty o 6 plików (§4) — decyzja orkiestratora (DODATEK r2), bez pytania do właściciela
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: DODATEK z rozszerzoną allowlistą (zalecane: przyjąć commit 6468e30fa) → Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `origin/rust-port/parity-v2` = `8a40ff9b312a7aac94ce757d1a51905c3f2f1f52` (zgodnie z dispatchem).
Pin webu: `07d2fbd72` (`git show`, `gra/` nietknięte).

## 1. Web najpierw — weryfikacja numerów linii pinu

| Element | Pin `battleScene.ts` | Uwagi |
|---|---|---|
| bramka doktryny obrońcy `siegeDefenderNeverDoctrine` | `:6087`, `:6092` | obrońca przy murze nigdy nie wchodzi w krok doktryny |
| okrążenie | `:6105-6118` | rout → `_fleeStep` |
| `_updateFacing` przed gałęziami muru | `:6123` | |
| gałąź `onWallWalkway` | `:6129-6172` | strzelec `:6136-6164`, kontrbateria `bestCata` `:6139-6150`, wręcz `:6165-6168`, trzymanie `:6169-6171` |
| wieża/piechota do wieży | `:6179-6180` | dla obrońcy `return false` (`:8057`, `:8088`) |
| SIEGE DEFENDER HOLD | `:6222-6236` (`if` w `:6225`) | strzelec `_rangedTargetInRange`, wręcz `_targetInRange`, inaczej `done()` |
| `_rangedTargetInRange` | `:7041-7053` | najbliższy w `[1..range]`, remis = niższe HP |
| `_meleeBlockedByWall` / `_targetInRange` | `:8361-8371` / `:8373-8410` | `meleeBlockedByWall` = `city-fortification.ts:76-79` |
| ripple przy zabiciu | `:9048` (w `_resolveBlowOutcome` `:9019-9069`) | po `_startFade`, przed `_boostEnemiesOnBreak` |
| ripple `:5937` (z dispatchu) | `_resolveAutoBatchMovement` | ścieżka AUTO-batch (K5G0) — w `SiegeLoop` sterownik panikuje na `BeginAutoBatchPhase` (`siege_tactics_loop.rs:796`), `ProdPathEnv::shake_allies_on_loss` = `unreachable!`. Poza ciałem `ProdBody`, więc nie dotyczy (zapis w Długach). |

Uwaga do dispatchu („zasięg +1”): w pinie `+1 elewacji` USUNIĘTO (`:6130-6133`, R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1);
strzelec na koronie ma zasięg x2 w `_applyTerrainRange` (`:7490-7512`, `wallCrownShooterRange`). W ciele `ProdBody`
`_applyTerrainRange` jest tożsamością (zasięg = wejście adaptera `activate.range`, decyzja K5H) — x2 korony liczy
adapter (T6, wpisane w Długi). Gameplay bez zmian względem webu; brak pytań ABC.

## 2. Zmiany kodu (allowlista) — `rust-port/engine/src/domain/siege_tactics_loop.rs`

- Strażnik zakresu w `ProdBody::start`: tag `oblezenie` TYLKO dla strony `atk` przy murze (T2). Obrońca przy murze idzie
  maszyną K5H (`activate_unit`, gałęzie U7.1 i U7.4 już istniały). Mur sceny maszyny = `max(scene.wall_col,
  st.siege_wall_col)`; dwie RÓŻNE nieujemne wartości = jawny tag `oblezenie-mur-niespojny` (błąd wejścia).
- Cel obrońcy liczy ciało z bieżących pozycji: strzelec — nowa `ranged_target_in_range_js` (`f64`, bez obcięcia zasięgu
  do `i64`, więc `dd > NaN` = fałsz jak w JS; `+Inf` = całe pole), wręcz — `target_in_range_cmb` z
  `TargetScene { siege_wall_col, wall_ever_breached }` (filtr `_meleeBlockedByWall`). `ProdOps` dostał
  `ranged_target` (poza oblężeniem `None`, bez zmian zachowania).
- Nowe pole `ProdBody::wall_ever_breached` (wejście sterownika; domyślnie `false` jak start bitwy w pinie).
- Okrążenie obrońcy przy murze → rout wykonany (`complete` → `_startRout`), ucieczka = jawny tag `ucieczka-oblezenie`
  (spójnie z gałęzią `routed`, r4: `_doMove` czyta `_siegeMoveRefused`).
- KILL-RIPPLE: `SceneEffect::ShakeAllies` wykonuje `shake_allies_on_loss` (istniejący port r4, `:9743-9753`) zamiast
  tagu `shakeAlliesOnLoss`; nowe pole obserwacyjne `ProdBody::kill_ripples`.
- Komentarze modułu zaktualizowane (stan portu).

Bez zmian: `mod.rs`, `Cargo.*`, `renderer/`, `view-model/`, `bridge.rs`, `siege_tactics_actions.rs`, `battle_setup*.rs`, `gra/`.

## 3. Nowy test i generator (allowlista)

- `tests/p6_k5loop_siege_def_gen.mjs` — WYKONUJE tekst pinu (wycinki r4 + `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`,
  `_resolveBlowOutcome`, `_startFade`, `meleeBlockedByWall`, stałe 1115/1140); strażnik SHA-256
  `e8e86aec589637a83159e765eab68f09198932326f7505d03b97cde7468a9deb`, ziarno 5501.
- `tests/p6_k5loop_siege_def_vectors/vectors.json` (880 aktywacji obrońcy + 320 zabić z ripple),
  `vectors_nan.json` (1343: `range` NaN 462, `range` +Inf 376, `morale` NaN 80, `hp` NaN 425).
- `tests/p6_k5loop_siege_def.rs` — 7 testów [ERRATA obrona r1 (Z5): było „8”; po obronie 10, `02a-obrona.md`], strażnik czasu 90 s. Porównanie: ślad, czas, facing (końcowe i zmiany
  z czasem), strzał (Facing+Shot, cel, łuk), cios (cel, czas), amunicja, Rout/Shaken/Kill z kolejnością, stan WSZYSTKICH
  jednostek (morale bitowo), `occByKey`, liczba rzutów, `unported` (pusty; okrążenie = dokładnie `ucieczka-oblezenie`).

Liczniki pokrycia (dokładne nazwy = gałęzie pinu, `branchOf` generatora), zmierzone:
`walk-shoot 119, walk-shoot-hold 41, walk-cata-counterbattery 90, walk-cata-fallback 35, walk-cata-hold 15,
walk-melee 128, walk-melee-hold 32, hold-shoot 73, hold-shoot-hold 67, hold-melee 143, hold-melee-hold 57,
surround-flee 80`; ripple: `n=320 shaken=192 kaskada_rout=120 oslona=28`; NaN: strzał przy NaN 429.
`doctrineAutoDef = 880` w generatorze nie wywołał `_executeGroupDoctrineStep` (atrapa rzuca) — bramka `:6087` pokryta.

## 4. Zmiany asercji (D-INT-2) i BLOKADA allowlisty

### 4.1 Dozwolone (w gałęzi Operatora)

1. `p6_k5loop_outcome_pin.rs` (ok. `:268`): STARE `assert!(body.unported.contains(&(def(0), "shakeAlliesOnLoss")));`
   NOWE `assert_eq!(body.kill_ripples, vec![def(0)]); assert!(… all t != "shakeAlliesOnLoss")`. Dowód pinu: `:9048`
   woła `_shakeAlliesOnLoss(defender)` w gałęzi zabicia; wektory `ripple` (320) potwierdzają (test
   `ripple_przy_zabiciu_zgodny_z_pinem`). Pozostałe asercje scenariusza bez zmian (brak sojuszników → morale bez zmian).
2. `p6_k5loop_outcome_pin.rs` (ok. `:281`): asercja bez zmian + DODANA wzmacniająca `kill_ripples.is_empty()`.
3. `p6_siege_tactics_loop_body_pin.rs` (`:407`, `:688`; dispatch mówi `p6_siege_tactics_loop_body.rs`, ale asercje są
   w `_pin.rs` — wg REJESTR D-INT-2): STARE liczenie wpisów `unported == "shakeAlliesOnLoss"`; NOWE liczenie
   `kill_ripples.len()` (ta sama oczekiwana liczba `fx.shakes` z pinu) + DODANA asercja braku tagu. Porównanie `==` bez zmian.

### 4.2 POZA allowlistą (gałąź DODATEK, nie w gałęzi Operatora) — dlaczego konieczne

Zmierzone na gałęzi Operatora (tylko allowlista), 3 testy z bramek FAIL:
- `p6_siege_tactics_loop_body_pin::zgodnosc_ciala_z_tekstem_pinu_end_to_end` — 448 rozbieżności: generator
  `p6_siege_tactics_loop_body_gen.mjs:421` ma ATRAPĘ `_shakeAlliesOnLoss` (tylko licznik), więc wektory stanu (morale
  sojuszników) nie zawierają ripple pinu. Zmiana samych asercji `:407/:688` nie wystarcza — potrzebna regeneracja.
- `p4_1i3_actions::{zgodnosc_akcji_ciosu_i_kontrataku_z_pinem, …_w_trybie_ff_z_pinem}` — 45/9 rozbieżności (akcje
  `shaken` + kaskady): generator `p4_1i3_actions_gen.mjs:503` ma atrapę `_shakeAlliesOnLoss(fallen) {}`.
  `…_strzalu_wiezy_z_pinem` — syntetyczny obrońca testu (`tower_loop`, poza wektorem pinu) działa teraz gałęzią HOLD i
  emituje `Facing` w oknie wieży.
- `p6_k5doc_t8::cialo_przy_murze_zostaje_tagiem_oblezenie` — test wymaga tagu `oblezenie` także dla obrońcy, co
  jest wprost sprzeczne z GOAL 1 (panika rzutu: obrońca teraz atakuje).

Zawartość DODATKU (`6468e30fa`, też jako `01-operator-r1-poza-allowlista.patch` bez wektorów):
1. `p6_siege_tactics_loop_body_gen.mjs`: atrapa → TEKST pinu `_shakeAlliesOnLoss` (`:9743`, stała `:1118`), osobny
   strażnik `rippleSha256` [ERRATA obrona r1 (Z5): w r1 tylko log i pole JSON; porównanie ze stałą + `throw` dodane w
   `60f04b10f`]; `N_SEQ 320 → 340` (po ripple licznik kontrataków spadł do 298 < progu 300 — próg NIE
   poluzowany, dodano sekwencje). Wektory zregenerowane (`sha256 527db205…`).
2. `p4_1i3_actions_gen.mjs`: atrapa → TEKST pinu + akcja `shaken` (format jak w Rust); trafienie WIEŻY nadal bez ripple
   (zgodnie z istniejącym jawnym tagiem `wieza-resolveBlowOutcome-efekty`). Wektory zregenerowane (`sha256 30b660f2…`).
3. `p4_1i3_actions.rs`: okno wieży pomija `Facing` syntetycznego obrońcy (jedna linia filtra; żadna asercja nie
   usunięta ani poluzowana).
4. `p6_k5doc_t8.rs`: test muru bierze tylko scenariusze z działającym ATAKUJĄCYM (zakres T2); obrońcę pokrywa nowy test.

Rekomendacja dla orkiestratora: DODATEK r2 z allowlistą rozszerzoną o te 6 plików i przyjęcie `6468e30fa` (wszystkie
bramki zielone, §6). Alternatywa (gorsza): wycofać KILL-RIPPLE do osobnego tematu — wtedy i tak zostaje konflikt
`p6_k5doc_t8` z GOAL 1.

## 5. Mutanty (18; skrypt `scratchpad/siegedef/mutants.py`, testy: siege_def + outcome_pin + body_pin, stan OP+DOD)

| # | Mutant | Wynik |
|---|---|---|
| M01 | brak `shake_allies_on_loss` przy zabiciu | ZABITY |
| M02 | brak zapisu `kill_ripples` | ZABITY |
| M03 | obrońca znów tagowany `oblezenie` | ZABITY |
| M04 | mur tylko ze sceny | ZABITY |
| M05 | `!(dd <= range)` (NaN) | ZABITY |
| M06 | remis odległości bez HP | ZABITY |
| M07 | `<=` zamiast `<` | ZABITY |
| M08 | martwi/uciekający jako cele strzału | ZABITY |
| M09 | wyłom ignorowany w filtrze muru | ZABITY |
| M10 | filtr muru wyłączony | ZABITY |
| M11 | strzelec obrońcy bez celu | ZABITY |
| M12 | cel wręcz z adaptera zamiast ciała | ZABITY |
| M13 | okrążenie przy murze bez tagu | ZABITY |
| M14 | kontrbateria `<` zamiast `<=` (activate.rs) | ZABITY |
| M15 | kontrbateria wyłączona (activate.rs) | ZABITY |
| M16 | bramka `siegeDefenderNeverDoctrine` wyłączona (activate.rs) | ZABITY |
| M17 | HOLD: strzelec idzie ścieżką wręcz (activate.rs) | ZABITY |
| M18 | korona: strzelec bez celu bije sąsiada (activate.rs) | PRZEŻYŁ — RÓWNOWAŻNY w `ProdBody`: dla strzelca-obrońcy przy murze ciało podaje `target_in_range = None` (pin nie woła `_targetInRange` w tej gałęzi, `:6136-6164`), więc mutant nie ma celu. Różnica byłaby widoczna dopiero przy innym `ActivateOps`. |

17/18 zabitych, 1 jawnie równoważny. Pliki `siege_tactics_activate.rs` mutowane tylko tymczasowo (przywrócone, `git diff` pusty).

## 6. Bramki (`rust-port/engine`, CARGO_INCREMENTAL=0, *_DEBUG=0, target w scratchpadzie)

6.1 Stan OP+DODATEK: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
`p6_k5loop_siege_def` 7/7 [ERRATA obrona r1: było „8/8”]; `p6_siege_tactics_loop_body` 8/8; `p6_siege_tactics_loop_body_pin` 2/2;
`p6_k5loop_outcome_pin` 8/8; `p6_k5loop_close_r4` 7/7; `p6_k5doc_t8` 6/6; `p4_1i3_actions` 9/9;
`p6_k5loop_close`/`_r2`/`_r3`, `p6_siege_tactics_loop`, `p6_siege_tactics_loop_resume` OK.

6.2 Stan OP (sama allowlista): FAIL dokładnie w testach z §4.2 (body_pin 1, p4_1i3_actions 3, k5doc_t8 1).

6.3 Pełny `cargo test --all-targets --no-fail-fast` (stan OP+DODATEK, w tle, log `scratchpad/siegedef/full.log`): EXIT 0 — 536 bloków `test result: ok`, 4032 passed / 0 failed / 1 ignored (istniejący), 0 linii FAILED. Generatory deterministyczne: ponowne uruchomienie trzech generatorów daje identyczne sha256 wektorów (siege_def b99aa6d5…/3e98d6a9…, body_pin 527db205…, p4_1i3 30b660f2…).

## 7. Długi (dla T2/T4/T6/T7/#369)

- T6 ADAPTER: zasięg x2 strzelca na koronie (`_isWallCrownShooter` + `wallCrownShooterRange`, `:7509-7511`) i stały 6
  katapulty obrońcy (`_placeSiegeDefenders`) = wejście `activate.range`; szablony ciosu obrońcy dla celu liczonego przez
  ciało (dziś wymagane `melee_target == cel ciała`, inaczej `cios-bez-szablonu`) i `ranged_blows` dla wszystkich celów.
- T2/T7: `ProdBody::wall_ever_breached` musi być synchronizowane z `SiegeEnv::wall_ever_breached` przy wyłomie w trakcie
  bitwy (`breach_wall_row`); dziś brak ścieżki z pętli do ciała.
- T2: strona `atk` przy murze nadal tag `oblezenie` (wieże, taran, katapulta, wejście na mur, doktryna atakującego);
  napastnik na koronie (`onWallWalkway`, po wieży) też przez T2.
- T4/#369: ripple przy zabiciu przez WIEŻĘ (`tower_blow`) nadal nieportowany (`wieza-resolveBlowOutcome-efekty`).
- #369: ripple `:5937` (`_resolveAutoBatchMovement`) — ścieżka AUTO-batch poza `SiegeLoop`.
- Ucieczka obrońcy przy murze (`_fleeStep` z `_siegeMoveRefused`) — tag `ucieczka-oblezenie` (jak r4).
- `REJESTR-RUST.md` (orkiestrator): wpis D-INT-2 zrealizowany + korekta zakresu (dodatkowe 6 plików), decyzja techniczna
  „mur sceny = max(scene, st), różne nieujemne = błąd wejścia”.
