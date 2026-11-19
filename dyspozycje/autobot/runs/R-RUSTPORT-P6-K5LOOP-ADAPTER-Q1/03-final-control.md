# R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 — Final Control (r1d)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6)
GOAL: adapter PlayableState -> rostery, szablony, SetupUnit, wejscia ProdBody/ActivateScene/SiegeEnv rowne pinowi 07d2fbd72
ZMIANY/COMMIT: oceniany fc20f9b49 (galaz obrona/k5loop-adapter-q1-r1d; kod produkcyjny = 9a39bc09f, obrona dodala
               tylko testy/generator/wektory). FC dodaje wylacznie ten raport (commit na galezi fc/k5loop-adapter-q1-r1d).
TESTY: fmt 0; clippy --all-targets -D warnings 0; p6_k5loop_adapter 27/27; 6 testow bramki 7/15/9/7/10/6 EXIT 0;
       generator pinu bajt w bajt (pinSha256 0a95f5bc…731f51, 15 scenariuszy); pelny cargo test --all-targets
       --no-fail-fast EXIT 0 (541 binarek, 4103 ok, 0 failed, 1 ignored poza tematem); mutanty FC 6/8 zabite,
       2 przezyle (F04 rownowazny na danych pinu, F08 luka czulosci — uwagi, nie blokuja);
       proba merge z aktualnym parity-v2 48035d3a7: bez konfliktow, fmt 0, 5 testow (w tym adapter 27/27) EXIT 0.
