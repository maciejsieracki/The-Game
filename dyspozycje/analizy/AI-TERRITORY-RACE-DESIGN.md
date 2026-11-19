# AI — wyścig o terytorium przez forty i posterunki (projekt, R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1)

Status: PROJEKT — bez implementacji. Numery linii w całym dokumencie przeliczone w r4 na bazie `eae4eff57` (origin/main); wcześniejsze wartości były z `53fcc1c45`/`64208a85b` i różniły się o 5–25 linii (korekty: `ai.ts` `isHexWithinAnyCityReach` 1213, `cityLimitExhausted` 3046, `planExpansionFortBuilding` 3122 (wywołania 4121 i 5691), `planCityFounding` 3247, komentarz „Celowo NIE przesuwa” 3101; `fort-territory.ts` `fortTerritoryNodes` 141, `isHexInForeignFortTerritory` 158; `main.ts` `cityLimitBase` 13939).
Zakres (ABC, DODATEK 1, 2026-11-18): forty i posterunki jako element STRATEGII AI. Automatyka gracza poza zakresem (w pkt 7 tylko opis możliwego udostępnienia).

POMIAR PRZED: wykonany przez orkiestratora, **2 ziarna (4242, 7) × 150 tur**, autopilot gracza, odrzucanie ofert i akceptacja wymuszonego pokoju (`stop=null`, 149 wierszy na ziarno). Ziarno 1234: **NIE ZMIERZONO** (zaplanowane 3 ziarna, wykonano 2). Wyniki: sekcja 6b; pytania ABC (sekcja 7) przeformułowane z liczbami. Sekcje 1.x i 6 poniżej zachowują wcześniejszy tekst (hipotezy z kodu; sekcja 6 = pomiar częściowy z r2/r3, nadpisany przez 6b — przy rozbieżności obowiązuje 6b).

---

## 1. Inwentarz (z kodu i danych)

### 1.1 Fort vs posterunek (`gra/data/terrain-improvements.json`)

| Cecha | Fort (`"fort"`, l. 274) | Posterunek (`"posterunek"`, l. 402) |
|---|---|---|
| Epoka | 3 | 2 |
| Technologia | `Wojskowość` | brak pojedynczej; bramka AND `Obróbka drewna` + `Murarstwo` (`improvement-tech.ts`, `IMPROVEMENT_MULTI_TECH_REQ`, wg uwagi l. 415) |
| Koszt pracy (`koszt_praca`) | 25 | 30 (droższy) |
| Zasięg terytorium | 5 | 3 |
| Teren | „dowolny ląd w terytorium” | „ląd w/na krawędzi własnego zasięgu” |
| Bonus obrony | +100% (obozowanie) | +50% (obozowanie) |
| Warunek | teren zabezpieczony; obca cywilizacja nie buduje tam miasta/ulepszeń | jak fort, zasięg 3; odkrywa mgłę, węzeł dróg |

Dane JSON NIE zawierają pola kosztu utrzymania dla fortu ani posterunku (grep `utrzymanie|upkeep` w `terrain-improvements.json` nie zwrócił wpisu dla tych kluczy). Istnieje natomiast ogólne utrzymanie ulepszeń terenu z mnożnikiem epoki 1/2/4 (`gra/src/game/terrain-improvements.ts:124`). Utrzymanie fortu i posterunku: ZWERYFIKOWANO w kodzie (r5) — fort i posterunek PŁACĄ upkeep Pracy: `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` (`gra/src/game/terrain-improvements.ts:608–610`) to wszystkie klucze ulepszeń o typie innym niż `wycinka`, a `fort` i `posterunek` są w `IMPROVEMENT_KEYS` (l. 92). Liczenie: `computePracaUpkeepByOwner` (`gra/src/game/turn-economy.ts:991`). UWAGA — SPRZECZNOŚĆ DANYCH Z KODEM: opis `ulepszenie_surowcowe_upkeep_praca` w `gra/data/econ-params.json` (l. 299–303) podaje jako ZWOLNIONE „infrastrukturę (droga/droga_brukowana/fort/posterunek/wyrab)” i żywnościowe, a kod ich nie wyłącza (filtr tylko po `typ !== 'wycinka'`). Która wersja jest intencją — NIE ROZSTRZYGNIĘTE; do decyzji właściciela/orkiestratora, nie zmieniano logiki.

Obie to ulepszenia terenu (nie jednostki). Nie wymagają jednostki-budowniczego w danych; w kodzie AI wymagana jest własna jednostka stojąca na heksie (patrz 1.4).

### 1.2 Zajmowanie terytorium

- `gra/src/map/territory.ts:122` `territoryOwnerAt`: dla heksu liczy się węzeł, który go obejmuje. Węzły miast mają pierwszeństwo przed fortami/posterunkami (komentarz l. 111–115). Spór fort vs fort: gdy oba mają `order`, wygrywa wcześniej zbudowany (`turn`, potem `seq`); w przeciwnym razie najbliższy węzeł.
- `gra/src/game/fort-territory.ts:141` `fortTerritoryNodes`: fort z `contestedUseless` (reguła 3) NIE tworzy terytorium.
- `gra/src/game/fort-territory.ts:158` `isHexInForeignFortTerritory`: obcy fort blokuje zakładanie miasta w swoim promieniu, o ile `territoryOwnerAt` rozstrzyga go na korzyść obcego.
- `gra/src/game/ai.ts:1213` `isHexWithinAnyCityReach`: miasta + własne forty/posterunki (bez `contestedUseless`) rozszerzają zasięg zakładania miast (R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA).
- `gra/src/game/ai.ts:3247` `planCityFounding`: AI zakłada miasto tylko w zasięgu własnego miasta/fortu (parytet z graczem, decyzja A 2026-08-09).

### 1.3 Gracz (r5: inwentarz walidacji; wygląd menu NIE ZWERYFIKOWANO wizualnie)

