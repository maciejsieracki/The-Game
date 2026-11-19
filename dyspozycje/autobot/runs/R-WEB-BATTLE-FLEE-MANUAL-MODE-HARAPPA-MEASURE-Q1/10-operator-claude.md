# R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (bitwa 3D, ruch i ucieczka, tryb ręczny)
TEMAT: R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1
GOAL: zmierzyć w żywym Chromium ucieczkę jednostki w RĘCZNYM trybie bitwy 3D i ustalić, czy limit "Ruch w bitwie" / mnożnik ucieczki jest egzekwowany tak samo jak w autobitwie.
BAZA: origin/main 2ab6e3a05 (detached).

ZMIANY/COMMIT: brak zmian w kodzie gry (ścieżka ręczna zgodna, dispatch: NIE zmieniać kodu). Dodane narzędzia pomiarowe: gra/tools/battle-flee-manual-browser-entry.ts, gra/tools/battle-flee-manual-browser-entry.html, gra/tools/battle-flee-manual-test.cjs. Brak zmian w units.json i combat-params.json (mutacja cofnięta przez git checkout).

POMIAR (Chromium, tryb ręczny, jednostka gracza zlamana na poczatku tury 1, surowe liczby z wyjscia):
- Wojownik (Warrior), normalny zasieg 4, limit ucieczki 2: kroki na ture 2,2,2,2,2 (max 2).
- Rydwan konny (War Chariot), normalny 6, limit ucieczki 3: kroki na ture 3,3,3,2 (max 3).
- Wniosek: ucieczka w trybie recznym respektuje mnoznik 0,5 i nie ma sprintu ponad limit. Brak dodatkowego ruchu.
- Kod: _activateUnit (battleScene.ts ~6367) kieruje zlamana jednostke do _fleeStep przed _performPlayerOrder; _fleeStep (~10456) ogranicza zapas przez _fleeMovePointsFor (~7867).

TESTY:
- battle-flee-manual-test.cjs (nowy): 9 PASS / 0 FAIL (zielono na aktualnym kodzie).
- Mutacja kopii (mnoznik_ruchu = 1): 4 FAIL (w tym wpisany udzial 0,5 i limit ucieczki Rydwanu 6 zamiast 3). Czerwono. Plik przywrocony.
- battle-flee-speed-parity-test.cjs (auto): 53 PASS / 0 FAIL.
- Bramki: tsc --noEmit exit 0; logic-test exit 0 (ostatni wiersz PASS [213]); research-test 33/0; ai-unit-replace 45/0; combat-test exit 0; tech-tree-test exit 0.

BLOKADY: brak. Uwaga: reczna sciezka Warrior w tescie wymaga do ~400 s przy swiftshaderze (wolne klatki); test ma timeout 400000 ms.

NIE ZMIERZONO (kolejne podejrzane elementy, propozycja tematu):
1. Odwrot po bitwie na mapie (tryb dwoch heksow) — nie badany.
2. Animacja/tempo kroku (STEP_GAP_MS, _doMove) — nie badana; wlasciciel moze widziec szybkosc z animacji, nie z liczby heksow.
3. Zlamanie jednostki W TRAKCIE jej lancucha rozkazu recznego (_manualOrderChainActive nie sprawdza ru.routed): hipotetyczna sciezka pelnego ruchu. Proba wymuszenia (zlamanie po pierwszym kroku) nie dala wyniku: jednostka nie wykonala kroku, a probe nie zostal dokonczony. Do zbadania w osobnym temacie.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o temacie z pkt 1–3 (proponowany: FLEEMANUAL-2 — zlamanie w lancuchu rozkazu + pomiar na mapie). Odpowiedz wlasciciela na "jak wyglada szybkosc" (animacja vs heksy) potrzebna przed naprawa.
DEPLOY/PUSH: NIE WYKONANO
