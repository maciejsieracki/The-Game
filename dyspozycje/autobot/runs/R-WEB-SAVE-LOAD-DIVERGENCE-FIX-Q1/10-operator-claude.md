# R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX) — raport Operatora, runda 1/5

STATUS: BLOCK
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: znaleźć przyczynę rozbieżności po wczytaniu zapisu (B != A) i naprawić tak, by B == A przez 6 tur po wczytaniu.
BAZA: 9d6750a73 (origin/main), worktree detached, bez zmian w kodzie gry (instrumentacja tymczasowa wycofana).
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/10-operator-claude.md). Brak poprawki kodu.

## 1. Odtworzenie (krok 1 z dispatchu) — POTWIERDZONE
Seed 4242, cfg max, zapis po t3, K=6 (savedigest-run.cjs, tryb A i B, dist zbudowany `vite build` poza repo).
- A (ciągły): t4 nUnits 49, nCities 43, lenNoPP 41902, fnvNoPP 837e7646; t5 fnvNoPP 74adf62d; t6 nUnits 65
- B (wczytany): t4 nUnits 49, lenNoPP 44672, fnvNoPP 5d8f4489; t6 nUnits 66
- Rozbieżność zaczyna się w TURZE 4 (pierwszy tick po wczytaniu) — zgodnie z dispatchem.
- Wiersz "restore" (t3) różni się od "snap" tylko reprezentacją (len 44389 vs 41659; lenNoPP 42798 vs 40068): dodane domyślne pola miast (postepBudynkowUsuniete, magazynZywnosci).

## 2. Diagnoza — dowody
a) savedigest-diff.cjs (full() po t4, A vs B): jedyne realne różnice to `cities[city16].wealthState.pula` i `cities[city25].wealthState.pula` (A 3.9, B 3.6375; snapshot 2.425). Pozostałe „added" to wyłącznie pola domyślne (do odfiltrowania).
b) Hak TYMCZASOWY w advanceCityEconomy (tylko miasta-stolice, wyłącznie w buildzie testowym, po teście wycofany) pokazał, że różnica wejścia to `yld.pieniadz` +1 w obu stolicach AI (A 2, B 3). Ponieważ `pula` maleje o `rownowaga * pieniadz`, to wyjaśnia mniejszy przyrost pula w B.
c) Ten sam zrzut pokazał szerszą różnicę: `pracaTerenu`, `glinaTerenu`, `drewnoTerenu`, `zdrowie` (znak ±2) różnią się w wielu stolicach, czyli RÓŻNY jest zbiór przypisanych pól pracy (`cityWorkedTilesForEconomy` → `resolveWorkedTiles` na `map.hexes`). Parametry miasta (`ec`: podział, ludność, racja, specjaliści) są identyczne; mnożniki `orderMult` identyczne; `wonderCityYieldsByOwner` brak w obu.
d) Save NIE zawiera mapy w polach stanu gry (buildSaveGameSnapshot nie serializuje `map`), ale zawiera `mapSnapshot: serializeMapForSave(map)` (main.ts ok. 42946) — to jedyne miejsce, gdzie stan hexów (nakladka/ulepszenia/zloze) trafia do zapisu.
e) Odczyt: `mapSnapshot` jest używany WYŁĄCZNIE w `regenerateWorldForLoad` → `loadMapForSave` (main.ts ok. 50905–50930). Ścieżka ta działa tylko gdy `loadNeedsMapRebuild` zwróci true (main.ts ok. 10580): dla wczytania z pauzy w tej samej grze (ten sam seed i ustawienia mapy) mapa NIE jest odbudowywana i zostaje in-memory mapa z momentu wczytania, czyli po zmianach hexów wykonanych po zapisie.
f) `__detHarness.restoreJson` (main.ts ok. 33723) woła `restoreGameFromSave` bezpośrednio, bez `mapSnapshot` i bez odbudowy mapy. Tryb B startuje świeżą sesją `startNewGame` (mapa wygenerowana z seeda, bez zmian runtime), więc mapa B nie ma hexowych zmian z turn 1–3, które są w mapie A.
g) Runtime zmienia `hex.nakladka` (city-hex-clear.ts:51/67/75, playtestMiastoEkonomia.ts, gen-helpers.ts) — to realne zmiany mapy w trakcie gry, nie tylko w generatorze.

