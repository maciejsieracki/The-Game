STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SCOUT-NOT-LEADER-Q1
GOAL: Zwiadowca w armii nie jest liderem ani kotwicą ataku (miasto i jednostka); armia = najsilniejsza jednostka bojowa; zwiadowca tylko poszerza widoczność.
ZMIANY/COMMIT: SHA końcowy do integracji 7f30780c5 (na 1358a312f, baza origin/main 3aa1b3a2a). Allowlista: gra/src/game/{armyMerge,stack-leader}.ts, gra/src/main.ts (tylko wybór lidera/kotwicy), gra/src/map/map-attack-city.ts, gra/src/ui/armyStackLabel.ts, gra/tools/army-scout-not-leader-test.cjs, run-dir. Brak zmian: ai.ts, WERSJE.md, rust-port, src-tauri. git diff --check czysty. Commit raportu FC dodatkowo (tylko run-dir).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Ścieżka ataku na jednostkę: ODDAL (naprawione w obronie). combatAnchorFor w openPlayerMapUnitAttackCore (wspólne wejście: tryLaunchMarchAttack 28982, klik wroga 30456). Zmierzone: T5 zielone; mutacja (wyłączony guard) -> 18 OK / 1 FAIL.
2. Chromium/zrzut: ODDAL. /usr/bin/chromium brak w środowisku, brak zakazu produktowego; kolejność kart pokryta T3 (czysta funkcja). Nota: dowód wizualny do zrobienia przy deployu.
3. Parytet AI: ODDAL. ai.ts nie zmieniany; AI wyklucza cywili z ataku na miasto (ai.ts 4106) i w pulach bojowych (3244, 3446, 4369); zmiana jest w warstwie wyboru kotwicy gracza.
4. Lider po HP: ODDAL (naprawione). strengthOf=unitAttackScore; T6 pokrywa ranny wojownik vs łucznik i hint_civilian przy braku ruchu bojowych.
5. NIE_ZMIERZONO (siege-blockade Chromium, unia widoczności): ODDAL. Widoczność liczona per jednostka (T4), zmiana jej nie dotyka; nota.
Wszystkie ODDAL, zero NAPRAW -> PASS-WITH-NOTES.
TESTY (własne, na 7f30780c5): tsc --noEmit EXIT=0; army-scout-not-leader 19 OK/0 FAIL; map-attack-city 13/0; map-siege 6/0; army-merge-stackgroupid 11045/0; army-to-nearest-leader 43/0; army-concentration 56/0; siege-ai 17/0.
BLOKADY: brak blokujących. Notatki: brak Chromium (dowód wizualny odroczony), army-stack-commander-identity-test wymaga /usr/bin/chromium (środowisko).
RUNDY: FC 1/5 (runda 2 tematu po obronie)
NASTĘPNY KROK: integracja orkiestratora: merge/cherry-pick 1358a312f + 7f30780c5 (+ commit FC) do origin/main (baza 3aa1b3a2a nadal przodek main; brak konfliktów w plikach zmienionych). Względem origin/rust-port/parity-v2 (b520768b0) niezależne (zmiany tylko w gra/src web); po integracji do main ewentualny REPIN Rust po zakończeniu weba.
DEPLOY/PUSH: NIE WYKONANO
