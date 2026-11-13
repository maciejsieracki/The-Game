STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1
GOAL: per-miasto per-budynek przelacznik wl/wyl budynkow produkujacych surowce (wylaczony = brak produkcji, zuzycia wejsc i utrzymania); stan w zapisie; lista miast + agregaty w panelu Miasta.
ROLA: Operator (obrona), runda 1 obrony. Start: 0df577c83 (kandydat; raport Evaluatora 8a4d5e9af).

## ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE. cityPanel.ts czyta teraz stan wylaczenia z building-toggle.ts (ten sam modul co silnik): `sumOwnedBuildingsUpkeep` i `sumOwnedBuildingsResourceUpkeep` licza `operationalBuiltIds(city, built)` (podsumowania "Budynki w miescie" i tytul kompaktowy); wiersz budynku (`appendOwnedBuildingRow`) dla wylaczonego: znacznik "wyłączony" + wygaszona nazwa + tooltip, utrzymanie 0 (wiersz "muted"), wiersz "Prod.:" wygaszony (jak budynek runtime-nieaktywny). Dowod: test sekcja F (7 asercji) w resource-building-toggle-test.cjs; MUTACJA: podmiana `operationalBuiltIds(city, built)` na `built` w sumOwnedBuildingsUpkeep -> "FAIL: F: suma utrzymania zlota liczy tylko budynki operacyjne" (129/1), po przywroceniu 130/0. Zakres: asercje F sa tekstowe (zrodlo cityPanel.ts), bo bundlowanie cityPanel pada na svg?raw (zarzut 6, dlug bazowy) -- NIE_ZMIERZONO w DOM/Chromium dla samego panelu miasta.
2. ODRZUCAM (zapisane jako ograniczenie, do decyzji FC/wlasciciela). Stolarnia i Warsztat kamieniarski daja "+10% doplywu" -- mnoznik na doplywie z terenu, nie przepustowosc; "mozliwa produkcja przy nieograniczonych wejsciach" nie ma dla nich zdefiniowanej wartosci bez bazy doplywu, a wymyslenie drugiej formuly lamaloby zasade "jedna formula z panelem miasta". Maja przelacznik i wiersz na liscie miast (UI: `[data-prod-row]`), efekt jest objety testami B (Stolarnia w sekcji B), stopka UI to opisuje. Brak dowodu bledu -- tylko roznica interpretacji zakresu agregatu.
3. ODRZUCAM. Dispatch wymaga "label accurately"; panel podpisuje "OSTATNIA TURA" (historia) i "MOŻLIWE" (gorna granica), test UI asertuje stopke "historia, nie prognoza" / "górna granica, nie wynik". Osobna prognoza = druga sciezka liczenia tury (ryzyko rozjazdu z silnikiem); rekomendacja: osobny temat po decyzji ABC wlasciciela. NIE_ZMIERZONO (nie zaimplementowano) -- jawnie.
4. PRZYJMUJE CZESCIOWO (dowod rozszerzony, bez kodu). Uruchomiono pelna gre przez Vite (createServer w jednym procesie, port 5199) + Chromium /opt/pw-browsers/chromium-1194: strona laduje sie ("The Game — 4X"), main.ts kompiluje sie w pelnej aplikacji, 0 `pageerror`, jedyny blad konsoli to 404 zasobu (nieistotny dla tematu). Dowod podpiecia w kodzie: main.ts:19824 `setCityProductionBuildingEnabled`, main.ts:27205 `configureEmpireProducerToggle({onToggle -> setCityProductionBuildingEnabled})`. NIE_ZMIERZONO: przejscie kreatora nowej gry, otwarcie panelu Imperium/Miasta i klikniecie przelacznika w prawdziwej petli gry (skrypt zatrzymal sie na ekranie menu po "Rozpocznij gre"); to pozostaje luka do ewentualnej rundy 2.
5. ODRZUCAM. Zalozenie 3 operatora = "wylaczony budynek jest jak nieobecny w ekonomii" (jedna zasada, test konserwacji: wylaczony == scenariusz bez budynku). Gdyby plony z samego budynku (Praca Cegielni, Zywnosc Garncarni, Praca Stolarni) zostawic, wylaczenie dawaloby efekt budynku przy zerowym utrzymaniu -- sprzeczne z GOAL ("no ongoing maintenance cost" + off = brak dzialania). Bramki dostepu/tech/prereq NIE zmienione (zal. 4). Decyzja produktowa pozostaje u FC/wlasciciela (ABC) jesli chce odwrotnosc.
6. ODRZUCAM (zarzut nieslusny: dlug jest bazowy). Uruchomione na czystej bazie 674f9faef (git archive do katalogu poza repo + node_modules z kandydata): `empire-miasta-table-test` i `empire-panel-miasto-obywatele-content-test` koncza sie IDENTYCZNIE jak na kandydacie: "esbuild bundling failed ... No loader is configured for .svg files: brandAssets.ts:18 / scienceOwlIcon.ts:6" (sekcje L i D4). Brak regresji. `cyna-surowiec-test` (>120 s) nie uruchamiany ponownie: NIE_ZMIERZONO.
7. ODRZUCAM po audycie kodu. (a) `advanceEmpireFood` (empire-food.ts) uzywa `builtByCity` wylacznie do `countMagazynByOwner` (Magazyn -- budynek poza zakresem przelacznika); zywnosc Garncarni/Cegielni liczy `econ.perCity` z `previewCityEconomy`, ktory pracuje na `operationalBuiltByCity` -- wiec wylaczona Garncarnia nie daje zywnosci (test B). (b) game/ai.ts: `AI_BUILDING_FOR_DEFICIT`/`boostCandidatesForResourceDeficits` czytaja `built.includes(...)` jako "czy juz zbudowano" (decyzja budowy), AI nigdy nie wylacza budynkow (`wylaczoneBudynki` ustawia tylko UI gracza), wiec zachowanie AI bez zmian; parytet ekonomii AI = te same funkcje (test B, mieszane miasta). NIE_ZMIERZONO: gra AI w dlugim runie z recznie wylaczonym budynkiem po stronie gracza nie wplywa na AI z definicji.

