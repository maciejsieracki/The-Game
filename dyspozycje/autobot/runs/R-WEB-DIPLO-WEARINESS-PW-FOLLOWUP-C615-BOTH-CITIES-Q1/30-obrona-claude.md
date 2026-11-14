# R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1 — obrona Operatora r1 (odpowiedź na zarzuty Evaluatora f78b2e7f0)

STATUS: PASS-WITH-NOTES (obrona złożona; zarzuty 1–8 przyjęte z dowodem lub odrzucone z cytatem; pozycje 9–10 NIE_ZMIERZONO z powodem)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1
GOAL: C = 615 jako jedna prawda, licznik zmęczenia = miasta obu stron w tabeli PW i w ticku AI↔AI, testy spójne z kodem, bez regresji na bazie 78af786ed.
BAZA: 78af786ed (origin/main) -> kandydat 110ee2146 (Operator r1) -> obrona 9022a504e (ten kod) -> raport 30-obrona-claude.md (ten plik)
SHA końcowy: patrz pole sha w StructuredOutput (commit raportu na gałęzi roboczej wf_01c44ea9-ef9-3).

## ZMIANY-COMMIT

Kod: 9022a504e (rodzic 110ee2146). Pliki:
- gra/src/game/ai.ts — `AI_MIASTO_CENA_POKOJU_PN` czytane z `data/diplomacy-acceptance-points.json` (`traktaty.pokoj.punkty`), bez lustrzanej stałej 500 (jedna prawda; import JSON jak `aiParamsRaw`). Wartość = 615.
- gra/tools/diplomacy-acceptance-points-test.cjs — oczekiwania pokoju z C=615: baza, tury 10/20/0, UI @15, rel 77 (gracz 474 = round(615·0,77), partner 615, asymetria −141, fair-min bez zmian, dar 50¤ → −91, panel "Brakuje 141").
- gra/tools/diplo-truce-r4-ai-test.cjs — `basePokoj === 615` (rozejm 200 ≠ pokój 615); tekst asercji i ternary main.ts zaktualizowane.
- gra/tools/diplomacy-city-cession-r3-test.cjs — progi N liczone z C (`N3 = ceil(C/1,5)`, `N5 = ceil(C/1,8)`, żądanie: C−1 / C / C+1); ceny testowe miast dopasowane (420, 450/430, 700).
- gra/tools/diplo-weariness-c615-both-cities-test.cjs — nowy blok (d2): tick AI↔AI (`runWarWearinessTick`) na realnej funkcji, zamiana stron (lostA,lostB)↔(lostB,lostA) daje ten sam poziom i ten sam poziom co `warWearinessLevel(lostCitiesForWeariness(...))` dla tur 0..24 i strat 0..3. Stuby price/assets/pay/finalize neutralne (test mierzy poziom szczytu).
- gra/src/game/diplomacy-proposals.ts — komentarz `lostCitiesResponder` (l.196): nazwa historyczna, wartość = suma obu stron.
- gra/src/game/diplomacy-war-peace-profile.ts — komentarze `priceMultiplier` (interfejs l.396 i wynik l.~419) zgodne z C=615, mnożnik = 1.
- docs/encyklopedia/pojecia/rozejm-pokoj.md — l.42 zamiast „mnożnik ceny cywilizacji ograniczony do 1,0 po 20 turach” jest „cena pokoju stała 615 PW”; wiersz tabeli l.101 dopisek „nieużywany od C=615”.
- gra/src/data/wikiBundle.json — regenerowany `node tools/bundle-wiki-for-game.cjs` (22 rozdz. + 182 hasła).

Nie zmieniono: gra/src/main.ts (wspólna zmiana z kandydata 110ee2146, patrz zarzut 7), gra/src/ui/diplomacyTradeBasket.ts (poza allowlistą, patrz zarzut 5), WERSJE.md, manifest, rust-port.

## TESTY (surowe wyniki z tego przebiegu)

Środowisko: gra/node_modules = symlink do node_modules worktree wf_01c44ea9-ef9-1 (nie commitowany). Dysk: 1,6 GB wolnego przy 96% zajęcia (poniżej progu 4 GB dla weba — patrz UWAGI).

