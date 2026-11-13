# R-WEB-DIPLO-CIVPEDIA-Q1 — raport Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (dokumentacja + generowany bundle + test wartości; kod gry bez zmian)
TEMAT: R-WEB-DIPLO-CIVPEDIA-Q1
GOAL: Encyklopedia i poradnik opisują OBECNY stan dyplomacji (kara za sąsiedztwo −3/−4/−5 z wstrzymaniem w karencji, religia bez wpływu na Zaufanie, Zaufanie po rozejmie 10 / po pokoju 20); zasady niewdrożone (siła militarna, wypowiadanie wojny, rozejm i pokój, etykiety nastawienia) zostają w bloku „zatwierdzone, jeszcze niewdrożone”.
BAZA: 478cefaed (origin/main) + merge --no-ff 872078bf2 (kandydat rundy 1, łączy d09df3e0b i raport obrony r2). Konflikt nie wystąpił; wikiBundle.json po merge regenerowany skryptem.

## ZMIANY / COMMIT
Commit z kodem/raportem: SHA w polu sha odpowiedzi (czubek gałęzi detached HEAD w worktree wf_7adb411f-b0d-1). Bez push.

Zmienione pliki (allowlista rundy 2: docs, wikiBundle.json, test):
- docs/encyklopedia/pojecia/zaufanie.md — tabela zmian na turę: sąsiedztwo −3 / −4 / −5 (było −2 / −3 / −4), dopisane wstrzymanie w karencji; usunięte wiersze religii ±0,5 z tabeli obecnych zmian (historia opisuje usunięcie); nowy podpunkt „Ustawiane wartości po umowie” (rozejm 10, pokój 20); blok „Zasady zatwierdzone” oczyszczony z punktów wdrożonych; tabela Parametry zaktualizowana (religia 0/0, sąsiedztwo −3/−4/−5, rozejm 10, pokój 20); Historia — runda 2 z odsyłaczami do kodu.
- docs/encyklopedia/pojecia/rozejm-pokoj.md — punkt „Zaufanie 10 po rozejmie / 20 po pokoju” przeniesiony z bloku niewdrożonego do obecnych zasad (rozejm i pokój), usunięty z bloku „zatwierdzone, jeszcze niewdrożone” (pozostałe 4 punkty zostają).
- docs/PORADNIK-GRACZA/12-dyplomacja.md — usunięte 7 wystąpień zdania „Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.” (patrz BLOKADY pkt 1).
- gra/src/data/wikiBundle.json — regeneracja `node gra/tools/bundle-wiki-for-game.cjs` (22 rozdz. + 181 haseł), dwukrotnie: po merge i po edycjach haseł.
- gra/tools/diplo-civpedia-values-test.cjs — oczekiwane wartości: kary −3/−4/−5; nowe asercje religia = 0/0 i rozejm/pokój = 10/20 (z JSON); asercja, że `rozejm_zaufanie_ustawienie` jest czytany w gra/src/main.ts; mutacja: zmiana kary Żelazo −5 → −4 w haśle jest wykrywana.
- dyspozycje/autobot/runs/R-WEB-DIPLO-CIVPEDIA-Q1/10-operator-claude.md — ten raport.

Nie zmieniano: kodu gry (gra/src poza wikiBundle.json), JSON balansu, WERSJE.md, indeks.md, wiarygodnosc.md (wiarygodność ani dryf nie zmieniły się; brak liczb z tych zmian w haśle).

## WERYFIKACJA W KODZIE (plik:linia)
| Liczba w haśle | Wartość | Źródło |
|---|---|---|
| Sąsiedztwo Kamień | −3 | gra/data/diplomacy.json:28 (`ekspansjaGranica_zaufanie_perTura`); gra/src/game/diplomacy.ts:162, 610 |
| Sąsiedztwo Brąz | −4 | gra/data/diplomacy.json:29; gra/src/game/diplomacy.ts:164, 609 |
| Sąsiedztwo Żelazo | −5 | gra/data/diplomacy.json:30; gra/src/game/diplomacy.ts:166, 608 |
| Wstrzymanie w karencji | 0 | gra/src/main.ts ok. 23214–23219 (`karaWspolnaGranicaDelta` = 0 gdy `isPeaceLockedBetween` lub `isTruceActive`) |
| Religia wspólna / odmienna | 0 / 0 | gra/data/diplomacy.json:26–27; gra/src/game/diplomacy.ts:158, 160; diplomacy.ts:1814 (flagi ignorowane) |
| Rozejm — ustawienie zaufania | 10 | gra/data/diplomacy.json:31; gra/src/game/diplomacy.ts:168; gra/src/main.ts:12117 (`finalizePeaceTreatyBetween`) |
| Pokój — ustawienie zaufania | 20 | gra/data/diplomacy.json:32; gra/src/game/diplomacy.ts:170; gra/src/main.ts:12118 |
| Start zaufania / respektu | 20 / 30 | gra/data/diplomacy.json (params.startZaufanie, startRespekt) — sprawdzone testem |

