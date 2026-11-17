STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-HARNESS-TRIAGE-B-Q1
GOAL: triage drugiej połowy 18 czerwonych harnessów (exit 1) ze skanu HARNREM; naprawa klas (a)/(c) tylko w gra/tools; (b)/(e) do orkiestratora/właściciela; gra/src i gra/data nietknięte.
BAZA: d59bd7a5a5e988f3c315d5a4f865dccb9d80a4c4 (jest przodkiem kandydata: `git merge-base --is-ancestor` = OK).
KANDYDAT OCENIANY: c1668bf77987a7ae73f2b3ecae193985ed25df7d (kod operatora ae600d5ed.. + kod obrony e84b5798d, raporty 10/30).

ZMIANY/COMMIT (ZMIERZONO): `git diff --stat d59bd7a5a c1668bf77` = 11 plików: 9 x gra/tools/*.cjs (march-resume-next-turn, newgame-menu-reorder-layout, panel-kolejka-pasek-postepu, praca-panel-budowy-warstwa-real-render, recruit-list-order-by-era, recruitment-panel-compact-row, structure-defense-bonus, szczescie-przebudowa-skali, tech-discovery-badge-diorama) + 2 raporty. `git diff d59bd7a5a c1668bf77 -- gra/src gra/data gra-robocza WERSJE.md` PUSTY. Allowlista zachowana. `git diff --check` czyste (brak wyjścia).

TESTY (surowe, uruchomione przeze mnie w worktree FC, `npm ci` + xvfb-run, po jednym Chromium naraz):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass/0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed (exit 0 każdy)
- march-resume-next-turn-test exit 0 (47/0)
- structure-defense-bonus-test exit 0 (8/0)
- recruit-list-order-by-era-test exit 0 (18/0)
- recruitment-panel-compact-row-test exit 0 (39 pass/0 fail)
- panel-kolejka-pasek-postepu-test exit 0 (82/0)
- praca-panel-budowy-warstwa-real-render-test exit 0 (28/0)
- newgame-menu-reorder-layout-test exit 0 (6 konfiguracji; 14 kart)
- tech-discovery-badge-diorama-test exit 1 (62 PASS/1 FAIL): (B2) worst 7px (limit 4px), odznaki 120x7 i 58x7 przecinają elipsę gruntu
- szczescie-przebudowa-skali-test exit 1 (532 OK/3 FAIL): 2b komplet epok 12/24/32 vs cele 11/23/31
- Baza vs kandydat: czerwone na bazie wg Evaluatora (17/1, 9 wierszy, 516/4, 61/2) → po poprawkach jak wyżej. Ja dodatkowo potwierdziłem "cofnięcie poprawki → czerwony" dla newgame-menu (wersja z bazy: exit 1, "advanced window has 13 rows"). Plik tymczasowy usunięty, PNG w evidence/ przywrócone, `git status` czysty.

OCENA ZARZUTÓW EVALUATORA:
1. recruit-list (sonda .list-scroll): NAPRAWIONE w e84b5798d (selektor + warunek bez przewijania), 18/0. ODDAL (zamknięte).
2. recruitment-panel-compact-row: przyczyna zbadana i spójna z mierzeniem (Grecja, 3 jednostki ogólne zastąpione narodowymi, 9+3=12). Próg 12→9 uzasadniony; zachowanie zamierzone. ODDAL (zamknięte). Uwaga: próg ">= 9" jest luźniejszy niż dokładny skład; akceptowalne (komentarz z listą nazw).
3. tech-discovery: c1 (a) naprawione. Nowa asercja c1 jest słabsza niż dokładna liczba (reguła height:auto w CSS + wysokość != 226), ale oparta na dowodzie commita dacae1798; akceptowalne. B2 = klasa (b), zostaje czerwone: tolerancja 4px to jawna intencja testu, 7px to defekt układu w gra/src. ODDAL do orkiestratora jako osobny temat src (nie decyzja człowieka, nie do tego tematu).
4. szczescie: inwentaryzacja 41→44 kompletna (garnizon 918e59933, mury_kamienne 0bf194d76, emporion c80f39cf0, wszystkie dajeSzczescie=false). Pozostałe 3 FAIL (2b) = cele właściciela, DO DECYZJI CZŁOWIEKA (realna decyzja produktowa: czy nowe budynki wchodzą do kompletu).
5. tsc + 5 bramek: DOGONIONE, zielone (wyżej).
6. newgame mutacja: brak mutacji src, ale cofnięcie poprawki daje czerwony (potwierdzone przeze mnie). ODDAL.
7. PNG w evidence/: uwaga dla integratora (poniżej), bez skutku na kod.
Żaden zarzut nie wymaga dalszego NAPRAW.

BLOKADY: brak blokad integracji. Otwarte, poza zakresem: (b) tech-discovery B2; (e) szczescie 2b.

RUNDY: 3/5 (r1 Operator, r2 Obrona, r3 Final Control). Brak wymaganej kolejnej rundy.
NASTĘPNY KROK: integracja orkiestratora (merge kandydata; wskazany integration_sha zawiera c1668bf77 jako przodka); decyzja właściciela ws. 2b; osobny temat src dla B2.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Uruchomienie newgame-menu-reorder-layout-test nadpisuje 9 PNG w dyspozycje/autobot/runs/R-WEB-NEWGAME-MENU-REORDER-Q1/evidence — przed commitem/integracją sprawdź `git status` i przywróć (`git checkout -- <katalog>`).
- Do sprzątania: gra/node_modules (npm ci, nieśledzone) w tym worktree; logi /tmp/fcB-*.log; /tmp/civ-recruitment-compact-row-*.
- B2 tech-discovery: odznaki tdn-badge w techDiscoveryNotice.ts (~325-333) przecinają elipsę gruntu o 7px (limit 4px) — kandydat na osobny temat R-WEB-UI-*.
