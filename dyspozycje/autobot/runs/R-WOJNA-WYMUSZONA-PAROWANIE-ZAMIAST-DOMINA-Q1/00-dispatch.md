# R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1

STATUS: DYSPOZYCJA
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy/mechaniczny,
nie wizualny). **Uwaga: ten temat jest złożeńszy niż typowa jedna runda — dopuszczalne 5 rund,
nie oczekuj PASS w rundzie 1.**

## GENEZA

Dzisiejszy mechanizm „domino": dla KAŻDEJ aktywnej pary wojennej AI↔AI (per epoka: Kamień/
Brąz/Żelazo) OBIE strony dostają DODATKOWY cel = gracz, o ile gracz nie ma dziś własnej wojny
wymuszonej. Sojusz gracza z KTÓRĄKOLWIEK stroną pary blokuje CAŁĄ parę — ale wtedy sojusznik
(np. Rzym w zgłoszeniu właściciela) może skończyć BEZ ŻADNEJ wojny.

**ECHO właściciela (wiążące, dosłowne):** *„Najpierw wszyscy mają wojnę, potem trójkąty."*
Krok 1: cywilizacje BEZ ŻADNEJ aktywnej wojny są parowane 1v1 W PIERWSZEJ KOLEJNOŚCI.
Krok 2: dopiero gdy komuś zabraknie pary (nieparzysta liczba podmiotów), dołącza jako TRZECI
do istniejącej wojny. **Gracz traktowany DOKŁADNIE jak każde AI** — mechanizm domino w
dzisiejszej postaci znika, BEZ twardego limitu wojen gracza (właściciel świadomie odrzucił
wariant uprzywilejowujący gracza formalnie).

**Kryterium binarne (wiążące, dosłowne z ECHO):** *„po przydziale nie może istnieć podmiot
z zerem wojen, dopóki istnieje inny podmiot z dwiema lub więcej."*

## MAPA KODU DZISIEJSZEGO STANU (z reconu, zweryfikuj grepem przed edycją — linie mogły się
przesunąć od napisania tej dyspozycji)

- `gra/src/main.ts` ok. linii 30390-30408: wywołania `pickBronzeForcedWarDominoOwnerIds`/
  `pickStoneForcedWarDominoOwnerIds`/`pickIronForcedWarDominoOwnerIds`, budowane z map
  `bronzeForceWarActiveByPairKey`/`stoneForceWarActiveByPairKey`/`ironForceWarActiveByPairKey`
  (pary AI↔AI, `targetId !== 0`). Wynik (`xDominoOwnerIds`) używany dalej w `ownerLoop`
  (main.ts ok. linii 31244+, 31346+, 31436+): `if (xDominoOwnerIds.has(ownerId)) { xForceWarTargetId = 0; }`
  — DOKŁADA trzeci front (gracza) do istniejącej pary, NIE usuwa wpisu z
  `xForceWarActiveByPairKey` (obie AI nadal walczą też ze sobą — stąd trójkąt).
- Implementacja domino zduplikowana identycznie w trzech plikach: `pickBronzeForcedWarDominoOwnerIds`
  (`gra/src/game/forced-war-bronze.ts` ok. linii 323-336), `pickStoneForcedWarDominoOwnerIds`
  (`forced-war-stone.ts` ok. linii 222-235), `pickIronForcedWarDominoOwnerIds`
  (`forced-war-iron.ts` ok. linii 309-322).
