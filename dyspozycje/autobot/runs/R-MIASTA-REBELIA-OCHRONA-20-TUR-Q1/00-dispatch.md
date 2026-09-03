TEMAT: R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/post-capture-law.ts (glowny, nowy licznik), gra/src/game/cities.ts (nowe pole City),
gra/src/main.ts (wiazanie: bunt→stempel, tick co ture, oba lejki przejecia miasta, wypowiedzenie wojny)
MODEL+EFFORT: claude-sonnet-5, effort high (rdzenna logika dyplomacji/wojny, wysokie ryzyko regresji na
traktatach/AI; najbardziej design-heavy z trzech tematow tej serii)

WYZWALACZ (dosłownie od właściciela)
"musimy zmienić zasadę, że przez 20 tur od momentu, kiedy dane państwo lub miasto zbuntuje się
przeciwko danej cywilizacji, obowiązuje okres ochrony. Jeśli inna cywilizacja zaatakuje to miasto,
traktuje je tak, jakby zaatakowała cywilizację, która wcześniej je posiadała, ponieważ znajduje się
w strefie wpływu tej poprzedniej cywilizacji i jest przez nią uznawane za własny teren. Nie można
więc atakować przez 20 tur miast, które zbuntowały się przeciwko innej cywilizacji, bo w przeciwnym
razie trzeba wypowiedzieć wojnę, co łamie wszystkie traktaty. Zasada obowiązuje obie strony – zarówno
gracza, jak i AI innych cywilizacji. Takie podejście spowoduje, że nawet jeśli jakieś miasto się
zbuntuje, to gracz ma jeszcze czas, aby je odzyskać i zareagować."

RECON (nie powtarzaj — już wykonane przez Explore agenta tej sesji i przez orkiestratora w locie)
- Istnieje juz DOKLADNIE analogiczny, dzialajacy mechanizm licznika-po-buncie do skopiowania:
  `gra/src/game/post-capture-law.ts` — `POST_CAPTURE_REBELLION_RECONQUEST_TURNS=10`,
  pole `postCaptureLawTurnsRemaining?: number` w interfejsie `PostCaptureLawCity`, funkcja
  `tickPostCaptureLawEndOfTurn(city)` (odlicza co ture, usuwa pole gdy dojdzie do 0), wywolywana
  w `main.ts:27826` wewnatrz petli per-miasto na koniec przetwarzania tury tego miasta. NOWY licznik
  `rebelProtectionTurnsRemaining` ma byc analogicznym, ODDZIELNYM polem/funkcja tick — NIE ma
  zastepowac ani mieszac sie z `postCaptureLawTurnsRemaining` (inny cel: tamten daje bonus Prawa
  odbitemu miastu, ten nowy chroni ZBUNTOWANE, jeszcze NIE odbite miasto przed przejeciem przez
  TRZECIA strone bez konsekwencji dyplomatycznej).
- `markCityRebellionStarted(city)` (main.ts:27755, wewnatrz bloku
  `if (graceUpd.shouldTriggerRebellion && city.ownerId === 0 && !city.rebelState)`) juz zapisuje
  `city.rebelPreviousOwnerId = city.ownerId` PRZED zmiana `city.ownerId` na `REBEL_FACTION_OWNER_ID`.
  To jest dokladnie miejsce, gdzie nalezy dodatkowo wystartowac nowy licznik
  `city.rebelProtectionTurnsRemaining = 20`.
- UWAGA: `city.ownerId === 0` w warunku wyzwalajacym bunt (main.ts:27755) sugeruje, ze dzisiejszy
  kod buntu dotyczy WYLACZNIE miast gracza (ownerId 0). Sprawdz w locie, czy bunty miast AI (innych
  cywilizacji) przechodza przez INNA sciezke kodu (osobny blok, inna funkcja) — jesli tak, nowy
  stempel `rebelProtectionTurnsRemaining`/`rebelPreviousOwnerId` musi byc dodany do WSZYSTKICH
  miejsc, gdzie miasto dowolnej cywilizacji (gracza LUB AI) przechodzi w `rebelState=true`, bo
  zasada ma dzialac symetrycznie dla obu stron zgodnie z wyzwalaczem.
