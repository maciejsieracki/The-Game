# R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 część B)
GOAL: sesja bitwy oblężniczej (start/step/skip/finish) z mostu, wynik zastosowany do PlayableState jak
      finishSiegeStormBattle bez gałęzi zdobycia (hak T8), długi D-ADP-11 i D-ADP-L-BARB
ZMIANY/COMMIT: ocena kodu Obrony aaf40e772 (Operator 4fb0fe07c + Obrona f5ec7c725, 29396c7d4, aaf40e772) nad bazą
               parity-v2 2e5bf370a (merge-base potwierdzony); FC dodaje wyłącznie ten raport (gałąź fc/k5loop-wiring-b-q1)
TESTY: §2: fmt/clippy EXIT 0; pełny cargo test --all-targets (548 binarek w partiach) 4172 passed / 0 failed / 1 ignored
       po uzupełnieniu checkoutu o dyspozycje/; generator pinu bajt w bajt; klient engine_bridge_renderer 18/18 (U3 zamknięte)
BLOKADY: brak
RUNDY: 1/5 (FC po Operator r1 → Evaluator r1 FAIL → Obrona r1)
NASTĘPNY KROK: integracja orkiestratora (FF parity-v2 po aaf40e772 + raport FC), wpisy do REJESTR-RUST.md (§5)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista (zweryfikowane samodzielnie)

* BAZA dispatchu: `origin/rust-port/parity-v2` = `2e5bf370a` (rev-parse w chwili FC). `merge-base --is-ancestor 2e5bf370a
  aaf40e772` = tak. Ocena na checkout `aaf40e772` (worktree FC, sparse: `rust-port`, `src-tauri`, `dyspozycje`).
* `git diff --name-only 2e5bf370a aaf40e772`: `engine/src/bridge.rs`, `domain/{mod,playable,siege_battle_apply,
  siege_battle_session}.rs`, `tests/bridge_contract.rs`, `tests/p6_k5loop_wiring_b{,_pin}.rs`, `_gen.mjs`,
  `_vectors/vectors.json`, pliki runu. Wszystko w allowliście; `renderer/`, `client/`, `src-tauri/`, `view-model/`, `gra/`
  nietknięte. `PlayableState` bez nowych pól (bitwa i licznik bitew w `PlayableGame`).
* `git diff --check`: czysto. `#[ignore]` w plikach tematu: 0. `Co-Authored-By` w commitach `2e5bf370a..aaf40e772`: 0.
* Kontrakt: `CONTRACT_VERSION` bez zmian; nowe komendy addytywne; `BridgeResponse.siege_battle` z
  `skip_serializing_if = None` (stare odpowiedzi bajtowo bez zmian, test `odpowiedz_bitwy_json_i_kontrakt_addytywny`).

## 2. Bramki odtworzone przez FC

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`fc_wirb/tgt`, `fc_wirb/tgt_client`), oba usunięte po bramkach (dysk po sprzątaniu: 13 GB wolne).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0, 0 ostrzeżeń |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `--lib --bins --examples --benches` + 14 partii `--test` po 40 plików z kasowaniem binarek) | 547 plików testów + lib; 4166 passed / 6 failed / 1 ignored. Jedyne porażki: `p6_m00_skeleton` (5) i `p6_m16_doc` (1) — „brak …/dyspozycje/…: No such file” (artefakt sparse-checkoutu FC, nie kodu) |
| powtórka po `sparse-checkout add dyspozycje`: `p6_m00_skeleton`, `p6_m16_doc`, `p6_k5loop_wiring_b`, `p6_k5loop_wiring_b_pin`, `bridge_contract` | EXIT 0: 5, 1, **15**, **2**, 10 passed. **Łącznie: 4172 passed, 0 failed, 1 ignored** (= 4166 Evaluatora + 5 nowych testów `wiring_b` + 1 test `siege_battle_exit_tests` w lib) |
| testy dispatchu (`wiring_a`, `wiring_a_pin`, `tags_rest`, `adapter`, `siege_*`, `battle_setup*`) | zielone w pełnym przebiegu |
| generator `node tests/p6_k5loop_wiring_b_gen.mjs` | EXIT 0, `pinSha256 cf81ec14…73505` (strażnik), `vectors.json` MD5 `aaeeffb5a711820b2d2b21c6c4d9bb4b` = zatwierdzony, `git status` czysty. Orakul wykonuje tekst pinu (`git show 07d2fbd72`, transpilacja TS), `Math.random` zablokowane |
| U3: klient `cargo check --tests` + `cargo test --test engine_bridge_renderer` (`#[path] bridge.rs`, renderer bez `gpu`) | EXIT 0, 18 passed |

