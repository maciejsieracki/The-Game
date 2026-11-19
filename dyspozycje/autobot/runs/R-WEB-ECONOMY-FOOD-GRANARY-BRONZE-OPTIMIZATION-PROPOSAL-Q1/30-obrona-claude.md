# Obrona Operatora (runda 1, zarzuty Evaluatora ab6829c4)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1
GOAL: Analiza żywności/Spichlerza i skarbca/kosztów jednostek w Brązie z propozycjami wariantów i pytaniami ABC. Bez zmian w grze.
ZMIANY/COMMIT: kandydat 5c1ef2e8e; poprawki w tej rundzie w commicie zapisanym poniżej (`git add` tylko ścieżek allowlisty). Zmienione: `dyspozycje/analizy/ZYWNOSC-SPICHLERZ-BRAZ-OPTYMALIZACJA.md`, `dyspozycje/analizy/SKARBIEC-BRAZ-KOSZTY-JEDNOSTEK-OPTYMALIZACJA.md`, `gra/tools/food-granary-model.cjs`, ten plik.
TESTY:
- `node gra/tools/food-granary-model.cjs` → exit 0; cap 54000; flaga OFF brutto 2579, ON 2317.
- `node gra/tools/treasury-unit-cost-model.cjs` → exit 0.
- `npm ci --ignore-scripts` w gra/ → added 71 packages.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` (gra/) → exit 0, 0 linii wyjścia. Pełny typecheck, nie tylko dowód z braku zmian.
- Pomiar: odczyt 4 plików `/tmp/rebal-keep/*.jsonl` (149 linii każdy), tury 60/90/120, seed 4242 i 7.

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Dodano tabelę PRZED/PO z jsonl (food: spichlerz stan/max/rate, wpływ, AI spichlerz; tury 60/90/120; obie flagi; obie seedy). Zrzut 20 miast i cap 54 000 NIE są odtworzone przez biegi (1–10 miast, max 1000–3000).
2. PRZYJMUJĘ. Dodano F4 dla seed 4242/7: utrzymanie jednostek, jednostki, netto skarbca i wrażliwość +10/20/30%.
3. PRZYJMUJĘ (moja arytmetyka była błędna). Pasek to brutto (przed armią) → netto (po armii) z `empireDetailPanel.ts:1677-1690, 3267`. Różnica 313 ≈ wojsko 312. Hipoteza „flaga OFF” ODRZUCONA: OFF daje brutto 2579, nie 2267. Implikowane wyżywienie miast 1096 vs podsumowanie 1046 (różnica 50 NIE_ZMIERZONO). ABC 1 przeformułowane.
4. PRZYJMUJĘ częściowo. Dodano tabelę ulepszeń żywnościowych z `terrain-improvements.json` (Farma 3, Łodzie 6, Irygacja 5 itd.). Nie odtworzono 3363 (NIE_ZMIERZONO). Warianty −10/−20/−30%, psucie i konwersja są oznaczone jako NOWE klucze z proponowaną lokalizacją; grep potwierdził brak psucia i konwersji w `empire-food.ts` i `econ-era-rebalance.ts`. „Pomoc miastom” (`empire-food.ts:71`) to ujście na deficyt, nie eksport. UI: `empireDetailPanel.ts:3296-3300` nie tłumaczy nadwyżki.
5. PRZYJMUJĘ. Dodano: `unitUpkeep` `economy-upkeep.ts:1064-1082` (brak epoki); mnożnik ×4 z `r-stawki-strojenie.ts:6-12`; `utrzymanie_jednostka_standard` (`economy-upkeep.ts:611`). Wariant „stopnie według typu” oparty na `units.json`; klucze „Spearman/Swordsman/…” to pola „Bonus vs”, nie stopnie. Mnożnik od liczby jednostek NIE istnieje w kodzie (NOWY). Dowódca i prawo/ustrój: NIE_ZMIERZONO.
6. PRZYJMUJĘ z korektą. Sprzeczność 26 vs 32 jednostek wynikała z błędnego założenia, że każda jednostka je 12/t. Obóz je 0,5 bazy (`econ-params` `zywnosc_jednostka_oboz`). Mieszanka marsz/obóz (2a+b=52, a+b≥32) jest spójna. Skład NIE_ZMIERZONO.
7. PRZYJMUJĘ. V2 poprawione: cap po 25 turach pochodzi z produkcji −20%; samo psucie daje cap po 15 turach (kontrast).
8. PRZYJMUJĘ częściowo. `upkeepBalance` (`economy-upkeep.ts:1281-1296`) nie ma składnika Administratora. Administrator −2 wyjaśnia 2 z 43. Pozostałe 41 NIE_ZMIERZONO. Model używa 345 (saldo widoczne w panelu).
9. PRZYJMUJĘ. tsc wykonany (exit 0, 0 linii). `npm ci` zainstalowało zależności w gra/ (katalog ignorowany przez git; nie usunięty zgodnie z zakazem rm).

## Poza zarzutami (UWAGI-DLA-ORKIESTRATORA)
- Anomalia w jsonl: `spichlerzMax` gracza przy t120 wynosi 3000 w OFF i 1000 w ON dla tego samego seeda (10 miast). Przy ON mnożnik epoki powinien być większy. NIE_ZMIERZONO przyczyny; warto zbadać przed decyzją o fladze.
- W pomiarze ON zapas AI spada o ok. 60% przy t90 (74 113 → 28 530, s4242). Warte uwzględnienia przy decyzji o fladze.
- Netto skarbca w biegach jest ujemne (−7 do −111/t) przy obu flagach. Zrzut +345/t pochodzi z innego stanu.
- Nie zaplanowano żadnych zadań ani sesji.

## Pytania ABC (zaktualizowane)
Zob. sekcje „Pytania ABC” w obu dokumentach. Pierwsze pytanie: która flaga obowiązuje w zrzucie żywności (ON, rekomendacja, po odtworzeniu) i czy korekta jednostek jest potrzebna przed pomiarem.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator (weryfikacja poprawek), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
