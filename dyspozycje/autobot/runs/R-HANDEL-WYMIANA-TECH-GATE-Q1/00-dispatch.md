# R-HANDEL-WYMIANA-TECH-GATE-Q1 — dispatch

TEMAT: `R-HANDEL-WYMIANA-TECH-GATE-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow, effort per rola — `.claude/skills/civ-autobot-workflow/SKILL.md`)
MODEL+EFFORT: Operator — Sonnet 5, effort **high** (zmiana przecina 3 warstwy: rdzeń
tras, dyplomacja gracza, dyplomacja AI↔AI); Evaluator — Sonnet 5, effort **high**;
Final Control — Sonnet 5, effort **high** (osobne wywołanie, poza tym skryptem).

## WYZWALACZ (dosłownie, wiadomość właściciela)

> „Te same ograniczenia muszą obejmować państwa, miasta i inne cywilizacje AI.
> Dodatkowo punktem startu dla możliwych umów wymiany i handlowania z inicjatywami
> powinno być wynalezienie samego znaleziska w wymiana."

ECHO doprecyzowujące (AskUserQuestion, odpowiedź właściciela wybrana explicite):
**„Cały handel, łącznie z wewnętrznym"** — bramka technologiczna „Wymiana" blokuje
zarówno handel zewnętrzny (traktatowy), jak i nowy handel wewnątrz-cywilizacyjny.

Temat został ŚWIADOMIE odłożony jako punkt (6) przy dispatchu
`R-HANDEL-LIMIT-TRAS-PELNY-Q1` i dispatchowany dopiero teraz, **sekwencyjnie po
integracji tamtego** (ten sam plik `gra/src/game/trade-routes.ts` i `gra/src/main.ts`,
`R-PROC-AUTOBOT.md` §2b). Baza tego tematu to architektura POST-integracyjna:
existence-sloty, wszystkie pary właścicieli, handel wewnętrzny.

## RECON (zweryfikowany bezpośrednim odczytem kodu, nie z pamięci)

**A. Stan per-owner „zbadane technologie" ISTNIEJE i jest jednolity.**
- Gracz: `player.zbadane: Set<string>` — `gra/src/main.ts:3255`.
- AI (`ownerId>0`, w tym państwa-miasta): `aiResearchDone: Map<number, Set<string>>`
  — `gra/src/main.ts:7165`, uzupełniane przez `runAiResearchForOwner`
  (`gra/src/main.ts:25363`, zapis `aiResearchDone.set` w l. 25415), wołane dla każdego
  `ownerId>0` posiadającego miasto (`gra/src/main.ts:28383-28387`, `28419-28421`).
- **Gotowe akcesory per-owner — to są miejsca do użycia, NIE buduj nowych:**
  `unlockedTechSetForOwner(ownerId)` (`gra/src/main.ts:3254-3257`),
  `ownerResearchedTechs(ownerId)` (`gra/src/main.ts:25426-25428`).
- **AI ma REALNE własne badania, nie tylko epokę** — to nie jest luka do obejścia.
  Epoka (`empireEpochForOwner`, `gra/src/main.ts:1755-1758`) jest stanem POCHODNYM,
  synchronizowanym z badań przez `syncOwnerEraFromResearch` (`gra/src/main.ts:1775`)
  — **nie używaj epoki jako proxy dla bramki.**
- Państwa-miasta mają `ownerId>0` i miasta, więc mają wpis w `aiResearchDone`.
  `isCityStateOwner` (`gra/src/main.ts:6129`) różnicuje TYLKO ścieżkę awansu epoki
  — bramka techniczna działa dla nich automatycznie, bez osobnej gałęzi kodu.

**B. Jedyne wywołanie `refreshTradeRoutes`** — `gra/src/main.ts:13713-13722`,
argumenty: `tradeCities, tradeRoutes, map, cityBuilt, isAtWarFn, hasTradeTreatyFn,
tradeParams, buildAllTerritoryNodes(), tradeIncomeParams`. `hasTradeTreatyFn` powstaje
w l. 13710 jako `(a,b) => hasSzlakowTreaty(activeDeals, a, b)`; ta sama funkcja idzie
do `reportTradeRouteEvents` (`gra/src/main.ts:13735-13737`).

**C. Miejsca zawierania/proponowania `RodzajTraktatu.UmowaSzlakow`:**
- bramka propozycji gracza (akcja `'5'`): `gra/src/game/diplomacy-locks.ts:209-218`
  — **wzorzec do naśladowania jest tuż obok**: `ctx.hasTradeConnection` (l. 211-213)
  to dokładnie ta sama klasa bramki (twardy warunek + `note` dla gracza);
- mapowanie `umowa_szlakow` → `'5'`: `gra/src/main.ts:15681`;
- budowa dealu: `gra/src/game/diplomacy-proposals.ts:1491-1497`;
- akceptacja propozycji AI przez gracza: `gra/src/game/diplomacy-proposals.ts:2080-2093`;
- efekt po akceptacji: `gra/src/main.ts:18610-18616`;
- AI↔AI samodzielnie: `formAiAiTradeAgreementsIfEligible` (`gra/src/main.ts:17651`),
  pętla warunków par w l. 17665-17681, `addTreaty(... UmowaSzlakow ...)` w l. 17752-17758,
  wołane z `gra/src/main.ts:31684`.

**D. Technologia „Wymiana" NIE MA dziś ŻADNEJ referencji logicznej w `gra/src`.**
Istnieje w danych: `gra/data/tech.json:124` (Epoka Kamień, poziom 2, prereq
`Garncarstwo + Rolnictwo + Oswojenie zwierząt`, koszt 64, odblokowuje budynek
Targowisko). W kodzie tylko ikona (`gra/src/ui/techIcons.ts:45`) i komentarz
(`gra/src/ui/cityPanel.ts:7038`). **Uwaga na fałszywe trafienia grepu:**
`UmowaWymiany` i `progWymianaTechZaufanie` (`gra/src/game/diplomacy-treaties.ts:234`)
to INNE byty — traktat wymiany surowców i próg wymiany technologii — nie mają nic
wspólnego z tą technologią.

**E. Istniejący, produkcyjny wzorzec „technologia odblokowuje MECHANIKĘ (nie budynek)":**
embarkacja — `EMBARK_TECH = 'Żegluga'` (`gra/src/game/embarkation.ts:22`), sprawdzenie
per-owner `ownerHasSeafaring` (`gra/src/main.ts:10382-10386`: gracz przez
`player.zbadane`, AI przez `aiResearchDone`), konsumowane w `moveCostFnForUnit`
(`gra/src/main.ts:10389-10391`). Drugi wzorzec: `isImprovementTechUnlocked`
(`gra/src/game/improvement-tech.ts:140`, gracz `main.ts:12122`, AI `main.ts:31557-31558`).
**Naśladuj wzorzec E — stała nazwy techu w module `game/`, predykat per-owner w
`main.ts`, wstrzyknięcie do czystego modułu.** Nie czytaj `player.zbadane` z wnętrza
`trade-routes.ts` (moduł jest czysty, bez dostępu do stanu gry — to jest warunek
działania bramek testowych w Node).

## GOAL

Cywilizacja, która NIE zbadała technologii „Wymiana", nie prowadzi ŻADNEGO handlu
szlakowego — ani zewnętrznego (traktatowego), ani wewnątrz-cywilizacyjnego — i nie
może zawrzeć ani zaproponować Umowy Szlaków. Dotyczy tak samo gracza, cywilizacji AI
i państw-miast.

### GOAL 1 — rdzeń: `refreshTradeRoutes` nie tworzy trasy bez techu

`gra/src/game/trade-routes.ts` dostaje **nowy, wstrzykiwany predykat**
`hasTradeTech: (ownerId: number) => boolean`, konsumowany na etapie generowania
kandydatów (nie na etapie filtrowania wyniku — kandydat bez techu ma NIE powstawać,
żeby nie zajmował slotu ani miejsca w priorytetyzacji):
- trasa **zewnętrzna** (owner A ≠ owner B): wymaga `hasTradeTech(A) && hasTradeTech(B)`;
- trasa **wewnętrzna** (ten sam owner): wymaga `hasTradeTech(owner)`;
- trasy **kontynuujące** (istniejące w `existingRoutes`) podlegają tej samej regule —
  gdy warunek nie jest spełniony, trasa NIE trafia do `kept[]`.

**Zgodność wsteczna jest wymagana:** nowy parametr ma domyślną wartość
`() => true`, żeby wszystkie istniejące bramki i testy (`trade-routes-limit-test.cjs`,
`trade-routes-hud-filter-test.cjs`, `logic-test.cjs` i pozostałe) przechodziły bez
przepisywania. Miejsce parametru w sygnaturze — decyzja Operatora, ale **wszystkie
istniejące wywołania muszą pozostać poprawne typologicznie i semantycznie**;
`tsc --noEmit` na zielono jest warunkiem koniecznym, nie wystarczającym — sprawdź
ręcznie, czy żadne istniejące wywołanie nie przesunęło argumentu pozycyjnie.

`gra/src/main.ts:13713` przekazuje realny predykat oparty o
`unlockedTechSetForOwner`/`ownerResearchedTechs` (wzorzec `ownerHasSeafaring`).

### GOAL 2 — dyplomacja gracza: propozycja Umowy Szlaków zablokowana bez techu

`gra/src/game/diplomacy-locks.ts` case `'5'`: gdy KTÓRAKOLWIEK ze stron nie ma techu
„Wymiana" → `{ locked: true, note: <informacyjny> }`. Kolejność względem istniejących
warunków: bramka techniczna jest **twarda i wcześniejsza** niż progi relacji
(`relacjaGate`), a względem `atWar`/`hasHandel` — po nich (aktywny traktat i wojna to
komunikaty ważniejsze dla gracza). Rozróżnij w `note` przypadek „to MY nie mamy techu"
od „to ONI nie mają techu" — gracz musi wiedzieć, czy ma badać, czy czekać.
Kontekst (`ctx`) rozszerz o potrzebne pola wzorem istniejącego `ctx.hasTradeConnection`.

### GOAL 3 — dyplomacja AI↔AI i propozycje AI→gracz

- `formAiAiTradeAgreementsIfEligible` (`gra/src/main.ts:17651`): pomiń parę, w której
  którakolwiek strona nie ma techu — dopisz warunek do pętli w l. 17665-17681, obok
  istniejących `continue` (wojna, próg relacji, istniejący traktat, brak połączenia).
- `gra/src/game/diplomacy-proposals.ts` (l. 1491-1497 i 2080-2093): AI nie proponuje
  gracz owi Umowy Szlaków, gdy bramka nie jest spełniona po którejkolwiek stronie.
  Jeżeli te ścieżki nie mają dostępu do stanu badań — wstrzyknij predykat tak samo jak
  w GOAL 1, nie duplikuj logiki i nie czytaj globali z modułu `game/`.

### GOAL 4 — bramka testowa

Nowy `gra/tools/handel-wymiana-tech-gate-test.cjs`, minimum:
1. owner bez techu, traktat AKTYWNY, miasta połączone → **zero tras** (zewnętrznych);
2. owner bez techu, dwa własne miasta połączone → **zero tras wewnętrznych**;
3. obie strony mają tech + traktat → trasy powstają jak dotąd (brak regresu);
4. jedna strona ma, druga nie → zero tras (symetria bramki, obie kolejności par);
5. trasa istniejąca w `existingRoutes` dla ownera bez techu → **nie przetrwa** refresh;
6. państwo-miasto bez techu traktowane identycznie jak cywilizacja AI (brak wyjątku);
7. domyślny predykat (`hasTradeTech` pominięty) → zachowanie identyczne jak przed zmianą;
8. blokada `diplomacy-locks` case `'5'`: `locked === true` bez techu po każdej ze stron,
   `locked === false` gdy obie mają (przy spełnionych pozostałych warunkach).

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/handel-wymiana-tech-gate-test.cjs` — 100% pass, minimum 8 asercji
      z listy GOAL 4.
