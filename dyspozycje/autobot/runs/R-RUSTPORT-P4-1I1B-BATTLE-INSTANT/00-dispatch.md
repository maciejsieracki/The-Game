# DISPATCH R-RUSTPORT-P4-1I1B-BATTLE-INSTANT (runda 1) — ścieżka „Pomiń” E4 (P4-1I / #245)

DOMENA: silnik (`rust-port/engine`) + DTO (`rust-port/view-model`, tylko odczyt kontraktu z I1). MODEL: OPUS we wszystkich rolach (seria P4-1, decyzja właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `05e4df502` (zawiera zintegrowane P4-1I1 BATTLE-OUTCOME). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt, `git show 07d2fbd72:gra/src/battle/battleScene.ts`).
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §„P4-1I1B” (wiersz I1B) i §2a kontraktu `P4-1-RENDER-DTO-CONTRACT.md` (`BattleOutcomeDto`, E4).
Kod wejściowy: `rust-port/engine/src/domain/siege_tactics_outcome.rs` (I1, E1–E3), `rust-port/view-model/src/battle.rs` (`BattleOutcomeDto`).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Port ścieżki „Pomiń” (E4 w §2a.1) z pinu: `computeInstantResult` (`gra/src/battle/battleScene.ts:20389-20593`) na istniejące `combat::resolve`, plus:
- reguła `wallBreached` przy machinie oblężniczej (pin `:3720-3722`),
- `result.log` (teksty logu wyniku natychmiastowego, bajt-w-bajt z pinu),
- wejście do `BattleOutcomeDto` z I1 jako wariant E4 (zamiast „dane z zewnątrz”, które I1 zostawił do I1b).

## ZAKRES
1. Nowy moduł `rust-port/engine/src/domain/siege_tactics_instant.rs` z funkcją odpowiadającą `computeInstantResult`. Wejścia: jednostki atakujących i obrońców (w kolejności pinu), teren/mapa terenu (`combatTerrainName` z pinu), bonusy cywilizacyjne, liczniki (`counters`), obrona muru/cytadeli/baszty (`structureDefBonusPct`, pin `:20440-20450` i `:20456-20470`), facing (`relativeHit`), `onWallWalkway`.
2. Zachowaj kolejność iteracji pinu (`lD[i % lD.length]`, pętla `:20436+`), pomijanie `!a || !d || hp<=0`, ustawianie `cu.health = hp`, `defTerrain` (wall → `Plaskie (rownina/laka)`; inaczej `combatTerrainName`).
3. Werdykt: `hpA >= hpD` (bez remisu w E4), `dead` tylko dla `!dead` na wejściu.
4. `wallBreached` z machiny i z/bez muru (pin `:3720-3722`).
5. `result.log`: teksty dokładnie jak w pinie (`toFixed(0)` jak w JS, bez zmian formatu liczb).
6. Wpięcie do `BattleOutcomeDto` (view-model) jako E4: konstruktor przyjmuje ścieżkę `EndPath::E4` z danymi z tej funkcji. Nie zmieniaj semantyki E1–E3 z I1.
7. Brak wołającego w produkcji poza testami = dopisz jawnie w raporcie (`build_battle_outcome` ma wołającego dopiero w #113/#246; to nie jest błąd tego tematu).

## WEKTORY / TESTY
- Generator TS (lub ręcznie zweryfikowane wartości z pinu) dla `computeInstantResult`: co najmniej 3 wektory — przewaga atakującego, przewaga obrońcy, mur + machina (`wallBreached`). Każda wartość z komentarzem `plik:linia` pinu.
- Testy `result.log` (bajt-w-bajt).
- Test wejścia E4 do `BattleOutcomeDto` (view-model, klucze JSON, walidacja).
- Mutacje (MUSZĄ dać FAIL): odwrócenie `hpA >= hpD` na `>`; pominięcie `defOnWall`; usunięcie `wallBreached` przy machinie. Skrypt mutacyjny w `dowody/` (jak I1).

## KRYTERIA KOŃCA
1. Port zrealizowany, wektory zielone, mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0: w `rust-port/engine` ORAZ `rust-port/view-model`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Każda decyzja techniczna zapisana w raporcie (np. typ wyniku E4, sposób przekazania `log`).

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_instant.rs` (nowy)
- `rust-port/engine/src/domain/mod.rs` (TYLKO dopisanie modułu)
- `rust-port/engine/src/domain/siege_tactics_outcome.rs` (TYLKO wariant/wejście E4)
- `rust-port/engine/tests/p4_1i1b_*.rs` (nowe)
- `rust-port/view-model/src/battle.rs` (TYLKO wejście E4 w `BattleOutcomeDto`)
- `rust-port/view-model/tests/**` (TYLKO testy E4)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
