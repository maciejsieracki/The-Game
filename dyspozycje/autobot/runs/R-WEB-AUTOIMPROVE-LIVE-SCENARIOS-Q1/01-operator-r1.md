STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1
GOAL: Żywe testy w Chromium na gotowym bundlu ROBOCZEJ `8f59c5c2` (`?civTest=1`), werdykty A–E z dowodami, usterki w `usterki.md`, zero zmian w kodzie gry.

ZMIANY/COMMIT: tylko allowlista: `gra/tools/live-verify-autoimprove-{common,probe,scan,abc,abc-report,fort,nohooks}.cjs` + katalog runu. Bundle MD5 `8f59c5c22da274f1b64ca6a0bac53b44` (kopia poza repo). SHA: patrz COMMIT-SHA na końcu.
ZAŁOŻENIA: mapa Malenki 76x52, ziarno 18; Korynt nieodtwarzalny 1:1 (wzorzec: las poza rzeką + rzeka); w D limit miast = 1 przez preferencje kreatora.

Komendy (z `ROBOCZA_HTML=<kopia> NODE_PATH=/usr/lib/node_modules:/opt/node-tools/node_modules node gra/tools/...`): `live-verify-autoimprove-abc.cjs off 4`, `... on 8`, `FOCUS=zywnosc ... on 16`; `...-fort.cjs 14 infrastruktura`, `... 38 zrownowazone`; `...-nohooks.cjs 20`.

WERDYKTY (ZGODNE / NIEZGODNE / NIE_ZMIERZONO)
A przyczyna braku wycinki: ZGODNE. (i) OFF: każdy heks lasu `odrzucony: wycinka wylaczona` (też przy rzece, U-6). (ii) ON, rzeka niezagospodarowana: `odrzucony: wycinka poza priorytetami tego przebiegu (etap bez wyrab)`, powstają farmy na rzece. (iii) ON, rzeka zagospodarowana: `wybrany: E2 wycinka (rzeka+las)`, 11 heksów.
B E2 wycinka+farma:
- las poza rzeką, wycinka potem farma: ZGODNE (U-5: 5 tur zwłoki).
- tartak/obóz na heksie przy rzece: ZGODNE (0).
- „las przy rzece NIE jest wycinany” (literalny dispatch): NIEZGODNE (las przy rzece wycinany t2→3 i obsadzony farmą). Tekst decyzji w `dyspozycje/WERSJE.md` (f7a69e12) mówi o tartaku i obozie, „E2 bez zmian”, więc dispatch prawdopodobnie przeinaczył decyzję. Czy kod ma defekt: NIE_ZMIERZONO, wymaga ABC u orkiestratora (U-1).
C E3 trzoda: ZGODNE (15 przy rzece, 0 poza, po farmie; kolejność farma → wycinka+farma → trzoda → irygacja).
D forty (rozbite):
- promienie posterunek 3 (37 hex) / fort 5 (91): ZGODNE.
- miasto ma pierwszeństwo przed fortem; `ownerAt` vs `territory.ts` (217 i 889 hex, 0 rozbieżności): ZGODNE.
- spór „wcześniejszy fort” między różnymi właścicielami: NIE_ZMIERZONO.
- „miasto przy granicy z wrogiem → fort”: NIEZGODNE (0 trafień `wojn|enemy|wrog` w `auto-improvements.ts`, U-4).
- profil zrównoważony, fort gracza: NIEZGODNE w 33 turach (U-2; bieg przerwany, `gate-D-fort-zrownowazone.txt` EXIT=INTERRUPTED-AFTER-T33; przyczyna NIE_ZMIERZONO).
- posterunek wewnątrz koła fortu (profil infrastruktura): NIEZGODNE (U-3).
E: ZGODNE. Bez `?civTest=1` (także `=0`, `=true`, `xcivTest=1`, puste) `__civTest === undefined`; 20 tur (1→21), 24 miasta AI, 0 błędów konsoli.
Hook `naRzece`: ZGODNY z pickerem (1440 porównań, 0 rozbieżności).

TESTY: żywe w Chromium; `gate-*.txt` z EXIT=0 (abc-off, abc-on, abc-on-zywnosc, D-infrastruktura, E-nohooks). Wyjątek: D-zrownowazone przerwany po t33 (EXIT=INTERRUPTED-AFTER-T33, pageErrors=[]). `node --check` 7 skryptów OK.
BLOKADY:
- Brak `dyspozycje/DECYZJE-WLASCICIELA-20261031-AUTOULEPSZENIA-FORTY.md` na `origin/main` (źródło decyzji #15–#19); użyto VERIFY-Q1. Werdykty D wobec #18–#19 są niepotwierdzone.
- Brzmienie decyzji właściciela o rzece/tartaku (U-1) niepotwierdzone.
Do decyzji orkiestratora: U-1, U-4, U-6 (OFF blokuje też rzekę).
RUNDY: 2/5 (po obronie)
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
