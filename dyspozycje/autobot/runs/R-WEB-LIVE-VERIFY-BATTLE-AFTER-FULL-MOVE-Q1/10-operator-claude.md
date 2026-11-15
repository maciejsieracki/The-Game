STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiary i narzędzia; gra/src, gra/data, WERSJE.md, battleScene.ts nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1
GOAL: potwierdzić na żywo (Chromium, prawdziwy BattleScene) po FALI 745/747: (1) ucieczka i pościg po utracie morale, (2) mieszana armia, (3) straty zwycięzcy w trybie ręcznym vs AUTO.
RUNDY: 3/5 (Operator SONNET; uzasadnienie: dwie nieudane rundy Haiku, r1 FAIL, r2 BLOCK)

## BAZA I DOWÓD KODU
- `git rev-parse HEAD` przed commitem raportu: `4918d210e48509d2257cd208d7e590a835dd70f6` (kandydat r2, detached).
- `git merge-base --is-ancestor 7ac79dafb HEAD` = TAK. `git diff --stat 7ac79dafb HEAD -- gra/src gra/data WERSJE.md` = puste; `git status --short gra/src gra/data` = puste. Kod gry użyty w pomiarach = FALA 747 (7ac79dafb) bez zmian.
- "SHA builda": pomiary NIE korzystają z `vite build`. Narzędzia uruchamiają vite dev server (`createServer`) na drzewie worktree (jak istniejący `battle-rout-pursuit-measure.cjs`); wersja kodu = SHA powyżej. Odstępstwo od dispatchu (build poza repo) udokumentowane; nie powstał żaden artefakt buildu.

## ZMIANY / COMMIT (allowlista)
- `gra/tools/battle-rout-pursuit-browser-entry.ts`: telemetria (zdarzenia rout/flee z id jednostki `bu.id` — w r2 było `undefined`; kroki uciekinierów per runda; pościg wg typu atakującego; ciosy na jednostkę na rundę; migawki pozycji na początku rundy z flagami „niewykorzystany ruch przy wolnej drodze”; `fledAtEndResolve`; tryby `auto` i `manual`; `norender`; `setRender` do zrzutów).
- NOWE `gra/tools/live-verify-battle-after-full-move-live.cjs` (N2 + N3, jedno polecenie, exit 1 przy naruszeniu).
- NOWE `gra/tools/live-verify-battle-after-full-move-manual-driver.cjs` (N1, klik-po-klik w Playwright).
- Dowody: `runs/.../evidence/` (jsonl, tabele txt, 3 zrzuty PNG, mutacje, bramki). Przywrócono `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json` przed commitem.
- Uwaga procesowa: dispatch wymienia glob `live-verify-battle-after-full-move-*.cjs` i `battle-rout-pursuit-browser-entry.{ts,html}`; trzymałem się go (nowe pliki to dwa `.cjs` z tym prefiksem; entry rozszerzone zamiast nowego pliku .ts/.html).

## WYNIKI

### (2) N2: mieszana armia NA ŻYWO (Chromium, tryb AUTO w czasie rzeczywistym, bez „Pomiń”)
Polecenie: `cd gra && node tools/live-verify-battle-after-full-move-live.cjs --part n2` (wynik: `evidence/live-n2-n3-table.txt`, dane: `evidence/live-n2-n3.jsonl`). Progi: rozrzut frontu ≤ 2, ciosy/jednostkę/turę ≤ 1, niewykorzystany ruch ≤ 10% (próg 10% to ZAŁOŻENIE Operatora; dispatch nie podaje liczby). 6 bitew: 0 naruszeń.

| scenariusz | ziarno | zderzenie wręcz (runda) | max rozrzut frontu | max ciosów/jedn./turę | niewykorzystany ruch % per typ (obserwacje) |
|---|---|---|---|---|---|
| M1 piechota+strzelcy+konnica (lustro) | 1 | 2 | 2 | 1 | piechota 0% (151), strzelcy 0% (119), konnica 0% (29) |
| M1 | 2 | 2 | 2 | 1 | 0% (93), 0% (83), 1,8% (55) |
| M1 | 3 | 2 | 2 | 1 | 0% (70), 1% (102), 0% (44) |
| M2 z machinami (Katapulta) | 1 | 2 | 1 | 1 | 0% (162), 0,7% (141), 0% (78), machiny 0% (50) |
| M2 | 2 | 2 | 1 | 1 | 1,1% (93), 0% (105), 0% (60), machiny 0% (30) |
| M2 | 3 | 2 | 1 | 1 | 1,8% (56), 0% (98), 0% (79), machiny 0% (50) |

