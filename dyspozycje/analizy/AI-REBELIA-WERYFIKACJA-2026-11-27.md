# AI-REBELIA — weryfikacja na żywo (R-WEB-AI-REBEL-VERIFY-LIVE-Q1, tag AIREBELVER)

Data: 2026-11-27. Baza kodu: `025046346` (kandydat rundy 2, gra/src bez zmian względem `99375f77e`, FALE 928–929). Operator: runda 2/5 (obrona po zarzutach Evaluatora, raport `30-obrona-claude.md`).
Surowe dane: `dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/` (pliki `*-r3*` z tej rundy). Raporty: `runs/.../10-operator-claude.md` (runda 1, przywrócona), `runs/.../30-obrona-claude.md` (runda 2/5, obrona).

Ustawienia maksymalne (potwierdzone odczytem `__settingsLive.getSettings()` po starcie, każdy bieg): poziom trudności „Trudny” (`difficulty` = hard), „Kultura i religia” = trudny, „Koszty jednostek” = wysoki (×4), „Dyplomacja i wojna” = trudna. Start przez `__settingsLive.startNewGame` (realny `doStartGame`). Wcześniejsze biegi rundy 2 z `kosztJednostekPace` = niski są NIEAKTUALNE dla pozycji 1.

## Tabela wyników

| Pozycja | Wynik | NIE ZMIERZONO + powód techniczny |
|---|---|---|
| 1. Ochrona ostatniego miasta AI (bunt skrajny wymuszony, maksimum) | ZMIERZONO: OCHRONA-DZIALA na dwóch ziarnach. s4242: właściciel AI 8 (miasto city11), tury 2–7: `rebelState` = false, miasto przy właścicielu. s7: właściciel AI 21 (city24), tury 2–7: `rebelState` = false. Metryka „AI z 0 miast” = 0 w każdej turze (liczona po 29 właścicielach AI, którzy w t1 mieli miasto). Dane: `dane/max-ai-s4242-r3.txt`, `dane/max-ai-s7-r3.txt`. | — |
| 1a. Kontrola (ten sam hak, jedyne miasto GRACZA, maksimum) | ZMIERZONO: KONTROLA-ZBUNTOWANA. s4242: tura 1 właściciel 0; od tury 2 właściciel −99, `rebelState` = true, utrzymane do t7. Dane: `dane/max-control-player-s4242-r3.txt`. | — |
| 2. Stolica AI w buncie przy ≥2 miastach | CZĘŚCIOWO ZMIERZONO (seed 4242): bunt wymuszony na stolicy właściciela 13 (dwa miasta, stolica city16). Po buncie stolica przeniesiona na city17 (najstarsze pozostałe miasto, zgodnie z fallbackiem w komentarzu `capitalCityIdForOwner`, `gra/src/main.ts` l.2478), właściciel 13 zachowuje 1 miasto. Odczyt przez istniejący hak `__cityCessionTestDebug.capitalOf` / `ownerCityIds`. Dane: `dane/stolica-s4242-r3.txt/.json`. | Efekty stolicy w ekonomii, Mennica i warunki zwycięstwa przy buncie stolicy: NIE ZMIERZONO (brak odczytu Mennicy i stanu zwycięstwa w tej rundzie; poza zakresem). Hak odczytu stolicy już istnieje, więc DECISION_REQUIRED z rundy 1 nie jest potrzebny. |
| 3. Round-trip zapisu z buntami AI i wpisem „rebelia” | ZMIERZONO: seed 4242, tura 7 zapis (`__truceTestDebug.saveForTest`) z 1 wpisem na liście „Wydarzenia na świecie”; w NOWYM procesie Chromium wczytanie (`loadForTest`), tura po wczytaniu = 7, lista po wczytaniu identyczna (`roundTrip` = true), potem 6 tur do t13 bez zmian. Dane: `dane/news-s4242-r3*.txt/.json`. | Wariant hotseat: NIE ZMIERZONO. |
| 4. Zrzut okna dyplomacji z wpisem „rebelia” | ZMIERZONO: `dane/news-s4242-r3-first.png` (Chromium, viewport 1600×1000, deviceScaleFactor 1). Okno „Dyplomacja” otwarte przyciskiem paska (`.tb[data-act="diplo"]`), w sekcji „Wydarzenia na świecie” wpis „Bunt miasta: Harappa”. | Wpis leży przy dolnej krawędzi okna i jest częściowo przycięty wysokością viewportu (bez przewijania). |
| 5. Bieg żywy 60+ tur na maksimum (seed 4242 i 7): liczba buntów, wpisów „rebelia”, widocznych cywilizacji | CZĘŚCIOWO: 13 tur, seed 4242, 1 bunt wymuszony: 1 wpis „rebelia” na liście widocznej graczowi (kontakt z właścicielem ustawiony hakiem `__dyploMapaOdkrycieTestDebug.prepareContact`). Szum: dwa przebiegi tego samego ziarna (6 tur) dały identyczne wiersze tur 2–7 (`dane/max-ai-s4242-r3.txt` vs `-r3-b.txt`). | Bieg naturalny 60 tur z kontaktem ze wszystkimi cywilizacjami: NIE ZMIERZONO. Próba 1 (kontakt z 29 AI): tura 2 nie zakończyła się (ekrany powitalne kolejnych cywilizacji, `nieSettled`). Próba 2 (z diagnostyką i zamykaniem ekranów): limit 585 s bez wyniku, log `dane/natural-s4242-r3-ostatnia-proba.txt`. Seed 7 z wpisami: NIE ZMIERZONO (czas). Liczba widocznych cywilizacji: NIE ZMIERZONO. |

