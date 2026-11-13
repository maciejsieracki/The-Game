STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-STACK-LIMIT-Q1
GOAL: Żadna armia (własne jednostki jednego właściciela na heksie) nie przekracza BATTLE_MAX_PER_SIDE = 500; jedno źródło prawdy.
ZMIANY/COMMIT: baza 0e1de593d; 421010fa1 (Operator), f45240983 (SHA w raporcie), b41876183 (Obrona: siege-enter-city.ts, villageRewards.ts, main.ts, test), c2e3d818d (raport Obrony); ten raport dopisany jako kolejny commit na c2e3d818d. Allowlista (git diff --name-only 0e1de593d c2e3d818d): army-stack-limit.ts, siege-enter-city.ts, villageRewards.ts, main.ts, army-stack-limit-test.cjs, raporty runu. Brak zmian w gra-robocza/**, WERSJE.md, rust-port/**, render/**, battleScene.ts, armyMerge.ts, ai*.ts.

WERDYKTY ZARZUTÓW:
1. Brak bramek w innych drogach: ODDAL. Wejście po poddaniu, nagroda chatki i bonus startowy AI naprawione w b41876183. Cesja traktatem przenosi jednostki tylko na puste heksy (stos nie rośnie). Odwrót/posiłki: brak wywołań assignBounce w src/, posiłki idą ścieżką z bramką. Resztę (chwilowe przekroczenie w trakcie tury) łapie siatka na starcie tury.
2. Podział armii na pełny garnizon: ODDAL (naprawione w b41876183: filtr stackFreeSlots + odrzucenie w onSplit, testy F12/F13).
3. Test jako model + skan tekstu, brak pętli 60 tur na prawdziwym silniku: ODDAL. Dispatch dopuszczał "jeśli możliwe"; NIE_ZMIERZONO. Dowód na żywej grze do dołożenia przez R-WEB-FULL-REGRESSION-MAIN-Q1 lub osobny live-verify.
4. mgla-sciezka-inwariant 39/3 jak baza (zweryfikowane na 0e1de593d i na c2e3d818d): ODDAL. Dług klasyfikacji poza allowlistą, brak nowej klasy błędu. Zalecany mały temat na klasyfikację relokacji main.ts w KLASYFIKACJA.
5. AI nie szuka aktywnie innego heksu: ODDAL. Przycięta trasa = brak ruchu do kolejnej decyzji, nie zmierzono utknięcia. Zalecany osobny temat obserwacji (ai*.ts) po live-verify.
Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA.

TESTY (samodzielnie, gra/, na c2e3d818d):
- tsc --noEmit: exit 0
- logic-test: 213/213
- ai-test: 274 passed / 20 failed; zbiór 20 FAIL identyczny z bazą 0e1de593d (diff pusty)
- army-stack-limit-test: 51/51
- siege-surrender-enter-city: 32 OK/0 FAIL; villages 94/94; found-from-village 24/24; battle-cap-500 PASS 59; generals-limit-invariant ALL PASS
- mgla-sciezka-inwariant: 39/3 (jak baza)
- mutacja: usunięcie `if (g.length > room) continue;` w siege-enter-city.ts czerwieni army-stack-limit-test (po teście przywrócone, drzewo czyste)

BLOKADY: pętla 60 tur prawdziwego silnika i weryfikacja wizualna NIE_ZMIERZONO (build/Chromium); brak bramek dla odwrotu/posiłków poza ścieżką ruchu i siatką startu tury.
RUNDY: 1/5 (Operator, Evaluator, Obrona, FC)
NASTĘPNY KROK: integracja orkiestratora. SHA do integracji: commit z tym raportem na c2e3d818d (kod: b41876183). Kolejność względem origin/rust-port/parity-v2 (8bc2efcf8): dowolna; od merge-base f4c89d008 parity-v2 nie zmienia gra/src, więc brak konfliktu. Rebase/merge na aktualny origin/main przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
