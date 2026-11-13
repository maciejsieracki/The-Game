# R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 — raport Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES (kryterium „≥ 4 z 6 scenariuszy zmierzone w uruchomionej grze" spełnione w wariancie 4/6: S1, S2, S4, S5 mają rdzeń zmierzony bez NIE_ZMIERZONO; S3 zmierzony częściowo; S6 NIE_ZMIERZONO. Szczegóły i ograniczenia niżej.)
DOMAIN: GAME (weryfikacja zachowania gry w uruchomionej przeglądarce; zero zmian `gra/src/**`)
TEMAT: R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1
GOAL: pomiary kroków 1–4b w uruchomionej grze (Chromium), raport scenariusz → wynik → dowód, surowe liczby z plików evidence.
BAZA: kandydat r2 `fd3532d90` (origin/main), checkout detached w worktree `wf_44449e84-d41-1`.
ZMIANY-COMMIT: nowe `gra/tools/diplo-live-verify-s2c-s3c.cjs` (pomiary S2.c/karencja i S3.c), nowe `evidence/S2c.json` i `evidence/S3c.json`, przepisany ten raport. Zero zmian w `gra/src/**`, JSON balansu, WERSJE.md, gra-robocza/, rust-port/.
RUNDY: 3/5 (runda 3 = odpowiedź na zarzuty FC r2: 7 i 8 oraz punkty a–c)

## Jak uruchomić (jedno polecenie na scenariusz)

Z katalogu `gra/` (`npm ci --ignore-scripts`; build poza repo, katalog podajemy w zmiennej środowiskowej):

```
CIV_LIVE_BUILD_DIR=<katalog-poza-repo> node ./node_modules/vite/bin/vite.js build --outDir <katalog-poza-repo> --emptyOutDir
CIV_LIVE_BUILD_DIR=<katalog-poza-repo> node tools/diplo-live-verify-s2c-s3c.cjs --scenario=2c
CIV_LIVE_BUILD_DIR=<katalog-poza-repo> node tools/diplo-live-verify-s2c-s3c.cjs --scenario=3c
```

Narzędzie r1 (`diplo-live-verify-steps-1-4.cjs`, scenariusze 1–6) pozostaje bez zmian. Czasy w tej rundzie: 2c ok. 3 min 40 s, 3c ok. 4 min (w jednym wywołaniu, poniżej 590 s).

## Wyniki (scenariusz → wynik → dowód)

