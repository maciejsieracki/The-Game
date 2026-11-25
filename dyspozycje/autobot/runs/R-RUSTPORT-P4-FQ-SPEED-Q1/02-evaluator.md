# R-RUSTPORT-P4-FQ-SPEED-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-FQ-SPEED-Q1 (prędkość bitwy speedMul ≠ 1: zgodność z pinem i klatka renderera z PlaybackOpts)
GOAL: weryfikacja wyniku Operatora r1 (342d5ad86) — bramki, allowlista, pin, pomiary, mutanty
ZMIANY/COMMIT: oceniany kod 342d5ad86 (nad bazą ee1ceda3ebed21f90ec207f9e541e792738f7abc = linia BAZA dispatchu,
               ancestry potwierdzone); Evaluator zapisuje tylko ten raport
TESTY: §2 (wszystkie bramki odtworzone, EXIT 0), §4 pomiary własne, §5 mutanty własne
BLOKADY: brak infrastrukturalnych; zarzuty merytoryczne §6
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (ten sam ID) — poprawki Z1–Z3 z §6; potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista

`git diff --name-status ee1ceda3e 342d5ad86`: 14 plików, wszystkie w allowliście (engine `siege_battle_session.rs`,
`siege_tactics_clock.rs`, `siege_tactics_loop.rs`, `tests/p4_fq_speed.rs` (nowy), `tests/p6_k5loop_wiring_a_gen.mjs`,
`tests/p6_k5loop_wiring_a_pin.rs`, `tests/p6_k5loop_wiring_a_pin_vectors/speed_vectors.json` (nowy); renderer
`src/battle/playback.rs`, `tests/battle_playback.rs`, `tests/battle_playback_move_shot.rs`; client `src/lib.rs`,
`tests/siege_battle_client.rs`; `dyspozycje/.../R-RUSTPORT-P4-FQ-SPEED-Q1/` raport + skrypt mutantów).
Brak plików spoza allowlisty; `gra/`, `src-tauri`, `view-model`, `Cargo.lock`, `bridge.rs` nietknięte.
`vectors.json` MD5 `dae3e46efdffe94061347f93e7fc1038` = baza (`git show ee1ceda3e:` → ten sam MD5), `pin_data.json`
`432eed76…` bez zmian, `speed_vectors.json` `d764f078f08aa5df274e3f74d09df14b` = raport Operatora.
Brak `#[ignore]` w diffie; usunięte asercje = wyłącznie zmiana sygnatury `is_pin_event_time` (te same przypadki z
argumentem `PIN_FRAME_MS`), brak osłabień.

## 2. Bramki (odtworzone; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własne
`CARGO_TARGET_DIR` w scratchpadzie z ID tematu, usunięte po bramkach; `renderer/Cargo.lock` przywrócony)

| Bramka | Wynik |
|---|---|
| renderer (gpu OFF) fmt / clippy `--all-targets -D warnings` / `test --all-targets --no-fail-fast` | EXIT 0 / 0 / 0 — **751 passed, 0 failed** (wolne 12 GB przed bramką, bez równoległego builda renderera) |
| client fmt / clippy / test | EXIT 0 / 0 / 0 — **41 passed** |
| engine fmt / clippy `--all-targets -D warnings` | EXIT 0 / 0 |
| engine pełny `cargo test --release --all-targets --no-fail-fast` (w tle, `setsid nohup`) | **EXIT 0: 556 binarek, 4279 passed / 0 failed / 1 ignored** (istniejący, spoza diffu) |

Uwaga: pełny test engine uruchomiony z `--release` (jak u Operatora; debug dla pinów jest niepraktycznie wolny) —
dispatch podaje komendę bez `--release`.

## 3. Pin `07d2fbd72` (`git show 07d2fbd72:gra/src/battle/battleScene.ts`)

Potwierdzam: `SPEED_STEPS` `:2551`, `_advanceVClock` `:9500-9510`, `_scaledWallDelta` `:9512-9515` (clamp delty
ŚCIENNEJ przed mnożeniem → brak sufitu klatki, 512x = 8192 ms), `_setSpeedIdx` `:9518-9527` (clamp vs
`((idx % n) + n) % n`), `_adjustSpeedIdx` `:9531-9533`, `_cycleSpeed` `:9536`, `FF_STEP_MS` `:9419`, trafienie
strzału `_schedule(RANGED_FLY_MS)` z `_doRangedAttack` `:9223-9227`. `speed_step_index`/`set_speed_idx`/`cycle_speed`/
`adjust_speed_idx` zgodne z tekstem. Generator ustawia prędkość METODĄ PINU `bs._setSpeedIdx(idx)` (sprawdza
`bs.speedMul`/`bs.speedIdx`), strażnik SHA-256 tekstu pinu zachowany — wektory wykonują tekst pinu.

