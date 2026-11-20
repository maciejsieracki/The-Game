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

## 6. Przez kreator na żywo (hak `window.__settingsLive`, ?civTest=1) — STAN R1

Hak dodany w `gra/src/main.ts` (blok civTest, obok `__econRebalanceMeasure`): `startNewGame` (realny `doStartGame`),
`getSettings`, `unitCosts`, `improvementWorkCost`, `convertFoodToTax` (realne `convertFoodReserveToTax` + `resolveFoodTaxRate`),
`saveRoundTrip` (realne `persistSaveToSlot` + `loadGameFromSlot` w tej samej stronie). `tsc --noEmit` exit 0.

| Pozycja | Surowe liczby z gry (live) | Zgodne z decyzją właściciela |
|---|---|---|
| Koszty jednostek Niski/Normalny/Wysoki × Kamień/Brąz/Żelazo | NIE ZMIERZONO (testy `verify-live-*` nie rozszerzone w R1) | NIE ZMIERZONO |
| Wzrost surowców WŁ./WYŁ. | NIE ZMIERZONO | NIE ZMIERZONO |
| Dyplomacja i wojna Łatwa/Normalna/Trudna | NIE ZMIERZONO | NIE ZMIERZONO |
| Zamiana Żywność→Podatek (rezerwa 100, kurs 0,2) | NIE ZMIERZONO (hak gotowy, brak uruchomienia) | NIE ZMIERZONO |
| Koszt ulepszenia wg epoki właściciela | NIE ZMIERZONO | NIE ZMIERZONO |
| Round-trip zapisu (bez przeładowania) | NIE ZMIERZONO (hak gotowy; wynik SIGSEGV nie sprawdzony) | NIE ZMIERZONO |

Ograniczenia: utrzymanie w Pieniądzu nadal nie ma odczytu na żywo (`economy-upkeep.ts`, funkcja nieeksportowana);
`unitCosts` zwraca bazę i wartość po tempie oraz żywność/turę, ale nie wiąże pełnej ścieżki kosztu rekrutacji z UI.
`improvementWorkCost` przyjmuje bazę z danych jako argument (struktura `terrain-improvements.json` nie została zmapowana).

## ZNALEZISKA (NIE naprawiano w tym temacie)

- Z-1 (BLOKADA odczytu): brak odczytu w grze dla punktów 3, 4 i 5. Wymagany minimalny hak do osobnego tematu (`window.__civTest`, tylko `?civTest=1`). Pliki: `gra/src/main.ts` (wiring ustawień: applyMenuParams ok. linia 49760–49762; wczytanie ok. linia 51671–51675).
- Z-2: harness nie uruchamia kreatora ani tury. Wynik dotyczy funkcji modułów, nie pełnego przebiegu gry.
- Z-3: PRZYJĘTE i POPRAWIONE w R-WEB-VERIFY-LIVE-B-SETTINGS-LIVE-Q1 (obrona, runda 2): kurs ma źródło w danych `gra/data/econ-params.json` → `budynki.targowisko_zywnosc_na_podatek_kurs` (easy/normal/hard = 0,2; `gra/src/game/empire-food.ts:1173` `resolveFoodTaxRate`, użycie `gra/src/main.ts:29812-29817`). Test czyta kurs przez bundle (`ECON` w harnessie + `FOOD.resolveFoodTaxRate`) i porównuje z plikiem; stała RATE usunięta.
- Z-4: utrzymanie jednostek w Pieniądzu (economy-upkeep.ts, funkcja prywatna ok. linii 899) nie jest mierzone.
