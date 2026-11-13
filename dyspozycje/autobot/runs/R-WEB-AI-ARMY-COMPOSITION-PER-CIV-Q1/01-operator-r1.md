STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-ARMY-COMPOSITION-PER-CIV-Q1
GOAL: AI każdej z 15 cywilizacji rekrutuje wg zatwierdzonej tabeli składu (wręcz / dystans / konnica+rydwany), min. 50% wręcz, Inkowie 0 konnicy; brak dostępu do klasy -> udział na wręcz; dotyczy tylko AI.
ZMIANY/COMMIT: SHA w sekcji "COMMIT" na końcu (baza b765e4994 = origin/main). Pliki: gra/src/game/ai-army-composition.ts (nowy), gra/src/game/ai.ts, gra/src/main.ts (+7 linii: queuedRecruitUnitIds), gra/data/ai-params.json (+45 kluczy sklad_armii_<civ>_{wrecz,dystans,konnica}, wyłącznie dopisane), gra/tools/ai-army-composition-per-civ-test.cjs (nowy). Nie ruszono: WERSJE.md, gra-robocza/, build/dev, push, deploy.
TESTY: patrz niżej.
BLOKADY: brak blokujących. Notatki w sekcji "NOTATKI".
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (runda 1), potem Obrona, Final Control. Dług: REPIN Rust (ai.rs) — skład armii + nowe klucze ai-params.
DEPLOY/PUSH: NIE WYKONANO

## 1. AUDYT (stan przed zmianą)

- Produkcja jednostek AI nie wybiera "klasy" — `chooseCityProduction` (ai.ts) wstawia do kandydatów wyłącznie dwa literały: `Wojownik` i `Łucznik` (+ `Zwiadowca`), obok budynków. Wygrywa najwyższy score. Brak kandydatów konnicy/rydwanów, włóczników, jednostek specjalnych cywilizacji.
- Jedyny dodatek: blok "R-EPOCH-RECRUIT" — awans kandydata do najnowszej jednostki TEGO SAMEGO `Typ` (Swordsman albo Distance), przez `newestAvailableSameTypeUnit`. Więc linia miecznik -> miecznik, łucznik -> łucznik; konnica i włócznicy nigdy.
- Scoring: wczesna faza Wojownik 90+mil*0.5..., mid-phase Wojownik 170+mil vs Łucznik 165+mil; pod zagrożeniem osobne `aiThreatMajorUnitScores`; L3 w pokoju -40 dla Wojownika (`applyL3PeaceWarriorPenalty`). Różnica 5 pkt + modyfikatory (`militaryScore`, kary/premie, mnożnik 0.65 w majorEarly) decyduje o tym, który z dwóch wygra w danym mieście i turze — stąd "same łucznicy" albo "same piechurzy" zależnie od cywilizacji/trudności/fazy.
- Dodatkowa luka (potwierdzona pomiarem): filtr `isProductionAllowed` odcina `Wojownik`/`Łucznik` (Kamień), gdy epoka ma >1 stopień wyżej (reguła R-EPOKA-KASKADA-JEDNA: bieżąca epoka + jedna niższa). Promocja do nowszej jednostki działa dopiero PO tym filtrze, więc w Żelazie kandydaci znikają i AI nie rekrutuje nic z tej ścieżki.
- Nie istnieje żaden skład docelowy; `archetype_*_wojsko_priorytet` (ai-params) steruje tylko priorytetem wojska ogółem. `majorMilFrac=0.5` martwa stała.
- Egzekucja (main.ts): `pickExecutableCandidate` na [buildingId + fallbackIds] -> `purchaseRecruitmentUnit` (Skarbiec, Manpower, surowiec, Super max 1, stack limit). Jednostki czekają w kolejce rekrutacji miasta (`cityProd.rekrutacja`) — ai.ts ich nie widział.

## 2. PARAMETRY W DANYCH

