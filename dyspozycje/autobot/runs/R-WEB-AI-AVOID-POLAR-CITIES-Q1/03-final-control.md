STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-AVOID-POLAR-CITIES-Q1
GOAL: AI (stolice, MP, osadnicy) nie zaklada miast na heksie polarnym i unika jego sasiedztwa; gracz nie jest ograniczany.
ZMIANY/COMMIT: ocena 6981e6ab4 (baza 56c4552d9 -> 50edcc264). Allowlista OK (ai.ts, clusters.ts, ai-params.json, 4 testy ai-avoid-polar-*, runs/**). Brak gra-robocza/WERSJE/rust-port.

WERDYKTY ZARZUTOW
1. Start gracza zmieniony: ODDAL (naprawione w obronie). Fixture parity zweryfikowany samodzielnie: baza 50edcc264 daje 30/30 = fixture; HEAD daje 28/30, maxDist 10 (wyspy1001 d=1, wyspy3333 d=10). Dwa przesuniecia to efekt uboczny zejscia stolic AI z polarnych (bramka separacji gracza); przyczyna hipoteza. Zaakceptowane, opisane.
2. Brak pomiaru tury 100: ODDAL. Nazwa/opis testu sim poprawione; kryterium NIE_ZMIERZONO (harness nie zaklada miast w turze 100); proxy -0,6% miast AI.
3. hexCityScore (diakrytyki vs id): ODDAL, poza allowlista. DO DECYZJI WLASCICIELA / osobny temat (zmienia tempo ekspansji AI).
4. Sasiedztwo polarne r<=1: ODDAL. Cel to kara, nie zero; dowod alternatywy 26/26 slaby, twierdzenie o twardych bramkach NIE_ZMIERZONO.
5. pickBonusCityHex: ODDAL, osobny mini-temat.
Zero NAPRAW -> PASS-WITH-NOTES.

TESTY (wlasne, na 6981e6ab4)
- tsc --noEmit EXIT=0 (npm ci --ignore-scripts; node_modules usuniete).
- ai-avoid-polar-pick 16/16; player-parity 28/30 PASS (baza 30/30).
- ai-avoid-polar-plan: AI/MP onPolar=0, r<=1=12, r<=2=18 (SUMA 224 miejsc).
- Mutacja (wylaczony filtr Polarny + bramka kapitalu): plan-test FAIL, onPolar=8; po przywroceniu PASS.
- capital-sep-pangea 3/3, capital-sep-unit 36/36, mp-spawn-ration 16/16, cluster-spread 5/5, cluster-plan-name 6/6, cluster-start-recovery2 29/29, cluster-start-q2-smoke 16/16, capital-capture 107/107.
- civ-matrix-ai-diplomacy-wiring 42/1 (znane czerwone w bazie); civ-matrix-greece 327/2 identycznie na bazie 50edcc264.
- NIE_ZMIERZONO: pelny regres 61 ai-*, cluster-start-test (>580 s), testy przegladarkowe, sim-test po obronie (z raportu Obrony: 3822 miast, 0 polarnych).

BLOKADY: brak technicznych. DECYZJA_WYMAGANA (wlasciciel): hexCityScore; pickBonusCityHex.
RUNDY: 3/5 (r1, obrona, FC)
NASTEPNY KROK: integracja orkiestratora. Kod = 6981e6ab4; commit FC dodaje tylko 03-final-control.md. Pliki rozlaczne z rust-port/, wiec kolejnosc wzgledem origin/rust-port/parity-v2 dowolna; zalecane po parity-v2.
DEPLOY/PUSH: NIE WYKONANO