### Kontrolne mutanty FC (własny skrypt, źródło przywrócone, `git status` czysty)

| ID | Mutacja | Wynik |
|---|---|---|
| O01 | `partition(\|_\| true)` (akcje z przyszłym `t0` oddawane od razu) | ZABITY (`strumien_przyjmuje_konsument_playback`, `czas_rzeczywisty_…`) |
| O03 | klon dzieli `live_key` | ZABITY (`klony_gry_nie_dziela_sesji_z_pamieci_podrecznej`) |
| O04 | szturm bez wojny | ZABITY (`bramki_wejscia_szturmu_wg_pinu`) |
| FC1 | bramka `ruchLeft > 0` na `attack_choice` wyłączona | ZABITY (`bramki_wejscia_szturmu_wg_pinu`) |

Liczba mutantów tematu: Operator 24/24, Evaluator+Obrona 30 (27 zabitych, 3 jawnie równoważne) ≥ 15 — kryterium spełnione.

## 3. Werdykty zarzutów

| Zarzut | Werdykt FC | Uzasadnienie (dowód) |
|---|---|---|
| Z1 strumień vs `playback.rs` | **ODDAL** (naprawione) | `payload` wstrzymuje akcje z `t0 > vNow` (`pending`), Finish oddaje resztę; test odwzorowuje `check_order` konsumenta (0 naruszeń dla 16 ms i kroków nieregularnych); O01 zabity także w przebiegu FC; suma akcji = sesja bezpośrednia |
| Z2 bramki wejścia | **ODDAL** (naprawione) | `prepare_storm_with_eras` odtwarza kolejność `resolveEnemyCityClick` (`map-attack-city.ts:119-170`; sprawdzone w pinie przez FC): `not_enemy`, `siege_panel` (pierwszy obcy w odl. 1, bez filtra cywila/ruchu), `launchSiegeStormFromMap` (`oblegajacyOwnerId !== 0`, `main.ts:36800`), `attack_choice` (odl. 1, `ruchLeft>0`, nie cywil, mur), wojna (`offerCityAttackChoice` `:18156-18158`). Most nie zgłasza już haka T8 dla miasta w pokoju. Uwaga N1 niżej |
| Z3 pamięć podręczna przy klonie | **ODDAL** (naprawione) | ręczny `Clone` z nowym `live_key`; test scenariusza Evaluatora; E14 i O03 zabite (O03 potwierdzony przez FC) |
| Z4 producent wejścia | **ODDAL** | E07/E08/E15/E18 zabite testem `producent_wejscia_sesji_wg_pinu`. E17 przyjmuję jako równoważny w stanach `PlayableState`: `hasCityDefenders` liczy wyłącznie siły właściciela miasta (bez `garnizon` w stanie), a `collectSiegeDefRoster` układa właściciela pierwszego, więc `defRosterRef[0].ownerId == city.ownerId`; test pokazuje, że sam sojusznik daje `NoDefendersCaptureRequested`. Dług D-WIRB-4-GARNIZON jawny |
| Z5 luki wektorów/E2E | **ODDAL** | E02/E03/E05/E06/E11 zabite (2 nowe scenariusze generatora z pinu, `selectedId` w wektorach, E2E drugiej bitwy). E09 równoważny w szturmie: lider wpływa tylko na kolejność w `placeFanOutGroup`, a `stayOnCityCenter` pomija heks bitwy (= heks miasta), więc kolejność ruchów jest identyczna; jedyna różnica (`defLossesThisTurn`) jest poza stanem |
| Z6 brak wyjścia z bitwy | **ODDAL** (naprawione) | D-WIRB-8: `Finish` = wynik / `NotFinished` (bitwa trwa) / `Aborted` (bitwa zamknięta, stan bajt w bajt bez zmian); test `finish_z_bledem_zamyka_bitwe_bez_zmiany_stanu`; decyzja techniczna, bo web tej ścieżki nie ma — nie jest odstępstwem gameplay |
| U1 `AddPlayer`/`SelectUnit` w bitwie | **ODDAL** (naprawione) | bramka `ensure_no_siege_battle`, test + O11/O12 |
| U2 kontrakt `CityCaptureRequested` | **ODDAL** (udokumentowane) | doc wymaga od T8 `isCityCaptureBlockedByDefenders`, `applyCityCaptureToMap` i ponownego `validateActiveSieges` |
| U3 kompilacja klienta | **ODDAL** (zmierzone przez FC) | `engine_bridge_renderer` 18/18, `cargo check --tests` EXIT 0 |
| U4 rejestr | **ODDAL** | tabela „zastosowano / hak T8 / poza zakresem” w `01-operator-r1.md` §5; wpis do `REJESTR-RUST.md` należy do orkiestratora |
| U5 D-ADP-11 / D-ADP-L-BARB | **ODDAL** | zgodne z pinem (`hasAllianceDealBetween`, `areEnemyOwners`), test `sojusz_z_umowy_d_adp_11` |
| U6 zgodność wyniku z pinem | **ODDAL** | wektory pinu (9 scenariuszy) bajt w bajt, generator odtworzony przez FC |
| O02 (Finish gubi `pending`) | **ODDAL** | równoważny w zmierzonych przebiegach (24 bitwy z 0 akcjami w Finish); gałąź obronna, utrata akcji wykluczona testem sum |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## 4. Uwagi (nie blokują)

