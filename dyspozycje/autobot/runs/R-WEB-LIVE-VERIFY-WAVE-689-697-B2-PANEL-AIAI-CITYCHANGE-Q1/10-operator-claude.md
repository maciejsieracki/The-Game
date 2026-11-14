STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1
GOAL: Żywa gra (Chromium, ?civTest=1, tryb przyspieszony): P1 panel dyplomacji gracz↔AI (zrzut bez nakładki + odczyt DOM, T5/10/16/20, zakładka powiadomień „Dyplomacja” i widoczność propozycji pokoju od AI w T17+, ≥2 ziarna), P2 wojna AI↔AI ≥16 tur, P3 zmiana właściciela miasta (+10% zmęczenia), P4 anomalia „neutralni/240 s”.
BAZA: kandydat 78be66bb5 (runner z r2), gra z origin/main 0432ebddf (FALA 701), bundle zbudowany POZA repo (vite --outDir w scratchpadzie), zero zmian w gra/src i gra/data.
RUNDA: 3/5 (Operator SONNET, uzasadnienie: dwie nieudane rundy Haiku tego samego tematu — r1 BLOCK, r2 FC FAIL).

## ZMIANY/COMMIT
- gra/tools/live-verify-wave-689-697-b2-panel-run.cjs (jedyny plik kodu; allowlista `live-verify-wave-689-697-b2-*.cjs`).
- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1/: b2-*-r3*.json (wyniki), b2-*-r3*.png (zrzuty OBEJRZANE — wybór niżej), ten raport.
- Brak zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/. Żadnego `npm run build/dev` w gra/ (build: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/b2bundle3`, `✓ built in 16.21s`). Brak `?playtest=mapa` (URL: `?civTest=1&civSeed=<ziarno>`). Brak `__nnsMeasureDebug.grantPlayerGold`/`grantPlayerFood` (`nnsGrants` = 0 we wszystkich 13 plikach r3*; dosypek ujemnych 0).

## DWIE PRZYCZYNY BŁĘDÓW r1/r2 (poprawione w runnerze)
1. Start tur przed końcem generacji świata (FC r2). Poprawka: pętla gotowości czeka na `!overlayVisible && worldReady && awaitingFirstCity` (limit 15 min), potem `foundFirstCity()` + `playerCities()>0`. Wynik: generacja 141–217 s przy 3 równoległych przebiegach (ziarna 271828 i 314159); po starcie tur nakładka „Tworzenie świata” NIE pojawia się ani razu (`window.__ovLog`: jedyny wpis = start, tura 1; czas czekania na zniknięcie nakładki przed zrzutem w probach 1–35 ms, `stillVisible=false` w 100% prób). To potwierdza, że „nakładka w trakcie tur” z r1/r2 była artefaktem niedokończonej generacji w runnerze, nie defektem gry na ścieżce realnego startu.
2. Wojna prowadzona z MIASTEM-PAŃSTWEM. `__aiTradeWiringTestDebug.info().aiOwners` zaczyna się od [40, 41] = miasta-państwa (karta „Ostia · Rzymianie · miasto-państwo”, 1 miasto, skarbiec 25). Cała wojna P1/P2 z r2 (i pierwszy przebieg r3) szła z miastem-państwem, stąd „AI ma 1 miasto” i brak P3. Poprawka: cywilizacje główne z `__borderEraPenaltyRuntimeTestDebug.ownerIds()` (tu [1,4,7,10,…]). Różnica wobec r2: wszystkie liczby P1 niżej są dla cywilizacji głównych.

## WYNIKI KRYTERIÓW (tabela punkt → werdykt → dowód)

| Punkt | Werdykt | Dowód (pliki w katalogu runu) |
|---|---|---|
| P1 zrzut panelu bez nakładki + odczyt DOM (T5/10/16/20), ziarno 271828 | PASS | b2-war-seed271828-r3.json; b2-war-seed271828-r3-T{5,10,16,17,18,20}-aud1.png |
| P1 ziarno 314159 | PASS | b2-war-seed314159-r3.json; b2-war-seed314159-r3-T{5,10,16,17,18,20}-aud1.png |
| P1 zakładka powiadomień „Dyplomacja” + widoczność propozycji pokoju od AI w T17+ | PASS (z uwagą UI) | `*-r3-T{5,10,16,17,18,20}-notif.png`; pole `probes[].notif` w JSON |
| P1 powtarzalność | PASS | repeat `-r3rep`: digest stanu 22/22 tur równy na OBU ziarnach, odczyty panelu w 6/6 probach identyczne |
| P2 wojna AI↔AI ≥16 tur | NIE_OSIĄGNIĘTO (zmierzone: koniec po 9–10 turach, reguła, nie błąd runnera) | b2-aiwar-seed271828-r3{,b,c,e}.json, b2-aiwar-seed314159-r3{b,c,d}.json |
| P2 panel pary AI↔AI | PASS | b2-aiwar-seed271828-r3c-T30-aud16.png (karta Sumerów: „W stanie wojny z: Egipt Zmęczenie wojną 30%”) |
| P3 +10% zmęczenia za zmienione miasto (gracz↔AI) | PASS, 2 ziarna | b2-war-seed271828-r3b-T25-capture-{before,after}.png, b2-war-seed314159-r3c-T25-capture-*.png |
| P3 w parze AI↔AI | NIE_ZMIERZONO bezpośrednio (UI pokazuje tam tylko wiersz przegrywającego, bez licznika zmęczenia) | b2-aiwar-seed314159-r3d.json |
| P4 anomalia „neutralni/240 s” | NIE_ODTWORZONO | b2-speed-seed271828-r3.json |

### P1 — wartości z DOM karty AI (`.civ-diplo-aud-box`, otwartej przez `__truceTestDebug.openAudience`), wojna AI→gracz wypowiedziana w T1 realnym `ownerDeclareWarOn`
Format wiersza panelu: „Ty: <Desperacja|Zmęczenie> X% / <AI>: <Desperacja|Zmęczenie> Y%”.

Ziarno 271828, AI nr 1 (Celtowie), tura (stan po EOT):
- T5: Ty Zmęczenie 20% / Celtowie Zmęczenie 20% (brak przegrywającego, brak desperacji)
- T10: 45% / 45%
- T16: Ty Desperacja 43% / Celtowie Zmęczenie 75%
- T17: Ty Desperacja 46% / Celtowie Zmęczenie 80%; w stole negocjacji wpis `pokoj:1>0` (AI proponuje pokój)
- T18: 48% / 85%; T20: 53% / 95% (propozycja pokoju nadal na stole, „wygasa za 2 tur”)

Ziarno 314159, AI nr 1 (Chińczycy): T5 20/20; T10 Desperacja 0% / Zmęczenie 45%; T16 Desperacja 54% / Zmęczenie 75%; T17 57% / 80% (+propozycja pokoju); T18 59% / 85%; T20 63% / 95%.

Wyjaśnienie przesunięcia o 5 pp wobec „25/50/80/100” z r2: licznik = (tura − start wojny)·5%. Wojna została wypowiedziana w T1, więc T5 = 4 tury = 20%, T10 = 45%, T16 = 75%, T17 = 80%, T20 = 95%. Przy starcie wojny w T0 byłoby 25/50/80/100. Zgodne z `war-weariness-params.json` (pelneTur 20), nie jest to błąd.

Zrzuty OBEJRZANE (opis): b2-war-seed271828-r3-T16-aud1.png — pełnoekranowa „Audiencja dyplomatyczna”, baner „WOJNA”, brak jakiejkolwiek nakładki „Tworzenie świata”, w sekcji „Relacje z Tobą” wiersze „Ty Desperacja 43% / Celtowie Zmęczenie wojną 75%”, stół negocjacji pusty. b2-war-seed314159-r3-T5-aud1.png — „Ty Zmęczenie wojną 20% / Chińczycy Zmęczenie wojną 20%”. b2-war-seed314159-r3-T20-aud1.png — „Ty Desperacja 63% / Chińczycy Zmęczenie wojną 95%”, w kolumnie „Oni oferują” kafel „ICH PROPOZYCJA — Propozycja pokoju / zawieszenia broni · 500 PW, wygasa za 2 tur”, w „My oferujemy” kontrpozycja 270 PW (baza 500, Relacja −46% siła), bilans −230 PW.

Widoczność propozycji pokoju od AI dla gracza w T17+ (zrzut b2-war-seed271828-r3-T17-notif.png, selektory):
- w panelu bocznym `.civ-side-panel .sp-event.sp-blocking[data-id="negot-pokoj-0-1-t17-1"]` z tekstem „Dyplomacja: Celtowie — Rozpatrz →”, nad zakładkami „Dyplomacja 0 / Ważne 0 / Inne 0”, nagłówek „2 WYMAGAJĄ DECYZJI”;
- czerwona plakietka „1” na ikonie dyplomacji w lewym pasku narzędzi;
- w tablicy negocjacji karty AI (`.civ-diplo-aud-box`, kolumna „Oni oferują”).
Czyli propozycja pokoju od AI JEST widoczna dla gracza od T17 (pierwsza tura z zmęczeniem 80%); w T16 (75%) wpisu nie ma (`entries=[]`). Zgodne z wyjaśnieniem B1 (AI proponuje bezwarunkowy pokój od progu 0,8).

Uwaga UI (nie defekt gry, do wiadomości): licznik zakładki „Dyplomacja” pokazuje „0” mimo istniejącej karty decyzji o pokoju — karta „WYMAGA DECYZJI” jest wyświetlana nad zakładkami jako blokująca i nie wchodzi do licznika zakładki. Kliknięcie `.sp-tab[data-sp-tab="dyplomacja"]` nie ujawnia dodatkowych wpisów (lista `.sp-event` identyczna).

### P2 — wojna AI↔AI
Metoda: `__truceTestDebug.declareWar(aiA, aiB)` (realny `ownerDeclareWarOn`) między dwiema cywilizacjami GŁÓWNYMI, gracz w pokoju; odczyt karty AI A, w turach bez zrzutu lekki odczyt DOM każdej tury (`turns[].light`). Cztery przebiegi, wszystkie kończą wojnę po 9–10 turach:
1. ziarno 271828, wojna od T1 (AI1↔AI4, po 1 mieście): pokój w T11. Log gry: `R-WEB-WEARINESS: pokój AI1↔AI4 za cenę (stopień 1, oferta #1, zmęczenie 0.50); zloto=0 surowce=0 miasto=0 (0/0 PW)`. Panel: T5 „Zulusi Desperacja 16%”, T10 „Zmęczenie wojną 45%”.
2. ziarno 271828, wojna od T24 (AI16 vs AI13, po 5 miast): pokój w T33/T34, identyczny log (zmęczenie 0.50, 0/0 PW). Panel T26 „Egipt Desperacja 11%”, T27 16%, T29 „Zmęczenie wojną 25%”, T31 35%, T33 45%.
3. ziarno 314159, wojna od T24 (AI7 vs AI1): pokój w T33/T34 inną ścieżką: `R-AI-PEACE-2T: pokój AI7↔AI1 [rozejm] (accept_paid, ...); zapłata zloto=0 surowce=0 miasto=0 (0/0 PW)` (udział siły 0,24–0,40). Panel „Chińczycy Desperacja” 11% → 47% (T32).
4. ziarno 271828, wojna od T24, wersja z odczytem długiego okna: pokój T34, `peaceUntilTurn=74`.
Rozstrzygnięcie: to REGUŁA kodu, nie błąd runnera. W `war-weariness.ts` (`runWarWearinessTick`) po `PEACE_PROPOSAL_MIN_WAR_TURNS=10` tur wojny słabsza strona (stopień oferty ≥1 przy desperacji ≥ 0,25) przy cenie pokoju `requiredPn ≤ 0` (`priceZero`) zawiera pokój bez miasta i bez zapłaty („0/0 PW”), który zwycięzca akceptuje (`cityGiven = priceZero || ...`). Dlatego zmęczenie ≥ 0,8 (T16+, `wearinessUnconditionalEndDue`) w parach AI↔AI nie jest osiągane w żadnej z 4 prób. Karencja po pokoju AI↔AI = `karencjaPoPokojuTur` 40 tur (peaceUntilTurn 74 przy pokoju w T34).
Wymuszone ponowne wypowiedzenie wojny w pętli (REDECLARE=1): 25–27 prób w każdym przebiegu (od T11 w przebiegu z wojną od T1; T35–T58 w przebiegu z T24), wszystkie z wynikiem `status=pokoj` przed i po (karencja). Okno T75+ nie zostało osiągnięte: w przebiegu b2-aiwar-seed271828-r3e.json w T58 gracz miał 0 miast (jedyne miasto gracza utracone, `cities.me=0`), co zatrzymuje `endTurn` (timeout 120 s) — przyczyna techniczna w setupie (gracz bez obrony przez 58 tur), nie diagnoza gry. Ponowny pomiar okna po karencji: NIE_ZMIERZONO (powód: j.w.).

### P3 — zmiana właściciela miasta (+10% zmęczenia)
Metoda: realna funkcja gry `__peaceRulesTestDebug.captureCityForTest(cityId, newOwner)` → `applyCityCaptureToMap` → `recordWarCityLossForPair` (hak testowy ISTNIEJĄCY w origin/main, bez żadnych zmian w gra/src). AI zakłada kolejne miasta dopiero ok. T22, więc wojna do P3 jest wypowiadana w T22 (DECLARE_TURN) między cywilizacjami z ≥3 miastami (nie eliminujemy cywilizacji; przy < 2 miastach ofiary runner pomija zdobycie — próby T12–T21 w wcześniejszym przebiegu: „ofiara ma < 2 miasta”).
- ziarno 271828, wojna AI4↔gracz od T22, zdobycie w T25 (miasta AI 4 → 3): odczyt panelu PRZED: Ty Desperacja 0% / Zulusi Zmęczenie 15%; PO: Desperacja 0% / Zmęczenie wojną 25% → +10 pp. PASS. Zrzut b2-war-seed271828-r3b-T25-capture-after.png OBEJRZANY („Ty Desperacja 0%, Zulusi Zmęczenie wojną 25%”, panel nadal baner „WOJNA”).
- ziarno 314159, AI1 vs gracz od T22, zdobycie w T25 (miasta AI 6 → 5): 15% → 25%. PASS.
- Para AI↔AI (ziarno 314159, AI7 zdobywa miasto AI1 w T26, AI1 6 → 5 miast): panel pokazuje tylko wiersz desperacji przegrywającego („Chińczycy Desperacja 26%” przed, 26% bezpośrednio po, 28% w T27) — licznik zmęczenia nie jest tam wyświetlany, więc +10 pp nie da się odczytać z DOM. NIE_ZMIERZONO bezpośrednio.

### P4 — anomalia „neutralni/240 s”
Tryb nieprzyspieszony (`setFastMode(false)`, render SwiftShader), wojna AI→gracz, ziarno 271828, T2–T23: czas tury 15,6–21,7 s (średnio ≈19 s), brak tury > 25 s, `pageErrors=0`, brak nakładki. W trybie przyspieszonym te same tury 1,3–3,5 s. Anomalii 240 s NIE ODTWORZONO na ziarnie 271828 (wynik uczciwy, nie wniosek o jej nieistnieniu). Wcześniejsze „0,3–0,8 s/turę” z r2 było zmierzone na niedokończonym świecie — nieważne.

## TESTY (surowe wyniki)
- `npm ci` w kopii źródeł origin/main (poza repo): zainstalowane, vite build `✓ built in 16.21s`, index.html 14 682,58 kB.
- Przebiegi (czasy `elapsedSec` z logów): war 271828 281 s / 314159 212 s (T23); war P3 328 s / 266 s (T35); aiwar 271828 330 s (T37), 486 s (T53), 358 s (T41), 639 s (zatrzymany T58); aiwar 314159 289 s, 294 s, 273 s; speed 688 s (T23). Wszystkie `stoppedBy=koniec zakresu` poza przebiegiem T58 (patrz P2).
- `pageErrors` = 0 we wszystkich 13 plikach r3*; `overlay stillVisible` = false we wszystkich probach; `overlayLog` = 1 wpis (start świata, tura 1) w każdym pliku.
- Powtarzalność: 271828 22/22, 314159 22/22 równych digestów stanu (`__detHarness.digest`, FALA 701) + 6/6 identycznych odczytów panelu na ziarno.
- `git diff --check` (staged): czysto.

## ZAŁOŻENIA
- Odczyt panelu AI↔gracz wymaga „odkrycia” AI: `__aiTradeWiringTestDebug.prepare(ai)` przed `declareWar` (tech Wymiany obu stron, skarbiec AI ≥ 300, kontakt, wyciszone cooldowny handlu). Wpływa na skarbiec/handel AI, nie na licznik zmęczenia.
- Odrzucanie ofert AI blokujących koniec tury (handel, `rejectedByScript`: 0–4 na przebieg) wykonywane PO odczycie obserwacji danej tury; propozycje pokoju AI gracz NIE odrzuca w trakcie odczytu (są widoczne w probach T17–T20; po odczycie bramka je odrzuca, więc wojna trwa).
- Otwarcie karty AI w każdej turze (`openAudience`) jest tylko odczytem UI; digesty `-r3rep` równe 22/22 przy tym samym schemacie odczytu.

## BLOKADY
Brak blokad technicznych dla P1/P3/P4. P2: okno po karencji (T75+) nieosiągalne w tym setupie (gracz traci jedyne miasto w T58); P3 w parze AI↔AI niemierzalne z DOM.

## UWAGI-DLA-ORKIESTRATORA (nie naprawiałem)
1. [do decyzji właściciela] Wojny AI↔AI kończą się po 9–10 turach przy zmęczeniu 0,45–0,50 bezkosztowym pokojem („0/0 PW”: `priceZero`, `war-weariness.ts` ~l.271–275 i ścieżka `R-AI-PEACE-2T accept_paid` 0 PW). Dokumentacja (`data/war-weariness-params.json` `_wzor`/`progKoncaZmeczenia`, hasło „wojna AI↔AI kończy się przy 0,8”) sugeruje koniec dopiero przy 0,8 (T16+); w praktyce próg 0,8 między AI↔AI jest nieosiągalny, gdy cena pokoju = 0. To nie narusza zasady „pokój tylko za miasto” (cena 0 jest świadomym wyjątkiem), ale odbiega od opisu wojny „do 0,8”. Do wiadomości przy #376/#359.
2. [UI, drobne] Licznik zakładki „Dyplomacja” = 0, gdy jedyny wpis dyplomatyczny to blokująca karta decyzji (propozycja pokoju); karta jest widoczna nad zakładkami, ale licznik sugeruje brak wpisów.
3. [UI, informacyjnie] W parze AI↔AI karta AI pokazuje tylko wiersz przegrywającego (desperacja) albo wiersz zmęczenia — nigdy oba; zmęczenie pary AI↔AI zwycięzcy nie jest widoczne, jeśli jest przegrywający. W grze gracz↔AI oba wiersze są widoczne („Ty / AI”).
4. [infrastruktura testów] `__aiTradeWiringTestDebug.info().aiOwners` zaczyna się od miast-państw (40, 41), a `info().ai` = pierwszy z nich — każdy runner „wojna z AI[0]” prowadzi wojnę z miastem-państwem (jedno miasto, skarbiec 25). Nowe runnery powinny używać `__borderEraPenaltyRuntimeTestDebug.ownerIds()`.
5. [setup] Gracz z jednym miastem i bez obrony traci je do T58 (barbarzyńcy/AI) — `endTurn` po utracie miasta nie kończy się w 120 s. Dla pomiarów >T55 potrzebny runner z obroną gracza.
6. [nie odtworzono] „AI nie zakłada miast” z r2: AI zakłada kolejne miasta dopiero od ok. T22 (1 miasto T1–T21, 3 w T23, 5–6 w T25) — to zachowanie gry na tych ziarnach, nie artefakt; wpływa na wszystkie pomiary „zdobycie miasta” przed T22.

## RUNDY
3/5. r1 BLOCK (nakładka w zrzutach), r2 FC FAIL (świat niedokończony, wojna z miastem-państwem), r3 = niniejszy raport. Kolejne rundy niepotrzebne dla P1/P3/P4; P2 wymaga decyzji właściciela (uwaga 1) i runnera z obroną gracza (uwaga 5).

## NASTĘPNY KROK
Evaluator: sprawdzić (1) czy zrzuty `*-r3-T{5,10,16,17,18,20}-aud1.png` są bez nakładki i zgodne z odczytem DOM w JSON, (2) czy liczby P3 (15%→25%) zgadzają się z `capture.before/after.audienceLines`, (3) czy uwaga 1 jest właściwie sklasyfikowana jako reguła, a nie defekt.

DEPLOY/PUSH: NIE WYKONANO
