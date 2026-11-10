STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-CAPITAL-Q1
GOAL: tymczasowa zasada wojny: cala armia AI i barbarzyncow idzie na aktualna stolice przeciwnika, gracz nie dostaje rozkazow, jedna flaga wylacza.
RUNDY: 1/5 (obrona Operatora)

## Odpowiedzi na zarzuty

1. PRZYJMUJE (czas calej tury zmierzony).
   - Zmierzylem CALA ture w prawdziwym main.ts (headless Chromium, direct Vite build, ten sam seed Math.random, AI 5 vs AI 1, 20 tur pokoju + wojna). Dwa buildy: flaga OFF i ON.
   - Wojna, tury 1-26: srednia OFF 4247 ms, ON 4376 ms => x1,03 (mediany 4251 / 4323). Kryterium calej tury (<= x1,3) spelnione na zmierzonej konfiguracji.
   - Faza decyzji (harness, 4 AI, 125 jednostek, 15 barb., ~12x wiecej ruchow): x1,43 (po poprawkach 2-3 wzrost z x1,31-1,35; dodatkowo wspolne pole odleglosci bez jednostek jest liczone raz na cel). Faza decyzji to ~1-2% calej tury (55 ms z ~4300 ms), wiec x1,43 fazy = ok. +0,6% tury.
   - NIE_ZMIERZONO: cala tura z DUZA armia w przegladarce (armie w grze po 46 turach: 1-12 jednostek bojowych; brak haka do masowego spawnu). Oszacowanie (nie pomiar): +62 ruchy/ture (harness: 2738 vs 227 ruchow/40 tur) x koszt executeAiCityMove+computePath rzedu <= 2 ms => <= +125 ms (<= 3% tury).
   - Znaleziska uboczne: od wojennej tury 27 endTurn w obu zbudowaniach moze stanac na modalu "Audiencja dyplomatyczna" (oferta wymiany od miasta-panstwa, wymaga decyzji gracza). To zwykle okno gry, nie hang: diagnostyka (smoke5) pokazala inProg=false, modal w DOM, brak bledow. W buildzie OFF modal nie wystapil w tych samych turach, bo trajektoria gry sie rozeszla. Bez zwiazku z regula.
2. PRZYJMUJE (poprawka). Stala odleglosc byla realna wada: obie grupy szly 1 hex/ture. Teraz wieksza grupa CZEKA na miejscu (`held`), dopoki doganiajaca ja grupa faktycznie sie zbliza w tej turze; zbiorka konczy sie, gdy grupy sa w promieniu laczenia (3) i staja sie jedna grupa. WAR_ALLIN_MERGE_RADIUS 8 -> 10. Blisko stolicy (<= 3) bez czekania. Dowod (sekcja 10 testu, wykonanie planu jak silnik, w kolejnosci rozkazow):
   - grupa z boku (odstep 7): zlaczona w 2 tury, rozstaw po 30 turach <= 5 (dawniej staly odstep 4 do stolicy),
   - grupa 9 hexow z tylu: zlaczona w 6 tur (dawniej 5-9 tur spoznienia), po zlaczeniu rozstaw <= 5,
   - mutacja (wylaczenie czekania): 3 FAIL (8c, 8c2, 10c: zlaczenie dopiero w 32 turze).
   - Koszt: w opoznionym otwarciu czesc armii stoi (zbiorka). W harnessie AI<->AI w 20 turach 248/320 jednostko-tur to ruch (77%); test 1k wymaga >= 70%. To jawne odstepstwo od "zero bezczynnych" na rzecz realnego scalania (wprost wg propozycji Evaluatora: "lider czeka na grupe z tylu").