- [ ] Pięć bramek referencyjnych bez regresu: `logic-test.cjs` (213/213),
      `tech-tree-test.cjs` (19/19), `research-test.cjs` (33/33),
      `unit-replace-test.cjs` (13/13), `combat-test.cjs` (6/6).
- [ ] Bez regresu na bramkach handlu z poprzedniego tematu:
      `trade-routes-limit-test.cjs` (76/76), `trade-routes-hud-filter-test.cjs` (59/59).
- [ ] `grep -rn "'Wymiana'" gra/src/game/` zwraca stałą nazwy techu w module `game/`
      (nie literał rozsiany po `main.ts` w wielu miejscach).

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Tryb ryzyka w tym temacie to **bramka założona w jednym miejscu i uznana za założoną
wszędzie**. Zakaz uznania tematu za zamknięty na podstawie tego, że
`refreshTradeRoutes` respektuje predykat: dowiedź **osobną asercją dla KAŻDEJ z trzech
warstw** (rdzeń tras, `diplomacy-locks` gracza, `formAiAiTradeAgreementsIfEligible`),
że bez techu handel nie powstaje. Dodatkowo: **pokaż, że test czerwienieje po mutacji
źródła** — usuń warunek bramki w `trade-routes.ts`, uruchom test, wklej do raportu
liczbę faili, przywróć źródło. Test, który przechodzi zarówno przed, jak i po usunięciu
bramki, nie jest dowodem — jest ozdobą.

