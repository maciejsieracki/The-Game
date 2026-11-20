# Weryfikacja na żywo (Chromium) ustawień gry — 2026-11-20

Temat: R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1 · baza kodu: origin/main 7cf57083929dc8ca2c5f23d8b97e77271e641588 · kod gry NIE zmieniany.

## Metoda (i jej ograniczenie)

Pięć testów `gra/tools/verify-live-*-test.cjs` (Playwright, Chromium `/usr/bin/google-chrome`) otwiera **harness pomiarowy** zbudowany z PRAWDZIWYCH modułów gry (`gra/src/game/*.ts`, dane z `gra/data/*.json`) poza repo (`scratchpad/verify-live`, `vite build`). Harness wystawia funkcje na `window.__vl`. Oczekiwania liczy Node z plików `gra/data` w repo.

NIE ZMIERZONO: pełnej gry przez kreator/UI (nowa gra → ustawienie → tura → odczyt z `main.ts`). Brak w `main.ts` istniejącego haka odczytu dla kosztów rekrutacji, utrzymania, żywności→podatku i kosztu budowy; zgodnie z dispatchem nie dodawano haków do `main.ts`. Minimalny hak do osobnego tematu: eksport `window.__civTest` o odczyt `unitRecruitBaseMoneyCost`, `unitFoodCardValue`, `convertFoodReserveToTax` z aktualnego stanu gry.

Mutacje: dla testów 1, 2, 3 i 5 jeden plik JSON w bundlu (kopia poza repo) został zmieniony i test CZERWIENIE (wynik poniżej). Test 4 nie ma pliku danych dla kursu — NIE ZMIERZONO.

## 1. Dyplomacja i wojna (Łatwa / Normalna / Trudna) — `verify-live-diplo-war-level-test.cjs`

| Parametr (gra/data/diplomacy.json, params) | Łatwa ×1 | Normalna ×2 | Trudna ×3 | Rodzaj |
|---|---|---|---|---|
| zdrada_zaufanie | -50 | -100 | -150 | kara |
| zlamanaPaktGracz_zaufanie | -40 | -80 | -120 | kara |
| handel_zaufanie_perTura | 1 | 0,5 | 0,333 | bonus ÷k |
| progSojuszPremiaSilniejszyMax | 0,25 | 0,125 | 0,083 | bonus ÷k |

- Wszystkie kary i bonusy z list `DIPLO_WAR_PENALTY_KEYS` / `DIPLO_WAR_BONUS_KEYS` zgodne z `base×k` / `base÷k` (asercje liczbowe, zielone).
- Round-trip wyboru Trudna przez serializację zapisu: `trudna` → `trudna`. Stary zapis bez pola → `latwa`. Zła wartość → `latwa`.
- NIE ZMIERZONO: wczytanie z localStorage po przeładowaniu strony (crash Chrome, CHROMEHELPER).
- Mutacja (`zdrada_zaufanie` +10 w bundlu): CZERWONA (`kara zdrada_zaufanie latwa: -40 != -50`).

## 2. Wzrost surowców z epoką WŁ./WYŁ. — `verify-live-growth-toggle-test.cjs`

| Wartość (surowy odczyt Kamień / Brąz / Żelazo) | WYŁ. (domyślnie) | WŁ. |
|---|---|---|
| Plon ulepszenia zywnosc (farma, base 2) | 2 / 2 / 2 | 2 / 3 / 4 |
| Plon ulepszenia praca (base 2) | 2 / 2 / 2 | 2 / 3 / 4 |
| Produkcja surowca kopalni (base 20) | 20 / 20 / 20 | 20 / 30 / 45 |

- Domyślne ustawienie: `getWzrostSurowcowZEpoka()` = false (WYŁ.), zgodne z dispatchem.
- Mutacja (`przychodyUlepszenStałeEpoka1` = false): CZERWONA (`WYL: plony ulepszen stale`).
- NIE ZMIERZONO: round-trip zapisu tego ustawienia (tylko funkcja normalizacji `normalizeWzrostSurowcowZEpoka`).