3. PRZYJMUJE (poprawka).
   - Pole odleglosci jest teraz statyczne (teren + obce miasta), jednostki NIE sa w nim przeszkoda (`nav.occupied` tylko ogranicza wybor kroku) => brak krokow wstecz; wybierany jest sasiad STRICTE blizszy celu w polu, a gdy wolnych brak, krok boczny bez wzrostu dystansu, inaczej `held`.
   - Rozstrzyganie sekwencyjne, front kolumny pierwszy; jednostka z tylu wchodzi na heks zwolniony przez przednia (kolejnosc `plan.orders` = kolejnosc wykonania; ai.ts i barbarians.ts emituja komendy w tej kolejnosci). Kazdy wybrany heks jest rezerwowany: zero dwoch jednostek na tym samym heksie docelowym.
   - `noPath` = wylacznie brak sciezki ladowej; "otoczona" -> `held`.
   - Dowod (gesta grupa 10 jednostek, 30 tur, wykonanie jak silnik): noPath 0, kroki wstecz 0, duble 0, nieudane (zajety heks) 0, kazda jednostka ma rozkaz albo jawny powod postoju. Wczesniej: 2 jednostki bez rozkazu, 3 kroki wstecz, 1 duble.
   - Barbarzyncy: jednostki w kontakcie z wrogiem dostaja atak (nie sa planowane), komendy marszu w kolejnosci planu.
4. PRZYJMUJE (poprawka, nota). ai.ts `applyWarAllInCapitalToCommands`: jednostki `embarked`/`seaRaider` wylaczone z reguly i zachowuja dotychczasowe komendy (parytet z barbarzyncami). Test statyczny 9g.
5. INFORMACJA, bez zmiany: kopie obronne miast-panstw pominiete, AI zna polozenie stolicy przez mgle (zalozenia Operatora 1 i 4, jawne). Uwaga: jednostka AI(5) stojaca 27 tur w smoke Evaluatora to ta kopia obronna.

## Zmiany (poza allowlista nic)
- `gra/src/game/warAllInCapital.ts` (pole statyczne, sekwencyjny wybor kroku, zbiorka z czekaniem, `held`).
- `gra/src/game/ai.ts` (`occupied`, wykluczenie embarked/seaRaider).
- `gra/src/game/barbarians.ts` (`occupied`, komendy w kolejnosci planu, atak dla jednostek w kontakcie).
- `gra/tools/war-allin-capital-test.cjs` (1h, 1k, 8c-8e, nowa sekcja 10, 9g), `gra/tools/war-allin-capital-harness.cjs` (licznik `moveBlockedByUnit`).
- Zero zmian: gra-robocza, WERSJE.md, rust-port, src-tauri, package-lock.json.

## Testy
- `war-allin-capital-test.cjs` 79/0 (sekcja 6: flaga OFF == baza origin/main, hash identyczny w 4 scenariuszach; determinizm ON 3 scenariusze).
- `tsc --noEmit` EXIT=0. Direct Vite build (2 warianty, ON/OFF, artefakty w scratchpadzie, nie publikowane) EXIT=0.
- logic-test 213/213, barbarians-test 213/0, barbarzyncy-krazenie 249/0, barb-city-behavior 177/0, ai-test 276/18 (te same 18 co baza).
- Rodzina ai-*/ai2-*/barb*/forced-war*/city-state-*/mgla-* (89 plikow): 16 czerwonych. 11 + ai-test to dokladnie te same, ktore sa czerwone na bazie 75f53d58 (lista Evaluatora: ai-zdobycie-miasta-adiacencja, mgla-sciezka-inwariant, ai-balans-step3, ai-dlug-porzadki-q1, ai-major-economy, ai-ulepszenia-malo-budowane, ai2-heks-po-heksie, barb-camp-destruction, forced-war-bronze-main-guard, forced-war-bronze-new-game-reset, city-state-offensive-normal-easy). Pozostale 4 (ai-buduje-budynki, city-state-offensive-live, city-state-start-units-live, forced-war-trojstronna-domino-live) to testy przegladarkowe wymagajace wlasnego buildu/serwera; w tym srodowisku koncza sie bledem uruchomienia (city-state-start-units-live: wyjatek launchera). NIE_ZMIERZONO wzgledem bazy.
- AI<->AI 90 tur (harness aiVsAi): 44 bitwy, 5 przejec stolic, 3 ruchy odrzucone przez zajety heks (stats.moveBlockedByUnit).

BLOKADY: brak. NIE_ZMIERZONO: cala tura z duza armia w przegladarce (oszacowanie wyzej); dwa testy przegladarkowe ai-buduje-budynki i ai-wojny-zwykle-cap nie byly porownywane z baza.
NASTEPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
