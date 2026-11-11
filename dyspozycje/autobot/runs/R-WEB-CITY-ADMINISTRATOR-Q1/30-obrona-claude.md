STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-ADMINISTRATOR-Q1
GOAL: administrator miasta (max 1/miasto, 40 Pieniądza, utrzymanie 2/3/4 ze skarbca państwa, efekty ×tier, bramka autobudowy, UI, AI, zapis) — obrona kandydata cbbf15e25 przed zarzutami Evaluatora (fb543ef47).
ZMIANY/COMMIT: baza cbbf15e25833a40ab3c296da149d16100d6ea159; zmienione pliki (allowlista, bez WERSJE.md / gra-robocza / buildings / JSON danych):
- gra/src/main.ts (kolejka powiadomień administratora)
- gra/src/ui/cityPanel.ts (Bilans plonów z mnożnikami administratora)
- gra/tools/city-administrator-economy-test.cjs (NOWY, test behawioralny silnika)
- gra/tools/city-administrator-test.cjs (+5 asercji)
- gra/tools/corruption-reduction-palace-tribunal-test.cjs (T6 dokręcony z powrotem)
- ten raport. SHA końcowy: w polu sha wyniku (commit po zapisaniu raportu).

## Odpowiedzi na zarzuty

### Zarzut 1 — PRZYJMUJĘ (poprawka + dowód)
Okablowanie efektów w ticku i podglądzie było chronione tylko sondą tekstową (T6 poluzowany).
Poprawki:
1. NOWY test behawioralny `gra/tools/city-administrator-economy-test.cjs` na PRAWDZIWYM `advanceCityEconomy` i `previewCityEconomy` (2 właścicieli: owner 0 = gracz, owner 1 = AI; miasto regionalne z budynkiem tieru 1/2/3, ludność 80, Waluta odkryta). Sprawdza liczbowo: (a) działający administrator zmienia wynik miasta w ticku, (b) utrzymanie 2/3/4 w `upkeepByOwner.utrzymanieAdministratorow` i `utrzymanieRazem` rośnie dokładnie o to, (c) „nie pracuje" i administrator obcego właściciela = wynik identyczny jak bez administratora, (d) efekt w podglądzie HUD ≈ efekt w ticku (tolerancja ±1, bo bazy tick/podgląd różnią się żywnością/wzrostem, a Praca jest zaokrąglana), (e) podgląd widzi efekt, (f) parytet: ten sam test na owner 0 i owner 1. Wynik: 72/0.
2. T6 w `corruption-reduction-palace-tribunal-test.cjs` wrócił do szczelnej formy: regex wymaga dokładnie 2 wywołań `corruptionBuildingReduction(builtIds, administratorEfekty.korupcjaRedukcja)` (pominięcie administratora = FAIL). Wynik: 34/0 (liczba asercji bez zmian).
Dowód mutacyjny (skrypt zapisywał oryginał, mutował, uruchamiał, przywracał): mutacja M7 — usunięcie `administratorEfekty.korupcjaRedukcja` z JEDNEGO z dwóch wywołań w turn-economy.ts — dla wariantu „pierwsze wywołanie" (podgląd) i „ostatnie wywołanie" (tick) daje teraz `city-administrator-economy-test` exit 1 (np. `tier3 Pretorium owner 1: efekt administratora w podglądzie HUD ≈ w ticku (praca 23/24, brutto 17/19)` oraz `(… brutto 20/15)`), a T6 też czerwienieje (sonda). Przed poprawką: 112/0 zielone. Uwaga uczciwa: przy małej ludności (20) mutacja była niewidoczna przez zaokrąglenia do liczby całkowitej — dlatego fixture ma ludność 80.