## 4. Pomiary własne (generator na pinie + `kandydaci_z_pliku_na_zadanie`, release)

| Zbiór | Klatka (speedMul) | Zgodne | Rozbieżne |
|---|---|---|---|
| c1 (seed 101..228, jak Operator) | 64 (x4) | **128/128** | — (potwierdza raport) |
| **świeże** c1-kształt, seed 1001..1128 | 16 (x1) | **128/128** | — |
| świeże s1000 | 64 (x4) | **127/128** | `k_gory_mix_d5_mury_1087`: tura 71≠70, rzuty 185≠187, hp a3/a6/d1 |
| świeże s1000 | 256 (x16) | **128/128** | — |
| świeże s1000 | 1024 (x64) | **126/128** | `k_wzg_jazda_d5_palisada_1048`, `k_gory_jazda_d6l_mury_1075` |

Wektory `speed_vectors.json` (351 bitew) i 45 wektorów bazowych — zielone w pełnym teście. Model sprzed D-FQS-1
(mutant S1) na tych samych zbiorach: 120/116/120/117 — poprawa D-FQS-1 potwierdzona.

## 5. Mutanty (własne; podmiana w źródle → build → testy → przywrócenie; `git status` czysty po przebiegu)

Testy „ENGINE" = `p6_k5loop_wiring_a_pin` + `p4_fq_speed` (release); „KAND" = 4 zbiory z §4 (512 bitew).

| ID | Mutant | ENGINE | KAND |
|---|---|---|---|
| S1 (Op.) | BodyDone strzału odkładany do `_raf` | (Op.: ZABITY) | **ZABITY** (−8/−12/−6/−11) |
| S3 (Op.) | `MarchNext::Shot` bez flagi zegara | (Op.: przeżył) | **PRZEŻYŁ** (127/128/126/128) |
| S4 (Op.) | `attack_pre > 0` też jako zegar | (Op.: przeżył) | **PRZEŻYŁ** |
| E1 | `attack_tail` (`attack_pre == 0`) flaga `false` | — | **ZABITY** (=S1) |
| E2 | gałąź `ranged` `at == 0`: flaga `false` | **PRZEŻYŁ** | **PRZEŻYŁ** |
| E3 | gałąź `ranged` `at == 0`: czas skwantyzowany zamiast nominalnego | **PRZEŻYŁ** | — |
| P1 | sonda: `panic!` w gałęzi `ranged` `at == 0` | **PRZEŻYŁ = gałąź nieosiągnięta** w 45+351 wektorach i `p4_fq_speed` | — |
| P2 | sonda: `panic!` w gałęzi `MarchNext::Shot` | ZABITY (6 testów) — gałąź osiągana | — |
| E7 | `MarchNext::Shot`: czas `fly` zamiast nominalnego | **PRZEŻYŁ** | **PRZEŻYŁ** |
| E4 | `start` nie czyści flagi | PRZEŻYŁ (równoważny przy czyszczeniu w `complete`, jak S5) | — |
| E5 | żaden `BodyDone` nie jest odkładany do `_raf` | PRZEŻYŁ (niewrażliwość istniejącego modelu D-PIN3-3 poza strzałem; dług poza diffem) | — |
| E6 | `set_speed_idx` ignoruje `clamp` | ZABITY (`predkosc_sesji_jak_set_speed_idx_pinu`) | — |
| R4 | renderer: gałąź `Shot` sprawdza siatką stałą 16 ms | **PRZEŻYŁ** (renderer `battle_playback*` i klient `siege_battle_client`) | — |
| R5 | renderer: gałąź `Boulder` siatką stałą 16 ms | **PRZEŻYŁ** (renderer i klient) | — |
| R6 | renderer: gałąź `TowerShot` siatką stałą 16 ms | ZABITY (`fq_speed_tower_shot_at_speed_16`) | — |
| R7 | renderer: brak alternatywy nominalnej | ZABITY (13 testów) | — |

## 6. Zarzuty (do poprawy w r2)

**Z1 (renderer, wymaganie 2 dispatchu „złe punkty odrzucone”) — gałęzie `Shot` i `Boulder` bez testu.** Mutanty R4/R5
(sprawdzanie `ShotLandAt`/`BoulderLandAt` stałą 16 ms zamiast `self.opts.frame_ms`) przeżywają WSZYSTKIE testy renderera
i klienta. Operatorski R1 mutował tylko wspólną funkcję `is_pin_event_time`, więc nie wykrył braku pokrycia per gałąź.
Przy x4 siatka 64 ms daje dla 380/700 te same chwile co 16 ms (384/704), więc test musi użyć prędkości ≥ x16 (512 / 768)
albo x8 (`Boulder` 768). Wymagane: testy `Shot` i `Boulder` przy `frame_ms` ≠ 16 (akceptacja siatki tej klatki,
odrzucenie siatki 16 ms i odwrotnie), które zabijają R4 i R5.

