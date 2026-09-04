# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — dispatch

TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel, dwa zrzuty)

> „Miasto zdobyłem od innej cywilizacji i nie ma tam żadnego budynku. Wygląda na to,
> że inne cywilizacje w ogóle nie budują budynków. To jest jakiś błąd, a przecież 50%
> pracy miała iść na budynki."

Po drugim zdobytym mieście:
> „Kolejne miasto bez ani jednego zrujnowanego budynku."

Oba zrzuty: panel „BUDYNKI W MIEŚCIE (0) — (brak)". **Dwa niezależne miasta, dwie
różne cywilizacje.** Sformułowanie „bez ani jednego **zrujnowanego**" jest istotne:
to nie są zgliszcza po podboju, tylko miasto, w którym nigdy nic nie postawiono.

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym odczytem)

**A. Hipoteza „przejęcie kasuje budynki" — ODRZUCONA DOWODEM. Nie sprawdzaj jej ponownie.**
`cityBuilt` (`main.ts:2694`) jest mutowane **wyłącznie** przy ukończeniu budowy
(`main.ts:3498`), presetach (`:34006`, `:34234`) i wczytaniu save (`:34632`).
Zero `cityBuilt.delete` w ścieżce przejęcia; `post-battle-map.ts` nie zawiera ani
jednego odwołania do budynków. Capture czyści wyłącznie KOLEJKĘ.

**B. PRZYCZYNA — `budowaTryb` resetowany na `'reczny'` przy KAŻDYM założeniu
i KAŻDYM przejęciu miasta.**
`DEFAULT_BUDOWA_TRYB = 'reczny'` (`cities.ts:178`), `freshOwnerDefaultBudowaProfil`
(`empire-city-defaults.ts:342-343`), nadpisanie w `seedCityOwnerDefaults`
(`main.ts:4882-4884`), wołane z `main.ts:8267`, `:8399`, `:13057`, `:31441`
oraz z capture przez `onOwnerChanged` (`:26215`).
**Reset kasuje `budowaTryb:'zrownowazone'`, które ustawia `foundCityAt`** (`cities.ts:1211`).
Skutek: `pickAutoBuildItem` zwraca `null` dla miast AI (`auto-manage.ts:270-272`),
a gałąź `isAutoBudowaTryb` w pętli ekonomii (`main.ts:29117`) nigdy nie odpala.

**C. Kod SAM to potwierdza — i to jest najważniejsza wskazówka tego dispatchu.**
Komentarz `main.ts:26241-26242` mówi wprost: *„AI nigdy sami nie wkładają budynku
w kolejkę (pickAutoBuildItem odmawia, bo seedCityOwnerDefaults resetuje budowaTryb
do 'reczny' przy KAŻDYM przejęciu)"*. **Ten komentarz jest uzasadnieniem osobnej,
zatwierdzonej gwarancji: „miasto barbarzyńskie produkuje WYŁĄCZNIE jednostki (nigdy
budynki)".** Czyli reset jest w tym miejscu ŚWIADOMY i pełni realną funkcję —
tylko został zastosowany zbyt szeroko, do wszystkich właścicieli zamiast do barbarzyńców.

**To jest twarde ograniczenie tego tematu:** naprawa **nie może** złamać gwarancji
barbarzyńskiej. Zmiana musi rozróżnić barbarzyńców od pozostałych AI, a nie zdjąć
reset globalnie.

**D. Duże AI ma drugą drogę, MIASTA-PAŃSTWA nie mają — to wyjaśnia, dlaczego objaw
jest tak skrajny akurat u nich.**
Ścieżka główna AI to komenda `build` z `chooseCityProduction` (`ai.ts:2593`
w `decideAITurn`; `ai.ts:3185-3200` dla kopii defensywnych = miast-państw),
egzekucja `main.ts:31508`, wejście do kolejki `main.ts:31678`.
Ale Zarządca (`autoManageCity`, z wbudowanym `pickAutoBuildItem`) jest **odcięty
dla miast-państw** warunkiem `isMajorAiOwner(city.ownerId, isCityStateOwner)`
(`main.ts:29162`; `owner-utils.ts:12-16`; `isCityStateOwner` =
`simplifiedDiplomacyOwners ∪ typCityCopyOwners`, `main.ts:6130-6131`).
Miastu-państwu zostaje więc **jedna wąska ścieżka bez żadnego fallbacku**.
Właściciel zdobył prawdopodobnie miasta-państwa — stąd zero budynków.