BLOKADY: brak
RUNDY: 1/5 (r1 + r1b/r1c/r1d po restartach; Evaluator r1 FAIL -> obrona -> FC)
NASTEPNY KROK: integracja orkiestratora (merge z parity-v2 48035d3a7 — czysty wg merge-tree), potem T7 (#369)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista (zweryfikowane samodzielnie)

- Dispatch: `00-dispatch.md` z `origin/claude/rust-sivvrn`; najnowsza linia BAZA = dodatek r1d (`fbe3d8d2c`).
  Lancuch rundy: `fbe3d8d2c` -> `240a83136` -> `39d8cb14e` -> `9a39bc09f` (Operator r1d) -> `08e1af9fe` (Evaluator)
  -> `1d9e4f527`/`b9e3dcb24`/`fc20f9b49` (obrona). `git merge-base --is-ancestor 1e20c2da9 HEAD` = tak.
- `git diff --stat 1e20c2da9 fc20f9b49`: 14 plikow — 4 nowe `siege_battle_adapter*.rs`, 4 linie `pub mod` w
  `domain/mod.rs`, `tests/p6_k5loop_adapter.rs`, generator `.mjs`, `vectors.json`, `log10.json`, raporty i skrypty
  mutantow w katalogu runu. Wszystko w allowliscie. Brak zmian w `siege_tactics_loop.rs`, `siege_tactics_atk*`,
  `siege_tactics_actions.rs`, `battle_setup*`, `bridge.rs`, `renderer/`, `view-model/`, `Cargo.*`, `gra/**`,
  `REJESTR-RUST.md`; brak zmian widocznosci w istniejacych plikach.
- Brak `#[ignore]`/`should_panic` w nowym tescie i module; brak linii `Co-Authored-By` w commitach rundy.
- `origin/rust-port/parity-v2` przesunelo sie od startu do `48035d3a7` (T4 TAGS-REST). `git merge-tree` czysty;
  proba merge lokalnie (galaz tymczasowa, usunieta): fmt 0, `p6_k5loop_adapter` 27/27, `p6_k5loop_siege_atk_a` 7,
  `p6_k5loop_siege_def` 10, `p6_k5doc_t8` 6, `p6_battle_setup_units` 7 — EXIT 0. Pelnej bramki na merge'u NIE
  uruchamiano (to krok integracji).

## 2. Bramki (FC, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=scratchpad/adapter/t2`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (1 min 24 s) |
| `cargo test --test p6_k5loop_adapter` | 27 passed, 0 failed |
| `--test p6_battle_setup_units --test p6_battle_setup --test bridge_contract --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_k5doc_t8` | 7 / 15 / 9 / 7 / 10 / 6 ok, EXIT 0 |
| `node tests/p6_k5loop_adapter_gen.mjs` | `pinSha256 0a95f5bc…731f51` (straznik), 15 scenariuszy; `git status` czysty = bajt w bajt |
| pelny `cargo test --all-targets --no-fail-fast` (`setsid nohup`, log `scratchpad/adapter/fc/full.log`) | **EXIT 0**, 03:20:48Z–03:35:06Z, 541 `test result`, 4103 passed, 0 failed, 1 ignored (istniejacy, poza tematem) |

Po pelnym tescie usunieto binarki testowe z `t2/debug/deps` (dysk 4,7 -> 13 GB wolnego).

## 3. Weryfikacja wobec pinu (wyrywkowo, tekst `git show 07d2fbd72`)

- `MAX_PER_SIDE = 500`, `BATTLE_MAX_PER_SIDE = MAX_PER_SIDE` (`battleScene.ts:721-723`) = `BATTLE_MAX_PER_SIDE = 500`;
  rozbieznosc renderera 120 zapisana jako dlug D-ADP-L5 (DTO-BRIDGE). Zgodne.
- Korona obroncow (`battleScene.ts:4700-4731`): `moraleBase * 1.5`, katapulta `max(_attackRangeFor, 6)` i
  `ranged = true`, `_applyTerrainRange(ru)` na koncu — port `spawn_fields(DefenderCrown)` 1:1.
- `startingMoralePenaltyFrac` (`game/combat.ts:1349-1356`): `!isFinite || ratio <= 1 -> 0`, `min(sufit, wsp*log10)` —
  port 1:1 (z `js_log10` fdlibm).
- `buildMilitiaDef`, `hasCityDefenders` (bez `allowedOwnerIds`), D-T8-N1 `doctrine_auto_for` -> `is_unit_doctrine_auto`
  (pusty `groupId` falsy) — zgodne.
- Brak cichych zer: domyslne `unwrap_or(0.0)` w adapterze odpowiadaja `?? 0` pinu (`militiaHeadcount`, `garnizon`,
  `Morale ucieczki`); dane brakujace/NaN -> typowany `AdapterError` (testy negatywne zielone).

## 4. Mutanty FC (nowe, poza M01–M31 i E01–E20; skrypt `scratchpad/adapter/fc/fmut.py`, werdykt = `cargo test --test p6_k5loop_adapter`)

| ID | Mutacja | Wynik |
|---|---|---|
| F01 | katapulta korony `ranged = true` -> `rf >= 2` | ZABITY |
| F02 | `isRanged` `>= 2` -> `> 2` | ZABITY |
| F03 | `ammoCount` brak -> 0 zamiast `Infinity` | ZABITY |
| F04 | `isNeverRout` bez `niezlomny` | PRZEZYL |
| F05 | `bracesAgainstCharge` bez `impi` | ZABITY |
| F06 | atakujacy z morale x1,5 | ZABITY |
| F07 | `cap_side` 500 -> 499 | ZABITY |
| F08 | `startingMoralePenaltyFrac` prog `ratio <= 1` -> `<= 1.5` | PRZEZYL |

## 5. Zarzuty i orzeczenia

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1–Z6 (Evaluator) | E01–E05, E07, E09, E15, E17–E20 przezyly | **ODDAL** (usuniete) | Obrona dopisala testy/wektory; FC potwierdza: test 27/27, generator bajt w bajt, wektory s12–s15 i `atkOwners/defOwners` obecne. Skrypt Evaluatora dal 20/20 w obronie (log `scratchpad/adapter/emut_obrona.log`); kod produkcyjny po `9a39bc09f` niezmieniony, wiec M01–M31 zachowuja waznosc. |
| N1 (Evaluator) | `pinSha256` nieporownywany | **ODDAL** (usuniete) | Generator rzuca przy innym skrocie; test Rust `assert_eq!(d["pinSha256"], PIN_SHA256)`. |
| N2 (Evaluator) | barbarzyncy zawsze wrogami | **ODDAL** jako dlug D-ADP-L-BARB (T7) | `PlayableState` nie ma ujemnych wlascicieli (`PlayerId` u64) — regula bez wejscia dzis; zapisane w dlugach. |
| N3 (Evaluator) | sojusz = umowa w pinie vs status w porcie | **ODDAL** jako decyzja D-ADP-11 + dlug T7-SOJUSZ-UMOWA | Status synchronizowany z umow w krokach tury; ryzyko tylko przy szturmie przed synchronizacja — nalezy do T7. |
| F04 (FC) | `isNeverRout` bez `niezlomny` przezywa | **ODDAL** (rownowazny na danych pinu) | `gra/data/units.json` @ `07d2fbd72` nie zawiera ani `niezlomny`, ani `walczy do smierci` w zadnym wierszu — galaz nieosiagalna na danych pinu; kod 1:1 z `battleScene.ts:1599`. Zalecenie (nie blokuje): test syntetyczny w T7. |
| F08 (FC) | prog kary morale nieczuly w przedziale (1; 1,5] | **ODDAL** (uwaga, dlug testowy) | Kod jest dokladnie `!isFinite || ratio <= 1` jak pin (`combat.ts:1355`), test sprawdza `ratio = 1 -> 0`; najmniejszy `ratio` w wektorach = 1,5185, wiec przesuniecie progu do 1,5 przechodzi. To luka czulosci testu na stala nieobecna w kodzie, nie blad zachowania; kryterium dispatchu (>= 15 mutantow zabitych/uzasadnionych) spelnione 51/51 (M01–M31, E01–E20). Dlug **D-FC-ADP-1**: dopisac asercje dla `ratio` w (1; 1,5), np. `starting_morale_penalty_frac(1.2, &p) > 0.0` z wartoscia oczekiwana policzona tekstem pinu, albo wektor generatora z takim `ratio`, przy najblizszym dotknieciu testu (T7). |

Brak zarzutow NAPRAW; brak spraw DO DECYZJI CZLOWIEKA (gameplay bez odstepstw od webu).

## 6. Dlugi (przekazane dalej)

- Z raportu Operatora §8: D-ADP-L1..L8 (T7 #369, stan, REPIN, DTO-BRIDGE 120 vs 500, T8 #354).
- Z obrony: D-ADP-L-BARB, T7-SOJUSZ-UMOWA (D-ADP-11).
- FC: D-FC-ADP-1 (F08, czulosc progu kary morale), D-FC-ADP-2 (F04, test syntetyczny `niezlomny`/`walczy do smierci`).
- Decyzje D-ADP-1..11 do wpisania w `REJESTR-RUST.md` przez orkiestratora.

## 7. Sprzatanie

FC nie pushuje i nie integruje. Cache `scratchpad/adapter/t2` (rlib/rmeta, binarki testowe usuniete) i katalog
`scratchpad/adapter/fc` pozostawione do decyzji orkiestratora (usunac po integracji). Galaz tymczasowa merge'u usunieta.
