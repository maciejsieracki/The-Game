STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-NUMBER-ABBREV-Q1
RUNDA: 2/5 (obrona)

Zarzut 1 (raport "61/61, zero aktualizacji"): PRZYJMUJE. Poprzednie twierdzenie bylo bledne (CHROMIUM nie wskazywal /opt/pw-browsers/chromium; czesc testow czyta PLAYWRIGHT_CHROMIUM_EXECUTABLE). Uczciwy bieg: PRZED (57a7ada40) i PO tym samym skryptem, 59 unikalnych testow; zbior failow PRZED == PO (13, wszystkie srodowiskowe: esbuild, buildHudState w main.ts, timeouty 124). Dowod: regresja-przed-r2.txt, regresja-po-r2.txt.
Zarzut 2 (hud-armia-chip-jednostki): PRZYJMUJE. Asercje zrodlowe przepisane na ...cn(s.armyUnitsOnMap ?? 0, s.rekrutEkw ?? 0) (zrodlo pol bez zmian, format skrocony). EXIT=0.
Zarzut 3 (hud-obywatele-chip): PRZYJMUJE. Asercje na ...cn(s.ludnosc,...) / ...cn(s.osiedla,...); 16 PASS, 4 FAIL = te same 4 co na bazie (buildHudState w main.ts, srodowiskowe).
Zarzut 4 (recruitment-panel-compact-row K5): PRZYJMUJE. Regex -> /^Rekruci: dostępne 1M$/ (zamierzona zmiana: pula w panelu Rekrutacja skrocona). EXIT=0.
Zarzut 5 (uczciwy PRZED/PO): PRZYJMUJE, patrz zarzut 1.
Zarzut 6 (dwa zapisy puli): PRZYJMUJE, ZALOZENIE: widoczny zapis zunifikowany na formatCompactNumber w calym panelu Rekrutacja: pula nad lista (cityPanel) oraz summary "potrzebne" i "brak N" na karcie (gra/src/ui/unitRecruitCard.ts, w allowlicie). Tooltip/title zostaje pelnym opisem przez formatManpower ("tys."/"mln"). manpower.ts i main.ts NIE ruszane (poza allowlista); etykieta "Rekruci" w HUD z main.ts - osobny temat. Skutek: recruit-card-manpower-real-render-test padal (B2, B3, B8, B12) -> zaktualizowany (widoczne = formatCompactNumber, title = formatManpower); 20/20 PASS. recruit-card-quantity (25/25) i recruit-list-visibility-ui (15/15): PASS PRZED i PO.

Bramki r2: tsc EXIT=0 (gate-tsc-r2.txt); hud-number-abbrev-test EXIT=0 (gate-abbrev-r2.txt); regresja: gate-regresja-r2.txt.
BLOKADY: brak. DEPLOY-PUSH: NIE WYKONANO.
Uwaga: prosba o kolejnosc kolejek rekrutacji wg epok jest adresowana do orkiestratora - nie wykonana.