## 3. Koszty jednostek Niski ×1 / Normalny ×2 / Wysoki ×4 — `verify-live-unit-cost-pace-test.cjs`

Rekrutacja (Pieniądz) — baza przed ulgami cywilizacji i trudnością; tempo na końcu:

| Jednostka (epoka) | Baza | Niski ×1 | Normalny ×2 | Wysoki ×4 |
|---|---|---|---|---|
| Wojownik (Kamień) | 5 | 5 | 10 | 20 |
| Procarz (Brąz) | 16 | 16 | 32 | 64 |
| Konnica (Żelazo) | 176 | 176 | 352 | 704 |

Zywnosc jednostki (żywność/turę, po R_STAWKI ×4 i geometrii ×4 na epokę):

| Jednostka | Niski | Normalny | Wysoki |
|---|---|---|---|
| Wojownik (Kamień) | 4 | 8 | 16 |
| Procarz (Brąz) | 16 | 32 | 64 |
| Konnica (Żelazo) | 64 | 128 | 256 |

- Zgodne z oczekiwaniem 4/16/64 (Niski) i tempem ×1/×2/×4.
- Mutacja (koszt Procarza +7 w bundlu): CZERWONA (`baza rekrutacji Braz`).
- NIE ZMIERZONO: utrzymanie w Pieniądzu (funkcja w `economy-upkeep.ts` nie jest eksportowana) oraz pełna ścieżka z ulgami cywilizacji i trudnością.

## 4. Zamiana nadwyżki Żywności na Podatek (kurs 0,2) — `verify-live-food-to-tax-test.cjs`

| Rezerwa | Zadanie | Zjedzona żywność | Podatek | Zostaje |
|---|---|---|---|---|
| 100 | 100 | 100 | 20 | 0 |
| 100 | 30 | 30 | 6 | 70 |
| 100 | 33 | 33 | 6 (floor 6,6) | 67 |
| 100 | 100, wyłączone | 0 | 0 | 100 |
| 0 | 50 | 0 | 0 | 0 |

- Funkcja `convertFoodReserveToTax` (empire-food.ts:1116) zgodna z tabelą.
- NIE ZMIERZONO: przebieg tury w grze; kurs 0,2 podawany przez test (nie odczytany z danych).
- Mutacja: NIE ZMIERZONO (brak pliku danych dla kursu).

## 5. Koszt ulepszenia wg epoki WŁAŚCICIELA — `verify-live-improvement-cost-era-test.cjs`

Ta sama budowa (baza 10), epoka właściciela Kamień / Brąz / Żelazo:

| Flaga kosztu wg epoki właściciela | Kamień | Brąz | Żelazo |
|---|---|---|---|
| WŁ. (domyślnie, dane: true) | 10 | 20 | 40 |
| WYŁ. | 10 | 10 | 10 |

Kopalnia rudy (pierwszy wiersz z `koszt_praca_przed_x2` w terrain-improvements.json): koszt_praca WŁ. = 44, WYŁ. (koszt_praca_przed_x2) = 22; 44 = 2×22 w danych.

- Domyślna flaga zgodna z `improvement-cost-params.json` (true).
- Mutacja (flaga → false w bundlu): CZERWONA (`flaga kosztu wg epoki wlasciciela zgodna z danymi`).

## 6. Przez kreator na żywo (hak `window.__settingsLive`, ?civTest=1) — RUNDA 2 (obrona)

Metoda: prawdziwy build gry (esbuild, `gra/tools/test-hook-setcitylimit-live-bundle.cjs`, katalog poza repo), Chromium headless,
start przez REALNY `doStartGame` (hak `startNewGame(params)`, parametry jak w kreatorze). Liczby z surowego wyjścia
`gra/tools/verify-live-*-test.cjs` (uruchomienia 2026-11-20). Kolumna TAK/NIE porównuje z decyzją podaną w dispatchu
(tempo ×1/×2/×4; Wzrost WYŁ. domyślnie; Dyplomacja kara ×k, bonus ÷k; kurs 0,2).
Uwaga: sekcja „DECYZJE WŁAŚCICIELA" w `dyspozycje/autobot/KOLEJKA-WEB.md` nie występuje w tym worktree (grep: 0 trafień);
porównanie idzie więc do wartości z dispatchu i z `KOSZTY-JEDNOSTEK-STAN-2026-11-20.md`.

