# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Final Control r2

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A), runda 2
GOAL r2: generator TS wykonujący tekst pinu 07d2fbd72 (guard SHA, MD5) + wektory PEŁNEJ bitwy AUTO z murem (>= 6
         scenariuszy) + test Rust bajt w bajt
BAZA: DODATEK r2 = 43ecdb162 (rust-port-wip/k5loop-wiring-a-q1-fc); parity-v2 teraz a22257a91 — PRZODEK ocenianego
      kodu (merge f120c49ab), więc integracja = FF bez konfliktów
OCENIANY KOD: rust-port-wip/k5loop-wiring-a-q1-r2-obrona @ f120c49ab (Operator r2 0afaf4e4f, Evaluator r2 f681087ee,
              obrona r2 490498746/5a38f3d35/2ecda0ca5/a93f981a7/bde79839b/ce98555fa/ce9afe0d3, merge parity-v2 f120c49ab)
ZMIANY/COMMIT: tylko ten raport (gałąź rust-port-wip/k5loop-wiring-a-q1-r2-fc, nad f120c49ab)
TESTY: §1 — fmt EXIT 0; clippy -D warnings EXIT 0; cargo test --all-targets --no-fail-fast FULL_EXIT=0
       (547 x ok, 4153 passed / 0 failed / 1 ignored — istniejący, spoza diffu); generator odtworzony: MD5 zgodne;
       wektory pinu 7/8 bajt w bajt + 1 jawna rozbieżność; mutanty FC 6/6 zabitych
BLOKADY: B-WIRA-PIN-2 (mur_jazda_rzeka) — jawna, z pomiarem; NIE blokuje kryterium końca (7 zgodnych >= 6)
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (FF parity-v2 do f120c49ab + ten raport), potem decyzja techniczna
               orkiestratora o B-WIRA-PIN-2 (§3) i dispatch części B
DEPLOY/PUSH: NIE WYKONANO (push tylko gałęzi wip raportu FC)
```

## 1. Bramki odtworzone samodzielnie (worktree FC, kod f120c49ab)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`wiringa-fc/target`), usunięty po bramkach (dysk po: 13 GB wolne). Uwaga: raport obrony r2 ma §8 „BRAMKI” i §9
„COMMITY” jako niewypełnione zaślepki — bramki poniżej są wyłącznie pomiarem FC.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **FULL_EXIT=0**: 547 × `test result: ok`, 0 × FAILED; 4153 passed / 0 failed / 1 ignored. W tym `p6_k5loop_wiring_a_pin` 3/3, `p6_k5loop_wiring_a`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_k5loop_close_r2..r4`, `p6_battle_setup*`, `bridge_contract` — zielone |
| Generator `node tests/p6_k5loop_wiring_a_gen.mjs` (odtworzony przez FC) | EXIT 0; strażnik SHA-256 tekstu pinu przeszedł; `vectors.json` MD5 `269b4da23249b441e1837a2b160cb258`, `pin_data.json` MD5 `432eed76e34a0e8cc96ec548e88eae64` — identyczne z zatwierdzonymi; drzewo po regeneracji czyste |
| Mutanty FC (skrypt obrony, `ONLY=W07,W14,W15,B02,B04,B05`, `cargo test --release --test p6_k5loop_wiring_a_pin`) | baza EXIT 0; **6/6 ZABITYCH** testem (nie kompilacją): routed w `finish`, siatka Δ zasięgu (D-WIRA-16), czas ciosu/strzału (D-WIRA-17), ogon ciosu, pozycja wieży w trakcie marszu w obu kierunkach (D-WIRA-18). Źródła przywrócone (`git status` czysty) |

Allowlista (samodzielnie, `git diff --name-only origin/rust-port/parity-v2 f120c49ab`): wyłącznie
`engine/src/domain/{siege_battle_session,siege_tactics_loop,mod}.rs` (`mod.rs`: tylko `pub mod siege_battle_session;`),
`engine/tests/p6_k5loop_wiring_a{,_pin}.rs`, `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin_vectors/*` i raporty
runu. Żaden istniejący test spoza tematu nie jest zmieniony (asercje nieosłabione). Brak `bridge.rs`, `bridge_contract.rs`,
`renderer/`, `view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md`. Brak `#[ignore]`. Brak
trailerów `Co-Authored-By` w commitach tematu. Generator: jedyna podmiana tekstu pinu = rzut `_singleBlow`
`battleScene.ts:8960` ze strażnikiem linii; atrapy tylko render/DOM/audio/`performance.now` (deterministyczny).

