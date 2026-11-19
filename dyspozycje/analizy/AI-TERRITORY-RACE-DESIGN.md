# AI — wyścig o terytorium przez forty i posterunki (projekt, R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1)

Status: PROJEKT — bez implementacji. Baza kodu: `64208a85b` (origin/main w chwili startu); numery linii r4 zweryfikowane na `53fcc1c45` (baza r3, kandydat 84ef34661).
Zakres (ABC, DODATEK 1, 2026-11-18): forty i posterunki jako element STRATEGII AI. Automatyka gracza poza zakresem (w pkt 7 tylko opis możliwego udostępnienia).

NIE ZMIERZONO: pomiar przed zmianą (3 ziarna × ≥150 tur) nie został wykonany w tej rundzie (runda 2 nie zmieniła tego faktu; poprzednie uzasadnienie „zakaz biegów w tle" było BŁĘDNE — dispatch dopuszcza `setsid nohup` + odpytywanie). Powód i plan w sekcji 6. Wszystkie wnioski o częstotliwości budowy fortów przez AI są HIPOTEZAMI Z KODU, nie wynikiem pomiaru. Rekomendacje w sekcji 4 i 7 są WSTĘPNE i wymagają pomiaru PRZED decyzją ABC.

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

Dane JSON NIE zawierają pola kosztu utrzymania dla fortu ani posterunku (grep `utrzymanie|upkeep` w `terrain-improvements.json` nie zwrócił wpisu dla tych kluczy). Istnieje natomiast ogólne utrzymanie ulepszeń terenu z mnożnikiem epoki 1/2/4 (`gra/src/game/terrain-improvements.ts:124`). Czy i jak obejmuje ono forty/posterunki: NIE ZWERYFIKOWANO (do następnej rundy).

Obie to ulepszenia terenu (nie jednostki). Nie wymagają jednostki-budowniczego w danych; w kodzie AI wymagana jest własna jednostka stojąca na heksie (patrz 1.4).

### 1.2 Zajmowanie terytorium

- `gra/src/map/territory.ts:122` `territoryOwnerAt`: dla heksu liczy się węzeł, który go obejmuje. Węzły miast mają pierwszeństwo przed fortami/posterunkami (komentarz l. 111–115). Spór fort vs fort: gdy oba mają `order`, wygrywa wcześniej zbudowany (`turn`, potem `seq`); w przeciwnym razie najbliższy węzeł.
- `gra/src/game/fort-territory.ts:144` `fortTerritoryNodes`: fort z `contestedUseless` (reguła 3) NIE tworzy terytorium.
- `gra/src/game/fort-territory.ts:~165` `isHexInForeignFortTerritory`: obcy fort blokuje zakładanie miasta w swoim promieniu, o ile `territoryOwnerAt` rozstrzyga go na korzyść obcego.
- `gra/src/game/ai.ts:1208` `isHexWithinAnyCityReach`: miasta + własne forty/posterunki (bez `contestedUseless`) rozszerzają zasięg zakładania miast (R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA).
- `gra/src/game/ai.ts:3218` `planCityFounding`: AI zakłada miasto tylko w zasięgu własnego miasta/fortu (parytet z graczem, decyzja A 2026-08-09).

### 1.3 Gracz

Gracz stawia forty/posterunki przez UI i przez automat ulepszeń (`gra/src/game/auto-improvements.ts`, ta sama logika `pickFortClaims`, l. 688). Szczegóły UI nie były inwentaryzowane w tej rundzie (NIE ZWERYFIKOWANO).

### 1.4 AI — gdzie już stawia forty/posterunki

Są TRZY ścieżki w kodzie:

1. **Automat ulepszeń (picker)** — `auto-improvements.ts` `pickFortClaims` (l. 688), wpięty w `pickAutoImprovements` (l. 1107–1151). Warunek: `cityLimitExhausted === true` (AI: `ai.ts:3025`, `isCityLimitExhausted` `auto-improvements.ts:643`: limit = `cityLimitBase + (era-1)*5`, liczone miasta z `foundedByOwner !== false`). Próg zysku: `FORT_CLAIM_MIN_NEW_HEXES = 1` (l. 655). Kolejność: fort preferowany, posterunek gdy fort niedostępny (`FORT_CLAIM_KEYS`, l. 658).
2. **Planer ekspansji** — `ai.ts:3101` `planExpansionFortBuilding`, wołany z `decideAITurn` (l. 4099) i `decideDefensiveCopyTurn` (l. 5635; oba z bramką `defensiveCopy`):
   - bramki zasobów: `canAfford` (l. ~3128–3140): `pracaAvailable >= kosztPraca + AI_IMPROVEMENT_PRACA_SURPLUS`, budżet `plannedCost + kosztPraca <= improvementBudget`, technologia odblokowana;
   - pętla 1 (l. ~3146–3180): fort na heksie WŁASNEJ jednostki (nie garnizon) poza `isHexWithinAnyCityReach`, poza terytorium obcej cywilizacji, na lądzie; **bez ruchu jednostek** (komentarz l. 3085–3090: „Celowo NIE przesuwa/nie wysyła jednostek”);
   - pętla 2 (l. ~3180–3195): posterunek na heksie własnej jednostki, gdy `isOutpostPlacementAllowed` (własna granica). Funkcja zwraca **najwyżej jedną komendę budowy na wywołanie** (`return` po pierwszym trafieniu), czyli łącznie 1 fort LUB 1 posterunek na turę z tej ścieżki, nie „1 posterunek”. Klucz pętli 1 to `'fort'` (`EXPANSION_KEY`, `ai.ts:~3120`).
3. **Pozostałe** — brak innych ścieżek budowy fortów/posterunków przez AI znalezionych w tej rundzie (NIE ZWERYFIKOWANO wyczerpująco).

### 1.5 Dlaczego AI rzadko stawia forty

Z kodu wynikają cztery bramki ograniczające budowę (hipoteza: to one powodują rzadkość; ich ilościowego wpływu NIE zmierzono):

- ścieżka 1 wymaga WYCZERPANEGO limitu miast; przed tym AI nie stawia fortu przez picker;
- ścieżka 2 wymaga, aby WŁASNA jednostka już stała poza zasięgiem — AI nie wysyła jednostek po teren, więc sytuacja zdarza się przypadkowo (zwiadowca, eskorta);
- fort wymaga technologii Wojskowość (epoka 3), posterunek dwóch technologii; przed nimi ścieżki są zamknięte;
- budżet pracy (`canAfford`) konkuruje z ulepszeniami żywności i surowców (kolejność w `AI_IMPROVEMENT_PRACA_SURPLUS`/`foodPriority`).

Hipoteza „AI rzadko stawia forty" jest zgodna z kodem, ale NIE jest potwierdzona liczbą: przebadano 0 AI × 0 ziaren × 0 tur (brak pomiaru, sekcja 6). Wniosku wolno użyć dopiero po pomiarze.

Hak pomiarowy `__aiEconomyMeasure.metrics()` (`gra/src/main.ts`) NIE zawierał pól fortów, posterunków ani terytorium na początku tematu; od r2/r3 je zawiera (tylko odczyt, `?civTest=1`; sekcja 6).

### 1.6 Limity i koszty

- Limit miast: `cityLimitBase` z konfiguracji gry (`main.ts:13938`), + 5 za każdą epokę powyżej 1 (`isCityLimitExhausted`).
- Limit fortów/posterunków: NIE ZNALEZIONO twardego limitu liczby fortów AI (poza „maks. 1 posterunek na turę”). Brak limitu łącznego.
- Koszt utrzymania: NIE ZWERYFIKOWANO (sekcja 1.1).

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

**REKOMENDACJA WSTĘPNA: C (etap 1 najpierw, etap 2 po pomiarze). Nie do przyjęcia bez pomiaru PRZED (sekcja 6).**

## 5. Wpływ na dyplomację i gracza

- (vi) Dyplomacja: fort obcy blokuje zakładanie miast (sekcja 1.2) — naturalne tarcie graniczne już istnieje. Propozycja: bez nowej kary w etapie 1; kara za sąsiedztwo tylko jako osobna decyzja ABC po pomiarze.
- (vii) Gracz: ten sam picker (`pickFortClaims`) już obsługuje gracza. Udostępnienie mechanizmu „wyścigu” graczowi = zmiana bramki `cityLimitExhausted` i parametrów; wymaga osobnej decyzji (poza zakresem tej rundy).

## 6. Pomiar — CZĘŚCIOWY (R2): ziarno 4242, tury 1–40; reszta NIE ZMIERZONO

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

Wyniki 150 tur × 3 ziarna (wykonuje orkiestrator; komendę podaje raport r3): MIEJSCE NA TABELĘ — NIE ZMIERZONO do czasu biegu. Do wklejenia: wyjście `territory-race-measure-analyze.cjs --step 10` per ziarno oraz tury kontrolne 30/60/90/120/150 z `seed<S>-kontrolne.json`.

### Sprostowania (sprawdzone w kodzie w R2)
- Zasięg miasta: `cityRangeForPopulation` = min(max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP), wartości z danych (`gra/src/game/okolica.ts:37–40, 46–50`); `cityTerritoryRadius` dla miasta w `gra/src/map/territory.ts:89–93`. Forty r=5, posterunki r=3 (`territory.ts`, stałe promieni).
- Pierwszeństwo: heks w zasięgu miasta rozstrzyga miasto; forty i posterunki zajmują tylko heksy wolne od miast (`territory.ts`, komentarz ZALOZENIE ok. l. 136–150). Stąd „z fortów/posterunków" = ogółem − z miast.
- Koszt utrzymania fortu i posterunku: ZWERYFIKOWANO w kodzie (wcześniej NIE ZWERYFIKOWANO). `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` obejmuje wszystkie klucze ulepszeń poza wycinką (`gra/src/game/terrain-improvements.ts:608–610`), a `'fort'` i `'posterunek'` są w liście kluczy (`terrain-improvements.ts:92`). Pracy/turę liczy `computePracaUpkeepByOwner` (`gra/src/game/turn-economy.ts:991`), mnożnik epoki 1/2/4 (`terrain-improvements.ts:134–137`). Kwota dla fortu i posterunku z econ-params: NIE ZMIERZONO liczbowo.
- Planer AI (`ai.ts`, ok. l. 3115) zwraca jedną komendę na wywołanie: sprostowanie Evaluatora przyjęte, NIE ZWERYFIKOWANO ponownie w tej rundzie.
- `hexySporne` liczy heks pokryty zasięgiem co najmniej dwóch właścicieli (także miast). Suma po AI liczy ten sam heks wielokrotnie, po jednym razie dla każdego współwłaściciela.

„Zajęte pierwszy raz" (historia per heks): NIE ZMIERZONO, haka nie ma takiego pola.

## 7. Pytania ABC do właściciela (rekomendacja pierwsza)

**P1. Kiedy AI zaczyna stawiać forty/posterunki?**
- A (rek.): już przed wyczerpaniem limitu miast, tylko na granicy i wolnym terenie w zasięgu; plus: szybki efekt, mała zmiana; minus: może zabrać pracę miastom.
- B: jak dziś — dopiero po wyczerpaniu limitu miast; plus: bez zmian balansu; minus: wyścig praktycznie nie istnieje.
- C: wszędzie w kierunku nieodebranego terenu; plus: maks. zysk terenu; minus: duży koszt pracy i ryzyko przeciążenia tury.

**P2. Kto buduje?**
- A (rek.): etap 1 bez ruchu (jednostki już stojące); etap 2 — budowniczy z ruchem w zasięgu N kroków; plus: bezpieczne kroki; minus: wolniejszy efekt.
- B: od razu aktywny budowniczy z ruchem po całej mapie; plus: pełny wyścig; minus: duże ryzyko i koszt wydajności.
- C: tylko praca z puli miasta bez jednostek; plus: najprostsze; minus: nie zajmuje odległego terenu.

**P3. Limity fortów/posterunków AI.**
- A (rek.): maks. liczba naraz i minimalny odstęp — wartości do wyboru przez właściciela (propozycja: naraz X zależne od liczby miast, odstęp Y pól; liczby NIE wybieram sam).
- B: bez limitu łącznego, tylko budżet pracy; plus: prostota; minus: ryzyko zalania mapy.
- C: stały limit na turę (dziś najwyżej 1 komenda fortu LUB posterunku na turę z planera ekspansji); plus: zgodne z obecnym kodem; minus: wolne tempo.

**P4. Udział pracy na forty/posterunki (budżet).**
- A (rek.): osobny udział puli (wartość do ustalenia), reszta na żywność i surowce; plus: kontrola wpływu na ekonomię; minus: nowy parametr do balansu.
- B: brak osobnego udziału, konkurencja z ulepszeniami; plus: bez nowego parametru; minus: fort może być wypierany.
- C: pełny priorytet wyścigu (ponad żywność); plus: maks. tempo; minus: ryzyko głodu miast.

**P5. Gracz.**
- A (rek.): na razie tylko AI; osobna decyzja po pomiarze; plus: zakres bez zmian; minus: brak parytetu.
- B: od razu udostępnić automat graczowi; plus: parytet; minus: większy zakres i ryzyko.
- C: opcja włączana przez gracza w ustawieniach; plus: wybór; minus: nowe UI.

---

## 8. Zakres implementacji (propozycja, po ABC)

- Etap 0: pomiar PRZED (sekcja 6) + narzędzie `gra/tools/territory-race-measure-run.cjs` (nowe, allowlista).
- Etap 1 (wariant A): `ai.ts` `planExpansionFortBuilding` (bramka przed limitem miast), `auto-improvements.ts` `pickFortClaims`; testy: `tools/auto-fort-claim-test.cjs` (rozszerzenie), nowy test parytetu AI.
- Etap 2 (wariant C): ruch budowniczego — nowa funkcja celu w `ai.ts`; wymaga osobnego dispatchu.
- Po każdym etapie: pomiar PO (te same ziarna i tury), porównanie liczb z pliku wynikowego.

Bramki (przy dotknięciu main.ts/ai.ts): `tsc --noEmit` 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
