STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - UI
TEMAT: R-WEB-HUD-PANELS-BELOW-BANNER-Q1
GOAL: Panele boczne startuja pod dolna krawedzia lewego banera HUD; dynamicznie, 0 w trybie 1-liniowym, bez skoku.
ZMIANY/COMMIT: kod 0f6654a8a, obrona 3555c909d (tylko dokumentacja), baza fcaa10300. Do integracji: 3555c909d (kod = 0f6654a8a). Allowlista OK: sidePanelLayout.ts, hud-panels-below-banner-test.cjs, katalog runu. Bez main.ts/hud.ts/WERSJE.md/rust-port.
TESTY (odtworzone samodzielnie na 3555c909d): hud-panels-below-banner-test PASS 119/0; mutacja (sidePanelLayout.ts z bazy) FAIL 93 ok/26 fail; hud-topbar-layout-a-test PASS 144/0; logic-test 213/213; tsc --noEmit czysto; git diff --check czysto. ai-test nie powtarzany (zmiana nie dotyka AI; deklaracja 274/20 jak na bazie).
ZARZUTY: 1 (sonda zamiast prawdziwych paneli) ODDAL - 5 paneli bierze top z SIDE_PANEL_TOP, pokryte wspolna stala. 2 (brak dowodu w main.ts) ODDAL - dispatch wymaga testu na showHud(). 3 (zrzuty poza repo) ODDAL - nie wymagane w commicie, odtwarzalne --shots. 4 (mutacja) brak zarzutu, potwierdzona. Zero NAPRAW, zero DO DECYZJI CZLOWIEKA.
BLOKADY: brak. Notatki: brak weryfikacji w pelnej grze; panel wydarzen po prawej, minimapLayout, cityUxFrame poza zakresem.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora na aktualny origin/main (zmiana tylko w sidePanelLayout.ts, brak kolizji z hud.ts), potem bramki. Wzgledem origin/rust-port/parity-v2 (8bc2efcf8): najpierw main, potem REPIN Rust (zmienia sie top paneli bocznych); nie scalac z parity-v2 przed integracja do main.
DEPLOY/PUSH: NIE WYKONANO
