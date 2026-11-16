STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-NO-DEFAULT-BUILD-PRIORITY-ON-LOAD-Q1
GOAL: wczytanie zapisu nie dopisuje domyślnej listy budowaPriorytetTypow miastom w trybie zrownowazone (jak w żywej grze); konsumenci obsługują undefined; pole usunięte z whitelisty HASH_IGNORED.
BAZA: 459354a12e00eb04cc8365c5ac03a03c2ffec999 (origin/main)

ZMIANY/COMMIT:
- gra/src/game/cities.ts (ensureCitySaveDefaults, galąź budowaTryb === 'zrownowazone'): usunięte dopisywanie DEFAULT_BUDOWA_PRIORYTET_TYPOW przy braku listy; zapisana niepusta lista nadal jest sanityzowana (sanitizeBudowaPriorytetTypow). Migracje legacy (auto -> priorytet, onlyZrownowazone -> DEFAULT) bez zmian.
- gra/tools/ai-economy-measure-run.cjs: usunięte 'cities[].budowaPriorytetTypow(DO ABC)' z HASH_IGNORED, usunięte delete c.budowaPriorytetTypow i jego komentarz.
- gra/tools/save-load-roundtrip-state-drift-test.cjs: usunięte 'cities[].budowaPriorytetTypow(DO ABC)' z EXPECTED_HASH_IGNORED.
- Konsumenci (git grep budowaPriorytetTypow gra/src): auto-manage.ts:136 (?? fallback), main.ts ~9613 i cityPanel.ts ~11962 (?.length ? lista : DEFAULT) — obsługują undefined bez zmian.
- Commit: SHA podany w StructuredOutput (kod + ten raport).

TESTY:
- npx tsc --noEmit -p tsconfig.json: exit 0
- load-game-regression-test.cjs: 34 PASS / 0 FAIL
- resource-ledger-save-history-test.cjs: 15 passed, 0 failed
- save-load-player-owned-city-test.cjs: RESULT: PASS
- save-load-ledger-history-test.cjs: 4 PASS / 0 FAIL
- save-load-roundtrip-state-drift-test.cjs --static-only 1: SAVE-LOAD ROUNDTRIP OK (warstwa A)
- auto-manage-test.cjs: AUTO-MANAGE OK (45/45)
- git diff --check: czysto
- Build vite poza repo (outDir /tmp/claude-0/rt/dist): OK (26 s)
- Warstwa dynamiczna (--resume-test, ziarno 4242, --turns 16): NIE ZAKOŃCZONA — proces przerwany limitem 585 s (exit=124), bez wyniku 10/10. NIE ZMIERZONO.
- Ziarno 777: NIE ZMIERZONO.
- Nowy test regresji + mutacja na kopii (przywrócenie dopisywania -> czerwony): NIE ZROBIONE.
- Stare zapisy (z listą / bez listy) wczytują się bez błędu: NIE ZMIERZONO osobnym testem.

BLOKADY:
- Warstwa dynamiczna round-trip nie domknięta w limicie (ok. 5+ min na ziarno, przekroczony limit foreground 590 s).
- Brak testu regresji i mutacji — do dopisania w rundzie 2.

RUNDY: 1/5 (ostatni werdykt: brak; decyzja nie wymagana)

NASTĘPNY KROK: runda 2 — (a) --resume-test 10/10 na 4242 i 777 bez whitelisty budowaPriorytetTypow; (b) test regresji wczytania (brak dopisania listy dla zrownowazone, zapisana lista zachowana, stary zapis bez błędu) + mutacja na kopii; (c) FC po wynikach.

UWAGI-DLA-ORKIESTRATORA:
- Zmiana semantyczna: miasta zrownowazone po wczytaniu mają budowaPriorytetTypow === undefined (jak w żywej grze). Fallback w auto-manage.ts daje ten sam wynik (sanitize([budowaFocus='zrownowazone']) -> DEFAULT), więc auto-budowa nie powinna się zmienić; wymaga potwierdzenia dynamicznym testem.
- Dynamiczny runner zakończył się exit=124; zalecany dłuższy czas lub podział na mniejsze polecenia.

DEPLOY/PUSH: NIE WYKONANO
