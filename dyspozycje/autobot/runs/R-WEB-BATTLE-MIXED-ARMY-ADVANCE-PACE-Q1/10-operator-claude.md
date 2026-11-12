STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1
GOAL: w rozkazie Atak cała armia mieszana (piechota, strzelcy, machiny, konnica) idzie tempem najwolniejszej jednostki do pierwszego wzwarcia wręcz; konnica poza regułą tempa (FALA 554/578).
ZMIANY/COMMIT: gra/src/battle/battleScene.ts (_lineAdvanceCap: strzelcy i machiny w regule tempa rangi; sufit zdejmowany dla nich dopiero po wzwarciu wręcz w grupie; konnica nadal poza regułą), gra/tools/battle-mixed-army-advance-pace-test.cjs (nowy test regresyjny), ten raport. SHA: patrz pole sha w StructuredOutput.
TESTY:
- tsc --noEmit: exit 0 (bez błędów)
- battle-mixed-army-advance-pace-test.cjs (nowy), z poprawką: PASS x4 (piechota spread 0 <= 2; strzelcy 0 <= 1; machiny 1 <= 1; strzelcy idą: min q 25 > 2). Kroki 0..12: piechota 0 we wszystkich krokach.
- Mutacja (baza HEAD 81e357dee, bez poprawki): FAIL "machines spread 2 <= 1" (kroki 4..12: spread 2). Test czerwieni brak poprawki.
- UWAGA: w bazie strzelcy też mieli spread 0, więc test strzelców nie rozróżnia bazy i poprawki (zanotowane).
- battle-line-advance-uniform-test.cjs (W19): exit 0 (wall/def, frozen, mixedSpeed).
- battle-skip-equals-auto-resolve-test.cjs: exit 0, 42 ok / 0 fail (SKIP == AUTO; B5 czas wirtualny auto=68096 ms, skip=68080 ms). Czas rzeczywisty 8 min 32 s.
- Headless, exit 0: battle-attack-move-order, battle-cap-500, battle-cavalry-flank-default, battle-cavalry-front-flank-placement, battle-damage-colors, battle-dead-unit-disappearance, battle-dead-units-removed, battle-defeat-survivor-retreat-two-hex, battle-deploy-cavalry-flanks, battle-flank-close-formation, battle-formation-rules, battle-hp-display, battle-initial-placement-runtime, battle-large-mixed-doctrine-matrix, battle-loot, battle-manual-choice-contract, battle-manual-orders-routing, battle-melee-attack-doctrine, battle-mode-choice-labels, battle-mode-save-reload-contract, battle-ranged-mounted-doctrine, battle-roster, battle-routed-pursued-destroyed (30 PASS / 0 FAIL, 1m47s), battle-save-disabled, battle-siege-nearby-units-join, battle-skip-siege-parity, battle-standoff-two-warriors, battle-summary, battle-undeployed-units, map-field-battle.
- Bramki referencyjne: logic-test 0, tech-tree-test 0, research-test 0, unit-replace-test 0, combat-test 0.
- NIE_ZMIERZONO (przeglądarka / Chromium, środowisko): battle-ranged-approach-regression-test (activation timeout; TAK SAMO na bazie HEAD, więc środowisko, nie regresja), battle-natural-near-range-r6-test (brak START WALKI w przeglądarce), battle-attack-move-pointer-test (clickUnit, timeout w przeglądarce), battle-natural-chariot-r5-test (klik niestabilny w przeglądarce). Pozostałe *-browser-* / *-live-* nie uruchamiane.
- NIE_ZMIERZONO: zrzut przed/po z Chromium (scena bitwy) nie wykonany.
POMIAR (MEASURE=1, surowe): baza HEAD: krok 3 machiny=1, krok 4..12 machiny=2 (piechota 0, strzelcy 0). Poprawka: krok 3..12 machiny 0 lub 1 (piechota 0, strzelcy 0). Okno podejścia: 13 rund.
BLOKADY:
- Kryterium (3) z dispatchu, po wzwarciu: strzelcy utrzymują maksymalny dystans w zasięgu (dystans do najbliższego wroga wręcz >= 2 pola, gdy możliwe). NIE zaimplementowane w tej rundzie i NIE przetestowane. Zmiana obejmuje tylko fazę podejścia (przed wzwarciem).
- Progi TOL = 2 (piechota) i TOL_RANK1 = 1 (strzelcy/machiny) wyznaczone pomiarem; nie zatwierdzone przez właściciela (ABC, jeśli Evaluator uzna je za progowe).
- Zrzut przed/po z Chromium nie wykonany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet): zweryfikować diff i pomiar; rozstrzygnąć kryterium (3) (strzelcy po wzwarciu), w tej rundzie albo osobnym tematem; decyzja ABC o progach tolerancji.
DEPLOY/PUSH: NIE WYKONANO