Wynik: kod i JSON zgodne z hasłami. Brak niezgodności poza pkt 1 w BLOKADACH.

Uwaga do funkcji `computeTickZaufanieDelta` (diplomacy.ts:1797–1822): kara sąsiedztwa wchodzi tylko przez `karaWspolnaGranicaDelta`; religia nie wchodzi wcale.

## TESTY
- `node gra/tools/diplo-civpedia-values-test.cjs` → PASS: 121 sprawdzeń, wierszy parametrów w haśle: 150 (wynik z surowego wyjścia po edycjach i regeneracji bundle).
- `node gra/tools/logic-test.cjs` → `LOGIC OK (213/213)`.
- `node gra/tools/admin-panstwo-panel-names-test.cjs` → `admin-panstwo-panel-names-test: 26 pass, 0 fail`.
- `npx tsc --noEmit` (w gra/) → exit 0 (plik wyjściowy pusty).
- `git diff --check` → bez wyjścia (czysto).
- `node gra/tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 181 haseł (~1259 KB)`; drugie uruchomienie po edycjach haseł.
- Zależności: `npm ci --ignore-scripts` w gra/ (komunikat o audycie, bez błędu instalacji). Nie uruchamiano `npm run build/dev`.

## BLOKADY / ROZBIEŻNOŚCI
1. Religia w poradniku (ZASTOSOWANE): `12-dyplomacja.md` podawał „Wspólna religia +10 relacji”. W kodzie nie ma takiego wpływu: `diplomacy.json` nie ma parametru religii dla relacji, a zdarzenie `wspolna_religia` (diplomacy.ts:875, 1003) nigdzie nie jest wywoływane (grep po gra/src). Zdanie usunięto. Decyzja orkiestratora: czy religia ma w ogóle wpływać na relację (poza zaufaniem), czy to tylko dokumentacja do poprawy w przyszłej rundzie.
2. Pozostałe rozbieżności z rundy 1 (dobra wola 3 vs 5 tur; cena pokoju w zmęczeniu 40% vs 60%; zdania `diplomacy.json` o −30/−25/−15 Relacji w opisach akcji; przesłanki AI do wypowiedzenia; warunek „>2 miasta” kary sąsiedztwa; próg +15 Respektu „przy 50% przewadze”) NIE są zmieniane w tej rundzie — poza zakresem dispatchu rundy 2. Warunek „>2 miasta” był dotąd NIEZMIERZONY; w kodzie sprawdzana jest wspólna granica lądowa (`ownersShareLandBorderLive`, main.ts ok. 23210), nie liczba miast — hasło zaufanie.md go nie podaje.
3. Etykiety nastawienia (Wrogi poniżej 10, Nieufny 10–29) i rozejm/pokój według zasad z decyzji właściciela (siła militarna 20%, miasto jako słodzik, bez „czuje się silniejsze”) — zostają w bloku „zatwierdzone, jeszcze niewdrożone” w hasłach rozejm-pokoj.md i wypowiedzenie-wojny.md; nie opisano ich jako obowiązujących.
4. Wiarygodność i Power nie były zmieniane w tej rundzie (brak zależności od zmian z dispatchu) — NIE_ZMIERZONO ponownie w tej rundzie poza testem wartości.

## RUNDY
2/5 (runda 2: merge kandydata rundy 1 + aktualizacja do stanu kodu z 478cefaed + test).

## NASTĘPNY KROK
Evaluator (Sonnet): (a) zgodność haseł zaufanie.md i rozejm-pokoj.md z tabelą „WERYFIKACJA W KODZIE”, (b) sprawdzenie, że blok „zatwierdzone, jeszcze niewdrożone” nie zawiera już wdrożonych punktów, (c) decyzja orkiestratora w sprawie BLOKAD pkt 1 (religia) i pkt 2 (rozbieżności z rundy 1).

DEPLOY/PUSH: NIE WYKONANO
