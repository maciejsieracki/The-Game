STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1
GOAL: wiazanie `advance_city_economy` z petla tury Rust 1:1 z miejscem wywolania weba (`main.ts:34540` + bankowanie `:35045-35131`), pin `4bbef081d`, baza `13b98d75a`.

ZMIANY/COMMIT: kod+dowody `f1dbde0ad` (WIP: `b4ab8fef9`, `f171ce690`), baza `13b98d75a`.
* NOWE: `domain/turn_economy_inputs_{trade,wonders,state}.rs`, `domain/turn_economy_wire.rs` (`run_economy_tick_for_game`, `OwnerBank`, sumy per owner), `tests/p6_adv_q6_wire.rs` + `tests/p6_adv_q6_vectors/q6.json` (3,7 MB), doc `P6-ADVANCE-CITY-ECONOMY-Q6.md`.
* ISTNIEJACE: `domain/mod.rs` +4 linie `pub mod`; doc Q5 jeden wiersz tabeli (dlug -Q6 -> zaportowane). Poza tym zero zmian istniejacego kodu; `gra/**`, `trade.rs` nietkniete.

TABELA WEJSC/WYJSC (100%, doc sek. 2): 26 wejsc. Zaportowane: trasy (dochod, morskie, premia budynkowa, bonus Portu), cuda (plony miasta, handel_procent), lask Mennicy + resolvery memoizowane, reczny podatek + stolica, bankowanie. Martwe w webie (0 uzyc w ciele `turn-economy.ts:2250-2913`): `growthMultByCity`, `wzrostLudnosciPace`, `cityReligionByCityId`. Wejscia stanu: era/tech/ownerCiv/order/podzial. Reszta = dlug -Q7 z dowodem (sek. 8, 5 tematow).

RELACJA `turn_economy.rs`: `settle_turn`/`resolve_turn` (`u64`) nie maja odpowiednika w webie (grep `settleTurn|resolveTurn` w `gra/src` = 0); to inny, wlasny kontrakt Rust, nie etap `advanceCityEconomy`. Wiazanie zwraca `f64` per owner (skarbiec moze byc < 0); mapowanie na `EconomyBalances` = zalozenie Z-Q6-1.

ZNALEZISKO: `domain/trade.rs` liczy dochod trasy inaczej niz pin (interpolacja zamiast krzywych `handel_szlaki`, brak x2 miedzy ownerami, brak `ceil/2`). Wejscia ticku liczy nowy modul wg pinu; `trade.rs` zostaje dlugiem -Q7.

TESTY:
* `cargo test --test p6_adv_q6_wire`: 2/2; 295 scenariuszy z URUCHOMIONEGO weba (1049 tickow, w tym owner -1/-99, leczenie, warianty econ-params), bit w bit.
* Weryfikator `verify-p6-adv-q6.py` (`python3 -I`): 13 901 sprawdzen, 0 rozbieznosci, kontrola negatywna 2/2.
* Mutacje: 70, zabitych 65, rownowaznych 4 (dowody w doc sek. 6), 1 COMPILE; brutto 65/69 = 94,2%.
* Bramki (logi z jedna linia `EXIT=`): fmt EXIT=0, clippy `-D warnings` EXIT=0, pelny `cargo test -j 2`: 2057 passed / 0 failed (baza 2055/0 z Q5 + 2 nowe; PRZED nie mierzono ponownie), `git diff --check` czysty.

BLOKADY: brak. NIE_ZMIERZONO: PRZED w tym samym worktree (przyjeto baze z Q5). Mutacje W01/W02 uruchomiono przed refaktorem `wonder_bonus_active` (clippy), semantyka identyczna; generator przepisuje sklejke `main.ts` (nieimportowalny), oznaczone numerami linii. Nieskomitowany `rust-port/engine/Cargo.lock` (artefakt cargo) pominiety.

RUNDY: 1/5

NASTEPNY KROK: Evaluator R1 (sprawdzic: zgodnosc przepisanej sklejki generatora z `main.ts`, zalozenia Z-Q6-1..7, podzial dlugu -Q7).

DEPLOY/PUSH: NIE WYKONANO