- `applyPostCaptureLawOnCapture(city, newOwner, prevOwner)` (post-capture-law.ts:50-64) dziala PRZY
  KAZDYM przejeciu miasta (fresh lub reconquest) i na koncu BEZWARUNKOWO kasuje
  `city.rebelPreviousOwnerId` (linia 63). Znaleziony jeden literalny call site w
  `main.ts:12750` wewnatrz `resolveSiegeSurrender` (main.ts:12731-12834). Zweryfikuj W LOCIE
  (swiezym grepem, nie ufaj tej liczbie) czy i GDZIE dokladnie druga sciezka przejecia miasta —
  `runCapitalCapturePlunder` (main.ts ok. 24747-24861) i/lub `applyCityCaptureToMap`
  (main.ts ok. 25033-25142) — rowniez wola `applyPostCaptureLawOnCapture` (byc moze posrednio,
  przez wspolna funkcje, albo w ogole NIE, co bylby osobny, wart odnotowania fakt). Nowa logika
  wypowiedzenia wojny MUSI odczytac `city.rebelPreviousOwnerId` i
  `city.rebelProtectionTurnsRemaining` PRZED jakimkolwiek wywolaniem, ktore je kasuje (kolejnosc
  odczytu ma znaczenie — patrz REGULA PRZECIW SAMOOSZUKIWANIU nizej).
- `ownerDeclareWarOn(attackerId, defenderId)` (main.ts:9320-9348) jest funkcja skutkow ubocznych
  wypowiedzenia wojny (lamie traktaty przez `breakTreatiesOnWar`, `applyAllianceObligationsOnWar`,
  zmienia relacje dyplomatyczne, komunikaty). Ma na wstepie
  `if (isPeaceLockedBetween(attackerId, defenderId)) return;` — TEN guard z definicji zablokowalby
  wlasnie ten scenariusz (para w formalnym pokoju/traktacie), a to jest DOKLADNIE przypadek, ktory
  wyzwalacz chce wymusic ("trzeba wypowiedziec wojne, co lamie WSZYSTKIE traktaty"). Wymagane jest
  wiec swiadome ODSTEPSTWO od tego guardu WYLACZNIE dla tej jednej, nowej sciezki wywolania — patrz
  GOAL punkt 3.
- `BARBARIAN_OWNER_ID`/`isBarbarian(...)` (main.ts import linia 1125) istnieje jako odrebna
  kategoria wlasciciela, nie-cywilizacyjna, bez traktatow/dyplomacji w zwyklym sensie.

GOAL
1. Gdy miasto (gracza LUB dowolnej cywilizacji AI) traci wlasciciela na rzecz buntu
   (`rebelState=true`, `ownerId=REBEL_FACTION_OWNER_ID`), zapamietaj — analogicznie do juz
   istniejacego `rebelPreviousOwnerId` — takze nowy licznik `rebelProtectionTurnsRemaining=20`
   (nowa nazwana stala `REBEL_PROTECTION_TURNS=20` w `post-capture-law.ts`, obok istniejacych
   `POST_CAPTURE_FRESH_TURNS`/`POST_CAPTURE_REBELLION_RECONQUEST_TURNS`).
2. Licznik odlicza co ture (nowa funkcja analogiczna do `tickPostCaptureLawEndOfTurn`, np.
   `tickRebelProtectionEndOfTurn(city)`), wywolywana w tym samym miejscu/petli co
   `tickPostCaptureLawEndOfTurn` (main.ts ok. 27826), ale BEZWARUNKOWO (nie tylko gdy
   `postCaptureLawActive`) — dla kazdego miasta w stanie `rebelState=true` z aktywnym licznikiem.
3. Gdy w oknie ochrony (licznik > 0, miasto wciaz `rebelState=true`, jeszcze NIE odbite) NASTAPI
   faktyczne PRZEJECIE tego miasta (zakonczone zdobycie, nie sam atak/oblezenie w trakcie) przez
   dowolna cywilizacje INNA niz `rebelPreviousOwnerId` — nowy zdobywca ma zostac potraktowany tak,
   jakby wypowiedzial wojne `rebelPreviousOwnerId`: wywolaj pelne skutki uboczne wypowiedzenia wojny
   (te same co `ownerDeclareWarOn` — zerwanie traktatow, `breakTreatiesOnWar`,
   `applyAllianceObligationsOnWar`, zmiana relacji dyplomatycznej, komunikaty) WYLACZNIE dla tej
   pary, NAWET jesli `isPeaceLockedBetween(zdobywca, rebelPreviousOwnerId)` bylby dzis prawda.
   Zaimplementuj to jako minimalne, addytywne rozszerzenie — np. opcjonalny parametr
   `force?: boolean` na `ownerDeclareWarOn` (domyslnie `false`, zachowuje 100% dzisiejsze
   zachowanie dla WSZYSTKICH innych wywolan) uzywany WYLACZNIE w tej nowej sciezce. Nie zmieniaj
   zachowania `ownerDeclareWarOn`/`isPeaceLockedBetween` dla zadnego innego istniejacego wywolania.