## 2. Orzeczenia (zarzuty Evaluatora r2 i uwagi)

| Zarzut | Orzeczenie | Uzasadnienie (dowód FC) |
|---|---|---|
| E2-1 (diagnoza B-WIRA-PIN-1 sfalsyfikowana) | **ODDAL** (zamknięty) | Obrona przyjęła pomiar, wycofała „FRAME-QUANT” jako przyczynę 5 rozbieżności i znalazła przyczyny logiczne. Skutek zmierzony: 4 z 5 dawnych rozbieżności zgodne bajt w bajt w teście FC. |
| E2-1a (krok łucznika `a3`, las, tura 12) | **ODDAL** (naprawione) | `_applyTerrainRange` (`battleScene.ts:6064`, `:7490-7502`) wpięty w ciało (D-WIRA-16). `mur_wieza_obl_las` zgodny bajt w bajt; mutant W14 (bez siatki Δ) ZABITY w pomiarze FC. |
| E2-1b (aktywacja atomowa, palisada) | **ODDAL** (naprawione) | D-WIRA-18 (`unit_cell_at` z osi kroków `_doMove`, `_fireOneTower` `:4228-4233`) i D-WIRA-17 (ogon `done()` po ciosie/strzale, `:9119-9172`, `:9223-9229`). `palisada_liczni_taran` zgodny bajt w bajt; B02/B04/B05/W15 ZABITE w pomiarze FC. Domyślne wartości flag (`None`/`false`) zachowują stare wektory pętli — potwierdzone zielonym pełnym testem. |
| E2-2 (kryterium końca 3/8, mutanty 3/14) | **ODDAL** | 7/8 bajt w bajt (≥ 6). Pokrycie po stronie Rust (zgodne scenariusze): z/bez machin, liczności atakujących 2/3/4/6/9, wyłom, ucieczka (routed), zejście z pola (removed), sufit 150 (remis), zwycięstwo atakującego i obrońcy, czas rzeczywisty i przewijanie, palisada vs mury vs mury+fort+baszta. Mutanty: 16/23 wg obrony, 6/6 potwierdzone przez FC (≥ 10 wymagane — spełnione). „Bez muru” niewykonalne w tej ścieżce: pin `main.ts:36814` (`if (!city.maMur)` → zwykła potyczka, nie szturm), więc brak scenariusza bez muru jest zgodny z webem. |
| E2-3 (lista blokady akceptuje błąd sesji) | **ODDAL** (naprawione) | `p6_k5loop_wiring_a_pin.rs`: `Err(e)` → `fails.push` dla każdego scenariusza; scenariusz z listy musi dać `Ok` z różnicą danych; test pada, gdy zacznie się zgadzać. Zweryfikowane czytaniem kodu. |
| N1 (ślad nadpisuje wektory) | **ODDAL** (naprawione) | `process.exit(0)` przed zapisem w trybie `WIRING_A_TRACE`. |
| N2 (zegar ścienny w orakulu) | **ODDAL** (naprawione) | Deterministyczny `performance.now`; regeneracja FC daje identyczne MD5. |
| N3 (`zlote_wyniki_sesji` ≠ parytet) | **ODDAL** | Parytet dowodzi teraz test wektorów pinu; złote FNV pozostają tylko testem regresji (zmienione w ce9afe0d3 w teście tego samego tematu, nie w teście istniejącym). |
| Raport obrony: §8/§9 niewypełnione | **ODDAL** (uwaga procesowa) | Defekt dokumentu, nie kodu; bramki i SHA uzupełnia ten raport (§1). |
| B-WIRA-PIN-2 (`mur_jazda_rzeka`) | **ODDAL jako zarzut tej rundy; rozstrzygnięcie dalszej drogi → decyzja techniczna orkiestratora** (§3) | Rozbieżność jawna, test ją pilnuje, przyczyna pierwszego rozjazdu (t. 70) zmierzona na samym pinie (wynik pinu zależy od klatki 16 ms vs 2 ms: remis czasowy 150 vs 156 ms, kolejność `_drainTimers` przed kolejką `_raf`, `battleScene.ts:9616-9634`). DODATEK r2 pkt (3) dopuszcza blokadę z liniami pinu, a kryterium ≥ 6 jest spełnione bez tego scenariusza. |

