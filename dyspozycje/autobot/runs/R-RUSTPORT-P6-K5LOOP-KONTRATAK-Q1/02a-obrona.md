STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1
GOAL: obrona Operatora na zarzuty z 02-evaluator.md (runda 1): PRZYJMUJĘ z dowodem (kod + test) albo ODRZUCAM z dowodem
ZMIANY/COMMIT: baza d8fc4b3fd (oceniany kod), commit obrony z poprawką testów: patrz sekcja SHA poniżej. Zmieniony plik: rust-port/engine/tests/p6_siege_tactics_loop_body.rs (+124 linii, tylko testy, allowlista). Kod produkcyjny (siege_tactics_loop.rs), generator i vectors.json NIE zmienione (vectors.json bez zmian, ta sama baza).
SHA: patrz sekcja "Commit" na końcu.

## Odpowiedzi na zarzuty

### Zarzut 1 (pokrycie: routed / fadingOut / hp<=0 w counter_strike) — PRZYJMUJĘ częściowo, ODRZUCAM część
- hp<=0: PRZYJMUJĘ. Dodano test `kontratak_pomijany_gdy_obronca_hp_zero` (obrońca hp=0, dead=false, cios się wykonuje, kontratak nie). Mutacja usunięcia `dc.hp <= 0.0` w counter_strike -> FAIL tego testu (M1).
- routed / fadingOut: ODRZUCAM wymóg wektorów granicznych. Dowód: filtr celu w `start` (siege_tactics_loop.rs, `melee_target.filter(... !e.dead && !e.fading_out && !e.routed)`, ok. linia 667) odrzuca obrońcę routed/fadingOut PRZED ciosem (`krok-naprzod`, start zwraca 0.0). Między `start` a `complete` stan obrońcy nie jest zmieniany (cios zmienia tylko HP/dead; _resolveBlowOutcome jest nieportowany). Zatem gałęzie `routed` / `fading_out` w `counter_strike` są w tym porcie nieosiągalne i mutanty M2 (bez routed) i M3 (bez fading_out) przechodzą równoważnie. Zostają dla wierności pinowi (`_defenderCounters`: `if (defender.dead || defender.fadingOut || defender.routed) return false`).
- Zamiast tego dodano testy obserwowalnego zachowania: `kontratak_routed_obronca_nie_jest_celem`, `kontratak_fading_out_obronca_nie_jest_celem` (start = 0.0, brak ciosu i brak kontrataku).
- NIE_ZMIERZONO: wektory graniczne z pinu dla tych stanów nie zostały dodane. Nie sprawdzono, czy generator w ogóle może wytworzyć sekwencję, w której obrońca jest routed/fadingOut w chwili kontrataku (przy obecnym filtrze celu jest to, według powyższego, niemożliwe).

### Zarzut 2 (zakres: gałąź strzelca, primaryRanged:false w generatorze) — ODRZUCAM
- Strzelec z pinu (`return !canShoot(defender)`) jest poza zakresem tego tematu: dispatch wyklucza „doktrynę/strzelca/mur” z ProdBody (NIE ruszać).
- Rozbieżność nie jest cicha: Rust zapisuje `kontratak-strzelec` w `unported` (siege_tactics_loop.rs, gałąź `primary_ranged`, ok. linii 845-848) i nie wykonuje kontrataku. Jest to zadanie #112 K5LOOP-DOCTRINA-STRZELEC.
- Bez zmian kodu.

### Zarzut 3 (budżet keyed round_no, brak testu wieloturowego) — PRZYJMUJĘ
- Dodano `kontratak_budzet_odnawia_sie_miedzy_turami` (5 rzutów): tura 1: cios -> kontratak (1); drugi cios tej samej tury -> bez kontrataku (nadal 1); `round_no += 1` -> cios -> kontratak (2). Asercje na przeżycie obrońcy między ciosami.
- Mutacja wyłączająca budżet (`== Some(st.round_no)` -> `== Some(-1)`) -> FAIL (M4).
- NIE_ZMIERZONO: test modeluje reset przez wzrost `round_no` (ten sam krok co `begin_turn`, siege_tactics_turnseq.rs:235), ale nie wywołuje samego `begin_turn` (wymaga TurnSeqEnv). Ścieżka pinu `beginTurn` -> `DefenderCounterBudget` nie jest więc testowana wprost.

