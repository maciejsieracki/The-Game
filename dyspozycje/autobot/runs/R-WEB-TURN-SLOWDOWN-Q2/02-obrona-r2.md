STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TURN-SLOWDOWN-Q2
GOAL: Odpowiedź na 7 zarzutów Evaluatora rundy 1 (FAIL) do commita `0f041ad6`.
RUNDY: 2/5 · Operator (obrona), Opus 5.5 medium. Poprawki P1–P4 w `gra/src/main.ts` są bez zmian. Doszły tylko haki tylko-do-odczytu oraz narzędzia pomiarowe i testowe.

Pomiar w rundzie 2 to dwa przebiegi po 82 tury, PRE i FIX, z profilem CPU **każdej** tury i **każdego** otwarcia panelu miasta (`--profile-all`). Konfiguracja jest ta sama co w rundzie 1: seed 778899, mapa Mała, 6 rywali. Skróty stanu PRE i FIX są zgodne w 81 z 81 tur, końcowy `38f4691e` (`evidence/r2-compare-js-pre-vs-fix.txt`). Wykres: `evidence/r2-chart-js-pre-vs-fix.png` (145 kB).

## Z1 — bramka przy 24 turach nie sprawdzała P2 per miasto: PRZYJMUJĘ
- `web-turn-slowdown-test.cjs`: domyślnie `TURNS=40`. Nowa asercja **M**: co najmniej jeden gracz AI ma ≥2 miasta przez ≥3 tury przed końcem przebiegu. Liczbę miast daje nowy hak `citiesPerOwner()` w `main.ts`.
- Nowa zmienna `TURN_SLOWDOWN_TEST_EXTRA_REPLACE` mutuje wyłącznie lustro FIX w katalogu tymczasowym. Drzewo repo zostaje nietknięte.
- Powtórzyłem mutację Evaluatora (`evidence/r2-mutacja-p2-one-memo.json`) przy 40 turach. Wynik: **FAIL D1** (`firstDiff` T33: `0916add3` vs `cd406af5`). M przechodzi: 18 tur z graczem AI o ≥2 miastach, pierwsza T22 (`evidence/r2-gate40-mutacja-p2.log.txt`).
- Wersja bez mutacji przy 40 turach: D1 39/39, M OK (`evidence/r2-gate40-final.log.txt`).

## Z2 — kryterium (4) dla czasu tury oparte na czasie ściennym ze swiftshaderem: PRZYJMUJĘ
Wycofuję „spełnione”. Nowe kolumny `turnJsMs`/`cityJsMs` liczą czas JS z profilu CPU, czyli próbki bez `(program)` i `(idle)`. Tabela pokazuje iloraz T70–80 / T10–20.

| Pomiar | PRE | FIX |
|---|---|---|
| Czas JS tury | ×6,28 (717→4503 ms) | **×2,50** (479→1196 ms) |
| Czas JS panelu miasta | ×3,28 (240→786 ms) | **×1,84** (185→342 ms) |
| Czas ścienny tury (informacyjnie) | ×1,51 | ×1,25 |

Kryterium (4) liczone na czasie JS **nie jest spełnione**. Korzystam z gałęzi „albo uzasadnienie”:
- Gra rośnie w tym czasie: miasta ×3,60 (10→36), jednostki ×7,88.
- Elastyczność to ln(iloraz kosztu) / ln(iloraz miast). Dla czasu JS tury wynosiła 1,43 przed poprawką (koszt rósł szybciej niż gra) i 0,71 po niej (wolniej niż gra). Dla panelu miasta: 0,93 → 0,48.
- Pozostały wzrost opisuje Z3.

`(program)` w turze FIX rośnie z 5900 do 6834 ms (×1,16). P1–P4 to czysty kod JS, nie ruszają renderowania. Liczba wywołań rysowania (`drawCalls`, nowy hak `renderInfo()`) rośnie ×1,57, tak samo w PRE i FIX, bo stan gry jest identyczny. Przypisanie przyrostu `(program)` wywołaniom rysowania: NIE_ZMIERZONO (to korelacja).

## Z3 — źle policzone „żadna funkcja >5%”: PRZYJMUJĘ
- `profile-summary` liczy teraz `%JS` względem czasu JS (`evidence/r2-profile-*.txt`).
- Panel miasta T73 FIX: czas JS 306,8 ms. Największe funkcje: `computeTerritoryResourceYieldByCity` (turn-economy.ts:806) 10,6%, `okolicaTiles` (okolica.ts:152) 7,3%, `hexKeysWithinRadius` (okolica.ts:66) 6,0%. Teza „żadna funkcja >5%” była fałszywa i ją wycofuję.
- Przyrost T13→T73, nowe narzędzie `web-turn-slowdown-growth.cjs` (`evidence/r2-growth-fix-city13-73.txt`): +104,7 ms. Około 74% tego przyrostu to rodzina okolicy i terytorium, czyli koszt per miasto w sporach o pola:
  - `okolicaTiles` +22,3
  - `hexKeysWithinRadius` +16,3
  - `computeLostToNearerSiblingByCity` +15,2
  - `hexDistance` +9,4
  - `territoryOwnerAt` +7,0
  - `axialDistance` +6,9
