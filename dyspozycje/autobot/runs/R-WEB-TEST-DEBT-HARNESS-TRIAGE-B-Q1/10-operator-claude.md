STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-HARNESS-TRIAGE-B-Q1 (druga połowa posortowanej listy 18 czerwonych harnessów ze skanu HARNREM; pierwsza połowa = TRIAGE-A)
GOAL: dla każdego testu z części B ustalić z dowodem klasę (a) przestarzały test / (b) błąd kodu w src / (c) fixture-loader / (d) środowisko / (e) decyzja; naprawić (a)/(c) bez osłabiania intencji; nie dotykać gra/src ani gra/data.
BAZA: d59bd7a5a5e988f3c315d5a4f865dccb9d80a4c4 (origin/main), HEAD = d59bd7a (ancestor OK).

ZMIANY/COMMIT: tylko gra/tools (5 plików) + ten raport. Commit: patrz sekcja SHA w odpowiedzi strukturalnej.
- gra/tools/march-resume-next-turn-test.cjs — (a) G2
- gra/tools/newgame-menu-reorder-layout-test.cjs — (a) liczba wierszy 13→14
- gra/tools/panel-kolejka-pasek-postepu-test.cjs — (c) dekodowanie \uXXXX w artefakcie vite
- gra/tools/praca-panel-budowy-warstwa-real-render-test.cjs — (a) kotwice mutacji M3 i M4
- gra/tools/structure-defense-bonus-test.cjs — (a) oczekiwana celność = max(wręczny, dystansowy)
Brak zmian w gra/src, gra/data, WERSJE.md. Brak npm run build/dev. Vite zbudowany tylko poza repo (/tmp/triageB/dist-kolejka).

ŚRODOWISKO: `which xvfb-run` = /usr/bin/xvfb-run; wszystkie harnessy uruchomione jako `xvfb-run -a node tools/<t>.cjs` w pierwszym planie, sekwencyjnie (max 1 Chromium naraz). `gra/node_modules` zainstalowane `npm ci` (nieśledzone, nie commitowane).

TABELA (test | pierwszy czerwony komunikat | klasa | dowód | akcja | wynik przed → po):

1. march-resume-next-turn-test | "G2 applyMarchSegmentInstant kasuje plan tylko przy przycieciu stosu (got 3)" | (a) PRZESTARZAŁY | funkcja applyMarchSegmentInstant w src/main.ts ma 3 zamierzone kasowania planu: przycięcie stosu (blame 421010fa1), zasadzka fire-now (blame 21af749bb), odcięcie instantAmbushHex (blame 23906617c, R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1) | G2 oczekuje 3; dodane G2b (gałąź fire-now) i G2c (instantAmbushHex) | exit 1 (44 pass/1 fail) → exit 0 (47/0). Mutacja: dodany dodatkowy plannedMarches.delete w src → "got 4", FAIL, exit 1; src przywrócony z kopii, git diff src pusty.

2. newgame-menu-reorder-layout-test | "1600x1000-z100: advanced window has 13 rows" (14 !== 13) | (a) PRZESTARZAŁY | commit ae600d5ed (R-WEB-BATTLE-HIT-MODE-SETTING-Q1) dodał pozycję „Trafienia” do okna Zaawansowane i sam opisuje „layout test: 14 pozycji okna zaawansowanego”; test nie został zaktualizowany | asercja 13→14 (także komunikat) | exit 1 → exit 0 (6 konfiguracji viewport/zoom). Mutacja: NIE WYKONANO (klasa liczbowa, asercja jednoznaczna; zabrakło czasu). Zrzuty zapisane w evidence/ zostały przywrócone przez `git checkout` (nie commitowane).

3. panel-kolejka-pasek-postepu-test | "(H2) artefakt vite build niesie nową stopkę o znaczeniu paska" i "(H3) ... zastrzeżenie N5" | (c) FIXTURE/CHECK | vite/esbuild zapisuje polskie litery w bundlu jako \uXXXX: w /tmp/triageB/dist-kolejka/index.html `UKOŃCZENIE` zamiast `UKOŃCZENIE`; po zdekodowaniu oba literały są obecne (sprawdzone python: True po dekodowaniu, False przed). Źródło: src/ui/empireDetailPanel.ts:2405 i :2408 — tekst istnieje | czytnik artefaktu dekoduje \uXXXX przed porównaniem (test, nie src) | exit 1 (80/2) → exit 0 (82/0). Mutacja (--dist na kopię artefaktu z zamienionym tekstem stopki): "(H2)" FAIL, exit 1.

