# OBRONA OPERATORA — runda 3 (odpowiedź na 02-evaluator-r3, da93db88c)
STATUS: PASS-WITH-NOTES (obrona; kod = 22c0b7ea5 + commit obrony r3, SHA poniżej)
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1
Baza obrony: 22c0b7ea5 (ancestry: ad0b8a36f -> 22c0b7ea5 potwierdzone). Ocena Evaluatora: da93db88c.

## Odpowiedzi na zarzuty

1. [średni, niezadeklarowane] facing / relativeHit — PRZYJMUJĘ.
   Zarzut trafny. Sprawdzone w generatorze: `_nearestEnemy` zwraca null, więc `_updateFacing` jest no-op (facing nigdy
   się nie zmienia); przypisanie `attacker.facing` z `_doMeleeAttack` (pin 9104) pominięte; `relativeHit` (pin
   battleScene.ts:385) zastąpione `arcOf` (hasz współrzędnych, ignoruje facing). W nagłówku generatora błędnie zaliczono
   to do „render/dane sceny”. Poprawka: nagłówki generatora i testu pinu, komentarz przy stubie `relativeHit` i nagłówek
   ProdBody opisują to jako NIE_ZMIERZONO (stan facing + łuk nie są dowiedzione). Port `_nearestEnemy`/`_updateFacing`
   i wpięcie `relative_hit` (siege_tactics_inputs_pos.rs) do ProdBody to osobny temat (proponowany R-RUSTPORT-P6-K5LOOP-FACING).
   Kodu nie zmieniam w tej rundzie — zakres r3 tego nie obejmuje, a uczciwe odnotowanie jest konieczne.

2. [niski] DOATTACK_SHA256 = 'PLACEHOLDER' — PRZYJMUJĘ (naprawione).
   Dowód: `node rust-port/engine/tests/p6_siege_tactics_loop_body_gen.mjs` wypisuje
   `doAttack sha256 = 592a6cbc279655a09b13fe9cd5ccbad24b325fa093610d685d5d9461729b41c1`, zgodnie z zarzutem i ze stałą
   w p6_siege_tactics_loop_body_pin.rs. Strażnik w generatorze jest teraz ścisły (bez wyjątku dla PLACEHOLDER).
   Regeneracja: vectors.json bez zmian (git status czysty).

3. [średni, zadeklarowane] brak kontrataku `_defenderCounters` i morale/rout po ciosie — ODRZUCAM jako zarzut do poprawki
   w tej rundzie; ZGADZAM SIĘ z ostrzeżeniem.
   Dowód: dispatch r3 wprost wyłącza z zakresu „efekty `_resolveBlowOutcome`, kontratak, timing BLOW_HIT_T, ... →
   osobne tematy, NIE ruszać”. Raport r3 deklaruje to w BLOKADY (NIE_ZMIERZONO). Dodano do nagłówka ProdBody jawny zakaz
   wpinania do SiegeLoop przed tymi tematami (commit obrony).

4. [niski, zadeklarowane] wybór celu, czas ciosu — PRZYJMUJĘ część, ODRZUCAM część.
   - Wybór celu i BLOW_HIT_T: zadeklarowane jako NIE_ZMIERZONO; `_targetInRange` jest stubem (generator:276) — przyjęte.
   - `_enemiesOf` jest w generatorze WYKONYWANY z tekstu pinu (generator:285, `L(SCENE, 8291, 8294)`), a nie jest
     „tym samym filtrem po stronie generatora”. Stub `_targetInRange` tylko sprawdza przynależność do wyniku prawdziwego
     `_enemiesOf`. Ten zarzut jest więc nieprawdziwy w tej części.

5. [niski] panika parsowania przy odwróconym kluczu `engaged` — NIE_ZMIERZONO (nie odtworzono).
   Porównanie `engaged` (p6_siege_tactics_loop_body_pin.rs ~537-551) już zwraca czytelną listę `rust=... js=...`.
   Nie odtworzyłem mutacji z zarzutu, więc nie wskazuję, które wywołanie panikuje. Bez zmiany w teście.

## Zmiany w commicie obrony (allowlista: src/domain/siege_tactics_loop.rs, tests/p6_siege_tactics_loop*, run dir)
- tests/p6_siege_tactics_loop_body_gen.mjs: DOATTACK_SHA256 = 592a6cbc..., ścisły strażnik, nagłówek (facing/relativeHit NIE_ZMIERZONO), komentarz przy stubie relativeHit.
- tests/p6_siege_tactics_loop_body_pin.rs: nagłówek — zastubowania obejmują facing/relativeHit (NIE_ZMIERZONO).
- src/domain/siege_tactics_loop.rs: komentarz (bez zmian logiki) — zakaz wpinania do SiegeLoop, brak stanu facing.
- Logika ProdBody i wektory NIE zmienione (vectors.json identyczny po regeneracji).

## Bramki (EXIT zapisany, po obronie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, target poza repo)
- cargo fmt --check: 0
- cargo clippy --all-targets -- -D warnings: 0
- cargo test --lib: 88/88, EXIT 0
- p6_siege_tactics_loop_body_pin: 1/1, EXIT 0
- p6_siege_tactics_loop: 4/4, EXIT 0
- p6_siege_tactics_loop_body: 4/4, EXIT 0
- generator: 320 sekwencji, 1740 aktywacji, 684 ciosy; vectors.json bez zmian.

## Blokady / NIE_ZMIERZONO
- Facing (stan `facing`, `_updateFacing`/`_nearestEnemy`, `relativeHit` z pinu): NIE wykonane; łuk = hasz współrzędnych.
- Kontratak, morale/rout po ciosie, BLOW_HIT_T, `_targetInRange`, doktryna, strzelec, mur, ruch: poza zakresem r3.
- Push/integracja: NIE WYKONANO. Cargo.lock nie commitowany.