- Reguły budowy gracza: `gra/src/map/improvement-build.ts:1174–1200`. POSTERUNEK: teren lądowy, własne terytorium i przyleganie do granicy (`isOutpostPlacementAllowed`). FORT: poza własnym terytorium dozwolony, o ile hex NIE należy do CUDZEGO MIASTA i stoi tam WŁASNA jednostka (fizyczna obecność, Q1 r2); w własnym terytorium bez wymogu jednostki.
- Duplikat bramki w UI/komendach: `gra/src/main.ts:17689–17715` (`assertPlayerTerritoryForBuild`); powiadomienie o blokadzie: `showBuildTerritoryBlockedHint`.
- Rejestr fortów gracza: `gra/src/main.ts:17094–17110` (`registerFortNodeIfNeeded`, kontestacja ustalana w chwili budowy).
- Automat gracza: `gra/src/main.ts:44769` wywołuje `pickAutoImprovements` (ta sama logika `pickFortClaims`, `gra/src/game/auto-improvements.ts`); automat gracza „doradza” i nie przesuwa nadwyżki (komentarz l. ~44765).
- Administrator miasta (`gra/src/game/city-administrator.ts`): ZBADANO — brak jakiejkolwiek obsługi fortów/posterunków (0 trafień `fort|posterunek`); administrator nie wpływa na budowę terenową.
- Menu/UI budowy i podpowiedzi (`gra/src/ui/`, `gra/src/render/`): tylko sprawdzenie, że fort/posterunek mają ikony i etykiety (`improvement-icon-map.json`, `main.ts:16783`); układ menu NIE ZWERYFIKOWANO wizualnie (wymaga przeglądarki; poza tą rundą).

### 1.4 AI — gdzie już stawia forty/posterunki

Są TRZY ścieżki w kodzie:

1. **Automat ulepszeń (picker)** — `auto-improvements.ts` `pickFortClaims` (l. 688), wpięty w `pickAutoImprovements` (l. 1107–1151). Warunek: `cityLimitExhausted === true` (AI: `ai.ts:3046`, `isCityLimitExhausted` `auto-improvements.ts:643`: limit = `cityLimitBase + (era-1)*5`, liczone miasta z `foundedByOwner !== false`). Próg zysku: `FORT_CLAIM_MIN_NEW_HEXES = 1` (l. 655). Kolejność: fort preferowany, posterunek gdy fort niedostępny (`FORT_CLAIM_KEYS`, l. 658).
2. **Planer ekspansji** — `ai.ts:3122` `planExpansionFortBuilding`, wołany z `decideAITurn` (l. 4121) i `decideDefensiveCopyTurn` (l. 5691; oba z bramką `defensiveCopy`):
   - bramki zasobów: `canAfford` (l. ~3128–3140): `pracaAvailable >= kosztPraca + AI_IMPROVEMENT_PRACA_SURPLUS`, budżet `plannedCost + kosztPraca <= improvementBudget`, technologia odblokowana;
   - pętla 1 (l. ~3146–3180): fort na heksie WŁASNEJ jednostki (nie garnizon) poza `isHexWithinAnyCityReach`, poza terytorium obcej cywilizacji, na lądzie; **bez ruchu jednostek** (komentarz l. 3101 i nast.: „Celowo NIE przesuwa/nie wysyła jednostek”);
   - pętla 2 (l. ~3180–3195): posterunek na heksie własnej jednostki, gdy `isOutpostPlacementAllowed` (własna granica). Funkcja zwraca **najwyżej jedną komendę budowy na wywołanie** (`return` po pierwszym trafieniu), czyli łącznie 1 fort LUB 1 posterunek na turę z tej ścieżki, nie „1 posterunek”. Klucz pętli 1 to `'fort'` (`EXPANSION_KEY`, `ai.ts:~3120`).
3. **Pozostałe (r5: przeszukanie całego `gra/src`)** — emitery komend `buildImprovement` z kluczem fort/posterunek dla AI: `ai.ts:3206` (fort, pętla 1 planera), `ai.ts:3223` (posterunek, pętla 2), oraz picker z ścieżki 1 wywoływany przez `decideAITurn` (`ai.ts:3046`, `ai.ts:3054`, z `cityLimitExhausted`). Planer ekspansji jest też w `decideDefensiveCopyTurn` (`ai.ts:5691`, bramka `defensiveCopy`). Nie znaleziono innych emiterów (przeszukanie `buildImprovement` w `gra/src`; pliki render/ nie emitują komend AI). Ścieżka `defensiveCopy` NIE została zmierzona osobno.

### 1.5 Dlaczego forty/posterunki dają mało terenu (hipotezy z kodu, przed pomiarem)

Teza „AI rzadko stawia forty” jest OBALONA pomiarem (sekcja 6b): 13 z 13 AI w obu ziarnach zbudowało fort lub posterunek. Poniższe cztery ograniczenia z kodu to hipotezy tłumaczące, dlaczego ich udział w terytorium jest mały; ilościowego wpływu każdego z nich NIE zmierzono:

- ścieżka 1 wymaga WYCZERPANEGO limitu miast; przed tym AI nie stawia fortu przez picker;
- ścieżka 2 wymaga, aby WŁASNA jednostka już stała poza zasięgiem — AI nie wysyła jednostek po teren, więc sytuacja zdarza się przypadkowo (zwiadowca, eskorta);
- fort wymaga technologii Wojskowość (epoka 3), posterunek dwóch technologii; przed nimi ścieżki są zamknięte;
- budżet pracy (`canAfford`) konkuruje z ulepszeniami żywności i surowców (kolejność w `AI_IMPROVEMENT_PRACA_SURPLUS`/`foodPriority`).

Po pomiarze (sekcja 6b: 13 cywilizacji AI × 2 ziarna × 150 tur) wiadomo: wszystkie 13 z 13 AI w obu ziarnach zbudowało fort lub posterunek (pierwszy między t31 a t128, mediana t50 / t47), więc „nie stawiają wcale" jest fałszem; prawdziwe jest, że ich udział w terytorium jest mały (≤ 5,7% w szczycie, ≤ 0,4% w t150). Liczby w 6b.

