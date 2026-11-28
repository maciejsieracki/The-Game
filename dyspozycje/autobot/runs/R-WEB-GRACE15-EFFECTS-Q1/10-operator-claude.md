STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (GRACE15FX), runda 3/5, Operator SONNET 5.5 (uzasadnienie: dwie nieudane rundy Haiku tego samego ID, args haikuFailures 2)
GOAL: wznawialny runner aktywnego gracza t1-30 klikiem; dźwignie po t16; readback barbarzyńców i barbarzyńcy po t16; dokument ze stanem wiążącym. Zero zmian gra/src i gra/data. Maksimum ustawień.

ZMIANY/COMMIT: baza 055ad0b8e6a087d0c9773ca2989df007801f509b (origin/main). Commit tej rundy: patrz pole sha w zwrocie Operatora.
- gra/tools/grace15fx-active3-live.cjs (nowy): wznawialny runner (zapis stanu na początku każdej tury, segmenty do ok. 430 s, wznowienie przez produkcyjną ścieżkę „Wczytaj z menu pauzy”); koniec tury wyłącznie klikiem; zakup obrońcy klikiem; suwaki Wyżywienia i podatku przez zdarzenie `input` w panelu miasta otwartym klikiem w miasto; rozwiązanie jednostki klikiem (miasto -> JEDNOSTKA -> ROZWIĄŻ); gałęzie pomiaru dźwigni osobno (`G15_ONLY`), ścieżka gracza (`G15_ALLOW`).
- dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md: nowy STAN WIĄŻĄCY (r3) na górze, sekcja 2.3 (tabele t1-30, 2 ziarna), poprzedni stan oznaczony jako historia.
- dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/aktywny-r3/ (turns/levers/readback/barblog/result dla ziaren 11 i 7 oraz gałęzi dźwigni; razem ok. 160 KB).
- git diff gra/src gra/data = 0 (puste).

TESTY (surowe wyjście):
- npx tsc --noEmit: exit 0 (TSC_EXIT=0)
- logic-test: LOGIC OK (213/213)
- ai-test: 297 passed, 0 failed
- early-grace-15-test: 33 passed, 0 failed
- node --check gra/tools/grace15fx-active3-live.cjs: OK
Pomiary na żywo (maksimum: Trudny, dyplomacja trudna, kultura trudny, Wysoki x4 koszt jednostek i ludność, barbarzyńcy trudny, mapa Standardowy, 1 rywal, 15 typów cywilizacji, 1 miasto-państwo; podatek Skarb 100% suwakiem UI od t1):
- Ziarno 11: Łucznik kupiony klikiem w t5; t16 blokada ŻYWNOŚCIOWA (prognoza Spichlerza −30, „zabraknie 18”); dźwignie na kopii zapisu t16: suwak Wyżywienia na minimum −30 -> −18, nadal blokada; rozwiązanie 1. jednostki (Wojownik) −30 -> −14, nadal blokada („zabraknie 2”); rozwiązanie 2. (Łucznik) −> +2, bramka otwarta; suwak Wyżywienia po rozwiązaniu 1. jednostki już na 0 (min = max = 0), więc „obniżka racji +12” z komunikatu bramki niewykonalna. Ścieżka gracza t16-30: obie jednostki rozwiązane, t17-30 bramka otwarta, miasto żyje w t31 (skarbiec 212, Spichlerz 15, 0 jednostek wojskowych).
- Ziarno 7: Łucznik klikiem w t5; blokada t16 (−28) i t17 (−2); rozwiązanie po jednej jednostce w t16 i t17; t18-30 bramka otwarta, miasto żyje w t31 (skarbiec 166, Spichlerz 26, 0 jednostek wojskowych).
- Barbarzyńcy: liczniki 0/0 w t1-16; log „Tura 17: nowe obozy: 12” (spawn na końcu t16); t17: 12 obozów/13 jednostek, t30: 42 (s11) i 40 (s7) jednostek; obce jednostki w promieniu 3 heksów od miasta = 0 w każdej turze 1-30 na obu ziarnach; pierwszy atak na gracza do t30: nie zaobserwowano.
- Readback poziomu barbarzyńców: z zapisu stanu gry `meta.newGameParams.advanced.barbariansLevel = "trudny"` (readback-s11.txt, readback-s7.txt); `getSettings` pola nie zwraca.

