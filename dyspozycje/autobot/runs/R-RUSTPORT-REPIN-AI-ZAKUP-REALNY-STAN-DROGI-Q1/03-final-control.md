STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1
GOAL: REPIN web FALA 589-596: (a) AI kupuje jednostki wg realnego stanu surowcow; (b) drogi gracza = drogi AI.
ZMIANY/COMMIT: oceniony 6b54dc1f3 (rodzic 390265868, potomek 6d74770df = origin/rust-port/parity-v2; 9 plikow, tylko allowlista). FC dodaje tylko ten plik.
TESTY (zmierzone przez FC na 6b54dc1f3): rustfmt --check nowych plikow PASS; clippy --lib --test p6_repin_ai_zakup_needs --test p6_repin_ai_zakup_rezerwa -D warnings PASS; cargo test --lib 22/0; p6_repin_ai_zakup_needs 2/0; p6_repin_ai_zakup_rezerwa 5/0; 0 nowych #[ignore]. Baseline sprzed zmiany: nie mierzony (zmiana addytywna, 1 linia pub mod).
ZARZUTY R1:
1 (GOAL a nie zrealizowany): ODDAL dla R1 (port + 248 wektorow z weba zrobione w R2); reszta -> NAPRAW (p.A).
2 (NIE_ZMIERZONO drogi): ODDAL czesciowo - R2 zmierzyl: siec AI = plan_road_network uzywa hex_has_road, nie is_road_qualified; gracz DROGA = is_road_qualified. Zgodnosc z webem (road-network-plan.ts vs improvement-build.ts:956-1053) niezmierzona -> NAPRAW (p.B).
3 (baseline): ODDAL - dotkniete cele zielone, zmiana addytywna.
4 (wektory): ODDAL - wygenerowane z prawdziwego weba, generator w repo.
5 (dokladnosc tabeli): ODDAL - uzupelnione w R2.
NAPRAW:
A. (a) wiazanie zakupu AI w ai_turn.rs nie istnieje: ai_resource_needs ma 0 konsumentow poza mod.rs; ai_turn.rs nie ma kroku zakupu/rekrutacji. Dispatch wymaga (a) "w pelni"; odlozenie na partie 2 nie spelnia kryterium. Wymagany test p6_repin_ai_zakup_* z wiazaniem (kupno wg realnego magazynu + should_ai_purchase_unit + needs).
B. (b) porownanie plan_road_network z webem i regulami gracza (improvement-build.ts:956-1053); ewentualna korekta rozjazdu hex_has_road vs is_road_qualified, z wektorami.
BLOKADY: brak.
RUNDY: 2/5 (FAIL, wraca do tego samego ID)
NASTEPNY KROK: runda 3 od SHA do integracji (niżej) - A i B, partie <=600 LOC.
SHA DO INTEGRACJI/BAZY R3: commit tego pliku (potomek 6b54dc1f3). Kolejnosc wzgledem origin/rust-port/parity-v2 (6d74770df): 390265868 -> 6b54dc1f3 -> commit FC, liniowo; integracja dopiero po PASS.
DEPLOY/PUSH: NIE WYKONANO
