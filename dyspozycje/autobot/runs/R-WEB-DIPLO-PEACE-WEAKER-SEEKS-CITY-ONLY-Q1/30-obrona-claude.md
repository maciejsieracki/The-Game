# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty FAIL z 20-evaluator-claude.md)

STATUS: FAIL (zarzuty 1, 2, 4 częściowo; zarzut 3 zamknięty; zarzuty 5, 6, 7 zamknięte; testy pokoju w dwóch plikach nie przepisane — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); bez pieniędzy i surowców jako słodzika. Dotyczy gracza i AI.
BAZA: 646d95248 → kandydat 48b37c2ea (Operator r1) → ta runda: patrz ZMIANY-COMMIT (SHA końcowe w polu sha).
RUNDY: 2/5 (ta runda = obrona r2; ostatni werdykt Evaluatora: FAIL)

## Odpowiedzi na zarzuty

| nr | zarzut | werdykt | dowód / co zrobiono |
|---|---|---|---|
| 1 | brak gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs | PRZYJMUJĘ | Plik utworzony. `node tools/diplo-peace-weaker-seeks-city-only-test.cjs` → **15 pass / 0 fail** (a1–a5, b1–b3, e1, c1–c3, d1–d2, f1). Pokrywa (a), (b), (c), (d), (e), (f). (g) tylko częściowo (a4: remis daje dokładnie jedną stronę silniejszą). |
| 2 | brak dowodu mutacyjnego (h) | CZĘŚCIOWO — NIE_ZMIERZONO | Nie uruchomiono mutantów bramek (ai.ts, diplomacy-proposals.ts, main.ts). Test behawioralny istnieje, ale mutacje nie zostały wykonane w tej rundzie — brak dowodu, że usunięcie każdej bramki czerwieni test. |
| 3 | regresja S2/S2b w diplo-war-peace-sim-test | PRZYJMUJĘ | Przyczyna: scenariusz sim nie podawał siły militarnej, więc pozycja = 'pasmo'. Naprawa: sim podaje `silaMilitarnaAI/Partner` (rw > 0.5 → AI silniejsza 700:300, inaczej słabsza) i `responderPozycjaMilitarna`. Asercje o starej regule przepisane (S3b/S3c: silniejsza nie wygasa; S4: utrata miasta nie zmienia pozycji; S5/S5b/S6b: słabsza szuka pokoju od minTur). Wynik: **19 pass / 3 fail** — FAIL dokładnie: S3, S4b, M_TUR = dług bazowy (baza 646d95248: 19/3 z tymi samymi). S2, S2b zielone. |
| 4 | słabsza AI nie proponuje z miastem | CZĘŚCIOWO | Zrobione: warunek N1a (oddanie miasta wobec gracza, ai.ts) jest teraz `peacePosMil === 'slabsza'` (zamiast progu rw). Gałąź `zaproponuj_pokoj` wobec gracza (partnerId '0') jest wyłączona, gdy AI słabsza militarnie i nie ma miasta do oddania (ZAŁOŻENIE Z5). Otwarte: **rozejm z miastem** — `oferuj_miasto_za_pokoj` jest tylko pokojem (diplomacy-proposals.ts ~2115 tworzy pokój z giveItems), brak `rodzaj`. Rozejm słabszej AI wobec gracza nie ma słodzika miastem → BLOKADA. |
| 5 | złoto/surowce przechodzą przy słabszej AI | PRZYJMUJĘ | diplomacy-proposals.ts (blok r5Gate, gracz autor, AI respondent): każda oferta pokoju/rozejmu z `giveItems` typu `zloto` lub `surowiec_ilosc` jest odrzucana (`Złoto i surowce nie są słodzikiem pokoju ani rozejmu`), niezależnie od pozycji AI. Testy d1 (pokój, słabsza AI) i d2 (rozejm, silniejsza AI) zielone. Pozostaje: zaproponowany przez AI tribute-za-pokój (`oferuj_trybut_za_pokoj`, priorytet 1) — wg pkt 4 DODATKU „zostaw bez zmian, opisz": opisano poniżej. |
| 6 | niespójny remis ai.ts vs main.ts | PRZYJMUJĘ | ai.ts używał id `'ai'`/`'partner'`, main.ts `String(ownerId)` — remis dawał przeciwne rozstrzygnięcia. Naprawa: ai.ts używa `inp.myPlayerId` i `rel.partnerId` (te same id co main.ts; `myPlayerId: String(ownerId)` w main.ts:42499). Dotyczy `peacePosMil` i gałęzi ZT (`milAiSide`/`milPartnerSide`; przewaga ZT liczy się z sił, nie z id). Test a4 potwierdza deterministyczny remis (jedna strona silniejsza). |
| 7 | poza allowlistą: diplomacy-ai-forced-peace.ts | PRZYJMUJĘ | Plik przywrócony do stanu bazowego (`git checkout 646d95248 -- gra/src/game/diplomacy-ai-forced-peace.ts`, staged). Skutek: AI↔AI, gdy zwycięzca ma verdict 'stronger', nadal czeka (jak w bazie) — także przy pełnym pokryciu miastami. Wymóg 3 (AI↔AI: silniejsza przyjmuje tylko za miasto) **nie jest zrealizowany** → BLOKADA (wymaga rozszerzenia allowlisty o ten plik albo osobnego tematu). |
| 8 | założenia Z5, pasmo, krok 4b | CZĘŚCIOWO | (i) Z5 zrealizowane jako „brak propozycji pokoju wobec gracza bez miasta” (nie wymyślono mechaniki). (ii) pasmo (progRozniceSilyPokoj > 0): test a5 sprawdza tylko funkcję `peaceMilitaryPosition`; brak testu ścieżki gry z progiem > 0 → NIE_ZMIERZONO. (iii) lista kolizji z krokiem 4b NIE_ZMIERZONO (nie wykonano przeglądu, poza Z7 — krok 4b nieruszany). |

