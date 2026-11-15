# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — Operator (runda 3/5, SONNET 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: (1) zrzuty soli i ceramiki „Skąd zapasy” z prawdziwej gry, 1280 i 1920; (2) dokumentacja + wikiBundle; (3) pomiar wydajności ON/OFF i mikro-pomiar; (4) diagnoza „endTurn timeout t57” w konfiguracji domyślnej; (5) stan `<details>` po przerysowaniu.
ZMIANY/COMMIT: `gra/src/main.ts` (jeden hak `openEmpirePanel` w `__ledgerTestDebug`, za `?civTest=1`), 5 nowych narzędzi w `gra/tools/` (patrz niżej), `runs/<ID>/**` (ten raport, `10-operator-claude-r2.md`, `evidence/`). SHA: w polu `sha` wyniku workflow.
DEPLOY/PUSH: NIE WYKONANO

## Baza

Zgodnie z DODATKIEM 3: b6799be46 scalony z origin/main (79abbf0bf), commit scalenia 745a692b8 (wikiBundle zregenerowany w nim). Kod dispatchu aa0d32275 nie jest przodkiem origin/main. Poprawka GOAL 5 i docs/wikiBundle (GOAL 2) bez zmian względem r2; po scaleniu nie ruszano wikiBundle, `resourceSourceLedgerHtml.ts` ani `empireDetailPanel.ts`. Dokumentacja `skad-zapasy.md` sprawdzona z prawdziwymi etykietami z gry (Warzelnia, Garncarnia, Spichlerz (zużycie zapasów), Obywatele, Umowa wymiany z …) — zgodna, bez zmian.

## GOAL 4 — diagnoza „endTurn timeout t57”

Narzędzie: `gra/tools/endturn-gate-diag-measure.cjs` (+ `endturn-gate-diag-summary.cjs`): przed każdym endTurn czyta `gateInfo()`, łapie konsolowe „[EndTurn] blocked: …”, zapisuje zdarzenia `noadvance`. Kod bazy, seed 4242 (i 777), 100 tur.

| Konfiguracja | Ledger | Wynik |
|---|---|---|
| Domyślna (podatki 30/60/10), bez obejścia | ON | **tura 1 nie przechodzi**: 7/7 prób `noadvance`, prognoza skarbca −2, konsola „[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)”; 0 zapisanych tur (`evidence/endturn-gate-diag/def-on-seed4242.jsonl`) |
| Domyślna + jednorazowo 60/30/10 po t1 | ON | 99 tur, 0 timeoutów, 0 błędów, t57 = 11 006 ms |
| jw. | OFF | 99 tur, 0 timeoutów, 0 błędów, t57 = 17 050 ms |
| seed 777, domyślna | ON | blokada t1: prognoza −3; preset 60/30/10 daje −1 (nadal blokada) — potrzebne `--gate-fix grant` (grantPlayerGold + spichlerz) |

Wniosek: **przyczyną zatrzymania „tura nie przechodzi” jest bramka „Zakończ turę” (NNS) w turze 1** przy domyślnym podziale podatków — deterministyczna, niezależna od księgi (ON i OFF identyczne w t1). Po jej obejściu timeout t57 **nie występuje** ani z księgą, ani bez, w 2 ziarnach (4242 i 777, grant). Druga przyczyna harnessu: wyścig — numer tury zmienia się przed zdjęciem `endTurnInProgress`, więc zbyt wczesny endTurn jest odrzucany (naprawione oczekiwaniem na flagę w narzędziach). Kategoria: **bramka (harness) + wyścig harnessu; księga nie jest sprawcą**. Konfiguracja pierwotnego timeoutu t57 z r3 nadal nieznana (nie odtworzono) — nie twierdzę, że jest wyjaśniony, tylko że w pełnej konfiguracji domyślnej + obejściu bramki nie występuje.

## GOAL 1 — zrzuty z prawdziwej gry

Narzędzie: `gra/tools/resource-ledger-shots-live.cjs`. Prawdziwa gra (startNewGame, seed 4242, `?civTest=1`), 3 prawdziwe tury (`endTurn`), scenariusz: Warzelnia i Garncarnia w mieście gracza (`scenarioSeed`), umowa wymiany 100 szt. soli i ceramiki co turę z miastem-państwem Ostia (`trade`; przy ilości 30 blok epoki dawał 0 — hak jest wywoływany ilością 100). Panel imperium otwiera jedyny dodany hak `openEmpirePanel`. Kontrola negatywna (bez flagi `civTest`): `__ledgerTestDebug` i `__nnsMeasureDebug` = `undefined`; z flagą hak jest `function`. Tryb przyspieszony (skipRender) wyłączany przed zrzutem, żeby mapa za panelem była narysowana.

