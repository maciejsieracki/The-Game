# 02 — Evaluator (Sonnet, adwersarialny): ZDOBYCIE-MIASTA-ROZPOZNANIE (#175 / #115), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1
GOAL: Ocenić rzetelność `01-rozpoznanie.md` (commit `92393c2c1`): 5 wybranych odwołań (web i Rust) potwierdzić lub obalić oraz sprawdzić zakres commitu.
ZMIANY/COMMIT: tylko ten plik (`02-evaluator.md`). Zero zmian w `gra/` i `rust-port/`. Brak push.
TESTY: NIE_ZMIERZONO — tryb wyłącznie odczytu (`git show`/`git grep`), bez `cargo`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (Haiku) poprawia odwołania z zarzutów 1-3 i uzupełnia zakres z zarzutu 4; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Baza

- Web: pin `07d2fbd72`. Rust: `origin/rust-port/parity-v2` = `d5a52a980ecdb9e4ea7b750f2121cad41e191b72` (zgodne z dispatchem).
- Commit operatora `92393c2c1` (rodzic `9cbadc54a`).

## Zakres commitu (sprawdzone)

`git show --name-status 92393c2c1` → jeden wpis: `A dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1/01-rozpoznanie.md`. Zero zmian w `gra/`, `rust-port/` i poza katalogiem runu. Allowlista spełniona. Trailery `Co-Authored-By: Claude Haiku 5.5` i `Claude-Session` obecne. Nazwa pliku zgodna z dispatchem.

## Sprawdzone odwołania (5 wybranych + kontrole dodatkowe)

| # | Odwołanie z raportu | Wynik |
|---|---|---|
| A | WEB: `runCapitalCapturePlunder` def `main.ts:35558`, wołający `main.ts:17828` (kapitulacja głodowa) i `main.ts:36221` (bitwa) | POTWIERDZONE (`git grep -n` na pinie). Dodatkowo: `applyCapturePopulationLoss` def `cities.ts:1235`, wołający `post-battle-map.ts:508` i `main.ts:17700`; `applyCityCaptureAfterBattle` `post-battle-map.ts:493`, wołany `main.ts:36061`; zapis zdobyczy `main.ts:35675`, odczyt `:2779`; `eliminateOwner` def `:35348`, wywołanie `:35769` — wszystko zgodne. |
| B | RUST: `run_capital_capture_plunder` `siege_capital_plunder.rs:504` bez wołającego w produkcji | POTWIERDZONE. `git grep` po `rust-port/engine/src` (bez `tests/`): zero wołających; jedyne wystąpienia to definicja, komentarze (`:27`, `:580`, `:659`) i opisy w `siege_transfer.rs:188` („wolajacy niepodpiety - W8”) oraz `siege_surrender.rs:39`. Brak wołających także w innych katalogach `rust-port/` (listing `git grep -l` pokazuje tylko `engine/src/domain/*` i `engine/tests/*`). |
| C | RUST: `apply_transfer_with_effects` `siege_transfer.rs:340`, wołający tylko testy; `apply_capture_population_loss` wołany `:360`; `apply_post_capture_law_on_capture` `:374`; `found_by_owner = Some(false)` `:392` | POTWIERDZONE (linie zgodne co do jednej; `apply_transfer` `:316` też bez wołającego w produkcji). |
| D | RUST: dwa akumulatory zdobyczy Power — `PlunderState::zdobycze_power_by_owner` (`siege_capital_plunder.rs:458`, zapis `:611-615`) vs `WarTurnState::zdobycze_power_by_owner` (`war_turn_state.rs:145`, zapis tylko przez `record_capture_power_gain` `:654` ← `PlayableState::power_record_city_capture` `playable.rs:631`) | POTWIERDZONE. `git grep` po `record_capture_power_gain|zdobycze_power_by_owner` w `engine/src`: brak mostu między mapami; `power_record_city_capture` bez wołającego (doc `playable.rs:629-630`). Rozbieżność realna. |
| E | RUST: `eliminate_owner` `eliminacja.rs:48` bez wołającego w produkcji; `power_clear_eliminated_owner` wołany `eliminacja.rs:66` (def `playable.rs:643`) oraz niezgodność ze statusem „completed” #114 | POTWIERDZONE co do kodu: `git grep eliminate_owner` w `engine/src` zwraca tylko definicję i wzmianki w dokumentacji. Jedyny wołający `power_clear_eliminated_owner` to `eliminate_owner`. Uwaga: ocena statusu #114 nie wynika z kodu (możliwe, że „completed” oznaczało zakres domenowy) — raport słusznie zostawia to orkiestratorowi. |

