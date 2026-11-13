# R-WEB-DIPLO-WEARINESS-20-TURNS-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK (kod gotowy i zacommitowany; jeden test czerwony poza allowlistą — wymaga decyzji orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-20-TURNS-Q1
GOAL: zmęczenie wojną zamyka się w 20 turach: jeden licznik (5% na turę od startu wojny + 10% za każde miasto, które zmieniło właściciela, obie strony), bez zastoju i bez drugiego zegara; progi 50% (tura 10) / 80% (tura 16, silniejszy proponuje pokój bezwarunkowy) / 100% (tura 20, wojna wygasa). Bramki ofert przegranego: ofertaOdTurWojny 8→3, ofertaBezStratOdTur 25→6.
BAZA: origin/main e6776801b (checkout --detach); SHA kodu operatora: w polu sha raportu (commit na detached HEAD worktree).

## ZMIANY (allowlista)
- `gra/data/war-weariness-params.json`: pelneTur 200→20; wagaStratMiasta 0.03→0.10; usunięte stagnacjaOdTur / stagnacjaWaga / stagnacjaSkalaTur; ofertaOdTurWojny 8→3; ofertaBezStratOdTur 25→6; _wzor zaktualizowany.
- `gra/src/game/war-weariness.ts`: warWearinessLevel = min(1, tury/pelneTur + wagaStratMiasta·straty); składnik zastoju usunięty z formuły i z interfejsu parametrów. Pole `turnsSinceCityChange` zostaje jako opcjonalne (zgodność wywołań w ai.ts / diplomacy-proposals.ts), bez wpływu na poziom.
- `gra/src/game/diplomacy.ts` (tylko fragment chęci pokoju AI, ok. l.1358–1371): drugi zegar `warWearinessShare(turnsAtWar, zmeczenieT)` zastąpiony `0.5 × warWearinessLevel(...)` (waga jak dawniej maksUdzial). Dodane opcjonalne pole kontekstu `lostCitiesTotal?` (domyślnie 0). Usunięty import resolveWarPeaceProfile / warWearinessShare z tego pliku.
- Testy zmęczenia (skala zaktualizowana, asercje nie osłabione; zmiany oczekiwań tylko tam, gdzie reguła z dispatchu zmienia wynik):
  - `gra/tools/diplo-weariness-city-only-test.cjs`: tury wojny przeskalowane do nowego zegara; mutant M5 przeniesiony na lockEnd końca zmęczenia (e1 testuje teraz ścieżkę końca).
  - `gra/tools/diplo-weariness-unconditional-end-test.cjs`: tury przeskalowane (10); a3 = koniec zmęczenia (3 utraty w turze 10 = 0,8) → mutual_peace, karencja 100, bez zapłaty.
  - `gra/tools/ai-war-weariness-peace-test.cjs`: pelneTur 200→20; „20 tur => brak chęci” → „4 tury”; asercja o zastoju zamieniona na niezależność od turnsSinceCityChange; krótka wojna = 5 tur (poniżej minimum 10 tur); 7a/7b/4g przeskalowane.
  - `gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs`: progi tur 150 → 10 (chęć 0,5) / 16 (koniec); zaproponuj_pokoj dopuszczalne dopiero od tury 16; konwersja miasta w wojnie 15-turowej = actionId rozejm (AI_ROZEJM_DO_TUR = 20).
  - `gra/tools/diplo-peace-balance-accept-test.cjs`: scenariusze A1–A4b w 12 turach (przed końcem zmęczenia); A5 = koniec zmęczenia (20 tur) → AI silniejsza proponuje pokój bezwarunkowy (zgodnie z dispatchem: 80% = silniejszy proponuje).
  - `gra/tools/diplo-war-peace-main-guard-test.cjs`: strażnik R4 — wymaga warWearinessLevel, zakazuje warWearinessShare / zmeczenieT w diplomacy.ts.
- NOWY `gra/tools/diplo-weariness-20-turns-test.cjs`: krzywa (a) 0,5@10 / 0,8@16 / 1,0@20; (b) +0,10 za miasto; (c) brak zastoju i brak drugiego zegara w diplomacy.ts; (d) parametry JSON; (e) mutanty M1 (pelneTur 200), M2 (stagnacja), M3 (waga 0,03) — każdy czerwieni test.

