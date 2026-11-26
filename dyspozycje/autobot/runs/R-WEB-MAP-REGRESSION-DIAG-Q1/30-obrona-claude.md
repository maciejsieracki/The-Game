STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; zero zmian gra/src, gra/data, gra/tools)
TEMAT: R-WEB-MAP-REGRESSION-DIAG-Q1
GOAL: obrona diagnozy f0187548a wobec 7 zarzutów Evaluatora (37767b306): odpowiedź na każdy zarzut, dodatkowe pomiary dla mechanizmu i proponowanej poprawki.
ZMIANY/COMMIT: allowlista: dyspozycje/analizy/MAPREGDIAG-2026-11-26.md (sekcja Obrona + poprawka literówki), dyspozycje/analizy/map-regression-diag/def-results.tsv, dyspozycje/analizy/map-regression-diag/measure-def.cjs, dyspozycje/autobot/runs/R-WEB-MAP-REGRESSION-DIAG-Q1/30-obrona-claude.md. Commit: SHA w polu sha (tylko te ścieżki).
TESTY (surowe liczby z wyjścia measure-def.cjs, kandydat f781bbd0a w kopii poza repo, rivers=high):
- 777/high/wyspy, MAPFIX: orphanCount 10, samotne lądy 0, heksy rzeki zamienione w morze 3 (50,16; 92,19; 35,32).
- 777/high/wyspy, wariant V1 (purge pomija heksy rzek): orphanCount 0, samotne lądy 3.
- 7/high/wyspy, MAPFIX: orphanCount 18, samotne lądy 0, heksy rzeki zamienione w morze 1 (64,32).
- 7/high/wyspy, wariant V1: orphanCount 0, samotne lądy 1.
- git grep origin/main: generator.ts:743 `purgeOpenOceanLandSpecks(hexes);` oraz :463 — wywołanie w main.
- Nie uruchamiano npm/tsc ani pełnej bramki map-gen (zmian kodu brak).
BLOKADY:
- NIE ZMIERZONO: wariant „purge przed ensureRiverOutlets”; samotne lądy dla przypadków medium; sekcje A, C, D, E w tej rundzie (wnioski z pierwszego przebiegu).
- Kod poprawki poza allowlistą — nie wdrożony.
ODPOWIEDZI NA ZARZUTY:
1. (mechanizm na poziomie heksu) PRZYJMUJĘ, częściowo domknięte: purge zamienił 3 i 1 heks rzeki (klucze w TESTY). Sąsiedztwo osieroconych segmentów nie śledzone.
2. (poprawka nie zmierzona) PRZYJMUJĘ i zmierzone: pominięcie heksów rzek zeruje osierocone, ale zostawia 3 i 1 samotne lądy — łamie cel MAPFIX „0 samotnych lądów”. Wariant przed ensureRiverOutlets NIE ZMIERZONO.
3. (brak metryki samotnych lądów) PRZYJMUJĘ, uzupełnione dla 2 przypadków high; medium NIE ZMIERZONO.
4. (stan main) PRZYJMUJĘ jako fakt: purge jest w origin/main (generator.ts 743 i 463). Decyzja o MAPFIX należy do orkiestratora; ta diagnoza nie zmienia kodu.
5. (baza kandydata 1bb77a7a0) PRZYJMUJĘ: różnice w gra/src/map to 3 pliki MAPFIX, porównanie generatora czyste.
6. (powtórzenie pomiarów) PRZYJMUJĘ jako ograniczenie: 6 przypadków NOWYCH powtórzonych (cand-repeat.tsv, identycznie); w obronie 777/high i 7/high powtórzone (identycznie). Sekcje A, C, D, E nie powtórzone — NIE ZMIERZONO.
7. (kosmetyka) PRZYJMUJĘ: literówka poprawiona; pliki .entry-*/.bundle-* nie są śledzone, nie wchodzą do commita.
RUNDY: 1/5 (obrona). Werdykt FC: nie wydaje Operator.
NASTĘPNY KROK: orkiestrator/FC: MAPFIX nie wdrażać bez poprawki purge i pomiaru (sekcja B medium+high oraz samotne lądy łącznie); osobny temat na wariant „purge przed ensureRiverOutlets” z tą samą miarą.
UWAGI-DLA-ORKIESTRATORA: wywołanie purge z MAPFIX jest już w origin/main (743, 463) — wymaga decyzji: wycofać, poprawić, czy zaakceptować ryzyko dla map „wyspy”. Pomiar pokazuje, że prosta poprawka (pominięcie rzek) przenosi błąd z osieroconych rzek na samotne lądy.
DEPLOY/PUSH: NIE WYKONANO
