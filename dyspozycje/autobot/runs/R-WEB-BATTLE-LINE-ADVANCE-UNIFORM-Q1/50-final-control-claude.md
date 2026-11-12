# R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1 — raport Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1
GOAL: w Atak (steady) jednostki jednej rangi piechoty maszerują równo do przeszkody/wroga; linia odzyskuje spójność po przeszkodzie; parytet AUTO=SKIP zachowany; reguły walki po kontakcie bez zmian.
ZMIANY/COMMIT: kandydat b67510e12d24d1029654a5b31f440c1785e268ed (kod = 6d81e708a + raport obrony). Potomek dee73a067 (baza operatora; merge-base z origin/main = dee73a067). Uwaga: origin/main poszedł dalej (9b3bc29e2, FALA 654) — kandydat NIE jest potomkiem aktualnego origin/main; integracja = merge, możliwy konflikt tekstowy w battleScene.ts (W16 _resetSiegeForReplay; zmiana operatora dotyka _resetBattleRuntimeState). Diff vs dee73a067: battleScene.ts (+88/-1), battle-cap-500-test.cjs (+3), nowe testy/harness gra/tools/battle-line-advance-uniform-*, evidence i raporty w runs/<ID>/. Brak zmian WERSJE.md, JSON balansu, rust-port.

TESTY (własne, surowe wyjście):
- tsc --noEmit: rc=0.
- battle-line-advance-uniform-test.cjs: 17 PASS / 0 FAIL (rozrzut max 2 przy skale/ścianie, odzysk <=3 rundy, anty-freeze q=14, mixedSpeed 0).
- Mutacja (_lineAdvanceWithinCap zawsze true): 14 FAIL, test czerwieni się; po przywróceniu 17 PASS.
- 5 bramek referencyjnych (logic, tech-tree, research, unit-replace, combat): wszystkie rc=0.
- battle-skip-equals-auto-resolve-test (280 s, samodzielnie): rc=0, 42 ok / 0 fail; seedy 1-3 AUTO=SKIP identyczne straty i zwycięzca. battle-skip-siege-parity-test: 17/0.
- battle-cap-500-test: 59 asercji PASS (tur=54, śr. 563 ms, p95 1627 ms).
- Reszta battle-*/auto-battle/cavalry-flank/map-field/pre-battle (62 skrypty, 4 równolegle, limit 120 s): rc=1 auto-battle-simultaneous (1 FAIL), battle-dead-unit-disappearance, pre-battle-save, battle-natural-chariot-r5 oraz timeouty (rc=124) testów Chromium pod obciążeniem równoległym. Zmierzone na bazie (battleScene.ts z dee73a067): auto-battle-simultaneous (1 FAIL) i battle-dead-unit-disappearance (rc=1) padają IDENTYCZNIE, czyli dług sprzed zmiany. pre-battle-save, natural-chariot-r5, attack-move-pointer: wg Operatora identycznie na bazie (NIE_ZMIERZONO przeze mnie na bazie). Pozostałe testy live Chromium z rc=124: NIE_ZMIERZONO osobno; battle-ranged-approach-regression timeout także na bazie wg Operatora.
- Weryfikacja Chromium: nie powtarzałem; opieram się na evidence/line-browser-Las.json (zarzuty 1-3).

WERDYKT ZARZUTÓW:
1. ODDAL — poprawa fazy marszu udowodniona w silniku headless (rocks 5->2, wall 8/13->2, mixedSpeed 13/15->0); Chromium = test dymny (brak regresji).
2. ODDAL — identyczne PNG w r.6 wynikają z równego rozrzutu (3=3); ograniczenie dowodu, nie defekt.
3. ODDAL — rozrzut 3 w scenie z kontaktem; jednostki w kontakcie są wyłączone z sufitu, próg 2 dotyczy marszu bez kontaktu.
4. ODDAL — test przeglądarkowy zbiera evidence, nie jest bramką; bramka jest odtwarzalna z repo (mutacja potwierdzona: 14 FAIL).
5. ODDAL — rangedBase/konnica/machiny poza sufitem świadomie (dispatch: nie zmieniaj flank konnicy FALA 554/578 ani strzelców); propozycja osobnego tematu R-WEB-BATTLE-LINE-ADVANCE-RANGED-Q2 (Hastati mają rangedBase=true).
6. ODDAL z notą — gra/tools/battle-line-advance-uniform-browser-entry.{ts,html} to pomocnicze zasoby testu (poza literalnym wzorcem *-test.cjs, ale w gra/tools, nieprodukcyjne; tsc czysty). Zmiana battle-cap-500-test.cjs = wyłącznie `scene.roundNo = turns + 1` (zegar rund), asercje bez zmian, 59 PASS. Orkiestrator może pominąć pliki browser-entry przy merge bez wpływu na bramki.
7. ODDAL — roundNo tyka w _beginTurn (jedyna ścieżka produkcyjna: gracz/AUTO/SKIP); dotyczy tylko harnessów, jedyny dotknięty (cap-500) poprawiony.
8. DO DECYZJI CZŁOWIEKA (ABC, nie blokuje integracji): (a) LINE_ADVANCE_STALL_ROUNDS=10 (A: 10 rekomendacja/zmierzone; B: 8, rozrzut do 4 przy ścianie; C: inna), (b) akceptacja reguły "tempo linii = najwolniejsza jednostka rangi" (500v500: 54 tury vs 42 na bazie, +29%, harness bez konnicy/dystansu). Kod zawiera wartość zmierzoną, nie wybraną jako balans; zmiana progu = jedna stała.
Żadnego NAPRAW.

BLOKADY: brak technicznych. ABC (pkt 8) i ewentualny konflikt przy merge z aktualnym main.
RUNDY: FC 1/5
NASTĘPNY KROK: orkiestrator: merge kandydata do aktualnego main (sprawdź git merge-base --is-ancestor 6d81e708a <SHA integracji> i git diff --stat; konflikt W16 rozwiązać w procesie), ABC do właściciela (pkt 8), osobny temat RANGED-Q2; dług Rust REPIN (ruch/sufit linii w bitwie) do wskazania.
DEPLOY/PUSH: NIE WYKONANO