* **N1** — ścieżka `siege_panel` w pinie nie sprawdza wojny przy kliknięciu; port wymaga `RelationStatus::War` także tam.
  W webie stan „oblężenie bez wojny” jest nieosiągalny, bo wyjście z wojny woła `validateActiveSieges()` (`main.ts:11433`).
  Port jest więc równoważny pod warunkiem, że zawarcie pokoju w Rust też kończy oblężenia (`oblegane`) — do sprawdzenia w
  temacie dyplomacji gracza (#305), nie tutaj.
* **N2** — `siege_battle_apply.rs` ma 1406 linii (`#[allow(clippy::too_many_lines)]` na `prepare_storm_with_eras`); do
  ewentualnego podziału przy T8/I5, bez wpływu na wynik.
* **N3** — FC odtworzył pełny test w sparse-checkoucie; testy dokumentacyjne (`p6_m00_skeleton`, `p6_m16_doc`) wymagają
  `dyspozycje/` w drzewie — wskazówka dla przyszłych worktree `--no-checkout` (zasada 7 CLAUDE.md).

## 5. Długi i decyzje do `REJESTR-RUST.md` (wpisuje orkiestrator)

D-WIRB-1 (powtórka + pamięć podręczna z kluczem per klon), D-WIRB-2 (+U1), D-WIRB-3 (hak T8), D-WIRB-5 (pole
`siegeBattle` obok `result`), D-WIRB-6 v2, D-WIRB-7, D-WIRB-8, D-ADP-11, D-ADP-L-BARB. Długi: D-WIRB-4-GARNIZON,
D-WIRB-4-ERA, D-WIRB-1-PERF (NIE_ZMIERZONO w release), SERDE-U64-KEYS, RNG-LICZNIK, B-WIRA-PIN-2, N1.

## 6. Werdykt

**PASS-WITH-NOTES.** Wszystkie zarzuty Evaluatora oddalone (naprawione z testem albo jawna równoważność z dowodem z pinu),
bramki zielone w pomiarze FC (w tym pełny `cargo test` 4172/0 i bramka klienta U3), kryteria końca dispatchu spełnione.
SHA do integracji: kod `aaf40e772` + commit tego raportu.
