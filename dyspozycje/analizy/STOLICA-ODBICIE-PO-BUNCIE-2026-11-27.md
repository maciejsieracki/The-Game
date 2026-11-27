# Stolica AI po buncie i odbiciu miasta (R-WEB-CAPITAL-RECAPTURE-Q1, tag CAPRECAP)

Baza: origin/main `af3e0f141bdee917a1261ffa9c87e8561c80cc07`. Data: 2026-11-27.
Zakres: odczyt kodu i pomiar na module czystym (bez przeglądarki). Zero zmian w `gra/src`.
Runda 2 (obrona Operatora): odpowiedź na zarzuty Evaluatora r1; poprawka gry NIE wdrożona (patrz §5, §7).

## 0. STAN WIĄZĄCY — RUNDA 2 (poprawka + pomiar live PRZED/PO)

Sekcje 1–7 poniżej to analiza r1 (stan przed poprawką). Sekcja 0 je zastępuje w zakresie
„poprawka NIE wdrożona” i „S1/S3/S4 NIE ZMIERZONO”.

**Błąd odtworzony i naprawiony (decyzja inżynierska orkiestratora, bez pytania do właściciela).**
Gdy jawny wpis `capitalCityIdByOwner` jest nieaktualny (wskazuje miasto, które się zbuntowało
albo przeszło do kogoś innego), `runCapitalCapturePlunder` (main.ts) czytał SUROWY wpis
(`designatedCapitalId`) i porównywał go z przejmowanym miastem. Faktyczna stolica (fallback
z `capitalCityIdForOwner`) nie była więc rozpoznawana: nie było plunderu skarbca, nie było
sukcesji stolicy, a stary wpis zostawał w mapie.

**Poprawka (minimalna, zero zmian balansu/formuł, zapis wstecznie zgodny — brak nowych pól):**
- `gra/src/game/capital-capture.ts`: nowa czysta funkcja `effectiveCapitalBeforeCapture(captured,
  oldOwner, citiesNow, explicitCapitalId)` — liczy efektywną stolicę oldOwner SPRZED przejęcia
  (miasto `captured` jest już u zdobywcy, więc dodawane z powrotem). Reguły jak w `capitalCityIdForOwner`.
- `gra/src/main.ts` (`runCapitalCapturePlunder`): `designatedCapitalId = effectiveCapitalBeforeCapture(
  city, oldOwner, cities, capitalCityIdByOwner.get(oldOwner))` zamiast surowej mapy.
- Nie czyszczę wpisu przy buncie (zalecenie opcjonalne z dispatchu): po poprawce nieaktualny wpis
  jest nieszkodliwy, bo resolver ignoruje wpis wskazujący miasto spoza oldOwner. Efektywna stolica
  po odzyskaniu miasta (S2) NIE zmieniona — zachowanie jak w r1.

**Konsekwencja, którą trzeba zobaczyć w FC:** przejęcie ostatniego miasta cywilizacji, które było
faktyczną stolicą (także przy nieaktualnym wpisie), daje teraz Zdarzenie 2 = eliminację. Przed
poprawką takie przejęcie zwracało `null`, czyli cywilizacja bez żadnego miasta zostawała w grze.

**Pomiar live (Chromium, maksimum: Trudny, koszt jednostek Wysoki ×4, kultura Trudny, dyplomacja
Trudna, wzrost z epoką ON, zwycięstwo ON; konfiguracje = ziarna 4242, 7, 11; 3 właścicieli AI
na ziarno, każdy z 4 miastami; tryb: `setCapitalForTest` ustawia jawną stolicę, `ledgerRealPathDebug.rebel`
buntuje, `cession` oddaje w pokoju (S3), `siegeSurrender` zdobywa przez prawdziwą ścieżkę
`runCapitalCapturePlunder`). Narzędzie: `gra/tools/capital-recapture-live.cjs`.

| Ziarno | Scenariusz (właściciel) | Jawny wpis przed buncie | Zdobyte miasto | PRZED: wpis po zdobyciu | PRZED: stolica po | PO: wpis po zdobyciu | PO: stolica po | Werdykt PRZED / PO |
|---|---|---|---|---|---|---|---|---|
| 4242 | S1 AI (1) | city3 | city4 | city3 (stary) | city43 | city43 | city43 | FAIL / PASS |
| 4242 | S3 cesja AI (3) | city5 | city45 | city5 (stary) | city46 | city46 | city46 | FAIL / PASS |
| 4242 | S4 dwa bunty AI (4) | city6 | city48 | city6 (stary) | city49 | city49 | city49 | FAIL / PASS |
| 7 | S1 AI (1) | city3 | city4 | city3 (stary) | city43 | city43 | city43 | FAIL / PASS |
| 7 | S3 cesja AI (3) | city5 | city45 | city5 (stary) | city46 | city46 | city46 | FAIL / PASS |
| 7 | S4 dwa bunty AI (4) | city6 | city48 | city6 (stary) | city50 | city50 | city50 | FAIL / PASS |
| 11 | S1 AI (1) | city3 | city4 | city3 (stary) | city42 | city42 | city42 | FAIL / PASS |
| 11 | S3 cesja AI (3) | city5 | city45 | city5 (stary) | city45 | city45 | city45 | FAIL / PASS |
| 11 | S4 dwa bunty AI (4) | city6 | city48 | city6 (stary) | city48 | city48 | city48 | FAIL / PASS |

