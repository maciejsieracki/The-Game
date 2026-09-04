# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1`
GOAL: Dla aktywnego SOJUSZU (obronny lub pełny — nie pakt, nie handel) gracz widzi na
bieżąco (co turę, nie jednorazowo) sumę własnej widoczności i widoczności sojusznika AI;
mechanizm aktywuje się przy zawarciu sojuszu i dezaktywuje natychmiast po zerwaniu, bez
wpływu na pozostałe traktaty ani na faktyczne decyzje AI.
MODEL+EFFORT: Sonnet 5, effort high (Operator).
RUNDY: 1/5 · DEPLOY/PUSH: **NIE WYKONANO**

---

## 0. Streszczenie

Zaimplementowane: `currentVisible()` (main.ts) — funkcja, którą CAŁA reszta silnika już
używa jako źródło prawdy o żywej widoczności gracza (fog rendering, cele ataku/hover gracza,
`addExplored`) — dokłada, dla każdego AI z aktywnym sojuszem (`allianceFormalKindBetween`
zwraca `'wojskowy'` lub `'obronny'`, tj. `sojusz_pelny`/`sojusz_defensywny`), unię z bieżącą,
żywą widocznością tego sojusznika (`currentVisibleForOwner`). Liczone od nowa przy KAŻDYM
wywołaniu — to jest cały mechanizm ciągłości (GOAL 1) i cały mechanizm natychmiastowej
dezaktywacji (GOAL 2): gdy traktat znika z `activeDeals` (wojna/wygaśnięcie/zerwanie),
kolejne wywołanie po prostu go nie znajduje.

