# R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 — Evaluator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R7K7C-WIRING (#106) — rozpoznanie wpięcia `apply_dipl_deltas_to_state`
GOAL: zweryfikować adwersarialnie raport Operatora `01-operator-r1.md` (commit 9be44a148) względem pina 07d2fbd72 i bazy 6acb1d81b.
ZMIANY/COMMIT: tylko ten plik (commit bez push na `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1-eval`, od 9be44a148).
TESTY: bramki cargo (fmt/clippy/test --lib) NIE URUCHAMIANE: `git diff --stat 6acb1d81b 9be44a148` = 2 pliki .md (+208), zero zmian w `rust-port/**`, `gra/**`; baza jest przodkiem. Kod identyczny z bazą, więc wynik bramek nie zależy od tego commitu. `git diff --check` = kod wyjścia 0.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (zarzuty 1-3), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Sprawdzone i potwierdzone

- Allowlista: diff to wyłącznie raport i `dyspozycje/rust-port/p6/...Q1.md`; brak zmian kodu, brak `#[ignore]`/osłabionych asercji (nie dotyczy).
- `git grep apply_dipl_deltas_to_state 6acb1d81b -- rust-port`: tylko definicja (`turn_war_dipl_steps.rs:1031`) i testy. Brak wołającego produkcyjnego: POTWIERDZONE.
- `playable.rs:1194` `run_war_turn(...)?;` odrzuca raport; migawki w `advance_turn` obejmują tylko kolejkę i `war`: POTWIERDZONE.
- Pin: `add` (main.ts ok. 22640-22643) z `?? 0` dla AI, `ownerTreasury` (34864-34866), `ownerPracaPool` (34876-34878), `aiSkarbiecByOwner.delete` (35380), `aiSkarbiecByOwner.set` (38978): POTWIERDZONE (numery linii zgodne w przybliżeniu ±3).
- Wektory: `payments.json` ma 203 przypadki, 119 ze zmianą salda (policzone własnym skryptem): POTWIERDZONE.
- Rekomendacja A (brak = 0) jest zgodna z zasadą 9 w części skarbca AI (`?? 0` w pinie).

## Zarzuty

1. **Pominięte: `report.city_resources` także jest odrzucane.** `WarTurnReport.dipl.city_resources` (`turn_war_dipl_steps.rs:136`, ustawiane `:1009`; modul-doc `:42-44`: "zapasy miast ... NIE sa stosowane do PlayableState") niesie stan zapasów miast po D3 (cykliczne dostawy surowców). Operator w pkt 3 wiąże tylko skarbce i Pracę. Bez zapisu zapasów miast wpięcie zostawia D3 w połowie: złoto/Praca za dostawę są zapisane, a sam surowiec nie przechodzi między miastami. Temat WIRING-IMPL musi to ująć (lub jawnie rozdzielić) i dodać `economy.city_stock` do allowlisty/stanu. Podobnie `barbarian_grace`, `credibility_requests`, `tribute_breaks`, `truce_pairs_changed` w raporcie ("do zastosowania przez wołającego") — Operator nie sprawdził, które z nich już ktoś stosuje.

2. **Błędna lokalizacja przepływu Pracy w tabeli (wiersze 6-7) i pominięta rozbieżność kolejności zaokrąglenia/podłogi.** `tickDiplomacyPayments` w pinie (`diplomacy-economy.ts:78-126`) jest wyłącznie złotem (brak Pracy). Praca w D-krokach pochodzi z D3, `applyCyclicDeliveryOutcome` (`main.ts:23988`, Praca przy `:24021-24023`: dwa wywołania `setOwnerPracaPool`, każde z `Math.max(0, ...)`). Pin podłogowuje pulę po KAŻDYM kroku i kolejne umowy czytają już podłogowany stan; Rust (`turn_war_dipl_steps.rs:410-415`) trzyma `ledger.praca` bez podłogi, a `apply` nakłada podłogę raz na sumie delt. Przykład: pula 5, umowa 1 płaci 10 (pin: 0), umowa 2 otrzymuje 10 (pin: 10; Rust net: 5). Operator wspiera wniosek o wektorach Pracy, ale NIE wykrył tej rozbieżności; test wektorowy Pracy z pinu musi ją pokryć (sekwencja wielu umów na jednej puli), a poprawka może wymagać podłogi w `Ledger` zamiast w `apply`. To zmienia zakres tematu VEC-PRACA (nie tylko "nowy plik wektorów").

3. **Rekomendacja A bez rozróżnienia gałęzi człowieka i mocno niepełny opis zakresu "brak = 0".** Pin dla człowieka robi `playerStateByHuman.get(id)!` (wyjątek przy braku), nie `?? 0`. Raport sugeruje, że parytet dotyczy "każdego miejsca"; faktycznie `?? 0` dotyczy tylko AI. Dla Pracy w pinie `ownerPracaPool` człowieka to `pracaPoolByHuman.get(id)!.praca`, w Rust `praca_pool_by_owner` ma obsłużyć też gracza (`turn_war_inputs.rs` eksportuje wszystkie wpisy) — mapowanie człowieka do puli Pracy nie zostało sprawdzone (NIE_ZMIERZONO w raporcie dotyczy tylko id w wektorach). Dodatkowo `HumanOwnerInAiTreasury` (`turn_war_inputs.rs`) pozostaje w sprzeczności z "wpis AI tworzony z 0" dla gracza: do ujęcia w tematach PARYTET-BRAK-WPISU.

4. **(Drobne) Proces.** Commit operatora ma w trailerze nazwę modelu (`Co-Authored-By: Claude Haiku 5.5`), a dispatch mówił "bez nazwy modelu w treści"; trailer jest jednak wymagany przez politykę atrybucji sesji — do rozstrzygnięcia przez orkiestratora, bez wpływu na treść raportu. Operator nie uruchamiał cargo z powodu dysku 2,1 GB; sprawdziłem: wolne ok. 10 GB, ale zmian kodu brak, więc nie wymagane.

5. **(Drobne) Dwie identyczne kopie raportu** (`01-operator-r1.md` i `p6/...Q1.md`, po 104 linie) — zgodne z dispatchem, ale warto zaznaczyć, że przyszłe poprawki trzeba nanosić w obu.

## Ocena

Rdzeń rozpoznania (brak wołającego, odrzucony raport, `?? 0` dla AI w pinie, 203/119 wektorów, rekomendacja A dla skarbca AI) jest poprawny i zgodny z dowodami. Zarzuty 1-3 są merytoryczne dla zakresu tematów wykonawczych (a nie dla samego faktu rozpoznania), stąd PASS-WITH-NOTES zamiast FAIL.