Definicje (w nagłówku narzędzia): rozrzut = max−min przebytych kolumn od pozycji startowej wśród jednostek wręcz (piechota+konnica) w migawkach do pierwszego zderzenia włącznie; ciosy liczone na prawdziwych jednostkach (bez klonów planowania AUTO); niewykorzystany ruch = jednostka po rundzie następującej po zderzeniu: zapas ruchu (min(ruch, sufit tempa)) nie zużyty, brak ciosu, brak wroga w zasięgu wręcz, istnieje wolny heks bliżej wroga, a strzelec/machina nie trzyma pozycji w zasięgu.
Ograniczenie (uczciwie): rozstawienie bitwy ma z założenia FRONT_GAP ≤ 5 heksów (`battleScene.ts` stała), więc okno „przed zderzeniem” to 1-2 migawki (zderzenie w rundzie 2). Rozrzut ≤ 2 jest zmierzony, ale na krótkim oknie. „Hastati” w tym narzędziu liczy się jako strzelec (ma piłum), dlatego piechotę reprezentuje „Wojownik”.

### (1) N3: ucieczka i pościg, neverRout ("walczy do śmierci")
Polecenie: `... live.cjs --part n3` (21 bitew: R1 neverRout, R2 wręcz 12v12 Hastati, R3 konnica vs piechota; tryby auto, skip, instant × 3 ziarna). 0 naruszeń. Zbiór neverRout NIEPUSTY: R1 = 4 jednostki „Wojownik z maczugą (Chaska)” (flaga `neverRout=true` w eksporcie).
- B1 neverRout: w 6/6 bitew R1 żadna nie została rozbita (0 zdarzeń rout z flagą), żadna nie uciekła; wszystkie 4 poległy walcząc; po pierwszym rozbiciu innych zadały 5, 9 i 6 ciosów (ziarna 1,2,3). Czyli NEVERROUT-HOLD-FIGHT działa.
- B2 ucieczka 50% ruchu: `fleeMove == max(1, floor(ruch × 0,5))` (mnożnik z `data/combat-params.json`), Wojownik ruch 4 → limit 2; zmierzone max 2 kroki/turę w każdej bitwie (stosunek ≤ 0,5; Hastati ruch 3 → 1 krok/turę, 0,33). Każdy krok w stronę własnej krawędzi. Tabela tura/runda per uciekinier (np. R1 s1: r2 atk6 2 kroki, r3 atk6/atk12/atk13 po 2, r4 atk4/atk6/atk7 po 2...) w `evidence/live-n2-n3-table.txt`, wszystkie kroki w jsonl (`fleeSteps`).
- B3 pościg: R3 konnica vs piechota: ciosy w uciekinierów 21/21, 27/27, 16/16 (razem/konnica); R1: 37/12, 52/25, 59/24 (razem/konnica); strzelcy 0.
- Limit odwrotu ≤ 3/turę: INFO, NIE kryterium (K6 zdjęte zgodnie z DODATKIEM 2). Dotyczy odwrotu ARMII po bitwie (`battle-retreat-limit.ts`, `post-battle-map.ts`), wymaga kampanii: NIE_ZMIERZONO w scenie bitwy.
- Wiersze `mode:instant` (R2, 3 wiersze): `_skipInstantFallback` rozstrzyga bez rozgrywania bitwy (runda 0, killed/fled = 0, winner „atakujacy” za każdym razem). To nie regresja NEVERROUT-HOLD-FIGHT: w tych scenariuszach nie ma jednostek neverRout, a bitwa nie jest symulowana. Wiersze instant są tylko raportowane (K1).
- Anomalia „12/12 atakujących ucieka bez zabitych” (R2 wręcz 12v12 Hastati s1: atk 0/12/0, def 0/2/10; s2 atk 1/11/0; s3 atk 1/7/4, def 1/11/0): w eksporcie `neverRout=false` dla wszystkich 24 jednostek (Hastati rozbijają się z morale), a bitwa kończy się załamaniem morale armii (`Koniec bitwy: zwyciestwo OBRONCY`, 35-43 rund). Rozbici uciekają 1 hex/turę (50% z ruchu 3) i giną w pościgu lub uciekają — zgodne z regułami; nie jest to regresja neverRout. Ocena, czy tak masowe załamanie w mirrorze 12v12 jest pożądane balansowo: decyzja właściciela (nie defekt kodu).
- K2: uciekinierzy rozstrzygani regułą końca bitwy `_resolveRemainingRouted` (poza zasięgiem wroga = uciekł) są liczeni osobno (`fledAtEndResolve`), nie jako „poza krawędzią”. W r2 K2 zaczerwieniało na mirrorze mieszanym tylko dlatego, że narzędzie nie odróżniało tej reguły.