Hak `window.__settingsLive` (tylko `?civTest=1`): `startNewGame`, `getSettings`, `unitCosts` (rekrutacja, utrzymanie Pieniądz,
surowiec, żywność), `improvementWorkCost(id, owner)`, `diplomacyWarScale(wartość, kara|bonus)`, `convertFoodToTax`, `saveRoundTrip`.

### 6a. Koszty jednostek (właściciel 0, epoka startu Brąz) — surowe liczby z gry

| Pozycja | Niski ×1 | Normalny ×2 | Wysoki ×4 | Zgodne (TAK/NIE) |
|---|---|---|---|---|
| Wojownik (Kamień): rekrutacja Pieniądz | 5 | 10 | 20 | TAK |
| Wojownik: żywność/turę | 4 | 8 | 16 | TAK |
| Wojownik: utrzymanie Pieniądz/turę | 4 | 8 | 16 | TAK |
| Wojownik: surowiec/turę (drewno) | 3 | 6 | 12 | TAK |
| Procarz (Brąz): rekrutacja Pieniądz | 16 | 32 | 64 | TAK |
| Procarz: żywność/turę | 16 | 32 | 64 | TAK |
| Procarz: utrzymanie Pieniądz/turę | 8 | 16 | 32 | TAK |
| Procarz: surowiec/turę (drewno) | 10 | 20 | 40 | TAK |
| Konnica (Żelazo): rekrutacja Pieniądz | 176 | 352 | 704 | TAK |
| Konnica: żywność/turę | 64 | 128 | 256 | TAK |
| Konnica: utrzymanie Pieniądz/turę | 48 | 96 | 192 | TAK |
| Konnica: surowiec/turę (brąz) | 20 | 40 | 80 | TAK |

Utrzymanie Pieniądz = `Utrzymanie (Pieniądz/turę)` × mnożnik epoki (Kamień 1 / Brąz 2 / Żelazo 4) × 4 × tempo — zgodnie z
`buildUnitUpkeepTable` (`scaleCostByEpoch`). NIE ZMIERZONO: właściciel AI (hak bierze tempo gry dla każdego właściciela; tura AI nie była mierzona).

### 6b. Dyplomacja i wojna — realne skalowanie aktywnego poziomu (start w grze)

| Poziom | kara 10 → | bonus 12 → | Zgodne |
|---|---|---|---|
| Łatwa | 10 (×1) | 12 (÷1) | TAK |
| Normalna | 20 (×2) | 6 (÷2) | TAK |
| Trudna | 30 (×3) | 4 (÷3) | TAK |

NIE ZMIERZONO: efektywne kary w turze (hak nie wystawia silnika dyplomacji); wartości wyżej to funkcje skalowania.

### 6c. Wzrost surowców z epoką

- Start z domyślnymi parametrami: `wzrostSurowcowZEpoka = false` (WYŁ.) — TAK.
- Start z `true`: odczyt `true` — TAK (także w round-trip, 6f).
- Plon ulepszenia WŁ./WYŁ. na żywej grze: NIE ZMIERZONO (hak nie wystawia plonu). Wartości z harnessu (sekcja 2): WYŁ. 2/2/2, WŁ. 2/3/4.

### 6d. Koszt pracy ulepszenia wg epoki właściciela (właściciel 0 = Brąz)

| Ulepszenie (id) | koszt_praca (dane) | Gra (live) | Oczekiwane | Zgodne |
|---|---|---|---|---|
| farma (epoka 1) | 20 | 40 | 20 × 2 × 1 = 40 | TAK |
| kopalnia_miedzi (epoka 2) | 44 | 88 | 44 × 2 × 1 = 88 | TAK |
| kopalnia_zelaza (epoka 3) | 44 | 88 | 44 × 2 × 1 = 88 | TAK |

