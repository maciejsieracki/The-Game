## RAPORT FINAL CONTROL — R-PRAWO-PRZEBUDOWA-SKALI-Q1 (runda 2)

```
STATUS: PASS
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: main.ts dostaje `hasGarnizonBudynek: builtIds.includes('garnizon')` (jedna linia,
ratyfikacja orkiestratora), z dowodem realnego uruchomienia parytetu panel<->silnik.
ZMIANY/COMMIT: weryfikacja w /home/user/wt-prawo-skala, HEAD 78013f8c (a5a5530c przodkiem,
potwierdzone merge-base). Zero edycji poza allowlistą tej rundy.
TESTY: `node tools/prawo-przebudowa-skali-test.cjs` -> 152 OK, 0 FAIL. tsc --noEmit czyste.
5 bramek referencyjnych zielone (213/213, 19/19, 33/33, 13/13, 6/6). Rodzina Prawo/Porządek
(16 plików) uruchomiona: 13 w pełni zielone; 3 mają FAIL — wszystkie POTWIERDZONE
PRE-ISTNIEJĄCE (identyczne w main HEAD 025d899f, sprzed tego tematu, pliki nietknięte tym
diffem): conquest-stability-test (1 FAIL, kara Szczęścia z innego tematu, jawnie opisane
w komentarzu Operatora), budynek-garnizon-test (1 FAIL, ai.ts infraOrder, temat AI), border-
march-wygasanie-test (4 FAIL, borderMarchEventLog, temat dyplomacji). Zero regresji.
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
```

### Werdykt zarzutu #1

Zarzut trafny co do litery: sekcja 3k liczy wyodrębnione wyrażenie przez regex+`new
Function`, nie main.ts jako zbudowany-i-wykonany moduł w pełnym kontekście gry. Obrona
przyjęła zarzut, ujawniła kompromis i dołożyła nową asercję: realny `esbuild.build()`
(async, z loaderami .css/.svg/.png i pluginem zaślepiającym `?worker&inline`) — main.ts
faktycznie się buduje w całości (BUILD_OK, zweryfikowałem niezależnie identycznym wynikiem
BUILD_OK 16015382 skrótem innej ścieżki tmp).

Poszedłem dalej niż obrona: zbudowałem main.ts SAM, osobnym, niezależnym skryptem, i zamiast
wyciągać wyrażenie z surowego źródła (jak 3k), wyciągnąłem je z SAMEGO SKOMPILOWANEGO
WYJŚCIA esbuilda (4 wystąpienia `hasGarnizonBudynek` w bundlu — 2 realne miejsca kodu × brak
minifikacji). Potwierdziłem, że linia main.ts (`builtIds.includes("garnizon")`) przetrwała
bundlowanie nienaruszona, identyczna z linią cityPanel.ts, i dała identyczny wynik dla 4
scenariuszy builtIds po realnym wykonaniu obu wyrażeń z tekstu bundla (nie źródła). To
mocniejszy dowód niż 3k — zamyka lukę "czy esbuild coś przestawia/usuwa" nie tylko "czy da
się zbudować".

Pozostały ujawniony kompromis (brak pełnego `boot()`/tick w kontekście canvas/DOM/world
state) jest proporcjonalny do zakresu rundy (main.ts: 1 linia) i spójny z metodą już
istniejącą w 3i (też woła `computeLawBreakdown` bezpośrednio, nie przez `boot()`). Kryterium
(b) ratyfikacji — "realnym uruchomieniem... nie tylko że kod istnieje" — spełnione na
poziomie jedynej zmienionej linii, co jest właściwym poziomem granularności dla zmiany
jednolinijkowej. **WERDYKT: ODDAL.**

### Własna weryfikacja (5 mutacji + diff + parytet)

1. `git diff a5a5530c HEAD -- main.ts` = dokładnie 1 insercja, treść zgodna co do znaku
   z ratyfikacją.
2. Własny, niezależny build+execute main.ts<->cityPanel.ts na poziomie SKOMPILOWANEGO
   bundla (opis wyżej) — parytet potwierdzony dla 4 scenariuszy.
3. Mutacja main.ts `'garnizon'`→`'WRONG_ID'` → 2 FAIL (3k), przywrócone kopią, `git diff
   --quiet` czyste.
4. Mutacja `prawo_max_epoka.hard[2]` 100→999 → 5 FAIL, przywrócone, czyste.
5. Mutacja kolizji id `garnizon_budynek`→`garnizon` → 24 FAIL, przywrócone, czyste.
6. Mutacja `prawo_pct_cap.normal` 170→100 → 2 FAIL, przywrócone, czyste.

**Agregat:** zero `NAPRAW`, zero `DO DECYZJI` → **PASS**.