Zrzuty (3 PNG w `evidence/`, OBEJRZANE narzędziem Read; pauza klawiszem P, zoom kółkiem myszy, scenariusz R1 s1, AUTO):
1. `live-shot-1-pierwsze-rozbicie.png`: „Tura 1”, x512, PAUZA; baner Rzym (atakujący) 15 jedn. vs Grecja 23; dwie zwarte linie z niebieskimi i czerwonymi sztandarami zderzają się w środku pola; tooltip „Warrior 22/22, Morale 78%”. Widać pierwsze zderzenie, w danych 2 rozbicia.
2. `live-shot-2-neverRout-walczy.png`: „Tura 2”; baner 15 vs 20 jednostek; w zwarciu m.in. jednostki z maczugami (Chaska), niebieskie pozostają w linii, czerwone obok; w danych 5 rozbić, a neverRout żyje i stoi w walce.
3. `live-shot-3-poscig-konnica.png`: „Tura 3”; Rzym tylko 4 jednostki (atakujący rozbity), Grecja 20; z prawej strony widać czerwone jednostki konne zbliżające się do pojedynczych niebieskich; w danych 14 rozbić i pierwsze ciosy konnicy w uciekinierów. Ograniczenie: na zrzucie widać mało szczegółów, kamera przybliżona kółkiem, nie wycentrowana na uciekinierach; ruch 50% dowodzą dane (tabela kroków), nie obraz.

### (3) N1: straty zwycięzcy w trybie RĘCZNYM (klik-po-klik) vs AUTO
Polecenie: `cd gra && node tools/live-verify-battle-after-full-move-manual-driver.cjs --seeds 1,2,3` (resumowalne; tabela: `evidence/manual-vs-auto-table.txt`, dane: `evidence/manual-vs-auto.jsonl`). 18 bitew = 2 składy × 3 ziarna × (reczny-marsz, reczny-fokus, AUTO). 0 naruszeń integralności pomiaru (ponowne próby sterowania przy „brak widocznego pustego pola”: C2 s1 3 próby, C2 s2 2; C2 s3 przeszło po poprawce drivera „brak aktywnych wrogów = czekaj na koniec bitwy”).
Sterowanie UI (prawdziwe zdarzenia myszy/klawiatury): chip roster „all” → (a) „marsz”: przycisk Atakuj-marszem + klik w puste pole za linią wroga; (b) „fokus”: Shift+klik w najbliższego wroga; klawisz Spacja; czekanie na stan UI (`waitForFunction`: runda wzrosła / koniec bitwy / jednostki bez rozkazu), bez ślepego sleep. Scena startuje w trybie ręcznym; bramka generała wyłączona jak w istniejących testach ręcznych (zestaw testowy nie ma generała).
Wynik (skrót; HP utracone zwycięzcy): reczny-marsz wygrywa atakujący tylko w 3/6 bitew, reczny-fokus w 0/6 bitew, AUTO w 5/6 (C2 s3 wygrywa obrońca w AUTO też). W 12 z 12 par (ręczny vs AUTO) rozbieżność > 25% lub inny zwycięzca (np. C1 s2: AUTO atakujący traci 23 HP, reczny-marsz wygrywa obrońca tracąc 71 HP; C2 s2: 28 HP vs 147 HP). Pełna tabela w pliku.
Diagnoza (dane z migawek i ciosów, tabela DIAGNOSTYKA w txt; obserwacje: jednostki gracza bez sąsiada wroga po rundzie 1):

| tryb | średni ruch heks/rundę | odsetek obs. z pełnym ruchem | ciosy strony gracza / strony AI (średnio na bitwę) |
|---|---|---|---|
| reczny-marsz | 0,85 | 5% | 33 / 76 |
| reczny-fokus | 0,92 | 2% | 7 / 125 |
| AUTO (ta sama strona) | 1,87 | 17% | 106 / 37 |

Jednostki gracza w trybie ręcznym przesuwają się o ~1 heks/rundę przy budżecie ruchu 3-4 (AI i AUTO: ~2-3), więc nie dochodzą do wroga i giną, zadając kilka razy mniej ciosów. Wygląda to na to, że rozkazy gracza (`move`/`attackMove`/`attack`) w `_performPlayerOrder` (`battleScene.ts` od linii 18889) wykonują jeden `_doMove` i kończą aktywację (`done()`), czyli reguła „pełny ruch” z FALI 745 nie obejmuje ścieżki rozkazów ręcznych. To HIPOTEZA oparta na kodzie i pomiarze; nie weryfikowałem jej poprawką (zakaz zmian w gra/src).

