# R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko gra/tools + evidence; gra/src bez zmian)
TEMAT: R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1
GOAL: odpowiedz liczbami, czy w bitwie Wojownik 10v10 obronca ma przewage nad atakujacym i czy wynika z ustawienia czy z regul; bez zmian zasad.
BAZA/KANDYDAT: baza 32c13e63f863553392b1bcaf60e14731bb2a0002; kandydat 29eef50e1ee13cc48aed70de055ed9a42926a4c5. `git merge-base --is-ancestor 32c13e63f 29eef50e1` = OK (potomek bazy).

## WERYFIKACJA WLASNA (dowody)
- Diff vs baza: `git diff --stat 32c13e63f 29eef50e1 -- gra/src` pusty. Poza katalogiem tematu zmieniony jest jeden plik: gra/tools/live-verify-wojownik-map-q1.cjs (przelacznik env W_HIT domyslnie `losowe` + probe `bu.stats`; `node --check` OK). Allowlista zachowana; brak zmian w gra-robocza/WERSJE.md.
- Surowe JSON przeliczone samodzielnie: losowe (auto, 20 ziaren) atakujacy 10 / obronca 10 / 20 unikalnych wynikow; pewne atakujacy 6 / obronca 14 / 8 unikalnych wynikow — zgodne z raportem obrony. Losowe ziarno 5 = wzajemna eliminacja 10/10 (liczone jako remis w poprawionej tabeli obrony).
- Statystyki: live-stats-atk-s1-auto.json: 20 jednostek (10+10), 1 unikalny slownik; pola health 22, meleeAttack 4, meleeDefence 4, weaponDamage 4, piercing 1, armor 2 — zgodne z gra/data/units.json (odczyt wlasny). Kryterium (c) spelnione.
- live-def-s1-s2-auto.json: oba przebiegi `brak okna przed bitwa (AI nie zaatakowal)` — powod NIE ZMIERZONO zamiany stron udokumentowany dowodem.
- Numery linii z diagnozy zweryfikowane w kodzie: battleScene.ts 5767-5772 (kolejnosc inicjatywy: atakujacy przed obronca w kazdym indeksie), 9540-9546 (tryb pewne: hitPct 100, roll 0), 3667 (`_manualMode` z bramka generala).
- Bramki: gra/src jest bajtowo identyczne z baza, wiec wyniki bazy = wyniki kandydata. Surowe wyjscia z evidence/: tsc exit 0 (pusty), logic-test 213/213, tech-tree-test 20/0, research-test 33/0, unit-replace-test 21/21, combat-test 6/6. NIE URUCHOMIONE PRZEZE MNIE PONOWNIE: brak gra/node_modules, dysk 0,8 GB wolnego (< progu); oparte na dowodzie obrony + identycznosci gra/src. Chromium/Vite: NIE ZMIERZONO przeze mnie (temat to pomiar narzedziowy, wyniki z raw JSON).

## ODPOWIEDZI NA ZARZUTY
1. Zamiana stron (hak civTest niedodany): ODDAL. Kryterium (b) dopuszcza jawne NIE ZMIERZONO z powodem; powod ma dowod live (AI nie atakuje w oknie, ziarna 1-2). Hak = zmiana scenariusza testowego, nie zasad; wykonanie to DO DECYZJI CZLOWIEKA (ABC wlasciciela: czy dodac hak), nie blad kandydata.
2. Tryb reczny: ODDAL. Proba wykonana (manualCommanderGate=true, playerHasCommander=false, battleScene.ts:3667); hak generala zmienia warunek wejscia w tryb reczny — dispatch dopuszcza NIE ZMIERZONO, jesli niemozliwe bez zmiany zasad. DO DECYZJI CZLOWIEKA (razem z 1).
3. Statystyki pole po polu: ODDAL jako naprawione (patrz wyzej, 17 pol, identyczne z units.json).
4. Brak testu hakow/mutacji, W_HIT bez testu: ODDAL. Zadnego haka w gra/src nie dodano, wiec kryterium (d) nie ma przedmiotu; W_HIT to zmienna srodowiskowa sterownika (domyslnie bez zmiany zachowania), luka jawnie opisana. Nie powoduje bledu pomiaru (tryby dały rozne wyniki na tych samych ziarnach).
5. Diagnoza przyczyny: ODDAL. Diagnoza hipotez z lokalizacjami i opcjami A/B/C jest w raporcie obrony; przewaga nie uznana za potwierdzona (8 unikalnych wynikow w trybie pewne, nie 20 niezaleznych). Wybor opcji A/B/C = DO DECYZJI CZLOWIEKA.
6. Metodyka statystyczna: ODDAL jako naprawione (a: unikalne wyniki i Wilson dla 8, b: remis dla ziarna 5, c: definicje strat/ucieczek, d: nota o PAT po morale).
7. Niescislosci: ODDAL jako naprawione (rundy auto vs skip, meta.runda = numer rundy narzedzia, srednia 14,45).
Zadne zarzuty nie wymagaja NAPRAWY kodu -> brak podstaw do FAIL.

## WYNIK POMIARU (to, co zostaje wiazace)
- Tryb `losowe` (gracz = atakujacy, mapa): 10:10, Wilson 95% 29,9-70,1% — brak dowodu przewagi obroncy.
- Tryb `pewne`: obronca 14/20, ale 8 unikalnych wynikow (deterministyczny); przewaga obroncy NIEPOTWIERDZONA statystycznie; uczciwy wniosek: sugestia przewagi obroncy w `pewne`, przyczyna (kolejnosc inicjatywy vs bonusy obrony vs geometria) NIE ZMIERZONA.
- Auto vs pomin: zwyciezca zgodny w 40/40 parach, straty zgodne poza 1 para, liczba rund rozna w 7 parach (#501).
- Zamiana stron i tryb reczny: NIE ZMIERZONO. Zgloszenie #286 NIEROZSTRZYGNIETE.

## BLOKADY
Brak blokad technicznych. Do decyzji wlasciciela: hak civTest (pkt 2/3), opcja diagnozy A/B/C, ew. osobny audyt #286.

## RUNDY
Runda tematu: 1 operator + 1 obrona; FC to pierwsza kontrola koncowa (limit 5 niewyczerpany).

## NASTEPNY KROK
Integracja orkiestratora SHA 29eef50e1ee13cc48aed70de055ed9a42926a4c5 (FF/merge do main; tylko narzedzie + evidence + raporty, bez wdrozenia ROBOCZEJ). Przed integracja: sprzatanie dysku (wolne 0,8 GB). Rejestr: pytania ABC (hak civTest, opcja A/B/C, #286).

UWAGI-DLA-ORKIESTRATORA
- Dysk 99% (831 MB wolnego) — nie dalo sie niezaleznie uruchomic tsc/testow; sprzatnij worktree przed kolejnymi tematami.
- origin/main wyprzedza baze (ca162f930, FALA 810); base 32c13e63f jest jego przodkiem — przy integracji sprawdz `git merge-base --is-ancestor` i `git diff --stat` (zmiana dotyczy tylko gra/tools + katalogu tematu, konflikty malo prawdopodobne).
- dispatch tematu istnieje tylko w galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie w origin/main.

DEPLOY/PUSH: NIE WYKONANO
