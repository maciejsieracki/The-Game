# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Operator, runda 1 (praca + obrona)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Operator; drugie wywołanie w rundzie 1 — obrona §3c pkt 2)
GOAL: plakietka obcej stolicy niesie oba człony formatem państw-miast; korona, marker,
populacja i pozostałe etykiety bez zmian.

ZMIANY/COMMIT: `ec2cc4a5` na bazie `66a40902`. Kod: `gra/src/game/display-names.ts`
(opt-in `clusterCapitalWithCityName`, gałąź `isClusterCapital` zwraca
`cleanCity + CITY_STATE_SEPARATOR + cleanCiv`). Bramka: `gra/tools/mapa-etykieta-stolicy-test.cjs`.
Dowody: `dowody/zrzut-mapy.cjs`, `dowody/pomiar-szerokosci-plakietki.cjs` (nowy, obrona),
`dowody/mapa-obca-stolica-*.png`. `render/cities.ts` nietknięty.

TESTY (przebieg obrony, po zarzutach): `tsc --noEmit` zielone; `mapa-etykieta-stolicy-test`
22/0; logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6;
bramki nazw: city-names-pool 12/0, city-names-pools 6/0, civ-names 6/0, danina 15/0,
diplomacy-display 35/0, rozmiar-label 13/0, save-label OK, unit-recruit 17/0, battle-hp 7/7,
bitwa-źródło 38 OK. **`display-names-test.cjs` 26/1 — czerwona, poza allowlistą.**

## Dlaczego temat nie może się zamknąć w tej rundzie

Trzy niezależne przyczyny, wszystkie wymagają decyzji spoza uprawnień Operatora:

1. **Czerwona bramka `gra/tools/display-names-test.cjs`** (asercja `:203-208` koduje
   odwracaną właśnie decyzję MAP-UX-CLUSTER-LABEL-Q1). Plik poza allowlistą.
2. **Etykieta nie mieści się na plakietce.** Budżet nazwy `200 − prodW − growthW − crownW`
   (`gra/src/render/cityMapStatChip.ts:769`) = 181 px dla stolicy, 161 px z glifem produkcji.
   Pomiar w żywym Chromium (`dowody/pomiar-szerokosci-plakietki.cjs`, model potwierdzony
   zgodnością z żywym zrzutem): przed zmianą przycinanych 0/15 przy 181 px, po zmianie 14/15;
   Zulusi tracą człon cywilizacji w całości (`UMGUNGUND…`). Poprawka w `cityMapStatChip.ts`
   — poza allowlistą — i wymaga wyboru wariantu (dwie linie / mniejszy font drugiego członu /
   szerszy budżet / skrót nazwy cywilizacji).
3. **Stolica AI bierze nazwę z `miasta_panstwa[0]`, nie z `miasta_cywilizacji[0]`**
   (`cluster-spawn.ts:354` → `civ-names.ts:81-90` → `city-names-pool.ts:125-127`).
   Różnica dotyczy 2/15 cywilizacji: Chińczycy `Qin` vs `Xi'an`, Słowianie `Kiev` vs `Kijów`.
   GOAL obiecuje „Xi'an · Chińczycy", gra pokazuje „QIN · CHIŃCZ…". Dane i `civ-names.ts`
   poza allowlistą.

BLOKADY: (1) rozszerzenie allowlisty o `gra/tools/display-names-test.cjs`;
(2) decyzja właściciela o sposobie zmieszczenia obu członów na plakietce;
(3) decyzja właściciela o źródle nazwy stolicy AI; (4) potwierdzenie opt-inu
`clusterCapitalWithCityName` jako właściwego zakresu (dyplomacja/HUD zostaje jednoczłonowa).

RUNDY: 1/5
NASTĘPNY KROK: Final Control — werdykt per zarzut (§3c pkt 3).
DEPLOY/PUSH: NIE WYKONANO
