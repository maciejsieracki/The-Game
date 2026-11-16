STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-OLD-SAVE-ZERO-CITIES-NO-AWAIT-FIRST-CITY-Q1
GOAL: stary zapis (bez playerEverOwnedCityByOwner) z turą > 1 nigdy nie wraca do „czekam na pierwsze miasto” (ABC A, 2026-11-16).
ZMIANY/COMMIT: kandydat eeeb518b58f4a8a8448504682f34b35735805c98 jest potomkiem bazy ef6e8ea1ee (merge-base --is-ancestor: tak; baza jest też przodkiem aktualnego origin/main aea463644). Diff vs baza: gra/src/main.ts +8 (else-if saved.tura > 1, ~49267), gra/tools/save-load-player-owned-city-test.cjs +5, nowe gra/tools/save-load-old-save-compat-live.cjs, pliki runu/evidence. Allowlista zachowana; brak WERSJE.md/manifest/gra-robocza/rust-port.
TESTY (surowe, samodzielnie): tsc --noEmit EXIT 0; save-load-player-owned-city-test RESULT: PASS (3 mutacje wykryte); load-game-regression 34 PASS / 0 FAIL; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0. git merge-tree z aktualnym origin/main (aea463644): czysty (tree d4f08a67f0); git diff --check: czysto. Bieg live i mutację żywą zmierzył Evaluator/Obrona (evidence/*POST-FIX*, nocity-mutant-*); FC ich nie powtarzał (NIE ZMIERZONO przez FC).
ZARZUTY:
 1. DO DECYZJI CZŁOWIEKA (nieblokujące). Skutek zamierzonej decyzji ABC A + istniejącej reguły R-WEB-DEFEAT-LAST-CITY: stary zapis 0 miast z tura>1 -> awaiting=false, 1 tura działa, potem gameOver. Kod zgodny z GOAL; kryterium "3x" przeformułować na ">=1 tura, brak blokady awaiting". Wątpliwość o osadnikach odrzucona (checkDefeat nie bierze jednostek). Pytanie do właściciela: czy zapis 0 miast ma kończyć się przegraną (A, obecne) czy nie (B, osobny temat).
 2. ODDAL. Dowody po poprawce są w evidence/ (POST-FIX, mutant); stare pliki COMPAT-Q1 to historia, nie dowód.
 3. ODDAL. Regex jako warunek statyczny spójny z resztą testu; zachowanie pokryte żywą mutacją; pusta flaga przy tura>1 praktycznie nieosiągalna, skutek taki sam jak dla starego zapisu.
 Brak NAPRAW => nie FAIL.
BLOKADY: brak techniczny. NIE ZMIERZONO: seed 777 roundtrip, ekonomia po wczytaniu zapisu 0 miast, MP/hotseat, pozostałe bramki referencyjne (mapa, mgła, AI buduje itd.) - zmiana dotyka tylko ścieżki wczytania zapisu.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (merge eeeb518b5 do main); ABC do właściciela ws. zarzutu 1 (A/B); opcjonalnie dodać narzędzie live do bramek.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: 10-operator-claude.md zawiera błędną przyczynę (NNS) - wycofana w 30-obrona; stare evidence w COMPAT-Q1 jest sprzed poprawki.