**Z2 (silnik, D-FQS-1) — gałąź `ranged` `at == 0` to kod nieosiągalny w całym korpusie.** Sonda P1 (`panic!`) przeżywa
45 wektorów, 351 bitew prędkości i `p4_fq_speed`; E2/E3 przeżywają także 512 świeżych bitew. Gałąź `MarchNext::Shot`
jest osiągana (P2), ale jej oba nowe elementy (flaga — S3, czas nominalny — E7) są nieodróżnialne. Raport Operatora
wymienia S3/S4, ale nie ujawnia, że trzecie miejsce D-FQS-1 nie jest w ogóle wykonywane. Wymagane: albo scenariusz pinu,
który osiąga tę gałąź i ją rozróżnia (wektor/kandydat + test), albo jawne uzasadnienie wg pinu, dlaczego gałąź istnieje
(z dowodem osiągalności lub usunięciem/`unreachable` z decyzją), wpisane do raportu i tabeli mutantów.

**Z3 (pomiar) — teza „FQ-SPEED ZAMKNIĘTE dla x1..x16” nie wytrzymuje świeżych danych.** Na świeżych kandydatach x4:
127/128 (`k_gory_mix_d5_mury_1087`, skład `mix` z kawalerią — prawdopodobnie #402, ale NIE_ZMIERZONO śladem). Wymagane:
ślad pierwszej rozbieżności (pin ↔ Rust) dla `1087`@x4 i klasyfikacja (#402 albo nowy dług z numerem / naprawa),
oraz korekta tabeli §11 („zamknięte na c1 i speed_vectors; świeże s1000 x4 127/128 — …”). Analogicznie wpisać
`1048`, `1075`@x64 (kandydaci s1000) z klasą.

## 7. Uwagi (bez wymogu poprawy w r2, do FC/orkiestratora)

- N1: dispatch żąda „@32 = 128/128”; jest 127/128 (`155`, #402) — sprzeczność dispatchu z wyłączeniem #402 z zakresu;
  rozstrzyga orkiestrator.
- N2: klient przekazuje klatkę z `SIEGE_BATTLE_START_SPEED_MUL` (stała 1x), nie z sesji — uczciwie opisane, bo most
  nie ma komendy prędkości; dług „FQ-SPEED-BRIDGE” nie ma numeru zadania (dispatch: „dług z numerem”) — nadać numer.
- N3: E5 — odkładanie `BodyDone` ciosu do `_raf` (D-PIN3-3, poza diffem) jest niewrażliwe na korpus; kandydat na
  osobny temat czułości.
- N4: siatka renderera zakłada `t0` na siatce klatki i stałą deltę ścienną 16 ms (`step(16)`); przy realnych,
  nieregularnych deltach ściennych (clamp do 100 ms) czasy akcji nie leżą na siatce `16 * speedMul` — dług istniejący
  od HITAT (D-HFQ-1), przy prędkości > 1 skala rośnie; warto zapisać w rejestrze.
- N5: zmiana prędkości w trakcie bitwy: silnik 8/8 (`speedAt`), renderer ma jedną `frame_ms` na całe odtwarzanie —
  akcje sprzed zmiany miałyby starą siatkę (opisane jako część FQ-SPEED-BRIDGE; OK).

## 8. Werdykt

Bramki zielone, zakres i allowlista czyste, pin wykonywany tekstowo, poprawa D-FQS-1 realna i odtworzona. **FAIL** z
powodu nowych gałęzi bez testu zabijającego (Z1: renderer `Shot`/`Boulder`; Z2: martwa/nieodróżnialna część D-FQS-1)
oraz zbyt mocnej tezy o zamknięciu x1..x16 wobec świeżej rozbieżności x4 (Z3). Poprawki są małe i lokalne (testy +
ślad + korekta raportu).

## Długi

FQ-SPEED-BRIDGE (bez numeru — nadać), #402 (155@x2, 156@x32, 111@x256/x512, c1 144/147@x64, świeże 1048/1075@x64,
1087@x4 do potwierdzenia), N3 (czułość odkładania `BodyDone` ciosu), N4 (siatka przy nieregularnej delcie ściennej).

Artefakty Evaluatora (scratchpad, nietrwałe): kandydaci `cand-s1000.json` = `01-operator-r1-kandydaci-c1.py` z
argumentem seed `1000` (PIN2-PROBE-Q1), sweep `WIRING_A_SWEEP_FRAME=16/64/256/1024`; skrypty mutantów `mut-ev.py`,
`mutcand.py`.