### Zarzut 2 — PRZYJMUJĘ (poprawka)
Potwierdzone w kodzie: `refreshLiveEmpireRatesUnsafe` woła `refreshCityAdministrators(false)`, który zmieniał `adm.pracuje` bez powiadomienia, więc następne `refreshCityAdministrators(true)` na starcie ticku widziało `was` == nowy stan i zmiany nie zgłaszało. NIE uruchomiłem tego w grze (wnioskowane z kodu — jak w zarzucie).
Poprawka (`gra/src/main.ts`): `pendingAdministratorChanges` (Map miasto → zmiana). Każde odświeżenie (ciche też) akumuluje zmiany; `notify=true` opróżnia kolejkę do `noteAdministratorChange`. Przejście „nie pracuje" ↔ „wrócił" w jednej turze znosi się (brak fałszywego powiadomienia); `ended_*` zawsze wygrywa. Wczytanie zapisu czyści kolejkę przed i po `refreshCityAdministrators(false)` (stan zapisu jest punktem odniesienia). Dowód: 4 nowe asercje sondowe w `city-administrator-test.cjs` (akumulacja + flush przy notify, znoszenie, ciche odświeżenie w podglądzie HUD, czyszczenie przy wczytaniu). Ograniczenie: to sonda tekstowa — NIE_ZMIERZONO w realnej turze w Chromium.

