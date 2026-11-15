# R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1 — raport Obrony Operatora (odpowiedź na zarzuty Evaluatora, runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1
GOAL: AI nie kończy tury ze skarbcem/spichlerzem < 0 od tury 1 (ABC 2026-11-14); gracz bez zmian.
BAZA: 8bf235190 (kandydat Operatora r1, nie zmieniany w tej rundzie w kodzie gry). Dodany tylko test behawioralny i ten raport.
ZMIANY-COMMIT: `gra/tools/no-negative-stocks-ai-t2-behavior-test.cjs` (nowy, test behawioralny) + ten plik. Kod gry (`gra/src/`) bez zmian względem 8bf235190 (sprawdzone: `git status` czysty po probach).

## Odpowiedzi na zarzuty (1–5)

### Zarzut 1 — przyczyna -1 w T2 / „skok skarbca” seed 22 oid 13 — PRZYJMUJĘ W CZĘŚCI, ODRZUCAM ZAŁOŻENIE „rozjazdu projekcja↔bank” dla tych wierszy

Sonda per krok (instrumentacja tymczasowa w `gra/src/main.ts`, build poza repo, runner headless z Chromium, wycofana `git checkout`; NIE w commicie). Kroki tury AI, w kolejności wykonania:
`P` = projekcja po dźwigniach (`nnsAiPreTickBalance`, main.ts ~7560–7600), `A0` = skarbiec przed tickiem (po `refreshCityAdministrators`, main.ts ~39966), `B` = bankowanie (main.ts ~40572, przed klamrą), `C` = po klamrze (main.ts ~40604), `R/G/K/L/M/N` = kolejne kroki po bankowaniu (research, `advanceGoldDeficit` ~40744, miasta ~40883, `applyAiAllocationProfiles` ~41676, pętla AI ~42119, `ownerLoop` ~42409), `D13/S13/H13` = zapisy skarbca AI (delta dyplomacji, `setOwnerTreasury`, zatrudnienie administratora), `VILL13` = nagroda wioski.

Seed 22, oid 13 (fenicjanie):
- T4: `P` końcowa po dźwigniach `skPo=-3` (utrzymanie 16); `B`: `skarb0=2 + pieniądz 11 − utrzymanie 16 = -3`. Projekcja i bankowanie ZGODNE; nie ma rozjazdu. Owner nie pokryty dźwigniami → `aiNnsUncoveredOwners`, klamra `C t4 sk13=0`.
- Skok 0 → 60 nastąpił PO bankowaniu, między `N t4` (start `ownerLoop`) a początkiem tury 5: `VILL13 amount=60 q=73 r=47 t4` → `S13 set=60 prev=0 t4`. Źródło: `grantGold` (nagroda „Chatka”, main.ts:33272–33277, `setOwnerTreasury(ownerId, ownerTreasury(ownerId) + amount)`), czyli zwykła nagroda za wejście jednostki AI do wioski, nie wyciek ticku.
- T10: identycznie `VILL13 amount=70 q=66 r=56 t10` → `S13 set=70 prev=0 t10`.
- Bez klamry (mutacja) ten sam owner w T4 miałby `-3 + 60 = 57`, więc kolumna `skEnd` w runnerze (stan po całej turze) pokazuje wartość po nagrodzie; kolumna `sk` = min(bank przed klamrą, koniec) nadal łapie surowe `-3`. To konwencja pomiaru (opisana w runnerze), nie stan gry.

Seed 11, T2 (przypadek −1 z dispatchu, live na main 800578f29):
- Na kandydacie `B t2`: oid 1 = 0+10−4 = 6; oid 12 = 0+7−4 = 3; oid 13 = 0+6−4 = 2; oid 22 = 0+7−4 = 3; oid 40 = 0+7−4 = 3 (wszystkie ≥ 0). Projekcja pierwsza `skPo=-2/-3` dla części właścicieli, po dźwigniach ≥ 0 (`P t2 oid1 skPo=6`, `P t2 oid12 skPo=3` itd.).
- Przyczyna −1 w T2 na bazie: próg `NNS_AI_BALANCE_TURN_MIN = NNS_WOLNE_TURY + 1 = 11` wyłącza równoważenie w T1–10 (`gra/src/main.ts:7523` `if (turn < NNS_AI_BALANCE_TURN_MIN) return;`), więc dźwignie nie działają i bankowanie zostaje ujemne. Kandydat (próg = 1) to naprawia; wynik potwierdzony sondą.
- Nie zmierzono: seed 11 po T4 w sondzie (tylko T1–4) — NIE_ZMIERZONO poza T4.