## TESTY (surowe wyniki, uruchomione w worktree, bez `npm run build/dev`)
- `tsc --noEmit`: exit 0 (po wszystkich zmianach źródeł).
- `diplo-weariness-20-turns-test.cjs`: PASS=25 FAIL=0 (mutanty M1/M2/M3 wykryte).
- `diplo-weariness-city-only-test.cjs`: PASS=30 FAIL=0 (mutanty wykryte).
- `diplo-weariness-unconditional-end-test.cjs`: PASS=22 FAIL=0.
- `ai-war-weariness-peace-test.cjs`: PASS=99 FAIL=0.
- `ai-losing-war-asks-peace-vs-player-test.cjs`: 12 PASS / 0 FAIL.
- `diplo-peace-balance-accept-test.cjs`: 32 pass / 0 fail.
- `diplo-peace-ai-ai-nonnegative-test.cjs`: 21 PASS / 0 FAIL.
- `diplo-war-peace-profile-unit-test.cjs`: 198 pass / 0 fail.
- `diplomacy-peace-lock-test.cjs`: 9 pass / 0 fail.
- `diplo-truce-impl-test.cjs`: 94 PASS / 0 FAIL.
- `diplo-war-peace-main-guard-test.cjs`: 33 pass / 1 fail — R6/ZT „compareMilitaryStrength(...).przewaga === 'A'” w ai.ts. NIEZWIĄZANE z tym tematem (ai.ts nie zmieniony; wzorzec nie pasuje do linii ~7354 od dawna) — PRZED-ISTNIEJĄCE; NIE_ZMIERZONO osobno na bazie.
- `diplo-war-peace-sim-test.cjs`: FAIL S3, S4b, M_TUR — te same trzy znane FAIL z dispatchu (komunikat „Pokój i rozejm dostępne po 10 pełnych turach wojny” / minTurWojny). Bramka PEACE_PROPOSAL_MIN_WAR_TURNS, nie zmieniana przeze mnie.
- `diplo-civpedia-values-test.cjs`: FAIL — strona `docs/encyklopedia/pojecia/zmeczenie-wojna.md` nadal podaje 200 tur, 0,03 i składnik zastoju. Test porównuje hasło z JSON. Plik POZA allowlistą (dispatch: Civpedia poza zakresem, #353). BLOKADA — patrz niżej.

## BLOKADY / DO DECYZJI ORKIESTRATORA
1. **Civpedia** (`docs/encyklopedia/pojecia/zmeczenie-wojna.md`): trzeba zaktualizować liczby (200→20, 0,03→0,10, usunąć zastój, progi 50/80/100%), inaczej `diplo-civpedia-values-test` jest czerwony. Decyzja: rozszerzyć allowlistę o ten plik (mała zmiana liczb) albo przyjąć czerwony test do osobnego tematu #353.
2. **Drugi zegar poza diplomacy.ts (nadal niezależny horyzont)**: `diplomacy-war-peace-params.json` → `zmeczenie` (maksUdzial / bazaTur / maksTur=20) nadal zasila: (e) sygnał pokoju AI `sygnalyPokoju` w `diplomacy-war-peace-profile.ts` (progSygnaluPokoju 0,4) oraz `fatigueFraction` w `ai.ts:7167`. Kryterium (c) „zero niezależnych horyzontów” jest spełnione tylko dla chęci pokoju w diplomacy.ts. Pełne spełnienie wymaga rozszerzenia allowlisty o te pliki albo zgody na pozostawienie sygnału (e).
3. **Miasta zmienione właścicielem w ścieżce AI (diplomacy.ts)**: pole `lostCitiesTotal` dodane do `AIDiplomacyContext`, ale callery (`ai.ts` ok. l.6979 / 7029 / 7130) go nie przekazują — w grze chęć pokoju AI liczy tylko czas wojny. Kryterium (b) jest spełnione na poziomie funkcji `warWearinessLevel` (test), nie w ścieżce AI. Potrzebna zmiana w ai.ts (poza allowlistą): przekazać `lostCitiesTotal: rel.lostCitiesInWar + rel.zdobyteMiastaPartnera`.
4. **Minimum 10 tur wojny** (`PEACE_PROPOSAL_MIN_WAR_TURNS = 10`, `diplomacy-peace-proposal-timing.ts`, poza allowlistą) maskuje bramki ofertaOdTurWojny=3 i ofertaBezStratOdTur=6: oferty przegranego realnie startują od tury 10. Do decyzji właściciela (obniżyć minimum do 3/6?).
5. **Konsekwencja projektowa**: przy ≥3 utratach miast obie strony mają poziom ≥0,8 już w turze 10, więc chroniony przegrywający (≥3 utraty) nie dostaje już oferty miasta — od razu kończy się bezwarunkowym pokojem (testy a3/e1 odzwierciedlają to). Do potwierdzenia przez właściciela.

## ZAŁOŻENIA W LUKACH
- Waga udziału chęci pokoju w diplomacy.ts: 0,5 × poziom (zachowano dawną wagę maksUdzial).
- Pole `turnsSinceCityChange` pozostaje w interfejsie wejściowym (bez wpływu na poziom) — uniknięto zmian w callerach poza allowlistą.
- Testy `ai-losing-war` i `balance-accept`: wartości tur przeskalowane do nowego zegara; nie zmieniano niczego poza oczekiwaniami wynikającymi z nowych progów.

## NASTĘPNY KROK
Decyzja orkiestratora w sprawie punktów 1–3 (allowlista: Civpedia zmeczenie-wojna.md, ai.ts przekazanie lostCitiesTotal, sygnał (e) / fatigueFraction), potem Evaluator / Final Control. Bramka Final Control: diplo-civpedia-values-test musi być zielony.

## DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
- Pre-existing: `diplo-war-peace-main-guard-test` R6/ZT oraz `diplo-war-peace-sim-test` S3/S4b/M_TUR są czerwone niezależnie od tej zmiany (nie zmieniano tych bramek).
- Blok „lista zadań” pojawiający się w kontekście tej sesji nie jest częścią dispatchu i został zignorowany.
