STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1
GOAL: hak wojny P4 note_war_entered w pipeline wojny Rust + test S3 + >=150 wektorow z pinu
ZMIANY/COMMIT: kod operatora beefdec4e, raport 0223d1a2c, obrona 15d85c2ee (SHA koncowy do integracji: brak, FAIL). Ancestry: 237e54526 jest przodkiem 15d85c2ee (zweryfikowane). Diff vs baza: 6 plikow, wszystkie w allowliscie (turn_war_dipl_steps.rs, turn_war_pipeline.rs, tests/p6_cred_wojna.rs, tests/p6_credibility.rs, runs/**); gra/, Cargo.toml, data/ nietkniete.
TESTY (samodzielnie, FC): cargo fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; p6_cred_wojna 7 ok; p6_credibility 15 ok; p6_wire_war_pipeline 7 ok. Pelny cargo test NIE_ZMIERZONO.
BLOKADY: patrz werdykt zarzutow.
RUNDY: 1/5 (FC po obronie r1)
NASTEPNY KROK: runda 2 Operatora, ten sam ID, baza 15d85c2ee.
DEPLOY/PUSH: NIE WYKONANO

## Werdykt zarzutow
1. Brak >=150 wektorow z pinu (pkt 4 dispatchu): NAPRAW. Dispatch dopuszczal "czesc + NIE_ZMIERZONO" tylko przy przeszkodzie, a allowlista wprost dopuszcza nowe p6_cred_wojna* z vectors/gen; "generator to osobny temat" nie jest przeszkoda. Brak tez strażnika SHA-256. Bez wektorow nie ma dowodu parytetu haka z pinem.
2. Test S3 umowa_handlowa: DO DECYZJI CZLOWIEKA. Raport i obrona maja jawny STOP z opisem (stream_kind_of nie produkuje LegacyTradeAgreement, credibility.rs:597-598). Decyzja: alias w adapterze czy uznac wariant za martwy. (Uwaga: wariant da sie przetestowac bezposrednio na StreamDealKind, bez decyzji, o ile wlasciciel tego chce.)
3. Wolania webu 13168/13205 (wypowiedzenie gracza), 23806 (sojusz), 40441 (klaster): DO DECYZJI CZLOWIEKA (poza allowlista: war_turn_declare.rs; czy wpinac w tym temacie czy osobno). 41931 (AI, hamulec D8) wpiete i przetestowane.
4. Guard isBarbarian: ODDAL (naprawione w obronie, test dodany, zgodne z main.ts:12181). Pozostala niepewnosc, czy deklaracje hamulca zawieraja barbarzynce: nieszkodliwa, guard jest.
5. Zmieniona asercja p6_credibility.rs: ODDAL (wyjatek allowlisty, wynika z haka, wzmocniona, nie oslabiona).
6. Kolejnosc D4/D8 a P4: wymaga wektorow z pinu, wchodzi w NAPRAW nr 1.
7. difficulty/excluded_owners: ODDAL (dispatch dopuszcza domyslne z opisem; opisane, brak producenta NOT_IMPLEMENTED).
8. Brakujace testy (may_declare, round-trip, stary zapis): ODDAL (nie dodano nowych pol stanu; KEY_LAST_WAR istnial). Zalecane w rundzie 2 razem z wektorami.

## Decyzje czlowieka
(a) alias umowa_handlowa -> LegacyTradeAgreement: wprowadzic czy pominac.
(b) wpiecie wypowiedzenia gracza (13168/13205) i sojuzu/klastra (23806/40441): w tym temacie czy osobny.