## KANDYDACI R-WEB-* (nie naprawiano)
1. **R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1** (wysoki wpływ): w trybie ręcznym rozkazy gracza nie używają pełnego ruchu (~1 heks/rundę zamiast 3-4), zwycięzca przegrywa z AI, straty rozbieżne 12/12 par. Plik/funkcja: `gra/src/battle/battleScene.ts`, `_performPlayerOrder` (gałęzie `move`, `attackMove`, `attack`). Minimalna reprodukcja: `cd gra && ONLY='C1\|1\|manual-march' node tools/live-verify-battle-after-full-move-manual-driver.cjs --seeds 1 --out /tmp/x`, składy `Wojownik:14` (gracz, atakujący) vs `Wojownik:10`, ziarno 1; porównać z `manual` vs `auto` w `manual-vs-auto.jsonl` (C1 s1). Dowód: tabele wyżej, `snapshots[].units[6]` (przemieszczenie na rundę) i `hitCount`. To też częściowo wyjaśnia obserwację #272/#335 (straty zwycięzcy w trybie ręcznym). Uwaga: przebiegi ręczne nie są bit-powtarzalne (timing UI zmienia zużycie losowości), więc liczby per ziarno mogą się różnić między uruchomieniami; kierunek efektu był stały w 3 niezależnych seriach (~0,9 vs ~1,9 heks/rundę).
2. Brak innych defektów w N2 i N3: neverRout, 50% ruchu, pościg i równe tempo/ciosy ≤ 1/niewykorzystany ruch ≤ 1,8% zachowują się zgodnie z regułami. Kandydat RETREAT-CAP-3 pozostaje wycofany.

## TESTY
- `npx tsc --noEmit -p tsconfig.json`: exit 0 (po `npm ci`, 71 pakietów).
- Bramki referencyjne (po `npm ci` w tym worktree, logi `evidence/gate-*.txt`): logic `LOGIC OK (213/213)`; tech-tree `20 pass, 0 fail`; research `PASSED: 33 / FAILED: 0`, `ALL GREEN`; unit-replace `WSZYSTKIE TESTY ZIELONE (21/21)`; combat `COMBAT TEST: 6/6 pass`, `All sanity checks passed.` (wszystkie exit 0).
- `battle-large-mixed-doctrine-matrix-test.cjs`: exit 0, `Matrix: 36 scenarios, 42 active units each, 5 activations, 0 red conditions` (`evidence/matrix-test.txt`); nadpisany `01-matrix.json` PRZYWRÓCONY przed commitem.
- `git diff --check`: czysto (bez wyjścia).
- Mutacje na KOPIACH danych (nie `git checkout`): `evidence/mutations-r3-script.cjs`, wynik `evidence/mutations-r3.txt`: 28 sprawdzeń, 0 niezgodnych, w tym baza (exit 0) i każde kryterium: A1 (rozrzut, brak zderzenia), A2, A3, B1 (neverRout rozbity/uciekł/zbiór pusty/bez ciosów), B2 (za dużo kroków, krok ku wrogowi, brak 50%), B3 (brak pościgu, konnica nie dobija), K1 (timeout, pageerror), K2, K3, K5, N1 (timeout, brak rozkazu z UI, scena nie w trybie ręcznym, tryb ręczny wyłączony, bilans, pageerror, brak wyniku) oraz `--strict-discrepancy` (exit 1 na prawdziwych danych). Pierwsza wersja mutacji A1 nie czerwieniła (moja mutacja zerowała się z punktem odniesienia q0); poprawiłem mutację i ponowiłem, nie osłabiałem asercji.

## NIE_ZMIERZONO / OGRANICZENIA
- Limit odwrotu armii po bitwie ≤ 3/turę (czwarty = unicestwienie): NIE_ZMIERZONO (kampania, poza sceną bitwy).
- Pre-kontaktowy rozrzut frontu na krótkim oknie (1-2 migawki; FRONT_GAP ≤ 5).
- Reczny driver: jeden prosty rozkaz na całą armię (marsz albo fokus); nie reprezentuje wyrafinowanej gry człowieka; dlatego raportuję rozbieżność jako kandydata, nie wyrok. `--strict-discrepancy` zamienia kandydatów na exit 1 (domyślnie exit 0 gdy integralność pomiaru zachowana).
- Liczba bitew mała (3 ziarna × 2 składy); wnioski kierunkowe.

BLOKADY: brak (żadnej twardej przeszkody; DECYZJA nie wymagana).
NASTĘPNY KROK: Evaluator r3 (zweryfikować tabele, 3 zrzuty, mutacje, bramki); orkiestrator: decyzja o kandydacie R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1 (osobny temat; zmiana w `battleScene.ts` dopiero po RESIDUAL-INFANTRY-Q2 i COLLISION-ARB).
DEPLOY/PUSH: NIE WYKONANO