**E. Podział 50/50 działa poprawnie — nie tam szukaj.**
`AI_FIXED_PROCENT_BUDYNKI = 50` (`cities.ts:431`), wymuszane bezwarunkowo
w `decideAIEconomySliders` (`ai.ts:5036-5037`); seed dla miast AI `main.ts:4812`, `:4850`
(gracz ma 70%, `cities.ts:404`). **Nie ma czego dzielić, gdy nic nie trafia do kolejki.**

**F. ZERO bramek sprawdzających, że AI stawia budynki — dlatego defekt mógł żyć niezauważony.**
`auto-manage-test.cjs` i `empire-city-defaults-test.cjs` testują tor GRACZA;
`ai-prod-fallback-test.cjs` i `ai-production-priority-test.cjs` testują wybór kandydata
i priorytety. **Żaden nie asertuje, że `cityBuilt` ownera AI rośnie w czasie.**

**G. Powiązania w rejestrze — sprawdź, czy to nie ten sam korzeń:**
`R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` (DISPATCHOWANE, rejestr `:3978`) — **prawdopodobnie
ta sama przyczyna, tylko widziana od strony ulepszeń terenu**;
`R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` (ZAMKNIĘTE, `eb03cb94`, `:2592`) —
**to zamknięcie mogło zostać CICHO COFNIĘTE przez reset z (B)**; zweryfikuj i napisz w raporcie.

## GOAL

### GOAL 1 — miasta AI (duże cywilizacje i państwa-miasta) faktycznie stawiają budynki

Rozróżnij barbarzyńców od pozostałych właścicieli w `seedCityOwnerDefaults`
(albo w miejscu równoważnym — decyzja Operatora, uzasadniona w raporcie):
- **barbarzyńcy: bez zmian**, reset na `'reczny'` zostaje, gwarancja „wyłącznie
  jednostki" nienaruszona;
- **AI niebarbarzyńskie: tryb automatyczny**, taki, jaki ustawia `foundCityAt`
  (`cities.ts:1211`), zamiast nadpisania na `'reczny'`;
- **gracz: bez zmian** — `'reczny'` jest tu zamierzony, gracz sam decyduje.

### GOAL 2 — państwa-miasta przestają być odcięte od fallbacku

Rozstrzygnij, czy warunek `isMajorAiOwner` przy `autoManageCity` (`main.ts:29162`)
ma zostać poszerzony o państwa-miasta, czy ich wąska ścieżka (`decideDefensiveCopyTurn`
→ `chooseCityProduction`) ma zostać wzmocniona. **To jest decyzja projektowa —
uzasadnij wybór, pokaż konsekwencje dla wydajności** (państw-miast bywa 9 na mapie,
`autoManageCity` jest wołane per miasto per turę).

Jeśli uznasz, że poszerzenie `isMajorAiOwner` zmieniłoby zachowanie państw-miast
poza budowaniem (dyplomacja, ekspansja) — **zatrzymaj się ze statusem
`DECISION_REQUIRED`**, zamiast zmieniać to po cichu.

### GOAL 3 — bramka, której dziś nie ma

Nowa `gra/tools/ai-buduje-budynki-test.cjs`, minimum:
1. miasto dużego AI po N turach symulacji ma **co najmniej jeden** wpis w `cityBuilt`;
2. to samo dla **państwa-miasta** — osobna asercja, bo to osobna ścieżka (recon D);
3. **miasto barbarzyńskie po N turach ma ZERO budynków** — regresja na gwarancję
   z recon C, obowiązkowa;
4. miasto gracza zachowuje `budowaTryb:'reczny'` po założeniu i po przejęciu
   (regresja: nie odbieramy graczowi kontroli);
5. zdobyte miasto AI zachowuje budynki, które miało przed przejęciem
   (regresja na recon A — to ma pozostać prawdą);
6. `budowaTryb` miasta AI po przejęciu przez inne AI jest automatyczny, nie `'reczny'`.