- Osobny, WCZEŚNIEJSZY mechanizm — „coordinated initial pick" — decyduje kto z kim w ogóle
  wchodzi w wymuszoną wojnę NA STARCIE (zanim domino w ogóle wchodzi w grę):
  `pickBronzeForcedWarTargetIdCoordinated` (`forced-war-bronze.ts` ok. linii 283-300) i
  `pickStoneForcedWarTargetIdCoordinated` (`forced-war-stone.ts` ok. linii 166-183) —
  identyczna logika, per-owner (NIE globalnie skoordynowana pomimo nazwy: każdy szukający
  owner wybiera dla siebie najbliższego kandydata, nieświadomy czy inny owner w tej samej
  turze robi to samo), z fallbackiem na gracza gdy pula pusta. **Żelazo NIE MA odpowiednika
  coordinated** — `pickIronForcedWarTargetId` to goły `pickForcedWarTargetId` bez limitu
  trudności i bez `candidatesAlreadyAtWarIds` (potwierdzona asymetria między epokami,
  komentarz `forced-war-iron.ts` ok. linii 290-296).
- **Rzym bez wojny — dwa możliwe mechanizmy, kod nie rozstrzyga jednoznacznie który
  zaszedł u właściciela** (recon nie potrafi tego odróżnić z samego czytania kodu):
  (a) domino zablokowało CAŁĄ parę przez sojusz, ale to nie tłumaczy zera wojen samo w sobie
  (istniejąca wojna Rzym↔partner powinna trwać), (b) bardziej prawdopodobne: wojna Rzymu
  zakończyła się tej samej tury (próg miast/limit czasu), Rzym szukał NOWEGO celu przez
  coordinated-pick, sojusz z graczem wykluczył gracza z puli, a wszyscy pozostali kandydaci
  byli już zajęci → `pickForcedWarTargetId` zwrócił `null`. **Operator: nie musisz
  rozstrzygać który wariant zaszedł historycznie — zaprojektuj nowy algorytm tak, żeby
  NAPRAWIAŁ oba przypadki naraz** (patrz niżej), zamiast szukać dokładnej przyczyny
  pojedynczego incydentu.
- `gra/src/game/ai.ts`: NIE implementuje domina ani parowania (zero trafień grepem na
  „ForcedWarDomino"). Rola: `decideAIDiplomacy` czyta już WYLICZONY `xForceWarTargetId`
  (bez rozróżnienia coordinated vs domino) i zwraca komendę `wypowiedz_wojne`, o ile cel nie
  jest już `stanWojny`/`peaceLocked`/NAP/sojuszem. **Nowy algorytm parowania NIE powinien
  wymagać zmian w `ai.ts`** — wystarczy że main.ts nadal ustawia te same trzy pola wejściowe
  (`bronzeForceWarTargetId`/`stoneForceWarTargetId`/`ironForceWarTargetId`).

## ROZSTRZYGNIĘCIE ZAKRESU (orkiestrator, korekta procesu — nie nowa mechanika, nie liczba
balansu, więc rozstrzygane tu, nie eskalowane do właściciela)

