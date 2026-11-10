STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1
GOAL: Runda 4 (ten sam ID): domknięcie pomiaru per symbol z rundy 3 i odpowiedź na zarzuty. Zmiana dokumentacyjna, bez kodu Rust i bez zmian w gra/**.
BAZA: 6cdf580a1 (runda 3, lokalny commit; nie ma go na zdalnej gałęzi). Kod P2: d56ccdc4f. Pin web: a61337844.
ZMIANY/COMMIT: commit tej rundy (SHA w sekcji DEPLOY/PUSH orkiestratora, patrz `git log -1`). Pliki:
- dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-ZDOBYCZE.md (wiersze sekcji 1 zaktualizowane; punkt o pomiarze w sekcji 4; nowa sekcja 5)
- dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1/04-operator-r4.md
Kod Rust, testy, Cargo.toml, gra/**, WERSJE.md: bez zmian.

POMIAR (sekcja 5.1 pliku P6, dowód plik:linia i grep):
- siegeDefenders.ts (411 LOC): Rust CZĘŚCIOWY (tylko parametry w data/units_combat.rs:251-252), logika BRAK.
- siegeAi.ts (292 LOC): Rust CZĘŚCIOWY (tylko siege_ai w data/units_combat.rs:296), logika BRAK.
- wieża oblężnicza = wyłom (battleScene.ts:4116,7234,7468,7662,8263): BRAK.
- BATTLE_MAX_PER_SIDE=500 (battleScene.ts:711-715) i battleReserveNotice (post-battle-map.ts:64): BRAK.
- aneksja miasta-państwa, applyAnnexCityStateSpoils (capital-capture.ts:293, main.ts:33671): BRAK spoils; zgodność mechanizmu ProposalAction::Annexation NIE_ZMIERZONO.
- wonder-transfer (wonder-transfer.ts:47,57,81; main.ts:4140): BRAK.

TESTY: brak zmian kodu w tej rundzie, testów nie uruchamiano. Wyniki r3 NIE powtórzone: p6_oblezenie_wejscie 15 passed, p6_oblezenie_wypad 27 passed (raport r3). `git diff --check` na plikach rundy: czysto.

ODPOWIEDZI NA ZARZUTY:
1. Pomiar per symbol NIE_ZMIERZONO: PRZYJMUJĘ. Pomiar wykonany (sekcja 5.1). Pozostają NIE_ZMIERZONO: wartości parametrów (JSON vs web) i zgodność mechanizmu aneksji.
2. Brak baseline cargo test 2155/0 i cargo-mutants: PRZYJMUJĘ jako dług. Nie uruchomiono: dysk 2,9 GB (próg 8 GB dla nowych startów Rust wg CLAUDE.md, 1,5 GB wg dispatchu). Długi: R4-BASE-1, R4-MUT-1.
3. Wektory Node nieodtwarzalne z repo: PRZYJMUJĘ jako dług R4-VEC-1. Generator i surowe wyjście nie są w repo. Node v22.22.0 jest dostępny, ale importy weba bez rozszerzeń .ts wymagają loadera. Termin: partia P3.
4. Sortowanie ID (bajty vs UTF-16): ODRZUCAM jako nieosiągalne. Generatory ID to ASCII: main.ts:4387 ('prod_'+turn+'_'+cityId+'_'+base36), main.ts:10539 ('diffbonus_'...). Zastrzeżenie: sprawdzono dwa generatory znalezione grepem.
5. Moduły P2 nie podpięte do tiku: ODRZUCAM jako zarzut tej partii. Zakres r3 to port 1:1 i testy. Podpięcie do tiku i handleSiegeCapitulationPhase jest długiem z dispatchu. Dowód: `git grep -n 'siege_enter_city\|siege_sortie' rust-port/engine/src` znajduje tylko domain/mod.rs i testy.

BLOKADY:
1. R4-BASE-1: pełny baseline cargo test --no-fail-fast (2155/0): NIE_ZMIERZONO (dysk).
2. R4-MUT-1: cargo-mutants ≥85%: NIE_ZMIERZONO.
3. R4-VEC-1: generator wektorów w repo: dług.
4. Wartości parametrów siegeAi/siegeDefenders vs JSON: NIE_ZMIERZONO.
5. Mechanizm aneksji (ProposalAction::Annexation vs applyAnnexCityStateSpoils): NIE_ZMIERZONO.
6. Logika siegeDefenders, siegeAi, wyłom, BATTLE_MAX_PER_SIDE, battleReserveNotice, wonder-transfer: BRAK (dług portu, kolejne partie).
7. Podpięcie P2 do tiku silnika: dług integracji.

RUNDY: 4/5. Ten sam ID.

NASTĘPNY KROK: runda 5 albo partia P3 (wonder-transfer, czysty i mały, lub siege_state/siege_forecast) z testami N-1/N/N+1/NaN i mutacjami, razem z R4-VEC-1 jeśli zmieści się w 600 LOC. Dysk przed startem: ≥ 8 GB dla kodu Rust.

DEPLOY/PUSH: NIE WYKONANO
