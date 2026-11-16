# 02a — Obrona Operatora, runda 1 — R-RUSTPORT-P4-1I4-BATTLE-CONSUMER

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I4-BATTLE-CONSUMER
GOAL: konsument BattleActionDto/BattleFrameDto w rendererze (battle/playback.rs), kolejność = kolejność akcji, paski z akcji
ZMIANY/COMMIT: kod obrony cb1f45508 (rodzic e33dd639d = raport Evaluatora; kod Operatora 84bfcfe84, baza 0deb9a075)
  rust-port/renderer/src/battle/playback.rs (+31/-2), rust-port/renderer/tests/battle_playback.rs (+95)
  raport: ten plik (osobny commit)
TESTY: rust-port/renderer: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0;
  cargo test --all-targets --no-fail-fast EXIT 0 (68 zestawów, 559 passed, 0 failed, 0 ignored; było 557, +2 nowe);
  battle_playback 9/9.
  Mutacja obrony (z6): przywrócenie `?` przed step_animations w play_until -> FAIL 1/9 (error_does_not_stall_animations); przywrócono.
BLOKADY: brak blokujących; wpisy do REJESTR-RUST (z1, z2, z4, z5) są poza allowlistą -> do wykonania przez orkiestratora
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Dysk przed bramką: 17 GB wolnego (`df -h /`). `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach). `Cargo.lock` nie commitowany (przywrócony). `#[ignore]` = 0. Zmiany wyłącznie w allowliście.

## Odpowiedzi na zarzuty

### 0. Bramki i mutacje Evaluatora — PRZYJMUJĘ (potwierdzenie, bez zmian)
Wyniki Evaluatora potwierdzają zielone bramki i czułość testów (a, d, e, f -> FAIL). Po zmianach obrony bramki powtórzone: EXIT 0/0/0, 559 passed.

### 1. [parytet FF] — PRZYJMUJĘ (kontrakt w kodzie + test; wpis rejestru dla orkiestratora)
Fakty potwierdzone: pin `battleScene.ts:8991-8992` (`bu.hp = Math.max(0, ...)`, `_updateHpBar`) działa także w FF, a `_spawnDamageLabel` wraca przy `_ffActive` (`:9940-9943`). Producent I3 `engine/src/domain/siege_tactics_loop.rs` `fn emit` (ok. :1210-1215) odrzuca `Damage` przy `ff_active`.
Zmiany DTO są poza zakresem (dispatch ZAKRES 2-3), więc poprawka to jawny kontrakt i test:
- `playback.rs`: doc `BattlePlayback` zawiera teraz „Contract of the caller (the P5 battle driver)”: po każdym FF i przed kolejnym `Damage` sterownik MUSI wywołać `apply_snapshot` z ramką końca FF.
- Test `fast_forward_gap_is_closed_by_snapshot`: bez snapshotu śledzone HP = `hp0 - 7` i pasek ≠ pin; ze snapshotem pasek = `hp_ff/max`, a po `Damage` = `(hp_ff - 7)/max` (`_updateHpBar` `:9637-9639`).
Wpis do `REJESTR-RUST.md` („kontrakt sterownika P5: apply_snapshot po FF”) jest poza allowlistą i należy do orkiestratora.

### 2. [brak wołającego] — ODRZUCAM jako wadę tematu (przyjmuję jako notę do rejestru)
Dispatch umieszcza konsument w crate `renderer` i zabrania zmian poza allowlistą. `rust-port/renderer/Cargo.toml` nie zależy od `civ-engine` (zależy od `civ-view-model`). Dodanie dev-zależności albo testu w workspace zmieniłoby `Cargo.toml` lub inny crate, czyli wyszłoby poza allowlistę. Produkcyjny wołający to sterownik bitwy P5. Kolejność akcji w testach zgadza się z `ProdBody` (Evaluator to sprawdził: :1330-1370, `_resolveBlowOutcome` :9044-9052). Strumień z prawdziwego silnika: NIE_ZMIERZONO. Wpis rejestru „test integracyjny engine→playback w P5 / workspace” robi orkiestrator.

