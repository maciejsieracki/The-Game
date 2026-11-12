# 02a — OBRONA Operatora — R-RUSTPORT-P6-R7K7B-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7B-Q1
GOAL: domknięcie zarzutów Evaluatora wobec kodu 91d2bc5aa (deactivateZlozeGrantsForDeal, syncRelationFromDeals, wektory pinu 07d2fbd72).
BAZA: 91d2bc5aa (kod Operatora r1). Commit obrony: patrz sekcja SHA.
RUNDY: 1/5 (obrona w rundzie 1, bez nowego FAIL).

## Odpowiedzi na zarzuty

1. **P7 (Wiarygodność) nie dostarczone — PRZYJMUJĘ.**
   Zweryfikowane: `dyspozycje/PROJEKT-WIARYGODNOSC-CYWILIZACJI.md` ma tabelę P1–P5 (l.123–127). Przebudowa strony pozytywnej (l.1613+, „ZASTĘPUJE TABELĘ P1–P5") ma tabele A (S1–S4), B (P1–P3) i C (P4, P5). Nie ma P6 ani P7 (grep `\bP[67]\b`: zero trafień).
   „P7” na pinie to `applyDiploP7Bonuses` (`gra/src/main.ts:11778`): bonus **Zaufania** za wymianę „na plusie” (schodki, limit +5/turę, sufit 60), NIE reguła Wiarygodności.
   Brak specyfikacji P7 wiarygodności = decyzja ABC orkiestratora/właściciela. Operator nie implementuje.

2. **D3 `tickCyclicResourceTradeDeals` bez wektorów — ODRZUCAM jako wymóg tej rundy; PRZYJMUJĘ jako fakt.**
   Dispatch, punkt (3) „wektory z pinu”, wymienia wyraźnie trzy cele: P7, deactivateZlozeGrantsForDeal, syncRelationFromDeals. D3 pojawia się w GOAL tylko jako kontekst luk z R7K7. Brak wektorów D3 jest faktem (NIE ZROBIONE w tej rundzie). D3 w Rust (`turn_war_dipl_steps.rs:449`) jest pokryty testami zachowania w `p6_wire_war_dipl_steps.rs`, a nie wektorami pinu; nagłówek tego pliku sam to stwierdza (l.5). Dług „wektory D3” zostaje do wpisu w rejestrze.

3. **Brak wołających deactivate_zloze_grants_for_deal / sync_relation_status_from_deals — PRZYJMUJĘ (bez zmiany kodu).**
   Zweryfikowane `git grep`: wołające tylko w teście `p6_r7k7b_zloze_sync.rs`. Wpięcie wymaga stanu `zlozeGrants` i zapisu relacji, czyli poza allowlistą i poza zakresem „czysta funkcja”. Zależność do wpisu: R7K7-C (efekty dyplomacji na PlayableState) i właściciel stanu.

4. **Pokrycie wektorów sync: brak `prawo_wojskowe_przemarszu`, `umowa_handlowa` i pary a==b — PRZYJMUJĘ, NAPRAWIONE.**
   Przed poprawką (sprawdzone na 91d2bc5aa): rodzaje w 240 przypadkach = 9 z 11 (brak `prawo_wojskowe_przemarszu` i `umowa_handlowa`), a==b = 0.
   Poprawka w `rust-port/engine/tests/p6_r7k7b_zloze_sync_gen.mjs`:
   - dodano oba rodzaje do `KINDS` (oba obecne w `RodzajTraktatu` pinu, `gra/src/types/diplomacy.ts` l.22, l.24);
   - dodano 24 przypadki a==b (`sync-same-*`), ~20% traktatów dla pary (a,a).
   Wynik po regeneracji: sync = 264 (wszystkie 11 rodzajów, po 38–56 wystąpień; a==b = 24). Deactivate = 200 bez zmian (`deactivate` identyczne z poprzednią wersją, PRNG przed sekcją sync nie zmieniony).
   Test `p6_r7k7b_zloze_sync` (3 passed, 0 ignored) przechodzi na nowych wektorach.

5. **Domyślna ścieżka typescript `/opt/node22/...` — PRZYJMUJĘ, NAPRAWIONE.**
   Generator przyjmuje ścieżkę w argumencie 3 (jak poprzednio), potem zmienną środowiskową `TYPESCRIPT_JS`, dopiero na końcu domyślną. Przed rozszerzeniem o przypadki a==b wygenerowane wektory z podaną ścieżką były identyczne bajt w bajt z zapisanymi (`cmp` IDENTICAL).

6. **Rust zwraca tylko status; zapis przez `setDiploRelation({...rel, status})` — PRZYJMUJĘ jako udokumentowaną granicę wycinka.**
   Bez zmiany kodu. Atrapy harnessu: `getDiploRelation`, `setDiploRelation`, `activeDeals` (zmienne closure), zgodnie z nagłówkiem generatora.

## Bramki (ta runda obrony)

- `cargo test --test p6_r7k7b_zloze_sync` (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo): EXIT 0, 3 passed, 0 ignored.
- Generator z pinem 07d2fbd72 (`git archive`, straznik SHA-256 OK): `OK deactivate=200 sync=264`.
- Pełny `cargo test`, `cargo fmt`, `clippy` NIE uruchamiane w tej obronie (zmiany tylko w generatorze .mjs i wektorach JSON; kod Rust bez zmian). Pełny cargo test: NIE_ZMIERZONO (runda integracyjna).

## Dług i zależności do rejestru

- P7 wiarygodności: decyzja ABC (wymagana specyfikacja).
- Wektory D3 `tickCyclicResourceTradeDeals`: NIE ZROBIONE.
- Wpięcie `deactivate_zloze_grants_for_deal` / `sync_relation_status_from_deals`: zależne od R7K7-C.
- Cargo.lock: nie commitowany.
