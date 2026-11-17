# R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 — Obrona, runda 4 (odpowiedzi na zarzuty Evaluatora z kandydata 81ac0eba4)

STATUS: BLOCK (częściowy pomiar: AUTO i skip zmierzone na ścieżce mapowej, 3 ziarna, atakujący; tryb ręczny z rozkazami ZABLOKOWANY na ścieżce mapowej przez bramkę generała, potwierdzone po drugim podejściu; kontrola zamiany stron NIE ZMIERZONA)
DOMAIN: GAME (narzędzie pomiarowe w `gra/tools/`; `gra/src` bez zmian)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: pomiar Wojownik vs Wojownik 10 vs 10 ścieżką mapową (`?playtest=mapa&civTest=1` + `__civTest.addUnit(...,'Wojownik')` x10 po obu stronach), bez presetu, bez przepisywania statystyk, z dowodem haka w runtime.
BAZA: 81ac0eba4154583f228fd01e7cf6cbf0ba35468e (kandydat operatora, detached worktree). Dispatch i DODATEK 2 z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Build: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/ad2/dist4 --emptyOutDir` (17,9 s, EXIT 0). `npm ci --ignore-scripts` w `gra/` (EXIT 0, 71 pakietów). Chromium: `/usr/bin/chromium`, TMPDIR `/tmp/ad2/tmp`.

## ZMIANY-COMMIT (runda 4)
- `gra/tools/live-verify-wojownik-map-q1.cjs` — (a) nagłówek przepisany: opisuje tylko to, co kod wykonuje; (b) usunięta martwa pętla ręczna (`if (false)`, -49 linii); (c) skip = klik w realny przycisk UI `button[title="Pomin do wyniku"]` (battleScene.ts ~3411), fallback `scene.skip()` oznaczony jawnie jako "BRAK przycisku UI"; (d) ziarno = `?civSeed=<N>` (civ-test-hooks.ts `civTestSeedOverride`), zamiast samego `Math.random`; (e) kontrola obrony: wynik bez stosów Wojownik zapisywany jako NIE ZMIERZONO; (f) `res.logRouted` / `res.logPursued` = liczba wpisów ucieczki i pościgu w pełnym logu bitwy.
- `dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/evidence-wojownik-map-r5.json` — surowe wyniki tej rundy (18 przebiegów: atk/def x manual/auto/skip, ziarna 1,2,3).
- Ten raport (sekcja runda 4 na górze; poprzednie rundy zachowane niżej).
- `gra/src/` bez zmian (zero linii diff). Nie zmieniano `civ-test-hooks.ts`, `gra-robocza/`, `WERSJE.md`, `gra/data`. Nie pushowano.

## TESTY (surowe wyniki)
- `node tools/civtest-addunit-typeid-test.cjs` → `ADDUNIT-TYPEID STATIC: 10/10`, EXIT 0.
- `node ./node_modules/typescript/bin/tsc --noEmit -p .` (w `gra/`) → EXIT 0.
- Driver: `W_ROLES=atk,def W3_MODES=manual,auto,skip ... evidence-wojownik-map-r5.json 420`, uruchamiany wielokrotnie z wznawianiem z pliku. Ostatnie uruchomienie atk auto/skip z logiem: `LEFT 0`. Wiersze def: 9 x NIE ZMIERZONO; atk manual: 3 x BLOCK.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

Zarzut 1 (tryb ręczny NIE ZMIERZONO; podejście 2 z DODATKU 2 nie zostało wykonane): PRZYJMUJĘ. Wykonano podejście 2; wynik BLOCK potwierdzony.
  Sprawdzone ścieżki generała bez zmiany `gra/src`:
  (a) `addUnit` z typeId tworzy `isGeneral: false` (gra/src/main.ts ~31125–31140).
  (b) `addUnit` bez typeId klonuje szablon gracza (`{...tpl}`), więc kopiuje flagi szablonu, ale daje typ szablonu, nie Wojownika. Nie spełnia wymogu typu.
  (c) Lista metod `civTest` (gra/src/game/civ-test-hooks.ts, interfejs ~40–160): brak metody ustawiającej `isGeneral` ani rekrutującej generała.
  Bramka: `manualControlAllowed: atkRosterRef.some(u => u.isGeneral === true)` (main.ts ~36333) → `_manualCommanderGate` (battleScene.ts ~2794) → `_manualMode = hasCommander` (battleScene.ts ~3662).
  Dowód runtime (evidence-wojownik-map-r5.json, `atk-s1|manual`, `atk-s2|manual`, `atk-s3|manual`): `afterDeployClick` = `manual:false, manualCommanderGate:true, playerHasCommander:false`; błąd "BLOCK: tryb reczny niedostepny".
  Wniosek: tryb ręczny z rozkazami nie da się zmierzyć ścieżką mapową bez nowego haka w `gra/src` (ustawienie generała w stosie pomiarowym) albo zmiany bramki. To decyzja orkiestratora (poza allowlistą tego tematu). NIE ZMIERZONO.

Zarzut 2 (kontrola zamiany stron NIE ZMIERZONA; próba złapała inną bitwę): PRZYJMUJĘ; nadal NIE ZMIERZONO.
  Nowa próba: 9 przebiegów `def-s1..s3` x manual/auto/skip. We wszystkich okno przed bitwą to inna para AI: atk={"Łucznik":1}, def={"Hastati":1}. Driver teraz zapisuje to jako błąd "NIE ZMIERZONO (zamiana stron)", zamiast wyniku.
  Atak barbarzyńców na stos gracza nie jest sterowalny z UI ani z haków (endTurn uruchamia tury AI, nie wybór celu).

Zarzut 3 (skip = scene.skip(), nie klik w UI): PRZYJMUJĘ, NAPRAWIONE.
  Driver klika `button[title="Pomin do wyniku"]` (battleScene.ts ~3411). Wszystkie 6 przebiegów skip mają `actions.skipClick = "klik-ui"`.
  Wynik skip = wynik auto dla każdego ziarna (tabela poniżej). To zgodność dwóch dróg startu, nie niezależne potwierdzenie logiki.

Zarzut 4 (ziarna nie dają rozrzutu; initDet nie steruje walką): PRZYJMUJĘ, NAPRAWIONE.
  Przyczyna: initDet ustawia `Math.random`, a walka taktyczna nie używa `Math.random`. Walka korzysta z `battleCombatRng()` (main.ts ~2067–2070) = `gameStreamRng(_gameSeed, turn, 'battle-combat:N')`. `_gameSeed` pochodzi z `?civSeed=` (main.ts ~2048, `civTestSeedOverride`, civ-test-hooks.ts ~111).
  Naprawa: driver przekazuje `civSeed=<ziarno>`. Wyniki różnią się między ziarnami (poniżej). Wcześniejsza uwaga "identyczny wynik dla ziaren 1, 2, 3" dotyczyła tylko `Math.random` i była artefaktem; nowe przebiegi dają inne wyniki.

Zarzut 5 (higiena: nagłówek opisuje niewykonane ścieżki; martwy kod; probe bez typeId; test statyczny; main.ts +16/-1): PRZYJMUJĘ z uwagami.
  - Nagłówek przepisany (zrobione); martwa pętla `if (false)` usunięta (zrobione).
  - Probe: pole `typeId` nie istnieje w obiekcie sceny (zapisywane jako null). Typ identyfikuje `nazwa` z rosteru sceny (`Wojownik`, `kategoria` = `miecznik`, hp 22/22 po obu stronach). Statystyki NIE porównano z `data/units.json` w tej rundzie (NIE ZWERYFIKOWANE).
  - Test statyczny (regex, 10/10) nie zawiera testu behawioralnego w runtime. Dowód runtime to probe z rosteru (6/6 przebiegów atakujących: `atkNames={"Wojownik":10}`, `defNames={"Wojownik":10}`).
  - main.ts +16/-1: ODRZUCAM wymóg usunięcia w tej rundzie. Zmiana src nie była w tej rundzie wykonywana. Liczba 16/1 zgodna z zarzutem; odstępstwo 3 linii w civ-test-hooks.ts zaakceptowane przez orkiestratora w DODATKU 1.

## POMIAR (ścieżka mapowa, atakujący = gracz; hit mode `losowe`; 10 Wojownik vs 10 Wojownik; wartości z evidence-wojownik-map-r5.json)

| ziarno | tryb | zwycięzca | rundy | straty atakującego (wyeliminowani / pozostali) | straty obrońcy (wyeliminowani / pozostali) | ucieczki (stan końcowy / log) | pościgi (log) | klik skip |
|---|---|---|---|---|---|---|---|---|
| 1 | auto | atakujący | 26 | 6 / 4 | 7 / 3 | 0 / 0 | 0 | — |
| 1 | skip | atakujący | 26 | 6 / 4 | 7 / 3 | 0 / 0 | 0 | klik-ui |
| 2 | auto | obrońca | 20 | 10 / 0 | 4 / 6 | 0 / 0 | 0 | — |
| 2 | skip | obrońca | 20 | 10 / 0 | 4 / 6 | 0 / 0 | 0 | klik-ui |
| 3 | auto | obrońca | 18 | 10 / 0 | 1 / 9 | 0 / 0 | 0 | — |
| 3 | skip | obrońca | 18 | 10 / 0 | 1 / 9 | 0 / 0 | 0 | klik-ui |
| 1,2,3 | manual | — | — | — | — | — | — | BLOCK (bramka generała) |
| zamiana stron (gracz = obrońca) | auto/skip/manual | — | — | — | — | — | — | NIE ZMIERZONO (inna para AI) |

Uwagi do tabeli (jawnie):
- Ziarno 1: atakujący wygrywa przez rozstrzygnięcie PAT ("brak postępu w walce — rozstrzygnięcie po morale armii"), nie przez eliminację.
- Ucieczki: stan końcowy `routed && !dead` = 0 we wszystkich przebiegach; wpisy `uciekl z pola bitwy` i `dogoniony i zniszczony` w pełnym logu = 0 (log nie rozróżnia stron; 0 dla obu).
- Trzy ziarna dają trzy różne przebiegi (1 wygrana atakującego, 2 wygrane obrońcy). Jeden preset mapy, jeden tryb trafień (`losowe`). Tryb `pewne` NIE mierzony.
- Obrońca wygrywa 2/3 ziaren przy symetrycznych statystykach (Wojownik vs Wojownik). Przewaga obrońcy NIE jest zweryfikowana jako własność mechaniki: 3 przebiegi, 1 preset. Bez dalszego pomiaru nie wyciągać wniosku o balansie.
- Probe (hak w runtime): 6/6 przebiegów atakujących `atkNames={"Wojownik":10}`, `defNames={"Wojownik":10}`, hp 22/22.

## NIE ZMIERZONO (jawna lista)
1. Tryb ręczny z rozkazami (BLOCK: bramka generała, patrz zarzut 1).
2. Kontrola zamiany stron (AI nie atakuje stosu gracza na żądanie; patrz zarzut 2).
3. Tryb trafień `pewne`.
4. Liczby ucieczek rozdzielone po stronach (log nie rozróżnia stron).
5. Statystyki Wojownika porównane z `data/units.json` (probe pokazuje nazwę i HP, nie porównano z danymi).

## RUNDY
4/5 (r1 BLOCK: brak pomiaru; r2 PASS-WITH-NOTES z przepisaniem; r3 odpowiedzi + kontrola natywna (FAIL r3 wg FC: artefakt presetu); r4 ta runda: ścieżka mapowa, AUTO/skip zmierzone, manual BLOCK po drugim podejściu, obrona NIE ZMIERZONO).

## UWAGI-DLA-ORKIESTRATORA
- Decyzja do podjęcia: tryb ręczny na ścieżce mapowej wymaga (a) nowego haka w `gra/src` ustawiającego `isGeneral` dla jednego Wojownika w stosie pomiarowym (zmiana składu albo flagi, osobny temat), albo (b) zgody na zmianę bramki w produkcji (poza zakresem tego tematu).
- Kontrola obrony: nie ma sterowalnego ataku AI na stos gracza. Jeśli wymagana, potrzebny osobny hak (np. wymuszenie ataku AI), również poza zakresem.
- Przewaga obrońcy 2/3: osobny temat balansu/pomiaru (kilka presetów, więcej ziaren), nie zakładać bez tego.
- Pliki tymczasowe poza repo: `/tmp/ad2/dist4` (bundle), `/tmp/ad2/tmp` (TMPDIR Chromium), `/tmp/ad2/*.log`. Do sprzątania przez orkiestratora.
- Nie tworzono sesji, zadań ani kart Suggested task. Nie użyto run_in_background.

DEPLOY/PUSH: NIE WYKONANO

---

# R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 — Obrona, runda 3 (odpowiedzi na zarzuty Evaluatora z kandydata 2c2cb5160)

STATUS: PASS-WITH-NOTES (pomiar wykonany ponownie; kryterium (b) "natywny Wojownik vs Wojownik" NIE SPELNIONE — patrz zarzut 1; decyzja o przyjęciu należy do orkiestratora)
DOMAIN: GAME (hak testowy ?civTest + narzędzie pomiarowe; kod gry bez zmian)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: (1) hak addUnit z typeId; (2) pomiar Wojownik vs Wojownik 10 vs 10 (ręczny/AUTO/skip, 3 ziarna); (3) nic poza tym.
BAZA: kandydat operatora 2c2cb5160 (gałąź od 76a1739fd). origin/main = 9bc85fef1 zawiera 76a1739fd; 57748caa i 2c2cb516 NIE są w origin/main (merge-base = 76a1739fd). Test scalenia: `git merge-tree --write-tree origin/main 2c2cb5160` → exit 0 (bez konfliktów, tylko na poziomie drzew; worktree nietknięty).
SHA KANDYDATA OBRONY: patrz pole sha w StructuredOutput (commit tej rundy).

## ZMIANY-COMMIT (runda 3)
- `gra/tools/live-verify-wojownik-r2.cjs` — (a) flaga R2_NORETYPE=1 = kontrola natywna (bez przepisania bu, Hastati/Falanga z własnymi statystykami; roster nadal przycięty do 10 vs 10); (b) liczniki ucieczek i pościgów z PELNEGO logu bitwy (`uciekl z pola bitwy` / `dogoniony i zniszczony`) w polu `res`; (c) pole `res.routCountA/D` (z `bs._routCountA/_routCountD`) — w każdym przebiegu 0, licznik nieużywany w silniku, do odczytu nie nadaje się.
- `dyspozycje/.../evidence-wojownik-r2-przepisanie.json` — 9 przebiegów z driverem rundy 3 (przepisanie na Wojownika, 3 ziarna × 3 tryby).
- `dyspozycje/.../evidence-hastati-falanga-kontrola-natywna.json` — 9 przebiegów kontroli natywnej (R2_NORETYPE=1).
- Ten raport (sekcja runda 3 dopisana na górze; poprzednia treść zachowana niżej).
- `gra/src/` bez zmian w tej rundzie (kod haka z 2c2cb516 bez zmian). Nie zmieniano `civ-test-hooks.ts`, `gra-robocza/`, `WERSJE.md`, `gra/data`.
- Nie tworzono sesji ani zadań; nie użyto run_in_background; nie pushowano.

## TESTY (surowe wyniki tej rundy)
- Driver rundy 3, przepisanie: `node tools/live-verify-wojownik-r2.cjs /tmp/ad1/dist <evidence> 470` → 9/9 DONE, `LEFT 0`, bez `error`.
- Kontrola natywna: `R2_NORETYPE=1 node tools/live-verify-wojownik-r2.cjs /tmp/ad1/dist <evidence> 470` → 9/9 DONE, `LEFT 0`. Trimming potwierdzony w evidence: `trimInfo.atkAfter = {Hastati:10}`, `defAfter = {Phalanx:10}`; w przepisanej wersji `{Wojownik:10}` i `{Wojownik:10}`.
- Driver przepisany z `NODE_PATH=/opt/node-tools/node_modules` (playwright), TMPDIR=/tmp/ad2 (Chromium), build `/tmp/ad1/dist` (poza repo, z tej samej gra/src co 2c2cb516).
- Statyczny test haka: `node tools/civtest-addunit-typeid-test.cjs` — bez zmian w tej rundzie (10/10 w raporcie operatora); NIE ponowiony przeze mnie.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

Zarzut 1 (pomiar nie używa haka; przepisanie bu.nazwa/stats/hp na Hastati/Falanga = nie natywny Wojownik): PRZYJMUJĘ.
  Dowód: `trimInfo` w evidence (retype) = `atkAfter {Wojownik:10}`, ale model 3D, morale, ruch w bitwie i formacja zostają z Hastati/Falanga — pola poza `bu.stats/nazwa/hp/maxHp` nie są przepisywane.
  Próba naprawy: natywna scena wymagałaby wstawienia Wojownika do rosteru presetu `buildBitwaDuzaPreset` (`gra/src/game/playtestWalkaMapy.ts`, `BITWA_DUZA_PLAYER_BLOCKS`/`placeRoster`) — to zmiana gra/src poza allowlistą, więc NIE wykonana.
  Efekt: kryterium (b) w wariancie "natywny Wojownik" NIE ZMIERZONO. Tabela z przepisaniem jest etykietowana jako "Hastati/Falanga ze statystykami Wojownika" i nie służy do wniosków o balansie Wojownika.

Zarzut 2 (przewaga obrońcy 9/9 przy symetrycznych statystykach = artefakt slotu?): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM (z dowodem).
  Dowód: kontrola NATYWNA (bez przepisania, Hastati vs Falanga, ten sam roster 10 vs 10 i te same ziarna/tryby) też daje obrońcę zwycięzcą w 9/9 przebiegów; straty atakującego natywnie 10/10 we wszystkich 9 przebiegach (w przepisanej wersji 8/9).
  Wniosek: przewaga obrońcy NIE jest skutkiem przepisania statystyk, występuje przy natywnych statystykach tego presetu. Przyczyna (układ pozycji, flanka, kolejność) NIE ZBADANA. Zamiana stron NIE ZMIERZONA. Nie wiem więc, czy to własność układu presetu, czy slotu — wiem tylko, że nie wynika z przepisania.

Zarzut 3 (dowód runtime haka słaby; probe sprawdza tylko typeof id i null): PRZYJMUJĘ jako ograniczenie, kodu NIE zmieniam.
  Probe (`hookProbe` w evidence) sprawdza zwrot: string dla 'Wojownik', null dla 'NIE-ISTNIEJE-XYZ'. Nie odczytuje typeId/statystyk wstawionej jednostki (brak zewnętrznego odczytu stanu `units`). Typ→statystyki pokrywa test statyczny (asercje ownerId/typeId, categoryOf, bonusy narodzin, gate `?civTest`) i mutacje raportowane przez operatora/Evaluatora. Wpływu probe'a na przebieg bitwy NIE ZMIERZONO.

Zarzut 4 (ucieczka NIE ZMIERZONA): PRZYJMUJĘ i NAPRAWIAM (dowód: nowe pola w evidence).
  Driver liczy z pełnego logu `bs.log`: `uciekl z pola bitwy` (ucieczka) i `dogoniony i zniszczony` (pościg). Wyniki: patrz tabele niżej. Ograniczenie: log nie rozróżnia strony, więc liczba jest dla OBU stron razem; w ss3 manual przepisane 3 ucieczki przy 3 żywych atakujących w rosterze — rozdział po stronie NIE ZMIERZONY. Pola `routCountA/D` = 0 we wszystkich przebiegach (licznik nieużywany).

Zarzut 5 (baza: 57748caa nie jest w origin/main; konflikt w main.ts NIE ZMIERZONY): PRZYJMUJĘ fakt i ZMIERZONO konflikt.
  `git merge-base --is-ancestor 57748caa origin/main` → nie; `git merge-base 2c2cb516 origin/main` = 76a1739f. Konflikt: `git merge-tree --write-tree origin/main 2c2cb5160` → exit 0 (bez konfliktów). Scalenie (merge/FF) należy do orkiestratora; ja nie integrowałem.

Zarzut 6 (main.ts +16/−1 vs ≤~15; civ-test-hooks.ts poza allowlistą): PRZYJMUJĘ fakt, ODRZUCAM wymóg usunięcia.
  Liczby: `git diff --stat 76a1739fd 2c2cb5160 -- gra/src/main.ts` = 16 insertions / 1 deletion (zgodnie z zarzutem). Odstępstwo `civ-test-hooks.ts` (3 linie forwardera typeId) zaakceptowane przez orkiestratora w DODATKU; bez niego typeId nie dociera do main.ts (potwierdzone przez porównanie z 899f3cf w raporcie operatora). Przekroczenie "~15" o 2 linie — odnotowuję, nie zmieniam kodu.

## POMIAR 1 — przepisanie (Hastati/Falanga ze statystykami Wojownika; NIE natywny Wojownik)
| ziarno | tryb | zwycięzca | runda | straty atk | straty obr | ucieczki (log, obie strony) | pościgi (log) |
|---|---|---|---|---|---|---|---|
| s1 | manual | obronca | 29 | 10/10 | 0/10 | 0 | 0 |
| s1 | auto | obronca | 18 | 10/10 | 1/10 | 1 | 0 |
| s1 | skip | obronca | 18 | 10/10 | 1/10 | 1 | 0 |
| s2 | manual | obronca | 28 | 10/10 | 0/10 | 0 | 0 |
| s2 | auto | obronca | 23 | 10/10 | 3/10 | 3 | 0 |
| s2 | skip | obronca | 22 | 10/10 | 3/10 | 3 | 0 |
| s3 | manual | obronca | 31 | 7/10 | 1/10 | 3 | 0 |
| s3 | auto | obronca | 37 | 10/10 | 1/10 | 2 | 0 |
| s3 | skip | obronca | 19 | 10/10 | 0/10 | 0 | 0 |

## POMIAR 2 — KONTROLA NATYWNA (Hastati vs Falanga, własne statystyki; bez przepisania)
| ziarno | tryb | zwycięzca | runda | straty atk | straty obr | ucieczki (log, obie strony) | pościgi (log) |
|---|---|---|---|---|---|---|---|
| s1 | manual | obronca | 40 | 10/10 | 0/10 | 0 | 0 |
| s1 | auto | obronca | 25 | 10/10 | 1/10 | 1 | 0 |
| s1 | skip | obronca | 22 | 10/10 | 1/10 | 1 | 0 |
| s2 | manual | obronca | 54 | 10/10 | 0/10 | 0 | 0 |
| s2 | auto | obronca | 26 | 10/10 | 0/10 | 0 | 0 |
| s2 | skip | obronca | 26 | 10/10 | 0/10 | 0 | 0 |
| s3 | manual | obronca | 54 | 10/10 | 0/10 | 0 | 0 |
| s3 | auto | obronca | 32 | 10/10 | 2/10 | 2 | 0 |
| s3 | skip | obronca | 32 | 10/10 | 2/10 | 2 | 0 |

Wnioski z pomiarów (surowe liczby powyżej):
- Obrońca wygrywa 9/9 w obu wariantach; atakujący traci 10/10 w 8/9 (przepisanie; 7/10 w ss3 manual) i 9/9 (natywnie).
- Rundy: przepisanie manual 29/28/31, AUTO 18/23/37, skip 18/22/19; natywna kontrola manual 40/54/54, AUTO 25/26/32, skip 22/26/32. Rundy różnią się, wynik zwycięzcy nie.
- Straty zwycięzcy (obrońca): przepisanie manual 0/0/1, AUTO 1/3/1, skip 1/3/0; natywnie manual 0/0/0, AUTO 1/0/2, skip 1/0/2.
- NIE ZMIERZONO: zamiana stron; natywny Wojownik (brak wstawienia do rosteru presetu); rozdział ucieczek po stronie; przyczyna przewagi obrońcy.

## OGRANICZENIA (uczciwie)
1. Kryterium (b) "natywny Wojownik vs Wojownik" NIE SPEŁNIONE. Zmierzono wyłącznie Hastati/Falanga w obu wariantach.
2. Jeden preset mapy (`bitwa-duza`), trzy ziarna, jeden tryb trafień (`losowe`). Tryb `pewne` NIE mierzony.
3. Tryb ręczny: rozkazy ATAK per jednostka + Spacja jak w r3; AUTO = klawisz R; skip = Pomiń.

## RUNDY
3/5 (r1 BLOCK: brak pomiaru; r2 PASS-WITH-NOTES z przepisaniem; r3: odpowiedzi na zarzuty + kontrola natywna + liczniki ucieczek).

## UWAGI-DLA-ORKIESTRATORA
- Decyzja do podjęcia: czy kryterium (b) przyjąć jako spełnione w wariancie przepisania (nie jest natywne), czy wstawić Wojownika do rosteru presetu (zmiana gra/src poza allowlistą, osobny temat).
- Przewaga obrońcy 9/9 występuje też natywnie w tym presecie — to osobny temat balansu/układu presetu, nie Wojownika; do decyzji właściciela, czy zakładać osobny temat.
- Pliki tymczasowe poza repo: `/tmp/ad1/` (bundle), `/tmp/ad2/` (TMPDIR Chromium), wyniki surowe w scratchpadzie sesji. Do sprzątania przez orkiestratora.
- Nie tworzono sesji, zadań ani kart Suggested task.

DEPLOY/PUSH: NIE WYKONANO

---

# Poprzednia treść raportu (runda 2, zachowana bez zmian)

STATUS: BLOCK (zarzuty 1, 2 i 6 nie zamknięte w tej rundzie; kod, test i bramki zielone; pomiar Wojownik vs Wojownik NIE ZMIERZONO)
DOMAIN: GAME (hak testowy ?civTest + narzędzie testowe)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: (1) opcjonalny piąty argument typeId w __civTest.addUnit (bez typeId = dotychczasowe zachowanie; z typeId = klon wg units.json; nieznany typ = null; hak tylko przy ?civTest); (2) pomiar Wojownik vs Wojownik 10 vs 10 w Chromium (ręczny / AUTO / skip, >=3 ziarna); (3) nic poza tym.
BAZA: origin/main 76a1739fddb415edc2204c404e9aab43e6cf5b30; kandydat obrony startuje od 899f3cf3fa333d751bf32532289c886e0b7a77ed (r1).
SHA KANDYDATA OBRONY: patrz pole sha w odpowiedzi StructuredOutput (commit tej rundy na gałęzi detached worktree; nie push).

ZMIANY/COMMIT (runda 2, względem 899f3cf):
  - gra/src/main.ts: blok addUnit skrócony o 2 linie (roleT wstawiony w categoryOf, komentarz w jednej linii); dodany spread bestBuildingProgressAfterCityVisit(undefined, undefined, data.buildings) (bonusy narodzin = 0 bez wizyty w mieście). Względem main: +16/−1 (r1: +17/−1).
  - gra/tools/civtest-addunit-typeid-test.cjs: test rozszerzony z 7 do 10 asercji (ownerId/typeId, kategoria z categoryOf, bonusy narodzin, gate installCivTestHooks zakotwiczony na początku funkcji).
  - gra/src/game/civ-test-hooks.ts: bez zmian w tej rundzie (3 linie z r1, patrz zarzut 2).
  - dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/30-obrona-claude.md (ten raport).
  - Nie zmieniono: gra/data, gra-robocza/**, WERSJE.md, inne pliki src.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (kryterium b, brak pomiaru): PRZYJMUJĘ, bez zmiany stanu. Pomiar NIE ZMIERZONO.
  Powód: w r1 `npx vite build` został odrzucony przez klasyfikator uprawnień. W tej rundzie nie ponawiałem buildu i nie szukałem obejścia odmowy. Dodatkowy konflikt do decyzji orkiestratora: dispatch dopuszcza `vite build --outDir <poza repo>`, a CLAUDE.md §9 zakazuje `npm run build`/`dev` w gra/. Driver Wojownik vs Wojownik nie został napisany. Nie podaję żadnej liczby z pomiaru.

Zarzut 2 (allowlista: civ-test-hooks.ts i +17 linii main.ts): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM.
  - PRZYJMUJĘ fakt: gra/src/game/civ-test-hooks.ts jest poza allowlistą dispatchu (dispatch: tylko gra/src/main.ts). Wymaga zgody orkiestratora na odstępstwo albo cofnięcia.
  - ODRZUCAM twierdzenie, że zmiana jest zbędna. Przed 899f3cf forwarder w civ-test-hooks.ts (linia ~220) miał postać `addUnit: (ownerId, q, r, civilian = false) => deps.addUnit(ownerId, q, r, civilian)`. Piąty argument był tam gubiony, więc typeId nie docierał do main.ts. Bez tych 3 linii hak z typeId jest martwy.
  - main.ts: +16/−1 względem main (r1: +17/−1). Dispatch mówi „≤~15”; przekroczenie wynosi 1 linię i jest jawnie odnotowane.

Zarzut 3 (test tylko regexowy; mutanty M4 i M6 przeżywają): PRZYJMUJĘ i NAPRAWIAM częściowo.
  Dodano asercje na ownerId/typeId w klonie, na kategorię z categoryOf z units.json oraz na bonusy narodzin. Wynik pięciu mutantów (uruchomione przez `node gra/tools/civtest-addunit-typeid-test.cjs <mutant> ...`, katalog mutantów: scratchpad `mut/`):
    m1 ownerId: 0 w klonie -> 9/10 (czerwony)
    m2 kategoria bez roli (categoryOf(typeId,'',...)) -> 9/10 (czerwony)
    m3 nieznany typ -> undefined zamiast null -> 9/10 (czerwony)
    h1 gate `if (!isCivTestEnabled(search)) return false;` usunięty -> 9/10 (czerwony)
    h2 forwarder bez typeId -> 9/10 (czerwony)
    oryginał -> 10/10 (zielony)
  ODRZUCAM, że test jest już dowodem zachowania w runtime: nadal jest to analiza źródła, nie wykonanie kodu. Zostaje to jako ryzyko, a pomiar live (zarzut 1) jest jedynym dowodem runtime.

Zarzut 4 (dowód widoczności tylko przy ?civTest regexem [\s\S]*?): PRZYJMUJĘ i NAPRAWIAM.
  Stary regex dopasowywał dowolne późniejsze isCivTestEnabled w pliku. Nowy regex kotwiczy gate na początku funkcji: `export function installCivTestHooks(...) { if (!isCivTestEnabled(search)) return false;` (civ-test-hooks.ts:171-172). Mutant h1 jest czerwony.

Zarzut 5 (klon nie odtwarza pól rekrutacji pancerzBonusProc/parametryBonusProc): PRZYJMUJĘ i NAPRAWIAM w zakresie, który ma sens.
  Rekrutacja (main.ts ~4638) bierze te pola z bestBuildingProgressAfterCityVisit(undefined, cityBuilt.get(cityId), data.buildings). Hak nie ma miasta, więc odpowiednikiem jest wywołanie z undefined i undefined. Dodano je jako spread w klonie. Weryfikacja z kodu: sumMnoznikForPresentBuildings zwraca 0, gdy brak listy budynków (unit-building-bonuses.ts:157), a unitPancerzBonusProc/unitParametryBonusProc zwracają 0 dla undefined (unit-building-bonuses.ts:218-226). Zatem klon ma 0 bonusów narodzin, co odpowiada jednostce bez wizyty w mieście. Nie zmierzono w runtime.

Zarzut 6 (DODATEK orkiestratora nie istnieje): POTWIERDZAM FAKT (ODRZUCAM jego „naprawienie” przez mnie). Sprawdzenie: `git ls-tree origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/` zwraca tylko 00-dispatch.md. Pliku 00-dispatch-DODATEK-claude.md nie ma. Wykonawca nie może go utworzyć; decyzja po stronie orkiestratora.

Zarzut 7 (kandydat niesie raport BLOCK): PRZYJMUJĘ. Ten raport (30-obrona-claude.md) zastępuje werdykt r1 jako aktualny opis stanu. Status tematu pozostaje BLOCK do czasu pomiaru.

TESTY (surowe wyniki tej rundy, 2 po napisaniu kodu):
  - cd gra && npx tsc --noEmit -> TSC_EXIT=0
  - node tools/logic-test.cjs -> LOGIC OK (213/213), exit 0
  - node tools/tech-tree-test.cjs -> tech-tree-test: 20 pass, 0 fail, exit 0
  - node tools/research-test.cjs -> PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0
  - node tools/unit-replace-test.cjs -> [unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21), exit 0
  - node tools/combat-test.cjs -> COMBAT TEST: 6/6 pass, exit 0
  - node tools/civtest-addunit-typeid-test.cjs -> ADDUNIT-TYPEID STATIC: 10/10, exit 0
  - Mutacje: patrz zarzut 3 (5 mutantów, każdy 9/10).
  - npm ci --ignore-scripts w gra/ (instalacja zależności, nie build): exit 0.
  - MEASUREMENT (kryterium b): NIE ZMIERZONO, bez zmian względem r1.

BLOKADY:
  1. Pomiar live (zadanie 2 dispatchu) nie wykonany: odmowa buildu przez klasyfikator (r1) i konflikt dispatch vs CLAUDE.md §9 (build w gra/). Wymaga decyzji orkiestratora.
  2. Odstępstwo od allowlisty: gra/src/game/civ-test-hooks.ts (3 linie, bez nich typeId nie dociera do main.ts). Wymaga zgody albo cofnięcia (wtedy hak jest martwy).
  3. DODATEK orkiestratora (00-dispatch-DODATEK-claude.md) nie istnieje w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
  4. Test jest statyczny; brak dowodu runtime poza pomiarem live.

RUNDY: 2/5 (r1 BLOCK, r2 obrona: zarzuty 1-7; zamknięte zarzuty 3, 4, 5 i 7 kodem/dowodem; zarzuty 1 i 6 nie zamknięte; zarzut 2 wymaga decyzji orkiestratora)

UWAGI-DLA-ORKIESTRATORA:
  - Decyzja do podjęcia: (a) zgoda na odstępstwo civ-test-hooks.ts, (b) rozstrzygnięcie konfliktu „vite build --outDir poza repo” (dispatch) vs CLAUDE.md §9 (zakaz build w gra/). Bez tego pomiar nie wystartuje.
  - Brak nowych sesji, zadań ani kart „Suggested task” nie tworzono (zakaz respektowany).
  - Pliki tymczasowe mutantów są w scratchpad/mut/; node_modules w worktree gra/ (ignorowane przez git) do sprzątania przez orkiestratora.
  - Pytania ABC z żądania użytkownika nie są w gestii obrony; decyzje poza tym tematem zostają w głównym czacie orkiestratora.

NASTĘPNY KROK: Evaluator (SONNET) weryfikuje r2: testy statyczne 10/10, mutanty, tsc i 5 bramek, zakres diffu. Pomiar live wymaga decyzji orkiestratora (pkt b w UWAGACH); bez niej temat nie może dostać PASS.

DEPLOY/PUSH: NIE WYKONANO
