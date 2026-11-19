# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Operator r2

```text
STATUS: BLOCK (częściowy) — generator pinu PEŁNEJ bitwy istnieje i działa (cały battleScene.ts pinu, 8 scenariuszy,
        guard SHA-256, MD5), test Rust bajt w bajt istnieje; zgodność: 3/8 scenariuszy bajt w bajt (wszystkie bez ciosów),
        5/8 ROZBIEŻNE — blokada B-WIRA-PIN-1 (oś czasu kroków ruchu: kwantyzacja klatkami 16 ms w pinie), §4
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL r2: generator TS wykonujący tekst pinu 07d2fbd72 dla PEŁNEJ bitwy AUTO z murem + wektory (≥ 6 scenariuszy) + test Rust bajt w bajt
BAZA: origin/rust-port-wip/k5loop-wiring-a-q1-fc @ 43ecdb162 (DODATEK r2); merge origin/rust-port/parity-v2 @ 24c8f3b75 (czysty)
GAŁĄŹ: rust-port-wip/k5loop-wiring-a-q1-r2 (lokalna)
ZMIANY/COMMIT: §1; SHA końcowy: §8
TESTY: §5
BLOKADY: B-WIRA-PIN-1 (§4)
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2; decyzja orkiestratora o B-WIRA-PIN-1 (osobny temat „kwantyzacja klatek w ciele ProdBody” albo r3)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (nowy) | generator: wykonuje CAŁY moduł `gra/src/battle/battleScene.ts` pinu z drzewem importów (ładowanie jak `p6_k5loop_adapter_gen.mjs`: `git show` + `transpileModule` + własny `require`); atrapy wyłącznie renderu/DOM/audio; jedna podmiana tekstu (rzut `_singleBlow` `:8960`); sterownik klatek `requestAnimationFrame` 16 ms; 8 scenariuszy; guard SHA-256 tekstu pinu (`EXPECTED_SHA256`); MD5 wektorów na stdout; diagnostyka śladu tylko z `WIRING_A_TRACE` |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json`, `pin_data.json` (nowe) | wektory (wejście `BattleOpts` + wynik pinu) i dane pinu (`units.json`, `counters.json`, `terrain-combat.json`, pola `combat-params.json`/`miasto-params.json`) |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (nowy) | test bajt w bajt (`wektory_pinu_pelnej_bitwy_bajt_w_bajt`), `pokrycie_scenariuszy`, `slad_diagnostyczny_na_zadanie` (no-op bez `WIRING_A_TRACE`) |
| `rust-port/engine/src/domain/siege_battle_session.rs` | D-WIRA-13: `SceneInput` + `SiegeBattleSession::prepare_scene` (wejście = `BattleOpts` po rosterach); `prepare(state)` = adapter T6 → `prepare_scene` (zachowanie bez zmian: `p6_k5loop_wiring_a` 22/22, w tym `zlote_wyniki_sesji`) |
| `dyspozycje/.../01-operator-r2.md`, `01-operator-r2-mutanty.py` | raport, skrypt mutantów |

Nie ruszano: `siege_tactics_loop.rs` (eksperyment z `STEP_GAP_MS` wycofany, §4), `bridge.rs`, `bridge_contract.rs`,
`renderer/`, `view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md`.

## 2. Generator — jak wykonuje pin

* Wykonywany tekst pinu: konstruktor `BattleScene` (`generateBattleTerrain`, `_carveBattleBox`, `_fencePlayableZone`,
  `_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`), `play` → `_startBattle` (`_applyStartingMoralePowerPenalty`,
  `_kickoffBattleTurn`), `_startLoop` (`_advanceVClock`, `_drainTimers`, `_tickFades`), `skip` → `_runFastForward`,
  `_beginTurn`/`_activateNext`/`_activateUnit`/`_checkEnd`, `_schedule`, `_fireSiegeTowers`/`_fireOneTower`,
  `_singleBlow`/`_resolveBlowOutcome`, `_doMove`, mur/brama/wyłom, `_roundCapVerdict`. ŻADNA metoda logiki nie jest atrapą.
* Atrapy: moduł `three` i `document`/`window` = uniwersalny obiekt-atrapa (wywoływalny/konstruowalny, prymityw 0/'');
  importy zasobów (`?raw`, `.css`, `.svg`, `.png`) = ''; `import.meta.glob` = `{}`; `localStorage` pusty.
