# R-RUSTPORT-P6-K5DOC-T6-JAZDA-ROZPOZNANIE — rozpoznanie JAZDY (#259, K5DOC-T6), runda 1

DOMENA: engine Rust, ROZPOZNANIE (tylko odczyt). MODEL: HAIKU.
BAZA: `2edc808d7` (HEAD przy starcie; `origin/rust-port/parity-v2`). PIN: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Nie zmieniano `rust-port/**`, nie uruchamiano cargo, nie pushowano.

## 1. PIN — mapa funkcji (`gra/src/battle/battleScene.ts` @ 07d2fbd72)

| Funkcja | Linia | Rola |
|---|---|---|
| `isMounted(bu)` | 1502 | klasa konnica/rydwan |
| `isAntiCavSpear(bu)` | 1522 | wlocznik/falanga/pikinier (RULE 1) |
| pole `antiCavSpear` w `RuntimeBattleUnit` | 2009 | flaga wlocznii |
| `desiredHitForDirection(dir)` | 1956 | bok->flank, tyl->rear, front->brak |
| `_activateUnit` | 6048 | wejscie; galaz `if (ru.mounted) this._cavalryAction(ru, done)` w `:6284` |
| `_cavPriority(e)` | 6313 | priorytet celu (horse > skirmisher > inny nie-wlocznik > wlocznik) |
| `_cavalryTarget(ru)` | 6326 | wybor celu wg priorytetu, wlocznik najgorszy |
| `_cavAdjacentNonSpear(ru)` | 6351 | sasiad nie-wlocznik do natychmiastowego ciosu |
| `_cavalryAction(ru, done)` | 6372 (koniec ~6425) | GLOWNA: 1) cios w sasiada nie-wlocznika; 2) manewr kierunkowy (C-FLANK, `bok`/`tyl`); 3) `_cavManeuverStep`; 4) forsowany atak na sasiedniego wlocznika; 5) `_bestChargeStepKey` (ostatnia szansa); 6) `done()` |
| `_cavDirectedManeuverStep(...)` | 6426 | BFS do hexa flank/rear wzgledem celu; petla rekursywna w obrebie tury |
| `_cavManeuverStep(ru, done, tgt)` | 6457 | krok omijajacy wlocznie: scoring sasiadow, kara `spearAdj` (+0 zamiast +5), `fordPenalty` |
| `_phalanxLineFront` | 6519 | poza zakresem T6 (falanga, T7) |
| `_firstStepTowardDirectedAttack(...)` | 8509 | BFS dla manewru kierunkowego (uzywany przez `_cavDirectedManeuverStep`) |
| `_enemiesOf(ru)` | 8291 | lista wrogow |
| `_bestChargeStepKey(ru, tgt)` | 17736 | krok szarzy (ostatnia szansa); zawiera `spearAdj` (~17753-17759) |
| `_executeGroupDoctrineStep` | 17966 | wolajacy `_cavalryAction` w `:17993` i `:18029` (sciezka doktryny grupy, T8) |