Brak orzeczeń NAPRAW.

## 3. B-WIRA-PIN-2 — co zostaje (dla orkiestratora)

- Pierwszy rozjazd z wektorem (pin @16 ms, t. 70) ma zmierzoną przyczynę w modelu klatki (nie w logice Rust): pin sam
  daje różne wyniki bajtowe przy klatce 16 ms (obrońca, t. 400, 46 rzutów) i 2 ms (48 rzutów). Parytet z wektorem @16 ms
  wymaga kwantyzacji czasu ciała do klatki (temat „FRAME-QUANT”) albo zmiany oracle'a na pin @2 ms dla tego scenariusza.
- Drugi rozjazd (Rust vs pin @2 ms, t. 86: `ROUT a0` po ciosie 17 `d1 → a0` w pinie, brak rozbicia w Rust) jest
  **NIE_ZMIERZONO** — może to być kolejny remis czasowy, ale może też być realna różnica w morale/`_resolveBlowOutcome`.
  To musi wejść do zakresu tematu następczego jako pierwszy krok (sonda stanu morale `a0` w t. 86, pin @2 ms vs Rust),
  zanim ktokolwiek uzna, że jedyną przyczyną jest klatka.
- Zakres: gałąź FF_MAX_ROUNDS = 400 z wyłomem jest pokryta bajt w bajt tylko przez ten scenariusz; w pozostałych
  zgodnych jest sufit 150. Sufit 400 ma wektory na poziomie pętli (K5D), więc to nie luka portu, tylko luka dowodu
  end-to-end sesji.

## 4. Długi (do rejestru przez orkiestratora)

| ID | Stan |
|---|---|
| B-WIRA-PIN-2 + rozbicie t. 86 @2 ms | jawne (§3); temat następczy FRAME-QUANT / sonda morale |
| Mutanty bez wektora rozróżniającego: B03 (trafienie strzału przesunięte o `RANGED_GAP_MS`), B06 (`_siegeShooterThreats` bez Δ), B07 (zejście z korony bez Δ) | gałęzie zgodne z pinem w kodzie, brak scenariusza, który je odróżnia; dopisać scenariusz (łucznik strzelający w oknie lotu pocisku wieży; obrońca-strzelec na kaflu z Δ ≠ 0) w temacie następczym |
| W02/W04/W08 (równoważne na wektorach) | gałęzie zabijane testami r1 `p6_k5loop_wiring_a` (W02, W04); W08 równoważny na danych |
| Dwa modele czasu w `SiegeLoop`/`ProdBody` (flagi `pin_blow_timing`, `terrain_range_delta`, oś kroków; domyślnie dawny model) | jedyny produkcyjny wołający (sesja) włącza model pinu; stary model żyje dla wektorów pętli generowanych ze stubami czasu — kandydat na sprzątanie po przeniesieniu tych wektorów na model pinu |
| `_applyTerrainRange` w autobatch (`:5919`), tryb ręczny, część B (most, zastosowanie wyniku, #354) | bez zmian (poza zakresem A) |

## 5. Uwaga dla integracji

`origin/rust-port/parity-v2` (a22257a91) jest przodkiem f120c49ab — integracja to FF. Merge f120c49ab wnosi do tej
gałęzi wyłącznie cudze, już zintegrowane tematy P4-1I5A/B; diff względem parity-v2 to tylko pliki tego tematu (§1).

---

# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Final Control r1 (archiwum, bez zmian)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5, bez mostu
BAZA: dispatch 32006733b (parity-v2 w chwili startu); parity-v2 teraz 24c8f3b75 (I5A, tylko view-model/renderer),
      merge-tree z kodem obrony czysty
OCENIANY KOD: obrona-wiring-a = d1cc6266b (Operator r1 9cb5c8b31 + Evaluator 003e02a2a + obrona 932cdfe0a/4b7814549/d1cc6266b)
ZMIANY/COMMIT: tylko ten raport (gałąź lokalna fc-wiring-a na d1cc6266b)
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT=0
       (543 x ok, 4134 passed / 0 failed / 1 ignored — istniejący, spoza diffu); p6_k5loop_wiring_a 22/22;
       wektory generatora pinu: BRAK (generator nie istnieje)
BLOKADY: Z1 (główne kryterium końca dispatchu niespełnione)
RUNDY: 1/5
NASTĘPNY KROK: runda r2 Operatora z tym samym ID: generator pinu pełnej bitwy (≥ 6 scenariuszy, guard SHA, MD5)
               na kodzie d1cc6266b; albo DODATEK orkiestratora w 00-dispatch.md wydzielający B1 i formalnie
               zmieniający kryterium końca części A
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Bramki odtworzone samodzielnie (worktree FC, kod d1cc6266b)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`wiringa-fc/target`), usunięty po bramkach (dysk po: 11 GB wolne).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | `EXIT=0`; 543 × `test result: ok`; 4134 passed / 0 failed / 1 ignored |
| `p6_k5loop_wiring_a` | 22 passed |
| wektory generatora pinu (MD5) | **BRAK** — `engine/tests/p6_k5loop_wiring_a_gen.mjs` i katalog wektorów nie istnieją |
| `git diff --check 32006733b..d1cc6266b` | czysto |
| `#[ignore]` w diffie kodu | brak (trafienia tylko w tekstach raportów) |
| `Co-Authored-By` w commitach tematu | 0 |
| `git merge-tree` z bieżącym `origin/rust-port/parity-v2` (24c8f3b75) | czysty |

