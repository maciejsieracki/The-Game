# R-HOTSEAT-ETAP6F-RECON-START-Q1 — Evaluator, runda 1

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-RECON-START-Q1
GOAL: Recon kategorii "start gry/wybór cywilizacji" (6/6, ostatni pod-etap Etapu 6).
TESTY: Weryfikacja niezależna: świeży `grep -n` na `_menuCivId`, `applyMenuParams`,
`fillAiOwnerCivMap`, `applyClusterStartPlan`, `playerStartHex`, `repairAiRosterFromMap`,
`newGameParamsForLoad`, `assignAiCivTypes(` w `gra/src/main.ts` + `Read` funkcji
`restoreAiRosterFromSave` (7538-7574) + `git status`/`git diff --stat`/`git log` w
`/home/user/wt-hotseat-etap6a-input` + arytmetyka `python3` na listach linii operatora.
BLOKADY: brak nowych (poza ABC operatora, nadal aktualne).
RUNDY: 1/5
ZARZUTY:
1. **Brakująca funkcja w inwentarzu**: `restoreAiRosterFromSave` (`main.ts:7538-7574`,
   wołana przy wczytaniu zapisu, `main.ts:36058`) jest TRZECIM wywołaniem
   `assignAiCivTypes` (obok `fillAiOwnerCivMap` @7524 i `repairAiRosterFromMap` @2139 —
   potwierdzone `grep -n "assignAiCivTypes("` → dokładnie 3 trafienia: 2139, 7524, 7555),
   z identycznym celem "wyklucz civ gracza z puli AI" (`playerCivId: civId` @7557, `civId
   = player.civType || _menuCivId || 'grecy'` @7550) — a mimo to CAŁA ta funkcja jest
   nieobecna w dokumencie, nienazwana ani razu. To narusza wprost kryterium sukcesu
   rundy: "kompletna świeżo zweryfikowana lista miejsc".
2. **Fałszywe/niezweryfikowane twierdzenie o zerowym nakładaniu z Etapem 1**: §0
   dokumentu stwierdza "ŻADNE z nich nie używa humanSeats/isAiOwner... Zero nakładania
   Etapu 1 na tę kategorię", ale sprawdzono to WYŁĄCZNIE dla `fillAiOwnerCivMap` i
   `applyClusterStartPlan` — nie dla całej kategorii. `restoreAiRosterFromSave` (patrz
   zarzut 1, sama w kategorii "start") zawiera na `main.ts:7570` żywe wywołanie
   `isAiOwner(humanSeats, c.ownerId)` — czyli realne, bezpośrednie nakładanie z Etapem 1
   ISTNIEJE w tej kategorii i nie zostało wykryte, bo funkcja nie trafiła do inwentarza.
3. **Błędna atrybucja linii 7557**: dokument liczy `7557` (`playerCivId: civId,`) jako
   część bucketu `fillAiOwnerCivMap` ("def + param + 2 call sites + log: 7516, 7526,
   7557, 10552"), ale `7557` leży fizycznie wewnątrz `restoreAiRosterFromSave`, nie
   `fillAiOwnerCivMap` (potwierdzone `Read` main.ts:7538-7574) — opis bucketu jako "2
   call sites" `fillAiOwnerCivMap` jest błędny (realny drugi call site to `34041`,
   policzony gdzie indziej, w buckecie `_menuCivId/applyMenuParams`). Efekt: liczba `57`
   "zgadza się" częściowo przypadkiem (linia z obcej funkcji podstawiona w miejsce
   właściwej), a nie dlatego, że inwentarz jest poprawnie rozliczony — rzeczywista suma
   po doliczeniu pominiętych elementów `restoreAiRosterFromSave` (def 7538, hardkod
   `.filter(id => id !== 0)` @7549 — analogiczny wzorzec kategorii (i) do dwóch już
   znalezionych, fallback @7550, call site @36058) jest WYŻSZA niż 57.
4. **Niespójna arytmetyka wewnątrz dokumentu (ten sam typ błędu co Etap 6e runda 2,
   od którego dispatch explicite ostrzegał)**: bucket "5 literalnych wejść New Game"
   opisany jako "(5 miejsc × 2 linie)" z podanymi zakresami `22544-22545, 22809-22810,
   34739-34740, 35019-35021, 35240-35242` — suma surowa tych zakresów to **12** linii
   (dwa zakresy mają po 3 linie, nie 2: `python3` na listach `[22544,22545,22809,2281
   0,34739,34740,35019,35020,35021,35240,35241,35242]` → `len=12`), po odjęciu
   nakładania z bucketem `_menuCivId`/`applyMenuParams` (linie `35019` i `35240`
   występują w OBU listach, `set` overlap = `{35019, 35240}`, 2 elementy) daje **10**,
   nie **9** jak podano w tekście ("— 9 (po odjęciu nakładania)"). Suma `main.ts=47` w
   tabeli §1 jest wewnętrznie spójna TYLKO jeśli ten bucket = 10 (`12+4+5+11+10+4+1=47`,
   zweryfikowane `python3`) — z podaną w tekście wartością 9 wychodzi 46, nie 47. Sam
   dokument sobie przeczy.
5. **Podział migracja-vs-nowa-funkcjonalność jest niekompletny wskutek zarzutu 1**:
   `restoreAiRosterFromSave` powinna być trzecią pozycją kategorii (i) "prosta migracja"
   obok `fillAiOwnerCivMap` i `repairAiRosterFromMap` (identyczny wzorzec: wyklucz civ
   gracza z `assignAiCivTypes`) — dokument w §3 wymienia tylko dwie, więc plan dowodu
   no-op (i) też jest niekompletny (nie obejmuje trzeciej funkcji).

Poza powyższym: podział main.ts/newGameFlow.ts/cluster-start.ts (47/6/4), bucket
`applyClusterStartPlan` (8420/8421/8430/8444/8550), bucket `playerStartHex` (11 linii),
bucket `cluster-start.ts` (24/53/77/111) i literalne wejścia `civId:'rzymianie'` — świeżo
zweryfikowane, TREŚCIOWO poprawne. Wyjaśnienie różnicy 57 vs "~15" jakościowo trafne
(plan liczył punkty kotwiczące, nie miejsca konsumujące) — problem leży w kompletności
liczby 57 samej (zarzuty 1/3), nie w metodzie wyjaśnienia rozjazdu. Sprawdzenie stanu
`/home/user/wt-hotseat-etap6a-input` (anomalia niezacommitowanej linii @26304) było
aktualne w chwili pisania — świeże `git status`/`git diff --stat` w tym worktree TERAZ
pokazują czysty stan (nowszy commit `0787e496` doszedł po pracy Operatora) — to zmiana
stanu w czasie, NIE błąd Operatora, nie zaliczam jako zarzut.

NASTEPNY KROK: Obrona Operatora (ta sama runda, R-PROC-AUTOBOT.md §3c) — musi dodać
`restoreAiRosterFromSave` do inwentarza (z realnym wpływem na sumę i na kategorię (i)),
skorygować nakładanie z Etapem 1, i naprawić arytmetykę bucketu literalnych wejść
narzędziem, po czym zweryfikować spójność liczby końcowej WSZĘDZIE w dokumencie.
DEPLOY/PUSH: NIE WYKONANO