* RNG (D-WIR-5): `battleScene.ts:8960` `const roll   = Math.random() * 100;` → `globalThis.__blowRandom() * 100`
  (strażnik dokładnej linii i jednoznaczności); `__blowRandom` = LCG `domain/rng.rs` z ziarnem
  `SessionRolls::derive(seed, nr)`. Inne `Math.random` (dźwięk `:11030-11242`) liczone: we wszystkich 8 bitwach `0`.
* Klatki: `requestAnimationFrame` = kolejka; klatka k wykonuje wywołania zarejestrowane przed nią z `t = 16·k`.
  Przewijanie = `play()` + `skip()` + klatki; czas rzeczywisty = `play()` + klatki.
* Wejście sceny: `BattleOpts` jak `main.ts:36980-37018` z `BattleUnit` jak `runtimeToBattleUnit` (`main.ts:33158-33196`)
  dla jednostek bez bonusów postępu (`maxHp = unitHealth(def)` `:33093`), `deploy = false`, `manualControlAllowed = false`.
  Warstwa stan gry → rostery → `BattleUnit` ma własne wektory pinu (T6); Rust dostaje te same `BattleUnit`
  (`prepare_scene`) i dane pinu (`pin_data.json`, nie dane silnika z dryfem D-ADP-4).
* SHA-256 wykonanego tekstu pinu: `3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d`.
* Czas: ok. 10 s przewijanie (6 bitew), ok. 3 min oba scenariusze czasu rzeczywistego.

## 3. Scenariusze i wynik pinu

| Scenariusz | Tryb | Wynik pinu | Rust |
|---|---|---|---|
| `mur_bez_machin_sufit` (3 vs 2, bez machin) | skip | remis, tura 150 (sufit bez wyłomu), 0 rzutów | **bajt w bajt** |
| `mur_machiny_wylom` (taran+katapulta, 6 vs 2) | skip | atakujący, tura 61, wyłom, 70 rzutów, ucieczki i zejścia z pola | ROZBIEŻNY (tura 70, 109 rzutów) |
| `palisada_liczni_taran` (9 vs 3, palisada) | skip | atakujący, tura 53, wyłom, 61 rzutów | ROZBIEŻNY (tura 54, 61 rzutów, inne HP) |
| `mury_cytadela_slaby_atak` (mury+fort+baszta, 2 vs 4) | skip | remis, tura 150, 0 rzutów | **bajt w bajt** |
| `mur_jazda_rzeka` (jazda, falanga, katapulta; rzeka/brody) | skip | obrońca, tura 400 (sufit `FF_MAX_ROUNDS` po wyłomie, werdykt morale) | ROZBIEŻNY (atakujący, tura 87) |
| `mur_wieza_obl_las` (wieża oblężnicza, teren Las) | skip | obrońca, tura 26 | ROZBIEŻNY (tura 52) |
| `rt_mur_machiny_wylom` | czas rzeczywisty | = skip pinu (identyczny wynik) | ROZBIEŻNY (= skip Rust) |
| `rt_mury_cytadela_slaby_atak` | czas rzeczywisty | = skip pinu | **bajt w bajt** |

Pokrycie (test `pokrycie_scenariuszy`): z/bez machin, wyłom, ucieczka, zejście z pola, sufit 150 (remis) i sufit 400,
zwycięstwo atakującego i obrońcy, różne liczności (2/3/4/6/9), palisada, czas rzeczywisty.
Pin: przewijanie = czas rzeczywisty (oba scenariusze); Rust: przewijanie = czas rzeczywisty (oba) — sterowniki są
spójne po obu stronach, rozbieżność jest w ciele/osi czasu, nie w sterowniku sesji.

## 4. BLOKADA B-WIRA-PIN-1 (rozbieżność Rust ↔ pin, zmierzona)

Ślad (`WIRING_A_TRACE=palisada_liczni_taran`: generator i `slad_diagnostyczny_na_zadanie`) zgodny przez 51 tur
(każdy krok ruchu, każde trafienie i rozbicie w tej samej kolejności), pierwsza rozbieżność w turze 52: pin — wieża
rzędu 82 strzela do `a2` (stoi jeszcze na 39,82), Rust — wieża 82 nie strzela (bo `a2` zdążył już odejść na 39,86),
a wieża 86 trafia `a0` → `ROUT a0`. Przyczyna zmierzona na osi czasu:

