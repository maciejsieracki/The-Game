# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora 014750a1a)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327)
GOAL: (1) panel Państwa pokazuje administratora państwa i jego stan; (2) w tekstach gracza tylko „administrator państwa” (ulepszenia, całe Państwo) i „administrator miasta” (budynki w mieście), bez starej nazwy i bez mieszania zakresów.
BAZA: kandydat ac7e54c21 (baza 2c6b0d33a). Kod tej rundy: 0bb452066 (main.ts, 2 linie napisów).

## ZMIANY/COMMIT
- 0bb452066 — gra/src/main.ts: powiadomienie migracyjne (subtitle ok. 47871) i podpowiedź (ok. 47876): zakres państwa „jeden na całe Państwo”, liczba miast tylko jako „wstrzymane dla: N miast”. Tylko napisy.
- Pozostałe zmiany (z ac7e54c21) bez zmian w tej rundzie.
- `git diff --check`: czysto. `git diff --stat HEAD~1 HEAD`: 1 plik, 2 wstawienia, 2 usunięcia.

## ODPOWIEDZI NA ZARZUTY
Z1 (wikiBundle.json:1 — stara nazwa 10×; kryterium 0 trafień w wiki) — NIE PRZYJMUJĘ poprawki w allowliście; ZGŁASZAM BLOKADĘ DO DECYZJI ORKIESTRATORA.
  Dowód: `gra/src/data/wikiBundle.json` jest generowany z `docs/encyklopedia/` (pojęcie `docs/encyklopedia/pojecia/administrator-ulepszen.md`: tytuł „Administrator ulepszeń” w linii 1, 6, 15, 21, 23, 27). Ręczna edycja bundla jest zakazana przez DODATEK, a regeneracja ze źródła odtworzyłaby starą nazwę. Źródło docs/encyklopedia NIE jest na allowliście DODATKU.
  Wymagana decyzja: (a) rozszerzyć allowlistę o `docs/encyklopedia/pojecia/administrator-ulepszen.md` (+ ewentualnie `docs/encyklopedia/indeks.md`) i zregenerować bundle skryptem, albo (b) przyjąć dług i wyłączyć wiki z kryterium (wtedy test wymaga zmiany — NIE wykonuję tego sam). Do tego czasu `admin-panstwo-panel-names-test` = 23 pass / 1 fail (ten jeden FAIL to wiki).

Z2 (main.ts:47871 — „w miastach z działającym administratorem państwa (N miast bez niego)”, mieszanie zakresów) — PRZYJMUJĘ, NAPRAWIONE w 0bb452066.
  Nowy tekst: „Automatyczne ulepszanie terenu działa teraz tylko przy działającym administratorze państwa (jeden na całe Państwo). Wstrzymane dla: N miast.” Podpowiedź: „…tylko przy administratorze państwa — wstrzymane dla: N miast (patrz „Ważne”)”.
  Uwaga: test names nie wykrywa tej klasy błędu (skan szuka tylko starej frazy); nie dodawałem asercji, bo `bez niego` występuje w main.ts 7× w innych kontekstach (fałszywe trafienia).

Z3 (gra/data/ui-params.json:311 — „administratorów miast i ulepszeń”) — PRZYJMUJĘ jako fakt; NIE NAPRAWIONE: plik poza allowlistą DODATKU (allowlista JSON obejmuje tylko `city-administrator-params.json`, pola opis_gracza).
  Proponowana zmiana do zatwierdzenia przez orkiestratora (jedna linia, tylko napis): w `gra/data/ui-params.json:311` fraza „Możesz zatrudniać administratorów miast i ulepszeń (koszt ze skarbca państwa)” → „Możesz zatrudniać administratora państwa i administratorów miast (koszt ze skarbca państwa)”. Zakres: administrator państwa jeden na Państwo, miasta osobno — zgodnie z ZASADĄ ZAKRESU.
  Wymagana decyzja: rozszerzyć allowlistę o `gra/data/ui-params.json` albo wskazać inny sposób.

