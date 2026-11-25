STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D1 (kategoria D, połowa 1/2) — runda obrony 2 (odpowiedź na zarzuty Evaluatora fd4955d10)
GOAL: odpowiedzieć na KAŻDY zarzut (PRZYJMUJĘ z poprawką albo ODRZUCAM z dowodem); asercje nie osłabione; bramki zielone.

BAZA: e6f546deebf4988fb56a02810dba455ca8290a40 (kandydat rundy 1; baza kodu f96787fb70da4086f9b25487cc4b6c62a2127610).
ZMIANY-COMMIT: e20d52753 (3 pliki testów: ai-city-render-batch-test.cjs, ai-jednostki-tylko-zakup-test.cjs, ai-march-avoid-foreign-territory-test.cjs). Ten raport: commit następny po e20d527; czubek pracy = pole `sha` w StructuredOutput. Zero zmian w gra/src, gra/data (src/main.ts przywracany z kopii po mutacjach, `git status` czysty).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — ai-jednostki-tylko-zakup C4 (okno {0,900} → {0,2000}): PRZYJMUJĘ, poprawione
- Okno regexu NIE jest już poszerzane. Zamiast tego wycinam dokładnie gałąź `} else if (item.kind === 'jednostka') {` (jest dokładnie jedna) do jej zamykającego `\n                  }\n` i wymagam `shouldAIPurchaseUnit(` WEWNĄTRZ tej gałęzi.
- Dowód lokalności: bramka leży 1615 znaków od kotwicy, ale w tej samej gałęzi; sprawdzone, że `shouldAIPurchaseUnit(` wypada w zakresie gałęzi.
- Mutacja (zmiana nazwy wywołania bramki w gałęzi `shouldAIPurchaseUnitX({`, src/main.ts tymczasowo, przywrócone): `FAIL: C4: egzekutor build AI kieruje ...`, `44 passed, 1 failed`, exit 1. Test czerwony, dowód działa.
- Wynik po zmianie: `ai-jednostki-tylko-zakup-test: 45 passed, 0 failed` (exit 0).

### Zarzut 2 — ai-city-render-batch (okno od aiStart zamiast barbStart-700 szersze; mutacja tylko dla wiersza 7): PRZYJMUJĘ, poprawione
- Okno liczbowe usunięte. Teraz: `catchStart = mainSource.lastIndexOf("} catch (eAILoop) {", barbStart)`, czyli NAJBLIŻSZY catch przed granicą barbarzyńców; wymagane `catchStart > aiStart`. Jedyny catch(eAILoop) w main.ts jest na tej pozycji (sprawdzone: count 1), więc nie ma dowolności wyboru.
- Mutacja własna (usunięcie `flushAiCityRenderBatch();` z tego catch, src/main.ts tymczasowo, przywrócone z kopii): `AssertionError [ERR_ASSERTION]: dirty city models flush after AI completion/errors before barbarian UI paint`, exit 1. Czerwone.
- Wynik po zmianie: `ai-city-render-batch: 17 assertions passed` (exit 0).

### Zarzut 3 — ai-march C7 (M_REQ_WAR poszerzona o MUT_REQ, zmiana sensu): PRZYJMUJĘ, doprecyzowane
- Zmierzone w rundzie 1: sama MUT_REQ_WAR (ai.ts ~l.1129, requestWarMarchPassage) zostawia 1 prośbę (got 1), bo drugie źródło no-route to ogon guardedMarchPath (ai.ts ~l.1134), wspólny dla wojny i pokoju. Bez sumy obu mutacji asercja C7 nie dowodzi niczego.
- Dlatego świadomie zostaje SUMA (`[MUT_REQ_WAR, MUT_REQ]`), a KOMUNIKAT i komentarz zmienione tak, by twierdziły dokładnie to, co mierzą: „wszystkie prośby no-route w wojnie znikają" (nie „tylko wojenna"). Asercja `requests.length === 0` NIE zmieniona.
- Wynik: `ai-march-avoid-foreign-territory-test: 99 passed, 0 failed` (exit 0).

### Zarzut 4 — raport bez SHA w treści: PRZYJMUJĘ
- SHA poprawek testów: e20d52753. SHA bazy kandydata: e6f546dee. Czubek tej pracy (commit raportu) podaje się w polu `sha` oraz w `git log -1` gałęzi worktree.

### Zarzut 5 — 9 czerwonych testów bez niezależnego surowego dowodu i bez sprawdzenia kolejności wierszy D: PRZYJMUJĘ, sprawdzone i powtórzone solo
Kolejność: w tabeli 43-stan-156-r5.md (origin/main, sekcja kat. D) wiersze D to: 1 administracja, 2 ai-army, 3 ai-balans, 4 ai-city-render, 5 ai-home-war, 6 ai-jednostki, 7 ai-march, 8 ai-move, 9 ai-praca, 10 ai4-popyt, 11 ambush, 12 autoimprove, 13 battle-manual, 14 bramki-tmpdir, 15 budynki, 16 building-detail, 17 city-state, 18 citypanel, 19 civ-matrix-greece, 20 climate-band (POMINIĘTY wg dispatchu), 21 cluster-plan-name, 22 commander-star, 23 conquest, 24 culture, 25 currency, 26 drewno-gate. Zestaw runda 1 = wiersze 1–19 i 21–26 = 25 testów. ZGODNE z dispatchem. Dyplo-karta/pakt/egypt/eliminacja to wiersze 27+ (poza połową).

