STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-RECAPTURE-Q1
GOAL: zmierzyć odzyskanie zbuntowanej stolicy AI i naprawić tylko po odtworzeniu błędu.
ZMIANY/COMMIT: kandydat bcb4d3c7d (baza af3e0f141). `git merge-base --is-ancestor af3e0f141 bcb4d3c7d` = TAK. `git diff --stat`: 4 pliki, +408/-0: analiza STOLICA-ODBICIE-PO-BUNCIE-2026-11-27.md, 10-operator-claude.md, 30-obrona-claude.md, gra/tools/capital-recapture-stale-designation-test.cjs. Allowlista zachowana; zero zmian gra/src i gra/data. Brak plików tymczasowych po uruchomieniu narzędzia.
TESTY (własne, surowe wyjście; ESBUILD_DIR z innego worktree, bo w tym brak node_modules):
- capital-recapture-stale-designation-test.cjs: rc=1, PASS=7 FAIL=4 NIE-ZMIERZONO=1. FAIL: S1-AI, S1-GRACZ, S3, S4 (przejęcie faktycznej stolicy zwraca null zamiast przejecie_stolicy). PASS: efektywna stolica po buncie/cesji/dwóch buntach, KONTROLA z wyczyszczonym wpisem (przejecie_stolicy), S2, kotwice. S5 NIE ZMIERZONO.
- Kotwice sprawdzone niezależnie w main.ts: 40168 (capitalCityIdForOwner), 40736 (runCapitalCapturePlunder), 40764 (designatedCapitalId = surowa mapa), zapisy wpisu 32057/40316/40379/40797, restore 52703. wasCapitalOfOldOwner (capital-capture.ts:102): gdy designated != null, porównanie id jest całym kryterium. Mechanizm rozjazdu potwierdzony czytaniem kodu.
- Bramki dispatchu (tsc, logic, tech-tree, research, combat, ai-test, wiring...): NIE URUCHAMIANO; zero zmian gra/src, więc nie dotyczą kandydata (kod gry identyczny z bazą).
- Pomiar live S1-S5 (Trudny, Wysoki x4, ziarna 4242 i 7, >=3 konfiguracje): NIE ZMIERZONO. Poziom maksymalny nie został zastosowany, bo pomiar live nie powstał.
OCENA ZARZUTÓW (bez etykiet ról):
1. Live nie wykonany, kryterium binarne niespełnione: SŁUSZNY, nienaprawiony. Obrona go przyjęła, ale nie wykonała pracy. Kryterium dispatchu pozostaje niespełnione.
2. Replika zamiast main.ts, brak asercji: NAPRAWIONY w zakresie narzędzia (asercje, rc=1 przy FAIL, kotwice, S1-GRACZ/S3/S4). Ograniczenie zostaje: resolver i odczyt wpisu to kopie, więc dowód jest na poziomie modułu i kodu, nie żywej gry. Uwaga: narzędzie na stanie niepoprawionym zawsze kończy rc=1, więc nie nadaje się jeszcze na bramkę; stanie się regresją po poprawce.
3. Warunek wystąpienia wpisu: NAPRAWIONY w analizie (§2, tabela miejsc zapisu, stolica gracza). Częstość w rozgrywce NIE ZMIERZONO.
4. Zakres poprawki (podbój/aneksja, S2): ODDANY jako uwaga; analiza §4 opisuje ścieżki, aneksja i S2 pozostają niezmierzone/do decyzji.
5. Drobne: NAPRAWIONE (sprzątanie w finally, numer linii 40736 zgodny z main.ts).
WERDYKT UZASADNIENIE: praca dokumentacyjna i narzędzie są rzetelne i uczciwie oznaczają NIE ZMIERZONO; rozjazd odtworzony na poziomie modułu i kodu. Ale GOAL i kryterium binarne (tabela PASS/FAIL na żywo oraz poprawka z testem czerwonym/zielonym) nie są spełnione, a poprawka zmienia zachowanie gry (przejęcie faktycznej stolicy zacznie dawać plunder skarbca i sukcesję), więc wymaga decyzji właściciela. Nie ma kodu do integracji; kandydat może wejść do main jedynie jako dokumentacja/narzędzie pomiarowe (nie szkodzi, ale narzędzie z rc=1 nie powinno wejść do bramek).
BLOKADY: (1) decyzja właściciela (jednozdaniowo, do redakcji wg ABC): czy przejęcie faktycznej stolicy po buncie lub cesji ma uruchamiać plunder skarbca i sukcesję stolicy (dziś nie uruchamia)? Do osobnej decyzji także: czy stolica wracająca po odzyskaniu zbuntowanego miasta (S2) jest zamierzona. (2) pomiar live S1-S5 nie wykonany.
RUNDY: FC po rundzie 1/5 (+ obrona).
NASTĘPNY KROK: pytanie ABC do właściciela; równolegle osobny temat live (zdobycie stolicy armią, Trudny, Wysoki x4, ziarna 4242 i 7, >=3 konfiguracje, S1-S5 z tabelą) bez czekania na decyzję; po decyzji poprawka (czyszczenie/aktualizacja wpisu przy zmianie ownerId, main.ts ok. 41828 i 41836), regresja z mutacją czerwoną, bramki dispatchu.
UWAGI-DLA-ORKIESTRATORA: narzędzie wymaga ESBUILD_DIR w worktree bez node_modules; nie dodawać go do bramek przed poprawką (rc=1 z założenia).
DEPLOY/PUSH: NIE WYKONANO
