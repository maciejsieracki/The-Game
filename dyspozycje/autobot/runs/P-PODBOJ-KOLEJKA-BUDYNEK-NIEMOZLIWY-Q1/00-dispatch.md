# P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1

STATUS: DYSPOZYCJA
DOMAIN: GAME
TEMAT: P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy/mechaniczny,
nie wizualny).

## GENEZA (ECHO właściciela, dosłowny cytat z rejestru)

„Jeśli zajmujemy miasto-państwo innej cywilizacji, mogła ona budować pałac, ponieważ była
jedyną stolicą swojej cywilizacji. Gdy przejmuję to miasto, ona nadal buduje pałac, który
mógłby być budowany przeze mnie, ale nie powinien. Cała nadwyżka powinna trafić do głównej
puli, ponieważ w cywilizacji może być tylko jeden pałac."

**ECHO (AskUserQuestion):**
1. Zwrot Pracy — **„Do mojej puli — zdobywcy"** (świadomie ODWROTNIE niż istniejąca
   konwencja dla legacy jednostek w kolejce, gdzie zwrot idzie do POPRZEDNIEGO właściciela —
   to jest osobna, wcześniej zatwierdzona decyzja, NIE do zmiany).
2. Zakres — **„Wszystkie niemożliwe do postawienia"**, nie tylko Pałac.

## STAN DZISIEJSZY (zweryfikowany bezpośrednim czytaniem kodu, zweryfikuj grepem PRZED
edycją — linie mogły się przesunąć)

**Mechanizm „jedyny w cywilizacji" — nie ma osobnej flagi.** To jest efekt EMERGENTNY z pola
`BuildingDef.lokalizacja: 'stolica' | 'region'` (`gra/data/buildings.json`), egzekwowanego
przez `buildingLocationAllowed()` w `gra/src/game/production.ts` ok. linii 485-491:
```ts
function buildingLocationAllowed(lokalizacja, isCapital) {
  if (lokalizacja === 'stolica') return isCapital === true;
  if (lokalizacja === 'region') return isCapital === false;
  return true;
}
```
Wołane w `availableProduction()` (`production.ts` ok. linii 823) i `eraBuildingCatalog()`
(ok. linii 2198). `isCapital` liczone z `capitalCityIdForOwner(ownerId)` (`main.ts` ok. linii
26053-26057) — **jedna stolica na cywilizację** → „jeden Pałac na cywilizację" wynika
automatycznie, potwierdzone komentarzem przy Mennicy w `buildings.json` (uwaga 70/B):
„Mennica WYŁĄCZNIE w stolicy, jedna sztuka na cywilizację (wynika automatycznie z
'lokalizacja':'stolica')".

**UWAGA — nie myl z `maksPoziom: 1`.** To jest limit POZIOMU w JEDNYM mieście, zupełnie inny
mechanizm, nie dotyczy tego tematu.

**UWAGA — cuda (wonders) to OSOBNY, niepowiązany system** (unikalność ŚWIATOWA, nie
imperium, `wonders-data.ts`/`wonderGateOk`). Pałac go NIE używa — nie mylić zakresu.

**Pełna lista budynków `lokalizacja: 'stolica'`** (cały zakres GOAL, punkt 2 ECHO):
`mennica`, `palac`, `palac_ii`, `palac_iii`. Zweryfikuj grepem `"lokalizacja".*"stolica"` w
`gra/data/buildings.json` PRZED implementacją — to jest źródło prawdy, nie ta lista wpisana
ręcznie (mogła się zmienić od napisania tej dyspozycji).

**Dwa miejsca przejęcia miasta, oba z tym samym brakiem walidacji:**
1. Podbój bojowy: `gra/src/main.ts` ok. linii 26921-26937, wewnątrz obsługi zdobycia miasta.
2. Kapitulacja głodowa: `gra/src/main.ts` ok. linii 13382-13389, wzorzec identyczny.

Oba wołają `sanitizeBuildQueue()` (`gra/src/game/production.ts` ok. linii 1272 — usuwa
WYŁĄCZNIE legacy jednostki z kolejki) i `sanitizeProductionQueue()` (`main.ts` ok. linii
3841-3855 — filtruje WYŁĄCZNIE cuda przez `wonderGateOk`). **Żadna z tych funkcji nie zna
pojęcia „budynek lokalizacja:stolica, którego zdobywca nie może postawić"** — budynki takie
przechodzą przez obie funkcje 1:1, dokańczane normalnie przez zdobywcę mimo że po ukończeniu
i tak będą niebudowalne/bezużyteczne (albo, gorzej, jeśli logika budowy nie sprawdza tego przy
ukończeniu — realnie postawione jako DRUGI Pałac w imperium, co jest samym sednem zgłoszenia).

**Gotowy precedens kierunku zwrotu (WZORZEC do naśladowania):** filtr cudów wewnątrz
`sanitizeProductionQueue()` (`main.ts` ok. linii 3844, 3852) JUŻ zwraca `forfeitedPostep` do
`ownerId` przekazanego jako PARAMETR — a w obu capture-site'ach tym parametrem jest ZDOBYWCA
(`atkOwner`/`newOwner`). To jest dokładnie kierunek zwrotu wymagany przez ECHO — nowa logika
dla budynków-stolica ma robić TO SAMO, nie wymyślać nowego wzorca.

