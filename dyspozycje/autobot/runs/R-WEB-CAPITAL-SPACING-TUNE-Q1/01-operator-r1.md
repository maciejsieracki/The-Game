STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SPACING-TUNE-Q1
GOAL: w ZYWEJ grze (10 map Standardowy) odsetek map z para stolic <25 hexow wyraznie ponizej 30% (cel <=20%), bez utraty cywilizacji i bez ostrzezen `placeClusterCenters: tylko N/M`.

## Zmiany (baza origin/main 57cc8aded)
- `gra/data/map-gen-params.json` (`generator.capital_sep_short_side_coef.wartosc`): 0,15 -> 0,21 (Standard: round(0,21x120)=25).
- `gra/src/map/clusters.ts:1552` `CAPITAL_SEP_AREA_FACTOR`: 0,5 -> 0,8 (sufit wykonalnosci). `..._SMALL` (short<80) bez zmian.
- Uzasadnienie sufitu: zywa gra ma `typy=7` (log `[NewGame] Mapa: ... typy=7`), nie 5. Dla 7 civ i ladu ~5600 sufit przy 0,5 = floor(sqrt(5600x0,5/7)) = 20 < 25, wiec sam wspolczynnik nic nie daje; przy 0,8 = 25. (Wczesniejsza seria pomiarow z 5 typami byla niereprezentatywna — odrzucona, ponizej tylko `--max-types` = 7/8 typow jak zywa gra.)
- Testy (tylko oczekiwania progow): `capital-sep-unit-test.cjs` (9 asercji: 18->25, 15->21, 25->35, 12->16, 71->100; 35 dla Duzej), `capital-spacing-prop-test.cjs` (THRESHOLD 18->25, mutacja wsp=0 nadal lamie prog), `cluster-start-test.cjs` (Standard 8 typow: capitalMinSep=23/minDystansObcy=25 zmierzone — sufit obniza 25->23; Duza: progi par liczone od `placement.capitalMinSep` efektywnego zamiast od sep bez sufitu — poprzednio rowne, bo sufit nie dzialal; asercja capitalMinSep w [25,35] i minDystans = capitalMinSep+2). Zadna asercja nie oslabiona, tylko zmienione liczby/zrodlo progu.
- Zero zmian: ai.ts, generator terenu, gra-robocza, WERSJE.md, rust-port.

## Pomiar offline (capital-spacing-measure.cjs --max-types, bez rzek; plik `evidence/pomiar-offline-przed-po.json`)
Standardowy x 8 ziaren (1-8), 7 civ; PRE (0,15/0,5) -> POST (0,21/0,8):
| typ (lad) | sep | <25 | <30 | mediana | min | umieszczone | ostrzezenia | plan ms |
| Kontynenty 30 | 18->25 | 7/8 -> 0/8 | 7/8 -> 7/8 | 18 -> 26 | 18 -> 25 | 7/7 -> 7/7 | 0 -> 0 | 906 -> 1456 |
| Pangea 60 | 18->25 | 1/8 -> 0/8 | 5/8 -> 5/8 | 29 -> 29 | 24 -> 25 | 7/7 | 0 -> 0 | 2159 -> 1981 |
| Wyspy 50 | 18->25 | 3/8 -> 0/8 | 6/8 -> 4/8 | 29 -> 30 | 18 -> 25 | 7/7 | 0 -> 0 | 2603 -> 1488 |
Maly/Duzy/Ogromny x 3 ziarna (kont/pangea/wyspy), tez w JSON: umieszczone zawsze N/N; <25 bez regresu (Maly kont. 3/3 bez zmian — short<80, sep 9, poza zakresem). Duzy sep 25->33-35, Ogromny 36->47-50. Rozne warianty (0,23/1,0 => sep 28, 0/8 <25 i <28; 0,21/0,6 => sep 20-23 za malo przy 7 civ) zmierzone, wybrano 0,21/0,8 (0,21 w zakresie z dispatchu).

## Weryfikacja w ZYWEJ grze (bundle KOPII poza repo: git archive + overlay 2 plikow + vite build w /tmp/claude-0/capbuild, node_modules tam; sterownik `live-verify-robocza-2-gen.cjs` z origin/web-wip/LIVEVERIFY2-fc; `evidence/pomiar-zywa-gra-przed-po.json` + `live-gen2-*.json`)
10 map: najblizsza para stolic = 25,25,25,25,25,26,26,27,30,33 (mediana 25,5; bylo 18,18,19,20,20,21,22,26,32,33, mediana 20,5). Par <25: 0/10 (bylo 7/10); <30: 8/10 (bylo 8/10). Wszystkie mapy: 7/7 stolic (capsCount=7), 0 bledow strony, seedSeen == zadane. Kontynenty 26/25/27/25/26, Pangea 30/25/33, Wyspy 25/25. Pangea 30% (sufit ~19) NIE mierzona w zywej grze (poza lista 10 map).
Ostrzezenia w zywej grze: NIE_ZMIERZONO (sterownik nie zapisuje logow konsoli poza polar-fallback). Offline na Standardzie `[clusters]` = 0.

## Testy (gate-*.txt, kazdy z jedna linia EXIT=)
- capital-sep-unit-test: 44 passed, 0 failed (EXIT=0).
- capital-spacing-prop-test: ALL PASS, mutacja wsp=0 lamie prog 25 na 1/3 map (EXIT=0).
- cluster-start-test: 478 passed, 3 failed (EXIT=1). Te SAME 3 FAIL (`Standard: stolica obcego typu {inkowie,chinczycy,sumer} min 10 hex od morza`) wystepuja na czystym origin/main: 477 passed, 3 failed (`gate-cluster-start-PRE-main.txt`, seaDist 9/8/8; po zmianie 8/8/6). Nie wprowadzone przez te zmiane, ale sumer 8->6 jest nieco gorszy — do osobnego tematu.
- tsc nie uruchamiany (zmiana: 1 stala liczbowa + JSON + testy .cjs; brak zmian typow). NIE_ZMIERZONO.

## Uwagi / ryzyka
1. Nowa informacyjna linia logu `[clusters] capital-sep: N niewykonalne dla K civ na WxH, obnizono do M` pojawia sie czesciej (Maly pangea/wyspy, Duzy/Ogromny kontynenty — sufit dziala jak zaprojektowano, wszystkie civ umieszczone). To NIE jest `placeClusterCenters: tylko N/M`.
2. Kontynenty 30% na Standardzie: sufit wykonalnosci (lad ~5600 / 7 civ) wiazaco przy ~25; wiekszy sep wymagalby wyzszego wspolczynnika i sufitu 1,0 (pomiar: sep 28 dziala offline, nie wybrano — wiekszy wplyw na wszystkie rozmiary).
3. Offline Mały (108x74) nie zalezy od tej zmiany (sciezka short<80).
4. Uruchomilem raz test pre w tle (run_in_background) przez pomylke; zakonczony, bez wplywu na wynik.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (reprodukcja: `capital-spacing-measure.cjs --max-types` oraz live 10 map na bundlu z poprawka).
DEPLOY/PUSH: NIE WYKONANO
