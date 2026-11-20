# Harness pomiaru ekonomii AI (R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1, runda 3)

Pomiar tylko do odczytu. Hak `window.__aiEconomyMeasure` istnieje wyłącznie przy `?civTest=1`
(gra/src/main.ts, blok `__nnsMeasureDebug`). Gra bez tego parametru nie zmienia się (kontrola negatywna
w `ai-economy-measure-hook-test.cjs`).

## Stan (r3) w jednym miejscu

| Kryterium | Stan | Dowód |
|---|---|---|
| (a) test haka: kształt, brak fantomów, AI z miastami, obejście NNS, kontrola negatywna, mutacja | ZIELONE (patrz „Test haka”) | `runs/.../evidence/r3-hook-test.log` |
| (a) wartość: AI owner ma miasto i jednostkę | ZIELONE: t2 41/41 AI z miastem i jednostką (oba ziarna); t100 14/14 (oba ziarna) | `r3-seed*-100t.jsonl` |
| (b) 100 tur × 2 ziarna | ZMIERZONE: tura końcowa 100 na obu ziarnach, bramka NNS gracza aktywna 1 raz (tura 1) | tabela niżej |
| (c) wznowienie (41–50) | CZERWONE: 0/10 zgodnych skrótów; przyczyna po stronie gry (zapis/wczytanie, #424), asercja NIEOSŁABIONA | `r3-resume-*` |
| (c) mutacja wznowienia | NIE ZMIERZONO (dispatch: dopiero przy zielonej bazie) | — |
| #415 jedno polecenie ON/OFF | DODANE: `ai-economy-measure-upkeep-onoff.cjs` | sekcja „#415” |

## Tabela przebiegów 100 tur (r3, start przez nakładkę „Tworzenie świata”, `--every 10`, `--bypass 1`)

| Ziarno | Tura końcowa | Tury z aktywną bramką NNS gracza | Dosypki | Uwagi |
|---|---|---|---|---|
| 4242 | 100 | 1 (tura 1) | 1 | przebieg w dwóch częściach: t1–51 ciągły (zatrzymany t51, zalegająca kolejka bitew, zob. niżej), t50–100 wznowiony ze slotu t50 (kod z leczeniem kolejki); czas ≈ 6 min + 35 min |
| 777 | 100 | 1 (tura 1) | 1 | t1–89 ciągły (zatrzymany t89, ta sama przyczyna), t80–100 wznowiony ze slotu t80; czas ≈ 31 min + 18 min |

Czas rośnie z turą (ok. 6 s/turę na początku, 35–50 s/turę po ~t60 przy 14–16 właścicielach z dużymi armiami).

### Co widać w danych (AI = 41 właścicieli na starcie, w tym państwa-miasta)

| Ziarno | Tura | Właściciele AI | z miastem | z jednostką | jednostki wojskowe AI (suma) | śr. skarbiec AI | max utrzymanie jednostek (Pieniądz/turę) |
|---|---|---|---|---|---|---|---|
| 4242 | 2 | 41 | 41 | 41 | 44 | 15,9 | 20 |
| 4242 | 50 | 16 | 16 | 15 | 123 | 1366 | 204 |
| 4242 | 100 | 14 | 14 | 14 | 895 | 18315 | 3416 |
| 777 | 2 | 41 | 41 | 41 | 43 | 10,8 | 20 |
| 777 | 50 | 14 | 14 | 14 | 154 | 1963 | 380 |
| 777 | 100 | 14 | 14 | 14 | 883 | 29374 | 6272 |

Obserwacje (NIE zbadane przyczynowo w tym temacie):
- Z 41 właścicieli AI zostaje 14–16 już do tury 50 (pozostali znikają z wierszy: nie mają miasta ani jednostki).
  Hak NIE tworzy dla nich wierszy zerowych; lista takich właścicieli jest w `diag.aiStartOwnersBezWiersza`
  (puste w t2/t10/t100, w t50 niepuste: 25 właścicieli w seedzie 4242, 27 w 777 — wyeliminowani/wchłonięci w trakcie gry, nie defekt startu; powód znikania NIE zbadany).
- Gracz (owner 0) jest bierny i w t100 nie ma miast ani jednostek (`diag.ownersBezMiastIJednostek=[0]`) — był podbity.
- Skarbce AI rosną do dziesiątek tysięcy (brak sinka złota) — dane wejściowe dla #415.
- `glodWojska` (flaga) pojawia się sporadycznie (t10 seed 777: 1 właściciel); `deficytZlota` = 0 w próbkach t2/t10/t50/t100.

## Jedno polecenie (przebieg 100 tur, wznawialny)

Bundle buduje się poza repo (`vite build --outDir <abs-dist>`), potem z katalogu `gra/`:

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 100 --every 10

**Start (naprawa błędu harnessu z r1/r2):** `__nnsMeasureDebug.startGame` uruchamia asynchroniczne `doStartGame`;
klastry AI i miasta-państwa powstają dopiero po zniknięciu nakładki „Tworzenie świata”. Runner (i test haka) czekają
teraz na koniec nakładki + `awaitingFirstCity` (jak `ai-army-live-measure.cjs`), dopiero potem `foundFirstCity`.
Wcześniejsze „AI = 0 miast” było błędem kolejności w harnessie, NIE defektem startu gry (poprzednia diagnoza r2 odwołana).
Start zajmuje ok. 2 min (generacja świata z 41 właścicielami).

- Wynik: `<out>/seed4242.jsonl` (wiersz na turę: metryki każdego właściciela, `diag`, bramka przed endTurn,
  dosypki, automatyczne bitwy), `<out>/seed4242.state.json`, `<out>/seed4242.summary.json`, `seed4242.events.log`.
- Zapis co `--every` tur (quickSave przez realną ścieżkę gry) w trwałym profilu. Ponowne wywołanie z tym samym
  `--out` i `--profile` wznawia od zapisanej tury slotu (JSONL jest obcinany do tury slotu; wznowienie tylko gdy
  `saved === true`). Limit Bash 590 s: przebieg dzielimy na kolejne wywołania `--stop-at` o wielokrotności `--every`
  (np. 10, 30, 60) — każde wywołanie wznawia z ostatniego slotu, bez zgubienia tur (wariant bez tła; r1 tematu
  R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1).
- Bramka NNS gracza: przed endTurn, jeśli `nnsGateBlocked()`, runner dosypuje `--gold` / `--food` (domyślnie
  200/200) przez `grantPlayerGold/grantPlayerFood` i zapisuje to w wierszu (`bypass`, `gateBlockedBeforeEnd`).
  `--bypass 0` wyłącza dosypki (przebieg zatrzymuje się z powodem `gate-blocked`). Dosypki dotyczą WYŁĄCZNIE gracza;
  AI nie jest wspierane — harness nie ukrywa blokad AI.
- Okna bitwy: runner rozstrzyga odłożone bitwy jak gracz („Auto”, zamknięcie podsumowania), pętla do ~2 min na turę.
- **Zalegająca kolejka bitew (obserwacja r3):** w przebiegu ciągłym obu ziaren turę blokował `pendingAuto=true`
  (nic nie otwarte, `canEnd=false`) — seed 4242 w t51, seed 777 w t89. Gra leczy to dopiero przy PRÓBIE zakończenia
  tury (`healStuckDeferredPreBattleQueueOnEndTurnAttempt`, próg 8 s). Runner robi to samo (do 3 prób, licznik
  `stuckQueueHeals` w `state.json`/`summary.json`). W przebiegach po wznowieniu licznik wyniósł 0 (zjawisko nie
  powtórzyło się), więc ścieżka leczenia NIE została wykonana w żywym przebiegu — NIE ZMIERZONO jej skuteczności.
  Zgłoszone jako obserwacja dla orkiestratora (możliwy defekt gry: kolejka bitew blokująca „Zakończ turę” bez okna).

## Metryki na właściciela (kolumny JSONL)

skarbiec, spichlerz (zapas państwa), jednostkiWojskowe, jednostkiCywilne, rekruci, sumaLudkow,
glodWojska / glodWojskaAtrycja (flagi), **glodKaraStatProc** (% kary statystyk bojowych = (1 − glodWojskaStatMult)·100,
0 gdy brak głodu), **glodAtrycjaHpProc** (% maxHP tracony na turę = glodWojskaHpFrac·100, 0 gdy brak atrycji),
deficytZlota, miasta, obywatele, utrzymanieBudynkowPieniadz / Surowce, utrzymanieGarnizonuPieniadz,
**utrzymanieJednostekPieniadz** (totalUnitUpkeep po jednostkach wojskowych), **utrzymanieJednostekSurowce**
(totalUnitResourceUpkeep po jednostkach wojskowych). Owner = gracz + każdy właściciel z miastem lub jednostką
(bez barbarzyńców, bez wierszy fantomowych). `diag.aiStartOwnersBezWiersza` = właściciele z `aiStartHexes` bez miasta i jednostki.
Pola `przychodNaTure` i `utratyNaTure` NIE są mierzone (lista `niezmierzone`) — brak zweryfikowanego źródła.

## Test haka (kryterium a)

    node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist> [--mutant-dist <abs-zepsuty-dist>]

Asercje: kształt metryk (komplet pól i typów); brak fantomowych właścicieli; po starcie > 1 właściciel z miastem;
bramka NNS blokuje w turze 1; dosypka 0/0 NIE odblokowuje (kontrola negatywna mechanizmu); dosypka 200/200 odblokowuje
i realny endTurn przechodzi turę 1 → 2 (**ścieżka obejścia wykonuje się: `nnsGateBlocked` true → false**);
wartość AI (każdy AI owner ma miasto, ≥ 90% ma jednostkę; wyjątki wypisywane); kontrola negatywna bez `?civTest=1`;
mutacja: `--mutant-dist` = bundle z przemianowanym polem (`utrzymanieJednostekPieniadz`) MUSI oblać kształt.
Uwaga: kryterium wartości dopuszcza do 10% AI bez jednostek (np. państwo-miasto po utracie garnizonu) — to zachowanie gry.

## Test wznowienia (kryterium c) — CZERWONY

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 50 --save-at 40 --resume-test 1

Wynik na kodzie r3 (ZMIERZONE): `allEqual=false`, `compared=10`, zgodnych 0/10 (tury 41–50). Dowód przyczyny
(diff migawek tury 41, ciągły vs wznowiony, `SNAP_DUMP=ref`): po wczytaniu zapisu miasta dostają pola domyślne,
których w stanie ciągłym nie ma (`magazynZywnosci`: null → 0, `budowaPriorytetTypow`, `budowaLista`, `postepBudynkowUsuniete`
w 41/41 miast) i różnią się m.in. `wealthState.pula` (88 różnic), `units[].stackGroupId`. To klasa defektu SAVE-LOAD
(migracja/uzupełnianie domyślnych pól miasta przy wczytaniu; tabela w #424), poza allowlistą tego tematu.
#424 (R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1) NIE jest na `origin/main` (sprawdzone). Asercja nieosłabiona.
Po wejściu naprawy powtórz polecenie; wtedy dodaj `--mutant 1` (oczekiwane CZERWONE porównanie).

## #415 — pomiar bramki utrzymania armii AI ON/OFF (jedno polecenie)

Kod bramki NIE jest w main. Leży w `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc` (3 pliki: `gra/data/ai-upkeep-params.json`,
`gra/src/game/ai-upkeep-runway.ts`, fragmenty `gra/src/main.ts`; baza = starsza historia, diff jest mały i nakłada się
czysto na ten kod). Flaga: `AI_UPKEEP_RUNWAY_GATE.wlaczone` (domyślnie `false`) w `ai-upkeep-params.json`.
Skrypt nakłada diff kandydata na tymczasowy worktree z `HEAD`, buduje DWA bundle (flaga false/true) poza repo, uruchamia
runner na obu i drukuje porównanie (średnie po właścicielach AI, tury 10/50/ostatnia):

    cd gra && node tools/ai-economy-measure-upkeep-onoff.cjs --work /tmp/upkeep-onoff --seed 4242 --turns 100

Wymaga: commit harnessu w `HEAD`, `npm ci` w `gra/`. Czas: 2 × (build ≈ 25 s + start ≈ 2 min + tury). Uruchamiaj w tle.
Wynik: `/tmp/upkeep-onoff/onoff-summary.json` + tabela w logu. Do wprowadzenia flagi do main potrzebny osobny temat
(tu NIE wprowadzono). Weryfikacja skryptu (ZMIERZONE, 20 tur, seed 4242): oba bundle zbudowane i przebiegi doszły do t20; OFF vs ON różnią się (t20: śr. skarbiec AI 43,44 vs 41,02; utrzymanie jednostek 6,34 vs 6,05; wojsko 1,24 vs 1,17), czyli flaga realnie działa. Różnica na 20 turach to próba działania narzędzia, NIE wynik pomiaru #415 (ten wymaga 100 tur).

## Ścieżka `?playtest=mapa&civTest=1` — skok licznika tury (N4)

Pomiar r3 (8 prób `endTurn`, seed 4242): licznik tury w jednym `endTurn` pokazał kolejno 2 → 3 → 1 (k=1), potem 1 → 2,
a od k=3 bramka NNS blokuje i tura stoi na 2 (dosypka tylko raz). Przyczyna skoku NIE ZMIERZONA (nie badano kodu scenariusza
playtest); wniosek praktyczny: scenariusz playtest nie nadaje się do pomiaru ekonomii AI — runner używa `--start newgame`.
`--start playtest` zostaje w runnerze wyłącznie jako ścieżka diagnostyczna.

## Blokady modalne końca tury i liczniki (R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1, runda 1)

Runner zamyka trzy blokady, które gra wlicza do `isOtherEndTurnModalOpen` (main.ts), przyciskiem jak gracz,
przed każdym „Zakończ turę”, w pętli leczenia kolejki bitew i podczas czekania na koniec tury:

| Blokada | Wykrycie w DOM | Przycisk zamknięcia | Licznik (state/summary/jsonl) |
|---|---|---|---|
| audiencja dyplomatyczna | `.civ-diplo-aud` z `style.display !== 'none'` | `.civ-diplo-aud-back` („Wróć”/„Wyjście”) | `diploAudienceClosed` |
| panel łączenia armii | `#civ-amp-title` | `.civ-amp-btn-sep` („Zostaw osobno”) | `armyMergeClosed` |
| karta odkrycia technologii | `#civ-tech-discovery-notice-host` | `[data-act="close"]` (✕) | `techNoticeClosed` |

- Każde zamknięcie jest liczone osobno, ale DOPIERO po sprawdzeniu, że blokada zniknęła po kliknięciu (300 ms);
  klik bez skutku nie podbija licznika. Blokada, która po kliknięciu nie znika (3 próby z rzędu), jest zgłaszana na
  stderr z zrzutem DOM (`[econ] blokada nie znika po kliknieciu`). Liczniki w przebiegach sprzed tej zmiany były
  liczone przy samym kliknięciu. Rekord tury zawiera `modalClosedThisTurn` (przyrost w tej turze); summary i
  state zawierają sumy. Blokada bez przycisku zamknięcia nie jest liczona i zostaje w zrzucie DOM (`why.modal`).
- `state.json` jest zapisywany po KAŻDEJ turze (nie tylko przy zapisie slotu). Liczniki wznowienia startują od
  `slotCounters` (wartości z chwili zapisu slotu), więc tury po slocie nie są liczone dwa razy.
- Test haka: asercja 0 (`blokady: …`) działa na atrapach DOM bez gry: `node tools/ai-economy-measure-hook-test.cjs
  --modal-only 1` (5 asercji). Mutacja na kopii runnera (usunięte kliknięcie audiencji) MUSI dać czerwone
  (`--runner <kopia>`): zmierzone 3/5 zielone, exit 1.
- Dowód live (seed 4242, od t1, trzy wywołania `--stop-at` 10/30/60, zapis co 10 tur): 59 wierszy, tury 2–60,
  bez duplikatów; zamknięcia audiencji w t2 (2×) i t13 (1×); t51 i t57 przeszły bez zatrzymania; stuckQueueHeals 0.
  Zatrzymanie w t51 z poprzedniej rundy NIE wystąpiło w tym przebiegu, więc przyczynowo nie potwierdzono, że to
  zamknięcie je usuwa; potwierdzono, że ścieżka zamykania działa w żywej grze.

## Tempo „Koszty jednostek” (R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1)

- `--pace niski|normalny|wysoki` (domyslnie `normalny`). Hak `__aiEconomyMeasure.setUnitCostPace` ustawia tempo PRZED pierwsza tura; wznowienie porownuje tempo z zapisem.
- Pole wiersza `zywnoscArmiiTura` (zywnosc armii na ture per wlasciciel, tempo wliczone). Wiersz tury i summary: `unitCostPace`.
- Wyniki: `dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md`.

## Licznik przyrostu jednostek (R-WEB-VERIFY-LIVE-A2)

Hak `__aiEconomyMeasure.unitFlowTurn()` (tylko `?civTest=1`, tylko odczyt stanu, zero zmiany zachowania gry bez haka):
per właściciel od poprzedniego wywołania — `noweId` (nowe id jednostek), `zniknietePrzyczyny` (`glod-armii`,
`glod-oblezenie`, `deficyt-zlota`, `rozwiazanie-gracz`, `rozwiazanie-ai`, `eliminacja-wlasciciela`),
`zniknieteBezPrzyczyny` (walka i ścieżki bez znacznika, NIE rozdzielone), `zyweNaKoniec`, `epoka`.
Runner: `--unit-flow 1` dopisuje pole `unitFlow` do każdego wiersza tury. Test: `ai-economy-measure-hook-test.cjs`
(asercje ksztaltu, rozwiązanie gracza trafia do właściwej przyczyny, kontrola negatywna, mutacja czerwona).
Wyniki: `dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md` §8.