Surowe wyniki solo na e20d527 (przed poprawkami rundy 2 — te 9 testów nie zostały zmienione w rundzie 2):
| # | test | surowy wynik (exit 1) |
|---|---|---|
| 2 | ai-army-replacement-concentration-test | `FAIL: pomiar: bez bramki >10% marszow jednostek ze skupiska < 3 (stan przed poprawka)`; `34 passed, 1 failed` |
| 8 | ai-move-full-range-test | `[FAIL] D2 udzial ruchow ... PO (19.7%) <= PRZED (18.8%) + 0,5 pp`; `ai-move-full-range: 19 passed, 1 failed` |
| 10 | ai4-popyt-obywatele-test | `38 passed, 17 failed`; czerwone: Z1h/infrastruktura, Z2d (warzelnia soli, zloze 12,7), Z2e–Z2h, Q2a–Q2n (przełączniki usunięte 2026-11-04) |
| 12 | autoimprove-pasture-irrigation-q2-test | `[FAIL] (e) faza wzrostu (24 tury): 0 tur z glodzona trzoda/irygacja (starved=3)`; `(e) pierwsza irygacja w turze 27 (<=6)`; `(e) w turze 24 ... brak: 4`; `WYNIK: 14 OK / 3 FAIL` |
| 14 | bramki-tmpdir-unikalnosc-test | `FAIL zadna bramka ... 171 trafien`; `PASS=2 FAIL=1` (higiena, poza kategoriami) |
| 16 | building-detail-card-entitycard-migration-test | `52 pass, 3 fail` (Praca (jednorazowo) / Przyrost za poziom / brak playerFacingNote) |
| 17 | city-state-alliance-test | `strong: wrog dist=2 <= threatRadius=2 ... (got 1, want 2)`; `73 passed, 1 failed` |
| 19 | civ-matrix-greece-test | `PASS 323; FAIL 6`: aggression 0.75 vs 0.8 (x2), `decideAIDiplomacy war = undefined` na easy/normal, `forwards Easy/Normal/Hard to the stance decision path` |
| 20 | cluster-plan-name-test | `2 passed, 4 failed`: `rzymianie: seed 202 has a rejected slot`, `inkowie: seed 202 has a rejected slot` |

Uwaga: to są wyniki z tej samej bazy co runda 1 (bez zmian kodu w tych 9 testach), zgodne z tabelą operatora rundy 1.

## Mutacje i weryfikacja (surowe)
- C4 jednostki: czerwone (wynik wyżej).
- catch city-render: czerwone (wynik wyżej).
- C7 march: suma mutacji → `requests.length === 0` (zachowana asercja); sama MUT_REQ_WAR → got 1 (runda 1).

## Bramki
Bramki z dispatchu (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, era-war, ai-ai-alliance) były uruchomione w rundzie 1 na e6f546de (wyniki w 10-operator-claude.md). Runda 2 zmienia WYŁĄCZNIE trzy pliki testów, które NIE są bramkami i nie są importowane przez bramki. NIE PONOWIONO pełnego zestawu bramek w tej rundzie (NIE ZMIERZONO na e20d527) — orkiestrator może je uruchomić przy integracji.

## UWAGI-DLA-ORKIESTRATORA
Bez zmian względem rundy 1 (kandydaci R-WEB-*, nienaprawiane — zakaz zmian gra/src): UWAGI-1 (karta budynku), UWAGI-2 (agresja Rzymian / wojna easy/normal), UWAGI-3 (ai4-popyt: Q2/Z2e–h to STARY-PIN ~20 asercji; Z1h/Z2d możliwe BŁĘDY-GRY), UWAGI-4 (pastwisko faza wzrostu, starved=3, możliwy BŁĄD-GRY), UWAGI-5 (city-state drugi strażnik), UWAGI-6/9 (progi pomiarowe — decyzja ABC), UWAGI-7 (bramki-tmpdir 171 trafień), UWAGI-8 (cluster-plan seed 202, do zbadania po POLAR A1).

## RUNDY
2/5 (ta runda obrony). Poprawki: 3 pliki testów (HARNESS), brak zmian w gra/src i gra/data.

## NASTĘPNY KROK
Evaluator: zweryfikować poprawki w 3 plikach (e20d527) i surowe wyniki powyżej; Final Control po zaakceptowaniu. Bramki pełne do uruchomienia przy integracji (NIE ZMIERZONO na tej rundzie).

DEPLOY/PUSH: NIE WYKONANO
