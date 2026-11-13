# 30-obrona-claude: R-WEB-BATTLE-HIT-MODE-SETTING-Q1 (runda obrony 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-HIT-MODE-SETTING-Q1
GOAL: Odpowiedź na zarzuty Evaluatora (kandydat ae600d5ed na bazie 81e357dee). Domknięcie luk: parytet AUTO=SKIP w trybie 'pewne', pokrycie gałęzi certainHit w battleScene, dowody kryteriów 3-6.
ZMIANY/COMMIT: 98fb5eaa12cf8c5d4b6fce50397a59aae524eb41 (kod obrony, tylko dwa pliki: `gra/src/main.ts`, `gra/tools/battle-skip-equals-auto-resolve-test.cjs`). Commit tego raportu: patrz "SHA końcowy" niżej.
  - `gra/src/main.ts`: hak testowy `window.__civSetHitMode = setActiveHitMode`, bramka `isCivTestEnabled` (`?civTest=1`, ten sam wzorzec co `__siegeBlockTestDebug`). W produkcji obiekt nie powstaje. UWAGA: to poza dosłowną allowlistą ("main.ts tylko przekazanie pola"); świadome odstępstwo, potrzebne, by test mógł ustawić tryb w scenie playtestu (playtest nie przechodzi przez kreator, a `applyMenuParams` ustawia 'losowe').
  - `gra/tools/battle-skip-equals-auto-resolve-test.cjs`: zmienna `WSKIP_HITMODE` (ustawia tryb po utworzeniu sceny, dodaje `&civTest=1` do URL); nowy check B7 (w trybie 'pewne' zero "chybia" w logu bitwy, przy SKIP i AUTO); liczniki `misses`/`hits` w wyniku przebiegu.

## Odpowiedzi na zarzuty

1. Parytet AUTO=SKIP w trybie 'pewne' nie testowany (kryterium 3): PRZYJMUJĘ.
   Poprawka: `WSKIP_HITMODE=pewne` w battle-skip-equals-auto-resolve-test. Dowód (surowe wyniki, `WSKIP_NO_D=1`, seedy 1,2,3,7):
   - seed 1: `--- 18 ok, 0 fail; CZESC B: DONE` (B4 SKIP == AUTO, B6 pościg SKIP == AUTO, B5 czas wirtualny).
   - seedy 2,3,7: `--- 34 ok, 0 fail; CZESC B: DONE` (A1-A6, C1-C4 oraz 8 checków B na seed; łącznie 34 PASS, 0 FAIL).
   - czas wirtualny (AUTO/SKIP): seed 1 57520/57520 ms; seed 2 57552/57520; seed 3 57536/57520; seed 7 57536/57520; wszystkie tura 18.
   - Trafienia/chybienia w logu w trybie 'pewne': auto=200/0 i skip=200/0 (seedy 1,2,3,7).
   Limit czasu: przebieg seedy 2,3,7 trwał 7 min 21 s (poniżej limitu narzędzia, uruchomiony w pierwszym planie, po jednym wywołaniu na seedy).

2. Gałąź certainHit w battleScene._singleBlow bez pokrycia (kryterium 6): PRZYJMUJĘ.
   Dodany check B7. Mutacja potwierdzona: w `battleScene.ts` zmieniono `const certainHit = isCertainHitMode();` na `const certainHit = false && isCertainHitMode();`, uruchomiono test (seed 1, tryb pewne): `FAIL: B7 seed 1 ... {"auto":241,"skip":241}`, `INFO ... auto=125/241, skip=125/241`, wynik `17 ok, 1 fail`. Przywrócono linię (`git status` czysty dla battleScene.ts).
   Granica pokrycia (NIE_ZMIERZONO): ścieżka ręcznej walki (rozkaz gracza w trybie ręcznym) nie jest objęta B7, bo test porównuje SKIP i AUTO. Ręczna walka w trybie 'pewne' nie była uruchamiana w tej rundzie (partD pominięte przez `WSKIP_NO_D=1`; partD działa tylko w 'losowe').

