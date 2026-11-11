STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1
GOAL: Pytanie „Administratorzy: włączone / wyłączone” w kreatorze nowej gry zamiast przełącznika automatyzacji w ustawieniach; wybór zapisany w grze na stałe; OFF = brak mechaniki administratora i brak automatyzacji gracza; ON = zasady CITY/IMPROVEMENT; stare zapisy = administratorzy wyłączeni + jednorazowe powiadomienie.
ZMIANY/COMMIT: baza origin/main 09ddc9345. SHA kodu/raportu: patrz pole sha w wyniku (czubek pracy).
- gra/data/ui-params.json: wiersz `auto_build_enabled` zastąpiony `administrators_enabled` („Administratorzy”, Włączone/Wyłączone, domyślnie Wyłączone, opisy).
- gra/src/ui/newGameFlow.ts: klucz, skrót karty „Ad”, parametr `administratorsEnabled`.
- gra/src/game/auto-build-gate.ts: `ADMINISTRATORS_ENABLED_DEFAULT`, `administratorsFromSaveMeta/NewGameParam`, `shouldShowLegacyAutomationMigration`, teksty powiadomienia, nowa podpowiedź UI.
- gra/src/main.ts: stan `administratorsEnabled` (nowa gra, zapis `meta.administratorsEnabled`, brak zapisu starego `autoBuildEnabled`); wczytanie: brak pola = OFF, usunięcie administratorów gracza przy OFF, jednorazowe powiadomienie w „Ważne” (+ hint) dla starego zapisu z `autoBuildEnabled===true`; hooki UI administratora miasta/ulepszeń zwracają null dla gracza przy OFF, zatrudnienie odrzucane przy OFF.
- gra/src/ui/gamePauseMenu.ts: usunięty przełącznik „Automatyzacja budowy” (UI + cfg); usunięte podpięcie w main.ts.
- docs/encyklopedia/pojecia/administrator-miasta.md + gra/src/data/wikiBundle.json (regeneracja `tools/bundle-wiki-for-game.cjs`): opis opcji w kreatorze, brak „opcja w ustawieniach”.
- Testy: nowy gra/tools/administrators-wizard-test.cjs (zastępuje autobuild-toggle-test.cjs, git mv); zaktualizowane city-/improvement-administrator-test, fog-reveal-key-f-option-test (regex adjacency, wcześniej już nie pasował po FALI 627), newgame-defaults-test, newgame-settings-layout-reposition-test; usunięte przestarzałe live-verify-autobuild-toggle(.-ui).cjs; nowy live-verify-administrators-wizard.cjs.
- Dowody: dyspozycje/autobot/runs/R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1/evidence/ (01 kreator z pytaniem, 02 panel miasta OFF bez przycisku administratora, 03 menu gry bez starego przełącznika, 04 panel miasta ON z „Administrator +”, JSON).
TESTY (surowe wyjście):
- tsc --noEmit: bez błędów.
- administrators-wizard-test: 56 passed, 0 failed.
- city-administrator-test: 117 passed, 0 failed; improvement-administrator-test: 53 passed, 0 failed.
- fog-reveal-key-f-option-test: 25 OK, 0 FAIL; newgame-defaults-test: 62 pass, 0 fail; newgame-settings-layout-reposition-test: PASS; auto-manage-test: 45/45; army-auto-recruit-general-test: 32 assertions passed.
- Build: `npx vite build --outDir /tmp/adminwiz-build` OK; Chromium (live-verify-administrators-wizard.cjs): wizard found=true, oldRow=false; panel OFF adminBtn=false; pauza autobuildToggle=false, textHasOld=false; panel ON adminBtn=true; errors=[].
- NIE_ZMIERZONO: pełna regresja (newgame-menu-reorder-layout-test i inne Playwrightowe nie uruchomione; zmiana nie dotyka liczby kart — zamiana 1:1).
BLOKADY: brak. Oryginalny `00-dispatch.md` tematu nie istnieje w origin/main — użyto DODATKU (decyzje 1-5 + DODATEK 2).
ZAŁOŻENIA:
1. AI nie podlega opcji (DODATEK 2): AI buduje/ulepsza jak dotąd; `ai_wymaga_administratora=false` z asercją w teście. AI nadal zatrudnia administratorów miasta (`aiHireAdministrators`, efekty ekonomiczne) niezależnie od opcji — nie zmieniałem (DODATEK 2 mówi „AI wg dotychczasowego zachowania”); jeśli właściciel chciał, by AI przy OFF nie zatrudniało administratorów, to osobna decyzja.
2. Wewnętrzna nazwa haka testowego `__civTest.setAutoBuild` zachowana (steruje teraz `administratorsEnabled`); ścieżka UI-hooka `isAutoBuildEnabled` zachowana technicznie, znaczenie = opcja Administratorzy.
3. Przy OFF kontrolki „Auto” w panelu miasta/ulepszeń pozostają wyszarzone z podpowiedzią (nowy tekst odsyła do kreatora nowej gry), zamiast znikać — spójne z poprzednim zachowaniem; przyciski/chipy/koszty administratora znikają całkowicie.
4. Stary zapis z włączoną automatyzacją: administratorzy gracza usuwani przy wczytaniu przy OFF; powiadomienie ponawia się tylko do czasu pierwszego ponownego zapisu (nowy zapis niesie `administratorsEnabled=false`, bez `autoBuildEnabled`).
5. Armia (rekrutacja z generałem) nietknięta; asercja w teście, że recruit-general.ts i empireRecruitPanel.ts nie używają bramki.
UWAGA: sonda `lockedButtons/hint` w skrypcie live przy ON bierze też stary fragment HUD budowy (nie odświeżany) — zrzut 04 pokazuje poprawny stan panelu (Administrator +, „Autobudowa wymaga działającego administratora”).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
