STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — AI
TEMAT: R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1
GOAL: Kazda cywilizacja AI zbiera armie w jednym miejscu, takze armie zastepcza po stratach.

ZMIANY/COMMIT: oceniany kod a4aa1f027 (r2; baza b89ecee44). Kod: gra/src/game/ai.ts, gra/src/game/army-concentration.ts, gra/tools/ai-army-replacement-{concentration-test,sim,aggregate}.cjs + dyspozycje/**. Allowlista czysta (zero gra-robocza, WERSJE.md, rust-port, ai-params.json, warAllInCapital.ts). Ten raport: commit dokumentacyjny nad a4aa1f027.

WERDYKT PER ZARZUT (Evaluator R1):
1. Pangea / merge_radius: ODDAL (czesciowo DO DECYZJI). Pomiar sparowany 8 ziaren: klastry i promien fali 1 bez istotnej zmiany (CI zawieraja 0); marsz ponizej progu spada 0.412->0.275 (CI [-0.259,-0.014]). Jedyny istotny koszt: udzial tur z armiami > liczba wojen +0.078 [0.020,0.136] (fala 1, pangea). Usuniecie wymaga zmiany poza allowlista (war-allin-params merge_radius / warAllInCapital.ts) -> osobny temat, decyzja orkiestratora; nie blokuje.
2. Pominiete pogorszenia / brak usrednienia: ODDAL. pomiar-r2-per-ziarno.txt: srednie, roznice sparowane z CI, ziarna gorsze/lepsze. Flat fala 2+ (cel poprawki) istotnie lepsza (klastry -0.58, promien -0.90, marsz ponizej progu 0.21->0.044). Fala 1 flat: trend niekorzystny, CI zawieraja 0.
3. Zastoj: ODDAL (naprawione). MAX_WAIT_TURNS=6, MAX_LOOSE_TURNS=30, lepkie zwolnienie; testy S3/S4a/S4b. Kod przeczytany: licznik biegnie tylko gdy wszystkie luzne stoja w miescie zbiorki; stan czyszczony po dolaczeniu do skupiska >=3. no-move|city-waiting to zamierzone, ograniczone czekanie.
4. Pomiar per cywilizacja/archetyp: ODDAL. Per civ 1-4 jest. Archetypy i pelne gry w przegladarce: NIE_ZMIERZONO (harness: civType grecy, atrapy rekrutacji/walki) — jawnie zadeklarowane, nie blokuje.
5. Marsz par/samotnych po poprawce: ODDAL. Przyczyny zidentyfikowane (zwolnienie limitem, fallback braku trasy); fallback pokryty testem S5. Reszta NIE_ZMIERZONO, jawnie.
6. Lamliwosc mutacji: ODDAL. Podmiana GATE_ON rzuca jawny blad, gdy linia sie zmieni (nie cicha zielona mutacja); dowod zachowaniowy: mutacja lamie S1/S2, pomiar 0.025 vs 0.124. Asercja na metryki pierwszej armii bylaby niestabilna (szum).
Zero NAPRAW -> PASS.

TESTY (zweryfikowane samodzielnie na a4aa1f027):
- tsc --noEmit: EXIT=0
- ai-army-replacement-concentration-test: 34/34, EXIT=0 (pomiar 0.025 vs 0.124 bez bramki; ms/tura 21.0 vs 19.0)
- army-concentration-test 56/0; ai-general-war-campaign-test 51/0; army-consolidation-e2e 6/0
- war-allin-capital-test 94/4 i ai-siege-requires-war-test 47/1: identycznie z ai.ts z b89ecee44 (czerwone na bazie, nie regresja)
- Pelnych 134 plikow regresji nie powtarzalem (gate-regresja Operatora: zero nowych czerwonych) — nie zweryfikowane.

BLOKADY: brak technicznych. Uwagi do orkiestratora: (a) decyzja o merge_radius / armies>wars na pangea (osobny temat, poza allowlista); (b) merge z rownoleglymi tematami na ai.ts (zmiana ograniczona do applyWarAllInCapitalToCommands + import + wywolanie); (c) stan oczekiwania w Map na poziomie modulu (reset: resetReplacementRallyState), wpisy czyszczone gdy jednostka przestaje byc luzna.

INTEGRACJA: SHA do integracji = a4aa1f027 (kod) + commit tego raportu nad nim; do galezi webowej. Wzgledem origin/rust-port/parity-v2: niezalezne (tylko gra/src i gra/tools, zero rust-port), kolejnosc dowolna; po wdrozeniu weba rozwazyc REPIN parytetu AI w Rust jako osobny temat.

RUNDY: FC 1 (po R1 Evaluator + obrona r2)
NASTEPNY KROK: integracja orkiestratora -> READY_FOR_DEPLOY (wystawia tylko orkiestrator)
DEPLOY/PUSH: NIE WYKONANO
