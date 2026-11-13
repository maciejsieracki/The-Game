STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1
GOAL: Bonus obwarowania dla obroncow na murze i za murem; strzelcy na koronie zasieg x2; procenty, R1-R4, Milicja, machiny, wiezyczki bez zmian.

WERDYKT ZARZUTOW:
1. Zrzuty PRZED=PO identyczne (md5): ODDAL. Zmiana nie jest wizualna na starcie sceny; dowodem log pomiarowy i e2e tury (zasieg 3 -> 6, cel wybrany, amunicja 12 -> 11 vs 3, brak celu, 12 -> 12; gate-e2e-tura-*.txt, EXIT=0).
2. Mutacje sceny (OOM u Evaluatora): ODDAL. Obrona odtworzyla z TMPDIR=/dev/shm: 7/7 mutacji lamie test (gate-test-PO-mutacje-obrona.txt, EXIT=0). Ja ponownie przeszedlem pelny test: 58 ok / 0 fail, EXIT=0 (mutacje A i B wlaczone).
3. Brak pomiaru pelnej tury: ODDAL. e2e-tura-strzelec.cjs na prawdziwej scenie PRZED/PO zamyka luke; spadku HP i `done` nie zmierzono (NIE_ZMIERZONO, niekrytyczne: dowodem strzalu jest amunicja).
Zalozenie (c) (atakujacy na koronie traci bonus): zgodne z dispatchem ("bonus nie dotyczy atakujacych"), DO AKCEPTACJI wlasciciela jako nota, nie blokada.
Zadnego NAPRAW -> PASS-WITH-NOTES.

WERYFIKACJA WLASNA (HEAD 4948060fc, detached, npm ci --ignore-scripts):
- tsc --noEmit: EXIT=0
- wall-defenders-bonus-range-test.cjs: 58 ok / 0 fail, EXIT=0
- city-siege-wall-rules-test 50 OK / 0 FAIL; city-defense-terrain-gate, city-wall-towers, palisade-battle-wall-rules, siege-defenders: EXIT=0
- git diff --check 1117c6515..4948060fc: czysty. Kazdy gate-*.txt ma linie EXIT=.
- Przeglad diffu: jedna regula defenderInsideFortification/fortificationDefenseBonusForUnit (city-defense.ts) uzywana w _singleBlow i computeInstantResult; wallCrownShooterRange = ceil(x2), tylko _isWallCrownShooter (bez katapult); stare +1 usuniete, brak podwojenia.

ALLOWLISTA (git diff --name-only 1117c6515 4948060fc): gra/src/game/city-defense.ts, gra/src/battle/battleScene.ts, gra/tools/city-siege-wall-rules-test.cjs (pinezka starej reguly, uzasadnione), gra/tools/wall-defenders-bonus-range-test.cjs (nowy), dyspozycje/autobot/runs/R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1/**. Brak zmian: main.ts, combat.ts, siegeWall.ts, gra-robocza, WERSJE.md, rust-port.

NIE_ZMIERZONO: 4 testy czerwone identycznie przed/po (mur-paradoks, auto-battle-simultaneous, battle-loot, pr141-combat-defense-owner-route) - poza tematem; ok. 12 testow Chromium wg gate-regresje.txt.

INTEGRACJA: SHA do integracji = SHA tego commitu FC (potomek 4948060fc; kod bez zmian od 4d41f3060). Baza 1117c6515 == origin/main (e1c040160 = origin/rust-port/parity-v2 to osobna linia). Kolejnosc: cherry-pick/merge na origin/main (fast-forward mozliwy), niezalezne od rust-port/parity-v2 (brak plikow rust-port; zadnego konfliktu).
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
