STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-IGNORE-TREATIES-Q1
GOAL: Wojna epoki omija NAP, blokadę pokoju, umowy i Relację; blokuje ją tylko sojusz. Zwykłe wypowiedzenie nadal respektuje NAP/blokadę pokoju.
ZMIANY/COMMIT: SHA kodu do integracji = 0c1966718 (poprzednik ba684395a; baza a61337844 = origin/main). Diff 15 plików, git diff --check czysty. Ten plik w osobnym commicie nad 0c1966718.

ROZSTRZYGNIĘCIE ZARZUTÓW
1. ai.ts poza allowlistą: ODDAL (akceptuję; zmiana konieczna, guard-only; ai.ts dopisany do allowlisty). Usuwa tylko !peaceLocked/!hasNapTreaty z wczesnych zwrotów Brąz/Kamień/Żelazo; sojusz zostaje.
2. Komentarze: ODDAL (naprawione w 0c1966718). Martwa isForcedWarRelationBlocked/pairRelationScore zostają (testy relation-gate) — dług kosmetyczny.
3. Zbędne obliczenia hasNap/peaceLocked: ODDAL (kosmetyka).
4. Test behawioralny: ODDAL — część C dodana w 0c1966718; zmierzone przeze mnie: z ai.ts z bazy 18 pass / 4 fail, po zmianie 22/0. Brak testu zwykłego wypowiedzenia z NAP w decideAIDiplomacy (pokrywa A3 + regex B) — wzmocnić w osobnym temacie.
5. Bramki: ODDAL — odtworzone przeze mnie (niżej). Live w przeglądarce NIE_ZMIERZONO; numer tury zrzutu Brązu NIE_ZMIERZONO (przyczyna NAP vs bramka R1 tura<40 niepotwierdzona). Weryfikacja live: temat ERAWARLIVE.
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

TESTY (własne, na 0c1966718; node_modules z zewnątrz, symlink usunięty)
- era-war-ignore-treaties-test: 22/0
- logic-test: 213/213; ai-test: 274 pass / 20 fail (zgodnie z bazą wg Operatora/Obrony; listy FAIL nie porównywałem)
- rc 0: forced-war-{bronze,iron,stone,trojstronna}-main-guard, forced-war-{bronze,iron,stone,trojstronna}-test, forced-war-relation-gate, forced-war-waves, era-war-all-eras
- tsc --noEmit: NIE_ZMIERZONO (brak pełnych zależności; Operator/Obrona: brak nowych błędów vs baza)
- Zero zmian w gra-robocza/, WERSJE.md, rust-port/, render/.

BLOKADY: brak
RUNDY: 2/5 (werdykt końcowy FC)
NASTĘPNY KROK: integracja orkiestratora; origin/rust-port/parity-v2 (3a40d458e) niezależna (gra/ vs rust-port/), kolejność dowolna. RES310 dotyka tego samego ai.ts — integrować sekwencyjnie. Potem READY_FOR_DEPLOY i deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
