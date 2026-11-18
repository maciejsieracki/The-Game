STATUS: BLOCK (częściowy: ustalenie źródła HUD wykonane; hak, narzędzia, bramki i bieg dymny NIE wykonane)
DOMAIN: GAME (pomiar, bez zmian logiki i balansu)
TEMAT: R-WEB-ECONOMY-MEASURE-EXTEND-INCOME-STOCKS-Q1
GOAL: wyjaśnić różnicę ~10× między modelem (econ-growth-model) a HUD „Surowce +X / +Y”; rozszerzyć hak odczytowy; narzędzie pomiaru.
ZMIANY-COMMIT: tylko ten raport. Kodu gry nie zmieniano.

ŹRÓDŁO HUD (zmierzone z kodu, baza 198e63685):
- Surowce: gra/src/main.ts:23862-23872. Składniki = `shortageRows` = `buildEmpireResourceRows(0)` (main.ts:3978) po filtrze `cap != null && !placeholder` (dla gracza: `storedResourceRows`). Czyli suma po WSZYSTKICH magazynowanych surowcach imperium, nie tylko cegła+żelazo+ceramika jak w modelu. Żywność jest osobnym chipem Spichlerz.
- Brutto na surowiec = produkcja + przychód z umów; netto = ratePerTurn − usage (obywatele+budynki+wojsko): gra/src/game/resource-gross-net.ts:1-60. Jednostka: sztuki na turę, zaokrąglone, nie PN.
- Wyświetlenie: gra/src/ui/hud.ts:1255-1256 i 1366-1369 (suma „sztuk na turę”).
- Skarbiec/Praca/Nauka/Handel/Spichlerz: hud.ts ~1350-1372 (pracaPrognoza, zywnoscWplywMiast, handelIncome, naukaRate); źródła zbiorcze w main.ts ~24040-24060. Wartości per pole NIE zweryfikowane liczbowo.

WNIOSEK (z kodu, nie z liczb): różnica ~10× jest prawdopodobnie strukturalna. HUD sumuje wszystkie surowce magazynowane, a model liczy 3. Liczbowe potwierdzenie: NIE_ZMIERZONE (wymaga biegu z hakiem).

HAK (__aiEconomyMeasure.metrics, main.ts:33401): NIE rozszerzono. Brak pól per typ surowca, budynków per typ, cap, epoki i liczby miast.

NIE WYKONANO:
1. Hak odczytowy o pola HUD (punkt 2 dispatchu).
2. Hak suppressDefeatForTest (DODATEK A1): nie napisano. Przyczyna stallu (0 miast gracza) wg dispatchu, nieweryfikowana tutaj.
3. gra/tools/econ-measure-run.cjs i econ-measure-analyze.cjs: nie powstały.
4. Bramki (tsc, logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-economy-measure-hook-test 20): NIE uruchomiono (brak npm ci w gra/).
5. Bieg dymny ≤10 tur: NIE wykonano.
6. Punkt B (cuda, jednostki, utrzymanie, żywność, praca): NIE wykonano.
7. Seed 1234 t18: NIE sprawdzono.

BLOKADY: zakres tematu przekracza jedną rundę Operatora (npm ci, Chromium, kilka modułów gry).
RUNDY: 1/5 (ostatni werdykt: brak; decyzja właściciela: nie wymagana)
NASTĘPNY KROK: runda 2 — hak odczytowy z tych samych funkcji co HUD (buildEmpireResourceRows, resourceGrossNetPerTurn, empireEpochForOwner), hak suppressDefeat, narzędzia, bramki, dym 10 tur.
DEPLOY/PUSH: NIE WYKONANO