Drugi tryb: **domyślna wartość `() => true` jako cicha furtka.** Jeżeli którekolwiek
PRODUKCYJNE wywołanie (nie testowe) pominie predykat, bramka nie istnieje, a wszystkie
testy i tak są zielone. Wypisz w raporcie jawnie, ile jest wywołań `refreshTradeRoutes`
w `gra/src/` i które z nich przekazują realny predykat.

## ALLOWLISTA

- `gra/src/game/trade-routes.ts`
- `gra/src/game/diplomacy-locks.ts`
- `gra/src/game/diplomacy-proposals.ts`
- `gra/src/main.ts`
- `gra/tools/handel-wymiana-tech-gate-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-HANDEL-WYMIANA-TECH-GATE-Q1/**` (raporty, dowody)

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
`gra/data/tech.json` (technologia „Wymiana" już istnieje z właściwymi prereq —
**nie zmieniaj danych techu**; jeżeli uznasz, że dane wymagają zmiany, to jest
`DECISION_REQUIRED`, nie edycja).

## IZOLACJA

Worktree `/home/user/wt-handel-wymiana-tech-gate`, gałąź
`autobot/R-HANDEL-WYMIANA-TECH-GATE-Q1`, baza: **jawnie `origin/main` po integracji
`R-HANDEL-LIMIT-TRAS-PELNY-Q1` i `P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1`** (SHA podany
przy zakładaniu worktree — potwierdź `git log -1` PRZED pracą, nie zakładaj).

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Zakaz dotyczy rodziny build/compile; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node tools/*-test.cjs` nie są
nim objęte. `--outDir` musi wskazywać katalog POZA drzewem repo (np. `/tmp/civ-dist`).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID
i TEJ SAMEJ gałęzi, nie od zera. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie zmieniasz formuły dochodu z handlu ani krzywej dystansu (`trade-routes.ts:1263-1297`)
  — to nie jest temat o kwotach.
- Nie cofasz usunięcia limitu dystansu (`9b31997d`) — było na wyraźną prośbę właściciela.
- Nie zmieniasz limitu existence-slotów ani priorytetu malejącego dochodu z
  `R-HANDEL-LIMIT-TRAS-PELNY-Q1` — budujesz NA nich, nie zamiast nich.
- Nie zmieniasz prereq ani kosztu technologii „Wymiana”.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty, lista może być pusta) → Obrona Operatora
(tylko gdy lista niepusta) → koniec skryptu Workflow. Final Control osobnym wywołaniem
Workflow, integracja allowlist-only (C-059), `READY_FOR_DEPLOY` i deploy/push — ręką
orkiestratora, poza skryptem.
