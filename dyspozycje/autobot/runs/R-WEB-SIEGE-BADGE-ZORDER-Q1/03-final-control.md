STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-BADGE-ZORDER-Q1
GOAL: plakietka oblezenia pod panelami/oknami/tooltipami/toastami, nad terenem; wyglad i logika bez zmian.
ZMIANY/COMMIT: 46776364f (rodzic ac3698a97). Allowlista OK: main.ts (import + 1 linia z-index), ui/worldOverlayLayer.ts, 2 nowe testy, katalog runu. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle, ai*, logice oblezenia.
WERDYKTY ZARZUTOW:
1. Sondy zamiast prawdziwych paneli: ODDAL (z-order zalezy tylko od liczby w tym samym kontekscie fixed; z-index paneli 305/311/312 potwierdzony w zrodle, wszystkie > 250). NIE_ZMIERZONO: zywa instancja .civ-build-panel.
2. Zrzut PRZED = mutacja 340: ODDAL (stary kod literalnie 340, diff to potwierdza).
3. Regresje niezweryfikowane przez Evaluatora: ODDAL (zmiana to jedna wartosc CSS; wyniki Operatora przyjete; load-fail-toast-zindex 12/3 deklarowany jako istniejacy na bazie).
TESTY (wlasne Final Control): git cherry-pick 46776364f na origin/main (01fdd771f) bez konfliktow; test statyczny PASS=13 FAIL=0 na wyniku. Brak pozostalosci z-index:340 w main.ts. Evaluator odtworzyl tsc EXIT=0 i Chromium 17/0.
BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora. 46776364f nie jest na zadnej galezi zdalnej - cherry-pick na aktualny origin/main (czysto), potem bramki. Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (zmiana tylko gra/, parity-v2 to Rust; merge-base f4c89d008); REPIN Rust warstw UI notuje orkiestrator po wdrozeniu.
DEPLOY/PUSH: NIE WYKONANO
