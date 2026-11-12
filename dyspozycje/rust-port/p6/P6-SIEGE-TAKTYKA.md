# P6-SIEGE-TAKTYKA — pokrycie pętli taktycznej oblężenia (#217)

Temat: `R-RUSTPORT-P6-SIEGE-TAKTYKA-AUDYT-Q1` (runda 1, Operator Haiku 5.5).
Baza Rust: `rust-port/parity-v2` = `258afaf8f` (zweryfikowane `git rev-parse origin/rust-port/parity-v2`).
Pin web (tylko odczyt, `git show`): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
Źródła pinu: `gra/src/battle/battleScene.ts` (pętla bitwy oblężniczej), `gra/src/battle/siegeWall.ts`, `gra/src/game/siegeAi.ts`, `gra/src/game/mapSiegeDetect.ts`.
Numeracja L2–L5 / L9–L10 wg `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-LIMIT-BLOKADA.md` (tabela luk).

Legenda: **PORTED** = odpowiednik Rust 1:1 (plik:linia Rust), **PARTIAL** = tylko część funkcji, **BRAK** = brak odpowiednika (powód w kolumnie), **NIE_ZMIERZONO** = nie sprawdzono w tej rundzie.

## 1. Tabela pokrycia — poziomy L2–L5 (pętla taktyczna)

