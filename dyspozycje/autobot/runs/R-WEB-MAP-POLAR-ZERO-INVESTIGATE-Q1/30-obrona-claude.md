STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza; kod gry i test NIE zmienione)
TEMAT: R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1
GOAL: ustalić, czy climate-band-test (0 heksów polarnych) to regresja generatora (A), stary pin testu (B), czy zamierzona zmiana (C); odpowiedzieć na zarzuty 1–6 Evaluatora.
ZMIANY/COMMIT: dyspozycje/analizy/MAP-POLAR-ZERO-2026-11-20.md (przepisany, werdykt A), dyspozycje/autobot/runs/R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1/30-obrona-claude.md. Baza kandydata: c611a62ea. Kod gry i test bez zmian. Eksperymenty przyczynowe (cofnięcie hunków, wyłączenie wywołania) wykonane lokalnie i cofnięte (`git checkout --`), NIE zacommitowane.
TESTY (surowe wyniki tej rundy):
- climate-band-test na `f776d4d60`: `climate-band-test: PASS` (rc=0)
- climate-band-test na `9c4320be0`: `climate-band-test: PASS` (rc=0)
- climate-band-test na `40a29e4c6`: `FAIL: map has polar terrain (0 hexes)` / `climate-band-test: FAIL (1)` (rc=1)
- diagnostyka generujSwiat seed 42 standardowy kontynenty: `9c4320be0` polar=81 (land 9473); `40a29e4c6` polar=0 (land 9820); `40a29e4c6` + wyłączone enforceTargetDryLandFraction: polar=0 (land 9009); `40a29e4c6` + cofnięte 3 hunki isDryLandTerrain: polar=81, polarRows identyczne z `9c4320be0` (land 10548)
- Bramki tsc/logic/tech-tree/research/unit-replace/combat: NIE PONOWIONO w tej rundzie — zmiana rundy 2 to wyłącznie dokumentacja; bramki z rundy 1 (tsc exit 0, LOGIC 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat exit 0) dotyczą kodu bazy a3651d373 i nie uległy zmianie w kodzie.
- Pełny relief-grid-coverage-test: NIE ZMIERZONO (rozstrzygnięte w rundzie 1 limitem czasu).
ODPOWIEDZI NA ZARZUTY:
1. Historia — PRZYJMUJĘ. Test wprowadzony w f776d4d60 (FALA 33; `git log -- gra/tools/climate-band-test.cjs`), PASS na f776d4d60 i 9c4320be0 (zmierzone). Moje „pojawia się w a99445016" było błędnym odczytem; w doc poprawione.
2. Commit przełomowy — PRZYJMUJĘ i ROZSTRZYGAM: pierwszy czerwony = 40a29e4c6 (FALA 142), rodzic 9c4320be0 zielony (oba zmierzone). Pozostałe commity z zestawienia Evaluatora (853c0e320, 6f96f0825, 6be6be373) NIE ZWERYFIKOWANE tutaj.
3. Mechanizm — PRZYJMUJĘ, hipoteza borderMargin ODRZUCONA. Zmierzone: borderMargin nie zmienił się w 40a29e4c6; w 40a29e4c6 ląd w wierszach 5–11 istnieje (Wybrzeże + pojedyncze Wzgórza/Góry). Przyczyna = trzy hunki `!== Morze` → `isDryLandTerrain` w applyLandFractionByScore (~l. 3132) i applyLandFractionByContinent (~l. 3206, ~l. 3229); cofnięcie ich przywraca polar=81 o identycznych wierszach. Wyłączenie enforceTargetDryLandFraction NIE przywraca polar → hunk 4 nie jest przyczyną. NIE ZMIERZONO dokładnego etapu, w którym ląd pasa znika.
4. Werdykt DECISION_REQUIRED/B — PRZYJMUJĘ, werdykt ZMIENIONY na A (zmiana zachowania generatora w 40a29e4c6; zamierzona semantyka land% ma efekt uboczny). Rekomendacja B WYCOFANA — nie osłabiam asercji. Opcje dla właściciela: A1 przywrócić ląd polarny dla kontynentów; A2 zaakceptować i zmienić asercję w osobnym temacie z decyzją; C zostawić czerwony.
5. Wniosek o żywej grze (tylko Pangea) — PRZYJMUJĘ, wycofany. Tabela seed×rozmiar z rundy 1 nie była powtórzona; potwierdzone tylko seed 42 kontynenty.
6. Dokument MAP-POLAR-ZERO-2026-11-20.md — PRZYJMUJĘ, przepisany (sekcje 2, 4, 5, 6, 7).
BLOKADY: decyzja właściciela (A1/A2/C) przed ewentualną naprawą; wynik `relief-grid-coverage-test` NIE ZMIERZONO; wyniki commitów 853c0e320/6f96f0825/6be6be373 NIE ZWERYFIKOWANE.
UWAGI-DLA-ORKIESTRATORA:
- Trzy hunki `isDryLandTerrain` w 40a29e4c6 zmieniają semantykę „land%" (Wybrzeże jako woda); jeśli właściciel wybierze A1, należy ocenić wpływ na hashe map i testy determinizmu (pangea-land-determinism-test).
- Plik `gra/tools/.climate-band-bundle.cjs` jest ŚLEDZONY w git (test go nadpisuje i daje `M` w statusie); przy każdym uruchomieniu testu trzeba go przywrócić lub nie commitować.
- Commit ewaluatora 49bccccda856 nie jest dostępny w tym klonie (fetch: "not our ref"); zarzuty odczytano z treści dispatchu.
RUNDY: 2/5 (runda 1: DECISION_REQUIRED/B; runda 2: werdykt A, zarzuty 1–6 przyjęte)
NASTĘPNY KROK: Evaluator weryfikuje werdykt A i zmierzone wyniki; orkiestrator przedstawia właścicielowi pytanie ABC A1/A2/C.
DEPLOY/PUSH: NIE WYKONANO