4. praca-panel-budowy-warstwa-real-render-test | "(F/M3) ... asercja (A) PADA" (warstwaA_markup 0) oraz "(F/M4) mutacja przygotowana — kotwica M4 nie trafila" | (a) PRZESTARZAŁE KOTWICE MUTACJI | M3: kotwica pierwszego wystąpienia trafia w gałąź „automatyzacja wyłączona” src/ui/buildModeHud.ts:676 (dodana w dbfc45311, R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1), która w teście nie jest renderowana; M4: kotwica `onChange(0, …)` nie istnieje, bo ea03c3cb7 (hotseat) zmienił na `onChange(ownerId, …)` (src/ui/empireDetailPanel.ts:1642) | M3 kotwica = wystąpienie w gałęzi WŁĄCZONEJ (`civ-build-auto` + lbl) z komentarzem; M4 kotwica = `onChange(ownerId, …)` | exit 1 (FAIL M3/M4) → exit 0 (28/0). Oba (F/M3) i (F/M4) są mutacjami testującymi asercje — uznane za wykonane (PASS = asercja pada pod mutacją).

5. recruit-list-order-by-era-test | "B1 ... E1/E2/E3: pierwszy wiersz panelu Armia niewidoczny bez przewijania" | NIE ROZSTRZYGNIĘTO (hipoteza: (a)) | hipoteza: commit 4c20910c6 (R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1) celowo usunął wewnętrzny suwak z listy rekrutacji miast w panelu Armia; sonda testu (linie ~175–181) wymaga `.list-scroll` w hoście i scrollTop 0. NIE ZWERYFIKOWANO, czy `.list-scroll` nadal istnieje w DOM mountCityRecruitmentCardsForArmy (src/ui/cityPanel.ts:8666) | NIE ZMIENIANO; kandydat do osobnego tematu (sonda na nowy kontener) | exit 1 → exit 1.

6. recruitment-panel-compact-row-test | "(340) lista ma wszystkie 12 oczekiwanych wierszy — 9"; "K2 ... first13Visible 9"; "K5 ... shortRows 8, bad []" | NIE ROZSTRZYGNIĘTO | brak dowodu przyczyny (brak wierszy vs układ); K5 ma pustą listę `bad`, więc to asercja liczności; nie zbadano źródła liczby wierszy | NIE ZMIENIANO | exit 1 → exit 1.

7. structure-defense-bonus-test | "hitChanceTw(atak, Obrona*3) == hitPct z resolveCombat(structureDefBonusPct=200) (36% == 37%)" | (a) PRZESTARZAŁY | src/game/combat.ts:1038–1040 i :1059 liczą strzał z `rangedShotAccuracy(melee, missile)` = max(melee, missile) (commit 17be3f180, R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1). Dane testu: melee 2, missile 3 → oczekiwane 36 (hitChanceTw(2,6)), faktyczne 37 = hitChanceTw(3,6) | oczekiwanie używa Math.max(atak.melee, atak.missile) | exit 1 (7/1) → exit 0 (8/0). Mutacja: rangedShotAccuracy zredukowane do melee → "(37% == 36%)" FAIL, exit 1; src przywrócony z kopii (git diff src pusty, SRC_CLEAN).

8. szczescie-przebudowa-skali-test | "katalog budynkow ma 41 pozycji (19 + 22) -- got 44"; "2b: epoka 1 — komplet to 11 — got 12"; "epoka 2 — 23 — got 24"; "epoka 3 — 31 — got 32" | NIE ROZSTRZYGNIĘTO (częściowo (a)) | licznik katalogu: dodane wpisy `mury_kamienne` (epoka 1, upgradeFrom palisada; commit 0bf194d76) i `emporion` (epoka 2) w gra/data/buildings.json; w a53bda0af (data powstania testu) katalog miał już 42, nie 41 — test był stale przed tym. Komplety 11/23/31 są celami właściciela z BALANS-SZCZESCIE-SKALOWANIE-EPOK.md, nie wynikiem kodu — czy nowe budynki wchodzą do „kompletu” to decyzja właściciela | NIE ZMIENIANO (zmiana celu = decyzja) | exit 1 → exit 1.

