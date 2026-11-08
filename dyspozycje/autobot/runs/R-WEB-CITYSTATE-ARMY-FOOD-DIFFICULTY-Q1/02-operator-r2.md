# R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1 — odpowiedź Operatora na zarzuty (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1
GOAL: zużycie żywności armii i ułamek atrycji głodu wg poziomu trudności WŁAŚCICIELA (miasto-państwo -> cityStateDifficulty, gracz/AI -> menu).
BAZA: 0b0a4b8d4 (kod r1 04fc798fd).

## Odpowiedzi na zarzuty

1. Zarzut "ok. linii 37160 (blok N3, tura oblężenia)": PRZYJMUJĘ.
   Dowód: ułamek był liczony raz dla całej tury z `_menuDifficulty`. Poprawka: ułamek liczony per oblężone miasto
   z `effectiveGameDifficultyForOwner(oblCity.ownerId)`. Raport r1 błędnie zaklasyfikował to jako odczyt UI.

2. Zarzut "spójność wyświetlania (6625-6629, 16731, 33215, prognoza poddania)": PRZYJMUJĘ.
   - karta jednostki `unitSufferingFields` (ok. 6618): efParams wg `effectiveGameDifficultyForOwner(u.ownerId)`;
   - prognoza poddania `siegeSurrenderBadgeFor` (ok. 16731): wg `city.ownerId`;
   - provider panelu oblężenia (ok. 33215): wg właściciela aktywnie oblężonego miasta (`getActiveSiegeCityId()`);
     brak aktywnego miasta -> menu (bez wpływu na wynik). Bez zmiany `siegeMapPanel.ts` (poza allowlistą).
   Rozstrzygnięcie ZAŁOŻENIEM (bez pytania ABC, progi nie zmienione): liczby ułamka widoczne dla gracza
   są spójne z mechaniką właściciela.
   Pozostają świadomie wg menu (nie są ułamkiem atrycji ani zużyciem armii): etykieta `poziomTrudnosciLabel`,
   `gdParams` (deficyt Złota), racje ludności miast-państw (efParams.rationParams), cap i karencja w innych blokach
   (karencja i glodWojskaStatMult są równe na wszystkich poziomach, więc wynik = 0).

3. Zarzut "brak testu podpięcia w boot()/main.ts": PRZYJMUJĘ.
   Dodano sekcję H do `gra/tools/citystate-army-food-difficulty-test.cjs` (skan źródła main.ts/turn-economy.ts):
   H1 brak `glodWojskaHpFrac` z `_menuDifficulty`; H2 resolver ustawiany w boot; H3 tura N3 wg właściciela;
   H4 prognoza wg właściciela; H5 karta jednostki wg właściciela; H6 provider panelu wg właściciela;
   H7 turn-economy używa resolvera. Uczciwie: to test źródłowy (regex), nie wykonanie boot(); pełna ścieżka
   w przeglądarce NIE_ZMIERZONO.

4. Zarzut "glod-wojska-karencja-test 29/10 = dług": PRZYJMUJĘ jako notatkę (bez wpływu na werdykt).
   Potwierdzono ponownie na tym kodzie: 29 PASS / 10 FAIL (identycznie jak baza 8dad78b3a).
   Test nie jest na liście bramek dispatchu; przyczyna: zakłada mnożnik x1, a R_STAWKI_FALA1_FALA2_MULT (x4) jest w kodzie.

## ZMIANY (commit r2)
- gra/src/main.ts: 4 miejsca (N3 tura oblężenia; unitSufferingFields; siegeSurrenderBadgeFor; provider panelu oblężenia).
- gra/tools/citystate-army-food-difficulty-test.cjs: sekcja H (7 sprawdzeń źródła).
- dyspozycje/autobot/runs/R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1/02-operator-r2.md (ten plik).
- turn-economy.ts: bez zmian w r2 (resolver z r1).

## TESTY (r2)
- tsc --noEmit: exit 0
- logic-test: 213/213 (LOGIC OK)
- ai-test: 289 passed, 0 failed
- citystate-army-food-difficulty-test: 29 PASS / 0 FAIL (A-H)
- upkeep-difficulty-per-owner-test: 19 passed, 0 failed
- army-hunger-combat-test: 13 pass, 0 fail
- auto-wyzywienie-kosztarmii-kryterium-test: 18 pass, 0 fail
- empire-food-b5-test: 34 pass, 0 fail
- glod-wojska-karencja-test: 29 PASS / 10 FAIL (dług sprzed zmiany, potwierdzony)
- NIE_ZMIERZONO: npm run build/dev (zakazane), test wizualny w przeglądarce, pełne wykonanie boot().

## BLOKADY
- Brak. Świadomie nie ruszono: siegeMapPanel.ts (poza allowlistą), balans, progi, WERSJE.md.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control: diff r2 względem 04fc798fd, allowlista, testy jw.
DEPLOY/PUSH: NIE WYKONANO
