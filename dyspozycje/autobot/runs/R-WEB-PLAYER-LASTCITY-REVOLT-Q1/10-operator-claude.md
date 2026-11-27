STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1 (tag PLRREVOLT)
GOAL: pomiar, czy gracz może stracić OSTATNIE miasto przez bunt i jak często; mechanizm zmiany właściciela miasta gracza w t29 (V4 normal/normal, seed 4242); skutek w UI. Zero zmian gra/src, zero zmiany balansu.
BAZA: origin/main 2e50241cd (detached). Kod gry bez zmian (gra/src, gra/data = 0 zmian).

ZMIANY/COMMIT: nowe pliki w allowliście: gra/tools/plrrevolt-run.cjs (kopia aibal2-measure-run.cjs + zapis zdarzeń konsoli „[Rebelia]/[Barbarzyncy]/[Bunt]/zdobyt” do *.events.log), gra/tools/plrrevolt-summarize.cjs (podsumowanie właścicieli miast gracza z jsonl), dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane/ (10 × *.jsonl.gz + *.events.txt, 3,2 MB), ten raport. SHA: patrz pole sha w odpowiedzi (commit tylko tych ścieżek, git add ścieżka).

ŚRODOWISKO: gra/ npm ci --ignore-scripts (OK); build vite: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/plrrevolt-dist --emptyOutDir` (OK, 22,95 s). Chromium z Playwright działał; startup + 60 tur ≈ 7 min na bieg, biegi sekwencyjne, jeden bieg = jedno wywołanie Bash (w limicie 590 s), bez SIGSEGV w tej serii.
Ustawienia (readback z surowego logu, trudny-s4242/run.log): kulturaReligiaLevel=trudny (gracz, zmienny w serii), kulturaReligiaLevelAI=trudny (MAKSIMUM, stałe), kosztJednostekPace=wysoki (maks.), difficulty=hard (Trudny = maks.), diplomacyWarLevel=trudna (maks.). Uwaga: sam argument --koszt-jednostek nie zmienia tempa (runner ustawia --pace, domyślnie normalny); w serii użyto --pace wysoki, readback potwierdza wysoki.

TESTY (wyniki z surowego wyjścia):
A) 9 żywych biegów do t60 (kultura gracza × ziarno; AI trudny; wszystkie na maksimum poza kulturą gracza). Liczba miast gracza z jsonl (owner 0, wg miastaWojsko), pierwsza tura bez miasta:
| kultura gracza | ziarno 4242 | ziarno 7 | ziarno 778899 |
| łatwy   | 1 do t60, bez utraty | utrata 1 miasta w t59 (przejęcie przez AI civ 1, wojsko 1) | 1 do t60 |
| normalny| 1 do t60, bez utraty | utrata 1 miasta w t58 (przejęcie przez AI civ 1, wojsko 0) | 1 do t60 |
| trudny  | 1 do t60, bez utraty | 1 do t60 | 1 do t60 |
Sumarycznie: 2 z 9 biegów utraciły ostatnie miasto (oba przez podbój AI owner 1, NIE przez bunt); 0 z 9 zawierało wpis „[Rebelia] Tura N … → frakcja rebeliantów” (console.log main.ts ok. 45267-45300) dla miasta gracza; 0 z 9 zmiany miasta gracza na owner −99.
Porządek miast gracza (min/śr po turach): NIE ZMIERZONO — cityOrderState (main.ts ok. 5923) jest lokalną mapą bez hooka odczytu; dodanie hooka wymagałoby zmiany gra/src (zakaz tematu).
Zdarzenia rebeliantów dla AI w tych biegach: wpisy konsoli „[Bunt] Tura N <miasto> → migracja −1 do <miasto>” (AI, 9–16 na bieg); to osobny komunikat, nie dotyczy miasta gracza.
Liczba miast gracza w tur t10/t20/…/t60: 1 we wszystkich biegach do utraty (patrz tabela).

B) Mechanizm t29 (replika V4: kultura gracza normalny, AI normalny, seed 4242, pace wysoki, Trudny, dyplo trudna; plik V4-normalny-normalny-s4242):
- Miasto gracza city0 (q69 r64) było w owner 0 do t28 (miasta 1, wojsko 0, jW 0).
- W t29 owner 0 ma miasta 0; w ownersOfCities pojawia się owner −1 (pierwszy raz w tej serii), citiesAll 86 → 91 (w tym liczniku widać też nowe miasta AI, nie analizowane).
- Konsola: `[Barbarzyncy] Miasto city0: spawn Wojownik Sherden @ (70,64)` pojawia się między „Tura 24” a „Tura 31” (log konsoli nie ma numeru tury dla tego wiersza). Ten wpis wypisuje blok tickBarbarianCityGarrisons (main.ts ok. 49239-49265), który działa tylko dla miast już należących do BARBARIAN_OWNER_ID (= −1, barbarians.ts:51) → city0 była już barbarzyńska.
- Brak wpisu `[Rebelia]` dla city0 → NIE jest to bunt (−99). Owner −1 = barbarzyńcy, zgodnie z addendum.
- NIE ZMIERZONO: dokładna linia kodu, która ustawiła ownerId = −1 dla city0 (kandydat: ścieżka zdobycia miasta przez barbarzyńców w walce; nie zidentyfikowano w tej rundzie). Etykieta „Bunt skrajny” przy owner −1 w t30–31 i flaga „osiedle” NIE WYJAŚNIONE.

C) Skutek w UI po utracie ostatniego miasta: NIE ZMIERZONO. Runner ma suppressVictory i kontynuował tury po utracie miasta (lastT=60 w obu biegach z utratą); nie odczytywałem ekranu porażki/„Wróć na mapę”. Nie odtwarzano minimalnie, bo żaden bieg nie wywołał utraty przez bunt.

D) Bramki: tsc --noEmit (gra/, node ./node_modules/typescript/bin/tsc) → exit 0. logic 213 i ai-test 297/0: NIE URUCHOMIONO (poza zakresem czasu tej rundy; kod gry bez zmian, git diff gra/src = 0).

Zasada testowania (maksimum): tempo kosztów jednostek = wysoki, trudność = Trudny, dyplomacja = trudna, kultura AI = trudny we wszystkich 10 biegach; kultura gracza łatwy/normalny/trudny (3 poziomy, zmienna wejściowa pomiaru). Maksimum uznane: Trudny (hard) z menu, bo to najwyższy dostępny poziom w readbacku.

BLOKADY: (a) Porządek miast gracza NIE ZMIERZONO (brak hooka odczytu bez zmiany gra/src); (b) kod ścieżki utraty city0 do owner −1 w t29 NIE ZIDENTYFIKOWANY; (c) UI po utracie NIE ZMIERZONO; (d) logic/ai-test NIE URUCHOMIONO.
Odnotowane z r1 (bez zmian): kod nie chroni ostatniego miasta gracza przed buntem (society-breakdown.ts:522-533 chroni tylko AI). W 10 biegach żaden bunt nie dotknął miasta gracza, więc częstość buntu gracza = 0/9 przy tej konfiguracji; utrata przez podbój AI: 2/9 (ziarna 7).

RUNDY: 2/5 (ta runda: r2, Operator Haiku). Wynik tej rundy: pomiar wykonany, mechanizm t29 częściowo.
ZAŁOŻENIA: (1) „owner −1 w t29” = barbarzyńcy (addendum); (2) „utrata 1 miasta przez AI owner 1” = podbój, bo owner 1 to cywilizacja AI, a nie −99/−1; (3) 9 biegów = kultura gracza × ziarno przy AI trudny (dispatch: kultura gracza zmienna, reszta maksimum).

UWAGI-DLA-ORKIESTRATORA:
1. Jeśli chcemy zamknąć mechanizm t29 (linia kodu zdobycia przez barbarzyńców) i Porządek gracza: potrzebny osobny temat ze zmianą gra/src (hak odczytu cityOrderState i log przyczyny zmiany ownerId) — poza zakresem tego pomiaru.
2. Plik gra/tools/plrrevolt-run.cjs zawiera kopię aibal2-measure-run.cjs (ta sama logika biegu) plus zapis zdarzeń konsoli. Nie ma kopii wrappera wymaganego dispatchem; wrapper = ten sam plik.
3. Dane w dane/ są skompresowane (jsonl.gz); summarizer czyta je z katalogu out (nieskompresowany), więc do ponownej analizy trzeba rozpakować.
4. Dyspozycja nie wymagała dokumentu dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md w tej rundzie (nie powstał w tej gałęzi bazowej); wyniki są w tym raporcie.

NASTĘPNY KROK: (1) osobny temat R-WEB-PLAYER-CITY-OWNER-TRACE (zmiana ownerId miasta gracza z przyczyną i Porządkiem, hak tylko do odczytu, ?civTest=1) — wymaga zgody na zmianę gra/src przez orkiestratora; (2) decyzja właściciela o ochronie ostatniego miasta gracza wg zasad ABC dopiero po tym pomiarze.
DEPLOY/PUSH: NIE WYKONANO