### 3. [wyrocznia testu] — ODRZUCAM (częściowe pokrycie wynika z fikstury, a paski mają wyrocznię webową gdzie indziej)
- Fikstura `dynamics.json` stubuje `_singleBlow` (`gen_dynamics.ts:386`), więc nie zawiera stanu pasków po ciosie. Dopisanie fikstury z paskami wymaga nowego generatora webowego (patch `gen_dynamics.ts`), czyli poza zakresem rundy obrony.
- Same funkcje sceny, które woła playback, mają już wyrocznię webową w drzewie `Scene`: `update_hp_bar`/`update_morale_bar`/`update_ammo_bar` są porównywane z `units.json` `barUpdates` (`tests/battle3d_units.rs:1284-1295`), a `kill_unit` z wektorami `dynamics.json` (`tests/battle3d_dynamics.rs:1103`, `:1636`). Playback dodaje tylko wybór argumentów (HP z akcji, ratio `hp/maxHp`) i kolejność wywołań. To sprawdzają P == Q oraz test `hp_bar_follows_the_blow_between_frames` z ratio `(hp0 - dmg)/maxHp` jako jawną wartością pinu `:9637-9639`.
- Pozycje, moment ciosu, koniec lunge i etykiety są porównywane wprost z fiksturą (Evaluator to potwierdza).
Punkt WEKTORY jest więc spełniony dla całego drzewa `Scene` przez łańcuch: fikstura -> funkcja sceny -> playback.

### 4. [DTO TowerShot bez rodzaju pocisku] — ODRZUCAM jako wadę (opis zarzutu nieścisły; decyzja DTO poza zakresem)
W pinie `projectileKind(shooter.bu)` (`:4248`) zależy od `shooterRow`/`nazwa`, a nie od rzędu. `_fireSiegeTowers` (`:4208-4219`) bierze je raz z `this.towerShooterRow` dla całej salwy, wspólnie dla wszystkich wież. `'wieza:'+row` to tylko `id` strzelca (`:4239`) i nie wpływa na rodzaj pocisku. Jedna wartość `PlaybackOpts::tower_projectile` na bitwę odpowiada więc pinowi, o ile `towerShooterRow` jest stały w bitwie. Gdyby nie był, decyzja o przeniesieniu do `BattleSetupDto.fort`/akcji należy do I5. Zmiana DTO jest zakazana dispatchem (ZAKRES 2-3).

### 5. [Kill → HP 0; dead/removed ramki ignorowane] — PRZYJMUJĘ jako dokumentację, ODRZUCAM zmianę kodu (zakres I5)
Dla obu producentów `Kill` w I3 (cios i kontratak, `_resolveBlowOutcome` `:9044-9047`) zachowanie jest poprawne, co Evaluator przyznaje. Śmierć bez ciosu (wyłom, `_fleeStep`) to akcje oblężnicze I5, wykluczone dispatchem (NIE ROBIĆ). Doc `apply_frame` mówi teraz wprost, że pola `dead`/`removed`/`hp` ramki nie zmieniają sceny, a I5 (#249/#280) musi to zrewidować. Wpis rejestru robi orkiestrator.

### 6. [play_until przy błędzie pomija step_animations] — PRZYJMUJĘ (poprawka kodu + test + mutacja)
`play_until` liczy teraz elementy w `play_items` i krokuje animacje także przy błędzie, po czym zwraca błąd. Elementy przed błędem są zastosowane, błędny odrzucony, dalsze zostają w kolejce. Test `error_does_not_stall_animations`: scena z błędną akcją `Rout` (nieznana jednostka) w `mid` jest identyczna (`==` całego `BattleScene3`) ze sceną bez błędu, a lunge się przesunęło. Mutacja (stary `?`) daje FAIL 1/9.

## SHA
- Kod obrony: `cb1f45508`
- Raport obrony: commit z tym plikiem (SHA w odpowiedzi strukturalnej)