## ZMIANY/COMMIT
Allowlista tej rundy: `gra/src/ui/cityPanel.ts` (import + 2 sumy + wiersz budynku), `gra/tools/resource-building-toggle-test.cjs` (sekcja F), ten raport. Brak zmian w silniku, danych, balansie, `gra/data`.
SHA koncowy: patrz pole sha (commit z tym raportem).

## TESTY (surowe wyjscie)
- `tsc --noEmit`: puste wyjscie (0 bledow).
- resource-building-toggle-test: 130 passed, 0 failed (bylo 123; +7 sekcja F); mutacja F: 129/1 (FAIL wskazany wyzej).
- resource-building-toggle-ui-live (Chromium): 16 passed, 0 failed.
- hud-konwerter-dopasowanie-test 20/0; building-upkeep-resources-test 48/0; converters-test 49/0.
- Baza 674f9faef: empire-miasta-table-test i empire-panel-miasto-obywatele-content-test padaja identycznie (svg?raw) -- dlug bazowy.
- Pelna gra przez Vite + Chromium: laduje sie bez pageerror; przelacznik w petli gry NIE_ZMIERZONO.

## BLOKADY
Brak blokad technicznych. Otwarte dla FC/wlasciciela: zarzut 2 (agregat dla Stolarni/Warsztatu), 3 (prognoza), 5 (szeroka interpretacja), 4 (przelacznik w prawdziwej petli gry).

## RUNDY
Obrona 1/1 dla rundy 1 Operatora (zuzyte rundy tematu: 1/5; poprawka cityPanel = zmiana kodu po rundzie 1).

## NASTEPNY KROK
Final Control (Sonnet); po PASS integracja orkiestratora: merge z aktualnym origin/main (main.ts/cityPanel.ts/empireDetailPanel.ts wyprzedzaja baze), ponowne tsc + resource-building-toggle-test po merge, `git merge-base --is-ancestor` i `git diff --stat`.

## DEPLOY/PUSH
NIE WYKONANO