### Zarzut 3 — ODRZUCAM jako błąd, ZGŁASZAM jako decyzję ABC dla właściciela
Dowód: `auto-build-gate.ts` — `isCityAutoBuildAllowed` zwraca true dla nie-człowieka; test „AI: bez bramki administratora" utrwala to odchylenie świadomie. Treść dispatchu mówi o autobudowie „w mieście" i o parytecie AI („AI zatrudnia, gdy stać i ma budynek administracyjny"), ale nie rozstrzyga, czy AI ma być zablokowane w autobudowie bez administratora. Nie zmieniam zachowania (to decyzja produktowa → ABC do właściciela, CLAUDE.md zasada 3). Założenie 1 z 10-operator-claude.md zostaje. Pytanie do właściciela: (A) AI bez bramki (obecnie; AI nie może zablokować samo siebie), (B) pełny parytet: AI buduje budynki dopiero z administratorem.

### Zarzut 4 — PRZYJMUJĘ (poprawka częściowa)
`cityPanel.ts` Bilans plonów: `base` kontekstu dostaje teraz `administratorProdukcjaMult` i `administratorPodatkiMult` z `administratorEffectsFor(city, built)` — TA SAMA funkcja co silnik, więc Praca +3% i ściągalność podatków +3% (× tier) nie rozjeżdżają panelu z HUD/tickiem. Sonda w `city-administrator-test.cjs`. Poza zakresem tej poprawki zostaje `strataFraction: 0` w panelu (korupcja w Bilansie plonów była pomijana już przed tematem — dług istniejący, nie wprowadzony przez administratora; bez dowodu NIE_ZMIERZONO, czy panel dalej rozjeżdża się z HUD w liczbach z korupcją). Liczbowego porównania panelu z HUD w Chromium NIE wykonano.

### Zarzut 5 — PRZYJMUJĘ CZĘŚCIOWO / ODRZUCAM CZĘŚCIOWO
- Ikona w powiadomieniach: BEZ zmian (litera „A" w `warEventLog.icon`; kolejka akceptuje tylko string/emoji, nie HTML SVG — ODRZUCAM jako ograniczenie mechanizmu, nie nowy framework, zgodnie z dispatchem „użyj istniejącego mechanizmu").
- Civpedia/wiki: ODRZUCAM dołożenie SVG — żadne hasło w `docs/encyklopedia/pojecia/*.md` nie zawiera obrazka/SVG (konwencja: sam tekst); sprawdzone grepem po `pojecia/*.md`. Hasło `administrator-miasta.md` opisuje stan z ikoną słownie.
- Lista kosztów utrzymania z ikoną: PRZYJMUJĘ jako dług, NIE implementuję w tej rundzie: administrator nie ma dziś ŻADNEGO wiersza w liście utrzymania (`utrzymanieAdministratorow` nie jest eksponowane do snapów HUD/empireDetail — sprawdzone grepem), więc ikona wymaga nowego pola w 3 snapach (hud.ts, cityPanel.ts, empireDetail) i main.ts (rozszerzenie zakresu poza obronę). Saldo skarbca uwzględnia utrzymanie (test behawioralny wyżej). Proponuję osobny temat.
- Zrzut tooltipa: natywny `title` nie renderuje się w headless Chromium — NIE_ZMIERZONO wizualnie; tekst tooltipu jest w JSON operatora (potwierdzone przez Evaluatora). Brak nowego zrzutu w tej rundzie (zmiany niewizualne: main.ts/cityPanel.ts logika bilansu).

### Zarzut 6 — ODRZUCAM jako wadę kodu, PRZYJMUJĘ jako NIE_ZMIERZONO
Round-trip zapisu w realnym Chromium NIE wykonany w tej rundzie. Argument strukturalny (nie dowód wykonania): pole `City.administrator` jest opcjonalne; `save.ts` przepuszcza miasta bez zmian (sonda w teście: `cities: Array.isArray(obj.cities) ? …`); stary zapis bez pola = brak administratora; migracyjny flag `cityAdministratorNoticeShown` czytany z `meta` (`=== true`, brak = pokaż raz). Dodatkowo w tej rundzie wczytanie czyści kolejkę powiadomień. Dla właściciela: do potwierdzenia live-verify zapisu (osobny krok orkiestratora).

### Zarzut 7 — częściowo PRZYJMUJĘ
(a) PRZYJMUJĘ — poluzowane regexy: T6 dokręcony (zarzut 1); regexy w `autobuild-toggle-test.cjs` (`isCityAutoBuildActive`) pozostają, bo są adaptacją do nowej funkcji i nadal wymagają tego samego miejsca wywołania; liczba asercji 40 bez zmian.
(b) ODRZUCAM jako błąd, to świadome założenie 2 operatora (zatrudnienie za ostatnie 40 → „nie pracuje" do następnej tury, bo utrzymanie liczone ze skarbca po wydatku); jeśli właściciel woli inaczej — decyzja ABC (np. wymagać 40 + utrzymanie przy zatrudnieniu). Dopisane do pytania ABC przy zarzucie 3.
(c) NIE_ZMIERZONO — pełna regresja ~1000 testów z tools/ i przebiegi Chromium nie powtarzane przeze mnie w tej rundzie; to samo ograniczenie co u Evaluatora.

## TESTY (liczby z surowego wyjścia, kandydat = cbbf15e25 + zmiany tej rundy)
- `node ./node_modules/typescript/bin/tsc --noEmit`: EXIT 0
- city-administrator-test: 117 passed, 0 failed (było 112; +5 asercji: zarzut 2 ×4, zarzut 4 ×1)
- city-administrator-economy-test (NOWY): 72 passed, 0 failed
- autobuild-toggle-test: 40 passed, 0 failed
- corruption-reduction-palace-tribunal-test: PASSED 34 / FAILED 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33 ALL GREEN
- unit-replace-test: 21/21
- combat-test: 6/6
- `git diff --check`: czysty. wikiBundle.json: bez zmian (nie ruszałem docs/encyklopedia).
- Mutacja M7 (oba warianty: podgląd i tick): wykrywana przez nowy test behawioralny (exit 1).

## BLOKADY
Brak twardych. Otwarte do decyzji/dowodu: (1) ABC zarzut 3 (AI bez bramki administratora vs pełny parytet) oraz opcjonalnie założenie 2 (zatrudnienie za ostatnie 40); (2) NIE_ZMIERZONO: Chromium round-trip zapisu, powiadomienia w realnej turze po poprawce zarzutu 2, panel Bilansu plonów vs HUD z korupcją, pełna regresja; (3) dług: wiersz „administratorzy" z ikoną w liście utrzymania (nowe pola snapów).

## RUNDY
Obrona po rundzie 1/5 (Operator r1 → Evaluator r1 → Obrona). Ta runda: poprawki zarzutów 1, 2, 4 (częściowo 5/7a); zarzuty 3, 5 (część), 6, 7b odrzucone z dowodem/uzasadnieniem.

## NASTĘPNY KROK
Final Control (ten sam ID) na SHA końcowym obrony; ABC do właściciela (zarzut 3); live-verify zapisu/powiadomień w Chromium po integracji; osobny temat na wiersz utrzymania administratorów z ikoną.

DEPLOY/PUSH: NIE WYKONANO
