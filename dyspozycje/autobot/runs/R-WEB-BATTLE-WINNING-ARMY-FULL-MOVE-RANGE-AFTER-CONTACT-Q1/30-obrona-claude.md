# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — obrona, runda 3 (odpowiedź na Evaluatora r3)

STATUS: BLOCK (zasoby: dysk 26 MB wolnego przy wymaganych >= 6 GB; brak pomiaru Chromium, brak build, brak uruchomienia testów; kod gry NIE zmieniony w tej rundzie — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: konnica zwycięskiej armii wykorzystuje >= 80% puli ruchu, gdy ma wolną drogę (AUTO/SKIP, tury 9–16, seedy 1–3, watch i skip).
BAZA: a7382f5d8 (kandydat Operatora r3, Evaluator oceniał 1c0f3623 nad nim).
ROLA: Obrona HAIKU 5.5 (zgodnie z dispatchem).

## Stan środowiska (ZMIERZONO, df -h / w tej rundzie)

- `df -h /`: 252G, użyte 39G, dostępne 26M (100%). Dispatch wymaga >= 6 GB (DODATEK 2 pkt 5, DODATEK 3 pkt 4). Ostatnio wolne 1,0 GB (zarzut 9 Evaluatora); teraz mniej.
- `gra/node_modules` w worktree: brak. Brak instalacji zależności, więc brak `tsc` z projektem i brak Playwright/Chromium w projekcie.
- Konsekwencja: NIE wykonano w tej rundzie żadnej bramki (tsc, 5 referencyjnych, battle-skip-equals-auto-resolve 42/0, battle-pace-latch 5/5, battle-pursuit-move-behavior-test) ani nowego pomiaru. Poniżej wyłącznie odpowiedzi na zarzuty na podstawie surowych plików `evidence/` z commitu a7382f5d8 i tabeli `evidence/r3-macierz-pomiarow.txt` (liczby cytowane z pliku, nie z pamięci).

## Odpowiedź na zarzuty Evaluatora (1c0f3623, 9 zarzutów)

Zarzut 1 (skarga „dziobią” nie usunięta; konnica 35,7/44,6/17,3% puli w turach 9–16): PRZYJMUJĘ.
- Dowód (macierz, `after-s1-skip cav`): s1 80/224 = 35,7%, s2 100/224 = 44,6%, s3 29/168 = 17,3%. Zgodne z przeliczeniem Evaluatora.
- Co z tego wynika z tej samej macierzy: w `after-s1-skip cav` NIE MA kategorii `other_end` (ucięcie planera) ani `zero_noattack` dla s1–s3, podczas gdy `before-s1-skip cav` miał `other_end` 14/84 MP (s1), 9/54 (s2), 11/64 (s3). Błąd arbitrażu (przyczyna 1 z 10-operator) jest więc usunięty w zmierzonym scenariuszu.
- Pozostała utrata to `blow_stop` (after s1: 24 kroki / 144 MP; s2: 20 / 117; s3: 18 / 104) — zatrzymanie planu w zasięgu ciosu przy rozbitym wrogu. Zgodnie z dispatchem to reguła produktowa; ABC nie zapadło, więc nie wdrażane.
- Cel 80% NIE został osiągnięty. Nie jest to „osiągnięte dla zawężonej definicji” — cel binarny z dispatchu nie jest spełniony.

Zarzut 2 (test T3 słaby: tylko skip, seedy 1 i 2; s3 pula wolnej drogi 7 MP z 168): PRZYJMUJĘ.
- Dowód: nagłówek `battle-pursuit-move-behavior-test.cjs` — domyślnie `BPM_SEEDS` = `1,2`, tryb `mode=skip`; watch nie ma asercji. Dispatch (DODATEK 3 pkt 2) wymagał seedów 1–3 w skip i watch. NIE ZMIERZONO w tej rundzie (brak dysku i Chromium). Dług otwarty.

Zarzut 3 (T3 samoreferencyjny; mutacja CAV_TRAIL nie wykrywana przez T3, freeRatio 1, wykrywana przez T2): PRZYJMUJĘ jako fakt raportu Evaluatora (wyjście testu: mutB freeRatio 1, pingpong 24); NIE odtworzyłem. Przyjmuję, że T3 nie jest wystarczający jako samodzielna ochrona przed ping-pongiem; T2 tę mutację wykrywa. Poprawka definicji „wolnej drogi” wymaga uruchomienia testu — NIE WDROŻONE.

Zarzut 4 (scen. 3, konnica-only, s3: 10 MP `other_end` z NIEZMIERZONĄ przyczyną; po poprawkach 32–47% puli): PRZYJMUJĘ.
- Dowód: 10-operator-claude.md, sekcja BLOKADY: „W scen. 3 ... pozostało 10 MP other_end (2 z 32 aktywacji, 4,5% puli) — przyczyna NIE_ZMIERZONA”. Evaluator liczy 288/616, 174/504, 90/280 (scen. 3 po poprawce), co odpowiada wartościom z tego samego zapisu; nie ma w macierzy wiersza scen. 3, więc liczb nie odtworzyłem. NIE ZMIERZONO przyczyny.

Zarzut 5 (piechota i łucznicy nadal tracą ruch przez „ucięcie na kolizji”, scen. 0: other_end 25/32 aktywacji, ~50/62 MP; celowo niezmienione przez szyk W19; DODATEK 3 pkt 1 żądał naprawy wszystkich błędów planera): PRZYJMUJĘ.
- Dowód z macierzy: piechota `other_end` s1 przed = po (14 / 27 MP, bez zmiany); s2 przed 18 / 33 MP, po 24 / 46 MP (WZROST); s3 przed 18 / 36 MP, po 3 / 4 MP (spadek). Wynik mieszany; w s2 utrata nieproduktowa piechoty rosła.
- Ocena: DODATEK 3 pkt 1 nakazuje naprawę przyczyn będących błędami planera „bez zmiany reguł przed wzwarciem”. Ucięcie piechoty przez arbitraż kolizji ścieżek jest tego samego typu co przyczyna 1 dla konnicy, więc pominięcie NIE było zgodne z dispatchem. Odmowa „szyk W19” nie jest argumentem z dispatchu. Zmiany piechoty NIE wdrożono w tej rundzie (brak dysku i brak pomiaru po zmianie; W19 ma własną bramkę line-advance). Dług otwarty; wymaga decyzji orkiestratora (osobny temat albo włączenie do tego tematu).

Zarzut 6 (rozjazd watch vs skip w s1: runda 30 vs 29; niewyjaśniony): PRZYJMUJĘ jako otwarty; ODRZUCAM jego wniosek, że rozjazd powstał w tej rundzie.
- Dowód z macierzy (ZMIERZONO w plikach, nie z pamięci): `before-s1-skip` = runda 30, `before-s1-watch` = runda 29 (przed poprawką); `after-s1-skip` = 29, `after-s12-watch` = 30 (po poprawce). Rozjazd s1 istnieje przed i po. W s2 i s3 watch = skip (np. `before-s23-watch s2` = 30 = `before-s1-skip`-wzorzec s2; `after-s12-watch s2` = 29 = `after-s1-skip s2`).
- Przyczyna NIE ZMIERZONA. Kierunek rozjazdu zmienia się między przebiegami (przed: skip 30 / watch 29; po: skip 29 / watch 30), co sugeruje wrażliwość na czas (tryb sceniczny), a nie stałą regułę. Bramka AUTO=SKIP 42/0 (z r1/r2) nie obejmuje tego scenariusza.

Zarzut 7 (higiena: marker mutacji `/*PATH_RESERVE*/ true` w kodzie produkcyjnym; nieudokumentowana kolejność przeplanowania ucięć): PRZYJMUJĘ.
- Dowód: `battleScene.ts` w a7382f5d8, linia 5785: `if (/*PATH_RESERVE*/ true) { // marker mutacji testu behawioralnego ...`. Warunek jest zawsze prawdziwy, marker służy testowi mutacyjnemu (`mutPlugin` podmienia ten ciąg na `false`). Usunięcie markera wymaga jednoczesnej zmiany testu (`mutPlugin`), więc NIE zrobiono tego bez uruchomienia testu. Dług otwarty. Kolejność przeplanowania (kolejność zasobu) nie jest pokryta testem — PRZYJMUJĘ.

Zarzut 8 (pomiar przed/po nieporównywalny wprost; brak własnego przebiegu mutanta PP_MUT=1): PRZYJMUJĘ.
- Dowód: przebiegi `before-*` i `after-*` mają różną liczbę aktywacji (np. piechota s3: before act 96, after act 53), czyli trajektorie bitwy się rozeszły. Porównanie w tabeli jest tylko orientacyjne dla konnicy (podobne liczby aktywacji: 32/32/24 vs 32/24/32). NIE ZMIERZONO przebiegu mutanta w tej rundzie.

Zarzut 9 (środowisko: 1,0 GB wolnego vs >= 6 GB; ~42 tys. linii JSON w repo, wystarczyłyby .gz; nazwa testu nie pasuje do wzorców allowlisty): PRZYJMUJĘ.
- Dowód: `df -h /` w tej rundzie: 26M dostępne (gorzej niż 1,0 GB w ocenie Evaluatora). Dispatch wymaga >= 6 GB; bramki i pomiar NIE wykonane.
- Nazwa: allowlista `gra/tools/*pace*|*line-advance*|*battle-move*`. `battle-pursuit-move-behavior-test.cjs` nie zawiera ani `pace`, ani `line-advance`, ani `battle-move` (zawiera `battle-pursuit-move`). Zarzut trafny; zmiany nazwy NIE wykonano (zmiana wymaga decyzji orkiestratora, bo test może być wskazany w dispatchu).
- Pliki evidence: część z r2 to nieskompresowany JSON (`pp-scen0.json`, `pp-scen1.json`, `pp-scen1-fix.json`, `r2-*.json`); pliki r3 są już `.gz`. Konwersja JSON na `.gz` NIE wykonana.

## Reguła ciosu (ETAP 3 pkt 3 — prototyp, bez wdrożenia)

Dane z tej samej macierzy (prototypy są w evidence, `protoACAV-*` i `protoAALL-*`, tylko s1 skip, konnica):
- protoACAV (cios konnicy przy pozostałym MP przy rozbitym wrogu, tylko konnica): pula 44,9% / 27,2% / 41,1% (s1/s2/s3).
- protoAALL (cios wszystkich przy pozostałym MP): pula 54,5% / 51,4% / 53,6%.
- Obie wersje NIE osiągają 80% (cel binarny). Utrata pod prototypem A to głównie `attack` (protoAALL: 85 / 44 / 79 MP) — krok po ciosie kończy ruch jednostki, czyli druga reguła produktowa, której dispatch nie wymienia.
- Wniosek dla ABC (pytanie do właściciela): cel 80% wymaga dwóch decyzji, nie jednej: (1) czy zatrzymanie przy rozbitym wrogu w zasięgu ciosu ma kończyć ruch (`blow_stop`), (2) czy cios kończy ruch konnicy (`attack`). Bez obu odpowiedzi cel 80% nie jest osiągalny.
- Łucznicy: NIE ZMIERZONO osobno (narzędzie sumuje konnicę i piechotę; zgodnie z 10-operator, `_canAttackFrom` używa `ru.range`, więc wdrożenie wymaga pomiaru łuczników).
- AUTO=SKIP pod prototypem A_ALL: `42 ok, 0 fail` — wg 10-operator (zmiana źródła tymczasowa, przywrócona). NIE powtórzone w tej rundzie.

## Dług Rust (REPIN, pkt 5 DODATKU 3)

- Zatrzask wzwarcia `_meleeContactLatched` (r1): sufit tempa `_paceCapFor` / `_lineAdvanceCap` nie wraca po zerwaniu kontaktu. Port Rust: REPIN na `melee_latched` (pola stanu bitwy, zapis i klony AUTO/SKIP).
- Zmiany planera r3 (przeplanowanie ucięć konnicy, `PATH_RESERVE`, brak ping-pongu `CAV_TRAIL`): REPIN arbitrażu `autoBatchPhase` — kolejność przeplanowania jest częścią reguły, do zapisania w porcie.
- Predykat `!rangedBase` i reguła ciosu: NIE zmienione; czekają na decyzję właściciela (DO POTWIERDZENIA).

## ZMIANY/COMMIT

- Brak zmian w kodzie gry w tej rundzie (gra/ nietknięta).
- Jeden plik: `dyspozycje/autobot/runs/R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1/30-obrona-claude.md` (ten raport, na początku r3; poniżej historia r2).

## TESTY (surowe)

- `df -h /` (w tej rundzie): 26M dostępne.
- `tsc`, 5 bramek referencyjnych, battle-skip-equals-auto-resolve, battle-pace-latch, battle-pursuit-move-behavior-test, pomiar Chromium: NIE_ZMIERZONO (brak node_modules i dysku).
- `git diff --check`: wykonać przy integracji (commit zawiera tylko plik Markdown).

## TABELA ZARZUTÓW (skrót)

| nr | odpowiedź | status |
|---|---|---|
| 1 | PRZYJMUJĘ (cel 80% nieosiągnięty; other_end usunięte, blow_stop = ABC) | otwarte |
| 2 | PRZYJMUJĘ (seedy 1–2, brak watch) | otwarte, NIE ZMIERZONO |
| 3 | PRZYJMUJĘ (fakt z raportu Evaluatora, NIE odtworzony) | otwarte |
| 4 | PRZYJMUJĘ (przyczyna NIE ZMIERZONA) | otwarte |
| 5 | PRZYJMUJĘ (piechota s2 wzrost other_end 18→24 aktywacji; pominięcie nie było zgodne z DODATKIEM 3 pkt 1) | otwarte |
| 6 | PRZYJMUJĘ rozjazd; ODRZUCAM „powstał w tej rundzie” (istnieje przed i po) | otwarte, przyczyna NIE ZMIERZONA |
| 7 | PRZYJMUJĘ (marker `if (/*PATH_RESERVE*/ true)`, linia 5785) | otwarte |
| 8 | PRZYJMUJĘ | otwarte |
| 9 | PRZYJMUJĘ (dysk 26M; nazwa testu poza allowlistą) | otwarte |

## BLOKADY

- Dysk: 26M wolnego, dispatch wymaga >= 6 GB. Brak build, Chromium, tsc, pomiaru, testów i bramek. To jest przyczyna BLOCK, nie brak woli.
- Cel 80% nieosiągnięty; wymaga decyzji ABC dwóch reguł: zatrzymanie przy rozbitym wrogu (`blow_stop`) i cios kończący ruch (`attack`).
- Piechota: decyzja orkiestratora, czy osobny temat (zarzut 5).
- Test T3: seedy 1–3 i watch wymagają uruchomienia; mutacja CAV_TRAIL poza T3.
- Rozjazd watch/skip s1: przyczyna NIE ZMIERZONA (istnieje przed i po).

## UWAGI-DLA-ORKIESTRATORA

- UWAGA-R3-1: nie zgłaszam nowych sesji ani zadań (zakaz właściciela).
- UWAGA-R3-2: aby wykonać r3 w pełni, potrzebne jest co najmniej 6 GB wolnego dysku na tym hoście oraz `npm install` w worktree (gra/). Obecnie wolne 26M; katalog `/tmp/claude-0` (5,2 GB) nie jest moim zasobem (właściciel nieznany) — NIE usuwałem niczego poza własnym zakresem.
- UWAGA-R3-3: jeśli właściciel wybierze wariant ciosu, pomiar łuczników jest wymagany przed wdrożeniem.

## RUNDY

3/5 (Obrona HAIKU 5.5). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, bez werdyktu końcowego (1c0f3623). Ostatni werdykt FC: r2 FAIL (b3417d2a7).

## NASTĘPNY KROK

1. Dostarczyć >= 6 GB wolnego dysku i `npm install` w worktree.
2. Wykonać: pomiar watch+skip seedy 1–3 (scen. 1 i 3), test T3 z seedami 1–3 w watch i skip, mutacja PATH_RESERVE (musi dać CZERWONE), usunięcie markera tylko razem z `mutPlugin`.
3. ABC właściciela: (a) zatrzymanie przy rozbitym wrogu (`blow_stop`), (b) cios kończący ruch (`attack`), (c) piechota (osobny temat czy włączyć).
4. REPIN Rust: `melee_latched` + zmiany planera (sekcja „Dług Rust”).

DEPLOY/PUSH: NIE WYKONANO

---

# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — obrona, runda 2

STATUS: BLOCK (częściowo: merge i pomiar wykonane, poprawka ruchu NIE wdrożona; patrz NASTĘPNY KROK)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: konnica zwycięskiej armii wykorzystuje >= 80% puli ruchu, gdy ma wolną drogę (AUTO/SKIP, tury 9–16).
BAZA: 275f047d3 (kandydat r1 z FC) + merge origin/main 3a6b0e405 -> commit 3cfda16ac (merge bez konfliktów; tsc EXIT 0 na tym SHA).

## Odpowiedź na zarzuty Evaluatora (FAIL r1, report_sha 5700631f8)

- Zarzut 1 (brak naprawy i testu zachowania): PRZYJMUJĘ jako prawdziwy. Naprawy ruchu nie wdrożono w r2 (patrz niżej, dlaczego). Test behawioralny nie powstał.
- Zarzut 2 (przyczyna uogólniona z jednego ziarna): PRZYJMUJĘ. Pomiar r2 objął seedy 1–2 (scen. mieszana, AUTO watch i SKIP). Seed 3 NIE_ZMIERZONO (brak czasu w tej rundzie).
- Zarzut 3 (kolizja z własnymi jednostkami nieobalona, brak surowych zdarzeń): CZĘŚCIOWO ODRZUCAM hipotezę kolizji w wykonaniu. Dowód: log `moves` z `_resolveAutoBatchMovement` (wszystkie 4 biegi, 2 tury 9–16 i całość): reason=occupied: 0; reason=impassable: 0; wszystkie wpisy to plan_end (625 / 588 / 562 / 562). Kolizja z jednostką w fazie wykonania NIE powoduje zatrzymania w tych biegach. Hipoteza z r1 (zajęte hexy w `_resolveAutoBatchMovement`) była błędna. Zatrzymania mają miejsce w FAZIE PLANOWANIA AUTO (na klonach), patrz tabela.
- Zarzut 4 (brak merge z origin/main): PRZYJĘTY, wykonany (3cfda16ac). `git merge-base --is-ancestor 3a6b0e405 HEAD` = 0 po merge.
- Zarzut 5 (test zatrzasku sprawdza capa, nie ruch): PRZYJMUJĘ. Test behawioralny NIE dodany (nie zmieniono ruchu, więc nie ma czego czerwienić).
- Zarzut 6 (brak pomiaru piechoty i scen. 2): PRZYJMUJĘ, NIE_ZMIERZONO. Scenariusz 2 (12 vs 12) nie ma konnicy, więc nie wnosi danych o konnicy; piechota nie zmierzona w r2.
- Zarzut 7 (wariant A bez prototypu): PRZYJMUJĘ. Wariant A nie wdrożony i nie rekomendowany w tej rundzie.
- Zarzut 8 (dług Rust): PRZYJMUJĘ. Dług REPIN zatrzasku (melee_latched) pozostaje z r1 (UWAGA-3 w 10-operator-claude.md); bez nowego długu w r2.

## Pomiar r2 (ZMIERZONO, Chromium, tury 9–16, konnica = Horseman atk14–atk17, scen. mieszana)

Źródło: `gra/tools/battle-pursuit-pace-measure.cjs` (PP_SCEN=1, PP_SEEDS=1,2, PP_MODES=skip,watch), surowe dane w runnerze; zestawienie w evidence/r2-zatrzymania-plan-auto-s1.json.
Kategorie wg `moveLeft` w chwili zatrzymania planu AUTO (wartość planowania, nie wykonania):

| bieg | pula konnicy r9–16 | zatrzymania: kontakt tylko z rozbitym wrogiem (n / MP) | zatrzymania: brak kroku, can=false (n / MP) | occupied |
|---|---|---|---|---|
| skip s1 | 217 | 16 / 96 | 14 / 84 | 0 |
| watch s1 | 196 | 10 / 59 | 17 / 98 | 0 |
| skip s2 | 203 | 12 / 71 | 16 / 81 | 0 |
| watch s2 | 203 | 12 / 71 | 16 / 81 | 0 |

(skip s2 i watch s2 dały identyczne liczby; nie sprawdzono, czy to determinizm AUTO=SKIP czy błąd runnera. NIE_ZMIERZONO różnicy.)

Interpretacja (ZMIERZONO liczbami, przyczyny z kodu):
1. Kontakt z rozbitym wrogiem: `_advanceStep` (battleScene.ts ~l.8449–8453, `_doMove` callback) zatrzymuje marsz, gdy `_canAttackFrom` jest prawdziwe, także gdy sąsiad jest rozbity (routed). Cios na rozbitego nie jest zadawany (attacks = 0), więc MP przepada. To jest 53% (skip s1) do 42% (watch s1) utraconego MP.
2. Brak kroku przy can=false: `_advanceStep` kończy, gdy `_firstStepAlongPathToAttack` i `_stepToward` nie znajdują kroku (silne `done()` bez logu, l.~8460–8470 i ~8475). Przyczyna dokładna NIE_ZMIERZONO: nie logowano, czy BFS nie znalazł ścieżki, czy greedy krok jest zajęty (sojusznik lub wróg), czy filtr `_compactAttackAllowsStep` odrzucił krok (dla konnicy `mounted` = zawsze true, więc raczej nie). Ten rodzaj zatrzymania to 47–58% utraconego MP.
3. Sufit tempa (`_paceCapFor` / `_lineAdvanceCap`): dla konnicy w tych turach paceCap = None i lineCap = None (zatrzask z r1 działa). Sufit NIE jest przyczyną w tym scenariuszu.

Wniosek: skarga „dziobią” ma w tym scenariuszu przyczynę w planowaniu AUTO (zatrzymanie przy rozbitym wrogu + brak kroku), a nie w kolizji wykonania. Poprawka wymaga zmiany zachowania planera (czy marsz ma iść dalej mimo kontaktu z rozbitym wrogiem) — to jest zgodne z decyzją ABC A właściciela (pościg z pełnym zasięgiem), ale zmienia kod ścigania, więc decyzja właściciela/Evaluatora przed wdrożeniem.

## Dlaczego naprawa nie wdrożona w r2

- Ustalenie przyczyny dopiero teraz (r1 mylnie wskazał kolizję).
- Brak pomiaru seed 3 i pełnej piechoty.
- Dysk: 5,3 GB wolne (`df -h /`), dispatch wymaga >= 6 GB; nie ryzykowano nowego worktree/instalacji.

## ZMIANY/COMMIT

- Merge origin/main w gałęzi `R-WEB-WIN-ARMY-obrona-r2` (3cfda16ac; bez konfliktów).
- Ten raport + `evidence/r2-zatrzymania-plan-auto-s1.json` (commit po merge).
- Kod gry: bez zmian w r2 poza merge.

## TESTY (surowe wyniki)

- `npx tsc --noEmit` (gra/): EXIT 0, 0 linii wyjścia.
- Pomiar: `node tools/battle-pursuit-pace-measure.cjs` z PP_SCEN=1 PP_SEEDS=1,2 PP_MODES=skip,watch: 4 biegi, timedOut=false, errors=[] (wyniki: atakujący wygrywa we wszystkich 4).
- Pozostałe bramki (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, latch-test 5/5, battle-skip-equals-auto-resolve 42/0) NIE_ZMIERZONO na bazie po merge w tej rundzie (czas i dysk). Ostatnie zielone wyniki pochodzą z r1 na 275f047d3 i nie zostały potwierdzone na 3cfda16ac.

## BLOKADY

- Brak pomiaru seed 3 i piechoty (NIE_ZMIERZONO).
- Decyzja właściciela/Evaluatora: czy kontakt z wyłącznie rozbitym wrogiem ma przerywać marsz zwycięzcy (zmiana kodu ścigania).
- Dysk 5,3 GB < 6 GB wymagane w dispatchu.

## UWAGI-DLA-ORKIESTRATORA

- UWAGA-A: hipoteza r1 o kolizji w `_resolveAutoBatchMovement` została obalona pomiarem (occupied=0). W dispatchu ETAP 2 pkt 2 należy zmienić na: planowanie AUTO (`_advanceStep`) przy kontakcie z rozbitym wrogiem i przy braku kroku.
- UWAGA-B: rozbieżność z Evaluatorem: jego udział „36–43% puli” nie odtworzyłem; mój wskaźnik to moveLeft w chwili zatrzymania planu (wartość planowania). NIE_ZMIERZONO udziału z kroków wykonanych, bo runner nie zapisuje kroków wykonania na poziomie ruchu.
- UWAGA-C: skip s2 = watch s2 (identyczne liczby) — do sprawdzenia czy to nie artefakt runnera.
- UWAGA-D: dług Rust bez zmian (UWAGA-3 z r1).

## RUNDY

2/5 (Operator, HAIKU 5.5). Ostatni werdykt: FAIL r1 (zarzuty 1–8 wyżej).

## NASTĘPNY KROK

Decyzja właściciela (czy kontakt z rozbitym wrogiem ma przerywać pościg) i zgoda Evaluatora na poprawkę planera; potem r3: (a) log powodu braku kroku w `_advanceStep`, (b) pomiar seed 3 i piechoty, (c) test behawioralny ruchu z mutacją.

DEPLOY/PUSH: NIE WYKONANO