Hak pomiarowy `__aiEconomyMeasure.metrics()` (`gra/src/main.ts`) NIE zawierał pól fortów, posterunków ani terytorium na początku tematu; od r2/r3 je zawiera (tylko odczyt, `?civTest=1`; sekcja 6).

### 1.6 Limity i koszty

- Limit miast: `cityLimitBase` z konfiguracji gry (`main.ts:13939`), + 5 za każdą epokę powyżej 1 (`isCityLimitExhausted`).
- Limit fortów/posterunków: NIE ZNALEZIONO twardego limitu liczby fortów AI (poza „maks. 1 posterunek na turę”). Brak limitu łącznego.
- Koszt utrzymania: płaci (kod, sekcja 1.1; wartość w tabeli sekcji P3-B). Sprzeczność z opisem econ-params — j.w.

### 1.7 Zachowanie przy kontakcie granic

- Fort/posterunek obcego gracza blokuje zakładanie miast w swoim promieniu (sekcja 1.2).
- AI nie buduje w terytorium obcej cywilizacji (`planExpansionFortBuilding` filtruje `territoryOwnerAt`, ok. l. 3148).
- Brak mechaniki „kara za sąsiedztwo” ani tarcia granicznego związanego z fortami (NIE ZNALEZIONO w tej rundzie).

---

## 2. Problem

Według kodu AI rozszerza terytorium głównie przez miasta: zasięg miasta to `max(5, populacja)` z limitem 15 (`gra/src/map/territory.ts:89-93`, `cityRangeForPopulation` w `okolica.ts`), fort ma zasięg 5, posterunek 3. Forty pojawiają się według kodu po wyczerpaniu limitu miast lub przypadkiem (hipoteza, niezmierzona). Brak aktywnego „wyścigu o heksy” oznacza, że przeciwnik, który wcześnie postawi forty na granicy i na zasobach, zajmie wolny teren pierwszy (reguła „wcześniej zbudowany fort wygrywa spór”, `territory.ts`).

## 3. Mechanizm wspólny (wszystkie warianty)

Kryterium wyboru heksu (iv) — proponowana funkcja wartości:
`wartość(h) = nowe_heksy_zajęte(h) + bonus_zasobu(h) + bonus_strategiczny(h) − kara_odległości_od_konkurenta(h) − koszt_pracy(h)`

- `nowe_heksy_zajęte(h)`: heksy w promieniu fortu (5) lub posterunku (3), nieobjęte jeszcze przez żadnego właściciela (`territoryOwnerAt` = null), liczone bez wygranej przez wcześniejszy węzeł obcego.
- Próg minimalnego zysku: `FORT_CLAIM_MIN_NEW_HEXES` (dziś 1) — wartość do decyzji ABC.
- Dostępność: heks lądowy, poza terytorium obcych miast i fortów, w zasięgu technologii.

Priorytet budżetu (iii): forty/posterunki z osobnym udziałem puli pracy (np. X% — wartość do ABC), reszta nadal dla żywności i surowców; wojsko i ekonomia pierwsze przy zagrożeniu (istniejący `countThreatFronts`, `ai.ts:~3267`).

## 4. Warianty

### Wariant A — minimalny (rozszerzenie dzisiejszej heurystyki)
- Forty/posterunki jeszcze PRZED wyczerpaniem limitu miast, ale WYŁĄCZNIE na heksach granicy (`isOutpostPlacementAllowed`) lub wolnym terenie w zasięgu własnej jednostki (ścieżka 2 bez zmian ruchu).
- Plusy: mała zmiana (1–2 pliki: `ai.ts` planner + bramka w `auto-improvements.ts`), brak ruchu jednostek, łatwy test parytetu.
- Minusy: AI nadal nie aktywnie zajmuje teren; zależy od przypadkowych jednostek; efekt na tempo wyścigu mały.
- Szacunek pracy: 2–3 tematy (planner, bramka limitu, testy haka). Ryzyko balansu niskie.

### Wariant B — pełny (aktywne budowanie z ruchem)
- Nowy „budowniczy” (zwiadowca lub osobny typ) dostaje cel: heks o najwyższej wartości z sekcji 3; ruch do celu; po dotarciu buduje fort/posterunek.
- Plusy: realny wyścig o teren; zgodne z życzeniem właściciela („jak największy teren przed przeciwnikiem”).
- Minusy: nowa logika ruchu i pathfindingu ekspansyjnego (w kodzie dziś brak), koszt wydajności tury AI (ok. 6–50 s/turę wg README harnessu, rośnie z turą), duże ryzyko regresji wojska i determinizmu, wielotematowe (szacunek 6–9 tematów, dziesiątki plików).
- Ryzyka: AI wysyła jednostki w niebezpieczne miejsca; konflikt z `ARMY_CONCENTRATION_RADIUS`.

### Wariant C — hybryda (rekomendowana)
- Etap 1: jak A (budowa przed wyczerpaniem limitu miast, tylko na granicy/wolnym terenie w zasięgu, z limitem liczby naraz i odstępem).
- Etap 2: ograniczony ruch — budowniczy wysyłany wyłącznie do heksu w zasięgu N kroków od własnego terytorium i tylko gdy wartość(h) > próg; bez wysyłania przez terytorium wroga.
- Plusy: większość zysku wyścigu przy małym ryzyku; etapy weryfikowalne osobno (pomiar po etapie 1).
- Minusy: dwa etapy, wymaga pomiaru przed etapem 2.
- Szacunek: etap 1 — 2–3 tematy; etap 2 — 3–5 tematów.

**REKOMENDACJA: C (etap 1 najpierw, etap 2 po pomiarze PO). Pomiar PRZED wykonany (sekcja 6b, 2 ziarna); skala korzyści z fortów jest mała (netto 2,8–4,3% przyrostu w t30–t60), więc etap 2 (ruch) wymaga osobnej decyzji ABC (P1, P5).**

