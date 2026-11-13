STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PANEL-CIV-RECRUITS-LEVEL-Q1
GOAL: W panelu dyplomacji/audiencji, obok Mocy militarnej, pokazać liczbę rekrutów (pula werbu, Manpower) rozpatrywanej cywilizacji: "Rekruci: bieżąca / maks.", z tooltipem; ta sama definicja co panel werbu gracza.
ZMIANY/COMMIT: BAZA origin/main (b752e0616). Zmienione pliki:
  - gra/src/ui/diplomacyAudience.ts: pola stanu playerRecruits / playerRecruitsMax / otherRecruits / otherRecruitsMax (opcjonalne); stała REKRUCI_TOOLTIP_PL; attrBarHtml z opcjonalnym tooltipem; recruitsAttrHtml (wiersz "Rekruci" w sekcji Atrybuty obu kart, format "1 240 / 2 000" z NBSP jak reszta gry, pasek = bieżąca/maks.); playerCardHtml wyeksportowany (pod test).
  - gra/src/main.ts (POZA LITERĄ ALLOWLISTY, konieczne: tu powstaje stan audiencji getState): helper audienceRecruitsForOwner (rekruci = empirePoborTotals(...).rekruci z civManpowerMultsForOwner(...).maxMult; max = suma cityManpowerMax po miastach ownera) oraz 4 pola w zwracanym stanie. Diff +24 linie.
  - gra/tools/diplo-panel-recruits-level-test.cjs (nowy).
  - dyspozycje/autobot/runs/R-WEB-DIPLO-PANEL-CIV-RECRUITS-LEVEL-Q1/01-operator-r1.md (nowy).
  - Mechanika rekrutacji i AI NIETKNIĘTE.
ZAŁOŻENIA (rozstrzygnięte bez pytania):
  - Widoczność: jak siła militarna — wiersz pokazany wtedy, gdy audiencja istnieje (getState zwraca null dla nieskontaktowanych), czyli dla cywilizacji z kontaktem. Brak dodatkowej mgły.
  - Definicja wartości: bieżąca = suma city.manpower (jak getEmpireRekruciTotal / panel werbu), maksimum = suma cityManpowerMax. Odnowa/turę nie w wierszu (tylko w tooltipie ogólnym).
TESTY:
  - node tools/diplo-panel-recruits-level-test.cjs (esbuild spoza gra/, bez npm w gra/): PASSED 22 / FAILED 0. Obejmuje wiązanie w main.ts (A1-A2) i realny render playerCardHtml/otherCardHtml (B1-B5: format NBSP, pasek 62%/30%/0%, brak wiersza przy undefined, max 0, obcinanie ujemnych).
  - Regresja: node tools/diplomacy-relacje-ai-ai-audiencja-test.cjs PASSED 20 / FAILED 0.
  - NIE_ZMIERZONO: diplomacy-audience-deals-active-first-real-render-test.cjs i diplomacy-audience-zoom-cutoff-real-render-test.cjs — wymagają playwright (brak w środowisku).
  - NIE_ZMIERZONO: zrzut panelu w Chromium (brak przeglądarki w kontenerze) — wizualna weryfikacja wiersza NIE wykonana.
  - NIE_ZMIERZONO: tsc/typecheck (brak node_modules w gra/); main.ts nie był bundlowany — typy oparte na wzorcu istniejących wywołań w tym samym zakresie funkcji.
  - git diff --check: czysto.
BLOKADY: brak wizualnej weryfikacji w przeglądarce (wymóg dispatchu "Chromium jeśli dostępny"); wiersz wymaga potwierdzenia na żywo.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kod + test + diff; ocena wyjścia main.ts poza allowlistę jako minimum wiązania), potem Final Control; zrzut Chromium gdy dostępny.
DEPLOY/PUSH: NIE WYKONANO
