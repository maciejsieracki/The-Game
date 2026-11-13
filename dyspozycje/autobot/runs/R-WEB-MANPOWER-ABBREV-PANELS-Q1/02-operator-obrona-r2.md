STATUS: PASS
DOMAIN: GAME (WEB) — UI: skracanie liczb w panelach
TEMAT: R-WEB-MANPOWER-ABBREV-PANELS-Q1
RUNDA: 2/5 (obrona)

Zarzuty 1-4 i 5 (regresja tooltipu): PRZYJMUJE. Przyczyna: manpowerStatusTitle zmieniono na formatFullNumber, a kontrakt title (recruit-card-manpower-real-render B2/B8/B12, recruitment-panel-compact-row K5) wymaga formatManpower. Poprawka: manpowerStatusTitle w unitRecruitCard.ts wrocil do formatManpower (tooltip bez zmian); widoczne etykiety dalej formatManpowerCompact. Log gate-regress-po.txt z r1 byl nierzetelny co do zestawu (przyznane); nowy log gate-regress-po-r2.txt liczy 51 plikow z wynikiem per plik.
Zarzut 6 (luka testu): PRZYJMUJE CZESCIOWO. Test nowy poprawiony (formatManpower dozwolone dokladnie 3x w unitRecruitCard.ts = manpowerStatusTitle; tooltip porownywany do formatManpower; mutacja przeniesiona na cityPanel.ts). Realne rendery rekrutacji pilnuja dwa istniejace testy, teraz zielone. Pelny render miasta/imperium w przegladarce: NIE_ZMIERZONO (poza zakresem; szerokosc kolumn NIE_ZMIERZONO).
Zarzut 7 (drobne, title w cityPanel/gridDetailRow bez pelnej wartosci): ODRZUCAM jako niewymagane — dispatch: pelna wartosc "jesli jest"; tooltipow nie bylo, nie dodaje (zero zmian poza prezentacja).

TESTY: manpower-panels-abbrev-test EXIT=0; --mutate 3 FAIL; recruit-card-manpower-real-render 20/0; recruitment-panel-compact-row 39/0; manpower-test 71/0; tsc --noEmit EXIT=0; saveload-hud-cache-hotseat-live 18/0 (flaky w r1, zielony tu). Regresje 51 plikow: 37 PASS, 14 FAIL = 13 identycznych z baza 95a4b25ab (lista ewaluatora) + saveload (flaky, zielony po ponownym uruchomieniu); zadnych nowych porazek wzgledem bazy.
