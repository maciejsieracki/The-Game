STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-NEWGAME-ADV-APPLY-BTN-Q1
GOAL: Przycisk stopki „Zaawansowane opcje” = „Zastosuj”, aktywny; klik zapisuje i zamyka okno.
ZMIANY/COMMIT: ocena a7aac69f0 (baza 5ab3d58e2). Kod: aee6ca12a (newGameFlow.ts +8/-2, CSS .adv-close + etykieta/type=button). Diff do allowlisty: OK (brak zmian gra-robocza, WERSJE.md, rust-port, src-tauri, main.ts); git diff --check czysty.
TESTY (zmierzone przez FC na a7aac69f0): tsc EXIT=0; newgame-adv-apply-btn-test 87 OK / 0 FAIL EXIT=0; mutacja (usuniecie addEventListener) 63 OK / 12 FAIL EXIT=1; newgame-adv-tooltip 31/0; newgame-bottom-navigation 270/0. Logi diplo-truce/diplomacy/war-era w runie maja EXIT=0 (nie odtwarzane przez FC). Zrzut 1280x600@150 obejrzany: „ZASTOSUJ” widoczny, nieuciety. Brak „Zamknij” w tools/newgame-*.
ROZSTRZYGNIECIE ZARZUTOW: 1 ODDAL (log regenerowany 87/0), 2 ODDAL (logi dopisane), 3 ODDAL (korekta SHA w 02), 4 ODDAL (6 zrzutow), 5 ODDAL (realny bundle zbudowany do scratch, zawiera „Zastosuj”; zaslonienie w pelnej grze NIE_ZMIERZONO, ryzyko rezydualne niskie), 6 ODDAL (fallback usuniety; przy niezgodnej wersji Playwright test konczy FATAL=FAIL bez wiszenia, uzyc PLAYWRIGHT_CHROMIUM_EXECUTABLE), 7 ODDAL (mutacja w logu). Zero NAPRAW, zero DO DECYZJI.
BLOKADY: brak blokujacych. NIE_ZMIERZONO: zaslonienie w pelnej aplikacji; newgame-sett-grid-layout-test 6/8 fail identycznie na bazie (usterka sprzed zmiany).
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora. SHA do integracji: a7aac69f0 (+ commit tego raportu). Kolejnosc: na origin/main (>=5ab3d58e2) PRZED rownoleglymi MENU-REORDER i DEFAULTS (ten sam plik newGameFlow.ts, rozlaczne regiony: CSS ~l.1111, stopka ~l.1918); wzgledem origin/rust-port/parity-v2 niezalezne (gra/ vs rust-port), kolejnosc dowolna.
DEPLOY/PUSH: NIE WYKONANO