4. Jesli zdobywca TO `rebelPreviousOwnerId` (bylej wlasciciel odzyskuje wlasne miasto) — brak
   nowej konsekwencji wojennej (to normalne odbicie, juz obslugiwane przez istniejacy
   `isRebellionReconquest`/bonus Prawa). Licznik `rebelProtectionTurnsRemaining` jest kasowany
   razem z `rebelPreviousOwnerId` w `applyPostCaptureLawOnCapture` (dopisz kasowanie tego nowego
   pola obok istniejacego `delete city.rebelPreviousOwnerId` na linii ~63).
5. Jesli zdobywca to barbarzyncy (`isBarbarian`/`BARBARIAN_OWNER_ID`) — barbarzyncy nie maja
   dyplomacji/traktatow z cywilizacjami w sensie tego mechanizmu, wiec konsekwencja wypowiedzenia
   wojny (punkt 3) NIE ma zastosowania (nie ma komu wypowiedziec wojny w znaczeniu tego systemu).
   To NIE jest blokada — barbarzyncy moga nadal przejac chronione zbuntowane miasto, po prostu bez
   sztucznego trigger'a wojny. Jesli w trakcie implementacji odkryjesz, ze dzisiejszy kod juz i tak
   uniemozliwia barbarzyncom przejmowanie miast rebelianckich (inny mechanizm), odnotuj to w
   raporcie zamiast dodawac martwy kod.
6. Po uplywie 20 tur (licznik dojdzie do 0) LUB po odbiciu miasta przez bylego wlasciciela — miasto
   jest w pelni "wolna zwierzyna" (fair game): kolejne przejecia NIE generuja juz zadnej sztucznej
   konsekwencji wojennej wzgledem bylego wlasciciela.
7. Symetria gracz/AI: cala logika (start licznika, tick, konsekwencja wojenna przy przejeciu) MA
   dzialac identycznie niezaleznie od tego, czy zdobywca lub bunt dotyczy gracza czy dowolnej AI —
   zaden warunek `=== 0` (gracz) nie moze ograniczac nowej logiki do samego gracza (chyba ze
   dzisiejszy mechanizm buntu w ogole dotyczy wylacznie miast gracza — zweryfikuj w locie per
   RECON wyzej i jesli tak, odnotuj to jako fakt stanu wyjsciowego, nie jako celowe ograniczenie
   nowej zasady).

KRYTERIA KOŃCA (binarne)
1. Test symulacji: miasto gracza buntuje sie (rebelState=true), inna cywilizacja AI zdobywa je w
   ciagu 20 tur od buntu — po zdobyciu, para (zdobywca, bylej wlasciciel gracza) jest formalnie w
   stanie wojny (traktaty miedzy nimi zerwane), NIEZALEZNIE od tego, czy byli wczesniej w
   traktacie pokojowym/przymierzu.
2. Ta sama symulacja, ale zdobycie nastepuje PO 20 turach od buntu — brak jakiejkolwiek sztucznej
   konsekwencji wojennej; zachowanie identyczne jak dzis przed ta zmiana.
3. Ta sama symulacja z odwrotnymi rolami (AI traci miasto na rzecz buntu, gracz je zdobywa w oknie
   ochrony) — identyczna konsekwencja wojenna (symetria gracz/AI potwierdzona live-testem, nie
   deklaracja).
4. Bylej wlasciciel odzyskuje wlasne zbuntowane miasto w oknie ochrony — zero nowej konsekwencji
   wojennej, dziala dokladnie tak jak dzisiejszy `isRebellionReconquest`/bonus Prawa.
5. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone, oraz nowy/rozszerzony test tego tematu zielony.
6. Zero regresji na istniejacych mechanizmach wypowiadania wojny (`ownerDeclareWarOn` bez
   `force=true` zachowuje sie DOKLADNIE jak dzis, w tym guard `isPeaceLockedBetween`) —
   potwierdzone istniejacymi testami dyplomacji/wojny w bramkach referencyjnych.
7. Zero regresji na istniejacym bonusie Prawa po podboju (`postCaptureLawTurnsRemaining`/
   `wasRebellionReconquest`) — nowy licznik jest w pelni niezalezny, nie zmienia jego wartosci ani
   warunkow aktywacji.