Flaga `kosztUlepszenWgEpokiWlasciciela` = true (dane). NIE ZMIERZONO: właściciel w Kamieniu lub Żelazie (start nie zmienia epoki właściciela w tych testach).

### 6e. Zamiana Żywność→Podatek

- Kurs z danych (`econ-params.json`, poziom Normalny) w grze: 0,2 — TAK.
- Bramka `ownerCanConvertWorkToTax` (wymaga miasta z Targowiskiem) w świeżej grze: zamknięta — `enabled=false`, zamiana 0 (`foodSpent=0`, `taxGained=0`) — TAK zgodne z `work-tax.ts`.
- Zamiana 100 → 20 w grze: NIE ZMIERZONO (wymaga zbudowanego Targowiska; hak nie buduje budynków). Wartości 100→20 i 30→6 są z harnessu (sekcja 4).

### 6f. Round-trip zapisu

- Start: Wzrost WŁ., Koszty jednostek Wysoki, Dyplomacja Trudna → `saveRoundTrip()`: `saved=true`, `before == after` — TAK.
- Odstępstwo (świadome, opisane w `main.ts` przy haku): zapis idzie do slotu testowego `civtest-settings-live-roundtrip` (localStorage, tylko `?civTest=1`), bo dispatch wymaga zapisu i wczytania.

### 6g. Wczytanie po przeładowaniu (zarzut Evaluatora 3)

- Procedura (jednorazowo): start → `saveRoundTrip()` → `page.reload()` → `saveRoundTrip()` (zapis i wczytanie w nowym procesie strony).
- Wynik: `saved=true`, brak `pageerror`, brak zdarzenia `crash`, kod wyjścia 0. Stderr: tylko `ERR_FILE_NOT_FOUND` dla zasobów (brak assetów w buildzie testowym), bez SIGSEGV.
- SIGSEGV NIE ODTWORZONO w tej sesji (1 próba, headless). Uwaga: nie testowano wczytania AKTYWNEJ gry z zapisu sprzed przeładowania; hak nie ma osobnej funkcji samego wczytania.

### Ograniczenia (NIE ZMIERZONO)

- Utrzymanie Pieniądz/surowiec jest czytane przez `unitUpkeep` / `totalUnitResourceUpkeep` z tego samego tempa co silnik; wzór na turę NIE został zmierzony przez turę.
- Efektywne kary dyplomacji w turze, plon Wzrostu, zamiana 100→20 w grze, koszt ulepszenia dla Kamienia/Żelaza jako właściciela — NIE ZMIERZONO na żywej grze.
- Mutacje dowodowe na żywej grze: NIE ZMIERZONO (mutacje działają na harnessie, sekcje 1–5).

## ZNALEZISKA (NIE naprawiano w tym temacie)

- Z-1 (BLOKADA odczytu): brak odczytu w grze dla punktów 3, 4 i 5. Wymagany minimalny hak do osobnego tematu (`window.__civTest`, tylko `?civTest=1`). Pliki: `gra/src/main.ts` (wiring ustawień: applyMenuParams ok. linia 49760–49762; wczytanie ok. linia 51671–51675).
- Z-2: harness nie uruchamia kreatora ani tury. Wynik dotyczy funkcji modułów, nie pełnego przebiegu gry.
- Z-3: PRZYJĘTE i POPRAWIONE w R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1 (obrona, runda 2): kurs ma źródło w danych `gra/data/econ-params.json` → `budynki.targowisko_zywnosc_na_podatek_kurs` (easy/normal/hard = 0,2; `gra/src/game/empire-food.ts:1173` `resolveFoodTaxRate`, użycie `gra/src/main.ts:29812-29817`). Test czyta kurs przez bundle (`ECON` w harnessie + `FOOD.resolveFoodTaxRate`) i porównuje z plikiem; stała RATE usunięta.
- Z-4: utrzymanie jednostek w Pieniądzu (economy-upkeep.ts, funkcja prywatna ok. linii 899) nie jest mierzone.