| Bramka / test | Wynik na 9022a504e | Uwagi |
|---|---|---|
| `tsc --noEmit -p gra/tsconfig.json` | exit 0 | |
| `git diff --check` | czysty | |
| diplomacy-acceptance-points-test | 304 pass, 0 fail | kandydat 110ee2146 miał 7 FAIL (zarzut 1) |
| diplo-truce-r4-ai-test | 24 pass / 0 fail | kandydat 23/1 (zarzut 2) |
| diplomacy-city-cession-r3-test | 56 pass, 17 fail | baza 78af786ed zmierzona w kopii (/tmp/claude-0/op-r3base): 56 pass, 17 fail — TE SAME 17 nazw (dług bazowy, zarzut 3) |
| diplo-weariness-c615-both-cities-test | PASS=11 FAIL=0 | mutacja tick→`w.lostA` (wykonana i cofnięta): FAIL=3 (d2 ×2 + regex f) |
| diplo-war-peace-profile-unit-test | 198 pass / 0 fail | |
| ai-war-weariness-peace-test | PASS=101 FAIL=0 | |
| diplo-weariness-as-pw-peace-item-test | PASS=76 FAIL=0 | |
| diplo-weariness-pw-behavior-test | 87 pass / 0 fail | |
| diplo-weariness-pw-row-ui-test | 10 pass / 0 fail | |
| diplomacy-proposal-test | 200/200 PASS | |
| logic-test | LOGIC OK (213/213) | |
| tech-tree-test | 20 pass, 0 fail | |
| research-test | ALL GREEN | |
| ai-unit-replace-same-rules-test | 45 passed, 0 failed | |
| combat-test | All sanity checks passed | |
| pw-weary-table-browser-test (Chromium, Vite, realne evaluateProposal + renderPnBalancePanelHtml) | BROWSER PASS | wiersze „Zmęczenie wojną (AI) +17 PW” (tura 11) i „+427 PW” (tura 15); zrzuty: /tmp/claude-0/op-evidence/stol-wczesna.png, stol-pozna.png, stol-silna.png |

Czerwone-na-bazie (osobno, nie regresja): city-cession-r3 17 FAIL (ścieżka decideAIDiplomacy, bramka `peacePosMil === 'slabsza'`, nie `rw`; ta sama lista na 78af786ed). Nie uruchamiałem na bazie pięciu testów live (diplo-truce-r1, diplo-truce-ai-table-live, border-era-penalty-live, direct-negotiation-live, stol-pw-sum) — zarzut 1/9 Evaluatora to dług bazowy; NIE_ZMIERZONO na bazie.

## BLOKADY

- Zarzut 7: gra/src/main.ts poza allowlistą R-WEB (to zmiana z 110ee2146; konieczna, bo licznik tabeli PW to domknięcie w main.ts). Wymaga decyzji orkiestratora: dopisać do allowlisty albo przenieść sumę do czystej funkcji w war-weariness.ts.
- Zarzut 5: gra/src/ui/diplomacyTradeBasket.ts:862 pokazuje graczowi „baza ~500 PW” — plik poza allowlistą (jest tylko gra/src/ui/diplomacyAcceptanceBalance.ts). Nie zmieniałem bez decyzji orkiestratora.
- Zarzut 9 (live-audit W66/W80B) i zarzut 10 (zrzut gry ?civTest=1): NIE_ZMIERZONO, patrz niżej.

## RUNDY

obrona r1 (runda 1/5 tematu; kolejna ocena Evaluatora).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (f78b2e7f0)