| # | Funkcja / element webowy | Linie pinu | Odpowiednik Rust | Status | Uwagi / zależności |
|---|---|---|---|---|---|
| 1 | `SIEGE_NO_BREACH_MAX_ROUNDS` (stała z `combat-params.json`) | `battleScene.ts:1128` | `domain/siege_no_breach.rs:53` `siege_no_breach_cap`; `:27` `siege_no_breach_max_rounds_from_data` | PORTED | Wartość 150 z danych (runda 2 r-OBL). |
| 2 | pole `siegeNoBreachMaxRounds` | `battleScene.ts:2505` | parametr `no_breach_cap` w `siege_no_breach.rs:69` | PORTED | Pole instancji = argument wywołania (brak stanu obiektu). |
| 3 | `_roundCapVerdict()` (L2) | `battleScene.ts:9449-9465` | `domain/siege_no_breach.rs:69` `round_cap_verdict` | PORTED | Wektory z weba: `tests/p6_repin_oblezenie_limit_web.rs`. |
| 4 | `_runFastForward()` (pętla przewijania) | `battleScene.ts:9415-9437` | brak | BRAK | Pętla rAF/timerów sceny (`_drainTimers`, `_tickProjectiles`, `_tickFades`, `_ffQueue`). Brak warstwy pętli taktycznej w Rust (D-OBL-4). |
| 5 | `_ffRoundCapResult()` (L4) | `battleScene.ts:9485-9499` | brak | BRAK | Efekty sceny (`finished`, `_ffActive`, log, `_endSurvivors`, `_showEndScreen`). Werdykt tury: `round_cap_verdict` (wiersz 3). |
| 6 | `_finishDraw(reason, cap)` (L4) | `battleScene.ts:9467-9480` | brak (werdykt `RoundCapVerdict::Draw` w `siege_no_breach.rs:37`) | PARTIAL | Część logiczna = werdykt remis; efekty UI/log/survivors BRAK. |
| 7 | `_checkEnd()` — warunek `if (this.finished)` i zbudowanie `aliveA/aliveD` | `battleScene.ts:10153-10158` | brak (flagi podawane z zewnątrz) | BRAK | Wymaga modelu jednostek (`!dead && !fadingOut && !routed`). |
| 8 | `_checkEnd()` — morale: `_armyMoraleRatio`, `brokenA/brokenD`, rout dowódców | `battleScene.ts:10160-10171`, `:9988` (`_armyMoraleRatio`) | brak | BRAK | Wymaga modelu morale armii (Z-NB-3); `commandersToWithdrawAfterArmyBreak` poza zakresem tematu. |
| 9 | `_checkEnd()` — stall, gałąź PAT bez oblężenia (`!isSiege && totalDead > 0`) | `battleScene.ts:10172-10183` (PAT: `:10178-10182`) | brak | BRAK | Kandydat na następny klocek (patrz §4, K1). |
| 10 | `_checkEnd()` — „SZTURM ODPARTY" (`isSiege && !wallEverBreached` → `aliveA = false`) | `battleScene.ts:10184-10186` | `domain/siege_tactics_end.rs:41` `siege_no_breach_repels_attack` | PORTED (nowy w tej rundzie) | Wektory: `tests/p6_siege_tactics_vectors/vectors.json` (`repels`, 4 przypadki), test `wektory_repels_zgodne_z_webem`. |
| 11 | `_checkEnd()` — morale zalamane (`brokenA && aliveA` → `aliveA = false`) | `battleScene.ts:10189-10192` | brak | BRAK | Zależy od wiersza 8. |
| 12 | `_checkEnd()` — sufit tur w AUTO/ręcznej (`aliveA && aliveD` → `_roundCapVerdict`) | `battleScene.ts:10197-10206` | werdykt: `siege_no_breach.rs:69`; wiring w pętli brak | PARTIAL | Logika werdyktu PORTED (wiersz 3); wpięcie do stanu tury BRAK (D-OBL-4). |
| 13 | `_checkEnd()` — rozstrzygnięcie zwycięzcy (`return false` gdy obie żyją; `atakujacy`/`obronca`; mutual elimination po HP `hpA >= hpD`) | `battleScene.ts:10208-10220` | `domain/siege_tactics_end.rs:49` `battle_winner` | PORTED (nowy w tej rundzie) | Wektory: `vectors.json` (`winner`, 432 przypadki, seed 217); testy `wektory_winner_zgodne_z_webem` + 5 testów jawnych. Sumowanie HP z `Math.max(0, hp)` na jednostkę. |
| 14 | `_checkEnd()` — ekran końca, `_battleUnitsForMapExport`, log zwycięstwa | `battleScene.ts:10222-10240` | brak | BRAK | Efekty sceny/mapy poza zakresem. |
| 15 | `wallEverBreached` — ustawianie po wyłomie (`_breachWallTile`) | `battleScene.ts:7638-7647` | brak | BRAK | Stan muru (L3). Zależy od `siegeWallCol`/`wallTileHp` (`_carveWallTiles` `:4026`). |
| 16 | `wallEverBreached` — ustawianie po wyłomie bramy (`_breachGate`) | `battleScene.ts:7757-7759` | brak | BRAK | L3; stan bramy `GATE_MAX_HP`. |
| 17 | `wallEverBreached` — ustawianie przez wejście na wieżę (`_trySiegeTowerClimb`) | `battleScene.ts:8056-8072` | brak | BRAK | L3; zależy od `towerAtWallRows`. |
| 18 | `wallEverBreached = true` przy „Pomiń" (machina oblężnicza w składzie) | `battleScene.ts:3718-3721` | brak | BRAK | Ścieżka skip/AUTO; zależy od warstwy bitwy (L5). |
| 19 | `_siegeApproachRestricted(ru)` (blokada zbliżania) | `battleScene.ts:7951-7959` | brak | BRAK | Czysty bool `!(wallEverBreached \|\| towerAtWallRows.size > 0)`; kandydat K2 (§4). |
| 20 | `_meleeBlockedByWall(ru, e)` (`wallBreached` w eksporcie) | `battleScene.ts:8361-8366`, eksport `:10728` | brak | BRAK | Zależy od geometrii muru i `wallBreached`. |
| 21 | L5: bitwa ręczna i „Pomiń = wynik AUTO" (wspólny `_roundCapVerdict`) | `battleScene.ts:2286`, `:3572`, `:3718-3721`, `:10197-10203` | brak | BRAK | Brak warstwy bitwy ręcznej w Rust (P6-REPIN-OBLEZENIE-LIMIT-BLOKADA L5). |

Podsumowanie L2–L5: funkcje z listy (wiersze 1–21) mają status; PORTED: 1, 2, 3, 10, 13 (5 z 21); PARTIAL: 6, 12; reszta BRAK z powodem. Pokrycie „co do funkcji z opisanym statusem" = 100%; pokrycie „czystych funkcji" = patrz §3.

## 2. Tabela pokrycia — SIEGE-NEARBY-STAN L9–L10

