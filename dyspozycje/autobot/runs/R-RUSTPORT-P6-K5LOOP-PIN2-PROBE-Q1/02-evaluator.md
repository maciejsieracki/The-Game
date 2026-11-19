# R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 (B-WIRA-PIN-2: sonda morale t. 86 + scenariusze dla mutantów B03/B06/B07)
GOAL: ROZBIEZNE_B_WIRA_PIN_1/2 puste albo jawnie uzasadnione; sonda zmierzona; >= 3 scenariusze zabijające B03/B06/B07;
      7 dawnych scenariuszy bajt w bajt; MD5 generatora odtwarzalne
BAZA: 2e5bf370a434eb81eeaf0e82d104faaf5f40b57d (= origin/rust-port/parity-v2 w chwili oceny; zgodnie z linią BAZA dispatchu)
OCENIANY KOD: 978a63ea1 (rust-port-wip/k5loop-pin2-probe-q1-r1), `git merge-base --is-ancestor 2e5bf370a 978a63ea1` = TAK
ZMIANY/COMMIT: tylko ten raport (gałąź eval/k5loop-pin2-probe-q1, worktree wf_40925a79-57f-2); kod Operatora nietknięty
TESTY: §2
BLOKADY: brak blokujących; zarzuty §5 (Z1 B06 niezabity, Z2 gałąź konfliktu bez pokrycia) — do decyzji FC
RUNDY: 1/5
NASTĘPNY KROK: Obrona (02a-obrona.md), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista

`git diff --stat 2e5bf370a 978a63ea1` — 10 plików, wszystkie w allowliście:
`engine/src/domain/siege_tactics_loop.rs`, `engine/tests/p6_k5loop_wiring_a.rs`, `p6_k5loop_wiring_a_gen.mjs`,
`p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/vectors.json`, katalog runu (raport + 4 skrypty .py).
Pliki spoza allowlisty: **brak** (`siege_battle_session.rs`, `bridge.rs`, `renderer/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md`
nietknięte). `pin_data.json` bez zmian. `#[ignore]` w diffie: brak. Usunięte asercje: dwie, obie zastąpione
równoważnymi lub mocniejszymi (złoty skrót `9b17cd8895ee7c0b` → `3ca52823eb0e4d81` z uzasadnieniem D-PIN2-1; licznik
zgodnych przeniesiony na `ROZBIEZNE_B_WIRA_PIN_2` + NOWY blok wymagający bliźniaka `_klatka1`). `git diff --check`: czysto.
Trailery `Co-Authored-By` w commitach: brak.

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, DEBUG=0, własny CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (pełny, w tle `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, 0 wyników nie-ok, 4155 passed / 0 failed / 1 ignored (istniejący, spoza diffu) — identycznie jak raport Operatora |
| w tym `p6_k5loop_wiring_a_pin` | `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `zejscie_z_korony_od_razu_przelicza_zasieg`, `pokrycie_scenariuszy` + 2 diagnostyczne: ok |
| w tym `p6_k5loop_wiring_a` (`zlote_wyniki_sesji`), `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`, `bridge_contract` | ok (część pełnego przebiegu) |
| Generator `node p6_k5loop_wiring_a_gen.mjs` (Node 22.23.4, pełna regeneracja) | GEN_EXIT=0, strażnik SHA-256 tekstu pinu przeszedł, `vectors.json` MD5 **`7048c640aa6aeba3e148d0aca4e2f164`**, `pin_data.json` MD5 `432eed76e34a0e8cc96ec548e88eae64`; `git status` po regeneracji CZYSTY (bajt w bajt z commitem) |
| 8 dawnych rekordów `vectors.json` vs baza `2e5bf370a` (porównanie JSON po nazwie) | 8/8 identyczne |
| Bramka renderera | nie dotyczy (temat bez renderera) |

## 3. Zgodność z pinem `07d2fbd72` (czytane `git show`, nie z raportu)

- **D-PIN2-1** (`complete` nie cofa morale): pin `_activateUnit` `:6103-6117` odejmuje okrążenie od `ru.morale` od razu;
  trafienia (`_resolveBlowOutcome` → `_applyMoraleDamage`) działają na bieżącej wartości; w `_activateUnit`/`done()` nie ma
  przywracania morale. Poprawka Rust (zapis morale aktywacji tylko, gdy aktywacja je zmieniła, a zegar nie) jest zgodna z
  pinem we wszystkich przypadkach poza jawnie tagowanym konfliktem. Potwierdzone.
- **D-PIN2-2** (model klatki): pin `:2552` `BATTLE_FRAME_WALL_MS = 16`, `:9419` `FF_STEP_MS = _scaledWallDelta(...)`,
  `:9424-9433` kolejność `_drainTimers` → pociski → zaniki → kolejka `_raf`; `:9616-9634` `_drainTimers` odpala wszystko
  z `due <= vNow`. Odrzucenie drogi (a) „oracle @2 ms” jest uzasadnione — @2 ms nie jest modelem produkcyjnym pinu.
  Generator nadpisuje wyłącznie statyczną `BattleScene.BATTLE_FRAME_WALL_MS` po `skip()` (czytana dopiero w
  `_runFastForward`), moduł pinu ładowany od nowa per scenariusz (`modCache = new Map()` `:231`), więc nadpisanie nie
  przecieka do kolejnych scenariuszy (sprawdzone: b03/b07 po `_klatka1` mają `frameMs` 16 i przechodzą @16).
  Test `vectors()` pilnuje, że `frameMs` ma tylko bliźniak `_klatka1` w trybie `skip`; test bajt-w-bajt wymaga bliźniaka
  z tym samym `input`/`seed` i `frameMs == 1`. Wyjątek jest zmierzony i pilnowany testem — kryterium dispatchu spełnione.
- **B07**: pin `:7739-7740` `u.onWallWalkway = false; this._applyTerrainRange(u)` — test niezmiennika sprawdza dokładnie to
  (zakres po zejściu = `apply_terrain_range` bez korony na nowym kaflu) i wymaga >= 1 zejścia (są: d2, d4).
- **B06**: pin `:7924-7931` — jedyny odczyt `d.range` obrońcy przez stronę przeciwną (grep `\.range\b` w pinie: pozostałe
  odczyty dotyczą `ru` w jego własnej aktywacji, po `:6064`). Obrońcy z `restUnits` (`:4735-4741`, `placeOne` bez
  `_applyTerrainRange`) startują z `range = rangeBase` — Rust identycznie (`siege_battle_adapter_unit.rs:669-682`).
  Okno rozróżniające B06 istnieje więc tylko: (i) przed pierwszą aktywacją takiego obrońcy z deltą ≠ 0, (ii) po jego ruchu
  na kafel z inną deltą, w obu przypadkach przy związanym atakującym blisko granicy zasięgu. Argument Operatora (praktyczna
  nieobserwowalność w AUTO) jest wiarygodny, ale B06 NIE jest mutantem formalnie równoważnym (patrz Z1).

## 4. Mutanty (odtworzone przeze mnie, `cargo test --release --no-fail-fast` na `p6_k5loop_wiring_a_pin` + `p6_k5loop_wiring_a`; źródło przywrócone, `git status` czysty)

| Mutant | Wynik | Czym zabity (faktyczna treść błędu testu) |
|---|---|---|
| B03 trafienie strzału +`RANGED_GAP_MS` | ZABITY | `wektory_pinu_pelnej_bitwy_bajt_w_bajt`: dokładnie 3 nowe wektory `b03_las_lucznicy_mury_baszta` (tura 53≠54, rzuty 96≠100), `b03_wzgorza_palisada_katapulta` (rzuty 38≠36), `b03_gory_lucznicy_mury_baszta` (rzuty 114≠111); dawne wektory go nie zabijają |
| B06 `_siegeShooterThreats` bez `_applyTerrainRange` | **PRZEŻYŁ** | — (Z1) |
| B07 zejście z korony bez `_applyTerrainRange` | ZABITY | `zejscie_z_korony_od_razu_przelicza_zasieg` |
| P01 `complete`: morale bezwarunkowo ze `start` | ZABITY | `mur_jazda_rzeka_klatka1` (zwycięzca atakujący≠obrońca, tura 89≠400) + `zlote_wyniki_sesji` |
| P02 morale aktywacji nigdy | ZABITY | `palisada_liczni_taran` (okrążenie w dawnym wektorze) |
| E1 (mój) `morale_before = au.morale` w `start` | ZABITY | `wektory_pinu_pelnej_bitwy_bajt_w_bajt` |
| E2 (mój) zapis morale aktywacji bez warunku na zegar | **PRZEŻYŁ** | — (Z2) |
| E3 (mój) konflikt rozstrzygany na korzyść aktywacji | **PRZEŻYŁ** | — (Z2; ten sam przypadek co E2) |
| E4 (mój) `morale_before = NaN` w gałęzi ucieczki (`:4078`) | PRZEŻYŁ — równoważny | gałąź `pend.flee` w `complete` kończy się `return` przed logiką D-PIN2-1, pole nieczytane (N1) |

## 5. Zarzuty

- **Z1 (średni, kryterium dispatchu częściowo niespełnione): B06 niezabity.** Dispatch: „>= 3 nowe scenariusze zabijające
  B03/B06/B07 (mutanty przerobione i zabite testem)”. B03 i B07 zabite, B06 przeżywa. Nie jest to mutant równoważny
  (§3: okna (i)/(ii) istnieją w pinie), więc „0/273 kandydatów” jest dowodem słabości generatora kandydatów, nie
  równoważności. Analogicznie do B07 możliwy jest test niezmiennika bez wektora: test jednostkowy `#[cfg(test)]` w
  `siege_tactics_loop.rs` (allowlista) z obrońcą-strzelcem o nieaktualnym `activate.range` (np. jazda łucznicza z
  `restUnits` na kaflu z deltą ≠ 0 przed pierwszą aktywacją) i związanym atakującym na granicy zasięgu — `siege_move_refused_now`
  musi dać wynik pinu. Wymagane: taki test albo jawna akceptacja długu przez FC/orkiestratora z wpisem w rejestrze.
- **Z2 (niski, dług jawny): gałąź `morale-konflikt-zegara` bez pokrycia.** E2/E3 przeżywają, bo w 14 wektorach konflikt
  (okrążenie w `start` + trafienie zegara w oknie start..complete) nie występuje. Tag jest jawny i każde wystąpienie w
  wektorze daje FAIL (`diff` raportuje `unported`), więc nie ma cichej rozbieżności. Uwaga merytoryczna: wartość pinu w tym
  przypadku jest wyznaczalna (`max(0, m − MORALE_SURROUND_HIT)` przed trafieniem, potem trafienie na bieżącej wartości),
  więc tag nie jest koniecznością, tylko odroczeniem — do rejestru jako NIE_ZMIERZONO.
- **N1 (kosmetyczny):** `morale_before: seq.morale` w gałęzi ucieczki (`siege_tactics_loop.rs:4078`) jest martwe (E4).
- **N2 (rejestr, nie blokuje):** pomiar §4.3 Operatora ujawnia, że produkcyjny model Rust różni się od produkcyjnego pinu
  (@16) w 23/128 losowych bitwach c1 (12 tylko kwantyzacja klatki → FRAME-QUANT; 11 realne różnice logiki → B-WIRA-PIN-3,
  przyczyny NIE_ZMIERZONO). To duży dług parytetu — orkiestrator powinien założyć oba tematy i wpisać D-PIN2-1/2/3 do
  `REJESTR-RUST.md` (wpis nie jest w allowliście tego tematu). Kandydaci c1–c3 odtwarzalni ze skryptów w katalogu runu;
  raport §4.3 nazywa generator „`mk.py`”, a w repo są `01-operator-r1-kandydaci-c1..c3.py` (rozjazd nazwy w raporcie).
- **N3 (proces):** scratchpad jest współdzielony z innym Workflow (WIRING-B): mój log mutantów został w trakcie nadpisany
  cudzym wpisem; P01/P02/B03 powtórzyłem z unikalną nazwą logu. Zalecenie dla orkiestratora: unikalne nazwy plików/targetów
  per temat.

## 6. Werdykt

**PASS-WITH-NOTES.** Sonda zmierzona i przyczyna t. 86 (cofanie morale w `complete`) poprawnie zdiagnozowana i naprawiona
wg pinu; `mur_jazda_rzeka` jako jawny, zmierzony wyjątek klatki z testem bliźniaka; 7 (+1) dawnych scenariuszy bajt w bajt;
MD5 odtworzone niezależnie; wszystkie bramki EXIT 0; B03/B07/P01/P02 zabite. Do decyzji FC: Z1 (B06 bez zabójcy —
wymagany test niezmiennika albo jawna akceptacja długu) i Z2.