Allowlista (`git diff --stat 32006733b..d1cc6266b`): `domain/mod.rs` (+1, `pub mod`), `domain/siege_battle_session.rs`
(nowy), `domain/siege_tactics_loop.rs` (+282/−18: `BlowComposer::compose_tower`/`terrain_defence_mult`, `TowerBlowSite`,
`tower_shooter_cu`, gałąź kompozytora w `tower_blow_full`, `current_tdm`, publiczny krok czasu rzeczywistego),
`tests/p6_k5loop_wiring_a.rs` (nowy), pliki runu. Nic poza allowlistą (`bridge.rs`, `bridge_contract.rs`, `renderer/`,
`view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md` nietknięte). Testy istniejące przed tematem
bez zmian asercji.

## 2. Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| Z1 — brak wektorów pinu pełnej bitwy (≥ 6 scenariuszy, generator TS z guardem SHA, MD5) | **NAPRAW** | Pierwsze, twarde kryterium końca dispatchu. Operator i Obrona przyznają brak. `zlote_wyniki_sesji` to skrót FNV wyników Rusta — zamrożenie regresji, nie dowód parytetu; Z2 pokazał, że taki skrót utrwalił już raz wynik rozbieżny z pinem (`dcd224435100671a` → `619d9ea6ba687f71`, `mur_machiny` t19 → t38, `mur_taran_katapulta` t43 → t50). Dispatch nie ma DODATKU zmieniającego kryterium; wydzielenie B1 to decyzja techniczna orkiestratora (CLAUDE.md, zasada 9/8), nie właściciela — nie jest to „DO DECYZJI CZŁOWIEKA” w sensie pytania ABC. Do czasu wektorów nie wiadomo, czy wyniki „remis po 150 turach” w 3 z 6 scenariuszy są wynikami pinu. |
| Z2 — trafienie wieży na neutralnym szablonie (Obrona 0 / Pancerz 0 / maxHp 10) | **ODDAL** (zamknięty poprawką obrony) | Sprawdzone w kodzie: `ProdBody::tower_blow_full` przy kompozytorze bierze `BlowComposer::compose_tower` (`siege_battle_session.rs:529-610`): realny `defender` i `max_hp` celu, `def_on_wall` i `civ_wall_defense_multiplier` na koronie, `blow_env_for` (teren kafla celu, obrona miasta), `mods_for_parts` strzelca z bonusami strony obrońcy, trudności obu stron, kontra z `sh.counters`; łuk `relative_hit(facing celu, wallCol, row, q, r)` jak pin `:8880`. Brak strzelca w kompozytorze → jawny tag `wieza-bez-kompozytora`, nie cichy szablon. Mutanty O03–O11 zabite. Zgodność liczbowa z pinem nadal niezmierzona — to część Z1, nie osobny zarzut. |
| Z3 — przeżywające mutanty E2/E3, M16/M23 „równoważne na danych” | **ODDAL** (zamknięty) | Testy `wieza_zabicie_ripple_i_padl`, `wieza_trafienie_uciekajacego_tag_rout`, `kompozytor_mur_cywilizacji_obroncy`, `kompozytor_las_cywilizacji_obroncy` obecne i zielone w pełnym przebiegu FC; skrypt obrony raportuje 17/17 zabitych. |
| Z4a — `terrain_defence_mult` z kafla startowego | **ODDAL** (zamknięty) | `current_tdm` z bieżącego kafla (`_checkRout :9790-9792`) w `check_rout` i przed `_activateUnit`; testy `checkrout_z_biezacego_kafla`, `checkrout_okrazenie_z_biezacego_kafla` zielone. |
| Z4b — `attack_pre` E8/E22/E30 NIE_ZMIERZONO | **ODDAL** | Zmierzone sondą obrony (78 bitew: 43 × `dur = 0`, `attack_pre > 0` = 0); tekst sondy w `02a-obrona-sonda.rs.txt`. Przypadek `> 0` zostaje w długach z odwołaniem do `:8223`/`:8277`. |
| Z4c — walidacja `wall_delta_ms` po `play()` | **ODDAL** (zamknięty) | Walidacja przed `play()`; test `step_niepoprawny_czas_nie_startuje_bitwy` zielony. |
| Z4d — `speedMul`/clamp bez decyzji | **ODDAL** | D-WIRA-12: `speedMul = 1` (UI-only w pinie `:9517-9526`, domyślnie 1 `:2555`), clamp nieaktywny przy klatkach 16 ms. |

