# R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 (B-WIRA-PIN-2: sonda morale t. 86 + scenariusze dla mutantów B03/B06/B07)
GOAL: ROZBIEZNE_B_WIRA_PIN_1/2 puste albo jawnie uzasadnione; sonda zmierzona; >= 3 scenariusze zabijające B03/B06/B07;
      7 dawnych scenariuszy bajt w bajt; MD5 generatora odtwarzalne
BAZA: 2e5bf370a434eb81eeaf0e82d104faaf5f40b57d (= origin/rust-port/parity-v2 w chwili FC; linia BAZA dispatchu)
OCENIANY KOD: 5d7609050 (gałąź obrona/k5loop-pin2-probe-q1; Operator r1 978a63ea1 + obrona edb28096d, bf6571cae)
              `git merge-base --is-ancestor 2e5bf370a 5d7609050` = TAK (liniowo nad bazą, 7 commitów)
ZMIANY/COMMIT: tylko ten raport (gałąź fc/k5loop-pin2-probe-q1, worktree wf_40925a79-57f-4); kod nietknięty
TESTY: §2 (odtworzone samodzielnie)
BLOKADY: brak blokujących; długi §5 do rejestru (wpis orkiestratora)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF parity-v2 do 5d7609050 + ten raport), wpisy D-PIN2-1/2/3 i długów w REJESTR-RUST.md
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Allowlista i zakres (sprawdzone samodzielnie)

`git diff --stat 2e5bf370a 5d7609050` — 11 plików, wszystkie w allowliście:
`engine/src/domain/siege_tactics_loop.rs` (+25/-2 — D-PIN2-1 + komentarz N1), `engine/tests/p6_k5loop_wiring_a.rs`
(tylko złoty skrót z uzasadnieniem), `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`,
`p6_k5loop_wiring_a_pin_vectors/vectors.json`, katalog runu (01-operator-r1.md, 02a-obrona.md, 4 skrypty .py).
Poza allowlistą: brak (`siege_battle_session.rs`, `bridge.rs`, `renderer/`, `gra/**`, `Cargo.*`, rejestr — nietknięte).
`#[ignore]` w diffie: brak. Trailery `Co-Authored-By` w commitach 2e5bf370a..5d7609050: brak.
Uwaga formalna: `02-evaluator.md` leży na gałęzi `eval/k5loop-pin2-probe-q1` (`a0605a0a0`), nie na gałęzi obrony —
orkiestrator przy integracji dołącza go do katalogu runu (cherry-pick samego pliku).

## 2. Bramki odtworzone przez FC (kod 5d7609050)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`tgt-pin2-fc`, usunięty po bramkach; dysk po sprzątaniu 13 GB wolne).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`) | **FULL_EXIT=0**: 547 × `test result: ok`, 4156 passed / 0 failed / 1 ignored (istniejący) |
| w tym `p6_k5loop_wiring_a_pin` | 6/6 ok: `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `zagrozenia_strzelcow_przeliczaja_zasieg_terenu`, `zejscie_z_korony_od_razu_przelicza_zasieg`, `pokrycie_scenariuszy` + 2 diagnostyczne |
| w tym `p6_k5loop_wiring_a`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_atk_a/_b/_def`, `p6_battle_setup`, `p6_battle_setup_units`, `bridge_contract` | ok (część pełnego przebiegu) |
| Generator `node p6_k5loop_wiring_a_gen.mjs` (pełna regeneracja) | EXIT 0, strażnik SHA-256 pinu przeszedł; `vectors.json` MD5 **`7048c640aa6aeba3e148d0aca4e2f164`**, `pin_data.json` MD5 `432eed76e34a0e8cc96ec548e88eae64`; `git status` po regeneracji czysty (bajt w bajt) |
| Bramka renderera | nie dotyczy |

### Mutanty powtórzone przez FC (źródło przywrócone `git checkout`, `git status` czysty)

| Mutant | Wynik |
|---|---|
| B06: `if false && self.terrain_range_delta.is_some() && siege_approach_restricted(..)` w `siege_move_refused_now` | **ZABITY** — `zagrozenia_strzelcow_przeliczaja_zasieg_terenu`: `mur_bez_machin_sufit: a0 krok na (51, 34): d1 range 3 != 2` |
| P01: `complete` przepisuje morale bezwarunkowo (`if true \|\| (..)`) | **ZABITY** — `mur_jazda_rzeka_klatka1` (zwycięzca atakujący≠obrońca, tura 89≠400, rzuty 55≠48) + `zlote_wyniki_sesji` |

B03, B07, P02, E1–E4 — przyjęte z raportów Operatora/Evaluatora (odtworzone niezależnie przez Evaluatora).

## 3. Zgodność z pinem `07d2fbd72` (czytane `git show`)

