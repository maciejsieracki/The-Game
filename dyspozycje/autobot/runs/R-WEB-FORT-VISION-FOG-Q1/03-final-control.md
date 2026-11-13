STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-FORT-VISION-FOG-Q1
GOAL: Posterunek (r=3) i fort (r=5) gracza odkrywaja i oswietlaja cale kolo swojego terytorium, jak miasto.

WERDYKT PER ZARZUT (Evaluator):
1. Brak pomiaru w zywej grze -> ODDAL: obrona r1 (346a5ed52) zmierzyla PRZED 91/91 nieodkrytych, PO 0/91 (evidence/live2-{before,after}.json).
2. live-hooks nieuruchomiony -> ODDAL: uruchomiony ponownie przez FC, 37/0.
3. main.ts bez testu behawioralnego -> ODDAL: sciezka zdobycia fortu zmierzona na zywo (PRZED 91/91, PO 0/91); budowa/cofniecie przez panel (hak placeFort omija) zostaje do zywej weryfikacji orkiestratora (nie jest decyzja produktowa).
4. Wplyw na AI -> ODDAL: zmierzone 91 -> 182 pol widocznosci wlasciciela AI z fortem r=5 (przed 91/91); wplyw na wyniki rozgrywki AI NIE_ZMIERZONO (40 tur nie stawia fortow); spojnosc z miastem.
5. ai-fog-test -> ODDAL: pada identycznie na bazie 420d97ffe (gate-ai-fog-baza-420d97ffe.txt), wczesniejsza porazka.
Zadnego NAPRAW.

TESTY (FC, swieze, na 346a5ed52): fort-vision 15/0; auto-fort-claim 63/0; auto-fort-diag 17/0; fort-outpost-hard-territory 80/0; river-fog-visibility 31/0; autoimprove-live-hooks 37/0; tsc --noEmit EXIT=0. git diff --check czysty.
ALLOWLISTA: zmiany tylko w gra/src/game/{fort-territory,visibility}.ts, gra/src/main.ts, gra/tools/fort-vision-{test,live}.cjs, katalog runu. ai-fog.ts, WERSJE.md, rust-port, gra-robocza nietkniete. Testow nie oslabiono. Diff src minimalny, bez przeliczania co klatke (refreshFog tylko przy budowie/cofnieciu/zdobyciu/utracie fortu).
KOD POPRAWKI: 1107cf51a.
KOLEJNOSC: baza 420d97ffe jest w origin/main; origin/rust-port/parity-v2 (9a6bf6ee) to osobna linia (rust-port), zmiany rozlaczne (tylko gra/ + run) -> brak zaleznosci kolejnosci.
ZYWA WERYFIKACJA ORKIESTRATORA: ROBOCZA_HTML=<index.html> node gra/tools/fort-vision-live.cjs po (oczekiwane S1,S3,S4 = 0 nieodkrytych, S2 bez zmian); reczny test budowy/cofniecia fortu w panelu.
BLOKADY: brak. RUNDY: 2/5. DEPLOY/PUSH: NIE WYKONANO
