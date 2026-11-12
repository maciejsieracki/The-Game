STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1
GOAL: produkcyjne ciało jednostki pętli (ProdBody: K5H + K5I) zgodne z tekstem pinu 07d2fbd72, z wektorami end-to-end (r3: generator + wektory + poprawki ProdBody)
ZMIANY/COMMIT: baza ad0b8a36f (ancestry sprawdzone przez checkout --detach). SHA commitu: patrz końcowa sekcja DEPLOY/PUSH (commit na gałęzi roboczej).
Pliki (allowlista OK; gra/, data/, Cargo.toml, Cargo.lock, WERSJE.md nietknięte; Cargo.lock wygenerowany przez cargo NIE jest w commicie):
- NOWY rust-port/engine/tests/p6_siege_tactics_loop_body_gen.mjs (generator, ziarno 2301)
- NOWY rust-port/engine/tests/p6_siege_tactics_loop_body_vectors/vectors.json (2,6 MB; 320 sekwencji, 1740 aktywacji, 684 ciosy)
- NOWY rust-port/engine/tests/p6_siege_tactics_loop_body_pin.rs (test zgodności z pinem)
- ZMIANA rust-port/engine/src/domain/siege_tactics_loop.rs (ProdBody; bez zmian w istniejących siege_tactics_*.rs, brak adapterów API)
- ZMIANA rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs + p6_siege_tactics_loop.rs + p6_siege_tactics_loop_vectors/vectors.json (6,7 MB <= 8 MB): pole `ml` = początkowe moveLeft > 0 (zarzut C), bez zużycia strumienia PRNG
- ZMIANA rust-port/engine/tests/p6_siege_tactics_loop_body.rs: tylko komentarz nagłówka

CO WYKONUJE GENERATOR (tekst pinu, bez wstawek, strażnik SHA-256):
_activateUnit 6048-6299, _checkRout, _enemiesOf, _doAttack 8787-8797, CAŁE _singleBlow 8809-9011 (z `return this._resolveBlowOutcome`), helpery combat.ts (hitChanceTw, baseDamage, rangeDamage, rangedShotAccuracy, flankRearDefensePenalty), rangedDamageMultFor, applyMultiplier, fieldFortifyDefenseBonus oraz toCombatUnit/combatUnitFromDef z przeskalowaniami weterana/głodu/deficytu na wierszach units.json PINU. Sumy SHA-256 identyczne z generatorami K5H i K5I2b + nowa suma _doAttack.
ZASTUBOWANE WYŁĄCZNIE: RNG (kolejka rzutów), render/animacja (_doMeleeAttack = ślad `attack:i` + prawdziwy _singleBlow; kontratak/lunge/BLOW_HIT_T poza zakresem), ruch/doktryna/wieże (ślad + false), wybór celu (_targetInRange = cel z wektora filtrowany przez prawdziwe _enemiesOf), dane sceny (relativeHit, counterMultiplier, bracesAgainstCharge, ford/shore, nazwa kafla, tabela terrainDefenseMultiplier, mnożniki civ/trudności), _resolveBlowOutcome (zapisuje dmg/extra i stosuje TYLKO zabicie hp<=0).

POPRAWKI ProdBody (znalezione/uzasadnione porównaniem z pinem, wszystkie pokryte wektorami):
1. finished / dead / fadingOut => [done] PRZED routed (poprzednio routed+finished dawało unported zamiast done).
2. Efekty okrążenia (morale -10, rout, flaga surroundApplied) są stosowane także gdy dalsza gałąź jest nieportowana (poprzednio start zwracał bez pending => utrata morale/rout po okrążeniu).
3. Zbiór `engaged` (para atakujący>obrońca, także po pudle) trzymany w ProdBody; first_blow_of_pair pochodzi z niego, nie z szablonu (poprzednio statyczne). Usunięty wpis unported "engaged-zbior".
4. Cel martwy/znikający/uciekający odfiltrowany jak _enemiesOf (poprzednio melee_target brany bez filtra).
5. primary_ranged => out-of-scope "strzelec" (stan dryCol/heldAfterFallback nie jest trzymany między aktywacjami).
6. Nowe publiczne obserwacje: trace (zdarzenia K5H na aktywację), blows (BlowRecord), engaged, surround_applied().