ALLOWLISTA (nic poza tym)
- gra/src/game/post-capture-law.ts — nowa stala `REBEL_PROTECTION_TURNS`, nowe pole w interfejsie
  `PostCaptureLawCity` (`rebelProtectionTurnsRemaining?: number`), nowa funkcja
  `tickRebelProtectionEndOfTurn` (lub analogiczna nazwa), dopisanie kasowania nowego pola w
  `applyPostCaptureLawOnCapture`. Zaden inny mechanizm w tym pliku.
- gra/src/game/cities.ts — WYLACZNIE nowe pole `rebelProtectionTurnsRemaining?: number` w
  interfejsie City (obok istniejacych `rebelState`/`rebelPreviousOwnerId`/
  `postCaptureLawTurnsRemaining` ~922-930), z komentarzem o round-tripie przez save/load
  analogicznym do istniegocych sasiednich pol. Zaden inny mechanizm w tym pliku.
- gra/src/main.ts — WYLACZNIE: (a) miejsce startu licznika przy buncie (obok
  `markCityRebellionStarted(city)`, ~27755, i kazde inne miejsce startu buntu AI jesli istnieje
  osobno — patrz RECON), (b) wywolanie nowej funkcji tick w tej samej petli co
  `tickPostCaptureLawEndOfTurn` (~27826), (c) nowa logika wypowiedzenia wojny w OBU lejkach
  przejecia miasta (`resolveSiegeSurrender` ~12731-12834 i drugi lejek zweryfikowany w locie —
  `runCapitalCapturePlunder`/`applyCityCaptureToMap` ~24747-25142), (d) opcjonalny parametr
  `force`/analogiczny na `ownerDeclareWarOn` (~9320-9348) i jego jedno nowe wywolanie z tej
  logiki. Zaden inny mechanizm w tym pliku — w szczegolnosci ZAKAZ zmiany istniejacego zachowania
  `isPeaceLockedBetween` dla jakiegokolwiek INNEGO wywolania `ownerDeclareWarOn`.
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, jakakolwiek zmiana logiki AI-targetingu poza
tym co jest scisle wymagane do konsekwencji wojennej (np. NIE zmieniaj `canEngageOwner` chyba ze
Final Control/orkiestrator jawnie to zatwierdzi jako niezbedne — jesli w trakcie pracy okaze sie,
ze jest to konieczne, zatrzymaj sie ze statusem DECISION_REQUIRED zamiast rozszerzac allowlisty
samodzielnie).

IZOLACJA
worktree /home/user/wt-miasta-rebelia-ochrona, gałąź autobot/R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1,
baza jawnie: origin/main (commit 4a4a299c lub nowszy jesli main ruszyl w miedzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-rebelia --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz zalozenia bez live-weryfikacji (swiezy grep, nie polegac na liniach z tego dispatcha), ze:
(a) `applyPostCaptureLawOnCapture` jest wolane w obu lejkach przejecia miasta — sprawdz oba
funkcje/sciezki osobno i pokaz dokladne miejsce kazdego wywolania w raporcie;
(b) `city.rebelPreviousOwnerId`/nowy licznik sa nadal dostepne w momencie, gdy nowa logika
wypowiedzenia wojny probuje je odczytac — jesli `applyPostCaptureLawOnCapture` (ktore kasuje te
pola) jest wolane PRZED nowa logika w danym lejku, trzeba odczytac wartosci do lokalnych zmiennych
PRZED tym wywolaniem, inaczej kryterium 1/3 zawiedzie w cichy sposob (bez bledu kompilacji, po
prostu logika nigdy sie nie uruchomi, bo pole juz bedzie `undefined`). Pokaz w raporcie dokladna
kolejnosc operacji w kazdym lejku.
Zakaz uznania kryterium 1-3 (konsekwencja wojenna) za spelnione bez faktycznego uruchomienia
symulacji (min. kilkanascie tur, dwa scenariusze: przejecie w oknie ochrony i po jego uplywie) i
pokazania realnego stanu diplo/traktatow PRZED i PO przejeciu miasta — nie deklaracji "kod to
teraz obsluzy".

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.
Kazda decyzja produktowa wykraczajaca poza to, co GOAL jawnie rozstrzyga (w szczegolnosci punkt 5
o barbarzyncach i ewentualna potrzeba zmiany AI-targetingu) — zatrzymanie ze statusem
DECISION_REQUIRED zamiast samodzielnego rozszerzania zakresu.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
