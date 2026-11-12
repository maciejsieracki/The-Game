STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1
GOAL: produkcyjne ciało jednostki pętli taktycznej (K5H/K5I) zgodne z pinem, z wektorami z pinu
ZMIANY/COMMIT: SHA oceniany 81035eb2f (K5LOOP-BODY r2 obrona). Ancestry: 1381cfb44 -> 81035eb2f TAK (merge-base --is-ancestor). Diff vs baza: siege_tactics_loop.rs, tests/p6_siege_tactics_loop_body.rs, 01-operator-r2.md, 02a-obrona.md. Allowlista OK, gra/, data/, Cargo.*, WERSJE.md nietknięte, brak #[ignore]. Generator i vectors.json bez zmian.
TESTY (odtworzone samodzielnie): cargo fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 88/88; p6_siege_tactics_loop 4/4; p6_siege_tactics_loop_body 4/4.
BLOKADY: patrz werdykty niżej.
RUNDY: 2/5 zużyte; następna r3.
NASTĘPNY KROK: runda 3 (ten sam ID), baza = SHA tego raportu (zawiera 81035eb2f).
DEPLOY/PUSH: NIE WYKONANO

WERDYKTY ZARZUTÓW
1. Brak wektorów z pinu dla ciała (B, >=200 sekwencji) — NAPRAW. Część B to jawny wymóg r2; dispatch dopuszczał częściowość tylko z wektorami dla tego, co zgodne; dostarczono 0 wektorów. Zielone bramki nie dowodzą zgodności z pinem.
2. Tautologiczny test cios_w_zwarciu — ODDAL. Obrona przemianowała test na test okablowania i dodała asercję kontrataku; nie jest już dowodem zgodności numerycznej (ta = zarzut 1).
3. Pozorne pokrycie (C): brak wektorów moveLeft>0 i asercji trace pinu — NAPRAW (wymóg r2 C niespełniony). Podpunkt "removed nieobsługiwane w start" — ODDAL (pin battleScene.ts:6048-6050 sprawdza dead/fadingOut; removed odfiltrowane wcześniej).
4. Wąski zakres ProdBody (brak efektów _resolveBlowOutcome, doktryny, strzelca, muru, ucieczki; cel melee i body_ms z adaptera) — ODDAL: zakres częściowy jawnie dopuszczony w r2 i opisany w unported; kontratak udokumentowany jako nieportowany. Brak wiringu do pełnej SiegeLoop — ODDAL (osobny temat).
5. Wieże/taran bezczynne bez muru — ODDAL (pin ma guardy siegeWallCol>=0, battleScene.ts:8023/8057/8088). surroundApplied bez wektora — ODDAL do tematu wektorów (część zarzutu 1).
6. Cel czytany w complete zamiast w BLOW_HIT_T — ODDAL jako osobny temat timingu, NIE_ZMIERZONO.
7. (B),(C) NIE_ZMIERZONO — NAPRAW (jak 1 i 3).

DO DECYZJI CZŁOWIEKA: brak.
Instrukcja r3: rozszerzyć generator o wykonanie tekstu pinu _activateUnit/_singleBlow z prawdziwymi funkcjami boju (RNG deterministyczny, rendering stub), >=200 sekwencji (stan końcowy + trace), wektory moveLeft>0 i trace dla fadingOut/dead/routed; rozbieżności Rust<->pin naprawiać w sterowniku. Jeśli pełna zgodność niemożliwa — wektory dla zgodnego podzbioru + lista rozbieżności z numerami przypadków.