Liczba prób: 9 scenariuszy PRZED i 9 PO (3 ziarna × 3 scenariusze), każdy jednokrotnie, deterministycznie
(ziarno). PRZED: wpis zostaje na starym mieście we wszystkich 9. PO: sukcesja zapisana we wszystkich 9.
Uwaga o kolumnie „stolica po”: w PRZED efektywna stolica i tak przeskakuje (fallback), tylko wpis został
stary — dokładnie ta rozbieżność (dwa różne źródła prawdy o stolicy).

**Luki (NIE ZMIERZONO, jawnie):**
- Skarbiec i pula przejęte w live: harness zwraca `treasuryOf` = 0 dla obu stron, więc kwota plunderu
  NIE jest zmierzona w live. Kwota plunderu i sukcesja pokryte modułem (`capital-capture-test` 107/107,
  `capital-recapture-stale-designation-test` 12/0, mutacja czerwona przez kotwicę main.ts).
- S2 (odzyskanie stolicy przez pierwotnego właściciela): zachowanie niezmienione, nie mierzone w r2.
- S5 (round-trip zapisu w środku): nie mierzone w r2 (zakres r1, otwarte).
- Odbicie przez PODBÓJ armii (a nie hakiem `siegeSurrender`) i ścieżka aneksji państwa-miasta:
  nie mierzone live.
- Częstość w rozgrywce: nie mierzona (scenariusze wymuszone hakami).

**Narzędzia i bramki r2:**
- `gra/tools/capital-recapture-stale-designation-test.cjs`: PASS=12 FAIL=0 NIE-ZMIERZONO=1 (S5),
  rc=0. Kotwica main.ts sprawdza wywołanie `effectiveCapitalBeforeCapture`. Mutacja (cofnięcie
  wywołania w main.ts do surowej mapy) → kotwica FAIL, rc=1 (sprawdzone, przywrócono poprawkę).
- Bramki (kandydat po poprawce, surowe wyjście): tsc rc=0; logic PASS=213 FAIL=0; tech-tree
  "20 pass, 0 fail"; research "PASSED: 33 / FAILED: 0"; unit-replace (6 plików: unit-replace-test i pięć
  unit-replace-*) rc=0 każdy; combat rc=0; ai-test "297 passed, 0 failed"; capital-capture-test
  "OK (107/107)"; society-breakdown "56 OK, 0 FAIL"; ai-city-rebellion-gate "PASS=37 FAIL=0";
  ai-city-order-need-wiring "267 passed, 0 failed"; ai-city-rebellion-news rc=0.

## 1. Stan kodu (odczyt, numery linii zweryfikowane w af3e0f141)

- `main.ts:2479` — `capitalCityIdByOwner: Map<ownerId, cityId>` (jawny wpis stolicy).
- `main.ts:40167` — `capitalCityIdForOwner(ownerId)`: jawny wpis zwracany TYLKO gdy miasto
  istnieje i nadal ma tego właściciela; inaczej fallback na najstarsze miasto właściciela.
  Zasila etykiety `isCapital`, Mennicę, efekty stolicy, panel i ekonomię tury.
- `main.ts:41828` — `transferCityToRebelFactionWithLedger`: bunt zmienia WYŁĄCZNIE `city.ownerId`
  na `REBEL_FACTION_OWNER_ID` (-99). Nie czyści wpisu `capitalCityIdByOwner`, nie uruchamia
  sukcesji ani `runCapitalCapturePlunder`. Wywołania: `main.ts:45267` (pętla buntu tury) i `33631` (hak testowy).
- `main.ts:40736` — `runCapitalCapturePlunder`. Wywoływana TYLKO z przejęcia miasta w walce/przechwycie
  (`main.ts:19286`, `main.ts:41565`). NIE wywoływana z cesji (`transferCityByTreaty`, `main.ts:41836`)
  ani z aneksji państwa-miasta (`main.ts:40447`).
