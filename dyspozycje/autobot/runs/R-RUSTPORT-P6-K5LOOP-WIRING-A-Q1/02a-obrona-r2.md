# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Obrona Operatora r2 (odpowiedź na `02-evaluator-r2.md`)

```text
STATUS: PASS-WITH-NOTES (obrona; wszystkie bramki EXIT 0) — 7/8 scenariuszy pinu PEŁNEJ bitwy bajt w bajt (było 3/8); jedna jawna rozbieżność
        B-WIRA-PIN-2 (mur_jazda_rzeka) z pomiarem: wynik samego pinu zależy tam od długości klatki (16 ms vs 2 ms)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A), runda 2 — obrona
GOAL r2: generator TS wykonujący tekst pinu 07d2fbd72 + wektory PEŁNEJ bitwy AUTO z murem (>= 6) + Rust bajt w bajt
BAZA: rust-port-wip/k5loop-wiring-a-q1-r2-eval @ f681087ee (kod Operatora 0afaf4e4f, merge parity-v2 24c8f3b75)
GAŁĄŹ: rust-port-wip/k5loop-wiring-a-q1-r2-obrona (lokalna)
ZMIANY/COMMIT: §2; SHA końcowy §9
TESTY: §8
BLOKADY: B-WIRA-PIN-2 (§E2-2) — jedna z ośmiu
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Final Control r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zarzuty — rozstrzygnięcia

| Zarzut | Rozstrzygnięcie | Dowód / commit |
|---|---|---|
| E2-1 (diagnoza B-WIRA-PIN-1 sfalsyfikowana) | **PRZYJMUJĘ** | Dodatkowy pomiar obrony po stronie Rust: `BATTLE_FRAME_WALL_MS` 16 → 1 ms (eksperyment, wycofany) — wynik Rust IDENTYCZNY dla wszystkich 8 scenariuszy. Rust i pin są (w 7/8) niezależne od klatki, więc dryf 320/310 ms nie był przyczyną. Prawdziwe przyczyny znalezione i naprawione (E2-1a, E2-1b). Temat „FRAME-QUANT” wycofany. |
| E2-1a (krok strzelca `a3` w turze 12, las) | **PRZYJMUJĘ — naprawione** | Przyczyna: `_applyTerrainRange(ru)` (`battleScene.ts:6064`, `:7490-7502`) NIE był wołany w ciele (`ProdOps::apply_terrain_range` = tożsamość, dawne D-B7); zasięg łucznika pozostawał 3 z kafla startowego zamiast `rangeBase + Δ` kafla bieżącego (Las −1 → 2). W turze 12 Rust uznawał wroga za „w zasięgu” na 37,78 i strzelał, pin szedł na 38,78. Ślad pinu (`RFS a3@37,78 ml=1 … rng=2 key=38,78`) potwierdza. Naprawa D-WIRA-16, commit `490498746`. |
| E2-1b (aktywacja atomowa, palisada t. 52) | **PRZYJMUJĘ — naprawione** (+ druga przyczyna czasu) | (1) Hipoteza potwierdzona śladem: w turze 53 palisady wieża rzędu 86 w pinie strzela do `a2` stojącego w trakcie marszu na 39,87, Rust nie strzela (ciało przesunęło `a2` od razu na 39,88). Naprawa D-WIRA-18 (oś czasu kroków `_doMove`, `unit_cell` w chwili wystrzału), commit `2ecda0ca5`. (2) Druga, niezależna przyczyna czasu (nie kwantyzacja): koniec aktywacji z ciosem/strzałem. Pin: cios w `BLOW_HIT_T`, `done()` dopiero po `BLOW_LUNGE_MS` + `_schedule(BLOW_SETTLE_MS)` (`:9119-9172`); strzał: trafienie po `RANGED_FLY_MS`, `done()` po `RANGED_GAP_MS` (`:9223-9229`). Rust kończył aktywację w chwili ciosu (−330 ms) i rozliczał strzał dopiero na końcu (+320 ms). Ślad lasu t. 21: pin `ACT d2 73488 → ACT a3 74144` (+656), Rust +320. Naprawa D-WIRA-17, commit `5a38f3d35`. „Hybryda” 564/560 ms z §3 Evaluatora: zegar `_drainTimers` pinu też odpala w klatce (`vNow` klatki, `:9616-9634`), więc nie była to osobna rozbieżność modelu — wynik Rust bez zmian przy klatce 1 ms (pomiar E2-1). |
| E2-2 (kryterium końca: 3/8, mutanty 3/14) | **PRZYJMUJĘ — częściowo spełnione, reszta jawną blokadą z pomiarem** | Po poprawkach: **7/8 bajt w bajt** (`mur_bez_machin_sufit`, `mur_machiny_wylom`, `palisada_liczni_taran`, `mury_cytadela_slaby_atak`, `mur_wieza_obl_las`, `rt_mur_machiny_wylom`, `rt_mury_cytadela_slaby_atak`). Pokryte po stronie Rust: wyłom, ucieczka (routed), zejście z pola (removed), sufit 150 (remis), zwycięstwo atakującego (palisada, machiny) i obrońcy (las), czas rzeczywisty. Pozostaje `mur_jazda_rzeka` (sufit 400) → B-WIRA-PIN-2, §3. Mutanty: §5. |
| E2-3 (lista blokady akceptuje błąd sesji) | **PRZYJMUJĘ — naprawione** | `wektory_pinu_pelnej_bitwy_bajt_w_bajt`: `Err(e)` sesji → `fails.push(...)` dla KAŻDEGO scenariusza (także z listy); lista wymaga `Ok(..)` z różnicą danych. Commit `5a38f3d35`. |
| N1 (tryb śladu nadpisuje wektory) | **PRZYJMUJĘ — naprawione** | `if (process.env.WIRING_A_TRACE) process.exit(0);` przed zapisem; commit `490498746`. |
| N2 (zależność orakula od zegara ściennego) | **PRZYJMUJĘ — naprawione** | Generator używa deterministycznego `performance.now` (+1 ms na odczyt; pin czyta go tylko jako budżet 40 ms `_runFastForward` `:9422-9423` i w dźwiękach). Pomiar: pełna regeneracja z tym zegarem daje `vectors.json` MD5 `269b4da23249b441e1837a2b160cb258` i `pin_data.json` `432eed76e34a0e8cc96ec548e88eae64` — identyczne z zatwierdzonymi. Commit `bde79839b`. Wektory nie zmienione. |
| Uwaga: bramki Evaluatora / allowlista / merge `adadc1129` | brak zarzutu | — |

## 2. Zmiany (allowlista DODATKU r2)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | D-WIRA-16: `ProdBody::terrain_range_delta` + `refresh_terrain_range` (`apply_terrain_range` T6) wołane na początku aktywacji (`:6064`), w `_siegeShooterThreats` (`:7929`, mutacja `d.range` tylko po `_siegeApproachRestricted`) i po zejściu z korony (`:7740`). D-WIRA-17: `LoopBody::take_tail` + `LoopTimer::BodyTail`, `ProdBody::pin_blow_timing`, stałe `BLOW_LUNGE_MS`/`BLOW_SETTLE_MS`; ogon po ciosie `260 + 220 − body_ms`, strzał trafia w `at + RANGED_FLY_MS`, ogon `RANGED_GAP_MS`. D-WIRA-18: `move_timeline` (krok `_doMove` z `t0`) i nowa metoda `LoopBody::unit_cell_at(unit, v_now)` (domyślnie = `unit_cell`), czytana przez `pick_tower_for_row` z `vNow` wystrzału; w `ProdBody` zwraca pozycję sprzed kroku o `t0 > v_now` tylko przy `pin_blow_timing` (pierwsza wersja zmieniała `unit_cell` bezwarunkowo i psuła 12 testów pętli czytających pozycje końcowe — wykryte pełnym testem, poprawione w `ce9afe0d3`). Domyślnie (`None`/`false`) zachowanie jak dotąd — dotychczasowe wektory pętli (`p6_k5loop_*`, `p4_1i*`, `p6_siege_*`) bez zmian. |
| `engine/src/domain/siege_battle_session.rs` | `SessionData::terrain_range_rows` (`TerrainRangeRow`), `terrain_range_delta` (port `terrainRangeDelta` `combat.ts:730-742`: `normTerrain`, `−`→`-`, pierwsze `[+-]?\d+`), siatka Δ dla wszystkich kafli pola, `pin_blow_timing = true`. |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `terrain_range_rows` z `pin_data.json`; E2-3; lista rozbieżności 5 → 1 (`mur_jazda_rzeka`) z nowym opisem przyczyn; ślad diagnostyczny + `TURN`/`MELEE`/`SHOT`/`CLASH`. |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | N1, N2. Wektory i `EXPECTED_SHA256` bez zmian. |
| `engine/tests/p6_k5loop_wiring_a.rs` | ZMIANA ASERCJI (uzasadniona): `zlote_wyniki_sesji` (skrót FNV wyników Rusta, „RUST-ONLY, zamrożenie regresji”) `619d9ea6ba687f71` → `9b17cd8895ee7c0b`, bo D-WIRA-16/17/18 zmieniają przebieg bitew sesji zgodnie z pinem (`battleScene.ts:6064`, `:9119-9172`, `:9223-9229`, `:4228-4233`); dowodem parytetu są wektory pinu (7/8). Pozostałe 21 testów pliku bez zmian. |
| merge `origin/rust-port/parity-v2` @ `a22257a91` (P4-1I5B) | `f120c49ab`, bez konfliktów (`git merge-tree` czyste) |
| `dyspozycje/.../02a-obrona-r2.md`, `02a-obrona-r2-mutanty.py`, dopisek w `02a-obrona.md` | raport, skrypt mutantów |

Nie ruszano: `bridge.rs`, `bridge_contract.rs`, `renderer/`, `view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.*`,
`REJESTR-RUST.md`, `siege_tactics_fastforward.rs` (eksperyment 1 ms wycofany przed commitem).

## 3. B-WIRA-PIN-2 (`mur_jazda_rzeka`) — pomiar, nie hipoteza

Ślad pinu (przewijanie, klatka 16 ms) i Rust zgodne zdarzeniami do tury 69. Tura 70: konnica `a0` (39,89) uderza
łucznika `d2` na koronie (40,89), równocześnie leci pocisk wieży rzędu 90 w `a0`.

| | trafienie wieży 90 | cios `a0 → d2` | kolejność rzutów | wynik ciosu |
|---|---|---|---|---|
| pin, klatka 16 ms (wektor) | due = 5773708 → klatka **5773712** | lunge `localT >= 150` → klatka **5773712** (t0 5773552 + 160) | wieża, potem cios (`_drainTimers` przed kolejką `_raf` w tej samej klatce) | **68 → KILL d2** |
| pin, klatka 2 ms (`FRAME=2 MODE=realtime`) | 135560 | **135530** (t0 135380 + 150) | cios, potem wieża | **0 (pudło)** |
| Rust (czas nominalny) | t0+156 | t0+150 | cios, potem wieża | **0 (pudło)** |

Wniosek: w tym scenariuszu wynik SAMEGO pinu zależy od długości klatki (remis czasowy 150 vs 156 ms rozstrzyga
zaokrąglenie do klatki 16 ms). Pin @16 ms: obrońca, tura 400 (wektor); pin @16 ms czas rzeczywisty: to samo
(`trace_jaz_rt16`); pin @2 ms: inny przebieg (w turze 70 identyczny z Rust). Rust od tury 70 do 85 zgadza się z pinem
@2 ms zdarzeniami (różnice tylko kolejności emisji akcji w obrębie aktywacji); w turze 86 pin @2 ms ma `ROUT a0` po ciosie
17 `d1 → a0`, Rust ma ten sam cios bez rozbicia — przyczyna tego drugiego rozjazdu NIE_ZMIERZONO (stan morale nie jest
w śladzie).

| `mur_jazda_rzeka` | zwycięzca | tura | rzuty | HP a0 / a3 |
|---|---|---|---|---|
| pin, przewijanie 16 ms (wektor) | obrońca | 400 | 46 | 29 / 17 |
| pin, czas rzeczywisty 16 ms | obrońca | 400 | 46 | (= wektor) |
| pin, czas rzeczywisty 2 ms | obrońca | 400 | **48** | **31 / 15** |
| Rust (po poprawkach obrony) | atakujący | 89 | 55 | 25 / 15 |

Sam pin daje dwa RÓŻNE wyniki bajtowe przy klatce 16 ms i 2 ms (rzuty 46 vs 48, HP), więc ten scenariusz nie jest
niezmienniczy względem klatki (inaczej niż palisada i las, które zmierzył Evaluator).

Rozstrzygnięcie techniczne (do decyzji orkiestratora, nie gameplay): parytet bajt w bajt z wektorem @16 ms wymagałby
kwantyzacji czasów ciała do klatki 16 ms (kolejność remisów z `_drainTimers` przed `_raf`) — to jest dokładnie zakres
„FRAME-QUANT”, ale uzasadniony teraz JEDNYM scenariuszem z pomiarem remisu, nie dryfem. Wniosek: osobny temat albo r3.
Scenariusz zostaje w wektorach jako JAWNA rozbieżność (test pada, gdy zacznie się zgadzać albo gdy sesja zwróci błąd).

## 4. Decyzje techniczne

- **D-WIRA-16** `_applyTerrainRange` w ciele (siatka Δ ze stałego pola; jedyne zmiany kafli w pinie to mur/brama →
  `Plains`, a `combatTerrainName` muru, bramy i równiny = „Plaskie”, Δ 0).
- **D-WIRA-17** rozdzielenie chwili skutku i `done()` aktywacji (ogon); flaga ciała, domyślnie dawny model dla starych
  wektorów pętli generowanych ze stubami czasu.
- **D-WIRA-18** pozycje dla wież z osi czasu kroków ciała (`t0` kroku = zmiana `ru.q/ru.r` w pinie).
- **D-WIRA-19** generator: deterministyczny zegar ścienny (N2).

## 5. Mutanty (`02a-obrona-r2-mutanty.py`, test `cargo test --release --test p6_k5loop_wiring_a_pin`)

**16 zabitych / 23** (wymóg DODATKU r2: ≥ 10 na gałęziach sterownika pełnej bitwy; Operator r2: 3/14).

| Mutant | Wynik | Uwagi |
|---|---|---|
| W01 RNG: inne mieszanie ziarna | ZABITY | |
| W02 RNG: bez numeru bitwy | PRZEŻYŁ | równoważny na wektorach (`battleIndex = 0` we wszystkich); gałąź zabijają testy r1 `p6_k5loop_wiring_a` |
| W03 krok czasu: `wall_now` −1 ms | PRZEŻYŁ | równoważny: `wall_now` to tylko znacznik `t` klatki, nie wchodzi do zegara wirtualnego |
| W04 skip przed startem przewija | PRZEŻYŁ | test pinu zawsze woła `play()` przed `skip()`; gałąź R7 zabija `p6_k5loop_wiring_a` (M04 r1) |
| W05 tura +1 | ZABITY | |
| W06 hp = max_hp | ZABITY | |
| W07 routed = false | ZABITY | (r2 Operatora: PRZEŻYŁ) |
| W08 removed = dead | PRZEŻYŁ | równoważny na wektorach: w 8 scenariuszach każda martwa jednostka jest też usunięta i odwrotnie |
| W09 wyłom zawsze | ZABITY | |
| W10 wieża bez `_resolveBlowOutcome` | ZABITY | (r2: PRZEŻYŁ) |
| W11 strzelec wieży bez kontekstu obrońcy | ZABITY | (r2: PRZEŻYŁ) |
| W12 bonus muru 0 | ZABITY | (r2: PRZEŻYŁ) |
| W13 rzuty 0 | ZABITY | (r2: PRZEŻYŁ) |
| W14 bez siatki Δ zasięgu (dawne D-B7) | ZABITY | nowa gałąź D-WIRA-16 |
| W15 dawny czas ciosu/strzału | ZABITY | nowa gałąź D-WIRA-17 |
| W16 Δ zasięgu: `−` jako `+` | ZABITY | port `terrainRangeDelta` |
| B01 `_applyTerrainRange` nie na początku aktywacji | ZABITY | |
| B02 ogon ciosu 0 | ZABITY | |
| B03 trafienie strzału na końcu (FLY+GAP) | PRZEŻYŁ | NIEZABITY: w 7 zgodnych scenariuszach przesunięcie trafienia strzału o 320 ms nie zmienia kolejności rzutów ani celu wież; brak wektora rozróżniającego (dług → r3/FC: scenariusz z łucznikiem strzelającym w oknie lotu pocisku wieży) |
| B04 wieża widzi pozycję końcową marszu | ZABITY | D-WIRA-18 (ponownie ZABITY po `ce9afe0d3`) |
| B05 wieża widzi pozycję sprzed całego marszu (`v_now = −∞`) | ZABITY | (po `ce9afe0d3`; pierwsza wersja: „bez `set_now`”, też ZABITY) |
| B06 `_siegeShooterThreats` bez `_applyTerrainRange` | PRZEŻYŁ | NIEZABITY: obrońcy-strzelcy stoją na koronie/kaflach z Δ = 0 (las tylko po stronie atakującego), więc mutacja nie zmienia `d.range` |
| B07 zejście z korony bez `_applyTerrainRange` | PRZEŻYŁ | NIEZABITY: w zgodnych scenariuszach z wyłomem żaden strzelec nie schodzi z korony przy kafle wyburzonym przed swoją kolejną aktywacją (zasięg i tak przeliczany na jej początku) |

Uczciwie: B03/B06/B07 to gałęzie poprawne wg pinu (linie w §2), ale bez wektora, który je rozróżnia.

## 6. Długi

| ID | Stan |
|---|---|
| B-WIRA-PIN-1 (5 scenariuszy) | zamknięta: 4 z 5 zgodne bajt w bajt po D-WIRA-16/17/18 |
| B-WIRA-PIN-2 (`mur_jazda_rzeka`) | jawna, §3; kwantyzacja klatki 16 ms dla remisów czasowych + rozbicie w t. 86 @2 ms (NIE_ZMIERZONO) |
| `_applyTerrainRange` w autobatch (`:5919`) | tryb ręczny — poza zakresem AUTO (D-WIR-2); ciało nadal bez przeliczenia w `ProdPathEnv` (nieosiągalne w AUTO) |
| pozostałe (r1 §7, FC r1 §4) | bez zmian |

## 7. Pomiar Evaluatora (powtórzenie i rozszerzenie)

- Rust z klatką 1 ms (`BATTLE_FRAME_WALL_MS = 1.0`, eksperyment): 8/8 wyników identycznych z klatką 16 ms
  (przed poprawkami) — Rust niezależny od klatki, potwierdza E2-1.
- Pin `mur_jazda_rzeka`: przewijanie 16 ms = czas rzeczywisty 16 ms (obrońca, t. 400); 2 ms → inny przebieg (§3).

## 8. Bramki

(`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
`wiringa-obr2/target`, usunięty po bramkach; kod = HEAD po merge `parity-v2` a22257a91)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --release --test p6_k5loop_wiring_a_pin` | EXIT 0, 3 passed (7/8 bajt w bajt, 1 jawna rozbieżność wymagająca `Ok`) |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **FULL_EXIT=0**, 547 × `test result: ok`, 0 FAILED (m.in. `bridge_contract` 9/9, `p6_k5loop_wiring_a` 22/22, `p6_k5loop_wiring_a_pin` 3/3, `p4_1i5b_siege_actions` 5/5, `p6_k5loop_close*`, `p6_k5loop_siege_*`, `p6_k5loop_tags_rest`, `p6_k5doc_t8`) |
| Pierwszy pełny test (przed `ce9afe0d3`) | FULL_EXIT=101: 12 testów pętli czytających `unit_cell` po bitwie (D-WIRA-18 bez bramki) + `zlote_wyniki_sesji`; poprawione i powtórzone (wiersz wyżej) |
| Mutanty | 16/23 + B04/B05 po zmianie D-WIRA-18 ponownie: ZABITY/ZABITY |
| Generator (N2, deterministyczny zegar), pełna regeneracja poza repo | MD5 `269b4da23249b441e1837a2b160cb258 vectors.json`, `432eed76e34a0e8cc96ec548e88eae64 pin_data.json` = zatwierdzone; strażnik SHA-256 pinu przeszedł |
| `git merge-tree` z `origin/rust-port/parity-v2` @ a22257a91 | czyste; merge `f120c49ab` |
| Allowlista | tylko pliki z §2; `bridge.rs`, `bridge_contract.rs`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md`, renderer nietknięte; brak `#[ignore]` |

## 9. Commity

Gałąź lokalna `rust-port-wip/k5loop-wiring-a-q1-r2-obrona` (baza `f681087ee`):
`490498746` (D-WIRA-16, N1), `5a38f3d35` (D-WIRA-17, E2-3), `2ecda0ca5` (D-WIRA-18 v1), `a93f981a7` (clippy, skrypt
mutantów), `bde79839b` (N2), `ce98555fa` (raport wstępny), `ce9afe0d3` (D-WIRA-18 z bramką, złote wyniki), `f120c49ab`
(merge parity-v2 a22257a91), końcowy = commit z tym raportem (SHA w StructuredOutput / `git log -1`). Push: NIE.
