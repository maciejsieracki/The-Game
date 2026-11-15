STATUS: PASS-WITH-NOTES (obrona r1; kod poprawiony, bramka wizualna Chromium NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-TAX-SPLIT-30-60-10-Q1
GOAL: nowa gra i nowe miasta startuja z podzialem podatkow Skarb 30 / Nauka 60 / Zamoznosc 10; stare zapisy i AI bez zmiany zachowania.
ZMIANY-COMMIT: baza c513bd0574bc8fa9bafcbf80ed29101045b10d66 (fe802bb61). Commit obrony: adb46eb7b (kod, docs, test, wikiBundle). Ten plik raportu jest w commicie nastepnym (SHA w polu sha zwrotki).

ODPOWIEDZI NA ZARZUTY EVALUATORA (c0690d31d):

Zarzut 1 (cityPanel.ts DEFAULT_PODZIAL_HANDLU 60/20/20) -- PRZYJETY.
  Poprawka: cityPanel.ts ok. l.1091-1099 = 30/60/10, komentarz zaktualizowany. Test: default-tax-split-test sekcja 9 (brak starego literalu, fallback = 30/60/10). Mutacja (procentPieniadz 30 -> 60 w cityPanel) = 1 FAIL.
  Uwaga: cityPanel.ts jest poza literalna allowlista dispatchu. Uzasadnienie: ten sam wzorzec co empireDetailPanel (zahardkodowany fallback domyslnego podzialu), dispatch pkt 1-2.

Zarzut 2 (opisy starej wartosci domyslnej) -- PRZYJETY.
  Zmienione: zdanie "suwaki 60% skarbiec * 20% nauka * 20% zamoznosc" -> "30% / 60% / 10%" w PORADNIK 01, 04, 05, 07, 09, 10, 13, 14, 16 (wzory referencyjne); 03-pasek-zasobow.md (linia 30); SPIS-TRESCI (linia 1414, domyslnie 60%); analiza/02-EKONOMIA.md (linia 46, domyslnie 60%); 06-miasto-spoleczenstwo.md (tabele, przyklady Daniny 20 i 24, sekcja 'Domyslne wartosci nowego miasta'); main.ts komentarze procentNauka=20 -> 60.
  Sprzeczne zdanie w 06 (przesuniecie na 50/30/20 'bonus bez zmian' przy wzroscie zamoznosci 10 -> 20%) przepisane: bonus szczescia od zamoznosci rosnie.
  Nieaktualna uwaga w SPIS-TRESCI C.3.4 ('zdanie sprzed 2026-11-14, nie przeliczone') zastapiona zdaniem NIE_ZMIERZONO.
  W 08-ekonomia-imperium.md nie znaleziono zdania '50/30/20' (grep: brak trafien); zostaje zmiana z kandydata (stopka rev, wartosci 30/60/10).
  Wiki bundle: regeneracja wylacznie narzedziem node gra/tools/bundle-wiki-for-game.cjs.
  Swiadome pozostalosci historyczne: stopki rev w 06/08 (historia zmian), komentarze w cities.ts/ai.ts opisujace stary podzial, gra/tools/szczescie-zamoznosc-test.cjs (komentarze 'domyslne miasto 20% Zamoznosc'; test sam ustawia podzial, wynik 88 OK / 0 FAIL). Kosmetyka, bez wplywu na zachowanie.
  Poza literalna allowlista: docs/analiza/02-EKONOMIA.md i docs/PORADNIK-GRACZA/** (poza encyklopedia). Uzasadnienie: dispatch pkt 4 (poradnik wymieniajacy wartosc domyslna).

Zarzut 3 (brak weryfikacji Chromium) -- NIE_ZMIERZONO (czesciowo).
  Zrobione: vite build do katalogu poza repo (exit OK, built in 17.18 s); Chromium dostepny (/usr/bin/chromium).
  Nie zrobione: zrzut panelu imperium nowej gry. Przejscie menu nowej gry do panelu imperium nie zostalo doprowadzone w tej rundzie. Kryterium (6) pozostaje NIE_ZMIERZONO; zrzutu nie podaje, bo go nie ma.

Zarzut 4 (luki pokrycia):
  (a) migrateHandelSplitOnLoad przy niepustym savedDefaults, wlasciciel bez wpisu -- PRZYJETY. Znaleziony blad: koncowa petla dawala DEFAULT (30/60/10) zamiast dawnego podzialu. Zmienione na LEGACY (empire-handel-split.ts, koniec migrate). Zachowanie wczytanych zapisow i AI jak przed zmiana (przed zmiana DEFAULT byl 20/60/20). Test sekcja 10 (AI bez wpisu -> 60/20/20). Mutacja (LEGACY -> DEFAULT) = 1 FAIL.
  (b) ensureCityPodzialDefaults (override bez podzialu) -- PRZYJETY. Znaleziony blad: po wczytaniu starego zapisu z override bez podzialu miasto dostawalo nowy domyslny 30/60/10. Zmienione na LEGACY (cities.ts, ensureCityPodzialDefaults). Test sekcja 11. Mutacja = 1 FAIL. Fallback LEGACY w society-breakdown.podzialLuksus: test sekcja 12 (asercja zrodlowa, bez importu DEFAULT_PODZIAL_HANDLU). Brak mutacji behawioralnej (funkcja prywatna): NIE_ZMIERZONO w zakresie mutacji.
  (c) wplyw 10% Zamoznosci na Szczescie nowych miast gracza -- ODRZUCAM jako zarzut kodu: to pomiar na zywo, nie regresja. Kandydat juz to opisuje jako NIE_ZMIERZONO (econ-params.json, docs). Bez zmian w kodzie.
  (d) komentarze main.ts 'procentNauka=20' -- PRZYJETY, zmienione na 60.

TESTY (surowe wyniki tej rundy, katalog worktree):
  - node gra/tools/default-tax-split-test.cjs: 28 pass, 0 fail (kandydat: 23/0; dodane sekcje 9-12).
  - Mutacje (przywrocenie starej wartosci, po jednej; potem przywrocenie plikow): M1 migrate -> DEFAULT: FAIL 'stary zapis: AI bez wpisu ... got 30/60/10'; M2 ensureCityPodzialDefaults -> DEFAULT: FAIL 'got 30/60/10'; M3 cityPanel procentPieniadz 60: FAIL 'fallback DEFAULT_PODZIAL_HANDLU = 30/60/10'. Pliki przywrocone; commit adb46eb7b zawiera wersje poprawna.
  - npx tsc --noEmit (gra/): exit 0, bez wyjscia.
  - logic-test: 213 PASS, 0 FAIL (exit 0).
  - tech-tree-test: 20 pass, 0 fail (wynik ewaluatora; w tej rundzie nie powtarzany).
  - research-test: PASSED 33 / FAILED 0 / TOTAL 33 (wynik ewaluatora; nie powtarzany).
  - unit-replace-test: 21 linii [OK], 0 FAIL, exit 0.
  - combat-test: COMBAT TEST 6/6 pass (wynik ewaluatora; nie powtarzany).
  - ai-nauka-podzial-tura1-seed-test: 8 passed, 0 failed.
  - szczescie-zamoznosc-test: 88 OK, 0 FAIL.
  - ai-player-parity-fixes-test: 43 passed, 1 failed (ten sam wynik co baza wg ewaluatora: dlug bazowy, nie regresja).
  - hotseat-ustawienia-kopiowane-test: NIE uruchomiony w tej rundzie (u ewaluatora timeout Playwright). NIE_ZMIERZONO.
  - vite build (poza repo, katalog scratchpad): OK.
  - npm ci --ignore-scripts w gra/ (node_modules ignorowane przez git); usuniete po rundzie.

BLOKADY:
  - Zrzut Chromium panelu imperium nowej gry (kryterium 6): NIE_ZMIERZONO.
  - Pomiar wplywu 10% Zamoznosci na Szczescie: NIE_ZMIERZONO.
  - hotseat-ustawienia-kopiowane-test: NIE_ZMIERZONO.
  - Dlug Rust (REPIN domyslnego podzialu): odnotowany w dispatchu, nie wykonany w tej rundzie.

UWAGI-DLA-ORKIESTRATORA (poza zakresem; bez tworzenia sesji):
  - Stare komentarze/testy 'domyslne 20% Zamoznosc' (szczescie-zamoznosc-test.cjs, ai-nauka-podzial-tura1-seed-test.cjs): kosmetyka.
  - origin/main poszedl dalej (ewaluator: d64cd5d46): integracja wymaga merge/rebase kandydata po Final Control; nie wykonywane w tej roli.

RUNDY: 1/5 (obrona r1)
NASTEPNY KROK: Evaluator r2 na adb46eb7b (zarzuty 1-4 odpowiedziane); Final Control po PASS; zamkniecie kryterium 6 zrzutem Chromium albo jawne NIE_ZMIERZONO w raporcie FC.
DEPLOY/PUSH: NIE WYKONANO