Wniosek ROBOCZY (NIE POTWIERDZONY do końca, wymaga rundy 2): przyczyną jest stan HEKSÓW mapy (nakladka/ulepszenia po zmianach runtime), który jest zapisany w `mapSnapshot`, ale NIE jest przywracany przez `restoreGameFromSave` (ścieżka harnessu) ani przy wczytaniu w tej samej grze (`loadNeedsMapRebuild` = false). Różnice pracy/zdrowia w stolicach są spójne z różnym zbiorem przypisanych pól, a różnica pieniądza +1 wynika z tego samego. Nie wykluczono, że część różnic to inny mechanizm (np. `reconcileAllWorkedTiles` przy wczytaniu, ok. main.ts 52519) — NIE ZMIERZONO.

Odrzucone / nie zawinione w tej analizie: Math.random (seed deterministyczny w addInitScript), liczniki ID (detIdSeq rozjeżdża się dopiero jako skutek), `wealthImmunityRemaining`/`imm` (identyczne), `orderMult` (identyczne), mennica-zloto-grace (pola zapisywane w meta.mennicaZlotoGrace i odtwarzane; NIE ZMIERZONO, czy stan zdolny do różnicy: w zrzucie `mq` = false w obu przebiegach).

## 3. Poprawka — NIE WYKONANA
Brak poprawki kodu w tej rundzie: przyczyna nie została sprowadzona do jednego pola potwierdzonym bisektem (krok 2 dispatchu wymaga bisekcji po restoreJson lub zrzutu map, nie wykonanej w czasie rundy). Kandydat na rundę 2: (1) zrzut `map.hexes` (nakladka/ulepszenia/zloze) w A po t3 i w B po restore, porównanie; (2) jeśli różne — przywrócenie hexów z `saved.mapSnapshot` w `restoreGameFromSave` (opcjonalne pole, stary zapis bez pola = bez zmian) oraz wymuszenie odbudowy mapy w `loadNeedsMapRebuild` dla wczytania w tej samej grze. Ten kandydat zmienia zachowanie wczytania w grze — wymaga weryfikacji, czy nie wymaga decyzji właściciela (raczej nie: to naprawa zapisu, nie balans).

## 4. Testy
- Nie dodano nowych testów (brak poprawki). Bramki (tsc, logic 213, ai-test 297/0 itd.) NIE URUCHOMIONE — brak zmian w grze, uruchomienie zbędne w tej rundzie. NIE ZMIERZONO.
- Pomiar live (savedigest-run.cjs, dist poza repo): seed 4242, cfg max, n=3, k=6 (A i B); instrumentowany (n=3, k=1) — wyniki j.w.

## 5. Zgodność wsteczna / mutacja czerwona
NIE ZMIERZONO (brak poprawki).

## 6. Uwagi dla orkiestratora
- Hipoteza z pkt 2d–2f jest istotna także dla gry (wczytanie w tej samej grze może nie przywracać hexów); warto ją zweryfikować w rundzie 2 zanim powstanie kolejny temat.
- Worktree: node_modules zainstalowany w gra/ (npm ci) do pomiarów; usunę przed zakończeniem.
- Dysk: 17 GB wolne przed startem.

RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: NIE)
NASTĘPNY KROK: runda 2 — pomiar różnic hexów (map.hexes) A vs B po t3, potem poprawka przywracania hexów z mapSnapshot, jeśli potwierdzona.
DEPLOY/PUSH: NIE WYKONANO