## 5. Wpływ na dyplomację i gracza

- (vi) Dyplomacja: fort obcy blokuje zakładanie miast (sekcja 1.2) — naturalne tarcie graniczne już istnieje. Propozycja: bez nowej kary w etapie 1; kara za sąsiedztwo tylko jako osobna decyzja ABC po pomiarze.
- (vii) Gracz: ten sam picker (`pickFortClaims`) już obsługuje gracza. Udostępnienie mechanizmu „wyścigu” graczowi = zmiana bramki `cityLimitExhausted` i parametrów; wymaga osobnej decyzji (poza zakresem tej rundy).

## 6. Pomiar — CZĘŚCIOWY (R2/R3, HISTORIA; pełny pomiar 2 × 150 tur w sekcji 6b)

Źródło liczb: `runs/R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1/dowody/seed4242.jsonl` (surowe wiersze runnera), `dowody/seed4242-terytorium.csv`, `dowody/seed4242-kontrolne.json`. Hak: `gra/src/main.ts`, `__aiEconomyMeasure.metrics()` (commit ccd24c6fb, tylko odczyt). Narzędzie: `gra/tools/territory-race-measure-run.cjs` (commit 2c46de4e0; przeliczenie CSV bez przebiegu: `TERR_POSTPROCESS_ONLY=1`). Bundle zbudowany poza repo (vite, po `npm ci --ignore-scripts` w `gra/`).

Zmierzono (ziarno 4242; „wiersze" = WSZYSTKIE właściciele ≠ 0 obecni w metrykach, NIE same cywilizacje AI: w danych są też właściciele-placeholdery i prawdopodobnie miasta-państwa; gracz, owner 0, wyłączony z sum). Sprostowanie r4 (zarzut Evaluatora 2): etykiety „AI" w tabeli i w wnioskach poniżej należy czytać jako „właściciele ≠ 0". Liczba cywilizacji AI w t40 wynosi 13 (owner 1,4,…,37, dane `dowody/r3-smoke-seed4242-t1-40-slim.jsonl`); owner 40 i 41 (po 1 mieście) to prawdopodobnie miasta-państwa, NIE zweryfikowane w kodzie.

| Tura | Wiersze właścicieli ≠0 | Miasta | Forty | Posterunki | Heksy terytorium | z miast | z fortów/posterunków | Heksy sporne (suma po AI) | Heksy sporne ogółem | Jednostki wojskowe AI |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 41 | 41 | 0 | 0 | 2531 | 2531 | 0 | 2103 | 930 | 43 |
| 20 | 41 | 41 | 0 | 0 | 2593 | 2593 | 0 | 2193 | 968 | 41 |
| 30 | 15 | 91 | 0 | 0 | 4283 | 4283 | 0 | 472 | 251 | 44 |
| 40 | 15 | 150 | 5 | 2 | 6814 | 6560 | 254 | 2001 | 993 | 71 |

Mapa: 20160 heksów (`heksyMapy`). Tury 50, 60, 90, 120, 150: **NIE ZMIERZONO** (szczegóły niżej).

Wnioski z tej części (wyłącznie z powyższych liczb):
- Pierwszy fort lub posterunek pojawia się dopiero po turze 30. Z 15 właścicieli z wierszem w t40 5 zbudowało go w turach 32–40 (właściciel → tura: 19→32, 13→34, 22→35, 10→37, 37→40); wszystkie 5 to cywilizacje AI (13 w t40). Do tury 30 włącznie zero fortów i posterunków u wszystkich właścicieli. Poprzednie zdanie „5 z 15 AI" należy czytać jako „5 z 13 cywilizacji AI".
- W turze 40 z 6814 heksów terytorium AI 254 (≈3,7%) pochodzi z fortów i posterunków, reszta z miast.
- Liczba właścicieli z wierszem spada z 41 (t20) do 15 (t30). Dane (`r3-smoke-seed4242-t1-40-slim.jsonl`) pokazują SCALENIE, nie wymarcie: t20 ma 42 właścicieli po 1 mieście, t22 ma 20 (np. owner 1: 1→3 miasta; ownery 2, 3, 8, 9 znikają), t40 ma 13 cywilizacji plus owner 40 i 41. Przyczyna w kodzie spawnu rywali NIE zweryfikowana w tym temacie.
- Suma heksów spornych po właścicielach ≠0 spada z 2193 (t20) do 2001 (t40) razem ze spadkiem liczby właścicieli; reguł zakładania nie zmieniano. Suma zawiera placeholdery i miasta-państwa, więc NIE jest miarą sporów między cywilizacjami AI.

Zakres NIE ZMIERZONO:
- Tury 50–150 na ziarnie 4242. Przebieg zatrzymano na turze 40. Wznowienie ze slotu t40 kończy się segfaultem Chromium (`signal 11`) w dwóch powtórzeniach (`dowody/seed4242-wznowienie-t40-BLAD-SIGSEGV.log`). Wcześniejsze wznowienie ze slotu t20 działało; przyczyna NIE zbadana. Przebieg w tle (`setsid nohup`) został odrzucony przez classifier uprawnień, więc nie wykonano go w tle.
- Ziarna 777 i 1234: NIE ZMIERZONO.
- Moment pierwszego forta AI powyżej tury 40 i udział lądu zajętego w turach kontrolnych: NIE ZMIERZONO.

Dlatego wniosek „AI rzadko stawia forty" NIE jest jeszcze potwierdzony liczbą dla tur 50–150. Naprawa wznowienia (klasa defektu save-load, zob. `gra/tools/ai-economy-measure-README.md`, sekcja „Test wznowienia") jest warunkiem dokończenia pomiaru.

### 6a. Metody i ograniczenia pomiaru (r3)