**Recon GOAL 3 (kluczowe odkrycie rundy, patrz §2)**: hipoteza dispatchu „AI ma wewnętrznie
pełną wiedzę o mapie" jest **fałszywa**. AI ma WŁASNY, ograniczony, per-owner model
widoczności (`currentVisibleForOwner`, komentarz w kodzie: „P-AI-BRAK-POJECIA-MGLY-Q1: AI
widzi wyłącznie własny snapshot"), i ten model jest **aktywnie** wpięty w decyzje AI (cele
ataku — `rememberVisibleAiTargets`/`AITurnOpts.visibleHexes`; przejęcie miasta —
`aiCityCaptureAllowed`). Rozszerzenie TEGO modelu o widoczność gracza byłoby więc żywą,
konsekwentną zmianą zachowania AI w stanie sojuszu — nie „martwym kodem" jak zakładał GOAL 3
— i wprost kolidowałoby z GOAL 5 („zero wpływu na FAKTYCZNE decyzje AI"). Decyzja Operatora:
zaimplementować WYŁĄCZNIE stronę gracza (dokładnie to, co testują kryteria końca 1–2 i
allowlista dopuszcza wprost — „jeśli w ogóle" wymaga GOAL 1), NIE dotykać ścieżek zasilających
decyzje AI. Uzasadnienie pełne w §2 — to jest jawnie oznaczona interpretacja, nie milczące
pominięcie; jeśli właściciel chce jednak rozszerzyć widoczność decyzyjną AI, to osobny temat
po świadomej decyzji (realny wpływ na balans/trudność gry).

---

## 1. Zmiana (allowlista: `gra/src/game/visibility.ts` — bez zmian, niepotrzebne;
`gra/src/main.ts` — jedyny plik zmieniony)

`currentVisible()` (main.ts) — jedyne miejsce agregujące żywą widoczność gracza per-turę,
używane przez `refreshFog()` (wołane po KAŻDEJ zmianie stanu, w tym po turze) oraz przez
gate'y widoczności celu ataku/hover dla gracza:

```ts
for (const oid of aiOwnerCivMap.keys()) {
  if (allianceFormalKindBetween(activeDeals, 0, oid) === null) continue;
  for (const k of currentVisibleForOwner(oid)) visible.add(k);
}
```

`allianceFormalKindBetween` (już zaimportowana z `diplomacy-treaties.ts`, plik NIETKNIĘTY —
poza allowlistą, tylko import istniejącego eksportu) zwraca `'wojskowy'` (sojusz_pelny),
`'obronny'` (sojusz_defensywny) albo `null` — dokładnie rozróżnienie „sojusz vs pakt/handel/
granice" wymagane przez GOAL 4, żadna zmiana w `diplomacy-treaties.ts` niepotrzebna.

Dodatkowo: test-debug hak `__sojuszWidocznoscTestDebug` (main.ts, ten sam wzorzec i
uzasadnienie co istniejące `__dyploMapaOdkrycieTestDebug`/`__audienceRelTestDebug` — patrz
komentarz w kodzie) — WYŁĄCZNIE dla Playwright, steruje wejściem (`activeDeals`, pozycja
testowej jednostki), efekt liczy REALNY silnik.

---

## 2. GOAL 3 — pełne uzasadnienie decyzji „nie implementować strony AI"

(patrz też komentarz w kodzie nad `currentVisible()`, main.ts)

Recon (czytanie kodu, nie założenie — REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu):

- `main.ts` (dispatch tury AI, ok. linia 28900): `const aiVisibleHexes = fogOn ?
  currentVisibleForOwner(ownerId) : undefined;` → `rememberVisibleAiTargets(...)` →
  `opts.visibleHexes` w `AITurnOpts` → wprost do `decideAITurn` (`ai-fog.ts`/`ai.ts`) —
  **cele ataku**.
- `main.ts` (ruch/przejęcie miasta AI): `aiCityCaptureAllowed(..., currentVisibleForOwner
  (ownerId), fogOn, keyOf)` — **gate wykonania akcji** (czy AI w ogóle „widzi" cel, żeby go
  przejąć).
- `tools/ai-fog-test.cjs` (8/8, istniejąca bramka) testuje DOKŁADNIE to sprzężenie:
  `visibleHexes` przekazane do `decideAITurn` zmienia, czy komenda `attack` w ogóle powstaje
  (W1 vs W2).

Wniosek: to NIE jest przypadek z GOAL 3 („AI i tak widzi całą mapę, fog to warstwa UI —
implementacja byłaby martwym kodem"). AI ma realny, ograniczony model, i ten model jest
żywy w ścieżce decyzyjnej. GOAL 1 warunkuje „odwrotnie" słowami „JEŚLI W OGÓLE model gry
rozróżnia co widzi AI" — rozróżnia — ale GOAL 5 stawia twardy, bezwarunkowy wymóg „zero
wpływu na FAKTYCZNE decyzje AI", a allowlista dodaje własną klauzulę ostrożności: zmiana
`ai.ts`/logiki celów AI dozwolona wyłącznie „co ściśle wymaga GOAL 1 (**jeśli w ogóle**)".
Żadne z sześciu binarnych kryteriów końca (00-dispatch.md) nie testuje strony AI — kryteria
1–2 testują wyłącznie stronę gracza. Rozszerzenie widoczności decyzyjnej AI o wgląd gracza
zmieniłoby FAKTYCZNE zachowanie sojuszniczego AI w prawdziwych rozgrywkach (dostęp do celów
poza jego własnym zwiadem) — realna decyzja balansu/trudności gry, nie techniczny detal tego
tematu. Operator NIE implementuje tej części i dokumentuje ją tu zamiast milczeć — to
świadome domknięcie warunku GOAL 1/GOAL 3/GOAL 5/allowlisty na korzyść GOAL 5, nie luka.

---

## 3. Testy

### 3a. Bramki referencyjne (R-PROC-AUTOBOT.md §6) — z `gra/`, worktree

| Bramka | Wynik referencyjny | Wynik teraz |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów | **0 błędów** |
| `node tools/logic-test.cjs` | 213/213 | **213/213** |
| `node tools/tech-tree-test.cjs` | 19/19 | **19/19** |
| `node tools/research-test.cjs` | 33/33 | **33/33** |
| `node tools/unit-replace-test.cjs` | 13/13 | **13/13** |
| `node tools/combat-test.cjs` | 6/6 | **6/6** |

### 3b. Regresja fog/AI/dyplomacja/sojusz (GOAL 4/5, kryterium końca 3/4/5)

| Bramka | Wynik |
|---|---|
| `node tools/ai-fog-test.cjs` | **8/8** (niezmienione — main.ts nie dotyka ai-fog.ts/ai.ts) |
| `node tools/river-fog-visibility-test.cjs` | **31/0** |
| `node tools/alliance-war-obligation-test.cjs` | **14/0** |
| `node tools/city-state-alliance-test.cjs` | **67/0** |
| `node tools/diplomacy-relacje-ai-ai-audiencja-test.cjs` | **20/0** |
| `node tools/ai-war-gate-test.cjs` | **24/0** |
| `node tools/ai-city-capture-integration-test.cjs` | **14/0** |
| `node tools/diplomacy-ai-balance-test.cjs` | **31/0** |
| `node tools/ai-test.cjs` | **287 pass, 8 fail — IDENTYCZNE z `origin/main` przed tym tematem** (zweryfikowane uruchomieniem na czystym `/home/user/The-Game/gra`, te same 8 nazw asercji, te same komunikaty; pre-istniejąca czerwień, C-058 — nie naprawiane przy okazji, poza zakresem) |

### 3c. Żywy dowód wieloturowy (REGUŁA PRZECIW SAMOOSZUKIWANIU, kryteria końca 1–2)

`node tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs` — headless Chromium, realny `vite
build`, realny `?playtest=mapa`, REALNE `activeDeals`/`breakTreatyVoluntarily`/`endTurn()`
(`triggerPlayerEndTurn`, ta sama funkcja co przycisk „Zakończ turę"). Wynik: **PASS — 23/23,
0 fail** (trzy próby: 1. świat sandboxa `?playtest=mapa` z natury stawia jedyne AI TUŻ PRZY
graczu — zero heksów ally-only do dowiedzenia, naprawione dołożeniem testowej dalekiej
jednostki, `spawnFarAiScout`; 2. druga+ prawdziwa `endTurn()` w tym sandboksie budzi znany,
udokumentowany w tym repo problem — modal preBattle blokuje `canPlayerInitiateEndTurn()` na
stałe, patrz `perf-long-session-live-test.cjs`/`rebel-protection-live-test.cjs` — naprawione
wywołaniem ISTNIEJĄCEGO haka `__rebelProtectionTestDebug.pullPlayerUnitsHome()` przed każdym
`endTurn()`, zero nowego kodu w main.ts dla tej naprawy; 3. zielone 23/0). Pokrywa:
1. Kontrolę negatywną „przed" — heks widoczny WYŁĄCZNIE testowej dalekiej jednostce
   sojusznika NIE jest widoczny graczowi przed sojuszem.
2. Zawarcie sojuszu + 1 turę → heks staje się widoczny.
3. Dwie KOLEJNE tury z rzędu → heks NADAL widoczny (ciągłość, nie jednorazowy zrzut —
   dokładnie to, co odróżnia ten temat od już zintegrowanego
   R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1).
4. Zerwanie sojuszu BEZ nowej tury → heks natychmiast znika z bieżącej widoczności (GOAL 2:
   „bez opóźnienia o turę").
5. Zero błędów konsoli/JS.

Zrzuty: `dyspozycje/autobot/runs/R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1/dowody/`.

---

## 4. Zgodność z barierami (R-PROC-AUTOBOT.md §9)

- Zero `npm run build`/`npm run dev` w `gra/` — build wyłącznie `node
  ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` (w
  `dyplo-sojusz-widocznosc-ciagla-live-test.cjs`, ten sam wzorzec co istniejące testy).
- Zero `git add -A`.
- Zero zmian w `docs/decyzje/<ID>.md`, `dyspozycje/WERSJE.md`, `gra-robocza/
  ROBOCZA-MANIFEST.json`, `playbook.json`.
- Zero zmian widoczności dla paktu/handlu/granic — `allianceFormalKindBetween` rozpoznaje
  wyłącznie sojusz_defensywny/sojusz_pelny.
- Zero zmian w `ai.ts`/logice wyboru celów AI (poza tym, co GOAL 3/5 wprost każe
  udokumentować zamiast implementować — §2).

---

## 5. Raport terminalny

ZMIANY/COMMIT: `gra/src/main.ts` (funkcja `currentVisible()` + nowy hak testowy
`__sojuszWidocznoscTestDebug`), `gra/tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs`
(nowy), `dyspozycje/autobot/runs/R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1/**`. Brak commitu —
zmiany leżą w worktree `/home/user/wt-sojusz-widocznosc-ciagla`, gałąź
`autobot/R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1`, baza `origin/main` (10aeec78). `gra/src/game/
visibility.ts`: ZERO ZMIAN (niepotrzebne — cały mechanizm mieści się w main.ts, korzystając
z istniejących `computePlayerVisibility`/`allianceFormalKindBetween`).
TESTY: 6 bramek referencyjnych zielone (§3a) + 8 bramek regresyjnych fog/AI/dyplomacja/sojusz
zielone, `ai-test.cjs` identyczne z `origin/main` (§3b) + żywy wieloturowy dowód Playwright
zielony (§3c).
BLOKADY: brak blokującej. Jedno świadome ograniczenie zakresu udokumentowane w §2 (strona AI
GOAL 1/„odwrotnie" NIE zaimplementowana — koliduje z GOAL 5; nie jest to DECISION_REQUIRED,
bo dispatch sam rozstrzyga priorytet przez GOAL 5 + klauzulę „jeśli w ogóle" w allowliście —
ale właściciel może zdecydować inaczej w kolejnej rundzie).
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) — weryfikacja §2 (czy uzasadnienie
nie-implementacji strony AI jest poprawne i wystarczające), realności dowodu §3c, zgodności
z allowlistą.
DEPLOY/PUSH: **NIE WYKONANO**.
