# R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1 — DODATEK orkiestratora (runda 1)

## Decyzje właściciela (2026-11-13) — dane wejściowe, nie do dyskusji
1. Siła militarna jest osobną miarą. NIE zmienia Power, Respektu, Zaufania ani etykiet relacji.
2. Składniki: (a) Armia, (b) Rekruci (pula rekrutów liczona RAZ, nie podwójnie), (c) wygrane bitwy TYLKO z bieżącej wojny tej pary (start od zera przy wybuchu wojny), (d) czasowy bonus z trybutu: +10% siły pobierającego przez 10 tur.
3. Gospodarka (miasta, technologie, kultura, budynki itd.) NIE wchodzi do siły militarnej.
4. Progi: przewaga = siła A ≥ 1,2 × siła B (20%); poniżej progu żadna strona nie ma przewagi. Wartości w JSON, nie w kodzie.
5. Idealnego remisu nie ma: funkcja ma deterministyczne rozstrzygnięcie remisu (np. wyższa suma armii, potem mniejsze id) i je dokumentuje.

## Specyfikacja źródłowa
dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/10-operator-claude.md (sekcje 2, 4, 9). Uwaga: specyfikacja przyjmowała próg 1,5× i wzór ilorazowy R_sila·R_bitwy·R_pula — ZASTĘPUJĄ ją decyzje powyżej (próg 20%, składniki sumowane do jednej liczby siły na stronę). Pula rekrutów jest już częścią składnika Rekruci w Power (power-objective.ts ok. 244) — nie liczyć jej drugi raz.

## Wymagane
1. Plik gra/src/game/diplomacy-military-strength.ts, czyste funkcje bez importu silnika gry (tylko typy i JSON):
   - computeMilitaryStrength({ armiaPkt, rekrutPkt, punktyWygranychBitewWojna, trybutBonusAktywny }) → liczba ≥ 0 = (armiaPkt + rekrutPkt + wagaBitew · punktyWygranychBitewWojna) · (trybutBonusAktywny ? 1 + trybutBonusProc : 1).
   - compareMilitaryStrength(silaA, silaB, params) → { przewaga: 'A' | 'B' | 'brak', stosunek, silniejszyId } z progiem 20% z JSON i jawną regułą remisu.
   - Wejście armiaPkt i rekrutPkt jest gotowymi punktami (z computeObjectivePower po flagach military w power-params.json); funkcja ich nie liczy, ale w teście pokaż na danych z power-params.json, że suma składników military=true = Armia + Rekruci.
2. gra/data/diplomacy-military-strength-params.json: progPrzewagiProc 20, wagaBitew (domyślnie 1 — udokumentuj, że punkty bitew pochodzą z tego samego modelu co składnik wygrane_bitwy w Power), trybutBonusProc 10, trybutBonusTur 10. Każdy parametr z opisem po polsku.
3. gra/tools/diplo-military-strength-test.cjs: (a) siła = armia + rekruci przy braku bitew i trybutu; (b) wygrane bitwy podnoszą siłę, gospodarka nie; (c) trybut ×1,1; (d) próg 20%: 119% brak, 120% przewaga; (e) symetria: zamiana A↔B odwraca wynik; (f) remis rozstrzygnięty deterministycznie; (g) wczytanie JSON i brak magicznych liczb w kodzie (grep po 1.2 / 0.2 w pliku .ts); (h) mutacja (zmiana progu w JSON) czerwieni test.
4. Raport: lista plików, surowe wyniki, opis jak krok 3 i 4 mają to wywołać (bez implementacji), oraz lista miejsc w kodzie, w których trzeba będzie zliczać wygrane bitwy z tej wojny (tylko wskazanie plik:linia — licznik jest osobnym zadaniem).

## Kryteria końca (binarne)
- tsc --noEmit exit 0; nowy test zielony; pięć bramek referencyjnych: logic-test 213/213, tech-tree-test 20/0, research-test 33/0, unit-replace-test 21/21, combat-test 6/6.
- git diff --name-only origin/main...HEAD pokazuje tylko pliki z allowlisty.
- Funkcje nie są nigdzie importowane poza testem.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
