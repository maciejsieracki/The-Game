STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-REALISTIC-Q1
GOAL: zmierzyć przeżywalność pierwszych 20 tur przy grze rozsądnego gracza na maksimum (seedy 4242 i 7; P0 kontrola, P1 budowa jednostki obronnej, P2/P3).
ZMIANY/COMMIT: nowe narzędzie gra/tools/realdef-live.cjs (tylko P0; P1 zablokowane, patrz BLOKADY), analiza dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md, dane dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-p0-s4242-s7.jsonl oraz ten raport. Zero zmian w gra/src, gra/data, WERSJE.md, manifeście i rust-port.
TESTY:
- P0 pasywny, seed 4242, 20 przebiegów x 20 tur: 20/20 utrata jedynego miasta, tury 8–14 (mediana 9,5), zdobywca barbarzyńcy, pageerror 0.
- P0 pasywny, seed 7, 20 przebiegów x 20 tur: 19/20 utrata, tury 8–17 (mediana 9); 1 przebieg bez utraty do tury 20; pageerror 0.
- P0 razem: 39/40 utrata (97,5%). Referencja DEFEAT r2: 34/37 (92%).
- P1: NIE ZMIERZONO (patrz BLOKADY). P2 i P3: NIE ZMIERZONO.
- Bramki: `tsc --noEmit -p gra/tsconfig.json` exit 0 (surowe wyjście: brak błędów). logic 213 i ai-test 297/0: NIE URUCHOMIONO, bo nie zmieniono kodu gry.
- Readback ustawień: zapisany jest wysłany słownik parametrów (`adv`) i odczyt tury i skarbca po starcie. Pełnego odczytu ustawień z gry runner nie wykonuje (NIE ZMIERZONO).
BLOKADY:
1. P1 nie da się wykonać w obecnym harnessie bez rozszerzenia allowlisty:
   (a) karta „Rekrutuj” nie pojawia się w widoku miasta (0 kart `.unit-recruit-submit` w turach 1–3; diagnostyka w polu `tries` prób);
   (b) rekrutacja z panelu armii wymaga generała rekrutującego, a gracz startuje tylko ze Zwiadowcą;
   (c) hak `__siegeBlockTestDebug.tryPurchase(cityId)` (realne purchaseRecruitmentUnit) kupuje PIERWSZĄ jednostkę z listy, w próbie była to Zwiadowca (cywilna). Wybór najtańszej wojskowej wymagałby parametru hooka w gra/src/main.ts, poza allowlistą.
   Próba z zakupem Zwiadowcy została usunięta z danych i nie jest liczona.
2. P2 (ręczna bitwa) i P3 (mury) NIE ZMIERZONO. Zależą od P1; runner nie ma ścieżki ręcznej bitwy (klika wyłącznie `data-act="auto"`).
RUNDY: 1/5 (bez kolejnej rundy: wymagana decyzja orkiestratora)
DECYZJA WYMAGANA (orkiestrator): czy dopuścić minimalną zmianę hooka `__siegeBlockTestDebug.tryPurchase` w gra/src/main.ts (opcjonalny parametr unitId, tylko przy ?civTest=1, bez zmiany logiki gry) i dopisać ją do allowlisty tematu. Alternatywa: zamknąć P1 jako NIE ZMIERZONO i zostawić P0 jako kontrolę.
UWAGI-DLA-ORKIESTRATORA:
- P0 reprodukuje DEFEAT: pasywny gracz bez jednostki wojskowej traci miasto w 8–17 turach. Wynik P0 można użyć jako kontrolę.
- Bundle live zbudowany do katalogu w scratchpadzie sesji, poza repo.
- Tymczasowy symlink gra/node_modules (do node_modules innego worktree) został usunięty przed commitem; nie jest częścią commita.
NASTĘPNY KROK: decyzja orkiestratora (patrz DECYZJA WYMAGANA). Po akceptacji rozszerzenia hooka: P1 (≥20 przebiegów na seed) oraz P2/P3.
DEPLOY/PUSH: NIE WYKONANO