TESTY (EXIT zapisany, własnoręcznie):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 88/88 OK
- cargo test --test p6_siege_tactics_loop_body_pin: 1/1 OK (320 sekwencji, 1740 aktywacji; porównanie po KAŻDEJ aktywacji: ślad, wynik ciosu hit/hitPct/roll/dmg/HP obrońcy/extraMorale/isCharge, stan wszystkich jednostek hp/dead/fadingOut/routed/morale/surroundApplied/moveLeft, zbiór engaged; zero rozbieżności)
- p6_siege_tactics_loop 4/4, p6_siege_tactics_loop_body 4/4, p6_siege_tactics_activate 2/2, p6_siege_tactics_blow_full 3/3 OK
- Test mutacyjny (ręcznie, cofnięty): first_blow_of_pair=true oraz usunięcie filtra celu => test pin FAIL (wektory nie są pozorne).
- Pokrycie (liczone w teście z porównanych danych, asercje > 0): trafienia 293, pudła 391, szarża 316, zabicia 30, powtórny cios w parze, flanka/tył, routed=>[flee] bez ciosu, dead/fadingOut=>[done], finished=>[done], okrążenie 104 + startRout 69, advanceStep (brak celu/cel martwy), kawaleria 105, falanga 69, obrońca na murze (onWall) w 125 sekwencjach, moveLeft>0 w 318 sekwencjach, fadingOut/routed/dead w sekwencjach.
- Zarzut C: (a) wektory body: moveLeft losowe 0..5, nietknięte przez aktywację (porównywane); asercje na ślad dla finished/dead/fadingOut (=[done], brak ciosu) i routed (=[flee], brak ciosu) w teście pin; (b) stary generator pętli: początkowe moveLeft = `ml` (>0), test cover sprawdza pole `ml`.
- (D) halt_unsupported: test p6_siege_tactics_loop_halts_without_siege_instead_of_panicking bez zmian, zielony.
- df przed bramkami: 8,3 GB; CARGO_TARGET_DIR poza repo (scratchpad/target-body3), do usunięcia po raporcie.

BLOKADY / NIE_ZMIERZONO (poza zakresem r3 wg dispatchu, osobne tematy):
- Skutki _resolveBlowOutcome po ciosie (morale obrońcy, rout-before-death, _gainMorale atakującego, efekty sceny): w generatorze stub stosuje tylko zabicie; ProdBody też. Wektory NIE weryfikują morale po ciosie.
- Kontratak _doMeleeAttack, timing BLOW_HIT_T (cel czytany w complete, nie w chwili ciosu), czas ciosu body_ms (stała 800 w teście), doktryna, strzelec, mur/oblężenie, ruch/ucieczka (_fleeStep, _advanceStep), kawaleria/falanga (ślad zgodny, akcja nieportowana).
- Wybór celu (_targetInRange: facing/attackDirection/lowestHp) jest wejściem adaptera (cel z wektora, filtr _enemiesOf zweryfikowany).
- Dane sceny (relativeHit, ford/shore, kontry) to stuby z wejściem po stronie szablonu; ich implementacje (nie ProdBody) są poza zakresem.
- Brak wiringu ProdBody do pełnej SiegeLoop (osobny temat).
RUNDY: 3/5 (Operator SONNET z uzasadnieniem w dispatchu r3)
NASTĘPNY KROK: Evaluator r3 ocenia zgodność wektorów z pinem i zakres; osobne tematy: _resolveBlowOutcome, kontratak, timing, _targetInRange, doktryna/strzelec/mur.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; bez push, bez integracji, bez zmian gra/ i origin/main).