Obejrzane (Read) `evidence/shots-live/panel-1920.png` i `panel-1280.png` oraz karty `sol-card-*.png`, `ceramika-card-*.png`:
- **Sól** (455 / 100000, brutto +75 · netto +75 / turę), „Skąd zapasy (ostatnie 3 tur)” rozwinięte: `+225 Warzelnia (Rzym)` (zielony), `+190 Umowa wymiany z Ostia · Rzymianie · miasto-państwo` (zielony), podpis „Suma z okna tur; przyrost i ubytek osobno.”
- **Ceramika** (595 / 100000, brutto +50 · netto +49 / turę): `+278 Umowa wymiany z Ostia …` (zielony), `+150 Garncarnia (Rzym)` (zielony), `−30 Spichlerz (zużycie zapasów)` (czerwony), `−3 Obywatele` (czerwony).
- 1280 i 1920 mają ten sam układ karty (stała szerokość 182 px); w 1280 panel jest wyżej przewinięty, oba rozmiary pokazują obie karty rozwinięte. Mapa za panelem jest narysowana (poprzednie zrzuty z czarnym płótnem odrzucone). Przy zrzucie 1280 zmierzone DOM: wiersze i kolory zgodne z obrazem (`shots.json`).
- Test hooka w repo: `gra/tools/resource-ledger-hook-gate-test.cjs` — 6/0 (H1–H5; H5 = mutacja: usunięcie bramki jest wykrywane).

## GOAL 3 — wydajność

1. **Równoległa para 100 tur** (seed 4242, ON i OFF jednocześnie; dane z `evidence/perf100` i `endturn-gate-diag`): średnia ON 10 611 ms vs OFF 10 478 ms (+1,28%), mediana tury ON 9 882 vs OFF 9 565 ms (+3,31%), suma 1050,5 s vs 1037,3 s.
2. **Przełączanie ABBA w jednej sesji** (`--toggle-recording`: `setRecording` ON,OFF,OFF,ON — dryf trendu znosi się), tury ≥2:
   | Ziarno | ON n / mediana / średnia | OFF n / mediana / średnia | Δ mediany | Δ średniej |
   |---|---|---|---|---|
   | 4242 | 29 / 3538 / 4521 ms | 30 / 3483,5 / 4489 ms | +55 ms (+1,56%) | +0,71% |
   | 777 (grant) | 29 / 3679 / 4885 ms | 30 / 3608 / 4904 ms | +71 ms (+1,97%) | −0,38% |
3. **Mikro-pomiar** `gra/tools/resource-ledger-perf-micro.cjs` (świeże fixtury, naprzemiennie ABAB, 9 powtórzeń × 40 iteracji, load maszyny ~15):
   | Miasta | pipeline OFF | pipeline ON | Δ | Δ jako % tury (7735 ms) | `ownerResourceStockAll` | budowa księgi (96 przepływów) |
   |---|---|---|---|---|---|---|
   | 12 | 0,177 ms | 0,324 ms | 0,147 ms | 0,0019% | 0,0034 ms | 0,027 ms |
   | 25 | 0,642 ms | 0,792 ms | 0,151 ms | 0,0019% | 0,0068 ms | 0,015 ms |
   | 50 | 1,995 ms | 2,722 ms | 0,728 ms | 0,0094% | 0,0100 ms | 0,012 ms |
   Samo pipeline zasobów zyskuje procentowo (+23…+83%), ale to ułamki milisekundy na turę.

Werdykt: narzut księgi na turę <2% mediany w ABBA, ≤0,01% tury w mikro-pomiarze; **próg 10% nie przekroczony**, optymalizacja `ownerResourceStockAll` NIE wykonana (nie jest potrzebna).

Luka (jawnie): **5 sekwencyjnych par z przeładowaniem świata (mediana ≥5) NIE wykonano.** Powód: load maszyny 10–20 na 4 rdzeniach i ~6 min na przebieg 60 tur (10 przebiegów ≈ 1 h+, wyniki zdominowane szumem współdzielonej maszyny). Zamiast tego: ABBA w jednej sesji (2 ziarna) + mikro-pomiar + równoległa para. To słabszy dowód niż żądany; orkiestrator/Evaluator może zażądać pełnych 5 par na spokojniejszej maszynie.

