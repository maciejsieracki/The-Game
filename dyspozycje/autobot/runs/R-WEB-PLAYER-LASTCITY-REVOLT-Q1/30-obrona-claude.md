STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src w tej rundzie)
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1
GOAL: obrona r4 — odpowiedź na 6 zarzutów Evaluatora (commit b42cb00fa) dla kandydata 3f6bae092.
ZMIANY/COMMIT: poprawki wyłącznie w allowliście:
  - dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md (zarzuty 1, 2, 3, 5, 6)
  - gra/tools/plrrevolt-run.cjs (zarzut 4: komentarz przy ownerChangesTailFromJsonl; zmiana tylko w komentarzu, `node --check` OK)
  - dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/30-obrona-claude.md (ten raport)
  gra/src, gra/data: zero zmian (git diff --name-only = tylko powyższe).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTY. Dokument §00 pkt 5 podaje teraz różnice tur względem REALDEF4 (liczby z sekcji 0 pkt 3 REALDEF4):
   4242: t16 vs t10 = +6 tur; 778899: t12 vs t13 = −1 tura; seed 7: t29 vs „ok. t14” = ok. +15 tur (przybliżenie, REALDEF4 nie podał dokładnej tury).
2. PRZYJĘTY. Dodano wyraźne nagłówki „NIEAKTUALNE” / „Dokument historyczny” pod §0 (r3), §1 (tabela kultura AI normalny), §6 (korekty r3). Wskazano, które punkty są nieaktualne i gdzie obowiązuje §00.
3. PRZYJĘTY. §00 pkt 6 zawiera teraz jawną notę: `barbariansLevelGra = null` w `ab-nohook/seed4242.summary.json` (brak haka odczytu); poziom barbarzyńców w bundlu A wnioskowany wyłącznie z identycznego stateHash z B, którego readback = trudny (`ab-hook/seed4242.readback.txt`).
4. PRZYJĘTY (kosmetyka). Komentarz w gra/tools/plrrevolt-run.cjs (ownerChangesTailFromJsonl) mówi teraz: 3 ostatnie zmiany właściciela WSZYSTKICH miast, nie tylko gracza; filtr po ownerId gracza nie jest stosowany. Zachowanie bez zmian.
5. PRZYJĘTY jako ograniczenie, nie blokada. Dokument §00 pkt 9 zawiera zalecenie dla orkiestratora: przed pytaniem ABC o ochronę ostatniego miasta powtórzyć krótki pomiar na bazie z GRACE15 (FALA 935 na main). Pomiaru nie wykonano w tej rundzie (poza zakresem poprawek obrony). Wnioski „t12/t16/t29” oznaczone jako dotyczące kodu bez łaski.
6. PRZYJĘTY (zakres jawny). §00 pkt 6 zawiera teraz: A/B = 1 ziarno (4242), 15 tur (t2–t16). NIE ZMIERZONO nadal: bunt miasta gracza przy populacji >= 5 (§00 pkt 4). Nie dodano nowych biegów.

DOWODY POMOCNICZE (sprawdzone w tej rundzie):
- `git diff --check` = czysto; `node --check gra/tools/plrrevolt-run.cjs` = OK.
- Źródło liczb REALDEF4: dokument §00 pkt 5 / sekcja 0 pkt 3 (wartości przepisane bez zmian).
- Dane r4 (readback, ab-compare, summary) NIE były ponownie przeliczane w tej rundzie; wnioski §00 pkt 1–3 nie zmieniono.

BLOKADY: brak. Nie uruchamiano bramek gra/src (zero zmian w gra/src; dispatch r4 wymaga bramek tylko po npm ci — zmiana w tej rundzie to komentarz w narzędziu i dokument).
TESTY: `node --check gra/tools/plrrevolt-run.cjs` OK; `git diff --check` OK. Pełne bramki (tsc 0, logic 213, ai-test 297/0, society-breakdown 56/0) NIE PONOWIONE — brak zmian w gra/src; wynik z Evaluatora r4 (ten sam kod).
RUNDY: 4/5 (obrona r4); po tej rundzie do FC.
NASTĘPNY KROK: Final Control dla tej paczki (dokument + komentarz runnera). Pytanie ABC o ochronę ostatniego miasta gracza — dopiero po turnieju i po zalecanym pomiarze na bazie z GRACE15 (§00 pkt 9).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Pomiar GRACE15 (baza z łaską barbarzyńców, FALA 935) nie był częścią dispatchu r4; zalecany jako osobny temat przed decyzją ABC.
- Dokument §00 pkt 9 zawiera zalecenie dla orkiestratora; nie zmieniam balansu ani nie proponuję decyzji.
