# R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kryterium „≥ 4 z 6 scenariuszy zmierzone" NIE spełnione w pełni: 1 z 6 w całości na żywo, 5 z 6 częściowo; szczegóły niżej)
DOMAIN: GAME (weryfikacja zachowania gry, zero zmian kodu gry)
TEMAT: R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1
GOAL: weryfikacja nowych zasad dyplomacji (kroki 1–4b) w uruchomionej grze (Chromium, ?playtest=mapa), z surowymi wynikami.
BAZA: origin/main `d4d261e3b` (checkout detached, worktree `wf_ccf00b1e-16e-1`).
ZMIANY-COMMIT: nowy `gra/tools/diplo-live-verify-steps-1-4.cjs` + ten raport + `evidence/*.json` i 2 zrzuty. Commit i SHA w polu `sha` odpowiedzi (zob. niżej). Żadnego pliku `gra/src/**`, JSON balansu, WERSJE.md, gra-robocza/, rust-port/.
RUNDY: 1/5

## Narzędzie (jedno polecenie na scenariusz)

Z katalogu `gra/` (build do `/tmp/civ-live-verify`, poza repo; pierwsze uruchomienie buduje, kolejne z `--skip-build`):

```
node tools/diplo-live-verify-steps-1-4.cjs --scenario=1
node tools/diplo-live-verify-steps-1-4.cjs --scenario=2 --skip-build
node tools/diplo-live-verify-steps-1-4.cjs --scenario=3 --part=probe --skip-build
node tools/diplo-live-verify-steps-1-4.cjs --scenario=3 --part=turns --skip-build
node tools/diplo-live-verify-steps-1-4.cjs --scenario=4 --skip-build
node tools/diplo-live-verify-steps-1-4.cjs --scenario=5 --skip-build
node tools/diplo-live-verify-steps-1-4.cjs --scenario=6
```

Każde wywołanie to jedna świeża strona gry i JSON w `evidence/`. Scenariusz 3 jest rozbity na dwie części, bo jeden koniec tury w przeglądarce trwa ok. 100 s i cały S3 nie mieścił się w 590 s (pierwsze dwa przebiegi zostały przerwane limitem czasu; nie są zapisane jako wynik).

## Wyniki (surowe, z `evidence/*.json`)

| Scenariusz | Wynik | Dowód (liczby z DOM / silnika) | Plik |
|---|---|---|---|
| S1 — wojna: zaufanie spada do 0; respekt nie obcięty do 29 | PASS 5/5 (z zastrzeżeniem przy S1.d) | Zaufanie 40 (SETUP, DOM „40 / 100 +0.7 / turę”) → **0** już po wypowiedzeniu wojny → 0 po turze 1 → 0 po turze 2. Respekt w UI: 100 / 100 w każdym odczycie. | `S1.json` |
| S2 — rozejm 10 / pokój 20; kara za sąsiedztwo; religia | PASS 3 / N-Z 2 | Akceptacja rozejmu realną ścieżką: „Rozejm zawarty”, zaufanie **10**. Pokój (`finalizePeaceTreatyBetween`): zaufanie **20**. Kara za sąsiedztwo i religia: NIE_ZMIERZONO (brak fixtury granicy i hooka religii). | `S2.json` |
| S3 — wypowiedzenie wojny przez AI (próg siły, zaufanie 0, silniejszy gracz) | PASS 2 / N-Z 3 | Próg (zaufanie 25): `mayDeclare` przełącza się, gdy moc AI ≥ mocy gracza (ratio −0,10 → 0; ratio 0,00 → 2). Zaufanie 0 + AI silniejsza, **1 tura**: status `neutralni` (brak wypowiedzenia, N tur nieokreślone w dispatchu → N-Z). Silniejszy gracz (AI słabsza), 1 tura: `neutralni` (brak wojny: PASS). | `S3-probe.json`, `S3-turns.json` |
| S4 — rozejm/pokój: odmowa silniejszej, minimalny czas wojny, oferta z miastem | PASS 2 / N-Z 4 | Minimalny czas wojny (1 tura): „Pokój i rozejm dostępne po 10 pełnych turach wojny” — **zablokowany (PASS)**. Gałąź „AI czuje się silniejsze” **nie osiągnięta** w tym przebiegu (bramka 10 tur zadziałała pierwsza, patrz uwagi). Oferty z miastem/złotem: NIE_ZMIERZONO (brak hooków). | `S4.json` |
| S5 — etykiety / zaufanie 0, 9, 10, 29, 30 | PASS 5 (wartości) / N-Z 1 (nazwy etykiet) | Odczyt zaufania w DOM dla ustawień 0, 9, 10, 29, 30: **0, 9, 10, 29, 30** (zgodnie). Zrzuty panelu przy 29 i 30: `live-S5-zaufanie-29.png`, `live-S5-zaufanie-30.png`. Nazwy etykiet („Wrogi”, „Relacja”) nie zostały odczytane (selektor nie złapał tekstu). | `S5.json` + zrzuty |
| S6 — zmęczenie wojną (4b) | NIE_ZMIERZONO (2 pozycje) | Brak hooka wymuszającego zmęczenie bez zmian kodu; reguła końca zmęczenia — decyzja #361 nierozstrzygnięta, W58 nie potwierdzony. | `S6.json` |

