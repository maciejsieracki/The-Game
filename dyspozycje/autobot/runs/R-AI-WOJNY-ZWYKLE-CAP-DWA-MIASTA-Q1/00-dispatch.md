# Dispatch — R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1

## Kontekst — KRYTYCZNY, żywy bug

Nadrzędne zgłoszenie: `R-AI-WOJNY-PODBOJ-DOMINACJA-Q1` (rejestr). Właściciel na żywo: „jedna
cywilizacja zajęła wszystkie inne cywilizacje poza moją" — zamiast mapy z 5-6 przeciwnikami
AI, zostaje jeden dominujący gracz AI. Recon (Explore agent) potwierdził PRZYCZYNĘ:

- Reguła „pierwsze 25 tur bez wojny AI↔AI poza wojną epoki" (`ai.ts:4658`,
  `AI_MAJOR_EARLY_NO_WAR_TURNS`) działa POPRAWNIE, zero regresji — ale chroni WYŁĄCZNIE
  okno tur 1-25.
- Mechanizm „2 miasta zdobyte/stracone → wymuszony pokój + 20 tur cooldown"
  (`forced-war-bronze.ts`/`forced-war-stone.ts`/`forced-war-iron.ts`,
  `WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE=2`,
  `WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR=20`) JUŻ ISTNIEJE i działa — ale
  WYŁĄCZNIE dla wojen WYMUSZONYCH epoki. **Zwykłe wojny AI↔AI (Priorytet 4
  „wypowiedz_wojne" w `ai.ts::decideAIDiplomacy`, aktywne po turze 25) nie mają ŻADNEGO
  automatycznego bezpiecznika** — mogą eskalować aż do całkowitego podboju.

Właściciel rozstrzygnął 3 pytania ABC 2026-09-10 (AskUserQuestion), pełne ID
`R-AI-WOJNY-PODBOJ-DOMINACJA-Q1`:

- **Q1 = rozszerz TEN SAM mechanizm (2 miasta, cooldown 20 tur, TE SAME parametry) na
  zwykłe wojny AI↔AI.** Nie wolno wymyślać nowych progów/wartości.
- **Q2 = NIE dodawać ochrony przed całkowitą eliminacją małej cywilizacji** (≤2 miasta) —
  to zaakceptowana mechanika 4X, poza zakresem tego tematu. NIE dotykaj `eliminateOwner()`
  ani logiki „ostatnie miasto = koniec cywilizacji".
- **Q3 = WYŁĄCZNIE wojny AI↔AI.** Wojny z udziałem gracza (w dowolnej roli, atakujący LUB
  broniący się) zostają BEZ ZMIAN — zero nowej logiki gdy `ownerId===0` po którejkolwiek
  stronie pary.

## Punkty odniesienia w istniejącym kodzie (przeczytaj PRZED implementacją, świeżym grep —
## numery linii poniżej pochodzą z reconu na commit `dbe4eabf`, mogły się przesunąć)

1. **Funkcja czysta do reużycia, BEZ ZMIAN:** `gra/src/game/forced-war-common.ts`,
   `shouldEndForcedWarByCityCount(capturedA, capturedB, threshold): boolean` — generyczna,
   nie zależy od epoki. Wywołaj z `threshold=2` (dosłownie: zaimportuj i użyj
   `WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE` z `forced-war-bronze.ts`, NIE
   twórz nowej stałej o innej wartości).
2. **Punkt zaczepienia „koniec wojny + cooldown" — JUŻ GENERYCZNY, prawdopodobnie ZERO
   dodatkowej pracy:** `finalizePeaceTreatyBetween(proposerId, responderId,
   lockTurnsOverride?)` (`main.ts` ok. linii 9102-9140) ustawia
   `peaceUntilTurn = turn + lockTurnsOverride` przez `startPeaceTreatyLock()`
   (`gra/src/game/diplomacy-peace-lock.ts`), którego nagłówek pliku mówi wprost: „Dotyczy:
   AI decideAIDiplomacy, kaskada sojuszu, losowy DOW państw-miast, gracz (UI)" —
   czyli zwykła bramka wypowiedzenia wojny AI (Priorytet 4 w `ai.ts`) JUŻ SPRAWDZA
   `isPeaceTreatyLocked()` przed pozwoleniem na nową wojnę tej samej pary. **Zweryfikuj to
   wprost** (znajdź wywołanie `isPeaceTreatyLocked` w ścieżce Priorytetu 4/budowy `rel` w
   `main.ts`/`ai.ts`) — jeśli faktycznie tak jest, NIE musisz budować żadnego nowego
   mechanizmu cooldownu: samo wywołanie `finalizePeaceTreatyBetween(a, b,
   WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR)` wystarczy do zablokowania nowej
   wojny tej pary na 20 tur. Jeśli WERYFIKACJA pokaże, że jednak NIE jest sprawdzane w tej
   ścieżce — zgłoś to jako BLOKADY w raporcie i zapytaj o DECISION_REQUIRED zamiast cicho
   dopisywać nowy, równoległy mechanizm cooldownu.
3. **Wzorzec liczenia zdobytych/straconych miast — 3 analogiczne funkcje do
   przeczytania jako WZÓR (NIE kopiuj 1:1, uprość — regularna wojna nie ma
   attacker/defender, tylko symetryczną parę):**
   `maybeResolveBronzeForcedWarOnCityCapture` / `...Stone...` / `...Iron...`
   (`main.ts` ok. linii 27902-28050). Każda: pobiera stan pary z własnej mapy
   (`bronze/stone/ironForceWarActiveByPairKey`), inkrementuje licznik strony, sprawdza
   próg, i jeśli osiągnięty ORAZ `getDiploRelation(...).status==='wojna'` — woła
   `finalizePeaceTreatyBetween(...)` z cooldownem.
4. **Oba „lejki" wywołania (call sites) tych trzech funkcji — NOWA funkcja MUSI być
   wołana z TYCH SAMYCH dwóch miejsc, w tej samej kolejności (PO trzech istniejących
   wywołaniach, nie przed):** `main.ts` ok. linii 14041-14043 oraz ok. linii 28107-28109.
   Komentarze przy tych funkcjach tłumaczą DLACZEGO oba lejki są potrzebne (kapitulacja
   głodowa `resolveSiegeSurrender` ORAZ zwykłe zdobycie `applyCityCaptureToMap` — bez
   obu, część zdobyć umyka licznikowi).
5. **`diploPairKey(a, b)`** (już używane wszędzie wyżej) — kanoniczny, nieuporządkowany
   klucz pary; użyj go też dla nowej mapy regularnych wojen.

## GOAL

Nowa funkcja (nazwa do potwierdzenia przez Operatora, sugestia:
`maybeResolveRegularWarOnCityCapture(oldOwner, newOwner)`), wołana z DOKŁADNIE tych samych
dwóch lejków co trzy istniejące funkcje forced-war (zaraz po nich), która:

1. Wyjście natychmiastowe (no-op) gdy: `oldOwner === newOwner`; `oldOwner === 0` LUB
   `newOwner === 0` (Q3: wyłącznie AI↔AI); para `(oldOwner, newOwner)` jest AKTYWNĄ parą w
   KTÓRYMKOLWIEK z `bronzeForceWarActiveByPairKey` / `stoneForceWarActiveByPairKey` /
   `ironForceWarActiveByPairKey` (ta para ma już WŁASNY mechanizm — zero podwójnego
   liczenia/podwójnego pokoju); `getDiploRelation(oldOwner, newOwner).status !== 'wojna'`
   (licz tylko realne, aktywne zwykłe wojny).
2. Nowa mapa stanu (np. `regularWarCapturedByPairKey: Map<string, { ownerA: number; ownerB:
   number; capturedByA: number; capturedByB: number }>`, `ownerA/ownerB` = para w stałej
   kolejności np. `Math.min/Math.max` żeby przypisanie licznika było deterministyczne
   niezależnie od tego, kto akurat zdobywa). Pobierz-lub-utwórz wpis dla `diploPairKey(...)`
   przy PIERWSZYM zdarzeniu zdobycia tej pary (leniwa inicjalizacja — brak wpisu = 0/0).
3. Inkrementuj właściwą stronę, sprawdź `shouldEndForcedWarByCityCount(capturedByA,
   capturedByB, WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE)`. Jeśli próg nieosiągnięty
   — zapisz zaktualizowany stan, koniec.
4. Jeśli próg osiągnięty: usuń wpis z mapy, wywołaj `finalizePeaceTreatyBetween(ownerA,
   ownerB, WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR)` (chyba że punkt odniesienia
   #2 wyżej pokaże, że trzeba inaczej — patrz uwaga tam), zaloguj `console.log` analogicznie
   do trzech istniejących funkcji (np. `[Dyplomacja] R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA:
   auto-pokój AI{a}↔AI{b} (zdobyte X/stracone Y)`).
5. **Sprzątanie przy zawarciu pokoju W OGÓLE (nie tylko przez ten mechanizm)** — jeśli
   właściciele mogą zawrzeć pokój inną drogą (zwykła negocjacja `zaproponuj_pokoj`,
   Priorytet 2) PODCZAS gdy licznik tej pary jest >0, wpis w nowej mapie MUSI zostać
   usunięty (inaczej licznik „przecieka" do NASTĘPNEJ wojny tej samej pary po cooldownie).
   Sprawdź czy `finalizePeaceTreatyBetween` (punkt odniesienia #2) jest JEDYNYM miejscem
   gdzie status pary zmienia się na `'pokoj'` — jeśli tak, dodaj tam analogiczne sprzątanie
   nowej mapy (wzorem sprzątania `bronzeForceWarActiveByPairKey` w tej samej funkcji, linie
   9134-9139) zamiast tylko w punkcie 4 wyżej.
6. **Save/load:** nowa mapa musi przetrwać zapis/wczytanie. Znajdź gdzie
   `bronzeForceWarActiveByPairKey` (lub jego serializowana forma) jest zapisywane/wczytywane
   w `buildSaveGameSnapshot()`/`restoreGameFromSave()` i dodaj analogiczny wpis dla nowej
   mapy (prosta struktura, NIE musi przechodzić przez `serializeForcedWarState` — to jest
   dla całego, bardziej złożonego systemu parowania wojen wymuszonych, którego ten temat
   NIE używa).

## Reguła przeciw samooszukiwaniu (ANTY-HALUCYNACYJNA)

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu — to jest mechanika
rozgrywki wieloturowej. Wymagany dowód: test uruchamiający REALNĄ (lub zminimalizowaną,
deterministyczną przez hak testowy) sekwencję: dwie cywilizacje AI w stanie 'wojna' (tura
>25, poza oknem reguły A), jedna zdobywa DWA miasta drugiej (przez faktyczne wywołanie
funkcji zmieniającej `city.ownerId` w kontekście wojny — NIE przez ręczne wywołanie samej
nowej funkcji w izolacji, to nie dowodzi że lejki są poprawnie podłączone) → DOWÓD że: (a)
po drugim zdobyciu `getDiploRelation(a,b).status==='pokoj'`; (b) próba wypowiedzenia nowej
wojny tej samej pary PRZED upływem 20 tur jest zablokowana (`isPeaceTreatyLocked`); (c) para
z AKTYWNĄ wojną WYMUSZONĄ (bronze/stone/iron) NIE jest dotknięta tym nowym mechanizmem
(zero regresji istniejących testów wojny wymuszonej); (d) wojna z udziałem GRACZA (dowolna
strona) nie jest w ogóle liczona przez nową funkcję (no-op potwierdzony np. przez log/hak
debugowy, nie tylko brak crasha).

## Binarne kryterium sukcesu

Nowy test `gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs` (lub podobna nazwa)
dowodzący scenariusza (a)-(d) wyżej PASS ORAZ `tsc --noEmit` czysty ORAZ 5 bramek
referencyjnych zielone ORAZ zero regresji: wszystkie istniejące testy wojny wymuszonej
(przeszukaj `gra/tools/*.cjs` po nazwach zawierających „wojna-wymuszona"/„forced-war"/
„epoka-kamien"/„epoka-brazu"/„epoka-zelazo") i istniejący test reguły 25-turowej (przeszukaj
po „25-tur"/„wczesna-faza"/`P-AI-WOJNA-WCZESNA-FAZA`).

## Allowlista

- `gra/src/main.ts`
- `gra/src/game/ai.ts` — WYŁĄCZNIE jeśli punkt odniesienia #2 pokaże, że regularna bramka
  wypowiedzenia wojny NIE sprawdza dziś `isPeaceTreatyLocked` (zgłoś to jawnie w raporcie,
  nie zakładaj cicho)
- nowy plik `gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs`

Zakazane bezwzględnie: `gra/src/game/forced-war-bronze.ts`, `forced-war-stone.ts`,
`forced-war-iron.ts`, `forced-war-common.ts` (WYŁĄCZNIE do odczytu jako wzorzec — zero
zmian, to są działające, przetestowane mechanizmy innego tematu), `eliminateOwner()` i cała
logika eliminacji cywilizacji (Q2: poza zakresem), `AI_MAJOR_EARLY_NO_WAR_TURNS`/reguła
25-turowa (działa poprawnie, nie dotykaj), pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-ai-wojny-zwykle-cap`, gałąź
`autobot/R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1`, baza `origin/main`. C-001: zakaz `npm run
build`/`dev` w `gra/`; dozwolona wyłącznie `node ./node_modules/vite/bin/vite.js build
--outDir <katalog spoza repo> --emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc
--noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5 rundach:
LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 600 słów w raporcie (temat złożony, +100 vs domyślne 500); ścieżki+SHA zamiast
diffu; zakaz `git add -A`. Nie integrujesz, nie deployujesz, nie pushujesz.
