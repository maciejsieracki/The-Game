STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1
GOAL: panel oblezenia nie przyciety u dolu przy 1280x800 i 1024x768; przyciski akcji bottom <= bar.top-4; stopka nad banerem.
ZMIANY/COMMIT: kandydat 726ce5d48b7f5b859eb092585f60d3eb3529315c (potomek bazy 75e238e52: merge-base --is-ancestor OK). Kod: tylko gra/src/ui/siegeMapPanel.ts (+34), test gra/tools/siege-map-panel-bottom-clip-1280x800-test.cjs (+135), runs/<ID>/**. Allowlista OK. git diff --check: czysty.
INTEGRACJA: integration_sha = 726ce5d48b7f5b859eb092585f60d3eb3529315c

WERDYKT ZARZUTOW:
1 (machiny poza widokiem bez przewijania): ODDAL jako blad; DO DECYZJI CZLOWIEKA jako UX. Zmierzone przeze mnie (Chromium, build Vite przez HTTP): visibleAtTop [F,F,F,F] przy obu viewportach, reachable [T,T,T,T]. GOAL dopuszcza przewijanie; kryterium 2 (przyciski akcji) spelnione. Zrzut 1280x800 obejrzany: blok "Zbuduj machine" nie jest widoczny bez przewiniecia, brak wskazowki przewijania. Decyzja wlasciciela: dodac wskazowke / zwezic blok?
2 (niskie okna ~600 px): ODDAL, poza zakresem kryteriow (ryzyko odnotowane, osobny temat).
3 (luki testu): ODDAL - naprawione w r2 (selektor overlay, asercje 4 machin, osiagalnosc, bodyScrollable, czekanie na animacje). Test u mnie PASS.
4 (telefon, klik, refit): ODDAL, poza zakresem (desktop 1280x800/1024x768); NIE_ZMIERZONO.
Zadnego NAPRAW.

TESTY (surowe, wlasne uruchomienie na kandydacie):
- tsc --noEmit: exit 0.
- test tematu (kandydat): RC=0, verdict PASS, errors [] na obu viewportach.
- dowod mutacyjny (panel z 75e238e52, ten sam test): RC=1, verdict FAIL; na obu viewportach FAIL: 3 przyciski akcji + stopka.
- logic-test 213/213 RC=0; tech-tree-test 20 pass 0 fail RC=0; research-test 33/0 ALL GREEN RC=0; combat-test 6/6 RC=0; unit-replace-test 21/21 RC=0.
- Wizualnie: zrzut 1280x800 obejrzany - przyciski Oblegaj/Szturm/Odwrot i stopka w pelni nad banerem.
BLOKADY: brak. NIE_ZMIERZONO: telefon <=480 px, klikalnosc, refit poza resize, Firefox/WebKit.
RUNDY: FC po r2 (2/5).
UWAGI-DLA-ORKIESTRATORA: (a) ABC dla wlasciciela: blok budowy machin ukryty pod przewijaniem bez wskazowki; (b) okna <700 px wysokosci - body panelu bardzo niski (osobny temat).
NASTEPNY KROK: integracja orkiestratora, deploy na ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