| | krok `_doMove` | pin | Rust |
|---|---|---|---|
| odstęp kolejnych kroków tej samej jednostki | `MOVE_STEP_MS` (240, `:1010`) + `_schedule(STEP_GAP_MS)` (70, `:8017`/`:8273-8284`) | **320 ms** (krok animowany `_raf(step)` do `p >= 1` `:8746-8770` kończy się na granicy klatki 16 ms; `_schedule(70)` odpala się w pierwszej klatce z `vNow >= due` = +80) | **310 ms** (czas nominalny ciała: `siege_tactics_loop.rs` `MOVE_STEP_MS` + `STEP_GAP_MS`, komentarz `:1645-1647` „kwantyzacja … NIE_ZMIERZONO”) |

Dryf 10 ms na krok przesuwa kroki jednostek względem strzałów wież (`_fireSiegeTowers` `:4208-4220`, `_schedule`
z odstępem 180 ms, `pickTowerTarget` na bieżących pozycjach `:4228-4233`) i po kilkudziesięciu turach zmienia cele.
Scenariusze bez ciosów (sufit 150 bez kontaktu) są zgodne bajt w bajt, bo tam kolejność nie ma znaczenia.

Próba naprawy w tej rundzie: zmiana `STEP_GAP_MS` 70→80 (efektywny odstęp pinu) NIE zmieniła wyniku żadnego
scenariusza — czas kroku ciała nie przechodzi tylko przez tę stałą (39 miejsc w `siege_tactics_loop.rs` liczy czasy
nominalne: `MOVE_STEP_MS`, `STEP_GAP_MS`, `RANGED_FLY_MS`, `BLOW_HIT_T`, lunge `_doMeleeAttack`, kroki jazdy/ucieczki).
Eksperyment wycofany. Poprawna naprawa = kwantyzacja wszystkich czasów animacji ciała do klatki sterownika
(16 ms przy `speedMul = 1`) jako parametr ciała ustawiany przez sesję (stare wektory `p6_k5loop_*` liczą czasy
nominalne ze stubami, więc domyślnie bez zmian) — zakres przekracza „minimalne poprawki” tej rundy.

Rekomendacja (decyzja techniczna orkiestratora): osobny temat `R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1` (Opus): oś czasu
ciała `ProdBody` w klatkach 16 ms (każdy `_raf`/`_schedule` pinu = najbliższa klatka ≥), bramka = ten sam test
`p6_k5loop_wiring_a_pin` z pustą listą `ROZBIEZNE_B_WIRA_PIN_1`. Generator i wektory są gotowe — nie trzeba ich
zmieniać. Dodatkowa obserwacja do tego tematu: w pinie `vNow` przy przewijaniu przeskakuje na początku bitwy o
wartość rzędu `performance.now()` (ślad: pierwszy krok w `T 0`, drugi w `T 6474384`); bezwzględne czasy zegara nie
wpływają na wynik (zgodność 51 tur), ale warto to potwierdzić przy porcie kwantyzacji.

Test `wektory_pinu_pelnej_bitwy_bajt_w_bajt` jest JAWNY w obie strony: 3 scenariusze muszą się zgadzać bajt w bajt,
5 z listy `ROZBIEZNE_B_WIRA_PIN_1` musi się różnić (gdy któryś zacznie się zgadzać — test pada i wymusza zawężenie
listy). To nie jest osłabienie kryterium, tylko zapis blokady w kodzie; kryterium końca części A pozostaje
NIESPEŁNIONE do zamknięcia B-WIRA-PIN-1.

## 5. Testy i bramki