Wniosek: przyczyna wskazana plik:linia = `main.ts:7523` (próg) dla −1 w T2; dla wierszy z seeda 22 (T4, T9, T10) bank jest poprawny, a „skok” to nagroda wioski `main.ts:33277`. Rozjazd projekcja↔bank z raportu Operatora r1 — ODRZUCONY dla tych wierszy (dowód: P t4 skPo=-3 = B -3).

### Zarzut 2 — klamra do 0 jako decyzja produktowa bez ABC — PRZYJMUJĘ (nie rozstrzygam sam)

Zgoda z oceną: klamra (`gra/src/main.ts:40600`, `if (aiNnsUncoveredOwners.has(oid) && aiSkarb < 0) aiSkarb = 0;`) zamyka w 0 dług AI, którego dźwignie nie pokryły, i nie wywołuje `advanceGoldDeficit` dla tej tury (skarbiec nie jest ujemny). To jest decyzja produktowa. Nie zmieniam jej w kodzie w tej rundzie.
Dane do decyzji ABC (zmierzone):
- Bez klamry (mutacja, test behawioralny poniżej): seed 33, tury 2–4 — 4 naruszenia `skEnd < 0` (oid 12 asyria T2 −1, T3 −2, T4 −3; oid 34 fenicjanie T4 −3). Z klamrą: 0. Klamra jest więc potrzebna, by spełnić GOAL na seedzie 33, dopóki nie ma dodatkowej dźwigni.
- Skala zerowanego długu w seedzie 22: −3 (T4) i −5 (T9–10) per owner, co jest drobne względem skarbca kraju.
- Alternatywy do wyboru przez ABC: (a) zostawić klamrę (stan obecny), (b) usunąć klamrę i dodać dźwignię (wyłom w ochronie obrońcy przy długu — zmienia balans wojskowy AI), (c) cofnąć próg do 11 (wraca symptom z dispatchu).
- Rekomendacja Operatora: (a) jako najmniejsza naprawa celu, z jawnym zapisem w Civpedii/REJESTR; decyzja należy do ABC.

### Zarzut 3 — test regresji tylko statyczny; brak dowodu mutacyjnego dla klamry — PRZYJMUJĘ, POPRAWKA WYKONANA

Dodany test behawioralny `gra/tools/no-negative-stocks-ai-t2-behavior-test.cjs`: uruchamia realną grę (realny bundle vite, headless Chromium, realne „Zakończ turę”) przez `no-negative-stocks-headless-measure.cjs` na seedzie 33, tury 1–4, i wymaga `skEnd >= 0` dla wszystkich wierszy AI tur 2–4 (test pusty = błąd). Użycie: `node tools/no-negative-stocks-ai-t2-behavior-test.cjs --dist <bundle>`, bundle budowany poza repo.

Wyniki surowe (stdout, kandydat 8bf235190, bundle `dist-clean`, czysty build):
```
[nns-t2-behavior] wiersze AI tury 2–4: 123; skarbiec < 0 po turze: 0
PASS: no-negative-stocks-ai-t2-behavior-test   (exit 0)
```
Mutacja (klamra zakomentowana w main.ts:40600, bundle `dist-mut`, przywrócone `git checkout`):
```
[nns-t2-behavior] wiersze AI tury 2–4: 123; skarbiec < 0 po turze: 4
  NARUSZENIE tura 2 oid 12 (asyria) skEnd=-1 (bank przed klamrą sk=-1)
  NARUSZENIE tura 3 oid 12 (asyria) skEnd=-2 (bank przed klamrą sk=-2)
  NARUSZENIE tura 4 oid 12 (asyria) skEnd=-3 (bank przed klamrą sk=-3)
  NARUSZENIE tura 4 oid 34 (fenicjanie) skEnd=-3 (bank przed klamrą sk=-3)
FAIL: no-negative-stocks-ai-t2-behavior-test   (exit 1)
```
Czerwień na bazie 38d145144 dla tego testu NIE zmierzona bezpośrednio (wymagałaby osobnego buildu bazy) — NIE_ZMIERZONO; czerwień na bazie dla testu statycznego/jednostkowego (3 pass / 8 fail, progi) i headless bazy seed 11 (243 wiersze skEnd<0 T1–10, pomiar Operatora r1) pozostają jako dowód progu.

### Zarzut 4 — spichlerz AI < 0 (harappa oid 7, T6–T8, spichRaw = −1, glod = true) — ODRZUCAM (z dowodem)

