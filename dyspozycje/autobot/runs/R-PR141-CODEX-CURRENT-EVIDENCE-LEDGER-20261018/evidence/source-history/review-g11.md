# Niezależny przegląd G11 — 2026-10-17

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
GOAL: Zniżka werbunkowa Zulusów wyłącznie dla Impi; addytywne dozwolone rabaty, jeden floor/min1 przed tempem/trudnością; bez uruchomienia niezatwierdzonego F04.
ZMIANY/COMMIT: review lokalnego współdzielonego drzewa; bez edycji produktu, commita, pushu i deployu.

## Ponumerowane zarzuty

Lista pusta. Nie znalazłem konkretnego defektu w ograniczonym zakresie G11.

## Dowody

- `gra/src/game/civ-bonuses.ts:310`: rzeczywisty adapter Zulusów oznacza `cel=Impi`; nie zmieniono raw values ani pól F04.
- `gra/src/game/production.ts:570`: historyczny wpis Impi i adapter macierzy wymagają tożsamości Impi; brak nazwy nie przyznaje tego rabatu. Obce jednostki (w tym Oszczepnik Zulu) nie dostają zniżki.
- Wszystkie cztery wywołania `unitMoneyCost` przekazują rzeczywistą nazwę definicji: `unitProductionItem`, `availableProduction`, `availableReplacementsFor`, `unitPurchaseCost`.
- Dozwolone dodatnie, skończone rabaty sumowane przed jednym floor/min1 w `unitMoneyCost`; dopiero potem tempo i trudność. Pola macierzowe inne niż `walka_koszt_rekrutacji_proc` wyłączone. `prod_koszt_jednostki_proc` pozostaje nieaktywne, więc reguła sumowania dwóch pól macierzy nie jest dowodem aktywacji F04.
- Sprawdzono rzeczywiste `gra/data/civs.json`: legacy Zulusów ma `realizuje=walka_wygaszone`, dlatego adapter macierzy nie dubluje tego rabatu. Osobny bundlowany test używający rzeczywistego civs.json + adaptera: cena bazowa 100 → Impi 90, Wojownik 100, Oszczepnik Zulu 100 (3/3 PASS).
- Rzeczywiste callbacki zakupu gracza i AI w main korzystają z tego samego `unitProductionItem` i bonusów ownera; zmiana nie dodaje serializowanego stanu.

## Uruchomione niezależnie

- `node gra/tools/impi-recruitment-discount-test.cjs`: 680 PASS.
- `node gra/tools/civ-bonusy-test.cjs`: 39 PASS.
- `node gra/tools/unit-epoch-cost-test.cjs`: 57 PASS.
- `node gra/tools/recruitment-cost-50-wood-test.cjs`: 190 PASS.
- Dodatkowy test rzeczywistych danych bonusów opisany wyżej: 3 PASS.

## Ograniczenia

To przegląd kodu i wykonanie testów z bundlowanymi funkcjami, nie pełny odbiór gameplay PR141 ani nowa próba runtime po run55. Nie uruchamiano pełnej gry, testu przetrwania zapisu ani klikanej płatności/zwrotu w przeglądarce. Brak nowego stanu do serializacji ogranicza ryzyko save/load, ale nie zastępuje pełnego odbioru. Testy ceny obejmują owner 0/1 i trudność/tempo; same nie dowodzą pełnej wieloosobowej rozgrywki. F04 nadal wymaga zatwierdzonych danych. Współdzielone hunki MP/F05 są poza ocenianym zakresem.

NASTĘPNY KROK: niezależna Final Control i jawne wskazanie granicy dowodów runtime.
DEPLOY/PUSH: NIE WYKONANO.