ODPOWIEDŹ NA ZAKRES RUNDY (dispatch DODATEK r3):
1. Wznawialny runner: ZROBIONY i użyty na 2 ziarnach z Drewnem (11, 7), t1-30, bez haków zmieniających stan; koniec tury wyłącznie klikiem. Wznowienia: 3 na ziarno, bez SIGSEGV (jedno wznowienie zakończyło się timeoutem oczekiwania 120 s na turę po wczytaniu — podniesiono limit do 330 s i powtórzono, kolejne wznowienia 150-300 s).
2. Dźwignie po t16: zmierzone liczbowo (ziarno 11 osobno; ziarno 7 tylko rozwiązanie jednostek). Suwak Wyżywienia znaleziono: zakładka „Wyżywienie i wzrost — suwak 0–6” w panelu miasta (powodem niepowodzenia r2 był widok bez tej zakładki). Rozwiązanie jednostki: klik w miasto -> „JEDNOSTKA” -> „ROZWIĄŻ”. Podatek: już 100% Skarb od t1, dźwignia wyczerpana (tryb taxdef nie był mierzony). Budowa zwiększająca żywność: NIE ZMIERZONO (przyciski „Kup” przy budynkach żywnościowych nieaktywne, nic nie kliknięto).
3. Readback i barbarzyńcy po t16: zrobione (patrz wyżej); pierwszy atak na AI: NIE ZMIERZONO.
4. Dokument: zaktualizowany (stan wiążący + sekcja 2.3), bez sprzeczności z danymi r3.

ZASTRZEŻENIA / NIE ZMIERZONO:
- Wznawianie z zapisu: ciągłość przebiegu na tych ziarnach nie była porównywana z ciągłym (opieram się na SAVEFIX, 6/6 tur, ziarno 4242). Po wczytaniu mapa odbudowana z zapisu (mapDiffers=true).
- Hak tylko do widoku: ustawienie kamery na stolicę (`focusCameraOnOwnerCapitalForTest`) przed kliknięciem w miasto, oraz fallback `openCityPanelForTest` (użyty w nieudanej próbie 1 i sporadycznie; log `openVia`). To stan widoku, nie gry.
- Suwak puli Pracy na ulepszenia = 100% nie ustawiany (pomiar dotyczy żywności/skarbca); NIE ZMIERZONO przy tym ustawieniu.
- Tylko 2 ziarna, jeden wariant podatku (Skarb 100%); wynik rozwiązania jednostek jest zależny od ziarna (1 vs 2 jednostki).
- Dane s11 w pliku levers-s11-PROBA1-klik-w-miasto-nieudany.jsonl to nieudana próba (nie dowód).
- Ścieżka gracza w turach 17-30 nie obejmuje scenariusza „gracz dokupuje obronę po odblokowaniu” (poza zakresem).

BLOKADY: brak.
RUNDY: 3/5 (r3 Operatora; po FAIL r1 i BLOCK/FAIL r2).
NASTĘPNY KROK: Evaluator (Sonnet), następnie Obrona (Haiku) i Final Control; po FC integracja orkiestratora.

UWAGI-DLA-ORKIESTRATORA:
- Komunikat bramki „Pomogą: obniżka racji żywności: +12” bywa nieużyteczny: po rozwiązaniu jednej jednostki suwak Wyżywienia jest już na 0 i zablokowany (min = max = 0, „−10%”). Kandydat na błąd UI/komunikatu (decyzja i ewentualny temat po stronie orkiestratora; nic nie poprawiano).
- Dla pytania ABC „co dalej po t16” fakty wiążące: po t16 jedyną skuteczną dźwignią jest rozwiązanie jednostek wojskowych (1 lub 2 w zależności od ziarna); miasto zostaje bez obrony wojskowej; barbarzyńcy (12 obozów, 13 jednostek) zaczynają od t17 i do t30 nie dotarli na 3 heksy od miasta (2 ziarna). Skutek dla gracza opisywać w słowach gry, bez nazw plików.
- W pamięci podręcznej /tmp (katalog scratchpad) zostały stany zapisów (ok. 1 MB każdy); poza repo.

DEPLOY/PUSH: NIE WYKONANO