- `:6102-6118` okrążenie: `ru.morale = Math.max(0, ru.morale - MORALE_SURROUND_HIT)` od razu w `_activateUnit`; brak
  przywracania morale w `done()` → D-PIN2-1 (complete nie cofa trafień wieży z okna start..complete) zgodne z pinem.
- `:9414-9436` `_runFastForward`: `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS)`, kolejność `_drainTimers` →
  pociski → zaniki → kolejka `_ffQueue` → odrzucenie drogi (a) „oracle @2 ms” uzasadnione; D-PIN2-2 (wyjątek
  kwantyzacji klatki + bliźniak `_klatka1` @1 ms bajt w bajt, temat FRAME-QUANT) jest zmierzony i pilnowany testem.
- `:7924-7931` `_siegeShooterThreats` woła `_applyTerrainRange(d)` przed odczytem `d.range` — test B06 sprawdza dokładnie
  tę mutację stanu i odmowę `_siegeMoveRefused` z zasięgów przeliczonych.

## 4. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 B06 niezabity | Evaluator | **ODDAL** (domknięty w obronie) | test niezmiennika `zagrozenia_strzelcow_przeliczaja_zasieg_terenu` (14 przypadków, obie gałęzie odmowy); mutant B06 zabity — zweryfikowane przez FC. Kryterium „scenariusze zabijające B03/B06/B07” spełnione: B03 wektorami (3), B07 i B06 testami niezmiennika pinu na wektorach (jak przyjęto dla B07). |
| Z2 gałąź `morale-konflikt-zegara` bez pokrycia | Evaluator | **ODDAL** (dług jawny) | fail-closed: tag trafia do `unported`, test wektorów wymaga pustego `unported` → brak cichej rozbieżności; do rejestru jako NIE_ZMIERZONO, temat #369 razem z `ucieczka-konflikt-zegara`. |
| N1 martwe `morale_before` w gałęzi ucieczki | Evaluator | **ODDAL** | pole wymagane przez strukturę, komentarz dopisany; E4 równoważny. |
| N2 23/128 rozjazdów @16 ms (12 klatka, 11 logika); nazwa `mk.py` | Evaluator | **ODDAL** (poza zakresem dispatchu) | rozjazdy nie były znane przed tematem i nie należą do kryteriów końca; jawnie zmierzone i opisane; nazwa skorygowana w 02a. Orkiestrator otwiera FRAME-QUANT i B-WIRA-PIN-3. |
| N3 wspólny scratchpad | Evaluator | **ODDAL** (proces) | w obronie i FC unikalne prefiksy (`pin2-*`, `tgt-pin2-fc`). |
| F1 (FC) `02-evaluator.md` poza gałęzią kodu | FC | **ODDAL** (integracja) | czynność orkiestratora przy scalaniu (§1). |

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak (wszystkie decyzje techniczne; gameplay = pin).

## 5. Długi (do `REJESTR-RUST.md`, wpis orkiestratora)

| ID | Stan |
|---|---|
| D-PIN2-1 / D-PIN2-2 / D-PIN2-3 | decyzje techniczne z `01-operator-r1.md` §3 — do wpisania |
| FRAME-QUANT (B-WIRA-PIN-2) | `mur_jazda_rzeka` @16 ms jawny wyjątek z bliźniakiem @1 ms; temat następczy: kwantyzacja kroków `_raf` do 16 ms; kryterium: `mur_jazda_rzeka` + 12 kandydatów c1 |
| B-WIRA-PIN-3 | **11/128 losowych bitew c1 rozbieżnych także @1 ms** — realne różnice logiki Rust vs pin, przyczyny NIE_ZMIERZONO; priorytet przed uznaniem pętli oblężniczej za produkcyjną (#369). Kandydaci odtwarzalni: `01-operator-r1-kandydaci-c1.py` |
| PIN2-MORALE-KONFLIKT-ZEGARA | NIE_ZMIERZONO, fail-closed, #369 |
| B06 na wektorze pełnej bitwy | test niezmiennika na stanie przestawionym ręcznie; wektor z obrońcą-strzelcem z `restUnits` na kaflu z deltą — NIE_ZMIERZONO |

## 6. Werdykt

**PASS-WITH-NOTES.** Sonda zmierzona (ślad morale a0 pin @1 ms vs Rust), przyczyna t. 86 to realna różnica logiki
(`complete` cofał morale) — naprawiona wg pinu; `mur_jazda_rzeka` jako jawny, zmierzony wyjątek kwantyzacji klatki
z testem pilnującym; 8 dawnych wektorów bajt w bajt + 6 nowych; B03/B06/B07/P01/P02 zabite; wszystkie bramki EXIT 0
odtworzone przez FC; MD5 generatora odtworzone. Zero zarzutów NAPRAW.
