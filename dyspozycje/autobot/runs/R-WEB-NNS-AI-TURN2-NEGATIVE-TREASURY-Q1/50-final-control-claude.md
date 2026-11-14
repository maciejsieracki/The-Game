# R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1 — Final Control (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1
GOAL: AI nie kończy tury ze skarbcem/spichlerzem < 0 od tury 1; gracz bez zmian.
ZMIANY-COMMIT: kandydat do integracji = fda9b9989 (potomek bazy 38d145144: `git merge-base --is-ancestor` OK; diff 38d145144..fda9b9989 = 7 plików, wszystkie w allowliście: no-negative-stocks.ts (próg 11 -> 1), main.ts (tylko ścieżka AI: aiNnsUncoveredOwners + klamra), 3 testy tools/, 2 raporty runs/). Ten raport w osobnym commicie (tylko 50-final-control-claude.md).

TESTY (surowe wyniki, własne uruchomienia na fda9b9989):
- tsc --noEmit: exit 0
- no-negative-stocks-ai-t2-test 11/0; c2-test 43/0; ai-test 8/0
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20/0; research-test 33/0 ALL GREEN; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0
- git diff --check 38d145144 fda9b9989: czysto; git status po pracy czysty (mutacje cofnięte)
- NOWY test behawioralny (realny bundle vite + Chromium, seed 33, T1-4): kandydat PASS, 123 wierszy / 0 naruszeń skEnd; mutacja (usunięta klamra main.ts:40600) FAIL: 4 naruszenia (oid 12 T2-4 skEnd -1/-2/-3; oid 34 T4 -3), exit 1. Czerwień na bazie dla tego testu NIE_ZMIERZONO (statyczny ai-t2-test jest czerwony na bazie wg Operatora: 6/5).
- Pomiar headless T1-10 (runner, mode on): seed 11: 369 wierszy, skEnd<0 = 0; seed 22: 369 wierszy, skEnd<0 = 0 (skBank<0 surowe = 3, spichRaw<0 = 3, harappa oid 7 T6-8; granary po turze = 0); seed 33: 0 (test behawioralny T2-4; Operator T1-10 0).
- Pomiar T1-30 x3 ziarna, baza 38d145144 vs kandydat (runner, tury 1-30, wiersze T30 bez państw-miast, 13 właścicieli AI/ziarno):

| seed | suma miast base/cand | mediana miast | suma jednostek base/cand | mediana jedn. | skEnd<0 T1-10 base/cand | skEnd<0 T1-30 base/cand | wyjątki base/cand |
|---|---|---|---|---|---|---|---|
| 11 | 100/99 | 8/8 | 60/61 | 4/4 | 221/0 | 386/0 | 170/41 |
| 22 | 92/98 | 8/8 | 55/61 | 4/4 | 184/0 | 291/0 | 109/39 |
| 33 | 95/95 | 8/7 | 69/66 | 4/4 | 221/0 | 342/1 | 122/44 |

  Łącznie 3 ziarna: miasta 287 -> 292 (+1,7%), jednostki 184 -> 188 (+2,2%). Brak pogorszenia > 5% w agregacie; pojedyncze odchylenie: seed 33 mediana miast 8 -> 7 (suma identyczna 95/95; jednostki -4,3%), traktuję jako szum jednego ziarna, nie DECISION_REQUIRED. Jedno naruszenie skEnd<0 w seed 33 jest po T10 (poza GOAL).

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Przyczyna -1 w T2 / rozjazd projekcja-bank: ODDAL. Przyczyną na bazie jest próg `NNS_AI_BALANCE_TURN_MIN = 11` (no-negative-stocks.ts; `if (turn < NNS_AI_BALANCE_TURN_MIN) return;` main.ts ~7523) — wyłączone równoważenie w T1-10; dowód: baza 221/184/221 wierszy skEnd<0 w T1-10, kandydat 0/0/0. Skoki skarbca po bankowaniu (seed 22 oid 13) to nagroda wioski grantGold (main.ts ~33277) po bankowaniu, nie rozjazd projekcji (Obrona: projekcja -3 = bank 2+11-16).
2. Klamra do 0 (main.ts:40600): DO DECYZJI CZŁOWIEKA (realna decyzja produktowa). Kod minimalny i ograniczony do ownera z `aiNnsUncoveredOwners` (dźwignie wyczerpane), ale: (a) bez klamry GOAL binarny niespełniony (mutacja: 4 naruszenia, seed 33, asyria/fenicjanie, dług -1 -> -9); (b) z klamrą zerowanie długu AI to „złoto z niczego" i omija advanceGoldDeficit dla tego ownera, co koliduje z regułą R-DEFICYT-ZLOTA-KARA-Q1 „dług AI trwa jak dług gracza"; (c) klamra działa też w T>10 (wcześniej tacy ownerzy mieli narastający dług z karą). Alternatywa (nowa dźwignia: zwolnienie chronionego obrońcy) zmienia balans wojskowy. Nie rozstrzygam sam (CLAUDE.md pkt 3) — ABC właściciela wymagane PRZED READY_FOR_DEPLOY.
3. Brak testu behawioralnego/mutacji klamry: już NAPRAWIONE w kandydacie (fda9b9989) i zweryfikowane przeze mnie (PASS na kandydacie, FAIL z usuniętą klamrą) — nic otwartego do naprawy.
4. Spichlerz AI < 0 (harappa oid 7 T6-8): ODDAL. Wiersze mają `granary=0` po turze; spichRaw=-1 to wartość surowa przed `max(0, ...)` w empire-food.ts:286-289, a `glod` to istniejący głód garnizonu wspólny z graczem, nie ujemny zapas po turze.
5. Pomiar T1-30 x3: wykonany przeze mnie (tabela wyżej): brak pogorszenia > 5% w agregacie.
Żaden zarzut nie wymaga dalszej poprawy kodu => nie FAIL.

BLOKADY (przed READY_FOR_DEPLOY): ABC właściciela w sprawie klamry długu AI (zarzut 2): A) zatwierdzić klamrę do 0 dla AI bez pokrycia (kandydat gotowy; rekomendacja A — realizuje decyzję „AI od tury 1" najmniejszym zakresem), B) odrzucić klamrę i dodać dźwignię (zmiana balansu wojskowego AI, nowy temat), C) zostawić dług z karą (łamie GOAL).

UWAGI-DLA-ORKIESTRATORA:
- Rust: REPIN potrzebny (zmiana logiki AI: próg 1 + klamra ownera bez pokrycia) — NIE_ZMIERZONO w rust-port/.
- Dług testowy: test behawioralny pokrywa tylko seed 33 T2-4; czerwień na bazie NIE_ZMIERZONO; spichlerz nie jest w kryterium runnera dla T<=10 (granary po turze = 0 sprawdzone ręcznie).
- Jedno skEnd<0 w seed 33 po T10 (poza zakresem tematu) — do obserwacji.
- Do integracji brać fda9b9989 (kod); commit raportu FC jest tylko dokumentacją.

RUNDY: 2/5
NASTĘPNY KROK: ABC (klamra) -> integracja orkiestratora (ancestry sprawdzone) -> READY_FOR_DEPLOY po decyzji.
DEPLOY/PUSH: NIE WYKONANO