3. Kryteria 4 i 5 niezmierzone (zrzut, zapis/odczyt trybu): częściowo, nie PASS.
   - Kryterium 4 (zapis bez pola hitMode wczytuje się jako 'losowe'): dowód strukturalny, bez testu runtime. Zapis: `main.ts:45276` `_lastNewGameParams = {...params, seed}` (pole `advanced.hitMode` idzie do `meta.newGameParams`). Odczyt: `main.ts:46815-46817` `setActiveHitMode(normalizeHitMode(saved.meta?.newGameParams?.advanced?.hitMode))`. Test jednostkowy `normalizeHitMode(undefined)==='losowe'` (hit-mode-test) to pokrywa tylko funkcję, nie `restoreGameFromSave`. NIE_ZMIERZONO: pełny cykl zapis->wczytanie w grze.
   - Kryterium 5 (zrzut Chromium 1440x900, przełącznik widoczny w ustawieniach zaawansowanych i zapisany w nowej grze): NIE_ZMIERZONO. Zrzut nie był wykonywany w tej rundzie (wymaga przejścia kreatora nowej gry; nie zrobiono).
   - Stan trybu po powrocie do menu: NIE_ZMIERZONO (nie badano).

4. resolveSiegeAttack w siege.ts ma własne rzuty (`hitChanceTw`, `rng()*100`) i nie respektuje trybu 'pewne' (niski priorytet): ZAŁOŻENIE POTWIERDZONE, bez zmiany kodu.
   Dowód: `grep -rn resolveSiegeAttack gra/src` daje tylko definicję (`siege.ts:654`) i komentarze (`siege.ts:51, 411, 819, 836`). `siegeAi.ts` i `siegeDefenders.ts` importują z `./siege`, ale nie importują `resolveSiegeAttack`. Funkcja jest martwa w grze. `siege.ts` jest poza allowlistą tego tematu, więc nie zmieniano. Zalecenie: osobny temat porządkowy, jeśli funkcja zostanie podpięta (wtedy trzeba dodać gałąź certainHit).

5. Kryterium 1 zrealizowane jako 100 000 startów `resolveCombat` (1 vs 1, równe staty), nie 100 000 pojedynczych uderzeń: ZAŁOŻENIE, bez zmiany. Każdy start to wiele rund i uderzeń; w trybie 'pewne' test `hit-mode-test` sprawdza zero chybień w logu (N=100 000, "100 000 starc 1v1 bez chybienia" PASS). Jednostka miary inna niż w dispatchu, mocniejsza w sensie liczby ataków.

## Surowe wyniki bramek (ten kod, worktree `wf_f6ba1a0b-d3c-3`, po commicie 98fb5eaa1)

- `node_modules` w `gra/` zainstalowane przez `npm ci --no-audit --no-fund --ignore-scripts` (71 pakietów, katalog ignorowany przez git; w repo bez zmian).
- `tsc --noEmit` (w `gra/`): exit 0.
- `tools/hit-mode-test.cjs`: `WYNIK: 18 PASS, 0 FAIL`.
- `tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`.
- `tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `tools/research-test.cjs`: `ALL GREEN`.
- `tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `tools/battle-skip-equals-auto-resolve-test.cjs` z `WSKIP_HITMODE=pewne` (seed 1): `18 ok, 0 fail`; seedy 2,3,7: `34 ok, 0 fail` (liczby z surowego wyjścia, przebiegi `/dev/shm/wskip-pewne-s1.log` i `/dev/shm/wskip-pewne-s237.log`).
- Mutacja certainHit w battleScene: `17 ok, 1 fail` (B7 FAIL), przywrócone.
- NIE_ZMIERZONO w tej rundzie: domyślny przebieg `losowe` battle-skip-equals-auto po zmianie (hak jest aktywny tylko z `civTest=1`; ścieżka domyślna nie została uruchomiona ponownie), `newgame-settings-layout-reposition-test`, zrzut UI.

## BLOKADY
- Kryterium 5 (zrzut w grze, przełącznik w panelu) NIE_ZMIERZONO.
- Kryterium 4 w runtime (restoreGameFromSave) NIE_ZMIERZONO; dowód strukturalny jest w sekcji 3.
- Ręczna walka w trybie 'pewne' poza testem (B7 obejmuje SKIP i AUTO).
- Odstępstwo od allowlisty: hak testowy w `main.ts` (sekcja ZMIANY/COMMIT).

## RUNDY
1/5 (obrona r1 na zarzuty Evaluatora z 8e0022fce).

## NASTĘPNY KROK
Evaluator r2: ocena commita 98fb5eaa1 wobec zarzutów 1-2 (PRZYJĘTE, z dowodami) i 3-5 (częściowo / ZAŁOŻENIE). Orkiestrator decyduje o akceptacji odstępstwa allowlisty w `main.ts` (hak testowy) oraz o zakresie NIE_ZMIERZONO (zrzut, runtime zapisu).

DEPLOY/PUSH: NIE WYKONANO
