STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-TRYBUNAL-CARD-HAPPINESS-DISPLAY-Q1
GOAL: Karta budynku Trybunał pokazuje efektywne Szczęście zgodne z silnikiem i z Top 5 (wyświetlanie, bez zmiany liczb w silniku/danych).
BAZA: origin/main fd8cc14a3 (FALA 562), runda 1/5, bez DODATKU.

## 1. DIAGNOZA (wykonana wywołaniem funkcji silnika, nie czytaniem danych)

Silnik: `economy.ts::buildingHappinessAtLevel` = ryczałt +1 (tylko `dajeSzczescie: true`) + `buildingValue(baza/przyrost.zadowolenie, L)`.
Poziom: `production.ts::buildingLevelForEpoch` (Trybunał: epokaWejscia 2, maksPoziom 2).

| Budynek | Epoka | Poziom | Silnik Szczęście | Surowe baza/przyrost.zadowolenie (dotąd na karcie) |
|---|---|---|---|---|
| trybunal | Brąz (2) | L1 | 2 | 1 |
| trybunal | Żelazo (3) | L2 | 3 | 2 |
| swiatynia | 3 | L2 | 4 | 3 |
| spichlerz | 1-3 | L1 | 5 | 4 |
| kamienne_kregi | 2 / 3 | L2 / L3 | 3 / 4 | 2 / 3 |
| targowisko | 1-3 | L1-L3 | 1 | 0 (wiersza nie było) |

Wniosek: ROZBIEŻNE było miejsce na karcie (sekcja „Plony i efekty”, wiersz „Zadowolenie” + „skala poziomów”), które pomijało ryczałt +1. Silnik i Top 5 Trybunału („+2 Szczęścia”, „W epoce Żelaza … +3 Szczęścia”) są ZGODNE z silnikiem. Nie zmieniano liczb silnika ani danych; brak DECISION_REQUIRED.

## 2. ZMIANY / COMMIT

Allowlista:
- `gra/src/ui/entityCards/buildingAdapter.ts` — zmieniony
- `gra/tools/trybunal-card-happiness-display-test.cjs` — nowy test regresji
- `dyspozycje/autobot/runs/R-WEB-TRYBUNAL-CARD-HAPPINESS-DISPLAY-Q1/01-operator-r1.md` — ten raport

Zmiana w `buildingAdapter.ts`:
- wiersz „Zadowolenie” w „Plony i efekty” dla budynków `dajeSzczescie: true` pokazuje wartość `buildingHappinessAtLevel(rekord, displayLevel)` (np. Trybunał L1: „+2 pkt/turę (ryczałt +1, zadowolenie +1)”), zamiast surowego `baza/przyrost`;
- skala „Zadowolenie — skala poziomów” liczona z silnika dla każdego poziomu (pokazywana tylko, gdy wartość zmienia się między poziomami);
- budynek bez Szczęścia (`dajeSzczescie` false) nie dostaje wiersza „Zadowolenie” (silnik daje 0);
- pozostałe wiersze (Praca/Pieniądz/…) bez zmian.

Commit: SHA podany w odpowiedzi orkiestratora (commit lokalny na gałęzi roboczej tego worktree; NIE pushowany).

## 3. TESTY

- `npm ci --ignore-scripts` w `gra/` (tylko instalacja zależności; nie `build`/`dev`).
- `tsc --noEmit` (gra/): exit 0, brak błędów.
- NOWY `gra/tools/trybunal-card-happiness-display-test.cjs` (Chromium/Playwright, realny adapter + renderer): PASS 128, FAIL 0.
  - [E] wartości silnika (Trybunał L1=2, L2=3; Świątynia 3; Spichlerz 5; Kamienne kręgi 2; Targowisko 1);
  - [K] dla WSZYSTKICH 19 budynków `dajeSzczescie: true` i każdego poziomu: wiersz „Zadowolenie” w DOM == silnik; skala poziomów == silnik;
  - [T] Trybunał: Top 5 „+2 Szczęścia” zgodne z wierszem karty L1;
  - [N] regres: Pieniądz Trybunału nadal +1; budynek bez Szczęścia bez wiersza;
  - [D] dane: brak budynku dajeSzczescie=false z niezerowym zadowolenie; konsola bez błędów JS.
- Weryfikacja, że test łapie błąd: na adapterze z HEAD (przed zmianą) test daje FAIL 51 (m.in. „+1 pkt/turę” vs silnik 2). Po przywróceniu poprawki PASS 128.
- Istniejące testy dotkniętych modułów:
  - building-happiness-test.cjs: 14 passed, 0 failed (EXIT 0)
  - plony-budynkow-test.cjs: 68 passed, 0 failed (EXIT 0)
  - building-cards-top5-test.cjs: 1179 pass, 0 fail (EXIT 0)
  - entity-card-historia-section-test.cjs: 36 pass, 0 fail (EXIT 0)
  - building-detail-card-entitycard-migration-test.cjs: 54 pass, 1 fail (EXIT 1) — FAIL „buildBuildingDetailCardViaEntityCard dopełnia sekcję Uwagi (playerFacingNote)”. Sprawdzany warunek dotyczy tekstu `cityPanel.ts`, którego ta zmiana NIE dotyka (`git diff` pusty; wzorzec nieobecny także w bazie). Znany stan poza allowlistą (kafelek hosta), nie regres tej zmiany.
- `git diff --check`: czysto.
- Zrzuty do obejrzenia: NIE_ZMIERZONO (test czyta DOM, nie robi zrzutu PNG).

## 4. POZA ZAKRESEM / NIE_ZMIERZONO

- `gra/src/ui/cityPanel.ts` ma własne formatery wierszy plonów (`formatBuildingYieldDetailValue`, ok. l.6584/7721/9325) — nadal pokazują surowe `baza/przyrost` dla zadowolenia. Nie zmieniano (poza allowlistą tematu, a wskazana karta idzie przez adapter). Czy te ścieżki są w grze aktywne — NIE_ZMIERZONO.
- Nazwa „Zadowolenie” na karcie została zachowana (silnik nazywa to Szczęściem); treść wiersza wyjaśnia „ryczałt +1, zadowolenie +N”.

## 5. BLOKADY

Brak.

## 6. RUNDY

1/5 (ostatnia werdykt: brak — runda Operatora, bez Evaluatora/FC).

## 7. NASTĘPNY KROK

Evaluator (Sonnet 5.5) → Obrona (jeśli FAIL) → Final Control (Sonnet 5.5) → integracja orkiestratora. Do sprawdzenia przez Evaluatora: czy przedstawiona rozbieżność to wyłącznie karta (tak wynika z testów), oraz decyzja, czy poprawić także cityPanel.ts (osobny temat).

## 8. DEPLOY/PUSH: NIE WYKONANO