- `main.ts:40764` — `designatedCapitalId = capitalCityIdByOwner.get(oldOwner) ?? undefined`,
  czytane SUROWO, bez walidacji i bez użycia resolvera.
- `game/capital-capture.ts:102` — `wasCapitalOfOldOwner`: gdy `designatedCapitalId != null`,
  kryterium „to była stolica” = porównanie id z tym surowym wpisem (CAŁOŚĆ kryterium).
  Dopiero gdy brak wpisu, używany jest fallback „najstarsze miasto”.

## 2. Kiedy powstaje jawny wpis (warunek wystąpienia — odpowiedź na zarzut 3)

Wpis `capitalCityIdByOwner` jest ZAPISYWANY tylko w czterech miejscach (grep `capitalCityIdByOwner.set|delete`):

| Miejsce | Kiedy |
|---|---|
| `main.ts:40379` `maybeRelocateThreatenedAiCapital` | AI przenosi stolicę, gdy stolica jest zagrożona przez wroga (wywołanie `main.ts:49013`, co turę) |
| `main.ts:40316` (ustawienie stolicy gracza) | gracz wybiera „przenieś stolicę” |
| `main.ts:40797` (sukcesja) | po przejęciu faktycznej stolicy przez `runCapitalCapturePlunder` |
| `main.ts:32057` (hak testowy `setCapitalForTest`) | tylko testy |

Start nowej gry NIE zapisuje wpisu: wtedy działa fallback „najstarsze miasto” i błąd nie występuje
(brak wpisu = brak rozjazdu). Błąd wymaga więc: istniejącego wpisu (przeniesiona stolica AI, stolica
gracza ustawiona ręcznie, albo sukcesja) ORAZ buntu lub utraty tego miasta bez czyszczenia wpisu.
Test z §3 ustawia wpis ręcznie, bo odtwarza stan PO przeniesieniu. Częstość w rozgrywce:
NIE ZMIERZONO (wymaga pomiaru live: ile tur AI przenosi stolicę przy zagrożeniu i jak często trafia
ona w bunt).

## 3. Rozjazd i pomiar na module czystym

Po buncie stolicy AI (miasto X, wpis = X):

| Stan | Surowy wpis | Efektywna stolica (`capitalCityIdForOwner`) | Kryterium przejęcia (`wasCapitalOfOldOwner`) |
|---|---|---|---|
| Przed buntem | X | X | X |
| Po buncie X (ownerId = -99) | X (nieaktualny) | Y = najstarsze pozostałe | X |
| Po przejęciu Y | X (nieaktualny) | Z = najstarsze z pozostałych | X -> Y NIE spełnia kryterium |

Narzędzie: `gra/tools/capital-recapture-stale-designation-test.cjs` (uruchomienie:
`ESBUILD_DIR=<katalog esbuild> node tools/capital-recapture-stale-designation-test.cjs` z `gra/`).
Replikowane są tylko `capitalCityIdForOwner` i odczyt surowego wpisu (kotwice sprawdzane w `main.ts`);
kryterium `wasCapitalOfOldOwner`/`applyBarbarianAwareCapitalCapturePlunder` działa na prawdziwym
kodzie modułu (bundle esbuild). Kod wyjścia 1 = co najmniej jeden FAIL.

Wynik pierwszego pomiaru (runda 2, ten sam kod):

| Scenariusz | Oczekiwane | Wynik | Werdykt |
|---|---|---|---|
| S1-AI: po buncie efektywna stolica AI | city1 | city1 | PASS |
| S1-AI: odbicie faktycznej stolicy (city1) przez gracza | przejecie_stolicy | null | FAIL (odtworzony rozjazd) |
| S1-GRACZ: bunt stolicy gracza, AI zdobywa faktyczną stolicę gracza | przejecie_stolicy | null | FAIL (odtworzony rozjazd, ścieżka gracza z `main.ts:40316`) |
| KONTROLA: wpis AI wyczyszczony przy buncie | przejecie_stolicy | przejecie_stolicy | PASS (kierunek poprawki, nie wdrożona) |
| S2: odzyskana stolica wraca jako stolica | city2 | city2 | PASS (stan obecny, zamierzenie do potwierdzenia) |
| S3: stolica AI zbuntowana i oddana graczowi w pokoju, atak na faktyczną stolicę AI | przejecie_stolicy | null | FAIL (odtworzony rozjazd; cesja bez plunderu, §4) |
| S4: dwa bunty (druga stolica, potem faktyczna), atak na trzecie miasto | przejecie_stolicy | null | FAIL (odtworzony rozjazd) |
| S5: round-trip zapisu (snapshotJson/restoreJson) | n/d | NIE ZMIERZONO | wymaga live |

Liczba prób: 1 na wiersz (deterministyczne). Ziarna i konfiguracje startowe: NIE dotyczy (moduł czysty).