`gra/data/ai-params.json`, sekcja "§9 Skład armii": 45 kluczy `sklad_armii_<ikonaId>_wrecz|dystans|konnica` (`wartosc`), zgodnie z tabelą właściciela (Rzymianie 75/15/10, Grecy 70/20/10, Chińczycy 60/20/20, Inkowie 65/35/0, Zulusi 60/25/15, Egipt 55/35/10, Sumerowie 50/35/15, Celtowie 65/10/25, Germanie 80/15/5, Harappa 55/35/10, Hetyci 60/15/25, Słowianie 70/25/5, Babilonia 50/35/15, Asyria 50/30/20, Fenicjanie 55/35/10). Walidacja w kodzie (`isValidArmyCompositionTarget`: liczby >=0, suma 100, wręcz >=50) — cel niepoprawny/brakujący = null = zachowanie legacy; test A pilnuje, że wszystkie 15 celów są poprawne i zgodne z tabelą.

## 3. LOGIKA

- `gra/src/game/ai-army-composition.ts`: klasyfikacja `Typ` -> wręcz (Swordsman/Spearman/Falangite/Offensive), dystans (Distance/Slinger), konnica (Mount, rydwany razem); Siege/Civilian/Naval poza procentami.
- Skład liczony z: jednostek ownera na mapie + jednostek w kolejkach rekrutacji miast (nowe `opts.queuedRecruitUnitIds`, uzupełniane w main.ts bez generałów) + zakupów wybranych w tej samej turze przez wcześniejsze miasta (`opts.armyCompositionPending`, zerowane w decideAITurn).
- Wybór klasy: największy deficyt `cel% * (N+1) - liczba`; remis -> wręcz. Klasy niedostępne (brak dozwolonej jednostki) oddają cel wręcz; klasy z celem 0 nigdy nie są wybierane (Inkowie bez konnicy).
- Wybór jednostki w klasie (spośród DOZWOLONYCH przez `isProductionAllowed` — tech/epoka/koszary/surowiec/nacja): najnowsza epoka -> jednostka specjalna cywilizacji (Klasa Specjalna z Nacją) -> większa fieldPower -> tańsza. Super-jednostki pomijane (limit 1 egzekwuje availableProduction/purchaseRecruitmentUnit).
- Podmiana w `chooseCityProduction`: wszyscy kandydaci-jednostki bojowe zastąpieni łańcuchem [klasa o max deficycie, wręcz, pozostałe]; score łańcucha = max score zastępowanych kandydatów (rywalizacja jednostka vs budynek bez zmian), kolejne ogniwa -0.01 (fallbacki egzekucji: brak surowca/konia/rudy -> następny = wręcz). Podmiana PRZED filtrem `isProductionAllowed` (naprawia też lukę Żelaza z audytu).
- Zakres: tylko major AI (`isMajorAiOwner`), wszystkie poziomy trudności; miasta-państwa i gracz bez zmian (gracz nie używa chooseCityProduction). Wymaga `opts.civType` i `opts.isProductionAllowed` (main.ts je podaje); bez nich legacy.
- Limity zachowane: rezerwa zakupu 10/3/0, manpower, utrzymanie, stack limit, Super max 1, ERAWAR, FOLLOW-LEADER/łączenie (ścieżki ruchu nietknięte).

## 4. TESTY (z gra/, esbuild/typescript z kopii poza repo, bez build/dev)

