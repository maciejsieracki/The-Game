STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1
GOAL: "Zaloz miasto" wyszarzone, nieklikalne, z komunikatem "Osiagnieto limit miast (X/Y w tej epoce)" przy wyczerpanym limicie epoki; "brak zasobow" bez zmian gdy limit nie osiagniety; pierwsze miasto nigdy nie blokowane.
ZMIANY/COMMIT: kandydat 6dbe1f60e41032b0f52eb26107c684b7f9e97c52 (potomek bazy ac35200a1: git merge-base --is-ancestor = tak; 2 commity). Do integracji: 6dbe1f60e41032b0f52eb26107c684b7f9e97c52. Pliki zgodne z allowlista: gra/src/game/cities.ts (czysta funkcja cityFoundingLimitState + resolveFoundCityLockHint; canFoundCity korzysta z tego samego helpera, ten sam powod odrzucenia), gra/src/main.ts (tylko wiring panelu budowy), gra/src/ui/buildModeHud.ts, 3 testy w gra/tools, raporty runu. git diff --check: czysto. Parytet: canFoundPlayerCityAt uzywa ME(), player.era ?? 1, _menuCityLimitBase -- identycznie jak wiring UI.
TESTY (wlasne, surowe wyniki):
- tsc --noEmit: exit 0
- city-founding-limit-greyed-test.cjs: 19 OK / 0 FAIL
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 (wszystkie zielone na kandydacie, brak czerwonych do porownania z baza)
- LIVE w prawdziwym bundlu gry (esbuild z main.ts, ?civTest=1, Chromium+xvfb): city-founding-limit-greyed-fullgame-live-test.cjs PASS=10 FAIL=0, brak bledow JS. DOM przy limicie 1/1: klasa "locked limit", aria-disabled=true, meta "limit 1/1", napis "osiagnieto limit", opacity 0.36; klik nie wchodzi w tryb zakladania; po setCityLimit(5) i ponownym otwarciu panelu przycisk aktywny, bez napisu. Zrzut ekranu wlasny obejrzany: panel "Miasto - osiagnieto limit", wyszarzony "Zaloz miasto", "limit 1/1". (Zrzut w scratchpadzie sesji.)
- MUTACJA wiringu main.ts (getFoundCityLimitState -> return null), przez kopie pliku i przywrocenie: live 6 PASS / 4 FAIL (czerwony); test statyczny nadal 19/0 (sekcja E tylko tekstowa) -- wiring chroni test live, nie statyczny.
ROZSTRZYGNIECIE ZARZUTOW:
1. wiring bez testu behawioralnego -- ODDAL: priorytet limitu wyniesiony do helpera testowanego (B2) + test live na prawdziwym main.ts dowodzi wiringu (mutacja czerwona, zmierzone przeze mnie).
2. brak dowodu live w pelnej grze -- ODDAL: dowod PASS=10 powtorzony niezaleznie, zrzut jest. Zastrzezenie: harness ukrywa .civ-menu stylem (tylko test).
3. odswiezanie przy awansie epoki/utracie miasta -- ODDAL (nota): GOAL 5 wymaga odswiezenia "przy najblizszym odswiezeniu panelu"; zmierzono render po otwarciu panelu. Klik przelicza podpowiedz na zywo (getFoundCityLockHint), wiec nieodswiezony wyglad nie pozwala zalozyc miasta ponad limit; dodatkowo canFoundCity odrzuca na hexie. Brak NAPRAW.
Zaden zarzut: NAPRAW.
BLOKADY: brak.
NIE ZMIERZONO / UWAGI-DLA-ORKIESTRATORA: awans epoki i utrata/zdobycie miasta jako wyzwalacz odswiezenia panelu w pelnej grze; opcjonalnie osobny niski temat: odswiezanie otwartego panelu budowy przy zmianie limitu (analogicznie do istniejacej podpowiedzi zasobow). Sprzatanie: gra/node_modules w tym worktree (ignorowany przez git).
RUNDY: FC rundy 1 (po obronie rundy 1) z limitu 5.
NASTEPNY KROK: integracja orkiestratora (FF/merge 6dbe1f60e, bramki), deploy na ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