- W turze T12→T72 (+658,5 ms) ta sama rodzina daje ok. 34% przyrostu.
- To kolejny kandydat do poprawki (P5: pamięć okolicy i sporów na czas jednego HUD/tury). **Nie naprawiam go w tej rundzie**: wymaga osobnego dowodu determinizmu. Teza „naturalny wzrost ×4” jest zastąpiona tym pomiarem.

## Z4 — brak dowodu na wzrost tekstur w turach 7–9: PRZYJMUJĘ
- Nowe narzędzie `web-turn-slowdown-texsmoke.cjs` odtwarza smoke z poprzedniego tematu: UI, seed 7, Epoka kamienia, 1400×900.
- Spis tekstur z tożsamością pochodzi z haka `textureCensusDetail()` (`evidence/r2-texsmoke-diff.txt`, `.json`, `.log.txt`).
- T7, 18→21: doszły `id=244`, `id=245` `Mesh:CANVAS:72x126` w `unitStatPlatePower`. To cyfry Mocy z pamięci `powerDigitTex` (najwyżej 10 sztuk, `render/unitStatPlate.ts:545`; w rundzie 1 podałem błędnie :539). Trzecia nowa tekstura to dodatkowy sprite 64×64.
- T8, 21→22: dodatkowa etykieta `Sprite 226x48`. W T9–T10 liczba stoi na 22.
- Przebiegi 82-turowe mają nowy plik `*-textures.csv` (`evidence/r2-{pre,fix}-textures.csv`). Liczba tekstur 72×126 rośnie skokowo 2→4→6→8, w tych samych turach co `textures` (T41, T44, T62). Od T66 do T82 jest stała 23, więc pamięć jest ograniczona.

## Z5 — brak asercji kosztu dla P4: PRZYJMUJĘ
Nowa asercja **K4** to pomiar bezpośredni. Po ostatniej turze, gdy skróty D1 są już zebrane, nowy hak `timeTerritoryRatesMs(n)` w `main.ts` mierzy 5 serii po 20 wywołań `empireTerritoryResourceRatesForOwner` gracza. Brane jest minimum serii. Warunek: FIX < 85% PRE.

Dwie wcześniejsze wersje K4 z profilu CPU jednej tury okazały się szumem i zostają w logu tylko informacyjnie:
- cała funkcja: 206,9 vs 206,5 ms (`evidence/r2-gate40-k4old.log.txt`);
- tylko część pod `computeWorked…`/`computeLostToNearer…`: 85,3 vs 108,1 ms, FAIL (`evidence/r2-gate40-k4profil-fail.log.txt`). Offline na przebiegach 82-turowych ta sama metryka dawała T39 40,7 vs 108,4 ms i T72 146,9 vs 407,7 ms (`evidence/r2-k4-offline-js82.txt`).

**Bramka wykrywa cofnięcie P4.** Mutacja `evidence/r2-mutacja-p4-revert.json` (`cities.filter(owner)` → `cities`), uruchomiona sama:
- K4 **FAIL**: 87,3 vs 94,6 ms;
- D1 OK, czyli P4 nie zmienia wyniku gry;
- log: `evidence/r2-gate40-mutacja-p4.log.txt`.

**Obserwacja poboczna (ZAŁOŻENIE na przyszłość).** Ta sama mutacja uruchomiona RÓWNOLEGLE z drugą bramką dała FAIL D1 w T15 (`evidence/r2-gate40-mutacja-p4-rownolegle-obciazenie.log.txt`).
- Rozjechał się przebieg **PRE**, czyli kod niezmieniony: T15 `18efe513` zamiast `aa709b8b`, który dało 10 innych przebiegów.
- Wniosek: skrót stanu gry jest wrażliwy na obciążenie CPU. Przyczyna: NIE_ZMIERZONO, prawdopodobnie zależność od zegara poza `armyMerge.ts:73`.
- ZAŁOŻENIE: bramki uruchamiamy pojedynczo. Problem zgłaszam jako kandydata na osobny temat.

## Z6 — linie bundla zamiast plik:linia: PRZYJMUJĘ
`profile-summary` ma kolumnę `źródło`:
- pozycja `gra/src/...:linia` znaleziona po nazwie deklaracji, z obsługą sufiksów bundlera `2` i `$1`;
- przy kilku trafieniach wypisuje „niejednoznaczne N”;
- poza źródłem gry wypisuje `[poza gra/src]` (three.js, natywne API przeglądarki).