### Zarzut 4 (blok COUNTER-ATTACK jako lustro w stubie, nie wykonywany tekst) — ODRZUCAM
- GOAL (1) dispatchu wymaga wykonania tekstu `_defenderCounters` (wykonany: `counterDefText = L(SCENE, 9079, sceneEnd(9079))`, generator).
- Blok 9134-9143 zawiera wywołania renderu (`dirYaw`, `group.rotation`, `_spawnDamageLabel`), więc nie może być wykonany bez stubu renderu. Jego tekst jest pod strażem: `counterBlockText = L(SCENE, 9134, 9143)`, `expectLine` na 9079/9134, sprawdzenie `lines[SCENE][9142] === '        }'` oraz `counterDigest` (SHA-256 z trzech fragmentów, `COUNTER_SHA256`). Dryf pinu zatrzymuje generator.
- Zgodność lustra (consume, `engaged.add`, facing obrońcy, `_singleBlow(defender, attacker, false)`) zweryfikowana ręcznie w ewaluacji i zgodna z `counter_strike` (siege_tactics_loop.rs, ok. 836-863).

### Zarzut 5 (numer linii: dispatch ~9139, pin 9134-9143) — PRZYJMUJĘ (informacyjnie)
- Potwierdzam: blok COUNTER-ATTACK w pinie `07d2fbd72` to linie 9134-9143, `_defenderCounters` to 9079-9092. Dispatch podał przybliżenie „~9139”. Bez zmiany kodu.

### Zarzut 6 (gałąź ...Q1 z wcześniejszymi commitami 9a1386214, 6f9f6a762) — PRZYJMUJĘ jako notatkę
- Sprawdzono `git merge-base --is-ancestor 9a1386214 d8fc4b3fd`: NIE jest przodkiem. Te commity nie wchodzą w SHA oceniany w tej rundzie i nie były częścią oceny.
- Gałąź `rust-port-wip/R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1` nie była dotykana (nie nadpisywana, nie integrowana). Decyzja co z nią zrobić należy do orkiestratora.
- NIE_ZMIERZONO: ocena tych dwóch wcześniejszych commitów.

## Bramki (po poprawce, ta sama baza, CARGO_TARGET_DIR poza repo)
- cargo fmt --check (rust-port/engine): EXIT 0 (po rustfmt na pliku testu)
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 88 passed, EXIT 0
- p6_siege_tactics_loop: 4 passed
- p6_siege_tactics_loop_body: 8 passed (poprzednio 4; dodano 4: hp_zero, routed, fading_out, budżet między turami)
- p6_siege_tactics_loop_body_pin: 1 passed
- p6_siege_tactics_activate: 2 passed
- p6_siege_tactics_blow_full: 3 passed
- Mutacje (przywracane `git checkout` po każdej): M1 bez hp<=0 -> FAIL; M2 bez routed -> PASS (równoważny, patrz zarzut 1); M3 bez fading_out -> PASS (równoważny); M4 budżet wyłączony -> FAIL.
- Cargo.lock nieśledzony, NIE commitowany. Brak #[ignore], brak osłabionych asercji, brak zmian w gra/, Cargo.toml, WERSJE.md, origin/main.

## Commit
- Commit obrony (tylko test i ten raport), SHA: patrz wiersz "SHA_OBRONY" w odpowiedzi orkiestratorowi.

BLOKADY: NIE_ZMIERZONO: wektory graniczne routed/fadingOut z pinu (nieosiągalne w porcie, nie zweryfikowano w generatorze); ścieżka `beginTurn` nie testowana wprost; strzelec (K5LOOP-DOCTRINA-STRZELEC); gałąź Q1 niezweryfikowana.
RUNDY: 1/5 (Operator r1, obrona)
NASTĘPNY KROK: Final Control r1 (ponowna ocena z tym commitem obrony) — decyzja o zarzutach 1 (wektory) i 2 (strzelec) należy do FC.
DEPLOY/PUSH: NIE WYKONANO
