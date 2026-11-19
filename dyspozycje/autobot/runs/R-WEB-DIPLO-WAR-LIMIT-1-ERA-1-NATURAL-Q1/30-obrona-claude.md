# R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1
GOAL: maks. 1 wojna epoki + 1 naturalna per cywilizacja; za flagą domyślnie OFF (parytet).
BAZA: 9e84787f13e50439d5d91c19afe2fc9c4886fa01 (ancestor origin/main: TAK). Kandydat: f4a41b0aefdecc1cad9ee186e8aad8a275ecb74b.

ZMIANY-COMMIT (allowlista):
- gra/src/game/diplomacy-pn-engine.ts: PRZYWRÓCONY do bazy (zarzut 2, pole typWojny usunięte z DiploPairMeta; diff vs 9e84787 pusty).
- gra/src/game/diplomacy-war-limit.ts: getWarTypFromMeta, withWarTyp (typ w meta bez zmiany typu silnika; serializacja JSON zachowuje pole), collectWarTypes (barbarzyńcy, pomijany i pokój wykluczone).
- gra/src/main.ts: wpięcie przez withWarTyp/getWarTypFromMeta; warTypesForOwner przez collectWarTypes; limitWojenNaturalnaZablokowana dla AI (P4); typ dołączonej wojny gracza dziedziczony (zarzut 7).
- gra/src/game/ai.ts: pole limitWojenNaturalnaZablokowana w RelacjaWejscie + warunek w P4 (zarzut 1).
- gra/tools/diplomacy-war-concurrency-analyze.cjs: kubełek 0 wypełniany dla każdej cywilizacji z pary (zarzut 5).
- gra/tools/diplomacy-war-limit-unit-test.cjs (48/0), gra/tools/diplomacy-war-limit-analyze-test.cjs (17/0).
- dowód biegu: smoke-seed4242-harder1.jsonl, smoke-seed4242-harder1.summary.json w tym katalogu.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. ai.ts P4 (naturalna) ma teraz warunek `!rel.limitWojenNaturalnaZablokowana`; main.ts liczy go warLimitPermits. Kaskada sojusznicza i wojna epoki bramkowane w main.ts (applyAllianceObligationsOnWar, warLimitAllowsDeclaration). alliance-war-obligation.ts nie zmieniany: bramka jest w main.ts. Flaga OFF -> pole false -> parytet.
2. PRZYJMUJĘ. Pole usunięte z pn-engine; typ w meta przez withWarTyp (typ `{...meta, typWojny}` rzutowany na DiploPairMeta; zapis/odczyt JSON zachowuje pole).
3. PRZYJMUJĘ CZĘŚCIOWO. Dodane testy: barbarzyńca, pomijany, pokój, państwo-miasto, mieszany zestaw, JSON round-trip. Mutacja kopii (usunięty filtr barbarzyńców): 3 FAIL, przywrócone, 48/0. NIE_ZMIERZONO: gracz jako deklarujący i kaskada sojusznicza w main.ts (brak przeglądarkowego testu jednostkowego).
4. PRZYJMUJĘ, wykonane. Smoke: seed 4242, 40 tur, harder=1, war-limit ON (hak setWarLimitEnabled przez kopię runnera poza repo), --every 5, 181 s, stop=null, 0 wystąpień error/NaN/exception w logu. Analizator: wiersze 8, maks. wojen na cywilizację 1, epoki 1, naturalnych 1, tury z >1 wojną: brak. Ograniczenia: 1 ziarno, bez porównania z OFF, wojny pojawiły się dopiero w t40 (3 wojny), pary bez państw-miast.
5. PRZYJMUJĘ kubełek 0 (naprawione, test sprawdza wpis 0). ODRZUCAM zmianę runnera: pomiar wyklucza państwa-miasta celowo (isCityStateOwner, zakres poprzedniej rundy pomiaru); wojny państw-miast nie są widoczne w pomiarze. To zmiana semantyki pomiaru -> ABC.
6. ODRZUCAM zmianę kodu, PYTANIE ABC. Bramka epoki (main.ts ~46662) liczy wojny gracza jako OBROŃCY, gdy celem AI jest gracz. Zgodnie z regułą limit dotyczy każdej cywilizacji, a wolny jest tylko deklarujący gracz; więc zablokowanie wojny epoki wobec gracza z aktywną wojną epoki wynika z reguły, nie z błędu. Dispatch każe też „zachować wyjątki wymuszenia dla gracza jako celu”, co jest sprzeczne. Właściciel musi rozstrzygnąć.
7. PRZYJMUJĘ (zrobione w tej rundzie). Dołączona wojna gracza dostaje typ z getWarTypFromMeta(pary źródłowej).

TESTY (surowe wyniki):
- `npx tsc --noEmit -p gra/tsconfig.json`: exit 0.
- diplomacy-war-limit-unit-test: pass=48 fail=0.
- diplomacy-war-limit-analyze-test: pass=17 fail=0.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass 0 fail; research-test: 33/0; combat-test: 6/6; diplomacy-test: 149 passed 0 failed; diplomacy-alliance-strength-unit-test: 33 OK 0 FAIL; diplomacy-zero-trust-unit-test: PASS=43 FAIL=0 (dispatch podaje 45; NIE_ZMIERZONO rozbieżności).
- vite build poza repo: built in 21.69s (exit 0).
- ai-ai-alliance-tick / coalition: NIE_ZMIERZONO w tej rundzie.

BLOKADY / NIE_ZMIERZONO:
- Państwa-miasta: pomiar ich nie obejmuje (zarzut 5), a limit w main.ts je liczy.
- Gracz jako deklarujący/kaskada sojusznicza: brak testu w przeglądarce.
- Wpływ limitu vs OFF na wojny: NIE_ZMIERZONO (1 ziarno, brak biegu OFF).
- Pytanie ABC: zarzut 6 (limit epoki wobec gracza jako celu).

RUNDY: 2/5
NASTĘPNY KROK: orkiestrator: (a) ABC do właściciela w zarzucie 6 i w zarzucie 5 (państwa-miasta w pomiarze); (b) Final Control r2.
DEPLOY/PUSH: NIE WYKONANO