Streszczenia rundy 1 (`profile-*.txt`) zastępują `evidence/r2-profile-*.txt`.

## Z7 — zawieszenie FIX po T5: ODRZUCAM tezę, że to skutek poprawki. Zawieszenie wystąpiło też w PRE.

**Główny dowód.** Bramka końcowa uruchomiona o 04:04 zawiesiła się w przebiegu **PRE**, czyli w kodzie bez P1–P4, na `endTurn T34`. Watchdog zadziałał o 04:44:31 (`evidence/r2-gate40-zawieszenie-PRE-T34.log.txt`).

Stan procesów w chwili zawieszenia (`evidence/r2-zawieszenie-PRE-T34-procesy.txt`):
- **Proces renderera strony już nie istniał.** Został tylko zapasowy renderer, który przez cały czas zużył 0 jednostek CPU (utime=0). Przyczyną nie jest więc pętla w kodzie gry. To śmierć procesu renderera, a Playwright jej nie zgłosił.
- Średnie obciążenie maszyny wynosiło 11–13 na 4 rdzeniach, bo równolegle działały `rustc`/`esbuild` z innych sesji. Przyczyna śmierci renderera (OOM, crash swiftshadera): NIE_ZMIERZONO, `dmesg` jest pusty.

**Poprawka narzędzia** (`web-turn-slowdown-measure.cjs`):
- `page.on('crash')` i `page.on('close')` zapisują zdarzenie w logu;
- wywołania CDP w watchdogu mają limit 20 s. Wcześniej `Debugger.enable` do martwej strony czekał bez końca i watchdog sam wisiał.

Dodatkowe dowody:
- **Kod.** Diff P1–P4 (`git diff c11f5087 0f041ad6 -- gra/src/main.ts`) nie dodaje `while`, `await`, `Promise`, timerów ani `requestAnimationFrame`. Dodaje tylko skończone pętle `for…of` po tablicach i mapach.
- **Liczba przebiegów.** Od dodania watchdoga (`Debugger.pause` ze stosem po 420 s) przeszło bez zawieszenia ani wpisu `WATCHDOG` co najmniej 9 przebiegów FIX i zmutowanego FIX:
  - 82 tury: `final-fix`, `fix2`, `r2fix`;
  - 24 tury, bramka Evaluatora: ×2;
  - 50 tur, mutacja: ×1;
  - 40 tur, bramki rundy 2: ×3 i więcej.
- **Przerwany przebieg.** Przebieg `r2fix` z 01:30 urwał się w T65 komunikatem „browser has been closed” (`evidence/r2-fix-przerwany-T65.log.txt`). Brak wiersza `EXIT=` z otaczającego skryptu oznacza, że zabity został cały skrypt powłoki, czyli sesja, a nie Chromium. Powtórka przeszła 82/82, EXIT 0.
- **Co zostaje.** Stos pierwotnego zawieszenia z rundy 1 nie istnieje. Jego przyczyna: NIE_ZMIERZONO, najpewniej ten sam mechanizm.

## ZMIANY (runda 2)
- `gra/src/main.ts`: tylko haki tylko-do-odczytu `renderInfo`, `citiesPerOwner`, `textureCensusDetail` oraz `timeTerritoryRatesMs`. Ten ostatni tylko liczy i jest wołany po zebraniu skrótów stanu.
- `gra/tools/web-turn-slowdown-{measure,test,chart,compare,profile-summary}.cjs`: zmienione.
- `gra/tools/web-turn-slowdown-{texsmoke,growth}.cjs`: nowe.
- `evidence/r2-*`: nowe pliki dowodów.

## TESTY
- tsc EXIT 0 (`evidence/r2-tsc.log.txt`).
- logic 213/213, territory-border 9/0.
- `web-turn-slowdown-test.cjs` przy 40 turach: **13 OK / 0 FAIL**, EXIT 0 (`evidence/r2-gate40-final.log.txt`):
  - D1: 39/39 tur identycznych.
  - M: 18 tur z graczem AI o ≥2 miastach.
  - D2: OK.
  - K1: 403,5 → 6,7 ms. K2: 100,1 → 4,5 ms. K3: 98,6 → 2,3 ms. K4: 111,3 → 47,1 ms.
  - Pierwsza połowa tego przebiegu szła równolegle z bramką mutacyjną. Ponowny przebieg w pojedynkę zawiesił się w PRE (Z7) i nie dał wyniku.
- Mutacje, każda wykryta:
  - P2 jedna pamięć: D1 FAIL;
  - P4 cofnięte: K4 FAIL.
- Determinizm na 82 turach: 81/81.
- Determinizm na 82 turach: 81/81.

DEPLOY/PUSH: NIE WYKONANO