## Zmiany (ta runda) — pliki
- gra/src/game/ai.ts — `peacePosMil` i ZT na id `myPlayerId`/`partnerId`; N1a warunek `peacePosMil === 'slabsza'` zamiast progu rw; `peaceWeakerNoCityVsPlayer` blokuje zaproponuj_pokoj wobec gracza bez miasta.
- gra/src/game/diplomacy-proposals.ts — odrzucenie złota/surowców w giveItems dla pokoju/rozejmu (AI respondent, gracz autor).
- gra/src/game/diplomacy-ai-forced-peace.ts — przywrócone do bazy (poza allowlistą).
- gra/tools/diplo-war-peace-sim-test.cjs — scenariusz z siłą militarną, asercje o starej regule przepisane.
- gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs — NOWY test zachowania (15 asercji).

## TESTY (liczby z surowego wyjścia tej rundy)
- `npx tsc --noEmit`: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed. (exit 0)
- diplo-war-peace-gate-test: 24 pass / 0 fail
- diplo-war-peace-profile-unit-test: 198 pass / 0 fail
- diplo-military-strength-test: RESULT 27 PASS / 0 FAIL
- diplo-war-declare-zero-trust-test: 43 OK, 0 FAIL
- diplomacy-test: 148 passed, 0 failed
- diplo-war-battle-counter-test: 35 PASS / 0 FAIL
- diplo-peace-ai-ai-nonnegative-test: 20 PASS, 0 FAIL
- diplo-war-peace-d7-test: 8 pass / 0 fail
- diplo-peace-weaker-seeks-city-only-test (NOWY): 15 pass / 0 fail
- diplo-war-peace-sim-test: 19 pass / 3 fail (S3, S4b, M_TUR = dług bazowy; baza 19/3 z tym samym zestawem)
- **diplo-peace-balance-accept-test: 24 pass / 5 FAIL** — A1, A4, A5, B1, C1. Asercje dotyczą starej reguły „przewaga militarna >20% rw blokuje pokój” (`peaceBlockedByMilitaryAdvantage`, usunięta w R1). Brak przepisania → BLOKADA.
- **diplo-war-peace-main-guard-test: 32 pass / 3 FAIL** — mutacja R3 / `isFeelingStronger` (funkcja zostawiona jako @deprecated, ai.ts nie wywołuje jej). Asercje obsolete → BLOKADA.
- diplo-trust-numbers-test: plik nie istnieje w gra/tools → NIE_ZMIERZONO.
- diplo-war-peace-gate-test (24/0) nie sprawdza pozycji militarnej (ctx bez `responderPozycjaMilitarna`) — jego zielony wynik nie jest dowodem zarzutu 2.

## BLOKADY (otwarte, nie rozstrzygane założeniem)
1. Rozejm z miastem słabszej AI wobec gracza (wymóg 2 dla rozejmu): brak komendy z rodzajem rozejm + miasto.
2. AI↔AI: silniejsza przyjmuje tylko za miasto — wymaga zmiany diplomacy-ai-forced-peace.ts (poza allowlistą) albo decyzji właściciela.
3. diplo-peace-balance-accept-test (A1, A4, A5, B1, C1) i diplo-war-peace-main-guard-test (R3) — przepisać na pozycję militarną.
4. Mutacje (h) bramek ai.ts / diplomacy-proposals.ts / main.ts — NIE_ZMIERZONO.
5. Ścieżka pasma (progRozniceSilyPokoj > 0) w grze — NIE_ZMIERZONO.
6. Tribute-za-pokój AI (oferuj_trybut_za_pokoj, priorytet 1) nadal używa złota jako słodzika AI→gracz (wg pkt 4 DODATKU: opisane, nie zmieniane w tym temacie). Wymaga decyzji właściciela, czy to wyjątek.
7. Lista kolizji z krokiem 4b (zmęczenie wojną) — NIE_ZMIERZONO.

## NASTĘPNY KROK
Orkiestrator: decyzja o allowlistę dla diplomacy-ai-forced-peace.ts (AI↔AI, blokada 2) i o tribute (blokada 6). Potem runda 3 tego samego ID: rozejm z miastem (1), przepisanie dwóch plików testowych (3), mutacje (4), pasmo (5).

DEPLOY/PUSH: NIE WYKONANO (brak push; commit lokalny na gałęzi detached worktree).