## Pozycja 1 — szczegóły i poprawki runnera

Runner: `gra/tools/ai-rebel-verify-max-live.cjs` (przepisany w rundzie 3).
- Start przez `__settingsLive.startNewGame` z parametrami maksymalnymi (wcześniej `__nnsMeasureDebug.startGame`, który na sztywno ustawiał koszty „niski”).
- Wybór AI z 1 miastem zależy od ziarna (`kandydaci[seed mod N]`). Wcześniej seed 7 wybierał tego samego właściciela co seed 4242 (owner 40).
- Metryka „AI z 0 miast” liczy wszystkich właścicieli AI, którzy w t1 mieli miasto (brak wiersza = 0 miast). Wcześniej metryka była ślepa na właściciela bez miast.
- Opcja `--target player` = kontrola na jedynym mieście gracza.
- Mutacja z raportu Evaluatora (`aiKeepsLastCity=false`) NIE została powtórzona w rundzie 3: skuteczność nowej metryki w wykrywaniu utraty miasta NIE ZWERYFIKOWANA mutacją.

## Pozycje 3–5 — szczegóły i runner

Runner: `gra/tools/ai-rebel-verify-news-live.cjs` (nowy). Fazy `first` i `resume` działają w osobnych procesach, a stan trzyma trwały profil przeglądarki w scratchpadzie (`launchPersistentContext`). Wcześniej `launch()` tworzył pusty profil, więc zapis z poprzedniego procesu nie był widoczny.
- Lista „Wydarzenia na świecie” czytana z DOM: `.dl-world-news` / `.dl-world-news-row` / klasa `.dl-wn-rebelia`, po otwarciu listy „all” przyciskiem paska.
- Kontakt z właścicielem warunkuje wpis (`recordAiCityRebellionNews`: `getDiplomaticContacts().has(prevOwnerId)`); ustawiany hakiem `__dyploMapaOdkrycieTestDebug.prepareContact`.
- Chromium: jedno zamknięcie strony przy wczytaniu w fazie resume (ponowienie 1/3 przeszło). Logi w `dane/news-s4242-r3-resume.txt`.

## Bramki (ta runda)

- `tsc --noEmit` (gra/): exit 0.
- `ai-city-rebellion-gate-test.cjs`: PASS=37 FAIL=0.
- `ai-city-rebellion-news-test.cjs`: PASS 24/0.
- `ai-test` (297/0) i `logic-test` (213/213): NIE RE-RUN w tej rundzie (gra/src bez zmian od kandydata); wyniki z raportu Evaluatora rundy 2.

## Pozycja 5 — dane z rundy 2 (NIEAKTUALNE co do ustawień, tylko liczby miast)

Pliki `dane/seed4242-maks.txt`, `dane/seed7-maks.txt` (summary: `unitCostPace` = wysoki) z biegów 60-turowych rundy 1/2. Nie były ponownie mierzone w rundzie 3 i liczą tylko miasta w buncie (`cityState`), nie wpisy na liście. Pole `lacznaZero` to liczba MIAST z łaską 0, a nie cywilizacji bez miast; nie dowodzi ochrony ostatniego miasta.

| Tura | s4242: miasta w buncie | s4242: miasta AI | s7: miasta w buncie | s7: miasta AI |
|---|---|---|---|---|
| t2 | 0 | 42 | 0 | 42 |
| t20 | 0 | 48 | 0 | 50 |
| t40 | 1 | 114 | 1 | 116 |
| t60 | 7 | 149 | 13 | 142 |

## Wnioski ostrożne

- Ochrona ostatniego miasta AI na maksimum: działa w 6 turach na dwóch ziarnach (s4242, s7). Kontrola na tym samym haku (miasto gracza) prowadzi do buntu już w t2.
- Stolica AI: po buncie stolicy właściciel dostaje nową stolicę (najstarsze pozostałe miasto) i nie traci wszystkich miast. Efekty ekonomiczne i zwycięstwo NIE ZMIERZONO.
- Round-trip listy wpisów „rebelia” przechodzi (seed 4242, 1 wpis).
- Zakres 60 tur i liczby wpisów przy wielu cywilizacjach: NIE ZMIERZONO (kontakt ze wszystkimi cywilizacjami blokuje zakończenie tury w bieżącym runnerze).
- Szum: dwa przebiegi tego samego ziarna dały identyczne wiersze (seed 4242, pozycja 1); dla seed 7 i dla 60 tur szum NIE ZMIERZONY.
