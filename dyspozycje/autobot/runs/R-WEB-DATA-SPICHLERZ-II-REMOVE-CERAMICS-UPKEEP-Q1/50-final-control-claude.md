# R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1 — Final Control (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane, teksty kart, testy)
TEMAT: R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1
GOAL: Spichlerz II bez utrzymania 2 ceramiki; zużycie ceramiki 10 (Spichlerz I) / 20 (Spichlerz II) na miasto na turę; sól II 25; karty i testy spójne z danymi.
ZMIANY/COMMIT: kandydat 03f3fe6d53a3fa1c7a8bbcac75365982638e3314 (potomek bazy 10af8668 — `git merge-base --is-ancestor` = tak; 3 commity: ea56e572e, 24fdf1e53, 03f3fe6d5). Ten raport: osobny commit na 03f3fe6d5 (tylko ten plik). Do integracji: SHA commitu raportu (zawiera kod kandydata bez zmian).
Diff vs baza: 18 plików; kod gry = wyłącznie komentarze w building-resource-gate.ts; reszta dane/karty/dokumentacja/testy.

TESTY (surowe wyniki, własne uruchomienia na kandydacie):
- git diff --check 10af8668..kandydat: czysto. tsc --noEmit: exit 0.
- Bramki ref.: logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat OK; unit-power 6/0.
- building-upkeep-ceramics 645/0; spichlerz-drain-keys 56/0; spichlerz-drain-pipeline 33/0; r-wzrost-szczescie-dubel-wealth-ceramika 59/0.
- gen-building-cards-top5 --check OK; bundle-wiki-for-game: wikiBundle.json bez zmian po regeneracji (byte-identyczny).
- Czerwone, identyczne na bazie 10af8668 (zmierzone): building-upkeep-resources 47/1 (D10), card-resource-purpose 100/2 na bazie vs 101/2 na kandydacie ([B], [W]) — brak regresji.
- Mutacja (kryterium a/b): przywrócenie `utrzymanie_surowce {ceramika:2}` w spichlerz_ii + drain II=25 → ceramics 641/4 FAIL, drain-keys 37/19 FAIL, drain-pipeline 21/12 FAIL; po cofnięciu zielone.

ZARZUTY:
1. Brak zrzutu Chromium — ODDAL: zakaz build/dev w gra/ (dispatch); zawartość kart zweryfikowana na poziomie danych (generator --check, testy kart). NIE ZMIERZONO w przeglądarce; do potwierdzenia po deployu na ROBOCZĄ.
2. Karta Spichlerza I bez 10 ceramiki — ODDAL (naprawione w 24fdf1e53): top5 spichlerz zawiera „Spichlerz zużywa 10 ceramiki na turę”, CSV→generator zgodne.
3. Raport „exit 0” dla building-upkeep-resources — ODDAL: błąd raportu, wynik 47/1 (D10) jest długiem bazowym; pole `r:` Garncarstwa poprawione na 10/20.
4. Siedem plików poza literalną allowlistą — ODDAL/akceptacja: wynikają z wymogu DODATKU 1 (karty, testy, grep „25 ceram”); zmiany minimalne. Pozostałe „25” w repo dotyczą soli, nie ceramiki.
Żaden zarzut nie wymaga NAPRAW.

BILANS (odpowiedź na prośbę właściciela o epokę Kamienia i Brązu; arytmetyka z 10-operator-claude.md, zweryfikowana z danymi econ-params: Garncarnia baza 50/t; NIE ZMIERZONO w grze):
- Kamień: miasto ze Spichlerzem I 25→10 ceramiki/t; jedna Garncarnia (50/t) obsłuży 5 miast zamiast 2.
- Brąz: miasto z samym Spichlerzem II 27 (25+2)→20; z Akweduktem+Łaźnią+Portem 33→26; sól II 25 bez zmian. Spichlerz II nadal zużywa ceramikę (drain), zdjęto tylko utrzymanie 2.

BLOKADY: Chromium NIE ZMIERZONO; reszta bramek referencyjnych (mapa, mgła, AI stawia budynki, kontrakt karty) nie ponawiana — brak zmian kodu poza komentarzami.
RUNDY: 2/5.
NASTĘPNY KROK: integracja orkiestratora (FF/merge), deploy ROBOCZA, zrzut karty Spichlerza I/II w Chromium po wdrożeniu, REPIN Rust parametrów drain; długi D10/[B]/[W] osobnymi tematami.
UWAGI-DLA-ORKIESTRATORA: dług bazowy D10 (building-upkeep-resources), [B]/[W] (card-resource-purpose).
DEPLOY/PUSH: NIE WYKONANO