Z4 (osłabienie asercji A2 i [data] w administrator-panel-real-render-test) — ODRZUCAM przywrócenie starej asercji; PRZYJMUJĘ obserwację co do wartości dowodowej.
  Dowód: stara asercja `r.lead.includes(PARAMS.administrator_ulepszen.opis_gracza)` nie może przejść po zmianie zakresu, bo JSON `administrator_ulepszen.opis_gracza` (city-administrator-params.json:27, już poprawiony w r2) jest także używany jako opis w Civpedii/tooltipie, a lead panelu dla państwa jest świadomie zapisany w `gra/src/ui/administratorPanel.ts` (funkcja `lead`, gałąź państwa) — decyzja zakresu z r1. Model panelu nie ma pola `description` (grep `description` w administratorPanel.ts: 0 trafień), więc podpięcie JSON wymagałoby zmiany modelu poza zakresem tego tematu.
  Dowód data-driven pozostaje: [data] sprawdza liczby 77 i 9 z podmienionego JSON (koszt/utrzymanie) oraz −14% z efektów bazowych; A2 sprawdza „jedna osoba na całe Państwo”, „dla wszystkich miast Państwa” i brak „w tym mieście”.

Z5 (5 plików testowych poza allowlistą: admin-panstwo-city-gate-test, administrators-wizard-test, improvement-administrator-test, live-verify-administrator-panel, live-verify-improvement-administrator) — PRZYJMUJĘ jako fakt; zmiany to etykiety i asercje na napisy (zmiana nazw z DODATKU), bez zmian progów. NIE_ZMIERZONO, czy bez nich testy czerwieniłyby się — nie sprawdzałem tej gałęzi. Wymagana akceptacja orkiestratora (rozszerzenie allowlisty testów).

Z6 (informacyjnie: komentarze ze starą nazwą, klucz JSON administrator_ulepszen) — PRZYJMUJĘ jako informację; bez zmian (komentarze i klucze nie są tekstem gracza; klucz JSON `administrator_ulepszen` jest wpisany w kod i testy).

## TESTY (surowe wyjście, na 0bb452066)
- `npx tsc --noEmit`: exit 0.
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test: `COMBAT TEST: 6/6 pass`, exit 0.
- admin-panstwo-panel-names-test: `23 pass, 1 fail` (exit 1). Jedyny FAIL: trafienie starej nazwy w `src/data/wikiBundle.json:1` (Z1, blokada decyzji). Mutacje realne (cityPanel, buildModeHud, wiring hud/main) — ok.
- admin-panstwo-city-gate-test: `RESULT: 36 passed, 0 failed`, exit 0.
- improvement-administrator-test: `59 passed, 0 failed`, exit 0.
- administrators-wizard-test: `58 passed, 0 failed`, exit 0.
- administrator-panel-real-render-test (Chromium): `48 PASS / 0 FAIL`, exit 0.
- NIE_ZMIERZONO: dwa pozostałe testy przeglądarkowe z DODATKU (tooltip, icon-everywhere) — nie uruchamiane w tej rundzie; live-verify-* — wymagają żywej gry.
- Mutacja starej nazwy w pliku: pokryta przez names-test (sekcja 3), potwierdzona w tej rundzie (`mutacja realna ... wykrywana` ok).

## BLOKADY
1. Z1: wikiBundle.json — źródło w docs/encyklopedia poza allowlistą. Wymaga decyzji (rozszerzyć allowlistę i regenerować, albo przyjąć dług).
2. Z3: gra/data/ui-params.json:311 poza allowlistą. Wymaga decyzji (propozycja zmiany w obronie).
3. Z5: akceptacja 5 plików testowych poza allowlistą.

## RUNDY
Runda 3/5 (obrona). Poprzednie: r1 (a0c19494a), r2 (ac7e54c21 / 11f9d198b).

## NASTĘPNY KROK
Orkiestrator: decyzja o rozszerzeniu allowlisty dla Z1 (docs/encyklopedia + regeneracja wiki), Z3 (ui-params.json) i Z5 (testy). Po decyzji: Operator wprowadza wskazane zmiany; następnie Evaluator i Final Control.

## DEPLOY/PUSH
DEPLOY/PUSH: NIE WYKONANO