## 4. Zakres: które ścieżki zmiany właściciela (odpowiedź na zarzut 4)

Wszystkie miejsca zmiany `city.ownerId` dla miast (grep `ownerId =`): bunt `41831`, cesja `41869`,
aneksja państwa-miasta `40447`, przejęcie w walce/przechwycie `19160` (kończy się wywołaniem
`runCapitalCapturePlunder` na `19286`), walka `41565`, testowe hooki (`31627`, `31795`, `33860`).

- Bunt (`41831`): rozjazd odtworzony (S1, S4).
- Cesja w pokoju (`41869`): rozjazd odtworzony (S3). Cesja NIE wywołuje `runCapitalCapturePlunder`,
  więc nawet stolica oddana (nie zdobyta) zostawia wpis. Ocena, czy cesja stolicy powinna dawać
  sukcesję, jest decyzją właściciela (pytanie ABC), nie techniczną.
- Aneksja państwa-miasta (`40447`): NIE ZMIERZONO. Wpis właściciela-ofiary jest kasowany przy
  eliminacji (`main.ts:40584`), więc ścieżka nie zostawia stale wpisu dla tego samego właściciela.
- Przejęcie w walce (`19160`/`41565`): wywołuje plunder; rozjazd występuje tylko gdy surowy wpis
  różni się od faktycznej stolicy (przypadki jak S1), nie jest to osobna ścieżka błędu.
- Zamierzone czy nie: S2 (automatyczny powrót stolicy po odzyskaniu miasta) to obecne zachowanie
  resolvera; NIE stwierdzono, czy jest zamierzone. Do potwierdzenia.

## 5. Proponowana poprawka (NIE wdrożona w tej rundzie)

W `transferCityToRebelFactionWithLedger` (`41828`) i `transferCityByTreaty` (`41836`), przed zmianą `city.ownerId`:
jeśli `capitalCityIdByOwner.get(fromOwner) === city.id`, usunąć wpis tego właściciela.

Skutek: surowy wpis = efektywna stolica (fallback), `wasCapitalOfOldOwner` zgodne z resolverem,
przejęcie faktycznej stolicy uruchamia plunder i sukcesję. Zapis wstecznie zgodny (brak wpisu = fallback).

Dlaczego NIE wdrożona: (a) dispatch wymaga odtworzenia błędu „na żywo” przed poprawką, a pomiar live
nie został wykonany (§6); (b) poprawka zmienia zachowanie gry (przejęcie faktycznej stolicy zacznie
dawać plunder i sukcesję), więc wymaga decyzji właściciela (§7), a nie tylko decyzji inżynierskiej.

Testy po decyzji: regresja w narzędziu (S1, S1-GRACZ, S3, S4 oczekują `przejecie_stolicy`), mutacja
czerwona = wyłączenie czyszczenia (test musi wtedy wrócić do FAIL), bramki z dispatchu
(`ai-test 297/0`, `wiring 267/0`, `capital-capture-test`).

## 6. Co NIE zostało zmierzone (live)

- S1–S5 w przeglądarce (Trudny, Wysoki x4, kultura trudny, dyplomacja trudna; seed 4242 i 7; min. 3
  konfiguracje): NIE ZMIERZONO. Powód: w tej rundzie nie zbudowano wersji live ani nie uruchomiono
  Chromium; odtworzenie przejęcia stolicy armią wymaga scenariusza, którego nie ma w istniejących
  narzędziach (`caprebel2-live.cjs` tryb `odb` robi cesję hakiem, nie zdobycie).
- Częstość: jak często AI przenosi stolicę (`maybeRelocateThreatenedAiCapital`) i potem traci to miasto: NIE ZMIERZONO.
- Mennica/efekty stolicy po przejęciu efektywnej stolicy: NIE ZMIERZONO.
- Round-trip zapisu (S5): NIE ZMIERZONO.

## 7. Otwarte (do decyzji właściciela, pytanie ABC wg zasad)

- Czy przejęcie faktycznej stolicy AI i gracza ma uruchamiać plunder skarbca/puli oraz sukcesję (obecnie
  nie uruchamia w przypadkach S1/S3/S4)? Warianty: A) tak, zgodnie z komentarzem w kodzie (poprawka §5);
  B) nie, stolica po buncie nie jest już stolicą do celów plunderu (zostaje obecne zachowanie).
- Czy cesja stolicy w pokoju ma dawać sukcesję?
- Czy odzyskana stolica ma automatycznie wracać na swoje miasto (S2)?
- Pomiar live S1–S5 (3 konfiguracje, 2 ziarna) i częstość w rozgrywce — do wykonania w osobnej rundzie.