Metody:
- Hak (`gra/src/main.ts`, blok `metrics()` w `__aiEconomyMeasure`, tylko odczyt, za `?civTest=1`; kontrola negatywna: bez flagi hak nie istnieje): per właściciel `miasta`, `forty`, `posterunki`, `hexyTerytorium`, `hexyZMiast`, `hexyZFortowPosterunkow` (= ogółem − z miast, zakładając pierwszeństwo miast), `hexySporne`; na turze `terytorium.{heksySporneOgolem, heksyMapy}`. Test kształtu: `gra/tools/ai-economy-measure-hook-test.cjs` (23/23 zielone w r3, w tym nowe pola).
- Runner: `gra/tools/territory-race-measure-run.cjs` (wrapper na `ai-economy-measure-run.cjs`). Domyślnie dokłada `--player-ai 1` (gracz sterowany autopilotem AI; pasywny gracz ginie ok. t75) i `--reject-offers 1` (odrzuca wiszące oferty handlowe AI do gracza, które blokują „Zakończ turę"; nowa opcja w `ai-economy-measure-run.cjs`, domyślnie 0, wzorzec z `diplomacy-harder-measure-run.cjs`). Jawne `--player-ai 0` / `--reject-offers 0` nadpisuje. `--every N` = częstotliwość zapisu slotu (wznowienia); `--stop-at` dzieli bieg na wywołania < 590 s.
- Analizator: `gra/tools/territory-race-measure-analyze.cjs --in <katalog> --seed <S> --step 10 [--slim <plik>] [--md <plik>]`: tabela co 10 tur (Σ heksów, z miast vs z fortów/posterunków, forty/posterunki, AI z fortem, sporne, Δheksów/tura), tempo per AI, pierwszy fort per AI, kontrola NaN.

Bieg dymny r3 (ziarno 4242, 40 tur, `--player-ai 1`, jeden Chromium, 105 s): `dowody/r3-smoke-seed4242-t1-40-analiza.md`, `-slim.jsonl`, `-terytorium.csv`, `-kontrolne.json`, `-analiza.json`. Brak NaN; w t40 5 z 13 cywilizacji AI (owner 10, 13, 19, 22, 37) ma fort lub posterunek. Liczby t40 różnią się nieznacznie od r2 (6741 vs 6814 heksów AI) — bieg nie jest bitowo powtarzalny względem r2 (inne ustawienia: autopilot gracza, odrzucanie ofert); to NIE jest błąd pomiaru, ale uniemożliwia mieszanie serii r2 i r3 w jednej tabeli.

Ograniczenia:
- Hak nie podaje liczby wolnych heksów lądowych w zasięgu osadnictwa, więc „udział wolnej ziemi" i „część mapy lądowej zajęta" jako ułamek ziemi: NIE ZMIERZONO (dostępny jest tylko udział w `heksyMapy`, który obejmuje też wodę).
- „Zajęte pierwszy raz" (historia per heks): NIE ZMIERZONO.
- Runner i analizator traktują KAŻDEGO właściciela ≠ 0 jako „AI" (zarzut Evaluatora 2 przyjęty: rozbicia na cywilizacje AI / miasta-państwa / placeholdery NIE ma w tej rundzie). Dlatego liczba „AI" w tabelach to liczba właścicieli ≠ 0.
- Test kształtu haka (`ai-economy-measure-hook-test.cjs`) nie testuje wartości liczb; mutacja wartości przeszła (ograniczenie zapisane w jego nagłówku).
- W t30 liczba właścicieli z miastem spada z 41 do 15 (w obu seriach); patrz scalenie opisane w sekcji 6.
- Wznowienie ze slotu t40 dawało segfault Chromium w r2; długi bieg trzeba prowadzić jednym procesem (bez wznowień) lub wznawiać ze slotu t20/t30.

Wyniki 2 ziarna × 150 tur (zmierzone przez orkiestratora): patrz sekcja 6b.

## 6b. Wyniki pomiaru PRZED (2 ziarna × 150 tur)

Źródło: `runs/R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1/dowody/final-2x150/` (`seed4242-terytorium.csv`, `seed7-terytorium.csv`, `seed*-kontrolne.json`, `seed*.summary.json`, `seed*-analiza.md`, `r4-okna-i-korelacja.js/.txt`). Surowe `seed*.jsonl` (≈12 MB każdy) leżą poza repo w `/tmp/territory-final/` (limit ≤1 MB dowodów). Bieg: orkiestrator, `stop=null`, 149 wierszy na ziarno (tury 2–150), autopilot gracza (`--player-ai 1`), odrzucanie ofert (`aiOffersRejected` = 7 i `aiOffersRejectAttempts` = 7 w OBU ziarnach, `seed4242.summary.json`, `seed7.summary.json`), wymuszone pokoje zaakceptowane: **4 w ziarnie 4242** i 1 w ziarnie 7 (`forcedPeaceAccepted`, te same pliki; r5 — wcześniej podano tylko 1 dla 7). Mapa 20160 heksów (`heksyMapy`, w obu ziarnach), w tym woda. **Ziarno 1234: NIE ZMIERZONO.** n = 2 ziarna — wnioski mają charakter orientacyjny, nie statystyczny.

**Definicje.** „Σ właścicieli ≠ 0" = wszystkie właściciele poza graczem 0 (13 cywilizacji AI + placeholdery do ok. t22 + 2 prawdopodobne miasta-państwa, owner 40/41; nie zweryfikowano w kodzie). „13 cywilizacji AI" = owner 1, 4, …, 37 (obecne od t2 w obu ziarnach). Heksy „z fortów/posterunków" = ogółem − z miast (miasto ma pierwszeństwo), czyli wartość NETTO: gdy miasto urośnie na heksy fortu, wartość spada mimo że fort stoi.

### Tabela Σ heksów terytorium (właściciele ≠ 0) co 10 tur

| tura | ziarno 4242 | ziarno 7 | średnia | rozstęp (max−min) |
|---|---|---|---|---|
| 10 | 2531 | 2530 | 2531 | 1 |
| 20 | 2566 | 2592 | 2579 | 26 |
| 30 | 4353 | 4680 | 4517 | 327 |
| 40 | 6752 | 7107 | 6930 | 355 |
| 50 | 8585 | 9544 | 9065 | 959 |
| 60 | 10099 | 11601 | 10850 | 1502 |
| 70 | 11235 | 12762 | 11999 | 1527 |
| 80 | 12028 | 13371 | 12700 | 1343 |
| 90 | 12254 | 13641 | 12948 | 1387 |
| 100 | 12287 | 13790 | 13039 | 1503 |
| 110 | 12316 | 13909 | 13113 | 1593 |
| 120 | 12327 | 13985 | 13156 | 1658 |
| 130 | 12361 | 14052 | 13207 | 1691 |
| 140 | 12375 | 14052 | 13214 | 1677 |
| 150 | 12374 | 14052 | 13213 | 1678 |

Uwaga: w t10–t20 większość z ~2530 heksów należy do placeholderów (13 cywilizacji AI ma wtedy tylko 858 / 855 heksów w t10 i 896 / 917 w t20); skok w t30 to scalenie właścicieli (sekcja 6), nie realny przyrost.

### Forty, posterunki, udział w terytorium (właściciele ≠ 0)

| tura | 4242: forty / posterunki | 4242: heksy z fort./post. (udział) | 7: forty / posterunki | 7: heksy z fort./post. (udział) | AI z fort./post. (4242 / 7) | sporne ogółem (4242 / 7) |
|---|---|---|---|---|---|---|
| 30 | 0 / 0 | 0 | 0 / 0 | 0 | 0 / 0 | 322 / 294 |
| 40 | 7 / 4 | 351 (5,2%) | 4 / 1 | 273 (3,8%) | 6 / 4 | 1172 / 895 |
| 60 | 11 / 23 | 162 (1,6%) | 7 / 14 | 299 (2,6%) | 9 / 11 | 4424 / 4057 |
| 90 | 15 / 48 | 94 (0,8%) | 8 / 39 | 24 (0,2%) | 11 / 11 | 7254 / 6720 |
| 120 | 15 / 53 | 69 (0,6%) | 8 / 57 | 7 (0,05%) | 12 / 13 | 7726 / 7682 |
| 150 | 15 / 90 | 55 (0,4%) | 8 / 65 | 7 (0,05%) | 13 / 13 | 8113 / 7737 |

- Szczyt udziału fortów/posterunków wśród 13 cywilizacji AI: 5,66% (t42, ziarno 4242) i 5,54% (t44, ziarno 7).
- W ziarnie 7 liczba fortów spada 9 (t70–t80) → 8 (t90): jeden fort znikł (przyczyna NIE zbadana).
- Sporne ogółem w t150: 8113 (= 65,6% Σ terytorium) i 7737 (= 55,1%). `hexySporne` liczy heks pokryty zasięgiem ≥2 właścicieli (sekcja Sprostowania).
- Zajęta część mapy w t150 (Σ heksów ÷ 20160, mianownik zawiera wodę): 61,4% (4242) i 69,7% (7). Udział w ziemi lądowej: NIE ZMIERZONO (hak nie podaje liczby heksów lądowych ani wolnych).

### Czas nasycenia i udział fortów w przyroście

- **Nasycenie** (kryterium r4: Σ heksów rośnie <1% w każdym z 3 kolejnych 10-turowych kroków kontrolnych): ziarno 4242 — od **t90**; ziarno 7 — od **t100** (te same wartości dla Σ właścicieli ≠ 0 i dla samych 13 AI). Przyrost Σ/turę (analizator): 4242: 22,6 (t90) → 3,3 (t100) → ≈1–3 (t≥110); 7: 27,0 (t90) → 14,9 (t100) → 11,9 (t110) → 7,6 (t120) → 0 (t≥140). Do t90 zajęte jest 12254 (4242) / 13641 (7), tj. 99,0% / 97,1% wartości z t150 — wyścig o wolny teren rozstrzyga się w t30–t90.
- **Okno t30–t60**: Δ Σ heksów = +5746 (4242) / +6921 (7); Δ heksów z fort./post. (netto) = +162 / +299 → **2,8% / 4,3%** przyrostu.
- **Okno t60–t90**: Δ Σ = +2155 / +2040; Δ heksów z fort./post. = −68 / −275 (wartość ujemna: miasta przejmują heksy fortów; udział netto NIE jest miarą wkładu fortów).
- Wniosek ostrożny: przy obecnej strategii przyrost terytorium to niemal wyłącznie zasięg miast (t90: 99,2% / 99,8% terytorium z miast). Wkład fortów jest maleńki i nie da się go wyłuskać z danych netto; **wpływu alternatywnego scenariusza (AI z aktywnym wyścigiem fortami) nie zmierzono** — to hipoteza.

### Wczesna budowa fortu/posterunku (≤ t50) a przyrost

Pierwsza budowa per AI (kolejność rosnąca): 4242 — 31, 33, 35, 35, 36, 39, 50, 53, 58, 63, 64, 118, 128 (mediana 50); 7 — 34, 35, 37, 38, 44, 45, 47, 48, 49, 54, 58, 79, 104 (mediana 47). 13 z 13 AI w obu ziarnach zbudowało fort lub posterunek.

| ziarno | AI z budową ≤ t50 (n) | pozostałe (n) | śr. Δ heksów t30→t90: wcześni / pozostali | śr. heksów w t150: wcześni / pozostali | śr. miast w t90: wcześni / pozostali |
|---|---|---|---|---|---|
| 4242 | 7 | 6 | 677 / 546 | 1011 / 883 | 19,4 / 19,3 |
| 7 | 9 | 4 | 669 / 744 | 1040 / 1160 | 19,2 / 20,0 |

Korelacja Pearsona (n = 13 na ziarno; tura pierwszej budowy vs heksy w t150): −0,16 (4242), +0,15 (7). Vs przyrost t30→t90: −0,13 / +0,11. Vs liczba miast w t90: 0,00 / +0,27. Różnice są niespójne co do znaku między ziarnami i mieszczą się w szumie przy n = 13 — **brak dowodu, że wczesna budowa fortu daje większy przyrost terytorium; przyczynowości nie przesądzam** (wczesny fort może być skutkiem szybkiej ekspansji, nie jej przyczyną). Liczba miast w t90 (17–22) praktycznie nie zależy od tury pierwszego fortu; to miasta wyznaczają wynik.

### Ograniczenia pomiaru

1. Gracz 0 grał autopilotem AI i zajmował ziemię jak AI, więc konkurencja o teren obejmuje 14 stron, a w sumach właścicieli ≠ 0 go nie ma (jego zajęte heksy zmniejszają wolną ziemię, ale nie są liczone).
2. Owner ≠ 0 zawiera placeholdery do ok. t22 (scalenie opisane w sekcji 6) i prawdopodobnie 2 miasta-państwa (owner 40, 41; kod spawnu NIE zweryfikowany); sumy z t10–t20 nie opisują cywilizacji AI.
3. Brak danych o wolnej ziemi lądowej i o heksach „zajętych pierwszy raz" (hak tego nie zwraca) — tempo wyścigu mierzone wyłącznie przyrostem Σ terytorium, nie ubytkiem wolnej ziemi; stąd „nasycenie" = brak dalszego przyrostu, nie dowód, że ziemia się skończyła (mogły ją zablokować sąsiedzi, woda, góry, limity zakładania miast).
4. „Z fortów/posterunków" jest wartością netto (ogółem − z miast); nie mierzy heksów, które fort zajął, zanim wchłonęło je miasto.
5. 2 ziarna; jeden wariant mapy 20160 heksów, 14 cywilizacji. Ziarno 1234: NIE ZMIERZONO. Biegi nie są bitowo powtarzalne względem r2/r3 (sekcja 6a).
6. Statystyka tur kontrolnych co 10 tur; moment nasycenia ma rozdzielczość 10 tur.
7. Wymuszone pokoje (r5): 4 w ziarnie 4242 mogą zmieniać układ granic (sąsiedzi przestają walczyć), a pomiar nie rozdziela ich wpływu na przyrost terytorium od innych czynników. Wpływu NIE ZMIERZONO; nie zakładać, że bieg jest reprezentatywny dla biegu z zawieszoną dyplomacją.

### Sprostowania (sprawdzone w kodzie w R2)
- Zasięg miasta: `cityRangeForPopulation` = min(max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP), wartości z danych (`gra/src/game/okolica.ts:37–40, 46–50`); `cityTerritoryRadius` dla miasta w `gra/src/map/territory.ts:89–93`. Forty r=5, posterunki r=3 (`territory.ts`, stałe promieni).
- Pierwszeństwo: heks w zasięgu miasta rozstrzyga miasto; forty i posterunki zajmują tylko heksy wolne od miast (`territory.ts`, komentarz ZALOZENIE ok. l. 136–150). Stąd „z fortów/posterunków" = ogółem − z miast.
- Koszt utrzymania fortu i posterunku: ZWERYFIKOWANO w kodzie (wcześniej NIE ZWERYFIKOWANO). `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` obejmuje wszystkie klucze ulepszeń poza wycinką (`gra/src/game/terrain-improvements.ts:608–610`), a `'fort'` i `'posterunek'` są w liście kluczy (`terrain-improvements.ts:92`). Pracy/turę liczy `computePracaUpkeepByOwner` (`gra/src/game/turn-economy.ts:991`), mnożnik epoki 1/2/4 (`terrain-improvements.ts:134–137`). Kwota (r5, z kodu i danych, nie z przebiegu gry): baza `ulepszenie_surowcowe_upkeep_praca` = 1 Praca/turę na wszystkich poziomach trudności (`gra/data/econ-params.json` l. 299–303; `turn-economy.ts:977–982`); mnożnik epoki 1/2/4 (`terrain-improvements.ts:128–134`) × epoka wpisu (`terrainImprovementEraForKey`, l. 155). Fort (epoka 3) = 4 Praca/turę; posterunek (epoka 2) = 2 Praca/turę. Suma po przeliczeniu zależy od liczby fortów/posterunków (wartości w 6b). Pomiaru w grze tej wartości NIE robiono — to wynik z kodu.
- Planer AI (`ai.ts`, ok. l. 3115) zwraca jedną komendę na wywołanie: sprostowanie Evaluatora przyjęte, NIE ZWERYFIKOWANO ponownie w tej rundzie.
- `hexySporne` liczy heks pokryty zasięgiem co najmniej dwóch właścicieli (także miast). Suma po AI liczy ten sam heks wielokrotnie, po jednym razie dla każdego współwłaściciela.

„Zajęte pierwszy raz" (historia per heks): NIE ZMIERZONO, haka nie ma takiego pola.

## 7. Pytania ABC do właściciela (rekomendacja pierwsza; liczby z sekcji 6b)

Podstawa liczbowa wspólna dla P1–P5 (2 ziarna × 150 tur, n mały): teren zajmowany jest w oknie t30–t90 (Σ heksów 4353/4680 w t30 → 12254/13641 w t90, nasycenie od t90/t100); w tym oknie forty/posterunki dają netto 2,8–4,3% przyrostu w t30–t60 i nie dają netto nic w t60–t90; szczyt ich udziału to 5,5–5,7% (t42–t44); 13/13 AI buduje je dziś już, pierwszy fort mediana t47–t50. Proponowane progi to PROPOZYCJE do decyzji, niczego nie wybrano za właściciela.

**P1. Czy w ogóle inwestować w wyścig fortami, skoro dziś przyrost to niemal wyłącznie miasta (≥99,2% terytorium z miast w t90)?**
- A (rek.): TAK, ale wąsko i wcześnie — wariant A z sekcji 4 (forty/posterunki przed wyczerpaniem limitu miast, na granicy z konkurentem i na wolnym terenie w zasięgu własnej jednostki), cel: okno t30–t80, gdy ziemia jest jeszcze wolna. Plus: małe zmiany (1–2 pliki), mierzalny efekt (pomiar PO na tych samych ziarnach). Minus: wzrost maks. rzędu kilku punktów procentowych terytorium w t30–t60 (dziś 2,8–4,3% netto), więc efekt może być niewidoczny.
- B: NIE — zostawić jak jest (forty tylko po wyczerpaniu limitu miast). Plus: zero ryzyka balansu. Minus: realizuje życzenie właściciela tylko w śladowym stopniu (forty ≈0,4% terenu w t150).
- C: TAK, szeroko (aktywni budowniczowie od razu, wariant B z sekcji 4). Plus: największa szansa na zauważalny wyścig. Minus: 6–9 tematów, ryzyko wydajności i determinizmu, a pomiar nie dowodzi, że fort daje przyrost (korelacja pierwszej budowy z przyrostem: −0,16 / +0,15, n = 13).

**P2. Kiedy fort/posterunek ma się opłacać względem miasta (próg zysku)?**
- A (rek.): fort/posterunek tylko gdy zyskuje ≥ N nowych wolnych heksów, propozycja startowa N = 15 (fort r = 5 obejmuje do 91 heksów, posterunek r = 3 do 37; dziś próg to 1, `FORT_CLAIM_MIN_NEW_HEXES`, `auto-improvements.ts:655`); wartość N do strojenia po pomiarze PO. Plus: eliminuje budowanie „na 1 heks". Minus: nowy parametr balansu.
- B: próg 1 (jak dziś). Plus: bez zmian. Minus: ryzyko zalania mapy fortami o znikomym zysku (posterunków było 90 w t150 przy 55 heksach netto).
- C: próg zależny od odległości do konkurenta (niższy na granicy). Plus: skupia wyścig tam, gdzie jest spór (sporne = 55–66% terytorium w t150). Minus: bardziej złożona funkcja wartości z sekcji 3.

**P3. Limity AI na forty/posterunki.**
- A (rek.): maks. liczba naraz proporcjonalna do liczby miast, propozycja 1 fort/posterunek na 3 miasta w trakcie budowy i odstęp ≥ 4 heksy między węzłami; oba progi do potwierdzenia. Plus: chroni budżet pracy i unika zalewu; dziś w t150 jest 15 fortów + 90 posterunków (4242) i 8 + 65 (7) przy limicie „1 komenda na turę". Minus: dwa nowe parametry.
- B: bez limitu łącznego, tylko budżet pracy i koszt utrzymania (`RESOURCE_UPKEEP_IMPROVEMENT_KEYS`, `terrain-improvements.ts:608`). Plus: prostota. Minus: koszt utrzymania to 2 Praca/turę (posterunek) i 4 Praca/turę (fort) za sztukę wg kodu (sekcja 1.1; w grze NIE ZMIERZONO), ryzyko niekontrolowanego kosztu przy wielu fortach.
- C: tylko limit na turę (jak dziś, 1 komenda). Plus: zgodne z kodem. Minus: wolne tempo w oknie t30–t80, gdzie liczy się szybkość.

**P4. Budżet pracy i priorytet względem wojska/ekonomii.**
- A (rek.): osobny udział puli pracy na forty/posterunki tylko w oknie t30–t90 (propozycja: do 15% puli, X do potwierdzenia), reszta nadal na żywność i surowce; przy zagrożeniu (`countThreatFronts`) wojsko pierwsze. Plus: kontrola wpływu na ekonomię; okno zgodne z pomiarem (po t90 nasycenie). Minus: nowy parametr, interakcja z garnizonem (FALA 857).
- B: brak osobnego udziału (konkurencja z ulepszeniami, jak dziś). Plus: bez parametru. Minus: fort jest wypierany, wyścig nie ruszy.
- C: pełny priorytet fortów ponad żywność w oknie. Plus: maks. tempo. Minus: ryzyko głodu miast, brak pomiaru wpływu na ekonomię.

**P5. Kto buduje (ruch jednostek) i czy rozszerzyć na gracza?**
- A (rek.): etap 1 bez ruchu (jednostki, które już stoją poza zasięgiem — jak dziś ścieżka 2), etap 2 po pomiarze PO: budowniczy z ruchem w promieniu N = 6 heksów od własnego terytorium (propozycja), nie przez obce terytorium. Gracz: na razie bez zmian (zakres z DODATKU 1); mechanizm można później udostępnić przez zmianę bramki `cityLimitExhausted` w `pickAutoImprovements` (`auto-improvements.ts:1114,1134`) albo opcję w ustawieniach. Plus: bezpieczne kroki, weryfikowalne osobno. Minus: etap 1 sam może dać mały efekt.
- B: od razu aktywny budowniczy po całej mapie. Plus: pełny wyścig. Minus: największe ryzyko regresji wojska i wydajności tury AI (6–50 s/turę wg README harnessu).
- C: tylko praca z puli miasta, bez jednostek (budowa tylko na własnym brzegu). Plus: najprostsze. Minus: nie zajmie odległego wolnego terenu, więc nie wygrywa wyścigu z konkurentem.

---

## 8. Zakres implementacji (propozycja, po ABC)

- Etap 0: pomiar PRZED (sekcja 6) + narzędzie `gra/tools/territory-race-measure-run.cjs` (nowe, allowlista).
- Etap 1 (wariant A): `ai.ts` `planExpansionFortBuilding` (bramka przed limitem miast), `auto-improvements.ts` `pickFortClaims`; testy: `tools/auto-fort-claim-test.cjs` (rozszerzenie), nowy test parytetu AI.
- Etap 2 (wariant C): ruch budowniczego — nowa funkcja celu w `ai.ts`; wymaga osobnego dispatchu.
- Po każdym etapie: pomiar PO (te same ziarna i tury), porównanie liczb z pliku wynikowego.

Bramki (przy dotknięciu main.ts/ai.ts): `tsc --noEmit` 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