Dodatkowo potwierdzone: `combat::resolve_combat` `combat.rs:321` i `combat::resolve` `:381` — jedyni wołający to `rust-port/engine/tests/combat.rs`; w `src` brak. `handle_siege_capitulation_phase` `siege_surrender.rs:119` woła tylko `surrender_tick_action` (`:149`), a ten tylko testy (blok `#[cfg(test)]` od `:223`). `siege_wonder_watch.rs:61` (`plan_wonder_transfers`) i `:106` (`apply_wonder_transfers`) zgodne. Nazwa `applyCaptureTransfer`: `git grep -i capturetransfer` na pinie (`gra`) → zero trafień; teza raportu (krok 20 NIE_ZMIERZONO / nie istnieje) POTWIERDZONA.

Wniosek główny raportu („0 z 20 kroków zintegrowanych w produkcji”) jest zgodny z kodem.

## Zarzuty (ponumerowane)

1. **Błędne odwołanie web, krok 15 (`noteCityCapture`).** Raport podaje „`main.ts:17830+`”. Na pinie `noteCityCapture(...)` jest w `main.ts:17706` (kapitulacja głodowa) i `main.ts:36047` (bitwa). Wskazanie 17830+ nie wskazuje wywołania. Rust: wpis w `TRANSFER_EFFECTS` jest na `siege_transfer.rs:95-100` (nie `:50`; `:50` to początek tablicy), a konkretna funkcja to `siege_transfer_q5::note_city_capture` — raport jej nie nazywa.
2. **Błędne/rozmyte odwołanie web, krok 16 (wonder watch).** Raport: „`main.ts:17820`, `:17834` okolice”. Realnie `beginWonderTransferWatch()` w kapitulacji = `main.ts:17698`, `settleWonderTransfer` = `:17705` (definicje `:4232`/`:4240`); w bitwie `:36060`/`:36089`. Podane linie 17820/17834 nie zawierają tych wywołań; „okolice” w dokumencie odniesienia jest niedopuszczalne przy wymaganym plik:linia. Wrappery Rust: `siege_wonder_wrappers.rs:45` i `:107` — raport podaje tylko nazwę pliku.
3. **Niedokładne odwołanie web, krok 13 (`recordCityCaptureEvent`).** „`main.ts:17830+`” — realnie wywołania: `main.ts:17848` (kapitulacja), `:35647` i `:35724` (wewnątrz plundera), `:36249` (bitwa); def `:10650`. Wymagany precyzyjny zapis.
4. **Luka zakresu web: pominięte inne ścieżki zmiany właściciela miasta.** Raport pokrywa tylko bitwę i kapitulację głodową. Na pinie ten sam wzorzec wonder watch + `clearCityStateFlagOnCapture` występuje przy aneksji (`main.ts:35272-35287`), cesji (`:36478-36484`), buncie/rebelii (`:39563-39568`) i forcie (`:16116-16124`). Raport nie mówi, że nie są objęte ani czy są częścią #115/#175 — brakuje jawnego wpisu o wyłączeniu z zakresu (albo w NIE_ZMIERZONO). Nie podważa wniosku głównego, ale tabela sugeruje kompletność „ścieżki zdobycia miasta”.
5. **Pominięta niespójność dokumentacji w kodzie.** `siege_surrender.rs:37` w tabeli nadal podaje wonder wrapper jako „BRAK (wrapper)”, mimo że `siege_wonder_wrappers.rs` istnieje (Q9) i jest w `mod.rs:133`; `playable.rs:630` przypisuje brak wołającego `power_record_city_capture` do tego, że „`apply_transfer_with_effects` nie jest wołany”, choć ta funkcja go nie woła (nie ma w jej ciele takiego wywołania — wołający jest osobnym brakującym elementem, a nie skutkiem). Raport powinien wskazać obie rozbieżności jako stale komentarze, żeby temat wpięcia (#115) nie opierał się na nich.
6. **Kolejność kroków (niedomówienie NIE_ZMIERZONO).** Raport sam przyznaje, że nie porównał linia po linii kolejności `main.ts:17700-17880` z `apply_transfer_with_effects`; mimo to w tabeli kroki 5-6 mają status „ZINTEGROWANE wewnątrz funkcji”. Status „ZINTEGROWANE” bez porównania kolejności i wartości to za mocne sformułowanie; raczej „ISTNIEJE (zgodność NIE_ZMIERZONO)”. Uwaga drobna (nie blokuje).

Zarzuty 1-3 dotyczą wymaganej dokładności odwołań plik:linia; 4-6 kompletności i terminologii. Żaden nie obala wniosków głównych (0 wołających w produkcji; dwa akumulatory Power; brak `applyCaptureTransfer` w pinie).

## Werdykt

PASS-WITH-NOTES. Wnioski rozpoznania potwierdzone dla 5 wybranych odwołań i kontroli dodatkowych; zakres commitu poprawny (wyłącznie katalog runu). Do poprawy przed FC: odwołania z zarzutów 1-3, jawna adnotacja o zakresie (zarzut 4), uwaga o stale komentarzach (zarzut 5), złagodzenie statusu „ZINTEGROWANE” (zarzut 6).
