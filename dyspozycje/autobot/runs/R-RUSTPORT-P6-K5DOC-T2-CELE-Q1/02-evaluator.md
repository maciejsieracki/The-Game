STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T2-CELE-Q1
GOAL: port wyboru celu doktryny (battleScene.ts pin 07d2fbd72) z wektorami
ZMIANY/COMMIT: oceniono e7b9a2f0d (baza 126432304 = przodek; allowlista zachowana, 6 plikow)
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 124 ok EXIT 0; cargo test --test p6_k5doc_target 5/5 ok; generator odtworzony: 2823 przypadki, vectors.json bez zmian (deterministyczny). Pelnego `cargo test --all-targets` NIE powtarzano (NIE_ZMIERZONO; operator zglasza EXIT 0).
MUTACJE WLASNE (wszystkie FAIL): dd==0 usuniete, shootingEnabled usuniete, tie-break HP przylegajacego odwrocony, flaga useGroupPriorities, len==3 priorytetow, dd<1 w ranged_target_in_range, lowestHp odwrocony, useUnitPriorities wylaczone.
PORT vs PIN: linia po linii zgodne (_unitBattleClass, _prefsForUnit, _priorityScore 0.45, _pickTarget/Adjacent/Ranged, _rangedTargetInRange, _targetInRange, _enemiesOf, meleeBlockedByWall game/city-fortification.ts:76-79, canShoot, desiredHitForDirection).
ZARZUTY:
1. (istotny, nie blokujacy) Generator NIE wykonuje pinu: logika to reczna transkrypcja JS, a SHA-256 chroni tylko tekst fragmentow, nie zgodnosc transkrypcji. Dispatch wymagal "z wykonania pinu"; w repo jest precedens (p6_city_towers_gen.mjs i in. uzywaja ts.transpileModule). Oracle i Rust pisal ten sam autor => ryzyko wspolnego bledu. Moja reczna weryfikacja kodu Rust i JS z pinem tego bledu nie wykryla. Zalecenie: nastepna runda/T8 - wykonanie fragmentow pinu przez transpilacje.
2. (drobny) Komentarz generatora twierdzi, ze meleeBlockedByWall nie ma w pinie i jest odtworzony wg Rust; faktycznie jest w gra/src/game/city-fortification.ts:76-79 (zgodny). Fragment nie jest objety straznikiem SHA.
3. (drobny) Literowka "lukti" w doc-komentarzu pick_adjacent_target_by_priority; Cargo.lock nieskomitowany (poprawnie).
4. (informacja) Brak wpiecia w produkcje - zgodne z dispatchem (T8/#113).
NASTEPNY KROK: Obrona Operatora (zarzut 1), potem Final Control