ECHO nazywa wprost tylko warstwę „domino" jako znikającą. Ale kryterium binarne
(„zero wojen niedopuszczalne, dopóki ktoś ma ≥2") jest GLOBALNYM niezmiennikiem, którego
samo przepisanie warstwy domino NIE gwarantuje — przypadek (b) wyżej pokazuje, że „zero
wojen" może powstać już w coordinated-pick, per-owner, zanim domino się uruchomi. Dlatego:

**Nowy, wspólny algorytm parowania ZASTĘPUJE FUNKCJONALNIE oba dzisiejsze mechanizmy
(coordinated-pick I domino-redirect) jedną procedurą, wołaną RAZ na turę, PRZED `ownerLoop`**
(dokładnie tam, gdzie dziś liczone jest `xDominoOwnerIds`, main.ts ok. linii 30360-30408).
Wszystko PO wyborze pary (zapis do `xForceWarActiveByPairKey`, próg miast kończący wojnę,
limit czasu trwania, cooldown tej samej pary, wejście w erę) zostaje BEZ ZMIAN — te zasady
są świadomie różne per epoka i ECHO ich nie kwestionuje.

**Pula „podmiotów bez wojny" (krok 1 ECHO) jest GLOBALNA** — liczona jako CAŁKOWITA liczba
aktywnych wojen wymuszonych danego ownera (wszystkie trzy epoki + gracz razem), NIE per-epoka
osobno. Uzasadnienie: samo kryterium binarne mówi o „podmiocie", nie o „podmiocie w epoce X" —
civ mający już 1 wojnę w Brązie nie jest „bez wojny" tylko dlatego, że akurat trwa też runda
Kamienia. Które podmioty w ogóle biorą pod uwagę tę turę (kto jest „triggered", czyli
`shouldSearch===true`) zostaje PER EPOKA, zgodnie z dzisiejszymi wyzwalaczami — ECHO nie każe
zmieniać KIEDY dana era szuka celu, tylko JAK paruje.

## GOAL — algorytm (szkic z reconu, Operator dopracowuje szczegóły inżynieryjne)

Jedna wspólna, czysta funkcja w `gra/src/game/forced-war-common.ts` (wzorem istniejącego
neutralnego rdzenia `pickForcedWarTargetId`/`shouldEndForcedWarByCityCount` używanego już
przez wszystkie trzy epoki), wołana raz na turę z main.ts, zastępująca DZIŚ istniejące
wywołania coordinated-pick (per owner, w pętli) i domino (blok przed `ownerLoop`):

```
function assignForcedWarPairings(...):
  # 1. Zbierz podmioty "triggered" tej tury (shouldSearch===true per epoka, jak dziś —
  #    Kamień ∪ Brąz ∪ Żelazo, bez podwójnego liczenia tego samego ownera) PLUS gracz,
  #    jeśli gracz sam nie ma dziś żadnej aktywnej wojny wymuszonej (odczyt RAZY, przed
  #    ownerLoop — jak dzisiejszy `playerAlreadyHasActiveForcedWar`, ale bez specjalnego
  #    wykluczania, gracz jest zwykłym podmiotem w tej puli).
  # 2. Z tej puli wybierz "warless" = ci, których CAŁKOWITA liczba aktywnych wojen
  #    wymuszonych (wszystkie epoki) === 0.
  # 3. Paruj warless 1v1 (deterministycznie — sortowanie po ownerId lub najbliższy
  #    terytorialnie jak dzisiejszy pickForcedWarTargetId), z respektem blockedOwnerIds
  #    (NAP/peaceLocked/sojusz) MIĘDZY KAŻDĄ rozważaną parą — sojusz blokuje TĘ jedną parę,
  #    nie całą pulę.
  # 4. Nieparzysta reszta (0 lub 1 podmiot po kroku 3) DOŁĄCZA jako TRZECI do istniejącej
  #    pary (dowolnej epoki) zamiast zostać bez wojny — wybierz parę, gdzie ŻADNA strona
  #    nie ma sojuszu z leftover. Jeśli WSZYSTKIE pary zablokowane sojuszem: DECISION_REQUIRED
  #    (nie zgaduj czy sojusz przegrywa w tym brzegowym przypadku).
  # 5. Zastosuj: pary z kroku 3 → normalna deklaracja wojny (era-specific targetId);
  #    trójkąty z kroku 4 → jak dzisiejsze domino (targetId = wybrana strona pary).
```

**Kryterium sukcesu wprost z ECHO, binarne, ma być zaimplementowane jako ASERCJA w bramce:**
po zastosowaniu kroków 1-5 dla dowolnego zestawu wejściowego (symulacja/property-based OK),
NIE MOŻE istnieć podmiot z 0 aktywnych wojen wymuszonych, jeśli jednocześnie istnieje inny
podmiot z ≥2.

## ALLOWLISTA

- `gra/src/game/forced-war-common.ts` (nowa funkcja/e parowania — rdzeń)
- `gra/src/game/forced-war-bronze.ts`, `forced-war-stone.ts`, `forced-war-iron.ts`
  (usunięcie/zastąpienie `pickXForcedWarDominoOwnerIds` i `pickXForcedWarTargetIdCoordinated`;
  cienkie wrappery wołające wspólny rdzeń są OK, logika progu miast/czasu/cooldownu w tych
  plikach zostaje NIETKNIĘTA)
- `gra/src/main.ts` (WYŁĄCZNIE punkt wywołania przed `ownerLoop`, ok. linii 30360-30408, oraz
  debug-hook `forceBronzeForcedWarDominoOnPlayer` ok. linii 21497-21588 jeśli wymaga
  zrewidowania pod nowy kształt — zakaz zmian gdziekolwiek indziej w main.ts)
- Istniejące bramki (do aktualizacji, NIE osłabiania): `gra/tools/forced-war-trojstronna-test.cjs`,
  `gra/tools/forced-war-trojstronna-domino-live-test.cjs`,
  `gra/tools/forced-war-trojstronna-main-guard-test.cjs`,
  `gra/tools/forced-war-bronze-test.cjs`, `gra/tools/forced-war-stone-test.cjs`,
  `gra/tools/forced-war-iron-test.cjs`, `gra/tools/forced-war-player-target-live-test.cjs`,
  `gra/tools/forced-war-iron-player-target-live-test.cjs`,
  `gra/tools/forced-war-reguly-multi-turn-simulation-test.cjs`,
  `gra/tools/p-wojna-wymuszona-trzy-naprawy-test.cjs` (znajdź KOMPLETNĄ listę grepem
  `find gra/tools -iname "*forced-war*"` — powyższa lista pochodzi z reconu sprzed tej
  rundy, może być niekompletna).
- Nowa bramka (zalecana): `gra/tools/wojna-wymuszona-parowanie-test.cjs` — property-based/
  wielo-scenariuszowy dowód niezmiennika binarnego (krok 5 wyżej), NIE tylko pojedynczy
  scenariusz z historii (Rzym).
- `dyspozycje/autobot/runs/R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/ai.ts` (recon
potwierdził że nie wymaga zmian — dotknięcie = czerwona flaga wykraczania poza zakres),
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`.
Zakaz `git add -A` i `git add .`.

## BINARNE KRYTERIUM SUKCESU

- Nowa bramka (lub rozszerzenie istniejącej) dowodzi niezmiennika ECHO dla WIELU scenariuszy
  (parzysta/nieparzysta liczba podmiotów, gracz wliczony, sojusze blokujące różne pary,
  scenariusz odtwarzający pierwotny incydent Rzymu — zero wojen dla sojusznika NIE występuje).
- Trzy dotychczasowe pliki `forced-war-{bronze,stone,iron}.ts` nie mają już duplikowanej
  logiki domino/coordinated (albo mają cienki wrapper wołający wspólny rdzeń — Operator
  uzasadnia wybór w raporcie).
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), CAŁA rodzina `forced-war-*` (wypisz
  reprodukowalny grep + wynik KAŻDEJ w raporcie, nie wyselekcjonowaną listę).

## IZOLACJA

Worktree `/home/user/wt-wojny-domino`, gałąź
`autobot/R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1`, baza jawnie `origin/main`
(commit `981c86a5`, PO integracji Prawa/Garnizonu/AI-produkcji/trofeów/wycinki) — potwierdź
`git log -1` PRZED pracą (SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

**Kolejka `main.ts` (§2b):** ten temat jest TRZECI w kolejce (po `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`,
`R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, `R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1` — wszystkie
zintegrowane). Po tym temacie w kolejce: `R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1`,
`P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED` — DECISION_REQUIRED do właściciela, nie kolejna runda.

## GRANICE

- Zero zmian w `ai.ts` (recon potwierdził że niepotrzebne).
- Zero zmian progów miast/czasu trwania/cooldownu per epoka — to świadomie różne per epoka,
  ECHO ich nie rusza.
- Brzegowy przypadek "wszystkie istniejące pary zablokowane sojuszem dla leftover" (krok 4):
  **DECISION_REQUIRED**, nie zgaduj.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
