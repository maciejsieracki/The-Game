# R-WEB-DIPLO-WEARINESS-20-TURNS-Q1 — raport Obrony Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (4 zarzuty odpowiedziane: zarzuty 1, 2, 3 PRZYJĘTE z poprawką i dowodem; zarzut 4 PRZYJĘTY częściowo (dowód tickera), a zmiana PEACE_PROPOSAL_MIN_WAR_TURNS ODRZUCONA z uzasadnieniem; potrzebna decyzja orkiestratora: allowlista 6 plików i pytanie ABC o próg 10 tur)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-20-TURNS-Q1
GOAL: zmęczenie wojną zamyka się w 20 turach; jeden licznik (5%/turę od startu + 10%/zmienione miasto), bez zastoju i bez drugiego zegara; ten sam poziom steruje chęcią pokoju AI, wyborem rozejm/pokój i sygnałami pokoju.
BAZA: origin/main e6776801b; kandydat Evaluatora 09076c7b1 (checkout --detach w worktree).
KOD OBRONY: commit 2a8ff66f6314a6f27e4934e8496cf6c4575c0489 (poprawki zarzutów 1–4; tylko pliki wymienione niżej).

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — REGRESJA diplo-civpedia-values-test (6 FAIL na kandydacie) — PRZYJĘTY, poprawka
- Przyczyna potwierdzona: `docs/encyklopedia/pojecia/zmeczenie-wojna.md` nadal podawał 200 tur / 0,03 / stagnację 30/0,3/100; test porównuje hasło z JSON.
- Poprawka: hasło przepisane na 20 tur / 0,10 / bez zastoju (sekcja „Poziom zmęczenia", przykład liczbowy 10 tur + 2 miasta = 0,7, tabela „Parametry"); test literal `pelneTur === 20 && wagaStratMiasta === 0.1`.
- Dowód: `node tools/diplo-civpedia-values-test.cjs` → `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 148` (kandydat: 6 FAIL).
- UWAGA: plik doc i test są POZA allowlistą Evaluatora oraz dispatch oznacza Civpedię jako „poza zakresem (#353)". Zmiana wykonana, bo bez niej bramka jest czerwona. Orkiestrator musi rozszerzyć allowlistę albo cofnąć ten commit.

### Zarzut 2 — drugi zegar zostaje w aiPeaceSignals, ai.ts:7167 i resolverze profilu — PRZYJĘTY, poprawka
- Zmierzone konsumenty `warWearinessFraction(turnsAtWar, zmeczenieT)` przed poprawką: `ai.ts` (fatigueFraction dla aiTruceOrPeaceMode) oraz `diplomacy-war-peace-profile.ts` (sygnał (e) aiPeaceSignals). `diplomacy-proposals.ts:1358` (resolveWarPeaceProfile) NIE czyta zmeczenieT do decyzji — po grepie tylko profil eksportuje pole.
- Poprawka: obu konsumentom podano jeden licznik `warWearinessLevel` (ai.ts: `fatigueFraction: wearyLevel`; profil: `warWearinessLevel({turnsAtWar, lostCitiesTotal, turnsSinceCityChange}) >= progSygnaluPokoju`).
- Efekt liczbowy (NIE_ZMIERZONO w grze, tylko z arytmetyki): sygnał (e) przy progu 0,4 zapala się w turze 8 bez strat (dawniej 0,4·T, T=15..20 → tura 6–8). Próg 0,4 zostaje bez zmian, bo to wartość JSON; zmiana progu jest decyzją właściciela.
- Pozostałość (świadomie NIE usunięta w tym temacie): pola `zmeczenie.bazaTur/maksTur/wagaAgresja/maksUdzial/bazaTurBrakDanych` w `diplomacy-war-peace-params.json` i funkcje `warWearinessFraction/warWearinessShare/zmeczenieT` w profilu nie sterują już żadną decyzją (grep: brak konsumentów poza profilem). Opisy `_wzor` zaktualizowane. Usunięcie martwych pól to osobny temat sprzątający.
- Dowód: `diplo-weariness-20-turns-test.cjs` (f2, f3): `fatigueFraction: wearyLevel` w ai.ts, brak `warWearinessFraction` w ai.ts, sygnał (e) czyta warWearinessLevel i nie czyta zmeczenieT — wszystkie PASS.

### Zarzut 3 — lostCitiesTotal nie przekazany z ai.ts — PRZYJĘTY, poprawka
- Przed poprawką: ctx w ai.ts (l.6974–6983) nie zawierał `lostCitiesTotal`; pole było tylko w typie.
- Poprawka: w `ctx: AIDiplomacyContext` dodano `lostCitiesTotal: rel.stanWojny ? max(0, rel.lostCitiesInWar) + max(0, rel.zdobyteMiastaPartnera) : 0` — ta sama suma, której używa już `warWearinessLevel` w ai.ts (l.~7030).
- Wiązanie testowe: `diplo-weariness-20-turns-test.cjs` (f1) sprawdza, że literał `const ctx: AIDiplomacyContext = {...}` w ai.ts zawiera `lostCitiesTotal:` → PASS.
- Dowód kompilacji: `tsc --noEmit` exit 0 po poprawce.

### Zarzut 4 — kryterium (d) bez dowodu; PEACE_PROPOSAL_MIN_WAR_TURNS=10 maskuje 3/6 — CZĘŚCIOWO PRZYJĘTY (dowód) + ODRZUCONY (zmiana stałej)
- (d) — PRZYJĘTY, dowód dodany: test (g) w `diplo-weariness-20-turns-test.cjs` uruchamia `runWarWearinessTick` dla pary AI↔AI bez strat miast, tury wojny 1..24, pokój bezwarunkowy (`mutual_peace`) pada w turze 16 (poziom 0,8 = 16/20), przed 10. turą brak akcji. Wynik: g1 PASS (firstPeace === 16), g2 PASS.
  - ZASTRZEŻENIE: to dowód na poziomie tickera (funkcja czysta), NIE w pełnej grze (main.ts / tura silnika). Cykl wojna–pokój–wojna w oknie 20 tur: NIE_ZMIERZONO.
- Maskowanie — ODRZUCONE (bez zmiany kodu): `PEACE_PROPOSAL_MIN_WAR_TURNS = 10` (`diplomacy-peace-proposal-timing.ts`) blokuje tick w `war-weariness.ts:251` przed bramkami `ofertaOdTurWojny` i `ofertaBezStratOdTur`. Dlatego w praktyce efektywna bramka oferty to tura 10 dla obu przypadków, a wartości 3 i 6 z dispatchu są nieaktywne dla oferty przegranego (w ramach tickera). Obniżenie stałej to zmiana reguły „pierwsze 10 tur wojny chronione" dla gracza i AI — to decyzja produktowa, nie techniczna (CLAUDE.md §3). Nie zmieniono.
  - PYTANIE ABC DLA WŁAŚCICIELA (do przekazania orkiestratorowi): (A) zostawić 10 tur ochrony, a `ofertaOdTurWojny=3`/`ofertaBezStratOdTur=6` uznać za nieaktywne (usunąć albo ustawić na 10); (B) obniżyć `PEACE_PROPOSAL_MIN_WAR_TURNS` do 3 (zmienia ochronę gracza i AI przed ofertami, wymaga testów diplo-peace-proposal-timing); (C) pozostawić jak jest i zaakceptować, że oferta przegranego startuje od tury 10. Rekomendacja Operatora: A (najmniejsza zmiana, zgodna z dotychczasową ochroną).

## ZMIANY (commit 2a8ff66f6)
- `gra/src/game/ai.ts`: import bez `warWearinessFraction`; ctx z `lostCitiesTotal`; `fatigueFraction: wearyLevel`.
- `gra/src/game/diplomacy-war-peace-profile.ts`: import `warWearinessLevel`; sygnał (e) na jednym liczniku.
- `gra/data/diplomacy-war-peace-params.json`: tylko `zmeczenie._wzor` (opis).
- `docs/encyklopedia/pojecia/zmeczenie-wojna.md`: 20 tur / 0,10 / bez zastoju (zarzut 1).
- `gra/tools/diplo-civpedia-values-test.cjs`: literały 20 / 0,1 (zarzut 1).
- `gra/tools/diplo-truce-impl-test.cjs`: wiązanie E przepięte z `warWearinessFraction(...zmeczenieT)` na `wearyLevel` (stary test wiązał drugi zegar — ta asercja była jedyną czerwoną po poprawce ai.ts).
- `gra/tools/diplo-weariness-20-turns-test.cjs`: nowe sekcje (f1–f3) i (g1–g2).

ALLOWLISTA — pliki POZA allowlistą kandydata 09076c7b1 (wymagają decyzji orkiestratora):
`docs/encyklopedia/pojecia/zmeczenie-wojna.md`, `gra/src/game/ai.ts`, `gra/src/game/diplomacy-war-peace-profile.ts`, `gra/data/diplomacy-war-peace-params.json`, `gra/tools/diplo-civpedia-values-test.cjs`, `gra/tools/diplo-truce-impl-test.cjs`.

## TESTY (surowe wyniki, worktree, `npm ci --ignore-scripts` w gra/, bez `npm run build/dev`)
- `tsc --noEmit` (gra/): exit 0.
- Bramki referencyjne: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`.
- Zmęczenie: diplo-weariness-20-turns-test `PASS=30 FAIL=0` (kandydat: 25/0 — dodano f1–f3, g1–g2); city-only `PASS=30 FAIL=0`; unconditional-end `PASS=22 FAIL=0`; ai-war-weariness-peace `PASS=99 FAIL=0`; ai-losing-war-asks-peace-vs-player `12 PASS / 0 FAIL`.
- Dyplomacja: diplo-peace-balance-accept `32 pass / 0 fail`; diplo-peace-ai-ai-nonnegative `21 PASS, 0 FAIL` (exit 0); diplomacy-test `149 passed, 0 failed`; diplo-war-peace-profile-unit `198 pass / 0 fail`; diplo-truce-impl `94 PASS, 0 FAIL` (po aktualizacji asercji E; przed nią 93/1); diplomacy-peace-lock `9 pass, 0 fail`; diplo-civpedia-values `PASS: 129`.
- Długi bazowe (IDENTYCZNE nazwy jak na bazie e6776801b, nie regresja): diplo-war-peace-sim-test `19 pass / 3 fail` — FAIL: S3, S4b, M_TUR; diplo-war-peace-main-guard-test `34 pass / 1 fail` — FAIL: R6/ZT.
- Mutanty: M1 (pelneTur 200), M2 (stagnacja), M3 (waga 0,03) wykryte przez diplo-weariness-20-turns-test — PASS.

## BLOKADY
- Allowlista (6 plików poza listą) — decyzja orkiestratora.
- PEACE_PROPOSAL_MIN_WAR_TURNS=10 vs bramki 3/6 — pytanie ABC do właściciela (zarzut 4).
- NIE_ZMIERZONO: pełna gra (tura silnika) dla AI↔AI bez strat; cykl wojna–pokój–wojna w 20 turach; wpływ zmiany (e) na częstość propozycji w grze.

## RUNDY
1/5 (Obrona r1). Ten sam ID, bez nowej rundy Operatora przed decyzją orkiestratora o allowlistcie.

## NASTĘPNY KROK
1. Orkiestrator: rozstrzygnąć allowlistę (6 plików) i odpowiedzieć na pytanie ABC o PEACE_PROPOSAL_MIN_WAR_TURNS (A/B/C).
2. Evaluator r2 na commicie 2a8ff66f6 (kod) + ten raport; potem Final Control.
3. Decyzja „martwe pola zmeczenie.* w diplomacy-war-peace-params.json" — osobny temat sprzątający (nie w tym temacie).

## UWAGI-DLA-ORKIESTRATORA
- Commit kodu: 2a8ff66f6314a6f27e4934e8496cf6c4575c0489 (zawiera poprawki). Ten plik raportu jest w osobnym commicie.
- Zachowano zasady: brak spawn_task/create_session/send_later; bez run_in_background; bez push, merge i deploy.
- Civpedia (#353) została dotknięta tylko w jednym haśle o parametrach zmęczenia, bo bramka była czerwona; pełna aktualizacja Civpedii nadal poza zakresem.

DEPLOY/PUSH: NIE WYKONANO