Kryterium „≥ 4 z 6 scenariuszy zmierzone w uruchomionej grze”: **nie spełnione w pełni**. W całości na żywo PASS/FAIL: tylko S1 (plus wartości S5). Częściowo na żywo: S2, S3, S4, S5. Bez pomiaru: S6.

## Czego nie udało się zmierzyć i dlaczego

- S2.c kara za sąsiedztwo (−3/−4/−5, karencja): brak hooka ustawiającego wspólną granicę i karencję w tym scenariuszu.
- S2.d religia: brak hooka ustawiającego religię pary.
- S3.a/S3.b progi 14/20/28% (charakter AI) i 25/19/27%: hak czyta **Power** (`buildObjectivePower`), a nie siłę wojskową z kroku 2; nie ma hooka charakteru. Rozbieżność do rozstrzygnięcia (zob. uwagi).
- S3.c (wypowiedzenie przy zaufaniu 0): zmierzono 1 turę bez wypowiedzenia; dispatch nie podaje N, więc wynik niejednoznaczny. Pomiar N tur kosztuje ok. 100 s na turę.
- S3.e ostrzeżenie „raz na epizod”: pokrywane już przez `diplo-war-peace-live-test` (hamulec), nie mierzone osobno.
- S4.b (silniejsza AI odrzuca ofertę bez miasta) i S4.c: patrz uwagi — gałąź nieosiągnięta.
- S4.d/S4.e: brak hooków oferty z miastem/PN i oferty ze złotem.
- S5 nazwy etykiet: selektor tekstu nie zadziałał; wartości zaufania są mierzone.

## Uwagi

1. **Panel dyplomacji wymaga kontaktu.** Audiencja nie renderuje się, dopóki nacja nie jest w `diplomaticallyDiscoveredOwnersSet` (`getDiplomaticContacts`). `__aggressorTestDebug.contact` tego nie ustawia; użyto `__dyploMapaOdkrycieTestDebug.prepareContact`, które dodatkowo ustawia relację 100/100. Dlatego S4 otwiera stronę bez kontaktu (jak `diplo-war-peace-live-test`).
2. **S1.d słabszy dowód.** Wiersz „Respekt” w UI pokazuje wartość *efektywną* (`formatPowerRelationLine`), nie zapisane `rel.respekt`. Odczyt 100 / 100 potwierdza brak obcięcia do 29 w UI, ale nie dowodzi wartości przechowywanej. Do rozstrzygnięcia przez Evaluatora.
3. **`mayDeclare` jest liczbą** (0 / 2), nie wartością logiczną; pole `ratio` w JSON to moc AI / moc gracza − 1. Próg przełączenia (ratio ≈ 0, zaufanie 25) nie zgadza się z progami 14–28% z dispatchu. Możliwe przyczyny: Power zamiast siły wojskowej; charakter AI nieznany. Nie rozstrzygnięte.
4. **Bramka 10 tur w S4 — niewyjaśniona rozbieżność.** `diplo-war-peace-live-test` (scenariusz A1) uzyskał „AI czuje się silniejsze” przy wieku wojny 5 tur, ustawionym tą samą sekwencją (`setPlayerWarWithAi(2,5)`, `setAiPowerBonusForTest(2,20000)`). W tym narzędziu, na świeżej stronie i z wiekiem 5 tur, komunikat brzmi „po 10 pełnych turach”. Nie znaleziono przyczyny. Zalecam, by Evaluator porównał oba przebiegi.
5. **Koszt czasu.** Tura w przeglądarce (swiftshader) trwa ok. 100 s; scenariusz 3 w całości przekracza limit 590 s, stąd podział na `--part`.
6. **Nie zmieniono kodu gry.** Wszystkie odczyty idą przez istniejące hooki (`__peaceRulesTestDebug`, `__truceTestDebug`, `__audienceRelTestDebug`, `__dyploMapaOdkrycieTestDebug`, `__eraTestDebug`) i DOM panelu.

## UWAGI-DLA-ORKIESTRATORA

- Znalezisko poza zakresem (nie działam na nim): w `main.ts` `__peaceRulesTestDebug.setPlayerWarWithAi` nie resetuje wieku wojny, gdy para jest już w wojnie; `setWarAge` z `__truceTestDebug` też nie zmienił bramki 10 tur w S4. Warto to wyjaśnić przed kolejnym pomiarem S4.
- Nie zakładałem żadnych sesji ani zadań (zakaz zachowany).
- Sprzątanie: po zapisaniu raportu usunięto `/tmp/civ-live-verify` i `gra/node_modules` (zob. wynik `git status` w odpowiedzi).

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja S1.d (wartość efektywna vs zapisana), wyjaśnienie bramki 10 tur (uwaga 4) i progu `mayDeclare` (uwaga 3); decyzja, czy dorobić hak charakteru/siły wojskowej i hak oferty z miastem (osobny temat, wymaga zgody zakresu).
DEPLOY/PUSH: NIE WYKONANO
