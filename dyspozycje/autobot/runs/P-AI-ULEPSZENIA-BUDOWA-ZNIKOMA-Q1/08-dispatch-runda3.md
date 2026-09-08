STATUS: DISPATCH (RUNDA 3 — decyzje właściciela po DECISION_REQUIRED rundy 2)
DOMAIN: GAME
TEMAT: P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1
GOAL RUNDY 3: Domknij dwa punkty DECISION_REQUIRED z rundy 2 zgodnie z jawną decyzją
właściciela — bez zmiany kodu `ai.ts` z rundy 2 (ten kod zostaje, jest już poprawny wg litery
reguły właściciela), WYŁĄCZNIE naprawa/przeprojektowanie bramki referencyjnej tematu.

DECYZJE WŁAŚCICIELA (2026-09-08, odpowiedź na ABC z rundy 2):
1. **Wzrost ulepszeń żywnościowych ~1.5-1.8x** (efekt uboczny rozbicia jednego wywołania
   `pickAutoImprovements` na dwa — żywność przestała konkurować o wspólny slot/heks z
   surowcowymi) → **ZAAKCEPTOWANE**. To pozytywny, zamierzony skutek uboczny usunięcia
   marnotrawstwa, zgodny z GOAL tematu. ZERO zmian kodu w tym punkcie — `ai.ts` z rundy 2
   (`foodPicks`/`resourcePicks` w `planCityImprovements`) zostaje bez zmian.
2. **Bramka referencyjna `gra/tools/ai-ulepszenia-malo-budowane-test.cjs`** (temat
   `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1`) spadła z 13/13 do 8/13, bo scenariusz "nadwyżki"
   (ZASADA 3) rzadziej występuje teraz gdy surowce budują się prawie wszędzie w promieniu
   miasta (~700+ heksów) → **PRZEPROJEKTOWAĆ SCENARIUSZ BRAMKI**, bez zmiany żadnej liczby
   balansu gry. To jest jedyne zadanie tej rundy.

KONTEKST — PRZECZYTAJ RUNDĘ 2 W CAŁOŚCI (raporty Operatora/Evaluatora/Obrony na tej gałęzi)
PRZED PIERWSZĄ ZMIANĄ:
- Obrona rundy 2 wskazała DWIE możliwe ścieżki naprawy bramki, obie ważące tyle co "zmiana
  liczby balansu" (świadomie NIE robimy tego bez tej rundy): (a) sztucznie zmniejszyć
  promień/mapę w SAMYM SCENARIUSZU TESTOWYM (nie w silniku gry) tak, żeby ~700 heksów dało
  się wysycić w rozsądnej liczbie tur — wymaga dobrania konkretnych, nowych, NIEPINOWANYCH
  dotąd liczb SCENARIUSZA (nie balansu gry — rozmiar testowej mapy/miasta to parametr testu,
  nie gry); (b) świadomie przedefiniować co "nadwyżka" ma oznaczać dla kategorii surowcowej w
  tym teście (np. mierzyć nadwyżkę w oknie startowym, zanim miasto urośnie do pełnego
  promienia). Wybierz TĘ z dwóch, która daje najmniej kruchy, najbardziej czytelny test —
  Twoja decyzja inżynierska, uzasadnij wybór w raporcie.
- Realny mechanizm silnika (`onlyWorked=false` dla surowców, promień
  `cityTerritoryRadius(node)+1`) NIE ZMIENIA SIĘ w tej rundzie — to jest przyczyna, dla której
  scenariusz testowy musi się dostosować, nie odwrotnie.

ZADANIE:
1. Przeprojektuj scenariusz `ai-ulepszenia-malo-budowane-test.cjs` (ZASADA 3, wykrywanie
   "nadwyżki") tak, żeby sensownie wykrywał nadwyżkę PRZY nowej regule (surowce bez
   ograniczenia do obrabianych heksów) — parametry SCENARIUSZA TESTOWEGO (rozmiar
   mapy/populacji/liczby tur w harnessie), NIE liczby balansu gry (`gra/data/*.json`,
   `AI_FIXED_PROCENT_BUDYNKI`, żadne stałe w `ai.ts`/`auto-improvements.ts` pozostają
   nietknięte).
2. Zweryfikuj że przeprojektowany test faktycznie wykrywa realny regres ZASADY 3 (test
   mutacyjny: zepsuj celowo mechanizm nadwyżki w silniku, sprawdź że bramka czerwienieje;
   przywróć).
3. Uruchom pełny zestaw bramek tematu (`ai-ulepszenia-malo-budowane-test.cjs`,
   `ai-praca-split-parity-test.cjs`, 5 referencyjnych) i potwierdź wszystko zielone.

BINARNE KRYTERIUM SUKCESU: `ai-ulepszenia-malo-budowane-test.cjs` w całości zielone,
scenariusz "nadwyżki" faktycznie wykrywa regres (dowód mutacyjny), zero zmian liczb balansu
gry (tylko parametry scenariusza testowego). `tsc --noEmit` czysty, 5 bramek referencyjnych
zielone.

ALLOWLISTA:
- `gra/tools/ai-ulepszenia-malo-budowane-test.cjs` (WYŁĄCZNIE ten plik — przeprojektowanie
  scenariusza testowego)
- `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/*`
Zakaz `git add -A`. Zakaz DOTYKANIA `gra/src/game/ai.ts` w tej rundzie (kod z rundy 2 jest
już zaakceptowany i zamknięty, punkt 1 decyzji właściciela wyżej) — jeśli w trakcie pracy
uznasz że jednak trzeba tam coś zmienić, ZATRZYMAJ SIĘ i zgłoś dlaczego zamiast to zrobić.
Zakaz zmiany jakiejkolwiek liczby balansu gry (progi/mnożniki/limity w `gra/data/*.json`
lub stałych `ai.ts`/`auto-improvements.ts`).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz "naprawienia" bramki przez samo obniżenie progu bez
zrozumienia czy nowy próg faktycznie wykrywa regres (dowód mutacyjny obowiązkowy). Zakaz
cichej zmiany zachowania silnika pod pretekstem "to tylko test".

IZOLACJA: worktree `/home/user/wt-ai-ulepszenia-budowa` (JUŻ ISTNIEJE, ta sama gałąź
`autobot/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1`, HEAD `09701423`) — kontynuuj na tej samej gałęzi.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 3.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry (runda 2) + test (runda 3), wymaga Final Control łącznie dla
całego tematu.
DEPLOY/PUSH: NIE WYKONANO
