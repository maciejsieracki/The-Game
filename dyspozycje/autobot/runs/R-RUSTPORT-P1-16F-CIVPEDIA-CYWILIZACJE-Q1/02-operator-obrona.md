STATUS: PASS-WITH-NOTES (etap Operatora, runda 2/5; wymaga Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1
GOAL: Pełny audyt 9 haseł CivPedii „Cywilizacje" wobec `gra/data/civ-matrix.json` na pinie edb8fb56 (bez „Strategii dla gracza", zamkniętej w P1.16d).
ZMIANY-COMMIT: Dopisano §7 (odpowiedzi na zarzuty, korekty statusów, podsumowanie, lista otwartych) do `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`. Brak commitu. `gra/**` nietknięte. `git diff --check` czysty.
TESTY: Brak testów runtime. Odczyty przez `git show`/`git grep` na edb8fb56. Kluczowe ustalenie: `civBonusyForOwnerId` (main.ts ok. l. 8208) = legacy `civs.json bonusy[]` + macierz. `excludedG1` wyklucza tylko wpisy macierzowe, więc poprzednie BLOCKED dla R-1, R-2, S-1, S-2, S-3, Gr-1, E-1, Ch-1 było błędne. 45 wierszy po scaleniach (E-2a/b, Gr-2/3, Z-2a/b; dodano Z-5).
BLOKADY: Brak twardych. Otwarte: mapowanie „na starciu” = runda szarży (C-1, G-3); konwencja znaku `walka_koszt_rekrutacji_proc`; zakres stron S-4; brak testu runtime.
RUNDY: 2/5

OBRONA: 1 -> PRZYJMUJE. `applyWalkBonus` (civ-bonuses.ts ok. l. 181–215) stosuje legacy `walka` (R-1/R-2 REAL, E-1 ZGODNE atk, S-1/S-2/S-3 REAL, Gr-1 REAL warunek CZĘŚCIOWO, Ch-1 CZĘŚCIOWO atk REAL/zasięg BRAK).
OBRONA: 2 -> PRZYJMUJE. Wpisy `walka_wygaszone` pomijane przez `bonusApplies` l. 146. S-4 nie jest DEAD: wpis „Ciężkie rydwany… HP i obrony” trafia w gałąź `hp && obron` (+0.15 obrony). S-3 REAL.
OBRONA: 3 -> PRZYJMUJE. `unitMoneyCost` (production.ts ok. l. 535–546) → `civRecruitmentDiscount` (l. 565–575) zwraca 0.10 → koszt ×0.90. Z-2a = ZGODNE w skutku. Z-2b (`prod_koszt_jednostki_proc`) bez konsumenta, scalone. Konflikt konwencji znaku odnotowany.
OBRONA: 4 -> PRZYJMUJE. `buildingWorkCost` (production.ts ok. l. 516–521) → `civBuildingCostDiscount` (civ-bonuses.ts ok. l. 349–360), legacy `koszt_redukcja` miasto 0.20. R-3 ZGODNE w skutku (−20%); pole macierzy martwe.
OBRONA: 5 -> PRZYJMUJE. `mp_regen_proc` ma tylko wpisy metadanych i zbioru (semantic l. 112, 153). Realnie legacy `bonus_pobor_regen` 1.0 → `civManpowerRegenMult` (manpower.ts ok. l. 396–410) ×2. R-5 NIEZGODNE-WARTOŚĆ (+100% vs +35%).
OBRONA: 6 -> PRZYJMUJE. `DEFAULT_REGEN.regenProcMaxPerTurn = 2` (manpower.ts l. 63–66), `miasto-params.json` = 2, civs.json „standard 2%”; CivPedia Grecy/Rzymianie „standard 10%”. NIEZGODNE-TEKST.
OBRONA: 7 -> PRZYJMUJE. Konsument Gr-4 = legacy `bonus_pobor_regen` −0.15 (×0.85). Matrix `mp_regen_proc` bez konsumenta.
OBRONA: 8 -> PRZYJMUJE. `civEconomyYieldMultipliers` (economy.ts ok. l. 863–876) → turn-economy l. 2036/2612. Gr-2 REAL, zakres CZĘŚCIOWO (cały handel vs porty). I-1 ZGODNE REAL (legacy `bonus_nauka` wszystko). Gr-3 scalony z Gr-2.
OBRONA: 9 -> PRZYJMUJE (z wymiarem warunku). Germanie: macierz runda_szarzy 0.40 wymaga `isChargeRound` (bonusApplies l. 161); CivPedia +15% „na starciu”. G-3 NIEZGODNE: wartość 40 vs 15 oraz warunek.
OBRONA: 10 -> PRZYJMUJE. Scalone w E-2. `civMatrixBonusyForCivKey` (ok. l. 297–304) + `matchingMatrixSum` sumują 0.15 + 0.15 = +30% (`civMovementMultiplier` l. 328–330, battleScene l. 7183). `walka_ruch_rydwany` nie jest w żadnym zbiorze klasyfikatora; „UNWIRED” był fallthroughem.
OBRONA: 11 -> PRZYJMUJE. `prod_koszt_budynku_proc` i `prod_koszt_jednostki_proc` są w zbiorze HARMFUL (semantic l. 209–210). Poprawne: 0 konsumentów poza klasyfikatorem.
OBRONA: 12 -> PRZYJMUJE. Podsumowanie przeliczone w §7.3; Z-1 to LIVE-ROZBIEŻNOŚĆ.
OBRONA: 13 -> PRZYJMUJE. Wersja 2 podaje status z dowodem dla każdej pozycji (§7.2); niedokończone w §7.4.

NASTEPNY KROK: Evaluator (Haiku 5.5 medium), adwersarialna weryfikacja §7.2, zwłaszcza E-2 (+30%), Z-2 (znak), R-5/Gr-4 (baza 2% vs 10%) i Z-5.
DEPLOY/PUSH: NIE WYKONANO