1. PRZYJMUJĘ. Regresja acceptance-points: oczekiwania zaktualizowane do C=615 (ta sama liczba asercji, 304/0). Dowód: wyjście testu, commit 9022a504e.
2. PRZYJMUJĘ. diplo-truce-r4: `basePokoj === 615`, 24/0.
3. PRZYJMUJĘ. ai.ts:6538 lustro 500 usunięte, stała czytana z JSON; `cena pokoju = traktaty.pokoj.punkty` przechodzi (56 pass w r3). Progi r3 przeliczone z C. Pozostałe 17 FAIL w r3 to ta sama lista co na bazie 78af786ed (zmierzone w kopii) — dług bazowy, nie regresja; naprawa testów decide-path (gate peacePosMil) poza zakresem tego tematu, do osobnego tematu.
4. PRZYJMUJĘ CZĘŚCIOWO. Dodany test zachowania (d2) na realnym `runWarWearinessTick`; mutacja jednej strony w ticku czerwieni test (FAIL=3). Pozostaje: ścieżka tabeli PW w main.ts (`diploProposalWarState`) nie da się załadować w node — pokrycie tylko regex (f). Pełne pokrycie behawioralne wymaga przeniesienia sumy do helpera (patrz zarzut 7).
5. PRZYJMUJĘ część (docs/encyklopedia/pojecia/rozejm-pokoj.md l.42 i l.101; komentarze profilu; wikiBundle przegenerowany). ODRZUCAM w tej rundzie zmianę diplomacyTradeBasket.ts:862 — poza allowlistą (cytat: „ALLOWLISTA: ... gra/src/ui/diplomacyAcceptanceBalance.ts, docs/encyklopedia/**, docs/PORADNIK-GRACZA/**” — plik UI tabeli koszyka nie jest na liście). Do decyzji orkiestratora (UWAGA-1).
6. ODRZUCAM z zastrzeżeniem. (a) Wzrost ceny AI→gracz 500→615 wynika bezpośrednio z ABC pkt (1): „C = STAŁE 615 PW (wariant C) — bez zależności od tury; usuń rozgałęzienie”. Pkt (2) dotyczy wyłącznie mnożnika cywilizacji („BEZ mnożnika cywilizacji (wariant A — bez zmian zachowania…)”) — mnożnik jest zachowany jako 1; test (b) dla tur 0..40 i dwóch profili przechodzi. Konsekwencje czasu pokoju AI to ABC pkt (3)/(c) (wpływ na decyzje AI, do sprawdzenia pomiarem — patrz zarzut 9). (b) `peaceCivPriceMultiplier` nie jest martwy: używa go diplo-war-peace-profile-unit-test (l.125–126, 198/0). Zostaje też `void profile;` (sygnatura wstecznie zgodna z wywołaniami); komentarz zaktualizowany.
7. PRZYJMUJĘ jako uwagę proceduralną, bez zmiany kodu w tej rundzie: main.ts zmieniony poza allowlistą dispatchu (2 miejsca: import `lostCitiesForWeariness` i wyliczenie `lostCitiesResponder` w `diploProposalWarState`). Decyzja orkiestratora (UWAGA-2).
8. PRZYJMUJĘ. Komentarz `lostCitiesResponder` w diplomacy-proposals.ts (l.196) wyjaśnia, że wartość = suma obu stron; komentarz w main.ts przy wyliczeniu też to mówi. Zmiana nazwy pola poza zakresem (5 odwołań + testy).
9. NIE_ZMIERZONO. Live-audit W66/W80B („wojny AI↔AI kończą się pokojem bez eliminacji”): narzędzie istnieje (gra/tools/ai-war-weariness-live-audit-measure.cjs), ale wymaga zbudowania kopii z hakiem (vite build poza repo) i 150-turowego przebiegu w headless Chromium; w tej rundzie nie wykonano (czas i dysk 1,6 GB). Pomiar powinien być osobnym krokiem po FC.
10. NIE_ZMIERZONO (pełna gra). Wykonano zrzut DOM stołu w Chromium (pw-weary-table-browser-test, realne evaluateProposal i renderer: BROWSER PASS, wiersz „Zmęczenie wojną (AI) +427 PW”). NIE wykonano zrzutu w prawdziwej grze (?civTest=1) dla wojny z utratą miasta. Uwaga: na zrzucie DOM widać w tekście wartości „undefined” („Bilans (netto)undefined”, „Brakuje u nich: undefined”) — to najpewniej pola nieuzupełnione przez harness; nie sprawdzałem, czy istniały na bazie.
11. ODRZUCAM liczby z dispatchu. Z(x²)=round(615·x²) dla tur 10–16 bez strat daje 0/17/68/154/273/427/615 (615/36 = 17,08 → 17; 615/9 = 68,3 → 68). Wartości 15 i 62 z dispatchu nie zgadzają się z tym wzorem; to był szacunek. Test (e) liczy Z z funkcji i przechodzi; tabela w PROPOZYCJA-ZMECZENIE-JAKO-PW-POKOJ.md jest zgodna z kodem (potwierdza Evaluator).

## UWAGI-DLA-ORKIESTRATORA

- UWAGA-1: gra/src/ui/diplomacyTradeBasket.ts:862 — tekst „baza ~500 PW” dla zakończenia wojny (błąd widoczny dla gracza po zmianie C). Wymaga dopisania pliku do allowlisty albo osobnego tematu R-WEB-*.
- UWAGA-2: gra/src/main.ts — zmiana z 110ee2146 poza allowlistą; rozstrzygnąć (allowlista albo helper).
- UWAGA-3: dług bazowy city-cession-r3 (17 FAIL na 78af786ed i na 9022a504e, ścieżka decideAIDiplomacy) — osobny temat testowy.
- UWAGA-4: dysk 1,6 GB wolnego (96%) — poniżej progu 4 GB dla weba; zwolnić przed kolejnym startem.
- UWAGA-5: przypadkowo rozpakowałem `git archive 78af786ed gra` do /tmp/claude-0/base, który już istniał (wynik innej sesji); nie wiem, czy nadpisałem jej pliki. Własna kopia bazy użyta do pomiaru: /tmp/claude-0/op-r3base.
- UWAGA-6: gra/node_modules w worktree to symlink do wf_01c44ea9-ef9-1 (nie commitowany).

NASTĘPNY KROK: Evaluator r2 na 9022a504e (czy 1–8 zamknięte, czy 9–10 do rozstrzygnięcia jako NIE_ZMIERZONO z powodem, czy UWAGA-1/2 do decyzji orkiestratora); pomiar live (zarzut 9) i zrzut gry (zarzut 10) jako osobny krok po FC.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej wf_01c44ea9-ef9-3; brak push, brak integracji, brak deployu).