Symulacja ma używać **prawdziwej pętli ekonomii**, nie reimplementacji — inaczej test
udowodni własną kopię logiki, a nie grę.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/ai-buduje-budynki-test.cjs` — 100% pass, minimum 6 asercji.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na bramkach AI i miast — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "ai|auto-manage|city|miast|prod"`), uruchom WSZYSTKIE,
      podaj wyniki; czerwona → sprawdź parytet na czystej bazie PRZED zgłoszeniem regresu.
- [ ] Raport odpowiada na pytanie z recon G: czy `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE`
      zostało cicho cofnięte przez reset, i czy `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` ma
      ten sam korzeń.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, najgroźniejszy w tym temacie: złamanie gwarancji barbarzyńskiej.**
Reset na `'reczny'` NIE jest przypadkiem — jest jawnym uzasadnieniem osobnej,
zatwierdzonej decyzji (recon C, komentarz `main.ts:26241-26242`). Zdjęcie go globalnie
„naprawi" ten temat i po cichu zepsuje tamten. Asercja 3 w GOAL 3 jest obowiązkowa
i musi czerwienieć po mutacji — pokaż to.

**Tryb drugi: dowód z deklaracji zamiast z symulacji.** „Ustawiłem tryb automatyczny,
więc AI będzie budować" nie jest dowodem. Dowodem jest **wzrost `cityBuilt` w czasie
w prawdziwej pętli ekonomii**. Podaj w raporcie liczbę budynków po N turach, dla
dużego AI, państwa-miasta i barbarzyńców osobno.

**Tryb trzeci: naprawa jednej ścieżki i uznanie tematu za zamknięty.** Recon D pokazuje
DWIE różne ścieżki (duże AI vs państwa-miasta) i jedną z nich odciętą. Naprawa samego
`seedCityOwnerDefaults` może nie wystarczyć dla państw-miast. Sprawdź obie osobno.

**Tryb czwarty: test tautologiczny.** Zmutuj `seedCityOwnerDefaults` z powrotem
na bezwarunkowy `'reczny'`, uruchom bramkę, wklej liczbę faili, przywróć.

## ALLOWLISTA

- `gra/src/main.ts`
- `gra/src/game/cities.ts`
- `gra/src/game/empire-city-defaults.ts`
- `gra/src/game/auto-manage.ts`
- `gra/src/game/owner-utils.ts` (tylko jeśli GOAL 2 tego wymaga — uzasadnij)
- `gra/tools/ai-buduje-budynki-test.cjs` (nowy)
- `dyspozycje/autobot/runs/P-AI-NIE-STAWIA-BUDYNKOW-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
oraz **`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`,
`gra/data/society-params.json`** (węzeł A audytu szczęścia),
**`gra/src/ui/entityCards/**`, `gra/src/ui/techDiscoveryNotice.ts`**,
**`gra/src/ui/empireDetailPanel.ts`**, **`gra/src/game/display-names.ts`,
`gra/src/render/cities.ts`** — zajęte przez równolegle biegnące tematy
(`R-PROC-AUTOBOT.md` §2b). Zakaz `git add -A` i `git add .`.

**`gra/src/game/ai.ts` świadomie POZA allowlistą** — recon E pokazuje, że podział 50/50
działa poprawnie, a `chooseCityProduction` też. Jeśli okaże się, że naprawa wymaga
`ai.ts`, zatrzymaj się ze statusem `DECISION_REQUIRED` i nazwij, co dokładnie.

## IZOLACJA

Worktree `/home/user/wt-ai-buduje-budynki`, gałąź `autobot/P-AI-NIE-STAWIA-BUDYNKOW-Q1`,
baza jawnie `origin/main` — potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- **Gwarancja barbarzyńska nienaruszalna:** miasto barbarzyńskie produkuje wyłącznie
  jednostki, nigdy budynki.
- Gracz zachowuje `'reczny'` — nie odbieramy mu kontroli nad kolejką.
- Nie zmieniasz podziału 50/50 dla AI ani 70/30 dla gracza.
- Nie zmieniasz `chooseCityProduction` ani priorytetów AI (`ai.ts` poza allowlistą).
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.