| Scenariusz | Wynik | Dowód (liczby z plików evidence) | Plik |
|---|---|---|---|
| S1 — wojna: zaufanie spada do 0; respekt nie obcięty do 29 | PASS 5/5 | Zaufanie 40 → 0 po wypowiedzeniu wojny i po turach 1–2. Zapisany respekt (`getRelationTotal`) = 60 po wypowiedzeniu i po turze 1 (S1.d PASS). | `S1.json` |
| S2 — rozejm 10 / pokój 20 | a PASS, b PASS | Rozejm (akceptacja realną ścieżką): zaufanie 10. Pokój: zaufanie 20. | `S2.json` |
| S2.c — kara za sąsiedztwo (−3/−4/−5 wg epoki) | PASS (stawki), karencja PASS na 2 z 3 etapów | Fixtura granicy AI↔AI (pary 1/3). Stawka (`karaWspolnaGranicaDelta`) przy max epoki: 1→−3; 2→−4; 3→−5; 4→−5; (2,3)→−5; (1,3)→−5. Zgodne z `diplomacy.json` (−3/−4/−5) i regułą `sharedBorderPenaltyForEpochs` (≥3 → Żelazo, ≥2 → Brąz, inaczej Kamień). Realny tyk (`applyProductionTick`) zmniejsza zaufanie zgodnie z podglądem (np. (1,1): podgląd −2,16 = tyk −2,16). Karencja (para gracz↔AI, epoki 2/4): wojna −5; po rozejmie stawka 0 (status pokoj, truce do tury 6); po pokoju stawka 0 (peace do tury 11). Wygaśnięcie karencji po 5 turach NIE zmierzone (koszt tur). | `S2c.json` |
| S2.d — religia nie zmienia zaufania | NIE_ZMIERZONO (live) | Brak haka ustawiającego religię pary. Dowód kodowy (nie live): `wspolnaReligia_zaufanie_perTura = 0` i `odmiennaReligia_zaufanie_perTura = 0` w `data/diplomacy.json`; `tickDiplomacy` ignoruje flagi religii (`src/game/diplomacy.ts`, komentarz „Religia nie zmienia Zaufania"). | — |
| S3 — wypowiadanie wojny przez AI | d PASS; c częściowo; a, b, e NIE_ZMIERZONO | d (silniejszy gracz, 1 tura): status `neutralni`, brak wojny (`S3-turns.json`). c (licznik zerowego Zaufania): N = 6 (`getBrakeParams`, prog 15). Start licznika 4 = N−2. Po turze 1 licznik 5 (= N−1), status `neutralni`; po turze 2 licznik 6 (= N), status `neutralni`. Zaufanie ustawiane na 0 przed każdą turą (odczyt DOM przed turą = 0). Wypowiedzenia przy N NIE zaobserwowano (patrz ograniczenia). a/b: hak czyta Power, nie siłę wojskową; brak haka charakteru. e: ostrzeżenie pokrywa `diplo-war-peace-live-test`. | `S3-probe.json`, `S3-turns.json`, `S3c.json` |
| S4 — rozejm/pokój | a PASS, b PASS, c PASS; d, e NIE_ZMIERZONO | a: minimalny czas wojny blokuje pokój („dostępne po 10 pełnych turach wojny"). b: silniejsza AI odrzuca ofertę gracza bez miasta („Brakuje 428 PW do uczciwej oferty pokoju @ Relacji (baza 475 PW)"). c: kontrast (ta sama oferta bez miasta przy innej AI: „Warunki pokoju spełnione"). d (oferta z miastem o wartości PN ≥ ceny) i e (złoto/surowce) — brak hooków. | `S4.json` |
| S5 — etykiety nastawienia | PASS | Odczyt zaufania w DOM = ustawienie dla 0, 9, 10, 29, 30. Nazwy: 0 i 9 → WROGI; 10 i 29 → NIEUFNY; 30 → PRZYJAZNY (zgodne z progami). Zrzuty z r1: `live-S5-zaufanie-29.png`, `live-S5-zaufanie-30.png`. | `S5.json` |
| S6 — zmęczenie wojną (krok 4b) | NIE_ZMIERZONO (2/2) | Brak haka wymuszającego zmęczenie bez zmian kodu. Reguła końca zmęczenia (bezwarunkowy pokój) nierozstrzygnięta (#361, W58). | `S6.json` |

Liczby z surowych JSON (nie z pamięci). `errors` w S2c/S3c: 0. `errorsTotal` w S1–S6: 0.

## Ograniczenia (dlaczego część pozostaje NIE_ZMIERZONO)

1. S3.c, wypowiedzenie przy N: licznik działa zgodnie z oczekiwaniem (4 → 5 → 6 = N), ale wypowiedzenia nie było. Hak `setCrisisCounter` i `getCrisisCounter` nie pozwala ustawić siły militarnej AI (armia + rekruci + wygrane bitwy, krok 2); `getCachedPowers.mayDeclareDeclarer` liczy Power, nie siłę militarną. Nie da się więc rozstrzygnąć, czy brak wojny wynika z tego, że AI nie jest silniejsza militarnie (zgodne z D7: gracz nigdy nie wypowiada automatycznie), czy z losowania gotowości. Wynik: NIE_ZMIERZONO dla „wypowiedzenie przy N".
2. S2.c karencja: wygaśnięcie po 5 turach nie zmierzone (kilka tur w przeglądarce).
3. Miara S2.c: pole `stawka` to wartość `karaWspolnaGranicaDelta`; `tickDelta` zawiera też pozostałe składniki tyku, więc nie jest czystą miarą kary za sąsiedztwo.
4. Karencja S2.c dotyczy pary gracz↔AI bez fixtury granicy (hak fixtury odrzuca gracza). Stawka jest liczona przed warunkiem granicy, więc pomiar dotyczy wartości stawki w karencji, a nie wpływu na tyk.

## Uwagi (ustalenia do Evaluatora, nie naprawiane tutaj)

- **Przestarzała asercja w `gra/tools/diplomacy-border-era-penalty-live-test.cjs`.** Test oczekuje stawki −4 dla epok (2,3). Live (`S2c.json`) i kod z `diplomacy.json` (po #341: −3/−4/−5) dają −5 dla max epoki 3. Najpewniej asercja pochodzi sprzed #341 (wtedy −2/−3/−4). Nie zmieniano.
- **Playtest mapa ma jednego AI bez miast.** Licznik kryzysu (`diploAiOwnersEligible`, `cityCount > 0`) dla tej pary nie rośnie. S3.c wykonano na grze z 2 AI (`startNewGame`, jak w teście granicy). Pierwszy koniec tury w playteście kończy grę zwycięstwem; `__truceTestDebug.suppressVictoryForTest()` wyłącza tylko ten warunek.
- **Zaufanie 0 nie utrzymuje się samo.** Po każdej turze DOM pokazuje 1 (w obu turach S3.c, mimo odczytu 0 przed turą). Przyczyna nie zbadana. Pomiar wymagał ustawiania 0 przed każdą turą.
- **N zależy od profilu.** `getBrakeParams` daje N = 6 (wyższy z profilów pary, `hamulecN`), a nie 5 z `diplomacy-tick-params.json` (`p6.kryzysTurDoWojny`). Warto potwierdzić, który profil obowiązuje dla gracza.
- **Brak haków do pełnego domknięcia:** siła militarna AI (krok 2), charakter cywilizacji (progi 14/20/28%), religia pary, oferta pokoju z miastem i ze złotem, zmęczenie wojną (4b). Dla tych punktów potrzebna osobna praca (poza zakresem bez zmian kodu).

## TESTY

- `git diff --check` (przed commitem): czysto.
- `git diff --name-only` względem bazy `fd3532d90` (po commicie): wyłącznie `gra/tools/diplo-live-verify-s2c-s3c.cjs` i pliki w `dyspozycje/autobot/runs/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/**`.
- `tsc --noEmit` i bramki referencyjne: NIE_URUCHOMIONO. Zmian w `gra/src` nie ma; narzędzie pomiarowe nie wchodzi do bundla gry.
- Build bundla (vite, katalog poza repo): wykonany, `index.html` i `audio-pack-*.js` zbudowane.
- Sprzątanie po pomiarach: usunięto `gra/node_modules` i katalog buildu poza repo (zob. sekcja poniżej).

## BLOKADY

- Wypowiedzenie wojny przy N (S3.c), karencja po 5 turach (S2.c), religia (S2.d), S3.a/b/e, S4.d/e, S6: patrz powyżej.
- Brak blokad procesowych.

## RUNDY

3/5 (runda 3 = punkty a–c zarzutów FC r2 oraz przepisanie raportu: zarzut 7 — pomiar S2.c i S3.c hakami; zarzut 8 i raport — ten dokument zgodny z evidence).

## UWAGI-DLA-ORKIESTRATORA

- Uwaga 4 z rundy 1 (rozbieżność bramki 10 tur w S4 przy wieku wojny 5) została usunięta z raportu: FC r2 uznał ją za fałszywy trop. Nie badano jej ponownie w tej rundzie.
- Zob. „Uwagi" wyżej: asercja −4 w teście granicy; playtest bez miast AI; zaufanie drift +1 po turze; N=6 z profilu.
- Nie zakładano żadnych sesji ani zadań (zakaz zachowany). Nie odpowiadano na wiadomości użytkownika wklejone w trakcie pracy.

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja tabeli względem `evidence/*.json` (S2c.json i S3c.json są nowe) i decyzja, czy S3.c (licznik spełniony, wypowiedzenie NIE_ZMIERZONO) i S2.c (karencja częściowo) wystarczają do kryterium ≥4/6.
DEPLOY/PUSH: NIE WYKONANO