| # | Element | Linie pinu | Rust | Status | Powód |
|---|---|---|---|---|---|
| L9 | `commitBesiege` / `startMapSiege` / `siegeArmyGroupId` | `main.ts` (web) | brak (pole `oblega_city_id`: `domain/siege_sortie.rs:68`, `domain/recruitment.rs:430`) | BRAK (UI) | Warstwa UI/mapy, D-OBL-5. |
| L10 | `inheritSiegeOnJoin` (dołączanie do armii oblegającej poza miastem) | `armyMerge.ts` (web) | brak (`domain/siege_enter_city.rs` tylko wejście po kapitulacji) | BRAK | Wymaga warstwy stanu gry (D-OBL-5). |

Dla L6–L8 (`besiegeArmyGroups`, `besiegeLockTargets`, `stackGroupIdOf`) status PORTED jest w `domain/siege_nearby_lock.rs:38,55,76` (poprzedni temat, poza tą rundą).

## 3. Port w tej rundzie (klocek K0)

* Moduł: `rust-port/engine/src/domain/siege_tactics_end.rs` (nowy), rejestracja `domain/mod.rs` (`pub mod siege_tactics_end;`).
* Funkcje: `siege_no_breach_repels_attack` (pin `:10184-10186`), `battle_winner` (pin `:10208-10220`), enum `BattleSide`.
* Wektory: generator `rust-port/engine/tests/p6_siege_tactics_gen.mjs` (Node 22, wycięte fragmenty JS bez typów TS, bez `this.`); wynik `rust-port/engine/tests/p6_siege_tactics_vectors/vectors.json` (4 + 432 przypadki, seed 217).
* Testy: `rust-port/engine/tests/p6_siege_tactics_end.rs` (7 testów).
* ZAŁOŻENIE Z-ST-1: wycięta funkcja JS jest kopią 1:1 logiki pinu, a NIE wynikiem uruchomienia bundla weba (`battleScene.ts` ciągnie cały DOM/Three.js). Wektory dowodzą równoważności wycinka, nie całej sceny.
* ZAŁOŻENIE Z-ST-2: `battle_winner` przyjmuje już policzone flagi `alive` (web `!dead && !fadingOut && !routed`); ich wyliczenie to wiersz 7 (BRAK).
* NIE_ZMIERZONO: `cargo test` na całym workspace poza `--lib` i `--test p6_siege_tactics_end`; bramki z dispatchu wykonano w crate `rust-port/engine`.

## 4. Plan kolejnych klocków (kolejność i zależności)

| Krok | Klocek | Pin | Zależy od | Uwagi |
|---|---|---|---|---|
| K1 | `stall_pat_loser(ratio_a, ratio_d) -> BattleSide` (gałąź PAT bez oblężenia) | `:10178-10182` | Z-NB-3 (ratio policzone wejściem) | Czysty, ~10 wektorów. Najmniejszy kolejny klocek. |
| K2 | `siege_approach_restricted(wall_ever_breached, tower_rows)` | `:7951-7959` | wiersz 15-17 (stan wyłomu jako `bool`) | Czysty bool; wektory z 2×2×(0/1+) przypadków. |
| K3 | `end_check_order(...)`: złożenie kroków 10184 → 10189 → 10197 → 10208 w jedną funkcję czystą | `:10172-10220` | K1, K2, `round_cap_verdict`, `battle_winner` | Wymaga K1 i wejść morale (wiersz 8) jako liczb. |
| K4 | Automat wyłomu (`wallEverBreached` z trzech zdarzeń) | `:7638, :7757, :8056, :3718` | model muru/bramy (L3) | Decyzja: czy L3 ma być w `domain/`, czy w warstwie stanu. |
| K5 | Pętla tur taktycznych (`_runFastForward` + wpięcie K3) | `:9415-9437`, `:10153` | D-OBL-4: warstwa pętli tur | Najwyższe ryzyko; osobna autoryzacja właściciela (ABC). |
| K6 | Bitwa ręczna / „Pomiń" (L5) | `:3572`, `:3718` | K5 | Poza zakresem engine do czasu K5. |

Zależności: K1 → K3; K2 → K3; K4 → K2; K3 + K4 → K5 → K6. L9–L10 (SIEGE-NEARBY, UI) poza tą listą (D-OBL-5).

## 5. Otwarte

* D-ST-1: pin `07d2fbd72` vs baza `258afaf8f` — funkcje oblężenia w `battleScene.ts` nie były porównywane na poziomie diffu między pinem a `origin/main`; NIE_ZMIERZONO.
* D-ST-2: plik `rust-port/engine/Cargo.lock` powstał lokalnie przy `cargo` (untracked) i NIE jest częścią commita.