9. tech-discovery-badge-diorama-test | "(B2) [Hutnictwo żelaza] kind:preview — przecięcie z elipsą gruntu … worst 7px (≤4px)"; "(c1) domyślna karta encji (budynek) ma NADAL diaromę 190px … 209" | NIE ROZSTRZYGNIĘTO (layout, potencjalnie (b)) | CSS .entity-card-diorama deklaruje height:190px (src/ui/entityCards/renderer.ts:1152), a zmierzono 209px — przyczyny nie zbadano; B2: odznaka „Podgląd technologii” ma szerokość 120px i przecina elipsę o 7px — prawdopodobnie efekt poszerzenia chipów w 57d1c7d3b / 2ca45a090 (hipoteza, niezweryfikowana) | NIE ZMIENIANO | exit 1 → exit 1.

PODSUMOWANIE KLAS (część B, 9 testów): (a) naprawione 4 (march, newgame, praca-panel kotwice, structure-defense); (c) naprawione 1 (panel-kolejka); (a) hipoteza bez naprawy 1 (recruit-list); NIE ROZSTRZYGNIĘTO 3 (recruitment-panel-compact-row, tech-discovery-badge-diorama, szczescie-przebudowa-skali — ostatni częściowo (a) + decyzja właściciela); (b) brak (nie stwierdzono błędu kodu z dowodem). Środowisko (d): nie stwierdzono — wszystkie testy części B uruchomione pod xvfb.

TESTY: wyniki końcowe (surowe exit kody, uruchomienie 2026-11-17 w worktree):
march-resume-next-turn-test exit=0 (47 pass/0 fail); newgame-menu-reorder-layout-test exit=0; panel-kolejka-pasek-postepu-test exit=0 (82/0); praca-panel-budowy-warstwa-real-render-test exit=0 (28/0); structure-defense-bonus-test exit=0 (8/0); recruit-list-order-by-era-test exit=1; recruitment-panel-compact-row-test exit=1; szczescie-przebudowa-skali-test exit=1; tech-discovery-badge-diorama-test exit=1 (61 pass/2 fail).
NIE ZMIERZONO: `tsc --noEmit` i 5 bramek referencyjnych — nie uruchomione, bo zmiany dotyczą wyłącznie gra/tools (żadnego pliku gra/src ani gra/data); `git diff origin/main -- gra/src gra/data` jest pusty (sprawdzone: git diff --stat -- gra/src gra/data = brak wyjścia).
git diff --check: OK.

BLOKADY: brak blokad dla naprawionych testów. Trzy testy (recruitment-panel-compact-row, tech-discovery-badge-diorama, szczescie-przebudowa-skali) i recruit-list-order-by-era pozostają czerwone — wymagają osobnego tematu lub decyzji właściciela (szczegóły w tabeli).

RUNDY: 1/5
DECYZJE DLA ORKIESTRATORA (ABC): (1) szczescie-przebudowa-skali: czy budynki mury_kamienne i emporion wchodzą do „kompletu” BUD(epoka) — cel 11/23/31 do aktualizacji; (2) tech-discovery-badge-diorama: czy 190px diorama i 120px odznaka są celem (test) czy regresją layoutu (src).

UWAGI-DLA-ORKIESTRATORA:
- /tmp/triageB/dist-kolejka (~100 MB, wynik vite build poza repo) i logi w /tmp/triageB pozostają do sprzątania przez orkiestratora (agent nie usuwa plików).
- gra/node_modules (npm ci) w worktree — do sprzątania worktree po integracji.
- Recruit-list-order-by-era: sprawdzić DOM po commit 4c20910c6 zanim zmieni się sondę.

NASTĘPNY KROK: orkiestrator integruje commit (po Evaluator/FC); pozostałe 4 czerwone testy → osobne tematy wg tabeli.
DEPLOY/PUSH: NIE WYKONANO