Uwaga: numery linii i nazwy potwierdzono przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`. Koniec `_cavalryAction` (~6425) i `_cavDirectedManeuverStep` jest szacowany z sasiedztwa, nie z konca bloku. Operator ma to dopiac przed dispatchem (NIE_ZMIERZONO co do ostatniej linii kazdej funkcji).

## 2. RUST — co istnieje, czego brakuje

**Istnieje:**
- `rust-port/engine/src/domain/siege_tactics_activate.rs:63` — pole `mounted` w `ActivateUnit`.
- `siege_tactics_activate.rs:456-459` — galaz `U7.7-cavalry`: emituje tylko `ActivateEvent::CavalryAction` i konczy (`return out`). Brak ciala `_cavalryAction`.
- `siege_tactics_loop.rs:1054` — mapowanie zdarzenia `CavalryAction => "kawaleria"`.
- `siege_tactics_loop.rs:976` — `ProdUnit` (pola `activate`, `melee_target`, `blow`, `counter_blows`, `facing` itd.).
- `siege_tactics_doctrine_target.rs:40` — `desired_hit_for_direction` (= `desiredHitForDirection`, pin 1956); `:112` pole `attack_direction`; `:224` priorytet `Mounted` vs `anti_cav_spear` (T2 #256, zakonczone).
- `siege_tactics_doctrine_state.rs:50,64,79` — `ProdDoctrineState` z `anti_cav_spear` (domyslnie false).
- `siege_tactics_approach.rs:169` — klauzula `mounted` (wall/gate), nie manewr jazdy.
- `siege_tactics_blow.rs:297` — szarza (`attacker_mounted && is_charge`), wejscie ciosu.
- `siege_tactics_pathstep.rs:51` `first_step_along_path_to_attack` i `:114` `step_toward` (T4a #312, zakonczone) — dostepne jako helpery sciezki.

**Brakuje:**
- Brak modulu `domain/siege_tactics_cavalry.rs` (planowany, nowy).
- Brak funkcji: `cavalry_action`, `cavalry_target`, `cav_adjacent_non_spear`, `cav_priority` (wariant jazdowy), `cav_directed_maneuver_step`, `cav_maneuver_step`, `first_step_toward_directed_attack`, `best_charge_step_key` — wyszukiwanie po `rust-port/engine/src` nie zwraca zadnej z tych nazw.
- Brak wpiecia: zdarzenie `CavalryAction` nie wywoluje zadnej logiki ruchu/ataku.
- Brak pelnego stanu kierunku natarcia po krokach wymaganego przez manewr kierunkowy: `attack_direction` jest w `doctrine_target`, ale facing po krokach to #107 `K5LOOP-FACING` (pending) i #123 (pending).

## 3. Zaleznosci

Z planu (`R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md:186`): T6 zalezy od **T2** (#256 — ZAKONCZONE). Moze isc rownolegle z T1, T5a, T5b, T7.

Dispatch wymienia: **T4b (#313)** i **T5a (#257)**. Stan w tasklist:
- #313 K5DOC-T4b (decyzja `_advanceStep`) — in_progress, runda 2 w toku.
- #257 K5DOC-T5a (KITE) — pending, runda 2 w toku.

Rozbieznosc do rozstrzygniecia przez orkiestratora: `03-final-control.md:87` podaje dla T6 zaleznosci **T0, T2'** z „T5a" jako rownolegle/blokujace (tekst niejednoznaczny). Planowa tabela mowi, ze T6 NIE wymaga twardo T4b ani T5a. Twarde wejscia wg kodu: `_cavalryTarget` uzywa stanu celow (T2, zakonczone), `desiredHitForDirection` (juz w Rust) i `attack_direction` (juz w `doctrine_target`). Ruch po krokach (`facing` po `_advanceStep`) jest w #123, zablokowany przez #107/#315.

## 4. Proponowana allowlista (do dispatchu Operatora, NIE do wykonania tutaj)

- nowy: `rust-port/engine/src/domain/siege_tactics_cavalry.rs`
- zmiana: `rust-port/engine/src/domain/mod.rs` (rejestracja modulu)
- zmiana: `rust-port/engine/src/domain/siege_tactics_activate.rs` (galaz U7.7 -> wywolanie logiki zamiast samego zdarzenia), tylko wiring
- nowe testy: `rust-port/engine/tests/p6_k5doc_cavalry.rs`, `rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs`, `rust-port/engine/tests/p6_k5doc_cavalry_vectors/vectors.json`
- NIE w allowliscie: `siege_tactics_pathstep.rs` (T4a, zamkniete), `siege_tactics_loop.rs` (T4c/T4e/#123 osobno), `gra/**`, `rust-port/**` poza wymienionymi.

## 5. Wektory (`plik:linia`)

- Pin: `battleScene.ts:6284` (wejscie), `6326` (`_cavalryTarget`), `6351` (`_cavAdjacentNonSpear`), `6372` (`_cavalryAction`), `6426` (`_cavDirectedManeuverStep`), `6457` (`_cavManeuverStep`), `17736` (`_bestChargeStepKey`), `17993`/`18029` (wolajacy z doktryny).
- Rust: `siege_tactics_activate.rs:456-459` (miejsce wpiecia), `siege_tactics_doctrine_target.rs:40,112,224`, `siege_tactics_pathstep.rs:51,114`.
- Wektory do wygenerowania: (a) sasiad nie-wlocznik -> cios; (b) brak sasiada, cel z priorytetem, manewr omijajacy wlocznie (scoring `spearAdj` 0 vs +5); (c) manewr `bok`/`tyl` (C-FLANK) z `desiredHitForDirection`; (d) forsowany atak na wlocznika gdy brak kroku; (e) szarza `_bestChargeStepKey` jako ostatnia szansa.

## 6. NIE_ZMIERZONO

- Dokladny koniec funkcji `_cavalryAction` (zakres 6372-~6425 wyznaczony z sasiedztwa).
- Zawartosc `_bestChargeStepKey` poza liniami 17736 i 17753-17759 (nie czytano pelnego ciala).
- Czy Rust `ProdUnit` ma pole `mounted` bezposrednio (widziano tylko w `ActivateUnit`).
- Rozstrzygniecie zaleznosci T4b/T5a (rozbieznosc z `03-final-control.md:87`).
- Brak uruchomienia testow i cargo (zgodnie z dispatchem).

## 7. Wynik

STATUS: PASS (rozpoznanie wykonane, material kompletny w zakresie pinu i Rust; luki wpisane w NIE_ZMIERZONO)
REKOMENDACJA: startowac T6 po T2 (zakonczone), rownolegle z T5a/T5b/T7 zgodnie z planem; #313 (T4b) nie blokuje jazdy wedlug kodu — orkiestrator potwierdza te zaleznosc przed dispatchem.