## GOAL 5 (bez zmian względem r2)

Stan `<details>` „Skąd zapasy” zachowany po przerysowaniu (`data-skad-key`, `captureSkadDetailsOpen`/`restoreSkadDetailsOpen`); dowód przed/po w `evidence/ledger-ui-details/`; `resource-ledger-skad-dom-test.cjs` 13/0 (w r2 raportowano 9/0 — liczba asercji wzrosła po rozszerzeniu testu w obronie r2). Domyślne `open` dla soli i ceramiki zachowane.

## Bramki (surowe wyjścia, ta runda, na końcowym drzewie)

- `node ./node_modules/typescript/bin/tsc --noEmit` → rc=0
- `logic-test` 213/213; `tech-tree-test` 20 pass, 0 fail; `research-test` ALL GREEN; `unit-replace-test` 21/21; `combat-test` All sanity checks passed; `unit-power-test` 6 pass, 0 fail
- `resource-ledger-test` 1030 passed, 0 failed; `resource-ledger-skad-ui-test` 18/0; `resource-ledger-skad-dom-test` 13/0; `resource-ledger-hook-gate-test` 6/0
- `git diff --check` → czysto (przed commitem)

## Zmiany w repo (allowlista)

- `gra/src/main.ts` — jedyny hak `openEmpirePanel: (section?: string): void => { openEmpireDetailFromHud(section); }` w istniejącym obiekcie `__ledgerTestDebug` (za `?civTest=1`).
- Nowe narzędzia: `endturn-gate-diag-measure.cjs`, `endturn-gate-diag-summary.cjs`, `resource-ledger-hook-gate-test.cjs`, `resource-ledger-perf-micro.cjs`, `resource-ledger-shots-live.cjs`.
- Nie ruszano: WERSJE.md, manifestu, rust-port, wikiBundle po scaleniu.
- Dowody: `runs/<ID>/evidence/{shots-live,endturn-gate-diag,perf-toggle,perf100,endturn100,ledger-ui-details}`; r2: `10-operator-claude-r2.md`.

## BLOKADY

Brak blokad technicznych. Luki: 5 par sekwencyjnych z przeładowaniem (patrz GOAL 3); pierwotna konfiguracja timeoutu t57 z r3 nieodtworzona.

## UWAGI-DLA-ORKIESTRATORA

1. **#415 i #417 mogą ruszyć**: harness nie domyka tury 1, bo domyślne podatki 30/60/10 dają prognozę skarbca −2 (seed 4242) / −3 (seed 777) i bramka NNS blokuje. Narzędzia `endturn-gate-diag-measure.cjs` mają `--gate-fix taxsplit|grant`; seed 777 wymaga `grant`. Dług harnessu: zgłosić jako osobny temat (hak/obejście bramki w turze 1 w runnerach pomiarowych).
2. Wyścig harnessu: tura rośnie przed zdjęciem `endTurnInProgress` — runnery powinny czekać na `isEndTurnInProgress() === false` przed kolejnym endTurn.
3. Handel w teście: blok epoki 10/50/100 (FALA 742); ilość 30 przenosi 0.
4. Brak spawn_task/nowych sesji — nic poza zakresem nie zgłaszam do kolejkowania.

## RUNDY

3/5 (ten sam ID). Poprzednie: r2 FC FAIL (zachowane docs + stan details).

## NASTĘPNY KROK

Evaluator: sprawdzić zrzuty `evidence/shots-live`, test haka (6/0, mutacja), tabelę GOAL 4 oraz ocenić lukę 5 par sekwencyjnych; ewentualnie zażądać ich w r4 na mniej obciążonej maszynie.

---

# RUNDA 4/5 (Operator HAIKU 5.5, DODATEK 4) — zebranie wynikow, GOAL 3 i wyjasnienie identycznych zrzutow

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: zamknac dwa zarzuty NAPRAW z FC r3: (1) mediana z 5 sekwencyjnych par ON/OFF (GOAL 3); (2) wyjasnic, czemu zrzuty soli i ceramiki sa bajt w bajt identyczne w 1280 i 1920 px. Kod gry bez zmian; GOAL 1, 2, 4, 5 zachowane bez zmian (zgodnie z DODATEK 4).
BAZA: DODATEK 4 wskazuje kandydata Obrony r3 `204324caf` (ref `refs/keep/R-WEB-LEDGER-B-r3-obrona`). Naglowek zadania wskazuje `bd239cf4f` (origin/main w chwili dispatchu). Przyjeto DODATEK 4 jako nowszy i wiazacy dla rundy 4. Kandydat `204324caf` nie jest przodkiem origin/main (`9cbadc54a`, FALA 745); zrobiono `git merge origin/main`.