**Konwencja legacy-jednostek (zostaje BEZ ZMIAN, osobna, wcześniej zatwierdzona decyzja):**
`setOwnerPracaPool(oldOwner, ...)` — dokładnie 2 wystąpienia: `main.ts` ok. linii 13386 i
26933, komentarze „zwrot Pracy należy do starego właściciela"/„Postęp zwracamy poprzedniemu
właścicielowi". **Operator: NIE dotykaj tych dwóch linii.**

## GOAL

W obu miejscach przejęcia miasta (main.ts ok. linii 13382-13389 i 26921-26937), PO istniejących
wywołaniach `sanitizeBuildQueue`/`sanitizeProductionQueue`, dodaj nowy filtr operujący na
wynikowej kolejce (`migrated.prod`):
1. Dla każdej pozycji w kolejce typu `budynek`, sprawdź w `data.buildings` czy jej
   `lokalizacja === 'stolica'`.
2. Jeśli tak I `capitalCityIdForOwner(atkOwner/newOwner) !== city.id` (zdobywca ma już
   INNĄ stolicę — to zdobyte miasto NIE jest jego stolicą) → usuń pozycję z kolejki.
3. Zwróć zgromadzony postęp (Pracę) tej pozycji **ZDOBYWCY** (`setOwnerPracaPool(atkOwner, ...)`
   / `setOwnerPracaPool(newOwner, ...)`) — NOWA, OSOBNA linia, nie zmieniająca istniejącej
   linii `oldOwner` dla legacy jednostek w tym samym bloku.
4. Zakres obejmuje WSZYSTKIE 4 budynki `lokalizacja:'stolica'` (weryfikuj z danych, nie z
   listy wpisanej w tej dyspozycji), nie tylko Pałac.
5. Brzegowy przypadek: jeśli zdobyte miasto WŁAŚNIE STAJE SIĘ nową stolicą zdobywcy (np.
   zdobywca nie miał wcześniej żadnego miasta — sytuacja rzadka ale możliwa dla mniejszych
   cywilizacji) — `capitalCityIdForOwner` liczone PO zmianie `city.ownerId` (już ustawionej
   przez ten punkt kodu) powinno to poprawnie rozpoznać jako "to JEST jego stolica" i NIE
   usuwać budynku z kolejki. Zweryfikuj to testem, nie zgaduj.

## BINARNE KRYTERIUM SUKCESU

- Nowa bramka: symulacja podboju miasta z Pałacem (lub Mennicą) w kolejce, gdzie zdobywca
  JUŻ MA stolicę gdzie indziej → budynek usunięty z kolejki, Praca trafia do PULI ZDOBYWCY
  (nie poprzedniego właściciela), zweryfikowane odczytem `ownerPracaPool(atkOwner)` przed/po.
- Kontrola negatywna: to samo miasto, ale to jest PIERWSZA/JEDYNA stolica zdobywcy → budynek
  ZOSTAJE w kolejce, zero zwrotu.
- Kontrola negatywna: legacy jednostka w tej samej kolejce nadal zwraca Pracę do
  POPRZEDNIEGO właściciela (zero regresji na już zatwierdzonej konwencji).
- Test dla WSZYSTKICH 4 budynków `lokalizacja:'stolica'`, nie tylko Pałacu.
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), CAŁA rodzina bramek dotykających
  produkcji/kolejki/podboju/capital (wypisz reprodukowalny grep + wynik każdej w raporcie:
  `find gra/tools -iname "*production*" -o -iname "*capture*" -o -iname "*podboj*" -o -iname "*capital*" -o -iname "*queue*" -o -iname "*kolejka*"`).

## ALLOWLISTA

- `gra/src/game/production.ts` (tylko jeśli potrzebna nowa, mała funkcja pomocnicza —
  np. eksport `buildingLocationAllowed` albo nowa `isBuildingStillBuildableByOwner`)
- `gra/src/main.ts` (WYŁĄCZNIE oba bloki przejęcia miasta ok. linii 13382-13389 i
  26921-26937 — zakaz zmian gdziekolwiek indziej w main.ts, w szczególności ZAKAZ dotykania
  linii `setOwnerPracaPool(oldOwner, ...)` w tych samych blokach)
- Nowa bramka `gra/tools/podboj-kolejka-budynek-niemozliwy-test.cjs` lub rozszerzenie
  istniejącej bramki produkcji/podboju jeśli bardziej pasuje (uzasadnij wybór w raporcie)
- `dyspozycje/autobot/runs/P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/wonders-data.ts`
(system cudów — osobny, nietknięty), `gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-kolejka-podboj`, gałąź `autobot/P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`,
baza jawnie `origin/main` (commit `17c4c55f`, PO integracji Prawa/Garnizonu/AI-produkcji/
trofeów/wycinki/wojny-domino/religii) — potwierdź `git log -1` PRZED pracą (SS2b: jeden
pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

**Kolejka `main.ts` (§2b):** ten temat jest OSTATNI w kolejce main.ts (po handel-podział,
trofeach, wycince, wojnach-domino, religii — wszystkie zintegrowane). Po zamknięciu tego
tematu main.ts jest wolny dla następnych tematów spoza tej fali.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian w systemie cudów (`wonders-data.ts`) — inny, niepowiązany mechanizm unikalności.
- Zero zmian w konwencji zwrotu Pracy dla legacy jednostek (`oldOwner`) — osobna, zamknięta
  decyzja.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
