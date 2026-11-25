# R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1 — obrona Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar + hak testowy civTest)
TEMAT: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1
GOAL: odpowiedź na zarzuty Evaluatora 065ce3c8 (7 pozycji) na kandydacie a4d3d43d4; poprawki tylko tam, gdzie da się je zrobić bez nowych długich biegów.

## Odpowiedzi na zarzuty
1. FORTRING wpływ pierścienia NIE ZMIERZONO (fortCount=0): PRZYJMUJĘ. Nie dodano hooka stawiającego fort (istniejący hook `__fortTerritoryTestDebug.placeFort` nie był w tej rundzie podpięty do runnera). Nie naprawiono w tej rundzie. Werdykt przełącznika w dokumencie zmieniono na „DZIAŁA (kod + test źródłowy); RUNTIME NIE ZMIERZONO”.
2. Brak jednego biegu ciągłego na wariant: PRZYJMUJĘ. Nie naprawiono w tej rundzie (60 tur ~ 12 s/turę mediany, dwa biegi ciągłe wymagają setsid nohup timeout 1800 + Monitor; nie uruchomiono). Dane z biegów dzielonych pozostają w dokumencie jako nieinterpretowalne dla skrótów t30/t60 i różnicy median.
3. Brak testu gate „ON identyczny z bazą po 30 turach” (fortCount + hash): PRZYJMUJĘ. Nie wykonano porównania z biegiem na 3ae80b02a. Dowód zerowej zmiany bez civTest pozostaje statyczny: `fortRingBuildBlockReason` przy braku własnego fortu zwraca null, a bramka w main.ts sprawdza `civTestFortRingOffFlag()`.
4. Round-trip ON „NIE DZIAŁA” niedowiedziony: PRZYJMUJĘ i poprawiono wniosek w dokumencie: wiersz i pozycja 1 w „Zgłoszenia” mają teraz „NIE ZWERYFIKOWANE jako błąd” (jedna różnica w cityProd w jednym biegu ON, brak powtórki, możliwy niedeterminizm lub wpływ wznowień). Powtórki nie wykonano.
5. FLEEMANUAL bitwy >5 tur i animacja NIE ZMIERZONO: PRZYJMUJĘ. Nie podjęto próby skrócenia scenariusza ani hooka animacji w tej rundzie. Dokument zachowuje NIE ZMIERZONO z powodem.
6. territory.ts: blok `civTestFortRingOff` + setter rozrywał JSDoc `fortRingBuildBlockReason`: PRZYJMUJĘ i POPRAWIONO. Blok przeniesiono nad komentarz JSDoc; funkcja `fortRingBuildBlockReason` ma znowu swoją dokumentację bezpośrednio przed sobą. Zmiana wyłącznie przestawienie kolejności (zero zmiany logiki).
7. Werdykt „DZIAŁA” przy braku efektu runtime: PRZYJMUJĘ i POPRAWIONO w dokumencie (patrz pkt 1).

## ZMIANY/COMMIT
- gra/src/map/territory.ts: przestawienie bloku civTestFortRingOff nad JSDoc fortRingBuildBlockReason (zmiana kolejności, bez zmiany logiki).
- dyspozycje/analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md: wiersze FORTRING (przełącznik, round-trip), pozycja 1 zgłoszeń.
- dyspozycje/autobot/runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/30-obrona-claude.md (ten raport).
- Commit: SHA w polu sha z StructuredOutput (czubek tej gałęzi po commicie).

## TESTY (surowe wyjście, na czubku po poprawkach)
- `gra/`: `npx tsc --noEmit` exit 0 (node_modules zainstalowane przez `npm ci` w worktree, bez `npm run build`).
- `node tools/fortring-civtest-hook-test.cjs`: 8 PASS, 0 FAIL.
- Pełny zestaw bramek z dodatku (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0, hotseat-etap6d-source 77/0, bramki-tmpdir): NIE_URUCHOMIONO w tej rundzie (poprawka dotyczy tylko kolejności komentarza i dokumentu; logika nietknięta). Evaluator zmierzył je na a4d3d43d4 (surowe wyniki w 20-evaluator-claude.md). Orkiestrator powinien je powtórzyć na czubku przed FC.

## BLOKADY
- Zarzuty 1, 2, 3, 5 wymagają długich biegów w przeglądarce (ON/OFF ciągłe 60 tur, test gate vs baza, odwrót na dłuższej bitwie). Brak blokady technicznej zgłoszonej do Evaluatora, ale czas wykonania przekracza jedno wywołanie Bash (590 s) i wymaga procesu w tle poza tym Operatorem. Nie wykonano w tej rundzie.

## UWAGI-DLA-ORKIESTRATORA
- W worktree brak node_modules; `npx tsc` bez lokalnych zależności pobrał nowszą wersję TypeScript i zwrócił błąd TS5101 (baseUrl). Po `npm ci` w gra/ wynik exit 0.
- Zarzuty 1–3 i 5 zostają otwarte: runda 3 nie zamyka binarnego kryterium „dokument z tabelą i werdyktem dla FORTRING (ON/OFF, wydajność, round-trip)” w części runtime. Sugerowany zakres rundy 4: hak placeFort pod civTest + bieg ciągły ON/OFF 60 tur przez setsid nohup + test gate t30 vs baza 3ae80b02a + powtórka round-trip bez wznowień.

RUNDY: 3/5 (runda 2 zakończona ocenę FAIL, zarzuty 1–7 zaadresowane wg pkt powyżej)
NASTĘPNY KROK: Evaluator r3 (weryfikacja pkt 4, 6, 7 w dokumencie i kodzie; pkt 1–3, 5 jako otwarte z powodem) → Final Control.
DEPLOY/PUSH: NIE WYKONANO