- NOWY `node tools/ai-army-composition-per-civ-test.cjs`: 341 passed, 0 failed. Zakres: A dane 15 civ vs tabela + walidacja; B klasyfikacja; C czyste funkcje (deficyt, preferencja specjalnej, Super pominięty, łańcuch); D symulacja 60 rekrutacji na REALNYM `decideAITurn` z realnymi units.json/buildings.json/`availableProduction` dla 15 civ x epoki (od epokaWejscia) — każda klasa w ±10 pp, min 50% wręcz, Inkowie 0 konnicy; E brak dostępu (konnica zablokowana / brak surowca / tylko wręcz / brak jakiejkolwiek wręcz) nie blokuje rekrutacji i przenosi udział na wręcz; F poziomy trudności 1/2/3; G brak civType = legacy, miasto-państwo bez programu; H kotwice źródłowe. Przykład (Żelazo, 60 rekrutacji): Rzymianie 75/15/10 (Hastati, Procarz, Rydwan konny), Inkowie 65/35/0, Germanie 80/15/5, Asyria 50/30/20 (Włócznik, Łucznik asyryjski, Konnica lancowa asyryjska).
- Mutacja: wyłączenie podmiany w chooseCityProduction -> 161 FAIL (test wykrywa brak funkcji).
- Regresje (wszystkie 0 FAIL): ai-test 289, ai-jednostki-tylko-zakup 45, ai-prod-fallback 17, ai-production-priority 9, ai-mp-rekrutacja-build-gate 21, ai-mp-military-cap 18, ai-recruit-upkeep-gate 23, ai-rekrutacja-parytet 7, army-recruitment-concentration 30, ai-era-unit-promotion 17, ai-army-all-civs-general-muster 26, ai-war-gate 24, ai-unit-rush 7, ai-resource-needs 6, stadnina-early-eras-ai-picker 19, ai-army-scattered-merge 33, ai-purchase-maintenance-reserve 56, ai-balans-step2/4/5, ai-threat-mode 12, ai-early-no-major-war 14, pr141-ai-production-behavior 23, era-war-all-eras 10, ai-difficulty-bonus 97, ai-prod-gate-difficulty 8, army-consolidation, army-follow-leader-auto-merge 14, ai-war-defend-home 30, ai-home-defense-vs-barbarians 46, war-allin-general-path-barb-defense 24, war-allin-keep-barb-defense 8, ai-stadnina-fort-territory 17.
- `tsc --noEmit` (TypeScript 5.6.3): 0 błędów w ai.ts, ai-army-composition.ts, main.ts (pozostałe błędy to brak typów vite w tym środowisku, nie dotyczą zmian).
- FAIL niezwiązane ze zmianą (identyczne bez mojej podmiany — sprawdzone wyłączeniem funkcji): war-allin-capital-test "6b aiVsAi" i "6b noLandPath" (hash referencyjny, dług sprzed tematu); ai-balans-step3-test T1d (L3 prog_koszt_x 80 vs 70, dane cudów, nie dotykane).
- NIE URUCHOMIONO: ai-buduje-budynki-test (wymaga `vite build`, zabronione/brak vite); LONGRUN (brak w tym środowisku, wymaga przeglądarki).
- NIE_ZMIERZONO: skład armii AI po ~50 turach w prawdziwej grze headless (ai-army-*-live-measure wymagają vite build + Chromium; zakaz build/dev w gra/ i brak narzędzi). Zastępczo: symulacja 60 rekrutacji na realnym decideAITurn jak wyżej — nie uwzględnia strat bitewnych, braku złota ani manpower w realnej turze.

## 5. NOTATKI / ZAŁOŻENIA

1. Cywilizacja bez żadnej jednostki wręcz w danej epoce (np. Celtowie w Kamieniu, przed epokaWejscia=braz) nadal rekrutuje inne klasy (nie blokuje); w praktyce nieosiągalne w grze.
2. Specjalne jednostki z podwyższonym kosztem (np. Chaska 13 vs Wojownik 5) są preferowane zgodnie z dispatchem; zakup bramkuje istniejące `shouldAIPurchaseUnit` (Skarbiec) — wolniejsza rekrutacja przy ubogim skarbcu możliwa; do pomiaru w grze.
3. Super-jednostki (limit 1) poza programem procentowym — pozostają w osobnej logice (bez zmian).
4. Dług: REPIN Rust (ai.rs, ai-params 45 kluczy); ai-params.json bywa generowany z Excela (tools/export-ai-params.py) — nowa sekcja §9 trzeba dodać do źródła Excel, inaczej regeneracja ją usunie.
5. Środowisko: node_modules to symlink do kopii esbuild/typescript poza repo (ignorowany przez .gitignore), do usunięcia po rundzie wraz z /tmp; brak `git add -A`.

## COMMIT

Kod + dane + test + ten raport: 871762a746f891441d2dae68214bc92117ed75b2 (rodzic b765e4994 = origin/main, gałąź worktree-wf_1095f8a8-e38-1). Push/deploy: NIE WYKONANO.
