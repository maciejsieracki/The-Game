STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD-Q1
GOAL: jednostka z HP <= 0 znika z pola bitwy (model, pasek HP, zajęte pole); uciekanie (morale) to osobna reguła.
ZMIANY/COMMIT: gra/src/battle/battleScene.ts; nowy gra/tools/battle-dead-units-removed-test.cjs; ten raport. SHA: commit "fix(battle): HP<=0 zawsze usuwa jednostke z pola" na gałęzi worktree-wf_823f40da-752-1 (SHA w odpowiedzi końcowej).
TESTY: tsc --noEmit OK; nowy test PASS; battle-dead-unit-disappearance, auto-battle-* i headless battle-* (22 z 34 plików) PASS; battle-loot-test FAIL 4 (PRE-EXISTING, identyczny na bazie, niezwiązany: premia brąz 50 vs 2). Testy z Chromium (~14 plików battle-*-live/pointer) NIE_ZMIERZONO (brak przeglądarki w runie, pominięte jawnie). Weryfikacja wizualna NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (potwierdzić przyczynę i brak regresji balansu rout-before-death)
DEPLOY-PUSH: NIE WYKONANO

DIAGNOZA (battleScene.ts, _singleBlow):
- Poprzednia poprawka (fa94d9b92) już usuwa zabite jednostki natychmiast (_startFade -> _removeUnitFromScene), więc przypadki (a)/(c) wykluczone.
- Przyczyna (b): blok ROUT-BEFORE-DEATH. Gdy cios sprowadzał HP do 0, a morale by pękło, kod ustawiał `bu.hp = 1` ("przezywa by uciec") i jednostka uciekała z PUSTYM paskiem HP, stojąc na polu przez wiele tur (zrzut: czerwone jednostki z pustymi paskami).
- Przyczyna (d): jednostka już `routed` trafiona do HP 0 NIE była zabijana (warunek `!defender.routed` w bloku śmierci) i zostawała na polu z HP 0 do wyjścia z krawędzi.

NAPRAWA:
1. Cios z HP <= 0 zabija (bez ożywiania do hp=1); rout-before-death tylko dla ciosów nieśmiertelnych (hp > 0).
2. Uciekająca jednostka trafiona do HP <= 0 ginie i znika (warunek `!routed` zastąpiony `!removed`).
3. Logika wyniku ciosu wydzielona do _resolveBlowOutcome (czysta refaktoryzacja, testowalna headless).

ZAŁOŻENIA: uciekająca jednostka z HP > 0 nadal jest widoczna do krawędzi pola (osobna reguła morale, bez zmian). Wpływ na balans: mniej "ożywionych" uciekinierów, więcej realnych strat; ewentualna zmiana progu to decyzja właściciela (ABC przez orkiestratora).
LEDGER/REPIN Rust: port nie ma tej ścieżki (grep rust-port: brak), wpis niepotrzebny.
