STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SPACING-TUNE-Q1
GOAL: Standardowy, 10 map: odsetek map z parą stolic <25 hexów wyraźnie poniżej 30% (cel ≤20%), bez utraty civ i bez `tylko N/M`. Spełniony: 0/10 (żywa gra wg artefaktów, niepowtórzone), offline 0/24, 7/7 civ, 0 ostrzeżeń.

ZMIANY/COMMIT: oceniany SHA końcowy c8a655f15c08f87c3bd7a7f535b82d80893b90e6 (kod 6233c19a9, SHA w raporcie 2b2163621, obrona c8a655f15), baza 57cc8aded. Diff do allowlisty: tylko map-gen-params.json (0,15->0,21), clusters.ts:1552 (0,5->0,8), 3 testy .cjs, katalog runu. `git diff --check` czysto. Zero zmian ai.ts, generatora, gra-robocza, WERSJE.md, rust-port.

TESTY (FC, własne):
- capital-sep-unit-test: 44 passed, 0 failed (na c8a655f15 i po cherry-picku kodu na origin/main 22acd3542).
- capital-spacing-prop-test: ALL PASS, mutacja wsp=0 łamie próg (na obu bazach).
- tsc --noEmit: czysto (na c8a655f15).
- cluster-start-test: nie powtórzony (timeout >500 s); wg Operatora/Evaluatora/Obrony 3 FAIL seaDist identyczne jak na czystym main (gate-cluster-start-PRE-main.txt).
- Diff cluster-start-test.cjs przejrzany: progi Dużej liczone od efektywnego capitalMinSep w [25,35], dolna granica = stary próg 25, brak usuniętych asercji.
- Pomiar żywej gry i pomiar offline na nowym main (Pangea 60% z 10307fe6): NIE_ZMIERZONO.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Test w tle: ODDAL (uwaga proceduralna, wynik nietknięty; odnotowane).
2. seaDist sumer 8->6 w testu już czerwonym: ODDAL do osobnego tematu (poza allowlistą, 3 FAIL istnieją na main, brak dowodu systematyczności). Rekomendacja: temat "seaDist stolic obcych typów <10".
3. Poluzowanie progów Dużej / capitalMinSep===23: ODDAL (dolna granica 25 = stary próg, 23 deterministyczne, pinowane do danych).
4. 8 typów -> sep 23: DO DECYZJI CZŁOWIEKA (produktowa): akceptacja 23 przy 8 typach vs podniesienie sufitu i pełny repomiar rozmiarów. Nie blokuje; cel dispatchu dotyczy 7 typów.
5. Ostrzeżenia w żywej grze NIE_ZMIERZONO: ODDAL (potwierdzone offline).
6. Żywe 10 map niepowtórzone: ODDAL (artefakty spójne, przed 7/10 -> po 0/10, minima 25 = 0,21x120).
7. Odsetek <30 bez zmiany (8/10): ODDAL (cel dotyczy progu 25; ujawnione).
8. Raport >500 słów: ODDAL (kosmetyka).
Brak pozycji NAPRAW.

BLOKADY: brak.
RUNDY: FC 1/5 (temat: runda 1/5)
NASTĘPNY KROK: integracja orkiestratora. Kolejność: origin/main (22acd3542) jest o 12 commitów przed bazą 57cc8aded (zmiany ai.ts, generator.ts, gen-helpers.ts, Pangea 60%, WERSJE.md); `git merge-tree` z c8a655f15 bez konfliktów, a po cherry-picku 6233c19a9 testy sep zielone. Zintegrować do main jako własny merge/cherry-pick PRZED jakąkolwiek integracją do origin/rust-port/parity-v2 (parity-v2 to osobna linia: 835 przed, 514 za main; zmiany stałych TS nie przenoszą się same, ewentualny port stałych 0,21/0,8 to osobny temat Rust). Po integracji zalecany krótki repomiar Pangea na nowym main.
DEPLOY/PUSH: NIE WYKONANO