- `gra/src/game/empire-food.ts:286–289`: `central = Math.max(0, central); … st.zapasyPanstwa = central;` — zapas państwa po ticku jest zawsze ≥ 0. `spichRaw` (`spichlerzStolicy − kosztArmii`) jest wartością PRZED klamrą; runner dokumentuje to wprost (`gra/tools/no-negative-stocks-headless-measure.cjs`, nagłówek: „stan zapasyPanstwa jest po ticku ZAWSZE klamrowany do >= 0”).
- `glod` = `central < 0` przed klamrą (`empire-food.ts:284`), czyli głód garnizonu (niedobór żywności dla armii). To istniejący mechanizm gry (dotyka także gracza), a nie stan zapasu poniżej zera. GOAL mówi o spichlerzu < 0 po turze; stan zapasu po turze wynosi 0, nie < 0.
- Uwaga dla orkiestratora (definicja, nie błąd): runner liczy `glod` jako naruszenie. Jeżeli właściciel chce, by głód garnizonu był też kryterium, to osobna decyzja; w tym temacie nie zmieniam definicji runnera.
- NIE_ZMIERZONO: komórka seed 22 (harappa oid 7) nie była powtórzona w tej rundzie.

### Zarzut 5 — pomiar T1–30 na 3 ziarnach niewykonany — PRZYJMUJĘ JAKO BRAK POMIARU (NIE_ZMIERZONO)

Nie wykonano: baza 38d145144 T1–30 na 3 ziarnach wymaga osobnego buildu bazy i ~6 długich komórek. W tej rundzie wykonano: kandydat seed 22 T1–10 (sonda), seed 33 T1–4 (test behawioralny), seed 11 T1–4 (sonda). Miasta/jednostki AI w T30 i próg 5% (DECISION_REQUIRED) — NIE_ZMIERZONO. Nie fałszuję wyniku. Rekomendacja: osobny temat pomiarowy (baza vs kandydat, T1–30, ziarna 11/22/33), uruchamiany przez runner wznawialny.

## Bramki (surowe wyniki w tej rundzie, kandydat 8bf235190)

- `npx tsc --noEmit` (gra/): exit 0
- `node tools/no-negative-stocks-ai-t2-test.cjs`: 11 passed, 0 failed
- `node tools/no-negative-stocks-c2-test.cjs`: 43 passed, 0 failed
- `node tools/no-negative-stocks-ai-t2-behavior-test.cjs --dist <dist-clean>`: PASS, 123 wiersze, 0 naruszeń (exit 0)
- mutacja klamry → FAIL, 4 naruszenia (exit 1)
- `git diff --check` nowego pliku: brak końcowych spacji (grep -c " $" = 0); `node --check` OK
- Pozostałe bramki referencyjne z r1 (logic-test, tech-tree, research, unit-replace, combat) NIE powtarzane w tej rundzie — kod gry nie zmieniał się względem r1 (tylko nowy plik testowy).

## Stan repo i sprzątanie
- Probe'y (main.ts) cofnięte `git checkout -- gra/src/main.ts`; `git status` przed commitem: tylko nowy test i ten raport.
- Build i dane tymczasowe w scratchpad (poza repo); `gra/node_modules` z `npm ci` (ignorowane przez git).
- Commit: tylko `gra/tools/no-negative-stocks-ai-t2-behavior-test.cjs` i ten plik (ścieżki jawne, bez `-A`).

## NIE_ZMIERZONO
- T1–30 × 3 ziarna (zarzut 5).
- Czerwień na bazie dla testu behawioralnego (zarzut 3).
- Seed 22 harappa (spichlerz, zarzut 4).
- REPIN Rust (nie sprawdzano `rust-port/`; zmiana progu AI wymagałaby osobnego sprawdzenia przez orkiestratora).

## UWAGI-DLA-ORKIESTRATORA
- DECYZJA ABC (zarzut 2): klamra write-off długu AI — zostawić (a), dźwignia (b), czy cofnąć (c). Bez tej decyzji temat nie jest READY_FOR_DEPLOY.
- Definicja spichlerza (zarzut 4): czy `glod` (głód garnizonu) ma być naruszeniem GOAL.
- Nie tworzono sesji, zadań, triggerów ani harmonogramów. Nie pushowano na main. Nie integrowano.

RUNDY: 2/5 (obrona po rundzie Evaluatora 1)
NASTĘPNY KROK: Evaluator (weryfikacja odpowiedzi i testu behawioralnego) -> ABC do właściciela w sprawie klamry (zarzut 2) -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
