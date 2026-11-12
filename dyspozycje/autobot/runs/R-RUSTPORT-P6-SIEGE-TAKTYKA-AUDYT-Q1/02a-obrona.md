STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1
GOAL: obrona operatora (runda 2) na zarzuty Evaluatora r1 z 02-evaluator.md: poprawka tabeli, pokrycie funkcji pomocniczych, strażnik `_stalled`, weryfikacja źródła wektorów.
ZMIANY/COMMIT: baza 4aa202726 (= commit operatora r1, przodek 258afaf8f; f207ea6b1 jest przodkiem 258afaf8f). Commit r2: patrz sekcja SHA na końcu. Allowlista zachowana: rust-port/engine/src/domain/siege_tactics_end.rs, rust-port/engine/tests/p6_siege_tactics_end.rs, rust-port/engine/tests/p6_siege_tactics_gen.mjs, rust-port/engine/tests/p6_siege_tactics_vectors/vectors.json (bez zmian), dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md, dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1/**. Brak zmian w gra/, Cargo.toml, Cargo.lock (untracked, nie commitowany), WERSJE.md, origin/main, rust-port/parity-v2.

## Odpowiedzi na zarzuty

Zarzut 1 (K2 / wiersz 19 = czysty bool): PRZYJMUJĘ. Dowód: pin `battleScene.ts:7951-7959` ma gałęzie (a) `!(siegeWallCol >= 0) || side !== 'atk'` -> false, (b) `routed || onWallWalkway || isSiegeUnit` -> false, (c) strzelec `primaryRanged && canShoot && shootingEnabled !== false` -> false, (d) `mounted` -> `!(gateOpen || tileBreached)`, (e) piesi -> `!(wallEverBreached || towerAtWallRows.size > 0)`. Poprawka: wiersz 19 w P6-SIEGE-TAKTYKA.md rozpisany na (a)-(e) z zależnościami; K2 w §4 zmieniony na rozbicie na wejścia przed predykatem. Commit r2.

Zarzut 2 (brakujące czyste funkcje): PRZYJMUJĘ. Dodane wiersze 22-32 z numerami linii pinu i statusem:
- 22 `meleeBlockedByWall` (`city-fortification.ts:76-79`) BRAK, czysta;
- 23 `attackerWallEntryIsBreach` (`city-fortification.ts:96-98`) BRAK, czysta, najmniejsza (1 linia);
- 24 `cityFortificationKind` (`city-fortification.ts:29`) BRAK, czysta, poza pętlą (konstruktor, `:2741`);
- 25 `armyMoraleRatioWithoutCommander` (`game/army-leadership.ts:39`) PORTED w `domain/army_leadership.rs:123`;
- 26 `commandersToWithdrawAfterArmyBreak` (`game/army-leadership.ts:57`) PORTED w `domain/army_leadership.rs:146`;
- 27 `isSiegeUnit` (`battleScene.ts:1552`) PARTIAL: Rust `domain/brake_power_army.rs:31` bierze tylko `rola_linia`, web bierze `BattleUnit`;
- 28 `canShoot` (`battleScene.ts:1457`) BRAK;
- 29-30 metody gatingu oblężniczego (`:7963`, `:8022-8138`) BRAK;
- 31 `siegeWall.ts` (tylko funkcje renderu, import `battleScene.ts:137`), `siegeAi.ts` i `mapSiegeDetect.ts` (NIE importowane przez `battleScene.ts`, czyli poza pętlą) — dopisane z uzasadnieniem; handoff `UNITS-do-SILNIK_AI-siege-3poziomy.md` oznaczony NIE_ZMIERZONO;
- 32 metody `battleScene.ts:8139-9096` NIE_ZMIERZONO.
Kryterium "100% funkcji L2-L5" NIE jest wykazane i nie jest twierdzone: §1 podsumowuje to wprost. Odrzucam wcześniejsze sformułowanie "100%" jako nieprawdziwe; zostaje "100% wierszy z numerami linii i statusem" oraz NIE_ZMIERZONO tam, gdzie nie rozstrzygnięto.

Zarzut 3 (strażnik `_stalled` w `siege_no_breach_repels_attack`): PRZYJMUJĘ. Dowód z pinu: `if (this._stalled && aliveA && aliveD) { ... if (isSiege && !this.wallEverBreached) { ...; aliveA = false; } }` (`battleScene.ts:10172-10186`). Poprawka: ostrzeżenie w doc-komentarzu funkcji w `siege_tactics_end.rs`; K3 w §4 ma wymóg, że predykat stosuje się tylko przy `stalled && alive_a && alive_d`, i ma mieć przypadek `stalled=false`. Nie dodano wbudowanego strażnika do sygnatury, bo wymaga stanu sceny (decyzja: K3).

Zarzut 4 (wektory z ręcznego wycinka): PRZYJMUJĘ CZĘŚCIOWO. Dodany straznik w `p6_siege_tactics_gen.mjs`: generator czyta pin przez `git show 07d2fbd72:gra/src/battle/battleScene.ts` (bez checkoutu), liczy SHA-256 fragmentów 10184-10186 + 10208-10220 i kończy się błędem, gdy hash nie zgadza się z zapisanym `e6a808a1...037`. Uruchomione: `node rust-port/engine/tests/p6_siege_tactics_gen.mjs` -> `repels 4 winner 432`, `vectors.json` bez diffu. NIE_ZMIERZONO: pełna ekstrakcja i wykonanie kodu z pinu (wycięte fragmenty nadal zawierają typy TS i `this.`, więc automatyczna transpilacja wymagałaby esbuild poza repo). Logika portu nadal dowodzi równoważności wycinka, nie całej sceny (Z-ST-1).

Zarzut 5 (bramka `cargo test --test p6_siege_tactics` nie istnieje): PRZYJMUJĘ jako odchylenie. Plik testowy nazywa się `p6_siege_tactics_end.rs`, więc target to `p6_siege_tactics_end`. Uruchomiono: `cargo test --test p6_siege_tactics_end` -> 8 passed, EXIT 0. Dodatkowo `cargo test p6_siege_tactics` (filtr nazw testów) -> EXIT 0, ale NIE daje dowodu: filtr dopasowuje nazwy funkcji testowych, a te nie zaczynają się od `p6_siege_tactics`; dowodem jest powyższy target. Odchylenie jest odnotowane w tym pliku i w P6-SIEGE-TAKTYKA.md.

Zarzut 6 (gałąź NaN w `js_max0` bez wektora/testu): PRZYJMUJĘ. Dodany test `mutual_elimination_nan_hp_jak_web` w `tests/p6_siege_tactics_end.rs` (nowy test, istniejące asercje bez zmian): `battle_winner(false,false,[NaN],[1.0])`, `([1.0],[NaN])`, `([NaN],[])` -> `Defender`. Oczekiwania zweryfikowane w node 22: `[NaN].reduce((s,hp)=>s+Math.max(0,hp),0) >= 1` -> false, `Math.max(0,NaN)` -> NaN. Test wynik: 8 passed (w tym nowy).

Zarzut 7 (wiersz 3 PORTED opiera się na `p6_repin_oblezenie_limit_web.rs`, nie weryfikowano): PRZYJMUJĘ jako informację i ZWERYFIKOWANO: `cargo test --test p6_repin_oblezenie_limit_web` -> 3 passed, EXIT 0 (testy `web_wektory_cap`, `web_wektory_werdykt_sufitu`, `web_wektory_siege_nearby`). Wektory pochodzą z tematu `R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1` i NIE zostały wygenerowane ponownie w tej rundzie (poza zakresem).

## Bramki (r2, EXIT zapisany)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: 48 passed, EXIT 0
- `cargo test --test p6_siege_tactics_end`: 8 passed, EXIT 0 (r1: 7; +1 nowy NaN)
- `cargo test --test p6_repin_oblezenie_limit_web`: 3 passed, EXIT 0
- `cargo test p6_siege_tactics` (filtr): EXIT 0, bez dowodu (patrz zarzut 5)
- `node rust-port/engine/tests/p6_siege_tactics_gen.mjs`: repels 4, winner 432; vectors.json bez diffu
Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (scratchpad/tgt-r2), do usunięcia po zapisie raportu.

## Zmiany w r2
- `rust-port/engine/src/domain/siege_tactics_end.rs`: doc-komentarz o strażniku `_stalled` (zarzut 3); kod bez zmian.
- `rust-port/engine/tests/p6_siege_tactics_gen.mjs`: straznik SHA-256 fragmentów pinu przez `git show` (zarzut 4).
- `rust-port/engine/tests/p6_siege_tactics_end.rs`: +1 test NaN (zarzut 6).
- `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`: wiersz 19 poprawiony, wiersze 22-32 dodane, podsumowanie, §4 (K0a, K2, K3).

## Otwarte
- Z-ST-1 (wycinek JS, nie cała scena) i NIE_ZMIERZONO z wierszy 31-32 pozostają.
- Plan kolejności: K0a -> K1 -> K2 (po rozbiciu) -> K3 (z wymogiem strażnika) -> K4/K5/K6 wg §4.

BLOKADY: brak (poza NIE_ZMIERZONO wymienionymi wyżej)
RUNDY: 2/5 (obrona r2; Final Control po integracji r2)
NASTĘPNY KROK: Evaluator r2 na commicie r2, potem Final Control; integracja i push po READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
