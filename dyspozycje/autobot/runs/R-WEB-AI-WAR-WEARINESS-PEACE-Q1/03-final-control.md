STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-WEARINESS-PEACE-Q1
GOAL: Zmeczenie wojna rosnace do ~200 tur + eskalowana oferta pokoju przegrywajacego az do akceptacji.
ZMIANY/COMMIT: ocena commitu 158b4c02b (na f0dd75323, baza 488d94364). Allowlista zgodna (war-weariness.ts, war-weariness-params.json, ai.ts, diplomacy-proposals.ts, main.ts, test, run). Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri. git diff --check czysty.
TESTY (wlasne, detached 158b4c02b): ai-war-weariness-peace-test PASS=66 FAIL=0; tsc --noEmit exit 0; ai-war-nearest-city-peace-2t PASS (mutacje 16/16); diplo-war-peace-d7 8/0; -gate 11/0; -main-guard 28/0; -profile-unit 198/0; -sim 22/0; diplomacy-city-cession-r3 73/0. node_modules usuniete.
ZARZUTY:
1 brak pomiarow pelnych przebiegow: ODDAL (NIE_ZMIERZONO, brak Chromium; do zmierzenia po integracji).
2 brak wyjscia awaryjnego: NAPRAWIONE w obronie (kapitulacja po >=3 odrzuceniach przy szczycie >=0.8, testy 4f/4g potwierdzone).
3 tor AI-gracz: ODDAL; AI juz proponuje pokoj graczowi, luka ceny zamknieta rabatem (wearinessPeacePriceFactor), gracz decyduje.
4 skala rw/share: ODDAL; main.ts:38422 rw = potAI/(potAI+potPlr), ta sama skala 0..1 (test 4i).
5 atrapy/okablowanie: ODDAL; test 4h na realnej wycenie, okablowanie strazniki zrodla; runtime wymaga przegladarki (NIE_ZMIERZONO).
6 wojny wymuszone epoki: ODDAL; pokoj przez finalizePeaceTreatyBetween (ta sama sciezka co pokoj AI-AI 2T), test zrodlowy 6b.
Brak zarzutu NAPRAW pozostajacego -> PASS-WITH-NOTES.
BLOKADY: brak twardych. NIE_ZMIERZONO: metryki pelnych przebiegow AI, runtime main.ts; porownanie PRZED/PO 102 testow niepowtorzone (regresje celowane zielone).
RUNDY: Final Control 1/5
SHA DO INTEGRACJI: 158b4c02b (+ commit tego raportu). Kolejnosc: rust-port/parity-v2 (b520768b0) dotyka innych plikow (rust-port, workflows) - brak kolizji; integrowac niezaleznie, REPIN Rust po wdrozeniu.
NASTEPNY KROK: integracja orkiestratora, potem pomiar metryk w przegladarce.
DEPLOY/PUSH: NIE WYKONANO