(`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
`wiringa/target`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --release --test p6_k5loop_wiring_a_pin` | 3 passed |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu; kod po merge `parity-v2` 24c8f3b75) | **EXIT=0**, 545 × `test result: ok`, 0 × FAILED (w tym `p6_k5loop_wiring_a` 22/22, `p6_k5loop_wiring_a_pin` 3/3, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`, `bridge_contract`) |
| generator odtwarzalny (MD5), drugi przebieg po dodaniu śladu diagnostycznego | identyczne: `269b4da23249b441e1837a2b160cb258  vectors.json`, `432eed76e34a0e8cc96ec548e88eae64  pin_data.json`; EXIT 0 |
| merge `origin/rust-port/parity-v2` (24c8f3b75) | czysty (commit merge w gałęzi) |

## 6. Mutanty (wynik UCZCIWY: test pinu ma dziś słabą moc rozróżniającą)

Skrypt `01-operator-r2-mutanty.py` (gałęzie sterownika pełnej bitwy w `siege_battle_session.rs`, test
`cargo test --release --test p6_k5loop_wiring_a_pin`): **3 zabite / 14**.

| Mutant | Wynik | Dlaczego |
|---|---|---|
| W01 RNG: inne mieszanie ziarna | PRZEŻYŁ | 3 zgodne scenariusze mają 0 rzutów; scenariusze z rzutami są na liście B-WIRA-PIN-1 (różne i tak) |
| W02 RNG bez numeru bitwy | PRZEŻYŁ | jw. |
| W03 klatka 15 ms | PRZEŻYŁ | zgodne scenariusze kończą się sufitem tur bez kontaktu — oś czasu nie zmienia wyniku |
| W04 skip przed startem przewija | PRZEŻYŁ | test pinu zawsze woła `play()` przed `skip()`; gałąź R7 zabijają testy r1 (`p6_k5loop_wiring_a`: M04) |
| W05 tura +1 | ZABITY | |
| W06 hp = max_hp | ZABITY | |
| W07 routed = false | PRZEŻYŁ | ucieczki tylko w scenariuszach B-WIRA-PIN-1 |
| W08 removed = dead | PRZEŻYŁ | jw. |
| W09 wyłom zawsze | ZABITY | |
| W10 wieża bez skutków | PRZEŻYŁ | trafienia wież tylko w scenariuszach B-WIRA-PIN-1 |
| W11 strzelec wieży bez kontekstu | PRZEŻYŁ | jw. |
| W12 bonus muru 0 | PRZEŻYŁ | ciosy tylko w scenariuszach B-WIRA-PIN-1 |
| W13 bez kary morale startowej | PRZEŻYŁ | zgodne scenariusze nie mają ucieczek |
| W14 rzuty 0 | PRZEŻYŁ | zgodne scenariusze mają 0 rzutów |

Wniosek: kryterium „mutanty ≥ 10 zabitych na gałęziach sterownika pełnej bitwy” NIE jest spełnione i nie da się go
spełnić, dopóki scenariusze z ciosami są rozbieżne (B-WIRA-PIN-1). Te same gałęzie zabijają testy r1/obrony
(`p6_k5loop_wiring_a`, mutanty 17/17 obrony, M01–M24 r1), ale tamte nie są dowodem parytetu z pinem. Po zamknięciu
B-WIRA-PIN-1 ten sam skrypt (bez zmian) powinien zabić wszystkie W01–W14 poza W04.

## 7. Decyzje techniczne

- **D-WIRA-13** `prepare_scene(SceneInput)`: wejście sesji na poziomie `BattleOpts` (po rosterach), żeby wektory pinu
  pełnej bitwy i adapter T6 były osobnymi, każdy wektorowanymi warstwami; `prepare(state)` = adapter → `prepare_scene`.
- **D-WIRA-14** dane w teście pinu = dane pinu (`pin_data.json`), nie dane silnika (dryf D-ADP-4 to osobny temat REPIN).
- **D-WIRA-15** sterownik generatora: klatka 16 ms dla obu trybów (jak `step(16)` sesji i `FF_STEP_MS`); różne FPS
  klienta w czasie rzeczywistym pinu nadal NIE_ZMIERZONO (poza zakresem sesji ze stałą klatką).

## 8. Długi

| ID | Stan |
|---|---|
| Z1 / B1 — wektory pinu pełnej bitwy | generator + wektory + test GOTOWE; parytet 3/8 → **B-WIRA-PIN-1** (§4) |
| `zlote_wyniki_sesji` (skrót FNV Rusta) | zostaje jako zamrożenie regresji ścieżki `prepare(state)`; dowodem parytetu są wektory pinu (po B-WIRA-PIN-1 do zastąpienia/uzasadnienia) |
| pozostałe z `01-operator-r1.md` §7 i `03-final-control.md` §4 | bez zmian |

## 9. Commit

(uzupełnione na końcu)