Jeden NAPRAW (Z1) → **FAIL**.

## 3. Wymagane w r2 (ten sam ID; baza = d1cc6266b, kod obrony zachować)

1. Generator `engine/tests/p6_k5loop_wiring_a_gen.mjs` wykonujący tekst pinu `07d2fbd72` (guard SHA) od konstruktora
   `BattleScene` (teren, `_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`) przez `_startBattle`, tury, zegary,
   `_fireSiegeTowers`, `_singleBlow`/`_resolveBlowOutcome` do wyniku, z deterministycznym `Math.random` zgodnym z
   `SessionRolls`; ≥ 6 scenariuszy (z/bez muru, z/bez machin, różne liczności, wyłom, ucieczka, sufit tur);
   wektory w repo + MD5 odtwarzalne; test Rust porównujący wynik sesji bajt w bajt (zwycięzca, HP ocalałych, liczniki
   akcji). Rozbieżności naprawić w sesji/pętli albo zapisać jako blokadę z liniami pinu.
2. Po wektorach zastąpić lub uzasadnić `zlote_wyniki_sesji` (skrót Rusta) — nie może być jedynym dowodem wyniku.
3. Alternatywa (decyzja orkiestratora, nie Operatora): DODATEK w `00-dispatch.md` wydzielający B1 jako
   `R-RUSTPORT-P6-K5LOOP-WIRING-A-PIN-Q1` i formalnie zmieniający kryterium końca części A; wtedy kolejny FC ocenia
   część A wg nowego kryterium.

## 4. Długi (bez zmian względem §6 obrony)

| ID | Stan |
|---|---|
| Z1 / B1 — wektory pinu pełnej bitwy | OTWARTE (powód FAIL) |
| `attack_pre > 0` (E8/E22/E30) | zmierzone jako nieosiągalne w 78 bitwach; osiągalność w pinie `:8223`/`:8277` niezmierzona |
| bonus „leśny” na `Plaskie (rownina/laka)` (podciąg „las”, `terrain_is_forest_or_jungle`) | zachowanie istniejącego portu `bonusApplies`, poza zakresem; do sprawdzenia z pinem przy wektorach (może zmieniać wyniki) |
| pozostałe z `01-operator-r1.md` §7 | bez zmian |

## 5. Uwaga dla integracji (gdy r2 przejdzie)

`origin/rust-port/parity-v2` przesunął się na `24c8f3b75` (I5A, `view-model`/`renderer`); `git merge-tree` z
`d1cc6266b` czysty — r2 może zostać na bazie d1cc6266b.