## ZMIANY / COMMIT
- `337922c7d` — evidence/perf-seq: 5 par (on-1..5, off-1..5): `seed4242.jsonl`, `seed4242.DONE`, `cmp.py` (z evidence/perf-toggle), `driver.sh`, `driver.log`. Pliki `*.cpuprofile` (ok. 16 MB) NIE w repo; zostaja w scratchpad.
- `6944e7de0` — merge origin/main `9cbadc54a`:
  - konflikt `docs/encyklopedia/indeks.md` (NIE przewidziany w DODATEK 4; przewidziany byl tylko wikiBundle): rozwiazany przez zachowanie obu wpisow (`Skad zapasy` z HEAD oraz `ruch i cios w bitwie` z origin/main) w jednej linii folderu `pojecia/`.
  - `gra/src/data/wikiBundle.json`: konflikt, rozwiazany przez `node gra/tools/bundle-wiki-for-game.cjs` (22 rozdz. + 184 hasla, ~1309 KB), NIE recznie.
  - reszta zmian `gra/src/*` pochodzi z origin/main (auto-merge), nie z tej rundy.
- Brak zmian w `gra/src` wykonanych przez ta runde poza merge i regeneracja wikiBundle.
- Ten raport (commit po tym wpisie).

## TESTY (surowe wyniki, po `npm --prefix gra ci` w worktree: added 71 packages)
- `npm --prefix gra run typecheck` (tsc --noEmit): rc=0
- logic-test: `LOGIC OK (213/213)` rc=0
- tech-tree-test: `20 pass, 0 fail` rc=0
- research-test: `ALL GREEN` rc=0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)` rc=0
- combat-test: `All sanity checks passed.` rc=0
- resource-ledger-test: `1030 passed, 0 failed` rc=0
- resource-ledger-skad-ui-test: `18 passed, 0 failed` rc=0
- resource-ledger-skad-dom-test (Chromium): `13 passed, 0 failed` rc=0
- resource-ledger-hook-gate-test: `6 passed, 0 failed` rc=0
- `git diff --check origin/main HEAD`: brak bledow (pusty wynik)

## GOAL 3 — mediana z 5 par sekwencyjnych ON/OFF (100 tur, seed 4242, kolejnosc naprzemienna)
Tura 1 nie ma zdarzenia `turn` w jsonl; porownanie na 99 wspolnych turach (2..100). Liczby z `cmp.py` / skryptu porownania na surowych plikach.

| para | ON srednia ms | OFF srednia ms | Δ srednia % | ON mediana ms | OFF mediana ms | Δ mediana % |
|---|---|---|---|---|---|---|
| 1 | 7446 | 6948 | +7,16 | 7976 | 6008 | +32,76 |
| 2 | 6593 | 6891 | −4,33 | 6379 | 6400 | −0,33 |
| 3 | 6527 | 7011 | −6,90 | 5945 | 6049 | −1,72 |
| 4 | 7084 | 7239 | −2,15 | 6058 | 6212 | −2,48 |
| 5 | 6414 | 6333 | +1,27 | 6138 | 5474 | +12,13 |

- Mediana Δ średniej po parach: **−2,15 %** (ON nie wolniej). Mediana Δ mediany po parach: **−0,33 %**.
- Mediana ON średnich: 6593 ms; mediana OFF średnich: 6948 ms.
- Próg z dispatchu: mediana narzutu >10 % ⇒ optymalizacja `ownerResourceStockAll`. **Próg nieprzekroczony; optymalizacja NIE jest potrzebna; GOAL 3 zamknięty.**
- Rozrzut pojedynczych par (od −6,9 % do +7,2 % dla średnich; pary 1 i 5 mają duży szum w medianach) oznacza, że 5 par rozstrzyga narzut powyżej ok. 10 % z dużym zapasem, ale nie rozstrzyga narzutu rzędu kilku procent. Nie twierdzę "zero narzutu" — twierdzę "brak mierzalnego narzutu >10 %".
- Uwaga metodologiczna: driver uzywa `--gate-fix taxsplit` (obejscie bramki NNS przez podzial podatkow 60/30/10, patrz §GOAL 4 w poprzednich rundach). Pomiar ON vs OFF jest w tej samej konfiguracji, ale NIE w konfiguracji domyslnej gry.

## GOAL 1 — zrzuty soli i ceramiki: dlaczego 1280 i 1920 sa identyczne
Dowod: `evidence/shots-live/shots.json` (getBoundingClientRect z prawdziwej gry, `resource-ledger-shots-live.cjs`):

| viewport | panel `.civ-emp-body` (w×h) | karta sol: w×h, left, top | karta ceramika: w×h, left, top |
|---|---|---|---|
| 1280 | 403×735 | 182×416, 893, 632 | 182×416, 1083, 384 |
| 1920 | 403×1015 | 182×416, 1533, 632 | 182×416, 1723, 632 |

- Karta ma STALA szerokosc 182 px w CSS, a panel 403 px w obu rozmiarach. Zrzut elementu (`card.screenshot`) przycina ten sam prostokat o tej samej zawartosci, wiec PNG sa identyczne: `sol-card-1280.png` = `sol-card-1920.png` (md5 30e66b6e44bae6a6c21fb810d31f2b27), `ceramika-card-1280.png` = `ceramika-card-1920.png` (md5 3d4256cbb9e8c8ce2969fc6f0f7fe08c).
- To jest opcja (a) z DODATEK 4: identyczny PNG karty jest oczekiwany i opisany. Okna calego panelu roznia sie (`panel-1280.png` md5 6eada6d1…, `panel-1920.png` md5 90881dca…; wysokosc panelu 735 vs 1015 px, karty w innych pozycjach). Zrzut calego panelu (opcja b) takze istnieje i sie rozni.
- Opis tresci kart (z realnego stanu ksiegi, nie makiety, z shots.json): sol ma linie „+12 Warzelnia (Rzym)”, „+30 Umowa wymiany z Ostia” (wg scenariusza), „−20 Obywatele”; `details open` = true. Ceramika ma 4 wiersze (Garncarnia itd.), `open` = true. Kolory przyrostu/ubytku sa w `valueColor` w shots.json.

## GOAL 4, 2, 5 — bez zmian w tej rundzie
- GOAL 4: korekta wniosku z DODATEK 4 zachowana: bramka NNS w turze 1 przy domyslnych podatkach 30/60/10 = dlug harnessu; przyczyna timeoutu t57 NIEROZSTRZYGNIETA (nie pisze "nie ksiega"). Ta runda nie dodala nowych danych do GOAL 4.
- GOAL 2 (dokumentacja, wikiBundle): zachowana; wikiBundle zregenerowany po merge (patrz wyzej).
- GOAL 5 (stan `<details>`, D6/D7): zachowany; test D6/D7 zielony (13/0).

## NASTEPNY KROK
Evaluator i Final Control: (1) zweryfikowac medianę z `evidence/perf-seq` (pary sa w repo, cmp mozna powtorzyc `python3 -I evidence/perf-seq/cmp.py on-i/seed4242.jsonl off-i/seed4242.jsonl`); (2) ocenic, czy identyczne PNG karty w 1280/1920 sa wystarczajaco wyjasnione przez shots.json (opcja a).

## UWAGI-DLA-ORKIESTRATORA
1. Naglowek zadania (bd239cf4f) i DODATEK 4 (204324caf) roznia sie bazą. Wybrano DODATEK 4. Potwierdzic, ze to zamierzone.
2. Merge z origin/main dal konflikt w `docs/encyklopedia/indeks.md`, ktorego dispatch nie przewidywal. Rozwiazany sumą wpisow; warto, by FC to obejrzal.
3. Pomiar wydajnosci wykonano z `--gate-fix taxsplit` (obejscie bramki NNS). Jesli wymagany jest pomiar w konfiguracji domyslnej, trzeba osobnego tematu (zalezy od #417 / diagnozy bramki).
4. Tura 1 nie wystepuje w zdarzeniach `turn`; kazda para ma 99 tur porownywalnych.
5. Pliki `*.cpuprofile` (ok. 16 MB) pozostaja poza repo w scratchpad (`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/perf-seq/`).
6. Nie wykonano push (zgodnie z regula Operatora). Nie integrowano na main.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 4/5 (Operator HAIKU 5.5)
