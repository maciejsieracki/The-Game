STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TOWER-TARGET-Q1
GOAL: wolanie `pick_tower_target` z produkcyjnej petli oblezenia (SiegeLoop, FireSiegeTowers), bez strzalu wiez (#96)
ZMIANY/COMMIT: kod operatora 786f049c5 (siege_tactics_loop.rs, tests/p6_tower_target_wiring.rs); obrona aa6641acd (tylko 02a-obrona.md). Baza 23e33793e jest przodkiem aa6641acd i 786f049c5 (zweryfikowane). Diff wzgledem bazy: 3 pliki, wszystkie w allowliscie albo raporty rol. Brak Cargo.lock, gra/, #[ignore].
TESTY (odtworzone samodzielnie na aa6641acd): cargo fmt --check 0; clippy --all-targets -D warnings 0; cargo test --lib 99 ok; p6_tower_target_wiring 2 ok; p6_siege* EXIT 0, 0 failed.
BLOKADY: brak
RUNDY: FC r2 / 5
NASTEPNY KROK: integracja orkiestratora; decyzje czlowieka nizej

## Rozstrzygniecie zarzutow
1. Brak generatora/straznika SHA: ODDAL. Istnieje `p6_tower_target_gen.mjs` (b2e284cf1) ze straznikiem SHA-256 fragmentow pinu (pickTowerTarget, _fireSiegeTowers, _destroyTowerAtRow); meta vectors.json niesie fragmentSha256. Nota: filtr wrogow z `_fireOneTower` (!dead && !fadingOut && !routed && !removed) NIE jest pod strazniem ani w wektorach; test pokrywa tylko `dead`. Pokrycie fading_out/routed/removed do dopisania (DO DECYZJI CZLOWIEKA, nizej).
2. Wiazanie martwe w produkcji: ODDAL. Cala SiegeLoop nie ma jeszcze wolajacego poza testami (#113); sciezka produkcyjna = apply(FireSiegeTowers) w siege_tactics_loop.rs (ok. :306), pin battleScene.ts `_fireOneTower` :4226-4234, `_beginTurn` :5643. `tower_targeting=None` domyslnie = zachowanie sprzed zmiany. Dokladny numer pinu: pick jest w `_fireOneTower` (:4230), nie w `_fireSiegeTowers`.
3. Kolejnosc wzgledem pinu: ODDAL. Pin planuje pick przez `_schedule(0)` (vTimers), wiec po synchronicznym `_beginTurn`; LoopBody::start dostaje &TurnSeqState (nie moze zmienic wrogow), a pick czyta tylko hp/flagi. Brak testu ze zmiana stanu przed pickiem: ograniczenie, nie blad.
4. Stub env.tower przed pickiem: ODDAL. Stub dotyczy jednostki self.tower, nie wiez obroncy; zakres #96.
5. Wiele wiez / stagger 180 ms / jeden wpis tower_log: ODDAL do #96 (jawnie poza GOAL).
6. atk_pos statyczne: ODDAL do #113 (CombatUnit bez wspolrzednych; poza allowlista).
7. 01-operator-r1.md nadpisal raport poprzedniego tematu: ODDAL (poprzednia tresc w ed70002a1); do potwierdzenia przez orkiestratora, ze zakres to wpiecie.
8. Co-Authored-By vs dispatch: ODDAL; dispatch ma priorytet, SHA nie zmieniany.

Zero zarzutow NAPRAW.

## DO DECYZJI CZLOWIEKA
- Czy dopisac (w #96) wektory/test filtru fading_out/routed/removed oraz straznika SHA fragmentu `_fireOneTower`.
- Czy zakres "wpiecie w SiegeLoop z opcjonalnym tower_targeting" wystarcza do zamkniecia #116 (realna aktywacja dopiero w #113/#96).
- Archiwizacja nadpisanego 01-operator-r1.md poprzedniego tematu.

DEPLOY/PUSH: NIE WYKONANO
